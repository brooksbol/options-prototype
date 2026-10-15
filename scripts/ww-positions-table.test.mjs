import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPositionCollection,renderPositions} from './ww-positions.mjs';
import {parseShowJson} from './ww-show.mjs';
const specimen=(id,label,custody,amount)=>parseShowJson(JSON.stringify({accountId:id,accountName:'Fixture',evidenceDate:'2026-10-15',positions:[{label,openPl:amount,marketValue:null,constituents:[{holding:{custody,quantity:-2},dte:8,state:'SHORT / obligation reported'}]}]}));
test('one global table starts with broker/account and shares widths across mixed broker evidence',()=>{
 const a=specimen('one','SHORT','Cash',12.34),b={...specimen('two','LONGER CONTRACT','BROKER_REPORTED',null),observation:{broker:'TASTYTRADE'}};
 const accounts=[{id:'one',alias:'pts'},{id:'two',alias:'sawdust'}];
 const output=renderPositionCollection([a,b],{tty:true,noColor:true,accounts});
 const lines=output.trimEnd().split('\n');assert.equal(lines.length,3);
 assert.match(lines[0],/^BROKER\s+ACCOUNT\s+POSITION \/ CONTRACT\s+CUSTODY/);
 assert.equal(output.match(/POSITION \/ CONTRACT/g).length,1);assert.ok(!output.includes('inventory'));
 assert.doesNotMatch(output,/WORKING BROKERAGE ORDERS|Close terms:|Snapshot:/);
 assert.match(lines[1],/^Fidelity\s+pts\s+SHORT/);assert.match(lines[2],/^tastytrade\s+sawdust\s+LONGER CONTRACT/);
 for(const line of lines.slice(1))assert.equal(line.indexOf('-2'),lines[0].indexOf('QTY')+1);
 assert.ok(lines[2].slice(lines[0].indexOf('CUSTODY'),lines[0].indexOf('QTY')).includes('?'));
 assert.equal(renderPositions(a,{tty:true,noColor:true,accountLabel:'pts'}),renderPositionCollection([a],{tty:true,noColor:true,accounts}));
 assert.ok(!renderPositionCollection([b],{tty:true,noColor:true,accounts}).includes('CUSTODY'));
});
test('brand/alias accents preserve alignment, suppression and complete unmodified JSONL',()=>{
 const a=specimen('one','SHORT','Cash',12.34),b={...specimen('two','LONGER','BROKER_REPORTED',null),observation:{broker:'TASTYTRADE'}};
 const options={tty:true,accounts:[{id:'one',alias:'pts'},{id:'two',alias:'tt1'}],env:{TERM:'xterm'}};
 const colored=renderPositionCollection([a,b],options),plain=renderPositionCollection([a,b],{...options,noColor:true});
 assert.equal(colored.replace(/\x1b\[[0-9;]*m/g,''),plain);
 for(const marker of ['\x1b[32mFidelity','\x1b[91mtastytrade','\x1b[96mpts','\x1b[96mtt1','\x1b[92m'])assert.ok(colored.includes(marker));
 for(const env of [{NO_COLOR:''},{TERM:'dumb'}])assert.ok(!renderPositionCollection([a,b],{...options,env}).includes('\x1b'));
 const expected=JSON.stringify(a)+'\n'+JSON.stringify(b)+'\n';
 assert.equal(renderPositionCollection([a,b],{...options,format:'jsonl'}),expected);
 assert.equal(renderPositionCollection([a,b],{tty:false}),expected);
 assert.equal(renderPositionCollection([],{...options,format:'jsonl'}),'');
 assert.equal(renderPositionCollection([],{tty:false}),'');
 assert.match(renderPositionCollection([],{tty:true,noColor:true}),/^BROKER\s+ACCOUNT/);
 assert.match(renderPositionCollection([a],{tty:true,noColor:true}),/one/);
});

test('compact option typography is consistent without changing raw identities, adjusted roots or association labels',()=>{
 const option=(contract,expiration)=>{const data=specimen('one',contract,'Cash',null);Object.assign(data.positions[0].constituents[0].holding,{contract,kind:'Options',expiration});return data;};
 for(const [fidelity,occ,display] of [
  ['-XLF261127P52','XLF   261127P00052000','XLF 261127P52'],
  ['-UNG261127P8.5','UNG   261127P00008500','UNG 261127P8.5'],
  ['-TEST261127C0.125','TEST  261127C00000125','TEST 261127C0.125'],
  ['-TEST261127C1000.001','TEST 261127C01000001','TEST 261127C1000.001'],
  ['-ETHA1261127C20.500','ETHA1 261127C00020500','ETHA1 261127C20.5'],
 ]) {
  const a=option(fidelity,'2026-11-27'),b=option(occ,'2026-11-27');
  for(const snapshot of [a,b]) {
   const original=JSON.stringify(snapshot);
   assert.ok(renderPositionCollection([snapshot],{tty:true,noColor:true}).includes(display));
   assert.equal(renderPositionCollection([snapshot],{format:'jsonl'}),original+'\n');
   assert.equal(JSON.stringify(snapshot),original);
  }
 }
 const wrongDate=option('-XLF261127P52','2026-11-20');
 assert.ok(renderPositionCollection([wrongDate],{tty:true,noColor:true}).includes('-XLF261127P52'));
 const explicit=option('-XLF261127P52','2026-11-27');explicit.positions[0].identityBasis='EXPLICIT_SNAPSHOT_ASSOCIATION';
 assert.ok(renderPositionCollection([explicit],{tty:true,noColor:true}).includes('-XLF261127P52'));
 const custom=option('-XLF261127P52','2026-11-27');custom.positions[0].label='Protected XLF spread';
 assert.ok(renderPositionCollection([custom],{tty:true,noColor:true}).includes('Protected XLF spread'));
 for(const raw of ['XLF 261127P0005200','XLF 261127P000520000','unsupported','-TEST261127C1.2.3']) {
  assert.ok(renderPositionCollection([option(raw,'2026-11-27')],{tty:true,noColor:true}).includes(raw));
 }
});
