// Explicit opt-in: actual installed SDK/model/MCP requests. Prints no financial records.
// Run after installation AND after service restart; synthetic tests cannot detect an old JAR.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const base = 'http://127.0.0.1:8787';
const status = await fetch(base + '/api/status').then(r => r.json());
assert.equal(status.deployment, 'installed');
const headers = {'Content-Type':'application/json', Origin:base, 'X-Talk-CSRF':status.csrf};
const conversation=process.argv.includes('--conversation');
const evidence=await mkdtemp(join(tmpdir(),'ww-installed-positions-'));
if(conversation)assert.ok((await fetch(base+'/api/reset',{method:'POST',headers,body:'{}'})).ok);
function payload(tool) {
  let value = JSON.parse(tool.result);
  if (value.type === 'text') value = JSON.parse(value.text);
  return value;
}
const report = [];
let selectedPtf;
for (const message of conversation?['show me pts','show pts positiosn','show me ptf','tactical view','show me nov 20 options']:['show me ptf', 'positions', 'accounts', 'pts positions']) {
  const response = await fetch(base + '/api/chat', {method:'POST', headers,
    body:JSON.stringify({message}), signal:AbortSignal.timeout(180000)});
  assert.equal(response.status, 200);
  const answer = await response.json();
  await writeFile(join(evidence,`turn-${report.length}.json`),JSON.stringify(answer),{mode:0o600});
  const calls = answer.tools ?? [];
  const summary = {message, commentaryAvailable:!answer.error, tools:calls.map(tool => {
    const data = payload(tool);
    const args=JSON.parse(tool.arguments);
    return {name:tool.name, arguments:Object.fromEntries(['accountScope','account','underlying','expiration'].filter(k=>Object.hasOwn(args,k)).map(k=>[k,args[k]])), isError:tool.isError === true,
      ...(data.code ? {code:data.code, status:data.status, requestId:data.requestId} : {}),
      ...(data.representation ? {representation:data.representation,
        accounts:data.accounts?.map(a => ({nickname:a.nickname, status:a.status, readComplete:a.readComplete}))} : {})};
  })};
  report.push(summary);
  console.log(JSON.stringify(summary));
  assert.ok(!answer.error, 'Installed commentary failed');
  if(conversation){
    assert.ok(calls.every(t=>!t.isError),'Every requested operation must succeed');
    assert.ok(calls.every(t=>!['inspect_account_holdings','inspect_option_inventory'].includes(t.name)),'Native navigation must not fall back to raw or wrong-scope inventory');
    const tool=calls.filter(t=>t.name==='inspect_account_positions').at(-1);
    assert.ok(tool,'Each navigation request must supply native tactical results');
    const args=JSON.parse(tool.arguments),data=payload(tool);
    assert.equal(args.accountScope,'ACCOUNT');assert.equal(args.account,'pts');
    assert.equal(data.representation,'TACTICAL_POSITION_INVENTORY');
    assert.deepEqual(data.accounts.map(a=>a.nickname),['pts']);
    assert.ok(data.accounts.every(a=>a.status==='READ'&&a.readComplete));
    const items=data.accounts[0].items;assert.ok(items.length,'Known real selection must have results');
    if(message==='show me ptf'||message==='tactical view'){
      assert.equal(args.underlying,'PTF');
      const source=items.flatMap(i=>i.sourceHoldings.map(r=>r.href)).sort();
      if(selectedPtf)assert.deepEqual(source,selectedPtf,'Representation follow-up must retain the exact PTF subject');else selectedPtf=source;
    }else assert.equal(args.underlying,undefined,'Account/expiration request must release the earlier underlying restriction');
    if(message==='show me nov 20 options'){assert.equal(args.expiration,'2026-11-20');assert.equal(data.expiration,args.expiration);}
  } else if (message === 'positions' || message === 'pts positions') {
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
console.log(JSON.stringify({result:'PASS', profile:'installed real SDK/MCP', turns:report.length,evidence}));
