import {observationInstant as instant} from './tt-cadence-volatility.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const bytes=await readFile(new URL('../docs/experiments/tt1-expanded-universe-2026-11-12.json',import.meta.url));
export const RESEARCH_UNIVERSE=Object.freeze({...JSON.parse(bytes),specificationSha256:createHash('sha256').update(bytes).digest('hex')});
export const EXPORT_SYMBOLS=Object.freeze([...new Set([...RESEARCH_UNIVERSE.historicalControlSymbols,...RESEARCH_UNIVERSE.expandedOrdinarySymbols])]);
export const EXPANDED_ACQUISITION=Object.freeze({symbols:EXPORT_SYMBOLS,window:{minDte:38,maxDte:52},limits:{contracts:20000,requests:240,durationMs:180000,batch:99,spacingMs:500}});
const number=value=>{
 if(typeof value!=='number'&&(typeof value!=='string'||!/^[-+]?(?:\d+)(?:\.\d+)?$/.test(value)))return null;
 const n=Number(value);return Number.isFinite(n)?n:null;
};
export function eventEvidence(symbol,expiration,observation,context,at){
 const type=RESEARCH_UNIVERSE.symbols.find(s=>s.symbol===symbol)?.securityType??'UNKNOWN';
 const matches=Array.isArray(observation?.items)?observation.items.filter(m=>m.symbol===symbol):[];
 const item=matches.length===1?matches[0]:null,provider=item?.earnings;
 const confirmed=RESEARCH_UNIVERSE.confirmedScheduledEvents.find(e=>e.symbol===symbol);
 const receipt=instant(observation?.retrievedAt),cutoff=instant(at),fieldTime=instant(provider?.['updated-at']);
 const integrity=Array.isArray(observation?.items)&&observation.selectedFieldsSha256===createHash('sha256').update(JSON.stringify(observation.items)).digest('hex');
 const sourceQualified=integrity&&observation.provider==='tastytrade'&&observation.endpoint==='/market-metrics'&&observation.environment==='production'&&receipt!==null&&cutoff!==null&&receipt<=cutoff;
 const providerQualified=sourceQualified&&matches.length===1&&fieldTime!==null&&fieldTime<=receipt&&provider?.visible===true;
 const date=confirmed?.earningsDate??(providerQualified?provider?.['expected-report-date']:null)??null;
 const valid=typeof date==='string'&&/^\d{4}-\d\d-\d\d$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
 const future=valid&&date>=context.sessionDate;
 const outsideQualified=Boolean(confirmed)||(providerQualified&&provider?.estimated===false&&(provider?.['late-flag']??0)===0);
 const status=type==='ETF'?'ETF_NOT_SINGLE_ISSUER_EARNINGS':matches.length>1?'EVENT_EVIDENCE_AMBIGUOUS':!future?'FUTURE_EARNINGS_UNVERIFIED':date<=expiration?'EARNINGS_CROSSING':outsideQualified?'REPORTED_EVENT_AFTER_EXPIRATION':'FUTURE_EARNINGS_UNVERIFIED';
 return {symbol,securityType:type,status,earningsDate:date,confirmedSource:confirmed?.source??null,confidence:matches.length>1?'CONFLICTING_PROVIDER_ROWS':confirmed?'ISSUER_CONFIRMED':future?(provider?.estimated===true?'PROVIDER_ESTIMATED':'PROVIDER_REPORTED'):'UNKNOWN',providerEarnings:provider??null,providerEventRows:matches.length>1?matches.map(m=>m.earnings??null):undefined,providerEarningsUpdatedAt:provider?.['updated-at']??null,providerReceiptAt:observation?.retrievedAt??null,providerSourceQualified:sourceQualified,providerEarningsQualified:providerQualified,evaluatedAt:at,source:confirmed?.source??'tastytrade /market-metrics',planned21DteExitDate:new Date(Date.parse(expiration+'T00:00:00Z')-21*86400000).toISOString().slice(0,10),crossesPlanned21DteExit:future?date<=new Date(Date.parse(expiration+'T00:00:00Z')-21*86400000).toISOString().slice(0,10):null,qualification:'Unknown/past, missing-clock or ambiguous event evidence never establishes no upcoming earnings. ETF treatment is not absence of portfolio or macro-event risk.'};
}
export function annotateResearch(market,observation,context,at){
 const byGeometry=new Map((market.contracts??[]).map(c=>[c.geometryKey,c]));
 const expanded=new Set(RESEARCH_UNIVERSE.expandedOrdinarySymbols),control=new Set(RESEARCH_UNIVERSE.historicalControlSymbols),excluded=new Set(RESEARCH_UNIVERSE.excludedNewEntries.map(e=>e.symbol));
 for(const p of market.verticalPairs){
  const event=eventEvidence(p.underlying,p.expiration,observation,context,at);
  const natural=p.natural.creditPerShare,mid=p.midpoint.creditPerShare;
  const shortRaw=byGeometry.get(`${p.underlying}|${p.expiration}|PUT|${p.shortStrike}`)?.observed?.marketEvidence?.rawQuote??p.source?.shortObservation?.rawQuote;
  const longRaw=byGeometry.get(`${p.underlying}|${p.expiration}|PUT|${p.longStrike}`)?.observed?.marketEvidence?.rawQuote??p.source?.longObservation?.rawQuote;
  const displayedQuoteSizes={shortBid:number(shortRaw?.['bid-size']),shortAsk:number(shortRaw?.['ask-size']),longBid:number(longRaw?.['bid-size']),longAsk:number(longRaw?.['ask-size'])};
  const liquidity={displayedQuoteSizes,allLegDisplayedSizesAtLeastOne:Object.values(displayedQuoteSizes).every(v=>v!==null&&v>=1),bothLegOpenInterest:[p.shortOpenInterest,p.longOpenInterest].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=20),bothLegVolume:[p.shortVolume,p.longVolume].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=5),naturalToMidpoint:typeof natural==='number'&&typeof mid==='number'&&mid>0?natural/mid:null};
  const liquidityPass=liquidity.allLegDisplayedSizesAtLeastOne&&liquidity.bothLegOpenInterest&&liquidity.bothLegVolume&&liquidity.naturalToMidpoint>=.65;
  const cohort=excluded.has(p.underlying)?'EXCLUDED_NEW_ENTRY':!expanded.has(p.underlying)?'CONTROL_OR_PRODUCT_REVIEW_ONLY':event.status==='EARNINGS_CROSSING'?'SHADOW_EARNINGS':['FUTURE_EARNINGS_UNVERIFIED','EVENT_EVIDENCE_AMBIGUOUS'].includes(event.status)?'EVENT_UNVERIFIED':'PRIMARY_RESEARCH_PENDING_PORTFOLIO_REVIEW';
  p.research={originalControl:control.has(p.underlying),expandedOrdinary:expanded.has(p.underlying),cohort,event,liquidity,referenceLiquidityPass:liquidityPass,eligibleForPrimaryResearch:cohort==='PRIMARY_RESEARCH_PENDING_PORTFOLIO_REVIEW'&&liquidityPass&&p.qualifiedForCurrentDeltaSelection===true,standing:'research comparison only; no automatic recommendation or execution'};
 }
 return market;
}
