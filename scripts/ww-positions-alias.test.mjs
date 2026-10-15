import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {parseArgs} from './wheelwright.mjs';
const ID='11111111-1111-4111-8111-111111111111';
const ACCOUNT='acct_11111111111111111111111111111111';
const snapshot={requestId:ID,accountId:ACCOUNT,accountName:'Fixture',snapshotId:'retained',evidenceDate:'2026-10-11',recordedAt:'2026-10-11T12:00:00Z',sourceFile:'fixture.csv',sourceSha256:'a'.repeat(64),workingOrderCoverage:'UNKNOWN',qualifications:['Fixture uncertainty'],positions:[{positionId:'one',label:'SPY',identityBasis:'OBSERVED_CONTRACT_AND_CUSTODY',program:null,openPl:12.34,marketValue:100,shareEquivalentDelta:null,qualifications:[],constituents:[{holding:{holdingId:'holding',contract:'SPY',custody:'Cash',quantity:1,openPl:12.34,marketValue:100,bid:null,ask:null,sourceRows:[2]},dte:null,shareEquivalentDelta:null,state:'LONG reported'}]}]};
test('canonical and compatibility spellings normalize to one existing dispatch identity',()=>{
 for(const options of [['--account','pts'],['--account','tt1','--snapshot','retained','--verbose'],['--help'],['-h']])assert.deepEqual(parseArgs(['positions',...options]),parseArgs(['show','positions',...options]));
 assert.equal(parseArgs(['positions','--account','pts']).command,'show-positions');
 assert.match(parseArgs(['positions','--help']).help,/Usage: ww positions/);
 assert.match(parseArgs(['positions','--help']).help,/Compatibility alias: ww show positions/);
 assert.deepEqual(parseArgs(['show','SPY']).symbols,['SPY']);
});
test('public command forms have byte-identical output, errors, status and backend requests',async()=>{
 let mode='success';const calls=[];
 const server=createServer((req,res)=>{
  calls.push({url:req.url,method:req.method,authorization:req.headers.authorization});
  res.setHeader('X-Request-Id',ID);res.setHeader('Content-Type','application/json');
  if(req.url==='/v2/accounts')res.end(JSON.stringify({requestId:ID,accounts:[{id:ACCOUNT,alias:'pts',displayName:'Fixture',brokerAssociation:{broker:'FIDELITY',accountNumber:'SYNTHETIC'}}]}));
  else if(mode==='denied'){res.statusCode=403;res.setHeader('Content-Type','application/problem+json');res.end(JSON.stringify({requestId:ID,code:'FORBIDDEN',detail:'Fixture denial'}));}
  else if(mode==='malformed')res.end('{}');
  else res.end(JSON.stringify({requestId:ID,snapshots:[{...snapshot,...(req.url.includes('snapshotId=')?{evaluationBasis:'INSPECTION_TIME',observationContext:{broker:'FIDELITY',evidenceDateBasis:'FIDELITY_EXPORT_DATE',evidenceDatePrecision:'DAY'}}:{})}]}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const run=async(args,env={})=>{
  const cli=new URL('./wheelwright.mjs',import.meta.url).pathname;
  const executable=env.FIXTURE_TTY?process.execPath:new URL('./ww',import.meta.url).pathname;
  const argv=env.FIXTURE_TTY?['--import',"data:text/javascript,Object.defineProperty(process.stdout,'isTTY',{value:true})",cli,...args]:args;
  try{return {...await promisify(execFile)(executable,argv,{env:{...process.env,WW_API_TOKEN:'synthetic-reader',WW_BASE_URL:`http://127.0.0.1:${server.address().port}`,TERM:'xterm-256color',...env}}),code:0};}
  catch(e){return {stdout:e.stdout,stderr:e.stderr,code:e.code};}
 };
 const compare=async(options,env={},code=0)=>{
  calls.length=0;const canonical=await run(['positions',...options],env),first=calls.splice(0);
  const alias=await run(['show','positions',...options],env);
  assert.deepEqual(canonical,alias);assert.equal(canonical.code,code,canonical.stderr);assert.deepEqual(calls,first);
  assert.ok(first.every(c=>c.method==='GET'&&c.authorization==='Bearer synthetic-reader'));
  return canonical;
 };
 try {
  for(const options of [[],['--table'],['--verbose'],['-v'],['--jsonl'],['--snapshot','retained'],['--snapshot','retained','--table']]){
   const r=await compare(['--account','pts',...options]);
   if(!options.length||options.includes('--jsonl'))assert.equal(JSON.parse(r.stdout).positions[0].openPl,12.34);
   if(options.includes('--table')||options.includes('--verbose'))assert.match(r.stdout,/SPY/);
  }
  assert.match((await compare(['--account','pts'],{FIXTURE_TTY:'1'})).stdout,/SPY/);
  for(const env of [{NO_COLOR:''},{TERM:'dumb'},{LC_ALL:'C'},{LC_ALL:'en_US.UTF-8'}])await compare(['--account','pts','--table'],env);
  assert.ok(!(await compare(['--account','pts','--table','--no-color'])).stdout.includes('\x1b'));
  for(const options of [[],['--account','pts','--tsv'],['--account','pts','--where','symbol=SPY'],['--account','pts','--verbose','--jsonl'],['--account','pts','--snapshot',''],['--account','../bad']]){await compare(options,{},2);assert.equal(calls.length,0);}
  await compare(['--account','unknown'],{},1);
  for(mode of ['denied','malformed']){const r=await compare(['--account','pts'],{},1);assert.equal(r.stdout,'');}
  for(const help of ['--help','-h']){await compare([help]);assert.equal(calls.length,0);}
 } finally {await new Promise(resolve=>server.close(resolve));}
});
