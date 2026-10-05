#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const ROOT_HELP = `Usage: ww <command> [options]
       ww --help | --man

Small Wheelwright evidence tools for people, shells, and agents.
Use explicit symbols. Reading never silently acquires; acquisition never claims
freshness or suitability. Pipe commands without a format flag.

Working commands:
  fetch [-q | -v] [--force] SYMBOL...  Acquire direct quotes for named subjects.
  prices SYMBOL...          Inspect currently held underlying price evidence (read-only)
  sort --by FIELD           Reorder ww price records from stdin (price or symbol)

Example:
  ww fetch QQQ SPY XLE

TTY output is for humans; pipe/redirect output is bounded JSON Lines.
Results go to stdout; diagnostics go to stderr. Exit status controls &&.
Use 'ww <command> --help' or '--man' for command details; 'ww --man'
describes the current CLI. 'ww observed-prices' remains a prices alias.
Backend: WW_BASE_URL (default http://localhost:3100).
Fetch authentication: WW_API_TOKEN (Bearer credential).`;

const SOURCE_HELP = `Usage: ww observed-prices [--] SYMBOL...

Read currently held underlying price evidence for explicit symbols from
GET /api/evidence/quotes. This does not trigger acquisition. A missing price
is null, never zero. A later failed acquisition can coexist with an earlier
held price; status, last attempt, and failure count remain separate facts.

The backend's observation.observedAt is associated with the primary option
chain row, not independently established underlying-quote acquisition time.
The CLI calls it priceAssociatedChainAt. It cannot establish actual quote age
or a freshness/admissibility verdict. generatedAt is publication time, not
the price's acquisition time.

Terminal stdout shows labeled columns. Pipe/redirect stdout emits one JSON
record per line (JSON Lines), preserving price, previousClose, chain-associated
time, acquisition facts, and generation/publication context. This is a bounded
first-slice format, not a universal ww record protocol.

Example:
  ww observed-prices XLE SPY QQQ | ww sort --by price --descending

Backend: WW_BASE_URL (default http://localhost:3100).`;

const PRICES_HELP = SOURCE_HELP.replaceAll("observed-prices", "prices");

const FETCH_HELP = `Usage: ww fetch [-q | --quiet | -v | --verbose] [--force] [--] SYMBOL...

Acquire canonical direct quotes for explicit named subjects using Wheelwright
API v2. One invocation sends one batch request. Bare fetch is a usage error.
Symbols are uppercased and deduplicated in first-occurrence order.

Ordinary acquisition may reuse eligible held evidence. --force requests an
actual upstream acquisition attempt; the backend still owns authorization and
contact restrictions. NEWLY_ACQUIRED and REUSED are distinct outcomes.
A failed acquisition with a preserved earlier quote remains a failure.
Exit zero only when every subject is fulfilled, never merely because prior
quotes exist. Fetch does not certify freshness or trading suitability.

Terminal stdout is empty; terminal stderr shows per-subject outcomes and a
fulfillment count. Pipe/redirect stdout emits one fetch-result/v2 JSON Lines
record per subject, retaining the backend observation, provenance, failure,
and operation context. Request-wide errors emit diagnostics, no result records.
-q/--quiet suppresses normal status, never failures or structured results.
-v/--verbose includes the Wheelwright endpoint and operation correlation on
stderr even when redirected. Quiet and verbose cannot be combined.

Example:
  ww fetch SPY QQQ IWM
  ww fetch SPY --force

Backend: WW_BASE_URL (default http://localhost:3100).
Authentication: WW_API_TOKEN, a configured Bearer credential. Missing credentials
fail before contacting the backend. Use HTTPS outside loopback development.
Use 'ww fetch --man' for the full behavioral contract.`;

const SORT_HELP = `Usage: ww sort --by FIELD [--descending]

Read the bounded ww price JSON Lines record stream from stdin and
emit the same records in a different order. Supported fields: price, symbol.
Price compares numerically; missing prices remain visible and sort last in
both directions. Equal values retain input order. Sorting does not evaluate
freshness, opportunity quality, or attention priority.

Terminal stdout shows labeled columns; pipe/redirect stdout emits the same
JSON Lines records. This is not a universal structured-record sorter.

Example:
  ww prices XLE SPY QQQ | ww sort --by price --descending`;

const KIND = "observed-price/v1";
const STATUSES = new Set(["ready", "failed", "pending", "absent", "expirations_known", "not_in_universe"]);

class WwError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}

function usage(message) {
  throw new WwError(`${message}\nTry 'ww --help'.`, 2);
}

export function parseArgs(args) {
  if (args.length === 0 || (args.length === 1 && ["-h", "--help"].includes(args[0]))) {
    return { command: "help", help: ROOT_HELP };
  }
  if (args.length === 1 && args[0] === "--man") return { command: "root-man" };
  const [command, ...rest] = args;
  if (["prices", "observed-prices", "fetch"].includes(command)) {
    if (rest.length === 1 && ["-h", "--help"].includes(rest[0])) {
      return { command: "help", help: command === "fetch" ? FETCH_HELP :
        command === "prices" ? PRICES_HELP : SOURCE_HELP };
    }
    if (rest.length === 1 && rest[0] === "--man") {
      return { command: "command-man", page: command === "observed-prices" ? "prices" : command };
    }
    let operands = false;
    let quiet = false;
    let verbose = false;
    let force = false;
    const symbols = [];
    for (const arg of rest) {
      if (!operands && arg === "--") { operands = true; continue; }
      if (command === "fetch" && !operands && ["-q", "--quiet"].includes(arg)) {
        quiet = true; continue;
      }
      if (command === "fetch" && !operands && ["-v", "--verbose"].includes(arg)) {
        verbose = true; continue;
      }
      if (command === "fetch" && !operands && arg === "--force") {
        force = true; continue;
      }
      if (!operands && arg.startsWith("-")) usage(`${command}: unknown option '${arg}'`);
      if (!arg.trim()) usage(`${command}: symbol must not be empty`);
      symbols.push(arg);
    }
    if (symbols.length === 0) usage(`${command}: at least one ${command === "fetch" ? "explicit " : ""}symbol is required`);
    if (command === "fetch" && quiet && verbose) usage("fetch: --quiet and --verbose cannot be combined");
    const parsed = { command, symbols: [...new Set(symbols.map(s => s.toUpperCase()))] };
    if (command === "fetch") {
      parsed.quiet = quiet;
      parsed.verbose = verbose;
      parsed.mode = force ? "FORCE" : "ORDINARY";
    }
    return parsed;
  }
  if (command === "sort") {
    if (rest.length === 1 && ["-h", "--help"].includes(rest[0])) return { command: "help", help: SORT_HELP };
    if (rest.length === 1 && rest[0] === "--man") return { command: "command-man", page: "sort" };
    let by;
    let descending = false;
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--by" && by === undefined) {
        by = rest[++i];
        if (!by || by.startsWith("-")) usage("sort: --by requires a field");
      } else if (arg === "--descending" && !descending) {
        descending = true;
      } else if (arg === "--") {
        if (i !== rest.length - 1) usage("sort: no positional operands are accepted");
      } else {
        usage(`sort: unexpected argument '${arg}'`);
      }
    }
    if (!by) usage("sort: --by is required");
    if (!["price", "symbol"].includes(by)) usage(`sort: unsupported field '${by}' (supported: price, symbol)`);
    return { command, by, descending };
  }
  usage(`unknown command '${command}'`);
}

