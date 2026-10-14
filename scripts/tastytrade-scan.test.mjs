import test from 'node:test';
import assert from 'node:assert/strict';
import { stripVTControlCharacters as strip } from 'node:util';
import { projectLive, renderLive } from './tastytrade-live.mjs';
import { renderPanel, spanTrack, cellWidth } from './tastytrade-live-render.mjs';
import { silhouette } from './tastytrade-payoff-render.mjs';
import { liveEvidence, ewz, xle, sampleTrade } from './tastytrade-fixtures.mjs';
const terms = holdings => holdings.map(h=>{
  const m=/^(\S+)\s+(\d{6})([CP])(\d{8})$/.exec(h.symbol);
  return {symbol:h.symbol,'instrument-type':'Equity Option','underlying-symbol':h['underlying-symbol'],
    'option-chain-type':'Standard','shares-per-contract':100,'option-type':m[3],
    'strike-price':String(Number(m[4])/1000),'expiration-date':h['expires-at'].slice(0,10)};
});
const spot = (extra={}) => ({symbol:'EWZ','instrument-type':'Equity',bid:'39.59',ask:'39.61',mid:'39.60',
  'updated-at':'2026-10-01T01:59:00Z','prev-close':'39.00','prev-close-price-type':'Final',
  'summary-date':'2026-09-30','prev-close-date':'2026-09-29',...extra});
const evidence={...liveEvidence,showPnl:true,instruments:terms(liveEvidence.holdings),spotQuotes:[spot()]};
const session={state:'Closed','previous-session':{'open-at':'2026-10-09T13:30:00Z','close-at':'2026-10-09T20:00:00Z'},'next-session':{'open-at':'2026-10-12T13:30:00Z'}};
const targetEvidence = (price,data=evidence,trade=ewz) => {
  const target={...trade.closing.orders[0],price:String(price)};
  return {...data,orders:data.orders.map(o=>o.id===target.id?target:o),
    complexOrders:data.complexOrders.map(o=>o.id===trade.closing.id?{...o,orders:[target,trade.closing.orders[1]]}:o)};
};
const openingAt = (at,data=evidence) => ({...data,orders:data.orders.map(o=>o.status==='Filled'?{...o,
  legs:o.legs.map(l=>({...l,fills:l.fills.map(f=>({...f,'filled-at':at}))}))}:o)});

test('RANGE is the verified short-strike plateau, including fractional and unequal wings',()=>{
  const p=projectLive(evidence);
  assert.deepEqual(p.positions.map(p=>p.range),[{lower:32,upper:42},{lower:59.5,upper:64.5}]);
  const fractional=sampleTrade('F','261120', [['P',124.125],['P',125.125],['C',137.5],['C',139.25]],
    [.52,.71,1.11,.88],[.45,.65,.75,.62],.21,.53);
  const data={...evidence,holdings:fractional.holdings,orders:[fractional.opening,...fractional.closing.orders],
    complexOrders:[fractional.closing],quotes:fractional.quotes,instruments:terms(fractional.holdings)};
  const position=projectLive(data).positions[0];
  assert.equal(position.payoff.unequal,true); assert.deepEqual(position.range,{lower:125.125,upper:137.5});
  assert.match(renderLive(data),/125.125–137.5/);
  for(const instruments of [[],evidence.instruments.map(i=>({...i,'option-chain-type':'Adjusted'}))]) {
    assert.equal(projectLive({...evidence,instruments}).positions[0].range,null);
    assert.match(renderLive({...evidence,instruments}),/IC \[\?terms\]\s+—/);
  }
  const ls=renderLive(evidence).trim().split('\n');
  assert.equal(ls[2].indexOf('32–42'),ls[1].indexOf('RANGE'));
  assert.equal(ls[3].indexOf('59.5–64.5'),ls[1].indexOf('RANGE'));
});

