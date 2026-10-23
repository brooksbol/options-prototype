// This capability has exactly one backend read and one deliberately narrow projection.
const brokers = new Map([['FIDELITY', 'Fidelity'], ['TASTYTRADE', 'tastytrade']]);
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === [...keys].sort().join(',');
export function accountBase(base) {
  let url;
  try { url = new URL(base); } catch { throw new Error('Account backend configuration is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
    throw new Error('Account backend configuration is invalid.');
  return url;
}
export function validateInventory(value) {
  if (!exact(value, ['accounts', 'count']) || !Array.isArray(value.accounts) ||
      value.count !== value.accounts.length || value.count > 100)
    throw new Error('Account inventory is invalid.');
  const names = new Set();
  for (const a of value.accounts) {
    if (!exact(a, ['nickname', 'broker']) || typeof a.nickname !== 'string' ||
        !/^[a-z][a-z0-9-]{0,31}$/.test(a.nickname) ||
        !['Fidelity', 'tastytrade'].includes(a.broker) || names.has(a.nickname))
      throw new Error('Account inventory is invalid.');
    names.add(a.nickname);
  }
  return value;
}
export async function discoverAccounts({base, token, fetchImpl = fetch}) {
  if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token))
    throw new Error('Account authentication configuration is missing or invalid.');
  let response;
  try {
    response = await fetchImpl(new URL('/v2/accounts', accountBase(base)), {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
  } catch { throw new Error('Account discovery failed.'); }
  if (response.status !== 200 || !/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? ''))
    throw new Error('Account discovery failed.');
  // Bound the response before JSON parsing, without printing backend bodies/errors.
  const chunks = []; let size = 0;
  try {
    for await (const bytes of response.body) {
      size += bytes.length;
      if (size > 131072) throw new Error();
      chunks.push(bytes);
    }
  } catch { throw new Error('Account discovery failed.'); }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Account discovery failed.'); }
  const requestId = response.headers.get('x-request-id');
  if (!exact(data, ['requestId', 'accounts']) || !Array.isArray(data.accounts) ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(requestId ?? '') || data.requestId !== requestId)
    throw new Error('Account discovery failed.');
  const ids = new Set();
  const accounts = data.accounts.map(a => {
    // Refuse the pre-BUG-049 payload rather than silently admitting an unverified backend.
    if (!exact(a, ['id', 'alias', 'displayName', 'brokerAssociation']) ||
        !/^acct_[a-f0-9]{32}$/.test(a.id ?? '') || ids.has(a.id) || typeof a.displayName !== 'string' ||
        !exact(a.brokerAssociation, ['broker']) || !brokers.has(a.brokerAssociation.broker))
      throw new Error('Account discovery failed.');
    ids.add(a.id);
    return { nickname: a.alias, broker: brokers.get(a.brokerAssociation.broker) };
  });
  const result = validateInventory({ accounts, count: accounts.length });
  // Metadata must never smuggle either credential, including via a nickname.
  if (JSON.stringify(result).includes(token)) throw new Error('Account discovery failed.');
  return result;
}

// The model writes the full sentence. The host admits only a narrow, factual
// Account-list grammar, comparing every mention against the observed inventory.
export function verifyAnswer(text, inventory) {
  validateInventory(inventory);
  if (typeof text !== 'string' || text.length > 12000) throw new Error('Ungrounded Account answer rejected.');
  if (!inventory.count) {
    if (text !== 'You currently have no authorized Wheelwright Accounts.') throw new Error('Ungrounded Account answer rejected.');
    return text;
  }
  const prefixes = ['You have access to these Wheelwright Accounts: ', 'Your authorized Wheelwright Accounts are: '];
  const prefix = prefixes.find(p => text.startsWith(p));
  if (!prefix || !text.endsWith('.')) throw new Error('Ungrounded Account answer rejected.');
  let remaining = text.slice(prefix.length, -1);
  const mentions = new Set(inventory.accounts.map(a => `${a.nickname} (${a.broker})`));
  while (mentions.size) {
    const mention = [...mentions].find(m => remaining.startsWith(m));
    if (!mention) throw new Error('Ungrounded Account answer rejected.');
    mentions.delete(mention); remaining = remaining.slice(mention.length);
    if (mentions.size) {
      const delimiter = [', and ', ' and ', ', '].find(d => remaining.startsWith(d));
      if (!delimiter) throw new Error('Ungrounded Account answer rejected.');
      remaining = remaining.slice(delimiter.length);
    }
  }
  if (remaining) throw new Error('Ungrounded Account answer rejected.');
  return text;
}
