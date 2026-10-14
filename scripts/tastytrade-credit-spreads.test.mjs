import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripVTControlCharacters as strip } from 'node:util';
import { projectLive, renderLive } from './tastytrade-live.mjs';
import { main } from './tastytrade.mjs';
import { silhouette } from './tastytrade-payoff-render.mjs';
import { cellWidth } from './tastytrade-live-render.mjs';
import { liveEvidence, sampleTrade } from './tastytrade-fixtures.mjs';
// Allowlisted October 14 read-only XLF observations; account/order/fill identifiers removed.
const observed = JSON.parse(readFileSync(new URL('./tastytrade-xlf-fixture.json', import.meta.url)));
const evidence = () => ({...structuredClone(observed), now:new Date(observed.now)});
const position = data => projectLive(data).positions[0];
const near = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-8, `${actual} != ${expected}`);
const terms = holdings => holdings.map(h=>{
  const m=/^(\S+)\s+(\d{6})([CP])(\d{8})$/.exec(h.symbol);
  return {symbol:h.symbol,'instrument-type':'Equity Option','underlying-symbol':h['underlying-symbol'],
    'option-chain-type':'Standard','shares-per-contract':100,'option-type':m[3],
    'strike-price':Number(m[4])/1000,'expiration-date':h['expires-at'].slice(0,10)};
});
function bear() {
  const e=evidence();
  const symbol=s=>s.replace('P000','C000');
  e.holdings.forEach(h=>{h.symbol=symbol(h.symbol);h['quantity-direction']=h['quantity-direction']==='Long'?'Short':'Long';});
  for(const o of [...e.orders,...e.complexOrders[0].orders]) for(const l of o.legs) {
    l.symbol=symbol(l.symbol);l.action=l.action.replace('Buy','TEMP').replace('Sell','Buy').replace('TEMP','Sell');
    l.fills.forEach(f=>f['fill-price']=f['fill-price']==='0.49'?'0.58':'0.49');
  }
  e.quotes.forEach(q=>{q.symbol=symbol(q.symbol);const v=q.symbol.includes('00052000')?.58:.49;
    Object.assign(q,{bid:String(v-.01),ask:String(v+.01),mid:String(v),mark:String(v),delta:'.2'});});
  e.instruments=terms(e.holdings);return e;
}
function noOrders(e) {e.orders=e.orders.filter(o=>o.status==='Filled');e.complexOrders=[];return e;}
function targetOnly(e, complex=false) {
  e.orders=e.orders.filter(o=>o['order-type']!=='Stop Limit');
  if(!complex)e.orders.forEach(o=>delete o["complex-order-id"]);
  e.complexOrders=complex?[{...e.complexOrders[0],orders:e.complexOrders[0].orders.filter(o=>o['order-type']==='Limit')}]:[];
  return e;
}
function mixed(e) {
  const ic=structuredClone(liveEvidence);
  ic.holdings.forEach(h=>h['account-number']=e.account);
  ic.quotes.forEach(q=>q['updated-at']=e.now.toISOString());
  return {...e,holdings:[...ic.holdings.slice(0,4),...e.holdings,...ic.holdings.slice(4)],
    orders:[...ic.orders,...e.orders],complexOrders:[...ic.complexOrders,...e.complexOrders],
    quotes:[...ic.quotes,...e.quotes],instruments:[...terms(ic.holdings),...e.instruments]};
}

