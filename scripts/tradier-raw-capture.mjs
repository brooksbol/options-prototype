#!/usr/bin/env node
// One-shot, fixed-population Tradier research capture. No Wheelwright state or broker writes.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOTS = Object.freeze(["XSP", "SPY", "QQQ", "IWM", "DIA", "TLT", "GLD", "SLV", "USO",
  "XLE", "XLF", "XLK", "XLI", "XLP", "XLU", "XLV", "XLY", "XLB", "XLC", "SMH", "EWZ",
  "EEM", "FXI", "ARKK", "GDX", "GDXJ", "UNG", "BNO", "URA", "DRAM"]);
export const BASE_URL = "https://api.tradier.com/v1";
const EXPERIMENT_ID = "tradier-raw-cross-root-2026-10-01-v1";
const REQUEST_GAP_MS = 1500;
const MAX_BODY_BYTES = 25_000_000;
const HELP = "Usage: node scripts/tradier-raw-capture.mjs\n" +
  "Captures one fixed 30-root, read-only Tradier Production observation under a private temporary directory.\n" +
  "Credential: exported TRADIER_API_KEY or this repository's private .env. No selector or ranking.";
const SAFE_RESPONSE_HEADERS = Object.freeze(["content-type", "date", "x-request-id",
  "x-ratelimit-allowed", "x-ratelimit-used", "x-ratelimit-available", "x-ratelimit-expiry"]);

export class CaptureError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function parseCapture(argv) {
  if (argv.length === 1 && ["-h", "--help"].includes(argv[0])) return { help: true };
  if (argv.length) throw new CaptureError("invalid_arguments");
  return { help: false };
}

export function credential(env = process.env, readFile = readFileSync) {
  if (typeof env.TRADIER_API_KEY === "string" && env.TRADIER_API_KEY.trim()) return env.TRADIER_API_KEY.trim();
  let parsed;
  try { parsed = parseEnv(readFile(new URL("../.env", import.meta.url), "utf8")); }
  catch { throw new CaptureError("production_credential_unavailable"); }
  if (typeof parsed.TRADIER_API_KEY !== "string" || !parsed.TRADIER_API_KEY.trim()) {
    throw new CaptureError("production_credential_unavailable");
  }
  return parsed.TRADIER_API_KEY.trim();
}

export function assertOutsideRepo(destination, repoRoot) {
  const target = realpathSync(destination);
  const repo = realpathSync(repoRoot);
  if (target === repo || target.startsWith(repo + sep)) throw new CaptureError("artifact_destination_inside_repository");
  return target;
}

const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
  new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;

export function selectExpiration(body, asOfUtcDate) {
  if (!validDate(asOfUtcDate)) throw new CaptureError("invalid_as_of_date");
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !body.expirations || typeof body.expirations !== "object" ||
      !Array.isArray(body.expirations.date) ||
      body.expirations.date.some((date) => !validDate(date)) ||
      new Set(body.expirations.date).size !== body.expirations.date.length) {
    throw new CaptureError("expirations_malformed_or_incomplete");
  }
  const eligible = body.expirations.date.map((expiration) => ({ expiration,
    calendar_dte: (Date.parse(expiration + "T00:00:00Z") -
      Date.parse(asOfUtcDate + "T00:00:00Z")) / 86_400_000 }))
    .filter((item) => item.calendar_dte >= 40 && item.calendar_dte <= 50)
    .sort((a, b) => a.calendar_dte - b.calendar_dte);
  const selected = [...eligible].sort((a, b) => Math.abs(a.calendar_dte - 45) -
    Math.abs(b.calendar_dte - 45) || a.calendar_dte - b.calendar_dte)[0] ?? null;
  return { eligible_expirations: eligible, selected_expiration: selected,
    selection_reason: selected ? "minimum abs(calendar_dte - 45); earlier expiration wins exact tie" : null };
}

export function safeResponseMetadata(headers) {
  const retained = {};
  for (const name of SAFE_RESPONSE_HEADERS) {
    const value = headers?.get?.(name);
    if (typeof value === "string" && value.length <= 200) retained[name] = value;
  }
  return retained;
}

function persistManifest(path, manifest) {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
}

