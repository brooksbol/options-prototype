import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { credentials, main, parseCommand, PRODUCTION_BASE_URL,
  readComplexOrders, renderAccounts, renderComplexOrders, renderPositions } from "./tastytrade.mjs";

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
    ["positions", "--help"]];
  const invalidCases = [["wat"], ["accounts", "--json"], ["positions", "--json"],
    ["positions", "--account"], ["positions", "--account", "../bad"], ["complex-orders"]];
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
