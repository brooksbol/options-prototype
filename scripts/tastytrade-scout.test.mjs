import assert from "node:assert/strict";
import test from "node:test";
import { main, parseCommand, quoteBatches, PRODUCTION_BASE_URL } from "./tastytrade.mjs";
import { buildScoutObservation, selectSpecimens } from "./tastytrade-scout.mjs";

const env = { TASTYTRADE_CLIENT_ID: "client-marker", TASTYTRADE_CLIENT_SECRET: "secret-marker",
  TASTYTRADE_REFRESH_TOKEN: "refresh-marker" };
const args = ["scout", "XSP", "--expiration", "2026-11-20", "--short-put-strike", "600",
  "--widths", "5,10", "--underlying-type", "index"];
const selection = parseCommand(args);
const contract = (strike) => ({ "root-symbol": "XSP", "underlying-symbol": "XSP",
  "expiration-date": "2026-11-20", "strike-price": String(strike), "option-type": "P",
  "shares-per-contract": 100, "settlement-type": "PM", "option-chain-type": "Standard",
  symbol: "XSP   261120P" + String(strike * 1000).padStart(8, "0") });
const chain = { data: { items: [contract(590), contract(595), contract(600), contract(605),
  { ...contract(600), "expiration-date": "2026-12-18", symbol: "other" }] } };
const symbols = [590, 595, 600].map((strike) => contract(strike).symbol);
const quotes = { data: { items: symbols.map((symbol) => ({ symbol, bid: "1.05", ask: "1.25",
  "bid-size": "3", "ask-size": "7", "updated-at": "2026-10-01T14:00:00.000Z" })) } };
const metrics = { data: { items: [{ symbol: "XSP", "liquidity-rating": "4", "liquidity-rank": "0.8" }] } };
const underlyingQuote = { data: { items: [{ symbol: "XSP", bid: "599", ask: "601",
  "updated-at": "2026-10-01T14:00:00.000Z" }] } };
const observedAt = "2026-10-01T14:00:05.000Z";
const observation = (overrides = {}) => buildScoutObservation({ selection, chain, metrics, underlyingQuote,
  quoteBatches: [quotes], timings: [], observedAt, ...overrides });
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("scout help and malformed parameters never authenticate", async () => {
  const never = () => { throw Error("should not access credentials or network"); };
  for (const argv of [["scout", "--help"], ["scout", "XSP"], ["scout", "XSP", "--bad", "x"],
    ["scout", "xsp", ...args.slice(2)], [...args, "TLT"], [...args.slice(0, 6), "0", ...args.slice(7)]]) {
    const output = []; const errors = [];
    const code = await main(argv, { env: {}, readFile: never, fetchImpl: never,
      out: (s) => output.push(s), err: (s) => errors.push(s) });
    assert.equal(code, argv[1] === "--help" ? 0 : 2);
    assert.match((output[0] ?? errors[0]), /Usage: tt scout/);
  }
});

test("exact contracts and widths are selected without adding another root or expiration", () => {
  const specimens = selectSpecimens(chain, selection);
  assert.deepEqual(specimens.map((item) => item.width), ["5", "10"]);
  assert.deepEqual(specimens.map((item) => item.legs.map((leg) => leg.contract["strike-price"])),
    [["600", "595"], ["600", "590"]]);
  assert.throws(() => selectSpecimens(chain, { ...selection, widths: ["15"] }), /cannot be constructed/);
  assert.throws(() => selectSpecimens(chain, { ...selection, expiration: "2026-11-21" }), /no eligible expiration/);
});

test("JSON observation keeps raw broker facts and explicit derived provenance", () => {
  const result = observation();
  assert.equal(result.status, "complete");
  assert.equal(result.selection.root, "XSP");
  assert.equal(result.selection.rule, "exact_expiration_exact_short_put_strike_put_credit_vertical_widths");
  assert.equal(result.broker.market_metrics.broker_liquidity_rating, "4");
  assert.equal(result.broker.underlying.price_evidence.bid, "599");
  assert.equal(result.broker.specimens[0].legs[0].contract.symbol, contract(600).symbol);
  assert.equal(result.broker.specimens[0].legs[0].quote.bid_size, "3");
  assert.equal(result.broker.specimens[0].legs[0].quote.updated_at, "2026-10-01T14:00:00.000Z");
  assert.equal(result.derived.calendar_dte_utc, 50);
  assert.equal(result.derived.quote_timestamp_span_ms, 0);
  assert.doesNotMatch(JSON.stringify(result), /package_bid|package_ask|package_mid|exit_reliability|score/);
});

