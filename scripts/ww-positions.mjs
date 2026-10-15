import { canonicalAccountId } from './ww-accounts.mjs';
import { ShowError, showConfig, parseShowJson, humanShowNumber } from './ww-show.mjs';

export const POSITIONS_HELP = `Usage: ww positions [--account ACCOUNT] [--snapshot SNAPSHOT_ID] [--verbose | --jsonl | --table] [--no-color]
Compatibility alias: ww show positions (same arguments and output).
Read admitted backend Positions; never reads a client database or contacts a broker.
Without --account, inspect available evidence across all authorized Accounts.
--verbose  Aligned terminal presentation with constituents and evidence, also when piped.
--table    Compact aligned presentation, also when piped.
--jsonl    One complete backend read representation (default when piped).
Aliases resolve through authorized backend Account discovery. REST uses opaque Account IDs.
Requires WW_API_TOKEN, account.read:ID and account.positions.read:ID.
--snapshot  Requires --account; select an exact retained observation, without as-of inference.
Human default: one compact table, BROKER then ACCOUNT, across returned Positions. DTE(today) uses inspection date in New York;
? means unavailable/unknown. Inventory dates do not establish events or intraday order.
--verbose includes full snapshot identity, provenance, evaluation time and qualifications.
JSONL preserves the complete backend read, including all qualifications.`;

