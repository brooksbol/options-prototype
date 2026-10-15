#!/usr/bin/env node
// Engineer-only integration harness. Installs a normal ww into an isolated client directory.
// Uses exactly `ww pull && ww history`; never replaces operational ww or credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,unlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve,basename} from 'node:path';
import {homedir} from 'node:os';
const [ready,output]=process.argv.slice(2),config=JSON.parse(await readFile(ready,'utf8'));
assert.equal(config.fixture,'integrated-update-v1');assert.match(config.base,/^http:\/\/127\.0\.0\.1:[0-9]+$/);
const directory=resolve(output),runtime=resolve(ready,'..'),client=join(directory,'client');await mkdir(directory,{recursive:true});
await cp('scripts',join(client,'scripts'),{recursive:true});await cp('docs/cli',join(client,'docs/cli'),{recursive:true});
const settings=token=>`WW_BASE_URL=${config.base}\nWW_API_TOKEN=${token}\n`;
await writeFile(join(client,'.ww.env'),settings(config.token),{mode:0o600});
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>! /^(WW_|TASTYTRADE_)/.test(k)));env.PATH=join(client,'scripts')+':'+env.PATH;
const owned=[],headers={Authorization:`Bearer ${config.token}`};
const call=async path=>{const r=await fetch(config.base+path,{headers});assert.equal(r.status,200,path);return r.json();};
const trace=async()=>JSON.parse(await readFile(join(runtime,'trace.json'),'utf8')).events;
const run=(name,command,status)=>{
 const r=spawnSync('/bin/sh',['-c',command],{env,encoding:'utf8',timeout:120000});
 assert.equal(r.status,status,name+': '+r.stdout+'\n'+r.stderr);assert.ok(!r.stdout.includes(config.token));assert.ok(!r.stderr.includes(config.token));
 return Promise.all([writeFile(join(directory,name+'.stdout.txt'),r.stdout),writeFile(join(directory,name+'.stderr.txt'),r.stderr)]).then(()=>r);
};
try {
 // Only new uniquely named synthetic exports are created; unrelated Downloads are never altered.
 await mkdir(join(homedir(),'Downloads'),{recursive:true});
 for(const f of config.sourceFiles){assert.equal(basename(f.name),f.name);assert.match(f.name,/UPDATESYNTH[A-F0-9]+/);const p=join(homedir(),'Downloads',f.name);await writeFile(p,f.content,{flag:'wx',mode:0o600});owned.push(p);}
 const before=await call('/v2/market-evidence-subjects');assert.equal(before.complete,false);assert.deepEqual(before.subjects.map(s=>s.symbol),['EWZ']);
 const start=(await trace()).length;
 const first=await run('first-pull-history','ww pull && ww history',0);
 assert.match(first.stdout,/Pull completed\./);assert.equal(first.stdout.split('\n').filter(l=>l.startsWith('acct_')).length,23);
 const events=(await trace()).slice(start),fetchAt=events.findIndex(e=>e.startsWith('FETCH '));assert.ok(fetchAt>events.indexOf('SYNC_HOLDINGS'));assert.ok(fetchAt>events.findLastIndex(e=>e==='HTTP POST /v2/artifacts'));assert.ok(events[fetchAt].includes('EWZ,SPY,XLE'));
 const after=await call('/v2/market-evidence-subjects');assert.equal(after.complete,true);assert.deepEqual(after.subjects.map(s=>s.symbol),['EWZ','SPY','XLE']);
 const inventory=await call('/v2/accounts'),tt=inventory.accounts.find(a=>a.alias==='tt1');
 const histories=async()=>Promise.all(inventory.accounts.map(a=>call(`/v2/accounts/${a.id}/transactions`)));
 const original=await histories(),ids=original.flatMap(h=>h.transactions.map(r=>r.transactionId)).sort();
 const snapshotBefore=(await call(`/v2/positions?accountId=${tt.id}`)).snapshots[0].snapshotId;
 const repeated=await run('repeat-pull-history','ww pull && ww history',0);assert.match(repeated.stdout,/3 reused/);
 assert.deepEqual((await histories()).flatMap(h=>h.transactions.map(r=>r.transactionId)).sort(),ids);
 const repeatSnapshot=(await call(`/v2/positions?accountId=${tt.id}`)).snapshots[0].snapshotId;
 await writeFile(join(runtime,'fail-holdings'),'1');
 const failed=await run('account-failure-short-circuit','ww pull && ww history',1);assert.match(failed.stdout,/Pull incomplete/);assert.doesNotMatch(failed.stderr,/^history:/m);assert.equal(failed.stdout.split('\n').filter(l=>l.startsWith('acct_')).length,0);
 const retained=(await call(`/v2/positions?accountId=${tt.id}`)).snapshots[0].snapshotId;
 // The repeat admitted another successful snapshot; the failed pull must retain that exact latest one.
 assert.equal(retained,repeatSnapshot);assert.ok(snapshotBefore);
 assert.deepEqual((await call('/v2/market-evidence-subjects')).subjects.map(s=>s.symbol),['EWZ','SPY','XLE']);
 await unlink(join(runtime,'fail-holdings'));
 await writeFile(join(runtime,'fail-quotes'),'1');
 const quoteFailure=await run('quote-failure-short-circuit','ww pull && ww history',1);assert.match(quoteFailure.stdout,/1 failed/);assert.match(quoteFailure.stdout,/EWZ:.*prior evidence retained/);assert.doesNotMatch(quoteFailure.stderr,/^history:/m);
 await unlink(join(runtime,'fail-quotes'));
 await run('targeted-fetch','ww fetch XLE',0);
 const noOpStart=(await trace()).length;await writeFile(join(client,'.ww.env'),settings('empty-scope'),{mode:0o600});
 const empty=await run('empty-scope-no-op','ww pull && ww history',0);assert.match(empty.stdout,/Empty selection; no market acquisition attempted/);assert.ok(!(await trace()).slice(noOpStart).some(e=>e.startsWith('FETCH ')||e==='SYNC_HOLDINGS'));
 await writeFile(join(client,'.ww.env'),settings(config.token),{mode:0o600});
 const samples=[{status:200,payload:before},{status:200,payload:after}];
 for(const [token,status] of [['invalid',401],['read-only',403]]) {const r=await fetch(config.base+'/v2/market-evidence-subjects',{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,status);samples.push({status,payload:await r.json()});}
 const bad=await fetch(config.base+'/v2/market-evidence-subjects?symbols=SPY',{headers});assert.equal(bad.status,422);samples.push({status:422,payload:await bad.json()});
 await writeFile(join(directory,'selection-http-samples.json'),JSON.stringify(samples,null,2)+'\n');await writeFile(join(directory,'trace.json'),JSON.stringify(await trace(),null,2)+'\n');
 await writeFile(join(directory,'verification.json'),JSON.stringify({command:'ww pull && ww history',first:0,repeated:0,accountFailure:1,quoteFailure:1,emptyScope:0,records:23,selected:['EWZ','SPY','XLE'],stableTransactionIdentity:true,operationalInstallationChanged:false},null,2)+'\n');
 console.log('PASS: installed isolated ww pull && ww history; 23 records; sync-before-fetch; newly admitted holdings + monitoring; repeated reuse/stable IDs; partial failures short-circuit; empty no-op; explicit fetch preserved');
} finally {
 for(const p of owned)await unlink(p);
 for(const f of ['fail-holdings','fail-quotes'])await unlink(join(runtime,f)).catch(()=>{});
}
