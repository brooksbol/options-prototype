import { canonicalAccountId } from '../../scripts/ww-accounts.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';

// Resolve a nickname through authenticated backend discovery; never infer ownership/grants.
export async function inspectPositions({ account, state, cursor }, config) {
  const inventory = await readBackend('/v2/accounts', config);
  if (inventory.error) return problemResult(inventory.error);
  if (inventory.data?.requestId !== inventory.requestId || !Array.isArray(inventory.data.accounts))
    throw new Error('Invalid authorized Account discovery.');
  const matches = inventory.data.accounts.filter(item => item.alias === account);
  if (matches.length !== 1) return { isError: true, content: [{ type: 'text', text: JSON.stringify({
    outcome: 'unavailable', requestId: inventory.requestId,
    explanation: 'Exact Account nickname unavailable in authenticated discovery; no Position read performed.',
    availableAccounts: inventory.data.accounts.map(item => ({ nickname: item.alias, broker: item.brokerAssociation?.broker })) }) }] };
  const selected = matches[0];
  if (!canonicalAccountId(selected.id)) throw new Error('Invalid canonical Account ID.');
  const query = new URLSearchParams({ accountId: selected.id, include: 'holdingSummaries', limit: '5' });
  if (state !== undefined) query.set('state', state);
  if (cursor !== undefined) query.set('cursor', cursor);
  const result = await readBackend('/v2/positions?' + query, config);
  if (result.error) return problemResult(result.error);
  if (!Array.isArray(result.data?.items) || result.data.items.some(item => !UUID.test(item.id ?? '') ||
      item.account?.href !== '/v2/accounts/' + selected.id)) throw new Error('Invalid Position scope.');
  let nextCursor = null;
  if (result.data.next != null) {
    const next = new URL(result.data.next.href, config.base);
    if (next.origin !== new URL(config.base).origin || next.pathname !== '/v2/positions' ||
        next.searchParams.get('accountId') !== selected.id || !next.searchParams.get('cursor'))
      throw new Error('Invalid Position continuation scope.');
    nextCursor = next.searchParams.get('cursor');
  }
  return { content: [{ type: 'text', text: JSON.stringify({ requestId: result.requestId, nextCursor,
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE',
      sourceQualification: 'Invented development records, not real brokerage holdings or live provider data. Broker environment labels describe the simulated source.' } : {}),
    account: { nickname: selected.alias, broker: selected.brokerAssociation?.broker },
    qualification: 'Backend Position read from its selected Account evaluation graph, not an inventory of all history or independent held market quotes. Missing linked market evidence does not prove that no separate retained quote exists. Missing historical fields do not prove no other historical source exists. Preserve financial statuses, missing values, source dates and warnings. A holdings observation is not proof of an opening transaction, current fill, or trading recommendation. If nextCursor is non-null this page is incomplete; repeat with the same Account/state and that opaque cursor. Backend OPEN/CLOSED state is lifecycle, not proof of current custody or freshness.',
    evidence: result.data }) }] };
}
