import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildMarket,validateMarket,pairEconomics,sessionContext,balanceEvidence,exportCadence,FILTER,child} from './ww-export-tt1.mjs';
import {buildSymbolLiquidity,symbolLiquidityCsv} from './ww-v1-shared.mjs';
import {collectBroker} from './tt-cadence-evidence.mjs';
import {liveEvidence} from './tastytrade-fixtures.mjs';
import {parseArgs} from './wheelwright.mjs';
const now=new Date('2026-10-29T18:00:00Z'),context=sessionContext(now);
const put=(strike,delta,bid,ask,openInterest=500)=>({strike,delta,bid,ask,openInterest,volume:0});
const snapshot=()=>({apiVersion:'1',generation:7,generatedAt:now.toISOString(),symbols:[{symbol:'IWM',status:'ready',expirations:[{date:'2026-12-11',dte:43}],chains:[{expiration:'2026-12-11',retrievedAt:'2026-10-29T17:00:00Z',chainAcquisitionProvenance:{kind:'chain-acquired',acquiredAt:'2026-10-29T17:00:00Z'},admissibility:{admissible:true,canonicalSessionDate:'2026-10-29'},data:{symbol:'IWM',expiration:'2026-12-11',underlying:{price:110},puts:[put(1,-.01,.01,.02),put(96.25,null,.2,.3),put(99.5,-.1,.8,.9,0),put(100,-.25,1,1.1),put(101,-.4,1.2,1.3),put(102,.25,1.2,1.3)]}}]}]});
test('parser help and invalid arguments do not initialize evidence or broaden existing commands',()=>{
 assert.deepEqual(parseArgs(['export','tt1-cadence']),{command:'export-tt1',verbose:false});
 assert.equal(parseArgs(['export','tt1-cadence','--help']).command,'export-help');
 for(const argv of [['export'],['export','wrong'],['export','tt1-cadence','--force'],['export','tt1-cadence','--verbose','--verbose']])assert.throws(()=>parseArgs(argv));
 assert.equal(parseArgs(['prices','SPY']).command,'prices');assert.equal(parseArgs(['positions','--account','tt1']).command,'show-positions');
});
test('NY sessions, DST, holidays and calendar limits; DTE independent of UTC date',()=>{
 assert.equal(sessionContext(new Date('2026-10-30T02:00:00Z')).sessionDate,'2026-10-29');
 assert.equal(sessionContext(new Date('2026-11-26T18:00:00Z')).sessionDate,'2026-11-25');
 assert.equal(sessionContext(new Date('2026-11-01T07:00:00Z')).sessionDate,'2026-10-30');
 assert.throws(()=>sessionContext(new Date('2027-01-02T00:00:00Z')),/calendar/);
 const m=buildMarket(snapshot(),sessionContext(new Date('2026-10-30T15:00:00Z')),now);assert.equal(m.verticalPairs[0].dte,42);assert.equal(m.backendDteMismatches,1);
});
test('signed short put filter; any long delta, fractional and unbounded widths; exhaustive validation',()=>{
 const m=buildMarket(snapshot(),context,now);validateMarket(m);assert.equal(m.contracts.length,6);assert.equal(m.verticalPairs.length,3);
 assert.deepEqual(m.verticalPairs.map(p=>p.width),[99,3.75,.5]);assert.equal(m.verticalPairs[1].longDelta,null);assert.equal(m.verticalPairs[2].longOpenInterest,0);
 assert.ok(m.verticalPairs.every(p=>p.shortStrike===100));m.verticalPairs.pop();assert.throws(()=>validateMarket(m),/Exhaustive/);
});
test('quote absence, normalized zero and unusable credits remain explicit; independent payoff check',()=>{
 const s=put(100,-.25,1,1.2),l=put(99,null,.4,.6);
 const e=pairEconomics(s,l);assert.equal(e.natural.creditPerShare,.4);assert.equal(e.midpoint.creditPerShare,.6);assert.equal(e.natural.maxLossPerShare,.6);
 assert.equal(pairEconomics(s,{...l,ask:null}).natural.creditPerShare,null);
 assert.deepEqual(pairEconomics(s,{...l,ask:1.1}).exclusions,['NONPOSITIVE_NATURAL_CREDIT']);
 assert.ok(pairEconomics(s,{...l,bid:2,ask:1}).exclusions.includes('MISSING_INVALID_OR_UNUSABLE_LEG_QUOTES'));
 const snap=snapshot();snap.symbols[0].chains[0].data.puts[1].openInterest=null;
 const m=buildMarket(snap,context,now);assert.equal(m.contracts[1].observed.openInterest,null);assert.equal(m.contracts[2].observed.openInterest,0);validateMarket(m);
 snap.symbols[0].chains[0].admissibility.admissible=false;assert.ok(buildMarket(snap,context,now).verticalPairs.every(p=>p.exclusions.includes('BACKEND_INADMISSIBLE_OR_UNKNOWN')));
});
test('same shared v1 CSV keeps exact schema, discovered width counts and distinct missing/zero OI',()=>{
 const s=snapshot();s.symbols[0].chains[0].data.puts.pop(); // positive-put delta is invalid market evidence, but v1 intentionally uses abs.
 const row=buildSymbolLiquidity(s.symbols,FILTER).rows[0];
 assert.equal(row.listedPairsTotal,3);assert.equal(row.quotedPairsTotal,3);assert.equal(row.maxQuotedWidth,99);assert.equal(row.minQuotedWidth,.5);
 const csv=symbolLiquidityCsv([row],FILTER);assert.match(csv,/ExecutableVerticalEstablished/);assert.match(csv,/0.5:1\/1 3.75:1\/1 99:1\/1/);
 assert.ok(csv.includes('38,45,puts,0.2,0.3'));
});
test('historical BP never becomes current without a direct broker observation',()=>{
 const retained={body:{observations:[{fields:[{brokerField:'derivative-buying-power',value:3281.42}]}]}};
 assert.equal(balanceEvidence(null,retained,context).currentBpEstablished,false);assert.equal(balanceEvidence(null,retained,context).availableOptionsBuyingPower,null);
 const b={reads:[{path:'/accounts/tt1/balances',retrievedAt:now.toISOString(),body:{data:{'derivative-buying-power':'3000','net-liquidating-value':'6000','updated-at':'2026-10-28T17:00:00Z'}}}]};
 assert.equal(balanceEvidence(b,retained,context).currentBpEstablished,false);b.reads[0].body.data['updated-at']=now.toISOString();assert.equal(balanceEvidence(b,retained,context).currentBpEstablished,true);
});
const id='acct_'+ 'a'.repeat(32),requestId='12345678-1234-4234-8234-123456789abc';
function httpFixture({deny=false,badSnapshot=false,offline=false}={}){const calls=[];return {calls,fetchImpl:async(url,options)=>{
 const u=new URL(url);calls.push([options.method,u.pathname]);if(offline)throw Error('offline');
 assert.equal(options.method,'GET');assert.ok(!/sync|refresh|transactions|\/v2\/positions|\/v2\/orders|acquisition/.test(u.pathname));
 let body;if(u.pathname==='/api/evidence/snapshot')body=badSnapshot?{}:snapshot();
 else if(u.pathname==='/v2/accounts')body={requestId,accounts:[{id,alias:'tt1',displayName:'test',brokerAssociation:{broker:'TASTYTRADE',accountNumber:'5WX01234'}}]};
 else if(u.pathname==='/v2/account-balance-observations'){if(deny)return new Response('{}',{status:403});body={currentness:'NOT_ESTABLISHED',observations:[]};}
 else if(u.pathname==='/v2/option-inventory')body={accounts:[],counts:{selectedInventoryComplete:true}};
 else throw Error('Forbidden unexpected route');
 return new Response(JSON.stringify(body),{headers:{'content-type':'application/json','x-request-id':requestId}});
 }};}
