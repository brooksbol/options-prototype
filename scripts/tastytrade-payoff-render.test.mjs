import test from "node:test";
import assert from "node:assert/strict";
import { stripVTControlCharacters as strip } from "node:util";
import { projectLive, renderLive } from "./tastytrade-live.mjs";
import { silhouette } from "./tastytrade-payoff-render.mjs";
import { cellWidth } from "./tastytrade-live-render.mjs";
import { liveEvidence, sampleTrade } from "./tastytrade-fixtures.mjs";
const terms = holdings => holdings.map(h=>{
  const m=/^(\S+)\s+(\d{6})([CP])(\d{8})$/.exec(h.symbol);
  return {symbol:h.symbol,"instrument-type":"Equity Option","underlying-symbol":h["underlying-symbol"],
    "option-chain-type":"Standard","shares-per-contract":100,"option-type":m[3],"strike-price":String(Number(m[4])/1000),
    "expiration-date":h["expires-at"].slice(0,10)};
});
const spot={symbol:"EWZ","instrument-type":"Equity",bid:"39.59",ask:"39.61",mid:"39.60","updated-at":"2026-10-01T01:59:00Z"};
const evidence={...liveEvidence,instruments:terms(liveEvidence.holdings),spotQuotes:[spot]};
const position=()=>projectLive(evidence).positions[0];

test("approved graphic is line-based with proportional strikes and the same observed spot",()=>{
  const p=position(); assert.deepEqual(p.payoff.strikes,[31,32,42,43]);
  const s=silhouette(p); assert.equal(cellWidth(s.text),31);
  assert.match(s.text,/[_╱‾▲╲]+/); assert.doesNotMatch(s.text,/[\u2580-\u259f]/);
  assert.equal(s.markerIndex,Math.round((p.spot.value-s.lo)/(s.hi-s.lo)*29));
  assert.deepEqual(s.breaks,p.payoff.strikes.map(k=>Math.round((k-s.lo)/(s.hi-s.lo)*29)));
  assert.equal([...s.text].indexOf("▲"),s.markerIndex+1);
  assert.ok(s.breaks[2]-s.breaks[1]>8*(s.breaks[1]-s.breaks[0]));
});

test("semantic colors are independent of current P/L; ANSI stripping preserves all cells",()=>{
  const p=position(); p.pnl=-18; const plain=silhouette(p), colored=silhouette(p,{color:true});
  assert.equal(strip(colored.text),plain.text);
  for(const code of ["2;91","93","92","96"])assert.ok(colored.text.includes(`\x1b[${code}m`));
  const out=renderLive({...evidence,color:true}); assert.match(out,/TRADE SHAPE/);
  assert.ok(out.split("\n").every(l=>cellWidth(l)<157));
});

test("unequal wing widths keep their scale and explicitly label shape rather than dollar height",()=>{
  const p=position(); p.payoff={strikes:[30,32,42,43],leftTail:-1.58,rightTail:-.58,unequal:true,maximumProfit:.42};
  const s=silhouette(p);assert.ok(s.text.startsWith("≠"));
  const [a,b,c,d]=s.breaks;assert.ok((b-a)>(d-c));
  assert.ok(Math.abs((b-a)/(d-c)-2)<=1);
});

test("sub-cell wings and plateaux yield explicit compressed geometry, never invented widths",()=>{
  const p=position();
  for(const strikes of [[31,31.01,42,43],[31,32,32.01,43],[31,32,42.99,43]]) {
    p.payoff={...p.payoff,strikes};const s=silhouette(p); assert.equal(s.compressed,true);
    assert.equal(strip(s.text),"IC [compressed]");assert.doesNotMatch(s.text,/[▲▼◆╱╲]/);
  }
});

test("off-chart spot uses outward arrows; spot in the loss tail stays proportionally positioned",()=>{
  const p=position(); const initial=silhouette(p);
  for(const [value,char] of [[initial.lo-1,"←"],[initial.hi+1,"→"]]) {
    p.spot={...p.spot,value};assert.ok(silhouette(p).text.includes(char));
  }
  p.spot.value=43.5;const s=silhouette(p);assert.ok(s.text.includes("▼"));
  assert.ok(s.markerIndex>s.breaks[3]);assert.doesNotMatch(s.text,/→/);
});