function isNullableString(value) {
  return value === null || typeof value === "string";
}

function isNullableNumber(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function validateRecord(record, context) {
  if (!record || typeof record !== "object" || Array.isArray(record) || record.kind !== KIND ||
      typeof record.symbol !== "string" || !record.symbol ||
      !isNullableNumber(record.price) || !isNullableNumber(record.previousClose) ||
      !isNullableString(record.priceAssociatedChainAt) ||
      !STATUSES.has(record.acquisitionStatus) ||
      !isNullableString(record.lastAttemptAt) ||
      !Number.isInteger(record.failureCount) || record.failureCount < 0 ||
      !Number.isInteger(record.generation) || record.generation < 0 ||
      !isNullableString(record.generatedAt) ||
      (record.price === null && record.priceAssociatedChainAt !== null) ||
      (record.price !== null && record.priceAssociatedChainAt === null)) {
    throw new WwError(`${context}: invalid ${KIND} record`);
  }
  return record;
}

export function parseQuoteResponse(data, requested) {
  if (!data || !Number.isInteger(data.generation) || data.generation < 0 ||
      !isNullableString(data.generatedAt) || !Array.isArray(data.quotes)) {
    throw new WwError("backend returned an invalid quote response");
  }
  const wanted = new Set(requested);
  const seen = new Set();
  const records = [];
  for (const q of data.quotes) {
    if (!q || typeof q.symbol !== "string" || !wanted.has(q.symbol) || seen.has(q.symbol) ||
        !q.acquisition || !STATUSES.has(q.acquisition.status) ||
        !isNullableString(q.acquisition.lastAttemptAt) ||
        !Number.isInteger(q.acquisition.failureCount) || q.acquisition.failureCount < 0) {
      throw new WwError("backend returned an invalid quote entry");
    }
    seen.add(q.symbol);
    const obs = q.observation;
    if (obs !== null && (!obs || !isNullableNumber(obs.price) ||
        !isNullableNumber(obs.previousClose) || !isNullableString(obs.observedAt))) {
      throw new WwError("backend returned an invalid quote observation");
    }
    const record = {
      kind: KIND,
      symbol: q.symbol,
      price: obs?.price ?? null,
      previousClose: obs?.previousClose ?? null,
      priceAssociatedChainAt: obs?.observedAt ?? null,
      acquisitionStatus: q.acquisition.status,
      lastAttemptAt: q.acquisition.lastAttemptAt,
      failureCount: q.acquisition.failureCount,
      generation: data.generation,
      generatedAt: data.generatedAt,
    };
    records.push(validateRecord(record, "backend"));
  }
  if (seen.size !== wanted.size) throw new WwError("backend response omitted a requested symbol");
  return records;
}

export function quoteUrl(symbols, base = process.env.WW_BASE_URL ?? "http://localhost:3100") {
  let url;
  try { url = new URL("/api/evidence/quotes", base); }
  catch { throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2); }
  if (!["http:", "https:"].includes(url.protocol)) throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2);
  for (const symbol of symbols) url.searchParams.append("symbol", symbol);
  return url;
}

