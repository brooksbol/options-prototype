import {ShowError,showConfig,humanShowNumber} from './ww-show.mjs';
import {canonicalAccountId} from './ww-accounts.mjs';
export const HISTORY_HELP=`Usage: ww history [--account ACCOUNT] [--table | --tsv | --csv | --jsonl] [-v | --verbose] [--no-color]
Read Account transaction evidence through the backend's retained-first, policy-bounded facade.
Includes trades and money movements. No strategy, tax, realized P/L or lifetime completeness claim.
Default terminal: table. Default pipe: headerless TSV. --csv: header plus records.
--jsonl: one transaction per line, including history context and source lineage.
--verbose: full human details (unless an explicit machine format is selected).
The backend owns acquisition, source pagination, reconciliation and freshness. The CLI never calls a brokerage.
Without --account, discover authorized Accounts and read each Account-scoped history.
Requires account.read for nickname discovery and account.transactions.read for this Account.
Unknown is ?, not zero. Cash credits/debits are not profit/loss. A context summary goes to stderr.
Exit 0: complete bounded result; 1: incomplete/operational failure; 2: usage/configuration.
Examples:
  ww history --account tt1
  ww history --account tt1 --csv > tt1-history.csv
  ww history --account tt1 --jsonl > tt1-history.jsonl
  ww history --account tt1 --table | less -SR
--no-color, presence of NO_COLOR, or TERM=dumb disables human color.`;
export function parseHistory(args) {
  if(args.length===1&&['-h','--help','--man'].includes(args[0]))return {help:true};
  let account,format,verbose=false,noColor=false;
  for(let i=0;i<args.length;i++) {
    const a=args[i];
    if(a==='--account') {if(account!==undefined||!args[i+1]||args[i+1].startsWith('-'))throw new ShowError('history: exactly one --account nickname required',2);account=args[++i];}
    else if(['--table','--tsv','--csv','--jsonl'].includes(a)) {if(format&&format!==a.slice(2))throw new ShowError('history: output formats conflict',2);format=a.slice(2);}
    else if(['-v','--verbose'].includes(a))verbose=true;
    else if(a==='--no-color')noColor=true;
    else throw new ShowError('history: see ww history --help',2);
  }
  if(account!==undefined&&(account.length===0||account.length>128||/[\x00-\x20\x7f]/.test(account)))throw new ShowError('history: --account nickname required',2);
  return {account,format,verbose,noColor};
}
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const decimal=v=>v===null||typeof v==='string'&&/^-?[0-9]+(?:\.[0-9]+)?$/.test(v)&&v.length<=58;
const timestamp=v=>v===null||typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v));
const string=v=>v===null||typeof v==='string';
export function validateHistory(data,account,requestId) {
  const bad=()=>{throw new ShowError('history: invalid or incomplete backend representation');};
  if(data?.requestId!==requestId||data.accountId!==account||!canonicalAccountId(account)||!Array.isArray(data.transactions)||
      !Number.isSafeInteger(data.recordCount)||data.recordCount!==data.transactions.length||data.recordCount>25000||typeof data.complete!=='boolean'||
      !['ACQUIRED','RETAINED','UNAVAILABLE'].includes(data.evidenceMode)||!['REUSABLE','STALE','UNAVAILABLE','UNVERIFIED'].includes(data.freshness)||
      !['COMPLETE','REUSED','INCOMPLETE','UNAVAILABLE','NOT_APPLICABLE'].includes(data.acquisitionOutcome)||
      !['COMPLETE_AT_LAST_SUCCESS','INCOMPLETE','NOT_APPLICABLE'].includes(data.providerTraversal)||data.providerSnapshotConsistency!=='UNVERIFIED'||data.lifetimeCoverage!=='UNKNOWN'||
      !['SUPPORTED','QUALIFIED'].includes(data.normalization)||!['TASTYTRADE','FIDELITY'].includes(data.provider)||data.environment!=='PRODUCTION'||
      ![data.asOf,data.checkedAt,data.requestedThrough].every(timestamp)||data.requestedFrom!==null||
      ![data.observedFrom,data.observedThrough].every(v=>v===null||typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v))||
      !(data.latestAttemptId===null||uuid(data.latestAttemptId))||!Number.isSafeInteger(data.latestAttemptPages)||data.latestAttemptPages<0||data.latestAttemptPages>100)bad();
  if(data.provider==='FIDELITY'&&(data.identityBasis!=='RETAINED_ROW_OBSERVATION'||data.freshness!=='UNVERIFIED'||data.acquisitionOutcome!=='NOT_APPLICABLE'||data.providerTraversal!=='NOT_APPLICABLE'||data.asOf!==null||data.checkedAt!==null||!timestamp(data.lastImportedAt)))bad();
  if(data.provider==='TASTYTRADE'&&(data.identityBasis!=='BROKER_TRANSACTION_ID'||data.lastImportedAt!==null))bad();
  if(data.complete&&data.normalization!=='SUPPORTED')bad();
  if(data.complete&&data.provider==='FIDELITY'&&(data.evidenceMode!=='RETAINED'||data.lastImportedAt===null))bad();
  if(data.complete&&data.provider==='TASTYTRADE'&&(data.freshness!=='REUSABLE'||!['COMPLETE','REUSED'].includes(data.acquisitionOutcome)||data.asOf===null||data.checkedAt===null||data.normalization!=='SUPPORTED'))bad();
  const ids=new Set();
  for(const r of data.transactions) {
    if(r.accountId!==account||!uuid(r.transactionId)||ids.has(r.transactionId)||!['TRADE','MONEY_MOVEMENT','OTHER'].includes(r.kind)||
        typeof r.transactionDate!=='string'||!/^\d{4}-\d\d-\d\d$/.test(r.transactionDate)||!timestamp(r.executedAt)||!timestamp(r.sourceCreatedAt)||!(r.settlementDate===null||typeof r.settlementDate==='string'&&/^\d{4}-\d\d-\d\d$/.test(r.settlementDate))||
        !['quantity','price','value','netCash','commission','fees','otherCharge','multiplier'].every(k=>decimal(r[k]))||
        !['action','sourceAction','sourceType','sourceSubType','symbol','underlyingSymbol','instrumentType','description'].every(k=>string(r[k]))||
        !(r.currency===null&&data.provider==='FIDELITY'||typeof r.currency==='string'&&/^[A-Z]{3}$/.test(r.currency))||
        !(data.provider==='FIDELITY'?r.sourceTransactionId===null&&r.sourceIdentityStatus==='ROW_EQUIVALENCE_ONLY':typeof r.sourceTransactionId==='string'&&/^[0-9]{1,40}$/.test(r.sourceTransactionId)&&r.sourceIdentityStatus==='BROKER_TRANSACTION_ID')||
        ![r.orderId,r.reversesSourceId].every(v=>v===null||typeof v==='string'&&/^[0-9]{1,40}$/.test(v))||
        !(r.reversesTransactionId===null||uuid(r.reversesTransactionId))||!['NONE_REPORTED','LINKED','UNRESOLVED'].includes(r.reversalStatus)||
        !['NONE_OBSERVED','CHANGED_OBSERVATION'].includes(r.correctionStatus)||!['SUPPORTED','QUALIFIED'].includes(r.normalization)||
        !['NOT_REPORTED','REPORTED'].includes(r.commissionStatus)||!['NOT_REPORTED','PARTIALLY_REPORTED','REPORTED_COMPONENTS_COMPLETE','REPORTED_TOTAL'].includes(r.feesStatus)||
        !(r.estimatedFee===null||typeof r.estimatedFee==='boolean')||!r.feeComponents||Array.isArray(r.feeComponents)||
        !['clearing-fees','regulatory-fees','proprietary-index-option-fees','currency-conversion-fees'].every(k=>decimal(r.feeComponents[k]))||
        !r.provenance||!uuid(r.provenance.artifactId)||!uuid(r.provenance.observationId)||!timestamp(r.provenance.receivedAt)||r.provenance.receivedAt===null||
        !/^[a-f0-9]{64}$/.test(r.provenance.sha256)||!Number.isSafeInteger(r.provenance.rowNumber)||r.provenance.rowNumber<1||
        !(r.provenance.previousObservationId===null||uuid(r.provenance.previousObservationId)))bad();
    ids.add(r.transactionId);
  }
  return data;
}
export async function readHistory(account,token,{base,fetchImpl=fetch}={}) {
  if(!canonicalAccountId(account))throw new ShowError('history: canonical Account required');
  const config=showConfig(token,base),url=new URL(`/v2/accounts/${account}/transactions`,config.url);
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),45000);
  try {
    const response=await fetchImpl(url,{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`},signal:abort.signal});
    const id=response.headers.get('x-request-id');if(!uuid(id))throw new ShowError('history: invalid correlation');
    const reader=response.body?.getReader();if(!reader)throw new ShowError('history: empty response');
    let size=0;const chunks=[];
    try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16777216){await reader.cancel();throw new ShowError('history: response capacity exceeded');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
    const text=Buffer.concat(chunks).toString('utf8');if(text.includes(token))throw new ShowError('history: credential in response');
    let data;try{data=JSON.parse(text);}catch{throw new ShowError('history: truncated or invalid JSON');}
    if(data.requestId!==id)throw new ShowError('history: correlation mismatch');
    if(response.status!==200) {
      const codes={401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',422:'INVALID_REQUEST',500:'INTERNAL_ERROR',503:'CAPABILITY_UNAVAILABLE'};
      if(!/^application\/problem\+json(?:;|$)/i.test(response.headers.get('content-type')??'')||data.code!==codes[response.status])throw new ShowError('history: invalid Problem');
      throw new ShowError(`history: ${data.code}`);
    }
    if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw new ShowError('history: invalid media type');
    return validateHistory(data,account,id);
  }catch(e){if(e instanceof ShowError)throw e;throw new ShowError('history: Wheelwright request failed');}finally{clearTimeout(timer);}
}
const RECORD=['accountId','transactionId','sourceTransactionId','sourceIdentityStatus','transactionDate','executedAt','settlementDate','sourceCreatedAt','kind','sourceType','sourceSubType','action','sourceAction','symbol','underlyingSymbol','instrumentType','description','currency','quantity','price','multiplier','value','commission','commissionStatus','fees','feesStatus','feeComponents','otherCharge','netCash','estimatedFee','orderId','correctionStatus','reversesSourceId','reversesTransactionId','reversalStatus','normalization'];
const SOURCE=['artifactId','sha256','observationId','receivedAt','previousObservationId','rowNumber'];
const HISTORY=['requestId','provider','environment','asOf','checkedAt','lastImportedAt','identityBasis','requestedFrom','requestedThrough','observedFrom','observedThrough','evidenceMode','freshness','acquisitionOutcome','providerTraversal','providerSnapshotConsistency','lifetimeCoverage','latestAttemptId','latestAttemptPages','normalization','complete','recordCount'];
export const HISTORY_COLUMNS=[...RECORD,...SOURCE.map(k=>'source_'+k),...HISTORY.map(k=>'history_'+k)];
const safe=v=>String(v).replace(/[\x00-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
const machine=v=>v===null?'':typeof v==='object'?JSON.stringify(v):String(v);
const tsv=v=>machine(v).replace(/\\/g,'\\\\').replace(/\t/g,'\\t').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
const csv=v=>{const s=machine(v);return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
const money=v=>v===null?'?':(/^-/.test(v)||/^0+(?:\.0+)?$/.test(v)?'':'+')+humanShowNumber(JSON.rawJSON(v),'price');
export function historyDiagnostic(d) {return `history: ${d.recordCount} records; ${d.evidenceMode}/${d.freshness}; as of ${d.asOf??'?'}; last import ${d.lastImportedAt??'?'}; acquisition ${d.acquisitionOutcome}; source consistency unverified; lifetime coverage unknown${d.complete?'':'; INCOMPLETE RESULT'}\n`;}
export function renderHistory(d,{format,verbose=false,tty=false,noColor=false,env=process.env,accountLabel}={}) {
  const context=Object.fromEntries(HISTORY.map(k=>[k,d[k]]));
  if(format==='jsonl')return d.transactions.map(r=>JSON.stringify({...r,history:context})+'\n').join('');
  if(format==='csv'||format==='tsv'||!format&&!tty&&!verbose) {
    const rows=d.transactions.map(r=>[...RECORD.map(k=>r[k]),...SOURCE.map(k=>r.provenance[k]),...HISTORY.map(k=>d[k])]);
    if(format==='csv')return [HISTORY_COLUMNS,...rows].map(r=>r.map(csv).join(',')+'\r\n').join('');
    return rows.map(r=>r.map(tsv).join('\t')+'\n').join('');
  }
  const color=!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb';
  const ink=(s,c='97')=>color?`\x1b[${c}m${s}\x1b[97m`:s;
  const heading=`${ink(safe(accountLabel??d.accountId),'96')} — ${ink(d.provider==='FIDELITY'?'Fidelity':'tastytrade',d.provider==='FIDELITY'?'32':'91')} transaction history | ${d.recordCount} records | ${d.evidenceMode}/${d.freshness}`;
  const contextLine=(d.provider==='FIDELITY'?`Imported ${d.lastImportedAt??'?'}; row-equivalence identity; brokerage freshness unknown | `:'')+`Observed ${d.observedFrom??'?'}–${d.observedThrough??'?'} | checked ${d.checkedAt??'?'} | ${d.complete?'available result complete':'INCOMPLETE; retained evidence only'}; lifetime/source consistency unverified`;
  if(verbose)return heading+'\n'+contextLine+'\n'+d.transactions.map(r=>Object.entries(r).map(([k,v])=>`${k}: ${safe(v===null?'?':typeof v==='object'?JSON.stringify(v):v)}`).join('\n')).join('\n\n')+'\n';
  const headers=['DATE','TYPE / ACTION','SYMBOL / DESCRIPTION','QTY','PRICE','VALUE','COMMISSION','REPORTED FEES','NET CASH','CCY','ORDER'];
  const rows=d.transactions.map(r=>[r.executedAt??r.transactionDate,r.action??r.sourceSubType??r.sourceType,r.symbol??r.description??'?',r.quantity??'?',r.price===null?'?':humanShowNumber(JSON.rawJSON(r.price),'price'),money(r.value),money(r.commission),money(r.fees),money(r.netCash),r.currency??'?',r.orderId??'?'].map(safe));
  const widths=headers.map((h,i)=>Math.max(h.length,...rows.map(r=>r[i].length)));
  const line=(r,index=-1)=>r.map((s,i)=>{const pad=' '.repeat(widths[i]-s.length);return (i>=3&&i<=8?pad:'')+ink(s,index<0?'97':s==='?'?'37':i===2?(d.transactions[index].symbol?'38;5;226':'38;5;250'):i===4&&s!=='?'?'38;5;208':i===10&&s!=='?'?'38;5;240':'97')+(i>=3&&i<=8||i===r.length-1?'':pad);}).join('  ');
  let result=heading+'\n'+contextLine+'\n'+line(headers)+'\n';
  if(!rows.length)result+='No transactions reported.\n';
  rows.forEach((r,i)=>{result+=(color?'\x1b[97m'+(i%2?'\x1b[48;5;232m':'\x1b[40m'):'')+line(r,i)+(color?'\x1b[49m':'')+'\n';});
  return result+'? = unreported; fees are as reported; cash signs are not P/L.\n'+(color?'\x1b[0m':'');
}

/** Presentation composition only: each read retains its own backend authorization and clocks. */
export async function readHistories(accounts,token,{base,fetchImpl=fetch}={}) {
  const results=[];
  for(const account of accounts) {
    try {results.push({account,data:await readHistory(account.id,token,{base,fetchImpl})});}
    catch(error) {results.push({account,error:safe(error.message).replaceAll(token,'[REDACTED]')});}
  }
  return results;
}
export function renderHistories(results,options={}) {
  const successful=results.filter(r=>r.data);
  const output=successful.map((r,i)=>{
    const rendered=renderHistory(r.data,{...options,accountLabel:r.account.alias});
    return options.format==='csv'&&i>0?rendered.slice(rendered.indexOf('\r\n')+2):rendered;
  }).join(options.format==='table'||!options.format&&(options.tty||options.verbose)?'\n':'');
  return output|| (options.format==='csv'?HISTORY_COLUMNS.join(',')+'\r\n':options.format==='table'||!options.format&&(options.tty||options.verbose)?'No Account history available.\n':'');
}
