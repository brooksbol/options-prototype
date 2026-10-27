import { encodePathSymbol, validateShowObservation } from '../../scripts/ww-show.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';
// Transport and public-contract projection only. No acquisition, ranking or financial calculation.
export async function inspectQuotes({ symbol, measurement = false } = {}, config) {
  if (measurement && !symbol) throw new Error('Measurement requires a canonical subject.');
  const path = '/v2/quotes' + (symbol === undefined ? '' : '/' + encodePathSymbol(symbol)) + (measurement ? '/liquidity' : '');
  const { requestId, data, error } = await readBackend(path, config);
  if (error) return problemResult(error, symbol);
  let evidence;
  if (measurement) {
    validateShowObservation(data.source, symbol);
    if (data.requestId !== requestId || data.scope !== 'RETAINED_UNDERLYING_QUOTED_MARKET_ONLY' || !data.measurements)
      throw new Error('Invalid backend measurement representation.');
    evidence = data;
  }
  else if (symbol !== undefined) evidence = validateShowObservation(data, symbol);
  else {
    if (data?.requestId !== requestId || !Array.isArray(data.items) || data.items.length > 1000)
      throw new Error('Invalid quote discovery.');
    evidence = { requestId, items: data.items.map(item => {
      const p = item?.provenance;
      if (!UUID.test(item?.observationId ?? '') || !item.subject ||
          !['ETF', 'EQUITY', 'INDEX', 'OTHER_UNDERLYING'].includes(item.subject.securityType) ||
          typeof p?.provider !== 'string' || !p.provider || !['PRODUCTION', 'SANDBOX'].includes(p.environment) ||
          ![p.receivedAt, p.committedAt].every(time => typeof time === 'string' &&
            /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(time) && Number.isFinite(Date.parse(time))))
        throw new Error('Invalid quote discovery item.');
      encodePathSymbol(item.subject.symbol);
      return { observationId: item.observationId,
        subject: { symbol: item.subject.symbol, securityType: item.subject.securityType },
        provenance: { provider: p.provider, environment: p.environment, receivedAt: p.receivedAt, committedAt: p.committedAt } };
    }) };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ requestId,
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE' } : {}),
    scope: 'Retained underlying quotes only; not options chains, executable depth, or a live ranking.',
    operation: symbol === undefined ? 'discovery' : 'observation',
    ...(symbol === undefined ? { qualification: 'Discovery lists identity and receipt/commit provenance only. It omits quote facts by design; inspect individual subjects before concluding whether facts are available.' } : {}),
    evidence }) }] };
}