const QUOTE_OUTCOMES = new Set([
  "NEWLY_ACQUIRED", "REUSED", "UNMATCHED", "UNSUPPORTED_SUBJECT",
  "UPSTREAM_UNAVAILABLE", "CONTACT_NOT_PERMITTED", "ADMISSION_REJECTED",
  "UPSTREAM_FAILED", "INVALID_UPSTREAM_EVIDENCE", "AUTHORITY_SUPERSEDED", "ACCEPTANCE_FAILED",
]);

// Validate the response boundary, not acquisition policy: the backend owns all
// reuse, provider, session, subject-verification, persistence and fencing rules.
export function parseAcquisitionResponse(data, requested, mode) {
  const invalid = () => { throw new WwError("backend returned an invalid v2 quote acquisition response"); };
  if (!data || typeof data.requestId !== "string" || !data.requestId ||
      data.mode !== mode || typeof data.startedAt !== "string" ||
      typeof data.completedAt !== "string" || !Array.isArray(data.results) ||
      data.results.length !== requested.length) invalid();
  data.results.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || item.subject?.symbol !== requested[index] || !QUOTE_OUTCOMES.has(item.outcome) ||
        typeof item.fulfilled !== "boolean" || typeof item.priorRetained !== "boolean" ||
        !("observation" in item)) invalid();
    const success = ["NEWLY_ACQUIRED", "REUSED"].includes(item.outcome);
    if (item.fulfilled !== success || (mode === "FORCE" && item.outcome === "REUSED") ||
        item.priorRetained !== (!success && item.observation !== null)) invalid();
    if (success ? (item.observation === null || "failure" in item) :
        (!item.failure || item.failure.code !== item.outcome || typeof item.failure.retryable !== "boolean")) invalid();
    if (item.failure && "detail" in item.failure && typeof item.failure.detail !== "string") invalid();
    if (item.observation !== null &&
        (typeof item.observation !== "object" ||
         item.observation.subject?.symbol !== item.subject.symbol ||
         typeof item.observation.observationId !== "string" ||
         !item.observation.facts || !item.observation.provenance)) invalid();
  });
  return data;
}

function redactCredential(value, token) {
  // Include server-provided strings and structured records: even a broken server
  // echoing a credential must not expose it through ww's streams.
  return JSON.parse(JSON.stringify(value).replaceAll(token, "[REDACTED]"));
}

