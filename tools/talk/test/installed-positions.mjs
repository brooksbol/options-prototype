// Explicit opt-in: actual installed SDK/model/MCP requests. Prints no financial records.
// Run after installation AND after service restart; synthetic tests cannot detect an old JAR.
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:8787';
const status = await fetch(base + '/api/status').then(r => r.json());
assert.equal(status.deployment, 'installed');
const headers = {'Content-Type':'application/json', Origin:base, 'X-Talk-CSRF':status.csrf};
function payload(tool) {
  let value = JSON.parse(tool.result);
  if (value.type === 'text') value = JSON.parse(value.text);
  return value;
}
const report = [];
for (const message of ['show me ptf', 'positions', 'accounts', 'pts positions']) {
  const response = await fetch(base + '/api/chat', {method:'POST', headers,
    body:JSON.stringify({message}), signal:AbortSignal.timeout(180000)});
  assert.equal(response.status, 200);
  const answer = await response.json();
  const calls = answer.tools ?? [];
  const summary = {message, commentaryAvailable:!answer.error, tools:calls.map(tool => {
    const data = payload(tool);
    return {name:tool.name, arguments:JSON.parse(tool.arguments), isError:tool.isError === true,
      ...(data.code ? {code:data.code, status:data.status, requestId:data.requestId} : {}),
      ...(data.representation ? {representation:data.representation,
        accounts:data.accounts?.map(a => ({nickname:a.nickname, status:a.status, readComplete:a.readComplete}))} : {})};
  })};
  report.push(summary);
  console.log(JSON.stringify(summary));
  assert.ok(!answer.error, 'Installed commentary failed');
  if (message === 'positions' || message === 'pts positions') {
    const tool = calls.find(t => t.name === 'inspect_account_positions');
    assert.ok(tool, 'Ordinary navigation must use native Positions');
    assert.notEqual(tool.isError, true, 'Installed backend rejected Positions');
    const data = payload(tool), args = JSON.parse(tool.arguments);
    assert.equal(data.representation, 'TACTICAL_POSITION_INVENTORY');
    if (message === 'positions') {
      assert.equal(args.accountScope, 'ALL_AUTHORIZED');
      assert.equal(args.account, undefined);
      assert.deepEqual(data.accounts.map(a => a.nickname).sort(), ['pts','sawdust','tt1']);
    } else {
      assert.equal(args.accountScope, 'ACCOUNT'); assert.equal(args.account, 'pts');
      assert.deepEqual(data.accounts.map(a => a.nickname), ['pts']);
    }
    assert.ok(data.accounts.every(a => a.status === 'READ' && a.readComplete));
  } else if (message === 'accounts') {
    assert.ok(calls.some(t => t.name === 'list_authorized_accounts' && !t.isError));
  } else {
    // Unknown name may be clarified or resolved as the actual PTF symbol.
    assert.ok(answer.text?.trim() || calls.length);
    assert.ok(summary.tools.every(t => t.code !== 'INVALID_REQUEST'));
  }
}
console.log(JSON.stringify({result:'PASS', profile:'installed real SDK/MCP', turns:report.length}));
