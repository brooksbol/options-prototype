// Trading projection for tt only: recognition, economics and evidence validity. No terminal rendering or I/O.
import { economicObjectives, recentEconomicMovement } from "./tastytrade-economic-story.mjs";
import { ENTRY_CANDLE_SOURCE } from "./tastytrade-entry-reference.mjs";
import { usableEvidence, retainedSessionLabel, completedSession } from "./tastytrade-freshness.mjs";

export class LiveError extends Error {}

const reason = error => error.message.replace(/^Live: /, "").replace(/; use tt positions for broker evidence$/, "");
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
  if (!Array.isArray(orderLegs) || orderLegs.length !== held.length ||
      orderLegs.some(leg => leg?.["instrument-type"] != null && leg["instrument-type"] !== "Equity Option")) return false;
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
  // Name only validated credit-oriented packages; fill evidence must also establish a credit.
  if (items.some(item => item?.["instrument-type"] !== "Equity Option")) fail("unsupported strategy instrument");
  const quantity = decimal(items[0].quantity);
  const multiplier = decimal(items[0].multiplier);
  const expiry = items[0]["expires-at"];
  if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(multiplier) || multiplier <= 0 ||
      typeof expiry !== "string" || !Number.isFinite(Date.parse(expiry)) || items.some((item) =>
        decimal(item.quantity) !== quantity || decimal(item.multiplier) !== multiplier ||
        item["expires-at"] !== expiry || !["Long", "Short"].includes(item["quantity-direction"]))) {
    fail("malformed or incompatible held leg evidence");
  }
  const legs = items.map((item) => ({ symbol: item.symbol, quantity,
    direction: item["quantity-direction"], expiry }));
  if (new Set(legs.map((leg) => leg.symbol)).size !== items.length) fail("overlapping held contracts are ambiguous");
  const parsed = legs.map((leg) => ({ ...leg, match: /^([A-Za-z0-9.]+)\s+(\d{6})([CP])(\d{8})$/.exec(leg.symbol) }));
  if (parsed.some((leg) => !leg.match) || new Set(parsed.map((leg) => leg.match[1])).size !== 1 ||
      new Set(parsed.map((leg) => leg.match[2])).size !== 1 || parsed.some(leg =>
        leg.match[1] !== items[0]["underlying-symbol"] ||
        `20${leg.match[2].slice(0,2)}-${leg.match[2].slice(2,4)}-${leg.match[2].slice(4,6)}` !== expiry.slice(0,10) ||
        Number(leg.match[4]) <= 0 ||
        new Date(expiry.slice(0,10) + "T00:00:00Z").toISOString().slice(0,10) !== expiry.slice(0,10))) fail("unsupported option contract shape");
  if (![2, 4].includes(items.length)) fail("ambiguous held package membership");
  const calls = parsed.filter((leg) => leg.match[3] === "C").sort((a, b) => Number(a.match[4]) - Number(b.match[4]));
  const puts = parsed.filter((leg) => leg.match[3] === "P").sort((a, b) => Number(a.match[4]) - Number(b.match[4]));
  const putCredit = puts.length === 2 && puts[0].direction === "Long" && puts[1].direction === "Short" &&
    Number(puts[0].match[4]) < Number(puts[1].match[4]);
  const callCredit = calls.length === 2 && calls[0].direction === "Short" && calls[1].direction === "Long" &&
    Number(calls[0].match[4]) < Number(calls[1].match[4]);
  const label = items.length === 2 && putCredit ? "Bull Put Credit Spread" :
    items.length === 2 && callCredit ? "Bear Call Credit Spread" :
    items.length === 4 && putCredit && callCredit && Number(puts[1].match[4]) < Number(calls[0].match[4]) ?
      "Iron Condor" : null;
  if (!label) fail("unsupported strategy orientation or rights");
  return { legs, quantity, multiplier, expiry, symbol: parsed[0].match[1], label };

}

