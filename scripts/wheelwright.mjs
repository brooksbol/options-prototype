#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const ROOT_HELP = `Usage: ww <command> [options]
       ww --help | --man

Small Wheelwright evidence tools for people, shells, and agents.
Use explicit symbols. Reading never silently acquires; acquisition never claims
freshness or suitability. Pipe commands without a format flag.

Working commands:
  fetch [-q | -v] SYMBOL...  Acquire evidence; succeed when all requested prices are held
  prices SYMBOL...          Inspect currently held underlying price evidence (read-only)
  sort --by FIELD           Reorder ww price records from stdin (price or symbol)

Example:
  ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE | ww sort --by price

TTY output is for humans; pipe/redirect output is bounded JSON Lines.
Results go to stdout; diagnostics go to stderr. Exit status controls &&.
Use 'ww <command> --help' or '--man' for command details; 'ww --man'
describes the current CLI. 'ww observed-prices' remains a prices alias.
Backend: WW_BASE_URL (default http://localhost:3100).`;

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

const FETCH_HELP = `Usage: ww fetch [-q | --quiet | -v | --verbose] [--] SYMBOL...

Ask the existing Wheelwright backend to run targeted evidence acquisition for
explicit symbols. This changes Wheelwright's evidence store. It is separate
from prices, which only reads held evidence.

The backend reports whether the targeted operation completed and, for each
symbol, its acquisition outcome and whether a price is held afterward. A
preserved earlier price can be held after a failed acquisition. A completed
attempt with no held price is not success. Exit status is zero only when the
operation completed and every requested symbol has a held price.

Held does not mean newly acquired, fresh, independently timestamped as an
underlying quote, or suitable for a trading decision. The exact held price
and its evidence state are read with ww prices.

On success, a terminal stderr receives a concise held-price completion count.
-q/--quiet suppresses that status and nonfatal notices, not errors. When
stdout is piped or redirected, it emits one bounded JSON Lines result per
requested symbol after completion. An incomplete operation emits no records.
Use -v/--verbose for each symbol's invocation acquisition outcome and held-price
state on stderr. Its From line identifies the Wheelwright service endpoint
consulted, not an upstream market-data provider. It does not report prices.
Quiet and verbose cannot be combined.

Example:
  ww fetch QQQ && ww prices QQQ

Use 'ww fetch --man' for the full behavioral contract.
Backend: WW_BASE_URL (default http://localhost:3100).`;

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
    const symbols = [];
    for (const arg of rest) {
      if (!operands && arg === "--") { operands = true; continue; }
      if (command === "fetch" && !operands && ["-q", "--quiet"].includes(arg)) {
        quiet = true; continue;
      }
      if (command === "fetch" && !operands && ["-v", "--verbose"].includes(arg)) {
        verbose = true; continue;
      }
      if (!operands && arg.startsWith("-")) usage(`${command}: unknown option '${arg}'`);
      if (!arg.trim()) usage(`${command}: symbol must not be empty`);
      symbols.push(arg);
    }
    if (symbols.length === 0) usage(`${command}: at least one symbol is required`);
    if (command === "fetch" && quiet && verbose) usage("fetch: --quiet and --verbose cannot be combined");
    const parsed = { command, symbols: [...new Set(symbols.map(s => s.toUpperCase()))] };
    if (command === "fetch") { parsed.quiet = quiet; parsed.verbose = verbose; }
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

export function refreshUrl(symbols, base = process.env.WW_BASE_URL ?? "http://localhost:3100") {
  let url;
  try { url = new URL("/api/evidence/refresh", base); }
  catch { throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2); }
  if (!["http:", "https:"].includes(url.protocol)) throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2);
  for (const symbol of symbols) url.searchParams.append("symbol", symbol);
  return url;
}

