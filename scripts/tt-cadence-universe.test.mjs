import test from 'node:test';
import assert from 'node:assert/strict';
import {RESEARCH_UNIVERSE as u,EXPORT_SYMBOLS,eventEvidence,annotateResearch} from './tt-cadence-universe.mjs';
import {captureVolatility} from './tt-cadence-volatility.mjs';
import {CADENCE_SYMBOLS,catalogPuts} from './tt-cadence-market.mjs';
import {buildMarket,pairEconomics,sessionContext} from './ww-export-tt1.mjs';
const at=new Date('2026-11-12T19:30:00Z'),context=sessionContext(at);
const obs=items=>captureVolatility({data:{items}},items.map(i=>i.symbol),at.toISOString());
test('frozen control14 and measured ordinary39 preserve identity, exclusions and reproducible union47',()=>{
 assert.deepEqual(u.historicalControlSymbols,CADENCE_SYMBOLS);assert.equal(u.expandedOrdinarySymbols.length,39);assert.equal(EXPORT_SYMBOLS.length,47);
 for(const s of ['USO','GLD','SLV','GDX','IBIT','VXX'])assert.ok(!u.expandedOrdinarySymbols.includes(s));
 assert.ok(u.expandedOrdinarySymbols.includes('XLE'));assert.ok(u.expandedOrdinarySymbols.includes('AAPL'));
 assert.equal(u.symbols.find(s=>s.symbol==='AAPL').securityType,'EQUITY');assert.equal(u.symbols.find(s=>s.symbol==='XLE').securityType,'ETF');
 assert.equal(u.reviewProducts.find(s=>s.symbol==='VXX').securityType,'VOLATILITY_ETN');assert.match(u.specificationSha256,/^[a-f0-9]{64}$/);
});
test('known earnings cross lifespan; past, absent and malformed future dates never establish safety',()=>{
 assert.equal(eventEvidence('NVDA','2026-12-24',obs([]),context,at.toISOString()).status,'EARNINGS_CROSSING');
 for(const earnings of [undefined,{}, {'expected-report-date':'2026-10-20'},{'expected-report-date':'not-date'}])assert.equal(eventEvidence('AAPL','2026-12-24',obs([{symbol:'AAPL',earnings}]),context,at.toISOString()).status,'FUTURE_EARNINGS_UNVERIFIED');
 const e=eventEvidence('AAPL','2026-12-24',obs([{symbol:'AAPL',earnings:{visible:true,estimated:false,'expected-report-date':'2027-01-20','updated-at':'2026-11-12T17:00:00Z'}}]),context,at.toISOString());
 assert.equal(e.status,'REPORTED_EVENT_AFTER_EXPIRATION');assert.equal(e.confidence,'PROVIDER_REPORTED');assert.equal(e.providerEarningsUpdatedAt,'2026-11-12T17:00:00Z');
});
test('event/membership qualification is additive and leaves spread economics and control calculations intact',()=>{
 const economics=pairEconomics({strike:100,bid:1,ask:1.1},{strike:99,bid:.4,ask:.5});
 const p={underlying:'SPY',expiration:'2026-12-24',shortOpenInterest:100,longOpenInterest:100,shortVolume:10,longVolume:10,qualifiedForCurrentDeltaSelection:true,source:{shortObservation:{rawQuote:{'bid-size':'1','ask-size':'1'}},longObservation:{rawQuote:{'bid-size':'1','ask-size':'1'}}},...economics};
 const original=structuredClone(p);const market={verticalPairs:[p,{...p,underlying:'NVDA'},{...p,underlying:'AAPL'},{...p,underlying:'USO'}]};annotateResearch(market,obs([]),context,at.toISOString());
 const {research,...preserved}=market.verticalPairs[0];assert.deepEqual(preserved,original);assert.equal(research.eligibleForPrimaryResearch,true);
 assert.equal(market.verticalPairs[1].research.cohort,'SHADOW_EARNINGS');assert.equal(market.verticalPairs[1].research.eligibleForPrimaryResearch,false);
 assert.equal(market.verticalPairs[2].research.cohort,'EVENT_UNVERIFIED');assert.equal(market.verticalPairs[3].research.cohort,'EXCLUDED_NEW_ENTRY');
});
test('historical42–52 and recent38–45 remain distinct; compact source references retain contract economics',()=>{
 const chain=expiry=>({expiration:expiry,chainAcquisitionProvenance:{kind:'chain-acquired',acquiredAt:at.toISOString()},data:{symbol:'SPY',expiration:expiry,underlying:{price:110},puts:[{strike:99,delta:-.1,bid:.4,ask:.5},{strike:100,delta:-.25,bid:1,ask:1.1}]}});
 const snapshot={apiVersion:'1',generation:1,symbols:[{symbol:'SPY',expirations:[{date:'2026-12-24'},{date:'2026-12-31'}],chains:[chain('2026-12-24'),chain('2026-12-31')]}]};
 const legacy=buildMarket(snapshot,context,at),historical=buildMarket(snapshot,context,at,{symbols:['SPY'],filter:{minDte:42,maxDte:52},compact:true});
 assert.equal(legacy.verticalPairs.length,1);assert.equal(historical.verticalPairs.length,2);assert.deepEqual(legacy.verticalPairs[0].natural,historical.verticalPairs[0].natural);
 assert.equal(historical.verticalPairs[0].source.shortGeometryKey,'SPY|2026-12-24|PUT|100');
});
test('review U1: zero, missing and invalid displayed sizes cannot qualify primary research',()=>{
 for(const value of [0,'0',null,undefined,'NaN',Infinity,true]){
  const p={underlying:'SPY',expiration:'2026-12-24',shortOpenInterest:100,longOpenInterest:100,shortVolume:10,longVolume:10,qualifiedForCurrentDeltaSelection:true,natural:{creditPerShare:.5},midpoint:{creditPerShare:.6},source:{shortObservation:{rawQuote:{'bid-size':value,'ask-size':'1'}},longObservation:{rawQuote:{'bid-size':'1','ask-size':'1'}}}};
  annotateResearch({verticalPairs:[p]},obs([]),context,at.toISOString());assert.equal(p.research.eligibleForPrimaryResearch,false);assert.equal(p.research.liquidity.allLegDisplayedSizesAtLeastOne,false);
 }
});
test('review U2: duplicate/conflicting event rows and invalid source clocks remain unverified',()=>{
 const earnings=date=>({visible:true,estimated:false,'expected-report-date':date,'updated-at':'2026-11-12T18:00:00Z'});
 const duplicate=obs([{symbol:'AAPL',earnings:earnings('2027-01-20')},{symbol:'AAPL',earnings:earnings('2026-11-20')}]);
 assert.equal(eventEvidence('AAPL','2026-12-24',duplicate,context,at.toISOString()).status,'EVENT_EVIDENCE_AMBIGUOUS');
 for(const observation of [{...obs([{symbol:'AAPL',earnings:earnings('2027-01-20')}]),retrievedAt:'2026-11-13T00:00:00Z'},obs([{symbol:'AAPL',earnings:{...earnings('2027-01-20'),'updated-at':'no-clock'}}])])assert.equal(eventEvidence('AAPL','2026-12-24',observation,context,at.toISOString()).status,'FUTURE_EARNINGS_UNVERIFIED');
});
test('event qualification reuses strict volatility clock validation, rejecting normalized impossible dates',()=>{
 for(const clock of ['2026-02-30T18:00:00Z','2026-13-01T18:00:00Z','2026-11-12 18:00:00','invalid']){
  const e=eventEvidence('AAPL','2026-12-24',obs([{symbol:'AAPL',earnings:{visible:true,estimated:false,'expected-report-date':'2027-01-20','updated-at':clock}}]),context,at.toISOString());assert.equal(e.status,'FUTURE_EARNINGS_UNVERIFIED');assert.equal(e.providerEarningsQualified,false);
 }
});
