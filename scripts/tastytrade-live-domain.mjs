// Trading projection for tt only: recognition, economics and evidence validity. No terminal rendering or I/O.
import { usableEvidence, retainedSessionLabel, completedSession } from "./tastytrade-freshness.mjs";

export class LiveError extends Error {}

function fail(reason) { throw new LiveError(`Live: ${reason}; use tt positions for broker evidence`); }
function decimal(value) {
  if ((typeof value !== "string" && typeof value !== "number") ||
      !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(value))) return NaN;
  return Number(value);
}
function midpointPrice(value) { return value.toFixed(3).replace(/0$/, ""); }
export function maskAccount(account) {
  if (typeof account !== "string" || !/^[A-Za-z0-9]{4,}$/.test(account)) fail("account identity malformed");
  return `${"X".repeat(account.length - 4)}${account.slice(-4)}`;
}
function dayInNewYork(date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric",
    month: "2-digit", day: "2-digit" }).formatToParts(date);
  const field = (type) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(field("year"), field("month") - 1, field("day"));
}
function monthDayInNewYork(date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "2-digit",
    day: "2-digit" }).format(date);
}
function sameLegs(orderLegs, held, opening) {
  if (!Array.isArray(orderLegs) || orderLegs.length !== held.length) return false;
  const expected = held.map((leg) => `${leg.symbol}|${leg.quantity}|${opening ?
    (leg.direction === "Long" ? "Buy to Open" : "Sell to Open") :
    (leg.direction === "Long" ? "Sell to Close" : "Buy to Close")}`).sort();
  const actual = orderLegs.map((leg) => `${leg?.symbol}|${decimal(leg?.quantity)}|${leg?.action}`).sort();
  return expected.every((key, index) => key === actual[index]);
}

function openingCredit(opening, held, quantity) {
  let credit = 0; let openedAt = -Infinity;
  for (const leg of held) {
    const orderLeg = opening.legs.find((item) => item.symbol === leg.symbol);
    if (!Array.isArray(orderLeg?.fills) || orderLeg.fills.length === 0) fail("opening fill evidence incomplete");
    let filled = 0; let paid = 0;
    for (const fill of orderLeg.fills) {
      const n = decimal(fill?.quantity); const p = decimal(fill?.["fill-price"]);
      const at = typeof fill?.["filled-at"] === "string" ? Date.parse(fill["filled-at"]) : NaN;
      if (!Number.isInteger(n) || n <= 0 || !Number.isFinite(p) || !Number.isFinite(at)) {
        fail("opening fill evidence malformed");
      }
      filled += n; paid += n * p;
      openedAt = Math.max(openedAt, at);
    }
    if (filled !== quantity) fail("opening fill quantity differs from live holding");
    credit += (leg.direction === "Short" ? 1 : -1) * paid / quantity;
  }
  if (credit <= 0) fail("opening trade is not a supported credit package");
  return { credit, openedAt };
}

function recognizeHeldTrade(items) {
  // The trade has a general leg collection; only the observed, clean iron-condor shape is named here.
  if (items.length !== 4 || items.some((item) => item?.["instrument-type"] !== "Equity Option")) {
    fail("unsupported or ambiguous held trade");
  }
  const quantity = decimal(items[0].quantity);
  const multiplier = decimal(items[0].multiplier);
  const expiry = items[0]["expires-at"];
  if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(multiplier) || multiplier <= 0 ||
      !Number.isFinite(Date.parse(expiry)) || items.some((item) =>
        decimal(item.quantity) !== quantity || decimal(item.multiplier) !== multiplier ||
        item["expires-at"] !== expiry || !["Long", "Short"].includes(item["quantity-direction"]))) {
    fail("unsupported or ambiguous held trade");
  }
  const legs = items.map((item) => ({ symbol: item.symbol, quantity,
    direction: item["quantity-direction"], expiry }));
  if (new Set(legs.map((leg) => leg.symbol)).size !== 4) fail("overlapping held contracts are ambiguous");
  const parsed = legs.map((leg) => ({ ...leg, match: /^([A-Za-z0-9.]+)\s+(\d{6})([CP])(\d{8})$/.exec(leg.symbol) }));
  if (parsed.some((leg) => !leg.match) || new Set(parsed.map((leg) => leg.match[1])).size !== 1 ||
      new Set(parsed.map((leg) => leg.match[2])).size !== 1) fail("unsupported option contract shape");
  const calls = parsed.filter((leg) => leg.match[3] === "C").sort((a, b) => Number(a.match[4]) - Number(b.match[4]));
  const puts = parsed.filter((leg) => leg.match[3] === "P").sort((a, b) => Number(a.match[4]) - Number(b.match[4]));
  if (calls.length !== 2 || puts.length !== 2 ||
      puts[0].direction !== "Long" || puts[1].direction !== "Short" ||
      calls[0].direction !== "Short" || calls[1].direction !== "Long" ||
      Number(puts[1].match[4]) >= Number(calls[0].match[4])) fail("unsupported or ambiguous held trade");
  return { legs, quantity, multiplier, expiry, symbol: parsed[0].match[1], label: "Iron Condor" };
}

