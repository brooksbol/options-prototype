import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { credentials, main, parseCommand, PRODUCTION_BASE_URL,
  readComplexOrders, readOrders, renderAccounts, renderComplexOrders, renderPositions } from "./tastytrade.mjs";
import { renderLive } from "./tastytrade-live.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const env = { TASTYTRADE_CLIENT_ID: "client-marker", TASTYTRADE_CLIENT_SECRET: "secret-marker",
  TASTYTRADE_REFRESH_TOKEN: "refresh-marker" };
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const page = (offset, totalPages, totalItems, items) => ({ data: { items }, pagination: {
  "page-offset": offset, "total-pages": totalPages, "total-items": totalItems } });
const order = { id: "101", status: "Live", "order-type": "Limit", price: "0.21",
  "price-effect": "Debit", "time-in-force": "GTC", "updated-at": 1790799627906,
  legs: [{ action: "Buy to Close", quantity: "1", symbol: "XLE 261120P00059000" }] };
const complex = { id: "900", type: "OCO", orders: [order, { ...order, id: "102", status: "Cancelled" }],
  "related-orders": [{ id: "99", status: "Replaced" }] };
const positions = { data: { items: [{ "account-number": "5WX01234", symbol: "XLE 261120P00059000",
  "instrument-type": "Equity Option", "quantity-direction": "Short", quantity: 1,
  "average-open-price": "0.75", "updated-at": "2026-09-30T18:00:00Z" }] } };

test("help and invalid arguments finish before credentials or HTTP", async () => {
  const helpCases = [[], ["--help"], ["-h"], ["help"], ["accounts", "--help"],
    ["positions", "--help"], ["live", "--help"]];
  const invalidCases = [["wat"], ["accounts", "--json"], ["positions", "--json"],
    ["positions", "--account"], ["positions", "--account", "../bad"], ["complex-orders"],
    ["live", "--account"], ["live", "--json"], ["live", "--tsv", "--tsv"],
    ["live", "--account", "5WX01234", "--account", "5WX01234"]];
  const never = () => { throw Error("credentials or network accessed"); };
  for (const args of helpCases) {
    const output = [];
    assert.equal(await main(args, { env: {}, readFile: never, fetchImpl: never, out: (s) => output.push(s) }), 0);
    assert.match(output[0], /Usage: tt/);
  }
  for (const args of invalidCases) {
    const errors = [];
    assert.equal(await main(args, { env: {}, readFile: never, fetchImpl: never, err: (s) => errors.push(s) }), 2);
    assert.match(errors[0], /Usage: tt/);
  }
  assert.deepEqual(parseCommand(["positions", "--account", "5WX01234"]),
    { kind: "positions", account: "5WX01234" });
  assert.deepEqual(parseCommand(["positions"]), { kind: "positions" });
  assert.deepEqual(parseCommand(["live"]), { kind: "live" });
  assert.deepEqual(parseCommand(["live", "--tsv", "--account", "5WX01234"]),
    { kind: "live", account: "5WX01234", tsv: true });
});

const sampleTrade = (underlying, expiry, strikes, fillPrices, mids, target, stop) => {
  const symbols = strikes.map(([kind, strike]) =>
    `${underlying}  ${expiry}${kind}${String(Math.round(strike * 1000)).padStart(8, "0")}`);
  const directions = ["Long", "Short", "Short", "Long"];
  const holdings = symbols.map((symbol, i) => ({ "account-number": "5WX01234", symbol,
    "underlying-symbol": underlying, "instrument-type": "Equity Option", quantity: "1",
    "quantity-direction": directions[i], multiplier: "100",
    "average-daily-market-close-price": String(mids[i] + (underlying === "XLE" && i === 2 ? 0.01 : 0)),
    "expires-at": `20${expiry.slice(0, 2)}-${expiry.slice(2, 4)}-${expiry.slice(4, 6)}T21:00:00.000Z` }));
  const legs = (opening) => symbols.map((symbol, i) => ({ symbol, quantity: "1",
    action: opening ? (directions[i] === "Long" ? "Buy to Open" : "Sell to Open") :
      (directions[i] === "Long" ? "Sell to Close" : "Buy to Close"),
    ...(opening ? { fills: [{ quantity: "1", "fill-price": String(fillPrices[i]),
      "filled-at": "2026-09-30T16:50:00.000Z" }] } : {}) }));
  const opening = { id: `${underlying}-open`, status: "Filled", legs: legs(true) };
  const closing = { id: `${underlying}-bracket`, type: "OCO", orders: [
    { id: `${underlying}-target`, status: "Received", "order-type": "Limit", price: String(target),
      "price-effect": "Debit", legs: legs(false) },
    { id: `${underlying}-stop`, status: "Received", "order-type": "Stop Limit", price: String(stop),
      "price-effect": "Debit", legs: legs(false) }] };
  const quotes = symbols.map((symbol, i) => ({ symbol, bid: String(mids[i] - 0.01),
    ask: String(mids[i] + 0.01), mid: String(mids[i]), "updated-at": "2026-10-01T00:00:00.000Z" }));
  return { holdings, opening, closing, quotes };
};

