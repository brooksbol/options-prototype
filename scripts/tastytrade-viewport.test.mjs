import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripVTControlCharacters as strip} from 'node:util';
import {projectLive,renderLive} from './tastytrade-live.mjs';
import {silhouette,verticalViewport} from './tastytrade-payoff-render.mjs';
import {cellWidth} from './tastytrade-live-render.mjs';
import {liveEvidence} from './tastytrade-fixtures.mjs';
const raw=JSON.parse(readFileSync(new URL('./tastytrade-xlf-fixture.json',import.meta.url)));
const base=()=>({...structuredClone(raw),now:new Date(raw.now)});
const position=()=>projectLive(base()).positions[0];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('XLF entry-centered viewport includes risk geometry with proportional spacing and two loss-tail cells',()=>{
  const p=position(),s=silhouette(p);near(p.entryReference.value,54.215);assert.equal(p.entryReference.lagMs,29664);
  assert.equal(s.viewport.referenceKind,'pre-entry candle');assert.equal(s.viewport.limited,false);
  p.spot.value=p.entryReference.value;assert.equal(silhouette(p).markerIndex,15);
  assert.equal(s.text.length,31);assert.ok(s.breaks[0]>=2);assert.ok(s.breaks[1]-s.breaks[0]>=2);
  near((52.5-52)/(s.hi-s.lo)*29,2.821670428893918); // actual width on shared linear scale
  assert.deepEqual(s.breaks,[52,52.5].map(x=>Math.round((x-s.lo)/(s.hi-s.lo)*29)));
});
for(const [name,value] of [['equal to entry',54.215],['moderately above',55],['moderately below',53.5],['approaching short',52.6],['between strikes',52.25],['below long',51.8],['right overflow',60],['left overflow',50]]) {
  test(name+' moves spot across fixed entry landscape',()=>{
    const p=position();p.spot.value=value;const s=silhouette(p),v=verticalViewport(position());
    near(s.lo,v.lo);near(s.hi,v.hi);assert.equal(s.markerIndex,Math.max(0,Math.min(29,Math.round((value-s.lo)/(s.hi-s.lo)*29))));
    assert.equal(cellWidth(s.text),31);
    assert.match(s.text,value<v.lo?/←/:value>v.hi?/→/:/[▲▼◆]/);
    assert.match(silhouette(p,{color:true}).text,/\x1b\[96m/);
  });
}
test('entry near center, rising/falling movement and strike approaches use the same price scale',()=>{
  const p=position(),indices=[];
  for(const value of [51.8,52.25,52.6,53.5,54.215,55]){p.spot.value=value;indices.push(silhouette(p).markerIndex);}
  assert.ok(indices.every((n,i)=>i===0||n>indices[i-1]));
});
for(const [name,strikes,entry,limited] of [['narrow',[52,52.1],54.2,true],['wide',[50,55],58,false],['deep OTM',[52,52.5],80,true]]) {
  test(name+' preserves proportional geometry; resolution outranks centering when necessary',()=>{
    const p=position();p.payoff.strikes=strikes;p.entryReference.value=entry;p.spot.value=entry;
    const s=silhouette(p);assert.equal(s.viewport.limited,limited);assert.equal(cellWidth(s.text),31);
    assert.ok((strikes[1]-strikes[0])*29/(s.hi-s.lo)>=1-1e-8);
    assert.deepEqual(s.breaks,strikes.map(x=>Math.round((x-s.lo)/(s.hi-s.lo)*29)));
    if(limited)assert.ok(s.text.startsWith('~'));else assert.equal(s.markerIndex,15);
  });
}
for(const [name,mutate] of [['unavailable',e=>e.entryReferences=[]],['stale',e=>e.entryReferences[0].barStart-=60_000],['future',e=>e.entryReferences[0].barEnd+=60_000],['unverified source',e=>e.entryReferences[0].source='current quote'],['duplicate',e=>e.entryReferences.push({...e.entryReferences[0]})]]) {
  test(name+' entry uses explicit deterministic strike fallback, never current-spot recentering',()=>{
    const e=base();mutate(e);const p=projectLive(e).positions[0];assert.equal(p.entryReference,null);
    p.spot.value=54.265;const s=silhouette(p);assert.ok(s.text.startsWith('?'));assert.equal(s.viewport.referenceKind,'strike fallback');
    p.spot.value=53;const changed=silhouette(p);near(changed.lo,s.lo);near(changed.hi,s.hi);assert.notEqual(changed.markerIndex,s.markerIndex);
  });
}
test('bear call mirrors the entry policy with upside risk; IC remains on the exact accepted strike axis',()=>{
  const p=position();p.payoff={...p.payoff,strikes:[56,56.5],strategy:'call'};p.spot.value=54.215;
  const s=silhouette(p);assert.equal(s.markerIndex,15);assert.match(s.text,/‾+▲‾+╲_+/);
  const ic=projectLive(liveEvidence).positions[0];ic.payoff={strikes:[31,32,42,43],leftTail:-.58,rightTail:-.58,maximumProfit:.42,unequal:false};
  const original=silhouette(ic);ic.entryReference={value:500};assert.deepEqual(silhouette(ic),original);near(original.lo,29.2);near(original.hi,44.8);
});
test('visual goldens show spot progression while fixed-width landscape and ANSI semantics stay stable',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/tt-live-vertical-viewport-golden.json',import.meta.url)));
  for(const row of fixture.progression){const p=position();p.spot.value=row.spot;
    assert.equal(silhouette(p).text,row.unicode);assert.equal(silhouette(p,{ascii:true}).text,row.ascii);
    assert.equal(strip(silhouette(p,{color:true}).text),row.unicode);
  }
  const e=base();e.spotQuotes=[{symbol:'XLF','instrument-type':'Equity',bid:'54.25',ask:'54.28',mid:'54.265','updated-at':e.now.toISOString()}];
  for(const columns of [80,100,157,189])for(const ascii of [false,true])for(const color of [false,true]) {
    const out=renderLive({...e,columns,ascii,color});assert.ok(out.split('\n').every(l=>cellWidth(l)<columns));
    if(columns>=157)assert.match(strip(out),ascii?/\^/:/▲/);
  }
});

