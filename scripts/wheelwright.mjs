#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { parseShow, showConfig, readHeldQuote, presentShow, presentShowRows, selectShowObservations, presentFields } from "./ww-show.mjs";

const ROOT_HELP = `Usage: ww <command> [options]
       ww --help | -h | --man

Small Wheelwright evidence tools for people, shells, and agents.
Use explicit symbols. Reading never silently acquires; acquisition never claims
freshness or suitability. Pipe commands without a format flag.

Working commands:
  fetch [-q | --quiet | -v | --verbose] [--force] [--] SYMBOL...
      Acquire direct quotes for named subjects.
  ls quotes [--type TYPE]... [-v | --verbose] [--tsv] [--jsonl]
      Discover canonical direct-quote holdings (provider-free).
  show SUBJECT... | --quotes [projection/filter/order/format options]
      Inspect held quotes; --where type=ETF filters; --fields discovers fields.
  prices [--] SYMBOL...
      Inspect currently held underlying price evidence (read-only).
  sort --by FIELD [--descending] [--]
      Reorder ww price records from stdin (price or symbol).

Example:
  ww fetch QQQ SPY XLE

TTY output is for humans; ls quotes pipes headerless TSV (--jsonl for summaries).
Other commands retain their documented bounded JSON Lines output.
Results go to stdout; diagnostics go to stderr. Exit status controls &&.
Use 'ww <command> --help' or '--man' for command details; 'ww --man'
describes the current CLI. 'ww observed-prices' remains a prices alias.
Backend: WW_BASE_URL (default http://localhost:3100).
Fetch, ls quotes and show authentication: WW_API_TOKEN (exported or private .env).
Fetch requires quote.acquire (+ quote.force for --force); ls quotes and show require quote.read.`;

const SOURCE_HELP = `Usage: ww observed-prices [--] SYMBOL...
       ww observed-prices --help | -h | --man

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
       ww fetch --help | -h | --man

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
Authentication: WW_API_TOKEN, exported or in the repository private .env file.
Explicit exports override the file. Missing credentials fail before backend contact. Use HTTPS outside loopback development.
Use 'ww fetch --man' for the full behavioral contract.`;

const LS_HELP = `Usage: ww ls quotes [--type TYPE]... [-v | --verbose] [--tsv] [--jsonl]
       ww ls --help | -h | --man
       ww ls quotes --help | -h | --man

Discover current canonical direct-quote holdings through GET /v2/quotes.
Held-evidence reads never acquire or revalidate evidence; this command causes
no upstream provider contact. Includes unenrolled, old, retained and sandbox
holdings, without freshness, reuse, Decision or trading-suitability judgments.
--type selects EQUITY, ETF, INDEX or OTHER (exact uppercase values).
Repeat --type for OR selection; duplicates are harmless. Selection is client-side
after complete response validation; malformed excluded rows still fail.
No selector lists all holdings. OTHER is the public CLI spelling.
No symbol operands, other resource families, generic filters, pagination or quiet
flag. Bare ls is a usage error. One authenticated bodyless GET, no query parameters.

Terminal stdout: SYMBOL, TYPE, RECEIVED AT (UTC), PROVIDER, ENVIRONMENT.
Redirected stdout: headerless TSV with those five fields. --tsv is an accepted
no-op: it does not force TSV on a terminal or override --jsonl. --jsonl explicitly
emits discovery-summary records including observation ID and commit time.
-v/--verbose adds ID/commit columns on the terminal and endpoint/request/count
on stderr; machine records are unchanged. Empty reads succeed with no machine
records. Zero matches succeed; terminal: No canonical direct quotes match the selected types.
Verbose counts selected holdings. Invalid/missing types fail before HTTP, exit 2.
Errors go to stderr; exit 0 success, 1 failure, 2 usage/configuration.

WW_BASE_URL defaults to http://localhost:3100; HTTPS outside loopback.
WW_API_TOKEN uses the accepted exported/private .env Bearer convention.
The backend requires quote.read independently of quote.acquire/quote.force.
Use 'ww ls --man' for escaping, security and evidence limits.`;

