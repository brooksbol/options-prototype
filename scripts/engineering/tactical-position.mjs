// Engineer-only API v2 consumer. No broker access, recognition or financial calculations.
import {pathToFileURL} from 'node:url';
const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function readTacticalPosition({base,token,href,accountId,fetchImpl=fetch}){
 const origin=new URL(base),url=new URL(href,origin);
 if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||(origin.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(origin.hostname))||!token||url.origin!==origin.origin||url.username||url.password||url.hash||url.search||!url.pathname.startsWith('/v2/positions/')||!UUID.test(url.pathname.slice('/v2/positions/'.length))||!/^acct_[a-f0-9]{32}$/.test(accountId??''))throw Error('Exact discovered Position link and Account required.');
 url.searchParams.set('projection','tactical');
 const response=await fetchImpl(url,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(40000)});
 if(!response.ok)throw Error('Exact tactical read failed ('+response.status+'); no alternate scope requested.');
 if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw Error('Invalid tactical media type.');
 let text='',bytes=0;const decoder=new TextDecoder('utf-8',{fatal:true});for await(const chunk of response.body){bytes+=chunk.byteLength;if(bytes>100000)throw Error('Tactical response exceeds100000bytes.');text+=decoder.decode(chunk,{stream:true});}text+=decoder.decode();if(text.includes(token))throw Error('Invalid tactical response size or credential disclosure.');
 const item=JSON.parse(text),requestId=response.headers.get('x-request-id');if(!UUID.test(requestId??'')||item.self?.href!==url.pathname||item.id!==url.pathname.split('/').at(-1)||item.account?.href!=='/v2/accounts/'+accountId||item.representation!=='TACTICAL_POSITION'||!item.currentConstruction?.href?.startsWith('/v2/constructions/')||!UUID.test(item.currentConstruction.href.slice('/v2/constructions/'.length)))throw Error('Invalid tactical identity or correlation.');
 return item;
}
const exact=value=>String(value??'Unavailable').replace(/[\x00-\x1f\x7f]/g,' ');
const metric=m=>m?.value==null?`Unavailable (${exact(m?.status)})`:`${exact(m.value)} ${exact(m.currency??m.unit)} (${exact(m.status)})`;
export function renderTacticalPosition(item){
 const e=item.evaluation??{},range=e.range??{},tl=e.timeline??{};
 const rows=[['Underlying',(item.underlyings??[]).map(u=>u.symbol).join(' / ')],['Structure',item.structure?.name],['Association',item.structure?.authority?.basis],['Shape meaning',e.payoff?.geometry?.valueKind??'Unavailable'],['Strike boundaries',(e.payoff?.geometry?.boundaries??[]).map(b=>b.price).join(' / ')||'Unavailable'],['Range',range.status==='QUALIFIED'?`${exact(range.lower)} .. ${exact(range.upper)}`:'Unavailable'],['Spot',metric(e.spot)],['Spot source time',e.spot?.value==null?'Unavailable':e.spot.asOf],['Remaining DTE',metric(tl.remainingDays)],['Original duration',metric(tl.originalDays)],['Opening cash',metric(e.openingCashFlow)],['Indicative gross P/L',metric(e.grossUnrealizedPl)],['Estimated closing cash',metric(e.estimatedClosingCashFlow)],['Profit target',metric(e.management?.profitTargetGrossPl)],['Reported stop result',metric(e.management?.reportedStopThresholdGrossPl)],['Manual checkpoint',e.management?.manualCheckpoint?.date??'Unavailable'],['Quote qualification',e.freshness],['Evaluation time',e.evaluatedAt],['Warnings',(item.warningCodes??[]).join(', ')||'None reported']];
 return rows.map(([name,value])=>name+'\t'+exact(value)).join('\n')+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const args=process.argv.slice(2);if(args.length!==2)throw Error('Engineer usage: tactical-position.mjs <API-provided Position link> <discovered Account ID>');const item=await readTacticalPosition({base:process.env.WW_BASE_URL,token:process.env.WW_API_TOKEN,href:args[0],accountId:args[1]});process.stdout.write(renderTacticalPosition(item));}catch{console.error('Exact tactical Position unavailable; no financial finding established.');process.exitCode=1;}
}
