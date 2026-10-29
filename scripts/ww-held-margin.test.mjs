import test from 'node:test';
import assert from 'node:assert/strict';
import {heldMarginEvidence} from './ww-held-margin.mjs';
import {collectBroker} from './tt-cadence-evidence.mjs';
import {readFile} from 'node:fs/promises';
const at='2026-10-29T18:00:00.000Z';
const expiry='2026-12-11T21:00:00.000Z';
function fixture(){
 const holdings=[{symbol:'AAA   261211P00100000','instrument-type':'Equity Option','underlying-symbol':'AAA','expires-at':expiry,quantity:'1','quantity-direction':'Short'},{symbol:'AAA   261211P00097000','instrument-type':'Equity Option','underlying-symbol':'AAA','expires-at':expiry,quantity:'1','quantity-direction':'Long'}];
 const group={'description':'UNIVERSAL_SPREAD','margin-requirement':'300.0','margin-requirement-effect':'Debit','initial-requirement':'300.0','initial-requirement-effect':'Debit','maintenance-requirement':'300.0','maintenance-requirement-effect':'Debit','buying-power':'250.0','buying-power-effect':'Credit','includes-working-order':false,'position-entries':holdings.map(h=>({'instrument-symbol':h.symbol,'instrument-type':h['instrument-type'],quantity:h['quantity-direction']==='Short'?'-1.0':'1.0'}))};
 const report={'margin-requirement':'300.0','margin-requirement-effect':'Debit','option-buying-power':'1000.0','option-buying-power-effect':'Credit','last-state-timestamp':Date.parse(at),groups:[{'underlying-symbol':'AAA',groups:[group]}]};
 const balances={currency:'USD','used-derivative-buying-power':'250.0','derivative-buying-power':'1000.0','net-liquidating-value':'1250.0','updated-at':at};
 return {reads:[{path:'/accounts/tt1/positions',retrievedAt:at,body:{data:{items:holdings}}},{path:'/accounts/tt1/balances',retrievedAt:at,body:{data:balances}},{path:'/margin/accounts/tt1/requirements',retrievedAt:at,body:{data:report}}],projection:{positions:[{status:'recognized',underlying:'AAA',expiry,quantity:1}]}};
}
const group=b=>b.reads[2].body.data.groups[0].groups[0];
test('exact signed-leg identity binds current BP and gross margin separately, retaining effects and clocks',()=>{
 const r=heldMarginEvidence(fixture());assert.equal(r.status,'OBSERVED_QUALIFIED');assert.equal(r.positionBindings[0].buyingPowerFootprint.amount,250);assert.equal(r.positionBindings[0].marginRequirement.amount,300);assert.equal(r.positionBindings[0].buyingPowerFootprint.effect,'Credit');assert.equal(r.source.brokerStateAt,at);assert.equal(r.reconciliation.heldMembership,'MATCH');assert.equal(r.reconciliation.groupBpToNlvMinusAvailable,'MATCH');assert.equal(r.positionBindings[0].openingBuyingPowerDebit,null);assert.equal(r.positionBindings[0].hypotheticalClosingBuyingPowerRelease,null);
});
test('changed quantity, side, contract, duplicate entries and unmatched held inventory fail binding without allocation',()=>{
 for(const change of [b=>group(b)['position-entries'][0].quantity='-2',b=>group(b)['position-entries'][0].quantity='1',b=>group(b)['position-entries'][0]['instrument-symbol']='OTHER',b=>group(b)['position-entries'].push(group(b)['position-entries'][0]),b=>b.reads[0].body.data.items.pop()]){
  const b=fixture();change(b);const r=heldMarginEvidence(b);assert.equal(r.status,'PARTIAL');assert.equal(r.positionBindings[0].buyingPowerFootprint,null);
 }
});
test('netted multi-trade group, duplicate hierarchy and working-order groups are retained, never prorated',()=>{
 let b=fixture();b.projection.positions.push({...b.projection.positions[0],expiry:'2026-12-18T21:00:00Z'});let r=heldMarginEvidence(b);assert.equal(r.positionBindings[1].buyingPowerFootprint,null);assert.equal(r.status,'PARTIAL');
 b=fixture();group(b)['includes-working-order']=true;r=heldMarginEvidence(b);assert.equal(r.positionBindings[0].buyingPowerFootprint,null);assert.equal(r.riskGroups[0].includesWorkingOrder,true);
 b=fixture();b.reads[2].body.data.groups[0]['position-entries']=structuredClone(group(b)['position-entries']);r=heldMarginEvidence(b);assert.ok(r.issues.includes('OVERLAPPING_MARGIN_HIERARCHY'));assert.equal(r.positionBindings[0].buyingPowerFootprint,null);
});
test('invalid/missing money or effects, wrong totals/currency and missing/future clocks cannot manufacture BP',()=>{
 for(const change of [b=>group(b)['buying-power']='NaN',b=>delete group(b)['buying-power'],b=>delete group(b)['buying-power-effect'],b=>b.reads[1].body.data['used-derivative-buying-power']='251',b=>delete b.reads[1].body.data.currency,b=>delete b.reads[2].body.data['last-state-timestamp'],b=>b.reads[2].body.data['last-state-timestamp']=Date.parse(at)+1,b=>b.projection=null]){
  const b=fixture();change(b);const r=heldMarginEvidence(b);assert.equal(r.status,'PARTIAL');assert.ok(r.positionBindings.every(p=>p.buyingPowerFootprint===null));
 }
 assert.equal(heldMarginEvidence({reads:[]}).status,'UNAVAILABLE');
});
test('true zero requirements and a verified empty account remain observed zero',()=>{
 const b=fixture();b.reads[0].body.data.items=[];b.projection.positions=[];const d=b.reads[2].body.data;d.groups=[];d['margin-requirement']='0.0';d['margin-requirement-effect']='None';Object.assign(b.reads[1].body.data,{'used-derivative-buying-power':'0','net-liquidating-value':'1000'});
 const r=heldMarginEvidence(b);assert.equal(r.status,'OBSERVED_QUALIFIED');assert.equal(r.reconciliation.sumGroupBuyingPower,0);
});
test('extra held-margin GET is bounded and redacted; refusal/mismatched account does not hide other evidence or permit previews',async()=>{
 for(const mode of ['ok','forbidden','wrong-account']){
  const calls=[];const f=async(url,opt)=>{const p=new URL(url).pathname;calls.push([opt.method,p]);
   if(p==='/oauth/token')return Response.json({access_token:'dummy-access'});
   assert.equal(opt.method,'GET');assert.ok(!p.includes('dry-run'));
   if(p==='/customers/me/accounts')return Response.json({data:{items:[{account:{'account-number':'DUMMY1234'}}]}});
   if(p.endsWith('/positions'))return Response.json({data:{items:[]}});
   if(p.endsWith('/orders')||p.endsWith('/complex-orders'))return Response.json({data:{items:[]},pagination:{'page-offset':0,'total-pages':0,'total-items':0}});
   if(p.endsWith('/balances'))return Response.json({data:{currency:'USD','derivative-buying-power':'1000'}});
   if(p==='/margin/accounts/DUMMY1234/requirements')return mode==='forbidden'?new Response('{}',{status:403}):Response.json({data:{'account-number':mode==='ok'?'DUMMY1234':'WRONG9999',groups:[],'last-state-timestamp':Date.parse(at)}});
   throw Error('unexpected route');
  };
  const r=await collectBroker({expectedAccount:'DUMMY1234',fetchImpl:f,env:{TASTYTRADE_CLIENT_ID:'dummy-client',TASTYTRADE_CLIENT_SECRET:'dummy-secret',TASTYTRADE_REFRESH_TOKEN:'dummy-refresh'},now:()=>new Date(at)});
  assert.equal(r.reads.some(x=>x.path==='/margin/accounts/tt1/requirements'),mode==='ok');assert.equal(r.failures.some(x=>x.code==='HELD_MARGIN_READ_UNAVAILABLE'),mode!=='ok');assert.equal(calls.filter(([m])=>m==='POST').length,1);assert.ok(!JSON.stringify(r).includes('DUMMY1234'));assert.ok(!JSON.stringify(r).includes('dummy-access'));
 }
});
test('private real margin specimen matches all four groups and ten legs without source repair',{skip:!process.env.TT1_MARGIN_SPECIMEN},async()=>{
 const j=JSON.parse(await readFile(process.env.TT1_MARGIN_SPECIMEN,'utf8'));
 const broker={reads:[{path:'/margin/accounts/tt1/requirements',retrievedAt:j.retrievedAt,body:j.body},...j.relatedBrokerReads.map(r=>({path:r.endpoint.replace(/^GET /,''),retrievedAt:r.retrievedAt,body:r.body}))],projection:{positions:[]}};
 const holdings=broker.reads.find(r=>r.path.endsWith('/positions')).body.data.items;
 for(const root of ['IWM','QQQ','SPY','UNG'])broker.projection.positions.push({status:'recognized',underlying:root,expiry:holdings.find(h=>h['underlying-symbol']===root)['expires-at']});
 const result=heldMarginEvidence(broker);assert.equal(result.status,'OBSERVED_QUALIFIED');assert.equal(result.riskGroups.length,4);assert.equal(result.positionBindings.filter(p=>p.buyingPowerFootprint!==null).length,4);assert.equal(result.reconciliation.sumGroupBuyingPower,2237);assert.equal(result.reconciliation.sumGroupMargin,3000);
});
test('full ZIP exposes exactly matched held BP and gross margin with source basis, leaving simulation impacts unknown',async()=>{
 const {exportCadence,child}=await import('./ww-export-tt1.mjs');const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=await mkdtemp(join(tmpdir(),'held-margin-package-'));
 try{
  const id='acct_'+'a'.repeat(32),rid='12345678-1234-4234-8234-123456789abc';
  const fetchImpl=async(url,opt)=>{assert.equal(opt.method,'GET');const path=new URL(url).pathname;const body=path==='/v2/accounts'?{requestId:rid,accounts:[{id,alias:'tt1',displayName:'synthetic',brokerAssociation:{broker:'TASTYTRADE'}}]}:path==='/api/evidence/snapshot'?{apiVersion:'1',generation:7,generatedAt:at,symbols:[]}:{observations:[],accounts:[]};return Response.json(body,{headers:{'x-request-id':rid}});};
  const result=await exportCadence({base:'http://localhost:9999',token:'synthetic-token',now:new Date(at),downloads:dir,fetchImpl,brokerRead:async()=>fixture(),sourceRevision:'synthetic'});
  const parsed=JSON.parse(await child('python3',['-c','import sys,zipfile,json; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({n:z.read(n).decode() for n in z.namelist()}))',result.path],''));
  const account=JSON.parse(parsed['tt1-account-positions-orders.json']),coverage=JSON.parse(parsed['evidence-coverage.json']);
  assert.equal(account.derivedPositions[0].actualBrokerBuyingPowerRequirement,250);assert.equal(account.derivedPositions[0].brokerHeldCapital.marginRequirement.amount,300);assert.equal(account.heldCapital.status,'OBSERVED_QUALIFIED');assert.equal(account.derivedPositions[0].brokerHeldCapital.openingBuyingPowerDebit,null);assert.equal(coverage.heldTradeBuyingPower.status,'OBSERVED_QUALIFIED');assert.match(result.summary,/Held BP: 1\/1 structures matched/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('overlapping sibling ownership cannot qualify even when opposite quantities cancel and totals match',()=>{
 const b=fixture(),base=group(b);base['buying-power']='150';base['margin-requirement']='200';
 for(const qty of ['-1','1'])b.reads[2].body.data.groups[0].groups.push({...base,'buying-power':'50','margin-requirement':'50','position-entries':[{...base['position-entries'][0],quantity:qty}]});
 const r=heldMarginEvidence(b);assert.equal(r.reconciliation.heldMembership,'MATCH');assert.equal(r.reconciliation.groupBpToAccountUsedBp,'MATCH');assert.equal(r.status,'PARTIAL');assert.equal(r.positionBindings[0].buyingPowerFootprint,null);assert.ok(r.issues.includes('OVERLAPPING_SIBLING_MARGIN_MEMBERSHIP'));
});
test('qualification requires same-session causal component clocks and the requested USD currency',()=>{
 for(const mutate of [
 b=>delete b.reads[1].body.data['updated-at'],
 b=>b.reads[1].body.data['updated-at']='2026-10-29T18:01:00Z',
 b=>b.reads[1].body.data['updated-at']='2025-01-01T18:00:00Z',
 b=>b.reads[1].retrievedAt='bad',
 b=>b.reads[0].retrievedAt='2026-10-28T18:00:00Z',
 b=>b.reads[0].retrievedAt='2026-10-29T18:01:00Z',
 b=>b.reads[2].body.data['last-state-timestamp']=Date.parse('2026-10-28T18:00:00Z'),
 b=>b.reads[1].body.data.currency='UNAVAILABLE',
 b=>b.reads[1].body.data.currency='EUR']){
 const b=fixture();mutate(b);const r=heldMarginEvidence(b);assert.equal(r.status,'PARTIAL');assert.equal(r.positionBindings[0].buyingPowerFootprint,null);
 }
});
