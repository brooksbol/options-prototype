// Actual normal Talk host -> SDK -> MCP -> API -> acquisition -> native browser result.
// Model decisions and raw provider transport are controlled; production connections remain real.
import '../privacy.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Usage} from '@openai/agents';
import {startPreview} from '../server.mjs';
import {recoveryBackend} from '../../../scripts/engineering/recovery-backend.mjs';
import {evidenceView} from '../ui/evidence-view.js';
import {usdDisplay} from '../ui/currency.js';
const [ready,output]=process.argv.slice(2);assert.ok(ready&&output&&process.argv.length===4);
const backend=JSON.parse(await readFile(ready,'utf8'));assert.equal(backend.provider,'RAW_LOOPBACK_ONLY');
const trustedFetch=globalThis.fetch;
const router=await recoveryBackend({candidate:backend,operational:backend});
const calls=[['inspect_account_positions',{accountScope:'ACCOUNT',account:'pine',underlying:'ABC'}],['inspect_account_balances',{account:'orchard'}]];
let stage=0;const model={async getResponse(){const i=stage++;if(i%2===0){const [name,args]=calls[i/2];return {output:[{type:'function_call',callId:crypto.randomUUID(),name,arguments:JSON.stringify(args)}],usage:new Usage({requests:1})};}return {output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Options buying power is repeated here. Retained evidence does not establish holdings. $3E+3.'}]}],usage:new Usage({requests:1})};}};
let app;
try{
 app=await startPreview({port:0,model,authorizedRetainedBackend:{...router,profile:'AUTHORIZED_REAL_RETAINED_READS',providerBeans:true,architecturalRecovery:true}});
 assert.notEqual(globalThis.fetch,trustedFetch,'Normal host installs actual model-only global egress guard');
 const status=await trustedFetch(app.url+'/api/status').then(r=>r.json());const answers=[];
 for(const question of ['Show ABC in pine tactically.','What is orchard buying power?']){const r=await trustedFetch(app.url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:app.url,'X-Talk-CSRF':status.csrf},body:JSON.stringify({message:question})});assert.equal(r.status,200);const answer=await r.json();assert.ok(!answer.error);assert.ok(answer.tools.length);assert.ok(answer.tools.every(t=>!t.isError),JSON.stringify(answer.tools));answers.push(answer);}
 const unwrap=t=>{let v=t.result;try{const e=JSON.parse(v);if(e.type==='text')v=e.text;}catch{}return v;};
 const inventory=evidenceView(unwrap(answers[0].tools[0])).tacticalInventory;assert.ok(inventory);const e=inventory.accounts[0].items[0].evaluation;
 assert.equal(e.spot.value,'12');assert.equal(inventory.accounts[0].source.observationDate,'2026-10-27');assert.equal(e.payoff.geometry.spotPoint.price,'12');
 const balances=evidenceView(unwrap(answers[1].tools[0])).balanceSummary;assert.ok(balances);assert.ok(balances.facts.some(f=>f.value==='$2,994.17'));assert.equal(usdDisplay('3E+3'),'$3,000.00');
 // Actual served assets replay the actual normal-host SDK answers; no additional model calls.
 const {chromium}=await import('../../api-docs/node_modules/playwright/index.mjs');const browser=await chromium.launch({headless:true});
 try{for(const width of [1360,390])for(const [i,answer]of answers.entries()){const page=await browser.newPage({viewport:{width,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/chat',route=>route.fulfill({json:answer}));await page.goto(app.url);await page.locator('#message').fill('Show result');await page.locator('#send').click();await page.locator(i===0?'.tactical-compact':'.balance-card').first().waitFor();const text=await page.locator('body').innerText();assert.ok(!text.includes('Options buying power is repeated here.'));assert.ok(!text.includes('$3E+3'));if(i===0)assert.equal(await page.locator('.tactical-observed-spot').count(),1);else assert.match(text,/\$2,994\.17/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();}}finally{await browser.close();}
 await writeFile(output,JSON.stringify({normalHost:true,globalEgressGuard:true,sdk:true,mcp:true,rawProvider:true,marketReplacement:true,custodyUnchanged:true,balanceAcquisition:true,nativeMarker:true,nativeBalance:true,narrationCollapsed:true,normalCurrency:true,viewports:2,externalModelRequests:0},null,2));
}finally{await app?.close();await router.close();assert.equal(globalThis.fetch,trustedFetch,'Host cleanup restores trusted transport');}
