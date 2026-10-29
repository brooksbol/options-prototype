import test from'node:test';import assert from'node:assert/strict';import{usdDisplay}from'../ui/currency.js';
test('USD presentation rounds exact decimals to cents while leaving source values intact',()=>{
 for(const [source,expected]of [['-18.512','−$18.51'],['15.994','+$15.99'],['2.5','+$2.50'],['-37.006','−$37.01'],['1.995','+$2.00'],['-1.995','−$2.00'],['9007199254740993.995','+$9,007,199,254,740,994.00'],['0','$0.00']])assert.equal(usdDisplay(source,{signed:true}),expected);
 assert.equal(usdDisplay('NaN'),'—');assert.equal(usdDisplay(null),'—');
});