async function requestRaw({ root, purpose, path, runDir, key, fetchImpl, now }) {
  const started = now().toISOString();
  const entry = { root, purpose, endpoint: path, request_started_at_utc: started,
    response_received_at_utc: null, request_failed_at_utc: null,
    http_status: null, safe_response_headers: {},
    raw_artifact: null, body_bytes: null, sha256: null, error: null };
  let response;
  try {
    response = await fetchImpl(BASE_URL + path, { method: "GET", redirect: "error",
      signal: AbortSignal.timeout(15_000), headers: { Authorization: "Bearer " + key,
        Accept: "application/json" } });
  } catch { entry.request_failed_at_utc = now().toISOString();
    entry.error = "network_or_redirect"; return entry; }
  entry.http_status = response.status;
  entry.safe_response_headers = safeResponseMetadata(response.headers);
  for (const [name, value] of Object.entries(entry.safe_response_headers)) {
    if (value.includes(key)) delete entry.safe_response_headers[name];
  }
  let bytes;
  try { bytes = Buffer.from(await response.arrayBuffer()); }
  catch { entry.request_failed_at_utc = now().toISOString();
    entry.error = "body_read_failed"; return entry; }
  entry.response_received_at_utc = now().toISOString();
  if (bytes.length > MAX_BODY_BYTES) { entry.error = "body_exceeds_capture_limit"; return entry; }
  if (bytes.includes(Buffer.from(key))) { entry.error = "provider_body_echoed_credential"; return entry; }
  const relative = join(root, purpose + ".body");
  mkdirSync(join(runDir, root), { recursive: true, mode: 0o700 });
  writeFileSync(join(runDir, relative), bytes, { mode: 0o600 });
  entry.raw_artifact = relative;
  entry.body_bytes = bytes.length;
  entry.sha256 = createHash("sha256").update(bytes).digest("hex");
  if (!response.ok) entry.error = "http_" + response.status;
  return entry;
}

function parseCapturedJson(runDir, request, purpose) {
  if (request.error || !request.raw_artifact) throw new CaptureError(request.error ?? purpose + "_missing_body");
  try { return JSON.parse(readFileSync(join(runDir, request.raw_artifact), "utf8")); }
  catch { throw new CaptureError(purpose + "_malformed_json"); }
}

function validateChain(body, selectedExpiration) {
  const contracts = body?.options?.option;
  if (!Array.isArray(contracts)) throw new CaptureError("chain_malformed_or_incomplete");
  if (!contracts.length) return { contract_count: 0, disposition: "NO_SPECIMEN", reason: "empty_selected_chain" };
  if (contracts.some((item) => !item || typeof item !== "object" ||
      item.expiration_date !== selectedExpiration || typeof item.symbol !== "string" || !item.symbol.trim())) {
    throw new CaptureError("chain_contract_identity_incomplete_or_mismatched");
  }
  return { contract_count: contracts.length, disposition: "CAPTURED", reason: null };
}