const ewz = sampleTrade("EWZ", "261120", [["P", 31], ["P", 32], ["C", 42], ["C", 43]],
  [0.52, 0.71, 1.11, 0.88], [0.45, 0.65, 0.75, 0.62], 0.21, 0.53);
const xle = sampleTrade("XLE", "261016", [["P", 59], ["P", 59.5], ["C", 64.5], ["C", 65]],
  [0.32, 0.40, 0.45, 0.35], [0.36, 0.50, 0.52, 0.35], 0.09, 0.24);
const liveEvidence = { account: "5WX01234", holdings: [...ewz.holdings, ...xle.holdings],
  orders: [ewz.opening, xle.opening, ...ewz.closing.orders, ...xle.closing.orders],
  complexOrders: [ewz.closing, xle.closing],
  quotes: [...ewz.quotes, ...xle.quotes], now: new Date("2026-10-01T02:00:00.000Z") };

test("live summarizes two complete trades from fills and leg mids without historical order noise", () => {
  const oldRejected = { id: "old", type: "OCO", orders: [{ ...ewz.closing.orders[0], status: "Rejected" }] };
  const output = renderLive({ ...liveEvidence, complexOrders: [...liveEvidence.complexOrders, oldRejected] });
  assert.match(output, /^\nACCOUNT\s+SYMBOL\s+STRUCTURE\s+QTY\s+P\/L DAY\s+STATE\s+TOTAL G\/L\s+OPEN@\s+CLOSE@\s+TARGET CLOSE@\s+PROGRESS\s+OPENED\s+DTE\s+QUOTE/);
  assert.match(output, /XXXX1234\s+EWZ\s+Iron Condor\s+1\s+\$0\s+GREEN\s+\+\$9\s+0\.42 CR\s+0\.33\s+50% @ 0\.21; exp 11\/20\s+0\.12 above target\s+09\/30 \(0 days\)\s+51\s+2h/);
  assert.match(output, /XXXX1234\s+XLE\s+Iron Condor\s+1\s+\+\$1\s+RED\s+−\$13\s+0\.18 CR\s+0\.31\s+50% @ 0\.09; exp 10\/16\s+0\.22 above target\s+09\/30 \(0 days\)\s+16\s+2h/);
  assert.match(output, /2h\n$/);
  const [header, ewzRow, xleRow] = output.split("\n").slice(1, 4);
  for (const [heading, ewzValue, xleValue] of [["ACCOUNT", "XXXX1234", "XXXX1234"],
    ["SYMBOL", "EWZ", "XLE"], ["STRUCTURE", "Iron Condor", "Iron Condor"],
    ["P/L DAY", "$0", "+$1"],
    ["STATE", "GREEN", "RED"], ["TOTAL G/L", "+$9", "−$13"],
    ["OPEN@", "0.42 CR", "0.18 CR"], ["CLOSE@", "0.33", "0.31"],
    ["TARGET CLOSE@", "50% @ 0.21", "50% @ 0.09"],
    ["PROGRESS", "0.12 above target", "0.22 above target"], ["OPENED", "09/30", "09/30"]]) {
    assert.equal(ewzRow.indexOf(ewzValue), header.indexOf(heading));
    assert.equal(xleRow.indexOf(xleValue), header.indexOf(heading));
  }
  assert.doesNotMatch(output, /exits received|exit states|Received/);
  assert.doesNotMatch(output, /tastytrade production|live trades:|market quotes|5WX01234|indicative close|leg quotes:/);
  assert.doesNotMatch(output, /Rejected|#old|protected|winner|loser/i);
});

test("live colors complete economic segments and returns to white before DTE", () => {
  const plain = renderLive(liveEvidence);
  const colored = renderLive({ ...liveEvidence, color: true });
  assert.doesNotMatch(plain, /\x1b\[/);
  assert.match(colored, /^\n\x1b\[37mACCOUNT/);
  assert.match(colored, /\$0\s+\x1b\[32mGREEN\s+\+\$9\s*\x1b\[37m\s+0\.42 CR/);
  assert.match(colored, /\x1b\[32m\+\$1\s*\x1b\[37m\s+\x1b\[31mRED\s+−\$13\s*\x1b\[37m\s+0\.18 CR/);
  assert.match(colored, /2h\x1b\[0m\n$/);
  assert.equal(colored.replace(/\x1b\[(?:31|32|37|0)m/g, ""), plain);
});

test("P/L Day uses its own sign and withholds incomplete or stale evidence", () => {
  const losingHoldings = liveEvidence.holdings.map((item) => item.symbol === ewz.holdings[0].symbol ?
    { ...item, "average-daily-market-close-price": "0.47" } : item);
  const colored = renderLive({ ...liveEvidence, holdings: losingHoldings, color: true });
  assert.match(colored, /EWZ\s+Iron Condor\s+1\s+\x1b\[31m−\$2\s*\x1b\[37m\s+\x1b\[32mGREEN/);
  const missingHoldings = liveEvidence.holdings.map((item) => item.symbol === ewz.holdings[0].symbol ?
    { ...item, "average-daily-market-close-price": undefined } : item);
  assert.match(renderLive({ ...liveEvidence, holdings: missingHoldings }), /EWZ\s+Iron Condor\s+1\s+—\s+GREEN/);
  const staleQuotes = liveEvidence.quotes.map((quote) => ({ ...quote, "updated-at": "2026-09-29T00:00:00.000Z" }));
  assert.match(renderLive({ ...liveEvidence, quotes: staleQuotes }), /XLE\s+Iron Condor\s+1\s+—\s+UNKNOWN/);
});

test("QUOTE shows EOD only with broker session close and post-close leg quotes", () => {
  const quotes = liveEvidence.quotes.map((quote) => ({ ...quote,
    "updated-at": "2026-09-30T20:01:00.000Z" }));
  const now = new Date("2026-09-30T20:20:00.000Z");
  const close = "2026-09-30T20:00:00.000Z";
  assert.match(renderLive({ ...liveEvidence, quotes, now, sessionCloseAt: close }), /EOD\n$/);
  assert.match(renderLive({ ...liveEvidence, quotes, now }), /19m\n$/);
  const beforeClose = quotes.map((quote) => ({ ...quote, "updated-at": "2026-09-30T19:59:00.000Z" }));
  assert.match(renderLive({ ...liveEvidence, quotes: beforeClose, now, sessionCloseAt: close }), /21m\n$/);
});

test("a midpoint below target reports the gap without claiming a closing fill", () => {
  const quotes = liveEvidence.quotes.map((quote) => quote.symbol === xle.holdings[2].symbol ?
    { ...quote, bid: "0.28", ask: "0.30", mid: "0.29" } : quote);
  const output = renderLive({ ...liveEvidence, quotes });
  assert.match(output, /XLE.*GREEN.*0\.08\s+50% @ 0\.09; exp 10\/16\s+0\.01 below target; still held/);
  assert.doesNotMatch(output, /target reached|closed/);
});

test("an exit transition still appears in the optional NOTE column", () => {
  const target = { ...ewz.closing.orders[0], status: "Contingent" };
  const output = renderLive({ ...liveEvidence,
    orders: liveEvidence.orders.map((order) => order.id === target.id ? target : order),
    complexOrders: [{ ...ewz.closing, orders: [target, ewz.closing.orders[1]] }, xle.closing] });
  assert.match(output, /QUOTE\s+NOTE\s*\n/);
  assert.match(output, /EWZ.*exit transition: target Contingent, stop Received/);
});

test("OPENED counts elapsed New York calendar days from executed opening fills", () => {
  const nextDay = renderLive({ ...liveEvidence, now: new Date("2026-10-01T04:01:00.000Z") });
  assert.match(nextDay, /EWZ\s+Iron Condor\s+1\s+\$0\s+GREEN.*\s+09\/30 \(1 day\)\s+50\s+4h/);
  assert.match(nextDay, /XLE\s+Iron Condor\s+1\s+\+\$1\s+RED.*\s+09\/30 \(1 day\)\s+15\s+4h/);
  const missingFillTime = { ...ewz.opening, legs: ewz.opening.legs.map((leg) => ({ ...leg,
    fills: leg.fills.map(({ "filled-at": _at, ...fill }) => fill) })) };
  assert.throws(() => renderLive({ ...liveEvidence,
    orders: [missingFillTime, ...liveEvidence.orders.slice(1)] }), /opening fill evidence malformed/);
});

test("explicit TSV output has real tabs, no padding or ANSI, and a header with zero trades", () => {
  const tsv = renderLive({ ...liveEvidence, color: true, format: "tsv" });
  const lines = tsv.split("\n");
  assert.equal(lines.length, 3);
  assert.deepEqual(lines[0].split("\t"), ["ACCOUNT", "SYMBOL", "STRUCTURE", "QTY", "P/L DAY", "STATE",
    "TOTAL G/L", "OPEN@", "CLOSE@", "TARGET CLOSE@", "PROGRESS", "OPENED", "DTE", "QUOTE"]);
  assert.deepEqual(lines[1].split("\t"), ["XXXX1234", "EWZ", "Iron Condor", "1", "$0", "GREEN",
    "+$9", "0.42 CR", "0.33", "50% @ 0.21; exp 11/20", "0.12 above target", "09/30 (0 days)", "51", "2h"]);
  assert.deepEqual(lines[2].split("\t"), ["XXXX1234", "XLE", "Iron Condor", "1", "+$1", "RED",
    "−$13", "0.18 CR", "0.31", "50% @ 0.09; exp 10/16", "0.22 above target", "09/30 (0 days)", "16", "2h"]);
  assert.doesNotMatch(tsv, /\x1b\[|5WX01234|  +/);
  assert.equal(renderLive({ account: "5WX01234", holdings: [], orders: [], complexOrders: [],
    quotes: [], now: liveEvidence.now, format: "tsv" }), lines[0]);
});

test("live declines ambiguous opening evidence and withholds color for stale quotes", () => {
  assert.throws(() => renderLive({ ...liveEvidence, orders: [...liveEvidence.orders, { ...ewz.opening, id: "duplicate" }] }),
    /opening trade linkage is missing or ambiguous/);
  assert.throws(() => renderLive({ ...liveEvidence, orders: [...liveEvidence.orders,
    { ...ewz.closing.orders[0], id: "other-current-close" }] }),
    /additional or missing current closing orders/);
  const stale = liveEvidence.quotes.map((quote) => ({ ...quote, "updated-at": "2026-09-29T00:00:00.000Z" }));
  const output = renderLive({ ...liveEvidence, quotes: stale });
  assert.match(output, /UNKNOWN\s+—\s+0\.42 CR\s+—\s+50% @ 0\.21; exp 11\/20\s+quotes stale/);
  assert.doesNotMatch(output, /GREEN|RED|above target/);
  assert.throws(() => renderLive({ ...liveEvidence, quotes: liveEvidence.quotes.slice(1) }),
    /quote evidence missing or duplicated/);
});

test("live uses only allowlisted reads, one token, and sanitizes API errors", async () => {
  const calls = []; const output = [];
  const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/oauth/token")) return reply(200, { access_token: "access-marker" });
      if (url.endsWith("/customers/me/accounts")) return reply(200, { data: { items: [
        { account: { "account-number": "5WX01234" }, "authority-level": "owner" }] } });
      if (url.endsWith("/positions")) return reply(200, { data: { items: liveEvidence.holdings } });
      if (url.includes("/complex-orders?")) return reply(200, page(0, 1, 2, liveEvidence.complexOrders));
      if (url.includes("/orders?")) return reply(200, page(0, 1, liveEvidence.orders.length, liveEvidence.orders));
      if (url.includes("/market-data/by-type?")) return reply(200, { data: { items: liveEvidence.quotes } });
      if (url.endsWith("/market-time/equities/sessions/current")) return reply(200,
        { data: { "close-at": "2026-10-01T20:00:00.000Z" } });
      throw Error("unexpected endpoint");
    };
  const code = await main(["live"], { env, out: (s) => output.push(s), now: () => liveEvidence.now,
    fetchImpl, stdoutIsTTY: false });
  assert.equal(code, 0);
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "GET", "GET", "GET", "GET", "GET", "GET"]);
  assert.ok(calls.every(({ url, options }) => url.startsWith(PRODUCTION_BASE_URL) &&
    options.redirect === "error" && /^[^/]+\/[^/]+$/.test(options.headers["User-Agent"])));
  assert.ok(calls.slice(1).every(({ options }) => options.headers.Authorization === "Bearer access-marker"));
  assert.doesNotMatch(output.join("\n"), /access-marker|secret-marker|refresh-marker/);
  assert.match(output[0], /EWZ.*GREEN/);
  assert.doesNotMatch(output[0], /\x1b\[/);
  const ttyOutput = [];
  assert.equal(await main(["live"], { env, out: (s) => ttyOutput.push(s), now: () => liveEvidence.now,
    fetchImpl, stdoutIsTTY: true }), 0);
  assert.match(ttyOutput[0], /^\n\x1b\[37m/);
  assert.match(ttyOutput[0], /\$0\s+\x1b\[32mGREEN\s+\+\$9\s*\x1b\[37m\s+0\.42 CR/);
  assert.match(ttyOutput[0], /\x1b\[32m\+\$1\s*\x1b\[37m\s+\x1b\[31mRED\s+−\$13\s*\x1b\[37m\s+0\.18 CR/);
  assert.match(ttyOutput[0], /\x1b\[0m\n$/);
  const noColorOutput = [];
  assert.equal(await main(["live"], { env: { ...env, NO_COLOR: "1" },
    out: (s) => noColorOutput.push(s), now: () => liveEvidence.now,
    fetchImpl, stdoutIsTTY: true }), 0);
  assert.doesNotMatch(noColorOutput[0], /\x1b\[/);
  assert.match(noColorOutput[0], /GREEN.*RED/s);
  const tsvOutput = [];
  assert.equal(await main(["live", "--tsv"], { env, out: (s) => tsvOutput.push(s),
    now: () => liveEvidence.now, fetchImpl, stdoutIsTTY: true }), 0);
  assert.match(tsvOutput[0], /^ACCOUNT\tSYMBOL\t/);
  assert.doesNotMatch(tsvOutput[0], /\x1b\[/);
  await assert.rejects(readOrders(async (offset) => page(offset, 2, 2, [ewz.opening])),
    /duplicate or missing order identity/);
  const errors = [];
  assert.equal(await main(["live", "--account", "5WX01234"], { env, err: (s) => errors.push(s),
    fetchImpl: async (url) => reply(url.endsWith("/oauth/token") ? 200 : 500,
      url.endsWith("/oauth/token") ? { access_token: "access-marker" } :
        { error: { message: "secret-marker refresh-marker access-marker" } }) }), 1);
  assert.doesNotMatch(errors.join("\n"), /secret-marker|refresh-marker|access-marker/);
});

test("credentials use only required .env keys and exported values take precedence", () => {
  const values = credentials({ TASTYTRADE_CLIENT_ID: "exported-client" }, () =>
    "TASTYTRADE_CLIENT_ID=file-client\nTASTYTRADE_CLIENT_SECRET=file-secret\nTASTYTRADE_REFRESH_TOKEN=file-refresh\nTRADIER_API_KEY=unrelated");
  assert.equal(values.TASTYTRADE_CLIENT_ID, "exported-client");
  assert.equal(values.TASTYTRADE_CLIENT_SECRET, "file-secret");
  assert.equal(values.TASTYTRADE_REFRESH_TOKEN, "file-refresh");
  assert.equal("TRADIER_API_KEY" in values, false);
});

test("missing credentials fail before HTTP", async () => {
  const errors = [];
  const code = await main(["accounts"], { env: {}, readFile: () => { const e = Error(); e.code = "ENOENT"; throw e; },
    fetchImpl: () => { throw Error("HTTP should not run"); }, err: (s) => errors.push(s) });
  assert.equal(code, 1);
  assert.match(errors[0], /TASTYTRADE_CLIENT_ID.*TASTYTRADE_CLIENT_SECRET.*TASTYTRADE_REFRESH_TOKEN/);
});

test("accounts refuses a partial account list", () => {
  assert.throws(() => renderAccounts({ data: { items: [{ account: { "account-number": "5WX01234" } }] },
    pagination: { "total-pages": 2, "total-items": 2 } }), /retrieval incomplete/);
});

test("accounts uses fixed production endpoints, User-Agent, and bearer token", async () => {
  assert.equal(PRODUCTION_BASE_URL, "https://api.tastyworks.com");
  const calls = []; const output = [];
  const code = await main(["accounts"], { env, out: (s) => output.push(s), fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? reply(200, { access_token: "access-marker" })
      : reply(200, { data: { items: [{ account: { "account-number": "5WX01234", nickname: "Individual" },
        "authority-level": "owner" }] } });
  } });
  assert.equal(code, 0);
  assert.deepEqual(calls.map(({ url }) => url), ["https://api.tastyworks.com/oauth/token",
    "https://api.tastyworks.com/customers/me/accounts"]);
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "GET"]);
  assert.equal(calls[1].options.headers.Authorization, "Bearer access-marker");
  assert.ok(calls.every(({ options }) => options.redirect === "error" &&
    /^[^/]+\/[^/]+$/.test(options.headers["User-Agent"])));
  assert.equal(output[0], "tastytrade production: authenticated\naccounts: 1\n5WX01234  Individual  owner");
  assert.doesNotMatch(output.join("\n"), /access-marker|secret-marker|refresh-marker/);
});

test("positions and complex orders render separately without protection claims", async () => {
  const calls = []; const output = [];
  const code = await main(["positions", "--account", "5WX01234"], { env, out: (s) => output.push(s),
    now: () => new Date("2026-09-30T20:00:00Z"), fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return reply(200, { access_token: "access-marker" });
      if (calls.length === 2) return reply(200, positions);
      if (calls.length === 3) return reply(200, page(0, 2, 2, [complex]));
      return reply(200, page(1, 2, 2, [{ id: "901", type: "OCO", orders: [] }]));
    } });
  assert.equal(code, 0);
  assert.deepEqual(calls.slice(1).map(({ url }) => url), [
    "https://api.tastyworks.com/accounts/5WX01234/positions",
    "https://api.tastyworks.com/accounts/5WX01234/complex-orders?page-offset=0&per-page=100",
    "https://api.tastyworks.com/accounts/5WX01234/complex-orders?page-offset=1&per-page=100"]);
  assert.ok(calls.slice(1).every(({ options }) => options.method === "GET"));
  assert.match(output[0], /positions: 1\nXLE .*Short  1/);
  assert.match(output[0], /complex orders: 2 \(complete; 2 pages\)/);
  assert.match(output[0], /#101  Live/);
  assert.match(output[0], /#102  Cancelled/);
  assert.match(output[0], /related #99  Replaced/);
  assert.match(output[0], /Buy to Close  1  XLE/);
  assert.match(output[0], /updated 2026-09-30T/);
  assert.doesNotMatch(output[0], /updated 1790799627906/);
  assert.doesNotMatch(output[0], /protected|working|managed exit/i);
});

test("positions selects the sole account after one authentication", async () => {
  const calls = []; const output = [];
  const code = await main(["positions"], { env, out: (s) => output.push(s),
    now: () => new Date("2026-09-30T20:00:00Z"), fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return reply(200, { access_token: "access-marker" });
      if (calls.length === 2) return reply(200, { data: { items: [
        { account: { "account-number": "5WX01234" }, "authority-level": "owner" }] } });
      if (calls.length === 3) return reply(200, positions);
      return reply(200, page(0, 1, 1, [complex]));
    } });
  assert.equal(code, 0);
  assert.deepEqual(calls.map(({ url }) => url), [
    "https://api.tastyworks.com/oauth/token",
    "https://api.tastyworks.com/customers/me/accounts",
    "https://api.tastyworks.com/accounts/5WX01234/positions",
    "https://api.tastyworks.com/accounts/5WX01234/complex-orders?page-offset=0&per-page=100"]);
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "GET", "GET", "GET"]);
  assert.equal(calls[3].options.headers.Authorization, "Bearer access-marker");
  assert.match(output[0], /account 5WX01234/);
  assert.doesNotMatch(output[0], /access-marker|secret-marker|refresh-marker/);
});

test("implicit account selection fails safely for multiple or incomplete accounts", async () => {
  for (const accountsBody of [
    { data: { items: [{ account: { "account-number": "5WX01234" } },
      { account: { "account-number": "5WX56789" } }] } },
    { data: { items: [{ account: { "account-number": "5WX01234" } }] },
      pagination: { "total-pages": 2, "total-items": 2 } },
  ]) {
    const calls = []; const output = []; const errors = [];
    const code = await main(["positions"], { env, out: (s) => output.push(s), err: (s) => errors.push(s),
      fetchImpl: async (url) => {
        calls.push(url);
        return reply(200, calls.length === 1 ? { access_token: "access-marker" } : accountsBody);
      } });
    assert.equal(code, accountsBody.pagination ? 1 : 2);
    assert.equal(calls.length, 2);
    assert.deepEqual(output, []);
    assert.match(errors[0], accountsBody.pagination ? /retrieval incomplete/ : /Multiple accounts available/);
  }
});

test("zero results are complete; incomplete or malformed pages fail without normal output", async () => {
  assert.match(renderPositions({ data: { items: [] } }, "5WX01234"), /positions: 0/);
  assert.match(renderComplexOrders("5WX01234", await readComplexOrders(async () => page(0, 0, 0, [])),
    "2026-09-30T20:00:00Z"), /complex orders: 0 \(complete; 0 pages\)/);
  for (const secondPage of [page(1, 2, 3, []), { data: { items: [] } }]) {
    const output = []; const errors = []; let calls = 0;
    const code = await main(["positions", "--account", "5WX01234"], { env, out: (s) => output.push(s),
      err: (s) => errors.push(s), fetchImpl: async () => {
        calls++;
        return calls === 1 ? reply(200, { access_token: "access-marker" })
          : reply(200, calls === 2 ? positions : calls === 3 ? page(0, 2, 2, [complex]) : secondPage);
      } });
    assert.equal(code, 1);
    assert.deepEqual(output, []);
    assert.match(errors[0], /incomplete/);
  }
  await assert.rejects(readComplexOrders(async (offset) =>
    page(offset, 2, 2, [{ id: "900", orders: [] }])), /duplicate or missing order identity/);
  assert.throws(() => renderPositions({ data: { items: positions.data.items },
    pagination: { "total-pages": 2, "total-items": 2 } }, "5WX01234"), /retrieval incomplete/);
  assert.throws(() => renderPositions(positions, "5WX99999"), /wrong account/);
});

test("API failures and thrown exceptions never expose credentials", async () => {
  for (const fetchImpl of [async () => reply(401, { error: { code: "invalid_credentials", message: "secret-marker" } }),
    async () => { throw Error("secret-marker refresh-marker access-marker"); }]) {
    const errors = [];
    assert.equal(await main(["accounts"], { env, fetchImpl, err: (s) => errors.push(s) }), 1);
    assert.doesNotMatch(errors.join("\n"), /secret-marker|refresh-marker|access-marker/);
  }
});

test("a missing account gets a useful non-secret error", async () => {
  const output = []; const errors = [];
  const code = await main(["positions", "--account", "INVALIDACCOUNT"], { env,
    out: (s) => output.push(s), err: (s) => errors.push(s), fetchImpl: async (url) =>
      reply(url.endsWith("/oauth/token") ? 200 : 404,
        url.endsWith("/oauth/token") ? { access_token: "access-marker" } :
          { error: { message: "secret-marker refresh-marker access-marker" } }) });
  assert.equal(code, 1);
  assert.deepEqual(output, []);
  assert.match(errors[0], /Account not found \(HTTP 404\).*tt accounts/);
  assert.doesNotMatch(errors[0], /INVALIDACCOUNT|secret-marker|refresh-marker|access-marker/);
});

test("sh launcher works from another directory and forwards exit status", () => {
  const launcher = resolve(scriptDir, "tt");
  const help = execFileSync(launcher, ["--help"], { cwd: "/", encoding: "utf8", env: { ...process.env,
    TASTYTRADE_CLIENT_ID: "", TASTYTRADE_CLIENT_SECRET: "", TASTYTRADE_REFRESH_TOKEN: "" } });
  assert.match(help, /Usage: tt/);
  const invalid = spawnSync(launcher, ["wat"], { cwd: "/", encoding: "utf8" });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Unknown command/);
});
