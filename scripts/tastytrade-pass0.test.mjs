import test from "node:test";
import assert from "node:assert/strict";
import { ROOTS, parsePass0, calendarDte, describeChain, anchorFromQuote, run } from "./tastytrade-pass0.mjs";
import { PRODUCTION_BASE_URL } from "./tastytrade.mjs";

const now = () => new Date("2026-10-01T17:30:00.000Z");
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status,
  json: async () => body });
const option = (expiration, type, strike, root = "XSP") => ({ active: true,
  "root-symbol": root, "underlying-symbol": root, "expiration-date": expiration,
  "option-type": type, "strike-price": String(strike),
  symbol: `${root} ${expiration} ${type} ${strike}` });
const chain = (...items) => ({ data: { items }, pagination: { "total-items": items.length,
  "total-pages": 1, "current-item-count": items.length } });
const quote = (root, instrument = "Index", updated = "2026-10-01T17:29:00.000Z") =>
  ({ data: { items: [{ symbol: root, "instrument-type": instrument,
    mark: "100", "updated-at": updated, bid: "99.9", ask: "100.1" }] } });

test("fixed population and malformed invocation stop before authentication or network", async () => {
  assert.equal(ROOTS.length, 30);
  assert.deepEqual([ROOTS[0], ROOTS.at(-1)], ["XSP", "DRAM"]);
  assert.deepEqual(parsePass0([]), { help: false });
  const never = () => { throw Error("credentials or network accessed"); };
  const outputs = [];
  assert.equal(await run(["--help"], { fetchImpl: never, env: {}, out: (x) => outputs.push(x) }), 0);
  assert.equal(await run(["SPY"], { fetchImpl: never, env: {}, err: () => {} }), 2);
  assert.match(outputs[0], /Fixed 30-root/);
});

test("calendar DTE, full eligible window and earlier-expiration tie are auditable", () => {
  assert.equal(calendarDte("2026-11-20", "2026-10-01"), 50);
  const body = chain(option("2026-11-13", "P", 95), option("2026-11-13", "P", 100),
    option("2026-11-13", "P", 105), option("2026-11-17", "P", 95),
    option("2026-11-17", "P", 100), option("2026-11-17", "P", 105),
    option("2026-11-20", "P", 100), option("2026-11-10", "P", 100));
  const result = describeChain(body, "XSP", 100, "2026-10-01");
  assert.equal(result.status, "ELIGIBLE");
  assert.deepEqual(result.eligible_expirations.map((e) => e.calendar_dte), [40, 43, 47, 50]);
  assert.deepEqual(result.chosen_expiration, { expiration: "2026-11-13", calendar_dte: 43 });
  assert.equal(result.geometry.nearest_below_anchor, 95);
  assert.equal(result.geometry.nearest_at_or_above_anchor, 100);
  assert.equal(result.geometry.spacing.below_to_at_or_above, 5);
  assert.equal(result.geometry.listed_put_contracts.length, 3);
});

test("no expiration, no puts, and unbracketed anchor are distinct NO_SPECIMEN states", () => {
  assert.equal(describeChain(chain(option("2026-12-01", "P", 95)), "XSP", 100,
    "2026-10-01").reason, "no_expiration_in_40_to_50_dte_window");
  assert.equal(describeChain(chain(option("2026-11-13", "C", 100)), "XSP", 100,
    "2026-10-01").reason, "chosen_expiration_has_no_listed_puts");
  const result = describeChain(chain(option("2026-11-13", "P", 101),
    option("2026-11-13", "P", 102)), "XSP", 100, "2026-10-01");
  assert.equal(result.status, "NO_SPECIMEN");
  assert.equal(result.reason, "puts_do_not_bracket_underlying_anchor");
  assert.equal(result.geometry.total_listed_put_contracts, 2);
});

test("partial or malformed chain and missing or stale mark fail as evidence", () => {
  assert.throws(() => describeChain({ data: { items: [option("2026-11-13", "P", 95)] },
    pagination: { "total-items": 3 } }, "XSP", 100, "2026-10-01"), /chain_incomplete_response/);
  assert.throws(() => describeChain(chain({ ...option("2026-11-13", "P", 95),
    "strike-price": "bad" }), "XSP", 100, "2026-10-01"), /chain_malformed_put_identity/);
  assert.throws(() => anchorFromQuote(quote("XSP", "Index", "2026-10-01T17:00:00Z"),
    "XSP", "index", now().toISOString()), /underlying_source_time_stale_or_future/);
  assert.throws(() => anchorFromQuote({ data: { items: [{ symbol: "XSP", mark: null }] } },
    "XSP", "index", now().toISOString()), /underlying_missing_or_wrong_instrument/);
});

test("one OAuth and only fixed production reads; failures retain every root and hide secrets", async () => {
  const calls = [];
  const out = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method, redirect: options.redirect, headers: options.headers });
    if (url.endsWith("/oauth/token")) return reply(200, { access_token: "private-token" });
    const root = url.match(/(?:\/option-chains\/|(?:equity|index)\[\]=)([A-Z]+)$/)?.[1];
    if (!root) throw Error("unexpected endpoint");
    if (url.includes("/option-chains/")) {
      if (root === "SPY") return reply(404, {});
      if (root === "QQQ") return reply(503, { secret: "private-secret" });
      return reply(200, chain(option("2026-11-13", "P", 95, root),
        option("2026-11-13", "P", 100, root)));
    }
    return reply(200, quote(root, root === "XSP" ? "Index" : "Equity"));
  };
  const code = await run([], { fetchImpl, now, env: { TASTYTRADE_CLIENT_ID: "id",
    TASTYTRADE_CLIENT_SECRET: "private-secret", TASTYTRADE_REFRESH_TOKEN: "private-refresh" },
  out: (x) => out.push(x), err: () => {} });
  const result = JSON.parse(out[0]);
  assert.equal(code, 1);
  assert.deepEqual(result.starting_population, ROOTS);
  assert.deepEqual(result.results.map((r) => r.root), ROOTS);
  assert.equal(result.counts.ELIGIBLE, 28);
  assert.equal(result.counts.NO_SPECIMEN, 1);
  assert.equal(result.counts.EVIDENCE_FAILURE, 1);
  assert.equal(result.results[1].reason, "broker_reports_no_option_chain");
  assert.equal(result.results[2].reason, "chain_http_503");
  assert.equal(calls.length, 61);
  assert.deepEqual([...new Set(calls.map((c) => c.method))].sort(), ["GET", "POST"]);
  assert.ok(calls.every((c) => c.url.startsWith(PRODUCTION_BASE_URL) && c.redirect === "error"));
  assert.ok(calls.every((c) => /^wheelwright-tastytrade-pass0\/0\.1$/.test(c.headers["User-Agent"])));
  assert.doesNotMatch(out[0], /private-token|private-secret|private-refresh|Bearer/);
});
