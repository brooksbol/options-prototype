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

const { inspectBalances } = await import('./balances.mjs');
test('balance discovery, exact subject/provenance preservation and lossless decimals', async () => {
  const id='acct_'+'a'.repeat(32);
  const payload={requestId,accountId:id,currentness:'NOT_ESTABLISHED',historyCoverage:'UNKNOWN',observations:[{accountId:id,broker:'TASTYTRADE',source:{artifactId:requestId},fields:[{brokerField:'derivative-buying-power',value:1}]}]};
  const inventory={requestId,accounts:[{id,alias:'orchard',brokerAssociation:{broker:'TASTYTRADE'}}]};
  const result=await inspectBalances({account:'orchard'}, {...config,syntheticFixture:true,fetchImpl:async url=>{
    if(url.pathname==='/v2/accounts')return response(JSON.stringify(inventory));
    assert.equal(url.pathname,'/v2/account-balance-observations');assert.equal(url.searchParams.get('accountId'),id);
    return response(JSON.stringify(payload).replace('"value":1','"value":1000.123456789012'));
  }});
  assert.match(result.content[0].text,/1000.123456789012/);assert.match(result.content[0].text,/SYNTHETIC_FIXTURE/);
  await assert.rejects(inspectBalances({account:'orchard'}, {...config,fetchImpl:async url=>response(JSON.stringify(url.pathname==='/v2/accounts'?inventory:{...payload,accountId:'foreign'}))}));
  const denied=await inspectBalances({account:'orchard'}, {...config,fetchImpl:async url=>url.pathname==='/v2/accounts'?response(JSON.stringify(inventory)):response(JSON.stringify({requestId,status:403,title:'Forbidden',code:'FORBIDDEN',detail:'PRIVATE-CANARY'}),403)});
  assert.equal(denied.isError,true);assert.doesNotMatch(denied.content[0].text,/PRIVATE-CANARY/);
});

const { inspectHoldings } = await import('./holdings.mjs');
test('holdings inventory includes unresolved custody and denied Accounts without an OPEN filter', async () => {
 const id='acct_'+'a'.repeat(32), other='acct_'+'b'.repeat(32);const paths=[];
 const inventory={requestId,accounts:[{id,alias:'allowed',brokerAssociation:{broker:'FIDELITY'}},{id:other,alias:'denied',brokerAssociation:{broker:'TASTYTRADE'}}]};
 const result=await inspectHoldings({}, {...config,fetchImpl:async url=>{
  paths.push(url);if(url.pathname==='/v2/accounts')return response(JSON.stringify(inventory));
  assert.equal(url.pathname,'/v2/holdings');assert.equal(url.searchParams.has('state'),false);
  if(url.searchParams.get('accountId')===other)return response(JSON.stringify({requestId,status:403,code:'FORBIDDEN',title:'Forbidden'}),403);
  return response(JSON.stringify({items:[{id:requestId,account:{href:'/v2/accounts/'+id},sourceInstrument:{identifier:'FIXTURE'},quantity:1,side:'LONG',unit:'SHARE',snapshotId:requestId,snapshotCoverage:'COMPLETE_REPORTED',observationDate:'2001-01-01',evidence:[],warnings:[]}],next:null}));
 }});
 const data=JSON.parse(result.content[0].text);assert.equal(data.outcome,'PARTIAL');assert.equal(data.accounts[0].holdings.length,1);assert.equal(data.accounts[1].complete,false);assert.equal(data.accounts[1].problems[0].code,'FORBIDDEN');
 assert.equal(data.accounts[0].holdings[0].sourceInstrument.identifier,'FIXTURE');
});
test('holdings continuation rejects foreign origin and retains explicit known page failure',async()=>{
 const id='acct_'+'a'.repeat(32);const inventory={requestId,accounts:[{id,alias:'allowed',brokerAssociation:{broker:'FIDELITY'}}]};
 for(const href of ['https://untrusted.example/v2/holdings?accountId='+id+'&limit=25&cursor=x','/v2/holdings?accountId=foreign&limit=25&cursor=x'])
  await assert.rejects(inspectHoldings({}, {...config,fetchImpl:async url=>response(JSON.stringify(url.pathname==='/v2/accounts'?inventory:{items:[],next:{href}}))}),/continuation scope/);
 let pages=0;const result=await inspectHoldings({}, {...config,fetchImpl:async url=>{
  if(url.pathname==='/v2/accounts')return response(JSON.stringify(inventory));
  if(++pages===1)return response(JSON.stringify({items:[],next:{href:'/v2/holdings?accountId='+id+'&limit=25&cursor=opaque'}}));
  return response(JSON.stringify({requestId,status:503,code:'CAPABILITY_UNAVAILABLE',title:'Capability unavailable'}),503);
 }});const data=JSON.parse(result.content[0].text);assert.equal(data.outcome,'PARTIAL');assert.equal(data.accounts[0].complete,false);assert.equal(data.accounts[0].problems[0].code,'CAPABILITY_UNAVAILABLE');
});
