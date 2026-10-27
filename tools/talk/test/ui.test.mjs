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
    assert.match(elements.get('messages').children.at(-1).children[1].children[0].textContent, /session changed or expired/);
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
