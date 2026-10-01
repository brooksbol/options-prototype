import assert from "node:assert/strict";
import test from "node:test";
import { main, renderAccounts, PRODUCTION_BASE_URL } from "./tastytrade-hello.mjs";

const env = {
  TASTYTRADE_CLIENT_ID: "client-secret-marker",
  TASTYTRADE_CLIENT_SECRET: "secret-marker",
  TASTYTRADE_REFRESH_TOKEN: "refresh-marker",
};
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("missing credentials fail before HTTP", async () => {
  const errors = [];
  const code = await main({ env: {}, fetchImpl: () => { throw Error("HTTP should not run"); }, err: (s) => errors.push(s) });
  assert.equal(code, 1);
  assert.match(errors[0], /TASTYTRADE_CLIENT_ID.*TASTYTRADE_CLIENT_SECRET.*TASTYTRADE_REFRESH_TOKEN/);
});

test("only production endpoints are called, with User-Agent and minted bearer token", async () => {
  assert.equal(PRODUCTION_BASE_URL, "https://api.tastyworks.com");
  const calls = [];
  const output = [];
  const code = await main({ env, out: (s) => output.push(s), fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? reply(200, { access_token: "access-marker" })
      : reply(200, { data: { items: [{ account: { "account-number": "5WX01234", nickname: "Individual" }, "authority-level": "owner" }] } });
  } });
  assert.equal(code, 0);
  assert.deepEqual(calls.map(({ url }) => url), [
    "https://api.tastyworks.com/oauth/token",
    "https://api.tastyworks.com/customers/me/accounts",
  ]);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[1].options.method, "GET");
  assert.equal(calls[1].options.headers.Authorization, "Bearer access-marker");
  assert.match(calls[0].options.headers["User-Agent"], /^[^/]+\/[^/]+$/);
  assert.match(calls[1].options.headers["User-Agent"], /^[^/]+\/[^/]+$/);
  assert.ok(calls.every(({ options }) => options.redirect === "error"));
  assert.equal(output.join("\n"), "tastytrade production: authenticated\naccounts: 1\n5WX01234  Individual  owner");
  assert.doesNotMatch(output.join("\n"), /access-marker|secret-marker|refresh-marker/);
});

test("account fixture uses nickname fallback and reports empty and malformed lists", () => {
  assert.match(renderAccounts({ data: { items: [{ account: { "account-number": "5WT00001", "account-type-name": "Roth IRA" }, "authority-level": "read-only" }] } }), /5WT00001  Roth IRA  read-only/);
  assert.throws(() => renderAccounts({ data: { items: [] } }), /no accounts/);
  assert.throws(() => renderAccounts({ data: {} }), /malformed response/);
});

test("API errors and network exceptions never expose secrets", async () => {
  for (const fetchImpl of [
    async () => reply(401, { error: { code: "invalid_credentials", message: "secret-marker refresh-marker access-marker" } }),
    async () => reply(503, { error: { message: "secret-marker refresh-marker access-marker" } }),
    async () => { throw Error("secret-marker refresh-marker access-marker"); },
  ]) {
    const errors = [];
    const code = await main({ env, fetchImpl, err: (s) => errors.push(s) });
    assert.equal(code, 1);
    assert.doesNotMatch(errors.join("\n"), /secret-marker|refresh-marker|access-marker/);
    if (errors[0].includes("invalid_credentials")) assert.match(errors[0], /Sandbox and production OAuth credentials are separate/);
  }
});

test("malformed token and empty account list return failure without a success banner", async () => {
  for (const responses of [
    [reply(200, {})],
    [reply(200, { access_token: "access-marker" }), reply(200, { data: { items: [] } })],
  ]) {
    const output = [];
    const errors = [];
    const code = await main({ env, fetchImpl: async () => responses.shift(), out: (s) => output.push(s), err: (s) => errors.push(s) });
    assert.equal(code, 1);
    assert.deepEqual(output, []);
    assert.equal(errors.length, 1);
  }
});
