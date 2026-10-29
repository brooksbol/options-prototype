import {canonicalAccountId} from '../../scripts/ww-accounts.mjs';
import {readBackend,problemResult} from './backend.mjs';

/** Bounded existing Account transaction evidence; governed backend refresh; no client financial calculation. */
export async function inspectTransactions({account,symbol,from,through,limit=10,cursor,order='desc',mode='policy',view='transactions',timeZone},config) {
 if(!['policy','retained'].includes(mode)||!['transactions','execution-groups','closed-trades'].includes(view))throw new Error('Unsupported transaction selection.');
 if(view!=='transactions'&&(!from||!through||!timeZone||symbol!==undefined))return {isError:true,content:[{type:'text',text:'Period summaries require from, through and timeZone and do not accept symbol. For report drill-down, use inspect_account_transaction_details with openingTransactions and closingTransactions IDs returned in the report.'}]};
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

/** Exact normalized source records using the existing Account transaction item API. */
export async function inspectTransactionDetails({account,transactionIds},config) {
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
 if(!Array.isArray(transactionIds)||transactionIds.length<1||transactionIds.length>8||new Set(transactionIds).size!==transactionIds.length||transactionIds.some(id=>typeof id!=='string'||!uuid.test(id)))throw new Error('Provide one to eight distinct transaction IDs returned by backend evidence.');
 const discovery=await readBackend('/v2/accounts',config);if(discovery.error)return problemResult(discovery.error);
 if(discovery.data?.requestId!==discovery.requestId||!Array.isArray(discovery.data.accounts))throw new Error('Invalid discovery.');
 const matches=discovery.data.accounts.filter(a=>a.alias===account);if(matches.length!==1||!canonicalAccountId(matches[0].id))return {isError:true,content:[{type:'text',text:'Exact authorized Account nickname required.'}]};
 const selected=matches[0],records=[];
 const deadline=Date.now()+15000;
 for(const id of transactionIds){
  const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Transaction detail deadline exceeded.');
  const response=await readBackend('/v2/accounts/'+selected.id+'/transactions/'+id,{...config,timeoutMs:remaining});if(response.error)return problemResult(response.error);
  const data=response.data;if(data?.requestId!==response.requestId||data.accountId!==selected.id||data.transaction?.accountId!==selected.id||data.transaction.transactionId!==id||Object.hasOwn(data,'transactions'))throw new Error('Invalid transaction item scope.');
  records.push({requestId:data.requestId,checkedAt:data.checkedAt,freshness:data.freshness,acquisitionOutcome:data.acquisitionOutcome,transaction:data.transaction});
 }
 const body=JSON.stringify({account:{nickname:selected.alias,broker:selected.brokerAssociation?.broker},evidence:{transactionDetails:records},qualification:'Exact backend transaction evidence. Report associations are established by the backend report; these individual records do not establish a current holding association or independent P/L.'});
 if(Buffer.byteLength(body)>100000)throw new Error('Transaction details exceed safe response capacity.');
 return {content:[{type:'text',text:body}]};
}
