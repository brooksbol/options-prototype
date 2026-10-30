// Narrow standalone-tt adapter. ww never loads brokerage credentials in its process.
import {main as ttMain, PRODUCTION_BASE_URL, readOrders, readComplexOrders} from './tastytrade.mjs';
import {readHeldGreeks} from './tastytrade-greeks.mjs';
import {acquireCadenceMarket,CADENCE_SYMBOLS} from './tt-cadence-market.mjs';
import {projectLive} from './tastytrade-live.mjs';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const MAX=12*1024*1024;
async function boundedText(response){
 const reader=response.body.getReader(),chunks=[];let size=0;
 try {
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
   if(size>MAX){void reader.cancel().catch(()=>{});throw Error('BROKER_RESPONSE_TOO_LARGE');}
   chunks.push(value);
  }
  return Buffer.concat(chunks).toString();
 }finally{reader.releaseLock();}
}

export async function collectBroker({expectedAccount,allowSingleAccount=false,cadenceMarket=false,fetchImpl=fetch,env=process.env,readFile=readFileSync,now=()=>new Date()}={}) {
 const reads=[],failures=[],secrets=new Set(),numbers=new Set();let account,token,marketContactBlocked=false;
 const guarded=async(url,options)=>{
  const u=new URL(url);if(u.origin!==PRODUCTION_BASE_URL||options.redirect!=='error')throw Error('BROKER_ROUTE_DENIED');
  const method=options.method;
  const oauth=method==='POST'&&u.pathname==='/oauth/token';
  const allowed=method==='GET'&&(u.pathname==='/customers/me/accounts'||u.pathname==='/market-data/by-type'||u.pathname==='/market-time/equities/sessions/current'||/^\/accounts\/[A-Za-z0-9]+\/(?:positions|orders|complex-orders)$/.test(u.pathname));
  if(!oauth&&!allowed)throw Error('BROKER_ROUTE_DENIED');
  if(oauth)for(const v of Object.values(JSON.parse(options.body)))if(typeof v==='string'&&v!=='refresh_token')secrets.add(v);
  let r;try{r=await fetchImpl(url,options);}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'NETWORK_UNAVAILABLE'});throw Error('BROKER_NETWORK_UNAVAILABLE');}
  if(!oauth&&[401,403,429].includes(r.status))marketContactBlocked=true;
  let text;try{text=await boundedText(r);}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'RESPONSE_BODY_UNAVAILABLE'});throw Error('BROKER_BODY_UNAVAILABLE');}
  let body;try{body=JSON.parse(text);}catch{failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:'INVALID_RESPONSE_JSON'});throw Error('BROKER_INVALID_JSON');}
  const replay=new Response(text,{status:r.status,statusText:r.statusText,headers:r.headers});
  if(oauth){if(body.access_token){token=body.access_token;secrets.add(token);}return replay;}
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
   return replay;
  }
  if(!r.ok)failures.push({source:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),code:`HTTP_${r.status}`});
  else reads.push({path:u.pathname.replace(/\/accounts\/[^/]+/,'/accounts/tt1'),query:u.search,retrievedAt:now().toISOString(),body});
  return replay;
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
   if([401,403,429].includes(r.status))marketContactBlocked=true;
   const text=await boundedText(r);
   if(!r.ok)throw Error();
   reads.push({path:'/accounts/tt1/balances',query:'?currency=USD',retrievedAt:now().toISOString(),body:JSON.parse(text)});
  }catch{failures.push({source:'broker balances',code:'BALANCE_READ_UNAVAILABLE'});}
 }
 // Separately authorized held-margin GET. No preview/order endpoint is reachable.
 if(account&&token){
  try{
   const r=await fetchImpl(`${PRODUCTION_BASE_URL}/margin/accounts/${account}/requirements`,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',Authorization:`Bearer ${token}`}});
   if([401,403,429].includes(r.status))marketContactBlocked=true;
   const text=await boundedText(r);if(!r.ok)throw Error();const body=JSON.parse(text);
   if(body?.data?.['account-number']!==account||!Array.isArray(body.data.groups))throw Error();
   reads.push({path:'/margin/accounts/tt1/requirements',query:'',retrievedAt:now().toISOString(),body});
  }catch{failures.push({source:'broker held margin requirements',code:'HELD_MARGIN_READ_UNAVAILABLE'});}
 }
 // tt live may skip its session/quote reads when custody is empty. Candidate
 // discovery must still work for a flat TT1 account through the same GET route.
 if(cadenceMarket&&account&&token&&!reads.some(r=>r.path==='/market-time/equities/sessions/current'))try{
  await guarded(`${PRODUCTION_BASE_URL}/market-time/equities/sessions/current`,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',Authorization:`Bearer ${token}`}});
 }catch{failures.push({source:'candidate market session',code:'SESSION_UNAVAILABLE'});}
 const items=suffix=>reads.filter(r=>r.path.endsWith(suffix)).flatMap(r=>r.body?.data?.items??[]);
 const session=reads.find(r=>r.path==='/market-time/equities/sessions/current')?.body?.data;
 let projection=null;
 if(account&&!code)try{projection=projectLive({account,holdings:items('/positions'),orders:items('/orders'),complexOrders:items('/complex-orders'),quotes:items('/by-type'),now:now(),session,sessionCloseAt:session?.['close-at']});}catch{failures.push({source:'tt live projection',code:'PROJECTION_UNAVAILABLE'});}
 let marketAcquisition=null;
 if(cadenceMarket&&marketContactBlocked)marketAcquisition={mode:'UNKNOWN',startedAt:now().toISOString(),completedAt:now().toISOString(),catalogs:[],observations:[],failures:[{code:'BROKER_RATE_OR_PERMISSION_BLOCK'}]};
 if(cadenceMarket&&account&&token&&!marketContactBlocked){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
  try{marketAcquisition=await acquireCadenceMarket({session,sessionDate:date,now,readGreeks:async ({contracts,now,timeoutMs,loadQuoteToken})=>{const definitions=new Map(contracts.map(c=>[c.symbol,{data:{symbol:c.symbol,'streamer-symbol':c.streamerSymbol}}]));return readHeldGreeks({symbols:[...definitions.keys()],maxSymbols:6000,loadInstrument:async s=>definitions.get(s),loadQuoteToken,now,timeoutMs});},get:async (path,{timeoutMs})=>{
   const u=new URL(path,PRODUCTION_BASE_URL);
   const chain=/^\/option-chains\/([A-Z]+)\/nested$/.exec(u.pathname);
   if(u.origin!==PRODUCTION_BASE_URL||!(chain&&CADENCE_SYMBOLS.includes(chain[1])||u.pathname==='/market-data/by-type'||u.pathname==='/api-quote-tokens'))throw Error('MARKET_ROUTE_DENIED');
   if(u.pathname==='/market-data/by-type'&&((u.searchParams.get('equity-option')??'').split(',').length>99||!CADENCE_SYMBOLS.includes(u.searchParams.get('equity'))))throw Error('MARKET_BATCH_DENIED');
   const r=await fetchImpl(u,{method:'GET',redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{Accept:'application/json',Authorization:`Bearer ${token}`,'User-Agent':'wheelwright-tt1-cadence/1.0'}});
   if([401,403,429].includes(r.status))marketContactBlocked=true;
   if(!r.ok){void r.body?.cancel().catch(()=>{});throw Error('HTTP_'+r.status);}
   const text=await boundedText(r),body=JSON.parse(text);if(u.pathname==='/api-quote-tokens'&&typeof body?.data?.token==='string')secrets.add(body.data.token);return {body,retrievedAt:now().toISOString()};
  }});}catch{marketAcquisition={mode:'UNKNOWN',startedAt:now().toISOString(),completedAt:now().toISOString(),catalogs:[],observations:[],failures:[{code:'CANDIDATE_ACQUISITION_UNAVAILABLE'}]};}
 }
 const scrub=value=>{
  if(Array.isArray(value))return value.map(scrub);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!/(?:access.?token|refresh.?token|client.?secret|authorization|password)/i.test(k)).map(([k,v])=>[k,/account.?number/i.test(k)?'MASKED':scrub(v)]));
  if(typeof value==='string'){
   for(const secret of secrets)if(secret&&value.includes(secret))throw Error('SECRET_EXCLUSION_FAILED');
   for(const n of numbers)value=value.replaceAll(n,'MASKED');
  }return value;
 };
 return scrub({source:'tastytrade production via existing standalone tt',retrievedAt:now().toISOString(),accountLink:account?(expectedAccount?'MATCHED_BACKEND_REFERENCE':'SOLE_BROKER_ACCOUNT_OPERATOR_ESTABLISHED_TT1_CONTEXT'):'NOT_ESTABLISHED',complete:code===0&&failures.length===0,orderCoverage,reads,failures,projection,liveTsv:tsv,marketAcquisition});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{let input='';for await(const c of process.stdin){input+=c;if(input.length>4096)throw Error();}
 const result=await collectBroker(JSON.parse(input));process.stdout.write(JSON.stringify(result));
 }catch{process.stderr.write('TT1 broker evidence unavailable\n');process.exitCode=1;}
}
