import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from './wheelwright.mjs';
import {readDefaultSubjects,fetchDefault,pull,renderUpdate} from './ww-update.mjs';
const requestId='12345678-1234-1234-1234-123456789abc';
const coverage={source:'MONITORING',accountId:null,status:'EMPTY',snapshotId:null,evidenceDate:null,recordedAt:null,qualifications:['Source clocks remain independent.']};
const selection=(symbols=[],complete=true)=>({requestId,selectedAt:'2026-10-15T18:00:00Z',policy:'AUTHORIZED_HOLDINGS_UNION_CONFIGURED_MONITORING',complete,subjects:symbols.map(symbol=>({symbol,sources:['MONITORING']})),coverage:[coverage]});
const reply=d=>new Response(JSON.stringify(d),{headers:{'x-request-id':requestId,'content-type':'application/json'}});
test('default grammar preserves explicit narrowing and local manuals',()=>{
 assert.equal(parseArgs(['pull']).command,'pull');assert.equal(parseArgs(['pull','--verbose']).verbose,true);
 assert.equal(parseArgs(['sync']).account,undefined);assert.equal(parseArgs(['sync','account','tt1','--verbose']).account,'tt1');
 assert.equal(parseArgs(['sync','--man']).page,'sync');assert.deepEqual(parseArgs(['fetch']).symbols,[]);assert.deepEqual(parseArgs(['fetch','XLE','EWZ']).symbols,['XLE','EWZ']);
 for(const args of [['pull','--account','tt1'],['sync','account','tt1','account','pts'],['fetch','--quiet','--verbose']])assert.throws(()=>parseArgs(args));
});
test('empty complete selection never falls back to market or invokes acquisition',async()=>{
 let acquired=0;const d=await fetchDefault('token',{base:'http://127.0.0.1:1',fetchImpl:async url=>{assert.equal(url.pathname,'/v2/market-evidence-subjects');assert.equal(url.search,'');return reply(selection());},acquire:async()=>{acquired++;}});
 assert.equal(acquired,0);assert.equal(d.complete,true);assert.deepEqual(d.batches,[]);
});
test('transport batching preserves backend subjects and FORCE, continues independent failures',async()=>{
 const symbols=Array.from({length:61},(_,i)=>'S'+i),batches=[];
 const d=await fetchDefault('token',{mode:'FORCE',base:'http://127.0.0.1:1',fetchImpl:async()=>reply(selection(symbols)),acquire:async(s,o)=>{assert.equal(o.mode,'FORCE');batches.push(s);if(batches.length===2)throw new Error('safe failure');return {results:s.map(symbol=>({subject:{symbol},fulfilled:true,outcome:'NEWLY_ACQUIRED'}))};}});
 assert.deepEqual(batches.map(b=>b.length),[30,30,1]);assert.deepEqual(batches.flat(),symbols);assert.equal(d.complete,false);assert.equal(d.errors.length,1);assert.equal(d.batches.length,2);
});
test('incomplete source coverage cannot become success even when every available quote succeeds',async()=>{
 const source=selection(['SPY'],false);source.coverage=[{...coverage,status:'UNAVAILABLE'}];
 const d=await fetchDefault('token',{fetchImpl:async()=>reply(source),acquire:async()=>({results:[{fulfilled:true}]})});assert.equal(d.complete,false);
 source.complete=true;await assert.rejects(readDefaultSubjects('token',{fetchImpl:async()=>reply(source)}),/invalid backend/);
});
test('duplicate/malformed default subject responses fail before acquisition',async()=>{
 for(const patch of [s=>s.subjects.push(s.subjects[0]),s=>s.subjects[0].symbol='spy',s=>s.subjects[0].sources=[],s=>s.policy='HOLDINGS_ONLY',s=>s.complete='true']) {
  const s=selection(['SPY']);patch(s);let calls=0;
  await assert.rejects(fetchDefault('token',{fetchImpl:async()=>reply(s),acquire:async()=>{calls++;}}));assert.equal(calls,0);
 }
});
test('empty authorized pull composes public discovery then reports a truthful no-op',async()=>{
 const calls=[];const report=await pull('token',{base:'http://127.0.0.1:1',fetchImpl:async url=>{calls.push(url.pathname);if(url.pathname==='/v2/accounts')return reply({requestId,accounts:[]});if(url.pathname==='/v2/me')return reply({requestId,user:{id:'usr_'+'a'.repeat(32),accountAccess:[]}});return reply(selection());},acquire:async()=>{throw new Error('No acquisition expected');}});
 assert.deepEqual(calls,['/v2/accounts','/v2/me','/v2/market-evidence-subjects']);assert.equal(report.complete,true);
 const text=renderUpdate(report,{tty:false});assert.match(text,/Pull completed/);assert.match(text,/Empty selection/);assert.doesNotMatch(text,/\x1b|Positions.*added|Transactions.*new/);
});
test('partial failure report preserves retained evidence and color opt-outs',()=>{
 const report={sync:{accounts:[{alias:'tt1',broker:'TASTYTRADE',complete:false,holdings:{complete:false,processed:0},history:{recordCount:21,evidenceMode:'RETAINED',freshness:'STALE'},errors:[],diagnostics:[]}],complete:false},error:'Market source unavailable',complete:false};
 assert.match(renderUpdate(report,{tty:true,env:{}}),/\x1b\[96mtt1/);const plain=renderUpdate(report,{tty:true,env:{NO_COLOR:''}});assert.doesNotMatch(plain,/\x1b/);assert.match(plain,/prior retained/);assert.match(plain,/Pull incomplete/);
});
