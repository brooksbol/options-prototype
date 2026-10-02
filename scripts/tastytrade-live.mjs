// Operator-facing projection of a uniquely evidenced live trade. Broker reads stay in tastytrade.mjs.
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

function quoteEconomics(quotes, held, now) {
  let closeDebit = 0; let dayGain = 0; let dayReferenceComplete = true; let oldest = Infinity;
  for (const leg of held) {
    const matches = quotes.filter((quote) => quote?.symbol === leg.symbol);
    if (matches.length !== 1) fail("quote evidence missing or duplicated");
    const quote = matches[0];
    const bid = decimal(quote.bid); const ask = decimal(quote.ask); const mid = decimal(quote.mid);
    const at = Date.parse(quote["updated-at"]);
    if (![bid, ask, mid, at].every(Number.isFinite) || bid > ask || mid < bid - 0.000001 ||
        mid > ask + 0.000001 || at > now.getTime() + 60_000) fail("quote evidence malformed");
    closeDebit += (leg.direction === "Short" ? 1 : -1) * mid;
    const reference = decimal(leg.dayClose);
    if (Number.isFinite(reference)) {
      dayGain += (leg.direction === "Long" ? 1 : -1) * (mid - reference) * leg.quantity * leg.multiplier;
    } else dayReferenceComplete = false;
    oldest = Math.min(oldest, at);
  }
  if (closeDebit < -0.000001) fail("indicative package value is inconsistent");
  return { closeDebit: Math.max(0, closeDebit), dayGain: dayReferenceComplete ? dayGain : null, oldest,
    stale: now.getTime() - oldest > 12 * 60 * 60 * 1000 };
}

function colorSegment(state, words, color) {
  return color ? `\x1b[${state === "GREEN" ? "32" : "31"}m${words}\x1b[37m` : words;
}

// Delta is the signed, share-equivalent exposure to this trade's own underlying.
// Ten share equivalents per condor is the explicit display-only neutral band.
function directionFor(held, greeks, quantity, now) {
  let net = 0;
  for (const leg of held) {
    const matches = greeks.filter((item) => item?.symbol === leg.symbol);
    if (matches.length !== 1) return "—";
    const { delta, updatedAt } = matches[0];
    if (typeof delta !== "number" || !Number.isFinite(delta) || Math.abs(delta) > 1 ||
        typeof updatedAt !== "number" || !Number.isFinite(updatedAt) ||
        updatedAt > now.getTime() + 60_000 || now.getTime() - updatedAt > 12 * 60 * 60 * 1000) return "—";
    net += (leg.direction === "Long" ? 1 : -1) * delta * leg.multiplier * leg.quantity;
  }
  const neutralLimit = 10 * quantity;
  return Math.abs(net) <= neutralLimit + 1e-8 ? "NEUTRAL" : net > 0 ? "BULLISH" : "BEARISH";
}

