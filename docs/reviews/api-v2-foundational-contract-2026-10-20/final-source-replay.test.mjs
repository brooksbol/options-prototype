// Independent read-only comparisons against repository Product projection AND underlying source rows.
// Does not import the example generator/adapter and never contacts a broker.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {projectLive} from '../../../scripts/tastytrade-live-domain.mjs';import {liveEvidence} from '../../../scripts/tastytrade-fixtures.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));const observed=read('../../../scripts/fixtures/tt-live-economic-observed.json');observed.now=new Date(observed.now);
const near=(a,b)=>assert.ok(Math.abs(Number(a)-Number(b))<1e-8,`${a} != ${b}`),iso=x=>new Date(x).toISOString();
const ny=d=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(d));const get=t=>parts.find(p=>p.type===t).value;return Date.UTC(Number(get('year')),Number(get('month'))-1,Number(get('day')));};
for(const [file,input] of [['tt-live-equivalence.json',liveEvidence],['tt-live-expanded-parity.json',observed]]){
 const f=read('./examples/'+file),actual=projectLive(input).positions;
 test(`${file}: opening dates, expiration and actual NY date arithmetic`,()=>{
  for(const row of f.positions){const p=actual.find(p=>p.symbol===row.symbol),e=row.evaluation;assert.equal(e.timeline.openedAt,iso(p.openedAt));assert.equal(e.timeline.expiration,p.expiry.slice(0,10));assert.equal(Number(e.timeline.remainingDays.value),Math.max(0,(ny(p.expiry)-ny(input.now))/86400000));assert.equal(Number(e.timeline.originalDays.value),(ny(p.expiry)-ny(p.openedAt))/86400000);assert.ok(e.timeline.originalDays.dependencies.includes('ORDER_EVIDENCE'));
   const holdings=input.holdings.filter(x=>x['underlying-symbol']===p.symbol),symbols=new Set(holdings.map(x=>x.symbol)),orders=input.orders.filter(o=>o.legs?.length===symbols.size&&o.legs.every(l=>symbols.has(l.symbol)&&/to Open$/.test(l.action))&&o.legs.every(l=>l.fills?.length));assert.equal(orders.length,1);const fills=orders[0].legs.flatMap(l=>l.fills);assert.equal(e.timeline.openedAt,iso(Math.max(...fills.map(x=>Date.parse(x['filled-at'])))));
  }
 });
 test(`${file}: SPOT clock and evidence come from equity quote, not option quote`,()=>{
  for(const row of f.positions){const p=actual.find(p=>p.symbol===row.symbol),e=row.evaluation;near(e.spot.value??0,p.spot.value??0);
   if(p.spot.value!=null){const source=input.spotQuotes.find(x=>x.symbol===p.symbol);assert.equal(e.spot.asOf,iso(Date.parse(source['updated-at'])));assert.equal(e.spot.asOf,iso(p.spot.at));assert.equal(e.spot.method,p.spot.source);assert.match(e.spot.evidence[0].locator.value,/\/spotQuotes\/\d+$/);assert.equal(Date.parse(e.spot.evidence[0].observedAt),Date.parse(source['updated-at']));assert.notEqual(e.spot.asOf,iso(p.market.oldest));}
   else {assert.equal(e.spot.value,null);assert.equal(e.spot.status,'INCOMPLETE');assert.equal(e.spot.evidence.length,0);}
  }
 });
 test(`${file}: QUOTE freshness and timestamps are source-qualified`,()=>{
  for(const row of f.positions){const p=actual.find(p=>p.symbol===row.symbol),e=row.evaluation;assert.equal(e.oldestMaterialObservationAt,iso(p.market.oldest));assert.equal(e.freshness,p.market.stale?'STALE':'CURRENT');assert.equal(row.quote.freshness,e.freshness);assert.equal(e.evaluatedAt,iso(input.now));assert.equal(e.estimatedClosingCashFlow.status,'QUALIFIED');assert.equal(Date.parse(e.estimatedClosingCashFlow.evidence[0].observedAt),p.market.oldest);assert.match(e.estimatedClosingCashFlow.evidence[0].locator.value,/\/quotes$/);assert.match(e.estimatedClosingCashFlow.evidence[0].provider,/FIXTURE/);}
 });
 test(`${file}: signed economics and EXIT PROGRESS derived from fills and quotes`,()=>{
  for(const row of f.positions){const p=actual.find(p=>p.symbol===row.symbol),e=row.evaluation;near(e.openingCashFlow.value,p.credit*p.quantity*p.multiplier);near(e.estimatedClosingCashFlow.value,-p.market.closeDebit*p.quantity*p.multiplier);near(e.grossUnrealizedPl.value,Number(e.openingCashFlow.value)+Number(e.estimatedClosingCashFlow.value));near(e.management.profitTargetGrossPl.value,p.economicObjectives.targetGrossProfit);near(Number(e.grossUnrealizedPl.value)/Number(e.management.profitTargetGrossPl.value),p.progress);assert.equal(e.management.stopInterpretation,'PROVISIONAL_NOT_EXECUTION_GUARANTEE');assert.equal(e.fees.value,null);assert.equal(e.netUnrealizedPl.value,null);}
 });
 test(`${file}: TRADE SHAPE and RANGE preserve actual numeric economic meaning`,()=>{
  for(const row of f.positions){const p=actual.find(p=>p.symbol===row.symbol),e=row.evaluation;if(!p.payoff){assert.equal(e.payoff.geometry,null);assert.equal(e.payoff.status,'UNSUPPORTED');continue;}
   const g=e.payoff.geometry;assert.equal(g.horizon.date,p.expiry.slice(0,10));near(g.segments[0].intercept,p.payoff.leftTail*p.quantity*p.multiplier);near(g.segments.at(-1).intercept,p.payoff.rightTail*p.quantity*p.multiplier);g.breakEvenPrices.forEach((b,i)=>near(b,p.breakevens[i]));if(p.range){near(e.range.lower,p.range.lower);near(e.range.upper,p.range.upper);}else assert.equal('≥'+e.range.lower,p.rangeLabel);
   const hs=input.holdings.filter(h=>h['underlying-symbol']===p.symbol);for(const seg of g.segments){const s=seg.upper==null?Number(seg.lower)+1:(Number(seg.lower)+Number(seg.upper))/2;let y=p.credit*p.quantity*p.multiplier;for(const h of hs){const m=h.symbol.match(/([CP])(\d{8})$/),k=Number(m[2])/1000;const intrinsic=m[1]==='C'?Math.max(s-k,0):Math.max(k-s,0);y+=(h['quantity-direction']==='Long'?1:-1)*Number(h.quantity)*Number(h.multiplier)*intrinsic;}near(Number(seg.slope)*s+Number(seg.intercept),y);}
  }
 });
}
test('negative source mutation falsifies opening date, expiry and spot-clock expectations',()=>{
 const row=read('./examples/tt-live-expanded-parity.json').positions[0],p=projectLive(observed).positions.find(x=>x.symbol===row.symbol);for(const changed of ['2000-01-01T00:00:00Z',iso(p.market.oldest)])assert.notEqual(changed,row.evaluation.spot.asOf);assert.notEqual('2026-11-20',row.evaluation.timeline.expiration);assert.notEqual('2026-09-30T16:50:00.000Z',row.evaluation.timeline.openedAt);
});
