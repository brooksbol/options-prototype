import test from "node:test";
import assert from "node:assert/strict";
import { stripVTControlCharacters as strip } from "node:util";
import { renderLive, projectLive } from "./tastytrade-live.mjs";
import { cellWidth, renderPanel } from "./tastytrade-live-render.mjs";
import { sampleTrade, ewz, xle, liveEvidence as evidence } from "./tastytrade-fixtures.mjs";
import { main, parseCommand } from "./tastytrade.mjs";
const spot = (symbol="EWZ",at="2026-10-01T01:59:00Z") => ({symbol,"instrument-type":"Equity",bid:"39.59",ask:"39.61",mid:"39.60","updated-at":at});
const output = (extra={}) => renderLive({...evidence,spotQuotes:[spot()],...extra});
const lines = s => strip(s).trim().split("\n");

test("approved columns align, financial values right-align, static references stay neutral",()=>{
  const plain=output(), colored=output({color:true});
  assert.deepEqual(lines(plain)[1].trim().split(/\s+/),["SYMBOL","PAYOFF","EXP","QTY","DTE","EXIT","P50","EXIT","DTE","OPEN","NOW","TARGET","P/L","SPOT","QUOTE"]);
  const [_,header,row] = lines(plain);
  assert.equal(row.indexOf("0.42")+4,header.indexOf("OPEN")+4);
  assert.match(row,/────●──────\s+\+43%\s+— no rule\s+0.42\s+0.33\s+0.21\s+\+\$9\s+39.60\s+1m\s+2h/);
  assert.equal(strip(colored),plain); assert.match(colored,/\x1b\[92m\+\$9\x1b\[97m/);
  assert.doesNotMatch(colored,/\x1b\[92m0\.21/);
  assert.equal(lines(plain).length,4); // Account, headings, two positions; no bottom legend.
  assert.match(plain,/Account XXXX1234/); assert.doesNotMatch(plain,/5WX01234/);
});

test("twenty rows fit 157/189 cells with stable column starts and no block characters",()=>{
  const trades=Array.from({length:20},(_,i)=>sampleTrade(`T${i}`,"261120",[["P",31],["P",32],["C",42],["C",43]],[.52,.71,1.11,.88],[.45,.65,.75,.62],.21,.53));
  const data={...evidence,holdings:trades.flatMap(t=>t.holdings),orders:trades.flatMap(t=>[t.opening,...t.closing.orders]),complexOrders:trades.map(t=>t.closing),quotes:trades.flatMap(t=>t.quotes)};
  for(const columns of [157,189]) {
    const out=renderLive({...data,columns,color:true}); const ls=lines(out);
    assert.equal(ls.filter(l=>/^T\d+\s/.test(l)).length,20);
    assert.ok(ls.every(l=>cellWidth(l)<columns)); assert.ok(ls.length<=25);
    assert.doesNotMatch(out,/[\u2580-\u259f]/);
  }
});

test("narrow layouts are deliberate; extreme values are never truncated",()=>{
  for(const columns of [100,80,20]) {
    const out=output({columns}); assert.ok(lines(out).every(l=>cellWidth(l)<columns));
    assert.match(out,columns===20?/positions.*not|not.*displayed/s:/narrow view|not displayed/);
  }
  const p=projectLive(evidence); p.positions[0].pnl=123456789012345;
  const out=renderPanel(p,{columns:157});
  assert.match(out,/123,456,789,012,345|not displayed/);
});

test("cell widths ignore ANSI, combining marks and count wide graphemes",()=>{
  assert.equal(cellWidth("\x1b[31m▼╱‾\x1b[0m"),3);
  assert.equal(cellWidth("e\u0301"),1); assert.equal(cellWidth("界"),2); assert.equal(cellWidth("👩‍💻"),2);
});

test("spot requires a unique equity midpoint inside validated bid/ask and an observation timestamp",()=>{
  assert.equal(projectLive({...evidence,spotQuotes:[spot()]}).positions[0].spot.value,39.6);
  for(const q of [{...spot(),mid:null},{...spot(),bid:"40"},{...spot(),mid:"40"},
    {...spot(),"updated-at":"bad"},{...spot(),"updated-at":"2026-10-02T00:00:00Z"},
    {...spot(),"instrument-type":"Index"}]) {
    assert.equal(projectLive({...evidence,spotQuotes:[q]}).positions[0].spot.value,null);
  }
  assert.equal(projectLive({...evidence,spotQuotes:[spot(),spot()]}).positions[0].spot.value,null);
});

test("stale spot does not hide option economics; stale options do not hide spot",()=>{
  let out=output({spotQuotes:[spot("EWZ","2026-09-30T12:00:00Z")]});
  assert.match(out,/EWZ.*\+\$9.*39.60\s+14h!\s+2h/);
  const quotes=evidence.quotes.map(q=>({...q,"updated-at":"2026-09-30T12:00:00Z"}));
  out=output({quotes}); assert.match(out,/EWZ.*—\s+— no rule\s+0.42\s+—!\s+0.21\s+—\s+39.60\s+1m\s+14h/);
});

test("retained options and spot carry independent ages, including immediately after close",()=>{
  const session={state:"Closed","previous-session":{"open-at":"2026-10-09T13:30:00Z","close-at":"2026-10-09T20:00:00Z"},"next-session":{"open-at":"2026-10-12T13:30:00Z"}};
  const quotes=evidence.quotes.map(q=>({...q,"updated-at":"2026-10-09T20:00:00Z"}));
  for(const now of [new Date("2026-10-11T14:00:00Z"),new Date("2026-10-09T20:01:00Z")]) {
    const out=output({session,quotes,now,spotQuotes:[spot("EWZ","2026-10-09T20:00:00Z")]});
    assert.match(out,now.getUTCDay()===0 ? /39.60\s+42hr\s+42h/ : /39.60\s+1mr\s+1m/); assert.doesNotMatch(out,/official|live quote/);
  }
});

test("arbitrary targets are LIMIT, transitions T, midpoint crossing marked still held",()=>{
  const target={...ewz.closing.orders[0],price:"0.20",status:"Contingent"};
  const data={...evidence,orders:evidence.orders.map(o=>o.id===target.id?target:o),complexOrders:[{...ewz.closing,orders:[target,ewz.closing.orders[1]]},xle.closing]};
  assert.match(renderLive(data),/EWZ.*LIMIT.* T/);
  assert.match(renderLive({...data,format:"tsv"}),/exit transition: target Contingent, stop Received/);
  const quotes=evidence.quotes.map(q=>q.symbol===xle.holdings[2].symbol?{...q,bid:"0.28",ask:"0.30",mid:"0.29"}:q);
  assert.match(output({quotes}),/XLE.*\+111%~/); assert.match(output(),/XLE.*−144%/);
  assert.doesNotMatch(output(),/D21/);
});

test("price precision is retained; ASCII monochrome has no Unicode or escape bytes",()=>{
  const out=output({ascii:true}); assert.doesNotMatch(out,/[^\x00-\x7f]/);
  const q={...spot(),bid:"39.59",ask:"39.62",mid:"39.605"};
  assert.match(output({spotQuotes:[q]}),/39.605/);
  assert.deepEqual(parseCommand(["live","--width","157","--no-color","--ascii"]),{kind:"live",width:157,noColor:true,ascii:true});
  for(const width of ["19","-1","abc","1001"])
    assert.throws(()=>parseCommand(["live","--width",width]),/Invalid/);
});

test("acquisition requests broker equity mid separately; TSV makes no new reads; failure stays unknown",async()=>{
  for(const [tsv,fail] of [[false,false],[true,false],[false,true]]) {
    const calls=[], out=[], errors=[];
    const code=await main(["live","--account","5WX01234",...(tsv?["--tsv"]:[])],{
      env:{TASTYTRADE_CLIENT_ID:"x",TASTYTRADE_CLIENT_SECRET:"x",TASTYTRADE_REFRESH_TOKEN:"x",NO_COLOR:"1"},
      now:()=>evidence.now,terminalColumns:()=>157,out:s=>out.push(s),err:s=>errors.push(s),
      fetchImpl:async(url)=>{
        calls.push(url); let body;
        if(url.endsWith("/oauth/token")) body={access_token:"x"};
        else if(url.endsWith("/positions")) body={data:{items:evidence.holdings}};
        else if(url.includes("/complex-orders?")) body={data:{items:evidence.complexOrders},pagination:{"page-offset":0,"total-pages":1,"total-items":2}};
        else if(url.includes("/orders?")) body={data:{items:evidence.orders},pagination:{"page-offset":0,"total-pages":1,"total-items":evidence.orders.length}};
        else if(url.includes("equity-option[]=")) body={data:{items:evidence.quotes}};
        else if(url.includes("equity[]=")) {if(fail)throw Error("no spot");body={data:{items:[spot()]}};}
        else if(url.includes("/instruments/equity-options?")) body={data:{items:[]}};
        else if(url.endsWith("/sessions/current")) body={data:{state:"Open"}};
        else throw Error("unexpected");
        return {ok:true,json:async()=>body};
      }
    });
    assert.equal(code,0,errors.join()); assert.equal(calls.some(u=>u.includes("equity[]=")),!tsv);
    assert.doesNotMatch(out[0],/\x1b\[/);
    if(!tsv)assert.match(out[0],fail?/—\s+—\s+2h/:/39.60/);
  }
});