test("missing, one-sided, and stale quotes remain visible as incomplete evidence", () => {
  const partial = { data: { items: [
    { ...quotes.data.items[0], ask: null, "ask-size": null },
    { ...quotes.data.items[1], "updated-at": "2026-09-30T14:00:00Z" },
  ] } };
  const result = observation({ quoteBatches: [partial] });
  assert.equal(result.status, "incomplete");
  assert.equal(result.broker.specimens[1].legs[1].quote.ask, null);
  assert.equal(result.broker.specimens[1].legs[1].quote.ask_size, null);
  assert.ok(result.issues.some((issue) => issue.startsWith("missing_quote:")));
  assert.ok(result.issues.some((issue) => issue.startsWith("missing_ask:")));
  assert.ok(result.issues.some((issue) => issue.startsWith("quote_older_than_15m:")));
  assert.equal(result.derived.quote_timestamp_span_ms, null);
});

test("quote batching caps each request at 100 symbols", () => {
  const batches = quoteBatches(Array.from({ length: 205 }, (_, i) => "SYM" + i));
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 5]);
  assert.throws(() => quoteBatches(["A", "A"]), /invalid quote symbols/);
});

test("a 101-contract specimen set uses two quote reads and refuses a partial batch", async () => {
  const many = Array.from({ length: 101 }, (_, i) => contract(200 - i));
  const wideArgs = ["scout", "XSP", "--expiration", "2026-11-20", "--short-put-strike", "200",
    "--widths", Array.from({ length: 100 }, (_, i) => String(i + 1)).join(","), "--underlying-type", "index"];
  const quoteCalls = [];
  const output = [];
  const fetchImpl = async (url) => {
    if (url.endsWith("/oauth/token")) return reply(200, { access_token: "access-marker" });
    if (url.endsWith("/option-chains/XSP")) return reply(200, { data: { items: many } });
    if (url.includes("equity-option[]=")) {
      const batch = new URL(url).searchParams.getAll("equity-option[]");
      quoteCalls.push(batch);
      return reply(200, { data: { items: batch.slice(0, quoteCalls.length === 2 ? -1 : undefined)
        .map((symbol) => ({ symbol, bid: "1", ask: "2", "bid-size": "1", "ask-size": "1",
          "updated-at": observedAt })) } });
    }
    if (url.includes("index[]=")) return reply(200, underlyingQuote);
    return reply(200, metrics);
  };
  assert.equal(await main(wideArgs, { env, fetchImpl, out: (s) => output.push(s),
    now: () => new Date(observedAt) }), 1);
  assert.deepEqual(quoteCalls.map((batch) => batch.length), [100, 1]);
  const result = JSON.parse(output[0]);
  assert.equal(result.status, "incomplete");
  assert.ok(result.issues.includes("quote_response_incomplete"));
});

test("scout uses only allowlisted production GETs after one OAuth and exports JSON", async () => {
  const calls = []; const output = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/oauth/token")) return reply(200, { access_token: "access-marker" });
    if (url.endsWith("/option-chains/XSP")) return reply(200, chain);
    if (url.includes("equity-option[]=")) return reply(200, quotes);
    if (url.includes("index[]=")) return reply(200, underlyingQuote);
    if (url.includes("/market-metrics?")) return reply(200, metrics);
    throw Error("unexpected URL");
  };
  assert.equal(await main(args, { env, fetchImpl, out: (s) => output.push(s),
    now: () => new Date(observedAt) }), 0);
  const result = JSON.parse(output[0]);
  assert.equal(result.status, "complete");
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "GET", "GET", "GET", "GET"]);
  assert.ok(calls.every(({ url, options }) => url.startsWith(PRODUCTION_BASE_URL) &&
    options.redirect === "error" && /^[^/]+\/[^/]+$/.test(options.headers["User-Agent"])));
  assert.ok(calls.slice(1).every(({ options }) => options.headers.Authorization === "Bearer access-marker"));
  assert.ok(calls.every(({ url }) => !url.includes("TLT")));
  assert.doesNotMatch(output[0], /access-marker|secret-marker|refresh-marker/);
});

test("incomplete live response exits nonzero and API errors never print secrets", async () => {
  const output = []; const errors = [];
  const fetchImpl = async (url) => {
    if (url.endsWith("/oauth/token")) return reply(200, { access_token: "access-marker" });
    if (url.endsWith("/option-chains/XSP")) return reply(200, chain);
    if (url.includes("equity-option[]=")) return reply(200, { data: { items: [] } });
    if (url.includes("index[]=")) return reply(200, underlyingQuote);
    return reply(200, metrics);
  };
  assert.equal(await main(args, { env, fetchImpl, out: (s) => output.push(s),
    now: () => new Date(observedAt) }), 1);
  assert.equal(JSON.parse(output[0]).status, "incomplete");
  assert.equal(await main(args, { env, fetchImpl: async (url) => url.endsWith("/oauth/token") ?
    reply(200, { access_token: "access-marker" }) :
    reply(500, { error: { message: "secret-marker refresh-marker access-marker" } }),
  err: (s) => errors.push(s) }), 1);
  assert.doesNotMatch(errors.join("\n"), /secret-marker|refresh-marker|access-marker/);
});
