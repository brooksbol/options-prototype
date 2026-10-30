import {renderMarkdown} from '../ui/markdown.js';
import test from 'node:test';
import assert from 'node:assert/strict';

test('expired UI session stops submissions, preserves visible evidence and requires explicit reload', async () => {
  const elements = new Map();
  function element() {
    return { listeners: {}, children: [], value: '', disabled: false, hidden: true,
      append(...items) { this.children.push(...items); }, replaceChildren() {}, scrollIntoView() {},
      remove() {}, focus() {}, removeAttribute(name) { this[name] = false; },
      addEventListener(name, callback) { this.listeners[name] = callback; } };
  }
  const originalFetch = globalThis.fetch;
  let posts = 0;
  globalThis.document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, element()); return elements.get(id);
  }, createElement: element, createTextNode: text => ({ textContent: text }) };
  globalThis.fetch = async (_path, options) => options ? (posts++, new Response('PRIVATE-ERROR-CANARY', { status: 403 })) :
    new Response(JSON.stringify({ csrf: 'synthetic-session', tools: [] }));
  try {
    await import('../ui/app.js?expired-session');
    const evidence = element(); document.getElementById('messages').children.push(evidence);
    elements.get('message').value = 'Hello.';
    await elements.get('composer').listeners.submit({ preventDefault() {} });
    assert.equal(posts, 1);
    assert.equal(elements.get('send').disabled, true);
    assert.equal(elements.get('new').disabled, true);
    assert.equal(elements.get('message').disabled, true);
    assert.equal(elements.get('reload').hidden, false);
    assert.ok(elements.get('messages').children.includes(evidence));
    elements.get('message').value = 'Do not silently resubmit this.';
    await elements.get('composer').listeners.submit({ preventDefault() {} });
    assert.equal(posts, 1);
    assert.match(elements.get('messages').children.at(-1).children[1].innerHTML, /session changed or expired/);
  } finally { delete globalThis.document; globalThis.fetch = originalFetch; }
});

test('balance render creates four facts and defers provenance DOM until deliberate disclosure',async()=>{
 const elements=new Map(),created=[];
 function element(tag='div'){const e={tag,listeners:{},children:[],value:'',disabled:false,open:false,classList:{add(){}},
 append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},
 insertBefore(item,before){this.children.splice(this.children.indexOf(before),0,item);},
 querySelector(selector){return this.children.find(c=>selector==='.'+c.className);},
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};Object.defineProperty(e,'innerHTML',{get(){return this._html??'';},set(value){this._html=value;this.textContent=value.replace(/<[^>]*>/g,'');}});created.push(e);return e;}
 const priorFetch=globalThis.fetch;
 globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,createTextNode:text=>({textContent:text})};
 const raw=JSON.stringify({account:{nickname:'fixture'},evidence:{selection:{mode:'latest-source',status:'SELECTED',readAt:'2026-10-27T12:00:00Z',unknownSourceTimeCount:0},observations:[{broker:'FIDELITY',source:{artifactId:'PROVENANCE-CANARY',exportedAt:'2026-10-19T16:00:00-04:00'},fields:['Available without margin impact','Margin debit','Cash reserved for options','Settled cash'].map(brokerField=>({brokerField,status:'REPORTED',value:'1.25',reportedDisplay:'$1.25'}))}]}});
 globalThis.fetch=async(_path,opts)=>new Response(JSON.stringify(opts?{text:'Historical retained balance.',tools:[{result:JSON.stringify({type:'text',text:raw})}]}:{csrf:'fixture',profile:'Synthetic retained evidence',tools:[]}));
 try{
  await import('../ui/app.js?bounded-balance');elements.get('message').value='Show fixture balance';await elements.get('composer').listeners.submit({preventDefault(){}});
  const facts=created.find(e=>e.className==='balance-facts');assert.equal(facts.children.length,4);
  assert.equal(created.filter(e=>e.tag==='pre').length,0);
  assert.ok(!created.some(e=>e.textContent==='PROVENANCE-CANARY'));
  const details=created.find(e=>e.tag==='details');assert.equal(details.children.length,1);
  details.open=true;details.listeners.toggle();assert.ok(created.some(e=>e.textContent==='PROVENANCE-CANARY'));
  const count=created.length;details.listeners.toggle();assert.equal(created.length,count);
 }finally{delete globalThis.document;globalThis.fetch=priorFetch;}
});

