import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify,stripVTControlCharacters} from 'node:util';
import {parseArgs} from './wheelwright.mjs';
import {renderLive} from './ww-live.mjs';
import {parseShowJson} from './ww-show.mjs';
import {cellWidth} from './tastytrade-live-render.mjs';

const ID='11111111-1111-4111-8111-111111111111';
const A='acct_'+'1'.repeat(32),B='acct_'+'2'.repeat(32);
const accounts=[{id:A,alias:'alpha',displayName:'Synthetic Alpha',brokerAssociation:{broker:'FIDELITY',accountNumber:'SYNTHETIC1111'}},
  {id:B,alias:'beta',displayName:'Synthetic Beta',brokerAssociation:{broker:'TASTYTRADE',accountNumber:'SYNTHETIC2222'}}];
const position=(id,symbol,geometry=null)=>({positionId:id,sourcePositionId:id,identityBasis:'EXPLICIT_SNAPSHOT_ASSOCIATION',membership:'EXPLICIT_SNAPSHOT_ASSOCIATION',
 underlying:symbol,quantity:3,expiration:'2026-11-20',dte:35,firstOpeningFillAt:null,strategy:geometry?'IRON_CONDOR':'UNKNOWN',complexity:geometry?4:1,
 geometry,range:geometry?{kind:'SHORT_STRIKE_INTERVAL',lower:510,upper:550}:null,collateral:[],holdingIds:[id],termsSources:[],qualifications:['Synthetic backend qualification']});
const geometry={basis:'GROSS_EXPIRATION_INTRINSIC_BEFORE_PREMIUM',knots:[{underlyingPrice:500,value:-3000},{underlyingPrice:510,value:0},{underlyingPrice:550,value:0},{underlyingPrice:560,value:-3000}],leftSlope:0,rightSlope:0,strikes:[500,510,550,560]};
const snapshot=(accountId,positions)=>({requestId:ID,accountId,broker:accountId===A?'FIDELITY':'TASTYTRADE',snapshotId:'synthetic-'+accountId,
 evidenceDate:'2026-10-15',recordedAt:'2026-10-15T12:00:00Z',evaluatedAt:'2026-10-16T12:00:00Z',sourceFile:'synthetic.csv',sourceSha256:'a'.repeat(64),artifactId:null,
 refreshReasons:[],qualifications:['Retained source; opening and prices unknown.'],positions});
const snapshots=[snapshot(A,[position('one','SPY',geometry)]),snapshot(B,[position('unknown',null)])];
const parsed=value=>parseShowJson(JSON.stringify(value));
const table=(data=snapshots,options={})=>renderLive(parsed(data),{accounts,format:'table',width:220,noColor:true,env:{TERM:'xterm'},...options});

test('live grammar remains separate from accepted positions and rejects acquisition/unknown flags',()=>{
  assert.equal(parseArgs(['live']).command,'live');
  for(const flag of ['--help','-h','--man'])assert.match(parseArgs(['live',flag]).help,/No acquisition/);
  for(const args of [['--account'],['--account','../bad'],['--width'],['--width','19'],['--width','1001'],['--width','3e2'],
    ['--table','--jsonl'],['--pull'],['--refresh'],['--watch'],['--tsv'],['--snapshot','old']])
    assert.throws(()=>parseArgs(['live',...args]),/invalid usage/);
  assert.equal(parseArgs(['positions']).command,'show-positions');
  assert.equal(parseArgs(['show','positions']).command,'show-positions');
});

test('renders backend geometry without market prices, retains unknowns and never groups same-symbol rows',()=>{
 const out=table();
 assert.match(out,/BROKER\s+ACCOUNT\s+CONTRACT\s+COLLATERAL\s+TRADE SHAPE\s+RANGE\s+SPOT\s+DTE\s+EXIT PROGRESS\s+QUOTE/);
 assert.match(out,/SPY ×3/);assert.match(out,/510–550/);assert.match(out,/╱/);assert.match(out,/╲/);assert.ok(!out.includes('☠'));
 const data=[snapshot(A,[0,1,2,3].map(i=>position('same-'+i,'SPY')))];
 assert.equal(table(data).split('SPY ×3').length-1,4);
 const changed=structuredClone(snapshots);changed[0].positions[0].geometry=null;changed[0].positions[0].range=null;
 assert.ok(!table(changed).includes('╱')); // no construction reconstructed by client
 changed[0].positions[0].collateral=[{kind:'SHARES',symbol:'XLE',quantity:66,currency:null}];
 assert.match(table(changed),/66 XLE/);assert.ok(!table(changed).includes('100 XLE'));
 changed[0].refreshReasons=['EXPIRED_OPTIONS_IN_RETAINED_FIDELITY_SNAPSHOT'];assert.match(table(changed),/alpha ↻/);
 assert.ok(!table().includes('↻'));
});

