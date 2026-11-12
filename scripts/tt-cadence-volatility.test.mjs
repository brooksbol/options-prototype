import test from 'node:test';
import assert from 'node:assert/strict';
import {captureVolatility,buildVolatility,volatilitySummary} from './tt-cadence-volatility.mjs';
import {collectBroker} from './tt-cadence-evidence.mjs';

const at='2026-11-12T18:00:00.000Z', context={sessionDate:'2026-11-12'};
const item=(changes={})=>({symbol:'EEM','implied-volatility-index':'0.35',
  'implied-volatility-index-rank':'0.375','implied-volatility-index-rank-source':'tos',
  'tos-implied-volatility-index-rank':'0.375','tw-implied-volatility-index-rank':'0.25',
  'tos-implied-volatility-index-rank-updated-at':'2026-11-12T17:30:00Z',
  'implied-volatility-updated-at':'2026-11-12T17:59:00Z','updated-at':at,
  'implied-volatility-percentile':'0.91',...changes});
const capture=items=>captureVolatility({data:{items}},['EEM','QQQ'],at);
const build=(items,ctx=context)=>buildVolatility(capture(items),['EEM','QQQ'],ctx,at);

test('provider rank units match known 35/20/60 example; IV index, percentile and distinct methods survive',()=>{
  const e=build([item()]),r=e.records[0];
  assert.ok(Math.abs(r.ivRank-100*(.35-.2)/(.6-.2))<1e-10);
  assert.equal(r.ivRank,37.5);assert.equal(r.ivPercentile,91);assert.equal(r.ivIndex,.35);
  assert.equal(r.tosIvRank,37.5);assert.equal(r.twIvRank,25);assert.equal(r.methodologyDifference,12.5);
  assert.equal(r.rankObservedAt,'2026-11-12T17:30:00Z');assert.equal(r.rankAgeSeconds,1800);
  assert.equal(r.ivIndexObservedAt,'2026-11-12T17:59:00Z');assert.equal(r.retrievedAt,at);
  assert.equal(e.provenance.environment,'production');assert.equal(e.provenance.endpoint,'/market-metrics');
});
test('missing history/extrema and flat ranges never trigger a local calculator; provider true zero remains zero',()=>{
  const e=build([item({'implied-volatility-index-rank':0,'tos-implied-volatility-index-rank':0,minimum:0.35,maximum:0.35})]);
  assert.equal(e.records[0].ivRank,0);assert.equal(e.records[0].historicalMinimumIv,null);
  assert.equal(e.records[0].historicalMaximumIv,null);assert.equal(e.records[0].historicalObservationCount,null);
  assert.equal(e.records[1].ivRank,null);assert.equal(e.records[1].status,'SYMBOL_UNAVAILABLE');
  assert.equal(e.methodology.kind,'PROVIDER_REPORTED_NOT_LOCALLY_CALCULATED');
});
test('missing, invalid, nonfinite and out-of-range provider ranks never become zero, percentile or leg IV',()=>{
  for(const value of [null,undefined,'','NaN','Infinity','1e999',NaN,Infinity,-.1,1.01,true,[],{}]){
    const r=build([item({'implied-volatility-index-rank':value})]).records[0];
    assert.equal(r.ivRank,null);assert.equal(r.status,'RANK_MISSING_OR_INVALID');
  }
  const r=build([{symbol:'EEM',mid_iv:.9,'implied-volatility-percentile':.99}]).records[0];
  assert.equal(r.ivRank,null);assert.equal(r.ivIndex,null);assert.equal(r.ivPercentile,99);
  assert.equal(build([item({'implied-volatility-index':1.7})]).records[0].ivIndex,1.7);
});
test('old, absent, ambiguous-zone and future rank clocks cannot inherit fresh IV/row/receipt times',()=>{
  for(const [clock,status] of [['2026-11-11T17:00:00Z','RANK_NOT_FROM_EXPORT_SESSION'],
    [null,'RANK_TIME_UNKNOWN'],['2026-11-12 17:30:00','RANK_TIME_UNKNOWN'],
    ['2026-11-12T18:00:01Z','FUTURE_TIMESTAMP']]){
    const r=build([item({'tos-implied-volatility-index-rank-updated-at':clock})]).records[0];
    assert.equal(r.ivRank,null);assert.equal(r.observedIvRank,37.5);assert.equal(r.status,status);
  }
  const r=build([item({'tos-implied-volatility-index-rank-updated-at':'2026-11-13T00:30:00Z'})],context).records[0];
  assert.equal(r.rankSessionDate,'2026-11-12');assert.equal(r.status,'FUTURE_TIMESTAMP');
});
test('unknown methodology, headline-source disagreement, duplicates and damaged replay evidence fail explicitly',()=>{
  assert.equal(build([item({'implied-volatility-index-rank-source':'other'})]).records[0].status,'METHODOLOGY_UNKNOWN');
  assert.equal(build([item({'tos-implied-volatility-index-rank':.4})]).records[0].status,'HEADLINE_SOURCE_DISAGREEMENT');
  assert.equal(build([item({'implied-volatility-index-rank-source':'tw','tw-implied-volatility-index-rank':.375})]).records[0].status,'RANK_TIME_UNKNOWN');
  assert.equal(build([item(),item()]).records[0].status,'AMBIGUOUS_SYMBOL');
  const evidence=capture([item()]);evidence.items[0]['implied-volatility-index-rank']=.4;
  assert.equal(buildVolatility(evidence,['EEM'],context,at).records[0].status,'SOURCE_UNAVAILABLE');
  assert.throws(()=>captureVolatility({},['EEM'],at));
});
test('offline replay is deterministic from retained selected fields, session and evaluation clock; all symbols remain visible',()=>{
  const e=build([item()]);
  assert.deepEqual(buildVolatility(JSON.parse(JSON.stringify(e.provenance)),['EEM','QQQ'],context,at),e);
  assert.deepEqual(e.coverage,{requested:2,returned:1,usable:1,unavailable:1});
  assert.match(volatilitySummary(e),/EEM \| 37.5 \| tos/);assert.match(volatilitySummary(e),/QQQ \| —/);
});