test('holdings source rows are lazy, answer Markdown renders, and access denials stay visible',async()=>{
 const elements=new Map(),created=[];
 function element(tag='div'){const e={tag,listeners:{},children:[],value:'',open:false,
 append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},
 insertBefore(item,before){this.children.splice(this.children.indexOf(before),0,item);},
 querySelector(selector){return this.children.find(c=>selector==='.'+c.className);},
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};Object.defineProperty(e,'innerHTML',{get(){return this._html??'';},set(value){this._html=value;this.textContent=value.replace(/<[^>]*>/g,'');}});created.push(e);return e;}
 const priorFetch=globalThis.fetch;
 globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,createTextNode:text=>({textContent:text})};
 const raw=JSON.stringify({outcome:'PARTIAL',accounts:[{nickname:'pine',broker:'FIDELITY',complete:false,holdings:Array.from({length:60},()=>({sourceInstrument:{identifier:'SOURCE-ROW-CANARY'},quantity:'100',unit:'SHARE'}))},{nickname:'birch',complete:false,holdings:[],problems:[{code:'FORBIDDEN'}]}],qualification:'SOURCE-QUALIFICATION-CANARY'});
 globalThis.fetch=async(_path,opts)=>new Response(JSON.stringify(opts?{text:'### Retained holdings\n\n| Instrument | Quantity |\n|---|---|\n| FIXTURE | 100 shares |\n\n- Historical source.',tools:[{name:'inspect_account_holdings',result:JSON.stringify({type:'text',text:raw})}]}:{csrf:'fixture',profile:'Synthetic retained evidence',tools:[]}));
 try{
  await import('../ui/app.js?compact-holdings');elements.get('message').value='Show holdings';await elements.get('composer').listeners.submit({preventDefault(){}});
  const answer=elements.get('messages').children.at(-1);assert.match(answer.querySelector('.text').innerHTML,/<h3>Retained holdings<\/h3>/);assert.match(answer.querySelector('.text').innerHTML,/<table>/);
  assert.ok(!created.some(e=>e.textContent?.includes('SOURCE-ROW-CANARY')||e.textContent?.includes('SOURCE-QUALIFICATION-CANARY')));
  assert.ok(created.some(e=>e.className==='source-access'&&e.textContent.includes('birch: Holdings access denied')));
  assert.ok(!created.some(e=>e.className==='evidence-card'));
  const details=created.find(e=>e.className==='source-disclosure');assert.equal(details.children.length,1);assert.equal(details.open,false);assert.equal(answer.children.at(-1),details);
  details.open=true;details.listeners.toggle();assert.ok(created.some(e=>e.textContent?.includes('SOURCE-ROW-CANARY')));assert.ok(created.some(e=>e.textContent?.includes('SOURCE-QUALIFICATION-CANARY')));
  assert.equal(created.filter(e=>e.tag==='pre').length,0);
  const rawDetails=created.filter(e=>e.tag==='details').at(-1);rawDetails.open=true;rawDetails.listeners.toggle();assert.equal(created.filter(e=>e.tag==='pre').length,1);
 }finally{delete globalThis.document;globalThis.fetch=priorFetch;}
});

test('option inventory renders every typed row before commentary and defers provenance',async()=>{
 const elements=new Map(),created=[];
 function element(tag='div'){const e={tag,listeners:{},children:[],value:'',open:false,
 append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},
 insertBefore(item,before){this.children.splice(this.children.indexOf(before),0,item);},
 querySelector(selector){return this.children.find(c=>selector==='.'+c.className);},
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};Object.defineProperty(e,'innerHTML',{get(){return this._html??'';},set(value){this._html=value;this.textContent=value.replace(/<[^>]*>/g,'');}});created.push(e);return e;}
 const priorFetch=globalThis.fetch;
 globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element};
 const raw=JSON.stringify({evidence:{optionInventory:{right:'PUT',side:'SHORT',counts:{shortPutContracts:5,selectedInventoryComplete:true},accounts:[{nickname:'fixture',readComplete:true,options:Array.from({length:5},(_,n)=>({underlyingSymbol:'ROW'+n,right:'PUT',side:'SHORT',quantity:'1',source:{artifactId:'PROVENANCE-CANARY',sourceRows:[n+1]}}))}]}}});
 globalThis.fetch=async(_path,opts)=>new Response(JSON.stringify(opts?{text:'Five reported short puts; CSP status unknown.',tools:[{name:'inspect_account_holdings',result:JSON.stringify({type:'text',text:raw})}]}:{csrf:'fixture',profile:'Synthetic retained evidence',tools:[]}));
 try{
  await import('../ui/app.js?option-inventory');elements.get('message').value='Count options';await elements.get('composer').listeners.submit({preventDefault(){}});
  assert.equal(created.find(e=>e.tag==='tbody').children.length,5);assert.ok(created.some(e=>e.textContent==='ROW4'));
  assert.ok(!created.some(e=>e.textContent?.includes('PROVENANCE-CANARY')));assert.equal(created.filter(e=>e.tag==='pre').length,0);
  const details=created.find(e=>e.tag==='details');details.open=true;details.listeners.toggle();assert.ok(created.some(e=>e.textContent?.includes('PROVENANCE-CANARY')));
 }finally{delete globalThis.document;globalThis.fetch=priorFetch;}
});