test('published complexity and verified timestamp control order; unknown dates last, raw evidence preserved',()=>{
 const a=position('a','ZZZ');a.firstOpeningFillAt='2026-10-01T14:00:00Z';
 const b=position('b','AAA');b.firstOpeningFillAt='2026-10-01T15:00:00Z';
 const c=position('c','BBB');const d=position('d','CCC',geometry);
 const data=parsed([snapshot(A,[c,b,d,a])]),before=JSON.stringify(data);
 const out=renderLive(data,{accounts,tty:true,width:220,noColor:true,env:{TERM:'xterm'}});
 assert.ok(out.indexOf('CCC ×3')<out.indexOf('ZZZ ×3'));assert.ok(out.indexOf('ZZZ ×3')<out.indexOf('AAA ×3'));assert.ok(out.indexOf('AAA ×3')<out.indexOf('BBB ×3'));
 assert.equal(JSON.stringify(data),before);assert.equal(renderLive(data,{accounts}),data.map(s=>JSON.stringify(s)+'\n').join(''));
 assert.equal(renderLive([],{format:'jsonl',tty:true}),'');assert.match(table([]),/does not establish broker-confirmed closes/);
});

test('foreground follows terminal palette; monochrome, ASCII and narrow fallback are honest',()=>{
  const plain=table(),colored=table(snapshots,{noColor:false});
  assert.equal(stripVTControlCharacters(colored),plain);
  assert.ok(colored.includes('\x1b[39m'));
  assert.ok(!/\x1b\[(?:37|97|4[0-9]|10[0-7])m/.test(colored));
  for(const env of [{TERM:'dumb'},{TERM:'xterm',NO_COLOR:''}])assert.ok(!table(snapshots,{noColor:false,env}).includes('\x1b'));
  assert.ok(!table(snapshots,{ascii:true}).includes('—'));
  assert.ok(!table(snapshots,{env:{TERM:'dumb'}}).includes('—'));
  for(const width of [20,80,120,157,220]) {
    const out=table(snapshots,{width});
    assert.ok(out.split('\n').every(line=>cellWidth(line)<width),`width ${width}`);
    if(!out.includes('SPY ×3'))assert.match(out,/positions\s+not displayed;[\s\S]*--jsonl/);
  }
  assert.ok(table([],{width:80}).split('\n').every(line=>cellWidth(line)<80));
});

test('actual command uses only v2 GETs, resolves aliases, fails without partial stdout, and preserves JSONL',async()=>{
  const calls=[];let mode='ok';
  const server=createServer((req,res)=>{
    calls.push([req.method,req.url]);
    res.setHeader('X-Request-Id',ID);res.setHeader('Content-Type','application/json');
    assert.equal(req.headers.authorization,'Bearer synthetic-reader');
    if(req.url==='/v2/accounts')return res.end(JSON.stringify({requestId:ID,accounts}));
    const url=new URL(req.url,'http://localhost');
    if(req.method!=='GET'||url.pathname!=='/v2/positions'||url.searchParams.get('view')!=='open-options'){res.statusCode=500;return res.end('{}');}
    if(mode==='denied'){res.statusCode=403;res.setHeader('Content-Type','application/problem+json');return res.end(JSON.stringify({requestId:ID,code:'FORBIDDEN',detail:'Synthetic denial'}));}
    const selected=url.searchParams.has('accountId')?snapshots.filter(s=>s.accountId===url.searchParams.get('accountId')):snapshots;
    res.end(mode==='bad'?'{}':JSON.stringify({requestId:ID,optionSnapshots:mode==='empty'?[]:selected}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const run=async args=>{
    try{return {...await promisify(execFile)(new URL('./ww',import.meta.url).pathname,args,{env:{...process.env,WW_API_TOKEN:'synthetic-reader',
      WW_BASE_URL:`http://127.0.0.1:${server.address().port}`,TERM:'xterm',NO_COLOR:''}}),code:0};}
    catch(e){return {stdout:e.stdout,stderr:e.stderr,code:e.code};}
  };
  try {
    let result=await run(['live','--table','--width','220']);
    assert.equal(result.code,0,result.stderr);assert.match(result.stdout,/Fidelity\s+alpha/);assert.match(result.stdout,/tastytrade\s+beta/);
    assert.deepEqual(calls.splice(0),[['GET','/v2/accounts'],['GET','/v2/positions?view=open-options']]);
    result=await run(['live','--account','beta','--jsonl']);
    assert.deepEqual(JSON.parse(result.stdout),snapshots[1]);assert.equal(result.stderr,'');
    assert.deepEqual(calls.splice(0),[['GET','/v2/accounts'],['GET',`/v2/positions?accountId=${B}&view=open-options`]]);
    result=await run(['live']);assert.deepEqual(result.stdout.trim().split('\n').map(JSON.parse),snapshots);
    for(mode of ['denied','bad']){result=await run(['live','--table']);assert.equal(result.code,1);assert.equal(result.stdout,'');}
    mode='empty';result=await run(['live']);assert.equal(result.code,0);assert.equal(result.stdout,'');
    result=await run(['live','--account','unknown']);assert.equal(result.code,1);assert.equal(result.stdout,'');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
