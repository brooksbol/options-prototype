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
  assert.ok(view.rows.some(([key,value]) => key === 'Unavailable metrics' && value.includes('realizedNetPl · USD · INCOMPLETE')));
  assert.doesNotMatch(JSON.stringify(view), /lifetime|earned|profit target|probability/);
});

test('inventory source cards display exact custody and per-Account403 instead of empty placeholders',()=>{
 const view=evidenceView('{"outcome":"PARTIAL","accounts":[{"nickname":"allowed","broker":"FIDELITY","complete":true,"holdings":[{"sourceInstrument":{"identifier":"FIXTURE"},"quantity":9007199254740993,"unit":"SHARE","side":"LONG","observationDate":"2001-01-01"}]},{"nickname":"denied","broker":"TASTYTRADE","complete":false,"holdings":[],"problems":[{"code":"FORBIDDEN"}]}]}');
 assert.ok(view.rows.some(([k,v])=>k==='allowed · FIXTURE'&&v.startsWith('9007199254740993')));
 assert.ok(view.rows.some(([k,v])=>k==='denied access'&&v==='Holdings access denied'));
 assert.ok(!view.rows.some(([k])=>k==='Authorized Account count'));
});

test('bounded balance card has four prominent facts and source details, never an expanded history dump',()=>{
 const value={account:{nickname:'fixture',broker:'FIDELITY'},evidence:{selection:{mode:'latest-source',status:'SELECTED',readAt:'2026-10-27T12:00:00Z',unknownSourceTimeCount:0,selectedSourceTime:'2026-10-19T20:00:00Z'},observations:[{broker:'FIDELITY',currency:null,unit:'SOURCE_MONETARY_UNIT',source:{exportedAt:'2026-10-19T16:00-04:00',receivedAt:'2026-10-20T00:00:00Z',artifactId:'fixture'},fields:[
  {brokerField:'Available without margin impact',value:1800.25,status:'REPORTED',reportedDisplay:'$1,800.25'},
  {brokerField:'Margin debit',value:2100.75,status:'REPORTED',reportedDisplay:'$2,100.75'},
  {brokerField:'Cash reserved for options strategies',value:23000,status:'REPORTED',reportedDisplay:'$23,000.00'},
  {brokerField:'Settled cash',value:40.50,status:'REPORTED',reportedDisplay:'$40.50'}]}]}};
 const view=evidenceView(JSON.stringify(value));assert.equal(view.balanceSummary.badge,'Historical');assert.equal(view.balanceSummary.facts.length,4);assert.equal(view.balanceSummary.facts[1].label,'Reported margin debit');assert.equal(view.balanceSummary.facts[1].value,'$2,100.75');assert.match(view.balanceSummary.note,/No later source-dated balance/);assert.ok(view.balanceSummary.details.some(([k])=>k==='Received'));
 value.evidence.selection.mode='all';assert.match(evidenceView(JSON.stringify(value)).balanceSummary.note,/later Account sources were not compared/);
 value.evidence.observations.push(value.evidence.observations[0]);const history=evidenceView(JSON.stringify(value));assert.equal(history.balanceSummary.facts.length,0);assert.match(history.balanceSummary.note,/No single qualified/);
});

test('typed option source table includes every backend row independently of model prose, without CSP inference',()=>{
 const options=Array.from({length:5},(_,n)=>({underlyingSymbol:'FIXTURE'+n,right:'PUT',side:'SHORT',expiration:'2001-01-01',strike:'10',quantity:'1',relatedLongOptions:[],source:{sourceRows:[n+1]}}));
 const view=evidenceView(JSON.stringify({evidence:{optionInventory:{right:'PUT',side:'SHORT',accounts:[{nickname:'fixture',status:'READ',readComplete:true,options}],counts:{shortPutContracts:5,selectedInventoryComplete:true,cashSecuredPutContracts:null}}}}));
 assert.equal(view.optionInventory.rows.length,5);assert.equal(view.optionInventory.rows[4][1],'FIXTURE4');assert.equal(view.optionInventory.shortPutContracts,'5');assert.match(view.optionInventory.note,/not established/);
});
test('cash-account availability displays native broker label without turning it into margin-impact or governed capital',()=>{
 const view=evidenceView(JSON.stringify({account:{nickname:'fixture'},evidence:{observations:[{broker:'FIDELITY',fields:[{brokerField:'Available to trade',value:'321.45',reportedDisplay:'$321.45',status:'REPORTED'}],source:{}}]}}));
 assert.equal(view.balanceSummary.facts[0].label,'Broker-reported available to trade');assert.equal(view.balanceSummary.facts[0].value,'$321.45');assert.doesNotMatch(view.balanceSummary.note,/not today/);
});
