#!/usr/bin/env node
// Engineer-arranged isolated acceptance: ordinary CLI commands; no operator wiring.
import {mkdtemp,readFile,chmod,rm,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const directory=await mkdtemp(join(tmpdir(),'ww-option-structure-preview-'));
await chmod(directory,0o700);
const ready=join(directory,'ready.json'),log=await open(join(directory,'backend.log'),'w',0o600);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>! /^(WW_|WHEELWRIGHT_|TASTYTRADE_|SPRING_|JAVA_TOOL_OPTIONS$|JAVA_OPTS$|JDK_JAVA_OPTIONS$|GRADLE_OPTS$)/.test(key)));
const backend=spawn('./gradlew',['--offline','--no-daemon','--quiet','optionStructurePreview',`-PpreviewReady=${ready}`],{cwd:join(root,'evidence-service-java'),env,detached:true,stdio:['ignore',log.fd,log.fd]});
let status=1;
try {
 let config;
 for(let n=0;n<1200;n++) {
  if(backend.exitCode!==null)throw new Error('isolated backend failed to start');
  try {config=JSON.parse(await readFile(ready,'utf8'));break;}catch(error){if(error.code!=='ENOENT'&&!(error instanceof SyntaxError))throw error;}
  await new Promise(r=>setTimeout(r,100));
 }
 if(config?.fixture!=='synthetic-option-structure-v1'||!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(config.base))throw new Error('isolated identity unavailable');
 const args=['live',...process.argv.slice(2)];if(args.length===1)args.push('--table');
 process.stderr.write('SYNTHETIC construction specimen — real candidate v2 backend, disposable local evidence, no brokerage access.\n');
 const cli=spawn(process.execPath,[join(root,'scripts/wheelwright.mjs'),...args],{cwd:root,env:{...env,WW_BASE_URL:config.base,WW_API_TOKEN:config.token},stdio:'inherit'});
 status=await new Promise((resolve,reject)=>{cli.on('error',reject);cli.on('exit',code=>resolve(code??1));});
} catch(error) {process.stderr.write(`preview: ${error.message}; no operational backend was used\n`);}
finally {
 try {process.kill(-backend.pid,'SIGTERM');}catch{}
 await log.close();
 await rm(directory,{recursive:true,force:true});
}
process.exitCode=status;
