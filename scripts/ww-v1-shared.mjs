// Node24 strips erasable TypeScript. Resolve only this accepted v1 pure graph's
// extensionless relative imports; never transpile/copy a second liquidity formula.
import {registerHooks} from 'node:module';
const root=new URL('../options-prototype/src/',import.meta.url).href;
const hook=registerHooks({resolve(specifier,context,next){
 if(context.parentURL?.startsWith(root)&&specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);
 return next(specifier,context);
}});
export const {buildSymbolLiquidity}=await import('../options-prototype/src/write-desk/symbol-liquidity.ts');
export const {symbolLiquidityCsv}=await import('../options-prototype/src/write-desk/symbol-liquidity-csv.ts');
export const {CALENDAR_2026}=await import('../options-prototype/src/market-session/trading-calendar.ts');
hook.deregister();