function brokerFixture(metrics){
 const calls=[];return {calls,fetchImpl:async(url,opt)=>{
  const u=new URL(url),p=u.pathname;calls.push({method:opt.method,path:p,query:u.search});
  if(p==='/oauth/token')return Response.json({access_token:'fixture-token'});
  assert.equal(opt.method,'GET');assert.equal(opt.redirect,'error');
  if(p==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':'DUMMY1234'}}]}});
  if(p.endsWith('/positions'))return Response.json({data:{items:[]}});
  if(p.endsWith('/orders')||p.endsWith('/complex-orders'))return Response.json({data:{items:[]},pagination:{'page-offset':0,'total-pages':0,'total-items':0}});
  if(p.endsWith('/balances'))return Response.json({data:{currency:'USD','updated-at':at,'derivative-buying-power':'1000'}});
  if(p.endsWith('/requirements'))return Response.json({data:{'account-number':'DUMMY1234',groups:[],'last-state-timestamp':Date.parse(at)}});
  if(p.endsWith('/sessions/current'))return Response.json({data:{state:'Closed'}});
  if(p==='/market-metrics')return typeof metrics==='function'?metrics():Response.json({data:{items:metrics}});
  throw Error('Unexpected route');
 }};
}
const options={allowSingleAccount:true,cadenceMarket:true,env:{TASTYTRADE_CLIENT_ID:'fixture-client',TASTYTRADE_CLIENT_SECRET:'fixture-secret',TASTYTRADE_REFRESH_TOKEN:'fixture-refresh'},now:()=>new Date(at)};
test('collector uses one OAuth and one bounded 14-symbol GET, preserving the rank-specific clock without account leakage',async()=>{
  const f=brokerFixture([item()]),r=await collectBroker({...options,fetchImpl:f.fetchImpl});
  assert.equal(r.volatilityObservation.items[0]['tos-implied-volatility-index-rank-updated-at'],item()['tos-implied-volatility-index-rank-updated-at']);
  const requests=f.calls.filter(c=>c.path==='/market-metrics');assert.equal(requests.length,1);
  assert.equal(new URLSearchParams(requests[0].query).get('symbols').split(',').length,14);
  assert.equal(f.calls.filter(c=>c.method==='POST').length,1);
  assert.ok(!JSON.stringify(r).includes('DUMMY1234'));assert.ok(!JSON.stringify(r).includes('fixture-token'));
  assert.equal(r.marketAcquisition.mode,'CLOSED');
});
test('partial provider failures, denial and malformed metrics preserve holdings/orders/balances and prohibit broker mutations',async()=>{
  for(const metrics of [()=>{throw Error('offline');},()=>new Response('{}',{status:403}),()=>Response.json({data:{items:null}}),
    [item({'implied-volatility-index-rank-source':'fixture-token'})]]){
    const f=brokerFixture(metrics),r=await collectBroker({...options,fetchImpl:f.fetchImpl});
    assert.equal(r.volatilityObservation,null);assert.ok(r.failures.some(f=>f.code==='VOLATILITY_READ_UNAVAILABLE'));
    for(const suffix of ['/positions','/orders','/complex-orders','/balances'])assert.ok(r.reads.some(r=>r.path.endsWith(suffix)));
    assert.equal(r.projection.positions.length,0);assert.equal(r.orderCoverage.orders,'COMPLETE');
    assert.ok(f.calls.every(c=>c.method==='GET'||c.path==='/oauth/token'));
  }
});
