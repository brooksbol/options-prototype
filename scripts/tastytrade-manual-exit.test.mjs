import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripVTControlCharacters as strip } from 'node:util';
import { projectLive, renderLive } from './tastytrade-live.mjs';
import { spanTrack, cellWidth } from './tastytrade-live-render.mjs';
import { liveEvidence } from './tastytrade-fixtures.mjs';
const observation=JSON.parse(readFileSync(new URL('./tastytrade-xlf-fixture.json',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const base=()=>({...structuredClone(observation),now:new Date(observation.now)});
const pos=e=>projectLive(e).positions[0];
const targets=e=>[...e.orders,...e.complexOrders.flatMap(g=>g.orders)].filter(o=>o['order-type']==='Limit' && o.status!=='Filled');
function objective(c=.8,l=.4,g='2026-11-06') {
  const e=base();
  // Synthetic economics on observed identities/metadata; width is expanded for C=.8.
  const replace=s=>s.replace('00052000','00050000');
  e.holdings.forEach(h=>h.symbol=replace(h.symbol));e.quotes.forEach(q=>q.symbol=replace(q.symbol));
  e.instruments.forEach(i=>{if(i.symbol.includes('00052000'))i['strike-price']='50';i.symbol=replace(i.symbol);});
  for(const o of [...e.orders,...e.complexOrders[0].orders])for(const leg of o.legs){leg.symbol=replace(leg.symbol);if(leg.fills.length)leg.fills[0]['fill-price']=leg.action==='Buy to Open'?'0.2':String(c+.2);}
  targets(e).forEach(t=>{t.price=String(l);t['gtc-date']=g;});return e;
}
function standalone(e) {e.orders=e.orders.filter(o=>o['order-type']!=='Stop Limit');e.complexOrders=[];e.orders.filter(o=>o.status!=='Filled').forEach(o=>delete o['complex-order-id']);return e;}
function observe(e,date) {e.now=new Date(date);e.quotes.forEach(q=>q['updated-at']=e.now.toISOString());return e;}
function expire(e,keepStop=false) {
  for(const o of [...e.orders,...e.complexOrders[0].orders])if(o.status!=='Filled')o.status=o['order-type']==='Limit'?'Expired':keepStop?'Live':'Cancelled';
  return observe(e,'2026-11-07T17:00:00Z');
}
for(const [name,c,l,g,dte,label] of [
  ['P50',.8,.4,'2026-11-06',21,'P50'],
  ['P75',.8,.2,'2026-11-13',14,'P75'],
  ['P37',1,.63,'2026-11-10',17,'P37'],
  ['noninteger LIMIT',.8,.33,'2026-11-04',23,'P59'],
  ['P100',.8,0,'2026-11-06',21,'P100'],
])test(name+' + GTD derives exact profit capture and manual xDTE for any verified target',()=>{
  const e=objective(c,l,g),p=pos(e);near(p.credit,c);near(p.profitCapture,(c-l)/c);
  assert.equal(p.manualExit.checkpointDate,g);assert.equal(p.manualExit.checkpointDte,dte);
  assert.equal(p.manualExit.state,'UPCOMING');assert.equal(p.manualExit.active,true);assert.equal(p.timeExit.objectiveDte,dte);
  assert.ok(renderLive(e).includes(`$${Math.round((c-l)*100)}`));assert.match(spanTrack(p),/M/);assert.doesNotMatch(spanTrack(p),/M\d/);
});
test('observed XLF actual $0.09 fills and $0.04 GTD limit imply LIMIT and M21',()=>{
  const p=pos(base());near(p.credit,.09);near(p.profitCapture,5/9);assert.equal(p.manualExit.checkpointDte,21);
  assert.equal(p.manualExit.checkpointDate,'2026-11-06');assert.equal(p.manualExit.orderStatus,'Live');
  assert.match(renderLive(base()),/M.*\$5/);
});
test('standalone GTD target needs no stop/OCO; its exact legs and quantity still must match',()=>{
  const e=standalone(objective()),p=pos(e);assert.equal(p.stopOrder,null);assert.equal(p.manualExit.checkpointDte,21);
  e.orders[0].legs[0].quantity=2;assert.equal(pos(e).manualExit,null);assert.equal(pos(e).targetOrder,null);
});
test('profit target without GTD preserves the established SPAN exactly',()=>{
  const e=objective();targets(e).forEach(t=>{t['time-in-force']='GTC';delete t['gtc-date'];});
  const p=pos(e);assert.equal(p.manualExit,null);assert.equal(p.timeExit.objectiveDte,null);
  assert.equal(spanTrack(p),'◆────────── 44/44d');
  assert.match(renderLive(e),/\$40/);
});
for(const [name,mutate] of [
  ['credit-effect GTD limit',e=>targets(e).forEach(t=>t['price-effect']='Credit')],
  ['nonprofit GTD limit',e=>targets(e).forEach(t=>t.price='0.9')],
  ['opening GTD order',e=>{e.orders=e.orders.filter(o=>o.status==='Filled');e.orders[0]['time-in-force']='GTD';e.orders[0]['gtc-date']='2026-11-06';e.complexOrders=[];}],
  ['GTD stop alone',e=>{e.orders=e.orders.filter(o=>o['order-type']!=='Limit'||o.status==='Filled');e.complexOrders[0].orders=e.complexOrders[0].orders.filter(o=>o['order-type']==='Stop Limit');e.orders[0]['time-in-force']='GTD';}],
])test(name+' cannot establish the profit-target/manual convention',()=>{const e=objective();mutate(e);assert.equal(pos(e).manualExit,null);});
test('New York date-only GTD arithmetic survives DST and near-midnight observation boundaries',()=>{
  const e=objective();let p=pos(observe(e,'2026-11-07T04:59:00Z'));assert.equal(p.manualExit.state,'DUE');
  p=pos(observe(e,'2026-11-07T05:01:00Z'));assert.equal(p.manualExit.state,'PAST DUE');
  assert.equal(p.manualExit.checkpointDte,21);near(p.manualExit.progress,23/44);
});
for(const [state,at,flag] of [['UPCOMING','2026-11-05T17:00:00Z',''],['DUE','2026-11-06T17:00:00Z','!'],['PAST DUE','2026-11-07T17:00:00Z','>']]) {
  test(state+' manual checkpoint is proportional, exact and readable without color',()=>{
    const e=observe(objective(),at),p=pos(e);assert.equal(p.manualExit.state,state);
    const s=spanTrack(p);assert.ok(s.includes("M"));assert.doesNotMatch(s,/M\d/);assert.ok(s.includes('◆'));
    const slots=s.split(' ')[0];assert.equal(slots.indexOf('M'),Math.round(p.manualExit.progress*10)+(slots.indexOf('●')<=5?1:0));
    assert.equal(strip(spanTrack(p,{color:true})),s);
    assert.ok(spanTrack(p,{color:true}).includes(`\x1b[${state==='PAST DUE'?'91':'92'}mM`));
  });
}
test('expired GTD target retains linked historical manual intent without an active target/profit progress',()=>{
  const e=expire(objective()),p=pos(e);assert.equal(p.targetOrder,null);assert.equal(p.target,null);assert.equal(p.progress,null);
  assert.equal(p.manualExit.orderStatus,'Expired');assert.equal(p.manualExit.active,false);assert.equal(p.manualExit.state,'PAST DUE');
  assert.match(spanTrack(p),/M/);assert.equal(p.credit,.8);assert.ok(Number.isFinite(p.pnl));
  const row=projectLive(e).rows[0];assert.equal(row[9],'—');assert.match(row[14],/Expired \(inactive\)/);
  assert.match(renderLive(e),/M.*\./);assert.doesNotMatch(renderLive(e),/P50/);
});
test('expired target can retain manual checkpoint alongside its surviving verified stop',()=>{
  const p=pos(expire(objective(),true));assert.ok(p.stopOrder);assert.equal(p.targetOrder,null);assert.equal(p.manualExit.active,false);
});
test('standalone expired GTD needs reliable chronology to tie it to current opening fills',()=>{
  const e=standalone(objective());e.orders[0].status='Expired';e.orders[0]['received-at']='2026-10-14T18:13:00Z';
  observe(e,'2026-11-07T17:00:00Z');assert.equal(pos(e).manualExit.active,false);
  e.orders[0]['received-at']='2026-10-13T18:13:00Z';assert.equal(pos(e).manualExit,null);
});
test('filled target with holding gone naturally disappears; no completed position manufactured',()=>{
  const e=objective();e.holdings=[];targets(e).forEach(t=>t.status='Filled');assert.deepEqual(projectLive(e).positions,[]);
});
test('cancelled GTD target does not manufacture active or historical management intent',()=>{
  const e=objective();for(const o of [...e.orders,...e.complexOrders[0].orders])if(o.status!=='Filled')o.status='Cancelled';
  const p=pos(e);assert.equal(p.targetOrder,null);assert.equal(p.manualExit,null);assert.doesNotMatch(renderLive(e),/M21|P50/);
});
test('replacement target supersedes cancelled original and supplies its own xDTE/capture',()=>{
  const e=standalone(objective());const old=e.orders[0];old.status='Cancelled';
  e.orders.push({...structuredClone(old),id:'replacement',status:'Live',price:'0.2','gtc-date':'2026-11-13','received-at':'2026-10-15T18:00:00Z'});
  observe(e,'2026-10-16T18:00:00Z');const p=pos(e);assert.equal(p.targetOrder.id,'replacement');assert.equal(p.manualExit.checkpointDte,14);
  assert.match(renderLive(e),/M.*\$60/);
});
test('active non-GTD replacement supersedes old expired checkpoint rather than resurrecting it',()=>{
  const e=expire(objective());e.orders.push({...structuredClone(e.orders[0]),id:'new','complex-order-id':undefined,status:'Live','time-in-force':'GTC','received-at':'2026-11-07T16:00:00Z'});
  assert.equal(pos(e).manualExit,null);assert.equal(pos(e).targetOrder.id,'new');
});
test('newer cancelled target withholds an older expired convention whose continued intent is uncertain',()=>{
  const e=expire(objective());e.orders.push({...structuredClone(e.orders[0]),id:'new',status:'Cancelled','received-at':'2026-11-07T16:00:00Z'});
  assert.equal(pos(e).manualExit,null);
});
for(const [name,mutate] of [
  ['two current targets',e=>e.orders.push({...structuredClone(e.orders[0]),id:'other'})],
  ['contradictory GTD date',e=>e.complexOrders[0].orders[0]['gtc-date']='2026-11-13'],
  ['contradictory time-in-force',e=>e.complexOrders[0].orders[0]['time-in-force']='GTC'],
  ['incorrect size',e=>e.orders[0].size=2],
])test(name+' cannot select arbitrary current/manual management',()=>{
  const e=objective();mutate(e);const p=pos(e);assert.equal(p.manualExit,null);assert.equal(p.targetOrder,null);assert.equal(p.credit,.8);
});
for(const date of [undefined,'','11/06/2026','2026-02-30','2026-13-01','2026-11-06T00:00:00Z','2026-11-28','2026-10-13']) {
  test('missing/malformed/outside-lifespan GTD '+String(date)+' withholds M but preserves verified target economics',()=>{
    const e=objective();targets(e).forEach(t=>t['gtc-date']=date);const p=pos(e);
    assert.equal(p.manualExit,null);assert.ok(p.targetOrder);assert.equal(p.credit,.8);assert.match(p.issues.join(' '),/GTD checkpoint date/);
  });
}
test('ambiguous historical GTD linkage, contradictory expired evidence and future expired checkpoint stay unavailable',()=>{
  const e=expire(objective());const extra=structuredClone(e.orders[0]);extra.id='duplicate-expired';e.orders.push(extra);e.complexOrders[0].orders.push(extra);
  assert.equal(pos(e).manualExit,null);assert.match(pos(e).issues.join(' '),/ambiguous/);
  const bad=expire(objective());bad.complexOrders[0].orders[0]['gtc-date']='2026-11-13';assert.equal(pos(bad).manualExit,null);
  const future=expire(objective());observe(future,'2026-11-05T17:00:00Z');assert.equal(pos(future).manualExit,null);
});
test('co-cell current/M/expiration markers are deterministic, compact and never erase M',()=>{
  const e=objective();observe(e,'2026-11-06T17:00:00Z');let p=pos(e);
  assert.match(spanTrack(p),/●M/);assert.match(spanTrack(p,{ascii:true}),/oM/);
  targets(e).forEach(t=>t['gtc-date']='2026-11-27');observe(e,'2026-11-27T17:00:00Z');p=pos(e);
  assert.match(spanTrack(p),/●M◆\s+0\/44d$/);assert.match(spanTrack(p,{ascii:true}),/oM\*\s+0\/44d$/);
});
test('all supported constructions share the GTD convention; non-GTD IC SPAN unchanged',()=>{
  const ic=structuredClone(liveEvidence);const old=projectLive(ic).positions[0];assert.equal(old.manualExit,null);assert.equal(spanTrack(old),'◆────────── 51/51d');
  const changes=o=>{if(o['order-type']==='Limit'){o['time-in-force']='GTD';o['gtc-date']='2026-10-30';}return o;};
  ic.orders.forEach(changes);ic.complexOrders.forEach(g=>g.orders.forEach(changes));
  const p=projectLive(ic).positions[0];assert.equal(p.strategy,'Iron Condor');assert.equal(p.manualExit.checkpointDte,21);assert.ok(p.stopOrder);
  const e=objective();const replace=s=>s.replace('P000','C000');
  e.holdings.forEach(h=>{h.symbol=replace(h.symbol);h['quantity-direction']=h['quantity-direction']==='Long'?'Short':'Long';});
  for(const o of [...e.orders,...e.complexOrders[0].orders])for(const l of o.legs){l.symbol=replace(l.symbol);l.action=l.action.replace('Buy','TEMP').replace('Sell','Buy').replace('TEMP','Sell');if(l.fills.length)l.fills[0]['fill-price']=l.action==='Sell to Open'?'1':'0.2';}
  e.quotes.forEach(q=>q.symbol=replace(q.symbol));e.instruments.forEach(i=>{i.symbol=replace(i.symbol);i['option-type']='C';});
  assert.equal(pos(e).strategy,'Bear Call Credit Spread');assert.equal(pos(e).manualExit.checkpointDte,21);
});
test('Unicode/ASCII/color/narrow/width behavior remains aligned and TSV keeps original columns',()=>{
  const e=objective(),ic=structuredClone(liveEvidence);ic.holdings.forEach(h=>h['account-number']=e.account);ic.quotes.forEach(q=>q['updated-at']=e.now.toISOString());
  e.holdings.push(...ic.holdings);e.orders.push(...ic.orders);e.complexOrders.push(...ic.complexOrders);e.quotes.push(...ic.quotes);
  for(const now of ['2026-10-14T18:17:00Z','2026-11-06T17:00:00Z','2026-11-07T17:00:00Z'])for(const columns of [20,80,100,157,189])for(const ascii of [false,true])for(const color of [false,true]) {
    observe(e,now);const out=renderLive({...e,columns,ascii,color});assert.ok(out.split('\n').every(l=>cellWidth(l)<columns));
    if(ascii)assert.doesNotMatch(strip(out),/[^\x00-\x7f]/);
    if(columns>=100)assert.match(out,/M/);assert.doesNotMatch(out,/M21/);
  }
  const rows=renderLive({...e,format:'tsv'}).split('\n').map(l=>l.split('\t'));assert.equal(rows[0].length,14);assert.equal(rows[1][9],'50% @ 0.40 or exp 11/27');
  assert.doesNotMatch(renderLive(e),/automatic|executed|closed at|will close/i);
});

test('wrong-account order evidence cannot establish target or manual convention',()=>{
  const e=base();e.orders[0]['account-number']='OTHER1234';assert.throws(()=>projectLive(e),/different account/);
});
test('future GTD receipt withholds checkpoint while preserving independent holding economics',()=>{
  const e=base();targets(e).forEach(t=>t['received-at']='2026-10-15T18:00:00Z');
  const p=pos(e);assert.equal(p.manualExit,null);near(p.credit,.09);assert.match(p.issues.join(' '),/receipt time/);
});
