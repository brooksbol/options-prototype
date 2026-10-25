import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceView } from '../ui/evidence-view.js';

test('source cards retain exact decimals, clocks and units without inventing dollars or shares', () => {
  const view = evidenceView('{"evidence":{"source":{"subject":{"symbol":"BRK/B","securityType":"EQUITY"},"facts":{"bid":{"price":1.00000000000000000001,"size":9007199254740993,"sourceEventAt":"2001-01-01T12:00:00Z"}},"provenance":{"environment":"PRODUCTION"}},"qualifications":["ALIGNMENT_NOT_ESTABLISHED"],"measurements":{"difference":{"value":null,"unit":"SOURCE_PRICE_UNIT","status":"UNAVAILABLE"}}}}');
  assert.ok(view.rows.some(([key,value]) => key === 'bid price' && value === '1.00000000000000000001 · source price units'));
  assert.ok(view.rows.some(([key,value]) => key === 'bid displayed size' && value.startsWith('9007199254740993 · source units')));
  assert.ok(view.rows.some(([key,value]) => key === 'difference' && value === 'Unavailable · SOURCE_PRICE_UNIT · UNAVAILABLE'));
  assert.ok(view.qualifications.includes('ALIGNMENT_NOT_ESTABLISHED'));
  assert.doesNotMatch(JSON.stringify(view), /\$|USD|executable fill/);
});
test('broker open P\/L retains its identity and incomplete backend earnings stay unavailable', () => {
  const view = evidenceView(JSON.stringify({evidence:{items:[{state:'OPEN',evaluation:{realizedNetPl:{status:'INCOMPLETE',value:null,currency:'USD'}},included:{holdings:[{reportedOpenPl:{value:'12.30',status:'QUALIFIED',currency:'USD',method:'BROKER_REPORTED'}}]}}]}}));
  assert.ok(view.rows.some(([key,value]) => key === 'reportedOpenPl' && value === '12.30 · USD · QUALIFIED · BROKER_REPORTED'));
  assert.ok(view.rows.some(([key,value]) => key === 'realizedNetPl' && value === 'Unavailable · USD · INCOMPLETE'));
  assert.doesNotMatch(JSON.stringify(view), /lifetime|earned|profit target|probability/);
});
