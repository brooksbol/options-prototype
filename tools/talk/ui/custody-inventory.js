// Presentation of backend-selected custody cuts only. No lifecycle inference, lot merging or strategy recognition.
const sourceText=value=>value==null?'Unavailable':typeof value==='object'&&Object.hasOwn(value,'lexeme')?value.lexeme:String(value);
function node(doc,tag,text,className){const e=doc.createElement(tag);if(text!=null)e.textContent=text;if(className)e.className=className;return e;}
export function renderCustodyInventory(doc,inventory){
 const report=node(doc,'section',null,'custody-inventory');
 report.append(node(doc,'h3','Positions · Retained brokerage inventory'));
 report.append(node(doc,'p','Latest retained custody by Account · live completeness not established','source-access'));
 for(const account of inventory.accounts){
  const section=node(doc,'section',null,'custody-account');section.append(node(doc,'h4',`${account.nickname} · ${account.broker??'Broker unavailable'}`));
  const holdings=account.holdings??[],dates=[...new Set(holdings.map(h=>h.observedAt??h.observationDate).filter(Boolean))],receipts=[...new Set(holdings.filter(h=>!h.observedAt&&!h.observationDate).map(h=>h.receivedAt).filter(Boolean))];
  const partial=holdings.some(h=>h.snapshotCoverage!=='COMPLETE_REPORTED');
  const source=dates.length?'Source: '+dates.join(', '):'';
  const receipt=receipts.length?'Received: '+receipts.join(', ')+' · broker observation time unavailable':'';
  section.append(node(doc,'p',[source,receipt,!account.complete?'Incomplete read':partial?'Partial source coverage':'Complete selected retained read'].filter(Boolean).join(' · '),'custody-source'));
  const conflicts=[...(account.warnings??[]),...holdings.flatMap(h=>h.warnings??[])].filter(w=>w.code==='SOURCE_CONFLICT');
  if(conflicts.length)section.append(node(doc,'p','Source conflict · retained inventory may not reflect the latest source. Inspect custody source details.','source-access'));
  for(const problem of account.problems??[])section.append(node(doc,'p',problem.code==='FORBIDDEN'?'Access denied · inventory unavailable':`${problem.title??problem.code} · inventory incomplete`,'source-access'));
  if(holdings.length){
   const scroll=node(doc,'div',null,'inventory-table-scroll'),table=node(doc,'table'),head=node(doc,'thead'),header=node(doc,'tr');
   for(const label of ['Reported instrument','Side','Observed quantity'])header.append(node(doc,'th',label));head.append(header);table.append(head);
   const body=node(doc,'tbody');
   for(const h of holdings){const row=node(doc,'tr');
    const identity=h.sourceDescription||h.sourceInstrument?.identifier||'Instrument unavailable';
    row.append(node(doc,'td',identity),node(doc,'td',h.side??'Unknown'),node(doc,'td',h.quantity==null?'Unavailable':`${sourceText(h.quantity)} ${h.unit==='SOURCE_UNIT'?(h.sourceUnit??'source units'):h.unit??'unit unavailable'}`));body.append(row);
   }table.append(body);scroll.append(table);section.append(scroll);
  }else section.append(node(doc,'p',account.complete?'No rows in the selected retained cut; live absence not established.':'Inventory unavailable; no empty-Account conclusion.'));
  const details=node(doc,'details'),summary=node(doc,'summary','Custody source details');details.append(summary);let built=false;
  details.addEventListener('toggle',()=>{if(!details.open||built)return;built=true;details.append(node(doc,'p',inventory.qualification));const raw=node(doc,'details'),label=node(doc,'summary','Technical source');raw.append(label);let loaded=false;raw.addEventListener('toggle',()=>{if(raw.open&&!loaded){loaded=true;raw.append(node(doc,'pre',JSON.stringify(account,null,2)));}});details.append(raw);});section.append(details);report.append(section);
 }
 return report;
}
