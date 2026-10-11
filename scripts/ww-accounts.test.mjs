import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAccount,readAccounts,renderAccounts} from './ww-accounts.mjs';
import {parseArgs} from './wheelwright.mjs';
const id='acct_'+'a'.repeat(32),requestId='11111111-1111-4111-8111-111111111111';
test('aliases resolve only through backend authorized discovery; rename preserves canonical ID',async()=>{
  let alias='pts';const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push(url.pathname);assert.equal(options.headers.Authorization,'Bearer credential');
    return new Response(JSON.stringify({requestId,accounts:[{id,alias,displayName:'Personal Treasury',brokerAssociation:{broker:'FIDELITY',accountNumber:'A1'}}]}),
      {headers:{'Content-Type':'application/json','X-Request-Id':requestId}});
  };
  assert.equal((await resolveAccount('pts','credential',{fetchImpl})).id,id);
  alias='treasury';assert.equal((await resolveAccount('treasury','credential',{fetchImpl})).id,id);
  await assert.rejects(resolveAccount('pts','credential',{fetchImpl}),/unavailable/);
  await assert.rejects(resolveAccount(id,'credential',{fetchImpl}),/unavailable/);
  assert.ok(calls.every(path=>path==='/v2/accounts'));
});

test('account discovery dispatch, authorized inventory, empty scope and safe presentation',async()=>{
  assert.deepEqual(parseArgs(['ls','accounts']),{command:'ls-accounts',format:undefined});
  assert.deepEqual(parseArgs(['ls','accounts','--jsonl']),{command:'ls-accounts',format:'jsonl'});
  assert.match(parseArgs(['ls','accounts','--help']).help,/ww sync account pts/);
  assert.throws(()=>parseArgs(['show','accounts']),/ww ls accounts/);
  assert.throws(()=>parseArgs(['ls','accounts','--table','--jsonl']));
  const account={id,alias:'pts',displayName:'Personal\nTreasury',brokerAssociation:{broker:'FIDELITY',accountNumber:'A1'}};
  let visible=[account];
  const fetchImpl=async(url)=>{
    assert.equal(url.pathname,'/v2/accounts');
    return new Response(JSON.stringify({requestId,accounts:visible}),{headers:{'Content-Type':'application/json','X-Request-Id':requestId}});
  };
  assert.deepEqual(await readAccounts('credential',{fetchImpl}),[account]);
  assert.match(renderAccounts([account],{tty:true}),/ALIAS\s+NAME\s+BROKER/);
  assert.equal(renderAccounts([account]),`pts\tPersonal\\u000aTreasury\tFIDELITY\tA1\t${id}\n`);
  assert.deepEqual(JSON.parse(renderAccounts([account],{format:'jsonl'})),account);
  visible=[];
  assert.deepEqual(await readAccounts('credential',{fetchImpl}),[]);
  assert.equal(renderAccounts([],{tty:true}),'No accounts available.\n');
  assert.equal(renderAccounts([]),'');
});
