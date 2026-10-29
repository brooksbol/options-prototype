import {canonicalAccountId} from '../../scripts/ww-accounts.mjs';
import {readBackend,problemResult} from './backend.mjs';

/** Bounded existing Account transaction evidence; governed backend refresh; no client financial calculation. */
export async function inspectTransactions({account,symbol,from,through,limit=10,cursor,order='desc',mode='policy',view='transactions',timeZone},config) {
 if(!['policy','retained'].includes(mode)||!['transactions','execution-groups','closed-trades'].includes(view))throw new Error('Unsupported transaction selection.');
 if(view!=='transactions'&&(!from||!through||!timeZone||symbol!==undefined))throw new Error('Period views require from, through and timeZone without symbol.');
 if(!Number.isInteger(limit)||limit<1||limit>25)throw new Error('MCP transaction pages are bounded to25 rows.');
 const discovery=await readBackend('/v2/accounts',config);
 if(discovery.error)return problemResult(discovery.error);
 if(discovery.data?.requestId!==discovery.requestId||!Array.isArray(discovery.data.accounts))throw new Error('Invalid discovery.');
 const matches=discovery.data.accounts.filter(a=>a.alias===account);
 if(matches.length!==1)return {isError:true,content:[{type:'text',text:JSON.stringify({outcome:'unavailable',explanation:'Exact authorized Account nickname required.',availableAccounts:discovery.data.accounts.map(a=>({nickname:a.alias,broker:a.brokerAssociation?.broker}))})}]};
 const selected=matches[0];if(!canonicalAccountId(selected.id))throw new Error('Invalid Account.');
 const query=new URLSearchParams({mode,limit:String(limit)});
 if(view!=='transactions'){query.set('view',view);if(timeZone!==undefined)query.set('timeZone',timeZone);}else query.set('order',order);
 for(const [key,value] of Object.entries({symbol,from,through,cursor}))if(value!==undefined)query.set(key,value);
 const response=await readBackend('/v2/accounts/'+selected.id+'/transactions?'+query,{...config,timeoutMs:mode==='policy'?15000:5000});
 if(response.error)return problemResult(response.error);
 const data=response.data;
 if(data?.requestId!==response.requestId||data.accountId!==selected.id||data.queryMode!==(mode==='policy'?'POLICY':'RETAINED_ONLY')||(view!=='transactions'?data.view!==view||data.period?.from!==from||data.period?.through!==through||data.period?.timeZone!==timeZone||!Array.isArray(view==='closed-trades'?data.trades:data.groups)||(view==='closed-trades'?data.trades:data.groups).length>limit:!Array.isArray(data.transactions)||data.transactions.length>limit||data.transactions.some(r=>r.accountId!==selected.id||symbol!==undefined&&r.symbol!==symbol))||typeof data.pageComplete!=='boolean'||!data.pageComplete&&typeof data.nextCursor!=='string')throw new Error('Invalid retained transaction scope.');
 return {content:[{type:'text',text:JSON.stringify({requestId:response.requestId,...(config.syntheticFixture?{dataClassification:'SYNTHETIC_FIXTURE'}:{}),account:{nickname:selected.alias,broker:selected.brokerAssociation?.broker},evidence:{[view==='closed-trades'?'closedTrades':view==='execution-groups'?'executions':'transactions']:data}})}]};
}
