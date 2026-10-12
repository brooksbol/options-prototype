import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAccount,readAccounts,renderAccounts} from './ww-accounts.mjs';
import {parseArgs} from './wheelwright.mjs';
import {stripVTControlCharacters} from 'node:util';
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

test('Account tables apply the tt palette without changing cells, masking or machine output',()=>{
  const accounts=[{id,alias:'pts',displayName:'Personal Treasury',brokerAssociation:{broker:'FIDELITY',accountNumber:'0000123459'}},
    {id:'acct_'+'b'.repeat(32),alias:'tt1',displayName:'Tastytrade',brokerAssociation:{broker:'TASTYTRADE',accountNumber:'123456789'}}];
  const env={TERM:'xterm-256color'};
  const plain=renderAccounts(accounts,{format:'table',noColor:true,env});
  const colored=renderAccounts(accounts,{tty:true,env});
  assert.equal(stripVTControlCharacters(colored),plain);
  assert.equal(renderAccounts(accounts,{format:'table',env}),colored);
  assert.match(colored,/\x1b\[96mpts\x1b\[97m  /);
  assert.match(colored,new RegExp(`\\x1b\\[38;5;240m${id}\\x1b\\[97m`));
  assert.match(colored,/\x1b\[32mFIDELITY\x1b\[97m/);
  assert.match(colored,/\x1b\[91mTASTYTRADE\x1b\[97m/);
  assert.ok(colored.split('\n').filter(Boolean).every(line=>line.startsWith('\x1b[97m')&&line.endsWith('\x1b[0m')));
  assert.doesNotMatch(colored,/\x1b\[(?:92|93|4\d|48;)m/);
  const unknown=renderAccounts([{...accounts[0],brokerAssociation:{broker:'OTHER',accountNumber:'0000123459'}}],{tty:true,env});
  assert.doesNotMatch(unknown,/\x1b\[(?:32|91)m/);
  assert.match(unknown,/OTHER +\*\*\*\*3459/);
  assert.ok(colored.includes('****3459'));assert.ok(!colored.includes('0000123459'));
  for(const options of [{noColor:true,env},{env:{NO_COLOR:'',TERM:'xterm'}},{env:{NO_COLOR:'1'}},{env:{TERM:'dumb'}}])
    assert.equal(renderAccounts(accounts,{format:'table',...options}),plain);
  for(const options of [{},{format:'tsv',tty:true},{format:'jsonl',tty:true}]) {
    const output=renderAccounts(accounts,{...options,env});
    assert.doesNotMatch(output,/\x1b/);
    assert.equal(output,renderAccounts(accounts,{...options,noColor:true,env}));
  }
});

test('Account color opt-out composes with formats and rejects ambiguous options',()=>{
  assert.deepEqual(parseArgs(['ls','accounts','--no-color']),{command:'ls-accounts',format:undefined,noColor:true});
  for(const format of ['table','tsv','jsonl'])for(const flags of [[`--${format}`,'--no-color'],['--no-color',`--${format}`]])
    assert.deepEqual(parseArgs(['ls','accounts',...flags]),{command:'ls-accounts',format,noColor:true});
  for(const flags of [['--no-color','--no-color'],['--table','--table'],['--table','--tsv'],['--color']])
    assert.throws(()=>parseArgs(['ls','accounts',...flags]));
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
  assert.equal(renderAccounts([account]),`pts\tPersonal\\u000aTreasury\tFIDELITY\t****\t${id}\n`);
  assert.deepEqual(JSON.parse(renderAccounts([account],{format:'jsonl'})),account);
  visible=[];
  assert.deepEqual(await readAccounts('credential',{fetchImpl}),[]);
  assert.equal(renderAccounts([],{tty:true}),'No accounts available.\n');
  assert.equal(renderAccounts([]),'');
});