function heldPackages(items, orders, now) {
  if (items.length <= 2 || items.some(item => item["instrument-type"] !== "Equity Option")) return [items];
  if (new Set(items.map(item => item.symbol)).size !== items.length) fail("overlapping held contracts are ambiguous");
  // A filled opening instruction establishes composition; symbol/expiry and strike
  // adjacency do not. Only whole current holding quantities are supported here.
  const openings = orders.filter(order => order?.status === "Filled" && Array.isArray(order.legs) &&
    order.legs.some(leg => items.some(item => item.symbol === leg?.symbol) && /to Open$/.test(leg?.action)));
  const subsets = openings.map(order => ({ order,
    items: items.filter(item => order.legs.some(leg => leg?.symbol === item.symbol)) }));
  if (!subsets.some(candidate => candidate.items.length < items.length)) {
    // Keep the accepted single-package geometry fallback (including ICs).
    // Multiple same-right legs cannot establish independent vertical membership.
    const rights = items.map(item => /\d{6}([CP])\d{8}$/.exec(item.symbol)?.[1]);
    if (!openings.length && rights.every(right => right && right === rights[0])) {
      fail("ambiguous held package membership: no filled opening orders establish independent spreads");
    }
    return [items];
  }
  const used = new Set();
  for (const candidate of subsets) {
    const held = candidate.items.map(item => ({ symbol: item.symbol, quantity: decimal(item.quantity),
      direction: item["quantity-direction"] }));
    if (!sameLegs(candidate.order.legs, held, true) || held.some(leg =>
      !Number.isInteger(leg.quantity) || leg.quantity <= 0 || used.has(leg.symbol))) {
      fail("ambiguous held package membership: opening orders overlap or do not reconcile to whole holdings");
    }
    try {
      const { openedAt } = openingCredit(candidate.order, held, held[0].quantity);
      if (openedAt > now.getTime()) fail("opening fill time is after the observation");
    } catch (error) {
      if (!(error instanceof LiveError)) throw error;
      fail(`ambiguous held package membership: ${reason(error)}`);
    }
    held.forEach(leg => used.add(leg.symbol));
  }
  if (used.size !== items.length) fail("ambiguous held package membership: opening orders do not cover every holding");
  // Preserve broker holding order; do not reorder the existing portfolio by fill time.
  return subsets.sort((a, b) => items.indexOf(a.items[0]) - items.indexOf(b.items[0])).map(candidate => candidate.items);
}

