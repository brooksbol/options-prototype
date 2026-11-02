// Principal-authorized bounded candidate. Original grants/source read-only; new balance evidence in private copy.
import {readFile,mkdtemp,writeFile,mkdir} from 'node:fs/promises';import {readFileSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';import {homedir} from 'node:os';import {join,dirname} from 'node:path';import {parseEnv} from 'node:util';
import {recoveryBackend} from './recovery-backend.mjs';
import {startPreview,existingKey,existingBackendToken} from '../../tools/talk/server.mjs';
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim(),operational=dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{encoding:'utf8'}).trim());
const parent=join(homedir(),'.local/share/wheelwright');await mkdir(parent,{recursive:true});const directory=await mkdtemp(join(parent,'architectural-recovery-'));const ready=join(directory,'backend.json');
const privateConfig={...parseEnv(readFileSync(join(operational,'.env'),'utf8')),...parseEnv(readFileSync(join(parent,'services/v2/auth.env'),'utf8'))};
const config=Object.fromEntries(Object.entries(privateConfig).map(([k,v])=>[k,v.replace(/\$\{([A-Z0-9_]+)\}/g,(_,name)=>{if(privateConfig[name]===undefined)throw Error('Unresolved private configuration');return privateConfig[name];})]));
const token=existingBackendToken();if(!token||!existingKey())throw Error('Existing authorized access unavailable');
const env={PATH:process.env.PATH,HOME:homedir(),WW_API_TOKEN:token,WW_TALK_DISCLOSURE_PROFILE:'AUTHORIZED_REAL_RETAINED_READS',WW_ARCHITECTURAL_RECOVERY:'PRINCIPAL_AUTHORIZED_ARCHITECTURAL_RECOVERY_20261102',...Object.fromEntries(Object.entries(config).filter(([k])=>k.startsWith('TASTYTRADE_')))};
const child=spawn('./gradlew',['talkRetainedPreview','--offline','--no-daemon','--console=plain','-PpreviewDirectory='+directory,'-PaccountSource='+join(operational,'data/positions-v2.sqlite3'),'-PpreviewReady='+ready],{cwd:join(root,'evidence-service-java'),env,detached:true,stdio:['ignore','pipe','pipe']});let logs='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{logs=(logs+b).slice(-30000);});let app,router;
async function close(){await app?.close();await router?.close();try{process.kill(-child.pid,'SIGTERM');}catch{}await writeFile(join(directory,'backend.log'),logs,{mode:0o600});}
try{let backend;for(let n=0;n<1200;n++){try{backend=JSON.parse(await readFile(ready));break;}catch{}if(child.exitCode!==null)throw Error('Candidate backend unavailable');await new Promise(r=>setTimeout(r,100));}if(!backend?.architecturalRecovery)throw Error('Recovery source boundary unavailable');
 await writeFile(join(directory,'candidate.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),backend:backend.base,originalAccountSource:'READ_ONLY',balanceRetention:'PRIVATE_COPY',marketOwner:3100}),{mode:0o600});
 console.log(JSON.stringify({ready:true,directory,backend:backend.base,port:process.env.WW_RECOVERY_PORT??'8787'}));
 router=await recoveryBackend({candidate:backend,operational:{base:'http://127.0.0.1:3101',token}});
 app=await startPreview({port:Number(process.env.WW_RECOVERY_PORT??8787),apiKey:existingKey(),authorizedRetainedBackend:{...backend,base:router.base},authorizedMarketBackend:{base:'http://127.0.0.1:3100',token},operatorTimeZone:'America/Denver',marketTimeZone:'America/New_York'});
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await close();process.exit(0);});
}catch(e){await close();throw e;}
