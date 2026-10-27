import { canonicalAccountId } from '../../scripts/ww-accounts.mjs';
import { readBackend, UUID, problemResult } from './backend.mjs';

/** Brokerage inventory is an existing backend resource, independent of Position lifecycle. */
export async function inspectHoldings({ account } = {}, config) {
  const discovery = await readBackend('/v2/accounts', config);
  if (discovery.error) return problemResult(discovery.error);
  if (discovery.data?.requestId !== discovery.requestId || !Array.isArray(discovery.data.accounts)) throw new Error('Invalid Account discovery.');
  const selected = account === undefined ? discovery.data.accounts : discovery.data.accounts.filter(a => a.alias === account);
  if (account !== undefined && selected.length !== 1) return { isError: true, content: [{ type: 'text', text: JSON.stringify({
    outcome: 'unavailable', explanation: 'Exact authorized Account nickname required.',
    availableAccounts: discovery.data.accounts.map(a => ({ nickname: a.alias, broker: a.brokerAssociation?.broker })) }) }] };
  const accounts = [];
  for (const item of selected) {
    if (!canonicalAccountId(item.id)) throw new Error('Invalid Account identity.');
    const result = { nickname: item.alias, broker: item.brokerAssociation?.broker, complete: false, holdings: [], problems: [], warnings: [] };
    let path = '/v2/holdings?' + new URLSearchParams({ accountId: item.id, limit: '25' });
    const seen = new Set();
    for (let page = 0; page < 20; page++) {
      if (seen.has(path)) throw new Error('Repeated holdings continuation.');
      seen.add(path);
      const response = await readBackend(path, config);
      if (response.error) { result.problems.push(response.error); break; }
      const data = response.data;
      if (!Array.isArray(data?.items) || data.items.some(h => !UUID.test(h.id ?? '') || h.account?.href !== '/v2/accounts/' + item.id)) throw new Error('Invalid holdings scope.');
      result.warnings.push(...(data.warnings ?? []));
      for (const h of data.items) result.holdings.push({
        id: h.id, sourceInstrument: h.sourceInstrument, kind: h.kind, side: h.side,
        quantity: h.quantity, unit: h.unit, sourceUnit: h.sourceUnit ?? null,
        snapshotId: h.snapshotId, snapshotCoverage: h.snapshotCoverage,
        observedAt: h.observedAt, observationDate: h.observationDate, receivedAt: h.receivedAt,
        evidence: h.evidence, warnings: h.warnings
      });
      if (data.next == null) { result.complete = true; break; }
      const next = new URL(data.next.href, config.base);
      if (next.origin !== new URL(config.base).origin || next.pathname !== '/v2/holdings' ||
          next.searchParams.get('accountId') !== item.id || next.searchParams.get('limit') !== '25' ||
          !next.searchParams.get('cursor') || [...next.searchParams.keys()].some(k => !['accountId','limit','cursor'].includes(k)))
        throw new Error('Invalid holdings continuation scope.');
      path = next.pathname + next.search;
    }
    accounts.push(result);
  }
  return { content: [{ type: 'text', text: JSON.stringify({
    requestId: discovery.requestId, outcome: accounts.every(a => a.complete) ? 'COMPLETE_AUTHORIZED_READ' : 'PARTIAL',
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE' } : {}),
    accounts, qualification: 'Brokerage holdings from each Account’s backend-selected latest retained custody cut. This is not a lifecycle OPEN filter or proof of live/current brokerage custody. Preserve source dates and snapshot coverage. A forbidden Account is not empty; incomplete reads are not full inventory. No returned rows alone do not establish an empty live Account. Holdings permission is distinct from Position lifecycle permission. Do not replace a denied holdings read with an OPEN lifecycle query or claim that unresolved lifecycle state means no holdings.'
  }) }] };
}
