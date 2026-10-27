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
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};created.push(e);return e;}
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
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};created.push(e);return e;}
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
 scrollIntoView(){},remove(){},focus(){},addEventListener(n,fn){this.listeners[n]=fn;}};created.push(e);return e;}
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
