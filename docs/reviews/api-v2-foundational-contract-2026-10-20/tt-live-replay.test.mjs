// Offline equivalence oracle against actual transitional source, not a v2 implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectLive} from '../../../scripts/tastytrade-live-domain.mjs';
import {liveEvidence} from '../../../scripts/tastytrade-fixtures.mjs';
const fixture=JSON.parse(readFileSync(new URL('./examples/tt-live-equivalence.json',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-Number(b))<1e-8,`${a} != ${b}`);
test('repository EWZ and XLE leg fills and quotes reproduce exact candidate package money and DTE',()=>{
 const p=projectLive(liveEvidence).positions;
 for(const f of fixture.positions){const actual=p.find(p=>p.symbol===f.symbol), e=f.evaluation;
  near(actual.credit*actual.quantity*actual.multiplier,e.openingCashFlow.value);
  near(-actual.market.closeDebit*actual.quantity*actual.multiplier,e.estimatedClosingCashFlow.value);
  near(actual.pnl,e.grossUnrealizedPl.value);
  near(actual.dte,e.timeline.remainingDays.value);near(actual.lifespan.openingDte,e.timeline.originalDays.value);
  near(actual.economicObjectives.targetGrossProfit,e.management.profitTargetGrossPl.value);
  assert.equal(actual.market.valuationSource,'midpoint');
 }
});
test('absent opening fills preserve close evidence but do not substitute working limit for credit',()=>{
 const data=structuredClone(liveEvidence);data.orders=data.orders.filter(o=>!String(o.id).endsWith('-open'));
 const p=projectLive(data).positions[0];assert.equal(p.credit,null);assert.equal(p.pnl,null);near(p.market.closeDebit,'.33');
});
test('ambiguous closing-order evidence withholds management independently of gross P/L',()=>{
 const data=structuredClone(liveEvidence);data.orders.push({...data.orders.find(o=>String(o.id).endsWith('-target')),id:'ambiguous-target'});
 const p=projectLive(data).positions[0];assert.equal(p.protectiveExitEvidence.state,'unavailable');near(p.pnl,9);
});
const observed=JSON.parse(readFileSync(new URL('../../../scripts/fixtures/tt-live-economic-observed.json',import.meta.url)));observed.now=new Date(observed.now);
const parity=JSON.parse(readFileSync(new URL('./examples/tt-live-expanded-parity.json',import.meta.url)));
for(const f of parity.positions)test(`expanded financial meaning: ${f.symbol}, geometry/range/spot/DTE/exit/quotes/orders/freshness`,()=>{
 const p=projectLive(observed).positions.find(x=>x.symbol===f.symbol),e=f.evaluation;
 near(p.credit*p.quantity*p.multiplier,e.openingCashFlow.value);near(-p.market.closeDebit*p.quantity*p.multiplier,e.estimatedClosingCashFlow.value);near(p.pnl,e.grossUnrealizedPl.value);
 near(p.spot.value,e.spot.value);assert.equal(p.spot.stale,false);near(p.dte,e.timeline.remainingDays.value);near(p.lifespan.openingDte,e.timeline.originalDays.value);
 near(p.economicObjectives.targetGrossProfit,e.management.profitTargetGrossPl.value);near(p.progress,Number(e.grossUnrealizedPl.value)/Number(e.management.profitTargetGrossPl.value));
 // Reported trigger semantics are deliberately provisional, never a guaranteed closing price.
 near(p.economicObjectives.stopThreshold.grossPnl,e.management.reportedStopThresholdGrossPl.value);near(p.economicObjectives.stopThreshold.closingDebit,f.orderTerms.stopTrigger);near(p.economicObjectives.stopThreshold.limitDebit,f.orderTerms.stopLimit);assert.equal(e.management.stopInterpretation,'PROVISIONAL_NOT_EXECUTION_GUARANTEE');
 assert.equal(p.market.oldest,f.quote.optionOldestEpochMs);assert.equal(p.market.stale,false);assert.equal(p.optionEvidence.stale,false);assert.equal(p.market.valuationSource,'midpoint');assert.ok(p.targetOrder);assert.ok(p.stopOrder);
 if(p.range){near(p.range.lower,e.range.lower);near(p.range.upper,e.range.upper);}else assert.equal(p.rangeLabel,`≥${e.range.lower}`);
 const g=e.payoff.geometry;near(Number(g.segments[0].intercept),p.payoff.leftTail*p.quantity*p.multiplier);near(Number(g.segments.at(-1).intercept),p.payoff.rightTail*p.quantity*p.multiplier);
 assert.equal(g.breakEvenPrices.length,p.breakevens.length);g.breakEvenPrices.forEach((v,i)=>near(p.breakevens[i],v));
 if(p.manualExit){assert.equal(p.manualExit.checkpointDate,e.management.manualCheckpoint.date);assert.equal(p.manualExit.checkpointDte,21);assert.equal(e.management.manualCheckpoint.meaning,'MANUAL_REVIEW_CONVENTION_NOT_TIMED_EXIT');}
});
test('stale or unavailable observations remain qualified independently of valid held exposure',()=>{
 const data=structuredClone(observed);data.now=new Date(observed.now.getTime()+86400000);const p=projectLive(data).positions[0];assert.equal(p.optionEvidence.stale,true);assert.equal(p.market.stale,true);assert.ok(p.quantity>0);
 const missing=structuredClone(liveEvidence);missing.orders=missing.orders.filter(o=>!String(o.id).endsWith('-open'));const m=projectLive(missing).positions[0];assert.equal(m.credit,null);assert.equal(m.pnl,null);assert.equal(m.payoff,null);assert.ok(m.market.closeDebit>0);
});
