import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('TT1 offline record accountability, archive and CLI specimens',()=>{
 const result=spawnSync('python3',['-B',fileURLToPath(new URL('./tt1-experimental-record-test.py',import.meta.url))],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
