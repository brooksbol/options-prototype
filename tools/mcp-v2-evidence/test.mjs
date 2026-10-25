import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectQuotes } from './quotes.mjs';
import { inspectPositions } from './positions.mjs';

const requestId = '22222222-2222-4222-8222-222222222222';
const observation = { observationId: requestId, subject: { symbol: '^SPX', securityType: 'INDEX' },
  facts: { last: { price: 4000 }, volume: 1 }, provenance: {
    provider: 'tradier', environment: 'SANDBOX', acquisitionId: requestId, authorityEpoch: 'old',
    acquisitionPhase: 'CLOSED', receivedAt: '2001-01-01T00:00:02Z', committedAt: '2001-01-01T00:00:03Z' } };
const config = { base: 'http://127.0.0.1:12345', token: 'fixture-secret' };
function response(body, status = 200) { return new Response(body, { status, headers: {
  'Content-Type': status === 200 ? 'application/json' : 'application/problem+json', 'X-Request-Id': requestId } }); }

test('read-only codec reuse, no financial projection rounding, and no secret/model-controlled URL', async () => {
  const raw = JSON.stringify(observation).replace('"volume":1', '"volume":9007199254740993');
  const result = await inspectQuotes({ symbol: '^SPX' }, { ...config, fetchImpl: async (url, options) => {
    assert.equal(url.href, config.base + '/v2/quotes/_5ESPX');
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer fixture-secret'); return response(raw);
  } });
  assert.match(result.content[0].text, /9007199254740993/);
  assert.doesNotMatch(result.content[0].text, /fixture-secret/);
  await assert.rejects(inspectQuotes({ symbol: '../accounts' }, config));
  await assert.rejects(inspectQuotes({}, { ...config, base: 'http://untrusted.example' }));
});

test('safe problem identity/status/correlation survive, internal diagnostic and mismatched subject do not', async () => {
  for (const [status, code, title] of [[401, 'UNAUTHENTICATED', 'Unauthenticated'], [403, 'FORBIDDEN', 'Forbidden'],
    [404, 'NOT_FOUND', 'Not found'], [422, 'INVALID_REQUEST', 'Invalid request'],
    [500, 'INTERNAL_ERROR', 'Internal error'], [503, 'CAPABILITY_UNAVAILABLE', 'Capability unavailable']]) {
    const result = await inspectQuotes({ symbol: 'XLU' }, { ...config, fetchImpl: async () => response(
      JSON.stringify({ status, code, title, requestId, detail: 'PRIVATE-ERROR-CANARY' }), status) });
    assert.equal(result.isError, true);
    assert.deepEqual(JSON.parse(result.content[0].text), { outcome: 'error', status, code, title, requestId, subject: 'XLU' });
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE-ERROR/);
  }
  await assert.rejects(inspectQuotes({ symbol: 'SPY' }, { ...config,
    fetchImpl: async () => response(JSON.stringify(observation)) }));
  await assert.rejects(inspectQuotes({}, { ...config,
    fetchImpl: async () => response('{"items":[],"requestId":"wrong"}') }));
});

test('unexpected secrets, oversized bodies and invalid correlation fail closed', async () => {
  for (const body of ['fixture-secret', 'x'.repeat(200001)])
    await assert.rejects(inspectQuotes({}, { ...config, fetchImpl: async () => response(body) }));
  await assert.rejects(inspectQuotes({}, { ...config, fetchImpl: async () => new Response('{}') }));
});

test('discovery projects its public contract; omitted facts are not asserted absent', async () => {
  const item = { observationId: requestId, subject: observation.subject,
    provenance: observation.provenance, internalState: 'PRIVATE-DISCOVERY-CANARY' };
  const result = await inspectQuotes({}, { ...config,
    fetchImpl: async () => response(JSON.stringify({ requestId, items: [item], privateField: 'PRIVATE-TOP-CANARY' })) });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE-|authorityEpoch/);
  assert.match(result.content[0].text, /omits quote facts by design/);
  item.subject = { symbol: '../accounts', securityType: 'ETF' };
  await assert.rejects(inspectQuotes({}, { ...config,
    fetchImpl: async () => response(JSON.stringify({ requestId, items: [item] })) }));
});

test('unknown nickname returns authorized recovery metadata without reading or guessing a Position scope', async () => {
  const paths = [];
  const result = await inspectPositions({ account: 'synthetic harbor' }, { ...config,
    fetchImpl: async url => { paths.push(url.pathname); return response(JSON.stringify({ requestId, accounts: [{
      id: 'acct_' + '1'.repeat(32), alias: 'harbor', displayName: 'Synthetic Harbor',
      brokerAssociation: { broker: 'FIDELITY', accountNumber: 'PRIVATE-ACCOUNT-CANARY' } }] })); } });
  assert.deepEqual(paths, ['/v2/accounts']); assert.equal(result.isError, true);
  assert.match(result.content[0].text, /"nickname":"harbor"/);
  assert.doesNotMatch(result.content[0].text, /PRIVATE-ACCOUNT|acct_/);
});
