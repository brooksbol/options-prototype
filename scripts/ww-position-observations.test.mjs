import test from 'node:test';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseArgs} from './wheelwright.mjs';
import {parseObservations,readObservations,renderObservations,readPositions,renderPositions} from './ww-positions.mjs';
import {parseShowJson} from './ww-show.mjs';
const ID='11111111-1111-4111-8111-111111111111',ACCOUNT='acct_11111111111111111111111111111111';
const summary=()=>parseShowJson(JSON.stringify({requestId:ID,accountId:ACCOUNT,accountName:'Fixture',snapshotId:'a'.repeat(64),evidenceDate:'2026-10-11',recordedAt:'2026-10-12T12:00:00Z',sourceFile:'source\\name\tline\n.csv',sourceSha256:'b'.repeat(64),artifactId:null,holdingCount:0,observation:null,observationContext:{broker:'FIDELITY',evidenceDateBasis:'FIDELITY_EXPORT_DATE',evidenceDatePrecision:'DAY'},qualifications:['Not brokerage chronology.']}));
const response=data=>new Response(JSON.stringify(data),{headers:{'X-Request-Id':ID,'Content-Type':'application/json'}});
test('grammar is explicit, early invalid usage and existing default stay intact',()=>{
 assert.equal(parseArgs(['ls','position-observations','--account','pts']).command,'ls-position-observations');
 assert.equal(parseArgs(['show','positions','--account','pts','--snapshot','opaque']).snapshotId,'opaque');
 assert.equal(parseArgs(['show','positions','--account','pts']).snapshotId,undefined);
 for(const args of [[],['--account','pts','--as-of','today'],['--account','pts','--account','pts'],['--account','pts','--verbose','--jsonl'],['--account','pts','--verbose','--tsv'],['--account','pts','--table','--jsonl']])assert.throws(()=>parseObservations(args),e=>e.code===2);
 assert.throws(()=>parseArgs(['show','positions','--account','pts','--snapshot','']),e=>e.code===2);
});
test('catalog transport uses only authorized GET and preserves complete summaries',async()=>{
 const s=summary();let calls=0;
 const result=await readObservations(ACCOUNT,'fixture-token',{base:'http://localhost:3101',fetchImpl:async(url,opt)=>{
  calls++;assert.equal(url.pathname,'/v2/positions');assert.equal(url.searchParams.get('view'),'observations');assert.equal(url.searchParams.get('accountId'),ACCOUNT);assert.equal(opt.method,'GET');return response({requestId:ID,observations:[s]});
 }});
 assert.equal(calls,1);assert.deepEqual(result,[s]);
 for(const bad of [[s,s],[{...s,accountId:'foreign'}],[{...s,holdingCount:-1}],[{...s,observationContext:null}]])await assert.rejects(()=>readObservations(ACCOUNT,'fixture-token',{base:'http://localhost:3101',fetchImpl:async()=>response({requestId:ID,observations:bad})}));
 await assert.rejects(()=>readObservations(ACCOUNT,'fixture-token',{base:'http://localhost:3101',fetchImpl:async()=>{throw Error('offline');}}));
});
test('fixed TSV, raw count, empty, escaping, full IDs and ANSI opt-outs',()=>{
 const s=summary(),tsv=renderObservations([s]);assert.equal(tsv.trimEnd().split('\t').length,13);assert.match(tsv,/source\\\\name\\tline\\n.csv/);assert.equal(renderObservations([]),'');assert.equal(renderObservations([],{format:'jsonl'}),'');assert.match(renderObservations([],{tty:true,accountLabel:'pts'}),/No retained/);
 assert.deepEqual(JSON.parse(renderObservations([s],{format:'jsonl'})),JSON.parse(JSON.stringify(s)));
 const colored=renderObservations([s],{tty:true,accountLabel:'pts',env:{TERM:'xterm'}});assert.ok(colored.includes('\x1b[96m'));assert.ok(colored.includes(s.snapshotId));
 for(const opts of [{noColor:true},{env:{NO_COLOR:'',TERM:'xterm'}},{env:{TERM:'dumb'}},{format:'jsonl'},{format:'tsv'}])assert.ok(!renderObservations([s],{tty:true,...opts}).includes('\x1b'));
 assert.match(renderObservations([s],{verbose:true,noColor:true}),/SHA256/);
});
test('actual backend catalog and selected response are consumable and exact selection enforced',async()=>{
 const catalog=parseShowJson(await readFile(new URL('../evidence-service-java/build/historical-catalog.json',import.meta.url),'utf8'));
 const envelope=parseShowJson(await readFile(new URL('../evidence-service-java/build/historical-selected.json',import.meta.url),'utf8'));
 const selected=envelope.snapshots[0];
 const account=selected.accountId;
 const fake=async()=>new Response(JSON.stringify(catalog),{headers:{'Content-Type':'application/json','X-Request-Id':catalog.requestId}});
 assert.equal((await readObservations(account,'fixture-token',{base:'http://localhost:3101',fetchImpl:fake})).length,3);
 const get=async(url)=>{assert.equal(url.searchParams.get('snapshotId'),selected.snapshotId);return new Response(JSON.stringify(envelope),{headers:{'Content-Type':'application/json','X-Request-Id':envelope.requestId}});};
 const result=await readPositions(account,'fixture-token',{base:'http://localhost:3101',snapshotId:selected.snapshotId,fetchImpl:get});
 assert.ok(renderPositions(result,{tty:true,verbose:true,noColor:true}).includes(selected.snapshotId));assert.match(renderPositions(result,{tty:true,verbose:true,noColor:true}),/Not historical evaluation replay/);
 await assert.rejects(()=>readPositions(account,'fixture-token',{base:'http://localhost:3101',snapshotId:'wrong',fetchImpl:async()=>new Response(JSON.stringify(envelope),{headers:{'Content-Type':'application/json','X-Request-Id':envelope.requestId}})}),/mismatch/);
});

