import { parseShowJson } from '../../scripts/ww-show.mjs';
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
// Shared only after two actual read capabilities need the same bounded, safe transport.
export async function readBackend(path, config) {return requestBackend(path,config);}
export async function requestBackend(path, { base, token, fetchImpl = fetch, timeoutMs = 5000 }, {method="GET",requestId: suppliedRequestId}={}) {
  if(!["GET","POST"].includes(method)||suppliedRequestId!==undefined&&!UUID.test(suppliedRequestId))throw new Error("Invalid trusted backend operation.");
  const origin = new URL(base);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      (origin.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) ||
      typeof token !== 'string' || !token.trim()) throw new Error('Invalid trusted backend configuration.');
  const response = await fetchImpl(new URL(path, origin), { method, redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs), headers: { Authorization: `Bearer ${token}`,...(suppliedRequestId?{'X-Request-Id':suppliedRequestId}:{}) } });
  const requestId = response.headers.get('x-request-id');
  if (!UUID.test(requestId ?? '')||suppliedRequestId&&requestId!==suppliedRequestId) throw new Error('Invalid backend correlation.');
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
    return { error: { outcome: 'error', status: response.status, code: expected[0], title: data.title, requestId } };
  }
  return { requestId, data };
}
export function problemResult(error, subject) {
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ ...error,
    ...(subject ? { subject } : {}) }) }] };
}

// Nicknames are discovered operator labels, never Account identity or authorization.
export function selectedAccounts(accounts,nickname){
 if(nickname===undefined)return accounts;
 const exact=accounts.filter(a=>a.alias===nickname);if(exact.length)return exact;
 if(typeof nickname!=='string')return [];
 const matched=accounts.filter(a=>typeof a.alias==='string'&&a.alias.toLowerCase()===nickname.toLowerCase());return matched.length===1?matched:[];
}
