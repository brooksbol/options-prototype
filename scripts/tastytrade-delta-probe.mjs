#!/usr/bin/env node
// Bounded DXLink Greek acquisition experiment. No broker order capability.
import { credentials, PRODUCTION_BASE_URL } from "./tastytrade.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const EXPIRATION = "2026-11-20";
export const OBSERVATION_SECONDS = 20;
export const GREEK_FIELDS = ["eventType", "eventSymbol", "time", "delta", "volatility"];
const ROOTS = new Set(["XSP", "TLT", "SPY"]);
const USER_AGENT = "wheelwright-tastytrade-delta-probe/0.1";
const DXLINK_HOSTS = new Set(["tasty-openapi-ws.dxfeed.com",
  "tasty-openapi-dxlink-md-ws.dxfeed.com"]);
const MAX_EVENTS = 2000;
const MAX_AGE_MS = 5 * 60 * 1000;

export class ProbeError extends Error {}

export function parseProbe(argv) {
  if (argv.length !== 3 || !ROOTS.has(argv[0]) || argv[1] !== "--center" ||
      !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(argv[2]) || Number(argv[2]) <= 0) {
    throw new ProbeError("Usage: node scripts/tastytrade-delta-probe.mjs XSP|TLT|SPY --center PRICE");
  }
  return { root: argv[0], center: argv[2], expiration: EXPIRATION,
    count: 5, interval_seconds: OBSERVATION_SECONDS };
}

async function rest(fetchImpl, path, options, label) {
  let response;
  try {
    response = await fetchImpl(PRODUCTION_BASE_URL + path, {
      ...options, redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...options.headers },
    });
  } catch { throw new ProbeError(label + ": network error or redirect blocked"); }
  if (!response.ok) throw new ProbeError(label + ": HTTP " + response.status);
  try { return await response.json(); }
  catch { throw new ProbeError(label + ": malformed JSON response"); }
}

async function acquire(fetchImpl, values, root, now) {
  const timings = [];
  const timed = async (label, path, options) => {
    const started_at_utc = now().toISOString();
    const body = await rest(fetchImpl, path, options, label);
    timings.push({ resource: label, started_at_utc, received_at_utc: now().toISOString() });
    return body;
  };
  const auth = await timed("oauth", "/oauth/token", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", client_id: values.TASTYTRADE_CLIENT_ID,
      client_secret: values.TASTYTRADE_CLIENT_SECRET, refresh_token: values.TASTYTRADE_REFRESH_TOKEN }) });
  const token = auth?.access_token;
  if (typeof token !== "string" || !token.trim()) throw new ProbeError("OAuth: missing access token");
  const headers = { Authorization: "Bearer " + token };
  const chain = await timed("option_chain", "/option-chains/" + root, { method: "GET", headers });
  const quoteToken = await timed("quote_token", "/api-quote-tokens", { method: "GET", headers });
  const endpoint = quoteToken?.data?.["dxlink-url"];
  const streamerToken = quoteToken?.data?.token;
  let url;
  try { url = new URL(endpoint); } catch { throw new ProbeError("Quote token: invalid DXLink URL"); }
  if (url.protocol !== "wss:" || !DXLINK_HOSTS.has(url.hostname) || url.username || url.password ||
      typeof streamerToken !== "string" || !streamerToken.trim()) {
    throw new ProbeError("Quote token: unsupported DXLink endpoint or missing token");
  }
  return { chain, endpoint: url.href, streamerToken, timings };
}

export function selectProbeContracts(chain, { root, center, expiration }) {
  const items = chain?.data?.items;
  if (!Array.isArray(items)) throw new ProbeError("Option chain: malformed response");
  const page = chain.pagination;
  if (page && ((Number.isInteger(page["total-pages"]) && page["total-pages"] > 1) ||
      (Number.isInteger(page["total-items"]) && page["total-items"] > items.length))) {
    throw new ProbeError("Option chain: retrieval incomplete");
  }
  const puts = items.filter((item) => item?.["root-symbol"] === root &&
    item["expiration-date"] === expiration && item["option-type"] === "P");
  if (puts.length < 5) throw new ProbeError("Probe: fewer than five puts at exact expiration");
  const seen = new Set();
  for (const item of puts) {
    const strike = Number(item["strike-price"]);
    if (!Number.isFinite(strike) || strike <= 0 || typeof item.symbol !== "string" ||
        !item.symbol.trim() || typeof item["streamer-symbol"] !== "string" ||
        !item["streamer-symbol"].trim() || seen.has(strike)) {
      throw new ProbeError("Option chain: malformed or ambiguous put identity");
    }
    seen.add(strike);
  }
  const chosen = puts.sort((a, b) => Math.abs(Number(a["strike-price"]) - Number(center)) -
    Math.abs(Number(b["strike-price"]) - Number(center)) ||
    Number(a["strike-price"]) - Number(b["strike-price"])).slice(0, 5).map((item) => ({
    symbol: item.symbol, streamer_symbol: item["streamer-symbol"],
    root_symbol: item["root-symbol"], expiration_date: item["expiration-date"],
    strike_price: item["strike-price"], option_type: item["option-type"],
  }));
  if (new Set(chosen.map((item) => item.streamer_symbol)).size !== chosen.length) {
    throw new ProbeError("Option chain: duplicate streamer symbol");
  }
  return chosen;
}

