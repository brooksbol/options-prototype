import {randomUUID} from 'node:crypto';
import {reportReference,readReportExport} from '../mcp-v2-evidence/report-exports.mjs';
// Session-local handles only. CSV bytes are fetched/re-authorized on demand and never stored.
export function reportDownloads({backend,clock=()=>Date.now()}){
 const refs=new Map(),ttl=15*60*1000;
 return {clear(){refs.clear();},register(tool){
  if(!['inspect_account_balances','inspect_account_transactions','prepare_report_download'].includes(tool.name)||tool.isError)return;
  try{let value=JSON.parse(tool.result);if(value.type==='text')value=JSON.parse(value.text);const report=value.reportExport??value.evidence?.csv;if(!report)return;const ref=reportReference(report.href);if(ref.sha256!==report.sha256||report.mediaType!=='text/csv')return;
   for(const[id,item]of refs)if(item.expires<=clock())refs.delete(id);if(refs.size>=100)refs.delete(refs.keys().next().value);const reportId=randomUUID();refs.set(reportId,{href:ref.href,expires:clock()+ttl});return {reportId,expiresAt:new Date(clock()+ttl).toISOString()};
  }catch{return;}
 },async read(reportId){const ref=refs.get(reportId);if(!ref||ref.expires<=clock())throw new Error('Report download expired. Refresh the report.');const file=await readReportExport(ref.href,backend);if(file.error)throw new Error('Report unavailable. Refresh the governed report.');return file;}};
}