async function unzip(path){return JSON.parse(await child('python3',['-c','import sys,zipfile,json; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({n:z.read(n).decode() for n in z.namelist()}))',path],''));}
test('real ZIP: shared CSV reconciliation, hashes, modes, collision safety, partial reads and no raw dumps',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-package-test-'));
 try{
  const f=httpFixture({deny:true}),options={base:'http://localhost:9999',token:'synthetic-token',now,downloads:dir,fetchImpl:f.fetchImpl,brokerRead:async()=>({reads:[],projection:{positions:[]},failures:[]}),sourceRevision:'synthetic-test'};
  const first=await exportCadence(options),second=await exportCadence(options);assert.notEqual(first.path,second.path);
  const files=await unzip(first.path);assert.equal(Object.keys(files).length,6);assert.ok(!JSON.stringify(files).includes('5WX01234'));assert.ok(!JSON.stringify(files).includes('synthetic-token'));
  const manifest=JSON.parse(files['manifest.json']);assert.equal(manifest.completionStatus,'PARTIAL');assert.equal(manifest.collectionCompletion,'PARTIAL');assert.ok(manifest.readFailures.some(r=>r.code==='HTTP_403'));
  const {createHash}=await import('node:crypto');for(const item of manifest.files)assert.equal(createHash('sha256').update(files[item.name]).digest('hex'),item.sha256);
  const shared=buildSymbolLiquidity(snapshot().symbols,FILTER);assert.equal(files['symbol-liquidity.csv'],symbolLiquidityCsv(shared.rows,FILTER));
  assert.equal((await readdir(dir)).length,2);assert.ok((await readdir(dir)).every(f=>f.endsWith('.zip')));
  const broken=httpFixture({badSnapshot:true});await assert.rejects(exportCadence({...options,fetchImpl:broken.fetchImpl}),/Invalid v1/);assert.equal((await readdir(dir)).length,2);
  await assert.rejects(exportCadence({...options,fetchImpl:httpFixture({offline:true}).fetchImpl}),/No usable evidence/);assert.equal((await readdir(dir)).length,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('atomic ZIP writer refuses inconsistent hashes without an apparently complete result',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-zip-fail-'));try{
  await assert.rejects(child('python3',[new URL('./ww-export-zip.py',import.meta.url).pathname],JSON.stringify({downloads:dir,files:{'manifest.json':'{}'}})),/helper failed/);assert.deepEqual(await readdir(dir),[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('standalone broker uses OAuth + allowlisted GETs, reuses projection, strips account and credentials',async()=>{
 const calls=[];const f=async(url,opt)=>{
  const u=new URL(url);calls.push([opt.method,u.pathname]);let data;
  if(u.pathname==='/oauth/token'){assert.equal(opt.method,'POST');return new Response(JSON.stringify({access_token:'synthetic-access-token'}));}
  assert.equal(opt.method,'GET');
  if(u.pathname==='/customers/me/accounts')data={items:[{account:{'account-number':'5WX01234','account-type-name':'Individual','is-closed':false}}]};
  else if(u.pathname.endsWith('/positions'))data={items:liveEvidence.holdings};
  else if(u.pathname.endsWith('/complex-orders'))data={items:liveEvidence.complexOrders};
  else if(u.pathname.endsWith('/orders'))data={items:liveEvidence.orders};
  else if(u.pathname==='/market-data/by-type')data={items:liveEvidence.quotes};
  else if(u.pathname.endsWith('/balances'))data={'derivative-buying-power':'3000','net-liquidating-value':'6000','updated-at':now.toISOString()};
  else if(u.pathname==='/market-time/equities/sessions/current')data={state:'Open'};
  else throw Error('Unapproved route');
  return new Response(JSON.stringify({data,...(/\/(?:orders|complex-orders)$/.test(u.pathname)?{pagination:{'page-offset':0,'total-pages':1,'total-items':data.items.length}}:{})}),{headers:{'content-type':'application/json'}});
 };
 const env={TASTYTRADE_CLIENT_ID:'synthetic-client',TASTYTRADE_CLIENT_SECRET:'synthetic-secret',TASTYTRADE_REFRESH_TOKEN:'synthetic-refresh'};
 const r=await collectBroker({expectedAccount:'5WX01234',fetchImpl:f,env,now:()=>liveEvidence.now});
 assert.ok(r.reads.length>=4);assert.ok(r.projection);assert.equal(r.projection.positions.length,2);
 assert.ok(!JSON.stringify(r).includes('5WX01234'));assert.ok(!JSON.stringify(r).includes('synthetic-access-token'));assert.equal(calls.filter(([m])=>m!=='GET').length,1);
 calls.length=0;const denied=await collectBroker({expectedAccount:'WRONG5678',fetchImpl:f,env,now:()=>liveEvidence.now});assert.equal(denied.complete,false);assert.ok(!calls.some(([,p])=>p.includes('/accounts/')));
});
test('October29 real specimen regression (private external evidence, never a repository fixture)',{skip:!process.env.TT1_SPECIMEN_DIR},async()=>{
 const dir=process.env.TT1_SPECIMEN_DIR;const source=JSON.parse(await readFile(join(dir,'v1-snapshot.json'),'utf8'));const expected=JSON.parse(await readFile(join(dir,'A-market-and-verticals.json'),'utf8'));
 const m=buildMarket(source,context,new Date('2026-10-29T18:30:00Z'));validateMarket(m);
 assert.equal(m.contracts.length,expected.contracts.length);assert.equal(m.verticalPairs.length,expected.verticalPairs.length);assert.equal(m.verticalPairs.filter(p=>p.exclusions.includes('NONPOSITIVE_NATURAL_CREDIT')).length,45);
 for(const p of m.verticalPairs){const ref=expected.verticalPairs.find(r=>r.underlying===p.underlying&&r.expiration===p.expiration&&r.shortStrike===p.shortStrike&&r.longStrike===p.longStrike);assert.ok(ref);assert.equal(p.natural.creditPerShare,ref.natural.creditPerShare);assert.equal(p.midpoint.creditPerShare,ref.midpoint.creditPerShare);}
});

test('review P1: empty holdings still read all ordinary and complex order pages, including working entries',async()=>{
 const calls=[],account='SYNTH1234';const env={TASTYTRADE_CLIENT_ID:'fake-client',TASTYTRADE_CLIENT_SECRET:'fake-secret',TASTYTRADE_REFRESH_TOKEN:'fake-refresh'};
 const fetchImpl=async(url,opt)=>{
  const u=new URL(url);calls.push([opt.method,u.pathname]);
  if(u.pathname==='/oauth/token')return Response.json({access_token:'fake-access'});
  if(u.pathname==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':account}}]}});
  if(u.pathname.endsWith('/positions'))return Response.json({data:{items:[]}});
  if(u.pathname.endsWith('/orders')||u.pathname.endsWith('/complex-orders'))return Response.json({data:{items:[{id:'working-entry',status:'Live'}]},pagination:{'page-offset':0,'total-pages':1,'total-items':1}});
  if(u.pathname.endsWith('/balances'))return Response.json({data:{'derivative-buying-power':'3000','updated-at':now.toISOString()}});
  throw Error('unexpected route');
 };
 const r=await collectBroker({expectedAccount:account,fetchImpl,env,now:()=>now});
 assert.equal(r.complete,true);assert.equal(r.orderCoverage.orders,'COMPLETE');assert.equal(r.orderCoverage['complex-orders'],'COMPLETE');
 assert.equal(r.reads.find(r=>r.path.endsWith('/orders')).body.data.items[0].status,'Live');
 assert.equal(calls.filter(([method])=>method!=='GET').length,1);
});
test('review P2: successful discovery plus empty failure envelopes is total evidence failure, no ZIP',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-total-fail-'));
 try{
  const fixture=httpFixture(),real=fixture.fetchImpl;
  fixture.fetchImpl=async(u,o)=>new URL(u).pathname==='/v2/accounts'?real(u,o):new Response('{}',{status:503});
  await assert.rejects(exportCadence({base:'http://localhost:9999',token:'fake',now,downloads:dir,fetchImpl:fixture.fetchImpl,brokerRead:async()=>({reads:[],failures:[{source:'broker',code:'AUTHENTICATION_UNAVAILABLE'}],projection:null})}),/No usable evidence/);
  assert.deepEqual(await readdir(dir),[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('usable source-fact contract rejects malformed/invalid-only observations but accepts qualified empty custody/orders and actual zero balances',async()=>{
 const {hasFinancialEvidence,observedNumber}=await import('./ww-export-tt1.mjs');
 for(const value of [null,undefined,'','UNAVAILABLE','NaN','Infinity','1e999',Infinity,NaN,true,{},[]]){
  assert.equal(observedNumber(value),null);
  assert.equal(hasFinancialEvidence({broker:{reads:[{path:'/accounts/tt1/balances',body:{data:{'derivative-buying-power':value}}}]}}),false);
  assert.equal(hasFinancialEvidence({retained:{observations:[{fields:[{status:'REPORTED',value}]}]}}),false);
 }
 for(const value of [0,'0','-12.34','1e3'])assert.equal(hasFinancialEvidence({broker:{reads:[{path:'/accounts/tt1/balances',body:{data:{'cash-balance':value}}}]}}),true);
 assert.equal(hasFinancialEvidence({broker:{reads:[{path:'/accounts/tt1/orders',body:{data:{items:[]}}}],orderCoverage:{orders:'INCOMPLETE'}}}),false);
 assert.equal(hasFinancialEvidence({broker:{reads:[{path:'/accounts/tt1/orders',body:{data:{items:[]}}}],orderCoverage:{orders:'COMPLETE'}}}),true);
 assert.equal(hasFinancialEvidence({broker:{reads:[{path:'/accounts/tt1/positions',body:{data:{items:[{symbol:'SPY',quantity:'UNAVAILABLE','quantity-direction':'Long'}]}}}]}}),false);
 assert.equal(hasFinancialEvidence({inventory:{accounts:[{readComplete:true,options:[]}]}}),true);
});
test('review P2 invalid-only balance response cannot publish when every other financial source fails',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-invalid-balance-'));
 try{
  const fixture=httpFixture(),real=fixture.fetchImpl;
  fixture.fetchImpl=async(u,o)=>new URL(u).pathname==='/v2/accounts'?real(u,o):new Response('{}',{status:503});
  await assert.rejects(exportCadence({base:'http://localhost:9999',token:'fake',now,downloads:dir,fetchImpl:fixture.fetchImpl,brokerRead:async()=>({reads:[{path:'/accounts/tt1/balances',body:{data:{'derivative-buying-power':'UNAVAILABLE'}}}],failures:[{source:'broker',code:'READ_UNAVAILABLE'}],projection:null})}),/No usable evidence/);
  assert.deepEqual(await readdir(dir),[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