function matchingExit(complexOrders, orders, held) {
  const terminal = new Set(["Filled", "Cancelled", "Rejected", "Expired"]);
  const current = new Set(["Received", "Routed", "In Flight", "Contingent", "Live",
    "Cancel Requested", "Replace Requested"]);
  const candidates = [];
  for (const group of complexOrders) {
    if (!Array.isArray(group?.orders)) fail("malformed complex-order evidence");
    const matching = group.orders.filter((order) => !terminal.has(order?.status) && sameLegs(order?.legs, held, false));
    const targets = matching.filter((order) => order["order-type"] === "Limit" &&
      order["price-effect"] === "Debit" && Number.isFinite(decimal(order.price)));
    const stops = matching.filter((order) => order["order-type"] === "Stop Limit" &&
      order["price-effect"] === "Debit" && Number.isFinite(decimal(order.price)));
    if (targets.length === 1 && stops.length === 1 && matching.length === 2 &&
        ["OCO", "OTOCO"].includes(group.type)) candidates.push({ target: targets[0], stop: stops[0] });
  }
  if (candidates.length !== 1) fail("current target/stop order linkage is missing or ambiguous");
  if (![candidates[0].target.status, candidates[0].stop.status].every((status) => current.has(status))) {
    fail("unrecognized current order status");
  }
  const expectedIds = new Set([String(candidates[0].target.id), String(candidates[0].stop.id)]);
  if (expectedIds.size !== 2 || expectedIds.has("undefined")) fail("current exit order identity is malformed");
  const currentClosing = orders.filter((order) => current.has(order?.status) && sameLegs(order?.legs, held, false));
  if (currentClosing.length !== 2 || currentClosing.some((order) => !expectedIds.has(String(order.id)))) {
    fail("additional or missing current closing orders make management ambiguous");
  }
  for (const component of [candidates[0].target, candidates[0].stop]) {
    const broad = currentClosing.find((order) => String(order.id) === String(component.id));
    if (broad?.status !== component.status || broad?.["order-type"] !== component["order-type"] ||
        decimal(broad?.price) !== decimal(component.price)) fail("order evidence changed between reads");
  }
  return candidates[0];
}

function quoteEconomics(quotes, held, now, session) {
  let closeDebit = 0; let dayGain = 0; let dayReferenceComplete = true; let oldest = Infinity;
  let markDebit = 0; let markDayGain = 0; let marksComplete = true;
  let stale = false;
  for (const leg of held) {
    const matches = quotes.filter((quote) => quote?.symbol === leg.symbol);
    if (matches.length !== 1) fail("quote evidence missing or duplicated");
    const quote = matches[0];
    const bid = decimal(quote.bid); const ask = decimal(quote.ask); const mid = decimal(quote.mid);
    const at = Date.parse(quote["updated-at"]);
    if (![bid, ask, mid, at].every(Number.isFinite) || bid > ask || mid < bid - 0.000001 ||
        mid > ask + 0.000001 || at > now.getTime() + 60_000) fail("quote evidence malformed");
    closeDebit += (leg.direction === "Short" ? 1 : -1) * mid;
    const mark = decimal(quote.mark);
    const markValid = Number.isFinite(mark) && mark >= bid - 0.000001 && mark <= ask + 0.000001;
    marksComplete &&= markValid;
    if (markValid) markDebit += (leg.direction === "Short" ? 1 : -1) * mark;
    const reference = decimal(leg.dayClose);
    if (Number.isFinite(reference)) {
      dayGain += (leg.direction === "Long" ? 1 : -1) * (mid - reference) * leg.quantity * leg.multiplier;
      if (markValid) markDayGain += (leg.direction === "Long" ? 1 : -1) * (mark - reference) * leg.quantity * leg.multiplier;
    } else dayReferenceComplete = false;
    oldest = Math.min(oldest, at);
    stale ||= !usableEvidence(at, now, session);
  }
  // A negative synthetic midpoint is not a usable closing debit. The same broker
  // response may still supply a complete, valid mark valuation. Switch the whole
  // package (including daily P/L), never mix marks and midpoints across legs.
  const useMarks = closeDebit < -0.000001 && marksComplete &&
    Number.isFinite(markDebit) && markDebit >= -0.000001;
  if (useMarks) { closeDebit = markDebit; dayGain = markDayGain; }
  const valuationUsable = closeDebit >= -0.000001;
  return { closeDebit: valuationUsable ? Math.max(0, closeDebit) : null,
    dayGain: valuationUsable && dayReferenceComplete ? dayGain : null, oldest,
    stale, valuationSource: useMarks ? "broker mark" : "midpoint" };
}

