import '../privacy.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {validateImageAttachment,withoutImages,MAX_IMAGE_BYTES} from '../attachments.mjs';
import {createConversation} from '../conversation.mjs';
import {egressBoundary} from '../privacy.mjs';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const attachment={type:'image/png',dataUrl:'data:image/png;base64,'+png,disclose:true};
test('explicit disclosure/profile, raster type, dimensions and size are checked without accepting paths or URLs',()=>{
 assert.equal(validateImageAttachment(attachment,{enabled:true}),attachment.dataUrl);
 for(const v of [{...attachment,disclose:false},{...attachment,type:'image/svg+xml'},{...attachment,dataUrl:'file:///private/image.png'},{...attachment,dataUrl:'https://example.invalid/image.png'},{...attachment,path:'/private/image.png'},{...attachment,dataUrl:'data:image/png;base64,'+'A'.repeat(MAX_IMAGE_BYTES*2)}])assert.throws(()=>validateImageAttachment(v,{enabled:true}));
 assert.throws(()=>validateImageAttachment(attachment));const huge=Buffer.from(png,'base64');huge.writeUInt32BE(9000,16);assert.throws(()=>validateImageAttachment({...attachment,dataUrl:'data:image/png;base64,'+huge.toString('base64')},{enabled:true}));
});
test('native SDK serializes image for this turn; local history and inspection copies remove pixels before a follow-up',async()=>{
 const requests=[];const boundary=egressBoundary(async(_url,init)=>{requests.push(JSON.parse(init.body));return new Response(JSON.stringify({id:'resp_image',object:'response',created_at:0,status:'completed',model:'synthetic',output:[{id:'msg_image',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'Operator image discussed as an observation.',annotations:[]}]}],usage:{input_tokens:1,output_tokens:1,total_tokens:2}}),{headers:{'Content-Type':'application/json'}});});
 const chat=createConversation({servers:[],apiKey:'synthetic',fetchImpl:boundary.fetch,allowImageAttachments:true});
 try{const r=await chat.send('Discuss this controlled image.',attachment);assert.ok(!r.error,JSON.stringify(r.failure));assert.ok(JSON.stringify(requests[0]).includes(attachment.dataUrl));assert.ok(!JSON.stringify(await chat.session.getItems()).includes(png));assert.ok(!JSON.stringify(boundary.requests).includes(png));assert.ok(!withoutImages(requests[0]).input.some(i=>i.content?.some(c=>c.type==='input_image')));
 await chat.send('What was the subject?');assert.ok(!JSON.stringify(requests[1]).includes(png));assert.match(JSON.stringify(requests[1]),/removed after its turn/);
 }finally{await chat.close();}
 const blocked=createConversation({servers:[],model:{},allowImageAttachments:true,accountMetadataOnly:true});await assert.rejects(blocked.send('Image',attachment),/unavailable/);
});

test('the full advertised4MiB payload validates in bounded space without nested-regex stack exhaustion',()=>{const bytes=Buffer.alloc(MAX_IMAGE_BYTES);Buffer.from(png,'base64').copy(bytes);const large={...attachment,dataUrl:'data:image/png;base64,'+bytes.toString('base64')};assert.equal(validateImageAttachment(large,{enabled:true}),large.dataUrl);for(const suffix of ['=AAA','AA=A','A==='])assert.throws(()=>validateImageAttachment({...attachment,dataUrl:'data:image/png;base64,'+suffix},{enabled:true}));});
