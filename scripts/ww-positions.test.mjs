import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePositions, renderPositions, readPositions, validatePositions } from './ww-positions.mjs';
import { parseShowJson } from './ww-show.mjs';
import { parseArgs } from './wheelwright.mjs';

const ACCOUNT='acct_11111111111111111111111111111111';
const ID='11111111-1111-4111-8111-111111111111';
const h=(id,contract,quantity,pl)=>({holdingId:id,contract,description:'broker evidence',kind:'Options',custody:'Cash',quantity,openPl:pl,marketValue:-100,bid:null,ask:null,expiration:'2026-10-16',sourceRows:[2]});
const specimen=()=>parseShowJson(JSON.stringify({requestId:ID,accountId:ACCOUNT,accountName:'PERSONAL TREASURY',snapshotId:'snapshot',evidenceDate:'2026-10-11',recordedAt:'2026-10-11T12:00:00Z',evaluatedAt:'2026-10-11T12:01:00Z',sourceFile:'Positions.csv',sourceSha256:'a'.repeat(64),artifactId:ID,excludedNonPositionRows:1,workingOrderCoverage:'UNKNOWN',qualifications:['Historical snapshot; coverage unknown.'],positions:[
  {positionId:'position-spread',label:'Explicit call spread',identityBasis:'EXPLICIT_SNAPSHOT_ASSOCIATION',program:null,associationAuthority:'operator specimen',openPl:null,marketValue:-200,shareEquivalentDelta:null,qualifications:['Open P/L incomplete; no partial total shown.'],constituents:[{holding:h('leg1','-SPY261016C550',-2,null),dte:5,shareEquivalentDelta:null,state:'SHORT / obligation reported'},{holding:h('leg2','-SPY261016C560',2,5.25),dte:5,shareEquivalentDelta:null,state:'LONG / right reported'}]},
  {positionId:'position-long',label:'VERY LONG CONTRACT LABEL',identityBasis:'OBSERVED_CONTRACT_AND_CUSTODY',program:null,openPl:12345.67,marketValue:100000,shareEquivalentDelta:100,qualifications:[],constituents:[{holding:{...h('leg3','SPY',100,12345.67),kind:'ETFs'},dte:null,shareEquivalentDelta:100,state:'LONG reported'}]}
]}));
test('positions grammar is explicit and preserves quote show',()=>{
  assert.deepEqual(parsePositions(['--account','pts','--verbose']),{account:'pts',verbose:true,format:undefined});
  assert.equal(parseArgs(['show','positions','--account','pts']).command,'show-positions');
  assert.deepEqual(parseArgs(['show','SPY']).symbols,['SPY']);
  for(const args of [[],['--account','../bad'],['--account','pts','--jsonl','--verbose'],['--account','pts','SPY']]) assert.throws(()=>parsePositions(args));
});
test('fixed numeric columns ignore indentation and missing values; multi-leg quantities retain signs',()=>{
  const s=specimen(), output=renderPositions(s,{verbose:true});
  const lines=output.split('\n'), header=lines.find(l=>l.startsWith('POSITION / CONTRACT'));
  const starts=['QTY','DTE','OPEN P/L','DELTA(sh)','CAP REQ','MKT VALUE','BID / ASK'].map(label=>header.indexOf(label));
  const leg=lines.find(l=>l.startsWith('  -SPY261016C550'));
  assert.equal(leg.slice(starts[0],starts[0]+3),' -2');
  assert.match(leg,/\?\s+\?\s+\?\s+-100\.00/);
  const longLeg=lines.find(l=>l.startsWith('  -SPY261016C560'));
  assert.equal(longLeg.slice(starts[0],starts[0]+3),'  2');
  assert.equal(longLeg.slice(starts[1],starts[1]+3),'  5');
  assert.match(output,/WORKING BROKERAGE ORDERS — coverage unknown/);
  assert.match(output,/Close terms: unknown/); assert.match(output,/Program: unknown/);
  assert.match(output,/Open P\/L incomplete/);
  const separators=lines.filter(l=>/^-+$/.test(l)); assert.ok(separators.length>=2);
  assert.ok(separators.every(l=>l.length===separators[0].length));
  assert.ok(lines.filter(l=>/^  -+$/.test(l)).every(l=>l.length===separators[0].length));
});
test('machine output preserves backend values and no terminal escape injection',()=>{
  const s=specimen(); assert.equal(renderPositions(s),JSON.stringify(s)+'\n');
  s.positions[0].label='bad\x1b[2J\nline';
  const rendered=renderPositions(s,{verbose:true}); assert.ok(!rendered.includes('\x1b'));
  assert.ok(rendered.includes('\\u001b[2J\\u000aline'));
  const empty={...specimen(),positions:[]};assert.match(renderPositions(empty,{verbose:true}),/No Positions reported/);
});
test('transport uses one backend account read and rejects malformed results or duplicate inventory',async()=>{
  const s=specimen();let calls=0;
  const result=await readPositions(ACCOUNT,'secret-credential',{base:'http://localhost:3101',fetchImpl:async(url,options)=>{
    calls++;assert.equal(url.pathname,'/v2/positions');assert.equal(url.searchParams.get('accountId'),ACCOUNT);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
    return new Response(JSON.stringify({requestId:ID,snapshots:[s]}),{status:200,headers:{'Content-Type':'application/json','X-Request-Id':ID}});
  }});
  assert.equal(calls,1);assert.equal(result.accountId,ACCOUNT);
  s.positions.push(s.positions[0]);assert.throws(()=>validatePositions(s,ACCOUNT,ID));
  await assert.rejects(()=>readPositions(ACCOUNT,'token',{fetchImpl:async()=>new Response('token',{headers:{'X-Request-Id':ID}})}),/credential/);
});
test('actual Java HTTP specimen is renderable without client reconciliation',async()=>{
  const data=parseShowJson(await readFile(new URL('../evidence-service-java/build/position-read-specimen.json',import.meta.url),'utf8'));
  validatePositions(data,ACCOUNT,data.requestId);
  const output=renderPositions(data,{verbose:true});
  assert.match(output,/SPY/);assert.match(output,/Program: unknown/);assert.match(output,/source|Evidence/);
});

