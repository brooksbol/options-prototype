// Temporary engineering handoff only. Resource routing preserves the unchanged operational API.
import {createServer} from 'node:http';import {randomUUID} from 'node:crypto';
export async function recoveryBackend({candidate,operational}){
 for(const backend of [candidate,operational]){const u=new URL(backend.base);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.pathname!=='/'||u.search||u.hash||u.username||u.password||!backend.token)throw Error('Trusted loopback backend required');}
 if(candidate.token!==operational.token)throw Error('Same authorized caller required');
 const server=createServer(async(req,res)=>{
  const id=randomUUID();try{
   const url=new URL(req.url,'http://routing.invalid');if(url.origin!=='http://routing.invalid'||!url.pathname.startsWith('/v2/')||!['GET','POST'].includes(req.method)||req.headers.authorization!=='Bearer '+candidate.token){res.writeHead(403).end();return;}
   const useCandidate=url.pathname==='/v2/account-balance-observations'||url.pathname==='/v2/positions'&&url.searchParams.get('view')==='inventory';
   const selected=useCandidate?candidate:operational;const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10000)throw Error();parts.push(chunk);}const body=Buffer.concat(parts);
   const response=await fetch(new URL(url.pathname+url.search,selected.base),{method:req.method,redirect:'error',signal:AbortSignal.timeout(45000),headers:{Authorization:'Bearer '+selected.token,...(req.headers['content-type']?{'Content-Type':req.headers['content-type']}:{}),...(req.headers['x-request-id']?{'X-Request-Id':req.headers['x-request-id']}:{})},...(req.method==='POST'?{body}:{})});
   const chunks=[];size=0;for await(const chunk of response.body){size+=chunk.length;if(size>200000)throw Error();chunks.push(chunk);}for(const name of ['content-type','cache-control','x-request-id','x-content-sha256','content-disposition','www-authenticate']){const value=response.headers.get(name);if(value)res.setHeader(name,value);}res.writeHead(response.status).end(Buffer.concat(chunks));
  }catch{res.writeHead(503,{'Content-Type':'application/problem+json','X-Request-Id':id,'Cache-Control':'private, no-store'}).end(JSON.stringify({status:503,code:'CAPABILITY_UNAVAILABLE',title:'Capability unavailable',requestId:id,detail:'Candidate transport unavailable'}));}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {base:'http://127.0.0.1:'+server.address().port,token:candidate.token,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
