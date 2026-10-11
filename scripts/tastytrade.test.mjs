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

import { sampleTrade, ewz, xle, liveEvidence } from "./tastytrade-fixtures.mjs";
import { projectLive } from "./tastytrade-live-domain.mjs";
test("domain preserves opening fills, leg-mid valuation, gross dollars and calendar DTE", () => {
  const { positions: [e,x] } = projectLive(liveEvidence);
  for (const [p,c,n,t,g,d] of [[e,.42,.33,.21,9,51],[x,.18,.31,.09,-13,16]]) {
    for (const [actual,expected] of [[p.credit,c],[p.market.closeDebit,n],[p.target,t],[p.pnl,g]])
      assert.ok(Math.abs(actual-expected) < 1e-8);
    assert.equal(p.dte,d); assert.equal(p.p50,true);
  }
});

test("multiple opening fills are weighted and quantity/multiplier scale gross dollars", () => {
  const holdings = liveEvidence.holdings.map(h => ({...h,quantity:"2",multiplier:"50"}));
  const change = o => ({...o,legs:o.legs.map(l => ({...l,quantity:"2",...(l.fills ? {
    fills:[{...l.fills[0],quantity:"1"},{...l.fills[0],quantity:"1"}] } : {})}))});
  const p=projectLive({...liveEvidence,holdings,orders:liveEvidence.orders.map(change),
    complexOrders:liveEvidence.complexOrders.map(g=>({...g,orders:g.orders.map(change)}))}).positions[0];
  assert.ok(Math.abs(p.credit-.42)<1e-8); assert.ok(Math.abs(p.pnl-9)<1e-8);
});

test("ambiguous history, unsupported holdings, missing quotes and inconsistent exits fail closed", () => {
  assert.throws(()=>projectLive({...liveEvidence,orders:[...liveEvidence.orders,{...ewz.opening,id:"duplicate"}]}),/opening trade linkage/);
  assert.throws(()=>projectLive({...liveEvidence,holdings:liveEvidence.holdings.slice(1)}),/unsupported or ambiguous/);
  assert.throws(()=>projectLive({...liveEvidence,quotes:liveEvidence.quotes.slice(1)}),/quote evidence missing/);
  assert.throws(()=>projectLive({...liveEvidence,orders:[...liveEvidence.orders,{...ewz.closing.orders[0],id:"other"}]}),/additional or missing/);
  const broken={...ewz.opening,legs:ewz.opening.legs.map(l=>({...l,fills:[{...l.fills[0],quantity:"2"}]}))};
  assert.throws(()=>projectLive({...liveEvidence,orders:[broken,...liveEvidence.orders.slice(1)]}),/fill quantity/);
});

test("missing daily reference affects only legacy daily P/L", () => {
  const holdings=liveEvidence.holdings.map((h,i)=>i===0?{...h,"average-daily-market-close-price":undefined}:h);
  const p=projectLive({...liveEvidence,holdings});
  assert.equal(p.rows[0][5],"—"); assert.ok(Math.abs(p.positions[0].pnl-9)<1e-8);
});

test("legacy direction uses signed REST deltas and preserves its neutral deadband", () => {
  const quotes=liveEvidence.quotes.map((q,i)=>({...q,delta:["-0.3","-0.2","0.4","0.2",-.2,-.3,.2,.4][i]}));
  assert.deepEqual(projectLive({...liveEvidence,quotes}).rows.map(r=>r[3]),["BEARISH","BULLISH"]);
  for(const delta of [null,"","NaN","Infinity","1.1",true]) {
    assert.equal(projectLive({...liveEvidence,quotes:quotes.map((q,i)=>i===0?{...q,delta}:q)}).rows[0][3],"—");
  }
  for(const delta of [.3,.301]) {
    const q=liveEvidence.quotes.map((q,i)=>i===0?{...q,delta}:q);
    assert.equal(projectLive({...liveEvidence,quotes:q}).rows[0][3],delta===.3?"NEUTRAL":"BULLISH");
  }
});

test("legacy EOD label still requires post-close observations", () => {
  const quotes=liveEvidence.quotes.map(q=>({...q,"updated-at":"2026-09-30T20:01:00Z"}));
  const now=new Date("2026-09-30T20:20:00Z");
  assert.equal(projectLive({...liveEvidence,quotes,now,sessionCloseAt:"2026-09-30T20:00:00Z"}).rows[0][13],"EOD");
  assert.equal(projectLive({...liveEvidence,quotes,now}).rows[0][13],"19m");
});

test("target crossing stays indicative and progress is not clamped", () => {
  const quotes=liveEvidence.quotes.map(q=>q.symbol===xle.holdings[2].symbol?{...q,bid:"0.28",ask:"0.30",mid:"0.29"}:q);
  const p=projectLive({...liveEvidence,quotes});
  assert.ok(p.positions[1].progress>1); assert.match(p.rows[1][10],/below target; still held/);
  assert.ok(projectLive(liveEvidence).positions[1].progress<0);
  assert.doesNotMatch(renderLive({...liveEvidence,quotes}),/target reached|closed/);
});