// Delta is the signed, share-equivalent exposure to this trade's own underlying.
// Ten share equivalents per condor is the explicit display-only neutral band.
function directionFor(held, quotes, quantity, now, session) {
  let net = 0;
  for (const leg of held) {
    const matches = quotes.filter((item) => item?.symbol === leg.symbol);
    if (matches.length !== 1) return "—";
    const rawDelta = matches[0].delta;
    const delta = (typeof rawDelta === "number" || typeof rawDelta === "string") &&
      /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(rawDelta)) ? Number(rawDelta) : NaN;
    const updatedAt = Date.parse(matches[0]["updated-at"]);
    if (typeof delta !== "number" || !Number.isFinite(delta) || Math.abs(delta) > 1 ||
        typeof updatedAt !== "number" || !Number.isFinite(updatedAt) ||
        !usableEvidence(updatedAt, now, session)) return "—";
    net += (leg.direction === "Long" ? 1 : -1) * delta * leg.multiplier * leg.quantity;
  }
  const neutralLimit = 10 * quantity;
  return Math.abs(net) <= neutralLimit + 1e-8 ? "NEUTRAL" : net > 0 ? "BULLISH" : "BEARISH";
}

function signedDollars(value) {
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2 }).format(rounded);
  return `${value >= 0 ? "+" : "−"}$${amount}`;
}