function matchingExit(complexOrders, orders, held) {
  const terminal = new Set(["Filled", "Cancelled", "Rejected", "Expired"]);
  const current = new Set(["Received", "Routed", "In Flight", "Contingent", "Live",
    "Cancel Requested", "Replace Requested"]);
  const touches = order => {
    if (!Array.isArray(order?.legs)) fail("malformed closing-order leg evidence");
    return order.legs.some(leg => held.some(h => h.symbol === leg?.symbol) &&
      !["Buy to Open", "Sell to Open"].includes(leg?.action));
  };
  const active = orders.filter(order => !terminal.has(order?.status) && touches(order));
  if (active.some(order => !current.has(order.status) || !sameLegs(order.legs, held, false) ||
      order.size != null && decimal(order.size) !== held[0].quantity)) {
    fail("partial or unrecognized closing orders make management ambiguous");
  }
  const components = [];
  const candidates = [];
  const groupIds = new Map();
  for (const group of complexOrders) {
    if (!Array.isArray(group?.orders)) fail("malformed complex-order evidence");
    const matching = group.orders.filter(order => !terminal.has(order?.status) && touches(order));
    components.push(...matching);
    if (matching.length && !["OCO", "OTOCO"].includes(group.type)) fail("unsupported complex exit linkage");
    for (const order of matching) groupIds.set(String(order.id), group.id);
    const targets = matching.filter(order => sameLegs(order.legs, held, false) && order["order-type"] === "Limit" &&
      order["price-effect"] === "Debit" && Number.isFinite(decimal(order.price)));
    const stops = matching.filter(order => sameLegs(order.legs, held, false) && order["order-type"] === "Stop Limit" &&
      order["price-effect"] === "Debit" && Number.isFinite(decimal(order.price)));
    if (targets.length === 1 && stops.length === 1 && matching.length === 2 &&
        ["OCO", "OTOCO"].includes(group.type)) candidates.push({ target: targets[0], stop: stops[0] });
  }
  if (active.length === 0 && components.length === 0) return { target: null, stop: null };
  if (active.length === 1 && ["Limit", "Stop Limit"].includes(active[0]["order-type"]) &&
      active[0]["price-effect"] === "Debit" && Number.isFinite(decimal(active[0].price))) {
    const target = active[0];
    if (target["complex-order-id"] != null && String(target["complex-order-id"]) !== String(groupIds.get(String(target.id)))) {
      fail("current target complex-order identity is contradictory");
    }
    if (target.id == null || String(target.id) === "" || components.length > 1 || components.some(c => String(c.id) !== String(target.id) ||
        c["time-in-force"] !== target["time-in-force"] || c["gtc-date"] !== target["gtc-date"] ||
        c.status !== target.status || c["order-type"] !== target["order-type"] ||
        (c["stop-trigger"] != null || target["stop-trigger"] != null) && decimal(c["stop-trigger"]) !== decimal(target["stop-trigger"]) ||
        c["price-effect"] !== target["price-effect"] || decimal(c.price) !== decimal(target.price) ||
        !sameLegs(c.legs, held, false)) || components.length === 0 && target["complex-order-id"] != null) {
      fail("current target order linkage is missing or ambiguous");
    }
    return target["order-type"] === "Limit" ? { target, stop: null } : { target: null, stop: target };
  }

  if (candidates.length !== 1 || components.length !== 2) fail("current target/stop order linkage is missing or ambiguous");
  if (![candidates[0].target.status, candidates[0].stop.status].every((status) => current.has(status))) {
    fail("unrecognized current order status");
  }
  const expectedIds = new Set([String(candidates[0].target.id), String(candidates[0].stop.id)]);
  if (expectedIds.size !== 2 || expectedIds.has("undefined") || expectedIds.has("null") || expectedIds.has("")) fail("current exit order identity is malformed");
  const currentClosing = orders.filter((order) => current.has(order?.status) && sameLegs(order?.legs, held, false));
  if (currentClosing.length !== 2 || currentClosing.some((order) => !expectedIds.has(String(order.id)))) {
    fail("additional or missing current closing orders make management ambiguous");
  }
  for (const component of [candidates[0].target, candidates[0].stop]) {
    const broad = currentClosing.find((order) => String(order.id) === String(component.id));
    if (broad?.["complex-order-id"] != null && String(broad["complex-order-id"]) !== String(groupIds.get(String(component.id))) ||
        component["complex-order-id"] != null && String(component["complex-order-id"]) !== String(groupIds.get(String(component.id))) ||
        broad?.["time-in-force"] !== component["time-in-force"] || broad?.["gtc-date"] !== component["gtc-date"] ||
        broad?.status !== component.status || broad?.["order-type"] !== component["order-type"] ||
        broad?.["price-effect"] !== component["price-effect"] ||
        decimal(broad?.["stop-trigger"]) !== decimal(component["stop-trigger"]) &&
          (broad?.["stop-trigger"] != null || component["stop-trigger"] != null) ||
        decimal(broad?.price) !== decimal(component.price)) fail("order evidence changed between reads");
  }
  return candidates[0];
}

// A broker date-only GTD field denotes a New York calendar date, not midnight UTC
// converted to the previous New York day. These day ordinals share dayInNewYork's axis.
function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const day = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(day) && new Date(day).toISOString().slice(0,10) === value ? day : NaN;
}

