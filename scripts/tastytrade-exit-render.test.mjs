import test from 'node:test';
import assert from 'node:assert/strict';
import { stripVTControlCharacters as strip } from 'node:util';
import { projectLive, renderLive } from './tastytrade-live.mjs';
import { renderPanel, exitTrack, observationAge, cellWidth } from './tastytrade-live-render.mjs';
import { liveEvidence as evidence, ewz } from './tastytrade-fixtures.mjs';

const valued = progress => ({ ...evidence, quotes: evidence.quotes.map(q => {
  if (q.symbol !== ewz.holdings[2].symbol) return q;
  const mid = .42 - progress * .21 + .42;
  return { ...q, mid: String(mid), bid: String(mid-.01), ask: String(mid+.01) };
}) });

test('profit track uses verified opening/target/leg-mid economics, not credit capture percentage', () => {
  for (const progress of [0,.4,.5,.9,1,-.5,1.001,1.2]) {
    const p = projectLive(valued(progress)).positions[0];
    assert.ok(Math.abs(p.progress-progress) < 1e-12);
    const out = renderLive(valued(progress));
    assert.ok(out.includes(`${progress < 0 ? '−' : '+'}${Math.round(Math.abs(progress)*100)}%${progress >= 1 ? '~' : ''}`));
    const track = exitTrack(p.progress).split(' ')[0];
    const marker = progress < 0 ? '◆' : progress > 1 ? '→' : progress >= 1 ? '◆' : '●';
    assert.equal(track.indexOf(marker),Math.round(Math.max(0,Math.min(1,progress))*10));
    assert.equal(cellWidth(track),11);
    assert.doesNotMatch(out,/executed|completed|filled/i);
  }
  // Capturing 25% of credit is halfway to a P50 exit.
  assert.equal(projectLive(valued(.5)).positions[0].market.closeDebit.toFixed(3),'0.315');
});

