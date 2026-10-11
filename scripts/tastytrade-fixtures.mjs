// Synthetic broker evidence shared by domain and rendering regressions.
export const sampleTrade = (underlying, expiry, strikes, fillPrices, mids, target, stop) => {
  const symbols = strikes.map(([kind, strike]) =>
    `${underlying}  ${expiry}${kind}${String(Math.round(strike * 1000)).padStart(8, "0")}`);
  const directions = ["Long", "Short", "Short", "Long"];
  const holdings = symbols.map((symbol, i) => ({ "account-number": "5WX01234", symbol,
    "underlying-symbol": underlying, "instrument-type": "Equity Option", quantity: "1",
    "quantity-direction": directions[i], multiplier: "100",
    "average-daily-market-close-price": String(mids[i] + (underlying === "XLE" && i === 2 ? 0.01 : 0)),
    "expires-at": `20${expiry.slice(0, 2)}-${expiry.slice(2, 4)}-${expiry.slice(4, 6)}T21:00:00.000Z` }));
  const legs = (opening) => symbols.map((symbol, i) => ({ symbol, quantity: "1",
    action: opening ? (directions[i] === "Long" ? "Buy to Open" : "Sell to Open") :
      (directions[i] === "Long" ? "Sell to Close" : "Buy to Close"),
    ...(opening ? { fills: [{ quantity: "1", "fill-price": String(fillPrices[i]),
      "filled-at": "2026-09-30T16:50:00.000Z" }] } : {}) }));
  const opening = { id: `${underlying}-open`, status: "Filled", legs: legs(true) };
  const closing = { id: `${underlying}-bracket`, type: "OCO", orders: [
    { id: `${underlying}-target`, status: "Received", "order-type": "Limit", price: String(target),
      "price-effect": "Debit", legs: legs(false) },
    { id: `${underlying}-stop`, status: "Received", "order-type": "Stop Limit", price: String(stop),
      "price-effect": "Debit", legs: legs(false) }] };
  const quotes = symbols.map((symbol, i) => ({ symbol, bid: String(mids[i] - 0.01),
    ask: String(mids[i] + 0.01), delta: "0.2", mid: String(mids[i]), "updated-at": "2026-10-01T00:00:00.000Z" }));
  return { holdings, opening, closing, quotes };
};

export const ewz = sampleTrade("EWZ", "261120", [["P", 31], ["P", 32], ["C", 42], ["C", 43]],
  [0.52, 0.71, 1.11, 0.88], [0.45, 0.65, 0.75, 0.62], 0.21, 0.53);
export const xle = sampleTrade("XLE", "261016", [["P", 59], ["P", 59.5], ["C", 64.5], ["C", 65]],
  [0.32, 0.40, 0.45, 0.35], [0.36, 0.50, 0.52, 0.35], 0.09, 0.24);
export const liveEvidence = { account: "5WX01234", holdings: [...ewz.holdings, ...xle.holdings],
  orders: [ewz.opening, xle.opening, ...ewz.closing.orders, ...xle.closing.orders],
  complexOrders: [ewz.closing, xle.closing],
  quotes: [...ewz.quotes, ...xle.quotes],
  now: new Date("2026-10-01T02:00:00.000Z") };

