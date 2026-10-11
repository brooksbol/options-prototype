import { resolveAccount, canonicalAccountId } from './ww-accounts.mjs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ShowError, showConfig } from './ww-show.mjs';

export const SYNC_HELP = `Usage: ww sync account ACCOUNT

Update an account from Fidelity CSV downloads in ~/Downloads.

Examples:
  ww sync account pts
  ww sync account sawdust

Download your brokerage CSVs, then run this command. Wheelwright finds
supported files for the account, skips files already saved, and processes
new files oldest first. Unrelated files are ignored.

If a file fails, sync stops and reports it. Run the same command again
to retry and continue.

SYNC COMPLETE means all eligible files found have been saved and processed.
It does not mean your brokerage history is complete; coverage is reported
separately.`;
export function parseSync(args) {
  if (args.length === 1 && ['--help','-h'].includes(args[0])) return { help: true };
  if (args.length !== 2 || args[0] !== 'account' || !/^[a-z][a-z0-9-]{0,31}$/.test(args[1]))
    throw new ShowError('sync: invalid usage; see ww sync --help', 2);
  return { account: args[1] };
}
const safe = s => String(s).replace(/[\x00-\x1f\x7f-\x9f]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
export const filenameParameter = name => encodeURIComponent(name).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
export function classifyExport(filename, text, brokerAccount) {
  if (/^\uFEFF?Account number,Account name,Investment type,Symbol,/.test(text) || /^Account number,Account name,Investment type,Symbol,/.test(text)) {
    // Detection only. Backend owns parsing, admission and authoritative account validation.
    if (text.split(/\r?\n/).some(line => line.startsWith(brokerAccount + ','))) return 'POSITIONS';
    return null;
  }
  if (text.includes('Fidelity Investments - Option Summary ' + brokerAccount) && text.includes('Expiration & Strike')) return 'OPTION_SUMMARY';
  const escaped = brokerAccount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`^History_for_Account_${escaped}(?:[- (].*)?\\.csv$`, 'i').test(filename) && text.includes('Run Date,Action,Symbol,')) return 'ACTIVITY';
  if (new RegExp(`^Balances_for_Account_${escaped}(?:[- (].*)?\\.csv$`, 'i').test(filename) && text.includes('Balance,Day change')) return 'BALANCES';
  return null;
}
export function exportOrder(text, modifiedAt) {
  // A broker-provided download clock (ET) outranks filesystem time. Date-only observations
  // cannot order downloads within a day, so they fall back to mtime rather than inventing a clock.
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const match = /Date downloaded\s+(?:(\d{1,2})\/(\d{1,2})\/(\d{4})|([A-Za-z]{3})-(\d{2})-(\d{4}))\s+(?:at\s+)?(\d{1,2}):(\d{2})\s*([ap])\.?m\.?\s*(ET)?/i.exec(text);
  if (!match || !match[10]) return { time: modifiedAt, basis: 'filesystem mtime fallback' };
  const month = match[1] ? +match[1] : months.findIndex(m => m.toLowerCase() === match[4].toLowerCase()) + 1;
  const day = +(match[2] ?? match[5]), year = +(match[3] ?? match[6]);
  const hour = +match[7] % 12 + (match[9].toLowerCase() === 'p' ? 12 : 0), minute = +match[8];
  if (month < 1 || month > 12 || day < 1 || day > 31 || +match[7] < 1 || +match[7] > 12 || minute > 59)
    return { time: modifiedAt, basis: 'filesystem mtime fallback' };
  // Resolve America/New_York offset using Intl for the date, including DST.
  const nominal = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',timeZoneName:'shortOffset'}).formatToParts(new Date(nominal));
  const offset = /GMT([+-])(\d+)(?::(\d+))?/.exec(parts.find(p => p.type === 'timeZoneName').value);
  const minutes = offset ? (+offset[2] * 60 + +(offset[3] ?? 0)) * (offset[1] === '-' ? -1 : 1) : 0;
  return { time: nominal - minutes * 60000, basis: 'broker download timestamp ET' };
}
export async function artifactRequest(account, suffix, token, {base, fetchImpl=fetch, method='GET', headers={}, body}={}) {
  if (!canonicalAccountId(account)) throw new ShowError("sync: canonical Account ID required");
  const {url} = showConfig(token, base);
  const target = new URL(`/v2/artifacts${suffix}`, url);
  if (!suffix) target.searchParams.set("accountId",account);
  let response;
  try { response = await fetchImpl(target, { method, redirect:'error', headers:{Authorization:`Bearer ${token}`, ...headers}, body }); }
  catch { throw new ShowError('sync: Wheelwright request failed; inspect backend inventory on resume'); }
  let text;
  try { text = await response.text(); } catch { throw new ShowError('sync: truncated response; inspect backend inventory on resume'); }
  if (text.includes(token)) throw new ShowError('sync: response contains credential');
  let data; try { data = JSON.parse(text); } catch { throw new ShowError('sync: invalid backend JSON'); }
  const id = response.headers.get('x-request-id');
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id ?? '')) throw new ShowError('sync: invalid response correlation');
  if (response.status !== 200) throw new ShowError(`sync: ${safe(data.code ?? response.status)}: ${safe(data.detail ?? 'backend request failed')} (request ${id})`);
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '') || data.requestId !== id)
    throw new ShowError('sync: invalid backend representation');
  return data;
}
export async function syncAccount(account, token, { directory=join(homedir(), 'Downloads'), base,
    fetchImpl=fetch, out=s=>process.stdout.write(s) }={}) {
  const resolved = await resolveAccount(account,token,{base,fetchImpl});
  account = resolved.id;
  const inventory = await artifactRequest(account, '', token, {base,fetchImpl});
  if (inventory.accountId !== account || !/^[A-Z0-9]+$/.test(inventory.brokerAccount ?? '') || !Array.isArray(inventory.artifacts))
    throw new ShowError('sync: invalid backend account inventory');
  const byHash = new Map();
  for (const a of inventory.artifacts) {
    if (!/^[a-f0-9]{64}$/.test(a.sha256 ?? '') || !Array.isArray(a.imports) || typeof a.artifactId !== 'string')
      throw new ShowError('sync: invalid artifact inventory');
    byHash.set(a.sha256, a);
  }
  out(`Scanning ${safe(directory)}...\n`);
  const files = (await readdir(directory, {withFileTypes:true})).filter(e=>e.isFile() && /\.csv$/i.test(e.name));
  const eligible = [], ignored = [], failedDiscovery = [];
  for (const file of files) {
    try {
      const path = join(directory, file.name), bytes = await readFile(path), text = bytes.toString('utf8');
      const type = classifyExport(file.name, text, inventory.brokerAccount);
      if (!type) { ignored.push(file.name); continue; }
      const hash = createHash('sha256').update(bytes).digest('hex'), info = await stat(path);
      eligible.push({ name:file.name, bytes, type, hash, ...exportOrder(text, info.mtimeMs) });
    } catch { failedDiscovery.push(file.name); }
  }
  eligible.sort((a,b)=>a.time-b.time || a.name.localeCompare(b.name,'en'));
  const pending = [], seen = new Set(); let persisted = 0;
  for (const file of eligible) {
    const artifact = byHash.get(file.hash);
    if (artifact?.imports.some(i=>i.status === 'ACCEPTED')) { persisted++; continue; }
    if (seen.has(file.hash)) continue;
    seen.add(file.hash); pending.push({...file, artifact});
  }
  // Retained failed work must also resume when the original download has been moved/deleted.
  for (const a of inventory.artifacts) if (!a.imports.some(i=>i.status === 'ACCEPTED') && !seen.has(a.sha256)) {
    const attempt = a.imports.at(-1);
    pending.push({name:attempt?.originalFilename ?? a.artifactId,artifact:a,time:Date.parse(a.receivedAt),basis:'retained pending artifact; receipt time fallback'});
  }
  pending.sort((a,b)=>a.time-b.time || a.name.localeCompare(b.name,'en'));
  out(`CSV files found: ${files.length}\nSupported account exports: ${eligible.length}\nIgnored/unrelated: ${ignored.length}\nAlready persisted and processed: ${persisted}\nPending content artifacts: ${pending.length}\n`);
  let uploaded=0, processed=0, failed=failedDiscovery.length;
  if (failedDiscovery.length) out(`SYNC INCOMPLETE: unreadable discovered CSVs: ${failedDiscovery.map(safe).join(', ')}; no uploads attempted.\n`);
  else for (let i=0;i<pending.length;i++) {
    const file = pending[i];
    try {
      const result = file.artifact
        ? await artifactRequest(account, `/${encodeURIComponent(file.artifact.artifactId)}/imports`, token, {base,fetchImpl,method:'POST'})
        : await artifactRequest(account, '', token, {base,fetchImpl,method:'POST',body:file.bytes,
            headers:{'Content-Type':'text/csv','Content-Disposition':`attachment; filename*=UTF-8''${filenameParameter(file.name)}`,'X-Brokerage-File-Type':file.type}});
      if (typeof result.newlyPersisted !== 'boolean' || !['ACCEPTED','REJECTED'].includes(result.status) || typeof result.artifactId !== 'string')
        throw new ShowError('sync: invalid processing result; inspect backend inventory');
      if (result.newlyPersisted) uploaded++;
      out(`  ${i+1}/${pending.length} ${safe(file.name)} — ${file.artifact?'retained retry':'persisted'} · ${safe(result.status)} (${file.basis})\n`);
      if (result.status !== 'ACCEPTED') { out('  ' + safe(result.result) + '\n'); failed++; break; }
      processed++;
    } catch (error) { out(`  FAILED ${safe(file.name)}: ${safe(error.message).replaceAll(token,'[REDACTED]')}\n`); failed++; break; }
  }
  const remaining = pending.length-processed;
  out(`Uploaded: ${uploaded}\nProcessed: ${processed}\nFailed: ${failed}\nPending (including failed): ${remaining}\n`);
  out(failed || remaining ? 'SYNC INCOMPLETE\n' : 'SYNC COMPLETE: every eligible discovered content artifact durably persisted and processed.\n');
  out('COVERAGE UNKNOWN: file processing does not establish continuous brokerage history. Exact activity-row matching preserves prior observations; corrections/lifecycle continuity remain unresolved.\n');
  return {uploaded,processed,failed,pending:remaining,complete:!failed&&!remaining};
}
