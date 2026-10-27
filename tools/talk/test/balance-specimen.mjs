// Explicit authorized synthetic real-model test. No operational backend or Account data.
import '../privacy.mjs';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { egressBoundary } from '../privacy.mjs';
const boundary=egressBoundary(globalThis.fetch);globalThis.fetch=boundary.fetch;
const { marketFixture }=await import('../market-fixture.mjs');
const { connectSyntheticMcp }=await import('../synthetic.mjs');
const { createConversation }=await import('../conversation.mjs');
const { existingKey }=await import('../server.mjs');
const key=existingKey();assert.ok(key,'Existing approved model credential unavailable');
const backend=await marketFixture();const started=Date.now();const results=[];let servers=[];
try {
 for(const phase of ['before','after']) {
  servers=await connectSyntheticMcp(backend,[{name:'accounts',script:'../mcp-account-question/server.mjs',admitted:['list_authorized_accounts']},
   {name:'evidence',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_market_quotes','inspect_account_positions',...(phase==='after'?['inspect_account_balances']:[])]}]);
  const chat=createConversation({servers,apiKey:key,fetchImpl:boundary.fetch});
  const messages=phase==='before'?['What is my tastytrade buying power?']:['What is my tastytrade buying power?',
   'Is that options buying power, stock buying power, or cash? Please distinguish them.',
   'Am I actually borrowing on margin?',
   'What collateral is committed to my existing short puts?',
   'Are those balances current after today’s trades?'];
  for(const question of messages){const result=await chat.send(question);results.push({phase,question,...result});console.log(JSON.stringify({phase,question,tools:result.tools.map(t=>t.name),commentaryAvailable:!result.error}));}
  await chat.close();await Promise.all(servers.map(s=>s.close()));servers=[];
 }
 const before=results.find(r=>r.phase==='before');const after=results.find(r=>r.phase==='after');
 const result={profile:'SYNTHETIC_ONLY_REAL_MODEL',normalRuntime:process.env.NODE_ENV??'unset',results,
  backendReads:await backend.reads(),outbound:boundary.events,modelRequests:boundary.requests.length,
  usage:results.reduce((a,r)=>({inputTokens:a.inputTokens+(r.usage?.inputTokens??0),outputTokens:a.outputTokens+(r.usage?.outputTokens??0)}),{inputTokens:0,outputTokens:0}),
  elapsedSeconds:(Date.now()-started)/1000,providerRequests:0,protectedPayloadsUsed:false,
  note:'Author observation, not independent review, real brokerage verification or Product acceptance.'};
 writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
 assert.ok(!before.tools.some(t=>t.name==='inspect_account_balances'));
 assert.ok(after.tools.some(t=>t.name==='inspect_account_balances'&&!t.isError));
 assert.match(after.text,/1,?000\.01/);
 assert.match(results.filter(r=>r.phase==='after').map(r=>r.text).join(' '),/2,?000\.02/);
 assert.ok(boundary.events.every(e=>e.allowed&&e.store===false&&!e.conversation&&!e.previousResponse));
 console.log(JSON.stringify({modelRequests:result.modelRequests,usage:result.usage,elapsedSeconds:result.elapsedSeconds,
  results:results.map(({phase,question,text,tools,error})=>({phase,question,text,error,tools:tools.map(t=>({name:t.name,isError:t.isError}))}))}));
}finally{await Promise.allSettled(servers.map(s=>s.close()));await backend.close();}