export function parsePositions(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return { help: true };
  let account, snapshotId, verbose = false, format, noColor = false;
  const bad = () => { throw new ShowError('show positions: invalid usage; see ww show positions --help', 2); };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--account') { if (account !== undefined) bad(); account = args[++i]; }
    else if (a === '--snapshot') { if (snapshotId !== undefined) bad(); snapshotId = args[++i]; if (!snapshotId?.trim() || snapshotId.startsWith('--')) bad(); }
    else if (a === '--verbose' || a === '-v') { if (verbose) bad(); verbose = true; }
    else if (a === '--no-color') { if(noColor) bad(); noColor=true; }
    else if (['--jsonl', '--table'].includes(a)) { if (format) bad(); format = a.slice(2); }
    else bad();
  }
  if (account !== undefined && !/^[a-z][a-z0-9-]{0,31}$/.test(account) || snapshotId !== undefined && account === undefined || verbose && format === 'jsonl') bad();
  if (args.includes('--account') && account === undefined) bad();
  return { account, verbose, format, ...(snapshotId === undefined ? {} : {snapshotId}), ...(noColor ? {noColor} : {}) };
}
const safe = value => String(JSON.isRawJSON(value) ? value.rawJSON : value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
const number = (value, money = false) => value == null ? '?' : humanShowNumber(value, money ? 'price' : 'integer');
const quantity = v => v == null ? '?' : JSON.isRawJSON(v) ? v.rawJSON : String(v);
const numeric = v => v === null || JSON.isRawJSON(v);
export function validatePositions(data, account, requestId) {
  const fail = () => { throw new ShowError('show positions: invalid backend representation'); };
  if (data?.accountId !== account || data.requestId !== requestId || !Array.isArray(data.positions) ||
      !Array.isArray(data.qualifications) || typeof data.snapshotId !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.evidenceDate) || typeof data.recordedAt !== 'string' ||
      typeof data.sourceFile !== 'string' || !/^[a-f0-9]{64}$/.test(data.sourceSha256) ||
      data.workingOrderCoverage !== 'UNKNOWN') fail();
  if(data.observation!=null) {
    const o=data.observation;
    if(o.broker!=='TASTYTRADE'||o.environment!=='PRODUCTION'||
      o.interpretationVersion!=='tastytrade-holdings-v1'||o.sourceScope!=='REQUESTED_ACCOUNT_FULL_HOLDINGS'||
      typeof o.acquisitionId!=='string'||!Number.isFinite(Date.parse(o.startedAt))||!Number.isFinite(Date.parse(o.receivedAt))||
      Date.parse(o.startedAt)>Date.parse(o.receivedAt))fail();
  }
  const ids = new Set(), holdings = new Set();
  for (const p of data.positions) {
    if (typeof p.positionId !== 'string' || ids.has(p.positionId) || typeof p.label !== 'string' ||
        !Array.isArray(p.constituents) || !p.constituents.length || !Array.isArray(p.qualifications) ||
        ![p.openPl, p.marketValue, p.shareEquivalentDelta, p.capitalRequirement ?? null].every(numeric)) fail();
    ids.add(p.positionId);
    for (const leg of p.constituents) {
      const h = leg.holding;
      if (!h || typeof h.holdingId !== 'string' || holdings.has(h.holdingId) || typeof h.contract !== 'string' ||
          typeof h.custody !== 'string' || typeof leg.state !== 'string' || !Array.isArray(h.sourceRows) ||
          !JSON.isRawJSON(h.quantity) || ![h.openPl, h.marketValue, h.bid, h.ask, leg.dte, leg.shareEquivalentDelta].every(numeric)) fail();
      holdings.add(h.holdingId);
    }
  }
  return data;
}
export async function readPositions(account, token, { base = process.env.WW_BASE_URL, fetchImpl = fetch, snapshotId } = {}) {
  const data = await positionRequest(account, token, {base, fetchImpl, snapshotId});
  const id = data.requestId;
  if (!Array.isArray(data.snapshots) || data.snapshots.length !== 1) throw new ShowError("show positions: invalid Position collection");
  const result = validatePositions(data.snapshots[0], account, id);
  if (snapshotId !== undefined && (result.snapshotId !== snapshotId || result.evaluationBasis !== 'INSPECTION_TIME' || !validContext(result.observationContext)))
    throw new ShowError('show positions: selected observation mismatch or missing context');
  return result;
}
export async function readPositionCollection(token, options = {}) {
  const data = await positionRequest(undefined, token, options);
  if (!Array.isArray(data.snapshots)) throw new ShowError('positions: invalid Position collection');
  const seen = new Set();
  for (const snapshot of data.snapshots) {
    if (!canonicalAccountId(snapshot?.accountId) || seen.has(snapshot.accountId))
      throw new ShowError('positions: invalid or duplicate Account in Position collection');
    seen.add(snapshot.accountId);
    validatePositions(snapshot, snapshot.accountId, data.requestId);
  }
  return data.snapshots;
}
async function positionRequest(account, token, {base = process.env.WW_BASE_URL, fetchImpl = fetch, snapshotId, view} = {}) {
  const command = view ? 'ls position-observations' : 'show positions';
  if (account !== undefined && !canonicalAccountId(account)) throw new ShowError(`${command}: canonical Account ID required`);
  const config = showConfig(token, base);
  const url = new URL('/v2/positions', config.url);
  if (account !== undefined) url.searchParams.set('accountId', account);
  if (snapshotId !== undefined) url.searchParams.set('snapshotId', snapshotId);
  if (view !== undefined) url.searchParams.set('view', view);
  let response;
  try { response = await fetchImpl(url, { method: 'GET', redirect: 'error', headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new ShowError(`${command}: Wheelwright request failed`); }
  const id = response.headers.get('x-request-id');
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id ?? '')) throw new ShowError(`${command}: invalid response correlation`);
  let text;
  try { text = await response.text(); } catch { throw new ShowError(`${command}: truncated response`); }
  if (text.includes(token)) throw new ShowError(`${command}: response contains credential`);
  const data = parseShowJson(text);
  if (response.status !== 200) {
    const codes = {401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',422:'INVALID_REQUEST',500:'INTERNAL_ERROR',503:'CAPABILITY_UNAVAILABLE'};
    if (!/^application\/problem\+json(?:;|$)/i.test(response.headers.get('content-type') ?? '') ||
        data?.code !== codes[response.status] || data.requestId !== id) throw new ShowError(`${command}: invalid Problem response`);
    throw new ShowError(`${command}: ${safe(data.code)}: ${safe(data.detail ?? data.title)} (request ${id})`);
  }
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new ShowError(`${command}: invalid response media type`);
  if (data.requestId !== id) throw new ShowError("positions: invalid response correlation");
  return data;
}
export function renderPositions(data, { verbose = false, format, tty = false, accountLabel, noColor=false, env=process.env } = {}) {
  if (format === 'jsonl' || !tty && !verbose && format !== 'table') return JSON.stringify(data) + '\n';
  const color=!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb';
  const ink=(text,code)=>color?`\x1b[${code}m${text}\x1b[97m`:text;
  if (!verbose) return renderCompactPositions([data],{accountLabel,color,ink});
  const unavailable=text=>text.replace(/\?/g,()=>ink('?','37'));
  // Indentation is inside the label cell. All numeric cells share the same absolute offsets.
  const headers = ['POSITION / CONTRACT', 'QTY', 'DTE', 'OPEN P/L', 'DELTA(sh)', 'CAP REQ', 'MKT VALUE', 'BID / ASK', 'STATE / TERMS'];
  const rows = [];
  for (const p of data.positions) {
    const one=p.constituents.length===1?p.constituents[0]:null;
    rows.push([safe(p.label), one?quantity(one.holding.quantity):'', one?number(one.dte):'', number(p.openPl, true), number(p.shareEquivalentDelta), number(p.capitalRequirement, true), number(p.marketValue, true), '? / ?', one?safe(one.state):'OBSERVED']);
    if (verbose) for (const leg of p.constituents) {
      const h = leg.holding;
      rows.push(['  ' + safe(h.contract), quantity(h.quantity), number(leg.dte), number(h.openPl, true), number(leg.shareEquivalentDelta), number(leg.capitalRequirement, true), number(h.marketValue, true), `${number(h.bid, true)} / ${number(h.ask, true)}`, `${safe(h.custody)}; ${safe(leg.state)}`]);
    }
  }
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(row => row[i].length)));
  const line = row => row.map((v,i)=> {
    const padded=i>0&&i<8?v.padStart(widths[i]):v.padEnd(widths[i]);
    if([3,6].includes(i)&&/^-/.test(v.trim())&&v.trim()!=='?')return ink(padded,'91');
    if([3,6].includes(i)&&/^\d/.test(v.trim())&&/[1-9]/.test(v.trim()))return ink(padded,'92');
    return unavailable(padded);
  }).join('  ').trimEnd();
  const width = widths.reduce((a, b) => a + b, 0) + 2 * (headers.length - 1);
  const separator = '-'.repeat(width), section = '  ' + '-'.repeat(width - 2);
  const out = [`${ink(safe(accountLabel ?? data.accountId),accountLabel?'96':'38;5;240')} — ${safe(data.accountName)} | ${ink(data.observation?'tastytrade':'Fidelity',data.observation?'91':'32')} snapshot ${safe(data.evidenceDate)} | ${data.positions.length} Positions`,
    'Retained observation; ? = unavailable/unknown. DTE is calendar days from today in New York; no expiry execution inferred.', line(headers)];
  let index = 0;
  for (const p of data.positions) {
    out.push(separator, line(rows[index++]));
    if (verbose) {
      for (const leg of p.constituents) out.push(line(rows[index++]));
      out.push(section, `  Identity: ${ink(safe(p.positionId),'38;5;240')} (${safe(p.identityBasis)})`,
        `  Program: ${safe(p.program ?? 'unknown')}${p.associationAuthority ? '; authority: ' + safe(p.associationAuthority) : ''}`);
      for (const leg of p.constituents) out.push(`  Evidence: ${safe(leg.holding.holdingId)}; source indices ${leg.holding.sourceRows.map(v => number(v)).join(', ')}; ${safe(leg.holding.description)}`);
      for (const leg of p.constituents) if (leg.marketEvidence) out.push(`  Market/margin evidence: ${safe(leg.marketEvidence.sourceFile)}; ${safe(leg.marketEvidence.evidenceDate)}; artifact ${safe(leg.marketEvidence.artifactId)}; CSV rows ${leg.marketEvidence.sourceRows.map(v=>number(v)).join(', ')}`);
      for (const note of p.qualifications) out.push('  ' + safe(note));
      out.push(section, '  Close terms: unknown; no operator exit policy established.');
    }
  }
  if (!data.positions.length) out.push('No Positions reported in the admitted snapshot.');
  out.push(separator, `WORKING BROKERAGE ORDERS — ${ink('coverage unknown','93')}; this source does not report orders.`,
    'Working orders are separate from holdings. No execution, absence of orders, or exit policy is inferred.');
  out.push(`Snapshot: ${safe(data.snapshotId)}`,
    'Historical inventory observation; derived fields evaluated at inspection time. Not historical evaluation replay.');
  out.push(`Evidence: ${safe(data.sourceFile)} | artifact ${safe(data.artifactId ?? 'unavailable')} | SHA256 ${safe(data.sourceSha256)}`);
  if(data.observation)out.push(`Acquisition interval (UTC): ${safe(data.observation.startedAt)} → ${safe(data.observation.receivedAt)}; ${ink('opening attribution unresolved','93')}`);
  if (verbose) out.push(`Snapshot: ${safe(data.snapshotId)} | admitted ${safe(data.recordedAt)} | evaluated ${safe(data.evaluatedAt)} | request ${safe(data.requestId)}`);
  for (const note of data.qualifications) out.push(safe(note));
  out.push(`${data.observation?'Excluded broker-reported zero-quantity rows':'Excluded cash/pending/non-quantity rows'}: ${number(data.excludedNonPositionRows)}; retained in source evidence.`);
  return out.map(line=>color?`\x1b[97m${line}\x1b[0m`:line).join('\n') + '\n';
}


