import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireCadenceMarket,catalogPuts,qualifyRow,marketMode,brokerMarketSnapshot,CADENCE_SYMBOLS,QUOTE_FRESH_MS,LIMITS} from './tt-cadence-market.mjs';
import {buildMarket,validateMarket,sessionContext} from './ww-export-tt1.mjs';
const at=new Date('2026-10-30T14:30:00Z'),session={state:'Open','open-at':'2026-10-30T13:30:00Z','close-at':'2026-10-30T20:00:00Z'};
const identity=(s,k)=>s+'   261211P'+String(k*1000).padStart(8,'0');
const catalog=(symbol='GLD',strikes=[327.5,335,340,345,350,357])=>({data:{items:[{'underlying-symbol':symbol,'option-chain-type':'Standard','shares-per-contract':100,deliverables:[],expirations:[{'expiration-date':'2026-12-11',strikes:strikes.map(k=>({'strike-price':String(k),put:identity(symbol,k),'put-streamer-symbol':'.'+symbol+'261211P'+String(k)}))}]}]}});
const spot=s=>({symbol:s,'instrument-type':'Equity',bid:'357.1',ask:'357.2','updated-at':'2026-10-30T14:29:59Z'});
function quote(s){const strike=Number(s.slice(-8))/1000;return {symbol:s,'instrument-type':'Equity Option',bid:String(strike/40),ask:String(strike/40+.1),delta:String(strike===340?-.27:strike===345?-.32:strike===350?-.38:strike===357?-.49:-.1),'open-interest':strike===335?0:null,volume:null,'updated-at':'2026-10-30T14:29:59Z'};}
function mock(){const calls=[];return {calls,readGreeks:async({contracts})=>contracts.map(c=>({symbol:c.symbol,delta:Number(quote(c.symbol).delta),updatedAt:at.getTime()-1000})),get:async path=>{calls.push(path);const u=new URL(path,'https://api.tastyworks.com');if(u.pathname.startsWith('/option-chains/'))return {body:catalog(u.pathname.split('/')[2]),retrievedAt:at.toISOString()};assert.equal(u.pathname,'/market-data/by-type');const s=u.searchParams.get('equity'),ids=u.searchParams.get('equity-option').split(',');assert.ok(ids.length+1<=100);return {body:{data:{items:[spot(s),...ids.map(quote)]}},retrievedAt:at.toISOString()};}};}
test('regular session comes from broker clock; closed/weekend/unknown never starts provider acquisition',async()=>{
 assert.equal(marketMode(session,at),'REGULAR');assert.equal(marketMode({...session,state:'Closed'},at),'UNKNOWN');
 for(const s of [{state:'Closed'},null,{state:'Open'}, {...session,state:'Open'}]){
  const now=()=>new Date('2026-10-31T16:00:00Z');let calls=0;const a=await acquireCadenceMarket({get:()=>{calls++;throw Error();},session:s,sessionDate:'2026-10-30',now,pause:async()=>{}});assert.equal(calls,0);assert.equal(a.requestCount,0);
 }
});
test('all14 ETF catalogs/eligible puts acquired, exact identities and adjacent strikes, no delta/width restriction on protective legs',async()=>{
 const m=mock(),a=await acquireCadenceMarket({...m,session,sessionDate:'2026-10-30',now:()=>at,pause:async()=>{}});assert.equal(a.catalogs.length,14);assert.equal(a.observations.length,14*6);assert.equal(a.requestCount,28);assert.deepEqual(a.symbolsRequested,[...CADENCE_SYMBOLS]);
 const market=buildMarket(brokerMarketSnapshot(a,at),sessionContext(at),at);validateMarket(market);
 const g=market.verticalPairs.filter(p=>p.underlying==='GLD');assert.equal(g.length,2);assert.ok(g.every(p=>p.shortStrike===340&&p.shortDelta===-.27));assert.deepEqual(g.map(p=>p.width),[12.5,5]);assert.ok(g.every(p=>p.longDelta===-.1));assert.equal(g[0].observedMultiplier,100);
 const rows=market.contracts.filter(c=>c.underlying==='GLD');assert.ok(rows.some(c=>c.observed.strike===357&&c.observed.delta===-.49&&!c.shortDeltaEligible));assert.equal(rows.find(c=>c.observed.strike===335).observed.openInterest,0);assert.equal(rows.find(c=>c.observed.strike===340).observed.openInterest,null);assert.equal(rows[0].observedContractIdentity,identity('GLD',327.5));
 assert.ok(g.every(p=>!p.exclusions.length));assert.ok(g[0].source.shortObservation.greeksTimeQualification.includes('independent DXLink'));
});
test('quote/spot clocks fail closed for missing, old, prior-session, future, mixed-age, halt and missing delta',()=>{
 const q=quote(identity('GLD',340)),s=spot('GLD');assert.equal(qualifyRow(q,s,session,at).quoteRowEligible,true);assert.equal(qualifyRow(q,s,session,at).eligible,false);assert.equal(qualifyRow(q,s,session,at,{symbol:q.symbol,delta:-.27,updatedAt:at.getTime()-1000}).eligible,true);
 for(const x of [null,'2026-10-29T14:29:59Z','2026-10-30 14:29:59','2026-10-30T14:30:01Z','2026-10-30T14:27:59Z'])assert.equal(qualifyRow({...q,'updated-at':x},s,session,at).eligible,false);
 assert.equal(qualifyRow(q,{...s,'updated-at':'2026-10-30T14:27:59Z'},session,at).eligible,false);
 assert.equal(qualifyRow({...q,delta:null},s,session,at).eligible,false);assert.equal(qualifyRow({...q,'is-trading-halted':true},s,session,at).eligible,false);
 assert.equal(qualifyRow(q,{...s,bid:null},session,at).underlyingSpot,null);assert.equal(QUOTE_FRESH_MS,120000);
});
test('HTTP429/403 stops remaining acquisition without retry, preserving bounded partial status',async()=>{
 for(const code of ['HTTP_429','HTTP_403']){let calls=0;const a=await acquireCadenceMarket({get:async()=>{calls++;throw Error(code);},session,sessionDate:'2026-10-30',now:()=>at,pause:async()=>{}});assert.equal(calls,1);assert.equal(a.failures[0].code,code);assert.equal(a.unvisitedSymbols.length,14);}
});
test('catalog rejects mismatched identities/expirations/duplicates; no arbitrary or adjusted geometry substitution',()=>{
 const bad=catalog();bad.data.items[0].expirations[0].strikes[0].put=identity('SPY',327.5);assert.throws(()=>catalogPuts(bad,'GLD','2026-10-30'),/IDENTITY/);
 const duplicate=catalog();duplicate.data.items.push(duplicate.data.items[0]);assert.throws(()=>catalogPuts(duplicate,'GLD','2026-10-30'),/AMBIGUOUS/);
 const adjusted=catalog();adjusted.data.items[0]['shares-per-contract']=10;assert.equal(catalogPuts(adjusted,'GLD','2026-10-30').length,0);
});
test('100-symbol limit batches all retained puts; missing rows remain missing, stale rows excluded, no request truncation',async()=>{
 const m=mock(),original=m.get;let batch=0;m.get=async path=>{if(path.startsWith('/option-chains/'))return {body:catalog('GLD',Array.from({length:132},(_,i)=>i+200)),retrievedAt:at.toISOString()};const r=await original(path);batch++;if(batch===1)r.body.data.items.pop();return r;};
 const a=await acquireCadenceMarket({...m,symbols:['GLD'],session,sessionDate:'2026-10-30',now:()=>at,pause:async()=>{}});assert.equal(batch,2);assert.equal(a.observations.length,132);assert.ok(a.failures.some(f=>f.code==='MISSING_REQUESTED_QUOTE_ROWS'));assert.equal(a.observations.filter(o=>o.quote===null).length,1);
 const later=new Date(at.getTime()+QUOTE_FRESH_MS+1),market=buildMarket(brokerMarketSnapshot(a,later),sessionContext(at),later);assert.ok(market.verticalPairs.every(p=>p.exclusions.length>0));assert.ok(a.requestCount<LIMITS.requests);
});
test('retained data remains constructed off-hours and is never current-qualified even when old backend admission says true',()=>{
 const snapshot={apiVersion:'1',generation:99,symbols:[{symbol:'GLD',expirations:[{date:'2026-12-11'}],chains:[{expiration:'2026-12-11',chainAcquisitionProvenance:{kind:'chain-acquired',acquiredAt:'2026-10-29T15:00:00Z'},admissibility:{admissible:true},data:{symbol:'GLD',expiration:'2026-12-11',underlying:{price:360},puts:[{strike:350,delta:-.1,bid:1,ask:1.1},{strike:357,delta:-.296,bid:2,ask:2.1,greeksUpdatedAt:'2026-10-29 19:59:52'}]}}]}]};
 const market=buildMarket(snapshot,sessionContext(new Date('2026-10-31T16:00:00Z')),new Date('2026-10-31T16:00:00Z'));validateMarket(market);assert.equal(market.verticalPairs.length,1);assert.equal(market.verticalPairs[0].status,'RETAINED_TEST_ONLY');assert.ok(market.verticalPairs[0].exclusions.includes('RETAINED_NOT_CURRENT_TRADE_EVIDENCE'));assert.equal(market.contracts[1].source.providerGreeksUpdatedAt,'2026-10-29 19:59:52');
});
test('standalone collector with flat custody still reads session, preserves finance and performs only bounded public GETs',async()=>{
 const {collectBroker}=await import('./tt-cadence-evidence.mjs');const calls=[];
 const fetchImpl=async(url,opt)=>{
  const u=new URL(url);calls.push([opt.method,u.pathname]);
  if(u.pathname==='/oauth/token')return Response.json({access_token:'dummy-token'});
  assert.equal(opt.method,'GET');assert.ok(!/refresh|sync|dry-run/.test(u.pathname));
  if(u.pathname==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':'DUMMY1234'}}]}});
  if(u.pathname.endsWith('/positions'))return Response.json({data:{items:[]}});
  if(u.pathname.endsWith('/orders')||u.pathname.endsWith('/complex-orders'))return Response.json({data:{items:[]},pagination:{'page-offset':0,'total-pages':0,'total-items':0}});
  if(u.pathname.endsWith('/balances'))return Response.json({data:{currency:'USD','updated-at':at.toISOString(),'derivative-buying-power':'1000'}});
  if(u.pathname.endsWith('/requirements'))return Response.json({data:{'account-number':'DUMMY1234',groups:[],'last-state-timestamp':at.getTime()}});
  if(u.pathname.endsWith('/sessions/current'))return Response.json({data:{state:'Closed'}});
  throw Error('Unexpected public route');
 };
 const r=await collectBroker({allowSingleAccount:true,cadenceMarket:true,fetchImpl,env:{TASTYTRADE_CLIENT_ID:'dummy-client',TASTYTRADE_CLIENT_SECRET:'dummy-secret',TASTYTRADE_REFRESH_TOKEN:'dummy-refresh'},now:()=>at});
 assert.equal(r.marketAcquisition.mode,'CLOSED');assert.equal(r.marketAcquisition.requestCount,0);assert.equal(r.projection.positions.length,0);assert.equal(calls.filter(([m])=>m==='POST').length,1);assert.ok(calls.some(([,p])=>p.endsWith('/sessions/current')));assert.ok(!JSON.stringify(r).includes('DUMMY1234'));assert.ok(!JSON.stringify(r).includes('dummy-token'));
});
test('deadline covers pacing and remaining in-flight timeout; no provider call begins after budget',async()=>{
 let elapsed=0;const starts=[],timeouts=[],start=at.getTime();
 const a=await acquireCadenceMarket({session,sessionDate:'2026-10-30',now:()=>new Date(start+elapsed),pause:async ms=>{elapsed+=ms;},get:async(path,{timeoutMs})=>{starts.push(elapsed);timeouts.push(timeoutMs);elapsed+=8540;return {body:{data:{items:[]}},retrievedAt:new Date(start+elapsed).toISOString()};}});
 assert.ok(starts.every(t=>t<LIMITS.durationMs));assert.ok(elapsed<=LIMITS.durationMs);assert.equal(starts.length,10);assert.ok(a.failures.some(f=>f.code==='ACQUISITION_CAP_REACHED'));
 assert.ok(timeouts.every((t,i)=>t<=10000&&t<=LIMITS.durationMs-starts[i]));
});
test('HTTP denial status survives unreadable bodies; collector stops market contacts on first429/401/403',async()=>{
 const {collectBroker}=await import('./tt-cadence-evidence.mjs');
 for(const status of [429,401,403]){
  let catalogs=0;const fetchImpl=async(url,opt)=>{
   const p=new URL(url).pathname;
   if(p==='/oauth/token')return Response.json({access_token:'dummy-token'});
   assert.equal(opt.method,'GET');
   if(p==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':'DUMMY1234'}}]}});
   if(p.endsWith('/positions'))return Response.json({data:{items:[]}});
   if(p.endsWith('/orders')||p.endsWith('/complex-orders'))return Response.json({data:{items:[]},pagination:{'page-offset':0,'total-pages':0,'total-items':0}});
   if(p.endsWith('/balances'))return Response.json({data:{currency:'USD','updated-at':at.toISOString(),'derivative-buying-power':'1000'}});
   if(p.endsWith('/requirements'))return Response.json({data:{'account-number':'DUMMY1234',groups:[],'last-state-timestamp':at.getTime()}});
   if(p.endsWith('/sessions/current'))return Response.json({data:session});
   if(p.startsWith('/option-chains/')){catalogs++;return new Response(new ReadableStream({start(c){c.error(Error('unreadable body'));}}),{status});}
   throw Error('Unexpected route');
  };
  const r=await collectBroker({allowSingleAccount:true,cadenceMarket:true,fetchImpl,env:{TASTYTRADE_CLIENT_ID:'dummy-client',TASTYTRADE_CLIENT_SECRET:'dummy-secret',TASTYTRADE_REFRESH_TOKEN:'dummy-refresh'},now:()=>at});
  assert.equal(catalogs,1);assert.equal(r.marketAcquisition.failures[0].code,'HTTP_'+status);assert.equal(r.projection.positions.length,0);assert.ok(r.reads.some(x=>x.path.endsWith('/balances')));
 }
});
test('independent Greek clock is required for short selection; a fresh REST row cannot launder prior-day Greeks; long delta may be absent',async()=>{
 const m=mock();m.readGreeks=async()=>[];
 let a=await acquireCadenceMarket({...m,session,sessionDate:'2026-10-30',now:()=>at,pause:async()=>{}}),market=buildMarket(brokerMarketSnapshot(a,at),sessionContext(at),at);
 assert.ok(market.verticalPairs.length);assert.ok(market.verticalPairs.every(p=>p.exclusions.includes('SHORT_GREEK_FRESHNESS_NOT_ESTABLISHED')));
 m.readGreeks=async({contracts})=>contracts.filter(c=>c.strike===340).map(c=>({symbol:c.symbol,delta:-.27,updatedAt:at.getTime()-1000}));
 const original=m.get;m.get=async path=>{const r=await original(path);if(path.startsWith('/market-data/'))for(const q of r.body.data.items)if(q.symbol!==identity(q.symbol.split(' ')[0],340))q.delta=null;return r;};
 a=await acquireCadenceMarket({...m,symbols:['GLD'],session,sessionDate:'2026-10-30',now:()=>at,pause:async()=>{}});market=buildMarket(brokerMarketSnapshot(a,at),sessionContext(at),at);assert.equal(market.verticalPairs.length,2);assert.ok(market.verticalPairs.every(p=>p.longDelta===null&&!p.exclusions.length));
 const q=quote(identity('GLD',340)),s=spot('GLD');const old=qualifyRow(q,s,session,at,{symbol:q.symbol,delta:-.28,updatedAt:Date.parse('2026-10-29T20:00:05Z')});assert.equal(old.quoteRowEligible,true);assert.equal(old.greeksFreshness,'NOT_ESTABLISHED');assert.equal(old.eligible,false);
});
