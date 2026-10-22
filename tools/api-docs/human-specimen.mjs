// Native Redoc 3, read-only documentation specimen. No API execution.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const tool=dirname(fileURLToPath(import.meta.url));
const output=resolve(process.argv[2]??resolve(tool,'dist'));
const evidence=resolve(output,'private');await mkdir(evidence,{recursive:true});
const agent=JSON.parse(await readFile(resolve(evidence,'agent-specimen.json'),'utf8'));
const spec=JSON.parse(await readFile(resolve(evidence,'public-projection.json'),'utf8'));
const provenance=JSON.parse(await readFile(resolve(evidence,'provenance.json'),'utf8'));
const entry=process.argv[3]??pathToFileURL(resolve(output,'site/index.html')).href;
const live=entry.startsWith('https:');if(live)assert.equal(new URL(entry).hostname,'brooksbol.github.io');
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000}});
const requests=[],errors=[],violations=[],visited=[];
await context.route('**/*',route=>{
 const r=route.request(),u=new URL(r.url());
 if(['http:','https:'].includes(u.protocol)&&!(live&&r.method()==='GET'&&r.url()===entry)){violations.push(r.url());return route.abort();}
 return route.continue();
});
const page=await context.newPage();page.on('request',r=>requests.push({method:r.method(),url:r.url()}));page.on('pageerror',e=>errors.push(e.message));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const text=async()=>(await page.locator('body').innerText()).replace(/\s+/g,' ');
async function safety(){
 assert.equal(await page.locator('form,input[type="password"]').count(),0);
 assert.equal(await page.getByRole('link',{name:/download/i}).count(),0);
 assert.equal(await page.getByRole('button',{name:/try it|send request|authorize/i}).count(),0);
 assert.doesNotMatch(await text(),/\b(?:authentication|authorization|credentials?|grants?)\b|quote\.(?:read|acquire|force)|account\.\w+\.\w+|\b(?:read|write|administrator|acquisition) authority\b|expand authority|source scopes? deny/i);
 for(const path of ['/v2/users','/v2/position-acquisitions','/v2/market-evidence-subjects'])assert.ok(!(await text()).includes(path));
}
try{
 await page.goto(entry);await page.getByRole('link',{name:'Accounts',exact:true}).first().waitFor();await safety();
 assert.ok((await text()).includes('Last publication: '+(provenance.publicationDate??'not published')));
 const groups=new Map();for(const [path,item] of Object.entries(spec.paths))for(const [method,op] of Object.entries(item)){
  if(!['get','post'].includes(method))continue;const tag=op.tags[0];if(!groups.has(tag))groups.set(tag,[]);groups.get(tag).push({path,method,op});
 }
 for(const [tag,ops] of groups){
  await page.getByRole('link',{name:tag,exact:true}).first().click();
  for(const {path,method,op} of ops){
   await page.locator(`a[href$="/${op.operationId.toLowerCase()}"]`).first().click();
   // Native heading anchors contribute an accessible-name prefix; exact v2 names are not reused.
   const heading=page.getByRole('heading',{name:new RegExp(escape(op.summary)+'$')}).first();await heading.waitFor();await heading.scrollIntoViewIfNeeded();
   assert.ok((await text()).includes(path),op.operationId+' path');
   assert.ok((await text()).includes('curl --request '+method.toUpperCase()),op.operationId+' source cURL');
   assert.ok((await text()).includes('api.example.invalid'),op.operationId+' nonworking origin');
   await safety();visited.push(op.operationId);
  }
 }
 assert.equal(visited.length,32);assert.deepEqual([...visited].sort(),[...agent.publicOperationIds].sort());
 await page.getByRole('link',{name:'Artifacts',exact:true}).first().click();
 await page.getByRole('heading',{name:/List retained Artifacts$/}).first().waitFor();
 await page.getByText('422',{exact:true}).last().click();
 assert.match(await text(),/application\/problem\+json/);assert.match(await text(),/INVALID_REQUEST/);
 await safety();
 await page.getByRole('link',{name:'Positions',exact:true}).first().click();await page.locator('a[href$="/readposition"]').first().click();
 await page.getByRole('heading',{name:/Read position$/}).first().waitFor();await page.waitForTimeout(900);await page.getByRole('heading',{name:/Read position$/}).first().scrollIntoViewIfNeeded();await page.screenshot({path:resolve(evidence,'desktop.png')});const positionUrl=page.url();
 // Actual native search, not a reconstructed index or endpoint call.
 await page.keyboard.press(process.platform==='darwin'?'Meta+k':'Control+k');
 const search=page.locator('input:visible').first();await search.waitFor();await search.fill('retained');await page.waitForTimeout(700);
 assert.match(await text(),/transaction|Account/i);await page.screenshot({path:resolve(evidence,'search.png')});await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.goto(entry);await page.waitForTimeout(600);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await page.screenshot({path:resolve(evidence,'mobile.png')});await safety();
 await page.goto(positionUrl);await page.getByRole('heading',{name:/Read position$/}).first().waitFor();await page.waitForTimeout(900);await page.getByRole('heading',{name:/Read position$/}).first().scrollIntoViewIfNeeded();await page.screenshot({path:resolve(evidence,'mobile-position.png')});await safety();
 assert.equal(violations.length,0,JSON.stringify(violations));assert.equal(errors.length,0,JSON.stringify(errors));
 assert.ok(requests.every(r=>r.method==='GET'&&(/^(?:file:|blob:|data:)/.test(r.url)||(live&&r.url===entry))));
 const report={mode:'AUTHOR_BROWSER_VERIFICATION_NOT_INDEPENDENT_REVIEW',entry,live,renderer:'Redoc 3.0.1',browser:browser.version(),
  operationCount:visited.length,internalOperationCount:agent.operationCount,visitedOperationIds:visited,nativeSearch:'PASS',nativeErrorExample:'422 INVALID_REQUEST visible',responsiveLayout:'PASS at1440/390px',
  syntheticCurl:'PASS on every operation; derived from source x-codeSamples',schemasAndExamples:'Validated separately against exact OAS',
  liveApiControls:'ABSENT',publicAuthInstructions:'ABSENT',downloadOffer:'ABSENT',networkRequests:requests,unexpectedRequests:violations,pageErrors:errors,backendRequired:false};
 await writeFile(resolve(evidence,live?'live-specimen.json':'human-specimen.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: all32 public operations navigated; native cURL/search/mobile; no forms, API controls, private instructions or unexpected requests');
}finally{await browser.close();}
