// Delivery control, never a runtime domain authority. Judgment about scope/reuse remains independent review.
import {execFileSync,spawn} from 'node:child_process';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const args=process.argv.slice(2),mode=args.shift();if(!['run','verify'].includes(mode)||args.length!==2||args[0]!=='--receipt')throw Error('Use run|verify --receipt FILE; filtering/skipping is not supported.');
const receipt=resolve(args[1]);const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');
const clean=()=>{if(git('status','--porcelain','--untracked-files=normal'))throw Error('Fitness requires a clean candidate, including its tests and profile.');};
async function digest(){const paths=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).sort();const hash=createHash('sha256');for(const p of paths){hash.update(p+'\0');hash.update(await readFile(join(root,p)));}return hash.digest('hex');}
clean();const source=await digest();
if(mode==='verify'){const r=JSON.parse(await readFile(receipt));if(r.candidate!==sha||r.sourceDigest!==source||r.status!=='PASS'||r.negativeDisconnection!=='REJECTED'||r.omittedProof!=='REJECTED'||r.balanceDisconnection!=='REJECTED'||r.nativeDisconnection!=='REJECTED'||r.omittedSuite!=='REJECTED'||r.hostDisconnection!=='REJECTED'||r.documentationFidelity!=='PASS'||r.documentationDisconnection!=='REJECTED'||r.documentationBoundaryDisconnection!=='REJECTED'||r.unacceptedPublication!=='REJECTED'||r.deterministicReuse!=='PASS'||r.reuseOmission!=='REJECTED')throw Error('Missing, stale, incomplete or incompatible fitness evidence.');console.log('Receipt matches candidate; acceptance requires re-executing its proof.');}
const profile=JSON.parse(await readFile(join(root,'docs/implementation/pl-mcp-01-architectural-recovery-2026-11-02.json')));
if(!profile.suite||!Array.isArray(profile.methods)||profile.methods.length<5||!profile.scope?.length)throw Error('Nonempty feature-appropriate proof required.');
for(const path of git('diff','--name-only',profile.base,sha).split('\n').filter(p=>p&&!/^docs\/.*\.md$/.test(p)&&p!=='options-prototype/src/roadmap/roadmap-projection.json')){if(!profile.scope.includes(path))throw Error('Changed feature path lacks an architectural proof assignment: '+path);}
const output=await mkdtemp(join(tmpdir(),'ww-architectural-fitness-'));
async function command(exe,argv,cwd=root,environment={}){return await new Promise((resolvePromise,reject)=>{const child=spawn(exe,argv,{cwd,env:{...process.env,...environment},stdio:['ignore','pipe','pipe']});let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log=(log+b).slice(-30000);});child.on('error',reject);child.on('exit',code=>code===0?resolvePromise(log):reject(Error(exe+' failed: '+log.slice(-4500))));});}
const started=Date.now();
// Documentation is a consumer of the same authoritative API. Preview proof never grants publication.
if(!Array.isArray(profile.documentationMethods)||profile.documentationMethods.length<6)throw Error('Required documentation boundary proof omitted');
const docs=join(output,'documentation');
await command('python3',['scripts/v2-oas-conformance-test.py']);
await command('python3',['tools/api-docs/build.py',docs]);
await command('python3',['-m','unittest','-v',...profile.documentationMethods],join(root,'tools/api-docs'),{WW_DOCS_TEST_OUTPUT:docs});
await command('python3',['tools/api-docs/validate.py',docs]);
await command(process.execPath,['tools/api-docs/human-specimen.mjs',docs]);
if(!profile.reuseSuite||!Array.isArray(profile.reuseMethods)||profile.reuseMethods.length<6||new Set(profile.reuseMethods).size!==profile.reuseMethods.length||!profile.reuseMethods.every(m=>typeof profile.reuseCaseNames?.[m]==='string'))throw Error('Required deterministic reuse proof identity omitted');
const reuseFilters=profile.reuseMethods.flatMap(m=>['--tests',profile.reuseSuite+'.'+m]);
// Parse actual JUnit XML, including escaped @DisplayName identities; do not infer execution from source presence.
function requireCases(path,suite,names,exact=false){
 const report=JSON.parse(execFileSync('python3',['-c',"import json,sys,xml.etree.ElementTree as E;r=E.parse(sys.argv[1]).getroot();print(json.dumps({'suite':r.get('name'),'count':int(r.get('tests','0')),'bad':sum(int(r.get(k,'0')) for k in ['failures','errors','skipped']),'cases':[{'name':t.get('name'),'class':t.get('classname'),'bad':any(t.find(k) is not None for k in ['failure','error','skipped'])} for t in r.findall('testcase')]}))",path],{encoding:'utf8'}));
 if(report.suite!==suite||report.bad||report.cases.some(t=>t.bad)||report.count!==report.cases.length||!names.every(n=>report.cases.some(t=>t.class===suite&&t.name===n))||exact&&report.count!==names.length)throw Error('Required behavioral proof omitted, skipped or failed: '+suite);
}
await command(process.execPath,['--test','tools/talk/test/recovery-routing.test.mjs']);
await command('./gradlew',['test','--offline','--no-daemon','--rerun-tasks','--console=plain','--tests',profile.suite,...reuseFilters],join(root,'evidence-service-java'));
requireCases(join(root,'evidence-service-java/build/test-results/test/TEST-'+profile.suite+'.xml'),profile.suite,profile.methods.map(n=>n+'()'));
requireCases(join(root,'evidence-service-java/build/test-results/test/TEST-'+profile.reuseSuite+'.xml'),profile.reuseSuite,profile.reuseMethods.map(m=>profile.reuseCaseNames[m]),true);
let backend;try{
 const ready=join(output,'ready.json');backend=spawn('./gradlew',['architecturalFitnessBackend','--offline','--no-daemon','--console=plain','-PfitnessReady='+ready],{cwd:join(root,'evidence-service-java'),detached:true,stdio:['ignore','ignore','ignore']});
 for(let n=0;;n++){try{await readFile(ready);break;}catch{}if(n>600||backend.exitCode!==null)throw Error('Composed backend unavailable');await new Promise(r=>setTimeout(r,100));}
 const consumer=join(output,'consumer.json');await command(process.execPath,['tools/talk/test/architectural-fitness.mjs',ready,consumer]);const results=JSON.parse(await readFile(consumer));for(const key of ['normalHost','globalEgressGuard','sdk','mcp','rawProvider','marketReplacement','custodyUnchanged','balanceAcquisition','nativeMarker','nativeBalance','narrationCollapsed','normalCurrency'])if(results[key]!==true)throw Error('Missing consumer proof: '+key);
}finally{if(backend)try{process.kill(-backend.pid,'SIGTERM');}catch{}}
// Mutation control: same oracle and source, with the actual production connection removed.
const broken=await mkdtemp(join(tmpdir(),'ww-disconnected-candidate-'));await command('git',['clone','--quiet','--shared','--no-hardlinks',root,broken]);
const path='evidence-service-java/src/main/java/com/wheelwright/evidence/v2/portfolio/PortfolioTacticalInventory.java';const before=await readFile(join(broken,path),'utf8');const after=before.replace('if(publicMarket!=null)publicMarket.apply(result,repo,caller,bearer,now,referenceDeadline);','/* Deliberately disconnected for negative control. */');if(after===before)throw Error('Negative connection point not found; update proof deliberately.');await writeFile(join(broken,path),after);
let rejected=false;try{await command('./gradlew',['test','--offline','--no-daemon','--console=plain','--tests',profile.suite+'.'+profile.methods[0]],join(broken,'evidence-service-java'));}catch{const x=await readFile(join(broken,'evidence-service-java/build/test-results/test/TEST-'+profile.suite+'.xml'),'utf8');rejected=x.includes('<failure')&&x.includes(profile.methods[0]);}if(!rejected)throw Error('Disconnected candidate passed the unchanged oracle.');
// Each repaired feature has its own unchanged-oracle disconnection control.
await writeFile(join(broken,path),before);
const balancePath='evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountBalanceObservations.java';const balanceBefore=await readFile(join(broken,balancePath),'utf8');const balanceAfter=balanceBefore.replace('refreshed=acquisition.balance(account,caller,Math.max(0,Math.min(86400,reuseSeconds)));','refreshed=null;');if(balanceAfter===balanceBefore)throw Error('Balance disconnection seam missing');await writeFile(join(broken,balancePath),balanceAfter);
let balanceRejected=false;try{await command('./gradlew',['test','--offline','--no-daemon','--console=plain','--tests',profile.suite+'.operationalBalanceAcquiresAndReusesWithoutSecuritiesRefresh'],join(broken,'evidence-service-java'));}catch{const x=await readFile(join(broken,'evidence-service-java/build/test-results/test/TEST-'+profile.suite+'.xml'),'utf8');balanceRejected=x.includes('<failure')&&x.includes('operationalBalanceAcquiresAndReusesWithoutSecuritiesRefresh');}if(!balanceRejected)throw Error('Disconnected balance acquisition passed.');await writeFile(join(broken,balancePath),balanceBefore);
const currencyPath='tools/talk/ui/currency.js';const currencyBefore=await readFile(join(broken,currencyPath),'utf8');await writeFile(join(broken,currencyPath),currencyBefore.replace('if(scientific){','if(false&&scientific){'));
let nativeRejected=false;try{await command(process.execPath,['--test','tools/talk/test/currency.test.mjs'],broken);}catch(e){nativeRejected=String(e).includes('fail');}if(!nativeRejected)throw Error('Disconnected native numeric normalization passed.');
let suiteOmissionRejected=false;try{await command('./gradlew',['test','--offline','--no-daemon','--console=plain','--tests','com.wheelwright.evidence.v2.RequiredButOmittedArchitecturalProof'],join(broken,'evidence-service-java'));}catch(e){suiteOmissionRejected=String(e).includes('No tests found');}if(!suiteOmissionRejected)throw Error('Omitted required suite was accepted.');
// Native SDK host must also survive its real model-only egress boundary. Remove the actual capture.
await writeFile(join(broken,currencyPath),currencyBefore);
const routerPath='scripts/engineering/recovery-backend.mjs';const routerBefore=await readFile(join(broken,routerPath),'utf8');await writeFile(join(broken,routerPath),routerBefore.replace('const response=await transport(','const response=await fetch('));
for(const p of ['talk','mcp-v2-evidence','mcp-account-question','mcp-hello-world','api-docs']){await (await import('node:fs/promises')).symlink(join(root,'tools',p,'node_modules'),join(broken,'tools',p,'node_modules'));}
let hostRejected=false;try{await command(process.execPath,['--test','tools/talk/test/recovery-routing.test.mjs'],broken);}catch(e){hostRejected=String(e).includes('fail');}if(!hostRejected)throw Error('Disconnected trusted host transport passed.');
// Disconnect the actual documentation fidelity connection; unchanged consumer-negative oracle must fail.
await writeFile(join(broken,routerPath),routerBefore);
const documentationPath='tools/api-docs/validate.py';const documentationBefore=await readFile(join(broken,documentationPath),'utf8');
const documentationAfter=documentationBefore.replace('    assert_bundle_fidelity(contracts, internal)','    pass # Deliberately disconnected authoritative source-to-bundle boundary');
if(documentationAfter===documentationBefore)throw Error('Documentation disconnection seam missing');await writeFile(join(broken,documentationPath),documentationAfter);
let documentationRejected=false;try{await command('python3',['-m','unittest','test_validate.DocumentationFidelityTest.test_actual_validator_rejects_disconnected_source_to_bundle_boundary'],join(broken,'tools/api-docs'),{WW_DOCS_TEST_OUTPUT:docs});}catch(e){documentationRejected=String(e).includes('Disconnected validation accepted tampered internal security');}
if(!documentationRejected)throw Error('Disconnected documentation guard did not fail its unchanged consumer oracle');
// Omit one actual required @Test while keeping its method/profile identity. Remaining green cases are insufficient.
const reusePath='evidence-service-java/src/test/java/com/wheelwright/evidence/v2/DirectQuoteServiceTest.java';const reuseBefore=await readFile(join(broken,reusePath),'utf8');
const reuseAfter=reuseBefore.replace('    @Test\n    @DisplayName("I1 active age at threshold','    // Required @Test deliberately omitted\n    @DisplayName("I1 active age at threshold');
if(reuseAfter===reuseBefore)throw Error('Required reuse omission seam missing');await writeFile(join(broken,reusePath),reuseAfter);
await command('./gradlew',['test','--offline','--no-daemon','--console=plain',...reuseFilters],join(broken,'evidence-service-java'));
let reuseOmissionRejected=false;try{requireCases(join(broken,'evidence-service-java/build/test-results/test/TEST-'+profile.reuseSuite+'.xml'),profile.reuseSuite,profile.reuseMethods.map(m=>profile.reuseCaseNames[m]),true);}catch(e){reuseOmissionRejected=String(e).includes('Required behavioral proof omitted');}
if(!reuseOmissionRejected)throw Error('Omitted named reuse test passed with the remaining green tests');
// An omitted artifact cannot be accepted by verify, even if all unit-test commands were green.
const omitted=join(output,'omitted.json');await writeFile(omitted,JSON.stringify({candidate:sha,sourceDigest:source,status:'PASS'}));let omissionRejected=false;try{await command(process.execPath,['scripts/architectural-fitness.mjs','verify','--receipt',omitted]);}catch{omissionRejected=true;}if(!omissionRejected)throw Error('Omitted composition proof was accepted.');
clean();if(source!==await digest())throw Error('Candidate changed during verification.');
await mkdir(resolve(receipt,'..'),{recursive:true});await writeFile(receipt,JSON.stringify({status:'PASS',candidate:sha,sourceDigest:source,base:profile.base,suite:profile.suite,methods:profile.methods,negativeDisconnection:'REJECTED',omittedProof:'REJECTED',balanceDisconnection:'REJECTED',nativeDisconnection:'REJECTED',omittedSuite:'REJECTED',hostDisconnection:'REJECTED',elapsedSeconds:(Date.now()-started)/1000,operationalProviderRequests:0,externalModelRequests:0,documentationFidelity:'PASS',documentationDisconnection:'REJECTED',documentationBoundaryDisconnection:'REJECTED',unacceptedPublication:'REJECTED',deterministicReuse:'PASS',reuseOmission:'REJECTED'},null,2)+'\n');console.log('Architectural fitness PASS for '+sha+'; receipt '+receipt);
