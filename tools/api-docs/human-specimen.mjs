// Read-only native Redoc inspection. Browses local static files; blocks all HTTP.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const tool=dirname(fileURLToPath(import.meta.url));
const output=resolve(process.argv[2]??resolve(tool,'dist'));
const site=resolve(output,'site/index.html'), evidence=resolve(output,'private');
await mkdir(evidence,{recursive:true});
const agent=JSON.parse(await readFile(resolve(evidence,'agent-specimen.json'),'utf8'));
const provenance=JSON.parse(await readFile(resolve(evidence,'provenance.json'),'utf8'));
const entry=process.argv[3]??pathToFileURL(site).href;
const live=entry.startsWith('https://');
if(live) assert.equal(new URL(entry).hostname,'brooksbol.github.io');
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const requests=[],errors=[],violations=[];
await context.route('**/*',route=>{
 const request=route.request(),url=new URL(request.url());
 if(['http:','https:'].includes(url.protocol) && !(live && request.method()==='GET' && request.url()===entry)){violations.push(request.url());return route.abort();}
 return route.continue();
});
const page=await context.newPage();
page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
page.on('pageerror',e=>errors.push(e.message));
await page.goto(entry);
await page.waitForSelector('input[aria-label="Search"]');
await page.waitForFunction(()=>!!window.Redoc);
await page.waitForTimeout(1000);
assert.equal(await page.locator('form,input[type="password"]').count(),0);
assert.equal(await page.getByRole('link',{name:/download/i}).count(),0);
assert.equal(await page.getByRole('button',{name:/try it|send request|authorize/i}).count(),0);
const body=await page.locator('body').innerText();
assert.doesNotMatch(body,/\b(?:authentication|authorization|credentials?|grants?)\b|quote\.(?:read|acquire|force)|account\.\w+\.\w+|\b(?:read|write|administrator|acquisition) authority\b|expand authority|source scopes? deny/i);
if(provenance.publicationDate) assert.ok(body.includes('Last publication: '+provenance.publicationDate));
else assert.match(body,/Last publication:\s*not published/);
for(const op of agent.operations){
 const expected=agent.publicOperationIds.includes(op.operationId)?1:0;
 assert.equal(await page.locator(`[data-section-id="operation/${op.operationId}"]`).count(),expected,op.operationId);
}
assert.equal(agent.publicOperationCount,32);
assert.ok(body.includes('Identity'));
for(const path of ['/v2/users','/v2/position-acquisitions','/v2/market-evidence-subjects']) assert.ok(!body.includes(path));
for(const [tag,id] of [['Accounts','listAccounts'],['Quotes','listHeldDirectQuotes']]){
 const op=page.locator(`[data-section-id="tag/${tag}/operation/${id}"]`);
 const label=op.getByRole('button',{name:'422 — Invalid request',exact:true}).first();
 await label.click();
 assert.ok((await op.innerText()).includes('401 — Unauthenticated'));
 assert.equal(await op.getByRole('button',{name:'object',exact:true}).count(),0);
 assert.doesNotMatch(await op.innerText(),/One of\s*HeldQuotesReadProblem/);
 await label.scrollIntoViewIfNeeded();
 await page.screenshot({path:resolve(evidence,id+'-labels.png')});
}
const capital=page.locator('[data-section-id="tag/Portfolio-capital/operation/readPortfolioCapitalObservations"]');
assert.ok((await capital.locator('p').count())>=5);
await capital.getByRole('heading').first().scrollIntoViewIfNeeded();
await page.screenshot({path:resolve(evidence,'capital-introduction.png')});
await page.screenshot({path:resolve(evidence,'desktop.png')});
const search=page.getByRole('textbox',{name:'Search'});
await search.fill('retained');await page.waitForTimeout(1000);
assert.match((await page.locator('body').innerText()).slice(0,800),/×\nGET\nRead Account transaction history/);
await search.fill('');await page.waitForTimeout(150);
const upload=page.locator('[data-section-id="tag/Artifacts/operation/retainAndProcessAccountArtifact"]');
// Accepted findings #5/#7/#9: inspect the public rendering, not private OAS.
const acquisition=page.locator('[data-section-id="tag/Quotes/operation/acquireDirectQuotes"]');
assert.match(await acquisition.innerText(),/FORCE bypasses reuse, not provider-contact restrictions/);
assert.match(await acquisition.innerText(),/CONTACT_NOT_PERMITTED means policy prevented contact/);
const held=page.locator('[data-section-id="tag/Quotes/operation/readHeldDirectQuote"]');
await held.getByRole('button',{name:'expand provenance',exact:true}).click();
assert.match(await held.innerText(),/Opaque Wheelwright fencing identifier/);
await held.getByText('authorityEpoch',{exact:true}).scrollIntoViewIfNeeded();
await page.screenshot({path:resolve(evidence,'provenance.png')});
const uploadText=await upload.innerText();
for(const text of ['Supported Fidelity CSV exports','POSITIONS','ACTIVITY','BALANCES','OPTION_SUMMARY',
 'Account number; Account name; Investment type','Run Date; Action; Symbol; Amount ($)',
 'Balance; Day change','Symbol; Strategy; Expiration & Strike; Quantity',
 'Option Summary {broker-account}','HTTP 200 with status REJECTED']) assert.ok(uploadText.includes(text),text);
