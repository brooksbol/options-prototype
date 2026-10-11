import {ShowError,showConfig} from './ww-show.mjs';
export const canonicalAccountId = id => /^acct_[a-f0-9]{32}$/.test(id ?? '');
/** Friendly-name discovery only; REST requests never substitute aliases for IDs. */
export async function readAccounts(token,{base=process.env.WW_BASE_URL,fetchImpl=fetch}={}) {
  const {url}=showConfig(token,base);
  let response;
  try { response=await fetchImpl(new URL('/v2/accounts',url),{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`}}); }
  catch { throw new ShowError('account discovery: Wheelwright request failed'); }
  let text;try{text=await response.text();}catch{throw new ShowError('account discovery: truncated response');}
  if(text.includes(token))throw new ShowError('account discovery: response contains credential');
  let data;try{data=JSON.parse(text);}catch{throw new ShowError('account discovery: invalid backend JSON');}
  const id=response.headers.get('x-request-id');
  if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id??'')||data.requestId!==id)throw new ShowError('account discovery: invalid response correlation');
  if(response.status!==200)throw new ShowError(`account discovery: backend status ${response.status} (request ${id})`);
  if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??'')||!Array.isArray(data.accounts))throw new ShowError('account discovery: invalid representation');
  const ids=new Set(),aliases=new Set();
  for(const account of data.accounts){
    if(!canonicalAccountId(account.id)||typeof account.alias!=='string'||typeof account.displayName!=='string'||
       typeof account.brokerAssociation?.accountNumber!=='string'||typeof account.brokerAssociation?.broker!=='string'||ids.has(account.id)||aliases.has(account.alias))throw new ShowError('account discovery: invalid Account metadata');
    ids.add(account.id);aliases.add(account.alias);
  }
  return data.accounts;
}
export async function resolveAccount(alias,token,options={}) {
  const accounts=await readAccounts(token,options);
  const account=accounts.find(a=>a.alias===alias);
  if(!account)throw new ShowError('account discovery: alias unavailable in authorized account scope');
  return account;
}

export const ACCOUNTS_HELP = `Usage: ww ls accounts [--table | --tsv | --jsonl]

List the accounts you can access, including the alias used in other commands.

Examples:
  ww ls accounts
  ww sync account pts
  ww show positions --account pts --verbose

Terminal output is a table; redirected output is headerless TSV.
Use --table to keep the table when redirecting, or --jsonl for one Account per line.`;

export function renderAccounts(accounts,{format,tty=false}={}) {
  if(format==='jsonl')return accounts.map(a=>JSON.stringify(a)+'\n').join('');
  const clean=value=>String(value).replace(/[\x00-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  const rows=accounts.map(a=>[a.alias,a.displayName,a.brokerAssociation.broker,a.brokerAssociation.accountNumber,a.id].map(clean));
  if(format==='tsv'||(!format&&!tty))return rows.map(row=>row.join('\t')+'\n').join('');
  if(!rows.length)return 'No accounts available.\n';
  const headers=['ALIAS','NAME','BROKER','BROKER ACCOUNT','ID'];
  const widths=headers.map((h,i)=>Math.max(h.length,...rows.map(row=>row[i].length)));
  return [headers,...rows].map(row=>row.map((cell,i)=>i===row.length-1?cell:cell.padEnd(widths[i])).join('  ')).join('\n')+'\n';
}