test('public CLI process preserves pipe contracts, nickname resolution and failure exits',async()=>{
 const s=summary();let mode='success';const calls=[];
 const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');calls.push(url);assert.equal(req.method,'GET');
  assert.equal(req.headers.authorization,'Bearer synthetic-reader');
  res.setHeader('Content-Type','application/json');res.setHeader('X-Request-Id',ID);
  if(url.pathname==='/v2/accounts')res.end(JSON.stringify({requestId:ID,accounts:[{id:ACCOUNT,alias:'pts',displayName:'Synthetic PTS',brokerAssociation:{broker:'FIDELITY',accountNumber:'SYNTHETIC'}}]}));
  else if(mode==='failure'){res.statusCode=403;res.setHeader('Content-Type','application/problem+json');res.end(JSON.stringify({requestId:ID,code:'FORBIDDEN',detail:'synthetic denial'}));}
  else res.end(JSON.stringify({requestId:ID,observations:mode==='empty'?[]:[s]}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const run=async(args,extra={})=>{try{return {...await promisify(execFile)(new URL('./ww',import.meta.url).pathname,args,{env:{...process.env,WW_API_TOKEN:'synthetic-reader',WW_BASE_URL:`http://127.0.0.1:${server.address().port}`,...extra}}),code:0};}catch(e){return {stdout:e.stdout,stderr:e.stderr,code:e.code};}};
 try {
  for(const args of [[],['--tsv'],['--jsonl'],['--table','--no-color'],['--verbose']]){
   const result=await run(['ls','position-observations','--account','pts',...args],{NO_COLOR:''});
   assert.equal(result.code,0,result.stderr);assert.equal(result.stderr,'');assert.ok(!result.stdout.includes('\x1b'));
   if(args.includes('--jsonl'))assert.equal(JSON.parse(result.stdout).snapshotId,s.snapshotId);
   else if(!args.length||args.includes('--tsv'))assert.equal(result.stdout.trimEnd().split('\t').length,13);
   else assert.ok(result.stdout.includes(s.snapshotId));
  }
  assert.ok(calls.filter(u=>u.pathname==='/v2/positions').every(u=>u.searchParams.get('accountId')===ACCOUNT&&u.searchParams.get('view')==='observations'));
  mode='empty';let r=await run(['ls','position-observations','--account','pts','--jsonl']);assert.equal(r.code,0);assert.equal(r.stdout,'');
  mode='failure';r=await run(['ls','position-observations','--account','pts','--jsonl']);assert.equal(r.code,1);assert.equal(r.stdout,'');assert.match(r.stderr,/FORBIDDEN/);
  const before=calls.length;r=await run(['ls','position-observations','--account','pts','--as-of','now']);assert.equal(r.code,2);assert.equal(calls.length,before);
 } finally {await new Promise(resolve=>server.close(resolve));}
});

test('catalog default is a heading, headers and records with full IDs; qualifications are opt-in',()=>{
 const s=summary(),out=renderObservations([s],{tty:true,noColor:true,accountLabel:'pts'});
 assert.equal(out.trimEnd().split('\n').length,3);assert.ok(out.includes(s.snapshotId));assert.ok(!out.includes(s.qualifications[0]));
 assert.ok(renderObservations([s],{verbose:true,noColor:true}).includes(s.qualifications[0]));
});
