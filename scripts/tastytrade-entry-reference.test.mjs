import test from 'node:test';
import assert from 'node:assert/strict';
import {readEntryReferences,ENTRY_CANDLE_SOURCE} from './tastytrade-entry-reference.mjs';
const fields=['eventType','eventSymbol','eventFlags','time','count','open','high','low','close'];
const openedAt=Date.parse('2026-10-14T18:12:29.664Z'),bar=Date.parse('2026-10-14T18:11:00Z');
const now=new Date('2026-10-14T18:50:00Z');
const row=(changes={})=>Object.values({...Object.fromEntries(fields.map((k,i)=>[k,['Candle','XLF{=m}',8,bar,23,54.23,54.235,54.215,54.215][i]])),...changes});
function socket(rows,{config=fields,closeBeforeEnd=false,sendRequests=[]}={}) {
  return class {
    readyState=1;listeners=new Map();
    constructor(){queueMicrotask(()=>this.emit('open'));}
    addEventListener(k,l){this.listeners.set(k,l);}
    emit(k,data){this.listeners.get(k)?.(k==='message'?{data:JSON.stringify(data)}:{});}
    close(){this.readyState=3;}
    send(s){const m=JSON.parse(s);sendRequests.push(m);let replies=[];
      if(m.type==='SETUP')replies=[{type:'AUTH_STATE',state:'UNAUTHORIZED'}];
      if(m.type==='AUTH')replies=[{type:'AUTH_STATE',state:'AUTHORIZED'}];
      if(m.type==='CHANNEL_REQUEST')replies=[{type:'CHANNEL_OPENED',channel:3}];
      if(m.type==='FEED_SETUP')replies=[{type:'FEED_CONFIG',channel:3}];
      if(m.type==='FEED_SUBSCRIPTION')replies=[{type:'FEED_CONFIG',channel:3,eventFields:{Candle:config}},{type:'FEED_DATA',channel:3,data:['Candle',rows]}];
      replies.forEach(r=>queueMicrotask(()=>this.emit('message',r)));
      if(closeBeforeEnd && m.type==='FEED_SUBSCRIPTION')queueMicrotask(()=>this.emit('close'));
    }
  };
}
const request=(rows,options={})=>readEntryReferences({requests:[{symbol:'XLF',openedAt}],now,timeoutMs:10,
  loadQuoteToken:async()=>({data:{token:'synthetic-private-token','dxlink-url':'wss://tasty-openapi-ws.dxfeed.com/realtime'}}),
  WebSocketImpl:socket(rows,options)});
test('allowlisted observed candle snapshot establishes only the completed minute before entry',async()=>{
  const sent=[];const result=await request(row(),{sendRequests:sent});
  assert.deepEqual(result,[{symbol:'XLF',openedAt,value:54.215,barStart:bar,barEnd:bar+60_000,
    source:ENTRY_CANDLE_SOURCE,periodMs:60_000,priceType:'trade candle close'}]);
  assert.deepEqual(sent.find(m=>m.type==='FEED_SUBSCRIPTION').add,[{type:'Candle',symbol:'XLF{=m}',fromTime:bar}]);
  assert.doesNotMatch(JSON.stringify(result),/synthetic-private-token/);
});
for(const [name,changes] of [
  ['bar containing fill',{time:bar+60_000}],['stale reference',{time:bar-60_000}],['future bar',{time:bar+120_000}],
  ['wrong root',{eventSymbol:'ABC{=m}'}],['wrong period',{eventSymbol:'XLF{=5m}'}],
  ['invalid close',{close:null}],['OHLC contradiction',{close:55}],['no trades',{count:0}],['remove event',{eventFlags:10}],
  ['incomplete snapshot',{eventFlags:0}],['pending transaction',{eventFlags:9}],
])test(name+' is unavailable rather than an invented entry price',async()=>assert.deepEqual(await request(row(changes)),[]));
test('snapshot begin, transaction completion and end are reconciled before publishing',async()=>{
  const rows=[...row({eventFlags:5,close:54.23}),...row({eventFlags:8})];
  assert.equal((await request(rows))[0].value,54.215);
});
test('malformed compact layout or changed field order cannot be read as prices',async()=>{
  assert.deepEqual(await request(row().slice(1)),[]);
  assert.deepEqual(await request(row(),{config:[...fields].reverse()}),[]);
});
test('quote-token failure, untrusted endpoint and invalid request stay unavailable without opening a stream',async()=>{
  for(const loadQuoteToken of [async()=>{throw Error('private-marker');},async()=>({data:{token:'x','dxlink-url':'wss://untrusted.example/realtime'}})]) {
    assert.deepEqual(await readEntryReferences({requests:[{symbol:'XLF',openedAt}],now,loadQuoteToken,WebSocketImpl:class{constructor(){throw Error('must not open');}}}),[]);
  }
  assert.deepEqual(await readEntryReferences({requests:[{symbol:'../bad',openedAt}],now,loadQuoteToken:()=>{throw Error('must not call');}}),[]);
});