export function greekRows(frame, fields = GREEK_FIELDS) {
  if (frame?.type !== "FEED_DATA" || frame.channel !== 3 || !Array.isArray(frame.data)) return [];
  const data = frame.data;
  if (data[0] !== "Greeks") return [];
  const rows = data.slice(1).filter(Array.isArray).flatMap((batch) => {
    if (batch.length % fields.length !== 0) throw new ProbeError("DXLink: malformed Greek row length");
    const parts = [];
    for (let offset = 0; offset < batch.length; offset += fields.length) {
      parts.push(batch.slice(offset, offset + fields.length));
    }
    return parts;
  });
  return rows.map((row) => ({
    raw: row, event_symbol: row[fields.indexOf("eventSymbol")] ?? null,
    delta: row[fields.indexOf("delta")] ?? null,
    event_time: row[fields.indexOf("time")] ?? null,
  }));
}

export function summarizeProbe(contracts, events, endedAt, subscribedAt = null) {
  const end = Date.parse(endedAt);
  const subscribed = subscribedAt == null ? null : Date.parse(subscribedAt);
  const perContract = contracts.map((contract) => {
    const received = events.filter((event) => event.event_symbol === contract.streamer_symbol);
    const postSubscription = subscribed == null ? [] :
      received.filter((event) => typeof event.event_time === "number" && event.event_time >= subscribed);
    const usable = received.filter((event) => typeof event.delta === "number" &&
      Number.isFinite(event.delta) && event.delta >= -1 && event.delta <= 0 &&
      typeof event.event_time === "number" && Number.isFinite(event.event_time) &&
      event.event_time > 1e12 && event.event_time <= Date.parse(event.received_at_utc) + 5000 &&
      end - event.event_time <= MAX_AGE_MS);
    const latest = usable.reduce((best, event) => !best || event.event_time >= best.event_time ?
      event : best, null);
    return { ...contract, event_count: received.length, usable_delta_count: usable.length,
      repeated_events: received.length > 1, post_subscription_event_count: postSubscription.length,
      latest_delta: latest?.delta ?? null,
      latest_event_time: latest?.event_time ?? null,
      latest_event_age_ms_at_end: latest ? end - latest.event_time : null,
      missing_or_stale: usable.length === 0,
      events: received.map(({ raw, received_at_utc }) => ({ raw, received_at_utc })) };
  });
  return { contracts_subscribed: contracts.length,
    contracts_with_greek_event: perContract.filter((item) => item.event_count > 0).length,
    contracts_with_usable_delta: perContract.filter((item) => item.usable_delta_count > 0).length,
    contracts_with_repeated_events: perContract.filter((item) => item.repeated_events).length,
    contracts_with_post_subscription_event: perContract.filter((item) => item.post_subscription_event_count > 0).length,
    complete_bounded_set_for_delta: perContract.every((item) => !item.missing_or_stale),
    contracts: perContract };
}

