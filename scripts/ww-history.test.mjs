import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from './wheelwright.mjs';
import {parseHistory,readHistory,renderHistory,validateHistory,HISTORY_COLUMNS,historyDiagnostic,readHistories,renderHistories} from './ww-history.mjs';
const account='acct_'+'a'.repeat(32),id='12345678-1234-1234-1234-123456789abc';
function fixture() {
 const r={accountId:account,transactionId:id,sourceTransactionId:'90071992547409931234',sourceIdentityStatus:'BROKER_TRANSACTION_ID',transactionDate:'2026-10-15',executedAt:'2026-10-15T12:00:00-06:00',settlementDate:null,sourceCreatedAt:null,kind:'TRADE',sourceType:'Trade',sourceSubType:'Sell to Open',action:'Sell to Open',sourceAction:'Sell to Open',symbol:'DEMO 261120P00095000',underlyingSymbol:'DEMO',instrumentType:'Equity Option',description:'Quoted, "trade"\nsecond line',currency:'USD',quantity:'1',price:'1.5000000000000001',multiplier:null,value:'150.00',commission:'-1.00',commissionStatus:'REPORTED',fees:'-0.12',feesStatus:'REPORTED_COMPONENTS_COMPLETE',feeComponents:{'clearing-fees':'-0.12','regulatory-fees':'0.00','proprietary-index-option-fees':'0.00','currency-conversion-fees':'0.00'},otherCharge:null,netCash:'148.88',estimatedFee:false,orderId:'90071992547409931235',correctionStatus:'NONE_OBSERVED',reversesSourceId:null,reversesTransactionId:null,reversalStatus:'NONE_REPORTED',normalization:'SUPPORTED',provenance:{artifactId:id,sha256:'a'.repeat(64),observationId:id,receivedAt:'2026-10-15T18:01:00Z',previousObservationId:null,rowNumber:1}};
 return {requestId:id,accountId:account,provider:'TASTYTRADE',lastImportedAt:null,identityBasis:'BROKER_TRANSACTION_ID',environment:'PRODUCTION',asOf:'2026-10-15T18:00:00Z',checkedAt:'2026-10-15T18:01:00Z',requestedFrom:null,requestedThrough:'2026-10-15T18:00:00Z',observedFrom:'2026-10-15',observedThrough:'2026-10-15',evidenceMode:'ACQUIRED',freshness:'REUSABLE',acquisitionOutcome:'COMPLETE',providerTraversal:'COMPLETE_AT_LAST_SUCCESS',providerSnapshotConsistency:'UNVERIFIED',lifetimeCoverage:'UNKNOWN',latestAttemptId:id,latestAttemptPages:1,normalization:'SUPPORTED',complete:true,recordCount:1,transactions:[r]};
}
test('history grammar is local, consistent and rejects ambiguous forms',()=>{
 assert.equal(parseArgs(['history','--account','tt1','--csv']).command,'history');
 for(const flag of ['--help','-h'])assert.equal(parseArgs(['history',flag]).command,'help');
 for(const args of [['tt1'],['--account'],['--account','tt1','--account','tt1'],['--account','tt1','--csv','--jsonl'],['--account','tt1','--limit','1'],['--account','tt1','--json']])assert.throws(()=>parseHistory(args));
 assert.equal(parseHistory(['--account','tt1','--csv','--csv']).format,'csv');
 assert.deepEqual(parseArgs(['history','--man']),{command:'command-man',page:'history'});
 for(const flag of ['--help','-h','--man'])assert.deepEqual(parseArgs(['pull',flag]),{command:'command-man',page:'pull'});
 assert.equal(parseArgs(['pull']).command,'pull');
});
test('one backend Account-nested history GET; no provider pagination or fetch choreography',async()=>{
 let calls=0;
 const d=await readHistory(account,'private-token',{base:'http://127.0.0.1:3100',fetchImpl:async(url,options)=>{
  calls++;assert.equal(url.pathname,`/v2/accounts/${account}/transactions`);assert.equal(url.search,'');assert.equal(options.method,'GET');assert.equal(options.body,undefined);
  return new Response(JSON.stringify(fixture()),{headers:{'x-request-id':id,'content-type':'application/json'}});
 }});
 assert.equal(calls,1);assert.equal(d.transactions[0].sourceTransactionId,'90071992547409931234');
});
test('malformed, truncated, cross-Account, duplicate, misleading completion and invalid cash fail before output',async()=>{
 for(const change of [d=>d.recordCount=2,d=>d.accountId='other',d=>d.transactions.push(d.transactions[0]),d=>d.transactions[0].netCash=148.88,d=>d.transactions[0].provenance.sha256='bad',d=>d.freshness='STALE',d=>d.transactions[0].accountId='other',d=>d.transactions[0].feeComponents=null]) {
  const d=fixture();change(d);assert.throws(()=>validateHistory(d,account,id));
 }
 await assert.rejects(readHistory(account,'private-token',{fetchImpl:async()=>new Response('{',{headers:{'x-request-id':id,'content-type':'application/json'}})}),/JSON/);
 await assert.rejects(readHistory(account,'private-token',{fetchImpl:async()=>new Response(JSON.stringify({requestId:id,code:'FORBIDDEN'}),{status:403,headers:{'x-request-id':id,'content-type':'application/problem+json'}})}),/FORBIDDEN/);
});
test('exact decimals, all provenance and context survive CSV/TSV/JSONL; CSV quotes text, TSV has no header',()=>{
 const d=fixture();validateHistory(d,account,id);
 const line=JSON.parse(renderHistory(d,{format:'jsonl'}));assert.equal(line.price,'1.5000000000000001');assert.equal(line.netCash,'148.88');assert.equal(line.history.lifetimeCoverage,'UNKNOWN');assert.equal(line.provenance.sha256,'a'.repeat(64));
 const csv=renderHistory(d,{format:'csv'});assert.ok(csv.startsWith(HISTORY_COLUMNS.join(',')+'\r\n'));assert.ok(csv.includes('"Quoted, ""trade""\nsecond line"'));assert.ok(csv.includes('90071992547409931235'));
 const tsv=renderHistory(d,{});assert.ok(tsv.startsWith(account+'\t'));assert.ok(tsv.includes('second line'));assert.ok(tsv.includes('\\n'));assert.doesNotMatch(tsv,/\x1b/);
});
test('human table/verbose colors, neutral cash, opt-outs and incomplete/empty behavior',()=>{
 const d=fixture();const human=renderHistory(d,{tty:true,accountLabel:'tt1',env:{}});assert.match(human,/\x1b\[96mtt1/);assert.match(human,/38;5;226/);assert.match(human,/NET CASH/);assert.match(human,/\+148\.88/);assert.doesNotMatch(human,/\x1b\[32m|38;5;203/);
 for(const options of [{noColor:true,env:{}},{env:{NO_COLOR:''}},{env:{TERM:'dumb'}}])assert.doesNotMatch(renderHistory(d,{tty:true,...options}),/\x1b/);
 assert.match(renderHistory(d,{verbose:true,noColor:true}),/90071992547409931234/);
 d.transactions=[];d.recordCount=0;d.observedFrom=null;d.observedThrough=null;
 assert.equal(renderHistory(d,{format:'jsonl'}),'');assert.equal(renderHistory(d,{format:'tsv'}),'');assert.equal(renderHistory(d,{format:'csv'}),HISTORY_COLUMNS.join(',')+'\r\n');assert.match(renderHistory(d,{tty:true,noColor:true}),/No transactions/);
 d.complete=false;d.acquisitionOutcome='INCOMPLETE';d.freshness='STALE';assert.match(historyDiagnostic(d),/INCOMPLETE RESULT/);
});

test('unselected history composes only Account-scoped reads and preserves independent failures',async()=>{
 assert.equal(parseHistory([]).account,undefined);
 const second='acct_'+'b'.repeat(32),urls=[];
 const results=await readHistories([{id:account,alias:'tt1'},{id:second,alias:'pts'}],'private-token',{base:'http://127.0.0.1:3100',fetchImpl:async url=>{
  urls.push(url.pathname);
  return url.pathname.includes(second)?new Response(JSON.stringify({requestId:id,code:'FORBIDDEN'}),{status:403,headers:{'x-request-id':id,'content-type':'application/problem+json'}}):new Response(JSON.stringify(fixture()),{headers:{'x-request-id':id,'content-type':'application/json'}});
 }});
 assert.deepEqual(urls,[`/v2/accounts/${account}/transactions`,`/v2/accounts/${second}/transactions`]);
 assert.equal(results[0].data.recordCount,1);assert.match(results[1].error,/FORBIDDEN/);
 assert.equal(renderHistories([...results,results[0]],{format:'csv'}).split(HISTORY_COLUMNS.join(',')).length,2);
 assert.equal(renderHistories(results,{format:'jsonl'}).trim().split('\n').length,1);
});
test('Fidelity imported evidence never claims a broker timestamp or broker transaction identity',()=>{
 const d=fixture();Object.assign(d,{provider:'FIDELITY',identityBasis:'RETAINED_ROW_OBSERVATION',lastImportedAt:d.checkedAt,asOf:null,checkedAt:null,requestedThrough:null,evidenceMode:'RETAINED',freshness:'UNVERIFIED',acquisitionOutcome:'NOT_APPLICABLE',providerTraversal:'NOT_APPLICABLE',latestAttemptId:null,latestAttemptPages:0});
 Object.assign(d.transactions[0],{sourceTransactionId:null,sourceIdentityStatus:'ROW_EQUIVALENCE_ONLY',currency:null,feesStatus:'REPORTED_TOTAL'});
 validateHistory(d,account,id);assert.match(renderHistory(d,{tty:true,env:{}}),/\x1b\[32mFidelity/);
 d.asOf='2026-10-15T18:00:00Z';assert.throws(()=>validateHistory(d,account,id));
});
