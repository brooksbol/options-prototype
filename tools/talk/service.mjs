// Installed SDK Talk. Uses the operational backend directly; never forks evidence stores.
import './privacy.mjs';
import {startPreview,existingKey,existingBackendToken} from './server.mjs';
import {createServer} from 'node:http';
const token=existingBackendToken(),apiKey=existingKey();
if(!token||!apiKey)throw new Error('Existing authorized credentials are unavailable.');
const backend=process.env.WW_BASE_URL??'http://127.0.0.1:3101';
const app=await startPreview({port:8787,apiKey,installedBackend:{base:backend,token,profile:'AUTHORIZED_REAL_RETAINED_READS'},authorizedMarketBackend:{base:'http://127.0.0.1:3100',token}});
// Existing preview bookmarks lead to the installed workspace, without another agent/session.
const redirect=createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(!['localhost:8814','127.0.0.1:8814'].includes(req.headers.host)){res.writeHead(403).end();return;}
 if(req.method==='GET'&&req.url==='/'){res.writeHead(302,{Location:'http://localhost:8787/'}).end();return;}
 res.writeHead(409,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Talk moved to http://localhost:8787/. Reload the workspace.'}));
});
redirect.listen(8814,'127.0.0.1');
console.log('Wheelwright Talk installed at http://localhost:8787/; operational Account backend, read tools only.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{redirect.closeAllConnections();redirect.close();await app.close();process.exit(0);});
