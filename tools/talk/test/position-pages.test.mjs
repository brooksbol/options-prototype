import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPositions } from '../../mcp-v2-evidence/positions.mjs';
const requestId='11111111-1111-4111-8111-111111111111';
const id='acct_'+'1'.repeat(32);
function config(next) {
  const paths=[];
  return {base:'http://127.0.0.1:1',token:'synthetic-test-secret',paths,
    async fetchImpl(url) {
      paths.push(url.pathname+url.search);
      const data=url.pathname==='/v2/accounts'?{requestId,accounts:[{id,alias:'fixture',brokerAssociation:{broker:'FIDELITY'}}]}:
        {requestId,items:[],next};
      return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','X-Request-Id':requestId}});
    }};
}
test('Position continuation is reusable, opaque, Account scoped and lifecycle qualified', async () => {
  const c=config({href:'/v2/positions?accountId='+id+'&projection=tactical&limit=5&state=OPEN&cursor=signed%2Bopaque'});
  const result=await inspectPositions({account:'fixture',state:'OPEN',cursor:'prior+opaque'},c);
  const body=JSON.parse(result.content[0].text);
  assert.equal(body.nextCursor,'signed+opaque');
  const actual=new URL(c.paths[1],c.base);
  assert.equal(actual.searchParams.get('cursor'),'prior+opaque');
  assert.equal(actual.searchParams.get('state'),'OPEN');
  assert.equal(actual.searchParams.get('limit'),'5');
  assert.equal(actual.searchParams.get('accountId'),id);
  assert.match(body.qualification,/not proof of current custody or freshness/);
});
test('Position continuation refuses an unexpected backend origin or Account', async () => {
  for(const href of ['https://example.invalid/v2/positions?accountId='+id+'&cursor=x','/v2/positions?accountId=other&cursor=x'])
    await assert.rejects(inspectPositions({account:'fixture'},config({href})),/continuation scope/);
});

test('monitoring includes explicit unknown and legacy unrecorded exposure; inactive/lifecycle selectors stay explicit',async()=>{
 for(const [args,expected]of [[{},'OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED'],[{includeInactive:true},null],[{state:'CLOSED'},null]]){
  const c=config(null);await inspectPositions({account:'fixture',...args},c);const q=new URL(c.paths[1],c.base).searchParams;
  assert.equal(q.get('exposureStatus'),expected);assert.equal(q.get('projection'),'tactical');assert.equal(q.has('include'),false);
 }
});
test('expanded detail is explicit and continuation cannot change projection or exposure selection',async()=>{
 const c=config(null);await inspectPositions({account:'fixture',projection:'expanded'},c);
 assert.equal(new URL(c.paths[1],c.base).searchParams.get('include'),'currentConstruction,holdingSummaries');
 await assert.rejects(inspectPositions({account:'fixture'},config({href:'/v2/positions?accountId='+id+'&projection=expanded&limit=5&cursor=x'})),/changed selectors/);
});

test('request-triggered monitoring allows bounded cold acquisition beyond the old five-second read budget',async()=>{
 const c=config(null);const original=c.fetchImpl;c.fetchImpl=async(url,init)=>{if(url.pathname==='/v2/positions')await import('node:timers/promises').then(({setTimeout})=>setTimeout(5500,undefined,{signal:init.signal}));return original(url,init);};
 const r=await inspectPositions({account:'fixture'},c);assert.equal(r.isError,undefined);assert.equal(c.paths.length,2);
 const short=config(null),transport=short.fetchImpl;short.timeoutMs=10;short.fetchImpl=async(url,init)=>{if(url.pathname==='/v2/positions')await import('node:timers/promises').then(({setTimeout})=>setTimeout(100,undefined,{signal:init.signal}));return transport(url,init);};await assert.rejects(inspectPositions({account:'fixture'},short),/abort/i);
});

test('underlying selector is backend scoped, retained on continuation, and empty stays narrow',async()=>{
 const c=config(null),old=c.fetchImpl;c.fetchImpl=async(url,init)=>{const r=await old(url,init);if(url.pathname==='/v2/accounts')return r;const data=await r.json();data.selection={underlying:'QQQ',accounts:[{href:'/v2/accounts/'+id}]};return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','X-Request-Id':requestId}});};
 const result=JSON.parse((await inspectPositions({account:'fixture',underlying:'QQQ'},c)).content[0].text);assert.equal(new URL(c.paths[1],c.base).searchParams.get('underlying'),'QQQ');assert.equal(result.evidence.selection.underlying,'QQQ');assert.equal(result.evidence.items.length,0);assert.match(result.qualification,/empty selection is not proof/);
 const bad=config(null);await assert.rejects(inspectPositions({account:'fixture',underlying:'qqq'},bad));assert.equal(bad.paths.length,0);
});
test('wrong-subject response or changed underlying cursor fails without client filtering or broad fallback',async()=>{
 for(const defect of ['selection','row','continuation']){const c=config(null),old=c.fetchImpl;c.fetchImpl=async(url,init)=>{const r=await old(url,init);if(url.pathname==='/v2/accounts')return r;const data=await r.json();data.selection={underlying:defect==='selection'?'SPY':'QQQ',accounts:[{href:'/v2/accounts/'+id}]};if(defect==='row')data.items=[{id:requestId,account:{href:'/v2/accounts/'+id},underlyings:[{symbol:'SPY'}]}];if(defect==='continuation')data.next={href:'/v2/positions?accountId='+id+'&projection=tactical&limit=5&exposureStatus=OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED&underlying=SPY&cursor=opaque'};return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','X-Request-Id':requestId}});};await assert.rejects(inspectPositions({account:'fixture',underlying:'QQQ'},c),/scope|underlying|selectors/);assert.equal(c.paths.length,2);}
});
