// Narrow standalone-tt adapter. ww never loads brokerage credentials in its process.
import {main as ttMain, PRODUCTION_BASE_URL, readOrders, readComplexOrders} from './tastytrade.mjs';
import {projectLive} from './tastytrade-live.mjs';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const MAX=12*1024*1024;
async function boundedText(response){
 const chunks=[];let size=0;
 for await(const chunk of response.body){size+=chunk.length;if(size>MAX)throw Error('BROKER_RESPONSE_TOO_LARGE');chunks.push(chunk);}
 return Buffer.concat(chunks).toString();
}
export async function collectBroker({expectedAccount,allowSingleAccount=false,fetchImpl=fetch,env=process.env,readFile=readFileSync,now=()=>new Date()}={}) {
 const reads=[],failures=[],secrets=new Set(),numbers=new Set();let account,token;
 const guarded=async(url,options)=>{
  const u=new URL(url);if(u.origin!==PRODUCTION_BASE_URL||options.redirect!=='error')throw Error('BROKER_ROUTE_DENIED');
  const method=options.method;
  const oauth=method==='POST'&&u.pathname==='/oauth/token';
  const allowed=method==='GET'&&(u.pathname==='/customers/me/accounts'||u.pathname==='/market-data/by-type'||u.pathname==='/market-time/equities/sessions/current'||/^\/accounts\/[A-Za-z0-9]+\/(?:positions|orders|complex-orders)$/.test(u.pathname));
  if(!oauth&&!allowed)throw Error('BROKER_ROUTE_DENIED');
  if(oauth)for(const v of Object.values(JSON.parse(options.body)))if(typeof v==='string'&&v!=='refresh_token')secrets.add(v);
  let r;try{r=await fetchImpl(url,options);}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'NETWORK_UNAVAILABLE'});throw Error('BROKER_NETWORK_UNAVAILABLE');}
  let text;try{text=await boundedText(r.clone());}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'RESPONSE_BODY_UNAVAILABLE'});throw Error('BROKER_BODY_UNAVAILABLE');}
  let body;try{body=JSON.parse(text);}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'INVALID_RESPONSE_JSON'});throw Error('BROKER_INVALID_JSON');}
  if(oauth){if(body.access_token){token=body.access_token;secrets.add(token);}return r;}
  if(u.pathname==='/customers/me/accounts'){
   const items=body?.data?.items;
   if(!r.ok||!Array.isArray(items)||items.length!==1)throw Error('BROKER_SINGLE_ACCOUNT_REQUIRED');
   const candidate=items[0]?.account?.['account-number'];
   if(typeof candidate!=='string'||!/^[A-Za-z0-9]+$/.test(candidate))throw Error('BROKER_ACCOUNT_INVALID');numbers.add(candidate);
   // Native reference is resolved by existing backend Account discovery, never a new alias registry.
   if(!expectedAccount&&!allowSingleAccount)throw Error('TT1_ACCOUNT_LINK_UNVERIFIED');
   if(expectedAccount&&(!expectedAccount.match(/[A-Za-z0-9]{4}$/)||!candidate.endsWith(expectedAccount.match(/[A-Za-z0-9]{4}$/)[0])))throw Error('TT1_ACCOUNT_LINK_UNVERIFIED');
   if(expectedAccount&&/^[A-Za-z0-9]+$/.test(expectedAccount)&&expectedAccount!==candidate)throw Error('TT1_ACCOUNT_LINK_MISMATCH');
   account=candidate;
   return r;
  }
  if(!r.ok)failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:`HTTP_${r.status}`});
  else reads.push({path:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),query:u.search,retrievedAt:now().toISOString(),body});
  return r;
 };
 let tsv='';const code=await ttMain(['live','--tsv'],{env,readFile,fetchImpl:guarded,out:s=>{tsv=s;},err:()=>{},now});
 if(code)failures.push({source:'tt live --tsv',code:'BROKER_READ_INCOMPLETE'});
 // Inventory may be empty while orders reserve capital or create exposure. Reuse
 // tt's exact pagination validators even when its presentation shortcut skips them.
 const orderCoverage={};
 for(const [resource,reader] of [['orders',readOrders],['complex-orders',readComplexOrders]]) {
  if(account&&token&&!reads.some(r=>r.path.endsWith('/'+resource))) {
   try {
    await reader(page=>guarded(`${PRODUCTION_BASE_URL}/accounts/${account}/${resource}?page-offset=${page}&per-page=100`,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',Authorization:`Bearer ${token}`}}).then(r=>r.json()));
    orderCoverage[resource]='COMPLETE';
   }catch{orderCoverage[resource]='INCOMPLETE';failures.push({source:resource,code:'ORDER_COVERAGE_INCOMPLETE'});}
  }else orderCoverage[resource]=code===0&&reads.some(r=>r.path.endsWith('/'+resource))?'COMPLETE':'INCOMPLETE';
 }

 // Existing broker balance GET used by TastytradeClient.settledCashBalance, with
 // no backend admission, sync, market refresh, credential writes or order writes.
 if(account&&token){
  try{
   const r=await fetchImpl(`${PRODUCTION_BASE_URL}/accounts/${account}/balances?currency=USD`,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',Authorization:`Bearer ${token}`}});
   const text=await boundedText(r);
   if(!r.ok)throw Error();
   reads.push({path:'/accounts/tt1/balances',query:'?currency=USD',retrievedAt:now().toISOString(),body:JSON.parse(text)});
  }catch{failures.push({source:'broker balances',code:'BALANCE_READ_UNAVAILABLE'});}
 }
 const items=suffix=>reads.filter(r=>r.path.endsWith(suffix)).flatMap(r=>r.body?.data?.items??[]);
 const session=reads.find(r=>r.path==='/market-time/equities/sessions/current')?.body?.data;
 let projection=null;
 if(account&&!code)try{projection=projectLive({account,holdings:items('/positions'),orders:items('/orders'),complexOrders:items('/complex-orders'),quotes:items('/by-type'),now:now(),session,sessionCloseAt:session?.['close-at']});}catch{failures.push({source:'tt live projection',code:'PROJECTION_UNAVAILABLE'});}
 const scrub=value=>{
  if(Array.isArray(value))return value.map(scrub);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!/(?:access.?token|refresh.?token|client.?secret|authorization|password)/i.test(k)).map(([k,v])=>[k,/account.?number/i.test(k)?'MASKED':scrub(v)]));
  if(typeof value==='string'){
   for(const secret of secrets)if(secret&&value.includes(secret))throw Error('SECRET_EXCLUSION_FAILED');
   for(const n of numbers)value=value.replaceAll(n,'MASKED');
  }return value;
 };
 return scrub({source:'tastytrade production via existing standalone tt',retrievedAt:now().toISOString(),accountLink:account?(expectedAccount?'MATCHED_BACKEND_REFERENCE':'SOLE_BROKER_ACCOUNT_OPERATOR_ESTABLISHED_TT1_CONTEXT'):'NOT_ESTABLISHED',complete:code===0&&failures.length===0,orderCoverage,reads,failures,projection,liveTsv:tsv});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{let input='';for await(const c of process.stdin){input+=c;if(input.length>4096)throw Error();}
 const result=await collectBroker(JSON.parse(input));process.stdout.write(JSON.stringify(result));
 }catch{process.stderr.write('TT1 broker evidence unavailable\n');process.exitCode=1;}
}
