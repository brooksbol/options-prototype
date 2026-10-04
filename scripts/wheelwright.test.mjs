import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import {
  parseArgs, parseQuoteResponse, parseRefreshResponse, fetchEvidence, presentFetchResult,
  parseRecordLines, sortRecords, renderTable,
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
    { command: "fetch", symbols: ["QQQ"], quiet: false, verbose: false });
  assert.deepEqual(parseArgs(["fetch", "qqq", "-q", "SPY", "--quiet"]),
    { command: "fetch", symbols: ["QQQ", "SPY"], quiet: true, verbose: false });
  assert.deepEqual(parseArgs(["fetch", "-v", "qqq"]),
    { command: "fetch", symbols: ["QQQ"], quiet: false, verbose: true });
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
  assert.match(rootManual.stdout, /fetch \[-q \| -v\] SYMBOL/);
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
  assert.equal(run(["fetch"]).status, 2);
  assert.equal(run(["fetch", "--bad", "QQQ"]).status, 2);
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
