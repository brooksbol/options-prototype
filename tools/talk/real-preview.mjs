// Principal-authorized real retained reads in the SAME SDK Talk. No provider credentials/beans.
import './privacy.mjs';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { startPreview, existingKey, existingBackendToken } from './server.mjs';

const parent=join(homedir(),'.local/share/wheelwright');await mkdir(parent,{recursive:true,mode:0o700});
const common=execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{encoding:'utf8'}).trim();
const operationalRoot=dirname(common);
const directory=await mkdtemp(join(parent,'talk-real-reads-20261027-'));
const ready=join(directory,'backend-ready.json');
const key=existingKey(),token=existingBackendToken();
if(!key||!token)throw new Error('Existing approved model/backend access is unavailable.');
const backend=spawn('./gradlew',['--no-daemon','talkRetainedPreview',`-PpreviewDirectory=${directory}`,
 `-PaccountSource=${join(parent,'wwt-trades-ops-20261023/retained-preview.sqlite3')}`,

 `-PpreviewReady=${ready}`],{
 cwd:fileURLToPath(new URL('../../evidence-service-java/',import.meta.url)),
 env:{PATH:process.env.PATH,HOME:homedir(),WW_API_TOKEN:token,WW_TALK_DISCLOSURE_PROFILE:'AUTHORIZED_REAL_RETAINED_READS'},
 stdio:['ignore','pipe','pipe'],detached:true});
let logs='';for(const stream of [backend.stdout,backend.stderr])stream.on('data',chunk=>{logs=(logs+chunk).slice(-40000);});
let app;
async function close(){await app?.close();try{process.kill(-backend.pid,'SIGTERM');}catch{}await writeFile(join(directory,'backend-diagnostics.log'),logs,{mode:0o600});}
try {
 let config;
 for(let n=0;n<1800;n++) {
  if(backend.exitCode!==null)throw new Error('Retained backend startup failed.');
  try{config=JSON.parse(await readFile(ready,'utf8'));break;}catch(error){if(error.code!=='ENOENT'&&!(error instanceof SyntaxError))throw error;}
  await delay(100);
 }
 if(!config||config.providerBeans!==false||config.profile!=='AUTHORIZED_REAL_RETAINED_READS')throw new Error('Retained profile unavailable.');
 app=await startPreview({port:8814,apiKey:key,authorizedRetainedBackend:config,authorizedMarketBackend:{base:'http://127.0.0.1:3100',token}});
 await writeFile(join(directory,'preview.json'),JSON.stringify({url:app.url,backend:config.base,profile:config.profile,sourceAccountReads:'read-only original',portfolio:'isolated retained snapshot',providerBeans:false}),{mode:0o600});
 console.log(`Wheelwright Talk — ${app.url} — authorized real retained evidence; no acquisition or trades`);
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await close();process.exit(0);});
} catch {await close();console.error('Real retained preview unavailable; existing services and grants unchanged.');process.exitCode=1;}
