import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildMarket,validateMarket,pairEconomics,sessionContext,balanceEvidence,exportCadence,FILTER,child} from './ww-export-tt1.mjs';
import {buildSymbolLiquidity,symbolLiquidityCsv} from './ww-v1-shared.mjs';
import {collectBroker} from './tt-cadence-evidence.mjs';
import {liveEvidence,sampleTrade} from './tastytrade-fixtures.mjs';
import {parseArgs} from './wheelwright.mjs';
import {captureVolatility,buildVolatility} from './tt-cadence-volatility.mjs';
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
  for(const [name,content] of Object.entries(files))if(name.endsWith('.json')&&name!=='manifest.json')assert.equal(content,JSON.stringify(JSON.parse(content))+'\n');
  const manifest=JSON.parse(files['manifest.json']);assert.equal(manifest.completionStatus,'PARTIAL');assert.equal(manifest.collectionCompletion,'PARTIAL');assert.ok(manifest.readFailures.some(r=>r.code==='HTTP_403'));
  const {createHash}=await import('node:crypto');for(const item of manifest.files)assert.equal(createHash('sha256').update(files[item.name]).digest('hex'),item.sha256);
  const shared=buildSymbolLiquidity(snapshot().symbols,FILTER);assert.equal(files['symbol-liquidity.csv'],symbolLiquidityCsv(shared.rows,FILTER));
  assert.equal((await readdir(dir)).length,2);assert.ok((await readdir(dir)).every(f=>f.endsWith('.zip')));
  const broken=httpFixture({badSnapshot:true});await assert.rejects(exportCadence({...options,fetchImpl:broken.fetchImpl}),/Invalid v1/);assert.equal((await readdir(dir)).length,2);
  await assert.rejects(exportCadence({...options,fetchImpl:httpFixture({offline:true}).fetchImpl}),/No usable evidence/);assert.equal((await readdir(dir)).length,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('one-shot broker helper flushes its complete JSON and exits despite lingering read resources',()=>{
 const preload=`
  setInterval(()=>{},1000);
  globalThis.fetch=async(url)=>{
   const path=new URL(url).pathname;let body;
   if(path==='/oauth/token')return Response.json({access_token:'test-access'});
   if(path==='/customers/me/accounts')body={items:[{account:{'account-number':'TEST1234'}}]};
   else if(path.endsWith('/positions'))body={items:[]};
   else if(/\\/(orders|complex-orders)$/.test(path))return Response.json({data:{items:[]},pagination:{'page-offset':0,'total-pages':1,'total-items':0}});
   else if(path.endsWith('/balances'))body={'derivative-buying-power':'0'};
   else if(path.endsWith('/requirements'))body={'account-number':'TEST1234',groups:[]};
   else if(path==='/market-time/equities/sessions/current')body={state:'Closed'};
   else if(path==='/market-metrics')body={items:[]};
   else throw Error('unexpected route');
   return Response.json({data:body});
  };`;
 const result=spawnSync(process.execPath,['--import','data:text/javascript;base64,'+Buffer.from(preload).toString('base64'),new URL('./tt-cadence-evidence.mjs',import.meta.url).pathname],{
  input:JSON.stringify({allowSingleAccount:true,cadenceMarket:true}),encoding:'utf8',timeout:3000,
  env:{...process.env,TASTYTRADE_CLIENT_ID:'test-client',TASTYTRADE_CLIENT_SECRET:'test-secret',TASTYTRADE_REFRESH_TOKEN:'test-refresh'},
 });
 assert.equal(result.error,undefined);assert.equal(result.status,0);assert.equal(result.stderr,'');
 const body=JSON.parse(result.stdout);assert.equal(body.complete,true);assert.equal(body.marketAcquisition.mode,'CLOSED');
 assert.equal(body.orderCoverage.orders,'COMPLETE');assert.ok(!result.stdout.includes('test-access'));
});
test('atomic ZIP writer refuses inconsistent hashes without an apparently complete result',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-zip-fail-'));try{
  await assert.rejects(child('python3',[new URL('./ww-export-zip.py',import.meta.url).pathname],JSON.stringify({downloads:dir,files:{'manifest.json':'{}'}})),/helper failed/);assert.deepEqual(await readdir(dir),[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('ZIP writer preserves a complete market component above the former 64 MiB bound',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-large-zip-'));
 try{
  const {createHash}=await import('node:crypto');
  const files={'market-and-verticals.json':JSON.stringify({evidence:'x'.repeat(64*1024*1024)}),'tt1-account-positions-orders.json':'{}','evidence-coverage.json':'{}','symbol-liquidity.csv':'symbol\n','README.md':'test\n'};
  const manifest={files:Object.entries(files).map(([name,content])=>({name,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex')}))};
  files['manifest.json']=JSON.stringify(manifest);
  const path=(await child('python3',[new URL('./ww-export-zip.py',import.meta.url).pathname],JSON.stringify({files,downloads:dir,sessionDate:'2026-11-03',stamp:'test'}))).trim();
  const check=spawnSync('python3',['-c',"import sys,zipfile,json,hashlib; z=zipfile.ZipFile(sys.argv[1]); m=json.loads(z.read('manifest.json')); assert z.testzip() is None; assert len(z.namelist())==6; [(lambda b: (len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256']) or sys.exit(1))(z.read(r['name'])) for r in m['files']]",path],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);assert.equal((await readdir(dir)).length,1);
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
  else if(u.pathname.startsWith('/margin/accounts/')&&u.pathname.endsWith('/requirements'))data={'account-number':'5WX01234',groups:[],'last-state-timestamp':now.getTime()};
  else if(u.pathname.endsWith('/balances'))data={'derivative-buying-power':'3000','net-liquidating-value':'6000','updated-at':now.toISOString()};
  else if(u.pathname==='/market-time/equities/sessions/current')data={state:'Open'};
  else throw Error('Unapproved route');
  return new Response(JSON.stringify({data,...(/\/(?:orders|complex-orders)$/.test(u.pathname)?{pagination:{'page-offset':0,'total-pages':1,'total-items':data.items.length}}:{})}),{headers:{'content-type':'application/json'}});
 };
 const env={TASTYTRADE_CLIENT_ID:'synthetic-client',TASTYTRADE_CLIENT_SECRET:'synthetic-secret',TASTYTRADE_REFRESH_TOKEN:'synthetic-refresh'};
 const r=await collectBroker({expectedAccount:'5WX01234',fetchImpl:f,env,now:()=>liveEvidence.now});
 assert.ok(r.reads.length>=4);assert.ok(r.projection);assert.equal(r.projection.positions.length,2);
 assert.ok(!JSON.stringify(r).includes('5WX01234'));assert.ok(!JSON.stringify(r).includes('synthetic-access-token'));assert.equal(calls.filter(([m])=>m!=='GET').length,1);
 const malformed=await collectBroker({expectedAccount:'5WX01234',fetchImpl:(url,opt)=>new URL(url).pathname==='/market-time/equities/sessions/current'?Promise.resolve(new Response('not-json')):f(url,opt),env,now:()=>liveEvidence.now});
 assert.equal(malformed.complete,false);assert.ok(malformed.failures.some(r=>r.code==='INVALID_RESPONSE_JSON'&&r.source==='/market-time/equities/sessions/current'));
 let cancelled=false;const oversized=await collectBroker({expectedAccount:'5WX01234',fetchImpl:(url,opt)=>new URL(url).pathname==='/market-time/equities/sessions/current'?Promise.resolve(new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(12*1024*1024+1));},cancel(){cancelled=true;}}))):f(url,opt),env,now:()=>liveEvidence.now});
 assert.equal(oversized.complete,false);assert.ok(oversized.failures.some(r=>r.code==='RESPONSE_BODY_UNAVAILABLE'));assert.equal(cancelled,true);
 calls.length=0;const denied=await collectBroker({expectedAccount:'WRONG5678',fetchImpl:f,env,now:()=>liveEvidence.now});assert.equal(denied.complete,false);assert.ok(!calls.some(([,p])=>p.includes('/accounts/')));
});
test('October29 real specimen regression (private external evidence, never a repository fixture)',{skip:!process.env.TT1_SPECIMEN_DIR},async()=>{
 const dir=process.env.TT1_SPECIMEN_DIR;const source=JSON.parse(await readFile(join(dir,'v1-snapshot.json'),'utf8'));const expected=JSON.parse(await readFile(join(dir,'A-market-and-verticals.json'),'utf8'));
 const m=buildMarket(source,context,new Date('2026-10-29T18:30:00Z'));validateMarket(m);
 assert.equal(m.contracts.length,expected.contracts.length);assert.equal(m.verticalPairs.length,expected.verticalPairs.length);assert.equal(m.verticalPairs.filter(p=>p.exclusions.includes('NONPOSITIVE_NATURAL_CREDIT')).length,45);
 for(const p of m.verticalPairs){const ref=expected.verticalPairs.find(r=>r.underlying===p.underlying&&r.expiration===p.expiration&&r.shortStrike===p.shortStrike&&r.longStrike===p.longStrike);assert.ok(ref);assert.equal(p.natural.creditPerShare,ref.natural.creditPerShare);assert.equal(p.midpoint.creditPerShare,ref.midpoint.creditPerShare);}
});

test('broker collector and published ZIP reuse accepted separate-spread recognition',async()=>{
 const trades=[sampleTrade('IWM','261211',[['P',269],['P',272.5]],[2,2.65],[2,2.5],.3,.81),sampleTrade('IWM','261211',[['P',265],['P',268]],[2,2.58],[2,2.4],.3,.75),sampleTrade('QQQ','261218',[['P',690],['P',700]],[2,4.41],[2,6.5],1.11,3.01)];
 for(const [i,t] of trades.entries()){
  t.opening.id=`opening-${i}`;t.closing.id=`bracket-${i}`;t.closing.orders.forEach((o,j)=>o.id=`exit-${i}-${j}`);
  t.quotes.forEach(q=>q['updated-at']=now.toISOString());
 }
 const holdings=trades.flatMap(t=>t.holdings),orders=trades.flatMap(t=>[t.opening,...t.closing.orders]);
 const broker=await collectBroker({expectedAccount:'5WX01234',now:()=>now,env:{TASTYTRADE_CLIENT_ID:'fixture-client',TASTYTRADE_CLIENT_SECRET:'fixture-secret',TASTYTRADE_REFRESH_TOKEN:'fixture-refresh'},fetchImpl:async(url)=>{
  const path=new URL(url).pathname;let body;
  if(path==='/oauth/token')return Response.json({access_token:'fixture-access'});
  if(path==='/customers/me/accounts')body={items:[{account:{'account-number':'5WX01234'}}]};
  else if(path.endsWith('/positions'))body={items:holdings};
  else if(path.endsWith('/orders')||path.endsWith('/complex-orders')){const items=path.endsWith('/complex-orders')?trades.map(t=>t.closing):orders;return Response.json({data:{items},pagination:{'page-offset':0,'total-pages':1,'total-items':items.length}});}
  else if(path==='/market-data/by-type')body={items:trades.flatMap(t=>t.quotes)};
  else if(path==='/market-time/equities/sessions/current')body={state:'Open','open-at':'2026-10-29T13:30:00Z','close-at':'2026-10-29T20:00:00Z'};
  else if(path.endsWith('/balances'))body={'derivative-buying-power':'3000','updated-at':now.toISOString()};
  else if(path.endsWith('/requirements'))body={'account-number':'5WX01234',groups:[],'last-state-timestamp':now.getTime()};
  else throw Error('unexpected route');return Response.json({data:body});
 }});
 assert.equal(broker.complete,true);assert.equal(broker.projection.positions.length,3);
 assert.equal(broker.liveTsv.split('\n').filter(line=>line.includes('\tIWM\t')).length,2);
 const dir=await mkdtemp(join(tmpdir(),'tt1-split-spreads-'));
 try{
  const result=await exportCadence({base:'http://localhost:9999',token:'fixture-backend',now,downloads:dir,fetchImpl:httpFixture().fetchImpl,brokerRead:async()=>broker});
  const files=await unzip(result.path),a=JSON.parse(files['tt1-account-positions-orders.json']),iwm=a.derivedPositions.filter(p=>p.symbol==='IWM');
  assert.equal(iwm.length,2);for(const p of iwm)assert.equal(p.status,'recognized');
  assert.ok(Math.abs(iwm[0].credit-.65)<1e-8);assert.ok(Math.abs(iwm[1].credit-.58)<1e-8);
  assert.notEqual(iwm[0].targetOrder.id,iwm[1].targetOrder.id);
  const qqq=a.derivedPositions.find(p=>p.symbol==='QQQ');assert.ok(Math.abs(qqq.credit-2.41)<1e-8);assert.ok(Math.abs(qqq.pnl+209)<1e-8);
  assert.equal(result.manifest.counts.recognizedPositions,3);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('review P1: empty holdings still read all ordinary and complex order pages, including working entries',async()=>{
 const calls=[],account='SYNTH1234';const env={TASTYTRADE_CLIENT_ID:'fake-client',TASTYTRADE_CLIENT_SECRET:'fake-secret',TASTYTRADE_REFRESH_TOKEN:'fake-refresh'};
 const fetchImpl=async(url,opt)=>{
  const u=new URL(url);calls.push([opt.method,u.pathname]);
  if(u.pathname==='/oauth/token')return Response.json({access_token:'fake-access'});
  if(u.pathname==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':account}}]}});
  if(u.pathname.endsWith('/positions'))return Response.json({data:{items:[]}});
  if(u.pathname.endsWith('/orders')||u.pathname.endsWith('/complex-orders'))return Response.json({data:{items:[{id:'working-entry',status:'Live'}]},pagination:{'page-offset':0,'total-pages':1,'total-items':1}});
  if(u.pathname.startsWith('/margin/accounts/')&&u.pathname.endsWith('/requirements'))return Response.json({data:{'account-number':account,groups:[],'last-state-timestamp':now.getTime()}});
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

test('missing brokerage evidence remains unavailable, not a flat-account zero',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-unknown-positions-'));
 try{const f=httpFixture();const result=await exportCadence({base:'http://localhost:9999',token:'fake',now,downloads:dir,fetchImpl:f.fetchImpl,brokerRead:async()=>({reads:[],failures:[{source:'broker',code:'READ_UNAVAILABLE'}],projection:null})});
 assert.equal(result.manifest.counts.positions,null);assert.equal(result.manifest.counts.heldLegs,null);assert.match(result.summary,/Positions: unavailable/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('P50 probability remains unavailable per exact projected structure, distinct from closing debit, orders, POP and delta',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-p50-separation-'));
 try{
  const positions=[
   {underlying:'AAA',expiry:'2026-12-11T21:00:00Z',credit:.65,target:.325,p50:true,p50Probability:87,pop:.87,delta:-.25,legs:[{symbol:'AAA-short'},{symbol:'AAA-long'}]},
   {underlying:'BBB',expiry:'2026-12-18T21:00:00Z',credit:2.41,target:1,p50:false,legs:[{symbol:'BBB-short'},{symbol:'BBB-long'}]},
   {underlying:'AAA',expiry:'2026-11-27T21:00:00Z',credit:null,target:.5,p50:true,legs:[{symbol:'AAA-other-expiry'}]},
   {underlying:'ZERO',expiry:'2026-12-11T21:00:00Z',credit:0,target:0,p50:true}
  ];
  const result=await exportCadence({base:'http://localhost:9999',token:'synthetic-token',now,downloads:dir,fetchImpl:httpFixture().fetchImpl,brokerRead:async()=>({reads:[],projection:{positions},failures:[]}),sourceRevision:'synthetic-p50'});
  const files=await unzip(result.path),account=JSON.parse(files['tt1-account-positions-orders.json']),coverage=JSON.parse(files['evidence-coverage.json']);
  assert.equal(account.derivedPositions.length,4);
  for(const [i,p] of account.derivedPositions.entries()){
   assert.equal(p.underlying,positions[i].underlying);assert.equal(p.expiry,positions[i].expiry);assert.deepEqual(p.legs,positions[i].legs);
   assert.equal(p.p50Probability,null);assert.equal(p.p50ProbabilityEvidence.status,'NOT_AVAILABLE');assert.equal(p.p50ProbabilityEvidence.unit,'PERCENT_0_TO_100');assert.equal(p.p50ProbabilityEvidence.source,null);assert.equal(p.p50ProbabilityEvidence.observedAt,null);
   assert.equal(p.p50ClosingDebit,p.p50Objective.closingDebitPerShare);assert.equal(p.target,positions[i].target);assert.equal(p.credit,positions[i].credit);assert.equal(p.p50,positions[i].p50);
  }
  assert.deepEqual(account.derivedPositions.map(p=>p.p50ClosingDebit),[.325,1.205,null,0]);
  assert.equal(account.derivedPositions[0].p50Objective.workingTargetMatches,true);assert.equal(account.derivedPositions[1].p50Objective.workingTargetMatches,false);assert.equal(account.derivedPositions[2].p50Objective.workingTargetMatches,null);
  assert.ok(coverage.missing.some(x=>x.includes('P50 probability unavailable')));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('IVR is additive: actual ZIP replay, six-member schema, unchanged account/order evidence and control economics through volatility failure',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt1-volatility-package-'));
 try{
  const reads=[{path:'/accounts/tt1/positions',body:{data:{items:[{symbol:'IWM  261211P00100000',quantity:'1','quantity-direction':'Short'}]}}},
   {path:'/accounts/tt1/orders',body:{data:{items:[{id:'working-close',status:'Live'}]}}},
   {path:'/accounts/tt1/balances',retrievedAt:now.toISOString(),body:{data:{'updated-at':now.toISOString(),'derivative-buying-power':'3000'}}}];
  const positions=[{symbol:'IWM',expiry:'2026-12-11T21:00:00Z',credit:.58,legs:[],status:'recognized'}];
  const observation=captureVolatility({data:{items:[{symbol:'IWM','implied-volatility-index':'.35','implied-volatility-index-rank':'0.375','implied-volatility-index-rank-source':'tos','tos-implied-volatility-index-rank':'0.375','tos-implied-volatility-index-rank-updated-at':now.toISOString()}]}},['IWM'],now.toISOString());
  const outputs=[];
  for(const volatilityObservation of [observation,null]){
   const result=await exportCadence({base:'http://localhost:9999',token:'synthetic-token',now,downloads:dir,fetchImpl:httpFixture().fetchImpl,
    brokerRead:async()=>({reads,projection:{positions},failures:volatilityObservation?[]:[{source:'underlying volatility metrics',code:'VOLATILITY_READ_UNAVAILABLE'}],volatilityObservation}),sourceRevision:'synthetic-volatility'});
   const files=await unzip(result.path);assert.equal(Object.keys(files).length,6);
   const market=JSON.parse(files['market-and-verticals.json']),v=market.underlyingVolatility;
   assert.deepEqual(buildVolatility(v.provenance,v.records.map(r=>r.symbol),market,v.evaluatedAt),v);
   const account=JSON.parse(files['tt1-account-positions-orders.json']);
   assert.deepEqual(account.observed.reads,reads);assert.equal(account.derivedPositions.length,1);
   assert.equal(account.balances.availableOptionsBuyingPower,3000);
   assert.match(files['README.md'],/Underlying IV Rank/);
   const {createHash}=await import('node:crypto');for(const member of result.manifest.files){assert.equal(createHash('sha256').update(files[member.name]).digest('hex'),member.sha256);assert.equal(Buffer.byteLength(files[member.name]),member.bytes);}
   if(volatilityObservation){assert.equal(v.records.find(r=>r.symbol==='IWM').ivRank,37.5);assert.equal(result.coverage.underlyingVolatility.usable,1);}
   else {assert.ok(v.records.every(r=>r.ivRank===null));assert.equal(result.manifest.collectionCompletion,'PARTIAL');assert.ok(result.manifest.readFailures.some(f=>f.code==='VOLATILITY_READ_UNAVAILABLE'));}
   outputs.push({positions:account.derivedPositions,reads:account.observed.reads,csv:files['symbol-liquidity.csv'],economics:market.verticalPairs.map(p=>({shortStrike:p.shortStrike,longStrike:p.longStrike,width:p.width,natural:p.natural,midpoint:p.midpoint}))});
  }
  assert.deepEqual(outputs[1],outputs[0]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
