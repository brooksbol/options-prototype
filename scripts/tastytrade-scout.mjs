// One-shot broker evidence projection. No package price or Exit Reliability inference.
export class ScoutError extends Error {}

const decimal = (value) => typeof value === "string" && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value);
const dateOnly = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) === value;

export function parseScout(argv) {
  const root = argv[0];
  if (!/^[A-Z][A-Z0-9.]{0,9}$/.test(root ?? "")) throw new ScoutError("Scout requires one uppercase root.");
  const flags = {};
  for (let i = 1; i < argv.length; i += 2) {
    const name = argv[i];
    if (!["--expiration", "--short-put-strike", "--widths", "--underlying-type"].includes(name) ||
        Object.hasOwn(flags, name) || argv[i + 1] == null) throw new ScoutError("Invalid scout arguments.");
    flags[name] = argv[i + 1];
  }
  const expiration = flags["--expiration"];
  const strike = flags["--short-put-strike"];
  const widthsText = flags["--widths"];
  const underlyingType = flags["--underlying-type"];
  if (!dateOnly(expiration) || !decimal(strike) || Number(strike) <= 0 ||
      !widthsText || !/^\d+(?:\.\d+)?(?:,\d+(?:\.\d+)?)*$/.test(widthsText) ||
      !["equity", "index"].includes(underlyingType)) throw new ScoutError("Invalid scout selection parameters.");
  const widths = widthsText.split(",");
  if (widths.length > 150 || widths.some((width) => Number(width) <= 0 || Number(width) >= Number(strike)) ||
      new Set(widths.map(Number)).size !== widths.length) throw new ScoutError("Scout widths must be distinct positive values below the short strike (max 150).");
  return { kind: "scout", root, expiration, shortPutStrike: strike, widths, underlyingType };
}

function items(body, label) {
  if (!Array.isArray(body?.data?.items)) throw new ScoutError(label + ": malformed response");
  const page = body.pagination;
  if (page && ((Number.isInteger(page["total-pages"]) && page["total-pages"] > 1) ||
      (Number.isInteger(page["total-items"]) && page["total-items"] > body.data.items.length))) {
    throw new ScoutError(label + ": retrieval incomplete");
  }
  return body.data.items;
}

export function selectSpecimens(chainBody, selection) {
  const options = items(chainBody, "Option chain");
  const key = (strike) => Math.round(Number(strike) * 1000);
  const selected = options.filter((item) => item?.["expiration-date"] === selection.expiration &&
    item["root-symbol"] === selection.root && item["option-type"] === "P");
  if (!selected.length) throw new ScoutError("Scout: no eligible expiration or put contracts");
  const byStrike = new Map();
  for (const option of selected) {
    if (!decimal(option["strike-price"]) || !Number.isSafeInteger(key(option["strike-price"])) ||
        typeof option.symbol !== "string" || !option.symbol.trim()) throw new ScoutError("Option chain: malformed contract identity");
    const strike = key(option["strike-price"]);
    if (byStrike.has(strike)) throw new ScoutError("Option chain: ambiguous put contracts at one strike");
    byStrike.set(strike, option);
  }
  const short = byStrike.get(key(selection.shortPutStrike));
  if (!short) throw new ScoutError("Scout: requested short put strike is unavailable");
  return selection.widths.map((width) => {
    const long = byStrike.get(key(selection.shortPutStrike) - key(width));
    if (!long) throw new ScoutError("Scout: requested width " + width + " cannot be constructed");
    if (short["shares-per-contract"] !== long["shares-per-contract"] ||
        short["settlement-type"] !== long["settlement-type"] ||
        short["option-chain-type"] !== long["option-chain-type"]) {
      throw new ScoutError("Scout: contract terms differ across legs");
    }
    return { width, legs: [
      { role: "short_put", contract: short }, { role: "long_put", contract: long },
    ] };
  });
}

const rawQuote = (quote) => ({
  bid: quote?.bid ?? null, ask: quote?.ask ?? null,
  bid_size: quote?.["bid-size"] ?? quote?.bidSize ?? null,
  ask_size: quote?.["ask-size"] ?? quote?.askSize ?? null,
  updated_at: quote?.["updated-at"] ?? quote?.updatedAt ?? null,
  mid: quote?.mid ?? null, mark: quote?.mark ?? null,
});

