// Explicit opt-in real model specimen. Only the same W1 synthetic app/fixture is used.
import '../privacy.mjs';
import { request } from 'node:http';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { getGlobalTraceProvider } from '@openai/agents';
import { startPreview, existingKey } from '../server.mjs';

const apiKey = existingKey();
assert.ok(apiKey, 'Existing approved model access is required.');
const app = await startPreview({ port: 0, apiKey });
const began = Date.now();
function local(path, data, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = request(app.url + path, {
      method: data ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...extra }
    }, res => {
      let body = ''; res.on('data', bytes => body += bytes);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject); req.end(data ? JSON.stringify(data) : undefined);
  });
}
try {
  const { body: status } = await local('/api/status');
  const headers = { Origin: app.url, 'X-Talk-CSRF': status.csrf };
  const transcript = [];
  const messages = [
    'Hello.',
    'Use the connected capabilities to tell me which synthetic accounts I can access.',
    'Which broker does harbor use?',
    'Use the other connected tool to give me its constant greeting.',
    'Show the balances and positions for orchard.',
    'Which broker is that account with?'
  ];
  for (const message of messages) {
    const response = await local('/api/chat', { message }, headers);
    assert.equal(response.status, 200); assert.ok(!response.body.error);
    transcript.push({ message, ...response.body });
    console.log(JSON.stringify(transcript.at(-1)));
  }
  assert.equal(transcript[0].tools.length, 0);
  assert.ok(transcript[1].tools.some(t => t.name === 'list_authorized_accounts'));
  assert.match(transcript[2].text, /Fidelity/i);
  assert.ok(transcript[3].tools.some(t => t.name === 'hello_world'));
  assert.match(transcript[5].text, /tastytrade/i);
  app.backend.setMode('unavailable');
  for (const message of ['Switch to harbor. Read the account inventory again using the connected tool, even though an earlier read worked.',
    'Which account did I just switch to?']) {
    const response = await local('/api/chat', { message }, headers);
    assert.equal(response.status, 200); assert.ok(!response.body.error);
    transcript.push({ message, ...response.body }); console.log(JSON.stringify(transcript.at(-1)));
  }
  assert.ok(transcript[6].tools.some(t => t.name === 'list_authorized_accounts'));
  assert.match(transcript[7].text, /harbor/i);
  app.backend.setMode('ok');
  assert.equal((await local('/api/chat', { message: 'Call a tool.' })).status, 403);
  await getGlobalTraceProvider().forceFlush();
  assert.ok(app.boundary.events.length > 0);
  assert.ok(app.boundary.events.every(e => e.allowed && e.store === false && !e.conversation && !e.previousResponse));
  const bodies = JSON.stringify(app.boundary.requests);
  assert.ok(!bodies.includes(apiKey)); assert.ok(!bodies.includes(app.backend.token));
  assert.ok(!bodies.includes('acct_' + '1'.repeat(32)));
  assert.match(bodies, /Which broker does harbor/);
  const evidence = { profile: 'synthetic-only', nodeEnv: process.env.NODE_ENV ?? 'unset (normal Node runtime)', model: status.model, sdk: status.sdk,
    sdkMcpClient: '2.3.1', mcpServer: '2.3.1',
    // Observation of the pinned SDK client's negotiated version, not host orchestration.
    observedProtocol: app.servers.map(s => ({ server: s.name,
      protocol: s.underlying?.session?.getNegotiatedProtocolVersion?.() ?? 'not exposed' })),
    tools: status.tools, transcript, outbound: app.boundary.events, backendReads: app.backend.reads,
    modelRequests: app.boundary.requests.length,
    inputTokens: transcript.reduce((n, t) => n + (t.usage?.inputTokens ?? 0), 0),
    outputTokens: transcript.reduce((n, t) => n + (t.usage?.outputTokens ?? 0), 0),
    elapsedSeconds: Math.round((Date.now() - began) / 1000),
    limits: 'Live model semantic usefulness requires independent/operator judgment; fixtures prove no general financial capability.' };
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PASS', modelRequests: evidence.modelRequests,
    inputTokens: evidence.inputTokens, outputTokens: evidence.outputTokens, observedProtocol: evidence.observedProtocol }));
} finally { await app.close(); }