test('SPOT shape color is independent of preserved prior-close movement evidence',()=>{
  for(const [reference,movement] of [['39','up'],['40','down'],['39.60','unchanged'],[undefined,'unknown']]) {
    const data={...evidence,spotQuotes:[spot({'prev-close':reference})]};
    const p=projectLive(data).positions[0];
    assert.equal(p.spot.movement,movement); assert.equal(p.spot.value,39.6);
    assert.match(renderLive({...data,color:true}),/\x1b\[92m39\.60\x1b\[97m/);
    const shape=silhouette(p,{color:true});assert.match(shape.text,/\x1b\[96m▲/);
    assert.equal(shape.markerIndex,Math.round((p.spot.value-shape.lo)/(shape.hi-shape.lo)*29));
  }
});

test('invalid or mismatched previous-close evidence never fabricates price movement',()=>{
  for(const extra of [ {'prev-close':null},{'prev-close':'0'},{'prev-close':'-1'},
    {'prev-close-price-type':'Indicative'},{'prev-close-date':'2026-02-30'},
    {'prev-close-date':'2026-09-30'},{'summary-date':'2026-10-01'},
    {'summary-date':'2026-09-29','prev-close-date':'2026-09-28'} ]) {
    const p=projectLive({...evidence,spotQuotes:[spot(extra)]}).positions[0];
    assert.equal(p.spot.value,39.6);assert.equal(p.spot.movement,'unknown');assert.equal(p.spot.comparison,null);
  }
});

test('Friday and Sunday retain the same applicable SPOT direction, never automatic Sunday yellow',()=>{
  const q=spot({'updated-at':'2026-10-09T19:59:00Z','summary-date':'2026-10-09','prev-close-date':'2026-10-08'});
  const quotes=evidence.quotes.map(q=>({...q,'updated-at':'2026-10-09T19:59:00Z'}));
  for(const now of [new Date('2026-10-09T20:01:00Z'),new Date('2026-10-11T14:00:00Z')]) {
    const data={...evidence,quotes,spotQuotes:[q],session,now};
    const p=projectLive(data).positions[0];
    assert.equal(p.spot.retained,true);assert.equal(p.spot.movement,'up');
    assert.match(renderLive({...data,color:true}),/\x1b\[92m39.60\x1b\[97m/);
    assert.match(silhouette(p,{color:true}).text,/\x1b\[96m▲/);
  }
});

test('overnight broker refresh requires latest completed-session linkage for comparison direction',()=>{
  const q=spot({'updated-at':'2026-10-10T10:44:36Z','summary-date':'2026-10-09','prev-close-date':'2026-10-08'});
  const data={...evidence,spotQuotes:[q],now:new Date('2026-10-11T14:00:00Z')};
  const verified=projectLive({...data,session}).positions[0].spot;
  assert.equal(verified.stale,true);assert.equal(verified.movement,'up');
  assert.deepEqual(verified.comparison,{price:39,date:'2026-10-08',summaryDate:'2026-10-09',
    source:'tastytrade prev-close',priceType:'Final',change:39.6-39});
  assert.equal(projectLive(data).positions[0].spot.movement,'unknown');
  assert.equal(projectLive({...data,session:{state:'Open'}}).positions[0].spot.movement,'unknown');
});

test('SPAN follows verified opening fill to expiration with embedded right-aligned DTE',()=>{
  for(const [now,remaining,index,char] of [
    ['2026-09-30T18:00:00Z',51,0,'◆'],['2026-10-25T16:00:00Z',26,5,'●'],
    ['2026-11-10T16:00:00Z',10,8,'●'],['2026-11-19T16:00:00Z',1,10,'●'],
    ['2026-11-20T16:00:00Z',0,10,'◆'],['2026-11-21T16:00:00Z',0,10,'◆'] ]) {
    const data={...evidence,quotes:evidence.quotes.map(q=>({...q,'updated-at':now})),now:new Date(now)};
    const p=projectLive(data).positions[0];
    assert.equal(p.lifespan.openingDte,51);assert.equal(p.dte,remaining);
    const text=spanTrack(p);assert.equal(cellWidth(text),18);assert.equal(text.indexOf(char),index);
    assert.equal(text.slice(11),` ${`${remaining}/51`.padStart(5)}d`);
    assert.doesNotMatch(text,/│/);
    // A held position remains visible at/past expiration; only holdings control inclusion.
    assert.match(renderLive(data),/^EWZ\s/m);
  }
});

test('SPAN explicitly handles same-day holding and New York dates across midnight and DST',()=>{
  const same=projectLive({...openingAt('2026-11-20T14:00:00Z'),now:new Date('2026-11-20T16:00:00Z')}).positions[0];
  assert.deepEqual(same.lifespan,{openingDte:0,remainingDte:0,elapsedDays:0,progress:1});
  assert.equal(spanTrack(same),'──────────◆   0/0d');
  const overnight=projectLive({...openingAt('2026-10-01T02:00:00Z'),now:new Date('2026-10-01T03:00:00Z')}).positions[0];
  assert.equal(overnight.lifespan.openingDte,51);assert.equal(overnight.lifespan.progress,0);
  const dst=projectLive({...openingAt('2026-10-30T16:00:00Z'),now:new Date('2026-11-01T16:00:00Z')}).positions[0];
  assert.deepEqual(dst.lifespan,{openingDte:21,remainingDte:19,elapsedDays:2,progress:2/21});
});

test('missing opening evidence fails closed; renderer cannot invent a lifespan or DTE objective',()=>{
  const missing=openingAt(undefined);
  assert.match(projectLive(missing).positions[0].issues.join(" "),/opening fill evidence malformed/);
  assert.equal(projectLive(missing).positions[0].lifespan,null);
  const p=projectLive(evidence).positions[0];
  assert.equal(spanTrack({...p,lifespan:null}).trim(),'—       51/—d');
  assert.equal(p.timeExit.objectiveDte,null);assert.ok(p.stopOrder);
  assert.doesNotMatch(renderLive(evidence),/EXIT DTE|D21/);
});

test('EXIT PROGRESS always carries the actual P20/P50/P80 objective per row',()=>{
  for(const [target,label] of [[.336,'P20'],[.21,'P50'],[.084,'P80']]) {
    const data=targetEvidence(target), p=projectLive(data).positions[0];
    assert.ok(Math.abs(p.profitCapture-Number(label.slice(1))/100)<1e-12);
    assert.ok(renderLive(data).includes(`$${Math.round((.42-target)*100)}`));
    assert.match(renderLive(data),/EXIT PROGRESS/);
  }
  const mixed=targetEvidence(.036,targetEvidence(.336),xle);
  assert.match(renderLive(mixed),/EWZ.*\$8/);assert.match(renderLive(mixed),/XLE.*\$14/);
  const odd=targetEvidence(.20);
  assert.match(renderLive(odd),/EWZ.*\$22/);assert.doesNotMatch(renderLive(odd),/@0.20|@0.21/);
  assert.equal(projectLive(odd).positions[0].target,.20);
  assert.match(renderLive({...odd,format:'tsv'}),/0.42 CR\t0.33\t52% @ 0.20/);
});

test('P/L stays gross and independent: signed values, zero, quantities and multipliers',()=>{
  const p=projectLive(evidence);assert.ok(p.positions[0].pnl>0);assert.ok(p.positions[1].pnl<0);
  const quotes=evidence.quotes.map(q=>q.symbol===ewz.holdings[2].symbol?{...q,bid:'.83',ask:'.85',mid:'.84'}:q);
  // Broker decimal strings require a leading zero.
  const zero=projectLive({...evidence,quotes:quotes.map(q=>({...q,bid:q.bid.replace(/^\./,'0.'),ask:q.ask.replace(/^\./,'0.'),mid:q.mid.replace(/^\./,'0.')}))});
  assert.ok(Math.abs(zero.positions[0].pnl)<1e-10);assert.match(renderPanel(zero,{showPnl:true}),/\$0/);
  assert.doesNotMatch(renderPanel(zero,{color:true,showPnl:true}),/\x1b\[(91|92)m[+−]\$0/);
  const orders=evidence.orders.map(o=>({...o,legs:o.legs.map(l=>({...l,quantity:'2',...(l.fills?{fills:l.fills.map(f=>({...f,quantity:'2'}))}:{})}))}));
  const complexOrders=evidence.complexOrders.map(c=>({...c,orders:c.orders.map(o=>orders.find(a=>a.id===o.id))}));
  const holdings=evidence.holdings.map(h=>({...h,quantity:'2',multiplier:'150'}));
  const scaled=projectLive({...evidence,orders,complexOrders,holdings});
  assert.ok(Math.abs(scaled.positions[0].pnl-27)<1e-10);
  assert.ok(Math.abs(scaled.positions[1].pnl+39)<1e-10);
  const stale=projectLive({...evidence,now:new Date('2026-10-11T14:00:00Z')});
  assert.ok(stale.positions.every(p=>p.pnl===null && p.progress===null));
});

test('twenty positions with varied lifespans and objectives align without wrapping at 157/189 cells',()=>{
  const trades=Array.from({length:20},(_,i)=>sampleTrade(`T${i}`,['261016','261120','270115'][i%3],
    [['P',31],['P',32],['C',42],['C',43]],[.52,.71,1.11,.88],[.45,.65,.75,.62],[.336,.21,.084][i%3],.53));
  const holdings=trades.flatMap(t=>t.holdings);
  const data={...evidence,now:new Date('2026-10-11T14:00:00Z'),session,holdings,instruments:terms(holdings),
    orders:trades.flatMap(t=>[t.opening,...t.closing.orders]),complexOrders:trades.map(t=>t.closing),
    quotes:trades.flatMap(t=>t.quotes).map(q=>({...q,'updated-at':'2026-10-09T19:59:00Z'})),
    spotQuotes:trades.map((_,i)=>spot({symbol:`T${i}`,'updated-at':'2026-10-09T19:59:00Z','summary-date':'2026-10-09','prev-close-date':'2026-10-08'}))};
  for(const columns of [157,189])for(const ascii of [false,true]){
    const plain=renderLive({...data,columns,ascii}),colored=renderLive({...data,columns,ascii,color:true});
    assert.equal(strip(colored),plain);if(ascii)assert.doesNotMatch(plain,/[^\x00-\x7f]/);
    const lines=plain.trim().split('\n'),rows=lines.slice(2);
    assert.equal(lines.length,22);assert.ok(lines.every(l=>cellWidth(l)<columns));
    const header=lines[1];assert.deepEqual(header.split(/\s+/),['SYMBOL','TRADE','SHAPE','RANGE','SPOT','DTE','EXIT','PROGRESS','P/L','QUOTE']);
    const spans=rows.map(row=>row.match(/([─◆●*o\-]{11})(\s*\d+\/\d+d)/));
    assert.ok(spans.every(Boolean));assert.equal(new Set(spans.map(m=>m.index+m[0].length)).size,1);
    const exits=rows.map(row=>row.match(/([─│X?$\d.◆←→|*<>\/ \-]+\$(?:8|21|34)[─│X?$\d.◆←→|*<>\/ \-]*)/));
    assert.ok(exits.every(Boolean));assert.equal(new Set(exits.map(m=>m.index)).size,1);
    assert.ok(rows.every(row=>row.indexOf('32'+(ascii?'-':'–')+'42')===header.indexOf('RANGE')));
    assert.doesNotMatch(plain,/OPEN|NOW|TARGET|EXIT DTE|O:|S:/);
  }
});

test('SPOT matches local shape color; RANGE stays neutral; missing shape stays neutral',()=>{
 for(const [value,code] of [[30,91],[31.5,93],[39.6,92],[42.59,93],[44,91]])for(const ascii of [false,true]){
   const q=spot({bid:String(value-.01),ask:String(value+.01),mid:String(value)});
   const data={...evidence,spotQuotes:[q],ascii},plain=renderLive(data),colored=renderLive({...data,color:true});
   const label=String(value).includes('.')?String(value).padEnd(String(value).indexOf('.')+3,'0'):`${value}.00`;
   assert.ok(colored.includes(`\x1b[${code}m${label}\x1b[97m`));assert.equal(strip(colored),plain);
   assert.ok(colored.includes(ascii?'32-42':'32–42'));assert.doesNotMatch(colored,/\x1b\[9[123]m32[–-]42/);
 }
 const noShape=renderLive({...evidence,instruments:[],color:true});assert.match(noShape,/\x1b\[97m39.60\x1b\[97m/);
});

test('DTE labels show verified remaining/original days with truthful missing and wide values',()=>{
 const p=projectLive(evidence).positions[0];
 for(const [remaining,original,label] of [[37,45,'37/45d'],[0,0,'0/0d'],[100,1000,'100/1000d'],[null,45,'—/45d'],[37,null,'37/—d'],[37,-1,'37/—d']]){
   const value={...p,dte:remaining,lifespan:{...p.lifespan,openingDte:original}};
   for(const ascii of [false,true]){
    const text=spanTrack(value,{ascii}),expected=ascii?label.replaceAll('—','--'):label;
    assert.ok(text.endsWith(expected));assert.equal(strip(spanTrack(value,{ascii,color:true})),text);
   }
 }
});
