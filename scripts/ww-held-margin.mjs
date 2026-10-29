// Non-authoritative export projection of broker-defined margin groups. No I/O,
// margin model, pro-rata allocation, order preview or source repair lives here.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function decimal(value){
 if(typeof value!=='string'&&!finite(value))return null;
 const s=String(value),m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
 if(!m||s.length>128||!Number.isFinite(Number(s)))return null;
 return {n:BigInt(m[1]+m[2]+(m[3]??'')),scale:(m[3]??'').length};
}
const plus=(a,b)=>{const scale=Math.max(a.scale,b.scale);return {n:a.n*10n**BigInt(scale-a.scale)+b.n*10n**BigInt(scale-b.scale),scale};};
const neg=a=>({n:-a.n,scale:a.scale});
const equal=(a,b)=>a!==null&&b!==null&&plus(a,neg(b)).n===0n;
const toNumber=d=>d===null?null:Number(d.n)/10**d.scale;
function metric(node,name,currency){
 const d=decimal(node?.[name]),effect=node?.[name+'-effect']??null;
 const valid=d!==null&&d.n>=0n&&(['Debit','Credit'].includes(effect)||(effect==='None'&&d.n===0n));
 return {amount:valid?toNumber(d):null,effect,reportedValue:node?.[name]??null,status:valid?'BROKER_REPORTED':'UNKNOWN',unit:'MONEY',currency};
}
const key=(symbol,type)=>JSON.stringify([symbol,type]);
function entries(rows,{held=false}={}){
 const out=new Map();let valid=Array.isArray(rows);
 for(const row of Array.isArray(rows)?rows:[]){
  const symbol=held?row?.symbol:row?.['instrument-symbol'],type=row?.['instrument-type'];let qty=decimal(row?.quantity);
  if(!symbol||typeof symbol!=='string'||!type||typeof type!=='string'||qty===null){valid=false;continue;}
  if(held){if(!['Long','Short'].includes(row['quantity-direction'])||qty.n<0n){valid=false;continue;}if(row['quantity-direction']==='Short')qty=neg(qty);}
  const k=key(symbol,type);if(out.has(k)){valid=false;continue;}out.set(k,qty);
 }
 return {out,valid};
}
const same=(a,b)=>a.valid&&b.valid&&a.out.size===b.out.size&&[...a.out].every(([k,v])=>equal(v,b.out.get(k)??null));
export function heldMarginEvidence(broker){
 const read=broker?.reads?.find(r=>r.path==='/margin/accounts/tt1/requirements');
 const holdingsRead=broker?.reads?.find(r=>r.path==='/accounts/tt1/positions');
 const balanceRead=broker?.reads?.find(r=>r.path==='/accounts/tt1/balances');
 const balances=balanceRead?.body?.data,currency=typeof balances?.currency==='string'?balances.currency:null;
 const result={schema:'tt1-held-margin/v1',status:'UNAVAILABLE',source:null,riskGroups:[],positionBindings:[],qualifications:[
  'Broker-defined risk groups, not universal trade/Position identity. No pro-rata allocation.',
  'Gross margin requirement, current BP footprint, original opening BP debit and a future closing BP release are distinct.',
  'Group buying-power Credit is preserved; equality to account used-derivative-buying-power is an observed reconciliation, not a universal formula.',
  'Working-order inclusion is reported by the margin engine; false does not establish absence of closing orders.',
  'Holdings, balances and margin have separate clocks. No atomic account cut or post-read orderability is claimed.',
  'Original opening BP debit and future closing BP release remain unknown; no simulations run by this exporter.'
 ],issues:[]};
 if(!read)return result;
 const data=read.body?.data;
 if(!data||!Array.isArray(data.groups)){result.status='PARTIAL';result.issues.push('INVALID_MARGIN_REPORT');return result;}
 const stamp=data['last-state-timestamp'];
 const validClock=Number.isSafeInteger(stamp)&&stamp>0&&stamp<=Date.parse(read.retrievedAt);
 result.source={endpoint:'GET /margin/accounts/{account_number}/requirements',retrievedAt:read.retrievedAt,brokerStateAt:validClock?new Date(stamp).toISOString():null,reportedStateTimestamp:stamp??null,balanceSourceAt:balances?.['updated-at']??null,holdingsRetrievedAt:holdingsRead?.retrievedAt??null,currencyBasis:currency?'BROKER_BALANCE_CURRENCY':'NOT_ESTABLISHED'};
 result.account={marginCalculationType:data['margin-calculation-type']??null,marginRequirement:metric(data,'margin-requirement',currency),initialRequirement:metric(data,'initial-requirement',currency),maintenanceRequirement:metric(data,'maintenance-requirement',currency),optionBuyingPower:metric(data,'option-buying-power',currency)};
 const groupMaps=[];let nodes=0;
 const walk=(groups,path,underlying=null,ancestorHasEntries=false,depth=0)=>{
  if(depth>16)throw Error('Margin hierarchy capacity exceeded');
  for(let i=0;i<groups.length;i++){
   if(++nodes>2000)throw Error('Margin group capacity exceeded');
   const g=groups[i],where=path+'/'+i,root=g?.['underlying-symbol']??underlying;
   if(!g||typeof g!=='object'||Array.isArray(g)){result.issues.push('INVALID_MARGIN_GROUP');continue;}
   const hasEntries=Array.isArray(g['position-entries']);
   if(hasEntries){
    const members=entries(g['position-entries']);
    if(g['position-entries'].length>20000)throw Error('Margin member capacity exceeded');
    if(ancestorHasEntries)result.issues.push('OVERLAPPING_MARGIN_HIERARCHY');
    groupMaps.push(members);
    result.riskGroups.push({brokerGroupPath:where,underlying:root,reportedType:g.description??null,includesWorkingOrder:typeof g['includes-working-order']==='boolean'?g['includes-working-order']:null,marginRequirement:metric(g,'margin-requirement',currency),initialRequirement:metric(g,'initial-requirement',currency),maintenanceRequirement:metric(g,'maintenance-requirement',currency),buyingPowerFootprint:metric(g,'buying-power',currency),observedLegs:g['position-entries'],memberShapeValid:members.valid});
   }
   if(g.groups!==undefined&&!Array.isArray(g.groups)){result.issues.push('INVALID_MARGIN_HIERARCHY');continue;}
   if(Array.isArray(g.groups))walk(g.groups,where+'/groups',root,ancestorHasEntries||hasEntries,depth+1);
  }
 };
 walk(data.groups,'/data/groups');
 const holdings=holdingsRead?.body?.data?.items,held=entries(holdings,{held:true});
 const all={out:new Map(),valid:groupMaps.every(m=>m.valid)};
 for(const group of groupMaps)for(const [k,q] of group.out)all.out.set(k,plus(all.out.get(k)??{n:0n,scale:0},q));
 const membership=same(all,held);
 const sum=(field,effect)=>{
  let total={n:0n,scale:0};
  for(const g of result.riskGroups){const m=g[field];if(m.status!=='BROKER_REPORTED'||!(m.effect===effect||m.effect==='None'&&m.amount===0))return null;total=plus(total,decimal(m.reportedValue));}
  return total;
 };
 const margin=sum('marginRequirement','Debit'),bp=sum('buyingPowerFootprint','Credit');
 const accountMargin=decimal(data['margin-requirement']),used=decimal(balances?.['used-derivative-buying-power']),nlv=decimal(balances?.['net-liquidating-value']),available=decimal(balances?.['derivative-buying-power']);
 const comparison=(a,b)=>a===null||b===null?'UNKNOWN':equal(a,b)?'MATCH':'MISMATCH';
 result.reconciliation={heldMembership:membership?'MATCH':holdingsRead?'MISMATCH':'UNKNOWN',sumGroupMargin:toNumber(margin),sumGroupBuyingPower:toNumber(bp),groupMarginToReportTotal:comparison(margin,result.account.marginRequirement.status==='BROKER_REPORTED'&&(result.account.marginRequirement.effect==='Debit'||result.account.marginRequirement.effect==='None'&&result.account.marginRequirement.amount===0)?accountMargin:null),groupBpToAccountUsedBp:comparison(bp,used),groupBpToNlvMinusAvailable:comparison(bp,nlv&&available?plus(nlv,neg(available)):null),atomic:false};
 if(!broker?.projection&&held.out.size>0)result.issues.push('POSITION_PROJECTION_UNAVAILABLE');
 if(['groupMarginToReportTotal','groupBpToAccountUsedBp','groupBpToNlvMinusAvailable'].some(k=>result.reconciliation[k]==='UNKNOWN'))result.issues.push('ACCOUNT_RECONCILIATION_INCOMPLETE');
 if(!membership)result.issues.push('HELD_MEMBERSHIP_NOT_RECONCILED');
 if(!validClock)result.issues.push('MARGIN_STATE_CLOCK_UNAVAILABLE_OR_FUTURE');
 if(!currency)result.issues.push('CURRENCY_NOT_ESTABLISHED');
 if(!result.riskGroups.length&&held.out.size>0)result.issues.push('MARGIN_GROUPS_UNAVAILABLE');
 if(Object.entries(result.reconciliation).some(([k,v])=>k!=='atomic'&&v==='MISMATCH'))result.issues.push('ACCOUNT_OR_GROUP_RECONCILIATION_MISMATCH');
 const globallyVerified=membership&&validClock&&currency!==null&&result.issues.length===0;
 for(const [index,p] of (broker?.projection?.positions??[]).entries()){
  const rows=(Array.isArray(holdings)?holdings:[]).filter(h=>h['underlying-symbol']===p.underlying&&h['expires-at']===p.expiry);
  const target=entries(rows,{held:true});const matches=[];
  if(p.status==='recognized'&&rows.length&&globallyVerified)for(let i=0;i<groupMaps.length;i++){
   const g=result.riskGroups[i];if(g.includesWorkingOrder===false&&same(groupMaps[i],target)&&g.buyingPowerFootprint.status==='BROKER_REPORTED'&&g.marginRequirement.status==='BROKER_REPORTED')matches.push(g);
  }
  const match=matches.length===1?matches[0]:null;
  result.positionBindings.push({positionIndex:index,underlying:p.underlying??p.symbol,status:match?'EXACT_BROKER_HELD_GROUP_MATCH':'UNRESOLVED_NO_ALLOCATION',brokerGroupPath:match?.brokerGroupPath??null,buyingPowerFootprint:match?.buyingPowerFootprint??null,marginRequirement:match?.marginRequirement??null,source:result.source,openingBuyingPowerDebit:null,hypotheticalClosingBuyingPowerRelease:null});
 }
 const allBound=result.positionBindings.every(b=>b.status==='EXACT_BROKER_HELD_GROUP_MATCH');
 if(!allBound)result.issues.push('ONE_OR_MORE_POSITION_BP_BINDINGS_UNRESOLVED');
 if(!groupMaps.every(m=>m.valid))result.issues.push('INVALID_MARGIN_MEMBERS');
 result.status=globallyVerified&&allBound?'OBSERVED_QUALIFIED':'PARTIAL';
 return result;
}
