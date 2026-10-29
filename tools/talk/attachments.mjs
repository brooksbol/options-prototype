// Operator-selected transient image observations. No files, URLs, provider access or ingestion.
export const MAX_IMAGE_BYTES=4*1024*1024;
export function validateImageAttachment(value,{enabled=false}={}){
 if(value===undefined)return undefined;
 if(!enabled||!value||Object.keys(value).sort().join(',')!=='dataUrl,disclose,type'||value.disclose!==true||value.type!=='image/png'||typeof value.dataUrl!=='string')throw new Error('Image disclosure is unavailable or not authorized.');
 const prefix='data:image/png;base64,';if(!value.dataUrl.startsWith(prefix))throw new Error('Only selected PNG image content is accepted.');
 const encoded=value.dataUrl.slice(prefix.length),padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
 if(encoded.length>Math.ceil(MAX_IMAGE_BYTES/3)*4||encoded.length%4!==0||/[^A-Za-z0-9+/=]/.test(encoded)||encoded.indexOf('=')!==(padding?encoded.length-padding:-1))throw new Error('Invalid image content.');
 const bytes=Buffer.from(encoded,'base64');if(bytes.length<45||bytes.length>MAX_IMAGE_BYTES||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR')throw new Error('Invalid PNG image.');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(!width||!height||width>8192||height>8192||width*height>20000000)throw new Error('Image dimensions exceed limits.');
 return value.dataUrl;
}
export function withoutImages(value){
 if(Array.isArray(value))return value.map(withoutImages);
 if(!value||typeof value!=='object')return value;
 if(value.type==='input_image')return {type:'input_text',text:'[Operator-selected image removed after its turn; reattach to inspect visual details.]'};
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,withoutImages(v)]));
}