await upload.getByRole('heading',{name:'Supported Fidelity CSV exports',exact:true}).scrollIntoViewIfNeeded();
await page.screenshot({path:resolve(evidence,'csv-formats.png')});
await upload.getByRole('tab',{name:'Synthetic cURL',exact:true}).click();
assert.match(await upload.innerText(),/api\.example\.invalid/);
await upload.getByRole('button',{name:'Copy',exact:true}).first().click();
await upload.getByRole('tab',{name:'422',exact:true}).click();
await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-section-id="tag/Artifacts/operation/retainAndProcessAccountArtifact"] [role="tabpanel"]'))
 .some(e=>e.getBoundingClientRect().height>0 && e.innerText.includes('INVALID_REQUEST')));
assert.match(await upload.locator('[role="tabpanel"]:visible').last().innerText(),/INVALID_REQUEST/);
assert.match(await upload.innerText(),/Content-Disposition/);
await upload.locator('[role="tabpanel"]:visible').last().scrollIntoViewIfNeeded();
await page.screenshot({path:resolve(evidence,'upload-error.png')});
await page.setViewportSize({width:390,height:844});
await page.goto(entry);await page.waitForTimeout(200);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
await page.screenshot({path:resolve(evidence,'mobile.png')});
// Native floating navigation control observed at this pinned mobile viewport.
await page.mouse.click(340,760);await page.waitForTimeout(200);
assert.equal(await page.getByRole('textbox',{name:'Search'}).isVisible(),true);
await page.screenshot({path:resolve(evidence,'mobile-menu.png')});
assert.equal(violations.length,0,JSON.stringify(violations));
assert.equal(errors.length,0,JSON.stringify(errors));
assert.ok(requests.every(r=>r.method==='GET' && (/^(?:file:|blob:|data:)/.test(r.url) || (live && r.url===entry))));
await browser.close();
const report={mode:'AUTHOR_BROWSER_VERIFICATION_NOT_INDEPENDENT_REVIEW',entry,live,browser:'Chromium 141 / Playwright 1.56.1',
 operationCount:agent.publicOperationCount,internalOperationCount:agent.operationCount,nativeSearch:'PASS',nativeErrorTitles:'PASS: distinct HTTP status/title selectors',identityCategory:'PASS',nativeResponsiveLayout:'PASS at 1440 and 390px',
 schemasAndSyntheticCurl:'PASS',visibleErrorExample:'422 INVALID_REQUEST',publicAuthInstructions:'ABSENT',
 liveApiControls:'ABSENT',downloadOffer:'ABSENT',networkRequests:requests,unexpectedRequests:violations,
 pageErrors:errors,backendRequired:false,staticFileHydration:'PASS',acceptedTriageCorrections:'PASS: opaque provenance, FORCE contact policy, four CSV formats/rejection',
 nativeDarkMode:'UNAVAILABLE in pinned Redoc 2.5.4'};
await writeFile(resolve(evidence,live?'live-specimen.json':'human-specimen.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: human specimen; all operations/search/responsive/cURL/error/schema; no unintended requests or execution UI');
