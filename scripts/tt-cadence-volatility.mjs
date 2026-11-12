// Observational standalone TT1 evidence, not a v2 domain resource or selector.
// No local IVR calculation: preserve the provider's distinct measurements.
import {createHash} from 'node:crypto';

export const VOLATILITY_FIELDS = Object.freeze(['symbol', 'implied-volatility-index',
  'implied-volatility-index-rank', 'implied-volatility-index-rank-source',
  'tos-implied-volatility-index-rank', 'tw-implied-volatility-index-rank',
  'tos-implied-volatility-index-rank-updated-at', 'implied-volatility-percentile',
  'implied-volatility-updated-at', 'updated-at', 'earnings', 'dividend-ex-date', 'dividend-next-date', 'beta', 'beta-updated-at', 'corr-spy-3month', 'sector', 'industry']);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const numeric = value => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value))) return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
};
const fraction = value => { const n = numeric(value); return n !== null && n >= 0 && n <= 1 ? n : null; };
const instant = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  // Date.parse normalizes impossible dates such as February 30.
  const date=value.slice(0,10);
  return new Date(Date.parse(date+'T00:00:00Z')).toISOString().slice(0,10)===date ? Date.parse(value) : null;
};
export {instant as observationInstant};
const nyDate = value => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(value));

export function captureVolatility(body, symbols, retrievedAt) {
  if (!Array.isArray(body?.data?.items)) throw Error('INVALID_VOLATILITY_RESPONSE');
  const items = body.data.items.filter(item => symbols.includes(item?.symbol)).map(item =>
    Object.fromEntries(VOLATILITY_FIELDS.filter(key => Object.hasOwn(item, key)).map(key => [key, item[key]])));
  return {provider:'tastytrade', endpoint:'/market-metrics', environment:'production',
    requestedSymbols:[...symbols], retrievedAt, items, selectedFieldsSha256:hash(items)};
}

