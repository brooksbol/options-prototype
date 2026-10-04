#!/usr/bin/env node
// Fixed-population, read-only option-chain geometry experiment. No trade selection.
import { credentials, PRODUCTION_BASE_URL } from "./tastytrade.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ROOTS = Object.freeze(["XSP", "SPY", "QQQ", "IWM", "DIA", "TLT", "GLD", "SLV", "USO",
  "XLE", "XLF", "XLK", "XLI", "XLP", "XLU", "XLV", "XLY", "XLB", "XLC", "SMH", "EWZ",
  "EEM", "FXI", "ARKK", "GDX", "GDXJ", "UNG", "BNO", "URA", "DRAM"]);
const USER_AGENT = "wheelwright-tastytrade-pass0/0.1";
const MAX_ANCHOR_AGE_MS = 15 * 60_000;
const HELP = "Usage: node scripts/tastytrade-pass0.mjs > pass0.json\n" +
  "Fixed 30-root, read-only Pass 0 research observation. JSON stdout; summary on stderr.\n" +
  "40–50 UTC calendar DTE; closest to 45, earlier expiration on a tie.\n" +
  "XSP uses the index mark; other declared roots use the equity mark. No fallback.";

class Pass0Error extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function parsePass0(argv) {
  if (argv.length === 1 && ["-h", "--help"].includes(argv[0])) return { help: true };
  if (argv.length) throw new Pass0Error("invalid_arguments");
  return { help: false };
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}

export function calendarDte(expiration, asOfUtcDate) {
  if (!validDate(expiration) || !validDate(asOfUtcDate)) throw new Pass0Error("invalid_calendar_date");
  return (Date.parse(expiration + "T00:00:00Z") - Date.parse(asOfUtcDate + "T00:00:00Z")) / 86_400_000;
}

function items(body, label) {
  if (!Array.isArray(body?.data?.items)) throw new Pass0Error(label + "_malformed_response");
  const page = body.pagination;
  if (page && ((Number.isInteger(page["total-pages"]) && page["total-pages"] > 1) ||
      (Number.isInteger(page["total-items"]) && page["total-items"] > body.data.items.length) ||
      (Number.isInteger(page["current-item-count"]) && page["current-item-count"] !== body.data.items.length &&
        page["current-item-count"] !== 0))) throw new Pass0Error(label + "_incomplete_response");
  return body.data.items;
}

export function describeChain(body, root, anchor, asOfUtcDate) {
  const all = items(body, "chain");
  if (all.some((item) => !item || !validDate(item["expiration-date"]) ||
      !["P", "C"].includes(item["option-type"]) || typeof item["root-symbol"] !== "string")) {
    throw new Pass0Error("chain_malformed_contract");
  }
  const matching = all.filter((item) => item["root-symbol"] === root && item.active !== false);
  if (!matching.length && all.length) throw new Pass0Error("chain_root_mismatch_or_inactive");
  const eligible = [...new Set(matching.map((item) => item["expiration-date"]))]
    .map((expiration) => ({ expiration, calendar_dte: calendarDte(expiration, asOfUtcDate) }))
    .filter((item) => item.calendar_dte >= 40 && item.calendar_dte <= 50)
    .sort((a, b) => a.calendar_dte - b.calendar_dte || a.expiration.localeCompare(b.expiration));
  if (!eligible.length) return { status: "NO_SPECIMEN", reason: "no_expiration_in_40_to_50_dte_window",
    eligible_expirations: [], chosen_expiration: null, chosen_expiration_reason: null, geometry: null };
  const chosen = [...eligible].sort((a, b) => Math.abs(a.calendar_dte - 45) -
    Math.abs(b.calendar_dte - 45) || a.calendar_dte - b.calendar_dte)[0];
  const selectionReason = "eligible expiration with smallest abs(calendar_dte - 45); earlier expiration breaks ties";
  const puts = matching.filter((item) => item["expiration-date"] === chosen.expiration &&
    item["option-type"] === "P");
  if (!puts.length) return { status: "NO_SPECIMEN", reason: "chosen_expiration_has_no_listed_puts",
    eligible_expirations: eligible, chosen_expiration: chosen,
    chosen_expiration_reason: selectionReason, geometry: null };
  const contracts = puts.map((item) => {
    const strike = Number(item["strike-price"]);
    if (typeof item["strike-price"] !== "string" || !/^\d+(?:\.\d+)?$/.test(item["strike-price"]) ||
        !Number.isFinite(strike) || strike <= 0 || typeof item.symbol !== "string" || !item.symbol.trim()) {
      throw new Pass0Error("chain_malformed_put_identity");
    }
    return { symbol: item.symbol, strike_price: item["strike-price"], root_symbol: item["root-symbol"],
      underlying_symbol: item["underlying-symbol"] ?? null, option_chain_type: item["option-chain-type"] ?? null,
      shares_per_contract: item["shares-per-contract"] ?? null, settlement_type: item["settlement-type"] ?? null };
  }).sort((a, b) => Number(a.strike_price) - Number(b.strike_price) || a.symbol.localeCompare(b.symbol));
  if (new Set(contracts.map((item) => item.symbol)).size !== contracts.length) {
    throw new Pass0Error("chain_duplicate_contract_identity");
  }
  const strikes = [...new Set(contracts.map((item) => Number(item.strike_price)))].sort((a, b) => a - b);
  const lower = strikes.filter((strike) => strike < anchor);
  const upper = strikes.filter((strike) => strike >= anchor);
  const nearestBelow = lower.at(-1) ?? null;
  const nearestAtOrAbove = upper[0] ?? null;
  const geometry = { total_listed_put_contracts: contracts.length, distinct_put_strike_count: strikes.length,
    minimum_put_strike: strikes[0], maximum_put_strike: strikes.at(-1),
    nearest_below_anchor: nearestBelow, nearest_at_or_above_anchor: nearestAtOrAbove,
    spacing: { below_to_at_or_above: nearestBelow == null || nearestAtOrAbove == null ? null :
      nearestAtOrAbove - nearestBelow,
    next_lower_gap: lower.length < 2 ? null : nearestBelow - lower.at(-2),
    next_upper_gap: upper.length < 2 ? null : upper[1] - nearestAtOrAbove },
    neighboring_strikes: { below: lower.slice(-5), at_or_above: upper.slice(0, 5) },
    listed_put_contracts: contracts };
  if (nearestBelow == null || nearestAtOrAbove == null) {
    return { status: "NO_SPECIMEN", reason: "puts_do_not_bracket_underlying_anchor",
      eligible_expirations: eligible, chosen_expiration: chosen,
      chosen_expiration_reason: selectionReason, geometry };
  }
  return { status: "ELIGIBLE", reason: null, eligible_expirations: eligible,
    chosen_expiration: chosen, chosen_expiration_reason: selectionReason, geometry };
}

