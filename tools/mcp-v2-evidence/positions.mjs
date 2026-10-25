import { canonicalAccountId } from '../../scripts/ww-accounts.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';

// Resolve a nickname through authenticated backend discovery; never infer ownership/grants.
export async function inspectPositions({ account }, config) {
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
  const result = await readBackend('/v2/positions?accountId=' + encodeURIComponent(selected.id) +
    '&include=currentConstruction,holdingSummaries', config);
  if (result.error) return problemResult(result.error);
  if (!Array.isArray(result.data?.items) || result.data.items.some(item => !UUID.test(item.id ?? '') ||
      item.account?.href !== '/v2/accounts/' + selected.id)) throw new Error('Invalid Position scope.');
  return { content: [{ type: 'text', text: JSON.stringify({ requestId: result.requestId,
    account: { nickname: selected.alias, broker: selected.brokerAssociation?.broker },
    qualification: 'Backend Position read from retained source evidence, not a complete history inventory. Missing historical fields in this selected read do not prove that no other historical source exists. Preserve financial statuses, missing values, source dates and warnings. A holdings observation is not proof of an opening transaction, current fill, or trading recommendation. If next is non-null this page is incomplete.',
    evidence: result.data }) }] };
}
