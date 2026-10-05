import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { readHeldQuotes, parseHeldQuotesResponse, presentHeldQuotes, escapeDiscoveryCell } from "./wheelwright.mjs";
import { TOKEN, REQUEST_ID, capture } from "./ww-fetch-fixtures.mjs";
const cli = new URL("./wheelwright.mjs",import.meta.url).pathname;
const ww = new URL("./ww",import.meta.url).pathname;
const pty = new URL("./ww-acceptance-pty.py",import.meta.url).pathname;
const item = (symbol="SPY") => ({observationId:"22222222-2222-4222-8222-222222222222",
  subject:{symbol,securityType:"ETF"},provenance:{provider:"tradier",environment:"SANDBOX",
  receivedAt:"2001-01-01T00:00:00.123456789Z",committedAt:"2001-01-01T00:00:01Z"}});
async function fixture(work) {
  const calls=[]; const state={status:200,body:{requestId:REQUEST_ID,items:[item("QQQ"),item()]}};
  const server=createServer(async(req,res)=>{
    let body=""; for await(const chunk of req) body+=chunk;
    calls.push({method:req.method,path:req.url,auth:req.headers.authorization,body});
    // Fail rather than providing acquisition or historical read-through routes.
    assert.equal(req.method,"GET");assert.equal(req.url,"/v2/quotes");assert.equal(body,"");
    res.statusCode=state.status;
    res.setHeader("Content-Type",state.status===200?"application/json":"application/problem+json");
    res.setHeader("X-Request-Id",REQUEST_ID);
    if(state.status===302)res.setHeader("Location","/forbidden-provider-route");
    res.end(typeof state.body==="string"?state.body:JSON.stringify(state.body));
  });
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const env={WW_BASE_URL:`http://127.0.0.1:${server.address().port}`,WW_API_TOKEN:TOKEN};
  const run=args=>capture([cli,...args],env);
  const terminal=async args=>JSON.parse((await capture([pty,ww,...args],env,"python3")).stdout);
  try{await work({calls,state,env,run,terminal});}
  finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
}
test("LQ15-18 terminal, TSV, JSONL and verbose are bounded discovery",async()=>fixture(async({calls,run,terminal})=>{
  const t=await terminal(["ls","quotes"]);assert.equal(t.status,0);assert.equal(t.stderr,"");
  for(const heading of ["Held canonical direct quotes","SYMBOL","TYPE","RECEIVED AT (UTC)","PROVIDER","ENVIRONMENT"])assert.ok(t.stdout.includes(heading));
  assert.ok(!t.stdout.includes("OBSERVATION ID"));
  const normal=await run(["ls","quotes"]);assert.equal(normal.status,0);assert.equal(normal.stderr,"");
  const expected=["QQQ","SPY"].map(s=>`${s}\tETF\t2001-01-01T00:00:00.123456789Z\ttradier\tSANDBOX\n`).join("");
  assert.equal(normal.stdout,expected);
  for(const flag of ["-v","--verbose"]){
    const v=await run(["ls","quotes",flag]);assert.equal(v.stdout,expected);assert.match(v.stderr,/From http:\/\/127/);assert.match(v.stderr,/ls quotes: 2 holdings/);
    const human=await terminal(["ls","quotes",flag]);assert.ok(human.stdout.includes("OBSERVATION ID"));assert.ok(human.stdout.includes("COMMITTED AT (UTC)"));
  }
  for(const tty of [false,true])for(const flags of [[],["-v"]]){
    const r=await (tty?terminal:run)(["ls","quotes","--jsonl",...flags]);assert.equal(r.status,0);
    assert.deepEqual(r.stdout.trim().split(/\r?\n/).map(JSON.parse),[item("QQQ"),item()]);
  }
  assert.equal(calls.length,10);assert.ok(calls.every(c=>c.auth===`Bearer ${TOKEN}`));
}));
test("LQ19 empty all modes, verbose count and no machine bytes",async()=>fixture(async({state,run,terminal})=>{
  state.body.items=[];
  for(const flags of [[],["-v"],["--jsonl"],["--jsonl","--verbose"]]){
    const r=await run(["ls","quotes",...flags]);assert.equal(r.status,0);assert.equal(r.stdout,"");
    const t=await terminal(["ls","quotes",...flags]);assert.equal(t.status,0);
    assert.equal(t.stdout,flags.includes("--jsonl")?"":"No canonical direct quotes held.\r\n");
    if(flags.includes("-v")||flags.includes("--verbose"))assert.match(r.stderr,/ls quotes: 0 holdings/);
  }
}));
test("LQ20 grammar and help reject before credentials/HTTP",async()=>fixture(async({calls,run})=>{
  for(const args of [["ls"],["ls","stocks"],["ls","quotes","SPY"],["ls","quotes","-q"],
    ["ls","quotes","--sort"],["ls","-v","quotes"],["ls","quotes","-v","--help"],["ls","other","--help"]]){
    const r=await run(args);assert.equal(r.status,2,args.join(" "));assert.equal(r.stdout,"");
  }
  for(const scope of [[],["quotes"]])for(const flag of ["--help","-h","--man"]){
    const r=await run(["ls",...scope,flag]);assert.equal(r.status,0);assert.ok(r.stdout.includes("ww ls quotes"));
  }
  assert.deepEqual(calls,[]);
}));
test("LQ21-22 request failures, redaction and redirect rejection",async()=>fixture(async({state,run,calls})=>{
  for(const status of [401,403,422,500,503]){
    state.status=status;state.body={code:"FAIL",detail:`secret ${TOKEN}\x1b[2J`,requestId:REQUEST_ID};
    const r=await run(["ls","quotes","-v"]);assert.equal(r.status,1);assert.equal(r.stdout,"");
    assert.ok(!r.stderr.includes(TOKEN));assert.ok(!r.stderr.includes("\x1b"));assert.match(r.stderr,/REDACTED/);
  }
  state.status=200;
  for(const body of ["{",{requestId:REQUEST_ID,items:[item(),item("QQQ")]},
    {requestId:REQUEST_ID,items:[{...item(),observationId:null}]},
    {requestId:REQUEST_ID,items:[{...item(),provenance:{...item().provenance,committedAt:"2001-02-30T00:00:00Z"}}]}]){
    state.body=body;const r=await run(["ls","quotes"]);assert.equal(r.status,1);assert.equal(r.stdout,"");
  }
  state.status=302;state.body={};const count=calls.length;
  const r=await run(["ls","quotes"]);assert.equal(r.status,1);assert.equal(calls.length,count+1);
}));
test("LQ16 escapes control characters once without changing JSONL",()=>{
  const weird=item();weird.provenance.provider="a\\b\tc\rd\ne\x1b\x00\x7f";
  const result={requestId:REQUEST_ID,items:[weird],wheelwrightOrigin:"http://localhost:3100"};
  assert.equal(escapeDiscoveryCell(weird.provenance.provider),"a\\\\b\\tc\\rd\\ne\\u001B\\u0000\\u007F");
  assert.equal(presentHeldQuotes(result).stdout.split("\n").length,2);
  assert.deepEqual(JSON.parse(presentHeldQuotes(result,{jsonl:true}).stdout),weird);
  assert.ok(!presentHeldQuotes(result,{tty:true}).stdout.includes("\x1b"));
});
test("configuration, transport, correlation and schema validation fail cleanly",async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;throw new Error(TOKEN);};
  for(const base of ["http://remote.example","https://user:password@example.test","not a url"])
    await assert.rejects(readHeldQuotes({token:TOKEN,base,fetchImpl}),e=>e.code===2);
  await assert.rejects(readHeldQuotes({token:"bad\nsecret",fetchImpl}),/WW_API_TOKEN/);assert.equal(calls,0);
  await assert.rejects(readHeldQuotes({token:TOKEN,fetchImpl}),e=>!e.message.includes(TOKEN));
  assert.throws(()=>parseHeldQuotesResponse({requestId:REQUEST_ID,items:[item()]},"different"));
  const extra={...item(),facts:{last:{price:42}}};
  assert.deepEqual(parseHeldQuotesResponse({requestId:REQUEST_ID,items:[extra]},REQUEST_ID).items,[item()]);
});
test("LQ23 large collection to head is a clean pipe, one GET only",async()=>fixture(async({state,env,calls})=>{
  state.body.items=Array.from({length:10000},(_,i)=>item(`S${String(i).padStart(5,"0")}`));
  const r=await capture(["-c",'set -o pipefail; "$WW_TEST_CLI" ls quotes | head -1'],{...env,WW_TEST_CLI:ww},"zsh");
  assert.equal(r.status,0);assert.equal(r.stderr,"");assert.equal(r.stdout.split("\n").length,2);assert.equal(calls.length,1);
}));

