// Trusted native presentation. Geometry/economics/statuses come exclusively from governed backend results.
import {usdDisplay} from './currency.js';
const SVG='http://www.w3.org/2000/svg';
const known=(m,unit)=>['QUALIFIED','ESTABLISHED'].includes(m?.status)&&m.value!=null&&(!unit||m.unit===unit);
const lexeme=v=>v&&typeof v==='object'&&Object.hasOwn(v,'lexeme')?v.lexeme:typeof v==='number'?String(v):v;
const number=v=>{const source=lexeme(v);return typeof source==='string'&&/^-?\d+(?:\.\d+)?$/.test(source)&&Number.isFinite(Number(source))?Number(source):null;};
const exact=v=>v==null?'—':String(lexeme(v));
const money=m=>!known(m,'MONEY')?'—':m.currency==='USD'?usdDisplay(m.value,{signed:true}):exact(m.value)+' '+exact(m.currency);
function node(doc,tag,text,className){const e=doc.createElement(tag);if(text!=null)e.textContent=text;if(className)e.className=className;return e;}
function svg(doc,label){const e=doc.createElementNS(SVG,'svg');e.setAttribute('viewBox','0 0 260 84');e.setAttribute('role','img');e.setAttribute('aria-label',label);e.setAttribute('focusable','false');const t=doc.createElementNS(SVG,'title');t.textContent=label;e.append(t);return e;}
function shape(doc,root,tag,attributes){const e=doc.createElementNS(SVG,tag);for(const[k,v]of Object.entries(attributes))e.setAttribute(k,String(v));root.append(e);return e;}
const bounded=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function payoffGraphic(doc,evaluation){
 const payoff=evaluation?.payoff,g=payoff?.geometry,points=g?.boundaries;
 if(payoff?.status==='QUALIFIED'&&['ESTIMATED_PL','GROSS_PL'].includes(g?.valueKind)&&Array.isArray(g.financialRegions))return financialPayoffGraphic(doc,evaluation);
 if(payoff?.status!=='QUALIFIED'||!Array.isArray(points)||!points.length||g.segments?.length!==points.length+1)return null;
 // Flat-tail, bounded-risk structures can be drawn from backend-provided knots without calculating payoff.
 const samples=Array.isArray(g.displayPoints)&&g.displayPoints.length>=2?g.displayPoints.map(p=>({x:number(p.price),y:number(p.value)})):null;
 if(samples&&(samples.some(p=>p.x==null||p.y==null)||samples.some((p,i)=>i>0&&p.x<=samples[i-1].x)))return null;
 if(!samples&&(number(g.segments[0].slope)!==0||number(g.segments.at(-1).slope)!==0))return null;
 const knots=points.map(p=>({x:number(p.price),y:number(p.value),label:p.price}));if(knots.some(p=>p.x==null||p.y==null))return null;
 const spot=known(evaluation.spot,'PRICE')?number(evaluation.spot.value):null;
 let low=Math.min(...(samples??knots).map(p=>p.x),...(spot==null?[]:[spot])),high=Math.max(...(samples??knots).map(p=>p.x),...(spot==null?[]:[spot]));if(high<=low)return null;
 if(!samples){const pad=(high-low)*.15;low-=pad;high+=pad;}const values=(samples??knots).map(p=>p.y),terminalWindow=g.valueKind==='TERMINAL_VALUE'&&Math.min(...values)>0;const bottom=terminalWindow?Math.min(...values):Math.min(0,...values),top=Math.max(0,...values);
 const x=v=>14+(v-low)/(high-low)*232,y=v=>top===bottom?40:66-(v-bottom)/(top-bottom)*48;
 const label=`Expiration shape · ${g.valueKind==='GROSS_PL'?'gross P/L before fees':'terminal value, not P/L'} · strikes ${points.map(p=>p.price).join(', ')}${spot==null?'':` · source spot ${evaluation.spot.value} ${evaluation.spot.currency??''} · ${evaluation.spotRegion??'region unavailable'}`}`;
 const image=svg(doc,label);if(bottom<=0&&top>=0)shape(doc,image,'line',{x1:14,y1:y(0),x2:246,y2:y(0),class:'tactical-zero'});
 const plotted=samples??[{x:low,y:knots[0].y},...knots,{x:high,y:knots.at(-1).y}];shape(doc,image,'polyline',{points:plotted.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',class:'tactical-payoff'});
 for(const point of knots){shape(doc,image,'circle',{cx:x(point.x),cy:y(point.y),r:2.2,class:'tactical-strike'});const t=shape(doc,image,'text',{x:x(point.x),y:81,'text-anchor':'middle',class:'tactical-axis'});t.textContent=point.label;}
 if(spot!=null){const color={NEUTRAL_PLATEAU:'plateau',TRANSITION:'transition',ADVERSE_TAIL:'loss'}[evaluation.spotRegion]??'unknown';shape(doc,image,'line',{x1:x(spot),x2:x(spot),y1:4,y2:68,class:'tactical-spot-line'});shape(doc,image,'path',{d:`M ${x(spot)-4} 5 L ${x(spot)+4} 5 L ${x(spot)} 12 Z`,class:'tactical-spot '+color});}
 return image;
}
// Financial numbers and marker locations are backend results. Only currency formatting and pixel layout live here.
function priceLabel(value,currency,{whole=false}={}){
 const source=exact(value);if(number(value)==null)return source;
 const label=currency==='USD'?usdDisplay(source):`${source}${currency?' '+currency:''}`;
 return whole?label.replace(/\.00$/,''):label;
}
function financialPayoffGraphic(doc,evaluation){
 const g=evaluation.payoff.geometry,points=g.displayPoints?.map(p=>({x:number(p.price),y:number(p.value)}));
 if(!points||points.length<2||points.some(p=>p.x==null||p.y==null)||points.some((p,i)=>i&&p.x<=points[i-1].x))return null;
 const low=points[0].x,high=points.at(-1).x,bottom=Math.min(0,...points.map(p=>p.y)),top=Math.max(0,...points.map(p=>p.y));if(high<=low)return null;
 const x=v=>32+(v-low)/(high-low)*416,y=v=>top===bottom?60:106-(v-bottom)/(top-bottom)*90;
 const meaning=g.financialReference?.label??(g.valueKind==='ESTIMATED_PL'?'Estimated expiration P/L':'Gross expiration P/L before fees');
 const markers=g.breakEvenMarkers??(g.breakEvenPrices??[]).map(root=>({price:root,label:exact(root),approximate:false}));
 const spot=g.spotPoint,spotLabel=spot&&number(spot.price)!=null?observedSpotLabel(evaluation,spot.price,g.priceCurrency):null;
 const accessible=[meaning,'Negative region: expiration loss. Positive region: expiration profit. Dashed line: zero P/L.',spotLabel,...markers.map(m=>'Break-even '+(m.approximate?'approximately ':'')+priceLabel(m.price,g.priceCurrency)),...(g.boundaries??[]).map(p=>'Strike '+priceLabel(p.price,g.priceCurrency,{whole:true}))].filter(Boolean).join(' · ');
 const image=svg(doc,accessible);image.setAttribute('viewBox','0 -4 480 170');image.setAttribute('class','tactical-financial-chart');
 for(const region of g.financialRegions){if(!['LOSS','PROFIT'].includes(region.kind)||!Array.isArray(region.points))return null;const coords=region.points.map(p=>({x:number(p.price),y:number(p.value)}));if(coords.some(p=>p.x==null||p.y==null))return null;shape(doc,image,'polygon',{points:coords.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),class:region.kind==='LOSS'?'tactical-loss-area':'tactical-profit-area'});}
 const text=(value,px,py,anchor='start',extra='')=>{const n=shape(doc,image,'text',{x:px,y:py,'text-anchor':anchor,class:'tactical-axis '+extra});n.textContent=value;return n;};
 shape(doc,image,'line',{x1:32,x2:448,y1:y(0),y2:y(0),class:'tactical-zero'});text('0',25,y(0)+4,'end');
 shape(doc,image,'polyline',{points:points.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',class:'tactical-payoff'});
 // Price-label lanes prevent nearby spot, break-even and strike labels from colliding. This is pixel layout only.
 const labels=[];
 if(spotLabel&&number(spot.value)!=null){const px=x(number(spot.price));shape(doc,image,'line',{x1:px,x2:px,y1:11,y2:110,class:'tactical-spot-line'});shape(doc,image,'circle',{cx:px,cy:y(number(spot.value)),r:4,class:'tactical-observed-spot'});text(spotLabel,px,14,px>325?'end':px<115?'start':'middle','tactical-spot-label');}
 for(const m of markers){const v=number(m.price);if(v==null)continue;const px=x(v);shape(doc,image,'circle',{cx:px,cy:y(0),r:4,class:'tactical-break-even'});labels.push({label:'Break-even '+(m.approximate||g.valueKind==='ESTIMATED_PL'?'≈':'')+priceLabel(m.price,g.priceCurrency),px,lane:0,role:'tactical-be-label'});}
 for(const p of g.boundaries??[]){const v=number(p.price),value=number(p.value);if(v==null||value==null)continue;const px=x(v);shape(doc,image,'circle',{cx:px,cy:y(value),r:3.5,class:'tactical-strike'});labels.push({label:'Strike '+priceLabel(p.price,g.priceCurrency,{whole:true}),px,lane:1,role:'tactical-strike-label'});}
 const lanes=[];for(const label of labels){const width=label.label.length*8.5,anchor=label.px>325?'end':label.px<115?'start':'middle';const left=anchor==='end'?label.px-width:anchor==='start'?label.px:label.px-width/2,right=left+width;let lane=label.lane;
  while((lanes[lane]??[]).some(range=>left<range[1]+12&&right>range[0]-12))lane++;
  (lanes[lane]??=[]).push([left,right]);text(label.label,label.px,125+lane*18,anchor,label.role);
 }
 if(lanes.length>2)image.setAttribute('viewBox',`0 -4 480 ${136+lanes.length*18}`);
 return image;
}
export function timelineGraphic(doc,timeline,checkpoint){
 if(!known(timeline?.originalDays,'DAY')||!known(timeline?.remainingDays,'DAY'))return null;const original=number(timeline.originalDays.value),remaining=number(timeline.remainingDays.value);if(original==null||remaining==null||original<=0)return null;
 const image=svg(doc,`${remaining} of ${original} days remain · ${timeline.calendarZone??'zone unavailable'}${checkpoint?' · manual review checkpoint, not an execution':''}`);
 const x=v=>18+bounded(v,0,1)*224;shape(doc,image,'line',{x1:18,x2:242,y1:38,y2:38,class:'tactical-track'});
 shape(doc,image,'line',{x1:18,x2:x((original-remaining)/original),y1:38,y2:38,class:'tactical-elapsed'});
 for(let i=0;i<=10;i++)shape(doc,image,'line',{x1:x(i/10),x2:x(i/10),y1:34,y2:42,class:'tactical-tick'});
 shape(doc,image,'circle',{cx:x((original-remaining)/original),cy:38,r:4,class:'tactical-now'});
 const checkpointDays=number(checkpoint?.remainingDteAtCheckpoint);if(checkpointDays!=null){const t=shape(doc,image,'text',{x:x((original-Number(checkpointDays))/original),y:23,'text-anchor':'middle',class:checkpoint.state==='PAST_DUE'?'tactical-overdue':'tactical-checkpoint'});t.textContent='M';}
 return image;
}
export function exitGraphic(doc,evaluation){
 const m=evaluation?.management,current=evaluation?.grossUnrealizedPl;if(!known(m?.zeroGrossPl,'MONEY')||number(m.zeroGrossPl.value)!==0)return null;

 const target=known(m.profitTargetGrossPl,'MONEY')&&m.profitTargetGrossPl.currency===m.zeroGrossPl.currency?number(m.profitTargetGrossPl.value):null,stop=known(m.reportedStopThresholdGrossPl,'MONEY')&&m.reportedStopThresholdGrossPl.currency===m.zeroGrossPl.currency?number(m.reportedStopThresholdGrossPl.value):null;
 if(!known(current,'MONEY')&&target==null&&stop==null)return null;
 const image=svg(doc,'Indicative gross P/L relative to broker-supported profit and reported adverse thresholds; no execution guarantee');
 shape(doc,image,'line',{x1:18,x2:130,y1:40,y2:40,class:stop!=null&&stop<0?'tactical-adverse':'tactical-unscaled'});shape(doc,image,'line',{x1:130,x2:242,y1:40,y2:40,class:target!=null&&target>0?'tactical-target':'tactical-unscaled'});shape(doc,image,'line',{x1:130,x2:130,y1:29,y2:51,class:'tactical-zero'});
 if(known(current,'MONEY')&&current.currency===m.zeroGrossPl.currency){const value=number(current.value);if(value!=null){const scaled=value<0&&stop!=null&&stop<0?130+112*value/(-stop):value>=0&&target!=null&&target>0?130+112*value/target:value<0?76:value>0?186:130;const x=bounded(scaled,6,254);shape(doc,image,'path',{d:`M ${x} 34 L ${x+5} 40 L ${x} 46 L ${x-5} 40 Z`,class:'tactical-now'});if(scaled<18||scaled>242){const text=shape(doc,image,'text',{x,y:21,'text-anchor':'middle',class:'tactical-overflow'});text.textContent=scaled<18?'←':'→';}}}
 return image;
}
function details(doc,item){const e=node(doc,'details'),summary=node(doc,'summary','Position details and evidence');e.append(summary);let built=false;e.addEventListener('toggle',()=>{if(!e.open||built)return;built=true;const dl=node(doc,'dl');for(const[k,v]of [['Position',item.id],['Exposure',item.exposure?.status],['Association',item.structure?.authority?.basis],['Model standing',item.structure?.modelStanding],['Evaluated',item.evaluation?.evaluatedAt],['Oldest material observation',item.evaluation?.oldestMaterialObservationAt],['Geometry meaning',item.evaluation?.payoff?.geometry?.valueKind],['Warnings',(item.warningCodes??[]).join(', ')],...(item.constituents??[]).map(c=>['Constituent',`${c.symbol??c.kind} · ${c.side} ${c.quantity} ${c.unit} · ${c.terms?.right??''} ${c.terms?.strike??''} ${c.terms?.expiration??''}`])]){dl.append(node(doc,'dt',k),node(doc,'dd',exact(v)));}e.append(dl);const raw=node(doc,'details'),s=node(doc,'summary','Technical source');raw.append(s);let loaded=false;raw.addEventListener('toggle',()=>{if(raw.open&&!loaded){loaded=true;raw.append(node(doc,'pre',JSON.stringify(item,null,2)));}});e.append(raw);});return e;}
export function renderTacticalPositions(doc,{account,evidence,compact=false,embedded=false}){
 if(compact){const report=compactTacticalPositions(doc,{account,evidence});report.setAttribute('aria-label',`${account.nickname} positions`);return report;}
 const report=node(doc,'section',null,'tactical-report');report.append(node(doc,'h3',`${account.nickname}${evidence.selection?.underlying?' · '+evidence.selection.underlying:''} · Positions`));if(evidence.next)report.append(node(doc,'p','This page is incomplete; more Positions follow.','source-access'));
 if(!evidence.items.length)report.append(node(doc,'p','No Positions returned for the selected scope.'));
 for(const item of evidence.items){const e=item.evaluation??{},card=node(doc,'section',null,'tactical-position');const title=(item.underlyings??[]).map(s=>s.symbol).join(' / ')||item.constituents?.[0]?.symbol||'Observed constituents';card.append(node(doc,'h4',title),node(doc,'p',`${item.structure?.name??'Unclassified construction'} · ${item.structure?.status==='VALIDATED'?'Model match':item.structure?.status??'UNKNOWN'}`,'tactical-identity'));
  card.append(node(doc,'span',`${item.exposure?.status??'Exposure unrecorded'} · lifecycle ${item.state??'unknown'}`,'tactical-status'));
  const grid=node(doc,'div',null,'tactical-grid');const add=(label,value,graphic)=>{const cell=node(doc,'section');cell.append(node(doc,'h5',label),node(doc,'strong',value));if(graphic)cell.append(graphic);grid.append(cell);return cell;};
  const range=e.range??{},rangeText=range.status!=='QUALIFIED'?'—':range.lower!=null&&range.upper!=null?`${range.lower}–${range.upper}`:range.lower!=null?`≥ ${range.lower}`:range.upper!=null?`≤ ${range.upper}`:'—';
  const shapeGraphic=payoffGraphic(doc,e);const shapeCell=shapeGraphic||range.status==='QUALIFIED'?add('Trade shape · strike range',rangeText,shapeGraphic):null;if(shapeCell&&e.payoff?.geometry)shapeCell.append(node(doc,'small',e.payoff.geometry.valueKind==='GROSS_PL'?'Gross expiration P/L':'Terminal value · opening basis unavailable'));
  const spotCell=known(e.spot,'PRICE')?add('Spot',`${e.spot.value} ${e.spot.currency??''}`):null;if(known(e.spot,'PRICE')&&e.spot.asOf){const note=node(doc,'small',`Observed ${e.spot.asOf}`,'tactical-freshness');if(e.spot.warningCodes?.includes('STALE_MARKET_OBSERVATION')){note.textContent='Stale · '+note.textContent;note.setAttribute('data-state','STALE');}spotCell.append(note);}
  const dteCell=known(e.timeline?.remainingDays,'DAY')||known(e.timeline?.originalDays,'DAY')?add('DTE · remaining / original',`${known(e.timeline?.remainingDays,'DAY')?e.timeline.remainingDays.value:'—'} / ${known(e.timeline?.originalDays,'DAY')?e.timeline.originalDays.value:'—'} days`,timelineGraphic(doc,e.timeline,e.management?.manualCheckpoint)):null;if(dteCell&&e.timeline?.calendarZone)dteCell.append(node(doc,'small',e.timeline.calendarZone));
  const progressGraphic=exitGraphic(doc,e);if(progressGraphic||e.management?.manualCheckpoint){const progress=add('Exit progress · gross before fees',money(e.grossUnrealizedPl),progressGraphic);progress.append(node(doc,'small',`Target ${money(e.management?.profitTargetGrossPl)} · reported stop ${money(e.management?.reportedStopThresholdGrossPl)}`));if(e.management?.manualCheckpoint)progress.append(node(doc,'small',`Review ${e.management.manualCheckpoint.date} · ${e.management.manualCheckpoint.state}`));}else card.append(node(doc,'p','Entry / exit economics unavailable · details below','tactical-degraded'));if(shapeCell||spotCell||dteCell||progressGraphic)card.append(grid);else card.append(node(doc,'p',`${item.constituents?.length??0} observed constituents · details below`,'tactical-degraded'));
  const sourceAt=e.oldestMaterialObservationAt,age=sourceAt&&e.evaluatedAt?Math.max(0,Math.floor((Date.parse(e.evaluatedAt)-Date.parse(sourceAt))/1000)):null;const freshness=node(doc,'p',`Quote: ${e.freshness??'UNKNOWN'}${age!=null&&Number.isFinite(age)?` · ${age}s at evaluation`:''}`,'tactical-freshness');freshness.setAttribute('data-state',e.freshness??'UNKNOWN');card.append(freshness);card.append(details(doc,item));report.append(card);
 }
 return report;
}


// Same trusted tactical vocabulary for every broker; unsupported economics do not become empty gauges.
export function strikeConfigurationGraphic(doc,markers){
 if(!Array.isArray(markers)||!markers.length||markers.some(m=>number(m.strike)==null||!['CALL','PUT'].includes(m.right)))return null;
 const values=markers.map(m=>number(m.strike)),lo=Math.min(...values),hi=Math.max(...values);const x=v=>lo===hi?130:24+(v-lo)/(hi-lo)*212;
 const image=svg(doc,'Reported strike configuration only · not monetary payoff or P/L');shape(doc,image,'line',{x1:14,x2:246,y1:42,y2:42,class:'tactical-track'});
 markers.forEach((m,i)=>{const px=x(number(m.strike)),y=markers.length>1?24+(i%2)*18:32;shape(doc,image,'line',{x1:px,x2:px,y1:18,y2:62,class:'tactical-spot-line'});const label=shape(doc,image,'text',{x:px,y:i%2?78:14,'text-anchor':'middle',class:'tactical-axis'});label.textContent=`${m.strike} ${m.right==='CALL'?'C':'P'}`;shape(doc,image,'circle',{cx:px,cy:y,r:m.side==='SHORT'?4:2.5,class:'tactical-strike'});});return image;
}
function componentLabel(part,sharedExpiration){
 const t=part.terms??{},i=part.identity??{},quantity=part.quantity==null?'quantity unavailable':exact(part.quantity),side=part.side==='SHORT'?'Short':part.side==='LONG'?'Long':'Side unknown';
 if(['CALL','PUT'].includes(t.right))return `${side} ${quantity} ${t.right.toLowerCase()} · ${t.currency==='USD'?'$':''}${exact(t.strike)}${!sharedExpiration&&t.expiration?' · '+t.expiration:''}`;
 const identity=i.variant==='TREASURY_BILL'?`Matures ${i.maturity??'unknown'} · ${i.nativeIdentifier}`:i.label||part.symbol||i.nativeIdentifier||part.sourceInstrument?.identifier||part.kind||'Reported instrument';
 const unit=part.unit==='SOURCE_UNIT'?(part.sourceUnit??'source units'):part.unit??'unit unavailable';return `${identity} · ${quantity} ${unit}${i.custody?' · '+i.custody:''}`;
}
function shortDay(value,zone='UTC'){
 if(typeof value!=='string')return null;try{const day=/^\d{4}-\d{2}-\d{2}$/.test(value);return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:day?'UTC':zone}).format(new Date(day?value+'T12:00:00Z':value));}catch{return null;}
}
// Source context belongs to the observed value; never borrow custody as a quote clock.
function observedSpotLabel(e,price=e.spot?.value,currency=e.spot?.currency){
 const day=shortDay(e.spot?.observationDate??e.spot?.asOf,e.timeline?.calendarZone??'UTC');
 return 'Spot '+priceLabel(price,currency)+' · '+(day??'undated');
}
function materialDisplayState(item,evidence){
 const e=item.evaluation??{},source=item.custody??evidence.source??{};
 const conflict=[...(item.warningCodes??[]),...(evidence.warnings??[]).map(w=>w.code)].some(c=>['SOURCE_CONFLICT','INCOMPATIBLE_CONTRACT_TERMS'].includes(c));
 if(conflict)return 'Source conflict';
 if(source.sourceClockWarning)return 'Source date unverified';
 if(['MONEY_MARKET','CASH','TREASURY_BILLS','TREASURY_BILL'].includes(item.variant))return null;
 const g=e.payoff?.geometry;
 if(e.payoff?.status!=='QUALIFIED')return 'P/L unavailable';
 if(g?.valueKind==='TERMINAL_VALUE')return 'Terminal value · P/L unavailable';
 return null;
}
function displayStructure(item){
 if(item.structure?.status==='VALIDATED'&&item.structure.name)return item.structure.name;
 const parts=item.constituents??[],g=item.evaluation?.payoff?.geometry;
 // Descriptive caption of already qualified capped rights; never a managed/lifecycle association or coverage calculation.
 if(item.evaluation?.payoff?.status==='QUALIFIED'&&g?.segments?.length===2&&number(g.segments[0].slope)>0&&number(g.segments[1].slope)===0&&parts.length===2&&parts.filter(p=>p.unit==='SHARE'&&p.side==='LONG').length===1&&parts.filter(p=>p.unit==='CONTRACT'&&p.side==='SHORT'&&p.terms?.right==='CALL').length===1)return 'Covered call';
 return item.structure?.name??'Reported inventory';
}
function positionContext(item){
 const parts=[...(item.constituents??[])].sort((a,b)=>(a.unit==='SHARE'?0:1)-(b.unit==='SHARE'?0:1));
 if(item.variant==='TREASURY_BILLS')return `${parts.length} reported ${parts.length===1?'instrument':'instruments'}`;
 if(['MONEY_MARKET','CASH'].includes(item.variant))return item.variant==='MONEY_MARKET'?'Reported fund value':'Reported balance';
 const g=item.evaluation?.payoff?.geometry,call=parts.find(p=>p.unit==='CONTRACT'&&p.side==='SHORT'&&p.terms?.right==='CALL');
 const capShown=item.evaluation?.payoff?.status==='QUALIFIED'&&parts.length===2&&parts.some(p=>p.unit==='SHARE'&&p.side==='LONG')&&g?.boundaries?.length===1&&call&&exact(g.boundaries[0].price)===exact(call.terms.strike);
 return parts.map(p=>p.unit==='SHARE'?`${exact(p.quantity)} shares`:p.unit==='CONTRACT'&&p.terms?.right?`${p.side==='SHORT'?'Short':'Long'} ${exact(p.quantity)}${capShown?'':' '+priceLabel(p.terms.strike,p.terms.currency,{whole:true})} ${p.terms.right.toLowerCase()}`:componentLabel(p,true)).join(' · ');
}
function inventoryDetails(doc,item,{account,evidence}){
 const disclosure=node(doc,'details',null,'tactical-details');disclosure.append(node(doc,'summary','Details and evidence'));let built=false;
 disclosure.addEventListener('toggle',()=>{if(!disclosure.open||built)return;built=true;
  const dl=node(doc,'dl');const e=item.evaluation??{},g=e.payoff?.geometry;
  const entries=[['Account',account.nickname],['Broker',account.broker],['Account read',evidence.accountReadStatus],['Read complete',evidence.readComplete],['Financial claim',g?.valueKind],['Calculation',g?.financialReference?.method],['Reference qualification',g?.financialReference?.label],['Exact break-even',(g?.breakEvenPrices??[]).map(v=>typeof v==='object'?`${v.numerator}/${v.denominator}`:v).join(', ')],['Expiration',e.timeline?.expiration],['Custody source day',item.custody?.observationDate],['Custody received',item.custody?.receivedAt],['Custody completeness',item.custody?.coverage],['Source currentness',item.custody?.currentness],['Spot source day',e.spot?.observationDate],['Spot observed',e.spot?.asOf],['Evaluated',e.evaluatedAt],['Association',item.structure?.authority?.qualification],['Continuity',item.exposure?.continuity??'Unresolved'],['Lifecycle',item.state??'Unresolved'],['Warnings',[...(item.warningCodes??[]),...(e.payoff?.warningCodes??[]),...(evidence.warnings??[]).map(w=>w.code)].join(', ')]];
  for(const [label,value]of entries)if(value!=null&&value!==''){dl.append(node(doc,'dt',label),node(doc,'dd',exact(value)));}disclosure.append(dl);
  for(const note of e.payoff?.assumptions??[])disclosure.append(node(doc,'p',note));
  if(evidence.qualification)disclosure.append(node(doc,'p',evidence.qualification));
  for(const coverage of item.shareCoverage??[])disclosure.append(node(doc,'p',`Share support ${coverage.status}: eligible ${exact(coverage.eligibleQuantity)}, required ${exact(coverage.requiredQuantity)} · ${coverage.qualification}`));
  for(const p of item.constituents??[]){disclosure.append(node(doc,'p',componentLabel(p,false)));if(known(p.reportedCostBasis,'MONEY'))disclosure.append(node(doc,'p','Broker-reported held basis: '+priceLabel(p.reportedCostBasis.value,p.reportedCostBasis.currency)));if(p.sourceDescription)disclosure.append(node(doc,'p',p.sourceDescription));if(known(p.reportedMarketValue,'MONEY'))disclosure.append(node(doc,'p','Broker-reported source value: '+priceLabel(p.reportedMarketValue.value,p.reportedMarketValue.currency)));}
  const timeline=timelineGraphic(doc,e.timeline,e.management?.manualCheckpoint);if(timeline)disclosure.append(timeline);const exit=exitGraphic(doc,e);if(exit)disclosure.append(exit);
  disclosure.append(node(doc,'h5','Backend evidence'),node(doc,'pre',JSON.stringify({position:item,account,source:evidence.source,qualification:evidence.qualification,warnings:evidence.warnings},null,2)));
 });return disclosure;
}
function compactTacticalPositions(doc,{account,evidence}){
 const report=node(doc,'section',null,'tactical-report tactical-compact-report');
 for(const item of evidence.items){const e=item.evaluation??{},card=node(doc,'section',null,(item.representation==='TACTICAL_POSITION'?'tactical-position':'tactical-inventory-unit')+' tactical-compact');
  const title=item.title||(item.underlyings??[]).map(s=>s.symbol).join(' / ')||item.constituents?.[0]?.symbol||'Reported instrument';
  const header=node(doc,'div',null,'tactical-unit-heading');const structure=displayStructure(item);header.append(node(doc,'h4',`${title}${title.toLowerCase()===structure.toLowerCase()?'':' · '+structure} · ${account.nickname?.toUpperCase()??'Account'}`));card.append(header);
  const context=node(doc,'div',null,'tactical-context');const description=positionContext(item);if(description)context.append(node(doc,'p',description));if(known(e.timeline?.remainingDays,'DAY'))context.append(node(doc,'strong',`${exact(e.timeline.remainingDays.value)} DTE`));if(context.children.length)card.append(context);
  const payoff=payoffGraphic(doc,e),graphic=payoff||strikeConfigurationGraphic(doc,item.strikeConfiguration);
  if(graphic){const figure=node(doc,'figure',null,'tactical-hero');figure.setAttribute('data-kind',payoff?'PAYOFF':'STRIKES');figure.append(graphic);if(payoff&&e.payoff?.geometry?.valueKind==='TERMINAL_VALUE'&&known(e.spot,'PRICE'))figure.append(node(doc,'figcaption',observedSpotLabel(e)));card.append(figure);}else if(['MONEY_MARKET','CASH'].includes(item.variant)){
   for(const p of item.constituents??[])if(known(p.reportedMarketValue,'MONEY'))card.append(node(doc,'strong',priceLabel(p.reportedMarketValue.value,p.reportedMarketValue.currency),'tactical-balance'));
  }
  const footer=node(doc,'div',null,'tactical-outcome');const ref=e.payoff?.geometry?.financialReference;
  if(ref?.maximumProfit!=null){const estimated=e.payoff.geometry.valueKind==='ESTIMATED_PL',value=(estimated?'≈':'')+(ref.currency==='USD'?usdDisplay(exact(ref.maximumProfit),{signed:true}):`${exact(ref.maximumProfit)} ${ref.currency}`);footer.append(node(doc,'span',e.payoff.geometry.valueKind==='GROSS_PL'?'Max gross expiration P/L':'Max expiration P/L'));const amount=node(doc,'strong',value);amount.setAttribute('aria-label',(estimated?'Estimated maximum expiration P/L: ':'Maximum expiration P/L: ')+value+' · '+(ref.label??''));footer.append(amount);}
  if(footer.children.length)card.append(footer);
  const state=materialDisplayState(item,evidence);if(state)card.append(node(doc,'small',state,'tactical-evidence-status'));card.append(inventoryDetails(doc,item,{account,evidence}));report.append(card);
 }
 return report;
}
export function renderTacticalInventory(doc,inventory){
 const report=node(doc,'section',null,'tactical-inventory');report.setAttribute('aria-label','Tactical positions');
 for(const account of inventory.accounts){const section=node(doc,'section',null,'tactical-account');section.setAttribute('aria-label',`${account.nickname} positions`);
  if(account.status!=='READ'){section.append(node(doc,'h3',account.nickname),node(doc,'p',account.status==='FORBIDDEN'?'Position inventory access denied.':account.status==='NO_RETAINED_CUSTODY'?'No retained custody observation.':'Complete selected inventory unavailable.','source-access'));report.append(section);continue;}
  if(!account.items.length)section.append(node(doc,'p',`${account.nickname.toUpperCase()} · No matching retained positions`));
  section.append(renderTacticalPositions(doc,{account,evidence:{source:account.source,warnings:account.warnings,accountReadStatus:account.status,readComplete:account.readComplete,qualification:inventory.qualification,items:account.items.map(item=>({...item,custody:{...account.source,...item.custody}}))},compact:true,embedded:true}));report.append(section);
 }
 return report;
}
