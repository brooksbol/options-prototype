import test from'node:test';import assert from'node:assert/strict';
import{temporalContext}from'../temporal-context.mjs';
import{createConversation}from'../conversation.mjs';
const options={operatorTimeZone:'America/Denver',marketTimeZone:'America/New_York'};
test('T1/T3/T4: explicit operator/market calendars resolve October29 today, October28 yesterday and October month-to-date',()=>{
 const value=temporalContext({...options,clock:()=>new Date('2026-10-29T14:11:00Z')});
 assert.equal(value.operator.date,'2026-10-29');assert.equal(value.operator.localTime,'08:11:00');assert.equal(value.market.localTime,'10:11:00');
 assert.deepEqual(value.operator.yesterday,{from:'2026-10-28',through:'2026-10-28'});
 assert.deepEqual(value.operator.monthToDate,{from:'2026-10-01',through:'2026-10-29',cutoffAt:'2026-10-29T14:11:00.000Z'});
});
test('T2/T5: same conversation receives a fresh trusted clock across local midnight, independent of old source/history dates',async()=>{
 let now='2026-10-30T05:59:00Z';const requests=[];
 const chat=createConversation({...options,clock:()=>new Date(now),servers:[],model:{async getResponse(request){requests.push(request);return {output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Qualified response.'}]}],usage:{inputTokens:1,outputTokens:1,totalTokens:2}};}}});
 await chat.send('The retained source says October27. What happened today?');now='2026-10-30T06:01:00Z';await chat.send('What happened today?');
 const first=requests[0].systemInstructions,last=requests[1].systemInstructions;
 assert.match(first,/"date":"2026-10-29"/);assert.match(first,/"calendarDatesDiffer":true/);
 assert.match(last,/"date":"2026-10-30"/);assert.doesNotMatch(last,/"date":"2026-10-29"/);
 assert.match(last,/never a retained source date/);assert.equal(requests[1].input.filter(i=>i.role==='user').length,2);
});
test('invalid trusted clock/zone fails rather than silently supplying a stale default',()=>{
 assert.throws(()=>temporalContext({...options,clock:()=>new Date('invalid')}));assert.throws(()=>temporalContext({...options,operatorTimeZone:'invalid-zone'}));
});
