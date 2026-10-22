// Actual Java output versus the accepted working Product policy, not another copied expectation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {usableEvidence,retainedSessionLabel} from '../../../scripts/tastytrade-freshness.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../../evidence-service-java/build/portfolio-session-parity/results.json',import.meta.url)));
assert.ok(rows.length>=9);
for(const row of rows){const at=Date.parse(row.at),now=new Date(row.now);const expected=!usableEvidence(at,now,row.session)?'STALE':retainedSessionLabel(at,now,row.session)?'RETAINED_SESSION':'CURRENT';assert.equal(row.actual,expected,JSON.stringify(row));}
console.log(`${rows.length} Java freshness cases agree with accepted tt policy; no live broker behavior asserted`);