test('closed trades show outcomes and totals; matching, fees and analysis require accordion disclosure',async()=>{
 const elements=new Map(),created=[];
 function element(tag='div'){const e={tag,listeners:{},children:[],value:'',open:false,
 append(...items){for(const item of items){item.parent=this;this.children.push(item);}},replaceChildren(...items){this.children=[];this.append(...items);},
 insertBefore(item,before){item.parent=this;this.children.splice(this.children.indexOf(before),0,item);},
 querySelector(selector){return this.children.find(c=>selector==='.'+c.className);},
 scrollIntoView(){},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};Object.defineProperty(e,'innerHTML',{get(){return this._html??'';},set(value){this._html=value;this.textContent=value.replace(/<[^>]*>/g,'');}});created.push(e);return e;}
 const priorFetch=globalThis.fetch;
 globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,createTextNode:text=>({textContent:text})};
 const pnl={status:'QUALIFIED_ESTIMATED_FEES',value:'7.25',currency:'USD',outcome:'WIN'};
 const raw=JSON.stringify({account:{nickname:'fixture'},evidence:{closedTrades:{view:'closed-trades',period:{from:'2026-10-01',through:'2026-10-29',timeZone:'America/Denver'},metric:'MATCHING-CANARY',qualification:'FEE-QUALIFICATION-CANARY',totals:{netPnl:pnl,winners:1,losers:0},trades:[{label:'ABC',closingExecutedAt:'2026-10-29T13:30:04Z',netPnl:pnl,openingTransactions:['PRIVATE-SOURCE-CANARY'],closingTransactions:[],qualifications:['DETAIL-CANARY']}]}}});
 let responseText='Analysis qualification.',toolRaw=raw;
 globalThis.fetch=async(_path,opts)=>new Response(JSON.stringify(opts?{text:responseText,tools:[{name:'inspect_account_transactions',result:JSON.stringify({type:'text',text:toolRaw})}]}:{csrf:'fixture',profile:'Synthetic retained evidence',tools:[]}));
 try{
  await import('../ui/app.js?closed-report');elements.get('message').value='Show closed trades';await elements.get('composer').listeners.submit({preventDefault(){}});
  const card=created.find(e=>e.className==='closed-trade-card');assert.ok(card);
  const totals=created.find(e=>e.className==='trade-totals');assert.deepEqual(totals.children.map(e=>e.textContent),['Net P/L total','+$7.25','Winners','1','Losers','0']);
  assert.ok(created.some(e=>e.textContent?.includes('Estimated net P/L')));
  assert.ok(!created.some(e=>e.textContent==='PRIVATE-SOURCE-CANARY'||e.textContent==='FEE-QUALIFICATION-CANARY'));
  const detail=created.find(e=>e.tag==='details'&&e.children[0].textContent==='Trade details and evidence');assert.equal(detail.open,false);assert.equal(detail.children.length,1);
  const analysis=created.find(e=>e.tag==='details'&&e.children[0].textContent==='Talk’s analysis');assert.equal(analysis.open,false);assert.equal(analysis.children[1].className,'text');
  detail.open=true;detail.listeners.toggle();assert.ok(created.some(e=>e.textContent==='PRIVATE-SOURCE-CANARY'));assert.ok(created.some(e=>e.textContent==='FEE-QUALIFICATION-CANARY'));
  assert.equal(created.filter(e=>e.tag==='pre').length,0);
  created.length=0;responseText='| Trade | P/L |\n|---|---|\n| | |\n| | |\n| | |\n| | |\n| | |';elements.get('message').value='Repeat report';await elements.get('composer').listeners.submit({preventDefault(){}});
  assert.ok(!created.some(e=>e.tag==='summary'&&e.textContent==='Talk’s analysis'));assert.equal(created.filter(e=>e.tag==='table').length,1);
  const empty=JSON.parse(raw);empty.evidence.closedTrades.trades=[];empty.evidence.closedTrades.totals={netPnl:{value:null},winners:null,losers:null};toolRaw=JSON.stringify(empty);responseText='P/L unavailable.';created.length=0;elements.get('message').value='Previous period';await elements.get('composer').listeners.submit({preventDefault(){}});assert.equal(created.filter(e=>e.tag==='table').length,0);
 }finally{delete globalThis.document;globalThis.fetch=priorFetch;}
});

test('generic empty lists and orphan analysis headings disappear while real code, numbers and nested findings survive',()=>{
 for(const text of ['- \n- ','### Analysis\n\n- &nbsp;\n- &#x200B;','## Analysis\n\n1. **&nbsp;**\n2. &#x2060;','### Analysis\n\n-\n  - &#160;'])assert.equal(renderMarkdown(text).trim(),'');
 for(const text of ['- `-`','- `0`','- 0','- **−$10.00**','- Parent\n  - Actual finding','### Available report'])assert.notEqual(renderMarkdown(text).trim(),'');
});


test('empty intermediate sections disappear without hiding following meaningful sections or parent headings',()=>{
 const html=renderMarkdown('## Analysis\n\n| A | B |\n|---|---|\n| | |\n\n## Result\n\n0 USD\n\n## Evidence\n\n- ** **');assert.doesNotMatch(html,/>Analysis</);assert.doesNotMatch(html,/>Evidence</);assert.match(html,/>Result</);assert.match(html,/0 USD/);
 const nested=renderMarkdown('## Position\n\n### Empty\n\n- ** **\n\n### Facts\n\n`--`');assert.match(nested,/>Position</);assert.doesNotMatch(nested,/>Empty</);assert.match(nested,/>Facts</);assert.match(nested,/<code>--<\/code>/);
});
