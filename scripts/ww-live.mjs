import { ShowError, humanShowNumber } from './ww-show.mjs';
import { positionRequest } from './ww-positions.mjs';
import { canonicalAccountId } from './ww-accounts.mjs';
import { renderPanel } from './tastytrade-live-render.mjs';

export const LIVE_HELP = `Usage: ww live [--account ACCOUNT] [--table | --jsonl] [--width COLUMNS] [--ascii] [--no-color]

Read retained open-option constructions from Wheelwright v2. No acquisition.
All authorized Accounts in one table; --account selects a nickname.
Backend owns membership, option-only scope, expiration exclusion, quantity, collateral,
terms and payoff. Unknowns remain —. Geometry is expiration intrinsic value before
opening premium, cost basis and fees; it is not current P/L or guaranteed execution.
Unrecognized options remain visible. Individual legs and close orders are not shown.
↻ means the backend found expired options in retained Fidelity evidence; not quote age.
Opening timestamps, qualified spot and management remain unavailable in this slice.

TTY default: table, BROKER and ACCOUNT first. Pipes: complete snapshot JSON Lines.
--table forces the human table. --jsonl preserves backend identities and qualifications.
--width 20..1000 overrides terminal width. --ascii / TERM=dumb uses ASCII unknowns.
--no-color / NO_COLOR / TERM=dumb disables color. Neutral text uses terminal foreground.
One read per invocation; no polling, brokerage access, or history read-through.
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
const numericText=value=>value==null?'—':JSON.isRawJSON(value)?humanShowNumber(value,'integer'):String(value);

export async function readOpenOptions(token,{account,...options}={}) {
  const data=await positionRequest(account,token,{...options,view:'open-options'});
  const bad=()=>{throw new ShowError('live: invalid backend open-option construction representation');};
  if(!Array.isArray(data.optionSnapshots))bad();
  const seen=new Set();
  const numeric=v=>JSON.isRawJSON(v)&&Number.isFinite(Number(v.rawJSON));
  for(const s of data.optionSnapshots) {
    if(!canonicalAccountId(s?.accountId)||seen.has(s.accountId)||account!==undefined&&s.accountId!==account||s.requestId!==data.requestId||
      !['FIDELITY','TASTYTRADE'].includes(s.broker)||typeof s.snapshotId!=='string'||!Array.isArray(s.positions)||
      !Array.isArray(s.refreshReasons)||!Array.isArray(s.qualifications)||!Number.isFinite(Date.parse(s.evaluatedAt)))bad();
    seen.add(s.accountId);const ids=new Set();
    for(const p of s.positions) {
      if(typeof p.positionId!=='string'||ids.has(p.positionId)||p.underlying!==null&&typeof p.underlying!=='string'||
        p.quantity!==null&&!numeric(p.quantity)||p.dte!==null&&!numeric(p.dte)||!numeric(p.complexity)||
        !Array.isArray(p.collateral)||!Array.isArray(p.qualifications)||!Array.isArray(p.holdingIds)||!Array.isArray(p.termsSources)||
        p.firstOpeningFillAt!==null&&!Number.isFinite(Date.parse(p.firstOpeningFillAt)))bad();
      ids.add(p.positionId);
      if(p.geometry!==null) {
        const g=p.geometry;
        if(g?.basis!=='GROSS_EXPIRATION_INTRINSIC_BEFORE_PREMIUM'||!Array.isArray(g.knots)||!g.knots.length||!numeric(g.leftSlope)||!numeric(g.rightSlope))bad();
        for(const [i,k] of g.knots.entries())if(!numeric(k.underlyingPrice)||!numeric(k.value)||i&&Number(k.underlyingPrice.rawJSON)<=Number(g.knots[i-1].underlyingPrice.rawJSON))bad();
      }
      if(p.range!==null&&(!['SHORT_STRIKE_INTERVAL','AT_OR_ABOVE_SHORT_STRIKE','AT_OR_BELOW_SHORT_STRIKE'].includes(p.range?.kind)||
        ![p.range.lower,p.range.upper].every(v=>v===null||numeric(v))))bad();
      for(const c of p.collateral)if(!['SHARES','CASH'].includes(c.kind)||!numeric(c.quantity)||c.symbol!==null&&typeof c.symbol!=='string')bad();
    }
  }
  if(account!==undefined&&data.optionSnapshots.length!==1)bad();
  return data.optionSnapshots;
}

const graphNumber=v=>JSON.isRawJSON(v)?Number(v.rawJSON):v;
const graph=g=>g===null?null:{...g,knots:g.knots.map(k=>({underlyingPrice:graphNumber(k.underlyingPrice),value:graphNumber(k.value)})),
  leftSlope:graphNumber(g.leftSlope),rightSlope:graphNumber(g.rightSlope)};
const range=r=>r===null?'—':r.kind==='SHORT_STRIKE_INTERVAL'?`${numericText(r.lower)}–${numericText(r.upper)}`:
  r.kind==='AT_OR_ABOVE_SHORT_STRIKE'?`≥${numericText(r.lower)}`:`≤${numericText(r.upper)}`;

// All domain conclusions are supplied by the backend. Sorting and formatting its
// published results do not infer membership, classify legs, or construct payoff.
export function renderLive(snapshots,{accounts=[],tty=false,format,width,ascii=false,noColor=false,columns,env=process.env}={}) {
  if(format==='jsonl'||!tty&&format!=='table')return snapshots.map(s=>JSON.stringify(s)+'\n').join('');
  const useAscii=ascii||env.TERM==='dumb';
  const positions=snapshots.flatMap(snapshot=>snapshot.positions.map(p=>{
    const account=accounts.find(a=>a.id===snapshot.accountId),broker=snapshot.broker;
    const refresh=snapshot.refreshReasons.length?(useAscii?' [refresh]':' ↻'):'';
    return {
      symbol:`${safe(p.underlying)} ${useAscii?'x':'×'}${numericText(p.quantity)}`,
      leadingCells:{BROKER:broker==='TASTYTRADE'?'tastytrade':'Fidelity',ACCOUNT:safe(account?.alias??snapshot.accountId)+refresh,
        COLLATERAL:p.collateral.length?p.collateral.map(c=>c.kind==='SHARES'?`${numericText(c.quantity)} ${safe(c.symbol)}`:`$${numericText(c.quantity)}`).join(' + '):'—'},
      leadingColors:{BROKER:broker==='TASTYTRADE'?'91':'32',ACCOUNT:account?'96':null},
      payoffGeometry:graph(p.geometry),payoffUnavailableLabel:'—',rangeLabel:range(p.range),spot:{value:null,ageMs:null},
      dteLabel:p.dte===null?'—':`${numericText(p.dte)}d`,exitProgressLabel:'—',pnl:null,optionEvidence:{ageMs:null},market:{closeDebit:null},
      complexity:graphNumber(p.complexity),openedAt:p.firstOpeningFillAt,sortSymbol:p.underlying??'',sortId:p.positionId,
    };
  })).sort((a,b)=>b.complexity-a.complexity||(a.openedAt===null)-(b.openedAt===null)||
    (a.openedAt&&b.openedAt?Date.parse(a.openedAt)-Date.parse(b.openedAt):0)||a.sortSymbol.localeCompare(b.sortSymbol)||a.sortId.localeCompare(b.sortId));
  return renderPanel({positions},{
    color:!noColor&&!Object.hasOwn(env,'NO_COLOR')&&env.TERM!=='dumb',ascii:useAscii,
    columns:width??columns??(Number(env.COLUMNS)||180),defaultForeground:true,
    leadingColumns:[{key:'BROKER'},{key:'ACCOUNT'}],subjectHeader:'CONTRACT',afterSubjectColumns:[{key:'COLLATERAL'}],
    minimumWidths:{DTE:3,'EXIT PROGRESS':13},heading:'ww live | retained open options',narrowFormat:'--jsonl',
    emptyMessage:'No unexpired option inventory returned; this does not establish broker-confirmed closes.',
  });
}