export function renderPositionCollection(snapshots, {accounts = [], ...options} = {}) {
  const human = options.format !== 'jsonl' && (options.tty || options.verbose || options.format === 'table');
  if (!human || options.verbose) {
    const output = snapshots.map(data => renderPositions(data, {
      ...options, accountLabel: accounts.find(a => a.id === data.accountId)?.alias,
    })).join(human ? '\n' : '');
    return output || (human ? 'No admitted Positions available in authorized Accounts.\n' : '');
  }
  const env = options.env ?? process.env;
  const color = !options.noColor && !Object.hasOwn(env,'NO_COLOR') && env.TERM !== 'dumb';
  const ink = (text,code) => color ? `\x1b[${code}m${text}\x1b[97m` : text;
  return renderCompactPositions(snapshots,{accounts,color,ink});
}

// Human typography only: preserve raw source identities and explicit association labels.
function compactContractLabel(position) {
  const leg = position.constituents.length === 1 ? position.constituents[0] : null;
  const holding = leg?.holding;
  if (holding?.kind !== 'Options' || position.label !== holding.contract ||
      position.identityBasis === 'EXPLICIT_SNAPSHOT_ASSOCIATION') return safe(position.label);
  const raw = holding.contract;
  const occ = /^([A-Z][A-Z0-9.]{0,9}) +(\d{6})([CP])(\d{8})$/.exec(raw);
  const fidelity = /^-([A-Z][A-Z0-9.]*)(\d{6})([CP])(\d+(?:\.\d+)?)$/.exec(raw);
  const match = occ ?? fidelity;
  if (!match) return safe(position.label);
  const [, root, day, side, sourceStrike] = match;
  // Display only a source spelling consistent with the backend-published expiration.
  if (holding.expiration !== `20${day.slice(0,2)}-${day.slice(2,4)}-${day.slice(4,6)}`)
    return safe(position.label);
  const encoded = occ ? `${sourceStrike.slice(0,-3)}.${sourceStrike.slice(-3)}` : sourceStrike;
  const [integer, fraction = ''] = encoded.split('.');
  const whole = integer.replace(/^0+(?=\d)/,'');
  const decimals = fraction.replace(/0+$/,'');
  return `${root} ${day}${side}${whole}${decimals ? '.' + decimals : ''}`;
}