test("missing spot has no marker; stale and retained observed spot markers stay cyan",()=>{
  const p=position();
  assert.doesNotMatch(silhouette({...p,spot:{value:null,stale:true}}).text,/[▲▼◆←→]/);
  const stale={...p,spot:{value:39.6,stale:true}};
  assert.match(silhouette(stale,{color:true}).text,/\x1b\[96m▲/);
  assert.equal(silhouette(stale).markerIndex,silhouette(p).markerIndex);
  const session={state:"Closed","previous-session":{"open-at":"2026-10-09T13:30:00Z","close-at":"2026-10-09T20:00:00Z"},"next-session":{"open-at":"2026-10-12T13:30:00Z"}};
  const retained={...evidence,session,now:new Date("2026-10-11T14:00:00Z"),
    quotes:evidence.quotes.map(q=>({...q,"updated-at":"2026-10-09T20:00:00Z"})),
    spotQuotes:[{...spot,"updated-at":"2026-10-09T20:00:00Z"}]};
  const r=projectLive(retained).positions[0];assert.equal(r.spot.retained,true);
  assert.match(silhouette(r).text,/▲/);assert.match(renderLive(retained),/39.60.*42h$/m);
});

test("unverified, adjusted, contradictory and duplicate terms withhold geometry only",()=>{
  for(const change of [i=>({...i,"option-chain-type":"Adjusted"}),i=>({...i,"shares-per-contract":33}),
    i=>({...i,"strike-price":"30"}),i=>({...i,"expiration-date":"2026-11-21"}),i=>({...i,"underlying-symbol":"OTHER"})]) {
    const instruments=evidence.instruments.map((i,n)=>n===0?change(i):i);
    const p=projectLive({...evidence,instruments}).positions[0];
    assert.equal(p.payoff,null);assert.notEqual(p.pnl,null);assert.match(silhouette(p).text,/\[\?terms\]/);
  }
  for(const instruments of [[],[...evidence.instruments,evidence.instruments[0]]])
    assert.equal(projectLive({...evidence,instruments}).positions[0].payoff,null);
});

test("ASCII remains a line silhouette and target/spot alignment is stable across 20 graphics",()=>{
  const s=silhouette(position(),{ascii:true});assert.doesNotMatch(s.text,/[^\x00-\x7f]/);
  assert.match(s.text,/\^/);
  const trades=Array.from({length:20},(_,i)=>sampleTrade(`T${i}`,"261120",[["P",31],["P",32],["C",42],["C",43]],[.52,.71,1.11,.88],[.45,.65,.75,.62],.21,.53));
  const holdings=trades.flatMap(t=>t.holdings);
  const data={...evidence,holdings,instruments:terms(holdings),quotes:trades.flatMap(t=>t.quotes),orders:trades.flatMap(t=>[t.opening,...t.closing.orders]),complexOrders:trades.map(t=>t.closing),spotQuotes:trades.map((_,i)=>({...spot,symbol:`T${i}`}))};
  for(const columns of [157,189]) {
    const ls=strip(renderLive({...data,columns,color:true})).trim().split("\n");
    const rows=ls.filter(l=>/^T\d+\s/.test(l));assert.equal(rows.length,20);
    assert.ok(rows.every(r=>r.indexOf("▲")===rows[0].indexOf("▲")));
    assert.ok(rows.every(r=>r.indexOf("P50")===rows[0].indexOf("P50")));
    assert.ok(ls.every(l=>cellWidth(l)<columns));assert.ok(ls.length<=26);
    const header=ls[1], start=rows[0].indexOf("___");
    assert.equal(header.indexOf("TRADE SHAPE"),8+Math.floor((31-11)/2));
    assert.ok(start>=8);
  }
});

test("batch-instrument rejection uses bounded existing single-contract reads; TSV skips both",async()=>{
  const { main }=await import("./tastytrade.mjs");
  for(const tsv of [false,true]) {
    const out=[],calls=[];let active=0,maxActive=0;
    const code=await main(["live","--account","5WX01234",...(tsv?["--tsv"]:[])],{
      env:{TASTYTRADE_CLIENT_ID:"x",TASTYTRADE_CLIENT_SECRET:"x",TASTYTRADE_REFRESH_TOKEN:"x",NO_COLOR:"1"},
      now:()=>evidence.now,terminalColumns:()=>157,out:s=>out.push(s),fetchImpl:async(u)=>{
        calls.push(u);let b;
        if(u.endsWith('/oauth/token'))b={access_token:'x'};
        else if(u.endsWith('/positions'))b={data:{items:evidence.holdings}};
        else if(u.includes('/complex-orders?'))b={data:{items:evidence.complexOrders},pagination:{'page-offset':0,'total-pages':1,'total-items':2}};
        else if(u.includes('/orders?'))b={data:{items:evidence.orders},pagination:{'page-offset':0,'total-pages':1,'total-items':evidence.orders.length}};
        else if(u.includes('equity-option[]='))b={data:{items:evidence.quotes}};
        else if(u.includes('equity[]='))b={data:{items:[spot]}};
        else if(u.includes('/instruments/equity-options?'))return{ok:false,status:403,json:async()=>({error:{code:'forbidden'}})};
        else if(u.includes('/instruments/equity-options/')){
          active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));active--;
          const symbol=decodeURIComponent(u.split('/').at(-1));b={data:evidence.instruments.find(i=>i.symbol===symbol)};
        } else if(u.endsWith('/sessions/current'))b={data:{state:'Open'}};
        else throw Error('unexpected');
        return{ok:true,json:async()=>b};
      }
    });
    assert.equal(code,0);assert.equal(calls.filter(u=>u.includes('/instruments/equity-options/')).length,tsv?0:8);
    assert.ok(maxActive<=4);if(!tsv)assert.match(out[0],/╱.*▲.*╲/);
    else assert.doesNotMatch(out[0],/╱|▲|PAYOFF/);
  }
});

test("PAYOFF uses a single rising/falling outline stroke and the observed triangle",()=>{
  const p=position();
  for(const strikes of [[31,32,42,43],[30,32,42,43]]) {
    p.payoff={...p.payoff,strikes};
    const s=silhouette(p);
    assert.equal((s.text.match(/╱/g)||[]).length,1);
    assert.equal((s.text.match(/╲/g)||[]).length,1);
    assert.equal((s.text.match(/▲/g)||[]).length,1);
    assert.equal(s.text.indexOf("╱"),1+Math.round(((strikes[0]+strikes[1])/2-s.lo)/(s.hi-s.lo)*29));
    assert.equal(s.text.indexOf("╲"),1+Math.round(((strikes[2]+strikes[3])/2-s.lo)/(s.hi-s.lo)*29));
    assert.equal(cellWidth(s.text),31);
    assert.doesNotMatch(s.text,/╱╱|╲╲/);
  }
});
