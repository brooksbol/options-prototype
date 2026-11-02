import test from'node:test';import assert from'node:assert/strict';import{usdDisplay}from'../ui/currency.js';
test('USD presentation rounds exact decimals to cents while leaving source values intact',()=>{
 for(const [source,expected]of [['-18.512','−$18.51'],['15.994','+$15.99'],['2.5','+$2.50'],['-37.006','−$37.01'],['1.995','+$2.00'],['-1.995','−$2.00'],['9007199254740993.995','+$9,007,199,254,740,994.00'],['0','$0.00']])assert.equal(usdDisplay(source,{signed:true}),expected);
 assert.equal(usdDisplay('NaN'),'—');assert.equal(usdDisplay(null),'—');
});
test('USD exponent source lexemes render ordinary currency without floating point loss',()=>{
 assert.equal(usdDisplay('3E+3'),'$3,000.00');assert.equal(usdDisplay('1.2345e2'),'$123.45');assert.equal(usdDisplay('-9.99e-3'),'−$0.01');assert.equal(usdDisplay('1e999999'),'—');
});
