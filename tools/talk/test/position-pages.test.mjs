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
  const c=config({href:'/v2/positions?accountId='+id+'&cursor=signed%2Bopaque'});
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
