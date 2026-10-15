import {readAccounts,canonicalAccountId} from './ww-accounts.mjs';
import {syncAccount} from './ww-sync.mjs';
import {readHistory} from './ww-history.mjs';
import {ShowError,showConfig} from './ww-show.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const safe=v=>String(v).replace(/[\x00-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
async function domainGet(path,token,{base,fetchImpl=fetch}={}) {
 const {url}=showConfig(token,base),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),45000);
 try {
  const response=await fetchImpl(new URL(path,url),{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`},signal:abort.signal});
  let size=0;const chunks=[];const reader=response.body?.getReader();if(!reader)throw new ShowError('update: empty response');
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16777216){await reader.cancel();throw new ShowError('update: response capacity exceeded');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  const text=Buffer.concat(chunks).toString('utf8');if(text.includes(token))throw new ShowError('update: credential in response');
  let d;try{d=JSON.parse(text);}catch{throw new ShowError('update: invalid backend JSON');}
  const id=response.headers.get('x-request-id');if(!uuid(id)||d?.requestId!==id)throw new ShowError('update: invalid correlation');
  if(response.status!==200)throw new ShowError(`update: backend status ${response.status}; request ${id}`);
  if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw new ShowError('update: invalid media type');
  return d;
 }catch(e){if(e instanceof ShowError)throw e;throw new ShowError('update: Wheelwright request failed');}finally{clearTimeout(timer);}
}
export async function readAccountScope(token,options={}) {
 const accounts=await readAccounts(token,options),me=await domainGet('/v2/me',token,options);
 if(!/^usr_[a-f0-9]{32}$/.test(me.user?.id??'')||!Array.isArray(me.user.accountAccess))throw new ShowError('update: invalid authenticated capability discovery');
 const access=new Map();
 for(const a of me.user.accountAccess) {
  if(!canonicalAccountId(a.accountId)||access.has(a.accountId)||!['metadataRead','positionsRead','artifactsRead','artifactsWrite','positionsAcquire','transactionsRead'].every(k=>typeof a[k]==='boolean'))throw new ShowError('update: invalid Account capability discovery');
  access.set(a.accountId,a);
 }
 return accounts.map(account=>({account,access:access.get(account.id)}));
}
export async function syncAccounts(token,{accountAlias,base,fetchImpl=fetch,directory,verbose=false,out=s=>process.stdout.write(s)}={}) {
 const scope=await readAccountScope(token,{base,fetchImpl});
 if(accountAlias!==undefined&&!scope.some(r=>r.account.alias===accountAlias))throw new ShowError('sync: nickname unavailable in authorized Account scope; run ww ls accounts');
 const selected=scope.filter(({account,access:a})=>accountAlias!==undefined?account.alias===accountAlias:a&&(a.transactionsRead||account.brokerAssociation.broker==='TASTYTRADE'&&a.positionsAcquire||account.brokerAssociation.broker==='FIDELITY'&&a.artifactsRead&&a.artifactsWrite));
 const results=[];
 for(const {account,access:a} of selected) {
  const row={accountId:account.id,alias:account.alias,broker:account.brokerAssociation.broker,complete:true,holdings:null,history:null,errors:[],diagnostics:[]};
  const canSync=a&&(account.brokerAssociation.broker==='TASTYTRADE'?a.positionsAcquire:account.brokerAssociation.broker==='FIDELITY'&&a.artifactsRead&&a.artifactsWrite);
  if(canSync)try{row.holdings=await syncAccount(account.alias,token,{base,fetchImpl,directory,out:s=>row.diagnostics.push(s),tty:false});if(!row.holdings.complete)row.complete=false;}
   catch(e){row.complete=false;row.errors.push(safe(e.message).replaceAll(token,'[REDACTED]'));}
  if(a?.transactionsRead)try{const d=await readHistory(account.id,token,{base,fetchImpl});row.history={recordCount:d.recordCount,evidenceMode:d.evidenceMode,freshness:d.freshness,acquisitionOutcome:d.acquisitionOutcome,complete:d.complete,asOf:d.asOf,lastImportedAt:d.lastImportedAt};if(!d.complete)row.complete=false;}
   catch(e){row.complete=false;row.errors.push(safe(e.message).replaceAll(token,'[REDACTED]'));}
  if(!canSync&&!a?.transactionsRead){row.complete=false;row.errors.push('No supported Account synchronization capability authorized.');}
  if(verbose)for(const line of row.diagnostics)out(line);
  results.push(row);
 }
 return {accounts:results,complete:results.every(r=>r.complete)};
}
export async function readDefaultSubjects(token,options={}) {
 const d=await domainGet('/v2/market-evidence-subjects',token,options);
 const bad=()=>{throw new ShowError('fetch: invalid backend default-subject selection');};
 if(d.policy!=='AUTHORIZED_HOLDINGS_UNION_CONFIGURED_MONITORING'||typeof d.complete!=='boolean'||typeof d.selectedAt!=='string'||!Number.isFinite(Date.parse(d.selectedAt))||!Array.isArray(d.subjects)||d.subjects.length>10000||!Array.isArray(d.coverage))bad();
 const seen=new Set();
 for(const r of d.subjects){if(typeof r.symbol!=='string'||!/^[A-Z^][A-Z0-9.^/_-]{0,31}$/.test(r.symbol)||seen.has(r.symbol)||!Array.isArray(r.sources)||!r.sources.length||r.sources.some(s=>!['HOLDINGS','MONITORING'].includes(s)))bad();seen.add(r.symbol);}
 for(const r of d.coverage)if(!['HOLDINGS','MONITORING'].includes(r.source)||!['AVAILABLE','EMPTY','NOT_AUTHORIZED','UNAVAILABLE','INCOMPLETE'].includes(r.status)||!Array.isArray(r.qualifications)||r.qualifications.some(q=>typeof q!=='string')||!(r.accountId===null||canonicalAccountId(r.accountId)))bad();
 if(d.complete&&d.coverage.some(r=>['UNAVAILABLE','INCOMPLETE'].includes(r.status)))bad();
 return d;
}
/** Only transport batching of a backend-selected set; no client symbol-selection policy. */
export async function fetchDefault(token,{acquire,mode='ORDINARY',base,fetchImpl=fetch,onBatch=()=>{}}={}) {
 const selection=await readDefaultSubjects(token,{base,fetchImpl}),batches=[],errors=[];
 for(let i=0;i<selection.subjects.length;i+=30) {
  const symbols=selection.subjects.slice(i,i+30).map(r=>r.symbol);
  try{const result=await acquire(symbols,{token,mode,base,fetchImpl});batches.push(result);onBatch(result);}
  catch(e){errors.push({symbols,message:safe(e.message).replaceAll(token,'[REDACTED]')});}
 }
 return {selection,batches,errors,complete:selection.complete&&!errors.length&&batches.every(b=>b.results.every(r=>r.fulfilled))};
}
export async function pull(token,{acquire,base,fetchImpl=fetch,directory,}={}) {
 // All Account attempts finish before discovery. Failures remain visible; independent market work continues.
 const sync=await syncAccounts(token,{base,fetchImpl,directory});
 let market,error;
 try{market=await fetchDefault(token,{acquire,base,fetchImpl});}catch(e){error=safe(e.message).replaceAll(token,'[REDACTED]');}
 return {sync,market,error,complete:sync.complete&&!!market?.complete};
}
export function renderUpdate(report,{verbose=false,tty=false,noColor=false,env=process.env,pullReport=true}={}) {
 const color=tty&&!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb';
 const ink=(s,c='97')=>color?`\x1b[${c}m${s}\x1b[97m`:s;
 const lines=['Synchronizing accounts...'];
 if(!report.sync.accounts.length)lines.push('  No applicable authorized Accounts.');
 for(const a of report.sync.accounts) {
  const status=a.complete?(a.holdings?.processed?'updated':'reused available evidence'):'INCOMPLETE';
  const parts=[`${ink(safe(a.alias),'96')}  ${ink(status,a.complete?'97':'93')}`];
  if(a.holdings)parts.push(a.broker==='TASTYTRADE'?`holdings ${a.holdings.complete?'acquired':'failed; prior retained'}`:`${a.holdings.uploaded} files retained, ${a.holdings.processed} imports accepted, ${a.holdings.pending} pending`);
  if(a.history)parts.push(`history ${a.history.recordCount} records (${a.history.evidenceMode}/${a.history.freshness})`);
  lines.push('  '+parts.join('; '));
  for(const error of a.errors)lines.push('    '+ink(error,'93'));
  if(verbose){lines.push(...a.diagnostics.flatMap(s=>s.trimEnd().split('\n').map(s=>'    '+safe(s))));if(a.history)lines.push(`    History as of ${a.history.asOf??'?'}; imported ${a.history.lastImportedAt??'?'}; ${a.history.acquisitionOutcome}`);}
 }
 if(pullReport) {
  lines.push('Refreshing market evidence...');
  if(report.market) {
   const m=report.market,rows=m.batches.flatMap(b=>b.results),acquired=rows.filter(r=>r.outcome==='NEWLY_ACQUIRED').length,reused=rows.filter(r=>r.outcome==='REUSED').length,failed=rows.filter(r=>!r.fulfilled).length+m.errors.reduce((n,e)=>n+e.symbols.length,0);
   lines.push(`  Quotes  ${acquired} acquired, ${reused} reused, ${failed} failed; ${m.selection.subjects.length} backend-selected subjects`);
   if(!m.selection.subjects.length)lines.push('  Empty selection; no market acquisition attempted.');
   for(const c of m.selection.coverage)if(['UNAVAILABLE','INCOMPLETE'].includes(c.status)||verbose)lines.push(`  ${ink(`${c.source} ${c.status}`,'93')}${c.accountId&&verbose?' '+c.accountId:''}: ${c.qualifications.map(safe).join(' ')}`);
   for(const row of rows)if(!row.fulfilled)lines.push(`  ${safe(row.subject.symbol)}: ${row.outcome}${row.priorRetained?'; prior evidence retained':''}`);
   for(const e of m.errors)lines.push('  '+e.message);
  }else lines.push('  '+ink(report.error??'Market update unavailable','93'));
 }
 lines.push(pullReport?(report.complete?'Pull completed.':'Pull incomplete; successful updates retained.'):(report.sync.complete?'Sync completed.':'Sync incomplete; successful updates retained.'));
 lines.push('History lifetime coverage unknown; Account observations have independent clocks.');
 return (color?'\x1b[97m':'')+lines.join('\n')+'\n'+(color?'\x1b[0m':'');
}
