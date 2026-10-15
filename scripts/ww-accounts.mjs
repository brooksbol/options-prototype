import {ShowError,showConfig} from './ww-show.mjs';
export const canonicalAccountId = id => /^acct_[a-f0-9]{32}$/.test(id ?? '');
// Terminal brand approximations; categorical identity, not economic/status signals.
const brokerInk=new Map([['FIDELITY','32'],['TASTYTRADE','91']]);
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
  if(!account)throw new ShowError('account discovery: nickname unavailable in authorized account scope; run ww ls accounts');
  return account;
}

export const ACCOUNTS_HELP = `Usage: ww ls accounts [--table | --tsv | --jsonl] [--no-color]

List the accounts you can access, including the alias used in other commands.

Examples:
  ww ls accounts
  ww sync account pts
  ww positions --account pts --verbose

Terminal output is a table; redirected output is headerless TSV.
Use --table to keep the colored table when redirecting, or --jsonl for one Account per line.
Tables use cyan aliases, branded brokers (Fidelity green, tastytrade red),
bright white details and dark gray IDs.
--no-color, NO_COLOR or TERM=dumb disables color. TSV and JSONL are uncolored.`;

export function renderAccounts(accounts,{format,tty=false,noColor=false,env=process.env}={}) {
  if(format==='jsonl')return accounts.map(a=>JSON.stringify(a)+'\n').join('');
  const clean=value=>String(value).replace(/[\x00-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  const rows=accounts.map(a=>[a.alias,a.displayName,a.brokerAssociation?.broker ?? '—',maskAccountNumber(a.brokerAssociation?.accountNumber),a.id].map(clean));
  if(format==='tsv'||(!format&&!tty))return rows.map(row=>row.join('\t')+'\n').join('');
  if(!rows.length)return 'No accounts available.\n';
  const headers=['ALIAS','NAME','BROKER','BROKER ACCOUNT','ID'];
  const widths=headers.map((h,i)=>Math.max(h.length,...rows.map(row=>row[i].length)));
  const color=!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb';
  const layout=(row,header=false)=>row.map((cell,i)=>{
    const code=header?null:i===0?'96':i===2?brokerInk.get(cell):i===4?'38;5;240':null;
    const value=color&&code?`\x1b[${code}m${cell}\x1b[97m`:cell;
    return value+(i===row.length-1?'':' '.repeat(widths[i]-cell.length));
  }).join('  ');
  return [layout(headers,true),...rows.map(row=>layout(row))]
    .map(line=>color?`\x1b[97m${line}\x1b[0m`:line).join('\n')+'\n';
}
// Short or unrecognized values have no safely disclosable suffix.
export function maskAccountNumber(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]{5,}$/.test(value) ? `****${value.slice(-4)}` : '****';
}