function quoteAge(milliseconds) {
  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  return minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 60)}h`;
}

function quoteLabel(market, now, sessionCloseAt, session) {
  const retained = !market.stale && retainedSessionLabel(market.oldest, now, session);
  if (retained) return `${retained} (${quoteAge(now.getTime() - market.oldest)})`;
  const close = typeof sessionCloseAt === "string" ? Date.parse(sessionCloseAt) : NaN;
  // EOD means every leg was quoted after the broker's session close, not merely that its quote is old.
  return Number.isFinite(close) && dayInNewYork(now) === dayInNewYork(new Date(close)) &&
    now.getTime() >= close && market.oldest >= close ?
    "EOD" : quoteAge(now.getTime() - market.oldest);
}

export function projectLive({ account, holdings, orders, complexOrders, quotes, spotQuotes = [], instruments = [], now,
  sessionCloseAt, session, color = false, format = "table" }) {
  if (!Array.isArray(holdings) || !Array.isArray(orders) || !Array.isArray(complexOrders) ||
      !Array.isArray(quotes) ||
      !(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      !["table", "tsv"].includes(format)) {
    fail("broker evidence malformed");
  }
  const groups = new Map();
  for (const item of holdings) {
    if (item?.["account-number"] !== account || typeof item["underlying-symbol"] !== "string" ||
        typeof item["expires-at"] !== "string") fail("held position evidence malformed");
    const key = `${item["underlying-symbol"]}|${item["expires-at"]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const rows = [];
  const positions = [];
  const accountLabel = maskAccount(account);
  for (const items of groups.values()) {
    const trade = recognizeHeldTrade(items);
    const matchingOpen = orders.filter((order) => order?.status === "Filled" &&
      sameLegs(order.legs, trade.legs, true));
    if (matchingOpen.length !== 1) fail("opening trade linkage is missing or ambiguous");
    const { credit, openedAt } = openingCredit(matchingOpen[0], trade.legs, trade.quantity);
    const exit = matchingExit(complexOrders, orders, trade.legs);
    const target = decimal(exit.target.price);
    if (!(target >= 0 && target < credit)) fail("profit target economics are inconsistent");
    const heldWithDayClose = trade.legs.map((leg) => {
      const position = items.find((item) => item.symbol === leg.symbol);
      return { ...leg, multiplier: trade.multiplier,
        dayClose: position?.["average-daily-market-close-price"] ?? position?.["close-price"] };
    });
    const market = quoteEconomics(quotes, heldWithDayClose, now, session);
    const valuationUnavailable = market.stale || market.closeDebit === null;
    const days = Math.round((dayInNewYork(now) - dayInNewYork(new Date(openedAt))) / 86_400_000);
    if (openedAt > now.getTime() || days < 0) fail("opening fill time is after the observation");
    const dte = Math.max(0, Math.round((dayInNewYork(new Date(trade.expiry)) - dayInNewYork(now)) / 86_400_000));
    let sinceEntry;
    if (valuationUnavailable) {
      sinceEntry = "—";
    } else {
      const difference = credit - market.closeDebit;
      sinceEntry = Math.abs(difference) < 0.000001 ? "$0" :
        signedDollars(difference * trade.multiplier * trade.quantity);
    }
    const gap = market.closeDebit === null ? null : market.closeDebit - target;
    const progress = market.closeDebit === null ? "valuation unavailable" : market.stale ? "quotes stale" : Math.abs(gap) < 0.000001 ?
      "at target; still held" : gap < 0 ?
        `${midpointPrice(-gap)} below target; still held` : `${midpointPrice(gap)} above target`;
    const targetClose = `${Math.round(100 * (credit - target) / credit)}% @ ${midpointPrice(target)} or exp ${
      monthDayInNewYork(new Date(trade.expiry))}`;
    const opened = `${monthDayInNewYork(new Date(openedAt))} (${days} ${days === 1 ? "day" : "days"})`;
    const transition = new Set(["Contingent", "Cancel Requested", "Replace Requested"]);
    const exitTransition = transition.has(exit.target.status) || transition.has(exit.stop.status);
    let note = "";
    if (exitTransition) {
      note = `exit transition: target ${exit.target.status}, stop ${exit.stop.status}`;
    }
    if (market.valuationSource === "broker mark") {
      note += `${note ? "; " : ""}broker mark valuation; negative package midpoint`;
    }
    const dayGain = market.stale || market.dayGain === null ? "—" :
      Math.abs(market.dayGain) < 0.005 ? "$0" : signedDollars(market.dayGain);
    const direction = directionFor(heldWithDayClose, quotes, trade.quantity, now, session);
    const underlying = items[0]["underlying-symbol"];
    const spot = spotEvidence(underlying, spotQuotes, now, session);
    const payoff = payoffProfile(trade, instruments, credit, underlying);
    const openingDte = Math.round((dayInNewYork(new Date(trade.expiry)) -
      dayInNewYork(new Date(openedAt))) / 86_400_000);
    const lifespan = openingDte < 0 ? null : { openingDte, remainingDte: dte,
      elapsedDays: openingDte - dte, progress: openingDte === 0 ? 1 : (openingDte - dte) / openingDte };
    positions.push({ symbol: trade.symbol, underlying, expiry: trade.expiry, quantity: trade.quantity,
      multiplier: trade.multiplier, credit, target, market, spot, dte, openedAt,
      // No declared time-exit policy exists in current tt evidence. Never infer it from orders.
      timeExit: { objectiveDte: null, openingDte, progress: null },
      lifespan, payoff, range: payoff ? { lower: payoff.strikes[1], upper: payoff.strikes[2] } : null,
      pnl: valuationUnavailable ? null : (credit - market.closeDebit) * trade.multiplier * trade.quantity,
      progress: valuationUnavailable ? null : (credit - market.closeDebit) / (credit - target),
      p50: Math.abs(target - credit / 2) <= 1e-8,
      profitCapture: (credit - target) / credit,
      transition: exitTransition, note, targetOrder: exit.target, stopOrder: exit.stop,
      optionEvidence: evidenceStatus(market.oldest, now, session, market.stale) });
    rows.push([accountLabel, trade.symbol, trade.label, direction, String(trade.quantity), dayGain, sinceEntry,
      `${midpointPrice(credit)} CR`, valuationUnavailable ? "—" : midpointPrice(market.closeDebit), targetClose,
      progress, opened, String(dte), quoteLabel(market, now, sessionCloseAt, session), note]);
  }
  return { accountLabel, rows, positions };
}

export function evidenceStatus(at, now, session, stale = !usableEvidence(at, now, session)) {
  const completed = completedSession(session, now);
  const retained = !stale && completed && at >= completed.open &&
    dayInNewYork(new Date(at)) === dayInNewYork(new Date(completed.close));
  return { at, ageMs: Math.max(0, now.getTime() - at), stale, retained: Boolean(retained),
    label: retained ? `${monthDayInNewYork(new Date(at))}r` : `${quoteAge(now.getTime() - at)}${stale ? "!" : ""}` };
}