test('CONV-UX accents preserve visible layout; all color suppression modes and JSONL are ANSI free',()=>{
  const s=specimen();s.observation={broker:'TASTYTRADE',environment:'PRODUCTION',acquisitionId:ID,startedAt:'2026-10-11T12:00:00Z',receivedAt:'2026-10-11T12:00:01Z',interpretationVersion:'tastytrade-holdings-v1',sourceScope:'REQUESTED_ACCOUNT_FULL_HOLDINGS'};
  const opts={format:'table',accountLabel:'tt1',env:{TERM:'xterm-256color'}};
  const colored=renderPositions(s,opts),plain=renderPositions(s,{...opts,noColor:true});
  assert.equal(colored.replace(/\x1b\[[0-9;]*m/g,''),plain);
  for(const marker of ['\x1b[97m','\x1b[96mtt1','\x1b[91mtastytrade','\x1b[93mcoverage unknown','\x1b[37m?','\x1b[0m'])assert.ok(colored.includes(marker));
  for(const extra of [{noColor:true},{env:{NO_COLOR:'',TERM:'xterm'}},{env:{TERM:'dumb'}},{format:'jsonl'}])assert.ok(!renderPositions(s,{...opts,...extra}).includes('\x1b'));
  assert.ok(plain.includes('opening attribution unresolved'));
  assert.deepEqual(parsePositions(['--account','tt1','--no-color']),{account:'tt1',verbose:false,format:undefined,noColor:true});
});
test('actual tastytrade Java projection exposes independent contracts with quantities, without occurrence inference',async()=>{
  const data=parseShowJson(await readFile(new URL('../evidence-service-java/build/tastytrade-position-read-specimen.json',import.meta.url),'utf8'));
  validatePositions(data,data.accountId,data.requestId);
  const output=renderPositions(data,{format:'table',accountLabel:'tt1',noColor:true});
  assert.equal(data.positions.length,4);assert.match(output,/tastytrade snapshot/);assert.match(output,/XLE\s+261016P00059000\s+1/);assert.match(output,/XLE\s+261016P00059500\s+-1/);
  for(const p of data.positions){assert.equal(p.openPl,null);assert.equal(p.program,null);assert.equal(p.constituents.length,1);}
  assert.match(output,/opening attribution unresolved/);assert.ok(!output.includes('0.18'));
});