export function anchorFromQuote(body, root, instrumentType, receivedAt) {
  const quotes = items(body, "underlying");
  if (quotes.length !== 1 || quotes[0]?.symbol !== root ||
      quotes[0]?.["instrument-type"] !== (instrumentType === "index" ? "Index" : "Equity")) {
    throw new Pass0Error("underlying_missing_or_wrong_instrument");
  }
  const quote = quotes[0];
  const mark = quote.mark;
  const sourceTime = quote["updated-at"];
  if (typeof mark !== "string" || !/^\d+(?:\.\d+)?$/.test(mark) || Number(mark) <= 0) {
    throw new Pass0Error("underlying_mark_missing_or_invalid");
  }
  const sourceMs = typeof sourceTime === "string" ? Date.parse(sourceTime) : NaN;
  const receiptMs = Date.parse(receivedAt);
  if (!Number.isFinite(sourceMs) || !Number.isFinite(receiptMs)) {
    throw new Pass0Error("underlying_source_time_missing_or_invalid");
  }
  const age = receiptMs - sourceMs;
  if (age < -5000 || age > MAX_ANCHOR_AGE_MS) throw new Pass0Error("underlying_source_time_stale_or_future");
  return { value: mark, field: "mark", source: "GET /market-data/by-type", instrument_type: instrumentType,
    source_updated_at_utc: new Date(sourceMs).toISOString(), source_age_ms_at_receipt: age,
    broker_quote: quote };
}

async function rest(fetchImpl, path, options, label, now) {
  const started_at_utc = now().toISOString();
  let response;
  try {
    response = await fetchImpl(PRODUCTION_BASE_URL + path, { ...options, redirect: "error",
      signal: AbortSignal.timeout(10000), headers: { "User-Agent": USER_AGENT,
        Accept: "application/json", ...options.headers } });
  } catch { return { error: label + "_network_or_redirect", timing: { started_at_utc, received_at_utc: now().toISOString() } }; }
  const timing = { started_at_utc, received_at_utc: now().toISOString(), http_status: response.status };
  if (!response.ok) return { error: label + "_http_" + response.status, timing };
  try { return { body: await response.json(), timing }; }
  catch { return { error: label + "_malformed_json", timing }; }
}

function failure(root, reason, evidence = {}) {
  return { root, status: "EVIDENCE_FAILURE", reason, ...evidence };
}

