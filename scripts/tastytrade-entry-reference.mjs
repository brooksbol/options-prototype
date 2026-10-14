// Bounded read-only DXLink historical snapshot; no cache, persistence or trading.
// Transport follows tastytrade-greeks.mjs. Use the completed minute BEFORE entry,
// never a live quote or the bar containing the fill (whose close can occur later).
export const ENTRY_CANDLE_SOURCE = 'tastytrade DXLink completed pre-entry 1m candle';
const FIELDS = ['eventType','eventSymbol','eventFlags','time','count','open','high','low','close'];
const minute = 60_000;
function endpoint(raw) {
  try { const u=new URL(raw);return u.protocol==='wss:' && u.hostname.endsWith('.dxfeed.com') &&
    !u.username && !u.password && !u.search && !u.hash; } catch { return false; }
}
export async function readEntryReferences({ requests, loadQuoteToken, WebSocketImpl=WebSocket,
  now=new Date(), timeoutMs=5_000 }) {
  if(!(now instanceof Date) || !Number.isFinite(now.getTime()) || !Array.isArray(requests) || !requests.length || requests.length>100 ||
      requests.some(r=>!r || !/^[A-Za-z0-9.]+$/.test(r.symbol) || !Number.isSafeInteger(r.openedAt) ||
        r.openedAt<=0 || r.openedAt>now.getTime()) || typeof loadQuoteToken!=='function')return [];
  let auth;
  try { auth=(await loadQuoteToken())?.data; } catch { return []; }
  if(typeof auth?.token!=='string' || !auth.token || !endpoint(auth['dxlink-url']))return [];
  const desired=[...new Map(requests.map(r=>[`${r.symbol}|${r.openedAt}`,
    {...r,barStart:Math.floor(r.openedAt/minute)*minute-minute}])).values()];
  const roots=[...new Set(desired.map(r=>r.symbol))];
  return new Promise(resolve=>{
    let socket,finished=false,subscribed=false,configured=false;
    const candles=new Map(),ended=new Set(),pending=new Set();
    const finish=()=>{
      if(finished)return;finished=true;clearTimeout(timer);try{socket?.close();}catch{}
      resolve(desired.flatMap(r=>{
        const c=candles.get(`${r.symbol}|${r.barStart}`);
        return c && ended.has(r.symbol) && !pending.has(r.symbol) ? [{symbol:r.symbol,openedAt:r.openedAt,
          value:c.close,barStart:c.time,barEnd:c.time+minute,source:ENTRY_CANDLE_SOURCE,
          priceType:'trade candle close',periodMs:minute}] : [];
      }));
    };
    const timer=setTimeout(finish,Math.max(1,Math.min(5_000,timeoutMs)));
    const send=m=>{if(!finished && socket?.readyState===1)socket.send(JSON.stringify(m));};
    try {
      socket=new WebSocketImpl(auth['dxlink-url']);
      socket.addEventListener('open',()=>send({type:'SETUP',channel:0,version:'0.1-DXF-JS/0.3.0',keepaliveTimeout:60,acceptKeepaliveTimeout:60}));
      socket.addEventListener('error',finish);socket.addEventListener('close',finish);
      socket.addEventListener('message',({data})=>{
        if(finished)return;let m;try{m=JSON.parse(data);}catch{return;}
        if(!m || typeof m!=='object')return;
        if(m.type==='AUTH_STATE' && m.state==='UNAUTHORIZED')send({type:'AUTH',channel:0,token:auth.token});
        else if(m.type==='AUTH_STATE' && m.state==='AUTHORIZED')send({type:'CHANNEL_REQUEST',channel:3,service:'FEED',parameters:{contract:'AUTO'}});
        else if(m.type==='CHANNEL_OPENED' && m.channel===3)send({type:'FEED_SETUP',channel:3,acceptAggregationPeriod:.1,acceptDataFormat:'COMPACT',acceptEventFields:{Candle:FIELDS}});
        else if(m.type==='FEED_CONFIG' && m.channel===3) {
          const fields=m.eventFields?.Candle;
          if(Array.isArray(fields)) {
            if(fields.join('|')!==FIELDS.join('|')){finish();return;}
            configured=true;
          }
          if(subscribed)return;subscribed=true;
          send({type:'FEED_SUBSCRIPTION',channel:3,reset:true,add:roots.map(symbol=>({type:'Candle',symbol:`${symbol}{=m}`,
            fromTime:Math.min(...desired.filter(r=>r.symbol===symbol).map(r=>r.barStart))}))});
        } else if(m.type==='FEED_DATA' && m.channel===3 && configured && Array.isArray(m.data)) {
          for(let i=0;i<m.data.length;i++) {
            if(m.data[i]!=='Candle' || !Array.isArray(m.data[i+1]))continue;
            const values=m.data[++i];if(values.length%FIELDS.length!==0){finish();return;}
            for(let offset=0;offset<values.length;offset+=FIELDS.length) {
              const [type,streamer,flags,time,count,open,high,low,close]=values.slice(offset,offset+FIELDS.length);
              const match=typeof streamer==='string' && /^([A-Za-z0-9.]+)\{=(?:1)?m\}$/.exec(streamer);
              if(type!=='Candle' || !match || !roots.includes(match[1]) || !Number.isInteger(flags) || flags<0 || flags>31)continue;
              const root=match[1];
              if(flags&4){ended.delete(root);for(const key of candles.keys())if(key.startsWith(root+'|'))candles.delete(key);}
              if(flags&1)pending.add(root);else pending.delete(root);
              const key=`${root}|${time}`;
              if(flags&2)candles.delete(key);
              else if(desired.some(r=>r.symbol===root && r.barStart===time) &&
                  [time,count,open,high,low,close].every(v=>typeof v==='number' && Number.isFinite(v)) &&
                  Number.isInteger(count) && count>0 && low>0 && low<=Math.min(open,close) && high>=Math.max(open,close))candles.set(key,{time,close});
              if(flags&8 || flags&16)ended.add(root);
            }
          }
          if(roots.every(r=>ended.has(r) && !pending.has(r)))finish();
        }
      });
    } catch { finish(); }
  });
}