test("explicit TSV output has real tabs, no padding or ANSI, and a header with zero trades", () => {
  const tsv = renderLive({ ...liveEvidence, color: true, format: "tsv" });
  const lines = tsv.split("\n");
  assert.equal(lines.length, 3);
  assert.deepEqual(lines[0].split("\t"), ["ACCOUNT", "SYMBOL", "STRUCTURE", "DIRECTION", "QTY", "P/L DAY",
    "TOTAL G/L", "OPENED@", "CURRENT", "TARGET CLOSE@", "PROGRESS", "OPENED", "DTE", "QUOTE"]);
  assert.deepEqual(lines[1].split("\t"), ["XXXX1234", "EWZ", "Iron Condor", "NEUTRAL", "1", "$0",
    "+$9", "0.42 CR", "0.33", "50% @ 0.21 or exp 11/20", "0.12 above target", "09/30 (0 days)", "51", "2h"]);
  assert.deepEqual(lines[2].split("\t"), ["XXXX1234", "XLE", "Iron Condor", "NEUTRAL", "1", "+$1",
    "−$13", "0.18 CR", "0.31", "50% @ 0.09 or exp 10/16", "0.22 above target", "09/30 (0 days)", "16", "2h"]);
  assert.doesNotMatch(tsv, /\x1b\[|5WX01234|  +/);
  assert.equal(renderLive({ account: "5WX01234", holdings: [], orders: [], complexOrders: [],
    quotes: [], now: liveEvidence.now, format: "tsv" }), lines[0]);
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
      if (url.includes("/instruments/equity-options?")) return reply(200, { data: { items: [] } });
      throw Error("unexpected endpoint");
    };
  const code = await main(["live"], { env, out: (s) => output.push(s), now: () => liveEvidence.now,
    fetchImpl });
  assert.equal(code, 0);
  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", ...Array(8).fill("GET")]);
  assert.ok(calls.every(({ url, options }) => url.startsWith(PRODUCTION_BASE_URL) &&
    options.redirect === "error" && /^[^/]+\/[^/]+$/.test(options.headers["User-Agent"])));
  assert.ok(calls.slice(1).every(({ options }) => options.headers.Authorization === "Bearer access-marker"));
  assert.doesNotMatch(output.join("\n"), /access-marker|secret-marker|refresh-marker/);
  assert.match(output[0], /EWZ.*\+\$9/);
  assert.match(output[0], /EXIT PROFIT/);
  assert.match(output[0], /\x1b\[92m\+\$9/);
  const ttyOutput = [];
  assert.equal(await main(["live"], { env, out: (s) => ttyOutput.push(s), now: () => liveEvidence.now,
    fetchImpl }), 0);
  assert.match(ttyOutput[0], /^\n\x1b\[97m/);
  assert.match(ttyOutput[0], /\x1b\[92m\+\$9\x1b\[97m/);
  assert.match(ttyOutput[0], /\x1b\[91m−\$13\x1b\[97m/);
  assert.match(ttyOutput[0], /\x1b\[0m\n$/);
  const noColorOutput = [];
  assert.equal(await main(["live"], { env: { ...env, NO_COLOR: "1" },
    out: (s) => noColorOutput.push(s), now: () => liveEvidence.now,
    fetchImpl }), 0);
  assert.doesNotMatch(noColorOutput[0], /\x1b\[/);
  assert.match(noColorOutput[0], /\+\$9.*−\$13/s);
  const tsvOutput = [];
  assert.equal(await main(["live", "--tsv"], { env, out: (s) => tsvOutput.push(s),
    now: () => liveEvidence.now, fetchImpl }), 0);
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

const fridaySession = { state: "Closed", "previous-session": {
  "open-at": "2026-10-09T13:30:00Z", "close-at": "2026-10-09T20:00:00Z",
}, "next-session": { "open-at": "2026-10-12T13:30:00Z" } };
const sundayEvidence = { ...liveEvidence, now: new Date("2026-10-11T14:00:00Z"),
  session: fridaySession,
  quotes: liveEvidence.quotes.map((q) => ({ ...q, "updated-at": "2026-10-09T20:00:00Z" })) };

test("Sunday retains previous-session economics, direction and dated TSV labels",()=>{
  const p=projectLive(sundayEvidence);
  assert.equal(p.rows[0][3],"NEUTRAL"); assert.equal(p.rows[0][6],"+$9");
  assert.equal(p.positions[0].optionEvidence.label,"10/09r");
  assert.match(renderLive({...sundayEvidence,format:"tsv"}),/Fri, 10\/09 \(42h\)/);
});
test("retention rejects older legs and missing/open session context",()=>{
  const quotes=sundayEvidence.quotes.map((q,i)=>i===0?{...q,"updated-at":"2026-10-08T20:00:00Z"}:q);
  assert.equal(projectLive({...sundayEvidence,quotes}).positions[0].pnl,null);
  for(const session of [undefined,{...fridaySession,state:"Open"}])
    assert.equal(projectLive({...sundayEvidence,session}).positions[0].pnl,null);
});
test("Saturday, Monday preopen and shortened holiday session retain evidence; resumed session does not",()=>{
  for(const now of [new Date("2026-10-10T14:00:00Z"),new Date("2026-10-12T12:00:00Z")])
    assert.notEqual(projectLive({...sundayEvidence,now}).positions[0].pnl,null);
  assert.equal(projectLive({...sundayEvidence,now:new Date("2026-10-12T14:00:00Z")}).positions[0].pnl,null);
  const session={...fridaySession,"previous-session":{"open-at":"2026-10-08T13:30:00Z","close-at":"2026-10-08T17:00:00Z"}};
  const quotes=sundayEvidence.quotes.map(q=>({...q,"updated-at":"2026-10-08T17:00:00Z"}));
  assert.equal(projectLive({...sundayEvidence,session,quotes}).positions[0].optionEvidence.label,"10/08r");
});
