import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fetchEvidence, parseAcquisitionResponse, presentFetchResult } from "./wheelwright.mjs";
import { TOKEN, REQUEST_ID, fixture, capture, acquisition } from "./ww-fetch-fixtures.mjs";
const cli = new URL("./wheelwright.mjs", import.meta.url).pathname;
const records = stdout => stdout.trim().split("\n").map(JSON.parse);

async function withFixture(work) {
  const f = await fixture();
  const run = (args, env = {}) => capture([cli, ...args], { WW_BASE_URL: f.base, ...env });
  try { await work(f, run); } finally { await f.close(); }
}

test("bare fetch and missing credentials fail before any backend/provider request", async () => {
  await withFixture(async (f, run) => {
    for (const args of [["fetch"], ["fetch", "--force"], ["fetch", "-v"], ["fetch", "--"]]) {
      const r = await run(args);
      assert.equal(r.status, 2); assert.equal(r.stdout, "");
      assert.match(r.stderr, /at least one explicit symbol/);
    }
    for (const token of ["", "   ", "bad\ncredential"]) {
      const r = await run(["fetch", "SPY"], { WW_API_TOKEN: token });
      assert.equal(r.status, 1); assert.equal(r.stdout, ""); assert.match(r.stderr, /WW_API_TOKEN/);
      assert.ok(!r.stderr.includes(TOKEN));
    }
    assert.deepEqual(f.calls, []);
  });
});

test("explicit ORDINARY, batch, FORCE and normalized/deduplicated fetch send only one v2 request", async () => {
  await withFixture(async (f, run) => {
    for (const [args, symbols, mode] of [
      [["SPY"], ["SPY"], "ORDINARY"],
      [["SPY", "QQQ", "IWM"], ["SPY", "QQQ", "IWM"], "ORDINARY"],
      [["SPY", "--force"], ["SPY"], "FORCE"],
      [["spy", "SPY", "qqq", "QQQ"], ["SPY", "QQQ"], "ORDINARY"],
    ]) {
      f.calls.length = 0;
      const r = await run(["fetch", ...args]);
      assert.equal(r.status, 0); assert.equal(r.stderr, "");
      assert.equal(f.calls.length, 1);
      assert.equal(f.calls[0].path, "/v2/quotes"); assert.equal(f.calls[0].method, "POST");
      assert.equal(f.calls[0].authorization, `Bearer ${TOKEN}`);
      assert.deepEqual(f.calls[0].body, { subjects: symbols.map(symbol => ({ symbol })), mode });
      assert.deepEqual(records(r.stdout).map(r => r.symbol), symbols);
      assert.ok(!r.stdout.includes(TOKEN));
    }
  });
});

test("new acquisition and reuse remain distinct with unchanged backend observation and clocks", async () => {
  await withFixture(async (f, run) => {
    f.state.outcomes = { QQQ: { outcome: "REUSED" } };
    const r = await run(["fetch", "-v", "SPY", "QQQ"]);
    assert.equal(r.status, 0);
    assert.match(r.stderr, /SPY: NEWLY_ACQUIRED/); assert.match(r.stderr, /QQQ: REUSED/);
    assert.match(r.stderr, /1 newly acquired, 1 reused, 0 failed/);
    const rows = records(r.stdout);
    assert.ok(rows.every(r => r.kind === "fetch-result/v2" && r.requestId === REQUEST_ID && r.fulfilled));
    assert.deepEqual(rows[1].observation, acquisition(["QQQ"]).results[0].observation);
    assert.equal(rows[1].mode, "ORDINARY");
    assert.doesNotMatch(r.stderr, /provider hit|fresh|prices held/);
  });
});

test("failed FORCE with retained prior is visibly failed, including quiet and redirected output", async () => {
  await withFixture(async (f, run) => {
    f.state.outcomes = { SPY: { outcome: "UPSTREAM_FAILED", retained: true } };
    for (const options of [[], ["-q"], ["-v"]]) {
      const r = await run(["fetch", ...options, "SPY", "--force"]);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /SPY: FAILED UPSTREAM_FAILED; prior quote retained \(request unfulfilled\)/);
      assert.match(r.stderr, /fetch failed: 0\/1 fulfilled/);
      assert.doesNotMatch(r.stderr, /fetch complete/);
      const row = records(r.stdout)[0];
      assert.equal(row.fulfilled, false); assert.equal(row.priorRetained, true);
      assert.ok(row.observation); assert.equal(row.failure.code, "UPSTREAM_FAILED");
    }
  });
});

