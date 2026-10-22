// Inputs recovered from scripts/tastytrade-exit-render.test.mjs BUG-040.
// Financial expected outputs are deliberately NOT copied into this fixture.
import fs from 'node:fs';
import {sampleTrade} from '../../../scripts/tastytrade-fixtures.mjs';
const strikes=[['P',8.5],['P',9],['C',13],['C',13.5]];
const trade=sampleTrade('UNG','261127',strikes,[.1,.2,.19,.2],[.06,.075,.31,.345],.02,.3);
const at='2026-10-13T19:00:00Z';
const quotes=trade.quotes.map((q,i)=>({...q,bid:String([0,.01,.17,.27][i]),ask:String([.12,.14,.45,.42][i]),mark:String([.06,.075,.368142454,.345][i]),'updated-at':at}));
const fixture={synthetic:true,source:'scripts/tastytrade-exit-render.test.mjs BUG-040: observed quote values; synthetic account, opening, target, clocks and standard contract declarations',account:'5WX01234',now:'2026-10-13T19:01:00Z',holdings:trade.holdings,orders:[trade.opening,...trade.closing.orders],complexOrders:[trade.closing],quotes,contracts:trade.holdings.map((h,i)=>({symbol:h.symbol,right:strikes[i][0]==='P'?'PUT':'CALL',strike:String(strikes[i][1]),expiration:'2026-11-27',currency:'USD',exerciseStyle:'AMERICAN',settlement:'PHYSICAL',adjustment:'STANDARD',multiplier:h.multiplier,deliverableShares:h.multiplier,source:'SYNTHETIC_STANDARD_TERM_DECLARATION'}))};
fixture.instruments=fixture.contracts.map(c=>({symbol:c.symbol,'instrument-type':'Equity Option','underlying-symbol':'UNG','option-type':c.right==='PUT'?'P':'C','strike-price':c.strike,'expiration-date':c.expiration,'shares-per-contract':100,'option-chain-type':'Standard','exercise-style':'American'}));
fixture.spotQuotes=[{symbol:'UNG','instrument-type':'Equity',bid:'10.99',ask:'11.01',mid:'11',mark:'99','updated-at':'2026-10-13T18:59:30Z'}];
fs.writeFileSync(new URL('./fixtures/ung-mark-source.json' ,import.meta.url),JSON.stringify(fixture,null,2)+'\n');