export async function fetchEvidence(symbols, {
  mode = "ORDINARY", token = process.env.WW_API_TOKEN,
  base = process.env.WW_BASE_URL ?? "http://localhost:3100", fetchImpl = fetch,
} = {}) {
  if (symbols.length === 0) usage("fetch: at least one explicit symbol is required");
  if (typeof token !== "string" || !token.trim()) {
    throw new WwError("fetch: WW_API_TOKEN is required (configured Wheelwright Bearer credential)");
  }
  if (!/^[A-Za-z0-9._~+\/-]+=*$/.test(token)) {
    throw new WwError("fetch: WW_API_TOKEN must be a valid Bearer credential");
  }
  let url;
  try { url = new URL("/v2/quotes", base); }
  catch { throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new WwError("WW_BASE_URL must be an HTTP(S) URL without embedded credentials", 2);
  }
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new WwError("fetch: WW_BASE_URL must use HTTPS outside loopback development", 2);
  }
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subjects: symbols.map(symbol => ({ symbol })), mode }),
    });
  } catch {
    // Transport exception text may contain headers or credential-bearing URLs.
    throw new WwError("fetch: Wheelwright request failed; check connectivity and WW_BASE_URL");
  }
  let data;
  try { data = redactCredential(await response.json(), token); }
  catch { throw new WwError("fetch: backend returned invalid JSON"); }
  if (!response.ok) {
    const code = typeof data?.code === "string" ? data.code : "REQUEST_FAILED";
    const reason = typeof data?.detail === "string" ? data.detail :
      typeof data?.title === "string" ? data.title : "Wheelwright could not complete the request";
    const correlation = typeof data?.requestId === "string" ? ` (request ${data.requestId})` : "";
    const params = Array.isArray(data?.invalidParams) ? data.invalidParams
      .filter(p => typeof p?.name === "string" && typeof p?.reason === "string")
      .map(p => `\n  ${p.name}: ${p.reason}`).join("") : "";
    throw new WwError(`fetch: ${code}: ${reason}${correlation}${params}`);
  }
  return { ...parseAcquisitionResponse(data, symbols, mode), wheelwrightOrigin: url.origin.replaceAll(token, "[REDACTED]") };
}

export async function readObservedPrices(symbols, fetchImpl = fetch, base) {
  const url = quoteUrl(symbols, base);
  let response;
  try { response = await fetchImpl(url); }
  catch (error) { throw new WwError(`backend request failed: ${error.message}`); }
  if (!response.ok) throw new WwError(`backend returned HTTP ${response.status}`);
  let data;
  try { data = await response.json(); }
  catch { throw new WwError("backend returned invalid JSON"); }
  return parseQuoteResponse(data, symbols);
}

export function parseRecordLines(input) {
  const lines = input.split(/\r?\n/);
  const records = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === lines.length - 1 && lines[i] === "") continue;
    if (!lines[i].trim()) throw new WwError(`stdin line ${i + 1}: blank composition record`);
    let record;
    try { record = JSON.parse(lines[i]); }
    catch { throw new WwError(`stdin line ${i + 1}: invalid JSON`); }
    validateRecord(record, `stdin line ${i + 1}`);
    records.push({ record, line: lines[i], index: i });
  }
  return records;
}

export function sortRecords(entries, by, descending) {
  return [...entries].sort((a, b) => {
    const av = a.record[by];
    const bv = b.record[by];
    if (av === null || bv === null) {
      if (av === bv) return a.index - b.index;
      return av === null ? 1 : -1;
    }
    const comparison = av < bv ? -1 : av > bv ? 1 : 0;
    return (descending ? -comparison : comparison) || a.index - b.index;
  });
}

export function renderTable(records) {
  if (records.length > 0 && records.every(r => r.price === null && r.previousClose === null &&
      r.priceAssociatedChainAt === null && r.lastAttemptAt === null && r.failureCount === 0)) {
    const width = Math.max("SYMBOL".length, ...records.map(r => r.symbol.length));
    const rows = records.map(r => `${r.symbol.padEnd(width)}  ${r.acquisitionStatus}`).join("\n");
    const publications = new Set(records.map(r => `${r.generation}|${r.generatedAt}`));
    const publication = publications.size === 1
      ? `Generation ${records[0].generation}; published ${records[0].generatedAt ?? "unknown"}.`
      : records.map(r => `${r.symbol}: generation ${r.generation}, published ${r.generatedAt ?? "unknown"}`).join("\n");
    return `No held underlying prices\n${"SYMBOL".padEnd(width)}  ACQUISITION\n${rows}\n` +
      `No prior close, chain-associated time, or acquisition attempt is recorded; 0 failures.\n${publication}\n`;
  }
  const headings = ["SYMBOL", "PRICE", "PREV CLOSE", "CHAIN-ASSOCIATED AT", "ACQUISITION", "LAST ATTEMPT", "FAILS", "GEN", "PUBLISHED AT"];
  const rows = records.map(r => [r.symbol, r.price === null ? "—" : String(r.price),
    r.previousClose === null ? "—" : String(r.previousClose), r.priceAssociatedChainAt ?? "—",
    r.acquisitionStatus, r.lastAttemptAt ?? "—", String(r.failureCount), String(r.generation),
    r.generatedAt ?? "—"]);
  const widths = headings.map((h, i) => Math.max(h.length, ...rows.map(row => row[i].length)));
  const layout = row => row.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd();
  return `Held underlying prices (chain-associated time is not quote acquisition time)\n${layout(headings)}\n${rows.map(layout).join("\n")}${rows.length ? "\n" : ""}`;
}

