import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from './wheelwright.mjs';
import {readCapital,renderCapital} from './ww-capital.mjs';
import {parseShowJson} from './ww-show.mjs';
const account='acct_'+'a'.repeat(32),id='12345678-1234-1234-1234-123456789abc';
const source={artifactId:'balance',sha256:'a'.repeat(64),receivedAt:'2026-10-12T12:00:00Z',fileType:'BALANCES',exportedAt:'2026-08-20T14:06-04:00',timestampPrecision:'MINUTE',sourceRows:[2]};
const fixture=()=>({requestId:id,accountId:account,measure:'PORTFOLIO_CAPITAL_V1',formula:'totalAccountValue - shortOptionMtm',pairingBasis:'UNIQUE_IDENTICAL_EXPORT_MINUTE_COMPOSITE',historyCoverage:'UNKNOWN',balanceArtifacts:1,optionSummaryArtifacts:0,observations:[{accountId:account,evidenceDate:'2026-08-20',exportMinute:source.exportedAt,status:'UNMATCHED_EXPORT_MINUTE',portfolioCapital:null,totalAccountValue:116300.23,shortOptionMtm:null,balances:source,optionSummaries:[],qualifications:['Composite only.']}]});
test('capital listing parses locally and rejects unsupported ambiguous options',()=>{
 assert.equal(parseArgs(['ls','portfolio-capital-observations','--account','pts']).command,'ls-capital');
 assert.equal(parseArgs(['ls','portfolio-capital-observations','--help']).command,'help');
 for(const args of [[],['--account','pts','--account','pts'],['--account','pts','--jsonl','--tsv'],['--account','pts','--as-of','today']])assert.throws(()=>parseArgs(['ls','portfolio-capital-observations',...args]));
});
test('read is one pure GET with canonical Account scope; absence, hashes and source dates survive',async()=>{
 const fetchImpl=async(url,options)=>{assert.equal(url.pathname,'/v2/portfolio-capital-observations');assert.equal(url.searchParams.get('accountId'),account);assert.equal(options.method,'GET');assert.equal(options.body,undefined);return new Response(JSON.stringify(fixture()),{headers:{'x-request-id':id,'content-type':'application/json'}});};
 const data=await readCapital(account,'private-token',{base:'http://127.0.0.1:3100',fetchImpl});
 assert.match(renderCapital(data,{}),/^2026-08-20T14:06-04:00\t\?\tUNMATCHED_EXPORT_MINUTE\t116300.23\t\?\t/);
 const json=renderCapital(data,{format:'jsonl'});assert.equal(JSON.parse(json).balances.sha256,source.sha256);assert.equal(JSON.parse(json).portfolioCapital,null);
 assert.doesNotMatch(json,/\x1b/);assert.match(renderCapital(data,{format:'table',accountLabel:'pts'}),/Portfolio Capital v1/);
});
test('invalid missing collection, mismatched sources and unauthorized responses fail before output',async()=>{
 for(const mutate of [d=>d.balanceArtifacts=2,d=>d.observations[0].portfolioCapital=0,d=>d.accountId='foreign',d=>d.observations[0].balances.sha256='invalid']) {
  const d=fixture();mutate(d);
  await assert.rejects(readCapital(account,'private-token',{base:'http://127.0.0.1:3100',fetchImpl:async()=>new Response(JSON.stringify(d),{headers:{'x-request-id':id,'content-type':'application/json'}})}));
 }
 await assert.rejects(readCapital(account,'private-token',{base:'http://127.0.0.1:3100',fetchImpl:async()=>new Response(JSON.stringify({requestId:id,code:'FORBIDDEN'}),{status:403,headers:{'x-request-id':id,'content-type':'application/problem+json'}})}),/FORBIDDEN/);
});
