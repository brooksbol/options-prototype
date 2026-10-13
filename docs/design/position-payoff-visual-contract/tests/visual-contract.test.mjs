import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const model=JSON.parse(readFileSync(new URL('../structures.json',import.meta.url),'utf8'));
const names=['Option','Covered','Vertical','Calendar','Butterfly','Ratio Spread','Strangle','Straddle','Iron Condor','Jade Lizard','Stock'];
test('dropdown taxonomy exactly preserved, without claiming variant acceptance',()=>{
  assert.deepEqual(model.families.map(x=>x.label),names);
  assert.equal(new Set(model.families.map(x=>x.id)).size,11);
  for(const f of model.families) {
    assert.equal(f.recognitionAuthority,'BACKEND_ONLY');
    assert.ok(['REFERENCE','ACCEPTED_IC_ONLY'].includes(f.status));
    if(f.label!=='Iron Condor')assert.equal(f.status,'REFERENCE');
  }
});
test('proposed covered call and CSP slope invariants are explicit and not accepted goldens',()=>{
  for(const id of ['covered-call','cash-secured-put']){
    const v=model.proposedVariants.find(x=>x.id===id);
    assert.equal(v.status,'PROPOSED');
    assert.deepEqual(v.slopeRegions.map(x=>x.slopeSign),[1,0]);
    assert.ok(v.horizon);
  }
});
test('accepted IC reference has five correct signed regions',()=>{
  const v=model.proposedVariants.find(x=>x.id==='iron-condor');
  assert.equal(v.status,'ACCEPTED_IC_ONLY');
  assert.deepEqual(v.slopeRegions.map(x=>x.slopeSign),[0,1,0,-1,0]);
});
test('the contract disallows fabricating geometry for unsupported evidence',()=>{
  assert.match(model.unavailableRule,/Do not synthesize/);
  assert.equal(model.source.sourceStatus,'CONVERSATION_ATTACHMENT_NOT_YET_COMMITTED');
});

test('proposed covered-call/CSP terminal goldens have exactly 31 plot cells and one spot marker',()=>{
  for (const name of ['covered-call-below','covered-call-above','cash-secured-put-below','cash-secured-put-above']) {
    const s=readFileSync(new URL('../golden/'+name+'.txt',import.meta.url),'utf8');
    const rows=s.trimEnd().split('\n');
    assert.equal(rows.length,2,name);
    assert.match(rows[0],/^ACCOUNT  SYMBOL  PAYOFF/);
    const match=rows[1].match(/____╱[‾▼]+/u);
    assert.ok(match,name);
    assert.equal(Array.from(match[0]).length,31,name);
    assert.equal(Array.from(match[0]).filter(x=>x==='▼').length,1,name);
    assert.equal(Array.from(match[0]).filter(x=>x==='╱').length,1,name);
  }
});
