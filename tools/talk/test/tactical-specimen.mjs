// Explicit opt-in live-model test. Controlled native backend fixture only, never real Account parity.
import '../privacy.mjs';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {existingKey} from '../server.mjs';
import {createConversation} from '../conversation.mjs';
import {connectSyntheticMcp,syntheticCapabilities} from '../synthetic.mjs';
import {egressBoundary} from '../privacy.mjs';
const sample=JSON.parse(readFileSync(new URL('../../../evidence-service-java/build/reports/tactical/condor.json',import.meta.url)));
const accountId=sample.evidence.items[0].account.href.split('/').at(-1),token=randomUUID(),reads=[];let acquired=!process.argv.includes('--acquire');
const server=createServer((req,res)=>{const requestId=randomUUID(),url=new URL(req.url,'http://localhost');reads.push(url.pathname+url.search);res.setHeader('Content-Type','application/json');res.setHeader('X-Request-Id',requestId);if(req.headers.authorization!==`Bearer ${token}`){res.writeHead(403).end(JSON.stringify({requestId,status:403,code:'FORBIDDEN',title:'Forbidden'}));return;}
 if(url.pathname==='/v2/accounts')return res.end(JSON.stringify({requestId,accounts:[{id:accountId,alias:'fixture',displayName:'Controlled fixture',brokerAssociation:{broker:'TASTYTRADE'}}]}));
 if(url.pathname==='/v2/position-acquisitions'&&req.method==='POST'){const correlation=req.headers['x-request-id'];res.setHeader('X-Request-Id',correlation);acquired=true;return res.end(JSON.stringify({requestId:correlation,accountId,acquisitionId:randomUUID(),artifactId:randomUUID(),snapshotId:'snapshot-'+randomUUID(),status:'ACCEPTED',startedAt:'2026-10-29T16:00:00Z',receivedAt:'2026-10-29T16:00:01Z',completedAt:'2026-10-29T16:00:02Z'}));}
 if(url.pathname==='/v2/positions')return res.end(JSON.stringify({...sample.evidence,items:acquired?sample.evidence.items:[],requestId}));
 res.writeHead(404).end(JSON.stringify({requestId,status:404,code:'NOT_FOUND',title:'Not found'}));});
server.listen(0,'127.0.0.1');await once(server,'listening');
let servers=[],chat;const boundary=egressBoundary(),prior=globalThis.fetch;globalThis.fetch=boundary.fetch;
try{const backend={base:`http://127.0.0.1:${server.address().port}`,token,syntheticOnly:true};servers=await connectSyntheticMcp(backend,[...syntheticCapabilities.filter(c=>!c.admitted.includes('hello_world')),{name:'controlled-native-evidence',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_account_positions','inspect_account_holdings','inspect_market_quotes','inspect_account_balances','acquire_account_holdings']}]);chat=createConversation({servers,apiKey:existingKey(),fetchImpl:boundary.fetch,clock:()=>new Date('2026-10-29T16:00:00Z'),operatorTimeZone:'America/Denver'});
 const result=await chat.send(process.argv.includes('--acquire')?'Refresh my fixture brokerage holdings, then show positions with trade shape, spot, DTE and exit progress.':'Show my fixture positions with trade shape, spot, DTE and exit progress.');
 writeFileSync('/tmp/ww-tactical-sdk-attempt.json',JSON.stringify({answer:result.text,error:result.error,failure:result.failure,tools:result.tools,reads,usage:result.usage,modelRequests:boundary.requests.length},null,2));
 if(process.argv.includes('--acquire'))assert.ok(result.tools.some(t=>t.name==='acquire_account_holdings'));
 assert.ok(!result.error,JSON.stringify(result.failure));assert.ok(result.tools.some(t=>t.name==='inspect_account_positions'));assert.ok(reads.some(p=>p.startsWith('/v2/positions?')&&new URL(p,backend.base).searchParams.get('projection')==='tactical'));assert.ok(boundary.events.every(e=>e.allowed&&e.store===false&&!e.previousResponse&&!e.conversation));
 const report={standing:'CONTROLLED_NATIVE_FIXTURE_NOT_REAL_ACCOUNT_PARITY',question:'Show my fixture positions with trade shape, spot, DTE and exit progress.',selectedTools:result.tools.map(t=>({name:t.name,arguments:JSON.parse(t.arguments)})),answer:result.text,modelRequests:boundary.requests.length,usage:result.usage,privacy:boundary.events,evidenceRows:sample.evidence.items.length};
 if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({standing:report.standing,selectedTools:report.selectedTools,modelRequests:report.modelRequests,usage:report.usage}));
}finally{await chat?.close();await Promise.allSettled(servers.map(s=>s.close()));server.closeAllConnections();await new Promise(r=>server.close(r));globalThis.fetch=prior;}