function renderCompactPositions(snapshots,{accounts = [],accountLabel,color,ink}) {
  const headers=['BROKER','ACCOUNT','POSITION / CONTRACT','CUSTODY','QTY','DTE(today)','OPEN P/L','MKT VALUE','STATE'];
  const rows=snapshots.flatMap(data=>data.positions.map(p=>{
    const leg=p.constituents.length===1?p.constituents[0]:null;
    const state=leg?safe(leg.state).replace(' / obligation reported','').replace(' / right reported','').replace(/ reported$/,''):'OBSERVED';
    const alias=accountLabel??accounts.find(a=>a.id===data.accountId)?.alias;
    return [data.observation?'tastytrade':'Fidelity',safe(alias??data.accountId),compactContractLabel(p),leg?(leg.holding.custody==='BROKER_REPORTED'?'?':safe(leg.holding.custody)):'',leg?quantity(leg.holding.quantity):'',leg?number(leg.dte):'',number(p.openPl,true),number(p.marketValue,true),state];
  }));
  if(!snapshots.some(data=>data.positions.some(p=>p.constituents.some(l=>l.holding.custody!=='BROKER_REPORTED')))) {
    headers.splice(3,1);for(const row of rows)row.splice(3,1);
  }
  const widths=headers.map((h,i)=>Math.max(h.length,...rows.map(row=>row[i].length)));
  const aliases=new Set(accounts.map(a=>safe(a.alias)));if(accountLabel)aliases.add(safe(accountLabel));
  const line=(row,header=false)=>row.map((v,i)=>{
    const padded=['QTY','DTE(today)','OPEN P/L','MKT VALUE'].includes(headers[i])?v.padStart(widths[i]):v.padEnd(widths[i]);
    if(!header&&headers[i]==='BROKER')return ink(padded,v==='tastytrade'?'91':'32');
    if(!header&&headers[i]==='ACCOUNT')return ink(padded,aliases.has(v)?'96':'38;5;240');
    if(!header&&['OPEN P/L','MKT VALUE'].includes(headers[i])&&/^-/.test(v.trim()))return ink(padded,'91');
    if(!header&&['OPEN P/L','MKT VALUE'].includes(headers[i])&&/^\d/.test(v.trim())&&/[1-9]/.test(v.trim()))return ink(padded,'92');
    return padded.replace(/\?/g,()=>ink('?','37'));
  }).join('  ').trimEnd();
  const out=[line(headers,true),...(rows.length?rows.map(row=>line(row)):['No Positions reported.'])];
  return out.map(v=>color?`\x1b[97m${v}\x1b[0m`:v).join('\n')+'\n';
}