test("CF02-09,11-12 native Unix composition needs no adapter",async()=>fixture(async({env,calls})=>{
  const {mkdtemp,readFile,rm}=await import("node:fs/promises");
  const {tmpdir}=await import("node:os");const {join}=await import("node:path");
  const dir=await mkdtemp(join(tmpdir(),"ww-ls-compose-"));
  const shell=command=>capture(["-c",`set -o pipefail; ${command}`],{...env,WW_TEST_CLI:ww,WW_TEST_OUTPUT:join(dir,"holdings.tsv")},"zsh");
  try{
    const expected="QQQ\nSPY\n";
    for(const command of [
      '"$WW_TEST_CLI" ls quotes | cut -f1',
      '"$WW_TEST_CLI" ls quotes | awk -F "\\t" \'$5 == "SANDBOX" {print $1}\'',
      '"$WW_TEST_CLI" ls quotes | tee "$WW_TEST_OUTPUT" | cut -f1',
      'symbols=$("$WW_TEST_CLI" ls quotes | cut -f1); printf "%s\\n" "$symbols"',
    ]){const r=await shell(command);assert.equal(r.status,0);assert.equal(r.stdout,expected);assert.equal(r.stderr,"");}
    const count=await shell('"$WW_TEST_CLI" ls quotes | cut -f5 | sort | uniq -c');assert.equal(count.status,0);assert.match(count.stdout,/2 SANDBOX/);
    const selected=await shell('"$WW_TEST_CLI" ls quotes | rg "^SPY[[:space:]]"');assert.equal(selected.status,0);assert.ok(selected.stdout.startsWith("SPY\tETF\t"));
    const redirected=await shell('"$WW_TEST_CLI" ls quotes > "$WW_TEST_OUTPUT"');assert.equal(redirected.status,0);assert.equal(redirected.stdout,"");
    assert.equal((await readFile(join(dir,"holdings.tsv"),"utf8")).split("\n").length,3);
    const json=await shell('"$WW_TEST_CLI" ls quotes --jsonl | jq -r .subject.symbol');assert.equal(json.status,0);assert.equal(json.stdout,expected);
    assert.equal(calls.length,8);
  }finally{await rm(dir,{recursive:true,force:true});}
}));

