import { ShowError, humanShowNumber } from './ww-show.mjs';
import { positionRequest } from './ww-positions.mjs';
import { canonicalAccountId } from './ww-accounts.mjs';
import { renderPanel } from './tastytrade-live-render.mjs';

export const LIVE_HELP = `Usage: ww live [--account ACCOUNT] [--table | --jsonl] [--width COLUMNS] [--ascii] [--no-color]

Read retained open-option constructions from Wheelwright v2. No acquisition.
All authorized Accounts in one table; --account selects a nickname.
? marks unassociated membership; ! marks conflicting membership.
Backend owns membership, option-only scope, expiration exclusion, quantity, collateral,
terms and payoff. Unknowns remain —. Geometry is expiration intrinsic value before
opening premium, cost basis and fees; it is not current P/L or guaranteed execution.
Unrecognized options remain visible. Individual legs and close orders are not shown.
↻ means the backend found expired options in retained Fidelity evidence; not quote age.
Opening timestamps, qualified spot and management remain unavailable in this slice.

TTY default: table, BROKER and ACCOUNT first. Pipes: complete structural collection JSON Lines.
--table forces the human table. --jsonl preserves backend identities and qualifications.
--width 20..1000 overrides terminal width. --ascii / TERM=dumb uses ASCII unknowns.
--no-color / NO_COLOR / TERM=dumb disables color. Neutral text uses terminal foreground.
One structural read per invocation; no polling, brokerage access, or history read-through.
Refresh explicitly with ww pull && ww live. Existing pull coverage is not a guarantee
of current option prices, working orders, or complete Position lifecycle evidence.
Uses accepted WW_BASE_URL / WW_API_TOKEN configuration and Account read grants.`;

export function parseLive(args) {
  if (args.length === 1 && ['--help','-h','--man'].includes(args[0])) return {help:true};
  let account, format, width, ascii=false, noColor=false;
  const bad=()=>{throw new ShowError('live: invalid usage; see ww live --help',2);};
  for(let i=0;i<args.length;i++) {
    const a=args[i];
    if(a==='--account') {if(account!==undefined)bad();account=args[++i];if(!/^[a-z][a-z0-9-]{0,31}$/.test(account??''))bad();}
    else if(a==='--width') {if(width!==undefined)bad();const value=args[++i];if(!/^\d+$/.test(value??''))bad();width=Number(value);if(width<20||width>1000)bad();}
    else if(a==='--ascii') {if(ascii)bad();ascii=true;}
    else if(a==='--no-color') {if(noColor)bad();noColor=true;}
    else if(['--table','--jsonl'].includes(a)) {if(format)bad();format=a.slice(2);}
    else bad();
  }
  return {account,format,width,ascii,noColor};
}

