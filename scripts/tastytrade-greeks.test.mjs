import assert from "node:assert/strict";
import test from "node:test";
import { readHeldGreeks } from "./tastytrade-greeks.mjs";

const now = new Date("2026-10-01T02:00:00.000Z");
const symbols = ["EWZ   261120P00031000", "EWZ   261120C00042000"];
const streamers = [".EWZ261120P31", ".EWZ261120C42"];

function socketFor(rows) {
  return class {
    readyState = 1;
    listeners = new Map();
    sent = [];
    constructor() { queueMicrotask(() => this.emit("open")); }
    addEventListener(kind, listener) { this.listeners.set(kind, listener); }
    emit(kind, value) { this.listeners.get(kind)?.(kind === "message" ?
      { data: JSON.stringify(value) } : {}); }
    send(raw) {
      const message = JSON.parse(raw);
      this.sent.push(message);
      const replies = {
        SETUP: { type: "AUTH_STATE", state: "UNAUTHORIZED" },
        AUTH: { type: "AUTH_STATE", state: "AUTHORIZED" },
        CHANNEL_REQUEST: { type: "CHANNEL_OPENED", channel: 3 },
        FEED_SETUP: { type: "FEED_CONFIG", channel: 3 },
        FEED_SUBSCRIPTION: { type: "FEED_DATA", channel: 3, data: ["Greeks", rows] },
      };
      if (replies[message.type]) queueMicrotask(() => this.emit("message", replies[message.type]));
    }
    close() { this.readyState = 3; }
  };
}

function request(rows) {
  return readHeldGreeks({ symbols,
    loadInstrument: async (symbol) => ({ data: { symbol,
      "streamer-symbol": streamers[symbols.indexOf(symbol)] } }),
    loadQuoteToken: async () => ({ data: { token: "fixture-token",
      "dxlink-url": "wss://tasty-openapi-dxlink-md-ws.dxfeed.com/realtime" } }),
    WebSocketImpl: socketFor(rows), now, timeoutMs: 20 });
}

test("DXLink compact Greeks map to exact held contracts", async () => {
  const at = Date.parse("2026-10-01T00:00:00.000Z");
  assert.deepEqual(await request([
    "Greeks", streamers[0], at, -0.14,
    "Greeks", streamers[1], at, 0.29,
  ]), [
    { symbol: symbols[0], delta: -0.14, updatedAt: at },
    { symbol: symbols[1], delta: 0.29, updatedAt: at },
  ]);
});

test("missing and stale Greek fields remain unknown", async () => {
  const at = Date.parse("2026-10-01T00:00:00.000Z");
  assert.deepEqual(await request([
    "Greeks", streamers[0], at, null,
    "Greeks", streamers[1], Date.parse("2026-09-29T00:00:00.000Z"), 0.29,
  ]), []);
});
