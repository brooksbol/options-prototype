import { SHOW_FIELDS, SHOW_FIELD_BY_NAME, SHOW_DEFAULT } from './ww-show-fields.mjs';
export { SHOW_FIELDS, SHOW_FIELD_BY_NAME };
export class ShowError extends Error { constructor(message,code=1){super(message);this.code=code;} }
const invalid = () => {throw new ShowError('show: invalid complete canonical observation');};
const full = (re,s) => typeof s==='string' && re.test(s);
const SUBJECT=/^[A-Z^][A-Z0-9.^/_-]{0,31}(?![\s\S])/;
const TOKEN=/^(?:[A-Z]|_5E)(?:[A-Z0-9.-]|_(?:2F|5E|5F)){0,31}(?![\s\S])/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![\s\S])/i;
export function encodePathSymbol(symbol){if(!full(SUBJECT,symbol))throw new ShowError('show: invalid canonical subject',2);const map={'/':'_2F','_':'_5F','^':'_5E'};return [...symbol].map(c=>map[c]??c).join('');}
export function decodePathSymbol(token){if(!full(TOKEN,token))throw new ShowError('show: invalid path token',2);let out='';const map={'2F':'/','5F':'_','5E':'^'};for(let i=0;i<token.length;){if(token[i]==='_'){out+=map[token.slice(i+1,i+3)];i+=3;}else out+=token[i++];}if(encodePathSymbol(out)!==token)throw new ShowError('show: noncanonical path token',2);return out;}
export function parseShow(args) {
 if(args.length===1&&['--help','-h'].includes(args[0]))return {help:true};
 if(args.length===1&&args[0]==='--man')return {man:true};
 if(args.length===1&&args[0]==='--fields')return {fields:true};
 let operands=false,quote=false,quotes=false,verbose=false,allFields=false;
 let format,only,sortBy,limit,absolute=false,descending=false;
 const symbols=[],where=[];
 const usage=()=>{throw new ShowError('show: invalid usage; see ww show --help',2);};
 for(let i=0;i<args.length;i++) {
  const a=args[i];
  if(!operands&&a==='--'){operands=true;continue;}
  if(!operands) {
   if(a==='--quote'){quote=true;continue;}
   if(a==='--quotes'){quotes=true;continue;}
   if(['--verbose','-v'].includes(a)){verbose=true;continue;}
   if(a==='--all-fields'){allFields=true;continue;}
   if(a==='--absolute'){absolute=true;continue;}
   if(a==='--descending'){descending=true;continue;}
   if(['--table','--tsv','--jsonl'].includes(a)) {
    const next=a.slice(2);if(format&&format!==next)usage();format=next;continue;
   }
   if(a==='--only') {
    if(only!==undefined)usage();const value=args[++i];if(typeof value!=='string')usage();
    only=value.split(',');if(only.some(f=>!SHOW_FIELD_BY_NAME.has(f)))usage();continue;
   }
   if(a==='--sort-by') {
    if(sortBy!==undefined)usage();sortBy=args[++i];if(!SHOW_FIELD_BY_NAME.has(sortBy))usage();continue;
   }
   if(a==='--limit') {
    if(limit!==undefined)usage();const value=args[++i];
    if(!full(/^[0-9]+(?![\s\S])/,value)||BigInt(value)<=0n)usage();limit=BigInt(value);continue;
   }
   if(a==='--where') {
    const value=args[++i];if(typeof value!=='string'||!value.includes('='))usage();
    const equals=value.indexOf('='),field=SHOW_FIELD_BY_NAME.get(value.slice(0,equals));
    if(!field)usage();const literal=value.slice(equals+1);
    try {
     if(field.valueType==='number'&&!full(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?![\s\S])/,literal))usage();
     if(field.valueType==='instant')time(literal);
     if(field.valueType==='date')date(literal);
    } catch {usage();}
    where.push({field:field.name,value:literal});continue;
   }
   if(a.startsWith('-'))usage();
  }
  if(!full(/^[A-Za-z^][A-Za-z0-9.^/_-]{0,31}(?![\s\S])/,a))usage();symbols.push(a.toUpperCase());
 }
 if(quotes?symbols.length:!symbols.length)usage();
 if(only&&(verbose||format==='jsonl'||allFields)||allFields&&verbose||format==='table'&&verbose)usage();
 if((absolute||descending)&&!sortBy||absolute&&SHOW_FIELD_BY_NAME.get(sortBy).valueType!=='number')usage();
 return {symbols:[...new Set(symbols)],quote,quotes,verbose,only,allFields,format,
  jsonl:format==='jsonl',where,sortBy,absolute,descending,limit};
}
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&!JSON.isRawJSON(v);
const escapeCell=s=>String(s).replace(/[\\\x00-\x1F\x7F]/g,c=>({'\\':'\\\\','\n':'\\n','\r':'\\r','\t':'\\t'}[c]??`\\u00${c.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')}`));
// Bounded strict JSON reader for show: duplicate keys rejected; numeric lexemes never pass through Number.
export function parseShowJson(text){
 let i=0;const bad=()=>{throw new ShowError('show: backend returned invalid JSON');};
 const ws=()=>{while(/[\x20\t\r\n]/.test(text[i]??'X'))i++;};
 function string(){const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"'){try{return JSON.parse(text.slice(start,i));}catch{bad();}}}bad();}
 function value(){ws();const c=text[i];if(c==='"')return string();if(c==='{'||c==='['){const array=c==='[', out=array?[]:Object.create(null);i++;ws();if(text[i]===(array?']':'}')){i++;return out;}for(;;){ws();if(array)out.push(value());else{if(text[i]!=='"')bad();const key=string();if(Object.hasOwn(out,key))bad();ws();if(text[i++]!==':')bad();out[key]=value();}ws();if(text[i]===(array?']':'}')){i++;return out;}if(text[i++]!==',')bad();}}
  for(const [literal,v] of [['null',null],['true',true],['false',false]])if(text.startsWith(literal,i)){i+=literal.length;return v;}
  const match=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));if(!match)bad();i+=match[0].length;try{return JSON.rawJSON(match[0]);}catch{bad();}
 }
 const out=value();ws();if(i!==text.length)bad();return out;
}
function numeric(v,nonnegative=false,integer=false){
 if(!JSON.isRawJSON(v))invalid();const s=v.rawJSON;const match=/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(s);if(!match)invalid();
 const digits=match[2]+(match[3]??''),zero=/^0+$/.test(digits);if(nonnegative&&match[1]&&!zero)invalid();
 if(integer&&!zero){const scale=BigInt((match[3]??'').length)-BigInt(match[4]??'0');if(scale>0n&&(scale>BigInt(digits.length)||!/^(?:0)*$/.test(digits.slice(-Number(scale)))))invalid();}
 return !zero&&!match[1];
}
function string(v){if(typeof v!=='string')invalid();return v;}
function date(v){string(v);const m=/^(\d{4})-(\d{2})-(\d{2})(?![\s\S])/.exec(v);if(!m)invalid();const [y,mo,d]=m.slice(1).map(Number),days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];if(mo<1||mo>12||d<1||d>days[mo-1])invalid();}
function time(v){string(v);const m=/^(\d{4}-\d{2}-\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z(?![\s\S])/.exec(v);if(!m)invalid();date(m[1]);if(m.slice(2).some((n,i)=>Number(n)>(i===0?23:59)))invalid();}
export function validateShowObservation(q,symbol){
 if(!object(q)||!full(UUID,q.observationId)||!object(q.subject)||q.subject.symbol!==symbol||!full(SUBJECT,q.subject.symbol)||!['EQUITY','ETF','INDEX','OTHER_UNDERLYING'].includes(q.subject.securityType)||!object(q.facts)||!object(q.provenance))invalid();
 const f=q.facts,p=q.provenance;let bearing=false;
 for(const name of ['last','bid','ask'])if(Object.hasOwn(f,name)){const side=f[name];if(!object(side)||!Object.hasOwn(side,'price'))invalid();bearing=numeric(side.price,true)||bearing;if(Object.hasOwn(side,'size'))numeric(side.size,true,true);if(name!=='last'&&Object.hasOwn(side,'venue'))string(side.venue);if(Object.hasOwn(side,'sourceEventAt'))time(side.sourceEventAt);}
 for(const name of ['open','high','low','close','previousClose','fiftyTwoWeekHigh','fiftyTwoWeekLow'])if(Object.hasOwn(f,name)){const positive=numeric(f[name],true);if(['open','high','low','close'].includes(name))bearing=positive||bearing;}
 for(const name of ['volume','averageVolume'])if(Object.hasOwn(f,name))numeric(f[name],true,true);
 for(const name of ['reportedChange','reportedChangePercent'])if(Object.hasOwn(f,name))numeric(f[name]);
 for(const name of ['description','exchange'])if(Object.hasOwn(f,name))string(f[name]);
 if(!bearing||!full(UUID,p.acquisitionId)||!string(p.provider).length||!string(p.authorityEpoch).length||!['PRODUCTION','SANDBOX'].includes(p.environment)||!['REGULAR_USABLE','PRE_MARKET','POST_MARKET','CLOSED','UNKNOWN'].includes(p.acquisitionPhase))invalid();
 time(p.receivedAt);time(p.committedAt);if(Object.hasOwn(p,'regularSessionDate'))date(p.regularSessionDate);if(Object.hasOwn(p,'feedIdentity'))string(p.feedIdentity);
 // Reconstruct declared public schema only; unknown additive backend data is not an internal-state dump.
 const out={observationId:q.observationId,subject:{symbol,securityType:q.subject.securityType==='OTHER_UNDERLYING'?'OTHER':q.subject.securityType},facts:{},provenance:{}};
 for(const key of ['last','bid','ask'])if(Object.hasOwn(f,key)){out.facts[key]={price:f[key].price};for(const k of ['size',...(key==='last'?[]:['venue']),'sourceEventAt'])if(Object.hasOwn(f[key],k))out.facts[key][k]=f[key][k];}
 for(const field of SHOW_FIELDS){const [root,key,third]=field.path.split('.');if((root==='facts'||root==='provenance')&&!third&&Object.hasOwn(q[root],key))out[root][key]=q[root][key];}
 return out;
}
export function showConfig(token,base=process.env.WW_BASE_URL??'http://localhost:3100'){
 if(typeof JSON.rawJSON!=='function'||typeof JSON.isRawJSON!=='function')throw new ShowError('show: runtime requires lossless JSON number support');
 if(typeof token!=='string'||!token.trim()||!full(/^[A-Za-z0-9._~+\/-]+=*(?![\s\S])/,token))throw new ShowError('show: WW_API_TOKEN must be a configured valid Bearer credential');
 let url;try{url=new URL('/v2/quotes/',base);}catch{throw new ShowError('WW_BASE_URL must be an HTTP(S) URL',2);}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new ShowError('WW_BASE_URL must be an HTTP(S) URL without credentials',2);
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new ShowError('show: HTTPS required outside loopback',2);
 return {token,url};
}
export async function readHeldQuote(symbol,{token,url},fetchImpl=fetch){
 const target=new URL(encodeURIComponent(encodePathSymbol(symbol)),url);let response;
 try{response=await fetchImpl(target,{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`}});}catch{throw new ShowError('show: Wheelwright request failed');}
 const correlation=response.headers.get('x-request-id');if(!full(UUID,correlation))throw new ShowError('show: invalid response correlation');
 const failure=s=>new ShowError(escapeCell(`show: ${s} (request ${correlation})`).replaceAll(token,'[REDACTED]'));
 let text;try{text=await response.text();}catch{throw failure('invalid/truncated response');}
 if(text.includes(token))throw failure('response contains credential');
 let q;try{q=parseShowJson(text);}catch{throw failure('invalid JSON response');}
 if(response.status!==200){
  const expected={401:['UNAUTHENTICATED','Unauthenticated'],403:['FORBIDDEN','Forbidden'],404:['NOT_FOUND','Not found'],422:['INVALID_REQUEST','Invalid request'],500:['INTERNAL_ERROR','Internal error'],503:['CAPABILITY_UNAVAILABLE','Capability unavailable']}[response.status];
  const optionalText=['detail','instance'].every(k=>!Object.hasOwn(q??{},k)||typeof q[k]==='string');
  const params=object(q)&&Object.hasOwn(q,'invalidParams')?Array.isArray(q.invalidParams)&&q.invalidParams.length>0&&q.invalidParams.every(p=>object(p)&&typeof p.name==='string'&&typeof p.reason==='string'):response.status!==422;
  if(!expected||!/^application\/problem\+json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!object(q)||q.code!==expected[0]||q.title!==expected[1]||q.type!==`urn:wheelwright:problem:${expected[0].toLowerCase()}`||q.requestId!==correlation||!JSON.isRawJSON(q.status)||Number(q.status.rawJSON)!==response.status||!optionalText||!params)throw failure('invalid Problem response');
  throw failure(`${q.code}: ${q.detail??q.title}`);
 }
 if(!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))throw failure('invalid response media type');
 try{return {observation:validateShowObservation(q,symbol),requestId:correlation,origin:target.origin.replaceAll(token,'[REDACTED]')};}catch{throw failure('invalid complete canonical observation');}
}
function localTime(v,verbose){const d=new Date(v),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],pad=n=>String(n).padStart(2,'0');if(!verbose)return `${months[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;const offset=-d.getTimezoneOffset(),fraction=/\.(\d+)Z$/.exec(v)?.[1];return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${fraction?'.'+fraction:''} ${offset<0?'-':'+'}${pad(Math.floor(Math.abs(offset)/60))}:${pad(Math.abs(offset)%60)}`;}
// Decimal keys retain arbitrary source precision/exponents without binary conversion or huge expansion.
function decimalParts(source) {
 const m=/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(source);
 let digits=(m[2]+(m[3]??'')).replace(/^0+/,'');
 if(!digits)return {sign:0,digits:'0',exponent:0n};
 let exponent=BigInt(m[4]??'0')-BigInt((m[3]??'').length);
 const trailing=/0+$/.exec(digits)?.[0].length??0;
 if(trailing){digits=digits.slice(0,-trailing);exponent+=BigInt(trailing);}
 return {sign:m[1]?-1:1,digits,exponent};
}
const ordinal=(a,b)=>a<b?-1:a>b?1:0;
function compareDecimal(a,b,absolute=false) {
 const as=absolute?Math.abs(a.sign):a.sign,bs=absolute?Math.abs(b.sign):b.sign;
 if(as!==bs)return ordinal(as,bs);if(as===0)return 0;
 const ao=BigInt(a.digits.length)+a.exponent,bo=BigInt(b.digits.length)+b.exponent;
 const magnitude=ordinal(ao,bo)||ordinal(a.digits.padEnd(Math.max(a.digits.length,b.digits.length),'0'),b.digits.padEnd(Math.max(a.digits.length,b.digits.length),'0'));
 return as*magnitude;
}
function instantParts(value) {
 const [clock,fraction='']=value.slice(0,-1).toUpperCase().split('.');
 return {clock,fraction:decimalParts('0.'+(fraction||'0'))};
}
function fieldKey(field,value) {
 if(field.valueType==='number')return decimalParts(JSON.isRawJSON(value)?value.rawJSON:value);
 if(field.valueType==='instant')return instantParts(value);
 return value;
}
function compareKey(field,a,b,absolute=false) {
 if(field.valueType==='number')return compareDecimal(a,b,absolute);
 if(field.valueType==='instant')return ordinal(a.clock,b.clock)||compareDecimal(a.fraction,b.fraction);
 return ordinal(a,b);
}
export function selectShowObservations(observations,{where=[],sortBy,absolute=false,descending=false,limit}={}) {
 const filters=where.map(({field,value})=>{const f=SHOW_FIELD_BY_NAME.get(field);return {field:f,key:fieldKey(f,value)};});
 let selected=observations.filter(q=>filters.every(({field,key})=>{
  const value=field.extract(q);return value!==undefined&&compareKey(field,fieldKey(field,value),key)===0;
 }));
 if(sortBy) {
  const field=SHOW_FIELD_BY_NAME.get(sortBy);
  selected=selected.map((q,index)=>{const v=field.extract(q);return {q,index,key:v===undefined?undefined:fieldKey(field,v)};})
   .sort((a,b)=>{
    if(a.key===undefined||b.key===undefined)return a.key===b.key?a.index-b.index:a.key===undefined?1:-1;
    return (descending?-1:1)*compareKey(field,a.key,b.key,absolute)||a.index-b.index;
   }).map(entry=>entry.q);
 }
 return limit!==undefined&&limit<BigInt(selected.length)?selected.slice(0,Number(limit)):selected;
}
function plainDecimal({digits,exponent}) {
 const position=BigInt(digits.length)+exponent;
 if(position<=0n)return '0.'+'0'.repeat(Number(-position))+digits;
 if(position>=BigInt(digits.length))return digits+'0'.repeat(Number(exponent));
 return digits.slice(0,Number(position))+'.'+digits.slice(Number(position));
}
function scientificDecimal({digits,exponent}) {
 const order=BigInt(digits.length)+exponent-1n;
 return digits[0]+(digits.length>1?'.'+digits.slice(1):'')+'e'+(order>=0n?'+':'')+order;
}
function roundDecimal(parts,targetExponent) {
 const cut=targetExponent-parts.exponent;
 if(cut<=0n)return parts;
 // The adaptive target always retains nonzero significant digits.
 const keep=parts.digits.length-Number(cut);
 let digits=parts.digits.slice(0,keep);
 if(parts.digits[keep]>='5')digits=(BigInt(digits)+1n).toString();
 return decimalParts((parts.sign<0?'-':'')+digits+'e'+targetExponent);
}
export function humanShowNumber(value,kind,verbose=false) {
 const source=value.rawJSON,parts=decimalParts(source);
 const signed=kind==='change'||kind==='percent',suffix=kind==='percent'?'%':'';
 if(parts.sign===0)return '0'+suffix;
 const prefix=parts.sign<0?'-':signed?'+':'';
 if(verbose)return (parts.sign>0&&signed?'+':'')+source+suffix;
 const order=BigInt(parts.digits.length)+parts.exponent-1n;
 if(kind==='integer') {
  const exact=order<=1000n?plainDecimal(parts):scientificDecimal(parts);
  return prefix+exact+suffix;
 }
 const scientific=order>=18n||order < -6n;
 const target=scientific||order < -2n?order-2n:-2n;
 const rounded=roundDecimal(parts,target);
 return prefix+(scientific?scientificDecimal(rounded):plainDecimal(rounded))+suffix;
}
function showFields({only,verbose,allFields}) {
 return only?only.map(n=>SHOW_FIELD_BY_NAME.get(n)):verbose||allFields?SHOW_FIELDS:SHOW_DEFAULT;
}
function humanMode({format,tty=false}) {return format==='table'||format!=='tsv'&&format!=='jsonl'&&tty;}
export function showColorEnabled(options,env=process.env) {
 return humanMode(options)&&!env.NO_COLOR&&env.TERM!=='dumb';
}
function colorShowCell(q,field,text,color) {
 if(!color||!['change','percent'].includes(field.kind))return text;
 const value=field.extract(q);if(value===undefined)return text;
 const sign=decimalParts(value.rawJSON).sign;
 return sign?`\x1b[${sign>0?'32':'31'}m${text}\x1b[39m`:text;
}
function showCells(q,fields,{verbose=false,allFields=false},human) {
 return fields.map(f=>{
  const v=f.extract(q);if(v===undefined)return human?'-':'';
  if(!human)return escapeCell(JSON.isRawJSON(v)?v.rawJSON:v);
  if(f.kind==='instant') {
   const local=localTime(v,verbose||allFields);
   return allFields&&!verbose?local.replace(/(\d{2}:\d{2}:\d{2})\.\d+ /,'$1 '):local;
  }
  if(JSON.isRawJSON(v))return humanShowNumber(v,f.kind,verbose);
  return escapeCell(v);
 });
}
export function presentShowRows(observations,options={}) {
 const {jsonl=false,format,verbose=false,header=true}=options;
 if(jsonl||format==='jsonl')return observations.map(q=>JSON.stringify(q)+'\n').join('');
 const fields=showFields(options),human=humanMode(options),color=showColorEnabled(options,options.env??process.env);
 if(!observations.length)return human&&options.emptyMessage?options.emptyMessage+'\n':'';
 const rows=observations.map(q=>showCells(q,fields,options,human));
 if(!human)return rows.map(row=>row.join('\t')+'\n').join('');
 if(verbose)return observations.map((q,i)=>`Subject ${escapeCell(q.subject.symbol)}\nFIELD                        VALUE\n`+fields.map((f,j)=>f.name.padEnd(28)+' '+colorShowCell(q,f,rows[i][j],color)).join('\n')+'\n').join('');
 const widths=fields.map(f=>Math.max(f.heading.length,8));
 for(const row of rows)row.forEach((v,i)=>widths[i]=Math.max(widths[i],v.length));
 const layout=(row,q)=>row.map((v,i)=>{
  const padded=q&&fields[i].valueType==='number'?v.padStart(widths[i]):v.padEnd(widths[i]);
  return q?colorShowCell(q,fields[i],padded,color):padded;
 }).join('  ').trimEnd();
 return (header?layout(fields.map(f=>f.heading))+'\n':'')+rows.map((row,i)=>layout(row,observations[i])+'\n').join('');
}
export function presentShow(q,options={}) {return presentShowRows([q],options);}
export function presentFields(tty=false){return (tty?'FIELD                        DESCRIPTION\n':'')+SHOW_FIELDS.map(f=>tty?f.name.padEnd(28)+' '+f.description:f.name+'\t'+f.description).join('\n')+'\n';}
