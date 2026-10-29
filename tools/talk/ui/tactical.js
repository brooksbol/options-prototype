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
 if(payoff?.status!=='QUALIFIED'||!Array.isArray(points)||!points.length||g.segments?.length!==points.length+1)return null;
 // Flat-tail, bounded-risk structures can be drawn from backend-provided knots without calculating payoff.
 if(number(g.segments[0].slope)!==0||number(g.segments.at(-1).slope)!==0)return null;
 const knots=points.map(p=>({x:number(p.price),y:number(p.value),label:p.price}));if(knots.some(p=>p.x==null||p.y==null))return null;
 const spot=known(evaluation.spot,'PRICE')?number(evaluation.spot.value):null;
 let low=Math.min(...knots.map(p=>p.x),...(spot==null?[]:[spot])),high=Math.max(...knots.map(p=>p.x),...(spot==null?[]:[spot]));if(high<=low)return null;
 const pad=(high-low)*.15;low-=pad;high+=pad;const bottom=Math.min(0,...knots.map(p=>p.y)),top=Math.max(0,...knots.map(p=>p.y));
 const x=v=>14+(v-low)/(high-low)*232,y=v=>top===bottom?40:66-(v-bottom)/(top-bottom)*48;
 const label=`Expiration shape · ${g.valueKind==='GROSS_PL'?'gross P/L before fees':'terminal value, not P/L'} · strikes ${points.map(p=>p.price).join(', ')}${spot==null?'':` · source spot ${evaluation.spot.value} ${evaluation.spot.currency??''} · ${evaluation.spotRegion??'region unavailable'}`}`;
 const image=svg(doc,label);shape(doc,image,'line',{x1:14,y1:y(0),x2:246,y2:y(0),class:'tactical-zero'});
 const plotted=[{x:low,y:knots[0].y},...knots,{x:high,y:knots.at(-1).y}];shape(doc,image,'polyline',{points:plotted.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',class:'tactical-payoff'});
 for(const point of knots){shape(doc,image,'circle',{cx:x(point.x),cy:y(point.y),r:2.2,class:'tactical-strike'});const t=shape(doc,image,'text',{x:x(point.x),y:81,'text-anchor':'middle',class:'tactical-axis'});t.textContent=point.label;}
 if(spot!=null){const color={NEUTRAL_PLATEAU:'plateau',TRANSITION:'transition',ADVERSE_TAIL:'loss'}[evaluation.spotRegion]??'unknown';shape(doc,image,'line',{x1:x(spot),x2:x(spot),y1:4,y2:68,class:'tactical-spot-line'});shape(doc,image,'path',{d:`M ${x(spot)-4} 5 L ${x(spot)+4} 5 L ${x(spot)} 12 Z`,class:'tactical-spot '+color});}
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
export function renderTacticalPositions(doc,{account,evidence}){
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
