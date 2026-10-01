import assert from "node:assert/strict";
import test from "node:test";
import { EXPIRATION, GREEK_FIELDS, greekRows, observeDxlink, parseProbe, run,
  selectProbeContracts, summarizeProbe } from "./tastytrade-delta-probe.mjs";

const item = (strike) => ({ symbol: "XSP   261120P" + String(strike * 1000).padStart(8, "0"),
  "streamer-symbol": ".XSP261120P" + strike, "root-symbol": "XSP",
  "expiration-date": EXPIRATION, "strike-price": String(strike), "option-type": "P" });
const chain = { data: { items: [item(750), item(745), item(755), item(740), item(760),
  { ...item(765), "expiration-date": "2026-12-18" }] } };
const contracts = selectProbeContracts(chain, parseProbe(["XSP", "--center", "750"]));

test("invalid or undeclared input stops before credentials and network", async () => {
  const never = () => { throw Error("network was accessed"); };
  for (const argv of [[], ["EWZ", "--center", "50"], ["XSP", "--center", "0"],
    ["XSP", "--center", "750", "--expiration", "2026-12-18"]]) {
    const errors = [];
    assert.equal(await run(argv, { env: {}, fetchImpl: never, err: (s) => errors.push(s) }), 1);
    assert.match(errors[0], /Usage:/);
  }
  assert.deepEqual(parseProbe(["TLT", "--center", "77.5"]), {
    root: "TLT", center: "77.5", expiration: EXPIRATION, count: 5, interval_seconds: 20 });
});

test("five exact-expiration puts are selected deterministically by declared center", () => {
  assert.deepEqual(contracts.map((item) => Number(item.strike_price)), [750, 745, 755, 740, 760]);
  assert.ok(contracts.every((contract) => contract.expiration_date === EXPIRATION));
  assert.throws(() => selectProbeContracts({ data: { items: chain.data.items.slice(0, 4) } },
    parseProbe(["XSP", "--center", "750"])), /fewer than five puts/);
  assert.throws(() => selectProbeContracts({ data: { items: [...chain.data.items, item(750)] } },
    parseProbe(["XSP", "--center", "750"])), /ambiguous put identity/);
});

test("Greek rows preserve broker time, delta, and positional raw event", () => {
  const row = ["Greeks", ".XSP261120P750", 1790863200000, -0.41, 0.22];
  const second = ["Greeks", ".XSP261120P745", 1790863200001, -0.37, 0.23];
  assert.deepEqual(greekRows({ type: "FEED_DATA", channel: 3, data: ["Greeks", row] }), [{
    raw: row, event_symbol: row[1], event_time: row[2], delta: row[3] }]);
  assert.deepEqual(greekRows({ type: "FEED_DATA", channel: 3,
    data: ["Greeks", [...row, ...second]] }).map((event) => event.event_symbol),
  [row[1], second[1]]);
  assert.throws(() => greekRows({ type: "FEED_DATA", channel: 3,
    data: ["Greeks", [...row, "extra"]] }), /malformed Greek row length/);
  assert.deepEqual(greekRows({ type: "FEED_DATA", channel: 3, data: ["Quote", row] }), []);
  assert.deepEqual(GREEK_FIELDS, ["eventType", "eventSymbol", "time", "delta", "volatility"]);
});

test("missing, stale, invalid and repeated events cannot be silently substituted", () => {
  const ended = "2026-10-01T16:00:00.000Z";
  const base = { event_symbol: contracts[0].streamer_symbol, delta: -0.4,
    event_time: Date.parse(ended) - 1000, received_at_utc: ended, raw: [] };
  const events = [base, { ...base, delta: -0.39 },
    { ...base, delta: -0.9, event_time: Date.parse(ended) - 1500 },
    { ...base, event_symbol: contracts[1].streamer_symbol, event_time: Date.parse(ended) - 600000 },
    { ...base, event_symbol: contracts[2].streamer_symbol, delta: null }];
  const result = summarizeProbe(contracts, events, ended, "2026-10-01T15:59:58.000Z");
  assert.equal(result.contracts_subscribed, 5);
  assert.equal(result.contracts_with_greek_event, 3);
  assert.equal(result.contracts_with_usable_delta, 1);
  assert.equal(result.contracts_with_repeated_events, 1);
  assert.equal(result.contracts_with_post_subscription_event, 2);
  assert.equal(result.complete_bounded_set_for_delta, false);
  assert.equal(result.contracts[0].latest_delta, -0.39);
  assert.equal(result.contracts[0].latest_event_age_ms_at_end, 1000);
  assert.equal(result.contracts[1].latest_delta, null);
  assert.equal(result.contracts[3].event_count, 0);
});

