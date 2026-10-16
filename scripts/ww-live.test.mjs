import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify,stripVTControlCharacters as strip} from 'node:util';
import {parseLive,readOpenOptions,renderLive} from './ww-live.mjs';
import {parseShowJson} from './ww-show.mjs';
import {cellWidth} from './tastytrade-live-render.mjs';
import {piecewiseSilhouette} from './tastytrade-payoff-render.mjs';
const file=new URL('../evidence-service-java/build/structural-live-preview.json',import.meta.url);
const fixture=JSON.parse(await readFile(file,'utf8'));
const metadata=JSON.parse(await readFile(new URL('../evidence-service-java/build/structural-live-accounts.json',import.meta.url),'utf8'));
const accounts=metadata.accounts;
const data=()=>parseShowJson(JSON.stringify(fixture));
const table=(d=data(),o={})=>renderLive(d,{accounts,tty:true,width:190,noColor:true,env:{TERM:'xterm'},...o});
const allRows=d=>d.accounts.flatMap(a=>a.structures);

test('bounded grammar rejects unsupported acquisition/polling/ambiguity before IO',()=>{
 assert.equal(parseLive(['--help']).help,true);
 assert.deepEqual(parseLive(['--account','demo-tasty','--width','190','--ascii','--no-color','--table']),{account:'demo-tasty',format:'table',width:190,ascii:true,noColor:true});
 for(const args of [['--refresh'],['--poll'],['--width','19'],['--account','acct_bad'],['--jsonl','--table'],['--ascii','--ascii']])assert.throws(()=>parseLive(args));
});
test('actual Java response renders one table, preserves distinct constructions and explicit unknowns',()=>{
 const d=data(),before=JSON.stringify(d),out=table(d);
 assert.equal(out.split('BROKER').length-1,1);
 const columns=['BROKER','ACCOUNT','CONTRACT','COLLATERAL','TRADE SHAPE','RANGE','SPOT','DTE','EXIT PROGRESS','QUOTE'];
 const header=out.split('\n').find(s=>s.startsWith('BROKER'));let last=-1;for(const c of columns){const at=header.indexOf(c);assert.ok(at>last);last=at;}
 assert.match(out,/XLE ×2/);assert.match(out,/XLE ×1/);assert.match(out,/QQQ ×1/);assert.match(out,/≥52.5/);assert.match(out,/demo-fidelity ↻/);assert.match(out,/XLE ×1 \?/);
 assert.equal((out.match(/demo-tasty/g)||[]).length,4);assert.equal((out.match(/demo-fidelity/g)||[]).length,3);
 assert.ok(out.indexOf('XLE ×2')<out.indexOf('QQQ ×1'));assert.ok(out.indexOf('QQQ ×1')<out.indexOf('XLF ×1'));
 assert.ok(out.includes('╱')&&out.includes('╲'));assert.doesNotMatch(out,/SYNTHETIC01|SYNTHETIC02|holding-|261120|SPX|OLD|SHARES|[☠💀]/);
 assert.equal(JSON.stringify(d),before);assert.equal(renderLive(d),JSON.stringify(d)+'\n');assert.equal(renderLive(d,{tty:true,format:'jsonl'}),JSON.stringify(d)+'\n');
});
test('geometry follows published coordinates, not labels, holdings, prices or a strategy template',()=>{
 const d=data(),p=allRows(d).find(p=>p.strategy.value?.kind==='IRON_CONDOR'),original=table(d);
 p.strategy.value.kind='NONSTANDARD';for(const h of p.constituents){h.observedContract='UNINTERPRETED';h.terms.value=null;h.terms.status='UNKNOWN';h.terms.reasons=['TEST'];}
 const same=table(d);assert.equal((same.match(/____╱/g)||[]).length,(original.match(/____╱/g)||[]).length);
 p.payoff.value.knots.at(-1).terminalValue.numerator='50';assert.notEqual(table(d),same);
 p.payoff.status='UNKNOWN';p.payoff.value=null;p.payoff.reasons=['MISSING'];assert.match(table(d),/XLE ×[12]\s+—\s+—/);
 const graph={knots:[{underlyingPrice:0,value:-50},{underlyingPrice:59,value:-50},{underlyingPrice:59.5,value:0},{underlyingPrice:64.5,value:0},{underlyingPrice:65,value:-50}],rightSlope:0};
 const shape=piecewiseSilhouette(graph);assert.ok(!shape.compressed);assert.equal(cellWidth(shape.text),31);assert.equal((shape.text.match(/╱/g)||[]).length,1);assert.equal((shape.text.match(/╲/g)||[]).length,1);
 const compressed=piecewiseSilhouette({...graph,knots:[...graph.knots.slice(0,2),{underlyingPrice:59.000001,value:0},...graph.knots.slice(3)]});assert.equal(compressed.compressed,true);
});
test('terminal defaults, ASCII, no-color and narrow widths remain legible',()=>{
 const d=data(),plain=table(d),colored=table(d,{noColor:false});assert.equal(strip(colored),plain);assert.match(colored,/\x1b\[39m/);assert.doesNotMatch(colored,/\x1b\[(?:37|97|4\d|10[0-7])m/);
 for(const env of [{TERM:'dumb'},{TERM:'xterm',NO_COLOR:''}])assert.ok(!table(d,{noColor:false,env}).includes('\x1b'));
 for(const o of [{ascii:true},{env:{TERM:'dumb'}}])assert.ok(/^[\x00-\x7f]*$/.test(table(d,o)));
 for(const width of [20,80,120,160,190,220]){const out=table(d,{width});assert.ok(out.split('\n').every(s=>cellWidth(s)<width));if(!out.includes('XLE ×2'))assert.match(out,/positions\s+not displayed;[\s\S]*--jsonl/);}
});
test('backend unavailable Account, ambiguity and refresh conclusions stay explicit',()=>{
 const d=data(),a=d.accounts[0];a.refreshReasons=[];assert.ok(!table(d).includes('↻'));
 const p=a.structures[0];p.units={status:'UNKNOWN',value:null,evidenceIds:[],reasons:['AMBIGUOUS']};p.membership.status='CONFLICTING';assert.match(table(d),/×— !/);
 a.availability='NO_RETAINED_SNAPSHOT';a.structures=[];a.snapshot=null;a.evidenceSetId=null;a.evidence=[];a.evidenceQualification='UNAVAILABLE';assert.match(table(d),/Retained snapshot unavailable: demo-fidelity/);
 const empty={...data(),accounts:[]};assert.match(table(empty),/does not establish broker-confirmed closes/);assert.equal(JSON.parse(renderLive(empty)).accounts.length,0);
});
test('cash/share collateral is only formatted from backend associated quantities',()=>{
 const d=data(),p=allRows(d)[0];p.collateral={status:'ESTABLISHED',value:[{kind:'SHARES',symbol:'XLE',quantity:'100',currency:null,evidenceIds:['e']},{kind:'CASH',symbol:null,quantity:'5000',currency:'USD',evidenceIds:['e']}],evidenceIds:['e'],reasons:[]};assert.match(table(d,{width:220}),/100 XLE \+ \$5,000/);
});
test('executable consumes only authorized structural v2 GETs and never emits partial output',async()=>{
 const calls=[];let mode='ok';const server=createServer((req,res)=>{
  calls.push([req.method,req.url]);res.setHeader('X-Request-Id',fixture.requestId);res.setHeader('Content-Type','application/json');assert.equal(req.headers.authorization,'Bearer synthetic-reader');
  if(req.url==='/v2/accounts')return res.end(JSON.stringify({...metadata,requestId:fixture.requestId}));
  const url=new URL(req.url,'http://localhost');assert.equal(req.method,'GET');assert.equal(url.pathname,'/v2/positions');assert.equal(url.searchParams.get('view'),'option-structure');
  if(mode==='denied'){res.statusCode=403;res.setHeader('Content-Type','application/problem+json');return res.end(JSON.stringify({requestId:fixture.requestId,code:'FORBIDDEN',detail:'Denied'}));}
  const d=structuredClone(fixture);if(url.searchParams.has('accountId'))d.accounts=d.accounts.filter(a=>a.accountId===url.searchParams.get('accountId'));
  if(mode==='bad')d.accounts.at(-1).structures[0].payoff.value={basis:'INVENTED'};
  if(mode==='scope')d.accounts.push(structuredClone(d.accounts[0]));
  res.end(JSON.stringify(d));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=async args=>{try{return {...await promisify(execFile)(new URL('./ww',import.meta.url).pathname,args,{env:{...process.env,WW_API_TOKEN:'synthetic-reader',WW_BASE_URL:`http://127.0.0.1:${server.address().port}`,TERM:'xterm',NO_COLOR:''}}),code:0};}catch(e){return {stdout:e.stdout,stderr:e.stderr,code:e.code};}};
 try{
  let r=await run(['live','--table','--width','190']);assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/demo-tasty/);assert.deepEqual(calls.splice(0),[['GET','/v2/accounts'],['GET','/v2/positions?view=option-structure']]);
  r=await run(['live','--account','demo-tasty','--jsonl']);assert.equal(r.code,0,r.stderr);assert.equal(JSON.parse(r.stdout).accounts.length,1);assert.equal(r.stderr,'');assert.deepEqual(calls.splice(0),[['GET','/v2/accounts'],['GET',`/v2/positions?accountId=${accounts.find(a=>a.alias==='demo-tasty').id}&view=option-structure`]]);
  for(mode of ['denied','bad','scope']){r=await run(['live','--table']);assert.equal(r.code,1);assert.equal(r.stdout,'');}
  mode='ok';r=await run(['live']);assert.deepEqual(JSON.parse(r.stdout),fixture);r=await run(['live','--account','missing']);assert.equal(r.code,1);assert.equal(r.stdout,'');
 }finally{await new Promise(r=>server.close(r));}
});

test('real integrated preview ignores operator targets and uses disposable Java backend',async()=>{
 const r=await promisify(execFile)(process.execPath,[new URL('./ww-live-preview.mjs',import.meta.url).pathname,'--width','190','--no-color'],{timeout:90000,env:{...process.env,WW_BASE_URL:'http://127.0.0.1:1',WW_API_TOKEN:'synthetic-must-not-use',TASTYTRADE_CLIENT_SECRET:'synthetic-must-not-use',TERM:'xterm'}});
 assert.match(r.stderr,/SYNTHETIC construction specimen/);assert.match(r.stdout,/XLE ×2/);assert.match(r.stdout,/XLE ×1/);assert.match(r.stdout,/demo-fidelity ↻/);assert.match(r.stdout,/╱/);assert.doesNotMatch(r.stdout+r.stderr,/synthetic-must-not-use/);
});