const SHOW_HELP = `Usage: ww show SUBJECT... [--quote] [OPTIONS]
       ww show --quotes [OPTIONS]
       ww show --fields
       ww show --help | -h | --man

Read canonical held direct quotes only; never acquire or refresh.
--quotes inspects the complete held inventory; conflicts with explicit subjects.
Bare show is a usage error. Options may appear before/after subjects.
--only FIELD[,FIELD...] selects exact ordered columns, no implicit symbol.
--all-fields selects every public field as a wide horizontal table.
--where FIELD=VALUE is repeatable exact matching (AND), using public fields.
--sort-by FIELD orders ascending; --descending reverses present-value order.
--absolute requires a numeric sort field; magnitude ranks --limit membership.
Selected rows are ordered by canonical signed values in every output format.
Without --limit, --absolute has no effect. --descending governs both stages.
--limit N is a positive integer; inspect/filter/rank/limit/order before output.
Ties retain selected subject order; missing sort values stay last.
--table | --tsv | --jsonl are mutually exclusive explicit formats.
Automatic output: human on TTY, canonical headerless TSV in a pipe.
--table preserves a human table and change colors in a pipe (e.g. | less -SR).
Use watch -c with --table for colored monitoring; NO_COLOR or TERM=dumb disables color.
-v/--verbose retains complete FIELD/VALUE terminal detail and machine output.
--only conflicts with --all-fields, --verbose and --jsonl.
--all-fields conflicts with --verbose; --table conflicts with --verbose.
--fields discovers installed vocabulary locally, without subjects/credentials/HTTP.
--man documents exact typed filters, precision, field semantics and units.
Subject failures go to stderr, exit 1; partial query results are identified.
No regular-session “today”, freshness or market-wide completeness is inferred.

Example: ww show --quotes --where type=ETF --sort-by reportedChangePercent
             --absolute --descending --limit 10 --all-fields
Requires quote.read; existing WW_BASE_URL / WW_API_TOKEN conventions apply.`;

const SORT_HELP = `Usage: ww sort --by FIELD [--descending] [--]
       ww sort --help | -h | --man

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
const CLI_QUOTE_TYPES = new Set(["EQUITY", "ETF", "INDEX", "OTHER"]);

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
  if (command === "show") {
    const parsed = parseShow(rest);
    if (parsed.help) return { command: "help", help: SHOW_HELP };
    if (parsed.man) return { command: "command-man", page: "show" };
    return { command: "show", ...parsed };
  }
  if (command === "ls") {
    const discovery = rest[0] === "quotes" ? rest.slice(1) :
      (rest.length === 1 ? rest : []);
    if (discovery.length === 1 && ["-h", "--help"].includes(discovery[0]))
      return { command: "help", help: LS_HELP };
    if (discovery.length === 1 && discovery[0] === "--man")
      return { command: "command-man", page: "ls" };
    if (rest[0] !== "quotes") usage("ls: resource 'quotes' is required");
    let verbose = false, jsonl = false;
    const types = new Set();
    for (let index = 1; index < rest.length; index++) {
      const arg = rest[index];
      if (["-v", "--verbose"].includes(arg)) verbose = true;
      else if (arg === "--jsonl") jsonl = true;
      else if (arg === "--tsv") continue; // Explicit no-op; retain default TTY/redirect behavior.
      else if (arg === "--type") {
        const type = rest[++index];
        if (!CLI_QUOTE_TYPES.has(type))
          usage("ls quotes: --type requires EQUITY, ETF, INDEX or OTHER");
        types.add(type);
      }
      else usage("ls quotes: unsupported argument; see ww ls quotes --help");
    }
    return { command: "ls", verbose, jsonl, types: [...types] };
  }
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

// Match the repository's private .env credential convention without executing
// shell code or loading provider credentials. Nonempty exports override the file; help/usage paths never read it.
export async function readApiToken(env = process.env, readFileImpl = readFile) {
  if (env.WW_API_TOKEN?.trim()) return env.WW_API_TOKEN;
  let contents;
  try { contents = await readFileImpl(new URL("../.env", import.meta.url), "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw new WwError("fetch: cannot read the private .env credential file");
  }
  const matches = [...contents.matchAll(/^\s*(?:export\s+)?WW_API_TOKEN\s*=\s*(.*?)\s*$/gm)];
  if (!matches.length) return undefined;
  let token = matches.at(-1)[1];
  if ((token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))) token = token.slice(1, -1);
  return token;
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

const DISCOVERY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISCOVERY_TYPES = new Set(["EQUITY", "ETF", "INDEX", "OTHER_UNDERLYING"]);
const object = value => !!value && typeof value === "object" && !Array.isArray(value);

function discoveryTime(value) {
  if (typeof value !== "string") return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/.exec(value);
  if (!parts) return false;
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] &&
    hour <= 23 && minute <= 59 && second <= 59;
}

export function parseHeldQuotesResponse(data, correlation) {
  const invalid = () => { throw new WwError("ls quotes: backend returned an invalid discovery response"); };
  if (!object(data) || typeof data.requestId !== "string" || !DISCOVERY_UUID.test(data.requestId) ||
      data.requestId !== correlation || !Array.isArray(data.items)) invalid();
  let previous;
  const items = data.items.map(item => {
    if (!object(item) || typeof item.observationId !== "string" || !DISCOVERY_UUID.test(item.observationId) ||
        !object(item.subject) || typeof item.subject.symbol !== "string" ||
        !/^[A-Z^][A-Z0-9.^/_-]{0,31}$/.test(item.subject.symbol) ||
        !DISCOVERY_TYPES.has(item.subject.securityType) || !object(item.provenance) ||
        typeof item.provenance.provider !== "string" || !item.provenance.provider.length ||
        !["PRODUCTION", "SANDBOX"].includes(item.provenance.environment) ||
        !discoveryTime(item.provenance.receivedAt) || !discoveryTime(item.provenance.committedAt) ||
        (previous !== undefined && item.subject.symbol <= previous)) invalid();
    previous = item.subject.symbol;
    // Unknown additive data is ignored, never turned into incidental list output.
    return { observationId: item.observationId,
      subject: { symbol: item.subject.symbol, securityType: item.subject.securityType },
      provenance: { provider: item.provenance.provider, environment: item.provenance.environment,
        receivedAt: item.provenance.receivedAt, committedAt: item.provenance.committedAt } };
  });
  return { requestId: data.requestId, items };
}

export function escapeDiscoveryCell(value) {
  return value.replace(/[\\\x00-\x1F\x7F]/g, character => {
    const named = { "\\": "\\\\", "\t": "\\t", "\r": "\\r", "\n": "\\n" };
    return named[character] ?? `\\u00${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
  });
}

