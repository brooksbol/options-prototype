import {canonicalAccountId} from '../../scripts/ww-accounts.mjs';
import {readBackend,problemResult,UUID,selectedAccounts} from './backend.mjs';
const holdingRef=href=>typeof href==='string'&&href.startsWith('/v2/holdings/')&&UUID.test(href.slice('/v2/holdings/'.length));
/** One backend-owned inventory view; no financial association, calculations or client-side filtering. */
export async function inspectTacticalInventory({account,underlying,cursor}={},config){
 const end=performance.now()+(config.timeoutMs??40000),budget=()=>{const timeoutMs=Math.floor(end-performance.now());if(timeoutMs<=0)throw new Error('Inventory deadline exceeded.');return {...config,timeoutMs};};
 if(cursor!==undefined)throw new Error('Inventory view is complete or unavailable; no lifecycle continuation accepted.');
 if(underlying!==undefined&&!/^[A-Z0-9^][A-Z0-9.^/-]{0,31}$/.test(underlying))throw new Error('Canonical underlying required.');
 const found=await readBackend('/v2/accounts',budget());if(found.error)return problemResult(found.error);
 if(found.data?.requestId!==found.requestId||!Array.isArray(found.data.accounts)||found.data.accounts.some(a=>!canonicalAccountId(a.id)))throw new Error('Invalid Account discovery.');
 const selected=selectedAccounts(found.data.accounts,account);
 if(account!==undefined&&selected.length!==1)return {isError:true,content:[{type:'text',text:JSON.stringify({outcome:'unavailable',explanation:'Exact authorized Account nickname required.',availableAccounts:found.data.accounts.map(a=>({nickname:a.alias,broker:a.brokerAssociation?.broker}))})}]};
 const query=new URLSearchParams({view:'inventory'});if(account!==undefined)query.set('accountId',selected[0].id);if(underlying!==undefined)query.set('underlying',underlying);
 const result=await readBackend('/v2/positions?'+query,budget());if(result.error)return problemResult(result.error);
 const d=result.data,expected=new Map(selected.map(a=>['/v2/accounts/'+a.id,a]));
 if(d?.requestId!==result.requestId||d.representation!=='TACTICAL_POSITION_INVENTORY'||d.currentCustody!=='NOT_ESTABLISHED'||d.underlying!==(underlying??null)||!Array.isArray(d.accounts)||d.accounts.length!==expected.size||new Set(d.accounts.map(a=>a.account?.href)).size!==expected.size)throw new Error('Invalid tactical inventory scope.');
 for(const a of d.accounts){const known=expected.get(a.account?.href);if(!known||a.nickname!==known.alias||a.broker!==known.brokerAssociation?.broker||!['READ','FORBIDDEN','NO_RETAINED_CUSTODY','CAPACITY_UNAVAILABLE','SOURCE_CHANGED'].includes(a.status)||typeof a.readComplete!=='boolean'||!Array.isArray(a.items))throw new Error('Invalid Account inventory.');const seen=new Set();
  if(a.status!=='READ'&&a.items.length)throw new Error('Unavailable Account exposed inventory.');
  for(const item of a.items){if(item.account?.href!==a.account.href||!['TACTICAL_POSITION','TACTICAL_INVENTORY_GROUP'].includes(item.representation)||item.custody?.snapshotId!==a.source?.snapshotId||!Array.isArray(item.sourceHoldings)||!item.sourceHoldings.length)throw new Error('Invalid inventory member.');
   if(item.representation==='TACTICAL_POSITION'&&(!UUID.test(item.id??'')||item.self?.href!=='/v2/positions/'+item.id))throw new Error('Invalid canonical Position.');
   if(item.representation==='TACTICAL_INVENTORY_GROUP'&&(item.self!==undefined||item.id!==undefined||item.currentConstruction!==undefined))throw new Error('Inventory context claimed canonical identity.');
   for(const ref of item.sourceHoldings){if(!holdingRef(ref.href)||seen.has(ref.href))throw new Error('Duplicate or invalid inventory allocation.');seen.add(ref.href);}
   if(underlying!==undefined&&!(item.underlyings??[]).some(s=>s.symbol===underlying)&&!(item.constituents??[]).some(s=>s.symbol===underlying||s.identity?.symbol===underlying))throw new Error('Wrong selected underlying.');
  }
  if(a.status==='READ'){const count=x=>JSON.isRawJSON(x)?Number(x.rawJSON):x;const source=count(a.sourceHoldingCount),represented=count(a.representedHoldingCount);if(!Number.isInteger(source)||!Number.isInteger(represented)||represented!==seen.size||represented>source||underlying===undefined&&source!==represented)throw new Error('Incomplete inventory conservation.');}
 }
 const text=JSON.stringify({...d,...(config.syntheticFixture?{dataClassification:'SYNTHETIC_FIXTURE'}:{})});if(Buffer.byteLength(text)>100000)throw new Error('Complete inventory exceeds safe capacity.');
 return {content:[{type:'text',text}]};
}