function manualCheckpoint({ exit, opening, openedAt, credit, trade, orders, complexOrders, now }) {
  const profitTarget = order => sameLegs(order?.legs, trade.legs, false) &&
    order["order-type"] === "Limit" && order["price-effect"] === "Debit" &&
    decimal(order.price) >= 0 && decimal(order.price) < credit && order["time-in-force"] === "GTD";
  let target = exit.target;
  let active = Boolean(target);
  if (target && !profitTarget(target)) return null; // A current replacement supersedes historical intent.
  if (!target) {
    const expired = orders.filter(order => order?.status === "Expired" && profitTarget(order));
    const linked = expired.filter(order => {
      const received = Date.parse(order["received-at"]);
      const sameOpeningGroup = opening?.["complex-order-id"] != null &&
        String(order["complex-order-id"]) === String(opening["complex-order-id"]);
      if (!sameOpeningGroup && !(Number.isFinite(received) && received >= openedAt && received <= now.getTime())) return false;
      // A newer cancellation/replacement/filled close makes the old intent uncertain.
      return !orders.some(other => other !== order && other?.["order-type"] === "Limit" && sameLegs(other?.legs, trade.legs, false) &&
        Number.isFinite(Date.parse(other["received-at"])) &&
        (!Number.isFinite(received) || Date.parse(other["received-at"]) > received));
    });
    if (linked.length > 1) fail("expired GTD checkpoint linkage is ambiguous");
    if (linked.length === 0) return null;
    target = linked[0]; active = false;
    if (target.id == null || String(target.id) === "") fail("expired GTD order identity is malformed");
    if (target["complex-order-id"] != null) {
      const groups = complexOrders.filter(g => String(g?.id) === String(target["complex-order-id"]));
      const components = groups.flatMap(g => Array.isArray(g.orders) ? g.orders : []).filter(o => String(o?.id) === String(target.id));
      if (components.length !== 1 || !sameLegs(components[0].legs, trade.legs, false) ||
          components[0].status !== target.status || components[0]["order-type"] !== target["order-type"] ||
          components[0]["price-effect"] !== target["price-effect"] || decimal(components[0].price) !== decimal(target.price) ||
          components[0]["time-in-force"] !== target["time-in-force"] || components[0]["gtc-date"] !== target["gtc-date"]) {
        fail("expired GTD order evidence is missing or contradictory");
      }
    }
  }
  if (target["received-at"] != null && (!Number.isFinite(Date.parse(target["received-at"])) ||
      Date.parse(target["received-at"]) > now.getTime())) fail("GTD order receipt time is malformed or future");
  const checkpoint = calendarDate(target["gtc-date"]);
  const expiration = dayInNewYork(new Date(trade.expiry));
  const opened = dayInNewYork(new Date(openedAt)), today = dayInNewYork(now);
  if (!Number.isFinite(checkpoint) || checkpoint < opened || checkpoint > expiration ||
      !active && checkpoint > today) fail("GTD checkpoint date is missing, malformed or inconsistent");
  return { checkpointDate: target["gtc-date"], checkpointDte: Math.round((expiration-checkpoint)/86_400_000),
    progress: expiration === opened ? 1 : (checkpoint-opened)/(expiration-opened),
    state: today < checkpoint ? "UPCOMING" : today === checkpoint ? "DUE" : "PAST DUE",
    orderId: target.id, orderStatus: target.status, active, targetPrice: decimal(target.price),
    profitCapture: (credit-decimal(target.price))/credit, source: "Principal Pxx + GTD manual-exit convention" };
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
// Ten share equivalents per package preserves the existing display-only neutral band.
function netDelta(held, quotes, now, session) {
  let net = 0;
  for (const leg of held) {
    const matches = quotes.filter((item) => item?.symbol === leg.symbol);
    if (matches.length !== 1) return null;
    const rawDelta = matches[0].delta;
    const delta = (typeof rawDelta === "number" || typeof rawDelta === "string") &&
      /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(rawDelta)) ? Number(rawDelta) : NaN;
    const updatedAt = Date.parse(matches[0]["updated-at"]);
    if (typeof delta !== "number" || !Number.isFinite(delta) || Math.abs(delta) > 1 ||
        typeof updatedAt !== "number" || !Number.isFinite(updatedAt) ||
        !usableEvidence(updatedAt, now, session)) return null;
    net += (leg.direction === "Long" ? 1 : -1) * delta * leg.multiplier * leg.quantity;
  }
  return net;
}
function directionFor(held, quotes, quantity, now, session) {
  const net = netDelta(held, quotes, now, session);
  if (net === null) return "—";
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

export function projectLive({ account, holdings, orders, complexOrders, quotes, spotQuotes = [], instruments = [], entryReferences = [], now,
  sessionCloseAt, session, color = false, format = "table" }) {
  if (!Array.isArray(holdings) || !Array.isArray(orders) || !Array.isArray(complexOrders) ||
      !Array.isArray(quotes) ||
      !(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      !["table", "tsv"].includes(format)) {
    fail("broker evidence malformed");
  }
  const orderEvidence = [...orders, ...complexOrders, ...complexOrders.flatMap(group => Array.isArray(group?.orders) ? group.orders : []),
    ...complexOrders.map(group => group?.["trigger-order"]).filter(Boolean)];
  if (orderEvidence.some(order => order?.["account-number"] != null && order["account-number"] !== account)) {
    fail("order evidence belongs to a different account");
  }
  const groups = new Map();
  for (const item of holdings) {
    if (item?.["account-number"] !== account || typeof item["underlying-symbol"] !== "string" ||
        !item["underlying-symbol"].trim()) fail("held position evidence malformed");
    const key = item["instrument-type"] === "Equity Option" ?
      `${item["underlying-symbol"]}|${item["expires-at"] ?? "[missing expiry]"}` :
      `${item["underlying-symbol"]}|${item["instrument-type"]}|${item.symbol}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const rows = [];
  const positions = [];
  const accountLabel = maskAccount(account);
  const packages = [];
  for (const items of groups.values()) {
    try { packages.push(...heldPackages(items, orders, now).map(items => ({ items }))); }
    catch (error) {
      if (!(error instanceof LiveError)) throw error;
      packages.push({ items, error });
    }
  }
  for (const { items, error: membershipError } of packages) {
    try {
      if (membershipError) throw membershipError;
      const trade = recognizeHeldTrade(items);
      const issues = [];
      let credit = null, openedAt = null, opening = null;
      try {
        const matchingOpen = orders.filter((order) => order?.status === "Filled" &&
          sameLegs(order.legs, trade.legs, true));
        if (matchingOpen.length !== 1) fail("opening trade linkage is missing or ambiguous");
        opening = matchingOpen[0];
        ({ credit, openedAt } = openingCredit(opening, trade.legs, trade.quantity));
        if (openedAt > now.getTime()) fail("opening fill time is after the observation");
      } catch (error) {
        if (!(error instanceof LiveError)) throw error;
        if (/not a supported credit package/.test(reason(error))) throw error;
        credit = null; openedAt = null; issues.push(`financial evidence unavailable: ${reason(error)}`);
      }
      let exit = { target: null, stop: null };
      let managementVerified = true;
      try {
        exit = matchingExit(complexOrders, orders, trade.legs);
        if (exit.target && credit !== null && !(decimal(exit.target.price) < credit)) {
          fail("profit target economics are inconsistent");
        }
      } catch (error) {
        if (!(error instanceof LiveError)) throw error;
        managementVerified = false;
        exit = { target: null, stop: null }; issues.push(`management ambiguous: ${reason(error)}`);
      }
      const target = exit.target ? decimal(exit.target.price) : null;
      const heldWithDayClose = trade.legs.map((leg) => {
        const position = items.find((item) => item.symbol === leg.symbol);
        return { ...leg, multiplier: trade.multiplier,
          dayClose: position?.["average-daily-market-close-price"] ?? position?.["close-price"] };
      });
      let market;
      try { market = quoteEconomics(quotes, heldWithDayClose, now, session); }
      catch (error) {
        if (!(error instanceof LiveError)) throw error;
        issues.push(`valuation unavailable: ${reason(error)}`);
        market = { closeDebit: null, dayGain: null, oldest: NaN, stale: true, valuationSource: null };
      }
      const valuationUnavailable = credit === null || market.stale || market.closeDebit === null;
      const days = openedAt === null ? null : Math.round((dayInNewYork(now) - dayInNewYork(new Date(openedAt))) / 86_400_000);

      const dte = Math.max(0, Math.round((dayInNewYork(new Date(trade.expiry)) - dayInNewYork(now)) / 86_400_000));
      let sinceEntry;
      if (valuationUnavailable) {
        sinceEntry = "—";
      } else {
        const difference = credit - market.closeDebit;
        sinceEntry = Math.abs(difference) < 0.000001 ? "$0" :
          signedDollars(difference * trade.multiplier * trade.quantity);
      }
      const gap = target === null || market.closeDebit === null ? null : market.closeDebit - target;
      const progress = target === null ? "management unavailable" : credit === null ? "opening credit unavailable" : market.closeDebit === null ? "valuation unavailable" : market.stale ? "quotes stale" : Math.abs(gap) < 0.000001 ?
        "at target; still held" : gap < 0 ?
          `${midpointPrice(-gap)} below target; still held` : `${midpointPrice(gap)} above target`;
      const targetClose = target === null ? "—" : credit === null ? `limit @ ${midpointPrice(target)}` : `${Math.round(100 * (credit - target) / credit)}% @ ${midpointPrice(target)} or exp ${
        monthDayInNewYork(new Date(trade.expiry))}`;
      const opened = openedAt === null ? "—" : `${monthDayInNewYork(new Date(openedAt))} (${days} ${days === 1 ? "day" : "days"})`;
      const transition = new Set(["Contingent", "Cancel Requested", "Replace Requested"]);
      const exitTransition = transition.has(exit.target?.status) || transition.has(exit.stop?.status);
      let manualExit = null;
      if (managementVerified && credit !== null && openedAt !== null) {
        try { manualExit = manualCheckpoint({ exit, opening, openedAt, credit, trade, orders, complexOrders, now }); }
        catch (error) {
          if (!(error instanceof LiveError)) throw error;
          issues.push(`manual checkpoint unavailable: ${reason(error)}`);
        }
      }
      let note = issues.join("; ");
      if (manualExit && !manualExit.active) {
        note += `${note ? "; " : ""}manual checkpoint M${manualExit.checkpointDte} ${manualExit.state.toLowerCase()}; GTD target Expired (inactive)`;
      }
      if (exitTransition) {
        note += `${note ? "; " : ""}exit transition: target ${exit.target?.status ?? "none"}, stop ${exit.stop?.status ?? "none"}`;
      }
      if (market.valuationSource === "broker mark") {
        note += `${note ? "; " : ""}broker mark valuation; negative package midpoint`;
      }
      const dayGain = market.stale || market.dayGain === null ? "—" :
        Math.abs(market.dayGain) < 0.005 ? "$0" : signedDollars(market.dayGain);
      const direction = directionFor(heldWithDayClose, quotes, trade.quantity, now, session);
      const underlying = items[0]["underlying-symbol"];
      const spot = spotEvidence(underlying, spotQuotes, now, session);
      const payoff = credit === null ? null : payoffProfile(trade, instruments, credit, underlying);
      const openingDte = openedAt === null ? null : Math.round((dayInNewYork(new Date(trade.expiry)) -
        dayInNewYork(new Date(openedAt))) / 86_400_000);
      const lifespan = openedAt === null || openingDte < 0 ? null : { openingDte, remainingDte: dte,
        elapsedDays: openingDte - dte, progress: openingDte === 0 ? 1 : (openingDte - dte) / openingDte };
      positions.push({ strategy: trade.label, status: "recognized", issues, symbol: trade.symbol, underlying, expiry: trade.expiry, quantity: trade.quantity,
        multiplier: trade.multiplier, credit, target, market, spot, dte, openedAt,
        protectiveExitEvidence: { state: !managementVerified ? "unavailable" : exit.stop ? "present" : "absent",
          source: "reconciled current broker closing orders" },
        economicObjectives: economicObjectives({ credit, target, stopOrder: exit.stop, quantity: trade.quantity, multiplier: trade.multiplier }),
        recentMovement: recentEconomicMovement({ legs: heldWithDayClose, quotes, orders, openedAt, market, now, session }),
        // Principal-approved convention is manual intent, never an executable time-exit order.
        manualExit,
        timeExit: { objectiveDte: manualExit?.checkpointDte ?? null, openingDte,
          progress: manualExit?.progress ?? null },
        lifespan, payoff, entryReference: trade.legs.length === 2 ? entryReference(entryReferences, underlying, openedAt) : null, range: payoff && trade.label === "Iron Condor" ? { lower: payoff.strikes[1], upper: payoff.strikes[2] } : null,
        rangeLabel: payoff && trade.label !== "Iron Condor" ? `${trade.label === "Bull Put Credit Spread" ? "≥" : "≤"}${payoff.shortStrike}` : null,
        maximumProfit: payoff ? payoff.maximumProfit * trade.multiplier * trade.quantity : null,
        maximumLoss: payoff ? -Math.min(payoff.leftTail, payoff.rightTail) * trade.multiplier * trade.quantity : null,
        breakevens: payoff?.breakevens ?? null,
        netDelta: netDelta(heldWithDayClose, quotes, now, session),
        pnl: valuationUnavailable ? null : (credit - market.closeDebit) * trade.multiplier * trade.quantity,
        progress: valuationUnavailable || target === null ? null : (credit - market.closeDebit) / (credit - target),
        p50: target !== null && credit !== null && Math.abs(target - credit / 2) <= 1e-8,
        profitCapture: target === null || credit === null ? null : (credit - target) / credit,
        transition: exitTransition, note, targetOrder: exit.target, stopOrder: exit.stop,
        optionEvidence: evidenceStatus(market.oldest, now, session, market.stale) });
      rows.push([accountLabel, trade.symbol, trade.label, direction, String(trade.quantity), dayGain, sinceEntry,
        credit === null ? "—" : `${midpointPrice(credit)} CR`, market.stale || market.closeDebit === null ? "—" : midpointPrice(market.closeDebit), targetClose,
        progress, opened, String(dte), Number.isFinite(market.oldest) ? quoteLabel(market, now, sessionCloseAt, session) : "—", note]);
    } catch (error) {
      if (!(error instanceof LiveError)) throw error;
      const note = reason(error);
      const status = /overlapping|ambiguous/.test(note) ? "ambiguous holdings" :
        /contract|malformed/.test(note) ? "malformed broker evidence" : "unsupported strategy";
      const symbol = items[0]["underlying-symbol"];
      positions.push({ symbol, status, issues: [note], payoffUnavailableLabel: status,
        payoff: null, range: null, spot: { value: null }, lifespan: null, dte: null, pnl: null,
        market: { closeDebit: null }, optionEvidence: {} });
      rows.push([accountLabel, symbol, status, "—", "—", "—", "—", "—", "—", "—", "unavailable", "—", "—", "—", note]);
    }
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

// Historical age is measured against the opening fill, never against the current
// quote. A completed minute ending immediately before entry is a near-entry
// trade-price reference, not an exact underlying price at the option execution.
function entryReference(references, symbol, openedAt) {
  if (!Array.isArray(references) || openedAt === null) return null;
  const matches = references.filter(r => r?.symbol === symbol && r?.openedAt === openedAt);
  if (matches.length !== 1) return null;
  const r = matches[0], start = Math.floor(openedAt/60_000)*60_000-60_000;
  if (r.source !== ENTRY_CANDLE_SOURCE || r.priceType !== "trade candle close" || r.periodMs !== 60_000 ||
      typeof r.value !== "number" || !Number.isFinite(r.value) || r.value <= 0 ||
      r.barStart !== start || r.barEnd !== start+60_000 || r.barEnd > openedAt) return null;
  return { ...r, lagMs: openedAt-r.barEnd };
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
  if (strikes.length === 2) {
    const width = strikes[1] - strikes[0];
    if (!(credit > 0 && credit < width)) return null;
    const bull = puts.length === 2;
    const shortStrike = bull ? strikes[1] : strikes[0];
    return { strategy: bull ? "put" : "call", strikes, shortStrike,
      leftTail: bull ? credit-width : credit, rightTail: bull ? credit : credit-width,
      maximumProfit: credit, unequal: false, breakevens: [shortStrike + (bull ? -credit : credit)] };
  }
  const putWidth = puts[1]-puts[0], callWidth = calls[1]-calls[0];
  if (!(credit > 0 && credit < Math.min(putWidth, callWidth))) return null;
  return { strikes, leftTail: credit-putWidth, rightTail: credit-callWidth,
    unequal: Math.abs(putWidth-callWidth)>1e-8, maximumProfit: credit,
    breakevens: [puts[1]-credit, calls[0]+credit] };
}
