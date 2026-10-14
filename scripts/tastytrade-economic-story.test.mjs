import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripVTControlCharacters as strip} from 'node:util';
import {economicObjectives,recentEconomicMovement} from './tastytrade-economic-story.mjs';
import {exitTrack,renderPanel,cellWidth,spanTrack} from './tastytrade-live-render.mjs';
import {projectLive,renderLive} from './tastytrade-live.mjs';
import {silhouette} from './tastytrade-payoff-render.mjs';
import {parseCommand} from './tastytrade.mjs';
const load = name => {const e=JSON.parse(readFileSync(new URL(`./fixtures/${name}`,import.meta.url)));return {...e,now:new Date(e.now)};};
const observed=()=>load('tt-live-economic-observed.json');
const story = (pnl,extra={}) => ({pnl,maximumProfit:10,economicObjectives:{targetGrossProfit:10,adverseExitLoss:20},...extra});
const markerCell=slot=>[3,6,9,12,15,18,21,24,26][slot];
// Marker has a dedicated cell in each economic slot; landmarks never shift.
for(const [name,pnl,slot] of [['entry',0,4],['small loss',-1,3],['small profit',1,5],['half profit',5,6],
  ['target reached',10,8],['target exceeded',15,8],['half loss',-10,2],['loss reached',-20,0],['loss exceeded',-30,0]]) {
  test(`center anchored asymmetric scale: ${name}`,()=>{
    const p=story(pnl),s=exitTrack(p);
    assert.equal(s.indexOf('◆'),(pnl < -20 ? 0 : markerCell(slot)));assert.equal(s[2],'│');assert.equal(s[14],'│');assert.ok(s.includes('$10'));
    assert.equal(cellWidth(s),32);assert.equal(p.pnl,pnl);assert.doesNotMatch(s,/%/);
  });
}
for(const [name,profit,loss,pnl,slot] of [['missing stop',10,null,-5,3],['missing target',null,20,5,5],
 ['zero loss',10,0,-5,3],['invalid target',NaN,20,5,5],['negative target',-1,20,5,5],['infinite loss',10,Infinity,-5,3]]) {
 test(`degraded half: ${name}`,()=>{const s=exitTrack(story(pnl,{maximumProfit:999,economicObjectives:{targetGrossProfit:profit,adverseExitLoss:loss}}));
   assert.equal(s.indexOf('◆'),markerCell(slot));assert.match(s,/\./);assert.equal(s[14],'│');assert.equal(s.length,Number.isFinite(profit)&&profit>0?32:30);
 });
}
test('missing valuation preserves landmarks, withholds diamond and displays unavailable suffix',()=>{
 for(const pnl of [null,undefined,NaN,Infinity]){const s=exitTrack(story(pnl));assert.doesNotMatch(s,/◆/);assert.equal(s.endsWith(' ?'),true);assert.equal(s[14],'│');}
});
test('actual thresholds use reconciled trigger, never execution limit, ratio fields or theoretical loss',()=>{
 const e=observed(),p=projectLive(e).positions;
 for(const [symbol,profit,loss] of [['XLF',5,1],['UNG',7,null],['EWZ',21,11],['XLE',9,6]]){
   const x=p.find(p=>p.symbol===symbol);assert.ok(Math.abs(x.economicObjectives.targetGrossProfit-profit)<1e-8);
   if(loss===null)assert.equal(x.economicObjectives.adverseExitLoss,null);else assert.ok(Math.abs(x.economicObjectives.adverseExitLoss-loss)<1e-8);
 }
 const base={credit:.1,target:.05,quantity:2,multiplier:150};
 assert.equal(economicObjectives({...base,stopOrder:{price:'.9','stop-trigger':'0.3'}}).adverseExitLoss,null); // malformed limit
 assert.ok(Math.abs(economicObjectives({...base,stopOrder:{price:'0.9','stop-trigger':'0.3'}}).adverseExitLoss-60)<1e-8);
 for(const stopOrder of [null,{price:'0.9'},{price:'0.9','stop-trigger':'0.05'},{price:'0.2','stop-trigger':'0.3'}])assert.equal(economicObjectives({...base,stopOrder}).adverseExitLoss,null);
});
const movementEvidence = (change=5) => ({
 legs:[{symbol:'S',direction:'Short',quantity:2,multiplier:100},{symbol:'L',direction:'Long',quantity:2,multiplier:100}],
 quotes:[{symbol:'S',bid:'0.49',ask:'0.51',mid:'0.5',mark:'0.5','prev-close':String(.5+change/200)},
  {symbol:'L',bid:'0.19',ask:'0.21',mid:'0.2',mark:'0.2','prev-close':'0.2'}].map(q=>({...q,'prev-close-price-type':'Regular','prev-close-date':'2026-10-13','summary-date':'2026-10-14','updated-at':'2026-10-14T19:00:00Z'})),
 orders:[],openedAt:Date.parse('2026-10-12T16:00:00Z'),market:{stale:false,closeDebit:.3,valuationSource:'midpoint'},now:new Date('2026-10-14T19:00:10Z'),
 session:{state:'Open','open-at':'2026-10-14T13:30:00Z','close-at':'2026-10-14T20:00:00Z','previous-session':{'close-at':'2026-10-13T20:00:00Z'}}});
