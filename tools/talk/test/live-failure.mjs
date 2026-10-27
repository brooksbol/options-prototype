import '../privacy.mjs';
import { request } from 'node:http';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { startPreview, existingKey } from '../server.mjs';

const network = globalThis.fetch;
const providerUsage = [];
let interruptNarration = true;
let interruptedRequests = 0;
const app = await startPreview({ port: 0, apiKey: existingKey(), marketFixture: true,
  networkFetch: async (input, init) => {
    const body = JSON.parse(init.body);
    if (interruptNarration && body.input.at(-1)?.type === 'function_call_output') {
      interruptNarration = false; interruptedRequests++;
      throw new Error('SYNTHETIC-NARRATION-TRANSPORT-FAILURE');
    }
    const response = await network(input, init);
    const json = await response.clone().json();
    if (json.usage) providerUsage.push(json.usage);
    return response;
  } });
async function http(path, body, csrf) {
  return new Promise((resolve, reject) => {
    const req = request(app.url + path, { method: body ? 'POST' : 'GET', headers: {
      'Content-Type': 'application/json', Origin: app.url, 'X-Talk-CSRF': csrf ?? ''
    } }, res => {
      let text = ''; res.on('data', b => text += b);
      res.on('end', () => resolve({ status: res.statusCode, ...JSON.parse(text) }));
    });
    req.on('error', reject); req.end(body ? JSON.stringify(body) : undefined);
  });
}
const began = Date.now();
try {
  const status = await http('/api/status');
  const turns = [];
  for (const question of ['Read the retained SPY quote.', 'Switch to XLU; show its retained quote.']) {
    interruptNarration = true;
    const answer = await http('/api/chat', { message: question }, status.csrf);
    turns.push({ question, ...answer });
    console.log(JSON.stringify(turns.at(-1)));
    assert.ok(answer.error, 'Fault must occur after an actual tool call, not replace the model.');
    assert.equal(answer.tools.length, 1);
  }
  assert.equal(turns[0].tools[0].isError, false);
  assert.match(turns[0].tools[0].result, /100.04/);
  assert.equal(turns[1].tools[0].isError, true);
  assert.match(turns[1].tools[0].result, /NOT_FOUND/);
  const question = 'Which underlying are we discussing? Does the previous SPY quote apply to it?';
  turns.push({ question, ...await http('/api/chat', { message: question }, status.csrf) });
  const artifact = { profile: 'synthetic real model + SDK + MCP; only narration transport fault injected',
    elapsedSeconds: (Date.now() - began) / 1000, interruptedRequests, turns, providerUsage,
    protocols: app.servers.map(s => ({ server: s.name, protocol: s.underlying?.session?.getNegotiatedProtocolVersion?.() })),
    outbound: app.boundary.events,
    marketBackend: { pid: app.market.pid, providerBeans: app.market.providerBeans, syntheticOnly: true } };
  writeFileSync(process.argv[2], JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify(artifact));
} finally { await app.close(); }
