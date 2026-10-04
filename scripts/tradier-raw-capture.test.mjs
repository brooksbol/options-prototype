import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOTS, BASE_URL, parseCapture, selectExpiration, safeResponseMetadata,
  assertOutsideRepo, capture } from "./tradier-raw-capture.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const now = () => new Date("2026-10-01T17:30:00.000Z");
const response = (status, text, headers = {}) => ({ ok: status >= 200 && status < 300, status,
  headers: { get: (name) => headers[name] ?? null },
  arrayBuffer: async () => Buffer.from(text, "utf8") });

test("fixed invocation, expiration window and nearer-expiration tie", () => {
  assert.equal(ROOTS.length, 30);
  assert.equal(ROOTS[0], "XSP"); assert.equal(ROOTS.at(-1), "DRAM");
  assert.deepEqual(parseCapture([]), { help: false });
  assert.throws(() => parseCapture(["SPY"]), /invalid_arguments/);
  const selected = selectExpiration({ expirations: { date: ["2026-11-20", "2026-11-17",
    "2026-11-13", "2026-11-10", "2026-12-01"] } }, "2026-10-01");
  assert.deepEqual(selected.eligible_expirations.map((item) => item.calendar_dte), [40, 43, 47, 50]);
  assert.deepEqual(selected.selected_expiration, { expiration: "2026-11-13", calendar_dte: 43 });
  assert.equal(selectExpiration({ expirations: { date: ["2026-12-01"] } },
    "2026-10-01").selected_expiration, null);
  assert.throws(() => selectExpiration({ expirations: { date: null } }, "2026-10-01"),
    /expirations_malformed_or_incomplete/);
});

test("safe response metadata is allowlisted and artifact base must be outside repository", () => {
  const headers = { get: (name) => ({ "content-type": "application/json", "x-ratelimit-available": "97",
    "set-cookie": "private-cookie", authorization: "secret", "x-unexpected": "secret" })[name] ?? null };
  assert.deepEqual(safeResponseMetadata(headers), { "content-type": "application/json",
    "x-ratelimit-available": "97" });
  assert.throws(() => assertOutsideRepo(ROOT, ROOT), /artifact_destination_inside_repository/);
  const temp = mkdtempSync(join(tmpdir(), "tradier-path-test-"));
  try { assert.equal(assertOutsideRepo(temp, ROOT), realpathSync(temp)); }
  finally { rmSync(temp, { recursive: true, force: true }); }
});

test("raw response bytes preserve absent, null and zero, with per-request timing and no secrets", async () => {
  const base = mkdtempSync(join(tmpdir(), "tradier-capture-test-"));
  const raw = '{"options":{"option":[{"symbol":"SPY-CONTRACT","expiration_date":"2026-11-13","bid":0,"ask":null,"greeks":{"delta":0,"updated_at":null}}]}}\n';
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.includes("/expirations?")) return response(200,
      '{"expirations":{"date":["2026-11-13","2026-11-20"]}}',
      { "x-ratelimit-available": "97", "set-cookie": "secret-cookie" });
    return response(200, raw, { "content-type": "application/json" });
  };
  try {
    const result = await capture({ env: { TRADIER_API_KEY: "private-key" }, fetchImpl, now,
      sleep: async () => {}, artifactBase: base, repoRoot: ROOT, out: () => {}, err: () => {} });
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.manifest.declared_roots, ROOTS);
    assert.deepEqual(result.manifest.roots.map((item) => item.root), ROOTS);
    assert.equal(result.manifest.roots.every((item) => item.disposition === "CAPTURED"), true);
    assert.equal(calls.length, 60);
    assert.ok(calls.every((call) => call.url.startsWith(BASE_URL) && call.init.method === "GET" &&
      call.init.redirect === "error"));
    const request = result.manifest.roots[1].requests[1];
    assert.equal(request.http_status, 200);
    assert.equal(request.request_started_at_utc, now().toISOString());
    assert.equal(request.response_received_at_utc, now().toISOString());
    assert.equal(readFileSync(join(result.manifestPath, "..", request.raw_artifact), "utf8"), raw);
    const item = JSON.parse(raw).options.option[0];
    assert.equal(item.bid, 0); assert.equal(item.ask, null);
    assert.equal(Object.hasOwn(item, "bidsize"), false);
    assert.equal(item.greeks.delta, 0);
    const manifestText = readFileSync(result.manifestPath, "utf8");
    assert.doesNotMatch(manifestText, /private-key|Bearer|secret-cookie|set-cookie/);
    assert.ok((statSync(result.manifestPath).mode & 0o077) === 0);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("HTTP and schema failures retain every root; 401 stops further requests without substitution", async () => {
  const base = mkdtempSync(join(tmpdir(), "tradier-failure-test-"));
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("symbol=XSP")) return response(500, '{"error":"server"}');
    if (url.includes("symbol=SPY")) return response(200, '{"expirations":{"date":[]}}');
    if (url.includes("symbol=QQQ")) return response(401, '{"error":"denied"}');
    throw Error("must halt after authentication failure");
  };
  try {
    const result = await capture({ env: { TRADIER_API_KEY: "private-key" }, fetchImpl, now,
      sleep: async () => {}, artifactBase: base, repoRoot: ROOT, out: () => {}, err: () => {} });
    assert.equal(result.exitCode, 1);
    assert.equal(result.manifest.roots.length, 30);
    assert.deepEqual(result.manifest.roots.slice(0, 4).map((item) => item.disposition),
      ["EVIDENCE_FAILURE", "NO_SPECIMEN", "EVIDENCE_FAILURE", "EVIDENCE_FAILURE"]);
    assert.equal(result.manifest.roots[0].requests[0].http_status, 500);
    assert.equal(result.manifest.roots[0].requests[0].raw_artifact, "XSP/expirations.body");
    assert.equal(result.manifest.roots[3].failure_reason, "not_attempted_after_http_401");
    assert.equal(calls.length, 3);
  } finally { rmSync(base, { recursive: true, force: true }); }
});
