import {parseObservations} from './ww-positions.mjs';
import {ShowError,showConfig,parseShowJson,humanShowNumber} from './ww-show.mjs';
export const CAPITAL_HELP=`Usage: ww ls portfolio-capital-observations --account ACCOUNT [--tsv | --table | --jsonl] [--no-color]
Read retained Fidelity Portfolio Capital: Total Account Value minus aggregate short-option MTM.
No acquisition. Requires existing account.read and account.artifacts.read; original scope remains protected.
One row per admitted Balances artifact. Unique identical export-minute Summary pairs are two-source
composites, not atomic brokerage snapshots. Other rows retain ? and explicit status. No nearest/day pairing.
Dates are source export times in New York, MINUTE precision; imports never date the graph.
TSV (default when piped): exportMinute, portfolioCapital, status, totalAccountValue, shortOptionMtm,
balancesArtifactId, optionSummaryArtifactIds. Missing numeric values are ?, never zero.
--jsonl preserves each complete observation plus measure, pairing basis and coverage.
No daily resampling, interpolation, completeness, historical knowledge replay or broker NAV claim.
--verbose implies --table; --jsonl retains hashes, both sources and source row numbers.`;
export function parseCapital(args) {
  try{return parseObservations(args);}catch{throw new ShowError('ls portfolio-capital-observations: see --help',2);}
}
export async function readCapital(account,token,{base,fetchImpl=fetch}={}) {
  const config=showConfig(token,base),url=new URL('/v2/portfolio-capital-observations',config.url);
  url.searchParams.set('accountId',account);
  let response;try{response=await fetchImpl(url,{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`}});}catch{throw new ShowError('capital history: Wheelwright request failed');}
  const requestId=response.headers.get('x-request-id');
  if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(requestId??''))throw new ShowError('capital history: invalid correlation');
  const text=await response.text();if(text.includes(token))throw new ShowError('capital history: credential in response');
  const data=parseShowJson(text);
  if(data.requestId!==requestId)throw new ShowError('capital history: correlation mismatch');
  if(response.status!==200) {
    const codes={401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',422:'INVALID_REQUEST',500:'INTERNAL_ERROR',503:'CAPABILITY_UNAVAILABLE'};
    if(!/^application\/problem\+json(?:;|$)/i.test(response.headers.get('content-type')??'')||data.code!==codes[response.status])throw new ShowError('capital history: invalid Problem');
    throw new ShowError(`capital history: ${data.code}`);
  }
  if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??'')||data.accountId!==account||
    data.measure!=='PORTFOLIO_CAPITAL_V1'||data.formula!=='totalAccountValue - shortOptionMtm'||
    data.pairingBasis!=='UNIQUE_IDENTICAL_EXPORT_MINUTE_COMPOSITE'||data.historyCoverage!=='UNKNOWN'||!Array.isArray(data.observations))throw new ShowError('capital history: invalid representation');
  const ids=new Set(),numeric=v=>v===null||JSON.isRawJSON(v);
  const source=s=>s&&typeof s.artifactId==='string'&&/^[a-f0-9]{64}$/.test(s.sha256)&&typeof s.receivedAt==='string'&&s.timestampPrecision==='MINUTE'&&Array.isArray(s.sourceRows);
  for(const o of data.observations) {
    if(o.accountId!==account||!['COMPOSITE','UNMATCHED_EXPORT_MINUTE','AMBIGUOUS_EXPORT_MINUTE','INSUFFICIENT_SOURCE_EVIDENCE'].includes(o.status)||
      !(o.exportMinute===null||/^\d{4}-\d\d-\d\dT\d\d:\d\d[+-]\d\d:\d\d$/.test(o.exportMinute))||
      ![o.portfolioCapital,o.totalAccountValue,o.shortOptionMtm].every(numeric)||!source(o.balances)||ids.has(o.balances.artifactId)||
      !Array.isArray(o.optionSummaries)||!o.optionSummaries.every(source)||!Array.isArray(o.qualifications)||
      (o.status==='COMPOSITE'?(o.portfolioCapital===null||o.totalAccountValue===null||o.shortOptionMtm===null||o.optionSummaries.length!==1||o.balances.exportedAt!==o.exportMinute||o.optionSummaries[0].exportedAt!==o.exportMinute):o.portfolioCapital!==null))throw new ShowError('capital history: invalid observation');
    ids.add(o.balances.artifactId);
  }
  if(!JSON.isRawJSON(data.balanceArtifacts)||BigInt(data.balanceArtifacts.rawJSON)!==BigInt(ids.size))throw new ShowError('capital history: incomplete collection');
  return data;
}
const raw=v=>v===null?'?':JSON.isRawJSON(v)?v.rawJSON:String(v);
export function renderCapital(data,{format,verbose,tty,accountLabel}={}) {
  if(format==='jsonl')return data.observations.map(o=>JSON.stringify({...o,requestId:data.requestId,balanceArtifacts:data.balanceArtifacts,optionSummaryArtifacts:data.optionSummaryArtifacts,measure:data.measure,formula:data.formula,pairingBasis:data.pairingBasis,historyCoverage:data.historyCoverage})+'\n').join('');
  const rows=data.observations.map(o=>[o.exportMinute??'?',raw(o.portfolioCapital),o.status,raw(o.totalAccountValue),raw(o.shortOptionMtm),o.balances.artifactId,o.optionSummaries.map(s=>s.artifactId).join(',')||'?']);
  if(format==='tsv'||!format&&!tty&&!verbose)return rows.map(r=>r.join('\t')+'\n').join('');
  const display=rows.map(r=>[r[0],r[1]==='?'?'?':'$'+humanShowNumber(JSON.rawJSON(r[1]),'price'),r[2]]);
  const headers=['EXPORTED (ET, minute)','PORTFOLIO CAPITAL','STATUS'];
  const widths=headers.map((h,i)=>Math.max(h.length,...display.map(r=>r[i].length)));
  const line=r=>r.map((s,i)=>i===1?s.padStart(widths[i]):s.padEnd(widths[i])).join('  ').trimEnd();
  return [`${accountLabel} — Portfolio Capital v1 · export-minute composites`,line(headers),...display.map(line)].join('\n')+'\n';
}
