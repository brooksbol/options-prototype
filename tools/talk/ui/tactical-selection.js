// Current-turn display selection only. Canonical backend scopes, never question text or financial inference.
const accountOf=view=>{
 const e=view?.tacticalPositions?.evidence;if(!e)return null;
 const accounts=new Set((e.items??[]).map(i=>i.account?.href));
 for(const account of e.selection?.accounts??[])accounts.add(account.href);
 return accounts.size===1&&/^\/v2\/accounts\/acct_[a-f0-9]{32}$/.test([...accounts][0]??'')?[...accounts][0]:null;
};
const sameCut=(a,b)=>a.self?.href===b.self?.href&&a.currentConstruction?.href===b.currentConstruction?.href&&a.exposure?.sourceSnapshotId!=null&&a.exposure.sourceSnapshotId===b.exposure?.sourceSnapshotId;
function replaces(before,after){
 if(!accountOf(before)||accountOf(before)!==accountOf(after))return false;
 const a=before.tacticalPositions.evidence,b=after.tacticalPositions.evidence,sa=a.selection,sb=b.selection;
 if(sa&&sb){
  if(sa.state!==sb.state||sa.exposureStatus!==sb.exposureStatus)return false;
  if(sa.underlying&&sb.underlying&&sa.underlying!==sb.underlying)return false;
  // A complete, explicitly narrowed empty selection is still a result, not a request to restore broad rows.
  if(!b.items.length&&sb.underlying&&!sa.underlying&&b.next==null)return true;
 }
 if(!a.items.length||!b.items.length)return false;
 const subset=(xs,ys)=>xs.every(x=>ys.some(y=>sameCut(x,y)));
 // Exact returned rows may narrow a previously retrieved page. The original stays inspectable.
 if(subset(b.items,a.items))return true;
 // A later compatible broader selection replaces an earlier narrow view, not earlier conversation turns.
 return !!sa&&!!sb&&!sb.underlying&&b.next==null&&subset(a.items,b.items);
}
export function visibleTacticalResults(views){
 const visible=new Set();for(let i=0;i<views.length;i++)if(views[i]?.tacticalPositions||views[i]?.tacticalInventory)visible.add(i);
 for(let later=0;later<views.length;later++)if(views[later]?.tacticalPositions||views[later]?.tacticalInventory)for(let earlier=0;earlier<later;earlier++)if((views[earlier]?.tacticalPositions||views[earlier]?.tacticalInventory)&&(views[earlier]?.tacticalPositions&&views[later]?.tacticalPositions?replaces(views[earlier],views[later]):replacesInventory(views[earlier],views[later])))visible.delete(earlier);
 return visible;
}

function inventoryScope(view){
 if(view.tacticalInventory){const v=view.tacticalInventory,accounts=v.accounts??[];return {underlying:v.underlying,complete:accounts.every(a=>a.readComplete&&a.status==='READ'),accounts:new Map(accounts.filter(a=>a.source?.snapshotId).map(a=>[a.account.href,a.source.snapshotId])),items:accounts.flatMap(a=>(a.items??[]).map(item=>({item,account:a.account.href,cut:a.source?.snapshotId})))};}
 const e=view.tacticalPositions?.evidence;if(!e||e.selection?.state)return null;
 const accounts=new Map();const items=(e.items??[]).map(item=>{const account=item.account?.href,cut=item.exposure?.sourceSnapshotId;accounts.set(account,cut);return{item,account,cut};});return {underlying:e.selection?.underlying,complete:e.next==null,accounts,items};
}
function sameUnit(a,b){
 if(!a.cut||a.cut!==b.cut||a.account!==b.account)return false;
 if(a.item.self?.href||b.item.self?.href)return a.item.self?.href===b.item.self?.href&&a.item.currentConstruction?.href===b.item.currentConstruction?.href;
 const refs=item=>(item.sourceHoldings??[]).map(r=>r.href).sort().join('|');return !!refs(a.item)&&refs(a.item)===refs(b.item);
}
function replacesInventory(before,after){
 const a=inventoryScope(before),b=inventoryScope(after);if(!a||!b||a.underlying&&b.underlying&&a.underlying!==b.underlying)return false;
 const sameAccounts=[...b.accounts].every(([account,cut])=>!!cut&&a.accounts.get(account)===cut);
 if(!b.items.length)return !!b.underlying&&b.complete&&sameAccounts&&b.accounts.size>0;
 if(!a.items.length)return false;const subset=(xs,ys)=>xs.every(x=>ys.some(y=>sameUnit(x,y)));
 if(sameAccounts&&subset(b.items,a.items))return true;
 return b.complete&&!b.underlying&&subset(a.items,b.items);
}
