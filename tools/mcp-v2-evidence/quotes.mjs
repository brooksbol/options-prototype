import { encodePathSymbol, validateShowObservation } from '../../scripts/ww-show.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';
// Transport and public-contract projection only. No acquisition, ranking or financial calculation.
export async function inspectQuotes({ symbol, measurement = false } = {}, config) {
  if (measurement && !symbol) throw new Error('Measurement requires a canonical subject.');
  const path = '/v2/quotes' + (symbol === undefined ? '' : '/' + encodePathSymbol(symbol)) + (measurement ? '/liquidity' : '');
  const { requestId, data, error } = await readBackend(path, config);
  if (error && measurement && error.status === 404) {
    // An absent measurement route/observation is not proof that its underlying
    // retained quote is absent. Recover that authoritative read without local math.
    const source = await readBackend('/v2/quotes/' + encodePathSymbol(symbol), config);
    if (source.error) return problemResult(source.error, symbol);
    const observation = validateShowObservation(source.data, symbol);
    return {content:[{type:'text',text:JSON.stringify({requestId:source.requestId,
      operation:'observation',measurementStatus:'UNAVAILABLE',
      measurementProblem:{requestId:error.requestId,status:error.status,code:error.code},
      evidence:{source:observation},
      qualification:'Requested backend measurements were unavailable. A separate authoritative retained quote read succeeded; its facts and clocks remain available. No spread, ranking or currentness is calculated by MCP.'})}]};
  }
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
      return { subject: { symbol: item.subject.symbol, securityType: item.subject.securityType },
        provenance: { provider: p.provider, environment: p.environment } };
    }) };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ requestId,
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE' } : {}),
    scope: 'Retained underlying quotes only; not options chains, executable depth, or a live ranking.',
    operation: symbol === undefined ? 'discovery' : 'observation',
    ...(symbol === undefined ? { qualification: 'Discovery projects identity and provider/environment only; individual observation identifiers and receipt/commit clocks are available through a subject read. It omits quote facts by design; inspect individual subjects before concluding whether facts are available.' } : {}),
    evidence }) }] };
}
