import '../privacy.mjs';
import { request } from 'node:http';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
if (!process.argv[2]) throw new Error('Supply a local redacted evidence output path before execution.');
import { startPreview, existingKey, existingBackendToken } from '../server.mjs';

// Existing H-004 field/destination permission only. Never persist raw Account replies,
// canonical IDs, permissions, financial evidence, tokens or complete model bodies.
const app = await startPreview({ port: 0, apiKey: existingKey(),
  retainedMetadataBackend: { base: 'http://127.0.0.1:55834', token: existingBackendToken() } });
function http(path, body, csrf) {
  return new Promise((resolve, reject) => {
    const req = request(app.url + path, { method: body ? 'POST' : 'GET', headers: {
      Origin: app.url, 'Content-Type': 'application/json', 'X-Talk-CSRF': csrf ?? ''
    } }, res => { let raw='';res.on('data', c=>raw+=c);res.on('end',()=>resolve(JSON.parse(raw))); });
    req.on('error',reject);req.end(body ? JSON.stringify(body) : undefined);
  });
}
try {
  const status = await http('/api/status');
  assert.deepEqual(status.tools.flatMap(s=>s.tools.map(t=>t.name)).sort(), ['hello_world','list_authorized_accounts']);
  const results=[];
  const nicknames = new Map();
  for (const [id, question] of [['Q01','What accounts do I have?'],['Q02',"What's in this account?"],['Q63','Good morning!  Whatta we got today?']]) {
    const answer = await http('/api/chat',{message:question},status.csrf);
    assert.ok(!answer.error);
    let count;
    let grounded;
    for(const tool of answer.tools) {
      assert.equal(tool.name,'list_authorized_accounts');
      const inventory=JSON.parse(JSON.parse(tool.result).text);
      assert.deepEqual(Object.keys(inventory).sort(),['accounts','count']);
      for(const account of inventory.accounts) assert.deepEqual(Object.keys(account).sort(),['broker','nickname']);
      for (const account of inventory.accounts) if (!nicknames.has(account.nickname)) nicknames.set(account.nickname, '<authorized Account '+(nicknames.size+1)+'>');
      count=inventory.count;
      if(id==='Q01') grounded=inventory.accounts.every(account=>answer.text.includes(account.nickname)&&answer.text.toLowerCase().includes(account.broker.toLowerCase()));
    }
    if(id==='Q01') assert.equal(grounded,true);
    results.push({id,question,classification:id==='Q01'?'ANSWERABLE':id==='Q63'?'PARTIAL':'BLOCKED BY AUTHORIZATION',
      authorizedAccountCount:count, answerContainsAuthorizedMetadata:grounded,
      responseText:[...nicknames].reduce((text,[name,replacement])=>text.replaceAll(name,replacement),answer.text),
      toolNames:answer.tools.map(t=>t.name),usage:answer.usage});
  }
  for(const body of app.boundary.requests) {
    assert.equal(body.store,false);assert.ok(!body.conversation&&!body.previous_response_id);
    assert.ok(!/acct_[a-f0-9]{32}|usr_[a-f0-9]{32}/.test(JSON.stringify(body)));
  }
  const evidence={profile:'real retained authorized Account metadata; H-004 scope; no prior-turn replay',results,
    outbound:app.boundary.events,protectedFinancialToolsAdmitted:false, protectedValuesPersisted:false,
    syntheticProductEvidence:false};
  writeFileSync(process.argv[2],JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify({results:results.map(({usage,...r})=>r),requests:app.boundary.events.length}));
} finally { await app.close(); }
