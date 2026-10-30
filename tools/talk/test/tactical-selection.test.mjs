import test from'node:test';import assert from'node:assert/strict';import{visibleTacticalResults}from'../ui/tactical-selection.js';
const account='/v2/accounts/acct_'+'1'.repeat(32),other='/v2/accounts/acct_'+'2'.repeat(32);
const item=(id,cut='one')=>({self:{href:'/v2/positions/'+id},account:{href:account},currentConstruction:{href:'/v2/constructions/'+id},exposure:{sourceSnapshotId:cut}});
const view=(items,underlying=null,extra={})=>({tacticalPositions:{evidence:{items,next:null,selection:{accounts:[{href:account}],underlying,state:null,exposureStatus:'OBSERVED'},...extra}}});
test('broad to narrow and narrow to broad select latest compatible scope within this turn',()=>{
 const broad=view([item('a'),item('b')]),narrow=view([item('a')],'QQQ');assert.deepEqual([...visibleTacticalResults([broad,narrow])],[1]);assert.deepEqual([...visibleTacticalResults([narrow,broad])],[1]);assert.deepEqual([...visibleTacticalResults([broad])],[0]);
});
test('Account, evidence cut, lifecycle predicates and independent named scopes are never collapsed',()=>{
 const broad=view([item('a')]);for(const different of [view([item('a','two')],'QQQ'),view([{...item('a'),account:{href:other}}],'QQQ',{selection:{accounts:[{href:other}],underlying:'QQQ'}}),view([item('a')],'QQQ',{selection:{accounts:[{href:account}],underlying:'QQQ',state:'CLOSED',exposureStatus:null}})])assert.deepEqual([...visibleTacticalResults([broad,different])],[0,1]);
 assert.deepEqual([...visibleTacticalResults([view([item('a')],'QQQ'),view([item('a')],'SPY')])],[0,1]);
});
test('exact detail can narrow a prior result; empty narrow scope stays empty; failures do not fabricate selection',()=>{
 const broad=view([item('a'),item('b')]);const exact=view([item('a')]);delete exact.tacticalPositions.evidence.selection;assert.deepEqual([...visibleTacticalResults([broad,exact])],[1]);assert.deepEqual([...visibleTacticalResults([broad,view([],'QQQ')])],[1]);assert.deepEqual([...visibleTacticalResults([broad,{rows:[['Problem','Read failed']]}])],[0]);
});

const inventory=(entries,underlying=null)=>({tacticalInventory:{underlying,accounts:entries.map(([account,items,cut='one'])=>({account:{href:account},status:'READ',readComplete:true,source:{snapshotId:cut},items}))}});
test('universal all-Account inventory narrows by Account or exact canonical detail and returns without erasing other turns',()=>{
 const broad=inventory([[account,[item('a'),item('b')]],[other,[{...item('c'),account:{href:other}}]]]);const selected=inventory([[account,[item('a')]]],'QQQ');assert.deepEqual([...visibleTacticalResults([broad,selected])],[1]);assert.deepEqual([...visibleTacticalResults([selected,broad])],[1]);
 const detail=view([item('a')]);delete detail.tacticalPositions.evidence.selection;assert.deepEqual([...visibleTacticalResults([broad,detail])],[1]);assert.deepEqual([...visibleTacticalResults([detail,broad])],[1]);
 assert.deepEqual([...visibleTacticalResults([inventory([[account,[item('a')]]]),inventory([[other,[{...item('c'),account:{href:other}}]]])])],[0,1]);
 assert.deepEqual([...visibleTacticalResults([broad,inventory([[account,[item('a')],'changed']],'QQQ')])],[0,1]);assert.deepEqual([...visibleTacticalResults([broad,inventory([[account,[]]],'QQQ')])],[1]);
});