test('marker/percentage colors distinguish adverse, current, approaching and observed threshold', () => {
  for (const [progress,code] of [[-.5,91],[0,96],[.4,96],[.9,93],[1,92],[1.2,92]]) {
    const plain=exitTrack(progress), color=exitTrack(progress,{color:true});
    assert.equal(strip(color),plain); assert.ok(color.includes(`\x1b[${code}m`));
    const ascii=exitTrack(progress,{ascii:true,color:true}); assert.doesNotMatch(strip(ascii),/[^\x00-\x7f]/);
  }
  for(const ascii of [false,true]) {
    const missing=exitTrack(null,{ascii,color:true});
    assert.match(missing,/\x1b\[37m/); assert.equal(strip(missing),ascii?'--':'—');
  }
});

test('missing profit evidence is unavailable; existing acquisition remains fail closed', () => {
  const projection=projectLive(evidence); projection.positions[0].targetOrder=null;
  const row=renderPanel(projection).split('\n').find(l=>l.startsWith('EWZ'));
  assert.match(row,/51\s+—\s+—\s+--/); assert.doesNotMatch(row,/●|◆/);
  assert.throws(()=>projectLive({...evidence,complexOrders:[]}),/target\/stop order linkage/);
});

test('stale options suppress the progress marker even if spot is valid', () => {
  const quotes=evidence.quotes.map(q=>({...q,'updated-at':'2026-09-30T12:00:00Z'}));
  const spotQuotes=[{symbol:'EWZ','instrument-type':'Equity',bid:'39.59',ask:'39.61',mid:'39.60','updated-at':'2026-10-01T01:59:50Z'}];
  const out=renderLive({...evidence,quotes,spotQuotes});
  assert.match(out,/EWZ.*—\s+--.*39.60\s+14h/);
  assert.doesNotMatch(out,/●|◆/);
});

test('DTE exit is explicitly undeclared; verified opening DTE follows New York calendar dates', () => {
  const orders=evidence.orders.map(o=>o.status==='Filled'?{...o,legs:o.legs.map(l=>({...l,fills:l.fills.map(f=>({...f,'filled-at':'2026-10-01T02:00:00Z'}))}))}:o);
  const p=projectLive({...evidence,orders,now:new Date('2026-10-01T03:00:00Z')});
  assert.deepEqual(p.positions.map(p=>p.timeExit),[
    {objectiveDte:null,openingDte:51,progress:null}, {objectiveDte:null,openingDte:16,progress:null}]);
  const out=renderPanel(p,{color:true});
  assert.equal((out.match(/\x1b\[37m--/g)||[]).length,2);
  assert.doesNotMatch(out,/D21|D0|EXIT D51/);
  // Expiration and broker stop orders never supply a time-exit objective.
  assert.ok(p.positions.every(p=>p.stopOrder && p.expiry && p.timeExit.objectiveDte===null));
});

test('mixed broker targets use generic EXIT Pxx heading and exact per-row objective labels', () => {
  const target={...ewz.closing.orders[0],price:'0.168'}; // 60% credit capture, not P50.
  const data={...evidence,orders:evidence.orders.map(o=>o.id===target.id?target:o),
    complexOrders:evidence.complexOrders.map(o=>o.id===ewz.closing.id?{...o,orders:[target,ewz.closing.orders[1]]}:o)};
  const out=renderLive(data);
  assert.match(out,/EXIT Pxx\s+EXIT DTE/); assert.match(out,/EWZ.*P60\s/); assert.match(out,/XLE.*P50\s/);
  const rows=out.split('\n').filter(l=>/^(EWZ|XLE)\s/.test(l));
  assert.equal(rows[0].indexOf('─'),rows[1].indexOf('◆'));
});

test('QUOTE elapsed ages use plain seconds, minutes and hours', () => {
  for(const [ms,label] of [[0,'0s'],[10000,'10s'],[59999,'59s'],[60000,'1m'],[600000,'10m'],[3599999,'59m'],[3600000,'1h'],[36000000,'10h']])
    assert.equal(observationAge({ageMs:ms}),label);
  assert.equal(observationAge({ageMs:36000000,retained:true}),'10h');
  assert.equal(observationAge({ageMs:36000000,stale:true}),'10h');
  assert.equal(observationAge({}),'—');
});

test('twenty mixed progress rows keep track and numeric percentage alignment at 157/189 columns', () => {
  const p=projectLive(evidence), values=[0,.4,.5,.9,1,-.5,1.001,1.2];
  p.positions=Array.from({length:20},(_,i)=>({...p.positions[0],symbol:`T${i}`,progress:values[i%values.length]}));
  for(const columns of [157,189]) for(const ascii of [false,true]) {
    const plain=renderPanel(p,{columns,ascii}), colored=renderPanel(p,{columns,ascii,color:true});
    assert.equal(strip(colored),plain); assert.doesNotMatch(plain,/[\u2580-\u259f]/);
    const rows=plain.trim().split('\n');
    assert.equal(rows.length,22); assert.match(rows[1],/PAYOFF.*EXIT P50.*EXIT DTE/);
    assert.ok(rows.every(l=>cellWidth(l)<columns));
    const matches=rows.slice(2).map(l=>[...l.matchAll(/([─●◆←→o*<>\-]{11})\s+([+−\-]\d+%~?)/g)].at(-1));
    assert.ok(matches.every(m=>m));
    assert.equal(new Set(matches.map(m=>m.index)).size,1);
    assert.equal(new Set(matches.map(m=>m.index+m[0].length)).size,1);
    if(ascii) assert.doesNotMatch(plain,/[^\x00-\x7f]/);
  }
});

test('QUOTE alone shows conservative row age; no per-price age or flag clutter', () => {
  const session={state:'Closed','previous-session':{'open-at':'2026-10-09T13:30:00Z','close-at':'2026-10-09T20:00:00Z'},'next-session':{'open-at':'2026-10-12T13:30:00Z'}};
  const quotes=evidence.quotes.map(q=>({...q,'updated-at':'2026-10-09T20:00:00Z'}));
  const spotQuotes=[{symbol:'EWZ','instrument-type':'Equity',bid:'39.59',ask:'39.61',mid:'39.60','updated-at':'2026-10-09T19:50:00Z'}];
  const data={...evidence,session,quotes,spotQuotes,now:new Date('2026-10-11T14:00:00Z')};
  for(const ascii of [false,true]) {
    const out=renderLive({...data,ascii});
    const rows=out.split('\n').filter(l=>/^(EWZ|XLE)\s/.test(l));
    assert.match(out,/EXIT P50/); assert.doesNotMatch(out,/P50:B|O:|S:/);
    assert.ok(rows.every(l=>/^\d+[smh]$/.test(l.trim().split(/\s+/).at(-1))));
    assert.doesNotMatch(rows[0],/0.33r|42hr|!|O:|S:/); assert.match(rows[0],/39.60\s+42h$/);
  }
  for(const [progress,track] of [[0,'●──────────'],[.4,'────●──────'],[.5,'─────●─────'],[.9,'─────────●─'],[1,'──────────◆']])
    assert.ok(exitTrack(progress).startsWith(track));
});

test('unavailable DTE is centered -- and adverse progress uses the requested left diamond',()=>{
  const out=renderLive(evidence), lines=out.trim().split('\n');
  const header=lines[1];
  for(const row of lines.slice(2)) assert.equal(row.indexOf('--'),header.indexOf('EXIT DTE')+3);
  assert.ok(exitTrack(-.86).startsWith('◆──────────'));
  assert.match(exitTrack(-.86),/−86%/);
  assert.doesNotMatch(out,/no rule|←|O:|S:/);
});
