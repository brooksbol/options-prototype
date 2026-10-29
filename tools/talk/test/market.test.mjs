import '../privacy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { RunContext } from '@openai/agents';
import { marketFixture } from '../market-fixture.mjs';
import { connectSyntheticMcp } from '../synthetic.mjs';
import { createConversation } from '../conversation.mjs';
import { resultText } from '../ui/app.js';

test('evidence presentation retains source decimal/count lexemes and treats text only as text', () => {
  const source = '{"volume":9007199254740993,"bid":{"price":100.00},"description":"<script>bad()</script>"}';
  assert.equal(resultText(JSON.stringify({ type: 'text', text: source })), source);
  assert.equal(resultText(source), source);
});

test('real Java v2 read/auth/error contracts through discovered MCP; no provider/acquisition route', { timeout: 120000 }, async t => {
  const backend = await marketFixture();
  t.after(() => backend.close());
  const servers = await connectSyntheticMcp(backend, [{ name: 'synthetic-market',
    script: '../mcp-v2-evidence/server.mjs', admitted: ['inspect_market_quotes', 'inspect_account_positions','inspect_position_details'] }]);
  t.after(() => servers[0].close());
  const tools = await servers[0].listTools();
  assert.deepEqual(tools.map(t => t.name).sort(), ['acquire_account_holdings', 'inspect_account_balances', 'inspect_account_holdings', 'inspect_account_positions', 'inspect_account_transaction_details', 'inspect_account_transactions', 'inspect_market_quotes', 'inspect_option_inventory','inspect_order_details','inspect_position_details', 'prepare_report_download']);
  assert.ok(tools.find(t => t.name === 'inspect_market_quotes').inputSchema.properties.symbol);
  const list = await servers[0].callToolResult('inspect_market_quotes', {});
  assert.equal(list.isError, undefined);
  assert.match(list.content[0].text, /SPY/); assert.match(list.content[0].text, /QQQ/);
  const quote = await servers[0].callToolResult('inspect_market_quotes', { symbol: 'SPY' });
  assert.match(quote.content[0].text, /2001-01-01/); assert.match(quote.content[0].text, /SANDBOX/);
  assert.match(quote.content[0].text, /100.04/);
  const measurement = await servers[0].callToolResult('inspect_market_quotes', { symbol: 'SPY', measurement: true });
  assert.notEqual(measurement.isError,true);
  assert.match(measurement.content[0].text,/BACKEND_CALCULATED/);
  assert.match(measurement.content[0].text,/SOURCE_PRICE_UNIT/);
  assert.match(measurement.content[0].text,/NOT_ESTABLISHED/);
  const missing = await servers[0].callToolResult('inspect_market_quotes', { symbol: 'XLU' });
  assert.equal(missing.isError, true); assert.match(missing.content[0].text, /NOT_FOUND/);
  assert.match(missing.content[0].text, /requestId/);
  const index = await servers[0].callToolResult('inspect_market_quotes', { symbol: '^SPX' });
  assert.match(index.content[0].text, /INDEX/);
  const untrusted = await servers[0].callToolResult('inspect_market_quotes', { symbol: 'BRK/B' });
  assert.notEqual(untrusted.isError, true);
  assert.match(untrusted.content[0].text, /9007199254740993/);
  assert.match(untrusted.content[0].text, /Ignore prior instructions/);
  assert.match(untrusted.content[0].text, /EQUITY/);
  assert.equal((await fetch(backend.base + '/v2/quotes')).status, 401);
  const deniedServers = await connectSyntheticMcp({ ...backend, token: backend.deniedToken }, [{
    name: 'ungranted-market', script: '../mcp-v2-evidence/server.mjs', admitted: ['inspect_market_quotes'] }]);
  t.after(() => deniedServers[0].close());
  const denied = await deniedServers[0].callToolResult('inspect_market_quotes', { symbol: 'SPY' });
  assert.equal(denied.isError, true);
  assert.match(denied.content[0].text, /FORBIDDEN/);
  assert.doesNotMatch(denied.content[0].text, /100.04/);
  assert.equal((await fetch(backend.base + '/v2/quotes', { method: 'POST', headers: {
    Authorization: `Bearer ${backend.token}` } })).status, 405);
  const monitoring = await servers[0].callToolResult('inspect_account_positions', { account: 'harbor' });
  const current=JSON.parse(monitoring.content[0].text);
  const selected=current.evidence.items.find(p=>p.constituents.some(c=>c.kind==='LONG_SHARES'));
  const positions = await servers[0].callToolResult('inspect_position_details', { account: 'harbor',positionId:selected.id });
  assert.notEqual(positions.isError, true);
  assert.match(positions.content[0].text, /7500/);
  assert.match(positions.content[0].text, /125/);
  assert.equal(JSON.parse(positions.content[0].text).evidence.id,selected.id);
  const monitorSchema=tools.find(t=>t.name==='inspect_account_positions').inputSchema;
  assert.deepEqual(Object.keys(monitorSchema.properties).sort(),['account','cursor']);
  assert.equal(monitorSchema.additionalProperties,false);
  const expanded = await servers[0].callToolResult('inspect_account_positions', { account: 'harbor', projection:'expanded',includeInactive:true });
  assert.equal(expanded.isError,true);
  const beforeEmpty=(await backend.reads()).length;
  const emptyCursor=await servers[0].callToolResult('inspect_account_positions',{account:'harbor',cursor:''});
  assert.equal(emptyCursor.isError,true);
  assert.equal((await backend.reads()).length,beforeEmpty);
  const forbidden = await servers[0].callToolResult('inspect_account_positions', { account: 'orchard' });
  assert.equal(forbidden.isError, true); assert.match(forbidden.content[0].text, /FORBIDDEN/);
  assert.doesNotMatch(forbidden.content[0].text, /7500/);
  const chat = createConversation({ servers, model: { getResponse() { throw new Error('not used'); } } });
  assert.deepEqual((await chat.agent.getAllTools(new RunContext({}))).map(t => t.name).sort(), ['inspect_account_positions', 'inspect_market_quotes','inspect_position_details']);
});
