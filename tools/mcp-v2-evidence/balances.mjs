import { canonicalAccountId } from '../../scripts/ww-accounts.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';

export async function inspectBalances({ account, artifactId, sourceAtOrAfter }, config) {
  const inventory = await readBackend('/v2/accounts', config);
  if (inventory.error) return problemResult(inventory.error);
  if (inventory.data?.requestId !== inventory.requestId || !Array.isArray(inventory.data.accounts)) throw new Error('Invalid discovery.');
  const matches = inventory.data.accounts.filter(item => item.alias === account);
  if (matches.length !== 1) return { isError: true, content: [{ type: 'text', text: JSON.stringify({ outcome: 'unavailable',
    requestId: inventory.requestId, explanation: 'Exact authorized Account nickname required.',
    availableAccounts: inventory.data.accounts.map(item => ({ nickname: item.alias, broker: item.brokerAssociation?.broker })) }) }] };
  const selected = matches[0];
  if (!canonicalAccountId(selected.id) || artifactId !== undefined && !UUID.test(artifactId)) throw new Error('Invalid selector.');
  const query = new URLSearchParams({ accountId: selected.id });
  if (artifactId !== undefined) query.set('artifactId', artifactId);
  else query.set('selection','latest-source');
  if(sourceAtOrAfter !== undefined) { if(artifactId!==undefined)throw new Error('Incompatible balance selectors.'); query.set('sourceAtOrAfter',sourceAtOrAfter); }
  const result = await readBackend('/v2/account-balance-observations?' + query, config);
  if (result.error) return problemResult(result.error);
  const data = result.data;
  if (data?.requestId !== result.requestId || data.accountId !== selected.id || !Array.isArray(data.observations) ||
      data.currentness !== 'NOT_ESTABLISHED' || data.observations.length > 1 || data.selection?.mode !== (artifactId === undefined ? 'latest-source' : 'all') || data.observations.some(item => item.accountId !== selected.id ||
        item.broker !== selected.brokerAssociation?.broker || !UUID.test(item.source?.artifactId ?? '') ||
        artifactId !== undefined && item.source.artifactId !== artifactId || !Array.isArray(item.fields))) throw new Error('Invalid balance scope.');
  return { content: [{ type: 'text', text: JSON.stringify({ requestId: result.requestId,
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE' } : {}),
    account: { nickname: selected.alias, broker: selected.brokerAssociation?.broker }, evidence: data }) }] };
}
