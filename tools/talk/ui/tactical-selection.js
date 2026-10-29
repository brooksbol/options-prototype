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
 const visible=new Set();for(let i=0;i<views.length;i++)if(views[i]?.tacticalPositions)visible.add(i);
 for(let later=0;later<views.length;later++)if(views[later]?.tacticalPositions)for(let earlier=0;earlier<later;earlier++)if(views[earlier]?.tacticalPositions&&replaces(views[earlier],views[later]))visible.delete(earlier);
 return visible;
}
