// Bounded standalone TT1 evidence adapter, not a v2 acquisition service or margin model.
export const CADENCE_SYMBOLS=Object.freeze('IWM TLT SPY XLE XLF EWZ EEM HYG GDX SLV GLD QQQ USO IBIT'.split(' '));
// Existing v1 DEFAULT_CACHE_TTL.quoteFreshMs (v1-provisional), narrowed to this
// experimental export's quote-row qualification, not a new universal policy.
export const QUOTE_FRESH_MS=2*60*1000;
export const LIMITS=Object.freeze({contracts:6000,requests:80,durationMs:90000,batch:99,spacingMs:500});
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:typeof x==='string'&&/^-?\d+(?:\.\d+)?$/.test(x)&&Number.isFinite(Number(x))?Number(x):null;
const instant=x=>typeof x==='string'&&/(?:Z|[+-]\d\d:\d\d)$/.test(x)?Date.parse(x):NaN;
export function marketMode(session,at){
 const open=instant(session?.['open-at']),close=instant(session?.['close-at']),t=at.getTime();
 if(session?.state==='Open'&&Number.isFinite(open)&&Number.isFinite(close)&&open<=t&&t<close)return 'REGULAR';
 if(session?.state==='Closed'&&!(Number.isFinite(open)&&Number.isFinite(close)&&open<=t&&t<close))return 'CLOSED';
 return 'UNKNOWN';
}
export function catalogPuts(body,symbol,date){
 if(!Array.isArray(body?.data?.items))throw Error('INVALID_CHAIN_CATALOG');
 const out=[],keys=new Set();
 for(const g of body.data.items){
  if(g['underlying-symbol']!==symbol)throw Error('CATALOG_UNDERLYING_MISMATCH');
  // Adjusted/ambiguous contracts cannot silently occupy standard geometry.
  if(g['option-chain-type']!=='Standard'||num(g['shares-per-contract'])!==100)continue;
  for(const e of g.expirations??[]){
   const expiry=e['expiration-date'];if(typeof expiry!=='string'||!/^\d{4}-\d\d-\d\d$/.test(expiry))throw Error('INVALID_EXPIRATION');
   const dte=(Date.parse(expiry+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000;
   if(dte<38||dte>45||!Number.isFinite(dte))continue;
   if(!Array.isArray(e.strikes))throw Error('INVALID_STRIKE_CATALOG');
   for(const row of e.strikes){
    const strike=num(row['strike-price']),identity=row.put;
    const m=typeof identity==='string'?/^([A-Z0-9.]+) +(\d{6})P(\d{8})$/.exec(identity):null;
    if(!m||m[1]!==symbol||m[2]!==expiry.slice(2).replaceAll('-','')||Number(m[3])/1000!==strike||!(strike>0))throw Error('CONTRACT_IDENTITY_MISMATCH');
    const key=expiry+'|'+strike;if(keys.has(key))throw Error('AMBIGUOUS_STANDARD_GEOMETRY');keys.add(key);
    out.push({underlying:symbol,expiration:expiry,strike,symbol:identity,multiplier:100,deliverables:g.deliverables??null,chainType:g['option-chain-type'],settlementType:e['settlement-type']??null});
   }
  }
 }
 return out;
}
export function qualifyRow(row,spot,session,at){
 const issues=[],t=at.getTime(),clock=instant(row?.['updated-at']),spotClock=instant(spot?.['updated-at']),open=instant(session?.['open-at']);
 const mode=marketMode(session,at);
 if(mode!=='REGULAR')issues.push(mode==='CLOSED'?'MARKET_CLOSED_RETAINED_TEST_ONLY':'MARKET_SESSION_UNKNOWN');
 for(const [name,time] of [['OPTION',clock],['SPOT',spotClock]]){
  if(!Number.isFinite(time))issues.push(name+'_CLOCK_UNAVAILABLE');
  else if(time>t)issues.push(name+'_CLOCK_FUTURE');
  else if(t-time>QUOTE_FRESH_MS||!Number.isFinite(open)||time<open)issues.push(name+'_ROW_STALE_OR_PRIOR_SESSION');
 }
 const sb=num(spot?.bid),sa=num(spot?.ask),spotPrice=sb!==null&&sa!==null&&sb>0&&sa>=sb?(sb+sa)/2:null;
 if(spotPrice===null)issues.push('SPOT_TWO_SIDED_QUOTE_UNAVAILABLE');
 if(row?.['is-trading-halted']===true||spot?.['is-trading-halted']===true)issues.push('TRADING_HALTED');
 if(num(row?.delta)===null)issues.push('DELTA_UNAVAILABLE');
 return {eligible:issues.length===0,status:issues.length?'UNQUALIFIED':'RECENT_BROKER_ROW_GREEK_CLOCK_NOT_SEPARATE',issues,marketQuoteObservedAt:row?.['updated-at']??null,optionRowUpdatedAt:row?.['updated-at']??null,underlyingSpotObservedAt:spot?.['updated-at']??null,underlyingSpot:spotPrice,spotPriceConvention:'underlying bid/ask midpoint from same REST batch',evaluatedAt:at.toISOString(),optionAgeSeconds:Number.isFinite(clock)?(t-clock)/1000:null,spotAgeSeconds:Number.isFinite(spotClock)?(t-spotClock)/1000:null,greeksUpdatedAt:null,greeksTimeQualification:'delta/Greeks observed in the same returned broker row; updated-at is row update time, NOT independently verified Greek calculation time',freshnessRule:{maxAgeMs:QUOTE_FRESH_MS,basis:'existing v1 DEFAULT_CACHE_TTL.quoteFreshMs; operational TT1 row-age check, not execution or model equivalence guarantee'}};
}
export async function acquireCadenceMarket({get,session,sessionDate,now=()=>new Date(),pause=ms=>new Promise(r=>setTimeout(r,ms)),symbols=CADENCE_SYMBOLS}){
 const started=now(),mode=marketMode(session,started),result={schema:'tt1-market-acquisition/v1',mode,startedAt:started.toISOString(),completedAt:null,symbolsRequested:[...symbols],catalogs:[],observations:[],failures:[],requestCount:0,limits:LIMITS,session};
 if(mode!=='REGULAR'){result.completedAt=now().toISOString();return result;}
 let stop=false;
 const read=async path=>{
  if(stop||result.requestCount>=LIMITS.requests||now()-started>=LIMITS.durationMs)throw Error('ACQUISITION_CAP_REACHED');
  if(result.requestCount){
   if(LIMITS.durationMs-(now()-started)<=LIMITS.spacingMs)throw Error('ACQUISITION_CAP_REACHED');
   await pause(LIMITS.spacingMs);
  }
  const remaining=LIMITS.durationMs-(now()-started);
  if(remaining<=0)throw Error('ACQUISITION_CAP_REACHED');
  result.requestCount++;
  try{const r=await get(path,{timeoutMs:Math.min(10000,remaining)});if(now()-started>LIMITS.durationMs)throw Error('ACQUISITION_CAP_REACHED');return r;}catch(e){if(['HTTP_429','HTTP_401','HTTP_403'].includes(e.message))stop=true;throw e;}
 };
 for(const symbol of symbols){
  if(stop)break;
  try{const r=await read('/option-chains/'+symbol+'/nested');const contracts=catalogPuts(r.body,symbol,sessionDate);result.catalogs.push({symbol,retrievedAt:r.retrievedAt,contracts,unsupportedGroups:r.body.data.items.filter(g=>g['option-chain-type']!=='Standard'||num(g['shares-per-contract'])!==100).map(g=>({chainType:g['option-chain-type']??null,sharesPerContract:g['shares-per-contract']??null,rootSymbol:g['root-symbol']??null}))});}
  catch(e){result.failures.push({symbol,stage:'CATALOG',code:/^[A-Z0-9_]+$/.test(e.message)?e.message:'READ_FAILED'});if(e.message==='ACQUISITION_CAP_REACHED')stop=true;}
 }
 const total=result.catalogs.reduce((n,c)=>n+c.contracts.length,0);
 if(total>LIMITS.contracts){stop=true;result.failures.push({stage:'QUOTES',code:'CONTRACT_CAP_EXCEEDED'});}
 for(const catalog of result.catalogs){
  if(stop)break;
  for(let offset=0;offset<catalog.contracts.length;offset+=LIMITS.batch){
   const contracts=catalog.contracts.slice(offset,offset+LIMITS.batch),u=new URL('https://api.tastyworks.com/market-data/by-type');u.searchParams.set('equity',catalog.symbol);u.searchParams.set('equity-option',contracts.map(c=>c.symbol).join(','));
   try{
    const r=await read(u.pathname+u.search);const rows=r.body?.data?.items;if(!Array.isArray(rows))throw Error('INVALID_QUOTE_RESPONSE');
    const selected=new Set([...contracts.map(c=>c.symbol),catalog.symbol]),seen=new Set();
    for(const q of rows){if(!selected.has(q.symbol)||seen.has(q.symbol)||q['instrument-type']!==(q.symbol===catalog.symbol?'Equity':'Equity Option'))throw Error('QUOTE_IDENTITY_MISMATCH');seen.add(q.symbol);}
    const spot=rows.find(q=>q.symbol===catalog.symbol)??null;
    if(selected.size!==seen.size)result.failures.push({symbol:catalog.symbol,stage:'QUOTES',offset,code:'MISSING_REQUESTED_QUOTE_ROWS',missing:selected.size-seen.size});
    for(const contract of contracts)result.observations.push({contract,retrievedAt:r.retrievedAt,quote:rows.find(q=>q.symbol===contract.symbol)??null,underlyingQuote:spot});
   }catch(e){result.failures.push({symbol:catalog.symbol,stage:'QUOTES',offset,code:/^[A-Z0-9_]+$/.test(e.message)?e.message:'READ_FAILED'});if(e.message==='ACQUISITION_CAP_REACHED')stop=true;}
   if(stop)break;
  }
 }
 result.completedAt=now().toISOString();result.modeAtCompletion=marketMode(session,now());result.unvisitedSymbols=symbols.filter(s=>!result.catalogs.some(c=>c.symbol===s));return result;
}
export function brokerMarketSnapshot(acquisition,at){
 const symbols=[];
 for(const catalog of acquisition.catalogs){
  const chains=[];
  for(const expiration of [...new Set(catalog.contracts.map(c=>c.expiration))]){
   const observations=acquisition.observations.filter(o=>o.contract.underlying===catalog.symbol&&o.contract.expiration===expiration);
   if(!observations.length)continue;
   const puts=observations.map(o=>{const q=o.quote,ev=qualifyRow(q,o.underlyingQuote,acquisition.session,at);return {strike:o.contract.strike,symbol:o.contract.symbol,multiplier:o.contract.multiplier,deliverables:o.contract.deliverables,bid:num(q?.bid),ask:num(q?.ask),delta:num(q?.delta),gamma:num(q?.gamma),theta:num(q?.theta),vega:num(q?.vega),rho:num(q?.rho),volume:num(q?.volume),openInterest:num(q?.['open-interest']),marketEvidence:{...ev,retrievedAt:o.retrievedAt,rawQuote:q,rawUnderlyingQuote:o.underlyingQuote}};});
   const retrieved=observations.map(o=>o.retrievedAt).sort().at(-1);
   chains.push({expiration,retrievedAt:retrieved,chainAcquisitionProvenance:{kind:'chain-acquired',acquiredAt:retrieved},tt1Source:{system:'Tastytrade production REST candidate snapshots',generation:null,observationKind:'BROKER_ROW_SNAPSHOT',session:acquisition.session,greeksTimeQualification:'No independent Greek clock; preserve broker row timestamps',catalogRetrievedAt:catalog.retrievedAt},admissibility:{admissible:acquisition.modeAtCompletion==='REGULAR',basis:'explicit regular-session REST read; per-leg row qualification also required'},data:{symbol:catalog.symbol,expiration,underlying:{price:puts[0]?.marketEvidence.underlyingSpot??null},puts}});
  }
  symbols.push({symbol:catalog.symbol,expirations:[...new Set(catalog.contracts.map(c=>c.expiration))].map(date=>({date})),chains});
 }
 return {apiVersion:'1',generation:0,generatedAt:acquisition.completedAt,symbols};
}
