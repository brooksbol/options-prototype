import {canonicalAccountId} from '../../scripts/ww-accounts.mjs';
import {readBackend,problemResult} from './backend.mjs';

/** Bounded existing Account transaction evidence; no brokerage refresh or premium calculation. */
export async function inspectTransactions({account,symbol,from,through,limit=25,cursor},config) {
 const discovery=await readBackend('/v2/accounts',config);
 if(discovery.error)return problemResult(discovery.error);
 if(discovery.data?.requestId!==discovery.requestId||!Array.isArray(discovery.data.accounts))throw new Error('Invalid discovery.');
 const matches=discovery.data.accounts.filter(a=>a.alias===account);
 if(matches.length!==1)return {isError:true,content:[{type:'text',text:JSON.stringify({outcome:'unavailable',explanation:'Exact authorized Account nickname required.',availableAccounts:discovery.data.accounts.map(a=>({nickname:a.alias,broker:a.brokerAssociation?.broker}))})}]};
 const selected=matches[0];if(!canonicalAccountId(selected.id))throw new Error('Invalid Account.');
 const query=new URLSearchParams({mode:'retained',limit:String(limit)});
 for(const [key,value] of Object.entries({symbol,from,through,cursor}))if(value!==undefined)query.set(key,value);
 const response=await readBackend('/v2/accounts/'+selected.id+'/transactions?'+query,config);
 if(response.error)return problemResult(response.error);
 const data=response.data;
 if(data?.requestId!==response.requestId||data.accountId!==selected.id||data.queryMode!=='RETAINED_ONLY'||!Array.isArray(data.transactions)||data.transactions.length>limit||
    data.transactions.some(r=>r.accountId!==selected.id||symbol!==undefined&&r.symbol!==symbol)||typeof data.pageComplete!=='boolean'||!data.pageComplete&&typeof data.nextCursor!=='string')throw new Error('Invalid retained transaction scope.');
 return {content:[{type:'text',text:JSON.stringify({requestId:response.requestId,...(config.syntheticFixture?{dataClassification:'SYNTHETIC_FIXTURE'}:{}),account:{nickname:selected.alias,broker:selected.brokerAssociation?.broker},evidence:{transactions:data}})}]};
}