for(const [name,pnl,change,arrow,code] of [['losing improving',-10,5,'→',92],['losing deteriorating',-10,-5,'←',91],
 ['profitable improving',10,5,'→',92],['profitable deteriorating',10,-5,'←',91]]){
 test(name,()=>{const movement=recentEconomicMovement(movementEvidence(change));assert.ok(Math.abs(movement.change-change)<1e-8);
 const s=exitTrack(story(pnl,{recentMovement:movement}),{color:true});assert.match(s,/\x1b\[96m◆/);assert.ok(s.includes(`\x1b[${code}m${arrow}`));assert.equal(strip(s).indexOf(arrow),strip(s).indexOf('◆')+1);});
}
test('spread uncertainty deadband scales by quantity and multiplier; flat and noise omit arrows',()=>{
 for(const change of [0,1,-1,4,-4]){const m=recentEconomicMovement(movementEvidence(change));assert.equal(m.direction,null);assert.ok(Math.abs(m.deadband-4)<1e-8);}
 assert.equal(recentEconomicMovement(movementEvidence(4.01)).direction,'improving');
});
for(const [name,mutate] of [
 ['missing prior',e=>delete e.quotes[0]['prev-close']],['bad reference date',e=>e.quotes[0]['prev-close-date']='1970-01-01'],
 ['mixed dates',e=>e.quotes[0]['prev-close-date']='2026-10-12'],['unverified price type',e=>e.quotes[0]['prev-close-price-type']='Indicative'],
 ['new position',e=>e.openedAt=Date.parse('2026-10-14T14:00:00Z')],['missing session',e=>e.session=null],
 ['stale',e=>e.market.stale=true],['quote stale',e=>e.quotes[0]['updated-at']='2026-10-10T19:00:00Z'],
 ['future quote',e=>e.quotes[0]['updated-at']='2026-10-15T19:00:00Z'],['composition changed',e=>e.orders=[{status:'Filled',legs:[{symbol:'S',action:'Buy to Close',fills:[{'filled-at':'2026-10-14T14:00:00Z'}]}]}]],
 ])test(`no manufactured movement: ${name}`,()=>{const e=movementEvidence();mutate(e);const m=recentEconomicMovement(e);assert.equal(m.mode,'unavailable');assert.equal(m.direction,null);});
test('retained Friday/Sunday comparison is explicitly r; no implied live momentum',()=>{
 const e=movementEvidence();e.now=new Date('2026-10-18T14:00:00Z');
 e.session={state:'Closed','previous-session':{'open-at':'2026-10-16T13:30:00Z','close-at':'2026-10-16T20:00:00Z'},'next-session':{'open-at':'2026-10-19T13:30:00Z'}};
 e.quotes.forEach(q=>Object.assign(q,{'summary-date':'2026-10-16','prev-close-date':'2026-10-15','updated-at':'2026-10-16T20:00:00Z'}));
 const m=recentEconomicMovement(e);assert.equal(m.mode,'retained');assert.equal(m.direction,'improving');assert.ok(exitTrack(story(-1,{recentMovement:m})).endsWith(' r'));
 e.quotes[0]['updated-at']='2026-10-17T10:00:00Z';assert.equal(recentEconomicMovement(e).direction,null);
});
test('broker mark comparison selects all marks consistently',()=>{
 const e=movementEvidence(5);e.market.valuationSource='broker mark';e.quotes[0].mid='0.6';
 assert.equal(recentEconomicMovement(e).direction,'improving');delete e.quotes[1].mark;assert.equal(recentEconomicMovement(e).direction,null);
});
test('Unicode/ASCII, ANSI/monochrome, retained and removed P/L preserve aligned references and widths',()=>{
 const p=projectLive(observed());
 for(const showPnl of [true,false])for(const columns of [80,100,157,189])for(const ascii of [true,false]){
 const opts={showPnl,columns,ascii},s=renderPanel(p,opts),c=renderPanel(p,{...opts,color:true});assert.equal(strip(c),s);
 assert.ok(s.trim().split('\n').every(l=>cellWidth(l)<columns));if(ascii)assert.doesNotMatch(s,/[^\x00-\x7f]/);
 if(columns>=157){assert.match(s,/TRADE SHAPE/);assert.equal(s.includes('P/L'),showPnl);
 const lines=s.trim().split('\n'),at=lines[1].indexOf('EXIT PROGRESS');
 const centers=lines.slice(2,6).map(row=>row.indexOf(ascii?'|':'│',at+1));assert.equal(new Set(centers).size,1);
 }
 }
 const colored=exitTrack(story(-5,{recentMovement:{direction:'improving',mode:'intraday'}}),{color:true});
 for(const code of [91,97,92,96])assert.ok(colored.includes(`\x1b[${code}m`));
 assert.deepEqual(parseCommand(['live','--with-pnl']),{kind:'live',showPnl:true});
});
test('financial details, preserved shape geometry/SPAN (allowing local-rail marker revision) and canonical TSV remain available',()=>{
 const e=observed(),p=projectLive(e);assert.match(renderPanel(p,{showPnl:true}),/−\$2/);assert.doesNotMatch(renderPanel(p),/P\/L|%/);
 assert.equal(renderLive({...e,format:'tsv',showPnl:true}),readFileSync(new URL('./fixtures/tt-live-economic-baseline.tsv',import.meta.url),'utf8'));
 const gold=JSON.parse(readFileSync(new URL('./fixtures/tt-live-economic-preserved.json',import.meta.url)));
 assert.deepEqual(p.positions.map(p=>({symbol:p.symbol,payoff:silhouette(p).text.replace(/[▲◆]/g,'▼'),span:spanTrack(p).replace(/\s+(\d+)\/\d+d/,(_,n)=>`${n.padStart(3)}d`)})),gold.map(p=>({...p,span:p.span.replace(/ M\d+$/,'')})));
 assert.equal(p.positions.length,4);assert.equal(p.positions[0].strategy,'Bull Put Credit Spread');
 assert.ok(p.positions.slice(1).every(p=>p.strategy==='Iron Condor'));
});

test('near objectives stay interior; center and endpoints never erase landmark references',()=>{
 for(const pnl of [9.99,-19.99]){const s=exitTrack(story(pnl));assert.ok(s.indexOf('◆')>3 && s.indexOf('◆')<28);}
 for(const pnl of [0,10,-20])for(const direction of ['improving','deteriorating']){
 const s=exitTrack(story(pnl,{recentMovement:{direction,mode:'intraday'}}));assert.equal(s[2],'│');assert.equal(s[14],'│');assert.ok(s.includes('$10'));assert.equal(s.length,32);
 }
});
test('invalid position-size denominators cannot manufacture objectives or movement',()=>{
 for(const quantity of [0,-1,null,NaN]){
 const o=economicObjectives({credit:1,target:.5,stopOrder:{price:'3','stop-trigger':'2'},quantity,multiplier:100});assert.equal(o.targetGrossProfit,null);assert.equal(o.adverseExitLoss,null);
 const e=movementEvidence();e.legs[0].quantity=quantity;assert.equal(recentEconomicMovement(e).direction,null);
 }
});
test('single surviving stop requires broad/complex trigger agreement',()=>{
 const e=observed();const xlf=e.holdings.filter(h=>h['underlying-symbol']==='XLF');e.holdings=xlf;
 const stop=e.orders.find(o=>o['order-type']==='Stop Limit' && o.legs.every(l=>xlf.some(h=>h.symbol===l.symbol)));
 const opening=e.orders.find(o=>o.status==='Filled' && o.legs?.length===2 && o.legs.every(l=>xlf.some(h=>h.symbol===l.symbol)));
 e.orders=[opening,stop];e.complexOrders=e.complexOrders.filter(g=>g.orders.some(o=>o.id===stop.id)).map(g=>({...g,orders:g.orders.filter(o=>o.id===stop.id)}));
 assert.ok(projectLive(e).positions[0].economicObjectives.adverseExitLoss>0);
 e.complexOrders[0].orders[0]['stop-trigger']='0.11';
 const p=projectLive(e).positions[0];assert.equal(p.economicObjectives.adverseExitLoss,null);assert.match(p.issues.join(' '),/management ambiguous/);
});

test('UNG has green proportional hook inside the track and only $7 outside',()=>{
 const p=projectLive(observed()).positions.find(p=>p.symbol==='UNG'),plain=exitTrack(p),colored=exitTrack(p,{color:true});
 assert.ok(plain.endsWith('$7'));assert.doesNotMatch(plain.slice(0,29),/[\d$🛑SPX]/u);
 assert.match(colored,/\x1b\[92m↩︎\x1b\[97m/);
 assert.equal(strip(colored),plain);assert.equal(plain[14],'│');assert.equal(strip(colored).replace('↩︎','r')[28],'│');
});
test('right endpoint is the profit-taking objective, not maximum expiration profit',()=>{
 const p=projectLive(observed()).positions.find(p=>p.symbol==='XLF');
 for(const pnl of [5,6,9])assert.equal(exitTrack({...p,pnl}).indexOf('◆'),30);
 assert.equal(exitTrack({...p,pnl:2.5}).indexOf('◆'),25);
 assert.ok(exitTrack(p).endsWith('$5'));assert.doesNotMatch(exitTrack(p),/\$9/);
 assert.equal(exitTrack({...p,maximumProfit:null}),exitTrack(p));
});
test('loss and zero stop results retain sign/color without interrupting the track',()=>{
 for(const grossPnl of [-20,0]){
 const p=story(grossPnl,{economicObjectives:{targetGrossProfit:5,adverseExitLoss:20,stopThreshold:{grossPnl}},recentMovement:{direction:'deteriorating'}});
 const s=exitTrack(p).replaceAll('\uFE0E',''),offset=grossPnl<0?5:0;assert.match(s,/◆←/);assert.equal(s[2+offset],'│');assert.equal(s[14+offset],'│');assert.equal(s[28+offset],'│');
 assert.ok(s.endsWith('$5'));
 }
});
test('trigger, not differing execution limit, supplies proportional hook',()=>{
 const o=economicObjectives({credit:.09,target:.02,stopOrder:{id:'S',price:'0.08','stop-trigger':'0.06'},quantity:1,multiplier:100});
 assert.ok(Math.abs(o.stopThreshold.grossPnl-3)<1e-8);assert.equal(o.stopThreshold.limitDebit,.08);
 assert.ok(exitTrack(story(1,{economicObjectives:o})).endsWith('$7'));
 const noTrigger=economicObjectives({credit:.09,target:.02,stopOrder:{price:'0.06'},quantity:1,multiplier:100});assert.equal(noTrigger.stopThreshold,null);
 assert.ok(exitTrack(story(1,{economicObjectives:noTrigger})).endsWith('$7'));
});
test('management summary preserves exact financial details and omits unknown objectives',()=>{
 const p=projectLive(observed()),panel=renderPanel(p);assert.doesNotMatch(panel,/LIMIT|P\d|[SX]\$|🛑|~/u);
 const rows=panel.split('\n').filter(l=>/^(XLF|UNG|EWZ|XLE)\s/.test(l));
 for(const [i,label] of [[0,'$5'],[1,'$7'],[2,'$21'],[3,'$9']])assert.ok(rows[i].includes('│'+label));
 assert.ok(Math.abs(p.positions[0].profitCapture-5/9)<1e-8);
 const missing=exitTrack(story(1,{economicObjectives:{targetGrossProfit:null,stopThreshold:{grossPnl:-3}}}));assert.ok(missing.endsWith('—'));assert.equal(missing[32],'.');
});
test('nearest-dollar summary rounding preserves unrounded normalization and quantity scaling',()=>{
 const p=story(1,{maximumProfit:10.5,economicObjectives:{targetGrossProfit:5.5,adverseExitLoss:20,stopThreshold:{grossPnl:-1.5}}});
 assert.ok(exitTrack(p).endsWith('$6'));assert.equal(p.economicObjectives.targetGrossProfit,5.5);assert.equal(p.economicObjectives.stopThreshold.grossPnl,-1.5);
 const q=projectLive(observed()).positions.find(p=>p.symbol==='XLF');
 assert.ok(exitTrack({...q,economicObjectives:{...q.economicObjectives,targetGrossProfit:q.economicObjectives.targetGrossProfit*2,stopThreshold:{grossPnl:-2}}}).endsWith('$10'));
});
test('equal stop and target preserve hook and endpoint; ASCII signs stay plain',()=>{
 const p=story(5,{economicObjectives:{targetGrossProfit:5,adverseExitLoss:20,stopThreshold:{grossPnl:5}}});assert.ok(exitTrack(p).endsWith('$5'));
 const xlf=projectLive(observed()).positions[0];const s=exitTrack(xlf,{ascii:true});assert.ok(s.endsWith('$5'));assert.ok(s.startsWith('-$1 '));assert.doesNotMatch(s,/[^\x00-\x7f]/);
});

test('hook uses one-cell text presentation; stop amount colors follow economics',()=>{
 assert.equal(cellWidth('↩\uFE0E'),1);assert.equal(cellWidth('🛑'),2);
 const positions=projectLive(observed()).positions;
 assert.match(exitTrack(positions[0],{color:true}),/\x1b\[91m−\$1/);
 assert.match(exitTrack(positions[1],{color:true}),/\x1b\[92m↩\uFE0E/);
});

test('loss beyond a verified stop places cyan diamond outside the red boundary',()=>{
 const p=projectLive(observed()).positions.find(p=>p.symbol==='XLE');
 assert.ok(p.pnl < -p.economicObjectives.adverseExitLoss);
 const reference=exitTrack({...p,pnl:-6}),outside=exitTrack({...p,pnl:-6.01});
 assert.ok(reference.indexOf('◆')>reference.indexOf('│'));assert.ok(outside.indexOf('◆')<outside.indexOf('│'));
 assert.equal(outside.indexOf('│'),reference.indexOf('│'));assert.equal(outside[18],'│');assert.equal(cellWidth(outside),cellWidth(reference));
 for(const direction of [null,'improving','deteriorating'])for(const ascii of [false,true]){
  const q={...p,recentMovement:{direction,mode:'retained'}},plain=exitTrack(q,{ascii}),colored=exitTrack(q,{ascii,color:true});
  assert.ok(plain.startsWith((ascii?'-$6 *':'−$6 ◆')));assert.equal(strip(colored),plain);
  assert.ok(colored.includes(`\x1b[96m${ascii?'*':'◆'}\x1b[97m`));assert.ok(colored.includes(`\x1b[91m${ascii?'|':'│'}`));
  if(direction)assert.ok(plain.endsWith(' r'));else assert.doesNotMatch(plain.slice(4,6),/[←→<>]/);
 }
 for(const loss of [null,0,NaN])assert.ok(exitTrack({...p,economicObjectives:{...p.economicObjectives,adverseExitLoss:loss}}).includes('   '));
 assert.ok(Math.abs(p.economicObjectives.adverseExitLoss-6)<1e-8);assert.ok(p.pnl < -6);
});

test('negative stop labels sit left of aligned boundaries with breached diamond between',()=>{
 const projected=projectLive(observed());
 for(const ascii of [false,true])for(const color of [false,true]){
  const panel=renderPanel(projected,{ascii,color,columns:166}),plain=strip(panel);
  const rows=plain.split('\n').filter(l=>/^(XLF|UNG|EWZ|XLE)\s/.test(l)),bar=ascii?'|':'│',diamond=ascii?'*':'◆';
  for(const [symbol,amount] of [['XLF',1],['EWZ',11],['XLE',6]]){
   const p=projected.positions.find(p=>p.symbol===symbol),row=rows.find(r=>r.startsWith(symbol));
   const label=(ascii?'-':'−')+`$${amount}`,start=row.indexOf(label),boundary=row.indexOf(bar,start),marker=row.indexOf(diamond,start);
   assert.ok(start>=0);assert.ok(start<boundary);assert.doesNotMatch(row,/\(.*[-−]\$/);
   if(p.pnl < p.economicObjectives.stopThreshold.grossPnl)assert.ok(start<marker&&marker<boundary);
   if(color)assert.ok(panel.includes(`\x1b[91m${label}\x1b[97m`));
  }
  const starts=rows.filter(r=>!r.startsWith('UNG')).map(r=>r.indexOf(bar,r.indexOf('$')));
  assert.equal(new Set(starts).size,1);assert.ok(rows.find(r=>r.startsWith('UNG')).includes('$7'));
  assert.ok(plain.split('\n').every(row=>cellWidth(row)<166));
 }
});

test('nonnegative stop hook is proportional and never overwrites references or cyan movement',()=>{
 for(const ascii of [false,true])for(const stop of [1,3,5,7]){
  const p=story(-1,{economicObjectives:{targetGrossProfit:7,adverseExitLoss:null,stopThreshold:{grossPnl:stop}}});
  const text=exitTrack(p,{ascii}),cells=text.replaceAll('\uFE0E',''),hook=ascii?'r':'↩';
  assert.equal(cells.indexOf(hook),2+Math.min(25,Math.round(12+14*stop/7)));
  assert.equal(cells[14],ascii?'|':'│');assert.equal(cells[28],ascii?'|':'│');assert.equal(cellWidth(text),31);assert.ok(text.endsWith('$7'));assert.doesNotMatch(text,/[()]/);
 }
 for(const pnl of [2.9,3,3.1,6.9,7])for(const direction of ['improving','deteriorating']){
  const p=story(pnl,{economicObjectives:{targetGrossProfit:7,stopThreshold:{grossPnl:3}},recentMovement:{direction}}),text=exitTrack(p),cells=text.replaceAll('\uFE0E','');
  assert.match(text,/◆[→←]/);assert.equal(cells[14],'│');assert.equal(cells[28],'│');assert.equal(cellWidth(text),31);
  if(pnl<3)assert.ok(cells.indexOf('◆')<cells.indexOf('↩'));if(pnl>3)assert.ok(cells.indexOf('◆')>cells.indexOf('↩'));
 }
 for(const target of [null,0,NaN])assert.doesNotMatch(exitTrack(story(1,{economicObjectives:{targetGrossProfit:target,stopThreshold:{grossPnl:3}}})),/↩/);
});
