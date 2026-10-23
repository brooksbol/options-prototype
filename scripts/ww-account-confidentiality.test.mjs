import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAccounts, resolveAccount} from './ww-accounts.mjs';
import {syncAccount} from './ww-sync.mjs';
import {readFile} from 'node:fs/promises';
const id='acct_'+'c'.repeat(32), requestId='11111111-1111-4111-8111-111111111111';
const account=(broker,number)=>({id,alias:'tt1',displayName:'Broker account',brokerAssociation:{broker,accountNumber:number}});

test('authoritative Account contract admits both supported brokerage codes',async()=>{
  const oas=JSON.parse(await readFile(new URL('../docs/contracts/api-v2-account-evidence.json',import.meta.url),'utf8'));
  assert.deepEqual(oas.components.schemas.Account.properties.brokerAssociation.properties.broker.enum,['FIDELITY','TASTYTRADE']);
  assert.ok(oas.paths['/v2/accounts']);assert.ok(!oas.paths['/v2/brokerages']);
});

test('BUG-035: both brokerages omit numbers in tables and mask redirected TSV',()=>{
  for(const broker of ['FIDELITY','TASTYTRADE']) for(const options of [{tty:true},{format:'table'},{},{format:'tsv',tty:true}]) {
    const result=renderAccounts([account(broker,'0000123459')],options);
    assert.ok(result.includes('tt1'));assert.ok(result.includes(broker));
    if(options.tty&&!options.format||options.format==='table') {
      assert.ok(!result.includes('BROKER ACCOUNT'));assert.ok(!result.includes('****3459'));
    } else assert.ok(result.includes('****3459'));
    assert.ok(!result.includes('0000123459'));
  }
});
test('BUG-035: short, missing, malformed and non-string references disclose no suffix',()=>{
  for(const number of ['', '1','0059','private-value','12345\n',' 12345',null,undefined,123456,{secret:'123456'}]) {
    const row=renderAccounts([account('TASTYTRADE',number)],{format:'tsv'}).trimEnd().split('\t');
    assert.equal(row[3],'****');
  }
});
test('BUG-035 does not expand or redefine existing explicit JSONL payload',()=>{
  const a=account('TASTYTRADE','0000123459');
  assert.deepEqual(JSON.parse(renderAccounts([a],{format:'jsonl'})),a);
});
test('tastytrade sync requests only backend acquisition without scanning Downloads or artifacts',async()=>{
  const paths=[];
  const fetchImpl=async (url,options)=>{
    paths.push(url.pathname);assert.equal(options.headers.Authorization,'Bearer credential');
    let data;
    if(url.pathname==='/v2/accounts')data={requestId,accounts:[account('TASTYTRADE','0000123459')]};
    else {
      assert.equal(url.pathname,'/v2/position-acquisitions');assert.equal(url.searchParams.get('accountId'),id);assert.equal(options.method,'POST');assert.equal(options.body,undefined);
      data={requestId,accountId:id,acquisitionId:requestId,status:'ACCEPTED',artifactId:'artifact',snapshotId:'snapshot',startedAt:'2026-10-11T12:00:00Z',receivedAt:'2026-10-11T12:00:01Z',completedAt:'2026-10-11T12:00:01Z',result:'Retained holdings; occurrence unresolved.'};
    }
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','X-Request-Id':requestId}});
  };
  assert.equal((await resolveAccount('tt1','credential',{fetchImpl})).id,id);
  assert.equal((await syncAccount('tt1','credential',{fetchImpl,directory:'/nonexistent-downloads',out:()=>{}})).complete,true);
  await assert.rejects(resolveAccount('missing','credential',{fetchImpl}),/run ww ls accounts/);
  assert.deepEqual(paths,['/v2/accounts','/v2/accounts','/v2/position-acquisitions','/v2/accounts']);
});

test('BUG-049: number-free API metadata retains nickname discovery and every output mode',async()=>{
  const metadata={id,alias:'tt1',displayName:'Broker account',brokerAssociation:{broker:'TASTYTRADE'}};
  const fetchImpl=async()=>new Response(JSON.stringify({requestId,accounts:[metadata]}),{
    headers:{'Content-Type':'application/json','X-Request-Id':requestId}
  });
  assert.deepEqual(await resolveAccount('tt1','credential',{fetchImpl}),metadata);
  for(const options of [{tty:true},{format:'tsv'},{format:'jsonl'}]) {
    const output=renderAccounts([metadata],options);
    assert.ok(output.includes('tt1'));assert.ok(output.includes('TASTYTRADE'));
    assert.ok(!output.includes('accountNumber'));
  }
  const oas=JSON.parse(await readFile(new URL('../docs/contracts/api-v2-account-evidence.json',import.meta.url),'utf8'));
  const association=oas.components.schemas.Account.properties.brokerAssociation;
  assert.deepEqual(Object.keys(association.properties),['broker']);
  assert.equal(association.additionalProperties,false);
});
