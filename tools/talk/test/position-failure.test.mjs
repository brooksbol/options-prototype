import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {connectSyntheticMcp} from '../synthetic.mjs';

test('Position argument, backend and adapter failures remain distinguishable without private diagnostics',async t=>{
 let mode='backend',reads=0;
 const http=createServer((req,res)=>{
  reads++;
  const requestId=randomUUID();
  res.setHeader('X-Request-Id',requestId);res.setHeader('Content-Type','application/json');
  if(req.url==='/v2/accounts')return res.end(JSON.stringify({requestId,accounts:[{id:'acct_'+'a'.repeat(32),alias:'pine',brokerAssociation:{broker:'SYNTHETIC'}}]}));
  if(mode==='backend'){res.statusCode=422;return res.end(JSON.stringify({requestId,status:422,code:'INVALID_REQUEST',title:'Invalid request',detail:'PRIVATE-DIAGNOSTIC-CANARY'}));}
  res.end(JSON.stringify({requestId,representation:'WRONG-CONTRACT',detail:'PRIVATE-DIAGNOSTIC-CANARY'}));
 });
 http.listen(0,'127.0.0.1');await once(http,'listening');
 const servers=await connectSyntheticMcp({base:`http://127.0.0.1:${http.address().port}`,token:'synthetic-only'},[{name:'positions-failure',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_account_positions']}]);
 t.after(async()=>{await Promise.all(servers.map(s=>s.close()));await new Promise(resolve=>http.close(resolve));});
 const invoke=args=>servers[0].callToolResult('inspect_account_positions',args);
 const invalid=await invoke({account:'pine'});
 assert.equal(invalid.isError,true);assert.equal(reads,0);
 const backend=await invoke({accountScope:'ACCOUNT',account:'pine'});
 assert.equal(backend.isError,true);assert.equal(JSON.parse(backend.content[0].text).code,'INVALID_REQUEST');
 assert.ok(JSON.parse(backend.content[0].text).requestId);
 mode='adapter';
 const adapter=await invoke({accountScope:'ALL_AUTHORIZED'});
 assert.equal(adapter.isError,true);assert.deepEqual(JSON.parse(adapter.content[0].text),{outcome:'error',code:'POSITION_ADAPTER_ERROR',title:'Positions unavailable.',boundary:'adapter'});
 for(const result of [backend,adapter])assert.doesNotMatch(JSON.stringify(result),/PRIVATE-DIAGNOSTIC|no new finding|absence/);
});