export async function readHeldQuotes({ token = process.env.WW_API_TOKEN,
  base = process.env.WW_BASE_URL ?? "http://localhost:3100", fetchImpl = fetch } = {}) {
  if (typeof token !== "string" || !token.trim() || !/^[A-Za-z0-9._~+\/-]+=*$/.test(token))
    throw new WwError("ls quotes: WW_API_TOKEN must be a configured valid Bearer credential");
  let url;
  try { url = new URL("/v2/quotes", base); }
  catch { throw new WwError("WW_BASE_URL must be an HTTP(S) URL", 2); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new WwError("WW_BASE_URL must be an HTTP(S) URL without embedded credentials", 2);
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new WwError("ls quotes: WW_BASE_URL must use HTTPS outside loopback development", 2);
  let response;
  try { response = await fetchImpl(url, { method: "GET", redirect: "error",
    headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new WwError("ls quotes: Wheelwright request failed; check connectivity and WW_BASE_URL"); }
  let data;
  try { data = redactCredential(await response.json(), token); }
  catch { throw new WwError("ls quotes: backend returned invalid JSON"); }
  if (response.status !== 200) {
    const code = typeof data?.code === "string" ? data.code : "REQUEST_FAILED";
    const reason = typeof data?.detail === "string" ? data.detail :
      typeof data?.title === "string" ? data.title : "Wheelwright could not complete the read";
    const request = typeof data?.requestId === "string" ? ` (request ${data.requestId})` : "";
    throw new WwError(escapeDiscoveryCell(`ls quotes: ${code}: ${reason}${request}`));
  }
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? ""))
    throw new WwError("ls quotes: backend returned an invalid discovery media type");
  const result = parseHeldQuotesResponse(data, response.headers.get("x-request-id"));
  return { ...result, wheelwrightOrigin: url.origin.replaceAll(token, "[REDACTED]") };
}

export function presentHeldQuotes(result, { verbose = false, jsonl = false, tty = false, types = [] } = {}) {
  // readHeldQuotes validates the complete wire collection before presentation/selection.
  const items = result.items.map(item => ({ ...item, subject: { ...item.subject,
    securityType: item.subject.securityType === "OTHER_UNDERLYING" ? "OTHER" : item.subject.securityType
  } })).filter(item => !types.length || types.includes(item.subject.securityType));
  const rows = items.map(item => [item.subject.symbol, item.subject.securityType,
    item.provenance.receivedAt, item.provenance.provider, item.provenance.environment]);
  let stdout;
  if (jsonl) stdout = items.map(item => JSON.stringify(item) + "\n").join("");
  else if (!tty) stdout = rows.map(row => row.map(escapeDiscoveryCell).join("\t") + "\n").join("");
  else if (!rows.length) stdout = types.length ? "No canonical direct quotes match the selected types.\n" : "No canonical direct quotes held.\n";
  else {
    const headings = ["SYMBOL", "TYPE", "RECEIVED AT (UTC)", "PROVIDER", "ENVIRONMENT"];
    if (verbose) {
      headings.push("OBSERVATION ID", "COMMITTED AT (UTC)");
      rows.forEach((row, index) => row.push(items[index].observationId, items[index].provenance.committedAt));
    }
    const escaped = rows.map(row => row.map(escapeDiscoveryCell));
    const widths = headings.map((heading, index) => escaped.reduce((width, row) => Math.max(width, row[index].length), heading.length));
    const layout = row => row.map((cell, index) => cell.padEnd(widths[index])).join("  ").trimEnd();
    stdout = "Held canonical direct quotes\n" + layout(headings) + "\n" + escaped.map(layout).join("\n") + "\n";
  }
  const stderr = verbose ? `From ${escapeDiscoveryCell(result.wheelwrightOrigin)}\nRequest ${result.requestId}\nls quotes: ${rows.length} holdings\n` : "";
  return { stdout, stderr };
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
    ...item,
    subject: { ...item.subject, securityType: item.subject.securityType === "OTHER_UNDERLYING" ? "OTHER" : item.subject.securityType },
    ...(item.observation ? { observation: { ...item.observation, subject: { ...item.observation.subject,
      securityType: item.observation.subject.securityType === "OTHER_UNDERLYING" ? "OTHER" : item.observation.subject.securityType } } } : {}),
    kind: "fetch-result/v2", symbol: item.subject.symbol,
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
  if (parsed.command === "show") {
    if (parsed.fields) { process.stdout.write(presentFields(!!process.stdout.isTTY)); return; }
    let config;
    try { config = showConfig(await readApiToken()); }
    catch (error) {
      if (error.code === 2) throw error;
      process.exitCode = 1;
      if (parsed.quotes) process.stderr.write("show: credential/configuration unavailable; no inventory read attempted\n");
      else for (const symbol of parsed.symbols) process.stderr.write(`${symbol}: show: credential/configuration unavailable; no read attempted\n`);
      return;
    }
    const symbols = parsed.quotes
      ? (await readHeldQuotes({ token: config.token, base: config.url.origin })).items.map(item => item.subject.symbol)
      : parsed.symbols;
    const buffered = parsed.quotes || parsed.where.length > 0 || parsed.sortBy !== undefined ||
      parsed.limit !== undefined || parsed.allFields || parsed.format === "table";
    const observations = [];
    let header = true, failed = 0;
    for (const symbol of symbols) {
      try {
        const result = await readHeldQuote(symbol, config);
        if (buffered) observations.push(result.observation);
        else {
          process.stdout.write(presentShow(result.observation, { ...parsed, tty: !!process.stdout.isTTY, header }));
          header = false;
        }
        if (parsed.verbose) process.stderr.write(`From ${escapeDiscoveryCell(result.origin)}; ${symbol}; request ${result.requestId}\n`);
      } catch (error) {
        failed++;
        process.exitCode = 1;
        process.stderr.write(`${symbol}: ${escapeDiscoveryCell(error.message)}\n`);
      }
    }
    if (buffered) {
      if (failed) process.stderr.write(`show: partial results; filtering/ranking/limit cover only ${observations.length} successfully read observations of ${symbols.length} selected; ${failed} failed.\n`);
      const selected = selectShowObservations(observations, parsed);
      const emptyMessage = failed ? undefined : parsed.where.length
        ? "No canonical direct quotes match the selected filters." : "No canonical direct quotes held.";
      process.stdout.write(presentShowRows(selected, { ...parsed, tty: !!process.stdout.isTTY, emptyMessage }));
    }
    return;
  }
  if (parsed.command === "ls") {
    let token;
    try { token = await readApiToken(); }
    catch { throw new WwError("ls quotes: cannot read the private .env credential file"); }
    const result = await readHeldQuotes({ token });
    const presentation = presentHeldQuotes(result, { ...parsed, tty: !!process.stdout.isTTY });
    if (presentation.stdout) process.stdout.write(presentation.stdout);
    if (presentation.stderr) process.stderr.write(presentation.stderr);
    return;
  }
  if (parsed.command === "fetch") {
    const result = await fetchEvidence(parsed.symbols, { mode: parsed.mode, token: await readApiToken() });
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
