#!/usr/bin/env node
// Actual isolated HTTP/CLI proof. Input is the engineer-created synthetic preview ready file.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const [ready,output]=process.argv.slice(2),config=JSON.parse(await readFile(ready,'utf8'));
assert.equal(config.fixture,'synthetic-transactions-v1');assert.match(config.base,/^http:\/\/127\.0\.0\.1:[0-9]+$/);
await mkdir(output,{recursive:true});
const headers={Authorization:`Bearer ${config.token}`};
const inventory=await (await fetch(config.base+'/v2/accounts',{headers})).json();
const samples=[];
for(const a of inventory.accounts) {
 const path=`/v2/accounts/${a.id}/transactions`,response=await fetch(config.base+path,{headers}),payload=await response.json();
 assert.equal(response.status,200);assert.equal(payload.requestId,response.headers.get('x-request-id'));assert.equal(payload.accountId,a.id);assert.equal(payload.complete,true);
 assert.equal(payload.recordCount,a.alias==='tt1'?21:2);assert.equal(payload.lifetimeCoverage,'UNKNOWN');
 samples.push({path,status:200,payload});
 const again=await (await fetch(config.base+path,{headers})).json();
 assert.deepEqual(again.transactions.map(r=>r.transactionId),payload.transactions.map(r=>r.transactionId));
 assert.equal(again.evidenceMode,'RETAINED');
 const instance=await fetch(config.base+path+'/'+payload.transactions[0].transactionId,{headers});
 assert.equal(instance.status,200);samples.push({path:path+'/{transactionId}',status:200,payload:await instance.json()});
 for(const [suffix,requestHeaders,status] of [['',{},401],['?limit=1',headers,422],['/12345678-1234-1234-1234-123456789abc',headers,404]]) {
  const reply=await fetch(config.base+path+suffix,{headers:requestHeaders});assert.equal(reply.status,status);
  samples.push({path,status,payload:await reply.json()});
 }
}
const denied=await fetch(config.base+'/v2/accounts/acct_'+'f'.repeat(32)+'/transactions',{headers});assert.equal(denied.status,403);
samples.push({path:'/v2/accounts/{accountId}/transactions',status:403,payload:await denied.json()});
assert.equal((await fetch(config.base+'/v2/transactions',{headers})).status,404);
const env={...process.env,WW_BASE_URL:config.base,WW_API_TOKEN:config.token,NO_COLOR:''};
const cases=[['all-jsonl',['history','--jsonl']],['all-csv',['history','--csv']],['tt1-tsv',['history','--account','tt1','--tsv']],['tt1-table',['history','--account','tt1','--table']],['pts-verbose',['history','--account','pts','--verbose']],['history-man',['history','--man']],['pull-help',['pull','--help']],['pull-man',['pull','--man']]];
for(const [name,args] of cases) {
 const result=spawnSync(process.execPath,['scripts/wheelwright.mjs',...args],{env,encoding:'utf8'});
 assert.equal(result.status,0,name+': '+result.stderr);assert.ok(!result.stdout.includes(config.token));
 await writeFile(resolve(output,name+'.txt'),result.stdout);await writeFile(resolve(output,name+'.stderr.txt'),result.stderr);
}
const records=(await readFile(resolve(output,'all-jsonl.txt'),'utf8')).trim().split('\n').map(JSON.parse);
assert.equal(records.length,23);assert.equal(new Set(records.map(r=>r.accountId)).size,2);
assert.equal(records.filter(r=>r.sourceIdentityStatus==='BROKER_TRANSACTION_ID').length,21);
assert.equal(records.filter(r=>r.sourceIdentityStatus==='ROW_EQUIVALENCE_ONLY').length,2);
const fid=records.find(r=>r.netCash==='2.3491357802469134');assert.ok(fid);assert.equal(fid.currency,null);assert.equal(fid.price,'1.2345678901234567');
const csv=await readFile(resolve(output,'all-csv.txt'),'utf8');assert.equal(csv.split('accountId,transactionId,').length,2);
assert.equal((await readFile(resolve(output,'tt1-tsv.txt'),'utf8')).trim().split('\n').length,21);
await writeFile(resolve(output,'http-samples.json'),JSON.stringify(samples,null,2)+'\n');
console.log(`PASS: ${samples.length} actual HTTP specimens; list/detail/auth/errors; 8 real CLI invocations; 23 scoped records; exact exports; no global route`);
