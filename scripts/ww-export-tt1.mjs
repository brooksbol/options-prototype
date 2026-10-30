import {brokerMarketSnapshot,CADENCE_SYMBOLS} from './tt-cadence-market.mjs';
import {heldMarginEvidence} from './ww-held-margin.mjs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {buildSymbolLiquidity,symbolLiquidityCsv,CALENDAR_2026} from './ww-v1-shared.mjs';
import {resolveAccount} from './ww-accounts.mjs';

export const EXPORT_HELP=`Usage: ww export tt1-cadence [-v | --verbose]
       ww export tt1-cadence --help

Export one self-describing ZIP to ~/Downloads (atomic, never overwrites).
Reads held v1 chains, pure retained v2 TT1 balances/inventory and standalone
production tt GET evidence, balances, held margin and bounded regular-session\ncandidate chain catalogs/quotes. Closed sessions retain v1 test evidence.
Never syncs, refreshes, forces acquisition, or transmits/modifies orders.
38–45 calendar DTE; short puts |delta| 0.20–0.30; every retained lower long
strike, no long-delta or width cap. Independent-leg credits are indicative.
The liquidity CSV uses the exact v1 calculation and browser CSV schema.
Partial/stale/denied evidence and missing contract terms remain explicit.
Current balances come only from an actual broker response, never retained BP.
Requires existing local v1 service, ww/tt credentials, Node24 and Python3.
No setup flags, secrets, raw dumps or logs are written into Downloads.`;
export const FILTER=Object.freeze({minDte:38,maxDte:45,optionType:'puts',minAbsDelta:.2,maxAbsDelta:.3});
export const SYMBOLS=CADENCE_SYMBOLS;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
// Usability is a source-fact contract, independent of transport wrapper existence.
export function observedNumber(value){
 if(finite(value))return value;
 if(typeof value!=='string'||!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value))return null;
 const parsed=Number(value);return Number.isFinite(parsed)?parsed:null;
}
export function hasFinancialEvidence({snapshot,broker,retained,inventory}){
 if(snapshot)return true; // snapshot shape/geometry is validated before publication.
 const brokerFact=broker?.reads?.some(r=>{
  const items=r.body?.data?.items;
  if(r.path.endsWith('/positions'))return Array.isArray(items)&&items.every(h=>
   typeof h?.symbol==='string'&&h.symbol.length>0&&observedNumber(h.quantity)!==null&&['Long','Short'].includes(h['quantity-direction']));
  if(/\/(?:orders|complex-orders)$/.test(r.path))return Array.isArray(items)&&
   (items.length>0?items.every(o=>typeof o?.id==='string'&&o.id.length>0||finite(o?.id)):
    broker.orderCoverage?.[r.path.split('/').at(-1)]==='COMPLETE');
  if(r.path==='/margin/accounts/tt1/requirements')return Array.isArray(r.body?.data?.groups)&&observedNumber(r.body.data['margin-requirement'])!==null;
  if(r.path.endsWith('/balances'))return ['derivative-buying-power','cash-balance','net-liquidating-value'].some(k=>observedNumber(r.body?.data?.[k])!==null);
  return false;
 });
 const retainedFact=retained?.observations?.some(o=>o.fields?.some(f=>f.status==='REPORTED'&&observedNumber(f.value)!==null));
 const inventoryFact=inventory?.accounts?.some(a=>a.readComplete===true&&Array.isArray(a.options)&&a.options.every(o=>
  typeof o?.sourceIdentifier==='string'&&observedNumber(o.quantity)!==null));
 return Boolean(brokerFact||retainedFact||inventoryFact);
}
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v,2)+'\n';
const sha=s=>createHash('sha256').update(s).digest('hex');
export const nyDate=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
const epoch=date=>{if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return NaN;const x=Date.parse(date+'T00:00:00Z');return Number.isFinite(x)&&new Date(x).toISOString().slice(0,10)===date?x:NaN;};
export const dte=(expiry,date)=>(epoch(expiry)-epoch(date))/86400000;
export function sessionContext(now){
 const calendarDate=nyDate(now);if(Number(calendarDate.slice(0,4))!==CALENDAR_2026.year)throw Error('Trading calendar year unsupported; no package written');
 let sessionDate=calendarDate;
 const trading=s=>![0,6].includes(new Date(epoch(s)).getUTCDay())&&!CALENDAR_2026.holidays.includes(s);
 for(let i=0;!trading(sessionDate)&&i<10;i++)sessionDate=new Date(epoch(sessionDate)-86400000).toISOString().slice(0,10);
 return {sessionDate,newYorkCalendarDate:calendarDate,isTradingDay:calendarDate===sessionDate,calendarVersion:CALENDAR_2026.version,dteConvention:'expiration date minus sessionDate, calendar days in America/New_York; nontrading dates use most recent trading session',nonTradingDayQualification:calendarDate===sessionDate?null:'Retained prior-session analysis, not current-calendar-date DTE or a new entry session'};
}
// Exact decimal rational arithmetic for prices/widths; raw Greeks are never recomputed.
function rational(x){const m=String(x).match(/^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);if(!m)throw Error('Invalid numeric evidence');const scale=(m[3]?.length??0)-Number(m[4]??0);let n=BigInt((m[1]??'')+m[2]+(m[3]??'')),den=1n;if(scale>=0)den=10n**BigInt(scale);else n*=10n**BigInt(-scale);return {n,den};}
const sub=(a,b)=>({n:a.n*b.den-b.n*a.den,den:a.den*b.den});
const add=(a,b)=>({n:a.n*b.den+b.n*a.den,den:a.den*b.den});
const number=a=>Number(a.n)/Number(a.den);
const zero={n:0n,den:1n};
const less=(a,b)=>a.n*b.den<b.n*a.den;
export function quoteQuality(c){if(!finite(c.bid)||!finite(c.ask))return 'MISSING';if(c.bid<0||c.ask<0||c.ask<c.bid)return 'INVALID_OR_CROSSED';if(c.ask===0)return 'ZERO_BOTH_UNUSABLE';return c.bid===0?'ZERO_BID':'POSITIVE_TWO_SIDED';}
export function pairEconomics(short,long){
 const width=sub(rational(short.strike),rational(long.strike));const sq=quoteQuality(short),lq=quoteQuality(long);
 const usable=[sq,lq].every(q=>['POSITIVE_TWO_SIDED','ZERO_BID'].includes(q));
 const natural=usable?sub(rational(short.bid),rational(long.ask)):null;
 const both=usable?sub(add(rational(short.bid),rational(short.ask)),add(rational(long.bid),rational(long.ask))):null;
 const mid=both?{n:both.n,den:both.den*2n}:null;
 const calc=credit=>{const loss=credit?sub(width,credit):null;return {creditPerShare:credit?number(credit):null,maxLossPerShare:loss?number(loss):null,creditToMaxLoss:loss&&less(zero,loss)?number(credit)/number(loss):null,conditionalCreditDollars100:credit?number(credit)*100:null,conditionalMaxLossDollars100:loss?number(loss)*100:null,p50ClosingDebitIfThisWereOpeningFill:credit&&less(zero,credit)?number(credit)/2:null};};
 const exclusions=[];if(!usable)exclusions.push('MISSING_INVALID_OR_UNUSABLE_LEG_QUOTES');if(natural&&!less(zero,natural))exclusions.push('NONPOSITIVE_NATURAL_CREDIT');if(natural&&!less(natural,width))exclusions.push('NATURAL_CREDIT_AT_OR_ABOVE_WIDTH');
 return {width:number(width),natural:calc(natural),midpoint:calc(mid),shortQuoteQuality:sq,longQuoteQuality:lq,exclusions};
}
export function buildMarket(snapshot,context,at){
 if(!snapshot||snapshot.apiVersion!=='1'||!Array.isArray(snapshot.symbols)||!Number.isSafeInteger(snapshot.generation))throw Error('Invalid v1 snapshot; no package written');
 const coverage=[],contracts=[],verticalPairs=[];let backendDteMismatches=0;
 for(const symbol of SYMBOLS){
  const sym=snapshot.symbols.find(s=>s.symbol===symbol);const eligible=e=>Number.isFinite(dte(e,context.sessionDate))&&dte(e,context.sessionDate)>=38&&dte(e,context.sessionDate)<=45;
  const listed=(sym?.expirations??[]).filter(e=>eligible(e.date));
  for(const e of sym?.expirations??[])if(finite(e.dte)&&e.dte!==dte(e.date,context.sessionDate))backendDteMismatches++;
  const chains=(sym?.chains??[]).filter(c=>eligible(c.expiration));
  const expirations=[];
  for(const chain of chains){
   const data=chain.data;if(data?.symbol!==symbol||data.expiration!==chain.expiration||!Array.isArray(data.puts))throw Error('Mismatched or malformed retained chain; no package written');
   const exp=chain.expiration;const acquired=chain.chainAcquisitionProvenance?.kind==='chain-acquired'?chain.chainAcquisitionProvenance.acquiredAt:null;
   const clock=typeof acquired==='string'?Date.parse(acquired):NaN;
   const source={system:'Wheelwright v1 normalized Tradier chain',generation:snapshot.generation,chainAcquiredAt:acquired,acquisitionAgeEvaluatedAt:at.toISOString(),chainAcquisitionAgeSeconds:Number.isFinite(clock)?(at.getTime()-clock)/1000:null,marketQuoteObservedAt:null,underlyingSpotObservedAt:null,underlyingSpot:data.underlying?.price??null,environment:chain.environmentProvenance??null,backendAdmissibility:chain.admissibility??null,greeksTimeQualification:'provider-local zone-unspecified string; never converted to UTC',...(chain.tt1Source??{})};
   // Same cent-strike deduplication (last wins) as the accepted v1 width discovery.
   const byStrike=new Map();for(const c of data.puts){if(finite(c.strike)&&c.strike>0)byStrike.set(Math.round(c.strike*100),c);}
   const puts=[...byStrike.values()].sort((a,b)=>a.strike-b.strike);
   const shorts=puts.filter(p=>finite(p.delta)&&p.delta>=-.3&&p.delta<=-.2);
   const before=verticalPairs.length;
   for(const c of puts)contracts.push({underlying:symbol,expiration:exp,dte:dte(exp,context.sessionDate),optionType:'PUT',geometryKey:`${symbol}|${exp}|PUT|${c.strike}`,observedContractIdentity:c.symbol??null,observedMultiplier:c.multiplier??null,observedDeliverable:c.deliverables??null,exchange:null,observed:c,shortDeltaEligible:shorts.includes(c),quoteQuality:quoteQuality(c),source:{...source,...(c.marketEvidence??{}),providerGreeksUpdatedAt:c.greeksUpdatedAt??null},openInterestQualification:chain.tt1Source?(c.openInterest==null?'MISSING':c.openInterest===0?'BROKER_REPORTED_ZERO':'BROKER_REPORTED'):c.openInterest===0?'NORMALIZED_ZERO_SOURCE_MISSING_VS_ZERO_UNRESOLVED_BUG_055':c.openInterest==null?'MISSING':'NORMALIZED_REPORTED',volumeQualification:chain.tt1Source?(c.volume==null?'MISSING':c.volume===0?'BROKER_REPORTED_ZERO':'BROKER_REPORTED'):c.volume===0?'NORMALIZED_ZERO_SOURCE_MISSING_VS_ZERO_UNRESOLVED':c.volume==null?'MISSING':'NORMALIZED_REPORTED'});
   for(const s of shorts)for(const l of puts){if(l.strike>=s.strike)continue;
    const economics=pairEconomics(s,l);
    if(!chain.tt1Source)economics.exclusions.push('RETAINED_NOT_CURRENT_TRADE_EVIDENCE');
    for(const [leg,c] of [['SHORT',s],['LONG',l]])if(chain.tt1Source&&c.marketEvidence?.eligible!==true)economics.exclusions.push(...(c.marketEvidence?.issues??['ROW_QUALIFICATION_UNAVAILABLE']).map(x=>leg+'_'+x));
    if(chain.admissibility?.admissible!==true)economics.exclusions.push('BACKEND_INADMISSIBLE_OR_UNKNOWN');
    if(!Number.isFinite(clock)||clock>at.getTime())economics.exclusions.push('ACQUISITION_CLOCK_UNAVAILABLE_OR_FUTURE');
    verticalPairs.push({underlying:symbol,expiration:exp,dte:dte(exp,context.sessionDate),shortStrike:s.strike,shortDelta:s.delta,longStrike:l.strike,longDelta:l.delta??null,shortBid:s.bid??null,shortAsk:s.ask??null,longBid:l.bid??null,longAsk:l.ask??null,shortVolume:s.volume??null,longVolume:l.volume??null,shortOpenInterest:s.openInterest??null,longOpenInterest:l.openInterest??null,...economics,status:!chain.tt1Source?'RETAINED_TEST_ONLY':economics.exclusions.length?'EXCLUDED':'RECENT_BROKER_SNAPSHOT_INDICATIVE_NOT_EXECUTABLE',source:{...source,shortObservation:s.marketEvidence??null,longObservation:l.marketEvidence??null},observedMultiplier:s.multiplier??null,conditionalMultiplier:100,timeExit21DteDate:new Date(epoch(exp)-21*86400000).toISOString().slice(0,10)});
    if(verticalPairs.length>200000)throw Error('Pair capacity exceeded; no truncated package written');
   }
   expirations.push({expiration:exp,dte:dte(exp,context.sessionDate),puts:puts.length,eligibleShorts:shorts.length,pairs:verticalPairs.length-before,source,strikeCoverageComplete:'NOT_ESTABLISHED'});
  }
  coverage.push({symbol,listedEligibleExpirations:listed.map(e=>e.date),observedExpirations:expirations,preferredObservedExpiration:[...expirations].sort((a,b)=>Math.abs(45-a.dte)-Math.abs(45-b.dte)||a.expiration.localeCompare(b.expiration))[0]?.expiration??null,missingListedExpirations:listed.map(e=>e.date).filter(e=>!expirations.some(x=>x.expiration===e)),status:chains.length?'RETAINED_OBSERVATIONS':'NOT_AVAILABLE'});
 }
 if(contracts.length>20000)throw Error('Contract capacity exceeded');
 return {schema:'tt1-cadence-market/v1',...context,sourceGeneration:snapshot.generation,sourcePublishedAt:snapshot.generatedAt,parameters:{...FILTER,symbols:SYMBOLS,universeStanding:'14 ETF research candidates from operator experiment; not qualified automatically. CSV separately covers the entire v1 snapshot universe.',widthRestriction:null,longDeltaRestriction:null,expirationPreference:'closest available to45; all eligible observed expirations preserved'},conventions:{natural:'short bid minus long ask',midpoint:'short midpoint minus long midpoint',execution:'independent leg indications, not executable complex-order quotes',maxLoss:'width minus indicative credit, excluding fees/assignment complications',multiplier:'Observed standard100-share broker catalog when supplied; retained Tradier100 remains conditional. Exchange/exercise terms are not independently established.',p50:'50% of actual opening maximum credit; candidate value is hypothetical until filled',timeExit:'21 calendar DTE; whichever exit occurs first; operator controls execution'},backendDteMismatches,coverage,contracts,verticalPairs};
}
export function validateMarket(market){
 const expected=new Map();for(const c of market.contracts){if(!finite(c.observed.strike)||c.observed.strike<=0)throw Error('Contract geometry invalid');const key=`${c.underlying}|${c.expiration}`;if(!expected.has(key))expected.set(key,[]);expected.get(key).push(c);}
 let total=0;for(const group of expected.values())for(const s of group.filter(c=>c.shortDeltaEligible))total+=group.filter(l=>l.observed.strike<s.observed.strike).length;
 if(total!==market.verticalPairs.length)throw Error('Exhaustive pair validation failed');
 for(const p of market.verticalPairs){
  if(p.shortDelta>-.2||p.shortDelta<-.3||p.longStrike>=p.shortStrike||Math.abs(p.width-(p.shortStrike-p.longStrike))>1e-8)throw Error('Pair geometry validation failed');
  for(const mode of ['natural','midpoint'])if(p[mode].creditPerShare!==null){const credit=mode==='natural'?p.shortBid-p.longAsk:(p.shortBid+p.shortAsk-p.longBid-p.longAsk)/2;
   if(Math.abs(credit-p[mode].creditPerShare)>1e-8)throw Error('Credit validation failed');
   const payoff=x=>credit-Math.max(p.shortStrike-x,0)+Math.max(p.longStrike-x,0);
   const risk=-Math.min(...[0,p.longStrike,p.shortStrike,p.shortStrike+p.width].map(payoff));
   if(Math.abs(risk-p[mode].maxLossPerShare)>1e-8)throw Error('Payoff validation failed');
  }
 }
}
export function child(program,args,input,{max=32*1024*1024,timeout=120000}={}){return new Promise((resolve,reject)=>{
 const proc=spawn(program,args,{stdio:['pipe','pipe','pipe']});const chunks=[];let size=0,done=false;
 const timer=setTimeout(()=>{proc.kill('SIGTERM');finish(Error('Bounded helper timed out'));},timeout);
 const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(result);};
 proc.on('error',()=>finish(Error('Required export helper unavailable')));proc.stdin.on('error',()=>{});
 proc.stdout.on('data',c=>{size+=c.length;if(size>max){proc.kill('SIGTERM');finish(Error('Helper capacity exceeded'));}else chunks.push(c);});
 proc.stderr.on('data',()=>{});proc.on('close',code=>finish(code===0?null:Error('Export helper failed'),Buffer.concat(chunks).toString()));proc.stdin.end(input);
});}
export async function boundedJson(url,{fetchImpl=fetch,headers={},max=128*1024*1024}={}){
 const u=new URL(url);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Unsafe evidence endpoint');
 const r=await fetchImpl(u,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error(`HTTP_${r.status}`);const chunks=[];let size=0;
 for await(const c of r.body){size+=c.length;if(size>max){await r.body.cancel?.().catch(()=>{});throw Error('Evidence capacity exceeded');}chunks.push(c);}
 const text=Buffer.concat(chunks).toString();let body;try{body=JSON.parse(text);}catch{throw Error('Invalid evidence JSON');}
 return {retrievedAt:new Date().toISOString(),body,sha256:sha(text)};
}
const sanitize=value=>Array.isArray(value)?value.map(sanitize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!/(?:access.?token|refresh.?token|client.?secret|authorization|password)/i.test(k)).map(([k,v])=>[k,/account.?number/i.test(k)?'MASKED':sanitize(v)])):value;
export function balanceEvidence(broker,retained,context){
 const response=broker?.reads?.find(r=>r.path.endsWith('/balances'));const data=response?.body?.data;
 const amount=observedNumber;
 const sourceAt=typeof data?.['updated-at']==='string'&&Number.isFinite(Date.parse(data['updated-at']))?data['updated-at']:null;
 const bp=amount(data?.['derivative-buying-power']),nlv=amount(data?.['net-liquidating-value']);
 return {brokerResponse:response??null,availableOptionsBuyingPower:bp,netLiquidatingValue:nlv,observedAt:sourceAt,retrievedAt:response?.retrievedAt??null,currentBpEstablished:bp!==null&&sourceAt!==null&&nyDate(new Date(sourceAt))===context.newYorkCalendarDate&&Date.parse(sourceAt)<=Date.parse(response.retrievedAt),currentness:response?'BROKER_CURRENT_BALANCE_ENDPOINT_RESPONSE_NOT_ATOMIC_WITH_OTHER_READS':'NOT_ESTABLISHED',qualification:response?'Direct broker response; use its updated-at as-of. No guarantee of post-read orderability, reservation stability or atomic alignment with positions. Never subtract committed BP again.':'No current balance inferred from retained observations.',retainedObservations:retained?.body??null};
}
const README=await readFile(new URL('../docs/cli/tt1-cadence-package-readme.md',import.meta.url),'utf8');
export async function exportCadence({base,token,now=new Date(),downloads=join(homedir(),'Downloads'),fetchImpl=fetch,brokerRead,sourceRevision}={}){
 const context=sessionContext(now),failures=[],sources=[];
 const attempt=async(name,fn)=>{try{const r=await fn();sources.push({name,retrievedAt:r.retrievedAt??new Date().toISOString(),status:'READ',sha256:r.sha256??null});return r;}catch(error){const code=/^HTTP_\d+$/.test(error.message)?error.message:'READ_UNAVAILABLE';failures.push({source:name,code});return null;}};
 // Preserve v1's existing deployment address, separately from configured v2 port.
 const snapshot=await attempt('v1 held snapshot',()=>boundedJson('http://localhost:3100/api/evidence/snapshot',{fetchImpl}));
 const account=await attempt('TT1 authorized discovery',async()=>({body:await resolveAccount('tt1',token,{base,fetchImpl})}));
 let retained=null,inventory=null,broker=null;
 if(account){
  const id=account.body.id;const request=async path=>{const u=new URL(path,base);u.searchParams.set('accountId',id);return boundedJson(u,{fetchImpl,headers:{Authorization:`Bearer ${token}`},max:4*1024*1024});};
  [retained,inventory]=await Promise.all([attempt('v2 retained balances',()=>request('/v2/account-balance-observations')),attempt('v2 retained option inventory',()=>request('/v2/option-inventory'))]);
  const expected=account.body.brokerAssociation?.accountNumber??account.body.brokerAssociation?.maskedAccountNumber??account.body.maskedAccountNumber;
  broker=await attempt('standalone tt broker GETs',async()=>({body:brokerRead?await brokerRead(expected):JSON.parse(await child(process.execPath,[fileURLToPath(new URL('./tt-cadence-evidence.mjs',import.meta.url))],JSON.stringify({expectedAccount:expected,allowSingleAccount:account.body.brokerAssociation?.broker==='TASTYTRADE',cadenceMarket:true}),{timeout:240000}))}));
 }
 if(!hasFinancialEvidence({snapshot,broker:broker?.body,retained:retained?.body,inventory:inventory?.body}))throw Error('No usable evidence retrieved; no package written');
 // Acquisition can finish after export starts; never mislabel that interval as
 // a future quote. Age is evaluated at snapshot receipt (or later injected now).
 const evaluatedAt=new Date(Math.max(now.getTime(),Date.parse(snapshot?.retrievedAt??'')||0));
 const acquisition=broker?.body?.marketAcquisition??null;
 const marketAt=new Date(Math.max(evaluatedAt.getTime(),Date.parse(acquisition?.completedAt??'')||0));
 const fresh=acquisition?.mode==='REGULAR'&&acquisition.observations?.length?brokerMarketSnapshot(acquisition,marketAt):null;
 const retainedMarket=snapshot?buildMarket(snapshot.body,context,evaluatedAt):null;
 const market=fresh?buildMarket(fresh,context,marketAt):snapshot?buildMarket(snapshot.body,context,evaluatedAt):{schema:'tt1-cadence-market/v1',...context,coverage:[],contracts:[],verticalPairs:[],backendDteMismatches:0,status:'NOT_AVAILABLE',parameters:{...FILTER,symbols:SYMBOLS}};
 market.acquisition=acquisition;market.retainedMarketEvidence=retainedMarket;market.sourceMode=fresh?'BROKER_CANDIDATE_SNAPSHOTS':acquisition?.mode==='CLOSED'?'OFF_HOURS_RETAINED_TEST_ONLY':'NO_CURRENT_BROKER_MARKET_EVIDENCE';
 if(fresh){market.sourceGeneration=null;market.retainedV1Generation=snapshot?.body.generation??null;market.sourcePublishedAt=acquisition.completedAt;}
 validateMarket(market);
 const liquidity=buildSymbolLiquidity(snapshot?.body.symbols??[],FILTER);
 // Same default ascending median-spread sort; stable ties and missing-last as v1.
 const sorted=[...liquidity.rows].sort((a,b)=>a.medianSpreadPercent==null?(b.medianSpreadPercent==null?0:1):b.medianSpreadPercent==null?-1:a.medianSpreadPercent-b.medianSpreadPercent);
 const csv=symbolLiquidityCsv(sorted,FILTER);
 const brokerBody=broker?.body;
 const balances=balanceEvidence(brokerBody,retained,context);
 const heldCapital=heldMarginEvidence(brokerBody);
 const derived=(brokerBody?.projection?.positions??[]).map((p,index)=>({...p,p50Probability:null,p50ProbabilityEvidence:{status:'NOT_AVAILABLE',unit:'PERCENT_0_TO_100',source:null,observedAt:null,reason:'No exact broker-modeled P50 source established in the published API or authorized observations. POP, delta, exit targets and historical UI percentages are not substitutes.'},p50ClosingDebit:finite(p.credit)?p.credit/2:null,p50Objective:{closingDebitPerShare:finite(p.credit)?p.credit/2:null,kind:'DERIVED_FROM_VERIFIED_OPENING_FILLS',workingTargetMatches:finite(p.credit)&&finite(p.target)?Math.abs(p.credit/2-p.target)<1e-8:null},timeExit21DteObjective:{checkpointDate:Number.isFinite(new Date(p.expiry).getTime())?new Date(epoch(nyDate(new Date(p.expiry)))-21*86400000).toISOString().slice(0,10):null,kind:'OPERATOR_OBJECTIVE_NOT_EXECUTED_EXIT'},actualBrokerBuyingPowerRequirement:heldCapital.positionBindings[index]?.buyingPowerFootprint?.amount??null,actualBrokerBuyingPowerRequirementBasis:'BROKER_CURRENT_RISK_GROUP_BUYING_POWER_FOOTPRINT; not original opening debit or future closing release',brokerHeldCapital:heldCapital.positionBindings[index]??null}));
 const accountData={schema:'tt1-cadence-account/v1',nickname:'tt1',...context,retrievedAt:new Date().toISOString(),observed:brokerBody??null,retainedInventory:inventory?.body??null,balances,heldCapital,derivedPositions:derived,qualifications:['Retained inventory source receipt is not observation time.','tt projection is reused unchanged; ambiguous/unsupported structures retain their diagnostics.','P/L is indicative gross before fees; candidate spreads never establish holdings.','No aggregate theoretical max loss is substituted for actual broker BP.','TT1 attribution reuses the operator-established sole tastytrade Account context when backend metadata withholds native references; multiple native accounts fail closed.','Account/position/order/quote reads are non-atomic.','Opening and closing fills/orders are source evidence, not a lifetime-completeness claim.']};
 const missing=['Market rows are not atomic; broker row update time does not establish separate Greek-calculation time; final Tastytrade verification required','V1 liquidity CSV is retained snapshot evidence, not the refreshed broker candidate universe','Broker-modeled P50 probability unavailable for held structures and candidates; no authorized API source established','Candidate contract identity, multiplier/deliverable/exchange not verified','Individual v1 bid/ask clocks and underlying spot clock unavailable','Full retained strike coverage not established','Original opening BP debits, future closing BP releases, full realized P/L/fees and portfolio correlation unavailable','Normalized zero OI/volume may conceal source absence (BUG-055)'];
 if(heldCapital.status!=='OBSERVED_QUALIFIED')missing.push('Held-trade BP incomplete: '+heldCapital.issues.join(', ')+(heldCapital.status==='UNAVAILABLE'?'margin report unavailable':''));
 if(!balances.currentBpEstablished)missing.push('Current same-day broker BP not established');
 if(market.backendDteMismatches)missing.push('Backend stored DTE differs from session-date arithmetic; CSV preserves exact v1 table behavior, market pairs use session-relative DTE');
 if(market.coverage.some(c=>c.status==='NOT_AVAILABLE'||c.missingListedExpirations?.length))missing.push('One or more research ETF expirations/chains not observed');
 failures.push(...(brokerBody?.failures??[]),...(acquisition?.failures??[]).map(f=>({source:'candidate market '+(f.symbol??'universe'),code:f.code})));
 if(!fresh)missing.push('Fresh candidate market evidence unavailable; retained/test-only candidates cannot qualify current trade selection');
 const counts={contracts:market.contracts.length,verticalPairs:market.verticalPairs.length,positiveNaturalPairs:market.verticalPairs.filter(p=>!p.exclusions.length).length,excludedPairs:market.verticalPairs.filter(p=>p.exclusions.length).length,liquiditySymbols:liquidity.rows.length,positions:brokerBody?.projection?derived.length:null,recognizedPositions:brokerBody?.projection?derived.filter(p=>p.status==='recognized').length:null,heldLegs:brokerBody?.reads?.some(r=>r.path.endsWith('/positions'))?brokerBody.reads.filter(r=>r.path.endsWith('/positions')).flatMap(r=>r.body?.data?.items??[]).length:null};
 const clocks=market.coverage.flatMap(c=>(c.observedExpirations??[]).map(e=>e.source));
 const coverage={schema:'tt1-cadence-coverage/v1',...context,exportedAt:now.toISOString(),evidenceReadiness:'PARTIAL',collectionCompletion:failures.length?'PARTIAL':'COMPLETE',missing,failures,sources,counts,currentBpEstablished:balances.currentBpEstablished,heldTradeBuyingPower:heldCapital,marketCoverage:market.coverage,chainClocks:clocks,marketAcquisition:acquisition?{...acquisition,observations:undefined,catalogs:acquisition.catalogs.map(c=>({symbol:c.symbol,retrievedAt:c.retrievedAt,contracts:c.contracts.length}))}:null,marketSourceMode:market.sourceMode,ageBasis:'Broker rows: option and underlying updated-at against export evaluation time. V1: chain receipt is not Greek/spot/quote time. Retained evidence never qualifies current trade selection.',csvReconciliation:{calculation:'accepted v1 buildSymbolLiquidity',schema:'shared symbolLiquidityColumns/buildCsv used by browser',snapshotGeneration:snapshot?.body.generation??null,filter:FILTER,scope:'all snapshot symbols, no UI symbol/measured-only narrowing, default medianSpreadPercent ascending sort',backendDteMismatches:market.backendDteMismatches},freshness:{market:'Explicit source mode and per-leg broker row/spot clocks; Greek clock is not separately supplied; v1 retained data remains test-only',broker:brokerBody?.reads?.map(r=>({path:r.path,retrievedAt:r.retrievedAt}))??[],balances:{observedAt:balances.observedAt,retrievedAt:balances.retrievedAt,currentBpEstablished:balances.currentBpEstablished},nonAtomic:true},validation:{marketGeometryCreditsAndPayoff:'PASS',exhaustiveRetainedLongPairs:'PASS',noFixedWidthLimit:true,liquiditySharedPath:true,missingQuotesNotZeroed:true,brokerMutationRequests:0,refreshSyncForceRequests:0},limitations:['No independent down-stream restoration of source-missing v1 OI/volume','No joint correlation/risk score or trade selection','Positive natural credit is not a liquidity or admissibility recommendation','Read completion and decision readiness are different states']};
 const files={'market-and-verticals.json':json(market),'tt1-account-positions-orders.json':json(sanitize(accountData)),'evidence-coverage.json':json(coverage),'symbol-liquidity.csv':csv,'README.md':README};
 for(const content of Object.values(files))if(token&&content.includes(token))throw Error('Credential exclusion failed; no package written');
 let revision=sourceRevision;if(!revision)try{revision=(await readFile(new URL('../.tt1-export-revision',import.meta.url),'utf8')).trim();}catch{revision='WORKTREE_UNRELEASED';}
 const manifest={schema:'tt1-cadence-package/v1',exportDate:nyDate(now),exportedAt:now.toISOString(),...context,sourceRevision:revision,sharedV1Baseline:'b74d127faefd457a594cac149afbe45ca8a5eeb4',sourceGeneration:snapshot?.body.generation??null,sourceSnapshotSha256:snapshot?.sha256??null,filters:FILTER,marketSymbols:SYMBOLS,completionStatus:'PARTIAL',collectionCompletion:coverage.collectionCompletion,partialReasons:missing,readFailures:failures,counts,files:Object.entries(files).map(([name,content])=>({name,bytes:Buffer.byteLength(content),sha256:sha(content)})),selfChecksum:'not included; manifest is verified as an exact ZIP member during publication'};
 files['manifest.json']=json(manifest);
 const path=(await child('python3',[fileURLToPath(new URL('./ww-export-zip.py',import.meta.url))],JSON.stringify({files,downloads,sessionDate:context.sessionDate,stamp:now.toISOString().replace(/[-:.TZ]/g,'')}),{max:8192,timeout:30000})).trim();
 const bp=balances.currentBpEstablished?`${balances.availableOptionsBuyingPower.toFixed(2)} USD as of ${balances.observedAt}`:'unavailable (see retained/source-qualified balances)';
 return {path,manifest,coverage,summary:`TT1 cadence evidence\nSession: ${context.sessionDate}${context.isTradingDay?'':' (prior trading session)'}\nMarket: ${market.sourceMode}\nContracts: ${counts.contracts}\nVertical candidates: ${counts.positiveNaturalPairs} indicative; ${counts.excludedPairs} excluded retained\nPositions: ${counts.positions??'unavailable'} (${counts.heldLegs??'unavailable'} observed legs)\nHeld BP: ${heldCapital.positionBindings.filter(b=>b.status==='EXACT_BROKER_HELD_GROUP_MATCH').length}/${counts.positions??'?'} structures matched; ${heldCapital.status}\nAvailable BP: ${bp}\nEvidence: partial — ${failures.length} failed reads; contract terms/quote clocks require broker verification\n\nSaved: ${path}\n`};
}
