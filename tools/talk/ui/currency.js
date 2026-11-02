// Presentation rounding only. Source decimals and backend totals remain unchanged.
export function usdDisplay(decimal,{signed=false}={}) {
 if(typeof decimal!=='string')return '—';
 const scientific=decimal.match(/^([-+]?)(\d+)(?:\.(\d+))?[eE]([-+]?\d+)$/);
 if(scientific){const exponent=Number(scientific[4]);if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>100)return '—';const digits=scientific[2]+(scientific[3]??''),point=scientific[2].length+exponent;decimal=scientific[1]+(point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point));}
 if(!/^[-+]?\d+(?:\.\d+)?$/.test(decimal))return '—';
 const negative=decimal.startsWith('-'),[whole,fraction='']=decimal.replace(/^[-+]/,'').split('.');
 let cents=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0').slice(0,2));
 if((fraction[2]??'0')>='5')cents++;
 const amount=(cents/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+(cents%100n).toString().padStart(2,'0');
 const nonzero=/[1-9]/.test(whole+fraction);
 return (negative&&nonzero?'−':signed&&nonzero?'+':'')+'$'+amount;
}
