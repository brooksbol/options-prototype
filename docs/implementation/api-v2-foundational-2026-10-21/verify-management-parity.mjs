import fs from 'node:fs';
import assert from 'node:assert/strict';
import {projectLive} from '../../../scripts/tastytrade-live.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/ung-mark-source.json',import.meta.url)));
const actual=JSON.parse(fs.readFileSync(new URL('../../../evidence-service-java/build/portfolio-mark-parity/management-evaluation.json',import.meta.url)));
const expected=projectLive({...source,now:new Date(source.now)}).positions[0];
const scale=Number(source.holdings[0].quantity)*Number(source.holdings[0].multiplier);
const epoch=value=>typeof value==='number'?value:Date.parse(value);
const close=(a,b)=>assert.ok(Math.abs(Number(a)-Number(b))<1e-9,`${a} != ${b}`);
close(actual.openingCashFlow.value,expected.credit*scale);
close(actual.grossUnrealizedPl.value,expected.pnl);
close(actual.management.profitTargetGrossPl.value,(expected.credit-expected.target)*scale);
close(actual.management.zeroGrossPl.value,0);
close(actual.grossUnrealizedPl.value/actual.management.profitTargetGrossPl.value,expected.progress);
assert.equal(Date.parse(actual.timeline.openedAt),epoch(expected.openedAt));
assert.equal(Number(actual.timeline.remainingDays.value),expected.dte);
assert.equal(Number(actual.timeline.originalDays.value),expected.lifespan.openingDte);
assert.equal(Date.parse(actual.oldestMaterialObservationAt),expected.market.oldest);
assert.equal(actual.freshness,expected.market.stale?'STALE':'CURRENT');
close(actual.spot.value,expected.spot.value);
assert.equal(Date.parse(actual.spot.asOf),epoch(expected.spot.at));
assert.equal(actual.range.kind,'PLATEAU');close(actual.range.lower,expected.range.lower);close(actual.range.upper,expected.range.upper);
assert.equal(actual.management.reportedStopThresholdGrossPl.value,null); // Fixture has a stop limit but no reported trigger.
assert.equal(actual.netUnrealizedPl.value,null); // No final fee evidence.
assert.equal(actual.management.manualCheckpoint,null); // No verified GTD declaration in this source specimen.
console.log('Actual normalized-Order Java opening/DTE, qualified EXIT PROGRESS dollar coordinates, RANGE, SPOT, QUOTE clocks/freshness agree with projectLive; synthetic membership/historical multiplier explicitly declared, absent trigger/fees remain unknown');