async function observeRoot(root, token, fetchImpl, now, asOfUtcDate) {
  const headers = { Authorization: "Bearer " + token };
  const instrumentType = root === "XSP" ? "index" : "equity";
  const chainRead = await rest(fetchImpl, "/option-chains/" + root, { method: "GET", headers }, "chain", now);
  const underlyingRead = await rest(fetchImpl, "/market-data/by-type?" + instrumentType + "[]=" + root,
    { method: "GET", headers }, "underlying", now);
  const evidence = { underlying_instrument_type_requested: instrumentType,
    requests: { chain: chainRead.timing, underlying: underlyingRead.timing } };
  if (underlyingRead.error) return failure(root, underlyingRead.error, evidence);
  let anchor;
  try { anchor = anchorFromQuote(underlyingRead.body, root, instrumentType, underlyingRead.timing.received_at_utc); }
  catch (error) { return failure(root, error instanceof Pass0Error ? error.code : "underlying_unexpected_failure", evidence); }
  evidence.underlying_anchor = anchor;
  if (chainRead.error === "chain_http_404") {
    return { root, status: "NO_SPECIMEN", reason: "broker_reports_no_option_chain", ...evidence,
      eligible_expirations: [], chosen_expiration: null, chosen_expiration_reason: null, geometry: null };
  }
  if (chainRead.error) return failure(root, chainRead.error, evidence);
  try { return { root, ...describeChain(chainRead.body, root, Number(anchor.value), asOfUtcDate), ...evidence }; }
  catch (error) { return failure(root, error instanceof Pass0Error ? error.code : "chain_unexpected_failure", evidence); }
}

export async function run(argv = process.argv.slice(2), { env = process.env, fetchImpl = fetch,
  now = () => new Date(), out = console.log, err = console.error } = {}) {
  let command;
  try { command = parsePass0(argv); }
  catch { err(HELP); return 2; }
  if (command.help) { out(HELP); return 0; }
  const observedAt = now().toISOString();
  const asOfUtcDate = observedAt.slice(0, 10);
  let token;
  let oauth;
  try {
    const values = credentials(env);
    oauth = await rest(fetchImpl, "/oauth/token", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "refresh_token", client_id: values.TASTYTRADE_CLIENT_ID,
        client_secret: values.TASTYTRADE_CLIENT_SECRET, refresh_token: values.TASTYTRADE_REFRESH_TOKEN }) },
    "oauth", now);
    if (oauth.error) throw new Pass0Error(oauth.error);
    token = oauth.body?.access_token;
    if (typeof token !== "string" || !token.trim()) throw new Pass0Error("oauth_missing_access_token");
  } catch (error) {
    const reason = error instanceof Pass0Error ? error.code : "credentials_missing_or_unreadable";
    const result = { schema: "tt-pass0-v1", observation: { observed_at_utc: observedAt,
      as_of_utc_date: asOfUtcDate, oauth_request: oauth?.timing ?? null },
    rule: RULE, starting_population: ROOTS, results: ROOTS.map((root) => failure(root, reason)),
    counts: { ELIGIBLE: 0, NO_SPECIMEN: 0, EVIDENCE_FAILURE: ROOTS.length } };
    out(JSON.stringify(result, null, 2)); err("Pass 0: acquisition unavailable; all roots retained as EVIDENCE_FAILURE.");
    return 1;
  }
  const results = [];
  for (const root of ROOTS) results.push(await observeRoot(root, token, fetchImpl, now, asOfUtcDate));
  const counts = Object.fromEntries(["ELIGIBLE", "NO_SPECIMEN", "EVIDENCE_FAILURE"].map((status) =>
    [status, results.filter((item) => item.status === status).length]));
  out(JSON.stringify({ schema: "tt-pass0-v1", observation: { observed_at_utc: observedAt,
    completed_at_utc: now().toISOString(), as_of_utc_date: asOfUtcDate, oauth_request: oauth.timing,
    production_host: PRODUCTION_BASE_URL }, rule: RULE, starting_population: ROOTS,
  counts, results }, null, 2));
  err(`Pass 0: ${ROOTS.length} roots; ${counts.ELIGIBLE} ELIGIBLE, ${counts.NO_SPECIMEN} NO_SPECIMEN, ` +
    `${counts.EVIDENCE_FAILURE} EVIDENCE_FAILURE.`);
  return counts.EVIDENCE_FAILURE ? 1 : 0;
}

const RULE = Object.freeze({ dte_kind: "UTC_calendar_days", eligible_dte_inclusive: [40, 50],
  target_dte_for_expiration_choice: 45, expiration_tie: "earlier_expiration",
  anchor: "broker_mark_only", anchor_max_source_age_seconds: MAX_ANCHOR_AGE_MS / 1000,
  anchor_type: "index_for_XSP_equity_for_all_other_declared_roots",
  geometry: "listed_active_put_strikes_bracketing_anchor_with_five_neighbors_each_side",
  selection_reason: "minimize_abs_calendar_dte_minus_45_then_choose_earlier_expiration" });

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await run();
}
