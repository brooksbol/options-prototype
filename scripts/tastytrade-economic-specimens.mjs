#!/usr/bin/env node
// Deterministic Product review: no credentials, broker access, or trading capability.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectLive} from './tastytrade-live.mjs';
import {renderPanel,exitTrack} from './tastytrade-live-render.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/tt-live-economic-observed.json',import.meta.url)));
export const observedEvidence = () => ({...structuredClone(fixture),now:new Date(fixture.now)});
export function specimens({showPnl=false,ascii=false,color=false,scenarios=false}={}) {
 const projection=projectLive(observedEvidence());
 if(!scenarios)return `Captured read-only broker evidence: ${fixture.now}\n`+renderPanel(projection,{showPnl,ascii,color,columns:157});
 // Explicit hypothetical states on XLF's verified $5 profit / $1 loss scale.
 // This grid exercises presentation; the observed panel above remains unaltered.
 const xlf=projection.positions.find(p=>p.symbol==='XLF');
 const cases=[['Opening breakeven',0,null],['Small loss',-.1,null],['Small profit',.1,null],
 ['Material adverse',-.75,null],['Losing / improving',-.25,'improving'],['Losing / deteriorating',-.25,'deteriorating'],
 ['Profit / improving',2.5,'improving'],['Profit / deteriorating',2.5,'deteriorating'],
 ['Near profit target',4.5,'improving'],['Profit target reached',5,null],['Beyond profit target',6,null],
 ['Adverse reached',-1,null],['Adverse exceeded',-2,null],['Retained improvement',-.25,'improving','retained'],
 ['No adverse objective',-.25,null,'intraday','loss'],['Gain stop / below',1,null,'intraday','gain'],['Gain stop / above',5,null,'intraday','gain'],['Gain stop / same slot',3,null,'intraday','gain'],['No profit objective',.25,null,'intraday','profit'],['No valuation',null,null]];
 const rows=cases.map(([name,pnl,direction,mode='intraday',missing])=>{
   const p={...xlf,pnl,recentMovement:{direction,mode},economicObjectives:{...xlf.economicObjectives}};
   if(missing==='loss'){p.economicObjectives.adverseExitLoss=null;p.economicObjectives.stopThreshold=null;}
   if(missing==='gain'){p.profitCapture=7/9;p.economicObjectives={targetGrossProfit:7,adverseExitLoss:null,stopThreshold:{grossPnl:3,profitCapture:1/3}};}
   if(missing==='profit')p.economicObjectives.targetGrossProfit=null;
   return {name,pnl,p};
 });
 return 'Hypothetical presentation states; XLF $5 target / -$1 stop; gain-stop cases use UNG $3 stop / $7 target.\n'+
  `STATE                   EXIT PROGRESS${showPnl?'                         P/L':''}\n`+
  rows.map(({name,pnl,p})=>name.padEnd(24)+exitTrack(p,{ascii,color})+
    (showPnl?` ${pnl===null?'?':`${pnl<0?'-':'+'}$${Math.abs(pnl).toFixed(2)}`.padStart(8)}`:'')).join('\n')+'\n';
}
const args=process.argv.slice(2);
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const options={showPnl:args.includes('--with-pnl'),ascii:args.includes('--ascii'),color:args.includes('--color'),scenarios:args.includes('--scenarios')};
 if(args.includes('--write')){
  const directory=new URL('../docs/design/tt-live-economic-story/specimens/',import.meta.url);mkdirSync(directory,{recursive:true});
  for(const showPnl of [true,false])for(const ascii of [true,false])for(const color of [true,false])for(const scenarios of [true,false]){
   const name=`${scenarios?'scenarios':'observed'}-${showPnl?'A-with-pnl':'B-without-pnl'}-${ascii?'ascii':'unicode'}.${color?'ansi':'txt'}`;
   writeFileSync(new URL(name,directory),specimens({showPnl,ascii,color,scenarios}));
  }
 }else process.stdout.write(specimens(options));
}
