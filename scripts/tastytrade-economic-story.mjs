// Transitional tt domain conclusions only. No I/O or presentation.
import { completedSession, usableEvidence } from './tastytrade-freshness.mjs';
const number = v => (typeof v === 'string' || typeof v === 'number') && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(v)) ? Number(v) : NaN;
const day = at => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
export function economicObjectives({credit,target,stopOrder,quantity,multiplier}) {
  const size = Number.isInteger(quantity) && quantity > 0 && Number.isFinite(multiplier) && multiplier > 0 ? quantity * multiplier : NaN;
  const trigger = number(stopOrder?.['stop-trigger']);
  const limit = number(stopOrder?.price);
  const profit = Number.isFinite(credit) && Number.isFinite(target) && target >= 0 && target < credit ? (credit-target)*size : null;
  // Trigger is activation; the limit is an execution constraint, not the loss boundary.
  const stopPnl = Number.isFinite(credit) && Number.isFinite(size) && size > 0 &&
    Number.isFinite(trigger) && limit >= trigger ? (credit-trigger)*size : null;
  const loss = stopPnl < 0 ? -stopPnl : null;
  return { stopThreshold: Number.isFinite(stopPnl) ? {
      grossPnl: stopPnl, closingDebit: trigger, limitDebit: limit,
      profitCapture: credit > 0 ? (credit-trigger)/credit : null,
      source: 'verified broker Stop Limit trigger', orderId: stopOrder.id,
    } : null,
    targetGrossProfit: Number.isFinite(profit) && profit > 0 ? profit : null,
    adverseExitLoss: Number.isFinite(loss) && loss > 0 ? loss : null,
    adverseSource: loss > 0 ? 'verified broker Stop Limit trigger' : null,
    adverseUnavailable: !Number.isFinite(credit) || !Number.isFinite(size) || size <= 0 ? 'opening or position size unavailable' : !stopOrder ? 'no verified stop' : !Number.isFinite(trigger) ? 'stop trigger unavailable' :
      trigger <= credit ? 'stop does not establish a loss boundary' : limit < trigger ? 'stop limit below trigger' : null };
}
export function recentEconomicMovement({legs,quotes,orders,openedAt,market,now,session}) {
  const unavailable = reason => ({direction:null,mode:'unavailable',reason});
  if (!Number.isFinite(openedAt) || market.stale || market.closeDebit === null) return unavailable('opening or valuation unavailable');
  const completed = completedSession(session,now);
  const openAt = Date.parse(session?.['open-at']);
  const closeAt = Date.parse(session?.['close-at']);
  const intraday = session?.state === 'Open' && now.getTime() >= openAt && now.getTime() < closeAt;
  if (!intraday && !completed) return unavailable('session comparison unavailable');
  const summary = day(intraday ? openAt : completed.close);
  let referenceDate, gain=0, deadband=0;
  // Any intervening closing fill prevents treating present membership as unchanged.
  if (orders.some(o=>o.status==='Filled' && o.legs?.some(l=>legs.some(h=>h.symbol===l.symbol) && /to Close$/.test(l.action) &&
      (!Array.isArray(l.fills) || !l.fills.length || l.fills.some(f=>!Number.isFinite(Date.parse(f['filled-at'])) || Date.parse(f['filled-at'])>=openedAt))))) {
    return unavailable('intervening closing fills');
  }
  for (const leg of legs) {
    const matches=quotes.filter(q=>q.symbol===leg.symbol);
    if(matches.length!==1)return unavailable('comparison quote missing or duplicated');
    const q=matches[0], at=Date.parse(q['updated-at']), ref=number(q['prev-close']);
    const date=q['prev-close-date'];
    // Regular is the broker's regular-session option close, not an asserted final settlement.
    if (!validDate(date) || date >= summary || q['summary-date']!==summary ||
        !['Regular','Final'].includes(q['prev-close-price-type']) || !Number.isFinite(ref) ||
        !usableEvidence(at,now,session) || day(at)!==summary || at<(intraday?openAt:completed.open)) return unavailable('dated option comparison unavailable');
    if(referenceDate && referenceDate!==date)return unavailable('mixed comparison sessions');
    referenceDate=date;
    const previousClose=Date.parse(session?.['previous-session']?.['close-at']);
    if (Number.isFinite(previousClose) && day(previousClose)===date ? openedAt>previousClose : day(openedAt)>=date) {
      return unavailable('position not established before comparison close');
    }
    if (intraday && (!Number.isFinite(previousClose) || day(previousClose)!==date)) return unavailable('prior-session linkage unavailable');
    const bid=number(q.bid),ask=number(q.ask),value=number(q[market.valuationSource==='broker mark'?'mark':'mid']);
    if(![bid,ask,value].every(Number.isFinite)||bid>ask||value<bid-1e-6||value>ask+1e-6)return unavailable('comparison valuation invalid');
    const size=leg.quantity*leg.multiplier;
    if (!Number.isInteger(leg.quantity) || leg.quantity<=0 || !Number.isFinite(leg.multiplier) || leg.multiplier<=0 || !Number.isFinite(size)) return unavailable('position size unavailable');
    gain+=(leg.direction==='Long'?1:-1)*(value-ref)*size;
    deadband+=(ask-bid)/2*size;
  }
  return {direction:Math.abs(gain)<=deadband+1e-8?null:gain>0?'improving':'deteriorating',
    mode:intraday?'intraday':'retained',change:gain,deadband,referenceDate,summaryDate:summary,
    source:`tastytrade dated prior option close / ${market.valuationSource}`};
}
