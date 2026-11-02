// Whole SDK/MCP/API/acquisition/native chain. Only model decisions and raw provider transport are controlled.
import '../privacy.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {Usage} from '@openai/agents';
import {connectSyntheticMcp} from '../synthetic.mjs';
import {createConversation} from '../conversation.mjs';
import {evidenceView} from '../ui/evidence-view.js';
import {usdDisplay} from '../ui/currency.js';
const [ready,output]=process.argv.slice(2);assert.ok(ready&&output&&process.argv.length===4);
const backend=JSON.parse(await readFile(ready,'utf8'));assert.equal(backend.provider,'RAW_LOOPBACK_ONLY');
const servers=await connectSyntheticMcp(backend,[{name:'recovery',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_account_positions','inspect_account_balances'],timeoutMs:45000}]);
const calls=[['inspect_account_positions',{accountScope:'ACCOUNT',account:'pine',underlying:'ABC'}],['inspect_account_balances',{account:'orchard'}]];
let stage=0;const model={async getResponse(){const i=stage++;if(i%2===0){const [name,args]=calls[i/2];return {output:[{type:'function_call',callId:crypto.randomUUID(),name,arguments:JSON.stringify(args)}],usage:new Usage({requests:1})};}return {output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Options buying power is repeated here. Retained evidence does not establish holdings. $3E+3.'}]}],usage:new Usage({requests:1})};}};
const chat=createConversation({servers,model});const answers=[];
try{
 for(const question of ['Show ABC in pine tactically.','What is orchard buying power?']){const answer=await chat.send(question);assert.ok(!answer.error);assert.ok(answer.tools.length);assert.ok(answer.tools.every(t=>!t.isError),JSON.stringify(answer.tools));answers.push(answer);}
 const unwrap=t=>{let v=t.result;try{const envelope=JSON.parse(v);if(envelope.type==='text')v=envelope.text;}catch{}return v;};
 const inventory=evidenceView(unwrap(answers[0].tools[0])).tacticalInventory;assert.ok(inventory);const e=inventory.accounts[0].items[0].evaluation;
 assert.equal(e.spot.value,'12');assert.equal(inventory.accounts[0].source.observationDate,'2026-10-27');assert.equal(e.payoff.geometry.spotPoint.price,'12');
 const balances=evidenceView(unwrap(answers[1].tools[0])).balanceSummary;assert.ok(balances);assert.ok(balances.facts.some(f=>f.value==='$2,994.17'));
 assert.equal(usdDisplay('3E+3'),'$3,000.00');
 // Serve exact production assets and replay the actual SDK results, not an independently fabricated card.
 let selected=answers[0];const app=createServer(async(req,res)=>{try{if(req.url==='/api/status'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({csrf:'fitness',profile:'Synthetic',imageAttachments:false}));return;}if(req.url==='/api/chat'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(selected));return;}const pathname=req.url==='/'?'index.html':req.url.slice(1);if(pathname.includes('..'))throw Error();const file=pathname.startsWith('node_modules/')?new URL('../'+pathname,import.meta.url):new URL('../ui/'+pathname,import.meta.url);res.setHeader('Content-Type',pathname.endsWith('.css')?'text/css':pathname.endsWith('.html')?'text/html':'text/javascript');res.end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const {chromium}=await import('../../api-docs/node_modules/playwright/index.mjs');const browser=await chromium.launch({headless:true});
 try{for(const width of [1360,390])for(const [i,answer]of answers.entries()){selected=answer;const page=await browser.newPage({viewport:{width,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+app.address().port);await page.locator('#message').fill('Show result');await page.locator('#send').click();await page.locator(i===0?'.tactical-compact':'.balance-card').first().waitFor();const text=await page.locator('body').innerText();assert.ok(!text.includes('Options buying power is repeated here.'));assert.ok(!text.includes('$3E+3'));if(i===0)assert.equal(await page.locator('.tactical-observed-spot').count(),1);else assert.match(text,/\$2,994\.17/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();}}finally{await browser.close();await new Promise(resolve=>app.close(resolve));}
 await writeFile(output,JSON.stringify({sdk:true,mcp:true,rawProvider:true,marketReplacement:true,custodyUnchanged:true,balanceAcquisition:true,nativeMarker:true,nativeBalance:true,narrationCollapsed:true,normalCurrency:true,viewports:2,externalModelRequests:0},null,2));
}finally{await chat.close();await Promise.all(servers.map(s=>s.close()));}