test("bounded DXLink handshake subscribes only declared streamer symbols and ends", async () => {
  class FakeSocket {
    constructor() { this.listeners = new Map(); this.sent = []; queueMicrotask(() => this.emit("open")); }
    addEventListener(name, fn) { this.listeners.set(name, fn); }
    emit(name, value) { this.listeners.get(name)?.(value); }
    send(text) {
      const frame = JSON.parse(text); this.sent.push(frame);
      const response = frame.type === "SETUP" ? { type: "AUTH_STATE", state: "UNAUTHORIZED" } :
        frame.type === "AUTH" ? { type: "AUTH_STATE", state: "AUTHORIZED" } :
        frame.type === "CHANNEL_REQUEST" ? { type: "CHANNEL_OPENED", channel: 3 } :
        frame.type === "FEED_SETUP" ? { type: "FEED_CONFIG", channel: 3,
          eventFields: { Greeks: GREEK_FIELDS } } : null;
      if (response) queueMicrotask(() => this.emit("message", { data: JSON.stringify(response) }));
      if (frame.type === "FEED_SUBSCRIPTION") {
        const row = ["Greeks", contracts[0].streamer_symbol, Date.now(), -0.4, 0.2];
        queueMicrotask(() => this.emit("message", { data: JSON.stringify({
          type: "FEED_DATA", channel: 3, data: ["Greeks", row] }) }));
      }
    }
    close() { this.closed = true; }
  }
  const observed = await observeDxlink("wss://example.invalid", "token-marker", contracts,
    { WebSocketImpl: FakeSocket, durationMs: 5 });
  assert.equal(observed.events.length, 1);
  assert.equal(observed.events[0].raw[3], -0.4);
  assert.ok(observed.subscribed_at_utc);
  assert.ok(observed.ended_at_utc);
  assert.doesNotMatch(JSON.stringify(observed), /token-marker/);
});

test("full probe uses fixed read endpoints, one OAuth exchange, and secret-safe output", async () => {
  const calls = []; const output = [];
  const env = { TASTYTRADE_CLIENT_ID: "client-marker", TASTYTRADE_CLIENT_SECRET: "secret-marker",
    TASTYTRADE_REFRESH_TOKEN: "refresh-marker" };
  const reply = (body) => ({ ok: true, status: 200, json: async () => body });
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/oauth/token")) return reply({ access_token: "access-marker" });
    if (url.endsWith("/option-chains/XSP")) return reply(chain);
    if (url.endsWith("/api-quote-tokens")) return reply({ data: {
      token: "stream-token-marker", "dxlink-url": "wss://tasty-openapi-dxlink-md-ws.dxfeed.com/realtime" } });
    throw Error("unapproved request");
  };
  class FakeSocket {
    constructor() { this.listeners = new Map(); queueMicrotask(() => this.emit("open")); }
    addEventListener(name, fn) { this.listeners.set(name, fn); }
    emit(name, value) { this.listeners.get(name)?.(value); }
    send(text) {
      const frame = JSON.parse(text);
      const response = frame.type === "SETUP" ? { type: "AUTH_STATE", state: "UNAUTHORIZED" } :
        frame.type === "AUTH" ? { type: "AUTH_STATE", state: "AUTHORIZED" } :
        frame.type === "CHANNEL_REQUEST" ? { type: "CHANNEL_OPENED", channel: 3 } :
        frame.type === "FEED_SETUP" ? { type: "FEED_CONFIG", channel: 3,
          eventFields: { Greeks: GREEK_FIELDS } } : null;
      if (response) queueMicrotask(() => this.emit("message", { data: JSON.stringify(response) }));
      if (frame.type === "FEED_SUBSCRIPTION") {
        assert.deepEqual(frame.add.map((item) => item.symbol),
          contracts.map((item) => item.streamer_symbol));
        const batch = frame.add.flatMap((item) => ["Greeks", item.symbol, Date.now(), -0.4, 0.2]);
        queueMicrotask(() => this.emit("message", { data: JSON.stringify({
          type: "FEED_DATA", channel: 3, data: ["Greeks", batch] }) }));
      }
    }
    close() {}
  }
  assert.equal(await run(["XSP", "--center", "750"], { env, fetchImpl,
    WebSocketImpl: FakeSocket, durationMs: 5, out: (s) => output.push(s) }), 0);
  const result = JSON.parse(output[0]);
  assert.equal(result.summary.contracts_with_usable_delta, 5);
  assert.deepEqual(calls.map(({ url }) => url), [
    "https://api.tastyworks.com/oauth/token",
    "https://api.tastyworks.com/option-chains/XSP",
    "https://api.tastyworks.com/api-quote-tokens",
  ]);
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "GET", "GET"]);
  assert.ok(calls.every(({ options }) => options.redirect === "error" &&
    /^[^/]+\/[^/]+$/.test(options.headers["User-Agent"])));
  assert.doesNotMatch(output[0], /client-marker|secret-marker|refresh-marker|access-marker|stream-token-marker/);
});
