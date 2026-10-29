import{canonicalAccountId}from'../../scripts/ww-accounts.mjs';
import{UUID,readBackend,problemResult}from'./backend.mjs';
// Exact normalized instruction only; no Account collection, provider original or financial interpretation.
export async function inspectOrderDetails({account,orderId},config){
 if(!UUID.test(orderId??''))throw new Error('Canonical Order ID required.');const end=performance.now()+(config.timeoutMs??40000);
 const discovery=await readBackend('/v2/accounts',config);if(discovery.error)return problemResult(discovery.error);
 if(discovery.data?.requestId!==discovery.requestId||!Array.isArray(discovery.data.accounts))throw new Error('Invalid Account discovery.');
 const matches=discovery.data.accounts.filter(a=>a.alias===account);if(matches.length!==1||!canonicalAccountId(matches[0].id))return{isError:true,content:[{type:'text',text:'Exact authorized Account nickname required.'}]};
 const selected=matches[0],path='/v2/orders/'+orderId,remaining=Math.floor(end-performance.now());if(remaining<=0)throw new Error('Order detail deadline exceeded.');
 const result=await readBackend(path,{...config,timeoutMs:Math.min(config.timeoutMs??remaining,remaining)});if(result.error)return problemResult(result.error,account);
 if(result.data?.self?.href!==path||result.data.account?.href!=='/v2/accounts/'+selected.id)throw new Error('Invalid Order detail scope.');
 return{content:[{type:'text',text:JSON.stringify({requestId:result.requestId,account:{nickname:selected.alias},evidence:result.data,qualification:'Exact backend-normalized brokerage instruction, reported fills and qualified native bracket links. A historical trigger/child link is not proof that current holdings originate in that fill, uninterrupted custody, cash security, governance or an execution guarantee. Follow only returned same-Account canonical references for deliberate source inspection.'})}]};
}