async function stdinText() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function writeRecords(entries) {
  if (process.stdout.isTTY) {
    process.stdout.write(renderTable(entries.map(entry => entry.record)));
  } else {
    for (const entry of entries) process.stdout.write(`${entry.line}\n`);
  }
}

export function presentFetchResult(result, quiet, stdoutIsTTY, stderrIsTTY, verbose = false) {
  const { requestId, mode, startedAt, completedAt } = result;
  const stdout = stdoutIsTTY ? "" : result.results.map(item => JSON.stringify({
    ...item, kind: "fetch-result/v2", symbol: item.subject.symbol,
    requestId, mode, startedAt, completedAt,
  })).join("\n") + "\n";
  const failures = result.results.filter(item => !item.fulfilled);
  const describe = item => `${item.subject.symbol}: ${item.fulfilled ? "" : "FAILED "}${item.outcome}` +
    (item.priorRetained ? "; prior quote retained (request unfulfilled)" : "") +
    (item.failure?.detail ? `; ${item.failure.detail}` : "");
  const visible = verbose || (!quiet && stderrIsTTY) ? result.results : failures;
  const lines = visible.map(describe);
  if (verbose) lines.unshift(`From ${result.wheelwrightOrigin}`, `Request ${requestId}; mode ${mode}`);
  if (verbose || (!quiet && stderrIsTTY) || failures.length) {
    const acquired = result.results.filter(item => item.outcome === "NEWLY_ACQUIRED").length;
    const reused = result.results.filter(item => item.outcome === "REUSED").length;
    lines.push(`fetch ${failures.length ? "failed" : "complete"}: ` +
      `${result.results.length - failures.length}/${result.results.length} fulfilled; ` +
      `${acquired} newly acquired, ${reused} reused, ${failures.length} failed`);
  }
  return { stdout, stderr: lines.length ? lines.join("\n") + "\n" : "" };
}

export async function main(args) {
  const parsed = parseArgs(args);
  if (parsed.command === "help") { process.stdout.write(`${parsed.help}\n`); return; }
  if (parsed.command === "root-man") {
    const manual = await readFile(new URL("../docs/cli/ww-man.txt", import.meta.url), "utf8");
    process.stdout.write(manual);
    return;
  }
  if (parsed.command === "command-man") {
    const manual = await readFile(new URL(`../docs/cli/ww-${parsed.page}-man.txt`, import.meta.url), "utf8");
    process.stdout.write(manual);
    return;
  }
  if (parsed.command === "fetch") {
    const result = await fetchEvidence(parsed.symbols, { mode: parsed.mode });
    const presentation = presentFetchResult(result, parsed.quiet, !!process.stdout.isTTY,
      !!process.stderr.isTTY, parsed.verbose);
    if (presentation.stdout) process.stdout.write(presentation.stdout);
    if (presentation.stderr) process.stderr.write(presentation.stderr);
    if (result.results.some(item => !item.fulfilled)) process.exitCode = 1;
    return;
  }
  if (parsed.command === "prices" || parsed.command === "observed-prices") {
    const records = await readObservedPrices(parsed.symbols);
    writeRecords(records.map((record, index) => ({ record, line: JSON.stringify(record), index })));
    return;
  }
  const entries = parseRecordLines(await stdinText());
  writeRecords(sortRecords(entries, parsed.by, parsed.descending));
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.stdout.on("error", error => {
    if (error.code === "EPIPE") process.exit(process.exitCode ?? 0);
    process.stderr.write(`ww: ${error.message}\n`);
    process.exit(1);
  });
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(`ww: ${error.message}\n`);
    process.exitCode = error.code ?? 1;
  });
}
