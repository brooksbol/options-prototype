// Reuse the accepted operational v2 JAR/runtime and existing private provider configuration.
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {homedir} from 'node:os';
import {spawn,execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
const root=dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{encoding:'utf8'}).trim());
const installed=join(homedir(),'.local/share/wheelwright/services/v2');
const existing={...parseEnv(readFileSync(join(root,'.env'),'utf8')),...parseEnv(readFileSync(join(installed,'auth.env'),'utf8'))};
const expanded=Object.fromEntries(Object.entries(existing).map(([k,v])=>[k,v.replace(/\$\{([A-Z0-9_]+)\}/g,(_m,name)=>{if(existing[name]===undefined)throw new Error('Unresolved private configuration reference');return existing[name];})]));
const environment={PATH:process.env.PATH,HOME:process.env.HOME,...Object.fromEntries(Object.entries(expanded).filter(([k])=>/^(TRADIER_|TASTYTRADE_|WHEELWRIGHT_)/.test(k)))};
const args=['-jar',join(installed,'evidence-service.jar'),'--server.address=127.0.0.1','--server.port=3101',`--evidence.db.path=${join(root,'data/positions-v2.sqlite3')}`,`--universe.seed.path=${join(installed,'seed.csv')}`,'--wheelwright.history.read-through-enabled=true'];
const child=spawn('/usr/bin/java',args,{cwd:join(root,'evidence-service-java'),env:environment,stdio:'inherit'});
child.once('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