test('observed XLF bull put: verified fills override order limit, standard expiration economics and delta',()=>{
  const p=position(evidence());
  assert.equal(p.strategy,'Bull Put Credit Spread');assert.equal(p.status,'recognized');
  near(p.credit,.09);near(p.market.closeDebit,.09);near(p.pnl,0);
  near(p.maximumProfit,9);near(p.maximumLoss,41);near(p.breakevens[0],52.41);
  near(p.netDelta,4.0772643);assert.equal(p.target,.04);assert.equal(p.stopOrder.price,'0.1');
  assert.equal(p.range,null);assert.equal(p.rangeLabel,'≥52.5');
});
test('bear call credit: short lower call, long higher call and correct breakeven',()=>{
  const p=position(bear());assert.equal(p.strategy,'Bear Call Credit Spread');
  near(p.credit,.09);near(p.maximumProfit,9);near(p.maximumLoss,41);near(p.breakevens[0],52.09);
  assert.equal(p.rangeLabel,'≤52');assert.equal(p.payoff.leftTail,p.credit);near(p.payoff.rightTail,-.41);
});
test('spread P/L and expiration values scale by quantity; weighted partial fills remain valid',()=>{
  const e=evidence();e.holdings.forEach(h=>h.quantity=2);
  for(const o of [...e.orders,...e.complexOrders[0].orders])o.legs.forEach(l=>{
    l.quantity=2;if(l.fills.length)l.fills.push({...l.fills[0]});
  });
  e.quotes.find(q=>q.symbol.includes('00052500')).mid='.55'.replace(/^\./,'0.');
  const p=position(e);near(p.credit,.09);near(p.market.closeDebit,.06);near(p.pnl,6);
  near(p.maximumProfit,18);near(p.maximumLoss,82);
});
for(const [name,transform] of [['standalone target',e=>targetOnly(e)],['complex target only',e=>targetOnly(e,true)],['target plus stop',e=>e],['no closing orders',noOrders]]) {
  test(name+' preserves financial information without inventing management',()=>{
    const e=transform(evidence()),p=position(e);near(p.credit,.09);near(p.maximumLoss,41);assert.deepEqual(p.issues,[]);
    if(name==='no closing orders') {assert.equal(p.targetOrder,null);assert.equal(p.stopOrder,null);assert.equal(p.progress,null);assert.equal(p.profitCapture,null);assert.equal(projectLive(e).rows[0][9],'—');}
    else {assert.equal(p.target,.04);assert.equal(Boolean(p.stopOrder),name==='target plus stop');}
  });
}
for(const [name,mutate] of [
  ['duplicate target',e=>e.orders.push({...e.orders[0],id:'duplicate'})],
  ['missing bracket evidence',e=>e.complexOrders=[]],
  ['price contradiction',e=>e.complexOrders[0].orders[0].price='0.03'],
  ['stop trigger contradiction',e=>e.complexOrders[0].orders[1]['stop-trigger']='0.11'],
  ['partial close',e=>e.orders[0].legs.pop()],
  ['unknown status',e=>e.orders[0].status='Mystery'],
  ['extra complex component',e=>e.complexOrders.push({type:'OCO',orders:[{...e.orders[0],id:'extra'}]})],
  ['nonprofit limit',e=>{e.orders[0].price='0.2';e.complexOrders[0].orders[0].price='0.2';}],
]) test(name+' withholds management but preserves independently verified holding and P/L',()=>{
  const e=evidence();mutate(e);const p=position(e);assert.equal(p.status,'recognized');
  assert.equal(p.targetOrder,null);assert.equal(p.stopOrder,null);assert.equal(p.progress,null);
  near(p.maximumProfit,9);near(p.pnl,0);assert.match(p.issues.join(' '),/management ambiguous/);
});
for(const [name,mutate,category] of [
  ['invalid quantity',e=>e.holdings[0].quantity='bad','malformed broker evidence'],
  ['incompatible quantities',e=>e.holdings[0].quantity=2,'malformed broker evidence'],
  ['different multipliers',e=>e.holdings[0].multiplier='10','malformed broker evidence'],
  ['invalid symbol',e=>e.holdings[0].symbol='bogus','malformed broker evidence'],
  ['contract root mismatch',e=>e.holdings[0].symbol=e.holdings[0].symbol.replace('XLF','ABC'),'malformed broker evidence'],
  ['contract expiration mismatch',e=>e.holdings[0].symbol=e.holdings[0].symbol.replace('261127','261120'),'malformed broker evidence'],
  ['different expirations',e=>{e.holdings[0]['expires-at']='2026-11-20T18:15:00Z';e.holdings[0].symbol=e.holdings[0].symbol.replace('261127','261120');},'ambiguous holdings'],
  ['different underlyings',e=>{e.holdings[0]['underlying-symbol']='ABC';e.holdings[0].symbol=e.holdings[0].symbol.replace('XLF','ABC');},'ambiguous holdings'],
  ['overlapping identities',e=>e.holdings[0].symbol=e.holdings[1].symbol,'ambiguous holdings'],
  ['incorrect strike orientation',e=>e.holdings.forEach(h=>h['quantity-direction']=h['quantity-direction']==='Long'?'Short':'Long'),'unsupported strategy'],
  ['mixed rights',e=>e.holdings[0].symbol=e.holdings[0].symbol.replace('P000','C000'),'unsupported strategy'],
  ['debit opening fills',e=>e.orders.find(o=>o.status==='Filled').legs[0].fills[0]['fill-price']='0.70','unsupported strategy'],
  ['unsupported stock',e=>e.holdings.forEach(h=>h['instrument-type']='Equity'),'unsupported strategy'],
]) test(name+' is explicit and cannot acquire credit-spread financial claims',()=>{
  const e=evidence();mutate(e);const result=projectLive(mixed(e));
  for(const p of result.positions.filter(p=>!['EWZ','XLE'].includes(p.symbol))) {
    if(category instanceof RegExp)assert.match(p.status,category);else assert.equal(p.status,category);assert.equal(p.pnl,null);assert.equal(p.payoff,null);
  }
  near(result.positions[0].credit,.42);assert.equal(result.positions.at(-1).symbol,'XLE');
  assert.match(renderLive(mixed(e)),category instanceof RegExp ? category : new RegExp(category));
});
test('missing opening evidence preserves geometry recognition and independent closing debit without invented entry P/L',()=>{
  const e=evidence();e.orders=e.orders.filter(o=>o.status!=='Filled');const p=position(e);
  assert.equal(p.strategy,'Bull Put Credit Spread');assert.equal(p.credit,null);assert.equal(p.pnl,null);
  assert.equal(p.maximumProfit,null);assert.equal(p.lifespan,null);near(p.market.closeDebit,.09);
  assert.match(p.issues.join(' '),/financial evidence unavailable/);
});
for(const [name,mutate] of [
  ['missing quote',e=>e.quotes.pop()],['duplicated quote',e=>e.quotes.push(e.quotes[0])],
  ['malformed quote',e=>e.quotes[0].mid='99'],
  ['stale quote',e=>e.quotes[0]['updated-at']='2026-10-01T18:00:00Z']
]) test(name+' suppresses dependent valuation only',()=>{
  const e=evidence();mutate(e);const p=position(e);assert.equal(p.pnl,null);assert.equal(p.progress,null);
  near(p.credit,.09);near(p.maximumProfit,9);assert.equal(p.target,.04);
});
test('negative synthetic midpoint uses whole-package broker marks; absent marks preserve unavailable',()=>{
  const e=evidence();e.quotes.forEach(q=>Object.assign(q,{bid:'0.4',ask:'0.8',mid:q.symbol.includes('00052000')?'0.7':'0.5',mark:q.symbol.includes('00052000')?'0.45':'0.5'}));
  let p=position(e);near(p.market.closeDebit,.05);near(p.pnl,4);assert.equal(p.market.valuationSource,'broker mark');
  delete e.quotes[0].mark;p=position(e);assert.equal(p.market.closeDebit,null);assert.equal(p.pnl,null);
});
for(const [name,change] of [['missing terms',e=>e.instruments=[]],['adjusted contract',e=>e.instruments[0]['option-chain-type']='Adjusted'],['nonstandard shares',e=>e.instruments[0]['shares-per-contract']=10]]) {
  test(name+' withholds standard payoff assertions',()=>{const e=evidence();change(e);const p=position(e);
    assert.equal(p.payoff,null);assert.equal(p.maximumProfit,null);assert.equal(p.maximumLoss,null);assert.equal(p.breakevens,null);near(p.credit,.09);
  });
}
test('mixed portfolio preserves existing iron-condor projection and order',()=>{
  const e=mixed(evidence()),p=projectLive(e);
  assert.deepEqual(p.positions.map(p=>p.symbol),['EWZ','XLF','XLE']);
  const ic=projectLive({...e,holdings:e.holdings.filter(h=>h['underlying-symbol']!=='XLF')});
  assert.deepEqual(p.positions[0],ic.positions[0]);assert.deepEqual(p.positions[2],ic.positions[1]);
  assert.deepEqual(p.rows[0],ic.rows[0]);assert.deepEqual(p.rows[2],ic.rows[1]);
});
test('Unicode and ASCII vertical geometry follows strike axis, plateau orientation, cyan spot and overflow',()=>{
  for(const [e,bull] of [[evidence(),true],[bear(),false]]) for(const ascii of [false,true]) {
    const p=position(e);p.spot={value:null};const s=silhouette(p,{ascii});assert.equal(cellWidth(s.text),31);
    assert.match(s.text,bull ? ascii?/^ _+\/-+$/:/^ _+╱‾+$/ : ascii?/^ -+\\_+$/:/^ ‾+╲_+$/);
    const colored=silhouette(p,{ascii,color:true});assert.equal(strip(colored.text),s.text);
    for(const code of ['2;91','93','92'])assert.ok(colored.text.includes(`\x1b[${code}m`));
    for(const value of [51.5,52,52.25,52.5,53]) {
      p.spot.value=value;const s=silhouette(p,{ascii,color:true});
      assert.equal(s.markerIndex,Math.max(0,Math.min(29,Math.round((value-s.lo)/(s.hi-s.lo)*29))));
      assert.match(s.text,/\x1b\[96m/);
    }
  }
});
test('terminal width, alignment, ASCII fallback and canonical TSV columns remain compatible',()=>{
  const e=mixed(evidence());
  for(const columns of [20,80,100,157,189])for(const ascii of [false,true])for(const color of [false,true]) {
    const out=renderLive({...e,columns,ascii,color});assert.ok(out.split('\n').every(l=>cellWidth(l)<columns));
    if(ascii)assert.doesNotMatch(strip(out),/[^\x00-\x7f]/);
    if(columns>=157) {assert.match(out,/XLF/);assert.match(out,ascii?/>=52.5/:/≥52.5/);}
  }
  const rows=renderLive({...e,format:'tsv'}).split('\n').map(l=>l.split('\t'));
  assert.deepEqual(rows[0],['ACCOUNT','SYMBOL','STRUCTURE','DIRECTION','QTY','P/L DAY','TOTAL G/L','OPENED@','CURRENT','TARGET CLOSE@','PROGRESS','OPENED','DTE','QUOTE']);
  assert.ok(rows.every(row=>row.length===14));assert.equal(rows[2][2],'Bull Put Credit Spread');assert.equal(rows[2][7],'0.09 CR');
  assert.doesNotMatch(rows.flat().join(' '),/TEST1234/);
});
test('unscoped malformed broker evidence and account mismatch still fail the whole acquisition closed',()=>{
  assert.throws(()=>projectLive({...evidence(),quotes:null}),/broker evidence malformed/);
  const e=evidence();e.holdings[0]['account-number']='OTHER';assert.throws(()=>projectLive(e),/held position evidence malformed/);
});

test('four-position IC, IC, bull put, IC portfolio preserves every row',()=>{
  const e=mixed(evidence()),t=sampleTrade('UNG','261127', [['P',8.5],['P',9],['C',13],['C',13.5]], [.1,.11,.28,.2],[.1,.11,.28,.2],.02,.06);
  t.holdings.forEach(h=>h['account-number']=e.account);t.quotes.forEach(q=>q['updated-at']=e.now.toISOString());
  e.holdings.splice(4,0,...t.holdings);e.orders.push(t.opening,...t.closing.orders);e.complexOrders.push(t.closing);e.quotes.push(...t.quotes);e.instruments.push(...terms(t.holdings));
  assert.deepEqual(projectLive(e).positions.map(p=>p.strategy),['Iron Condor','Iron Condor','Bull Put Credit Spread','Iron Condor']);
});
test('contradictory complex group identity cannot establish management',()=>{
  const e=evidence();e.orders[0]['complex-order-id']='different';
  assert.equal(position(e).targetOrder,null);assert.match(position(e).issues.join(' '),/contradictory|changed between reads/);
});
test('missing opening credit cannot manufacture P0 from an existing limit',()=>{
  const e=evidence();e.orders=e.orders.filter(o=>o.status!=='Filled');
  assert.doesNotMatch(renderLive(e),/LIMIT|P0/);assert.match(renderLive(e),/financial evidence unavailable/);
});

test('unsupported equity without expiration stays explicit alongside recognized spreads',async()=>{
  for(const onlyStock of [false,true]) {
    const e=evidence();const stock={'account-number':e.account,symbol:'ABC','underlying-symbol':'ABC','instrument-type':'Equity',quantity:100,'quantity-direction':'Long'};
    e.holdings=onlyStock?[stock]:[...e.holdings,stock];
    const calls=[],out=[],errors=[];
    const code=await main(['live','--account',e.account,'--tsv'],{
      env:{TASTYTRADE_CLIENT_ID:'x',TASTYTRADE_CLIENT_SECRET:'x',TASTYTRADE_REFRESH_TOKEN:'x'},
      now:()=>e.now,out:s=>out.push(s),err:s=>errors.push(s),
      fetchImpl:async(url,options)=>{
        calls.push(url);let body;
        if(url.endsWith('/oauth/token'))body={access_token:'x'};
        else {
          assert.equal(options.method,'GET');
          if(url.endsWith('/positions'))body={data:{items:e.holdings}};
          else if(url.includes('/complex-orders?'))body={data:{items:e.complexOrders},pagination:{'page-offset':0,'total-pages':1,'total-items':e.complexOrders.length}};
          else if(url.includes('/orders?'))body={data:{items:e.orders},pagination:{'page-offset':0,'total-pages':1,'total-items':e.orders.length}};
          else if(url.includes('equity-option[]=')){assert.ok(!url.includes('ABC'));body={data:{items:e.quotes}};}
          else if(url.endsWith('/sessions/current'))body={data:{state:'Open'}};
          else throw Error('Unexpected acquisition');
        }
        return {ok:true,json:async()=>body};
      }
    });
    assert.equal(code,0,errors.join());assert.match(out[0],/ABC\tunsupported strategy/);
    if(!onlyStock)assert.match(out[0],/XLF\tBull Put Credit Spread/);
    assert.equal(calls.some(u=>u.includes('equity-option[]=')),!onlyStock);
  }
});
test('scoped missing option expiration is malformed evidence, preserving other groups',()=>{
  const e=evidence();delete e.holdings[0]['expires-at'];
  const p=projectLive(mixed(e));assert.ok(p.positions.some(p=>p.status==='ambiguous holdings' || p.status==='malformed broker evidence'));
  near(p.positions[0].credit,.42);
});