export async function observeDxlink(endpoint, token, contracts, { WebSocketImpl = WebSocket,
  now = () => new Date(), durationMs = OBSERVATION_SECONDS * 1000 } = {}) {
  return await new Promise((resolve, reject) => {
    let ws;
    try { ws = new WebSocketImpl(endpoint); }
    catch { reject(new ProbeError("DXLink: connection failed")); return; }
    const events = [];
    const control = [];
    let settled = false;
    let subscribedAt;
    let fields = GREEK_FIELDS;
    let interval;
    const deadline = setTimeout(() => finish(new ProbeError("DXLink: handshake timed out")), durationMs + 15000);
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      clearTimeout(interval);
      try { ws.close(); } catch { /* Best effort. */ }
      if (error) reject(error);
      else resolve({ subscribed_at_utc: subscribedAt, ended_at_utc: now().toISOString(),
        requested_fields: GREEK_FIELDS, configured_fields: fields, control, events });
    };
    const send = (frame) => ws.send(JSON.stringify(frame));
    ws.addEventListener("open", () => {
      control.push({ type: "socket_open", at_utc: now().toISOString() });
      send({ type: "SETUP", channel: 0, version: "0.1-DXF-JS/0.3.0",
        keepaliveTimeout: 60, acceptKeepaliveTimeout: 60 });
    });
    ws.addEventListener("error", () => finish(new ProbeError("DXLink: socket error")));
    ws.addEventListener("close", () => { if (!settled) finish(new ProbeError("DXLink: closed before observation ended")); });
    ws.addEventListener("message", (message) => {
      let frame;
      try { frame = JSON.parse(message.data); }
      catch { finish(new ProbeError("DXLink: malformed frame")); return; }
      if (frame.type !== "FEED_DATA") control.push({ type: frame.type, state: frame.state ?? null,
        at_utc: now().toISOString() });
      if (frame.type === "AUTH_STATE" && frame.state === "UNAUTHORIZED") {
        send({ type: "AUTH", channel: 0, token });
      } else if (frame.type === "AUTH_STATE" && frame.state === "AUTHORIZED") {
        send({ type: "CHANNEL_REQUEST", channel: 3, service: "FEED", parameters: { contract: "AUTO" } });
      } else if (frame.type === "CHANNEL_OPENED" && frame.channel === 3) {
        send({ type: "FEED_SETUP", channel: 3, acceptAggregationPeriod: 0.1,
          acceptDataFormat: "COMPACT", acceptEventFields: { Greeks: GREEK_FIELDS } });
      } else if (frame.type === "FEED_CONFIG" && frame.channel === 3 && !subscribedAt) {
        if (Array.isArray(frame.eventFields?.Greeks)) fields = frame.eventFields.Greeks;
        send({ type: "FEED_SUBSCRIPTION", channel: 3, reset: true,
          add: contracts.map((contract) => ({ type: "Greeks", symbol: contract.streamer_symbol })) });
        subscribedAt = now().toISOString();
        interval = setTimeout(() => finish(), durationMs);
      } else if (frame.type === "FEED_DATA" && subscribedAt) {
        let rows;
        try { rows = greekRows(frame, fields); }
        catch { finish(new ProbeError("DXLink: malformed Greek event")); return; }
        for (const row of rows) {
          if (!contracts.some((contract) => contract.streamer_symbol === row.event_symbol)) {
            finish(new ProbeError("DXLink: unexpected Greek symbol")); return;
          }
          if (events.length >= MAX_EVENTS) { finish(new ProbeError("DXLink: event cap exceeded")); return; }
          events.push({ ...row, received_at_utc: now().toISOString() });
        }
      } else if (frame.type === "ERROR") finish(new ProbeError("DXLink: server error"));
    });
  });
}

export async function run(argv = process.argv.slice(2), { env = process.env, fetchImpl = fetch,
  now = () => new Date(), WebSocketImpl = WebSocket, durationMs = OBSERVATION_SECONDS * 1000,
  out = console.log, err = console.error } = {}) {
  try {
    const selection = parseProbe(argv); // No credential or network access before validation.
    let values;
    try { values = credentials(env); }
    catch { throw new ProbeError("Delta probe: missing or unreadable tastytrade credentials"); }
    const acquired = await acquire(fetchImpl, values, selection.root, now);
    const contracts = selectProbeContracts(acquired.chain, selection);
    const stream = await observeDxlink(acquired.endpoint, acquired.streamerToken, contracts,
      { WebSocketImpl, now, durationMs });
    const summary = summarizeProbe(contracts, stream.events, stream.ended_at_utc, stream.subscribed_at_utc);
    out(JSON.stringify({ schema: "tt-delta-probe-v1", selection: { ...selection,
      max_event_age_seconds: MAX_AGE_MS / 1000 },
      observation: { rest_timings_utc: acquired.timings, subscribed_at_utc: stream.subscribed_at_utc,
        ended_at_utc: stream.ended_at_utc, requested_fields: stream.requested_fields,
        configured_fields: stream.configured_fields, control: stream.control },
      summary }, null, 2));
    return summary.complete_bounded_set_for_delta ? 0 : 1;
  } catch (error) {
    err(error instanceof ProbeError ? error.message : "Delta probe: unexpected failure");
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await run();
}
