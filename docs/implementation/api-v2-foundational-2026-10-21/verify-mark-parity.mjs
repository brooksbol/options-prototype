import fs from 'node:fs';
import assert from 'node:assert/strict';
import {projectLive} from '../../../scripts/tastytrade-live.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/ung-mark-source.json',import.meta.url)));
const actual=JSON.parse(fs.readFileSync(new URL('../../../evidence-service-java/build/portfolio-mark-parity/evaluation.json',import.meta.url)));
const first=projectLive({...source,now:new Date(source.now)}).positions[0];
const scale=Number(source.holdings[0].quantity)*Number(source.holdings[0].multiplier);
assert.equal(first.market.valuationSource,'broker mark');
assert.ok(Math.abs(Number(actual.estimatedClosingCashFlow.value)+first.market.closeDebit*scale)<1e-9);
assert.ok(Math.abs(Number(actual.grossUnrealizedPl.value)-first.pnl)<1e-9);
assert.equal(Date.parse(actual.oldestMaterialObservationAt),first.market.oldest);
assert.equal(actual.freshness,first.market.stale?'STALE':'CURRENT');
assert.equal(Number(actual.timeline.remainingDays.value),first.dte);
assert.ok(Math.abs(Number(actual.openingCashFlow.value)-first.credit*scale)<1e-9);
assert.equal(Number(actual.range.lower),first.range.lower);assert.equal(Number(actual.range.upper),first.range.upper);
const at=spot=>{const segment=actual.payoff.geometry.segments.find(s=>spot>=Number(s.lower)&&(s.upper===null||spot<Number(s.upper)));assert.ok(segment);return Number(segment.slope)*spot+Number(segment.intercept);};
assert.ok(Math.abs(at(0)-first.payoff.leftTail*scale)<1e-9);
assert.ok(Math.abs(at(20)-first.payoff.rightTail*scale)<1e-9);
assert.ok(Math.abs(at(11)-first.payoff.maximumProfit*scale)<1e-9);

assert.equal(Number(actual.spot.value),first.spot.value);
assert.equal(Date.parse(actual.spot.asOf),Date.parse(source.spotQuotes[0]["updated-at"]));
assert.equal(actual.netUnrealizedPl.value,null); // The source supplies no final fee evidence.
console.log('Actual Java whole-package mark money, gross P/L, DTE, clock, freshness, SPOT, RANGE and numerical payoff tails agree with projectLive; synthetic scope/terms, no live validation');