function spotEvidence(symbol, quotes, now, session) {
  const missing = { value: null, label: "—", stale: true, retained: false, movement: "unknown", comparison: null };
  if (!Array.isArray(quotes)) return missing;
  const matches = quotes.filter((q) => q?.symbol === symbol && q?.["instrument-type"] === "Equity");
  if (matches.length !== 1) return missing;
  const q = matches[0];
  const bid = decimal(q.bid), ask = decimal(q.ask), mid = decimal(q.mid);
  const at = typeof q["updated-at"] === "string" ? Date.parse(q["updated-at"]) : NaN;
  if (![bid, ask, mid, at].every(Number.isFinite) || bid > ask || mid <= 0 ||
      mid < bid - 1e-6 || mid > ask + 1e-6 || at > now.getTime() + 60_000) return missing;
  return { value: mid, bid, ask, source: "tastytrade equity mid", ...spotMovement(q, mid, at, now, session), ...evidenceStatus(at, now, session) };
}

// Price movement is relative to the dated final prior close on the SAME broker
// snapshot, never to option delta, wall-clock age, session state or a substituted spot.
function spotMovement(quote, mid, at, now, session) {
  const unknown = { movement: "unknown", comparison: null };
  const date = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const time = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value ? time : NaN;
  };
  const summaryDay = date(quote["summary-date"]), previousDay = date(quote["prev-close-date"]);
  const previousClose = decimal(quote["prev-close"]);
  if (!(previousClose > 0) || quote["prev-close-price-type"] !== "Final" ||
      !Number.isFinite(summaryDay) || !Number.isFinite(previousDay) || previousDay >= summaryDay) return unknown;
  const observationDay = dayInNewYork(new Date(at));
  const completed = completedSession(session, now);
  const nextOpen = Date.parse(session?.["next-session"]?.["open-at"]);
  // Broker refreshes can be stamped after midnight while the snapshot explicitly
  // belongs to the latest completed session. Require that broker session linkage.
  const sameSession = summaryDay === observationDay || completed &&
    summaryDay === dayInNewYork(new Date(completed.close)) && at >= completed.open &&
    at <= now.getTime() + 60_000 && (!Number.isFinite(nextOpen) || at < nextOpen);
  if (summaryDay > observationDay || !sameSession) return unknown;
  const change = mid - previousClose;
  return { movement: Math.abs(change) < 1e-8 ? "unchanged" : change > 0 ? "up" : "down",
    comparison: { price: previousClose, date: quote["prev-close-date"],
      summaryDate: quote["summary-date"], source: "tastytrade prev-close", priceType: "Final", change } };
}

// Geometry is authorized only by verified standard share-deliverable contract terms.
// This validation limits the graphic; it does not widen or change live recognition.
function payoffProfile(trade, instruments, credit, underlying) {
  if (!Array.isArray(instruments) || trade.multiplier !== 100) return null;
  const normalize = s => typeof s === "string" ? s.replace(/\s+/g," ") : "";
  const parsed = [];
  for (const leg of trade.legs) {
    const m = /^([A-Za-z0-9.]+)\s+(\d{6})([CP])(\d{8})$/.exec(leg.symbol);
    const matches = instruments.filter(i => normalize(i?.symbol) === normalize(leg.symbol));
    if (matches.length !== 1 || !m) return null;
    const i = matches[0], strike = Number(m[4]) / 1000;
    const date = `20${m[2].slice(0,2)}-${m[2].slice(2,4)}-${m[2].slice(4,6)}`;
    if (i["option-chain-type"] !== "Standard" || decimal(i["shares-per-contract"]) !== 100 ||
        i["instrument-type"] !== "Equity Option" || i["underlying-symbol"] !== underlying ||
        m[1] !== underlying || i["option-type"] !== m[3] || decimal(i["strike-price"]) !== strike ||
        i["expiration-date"] !== date || date !== trade.expiry.slice(0,10)) return null;
    parsed.push({ right: m[3], strike });
  }
  const puts = parsed.filter(l=>l.right==="P").map(l=>l.strike).sort((a,b)=>a-b);
  const calls = parsed.filter(l=>l.right==="C").map(l=>l.strike).sort((a,b)=>a-b);
  const strikes = [...puts,...calls];
  if (!strikes.every((v,i)=>Number.isFinite(v) && v>0 && (i===0 || v>strikes[i-1]))) return null;
  const putWidth = puts[1]-puts[0], callWidth = calls[1]-calls[0];
  return { strikes, leftTail: credit-putWidth, rightTail: credit-callWidth,
    unequal: Math.abs(putWidth-callWidth)>1e-8, maximumProfit: credit };
}