export const OBSERVATIONS_HELP = `Usage: ww ls position-observations --account ACCOUNT [--table | --tsv | --jsonl] [--verbose] [--no-color]
List all retained admitted Position observations in authorized Account scope; no acquisition.
Terminal default: aligned table. Redirected default: headerless TSV. --table forces table.
--jsonl emits one complete summary per line. --verbose implies table, adds provenance and
qualifications, and conflicts with --tsv/--jsonl. Full snapshot IDs are never abbreviated.
Display order is not brokerage chronology. No automatic predecessor or as-of selection.
TSV columns: accountId, snapshotId, broker, evidenceDate, evidenceDateBasis,
evidenceDatePrecision, holdingCount, recordedAt, acquisitionStartedAt,
acquisitionReceivedAt, artifactId, sourceFile, sourceSha256.
Null TSV cells are empty; backslash/tab/CR/LF escape as \\\\, \\t, \\r, \\n.
Account nicknames resolve through authorized backend discovery; requires account.read
and account.positions.read for that Account. Original bytes require separate authority.`;
export function parseObservations(args) {
  if (args.length === 1 && ['--help','-h','--man'].includes(args[0])) return {help:true};
  let account, format, verbose=false, noColor=false;
  const bad=()=>{throw new ShowError('ls position-observations: invalid usage; see ww ls position-observations --help',2);};
  for(let i=0;i<args.length;i++) {
    const a=args[i];
    if(a==='--account') {if(account!==undefined)bad();account=args[++i];}
    else if(['--table','--tsv','--jsonl'].includes(a)) {if(format)bad();format=a.slice(2);}
    else if(a==='--verbose'||a==='-v') {if(verbose)bad();verbose=true;}
    else if(a==='--no-color') {if(noColor)bad();noColor=true;}
    else bad();
  }
  if(!/^[a-z][a-z0-9-]{0,31}$/.test(account??'') || verbose && ['tsv','jsonl'].includes(format))bad();
  return {account,format,verbose,noColor};
}
const validContext=c=>c?.evidenceDatePrecision==='DAY' &&
  (c.broker==='FIDELITY' && c.evidenceDateBasis==='FIDELITY_EXPORT_DATE' ||
   c.broker==='TASTYTRADE' && c.evidenceDateBasis==='BACKEND_RECEIPT_UTC_DATE');
