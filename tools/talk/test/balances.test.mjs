import '../privacy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { marketFixture } from '../market-fixture.mjs';
import { connectSyntheticMcp } from '../synthetic.mjs';
import { evidenceView } from '../ui/evidence-view.js';

test('balance capability discovered through MCP and real Java HTTP with independent Position denial', {timeout:120000}, async t=>{
 const backend=await marketFixture();t.after(()=>backend.close());
 const servers=await connectSyntheticMcp(backend,[{name:'balance-contract',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_account_balances','inspect_account_positions']}]);t.after(()=>servers[0].close());
 const tools=await servers[0].listTools();assert.ok(tools.some(t=>t.name==='inspect_account_balances'));
 const denied=await servers[0].callToolResult('inspect_account_positions',{account:'orchard'});assert.equal(denied.isError,true);
 const balance=await servers[0].callToolResult('inspect_account_balances',{account:'orchard'});assert.notEqual(balance.isError,true);
 assert.match(balance.content[0].text,/1000.01/);assert.match(balance.content[0].text,/2000.02/);assert.match(balance.content[0].text,/NOT_ESTABLISHED/);assert.doesNotMatch(balance.content[0].text,/PRIVATE-CANARY|SYNTHETIC02/);
 const data=JSON.parse(balance.content[0].text);const exact=await servers[0].callToolResult('inspect_account_balances',{account:'orchard',artifactId:data.evidence.observations[0].source.artifactId});assert.notEqual(exact.isError,true);
 const rows=evidenceView(balance.content[0].text).rows;assert.ok(rows.some(([k,v])=>k==='derivative-buying-power'&&v.includes('1000.01')));
 const reads=await backend.reads();assert.ok(reads.every(r=>r.method==='GET'));assert.ok(reads.some(r=>r.path==='/v2/account-balance-observations'&&r.status===200));
});
