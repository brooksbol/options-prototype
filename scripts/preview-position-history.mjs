#!/usr/bin/env node
// Engineering launch adapter. Product commands use this candidate's standard private settings file.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,chmod,rm,mkdir,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dir=await mkdtemp(join(tmpdir(),'ww-position-history-preview-'));await chmod(dir,0o700);
const ready=join(dir,'ready.json'),settings=join(root,'.ww.env');
const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('WW_')||key.startsWith('TASTYTRADE_'))delete env[key];
let output='',createdSettings=false;
const backend=spawn('./gradlew',['--no-daemon','positionHistoryPreview',`-PpreviewReady=${ready}`,'--console=plain'],{cwd:join(root,'evidence-service-java'),env,detached:true,stdio:['ignore','pipe','pipe']});
backend.stdout.on('data',b=>{output+=b;});backend.stderr.on('data',b=>{output+=b;});
let exited=false;backend.once('exit',()=>{exited=true;});
try {
 console.log(`Preparing isolated candidate ${root}. Synthetic retained inventory only; operational ww, services and databases are unchanged.`);
 let config;
 for(let i=0;i<180;i++) {try{config=JSON.parse(await readFile(ready,'utf8'));break;}catch{}if(exited)throw Error('Preview backend failed');if(i&&i%60===0)console.log('Still preparing isolated preview…');await delay(500);}
 if(!config||config.fixture!=='synthetic-history-v1'||!/^http:\/\/127\.0\.0\.1:\d+$/.test(config.base))throw Error('Candidate readiness failed');
 const check=await fetch(config.base+'/v2/positions?view=observations&accountId='+config.accountId,{headers:{Authorization:'Bearer '+config.token}});
 const catalog=await check.json();if(check.status!==200||catalog.observations?.length!==2||catalog.observations.some(s=>s.accountId!==config.accountId))throw Error('Candidate identity/fixture check failed');
 const handle=await open(settings,'wx',0o600);createdSettings=true;await handle.writeFile(`WW_BASE_URL=${config.base}\nWW_API_TOKEN=${config.token}\n`);await handle.close();
 const bin=join(dir,'bin');await mkdir(bin);const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
 await writeFile(join(bin,'ww'),`#!/bin/sh\nexec ${quote(join(root,'scripts/ww'))} "$@"\n`,{mode:0o700});
 console.log('Verified synthetic-history-v1; no provider beans. Ordinary ww commands are configured in this isolated session.\n  ww ls position-observations --account pts\n  ww show positions --account pts\nType exit to stop. This preview is not operational acceptance.');
 const demo=process.argv.includes('--demo');
 const child=spawn(demo?'/bin/bash':'/bin/zsh',demo?[join(root,'scripts/historical-position-demo.sh')]:['-f'],{env:{...env,PATH:bin+':'+env.PATH,PS1:'history-preview% '},stdio:'inherit'});
 const code=await new Promise(resolve=>child.once('exit',code=>resolve(code)));process.exitCode=code??1;
} catch(error) {await writeFile(join(dir,'backend.log'),output,{mode:0o600});console.error(error.message);process.exitCode=1;}
finally {await writeFile(join(dir,'backend.log'),output,{mode:0o600});try{process.kill(-backend.pid,'SIGTERM');}catch{}if(createdSettings)await rm(settings);console.log(`Engineering preview logs: ${dir}`);}