export function buildVolatility(observation, symbols, context, evaluatedAt) {
  // A stored projection plus the pinned context/evaluation clock is sufficient
  // for offline reproduction. HTTP receipt never establishes measurement age.
  const valid = observation?.provider === 'tastytrade' && observation?.endpoint === '/market-metrics' &&
    observation?.environment === 'production' && Array.isArray(observation?.items) &&
    observation.selectedFieldsSha256 === hash(observation.items);
  const receipt = valid ? instant(observation.retrievedAt) : null;
  const cutoff = instant(evaluatedAt);
  const records = symbols.map(symbol => {
    const matches = valid ? observation.items.filter(item => item.symbol === symbol) : [];
    const raw = matches.length === 1 ? matches[0] : null;
    const headline = fraction(raw?.['implied-volatility-index-rank']);
    const source = typeof raw?.['implied-volatility-index-rank-source'] === 'string' ? raw['implied-volatility-index-rank-source'] : null;
    const tos = fraction(raw?.['tos-implied-volatility-index-rank']);
    const tw = fraction(raw?.['tw-implied-volatility-index-rank']);
    // Only TOS has an established rank-specific timestamp in the supported API.
    const rankObservedAt = source === 'tos' ? raw?.['tos-implied-volatility-index-rank-updated-at'] ?? null : null;
    const rankClock = instant(rankObservedAt);
    const sourceValue = source === 'tos' ? tos : source === 'tw' ? tw : null;
    let status = !valid ? 'SOURCE_UNAVAILABLE' : matches.length > 1 ? 'AMBIGUOUS_SYMBOL' : !raw ? 'SYMBOL_UNAVAILABLE' :
      headline === null ? 'RANK_MISSING_OR_INVALID' : !['tos','tw'].includes(source) ? 'METHODOLOGY_UNKNOWN' :
      sourceValue !== null && Math.abs(sourceValue - headline) > 1e-12 ? 'HEADLINE_SOURCE_DISAGREEMENT' :
      rankClock === null ? 'RANK_TIME_UNKNOWN' : receipt === null || cutoff === null ? 'RECEIPT_TIME_INVALID' :
      rankClock > receipt || receipt > cutoff ? 'FUTURE_TIMESTAMP' :
      nyDate(rankClock) !== context.sessionDate ? 'RANK_NOT_FROM_EXPORT_SESSION' : 'OBSERVED_EXPORT_SESSION';
    const iv = numeric(raw?.['implied-volatility-index']);
    const ivClock = instant(raw?.['implied-volatility-updated-at']);
    const ivIndexStatus = iv === null || iv < 0 ? 'IV_MISSING_OR_INVALID' : ivClock === null ? 'IV_TIME_UNKNOWN' :
      receipt === null || cutoff === null ? 'RECEIPT_TIME_INVALID' : ivClock > receipt || receipt > cutoff ? 'FUTURE_TIMESTAMP' :
      nyDate(ivClock) !== context.sessionDate ? 'IV_NOT_FROM_EXPORT_SESSION' : 'OBSERVED_EXPORT_SESSION';
    return {symbol, provider:'tastytrade', methodology:source, status,
      ivRank:status === 'OBSERVED_EXPORT_SESSION' ? headline * 100 : null,
      observedIvRank:headline === null ? null : headline * 100, unit:'PERCENT_0_TO_100',
      rankObservedAt, rankSessionDate:rankClock === null ? null : nyDate(rankClock),
      rankAgeSeconds:rankClock === null || cutoff === null ? null : (cutoff-rankClock)/1000,
      ivIndex:iv !== null && iv >= 0 ? iv : null, ivIndexUnit:'FRACTION',
      ivIndexObservedAt:raw?.['implied-volatility-updated-at'] ?? null,
      ivIndexStatus,
      providerRowUpdatedAt:raw?.['updated-at'] ?? null,
      tosIvRank:tos === null ? null : tos * 100, twIvRank:tw === null ? null : tw * 100,
      methodologyDifference:tos === null || tw === null ? null : (tos-tw)*100,
      ivPercentile:fraction(raw?.['implied-volatility-percentile']) === null ? null : fraction(raw['implied-volatility-percentile'])*100,
      historicalMinimumIv:null, historicalMaximumIv:null, historicalObservationCount:null,
      historicalCoverage:'NOT_DISCLOSED_BY_PROVIDER', retrievedAt:valid ? observation.retrievedAt : null};
  });
  return {schema:'tt1-underlying-volatility/v1', sessionDate:context.sessionDate, evaluatedAt,
    provenance:valid ? observation : null, records,
    coverage:{requested:symbols.length, returned:records.filter(r=>r.observedIvRank !== null).length,
      usable:records.filter(r=>r.ivRank !== null).length, unavailable:records.filter(r=>r.ivRank === null).length},
    methodology:{kind:'PROVIDER_REPORTED_NOT_LOCALLY_CALCULATED', scaleConversion:'provider fraction multiplied by 100',
      definitionReference:'https://tastytrade.com/learn/platforms-and-tools/research/what-is-iv-rank/',
      providerGeneralLookback:'52 weeks', actualWindowStart:null, actualWindowEnd:null,
      limitations:['Exact TOS/TW IV construction, maturity/ATM treatment, history completeness, extrema and corporate-action handling are not established by this response.',
        'Accompanying IV index is not proven to be the exact reference input of either rank methodology.',
        'Same-session status describes date provenance, not intraday freshness, sealed-close status or trade admissibility; inspect rank age.',
        'Missing rank-specific clocks never inherit IV-level, row-update or HTTP clocks. TOS and TW are distinct; percentile is not rank.',
        'No local historical-series calculation or flat-range inference. Provider zero is preserved; unknown history remains unknown.']}};
}

export function volatilitySummary(evidence) {
  const n = value => value === null ? '—' : value.toFixed(1);
  return '\n## Underlying IV Rank\n\nProvider-reported; IVR and IV percentile use 0–100. IV index is a fraction. Unavailable IVR is —; observed values and reasons remain in JSON. No trade-selection change.\n\n' +
    '| Symbol | IVR | Method | Rank observed at | Status |\n| --- | ---: | --- | --- | --- |\n' +
    evidence.records.map(r=>`| ${r.symbol} | ${n(r.ivRank)} | ${['tos','tw'].includes(r.methodology)?r.methodology:'—'} | ${instant(r.rankObservedAt) === null ? '—' : r.rankObservedAt} | ${r.status} |`).join('\n') + '\n';
}
