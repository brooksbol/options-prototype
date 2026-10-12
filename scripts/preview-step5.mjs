#!/usr/bin/env node
// Engineering harness: fixed candidate, test-only backend, fake brokerage and disposable database.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,chmod,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dir=await mkdtemp(join(tmpdir(),'ww-step5-preview-'));
await chmod(dir,0o700);
const env={...process.env};
for(const key of Object.keys(env))if(key.startsWith('TASTYTRADE_')||key.startsWith('WW_'))delete env[key];
const ready=join(dir,'ready.json'),logs=join(dir,'backend.log');
let output='';
const backend=spawn('./gradlew',['--no-daemon','step5Preview',`-PpreviewReady=${ready}`,'--console=plain'],{cwd:join(root,'evidence-service-java'),env,detached:true,stdio:['ignore','pipe','pipe']});
backend.stdout.on('data',b=>{output+=b;});backend.stderr.on('data',b=>{output+=b;});
let exited=false;backend.once('exit',()=>{exited=true;});
try {
  console.log('Starting isolated Step 5 fixture preview. No live brokerage or operational database access.');
  let config;
  for(let i=0;i<180;i++) {
    try {config=JSON.parse(await readFile(ready,'utf8'));break;}catch{}
    if(exited)throw new Error('Preview backend failed to start');
    if(i&&i%30===0)console.log('Still preparing the isolated backend…');
    await delay(500);
  }
  if(!config||!/^http:\/\/127\.0\.0\.1:\d+$/.test(config.base))throw new Error('Preview readiness failed');
  await chmod(ready,0o600);
  const bin=join(dir,'bin');await mkdir(bin);
  // Product command invocations are pinned to this candidate and this isolated target.
  const runner=join(dir,'runner.mjs');
  // The CLI's executable guard needs its own module pathname in argv[1].
  await writeFile(runner,`import {readFile} from 'node:fs/promises';\nimport {spawn} from 'node:child_process';\nconst c=JSON.parse(await readFile(${JSON.stringify(ready)},'utf8'));\nconst child=spawn(process.execPath,[${JSON.stringify(join(root,'scripts/wheelwright.mjs'))},...process.argv.slice(2)],{env:{...process.env,WW_BASE_URL:c.base,WW_API_TOKEN:c.token},stdio:'inherit'});\nchild.on('exit',code=>{process.exitCode=code??1;});\n`);
  const shellQuote=s=>"'"+s.replaceAll("'","'\\''")+"'";
  await writeFile(join(bin,'ww'),`#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(runner)} "$@"\n`,{mode:0o700});
  console.log(`Candidate: ${root}\nSIMULATED XLE inventory fixture; timestamps are preview acquisition times, not October 11 observation proof.\nUse ordinary commands:\n  ww ls accounts\n  ww sync account tt1\n  ww show positions --account tt1\n  ww show positions --account tt1 --verbose\nType exit to stop the preview. Installed ww and tt live are unchanged.`);
  const shell=spawn('/bin/zsh',['-f'],{env:{...env,PATH:bin+':'+env.PATH,PS1:'step5-preview% '},stdio:'inherit'});
  await new Promise(r=>shell.once('exit',r));
} catch(error) {
  await writeFile(logs,output,{mode:0o600});
  console.error(error.message);process.exitCode=1;
} finally {
  try{process.kill(-backend.pid,'SIGTERM');}catch{}
  await rm(dir,{recursive:true,force:true});
}