const safe=value=>String(value??'—').replace(/[\x00-\x1f\x7f-\x9f]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
const grouped=value=>safe(value).replace(/^-?\d+/,whole=>whole.replace(/\B(?=(\d{3})+(?!\d))/g,','));
const numericText=value=>value==null?'—':JSON.isRawJSON(value)?humanShowNumber(value,'integer'):String(value);

// Wire validation only. Backend conclusions are never reconstructed from legs.
const integer = v => typeof v==='string' && /^-?[1-9][0-9]*$/.test(v);
const rawNumber = v => JSON.isRawJSON(v) ? Number(v.rawJSON) : v;
const finite = v => Number.isFinite(rawNumber(v));
const strings = a => Array.isArray(a) && a.every(v=>typeof v==='string');
const known = f => f?.status==='ESTABLISHED' ? f.value : null;
function fact(f,bad) {
  if(!f||!['ESTABLISHED','UNKNOWN','CONFLICTING','UNSUPPORTED'].includes(f.status)||!strings(f.evidenceIds)||!strings(f.reasons)||
    (f.status==='ESTABLISHED' ? f.value==null||!f.evidenceIds.length||f.reasons.length : f.value!==null||!f.reasons.length))bad();
}
const rational = r => r && typeof r.numerator==='string' && /^-?(?:0|[1-9][0-9]*)$/.test(r.numerator) && typeof r.denominator==='string' && /^[1-9][0-9]*$/.test(r.denominator);
export async function readOpenOptions(token,{account,...options}={}) {
  const data=await positionRequest(account,token,{...options,view:'option-structure'});
  const bad=()=>{throw new ShowError('live: invalid backend structural Position representation');};
  if(data.view!=='option-structure'||data.evaluationBasis!=='RETAINED_INSPECTION'||data.interpretationVersion!=='option-structure-v1'||!Number.isFinite(Date.parse(data.evaluatedAt))||!Array.isArray(data.accounts))bad();
  const seen=new Set();
  for(const a of data.accounts) {
    if(!canonicalAccountId(a?.accountId)||seen.has(a.accountId)||account!==undefined&&a.accountId!==account||!Array.isArray(a.structures)||!Array.isArray(a.evidence)||!strings(a.refreshReasons)||!strings(a.qualifications)||!strings(a.excludedExpiredHoldingIds))bad();
    seen.add(a.accountId);
    if(a.availability==='NO_RETAINED_SNAPSHOT') {if(a.snapshot!==null||a.structures.length||a.evidence.length||a.evidenceSetId!==null||a.evidenceQualification!=='UNAVAILABLE')bad();continue;}
    if(a.availability!=='RETAINED'||typeof a.snapshot?.snapshotId!=='string'||!['FIDELITY','TASTYTRADE'].includes(a.snapshot?.observationContext?.broker)||!['QUALIFIED','INCOMPLETE','CONFLICTING'].includes(a.evidenceQualification))bad();
    const ids=new Set();
    for(const p of a.structures) {
      if(typeof p.subjectId!=='string'||ids.has(p.subjectId)||!Array.isArray(p.constituents)||!p.constituents.length||!strings(p.qualifications)||!['ESTABLISHED','UNKNOWN','CONFLICTING'].includes(p.membership?.status)||!strings(p.membership.evidenceIds)||!strings(p.membership.reasons)||p.remainingDte!==null&&(!finite(p.remainingDte)||!Number.isInteger(rawNumber(p.remainingDte))))bad();
      ids.add(p.subjectId);
      for(const key of ['identity','underlying','expiration','openingFillAt','units','strategy','payoff','range','collateral'])fact(p[key],bad);
      if(known(p.underlying)&&typeof p.underlying.value.symbol!=='string'||known(p.units)&&!integer(p.units.value)||known(p.strategy)&&(!finite(p.strategy.value.complexityRank)||typeof p.strategy.value.kind!=='string')||known(p.openingFillAt)&&!Number.isFinite(Date.parse(p.openingFillAt.value)))bad();
      for(const h of p.constituents){if(typeof h.holdingId!=='string'||typeof h.observedHoldingQuantity!=='string'||!strings(h.quantityReasons)||h.signedQuantity!==null&&!integer(h.signedQuantity))bad();fact(h.terms,bad);}
      const g=known(p.payoff);
      if(g&&(g.basis!=='GROSS_EXPIRATION_EXERCISE_VALUE_BEFORE_PREMIUM_AND_BASIS'||g.quantityBasis!=='TOTAL_CURRENT_ALLOCATED_QUANTITIES'||g.domainMinimum!=='0'||!Array.isArray(g.knots)||!g.knots.length||!rational(g.rightTailSlope)||g.knots.some(k=>!rational(k.underlyingPrice)||!rational(k.terminalValue))))bad();
      const r=known(p.range);
      if(r&&(r.kind==='SHORT_STRIKE_INTERVAL'?typeof r.lower!=='string'||typeof r.upper!=='string':r.kind==='SHORT_STRIKE_HALF_LINE'?typeof r.boundary!=='string'||!['AT_OR_ABOVE','AT_OR_BELOW'].includes(r.direction):true))bad();
      const collateral=known(p.collateral);if(collateral&&(!Array.isArray(collateral)||collateral.some(c=>!['SHARES','CASH'].includes(c.kind)||typeof c.quantity!=='string'||!strings(c.evidenceIds)||c.symbol!==null&&typeof c.symbol!=='string'||c.currency!==null&&typeof c.currency!=='string')))bad();
    }
  }
  if(account!==undefined&&data.accounts.length!==1)bad();
  return data;
}
// Coordinate conversion/interpolation is plotting only. Exact rational financial
// meaning remains in the backend representation and lossless JSONL output.
const plotNumber=r=>Number(r.numerator)/Number(r.denominator);
const graph=g=>g===null?null:{knots:g.knots.map(k=>({underlyingPrice:plotNumber(k.underlyingPrice),value:plotNumber(k.terminalValue)})),rightSlope:plotNumber(g.rightTailSlope)};
const range=r=>r===null?'—':r.kind==='SHORT_STRIKE_INTERVAL'?`${r.lower}–${r.upper}`:r.direction==='AT_OR_ABOVE'?`≥${r.boundary}`:`≤${r.boundary}`;

// All domain conclusions are supplied by the backend. Sorting and formatting its
// published results do not infer membership, classify legs, or construct payoff.
export function renderLive(data,{accounts=[],tty=false,format,width,ascii=false,noColor=false,columns,env=process.env}={}) {
  if(format==='jsonl'||!tty&&format!=='table')return JSON.stringify(data)+'\n';
  const useAscii=ascii||env.TERM==='dumb';
  const positions=data.accounts.flatMap(snapshot=>snapshot.structures.map(p=>{
    const account=accounts.find(a=>a.id===snapshot.accountId),broker=account?.brokerAssociation?.broker??snapshot.snapshot?.observationContext?.broker;
    const refresh=snapshot.refreshReasons.length?(useAscii?' [refresh]':' ↻'):'';
    return {
      symbol:`${safe(known(p.underlying)?.symbol)} ${useAscii?'x':'×'}${known(p.units)??'—'}${p.membership.status==='ESTABLISHED'?'':p.membership.status==='CONFLICTING'?' !':' ?'}`,
      leadingCells:{BROKER:broker==='TASTYTRADE'?'tastytrade':'Fidelity',ACCOUNT:safe(account?.alias)+refresh,
        COLLATERAL:known(p.collateral)?.length?known(p.collateral).map(c=>c.kind==='SHARES'?`${grouped(c.quantity)} ${safe(c.symbol)}`:`${c.currency==='USD'?'$':safe(c.currency)+' '}${grouped(c.quantity)}`).join(' + '):'—'},
      leadingColors:{BROKER:broker==='TASTYTRADE'?'91':'32',ACCOUNT:account?'96':null,SPOT:'39',QUOTE:'39'},
      payoffGeometry:graph(known(p.payoff)),payoffUnavailableLabel:'—',rangeLabel:safe(range(known(p.range))),spot:{value:null,ageMs:null},
      dteLabel:p.remainingDte===null?'—':`${numericText(p.remainingDte)}d`,exitProgressLabel:'—',pnl:null,optionEvidence:{ageMs:null},market:{closeDebit:null},
      complexity:rawNumber(known(p.strategy)?.complexityRank??0),family:known(p.strategy)?.kind==='IRON_CONDOR'?0:1,openedAt:known(p.openingFillAt),sortSymbol:known(p.underlying)?.symbol??'',sortId:p.subjectId,
    };
  })).sort((a,b)=>b.complexity-a.complexity||a.family-b.family||(a.openedAt===null)-(b.openedAt===null)||
    (a.openedAt&&b.openedAt?Date.parse(a.openedAt)-Date.parse(b.openedAt):0)||a.sortSymbol.localeCompare(b.sortSymbol)||a.sortId.localeCompare(b.sortId));
  return renderPanel({positions},{
    color:!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb',ascii:useAscii,
    columns:width??columns??(Number(env.COLUMNS)||180),defaultForeground:true,
    leadingColumns:[{key:'BROKER'},{key:'ACCOUNT'}],subjectHeader:'CONTRACT',afterSubjectColumns:[{key:'COLLATERAL'}],
    heading:'ww live | retained open options',narrowFormat:'--jsonl',
    emptyMessage:'No unexpired option inventory returned; this does not establish broker-confirmed closes.',
    footerLines:data.accounts.filter(a=>a.availability==='NO_RETAINED_SNAPSHOT').map(a=>`Retained snapshot unavailable: ${safe(accounts.find(x=>x.id===a.accountId)?.alias)}`),
  });
}