export function buildScoutObservation({ selection, chain, metrics, underlyingQuote, quoteBatches, timings, observedAt }) {
  const specimens = selectSpecimens(chain, selection);
  const symbols = [...new Set(specimens.flatMap((specimen) => specimen.legs.map((leg) => leg.contract.symbol)))];
  const quoteMap = new Map();
  for (const batch of quoteBatches) for (const quote of items(batch, "Quotes")) {
    if (typeof quote?.symbol !== "string" || !symbols.includes(quote.symbol) || quoteMap.has(quote.symbol)) {
      throw new ScoutError("Quotes: unexpected or duplicate contract; retrieval incomplete");
    }
    quoteMap.set(quote.symbol, quote);
  }
  const underlyingItems = items(underlyingQuote, "Underlying quote");
  if (underlyingItems.length !== 1 || underlyingItems[0]?.symbol !== selection.root) {
    throw new ScoutError("Underlying quote: missing or unexpected symbol");
  }
  const metricItems = items(metrics, "Market metrics");
  if (metricItems.length > 1 || (metricItems.length && metricItems[0]?.symbol !== selection.root)) {
    throw new ScoutError("Market metrics: unexpected symbol");
  }
  const issues = [];
  const legsBySymbol = new Map();
  for (const symbol of symbols) {
    const quote = quoteMap.get(symbol);
    const raw = rawQuote(quote);
    if (!quote) issues.push("missing_quote:" + symbol);
    for (const field of ["bid", "ask"]) {
      if (raw[field] == null) issues.push("missing_" + field + ":" + symbol);
      else if (!decimal(String(raw[field]))) issues.push("invalid_" + field + ":" + symbol);
    }
    if (raw.bid_size == null) issues.push("missing_bid_size:" + symbol);
    if (raw.ask_size == null) issues.push("missing_ask_size:" + symbol);
    if (raw.updated_at == null) issues.push("missing_quote_timestamp:" + symbol);
    else if (!Number.isFinite(Date.parse(raw.updated_at))) issues.push("invalid_quote_timestamp:" + symbol);
    else if (Date.parse(raw.updated_at) < Date.parse(observedAt) - 15 * 60 * 1000) issues.push("quote_older_than_15m:" + symbol);
    legsBySymbol.set(symbol, raw);
  }
  if (quoteMap.size !== symbols.length) issues.push("quote_response_incomplete");
  const metric = metricItems[0];
  if (!metric) issues.push("missing_market_metrics");
  const uq = rawQuote(underlyingItems[0]);
  if (uq.mark == null && uq.mid == null && uq.bid == null && uq.ask == null && underlyingItems[0].last == null) {
    issues.push("missing_underlying_price");
  }
  return {
    schema: "tt-scout-v1", status: issues.length ? "incomplete" : "complete", issues,
    observation: { observed_at_utc: observedAt, request_timings_utc: timings,
      production_host: "https://api.tastyworks.com" },
    selection: { root: selection.root, rule: "exact_expiration_exact_short_put_strike_put_credit_vertical_widths",
      expiration: selection.expiration, short_put_strike: selection.shortPutStrike,
      widths: selection.widths, underlying_type: selection.underlyingType,
      freshness_window_seconds: 900 },
    broker: {
      underlying: { symbol: selection.root, instrument_type: selection.underlyingType,
        price_evidence: { ...uq, last: underlyingItems[0].last ?? null } },
      market_metrics: { broker_liquidity_rating: metric?.["liquidity-rating"] ?? null,
        broker_liquidity_rank: metric?.["liquidity-rank"] ?? null,
        broker_liquidity: metric?.liquidity ?? null },
      specimens: specimens.map((specimen) => ({ width: specimen.width, legs: specimen.legs.map(({ role, contract }) => ({
        role, contract: { symbol: contract.symbol, root_symbol: contract["root-symbol"],
          underlying_symbol: contract["underlying-symbol"] ?? null, expiration_date: contract["expiration-date"],
          strike_price: contract["strike-price"], option_type: contract["option-type"],
          shares_per_contract: contract["shares-per-contract"] ?? null,
          settlement_type: contract["settlement-type"] ?? null,
          option_chain_type: contract["option-chain-type"] ?? null }, quote: legsBySymbol.get(contract.symbol),
      })) })),
    },
    derived: { calendar_dte_utc: Math.round((Date.parse(selection.expiration + "T00:00:00Z") -
      Date.parse(observedAt.slice(0, 10) + "T00:00:00Z")) / 86400000),
      quote_timestamp_span_ms: (() => { const dates = [...legsBySymbol.values()].map((q) => Date.parse(q.updated_at));
        return dates.every(Number.isFinite) ? Math.max(...dates) - Math.min(...dates) : null; })() },
  };
}
