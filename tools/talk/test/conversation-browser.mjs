// Opt-in: render the five actual responses captured by installed-positions --conversation.
// No model calls; private responses/screenshots remain in the supplied evidence directory.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const [directory,modulePath]=process.argv.slice(2);
if(!directory||!modulePath)throw Error('Provide private conversation evidence directory and Playwright module.');
const folder=resolve(directory),answers=await Promise.all(Array.from({length:5},(_,i)=>readFile(join(folder,`turn-${i}.json`),'utf8').then(JSON.parse)));
const {chromium}=await import(pathToFileURL(resolve(modulePath))),browser=await chromium.launch({headless:true});
const messages=['show me pts','show pts positiosn','show me ptf','tactical view','show me nov 20 options'],checks=[];
await mkdir(join(folder,'browser'),{recursive:true,mode:0o700});
try{
 for(const [viewport,width,height]of[['desktop',1360,960],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];let turn=0;
  page.on('pageerror',e=>errors.push(e.name));
  await page.route('**/api/chat',route=>route.fulfill({json:answers[turn++]}));
  await page.goto('http://127.0.0.1:8787/');await page.waitForFunction(()=>!document.querySelector('#status').textContent.includes('Connecting'));
  for(const [i,message]of messages.entries()){
   await page.locator('#message').fill(message);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#send').disabled);
   const article=page.locator('article.assistant').last();
   assert.ok(await article.locator('.tactical-compact').count(),'Each response supplies native tactical cards');
   assert.equal(await article.locator('.custody-inventory,.option-inventory-card').count(),0,'No raw or wrong-scope fallback');
   assert.equal(await article.locator('pre:visible').count(),0,'Technical evidence stays collapsed');
   assert.equal(await article.locator(':scope > .text').count(),0,'Repeated model narration stays behind evidence');
   assert.doesNotMatch(await article.innerText(),/does not prove|not proof|no new finding|does not establish|live completeness|no empty.Account/i);
   for(const node of await article.locator('h1:visible,h2:visible,h3:visible,h4:visible,h5:visible,h6:visible,li:visible').all())assert.ok((await node.innerText()).trim(),'No empty headings or bullets');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:join(folder,'browser',`${viewport}-${i}.png`)});
   const disclosure=article.locator('.tactical-details').first();await disclosure.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await disclosure.getAttribute('open'),'');await disclosure.locator('pre').first().waitFor({state:'attached'});await page.keyboard.press('Enter');assert.equal(await disclosure.getAttribute('open'),null);
   checks.push({viewport,message,native:true,noRawDump:true,noForegroundBoilerplate:true,noEmptySections:true,keyboardEvidence:true,noOverflow:true});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close();}
await writeFile(join(folder,'browser','checks.json'),JSON.stringify(checks,null,2),{mode:0o600});
console.log(JSON.stringify({result:'PASS',turns:5,viewports:2,checks:checks.length}));