// Compare each occupied cell against the unmarked outline, preserving the axis.
test('local rail determines cyan marker for condors and both vertical orientations',()=>{
  const ic=projectLive(liveEvidence).positions[0];
  ic.payoff={strikes:[31,32,42,43],leftTail:-.58,rightTail:-.58,maximumProfit:.42,unequal:false};
  const bull=position(),bear=position();bear.payoff={...bear.payoff,strikes:[56,56.5],strategy:'call'};
  for(const p of [ic,bull,bear])for(const ascii of [false,true]){
    p.spot={...p.spot,value:null};const landscape=silhouette(p,{ascii}),seen=new Set();
    const regionCodes=[...silhouette(p,{ascii,color:true}).text.matchAll(/\x1b\[([;\d]+)m(.)\x1b\[22;97m/g)].map(m=>m[1]);
    assert.equal(regionCodes.length,30);
    for(let i=0;i<30;i++){
      const rail=landscape.text[i+1];
      const expected=rail==='_'?(ascii?'v':'▼'):['╱','╲','/','\\'].includes(rail)?(ascii?'*':'◆'):(ascii?'^':'▲');
      seen.add(expected);p.spot.value=landscape.lo+(landscape.hi-landscape.lo)*i/29;
      const plain=silhouette(p,{ascii}),colored=silhouette(p,{ascii,color:true});
      assert.equal(plain.spotRegionCode,regionCodes[i]);assert.equal(plain.markerIndex,i);assert.equal(plain.text[i+1],expected);
      assert.equal(plain.text.slice(0,i+1)+rail+plain.text.slice(i+2),landscape.text);
      assert.deepEqual(plain.breaks,landscape.breaks);near(plain.lo,landscape.lo);near(plain.hi,landscape.hi);
      assert.equal(strip(colored.text),plain.text);assert.ok(colored.text.includes(`\x1b[96m${expected}`));assert.equal(cellWidth(colored.text),31);
    }
    assert.deepEqual([...seen].sort(),(ascii?['v','*','^']:['▼','◆','▲']).sort());
  }
});
