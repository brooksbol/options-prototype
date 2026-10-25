import { encodePathSymbol, parseShowJson, validateShowObservation } from '../../scripts/ww-show.mjs';

// Transport and public-contract projection only. No acquisition, ranking or financial calculation.
export async function inspectQuotes({ symbol } = {}, { base, token, fetchImpl = fetch }) {
  const origin = new URL(base);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      (origin.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) ||
      typeof token !== 'string' || !token.trim()) throw new Error('Invalid trusted backend configuration.');
  const path = '/v2/quotes' + (symbol === undefined ? '' : '/' + encodePathSymbol(symbol));
  const response = await fetchImpl(new URL(path, origin), { method: 'GET', redirect: 'error',
    signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${token}` } });
  const requestId = response.headers.get('x-request-id');
  if (!/^[a-f0-9-]{36}$/i.test(requestId ?? '')) throw new Error('Invalid backend correlation.');
  if (!/^application\/(?:json|problem\+json)(?:;|$)/i.test(response.headers.get('content-type') ?? ''))
    throw new Error('Invalid backend media type.');
  let body = '';
  let bytes = 0;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for await (const chunk of response.body) {
    bytes += chunk.byteLength;
    if (bytes > 200000) throw new Error('Backend result exceeds safe limit.');
    body += decoder.decode(chunk, { stream: true });
  }
  body += decoder.decode();
  if (body.includes(token)) throw new Error('Backend response contains credential.');
  const data = parseShowJson(body);
  if (response.status !== 200) {
    const expected = { 401: ['UNAUTHENTICATED', 'Unauthenticated'], 403: ['FORBIDDEN', 'Forbidden'],
      404: ['NOT_FOUND', 'Not found'], 422: ['INVALID_REQUEST', 'Invalid request'],
      500: ['INTERNAL_ERROR', 'Internal error'], 503: ['CAPABILITY_UNAVAILABLE', 'Capability unavailable'] }[response.status];
    if (!expected || data?.code !== expected[0] || data.requestId !== requestId ||
        data.title !== expected[1] || Number(data.status?.rawJSON) !== response.status)
      throw new Error('Invalid backend problem.');
    // Deliberately exclude arbitrary detail/internal diagnostics while preserving safe semantics.
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({
      outcome: 'error', status: response.status, code: expected[0], title: data.title, requestId,
      ...(symbol ? { subject: symbol } : {}) }) }] };
  }
  let evidence;
  if (symbol !== undefined) evidence = validateShowObservation(data, symbol);
  else {
    if (data?.requestId !== requestId || !Array.isArray(data.items) || data.items.length > 1000)
      throw new Error('Invalid quote discovery.');
    evidence = data;
  }
  return { content: [{ type: 'text', text: JSON.stringify({ requestId,
    scope: 'Retained underlying quotes only; not options chains, executable depth, or a live ranking.',
    operation: symbol === undefined ? 'discovery' : 'observation',
    ...(symbol === undefined ? { qualification: 'Discovery lists identity and receipt/commit provenance only. It omits quote facts by design; inspect individual subjects before concluding whether facts are available.' } : {}),
    evidence }) }] };
}
