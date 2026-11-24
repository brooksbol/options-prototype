// Read-only bounded PUT extension of the retained PR47 warm Greek worker.
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {readHeldGreeks} from '../../scripts/tastytrade-greeks.mjs';
const {credentials} = await import(pathToFileURL(process.argv[2]).href);
const values=credentials(process.env);
let oauth,expires=0,token,tokenUntil=0,requests;
const cache=new Map();
async function api(path) {
  if (!/^\/option-chains\/[A-Z]+(?:\.B|%2FB)?\/nested$/.test(path) && path!='/api-quote-tokens') throw Error('Unexpected read route');
  if(Date.now()>=expires) {
    requests.oauth++;
    const response=await fetch('https://api.tastyworks.com/oauth/token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'refresh_token',client_id:values.TASTYTRADE_CLIENT_ID,client_secret:values.TASTYTRADE_CLIENT_SECRET,refresh_token:values.TASTYTRADE_REFRESH_TOKEN})});
    if(!response.ok)throw Error('OAuth unavailable');
    const auth=await response.json();oauth=auth.access_token;expires=Date.now()+Math.min(600,Number(auth.expires_in??600)-30)*1000;
  }
  requests.get++;
  const response=await fetch('https://api.tastyworks.com'+path,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+oauth}});
  if(!response.ok)throw Error('Greek metadata GET unavailable');
  const text=await response.text();if(text.length>20000000)throw Error('Oversized response');return JSON.parse(text);
}
async function quoteToken(){if(Date.now()>=tokenUntil){token=await api('/api-quote-tokens');tokenUntil=Date.now()+60000;}return token;}
async function read(symbol,expiration){
  if(!/^[A-Z]+(?:\.B)?$/.test(symbol)||!['2026-11-13','2026-11-20'].includes(expiration))throw Error('Unexpected experiment scope');
  const providerSymbol=symbol==='BF.B'?'BF/B':symbol;
  if(!cache.has(providerSymbol)){
    let chain;
    try{chain=await api('/option-chains/'+encodeURIComponent(providerSymbol)+'/nested');}
    catch(error){if(symbol!=='BF.B')throw error;chain=await api('/option-chains/BFB/nested');}
    cache.set(providerSymbol,chain);
  }
  const definitions=new Map();
  for(const item of cache.get(providerSymbol).data?.items??[]){
    const allowed=symbol==='BF.B'?['BF.B','BFB','BF/B','BF B']:[symbol];
    if(item['option-chain-type']!=='Standard'||item['shares-per-contract']!==100||!allowed.includes(item['root-symbol'])||!allowed.includes(item['underlying-symbol']))continue;
    for(const exp of item.expirations??[]){
      if(exp['expiration-date']!==expiration)continue;
      for(const strike of exp.strikes??[])if(typeof strike.put==='string'&&typeof strike['put-streamer-symbol']==='string')definitions.set(strike.put,{symbol:strike.put,'streamer-symbol':strike['put-streamer-symbol'],strike:strike['strike-price']});
    }
  }
  if(!definitions.size)throw Error('No standard put definitions');
  const names=[...definitions.keys()],greeks=[];
  for(let n=0;n<names.length;n+=100){requests.dxlink++;greeks.push(...await readHeldGreeks({symbols:names.slice(n,n+100),now:new Date(),timeoutMs:6000,loadInstrument:async name=>({data:definitions.get(name)}),loadQuoteToken:quoteToken}));}
  return {symbol,providerSymbol,expiration,right:'PUT',provider:'Tastytrade DXLink',receipt_utc:new Date().toISOString(),definitions:[...definitions.values()],greeks,requests};
}
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
  requests={oauth:0,get:0,dxlink:0};
  try{const q=JSON.parse(line);console.log(JSON.stringify(await read(q.symbol,q.expiration)));}
  catch{console.log(JSON.stringify({error:'Put Greek evidence unavailable',requests}));}
}