test("mixed and all-failed outcomes retain one truthful record per subject and exit nonzero", async () => {
  await withFixture(async (f, run) => {
    f.state.outcomes = { QQQ: { outcome: "REUSED" }, IWM: { outcome: "UNMATCHED" } };
    const r = await run(["fetch", "SPY", "QQQ", "IWM"]);
    assert.equal(r.status, 1);
    assert.deepEqual(records(r.stdout).map(r => r.outcome), ["NEWLY_ACQUIRED", "REUSED", "UNMATCHED"]);
    assert.match(r.stderr, /IWM: FAILED UNMATCHED/); assert.match(r.stderr, /2\/3 fulfilled/);
    f.state.outcomes = { SPY: { outcome: "CONTACT_NOT_PERMITTED" } };
    const failed = await run(["fetch", "SPY", "--force"]);
    assert.equal(failed.status, 1); assert.match(failed.stderr, /CONTACT_NOT_PERMITTED/);
  });
});

test("request-wide invalid/auth/authorization/server errors have diagnostics but no subject records", async () => {
  await withFixture(async (f, run) => {
    for (const [status, code] of [[400, "MALFORMED_REQUEST"], [401, "UNAUTHENTICATED"],
      [403, "FORBIDDEN"], [415, "UNSUPPORTED_MEDIA_TYPE"], [422, "INVALID_REQUEST"],
      [500, "INTERNAL_ERROR"], [503, "CAPABILITY_UNAVAILABLE"]]) {
      f.state.status = status;
      f.state.body = { type: `urn:wheelwright:problem:${code.toLowerCase()}`, title: code,
        status, code, requestId: REQUEST_ID, detail: "fixture rejection",
        invalidParams: [{ name: "/subjects", reason: "fixture invalid subject" }] };
      const r = await run(["fetch", "SPY", "--force"]);
      assert.equal(r.status, 1); assert.equal(r.stdout, "");
      assert.ok(r.stderr.includes(code)); assert.ok(r.stderr.includes(REQUEST_ID));
      assert.match(r.stderr, /\/subjects: fixture invalid subject/);
      assert.doesNotMatch(r.stderr, /fetch complete|HTTP \d/);
      assert.ok(!r.stderr.includes(TOKEN));
    }
  });
});

test("credentials never appear in server success, failure, or transport exception output", async () => {
  await withFixture(async (f, run) => {
    f.state.body = acquisition(["SPY"]);
    f.state.body.results[0].observation.facts.description = TOKEN;
    let r = await run(["fetch", "-v", "SPY"]);
    assert.equal(r.status, 0); assert.ok(!r.stdout.includes(TOKEN)); assert.ok(!r.stderr.includes(TOKEN));
    f.state.status = 401;
    f.state.body = { code: "UNAUTHENTICATED", detail: `bad token ${TOKEN}`, requestId: REQUEST_ID };
    r = await run(["fetch", "SPY"]);
    assert.equal(r.status, 1); assert.match(r.stderr, /\[REDACTED\]/); assert.ok(!r.stderr.includes(TOKEN));
  });
  await assert.rejects(fetchEvidence(["SPY"], { token: TOKEN,
    fetchImpl: async () => { throw new Error(`headers: ${TOKEN}`); } }), error => !error.message.includes(TOKEN));
});

test("contradictory, missing, reordered and malformed results never certify success", async () => {
  const mutations = [
    r => { r.results = []; }, r => { r.mode = "FORCE"; },
    r => { r.results[0].fulfilled = false; }, r => { r.results[0].priorRetained = true; },
    r => { r.results[0].observation = null; }, r => { r.results[0].subject.symbol = "QQQ"; },
    r => { r.results[0].outcome = "UNKNOWN"; }, r => { r.results[0].failure = {}; },
    r => { r.results[0].observation.subject.symbol = "QQQ"; },
  ];
  for (const mutate of mutations) {
    const r = acquisition(["SPY"]); mutate(r);
    assert.throws(() => parseAcquisitionResponse(r, ["SPY"], "ORDINARY"), /invalid v2/);
  }
  const reused = acquisition(["SPY"], "FORCE", { SPY: { outcome: "REUSED" } });
  assert.throws(() => parseAcquisitionResponse(reused, ["SPY"], "FORCE"), /invalid v2/);
  await withFixture(async (f, run) => {
    for (const body of ["not JSON", {}, acquisition(["QQQ"])]) {
      f.state.body = body;
      const r = await run(["fetch", "SPY"]);
      assert.equal(r.status, 1); assert.equal(r.stdout, ""); assert.match(r.stderr, /invalid/);
    }
  });
});

