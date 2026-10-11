import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm,utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { syncAccount,classifyExport,exportOrder,parseSync,filenameParameter } from './ww-sync.mjs';
const ACCOUNT='acct_11111111111111111111111111111111';
const ID='11111111-1111-4111-8111-111111111111';
const history=(n)=>`Run Date,Action,Symbol,Amount ($)\n10/0${n}/2026,YOU BOUGHT,SPY,-100\n`;
const digest=b=>createHash('sha256').update(b).digest('hex');
test('discovery isolates account and supported types; reliable ET clock and fallback',()=>{
  assert.equal(classifyExport('History_for_Account_A1.csv',history(1),'A1'),'ACTIVITY');
  assert.equal(classifyExport('History_for_Account_B2.csv',history(1),'A1'),null);
  assert.equal(classifyExport('random.csv','a,b,c\n1,2,3','A1'),null);
  assert.equal(classifyExport('option.csv','Fidelity Investments - Option Summary A1\nExpiration & Strike','A1'),'OPTION_SUMMARY');
  assert.equal(exportOrder('Date downloaded Oct-11-2026 at 3:48 p.m ET',0).time,Date.parse('2026-10-11T19:48:00Z'));
  assert.equal(exportOrder('Date downloaded 10/11/2026 12:25 PM ET',0).time,Date.parse('2026-10-11T16:25:00Z'));
  assert.equal(exportOrder('Date downloaded 10/11/2026 10:25 am',42).time,42);
  assert.deepEqual(parseSync(['account','pts']),{account:'pts'});assert.throws(()=>parseSync(['account','../bad']));
  assert.equal(filenameParameter("Balances (1)'é.csv"),'Balances%20%281%29%27%C3%A9.csv');
});
test('sequential oldest first, stop on failure, retained retry without upload, then zero uploads',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'ww-sync-')); const artifacts=[];const requests=[];let rejectSecond=true;
  const fetchImpl=async(url,options)=>{
    let data;
    if(url.pathname==='/v2/accounts')data={requestId:ID,accounts:[{id:ACCOUNT,alias:'pts',displayName:'Test PTS',brokerAssociation:{broker:'FIDELITY',accountNumber:'A1'}}]};
    else if(options.method==='GET') {assert.equal(url.pathname,'/v2/artifacts');assert.equal(url.searchParams.get('accountId'),ACCOUNT);data={requestId:ID,accountId:ACCOUNT,brokerAccount:'A1',historyCoverage:'UNKNOWN',artifacts};}
    else if(url.pathname.endsWith('/imports')){
      const id=url.pathname.split('/').at(-2),a=artifacts.find(a=>a.artifactId===id);assert.equal(options.body,undefined);
      a.imports.push({status:'ACCEPTED',originalFilename:a.imports[0].originalFilename});
      requests.push('retry');data={requestId:ID,artifactId:id,newlyPersisted:false,status:'ACCEPTED'};
    }else{
      assert.equal(url.pathname,'/v2/artifacts');assert.equal(url.searchParams.get('accountId'),ACCOUNT);
      const body=Buffer.from(options.body),hash=digest(body);requests.push(body.toString());
      const status=rejectSecond&&requests.length===2?'REJECTED':'ACCEPTED';
      const id=String(artifacts.length+1);artifacts.push({artifactId:id,sha256:hash,receivedAt:new Date().toISOString(),imports:[{status,originalFilename:'retained.csv'}]});
      data={requestId:ID,artifactId:id,newlyPersisted:true,status,result:'processing failed'};
    }
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','X-Request-Id':ID}});
  };
  try{
    for(let n=1;n<=3;n++){
      const p=join(dir,`History_for_Account_A1-${n}.csv`);await writeFile(p,history(n));await utimes(p,n,n);
    }
    await writeFile(join(dir,'unrelated.csv'),'a,b,c');await writeFile(join(dir,'History_for_Account_B2.csv'),history(9));
    let output='';const opts={directory:dir,fetchImpl,out:s=>{output+=s;}};
    const first=await syncAccount('pts','credential',opts);assert.deepEqual(first,{uploaded:2,processed:1,failed:1,pending:2,complete:false});
    assert.equal(requests.length,2);assert.ok(requests[0].includes('10/01/2026'));assert.match(output,/SYNC INCOMPLETE/);
    rejectSecond=false;const second=await syncAccount('pts','credential',opts);
    assert.equal(second.complete,true);assert.equal(second.uploaded,1);assert.equal(requests[2],'retry');
    const third=await syncAccount('pts','credential',opts);assert.equal(third.uploaded,0);assert.equal(third.processed,0);
    assert.match(output,/COVERAGE UNKNOWN/);assert.equal(artifacts.length,3);
  }finally{await rm(dir,{recursive:true,force:true});}
});
