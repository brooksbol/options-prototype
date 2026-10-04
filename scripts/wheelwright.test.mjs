import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import {
  parseArgs, parseQuoteResponse, parseRefreshResponse, refreshEvidence,
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
  assert.deepEqual(parseArgs(["refresh", "--", "qqq"]),
    { command: "refresh", symbols: ["QQQ"] });
  assert.deepEqual(parseArgs(["observed-prices", "--", "-TEST"]).symbols, ["-TEST"]);
  assert.deepEqual(parseArgs(["sort", "--by", "price", "--descending"]),
    { command: "sort", by: "price", descending: true });
  for (const args of [["--help"], ["-h"], ["observed-prices", "--help"],
    ["observed-prices", "-h"], ["prices", "--help"], ["prices", "-h"],
    ["refresh", "--help"], ["refresh", "-h"], ["sort", "--help"], ["sort", "-h"]]) {
    const result = run(args, { env: { ...process.env, WW_BASE_URL: "http://127.0.0.1:1" } });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
    assert.equal(result.stderr, "");
  }
  assert.match(run(["observed-prices", "--help"]).stdout, /not independently established underlying-quote acquisition time/);
  assert.match(run(["sort", "--help"]).stdout, /missing prices remain visible and sort last/i);
  assert.match(run(["refresh", "--help"]).stdout, /preserved earlier price/);
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

test("refresh uses one targeted POST and trusts only the backend completion and held-price facts", async () => {
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
  const result = await refreshEvidence(["QQQ", "SPY"], fetchImpl, "http://127.0.0.1:3100");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].url.pathname, "/api/evidence/refresh");
  assert.deepEqual(calls[0].url.searchParams.getAll("symbol"), ["QQQ", "SPY"]);
  assert.deepEqual(result.results, [
    { symbol: "QQQ", acquisitionOutcome: "FAILED", heldPrice: true },
    { symbol: "SPY", acquisitionOutcome: "ACQUIRED", heldPrice: false },
  ]);
  assert.deepEqual(parseRefreshResponse({ outcome: "NOT_COMPLETED", completed: false, perSymbol: [] }, ["QQQ"]),
    { outcome: "NOT_COMPLETED", completed: false, results: [] });
  assert.throws(() => parseRefreshResponse({ outcome: "ACQUIRED", perSymbol: [] }, ["QQQ"]),
    /invalid refresh response/);
  assert.throws(() => parseRefreshResponse({ outcome: "ACQUIRED", completed: true, perSymbol: [] }, ["QQQ"]),
    /omitted a requested symbol/);
});

test("refresh exit status makes shell && depend on all requested held prices", async () => {
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
    const invoke = async () => {
      const child = spawn(process.execPath, [cli, "refresh", "QQQ", "SPY"], { env });
      let stdout = "", stderr = "";
      child.stdout.on("data", chunk => { stdout += chunk; });
      child.stderr.on("data", chunk => { stderr += chunk; });
      const [code] = await once(child, "exit");
      return { code, stdout, stderr };
    };
    const absent = await invoke();
    assert.equal(absent.code, 1);
    assert.match(absent.stderr, /without held prices for: SPY/);
    assert.deepEqual(absent.stdout.trim().split("\n").map(JSON.parse).map(r => r.heldPrice), [true, false]);
    held = true;
    const present = await invoke();
    assert.equal(present.code, 0);
    assert.equal(present.stderr, "");
    assert.deepEqual(present.stdout.trim().split("\n").map(JSON.parse).map(r => r.symbol), ["QQQ", "SPY"]);
  } finally {
    server.close();
  }
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