test("terminal rendering distinguishes acquisition/reuse/failure and quiet never hides failure", () => {
  const r = acquisition(["SPY", "QQQ", "IWM"], "ORDINARY",
    { QQQ: { outcome: "REUSED" }, IWM: { outcome: "UPSTREAM_FAILED", retained: true } });
  const normal = presentFetchResult(r, false, true, true);
  assert.equal(normal.stdout, "");
  assert.match(normal.stderr, /SPY: NEWLY_ACQUIRED/); assert.match(normal.stderr, /QQQ: REUSED/);
  const quiet = presentFetchResult(r, true, true, true);
  assert.match(quiet.stderr, /IWM: FAILED/); assert.doesNotMatch(quiet.stderr, /SPY:|QQQ:/);
  assert.deepEqual(presentFetchResult(acquisition(["SPY"]), true, true, true), { stdout: "", stderr: "" });
});

test("remote Bearer transport requires HTTPS and redirects cannot forward the credential", async () => {
  let calls = 0;
  await assert.rejects(fetchEvidence(["SPY"], { token: TOKEN, base: "http://example.com",
    fetchImpl: async () => { calls++; } }), /HTTPS/);
  assert.equal(calls, 0);
  await fetchEvidence(["SPY"], { token: TOKEN, base: "https://example.com", fetchImpl: async (url, opts) => {
    assert.equal(url.pathname, "/v2/quotes"); assert.equal(opts.redirect, "error");
    return { ok: true, json: async () => acquisition(["SPY"]) };
  } });
});

test("fetch has no legacy selector/refresh helpers or option-chain orchestration", async () => {
  for (const name of ["V2QuotesController", "DirectQuoteService", "TradierDirectQuoteSource"]) {
    const backend = await readFile(new URL(
      `../evidence-service-java/src/main/java/com/wheelwright/evidence/v2/${name}.java`, import.meta.url), "utf8");
    assert.doesNotMatch(backend, /AcquisitionWorker|forceAcquireSymbols|acquireSymbolTiered|\.getChains?\s*\(|\.getExpirations\s*\(|\.setMonitoredSymbols\s*\(/,
      `${name} must remain independent of legacy enrollment and option-chain acquisition`);
  }
  const source = await readFile(cli, "utf8");
  assert.doesNotMatch(source, /\/api\/evidence\/(?:refresh|monitored)|forceAcquireSymbols|acquireSymbolTiered|EXPERIMENTAL_SEED|resolveFetchSelection/);
  // Existing read-only prices retains its independent v1 route. Fetch cannot
  // invoke it: every black-box acquisition above permits only one /v2/quotes call.
  const fetchPath = source.slice(source.indexOf('if (parsed.command === "fetch")'));
  assert.doesNotMatch(fetchPath.split('if (parsed.command === "prices"')[0], /readObservedPrices|quoteUrl|chain|enroll|monitored/i);
});

test("large and invalid requests stay one batch, with no CLI retries or splitting", async () => {
  await withFixture(async (f, run) => {
    f.state.status = 422;
    f.state.body = { code: "INVALID_REQUEST", detail: "at most 30 subjects", requestId: REQUEST_ID };
    const symbols = Array.from({ length: 31 }, (_, i) => `S${i}`);
    let r = await run(["fetch", ...symbols]);
    assert.equal(r.status, 1); assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].body.subjects.length, 31);
    r = await run(["fetch", "bad symbol"]);
    assert.equal(r.status, 1); assert.equal(f.calls.length, 2);
    assert.equal(f.calls[1].body.subjects[0].symbol, "BAD SYMBOL");
  });
});
