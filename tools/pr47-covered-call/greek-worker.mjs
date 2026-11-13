// Warm, read-only worker. Reuses Wheelwright's accepted DXLink snapshot helper.
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { readHeldGreeks } from "../../scripts/tastytrade-greeks.mjs";

const { credentials } = await import(pathToFileURL(process.argv[2]).href);
const values = credentials(process.env);
let oauth;
let expires = 0;
let quoteToken;
let quoteExpires = 0;
const chainCache = new Map();
let requests;

async function api(path) {
  if (!/^\/option-chains\/[A-Z]+\/nested$/.test(path) && path !== "/api-quote-tokens") {
    throw new Error("Unexpected read route");
  }
  if (Date.now() >= expires) {
    requests.oauth++;
    const response = await fetch("https://api.tastyworks.com/oauth/token", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token", client_id: values.TASTYTRADE_CLIENT_ID,
        client_secret: values.TASTYTRADE_CLIENT_SECRET, refresh_token: values.TASTYTRADE_REFRESH_TOKEN,
      }),
    });
    if (!response.ok) throw new Error("Tastytrade OAuth unavailable");
    const auth = await response.json();
    oauth = auth.access_token;
    expires = Date.now() + Math.min(600, Number(auth.expires_in ?? 600) - 30) * 1000;
  }
  requests.get++;
  const response = await fetch("https://api.tastyworks.com" + path, {
    redirect: "error", signal: AbortSignal.timeout(10000),
    headers: { Authorization: "Bearer " + oauth },
  });
  if (!response.ok) throw new Error("Tastytrade GET unavailable");
  const text = await response.text();
  if (text.length > 20000000) throw new Error("Oversized Tastytrade response");
  return JSON.parse(text);
}

async function loadQuoteToken() {
  if (Date.now() >= quoteExpires) {
    quoteToken = await api("/api-quote-tokens");
    quoteExpires = Date.now() + 60000;
  }
  return quoteToken;
}

async function read(symbol, expiration) {
  if (!/^[A-Z]+$/.test(symbol) || expiration !== "2026-11-13") throw new Error("Unexpected scope");
  const key = symbol + expiration;
  if (!chainCache.has(key)) {
    const chain = await api("/option-chains/" + symbol + "/nested");
    const definitions = new Map();
    for (const item of chain.data?.items ?? []) {
      if (item["option-chain-type"] !== "Standard" || item["shares-per-contract"] !== 100 ||
          item["root-symbol"] !== symbol || item["underlying-symbol"] !== symbol) continue;
      for (const exp of item.expirations ?? []) {
        if (exp["expiration-date"] !== expiration) continue;
        for (const strike of exp.strikes ?? []) {
          if (typeof strike.call === "string" && typeof strike["call-streamer-symbol"] === "string") {
            definitions.set(strike.call, { symbol: strike.call, "streamer-symbol": strike["call-streamer-symbol"] });
          }
        }
      }
    }
    if (!definitions.size) throw new Error("No standard calls");
    chainCache.set(key, definitions);
  }
  const definitions = chainCache.get(key);
  const symbols = [...definitions.keys()];
  const greeks = [];
  for (let offset = 0; offset < symbols.length; offset += 100) {
    requests.dxlink++;
    greeks.push(...await readHeldGreeks({
      symbols: symbols.slice(offset, offset + 100), now: new Date(), timeoutMs: 6000,
      loadInstrument: async name => ({ data: definitions.get(name) }),
      loadQuoteToken,
    }));
  }
  return { symbol, expiration, greeks, requests };
}

for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  requests = { oauth: 0, get: 0, dxlink: 0 };
  try {
    const { symbol, expiration } = JSON.parse(line);
    console.log(JSON.stringify(await read(symbol, expiration)));
  } catch {
    console.log(JSON.stringify({ error: "Tastytrade Greek evidence unavailable", requests }));
  }
}
