import {withoutImages} from './attachments.mjs';
// Applied before importing the SDK in the normal development runtime.
process.env.OPENAI_AGENTS_DISABLE_TRACING = '1';
process.env.OPENAI_AGENTS_DONT_LOG_MODEL_DATA = '1';
process.env.OPENAI_AGENTS_DONT_LOG_TOOL_DATA = '1';

export function egressBoundary(networkFetch = globalThis.fetch) {
  const events = [];
  const requests = [];
  async function guardedFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const method = init.method ?? (input instanceof Request ? input.method : 'GET');
    let body;
    try { body = JSON.parse(init.body); } catch { /* Non-inference requests are refused below. */ }
    const allowed = url.href === 'https://api.openai.com/v1/responses' && method === 'POST' &&
      body?.store === false && !body.conversation && !body.previous_response_id && !body.background;
    const event = { url: url.href, method, allowed, store: body?.store,
      conversation: !!body?.conversation, previousResponse: !!body?.previous_response_id };
    events.push(event);
    if (!allowed) throw new Error('Outbound request refused by W1 disclosure policy.');
    // Bounded local-memory inspection only; never persist model bodies or headers/credentials.
    // Real metadata mode admits only the previously authorized nickname/broker/count projection.
    requests.push(withoutImages(structuredClone(body)));
    if (requests.length > 200) requests.shift();
    if (events.length > 200) events.shift();
    return networkFetch(input, { ...init, redirect: 'error' });
  }
  return { fetch: guardedFetch, events, requests };
}
