import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {stripVTControlCharacters as strip} from 'node:util';
import {parseShowJson} from './ww-show.mjs';
import {renderLive} from './ww-live.mjs';
import {cellWidth} from './tastytrade-live-render.mjs';
const fixture=await readFile(new URL('../evidence-service-java/build/structural-live-preview.json',import.meta.url),'utf8');
const accounts=JSON.parse(await readFile(new URL('../evidence-service-java/build/structural-live-accounts.json',import.meta.url),'utf8')).accounts;
const data=()=>parseShowJson(fixture);
const render=(d=data(),extra={})=>renderLive(d,{accounts,tty:true,width:190,noColor:true,env:{TERM:'xterm'},...extra});
const header=out=>strip(out).split('\n').find(l=>l.startsWith('BROKER'));
const factUnknown=()=>({status:'UNKNOWN',value:null,evidenceIds:[],reasons:['SYNTHETIC_UNAVAILABLE']});

test('TT preferred widths are preserved with missing shape, remaining/original DTE and economics',()=>{
 const d=data(),normal=header(render(d));
 // Existing TT preferences: shape31, DTE18 (11 slots +5 label +2), exit29.
 const shape=normal.indexOf('TRADE SHAPE')-10,dte=normal.indexOf('DTE')-7,exit=normal.indexOf('EXIT PROGRESS')-8;
 assert.equal(normal.indexOf('RANGE')-shape,31+2);
 assert.equal(exit-dte,18+2);
 assert.equal(normal.indexOf('QUOTE')-exit,29+3);
 for(const a of d.accounts)for(const p of a.structures){p.payoff=factUnknown();p.remainingDte=null;p.openingFillAt=factUnknown();}
 const unknown=render(d);assert.equal(header(unknown),normal);assert.doesNotMatch(unknown,/35d|╱|╲|[▲▼◆☠]|\d+\/\d+d/);
 assert.equal(unknown.split('\n').filter(l=>/^Fidelity|^tastytrade/.test(l)).length,7);
});

test('gross geometry and unavailable evidence use terminal foreground on green/light/dark palettes',()=>{
 const colored=render(data(),{noColor:false}),plain=render();assert.equal(strip(colored),plain);
 // Palette emulation tests the emitted SGR contract, not subjective contrast or physical terminal acceptance.
 for(const COLORFGBG of ['2;0','0;15','15;0'])assert.equal(render(data(),{noColor:false,env:{TERM:'xterm',COLORFGBG}}),colored);
 const codes=[...colored.matchAll(/\x1b\[([0-9;]*)m/g)].map(m=>m[1]);assert.ok(codes.every(c=>['0','39','32','91','96'].includes(c)));
 assert.doesNotMatch(colored,/\x1b\[(?:37|97|4\d|10[0-7]|38;|48;)m/);
 const plainLines=plain.split('\n'),coloredLines=colored.split('\n');
 const h=header(plain),start=h.indexOf('TRADE SHAPE')-10,end=h.indexOf('RANGE');
 for(let i=0;i<plainLines.length;i++)if(/^Fidelity|^tastytrade/.test(plainLines[i])){
  let cell=0,code='39';for(const token of coloredLines[i].matchAll(/\x1b\[[0-9;]*m|[^\x1b]+/g)){
   if(token[0].startsWith('\x1b')){code=token[0].slice(2,-1);continue;}
   for(const ch of token[0]){if(cell>=start&&cell<end)assert.equal(code,'39');cell+=cellWidth(ch);}
  }
 }
 // No source of qualified SPOT exists in P2; adding tempting uncontracted values must not create a marker.
 const d=data();for(const a of d.accounts)for(const p of a.structures){p.spot=123;p.last=123;p.underlying.value&&Object.assign(p.underlying.value,{spot:123});}
 assert.equal(render(d),plain);assert.doesNotMatch(plain,/[▲▼◆]/);
});

test('adaptive reduction preserves TT precedence, complete rows and Unicode widths',()=>{
 let sawShape=false,sawWithoutShape=false,sawWithoutRange=false,sawWithoutSpot=false,sawFallback=false;
 for(let width=250;width>=20;width--){
  const out=render(data(),{width}),h=header(out);assert.ok(out.split('\n').every(l=>cellWidth(l)<width));
  if(!h){sawFallback=true;assert.match(out,/7\s+positions\s+not\s+displayed;[\s\S]*--jsonl/);continue;}
  assert.equal(out.split('\n').filter(l=>/^Fidelity|^tastytrade/.test(l)).length,7);
  if(h.includes('TRADE SHAPE'))sawShape=true;else sawWithoutShape=true;
  if(!h.includes('RANGE')){sawWithoutRange=true;assert.ok(!h.includes('TRADE SHAPE'));}
  if(!h.includes('SPOT')){sawWithoutSpot=true;assert.ok(!h.includes('RANGE')&&!h.includes('TRADE SHAPE'));}
  for(const c of ['BROKER','ACCOUNT','CONTRACT','COLLATERAL','DTE','EXIT PROGRESS','QUOTE'])assert.ok(h.includes(c));
 }
 assert.ok(sawShape&&sawWithoutShape&&sawWithoutRange&&sawWithoutSpot&&sawFallback);
 for(const extra of [{ascii:true},{env:{TERM:'dumb'}},{env:{TERM:'xterm',NO_COLOR:''}}]){
  const out=render(data(),{noColor:false,...extra});if(!extra.ascii)assert.ok(!out.includes('\x1b'));if(extra.ascii||extra.env?.TERM==='dumb')assert.match(strip(out),/^[\x00-\x7f]*$/);
 }
});

test('representative visual specimens retain unknown/conflicting rows without semantic invention',async()=>{
 const d=data();const p=d.accounts.flatMap(a=>a.structures).find(p=>p.strategy.value?.kind==='NONSTANDARD');assert.ok(p);p.units=factUnknown();p.membership.status='CONFLICTING';p.membership.reasons=['SYNTHETIC_CONFLICT'];
 const out=render(d);assert.match(out,/QQQ ×— !/);assert.match(out,/╱/);assert.doesNotMatch(out,/[☠▲▼◆]|\d+\/\d+d/);
 const dir=new URL('../evidence-service-java/build/ww-live-visual/',import.meta.url);await mkdir(dir,{recursive:true});
 for(const [name,options] of Object.entries({unicode:{},ascii:{ascii:true},green:{noColor:false,env:{TERM:'xterm',COLORFGBG:'2;0'}},light:{noColor:false,env:{TERM:'xterm',COLORFGBG:'0;15'}},dark:{noColor:false,env:{TERM:'xterm',COLORFGBG:'15;0'}},narrow:{width:150},tiny:{width:40}}))await writeFile(new URL(name+'.txt',dir),render(d,options));
});