function directionSegment(label, words, color) {
  const code = { BULLISH: 32, NEUTRAL: 33, BEARISH: 31 }[label];
  return color && code ? `\x1b[${code}m${words}\x1b[37m` : words;
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

function quoteLabel(market, now, sessionCloseAt) {
  const close = typeof sessionCloseAt === "string" ? Date.parse(sessionCloseAt) : NaN;
  // EOD means every leg was quoted after the broker's session close, not merely that its quote is old.
  return Number.isFinite(close) && dayInNewYork(now) === dayInNewYork(new Date(close)) &&
    now.getTime() >= close && market.oldest >= close ?
    "EOD" : quoteAge(now.getTime() - market.oldest);
}

export function renderLive({ account, holdings, orders, complexOrders, quotes, greeks = [], now,
  sessionCloseAt, color = false, format = "table" }) {
  if (!Array.isArray(holdings) || !Array.isArray(orders) || !Array.isArray(complexOrders) ||
      !Array.isArray(quotes) || !Array.isArray(greeks) ||
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
  const lines = [];
  const rows = [];
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
    const market = quoteEconomics(quotes, heldWithDayClose, now);
    const days = Math.round((dayInNewYork(now) - dayInNewYork(new Date(openedAt))) / 86_400_000);
    if (openedAt > now.getTime() || days < 0) fail("opening fill time is after the observation");
    const dte = Math.max(0, Math.round((dayInNewYork(new Date(trade.expiry)) - dayInNewYork(now)) / 86_400_000));
    let sinceEntry;
    if (market.stale) {
      sinceEntry = "—";
    } else {
      const difference = credit - market.closeDebit;
      sinceEntry = Math.abs(difference) < 0.000001 ? "$0" :
        signedDollars(difference * trade.multiplier * trade.quantity);
    }
    const gap = market.closeDebit - target;
    const progress = market.stale ? "quotes stale" : Math.abs(gap) < 0.000001 ?
      "at target; still held" : gap < 0 ?
        `${midpointPrice(-gap)} below target; still held` : `${midpointPrice(gap)} above target`;
    const targetClose = `${Math.round(100 * (credit - target) / credit)}% @ ${midpointPrice(target)} or exp ${
      monthDayInNewYork(new Date(trade.expiry))}`;
    const opened = `${monthDayInNewYork(new Date(openedAt))} (${days} ${days === 1 ? "day" : "days"})`;
    const transition = new Set(["Contingent", "Cancel Requested", "Replace Requested"]);
    let note = "";
    if (transition.has(exit.target.status) || transition.has(exit.stop.status)) {
      note = `exit transition: target ${exit.target.status}, stop ${exit.stop.status}`;
    }
    const dayGain = market.stale || market.dayGain === null ? "—" :
      Math.abs(market.dayGain) < 0.005 ? "$0" : signedDollars(market.dayGain);
    const direction = directionFor(heldWithDayClose, greeks, trade.quantity, now);
    rows.push([accountLabel, trade.symbol, trade.label, direction, String(trade.quantity), dayGain, sinceEntry,
      `${midpointPrice(credit)} CR`, market.stale ? "—" : midpointPrice(market.closeDebit), targetClose,
      progress, opened, String(dte), quoteLabel(market, now, sessionCloseAt), note]);
  }
  const headers = ["ACCOUNT", "SYMBOL", "STRUCTURE", "DIRECTION", "QTY", "P/L DAY", "TOTAL G/L",
    "OPENED@", "CURRENT", "TARGET CLOSE@", "PROGRESS", "OPENED", "DTE", "QUOTE"];
  if (rows.some((row) => row[14])) headers.push("NOTE");
  if (format === "tsv") {
    return [headers, ...rows.map((row) => row.slice(0, headers.length))].map((row) => row.join("\t")).join("\n");
  }
  if (rows.length) {
    const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index].length)));
    const columns = (values, start, end) => values.slice(start, end).map((value, offset) =>
      value.padEnd(widths[start + offset])).join("  ");
    lines.push(columns(headers, 0, headers.length));
    for (const row of rows) {
      const prefix = columns(row, 0, 3);
      const direction = columns(row, 3, 4);
      const quantity = columns(row, 4, 5);
      const day = columns(row, 5, 6);
      const total = columns(row, 6, 7);
      const opening = columns(row, 7, 8);
      const currentTargetProgress = columns(row, 8, 11);
      const suffix = columns(row, 11, headers.length);
      const dayState = row[5].startsWith("+") ? "GREEN" : row[5].startsWith("−") ? "RED" : null;
      const gainState = row[6].startsWith("+") ? "GREEN" : row[6].startsWith("−") ? "RED" : null;
      lines.push(`${prefix}  ${directionSegment(row[3], direction, color)}  ${quantity}  ${
        dayState ? colorSegment(dayState, day, color) : day}  ${
        gainState ? colorSegment(gainState, total, color) : total
      }  ${opening}  ${gainState ? colorSegment(gainState, currentTargetProgress, color) :
        currentTargetProgress}  ${suffix}`.trimEnd());
    }
  }
  const output = lines.join("\n");
  return color ? `\n\x1b[37m${output}\x1b[0m\n` : `\n${output}\n`;
}
