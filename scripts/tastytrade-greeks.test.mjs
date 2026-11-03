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
test('TT1 deadline is recomputed after definition/token acquisition; exhausted budget never opens a socket',async()=>{
 let elapsed=0,opened=0;const Symbol=symbols[0];
 const events=await readHeldGreeks({symbols:[Symbol],now,maxSymbols:6000,deadlineMs:2000,clock:()=>elapsed,timeoutMs:2000,
  loadInstrument:async()=>({data:{symbol:Symbol,'streamer-symbol':streamers[0]}}),
  loadQuoteToken:async()=>{elapsed=2500;return {data:{token:'fixture-token','dxlink-url':'wss://tasty-openapi-dxlink-md-ws.dxfeed.com/realtime'}};},
  WebSocketImpl:class {constructor(){opened++;}}});
 assert.deepEqual(events,[]);assert.equal(opened,0);
});

test('6000-contract subscriptions stay below the provider message limit and preserve every batch',async()=>{
 const definitions = Array.from({length:6000},(_,i)=>({symbol:`SPY   261211P${String((i+1)*1000).padStart(8,'0')}`,streamer:`.SPY261211P${i+1}`}));
 const bySymbol=new Map(definitions.map(d=>[d.symbol,d]));const packets=[],active=new Set();
 class BoundedSocket extends socketFor([]) {
  send(raw) {
   const message=JSON.parse(raw);
   if(message.type!=='FEED_SUBSCRIPTION')return super.send(raw);
   if(Buffer.byteLength(raw)>64*1024){queueMicrotask(()=>this.emit('message',{type:'ERROR',error:'INVALID_MESSAGE'}));return;}
   packets.push(message);if(message.reset)active.clear();
   for(const t of message.add)active.add(t.symbol);
   queueMicrotask(()=>this.emit('message',{type:'FEED_DATA',channel:3,data:['Greeks',message.add.flatMap(t=>['Greeks',t.symbol,now.getTime(),-.25])]}));
  }
 }
 const events=await readHeldGreeks({symbols:definitions.map(d=>d.symbol),maxSymbols:6000,now,timeoutMs:1000,
  loadInstrument:async symbol=>({data:{symbol,'streamer-symbol':bySymbol.get(symbol).streamer}}),
  loadQuoteToken:async()=>({data:{token:'fixture-token','dxlink-url':'wss://tasty-openapi-dxlink-md-ws.dxfeed.com/realtime'}}),WebSocketImpl:BoundedSocket});
 assert.equal(packets.length,30);assert.equal(packets[0].reset,true);assert.ok(packets.slice(1).every(p=>p.reset===false));
 assert.ok(packets.every(p=>p.add.length<=200&&Buffer.byteLength(JSON.stringify(p))<64*1024));
 assert.equal(active.size,6000);assert.deepEqual(new Set(events.map(e=>e.symbol)),new Set(bySymbol.keys()));
});

test('server protocol rejection fails promptly with a bounded code and no raw server message',async()=>{
 class RejectedSocket extends socketFor([]) {
  send(raw){if(JSON.parse(raw).type==='FEED_SUBSCRIPTION')queueMicrotask(()=>this.emit('message',{type:'ERROR',error:'INVALID_MESSAGE',message:'fixture-secret'}));else super.send(raw);}
 }
 await assert.rejects(readHeldGreeks({symbols:[symbols[0]],now,timeoutMs:1000,
  loadInstrument:async symbol=>({data:{symbol,'streamer-symbol':streamers[0]}}),
  loadQuoteToken:async()=>({data:{token:'fixture-token','dxlink-url':'wss://tasty-openapi-dxlink-md-ws.dxfeed.com/realtime'}}),WebSocketImpl:RejectedSocket}),{message:'DXLINK_INVALID_MESSAGE'});
});