export function parseRefreshResponse(data, requested) {
  if (!data || typeof data !== "object" || typeof data.outcome !== "string" ||
      typeof data.completed !== "boolean" || !Array.isArray(data.perSymbol)) {
    throw new WwError("backend returned an invalid refresh response");
  }
  if (!data.completed) {
    if (data.perSymbol.length !== 0) throw new WwError("backend returned per-symbol results for incomplete refresh");
    return { completed: false, outcome: data.outcome, results: [] };
  }
  if (data.outcome !== "ACQUIRED") throw new WwError("backend returned contradictory refresh completion");
  const wanted = new Set(requested);
  const seen = new Set();
  const results = [];
  for (const item of data.perSymbol) {
    if (!item || typeof item.symbol !== "string" || !wanted.has(item.symbol) || seen.has(item.symbol) ||
        typeof item.acquisitionOutcome !== "string" || !item.acquisitionOutcome ||
        typeof item.heldPrice !== "boolean") {
      throw new WwError("backend returned an invalid per-symbol refresh result");
    }
    seen.add(item.symbol);
    results.push({ symbol: item.symbol, acquisitionOutcome: item.acquisitionOutcome,
      heldPrice: item.heldPrice });
  }
  if (seen.size !== wanted.size) throw new WwError("backend refresh response omitted a requested symbol");
  return { completed: true, outcome: data.outcome, results };
}

export async function fetchEvidence(symbols, fetchImpl = fetch, base) {
  const url = refreshUrl(symbols, base);
  let response;
  try { response = await fetchImpl(url, { method: "POST" }); }
  catch (error) { throw new WwError(`backend request failed: ${error.message}`); }
  if (!response.ok) throw new WwError(`backend returned HTTP ${response.status}`);
  let data;
  try { data = await response.json(); }
  catch { throw new WwError("backend returned invalid JSON"); }
  return { ...parseRefreshResponse(data, symbols), wheelwrightOrigin: url.origin };
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
  if (!result.completed) return { stdout: "", stderr: "" };
  const stdout = stdoutIsTTY ? "" : result.results.map(item =>
    JSON.stringify({ kind: "fetch-result/v1", ...item })).join("\n") + "\n";
  const held = result.results.filter(item => item.heldPrice);
  if (verbose) {
    if (!result.wheelwrightOrigin) throw new WwError("fetch response lacks Wheelwright endpoint context");
    const symbolWidth = Math.max(...result.results.map(item => item.symbol.length));
    const outcomeWidth = Math.max(...result.results.map(item => item.acquisitionOutcome.length));
    const details = result.results.map(item => {
      const qualification = !item.heldPrice ? "no local price stored" :
        item.acquisitionOutcome === "ACQUIRED" ? "" :
        item.acquisitionOutcome === "UNKNOWN" ? "local price stored" : "previous price retained";
      return (`${item.symbol.padEnd(symbolWidth)}  acquisition ${item.acquisitionOutcome.padEnd(outcomeWidth)}` +
        (qualification ? `  ${qualification}` : "")).trimEnd();
    }).join("\n");
    const summary = held.length === result.results.length
      ? `\nfetch complete: ${held.length}/${result.results.length} prices held\n` : "\n";
    return { stdout, stderr: `From ${result.wheelwrightOrigin}\n${details}${summary}` };
  }
  if (quiet || !stderrIsTTY || held.length !== result.results.length) {
    return { stdout, stderr: "" };
  }
  const notices = result.results.filter(item => item.acquisitionOutcome !== "ACQUIRED").map(item =>
    `ww: ${item.symbol}: acquisition ${item.acquisitionOutcome}; ${item.acquisitionOutcome === "UNKNOWN" ? "local price stored" : "previous price retained"}`);
  return { stdout, stderr: `fetch complete: ${held.length}/${result.results.length} prices held\n` +
    (notices.length ? `${notices.join("\n")}\n` : "") };
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
    const result = await fetchEvidence(parsed.symbols);
    const presentation = presentFetchResult(result, parsed.quiet, !!process.stdout.isTTY,
      !!process.stderr.isTTY, parsed.verbose);
    if (presentation.stdout) process.stdout.write(presentation.stdout);
    if (presentation.stderr) process.stderr.write(presentation.stderr);
    if (!result.completed) throw new WwError(`fetch did not complete (${result.outcome})`);
    const missing = result.results.filter(item => !item.heldPrice).map(item => item.symbol);
    if (missing.length) throw new WwError(`fetch completed; ${result.results.length - missing.length}/${result.results.length} prices held; ${missing.join(", ")} ${missing.length === 1 ? "has" : "have"} no local price stored`);
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
    if (error.code === "EPIPE") process.exit(0);
    process.stderr.write(`ww: ${error.message}\n`);
    process.exit(1);
  });
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(`ww: ${error.message}\n`);
    process.exitCode = error.code ?? 1;
  });
}