test("missing credentials, private .env and grammar before credential loading",async()=>fixture(async({env,calls})=>{
  const {mkdtemp,mkdir,copyFile,writeFile,rm,realpath}=await import("node:fs/promises");
  const {tmpdir}=await import("node:os");const {join}=await import("node:path");
  const dir=await mkdtemp(join(tmpdir(),"ww-ls-private-"));
  const isolated=join(dir,"scripts","wheelwright.mjs");await mkdir(join(dir,"scripts"));await copyFile(cli,isolated);
  try{
    const actual=await realpath(isolated);
    const run=args=>capture([actual,...args],{...env,WW_API_TOKEN:""});
    const missing=await run(["ls","quotes"]);assert.equal(missing.status,1);assert.equal(missing.stdout,"");assert.equal(calls.length,0);
    await mkdir(join(dir,".env")); // Reading this would fail: usage must still precede it.
    const invalid=await run(["ls"]);assert.equal(invalid.status,2);assert.equal(calls.length,0);
    await rm(join(dir,".env"),{recursive:true});await writeFile(join(dir,".env"),`WW_API_TOKEN='${TOKEN}'\n`);
    const configured=await run(["ls","quotes"]);assert.equal(configured.status,0);assert.equal(calls.length,1);
    assert.ok(!configured.stdout.includes(TOKEN));assert.equal(configured.stderr,"");
  }finally{await rm(dir,{recursive:true,force:true});}
}));