export async function capture({ argv = process.argv.slice(2), env = process.env, readFile = readFileSync,
  fetchImpl = fetch, now = () => new Date(), sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
  artifactBase = tmpdir(), repoRoot = fileURLToPath(new URL("..", import.meta.url)),
  out = console.log, err = console.error } = {}) {
  let parsed;
  try { parsed = parseCapture(argv); }
  catch { err(HELP); return { exitCode: 2, manifestPath: null }; }
  if (parsed.help) { out(HELP); return { exitCode: 0, manifestPath: null }; }
  let key;
  try { key = credential(env, readFile); }
  catch { err("Tradier Production credential unavailable; no capture started."); return { exitCode: 1, manifestPath: null }; }
  let base;
  try { base = assertOutsideRepo(artifactBase, repoRoot); }
  catch { err("Private artifact destination is inside the repository or unavailable.");
    return { exitCode: 1, manifestPath: null }; }
  const runDir = mkdtempSync(join(base, "wheelwright-tradier-raw-"));
  const manifestPath = join(runDir, "manifest.json");
  const start = now().toISOString();
  const asOfUtcDate = start.slice(0, 10);
  const manifest = { experiment_id: EXPERIMENT_ID, production_host: BASE_URL,
    run_started_at_utc: start, run_completed_at_utc: null,
    declared_roots: ROOTS, expiration_rule: { dte: "UTC calendar days", window_inclusive: [40, 50],
      target_dte: 45, exact_tie: "earlier expiration", fallback: "none" },
    roots: ROOTS.map((root) => ({ root, disposition: "NOT_ATTEMPTED", failure_reason: null,
      eligible_expirations: [], selected_expiration: null, selection_reason: null,
      contract_count: null, requests: [] })) };
  persistManifest(manifestPath, manifest);
  let lastRequestStart = null;
  let haltReason = null;
  const pacedRequest = async (args) => {
    const current = now().getTime();
    if (lastRequestStart != null && current - lastRequestStart < REQUEST_GAP_MS) {
      await sleep(REQUEST_GAP_MS - (current - lastRequestStart));
    }
    lastRequestStart = now().getTime();
    return requestRaw({ ...args, runDir, key, fetchImpl, now });
  };
  for (const rootResult of manifest.roots) {
    if (haltReason) { rootResult.disposition = "EVIDENCE_FAILURE";
      rootResult.failure_reason = "not_attempted_after_" + haltReason; continue; }
    const root = rootResult.root;
    const expirations = await pacedRequest({ root, purpose: "expirations",
      path: "/markets/options/expirations?symbol=" + root + "&includeAllRoots=true" });
    rootResult.requests.push(expirations);
    if (expirations.error) {
      rootResult.disposition = "EVIDENCE_FAILURE"; rootResult.failure_reason = "expirations_" + expirations.error;
      if ([401, 403, 429].includes(expirations.http_status)) haltReason = "http_" + expirations.http_status;
      persistManifest(manifestPath, manifest); continue;
    }
    let selection;
    try { selection = selectExpiration(parseCapturedJson(runDir, expirations, "expirations"), asOfUtcDate); }
    catch (error) { rootResult.disposition = "EVIDENCE_FAILURE";
      rootResult.failure_reason = error instanceof CaptureError ? error.code : "expirations_unexpected";
      persistManifest(manifestPath, manifest); continue; }
    Object.assign(rootResult, selection);
    if (!selection.selected_expiration) {
      rootResult.disposition = "NO_SPECIMEN"; rootResult.failure_reason = "no_expiration_in_40_to_50_dte_window";
      persistManifest(manifestPath, manifest); continue;
    }
    const date = selection.selected_expiration.expiration;
    const chain = await pacedRequest({ root, purpose: "chain",
      path: "/markets/options/chains?symbol=" + root + "&expiration=" + date + "&greeks=true" });
    rootResult.requests.push(chain);
    if (chain.error) {
      rootResult.disposition = "EVIDENCE_FAILURE"; rootResult.failure_reason = "chain_" + chain.error;
      if ([401, 403, 429].includes(chain.http_status)) haltReason = "http_" + chain.http_status;
      persistManifest(manifestPath, manifest); continue;
    }
    try { const result = validateChain(parseCapturedJson(runDir, chain, "chain"), date);
      rootResult.contract_count = result.contract_count;
      rootResult.disposition = result.disposition; rootResult.failure_reason = result.reason;
    } catch (error) { rootResult.disposition = "EVIDENCE_FAILURE";
      rootResult.failure_reason = error instanceof CaptureError ? error.code : "chain_unexpected"; }
    persistManifest(manifestPath, manifest);
  }
  manifest.run_completed_at_utc = now().toISOString();
  persistManifest(manifestPath, manifest);
  const counts = Object.fromEntries(["CAPTURED", "NO_SPECIMEN", "EVIDENCE_FAILURE"].map((kind) =>
    [kind, manifest.roots.filter((root) => root.disposition === kind).length]));
  err(`Tradier raw capture: ${ROOTS.length} roots; ${counts.CAPTURED} captured, ` +
    `${counts.NO_SPECIMEN} no specimen, ${counts.EVIDENCE_FAILURE} evidence failure.\nManifest: ${manifestPath}`);
  return { exitCode: counts.EVIDENCE_FAILURE ? 1 : 0, manifestPath, manifest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = (await capture()).exitCode;
}
