import test from 'node:test';import assert from 'node:assert/strict';import {createServer} from 'node:http';
import {egressBoundary} from '../privacy.mjs';
import {recoveryBackend} from '../../../scripts/engineering/recovery-backend.mjs';
test('temporary handoff routes repaired resources and preserves original reports/acquisition',async()=>{
 const seen=[];const make=async name=>{const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;seen.push({name,path:req.url,method:req.method,auth:req.headers.authorization,body});res.writeHead(200,{'Content-Type':'application/json','X-Request-Id':'11111111-1111-4111-8111-111111111111'}).end(JSON.stringify({owner:name}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,base:'http://127.0.0.1:'+server.address().port,token:'synthetic'};};
 const candidate=await make('candidate'),operational=await make('operational');const proxy=await recoveryBackend({candidate,operational});const trustedFetch=globalThis.fetch;globalThis.fetch=egressBoundary(trustedFetch).fetch;try{
  for(const [path,owner,method]of [['/v2/positions?view=inventory','candidate','GET'],['/v2/account-balance-observations?artifactId=x&format=csv','candidate','GET'],['/v2/accounts','operational','GET'],['/v2/accounts/a/transactions?view=closed-trades','operational','GET'],['/v2/position-acquisitions?accountId=a','operational','POST'],['/v2/positions/p?projection=tactical','operational','GET']]){const r=await trustedFetch(proxy.base+path,{method,headers:{Authorization:'Bearer synthetic'}});assert.equal(r.status,200);assert.equal((await r.json()).owner,owner);}
  assert.ok(seen.every(r=>r.auth==='Bearer synthetic'));assert.equal((await trustedFetch(proxy.base+'/v2/accounts')).status,403);assert.equal((await trustedFetch(proxy.base+'/api/provider',{headers:{Authorization:'Bearer synthetic'}})).status,403);assert.equal(seen.length,6);
 }finally{globalThis.fetch=trustedFetch;await proxy.close();for(const b of [candidate,operational]){b.server.closeAllConnections();await new Promise(r=>b.server.close(r));}}
});
test('handoff does not forward credentials to external or differently authorized backends',async()=>{
 await assert.rejects(recoveryBackend({candidate:{base:'https://external.example',token:'x'},operational:{base:'http://127.0.0.1:1',token:'x'}}));await assert.rejects(recoveryBackend({candidate:{base:'http://127.0.0.1:1',token:'x'},operational:{base:'http://127.0.0.1:2',token:'y'}}));
});