export async function readObservations(account,token,{base=process.env.WW_BASE_URL,fetchImpl=fetch}={}) {
  const data=await positionRequest(account,token,{base,fetchImpl,view:'observations'});
  const bad=()=>{throw new ShowError('ls position-observations: invalid backend catalog');};
  if(!Array.isArray(data.observations))bad();
  const ids=new Set();
  for(const s of data.observations) {
    if(s?.requestId!==data.requestId || s.accountId!==account || typeof s.accountName!=='string' ||
       typeof s.snapshotId!=='string' || !s.snapshotId.trim() || ids.has(s.snapshotId) ||
       !/^\d{4}-\d{2}-\d{2}$/.test(s.evidenceDate) || !Number.isFinite(Date.parse(s.recordedAt)) ||
       typeof s.sourceFile!=='string' || !/^[a-f0-9]{64}$/.test(s.sourceSha256) ||
       !(s.artifactId===null||typeof s.artifactId==='string') ||
       !JSON.isRawJSON(s.holdingCount) || !/^(0|[1-9]\d*)$/.test(s.holdingCount.rawJSON) ||
       !validContext(s.observationContext) || !Array.isArray(s.qualifications) || s.qualifications.some(q=>typeof q!=='string'))bad();
    const o=s.observation;
    if(s.observationContext.broker==='FIDELITY') {if(o!==null)bad();}
    else if(o?.broker!=='TASTYTRADE'||o.environment!=='PRODUCTION'||typeof o.acquisitionId!=='string'||
       o.interpretationVersion!=='tastytrade-holdings-v1'||o.sourceScope!=='REQUESTED_ACCOUNT_FULL_HOLDINGS'||
       !Number.isFinite(Date.parse(o.startedAt))||!Number.isFinite(Date.parse(o.receivedAt))||Date.parse(o.startedAt)>Date.parse(o.receivedAt))bad();
    ids.add(s.snapshotId);
  }
  return data.observations;
}
const tsv=value=>String(JSON.isRawJSON(value) ? value.rawJSON : value??'').replace(/\\/g,'\\\\').replace(/\t/g,'\\t').replace(/\r/g,'\\r').replace(/\n/g,'\\n');
export function renderObservations(observations,{format,verbose=false,tty=false,noColor=false,env=process.env,accountLabel}={}) {
  if(format==='jsonl')return observations.map(s=>JSON.stringify(s)+'\n').join('');
  if(format==='tsv'||!format&&!tty&&!verbose)return observations.map(s=>[
    s.accountId,s.snapshotId,s.observationContext.broker,s.evidenceDate,s.observationContext.evidenceDateBasis,
    s.observationContext.evidenceDatePrecision,s.holdingCount,s.recordedAt,s.observation?.startedAt,
    s.observation?.receivedAt,s.artifactId,s.sourceFile,s.sourceSha256].map(tsv).join('\t')+'\n').join('');
  if(!observations.length)return `No retained Position observations for ${safe(accountLabel??'Account')}.\n`;
  const rows=observations.map(s=>[s.snapshotId,s.evidenceDate,s.observationContext.evidenceDateBasis,s.holdingCount,s.recordedAt].map(safe));
  const headers=['SNAPSHOT ID','EVIDENCE DATE','DATE BASIS','HOLDINGS','RECORDED UTC'];
  const widths=headers.map((v,i)=>Math.max(v.length,...rows.map(row=>row[i].length)));
  const line=row=>row.map((v,i)=>i===3?v.padStart(widths[i]):v.padEnd(widths[i])).join('  ').trimEnd();
  const out=[`${safe(accountLabel??observations[0].accountId)} — retained Position observations`,line(headers),...rows.map(line)];
  if(verbose)for(const s of observations)out.push(`Snapshot: ${safe(s.snapshotId)} | Account: ${safe(s.accountId)}`,
    `Evidence: ${safe(s.sourceFile)} | artifact ${safe(s.artifactId??'unavailable')} | SHA256 ${safe(s.sourceSha256)}`,
    ...(s.observation?[`Acquisition interval (UTC): ${safe(s.observation.startedAt)} → ${safe(s.observation.receivedAt)}`]:[]),...s.qualifications.map(safe));
  const color=!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb';
  return out.map((v,i)=>{
    if(!color)return v;
    if(i===0&&accountLabel)v=v.replace(safe(accountLabel),`\x1b[96m${safe(accountLabel)}\x1b[97m`);
    if(v.startsWith('Snapshot: ')&&v.includes(' | Account: '))v=v.replace(/( \| Account: )(.*)$/,`$1\x1b[38;5;240m$2\x1b[97m`);
    return `\x1b[97m${v}\x1b[0m`;
  }).join('\n')+'\n';
}
