import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import {
  parseArgs, parseQuoteResponse, parseRefreshResponse, fetchEvidence, presentFetchResult,
  parseRecordLines, sortRecords, renderTable,
  EXPERIMENTAL_SEED, resolveFetchSelection, parseMonitoredResponse, readMonitoredSymbols,
} from "./wheelwright.mjs";

const cli = new URL("./wheelwright.mjs", import.meta.url).pathname;
const time = "2026-10-03T15:00:00Z";
const quote = (symbol, price, status = "ready", previousClose = null) => ({
  symbol,
  observation: price === null ? null : { price, previousClose, observedAt: time },
  acquisition: { status, lastAttemptAt: status === "failed" ? "2026-10-03T15:10:00Z" : null,
    failureCount: status === "failed" ? 2 : 0 },
});
const response = quotes => ({ generation: 17, generatedAt: "2026-10-03T15:20:00Z", quotes });
const sample = response([quote("QQQ", 604.31, "failed"), quote("SPY", 670.2), quote("XLE", 87.5)]);

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", ...options });
}

test("argument parsing and help need no backend", () => {
  assert.deepEqual(parseArgs(["observed-prices", "xle", "SPY", "xle"]),
    { command: "observed-prices", symbols: ["XLE", "SPY"] });
  assert.deepEqual(parseArgs(["prices", "qqq", "SPY"]),
    { command: "prices", symbols: ["QQQ", "SPY"] });
  assert.deepEqual(parseArgs(["fetch", "--", "qqq"]),
    { command: "fetch", symbols: ["QQQ"], quiet: false, verbose: false, useDefaultSelector: false });
  assert.deepEqual(parseArgs(["fetch", "qqq", "-q", "SPY", "--quiet"]),
    { command: "fetch", symbols: ["QQQ", "SPY"], quiet: true, verbose: false, useDefaultSelector: false });
  assert.deepEqual(parseArgs(["fetch", "-v", "qqq"]),
    { command: "fetch", symbols: ["QQQ"], quiet: false, verbose: true, useDefaultSelector: false });
  // Bare fetch selects the experimental default (resolved against the backend in main).
  assert.deepEqual(parseArgs(["fetch"]),
    { command: "fetch", symbols: [], quiet: false, verbose: false, useDefaultSelector: true });
  assert.deepEqual(parseArgs(["fetch", "-q"]),
    { command: "fetch", symbols: [], quiet: true, verbose: false, useDefaultSelector: true });
  assert.deepEqual(parseArgs(["observed-prices", "--", "-TEST"]).symbols, ["-TEST"]);
  assert.deepEqual(parseArgs(["sort", "--by", "price", "--descending"]),
    { command: "sort", by: "price", descending: true });
  for (const args of [["--help"], ["-h"], ["observed-prices", "--help"],
    ["observed-prices", "-h"], ["prices", "--help"], ["prices", "-h"],
    ["fetch", "--help"],
    ["fetch", "-h"], ["sort", "--help"], ["sort", "-h"]]) {
    const result = run(args, { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
    assert.equal(result.stderr, "");
  }
  assert.match(run(["observed-prices", "--help"]).stdout, /not independently established underlying-quote acquisition time/);
  assert.match(run(["sort", "--help"]).stdout, /missing prices remain visible and sort last/i);
  assert.match(run(["fetch", "--help"]).stdout, /preserved earlier price/);
  const rootHelp = run(["--help"], { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
  assert.match(rootHelp.stdout, /Working commands:/);
  assert.doesNotMatch(rootHelp.stdout, /refresh SYMBOL/);
  assert.match(rootHelp.stdout, /ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE \| ww sort --by price/);
  const rootManual = run(["--man"], { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
  assert.equal(rootManual.status, 0);
  assert.match(rootManual.stdout, /WW\(1\)/);
  assert.match(rootManual.stdout, /WORKING COMMANDS/);
  assert.match(rootManual.stdout, /fetch \[-q \| -v\] \[SYMBOL\.\.\.\]/);
  assert.doesNotMatch(rootManual.stdout, /refresh SYMBOL/);
  assert.match(rootManual.stdout, /EXIT STATUS/);
  assert.equal(rootManual.stderr, "");
  const manual = run(["fetch", "--man"], { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
  assert.equal(manual.status, 0);
  assert.match(manual.stdout, /WW-FETCH\(1\)/);
  assert.match(manual.stdout, /fetch complete: 3\/3 prices held/);
  assert.equal(manual.stderr, "");
  for (const [command, heading] of [["prices", "WW-PRICES(1)"],
    ["observed-prices", "WW-PRICES(1)"], ["sort", "WW-SORT(1)"]]) {
    const page = run([command, "--man"], { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
    assert.equal(page.status, 0);
    assert.ok(page.stdout.includes(heading));
    assert.equal(page.stderr, "");
  }
  const retired = run(["refresh", "QQQ"]);
  assert.equal(retired.status, 2);
  assert.equal(retired.stdout, "");
  assert.match(retired.stderr, /unknown command 'refresh'/);
  // Bare `ww fetch` is NO LONGER a usage error: it is the experimental default
  // selector, resolved against the backend. (Exercised end-to-end below.)
  assert.equal(run(["fetch", "--bad", "QQQ"]).status, 2);
  assert.equal(run(["prices"]).status, 2);
  const conflicting = run(["fetch", "-q", "--verbose", "QQQ"]);
  assert.equal(conflicting.status, 2);
  assert.equal(conflicting.stdout, "");
  assert.match(conflicting.stderr, /--quiet and --verbose cannot be combined/);
  assert.equal(run(["observed-prices"]).status, 2);
  const invalid = run(["sort", "--by", "freshness"]);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, "");
  assert.match(invalid.stderr, /unsupported field/);
});

test("backend response preserves absence, failed acquisition, and honest timestamp semantics", () => {
  const [missing, failed] = parseQuoteResponse(response([
    quote("NONE", null, "absent"), quote("QQQ", 604.31, "failed", 600),
  ]), ["NONE", "QQQ"]);
  assert.equal(missing.price, null);
  assert.equal(missing.priceAssociatedChainAt, null);
  assert.equal(missing.acquisitionStatus, "absent");
  assert.equal(failed.price, 604.31);
  assert.equal(failed.previousClose, 600);
  assert.equal(failed.priceAssociatedChainAt, time);
  assert.equal(failed.lastAttemptAt, "2026-10-03T15:10:00Z");
  assert.equal(failed.failureCount, 2);
  assert.equal(failed.generatedAt, "2026-10-03T15:20:00Z");
  assert.equal("quoteAcquiredAt" in failed, false);
  assert.throws(() => parseQuoteResponse(response([]), ["XLE"]), /omitted/);
});

test("fetch uses one targeted POST and trusts only the backend completion and held-price facts", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({
      outcome: "ACQUIRED", completed: true, symbolsAcquired: 99,
      perSymbol: [
        { symbol: "QQQ", acquisitionOutcome: "FAILED", heldPrice: true },
        { symbol: "SPY", acquisitionOutcome: "ACQUIRED", heldPrice: false },
      ],
    }) };
  };
  const result = await fetchEvidence(["QQQ", "SPY"], fetchImpl, "http://127.0.0.1:3100");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].url.pathname, "/api/evidence/refresh");
  assert.deepEqual(calls[0].url.searchParams.getAll("symbol"), ["QQQ", "SPY"]);
  assert.deepEqual(result.results, [
    { symbol: "QQQ", acquisitionOutcome: "FAILED", heldPrice: true },
    { symbol: "SPY", acquisitionOutcome: "ACQUIRED", heldPrice: false },
  ]);
  assert.equal(result.wheelwrightOrigin, "http://127.0.0.1:3100");
  assert.deepEqual(parseRefreshResponse({ outcome: "NOT_COMPLETED", completed: false, perSymbol: [] }, ["QQQ"]),
    { outcome: "NOT_COMPLETED", completed: false, results: [] });
  assert.throws(() => parseRefreshResponse({ outcome: "ACQUIRED", perSymbol: [] }, ["QQQ"]),
    /invalid refresh response/);
  assert.throws(() => parseRefreshResponse({ outcome: "ACQUIRED", completed: true, perSymbol: [] }, ["QQQ"]),
    /omitted a requested symbol/);
});

test("fetch exit status makes shell && depend on all requested held prices", async () => {
  let held = false;
  const server = createServer((request, reply) => {
    reply.setHeader("content-type", "application/json");
    if (request.method !== "POST" || !request.url.startsWith("/api/evidence/refresh?")) {
      reply.statusCode = 404; reply.end("{}"); return;
    }
    reply.end(JSON.stringify({ outcome: "ACQUIRED", completed: true,
      perSymbol: [
        { symbol: "QQQ", acquisitionOutcome: "FAILED", heldPrice: true },
        { symbol: "SPY", acquisitionOutcome: "NO_USABLE_EVIDENCE", heldPrice: held },
      ] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const env = { ...process.env, WW_BASE_URL: `http://127.0.0.1:${server.address().port}` };
    const invoke = async (options = []) => {
      const child = spawn(process.execPath, [cli, "fetch", ...options, "QQQ", "SPY"], { env });
      let stdout = "", stderr = "";
      child.stdout.on("data", chunk => { stdout += chunk; });
      child.stderr.on("data", chunk => { stderr += chunk; });
      const [code] = await once(child, "exit");
      return { code, stdout, stderr };
    };
    const absent = await invoke();
    assert.equal(absent.code, 1);
    assert.match(absent.stderr, /fetch completed; 1\/2 prices held; SPY has no local price stored/);
    assert.deepEqual(absent.stdout.trim().split("\n").map(JSON.parse).map(r => r.heldPrice), [true, false]);
    assert.deepEqual(absent.stdout.trim().split("\n").map(JSON.parse).map(r => r.kind),
      ["fetch-result/v1", "fetch-result/v1"]);
    const quietAbsent = await invoke(["-q"]);
    assert.equal(quietAbsent.code, 1);
    assert.match(quietAbsent.stderr, /SPY has no local price stored/);
    const verboseAbsent = await invoke(["-v"]);
    assert.equal(verboseAbsent.code, 1);
    assert.match(verboseAbsent.stderr, new RegExp(`^From http://127\\.0\\.0\\.1:${server.address().port}\\n`));
    assert.match(verboseAbsent.stderr, /SPY  acquisition NO_USABLE_EVIDENCE  no local price stored/);
    assert.match(verboseAbsent.stderr, /SPY has no local price stored/);
    held = true;
    const present = await invoke();
    assert.equal(present.code, 0);
    assert.equal(present.stderr, "");
    assert.deepEqual(present.stdout.trim().split("\n").map(JSON.parse).map(r => r.symbol), ["QQQ", "SPY"]);
    const quiet = await invoke(["--quiet"]);
    assert.equal(quiet.code, 0);
    assert.equal(quiet.stderr, "");
    assert.equal(quiet.stdout, present.stdout);
    const verbose = await invoke(["--verbose"]);
    assert.equal(verbose.code, 0);
    assert.match(verbose.stderr, new RegExp(`^From http://127\\.0\\.0\\.1:${server.address().port}\\n`));
    assert.match(verbose.stderr, /QQQ  acquisition FAILED\s+previous price retained/);
    assert.match(verbose.stderr, /SPY  acquisition NO_USABLE_EVIDENCE\s+previous price retained/);
    assert.match(verbose.stderr, /fetch complete: 2\/2 prices held/);
    assert.doesNotMatch(verbose.stderr, /Tradier|749\.58|\/api\/evidence/);
    assert.equal(verbose.stdout, present.stdout);
  } finally {
    server.close();
  }
});

test("experimental seed is the fixed ten-symbol research set", () => {
  assert.deepEqual(EXPERIMENTAL_SEED,
    ["SPY", "QQQ", "IWM", "SLV", "GLD", "TQQQ", "USO", "SMH", "SOXL", "GDX"]);
  assert.equal(EXPERIMENTAL_SEED.length, 10);
});

test("resolveFetchSelection unions monitored with the seed, dedupes, and keeps provenance", () => {
  // Empty monitored → exactly the ten seed symbols, all seed-only.
  const empty = resolveFetchSelection([]);
  assert.deepEqual(empty.symbols, EXPERIMENTAL_SEED);
  assert.ok(empty.symbols.every(s => empty.provenance.get(s) === "experimental-seed"));

  // Monitored symbols union with the seed; monitored-only come first in declared order.
  const union = resolveFetchSelection(["XLE", "ARKK"]);
  assert.deepEqual(union.symbols, ["XLE", "ARKK", ...EXPERIMENTAL_SEED]);
  assert.equal(union.provenance.get("XLE"), "monitored");
  assert.equal(union.provenance.get("ARKK"), "monitored");
  assert.equal(union.provenance.get("SPY"), "experimental-seed");
  assert.equal(union.symbols.length, 12);

  // Overlap: a monitored symbol that is also in the seed is acquired ONCE, marked "both".
  const overlap = resolveFetchSelection(["QQQ", "XLE"]);
  assert.equal(overlap.symbols.filter(s => s === "QQQ").length, 1);
  assert.equal(overlap.provenance.get("QQQ"), "both");
  assert.equal(overlap.provenance.get("XLE"), "monitored");
  // Full union size: 10 seed + 1 monitored-only (XLE); QQQ folded in.
  assert.equal(overlap.symbols.length, 11);

  // Normalization: lowercase/dup monitored input is uppercased and deduped.
  const normalized = resolveFetchSelection(["xle", "XLE", "spy"]);
  assert.equal(normalized.symbols.filter(s => s === "XLE").length, 1);
  assert.equal(normalized.provenance.get("SPY"), "both");
  assert.equal(normalized.symbols.filter(s => s === "SPY").length, 1);
});

test("parseMonitoredResponse accepts a membership list and rejects malformed shapes", () => {
  assert.deepEqual(parseMonitoredResponse({ symbols: ["xle", "SPY"], count: 2,
    meaning: "last declared monitored symbols" }), ["XLE", "SPY"]);
  assert.deepEqual(parseMonitoredResponse({ symbols: [] }), []);
  assert.throws(() => parseMonitoredResponse({}), /invalid monitored response/);
  assert.throws(() => parseMonitoredResponse({ symbols: "SPY" }), /invalid monitored response/);
  assert.throws(() => parseMonitoredResponse({ symbols: [""] }), /invalid monitored symbol/);
  assert.throws(() => parseMonitoredResponse({ symbols: [123] }), /invalid monitored symbol/);
});

test("readMonitoredSymbols failure aborts (never a silent authoritative empty)", async () => {
  const down = async () => { throw new Error("ECONNREFUSED"); };
  await assert.rejects(() => readMonitoredSymbols(down, "http://127.0.0.1:3100"), /backend request failed/);
  const http500 = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => readMonitoredSymbols(http500, "http://127.0.0.1:3100"), /HTTP 500/);
});

test("bare fetch resolves monitored UNION seed, acquires each once, and never POSTs zero symbols", async () => {
  const cli = new URL("./wheelwright.mjs", import.meta.url).pathname;
  // Monitored endpoint returns XLE + QQQ (QQQ overlaps the seed). Refresh echoes
  // back whatever symbols it is asked for as held.
  let refreshCall;
  const server = createServer((request, reply) => {
    const url = new URL(request.url, "http://localhost");
    reply.setHeader("content-type", "application/json");
    if (url.pathname === "/api/evidence/monitored" && request.method === "GET") {
      reply.end(JSON.stringify({ symbols: ["XLE", "QQQ"], count: 2,
        meaning: "last declared monitored symbols" }));
      return;
    }
    if (url.pathname === "/api/evidence/refresh" && request.method === "POST") {
      refreshCall = url.searchParams.getAll("symbol");
      reply.end(JSON.stringify({ outcome: "ACQUIRED", completed: true,
        perSymbol: refreshCall.map(symbol => ({ symbol, acquisitionOutcome: "ACQUIRED", heldPrice: true })) }));
      return;
    }
    reply.statusCode = 404; reply.end("{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const env = { ...process.env, WW_BASE_URL: `http://127.0.0.1:${server.address().port}` };
    const invoke = async (args) => {
      const child = spawn(process.execPath, [cli, ...args], { env });
      let stdout = "", stderr = "";
      child.stdout.on("data", c => { stdout += c; });
      child.stderr.on("data", c => { stderr += c; });
      const [code] = await once(child, "exit");
      return { code, stdout, stderr };
    };

    const bare = await invoke(["fetch"]);
    assert.equal(bare.code, 0);
    // Union = monitored (XLE, QQQ) first then seed-only; QQQ deduped.
    const expected = ["XLE", "QQQ", "SPY", "IWM", "SLV", "GLD", "TQQQ", "USO", "SMH", "SOXL", "GDX"];
    assert.deepEqual(refreshCall, expected);
    // Acquired once each — no duplicate QQQ.
    assert.equal(refreshCall.filter(s => s === "QQQ").length, 1);
    assert.equal(new Set(refreshCall).size, refreshCall.length);
    // Piped stdout carries one record per distinct symbol.
    assert.deepEqual(bare.stdout.trim().split("\n").map(JSON.parse).map(r => r.symbol), expected);

    // Verbose default selection diagnostics go to stderr, not stdout.
    const verbose = await invoke(["fetch", "-v"]);
    assert.equal(verbose.code, 0);
    assert.match(verbose.stderr, /Default selection: 11 symbol\(s\)/);
    assert.match(verbose.stderr, /QQQ\s+both/);
    assert.match(verbose.stderr, /XLE\s+monitored/);
    assert.match(verbose.stderr, /SPY\s+experimental-seed/);
    assert.doesNotMatch(verbose.stdout, /Default selection|monitored|experimental-seed/);
    assert.deepEqual(verbose.stdout.trim().split("\n").map(JSON.parse).map(r => r.symbol), expected);

    // Explicit operands REPLACE the default: only the given symbols are fetched,
    // the monitored endpoint is not consulted, and the seed is not added.
    const explicit = await invoke(["fetch", "QQQ", "SPY"]);
    assert.equal(explicit.code, 0);
    assert.deepEqual(refreshCall, ["QQQ", "SPY"]);
  } finally {
    server.close();
  }
});

test("empty monitored declaration resolves exactly the ten seed symbols", async () => {
  const cli = new URL("./wheelwright.mjs", import.meta.url).pathname;
  let refreshCall;
  const server = createServer((request, reply) => {
    const url = new URL(request.url, "http://localhost");
    reply.setHeader("content-type", "application/json");
    if (url.pathname === "/api/evidence/monitored") {
      reply.end(JSON.stringify({ symbols: [], count: 0, meaning: "last declared monitored symbols" }));
      return;
    }
    if (url.pathname === "/api/evidence/refresh" && request.method === "POST") {
      refreshCall = url.searchParams.getAll("symbol");
      reply.end(JSON.stringify({ outcome: "ACQUIRED", completed: true,
        perSymbol: refreshCall.map(symbol => ({ symbol, acquisitionOutcome: "ACQUIRED", heldPrice: true })) }));
      return;
    }
    reply.statusCode = 404; reply.end("{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const env = { ...process.env, WW_BASE_URL: `http://127.0.0.1:${server.address().port}` };
    const child = spawn(process.execPath, [cli, "fetch"], { env });
    let stdout = "";
    child.stdout.on("data", c => { stdout += c; });
    const [code] = await once(child, "exit");
    assert.equal(code, 0);
    assert.deepEqual(refreshCall, EXPERIMENTAL_SEED);
  } finally {
    server.close();
  }
});

test("bare fetch aborts (does not POST whole-cycle) when the monitored read fails", async () => {
  const cli = new URL("./wheelwright.mjs", import.meta.url).pathname;
  let refreshCalled = false;
  const server = createServer((request, reply) => {
    const url = new URL(request.url, "http://localhost");
    reply.setHeader("content-type", "application/json");
    if (url.pathname === "/api/evidence/monitored") {
      reply.statusCode = 503; reply.end('{"error":"down"}'); return;
    }
    if (url.pathname === "/api/evidence/refresh") { refreshCalled = true; }
    reply.statusCode = 404; reply.end("{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const env = { ...process.env, WW_BASE_URL: `http://127.0.0.1:${server.address().port}` };
    const child = spawn(process.execPath, [cli, "fetch"], { env });
    let stdout = "", stderr = "";
    child.stdout.on("data", c => { stdout += c; });
    child.stderr.on("data", c => { stderr += c; });
    const [code] = await once(child, "exit");
    // Monitored is a REQUIRED source: its failure aborts fetch (exit 1), it is NOT
    // silently converted to an authoritative empty set, and crucially NO refresh
    // POST is made — so a read failure can never trigger whole-cycle acquisition.
    assert.equal(code, 1);
    assert.equal(stdout, "");
    assert.match(stderr, /HTTP 503/);
    assert.equal(refreshCalled, false);
  } finally {
    server.close();
  }
});

test("fetch terminal status, quiet mode, preserved price notice, and pipe records", () => {
  const result = { completed: true, results: [
    { symbol: "QQQ", acquisitionOutcome: "FAILED", heldPrice: true },
    { symbol: "SPY", acquisitionOutcome: "ACQUIRED", heldPrice: true },
  ], wheelwrightOrigin: "http://localhost:3100" };
  const terminal = presentFetchResult(result, false, true, true);
  assert.equal(terminal.stdout, "");
  assert.match(terminal.stderr, /^fetch complete: 2\/2 prices held\n/);
  assert.match(terminal.stderr, /QQQ: acquisition FAILED; previous price retained/);
  assert.deepEqual(presentFetchResult(result, true, true, true), { stdout: "", stderr: "" });
  const piped = presentFetchResult(result, false, false, true);
  assert.equal(piped.stdout.trim().split("\n").length, 2);
  assert.deepEqual(piped.stdout.trim().split("\n").map(JSON.parse).map(r => r.heldPrice), [true, true]);
  assert.match(piped.stderr, /fetch complete: 2\/2 prices held/);
  const verbose = presentFetchResult(result, false, false, false, true);
  assert.match(verbose.stderr, /^From http:\/\/localhost:3100\nQQQ  acquisition FAILED\s+previous price retained\n/);
  assert.match(verbose.stderr, /SPY  acquisition ACQUIRED\n/);
  assert.match(verbose.stderr, /fetch complete: 2\/2 prices held/);
  assert.equal(verbose.stdout, piped.stdout);
  assert.deepEqual(presentFetchResult({ completed: false, results: [] }, false, false, true),
    { stdout: "", stderr: "" });
  assert.deepEqual(presentFetchResult({ completed: false, results: [] }, false, false, true, true),
    { stdout: "", stderr: "" });
});

test("numeric sorting, null placement, ties, and exact record preservation", () => {
  const records = parseQuoteResponse(response([
    quote("A", 20), quote("B", null, "absent"), quote("C", 3),
    quote("D", 20), quote("E", null, "pending"),
  ]), ["A", "B", "C", "D", "E"]);
  const input = records.map(JSON.stringify).join("\n") + "\n";
  const entries = parseRecordLines(input);
  const ascending = sortRecords(entries, "price", false);
  const descending = sortRecords(entries, "price", true);
  assert.deepEqual(ascending.map(e => e.record.symbol), ["C", "A", "D", "B", "E"]);
  assert.deepEqual(descending.map(e => e.record.symbol), ["A", "D", "C", "B", "E"]);
  assert.deepEqual(descending.map(e => e.line).sort(), entries.map(e => e.line).sort());
  assert.match(renderTable(records), /CHAIN-ASSOCIATED AT/);
  assert.match(renderTable(records), /not quote acquisition time/);
  const empty = parseQuoteResponse(response([quote("NONE", null, "pending")]), ["NONE"]);
  const emptyTable = renderTable(empty);
  assert.match(emptyTable, /No held underlying prices/);
  assert.match(emptyTable, /NONE\s+pending/);
  assert.match(emptyTable, /No prior close, chain-associated time, or acquisition attempt/);
  assert.doesNotMatch(emptyTable, /PREV CLOSE\s+CHAIN-ASSOCIATED AT/);
  assert.throws(() => parseRecordLines("{bad}\n"), /line 1: invalid JSON/);
  assert.throws(() => parseRecordLines('{"kind":"other"}\n'), /invalid observed-price\/v1 record/);
});

test("source requests explicit symbols; JSON Lines pipe into sort; backend failure is diagnostic", async () => {
  let requested;
  let fail = false;
  const server = createServer((request, reply) => {
    requested = new URL(request.url, "http://localhost");
    reply.setHeader("content-type", "application/json");
    if (fail) { reply.statusCode = 503; reply.end('{"error":"down"}'); return; }
    reply.end(JSON.stringify(sample));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const env = { ...process.env, WW_BASE_URL: base };
    const source = spawn(process.execPath, [cli, "observed-prices", "XLE", "SPY", "QQQ"], { env });
    const sorter = spawn(process.execPath, [cli, "sort", "--by", "price", "--descending"]);
    source.stdout.pipe(sorter.stdin);
    let output = "", sourceError = "", sortError = "";
    sorter.stdout.on("data", chunk => { output += chunk; });
    source.stderr.on("data", chunk => { sourceError += chunk; });
    sorter.stderr.on("data", chunk => { sortError += chunk; });
    const [sourceExit, sortExit] = await Promise.all([once(source, "exit"), once(sorter, "exit")]);
    assert.equal(sourceExit[0], 0);
    assert.equal(sortExit[0], 0);
    assert.equal(sourceError, "");
    assert.equal(sortError, "");
    assert.equal(requested.pathname, "/api/evidence/quotes");
    assert.deepEqual(requested.searchParams.getAll("symbol"), ["XLE", "SPY", "QQQ"]);
    assert.deepEqual(parseRecordLines(output).map(e => e.record.symbol), ["SPY", "QQQ", "XLE"]);
    assert.ok(!output.includes("CHAIN-ASSOCIATED AT"));
    assert.equal(parseRecordLines(output)[1].record.acquisitionStatus, "failed");
    fail = true;
    const failed = spawn(process.execPath, [cli, "observed-prices", "XLE"], { env });
    let badOut = "", badErr = "";
    failed.stdout.on("data", chunk => { badOut += chunk; });
    failed.stderr.on("data", chunk => { badErr += chunk; });
    const [code] = await once(failed, "exit");
    assert.equal(code, 1);
    assert.equal(badOut, "");
    assert.match(badErr, /HTTP 503/);
  } finally {
    server.close();
  }
});

test("malformed stdin reports stderr; broken pipe exits without stack trace", async () => {
  const malformed = run(["sort", "--by", "price"], { input: "{bad}\n" });
  assert.equal(malformed.status, 1);
  assert.equal(malformed.stdout, "");
  assert.match(malformed.stderr, /stdin line 1: invalid JSON/);
  const records = Array.from({ length: 5000 }, (_, i) =>
    JSON.stringify(parseQuoteResponse(response([quote(`S${i}`, i)]), [`S${i}`])[0])).join("\n") + "\n";
  const child = spawn(process.execPath, [cli, "sort", "--by", "price"], { stdio: ["pipe", "pipe", "pipe"] });
  child.stdout.once("data", () => child.stdout.destroy());
  child.stdin.end(records);
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  const [code] = await once(child, "exit");
  assert.equal(code, 0);
  assert.equal(stderr, "");
});
