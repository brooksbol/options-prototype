import { canonicalAccountId } from './ww-accounts.mjs';
import { ShowError, showConfig, parseShowJson, humanShowNumber } from './ww-show.mjs';

export const POSITIONS_HELP = `Usage: ww show positions --account ACCOUNT [--verbose | --jsonl | --table]
Read admitted backend Positions; never reads a client database or contacts a broker.
--verbose  Aligned terminal presentation with constituents and evidence, also when piped.
--table    Compact aligned presentation, also when piped.
--jsonl    One complete backend read representation (default when piped).
Aliases resolve through authorized backend Account discovery. REST uses opaque Account IDs.
Requires WW_API_TOKEN, account.read:ID and account.positions.read:ID.
Snapshot dates, unknowns and historical-state qualifications are part of the result.`;

export function parsePositions(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return { help: true };
  let account, verbose = false, format;
  const bad = () => { throw new ShowError('show positions: invalid usage; see ww show positions --help', 2); };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--account') { if (account !== undefined) bad(); account = args[++i]; }
    else if (a === '--verbose' || a === '-v') { if (verbose) bad(); verbose = true; }
    else if (['--jsonl', '--table'].includes(a)) { if (format) bad(); format = a.slice(2); }
    else bad();
  }
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(account ?? '') || verbose && format === 'jsonl') bad();
  return { account, verbose, format };
}
const safe = value => String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
const number = (value, money = false) => value == null ? '?' : humanShowNumber(value, money ? 'price' : 'integer');
const numeric = v => v === null || JSON.isRawJSON(v);
export function validatePositions(data, account, requestId) {
  const fail = () => { throw new ShowError('show positions: invalid backend representation'); };
  if (data?.accountId !== account || data.requestId !== requestId || !Array.isArray(data.positions) ||
      !Array.isArray(data.qualifications) || typeof data.snapshotId !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.evidenceDate) || typeof data.recordedAt !== 'string' ||
      typeof data.sourceFile !== 'string' || !/^[a-f0-9]{64}$/.test(data.sourceSha256) ||
      data.workingOrderCoverage !== 'UNKNOWN') fail();
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
export async function readPositions(account, token, { base = process.env.WW_BASE_URL, fetchImpl = fetch } = {}) {
  if (!canonicalAccountId(account)) throw new ShowError("show positions: canonical Account ID required");
  const config = showConfig(token, base);
  const url = new URL(`/v2/positions?accountId=${encodeURIComponent(account)}`, config.url);
  let response;
  try { response = await fetchImpl(url, { method: 'GET', redirect: 'error', headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new ShowError('show positions: Wheelwright request failed'); }
  const id = response.headers.get('x-request-id');
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id ?? '')) throw new ShowError('show positions: invalid response correlation');
  let text;
  try { text = await response.text(); } catch { throw new ShowError('show positions: truncated response'); }
  if (text.includes(token)) throw new ShowError('show positions: response contains credential');
  const data = parseShowJson(text);
  if (response.status !== 200) {
    const codes = {401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',422:'INVALID_REQUEST',500:'INTERNAL_ERROR',503:'CAPABILITY_UNAVAILABLE'};
    if (!/^application\/problem\+json(?:;|$)/i.test(response.headers.get('content-type') ?? '') ||
        data?.code !== codes[response.status] || data.requestId !== id) throw new ShowError('show positions: invalid Problem response');
    throw new ShowError(`show positions: ${safe(data.code)}: ${safe(data.detail ?? data.title)} (request ${id})`);
  }
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new ShowError('show positions: invalid response media type');
  if (data.requestId !== id || !Array.isArray(data.snapshots) || data.snapshots.length !== 1) throw new ShowError("show positions: invalid Position collection");
  return validatePositions(data.snapshots[0], account, id);
}
export function renderPositions(data, { verbose = false, format, tty = false, accountLabel } = {}) {
  if (format === 'jsonl' || !tty && !verbose && format !== 'table') return JSON.stringify(data) + '\n';
  // Indentation is inside the label cell. All numeric cells share the same absolute offsets.
  const headers = ['POSITION / CONTRACT', 'QTY', 'DTE', 'OPEN P/L', 'DELTA(sh)', 'CAP REQ', 'MKT VALUE', 'BID / ASK', 'STATE / TERMS'];
  const rows = [];
  for (const p of data.positions) {
    rows.push([safe(p.label), '', '', number(p.openPl, true), number(p.shareEquivalentDelta), number(p.capitalRequirement, true), number(p.marketValue, true), '? / ?', 'OBSERVED']);
    if (verbose) for (const leg of p.constituents) {
      const h = leg.holding;
      rows.push(['  ' + safe(h.contract), number(h.quantity), number(leg.dte), number(h.openPl, true), number(leg.shareEquivalentDelta), number(leg.capitalRequirement, true), number(h.marketValue, true), `${number(h.bid, true)} / ${number(h.ask, true)}`, `${safe(h.custody)}; ${safe(leg.state)}`]);
    }
  }
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(row => row[i].length)));
  const line = row => row.map((v, i) => i > 0 && i < 8 ? v.padStart(widths[i]) : v.padEnd(widths[i])).join('  ').trimEnd();
  const width = widths.reduce((a, b) => a + b, 0) + 2 * (headers.length - 1);
  const separator = '-'.repeat(width), section = '  ' + '-'.repeat(width - 2);
  const out = [`${safe(accountLabel ?? data.accountId)} — ${safe(data.accountName)} | Fidelity snapshot ${safe(data.evidenceDate)} | ${data.positions.length} Positions`,
    'Historical observation; ? = unavailable/unknown. DTE is calendar days from today in New York; no expiry execution inferred.', line(headers)];
  let index = 0;
  for (const p of data.positions) {
    out.push(separator, line(rows[index++]));
    if (verbose) {
      for (const leg of p.constituents) out.push(line(rows[index++]));
      out.push(section, `  Identity: ${safe(p.positionId)} (${safe(p.identityBasis)})`,
        `  Program: ${safe(p.program ?? 'unknown')}${p.associationAuthority ? '; authority: ' + safe(p.associationAuthority) : ''}`);
      for (const leg of p.constituents) out.push(`  Evidence: ${safe(leg.holding.holdingId)}; CSV rows ${leg.holding.sourceRows.map(v => number(v)).join(', ')}; ${safe(leg.holding.description)}`);
      for (const leg of p.constituents) if (leg.marketEvidence) out.push(`  Market/margin evidence: ${safe(leg.marketEvidence.sourceFile)}; ${safe(leg.marketEvidence.evidenceDate)}; artifact ${safe(leg.marketEvidence.artifactId)}; CSV rows ${leg.marketEvidence.sourceRows.map(v=>number(v)).join(', ')}`);
      for (const note of p.qualifications) out.push('  ' + safe(note));
      out.push(section, '  Close terms: unknown; no operator exit policy established.');
    }
  }
  if (!data.positions.length) out.push('No Positions reported in the admitted snapshot.');
  out.push(separator, 'WORKING BROKERAGE ORDERS — coverage unknown; this export does not report orders.',
    'Working orders are separate from holdings. No execution, absence of orders, or exit policy is inferred.');
  out.push(`Evidence: ${safe(data.sourceFile)} | artifact ${safe(data.artifactId ?? 'unavailable')} | SHA256 ${safe(data.sourceSha256)}`);
  if (verbose) out.push(`Snapshot: ${safe(data.snapshotId)} | admitted ${safe(data.recordedAt)} | evaluated ${safe(data.evaluatedAt)} | request ${safe(data.requestId)}`);
  for (const note of data.qualifications) out.push(safe(note));
  out.push(`Excluded cash/pending/non-quantity rows: ${number(data.excludedNonPositionRows)}; retained in source evidence.`);
  return out.join('\n') + '\n';
}
