import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { converse, MODEL, configuredApiKey } from './agent.mjs';

const call = (name = 'hello_world', args = '{}') => ({
  type: 'function_call', name, arguments: args, call_id: 'synthetic-call'
});
const reply = (output, text = '') => ({
  status: 'completed', output, output_text: text, usage: { input_tokens: 0, output_tokens: 0 }
});
const answer = text => reply([{ type: 'message', role: 'assistant', content: [
  { type: 'output_text', text, annotations: [] }
] }], text);

test('two model-directed turns use real MCP; actual results reach model and display; child exits', { timeout: 15000 }, async () => {
  const requests = [];
  const visible = [];
  const responses = { async create(request) {
    requests.push(structuredClone(request));
    assert.equal(request.model, MODEL);
    assert.deepEqual(request.reasoning, { effort: 'none' });
    assert.equal(request.store, false);
    assert.equal(request.max_output_tokens, 256);
    assert.equal(request.parallel_tool_calls, false);
    assert.deepEqual(request.tools.map(tool => tool.name), ['hello_world']);
    assert.deepEqual(request.tools[0].parameters, { type: 'object', properties: {}, additionalProperties: false });
    if (request.tool_choice === 'auto') return reply([call()]);
    const result = request.input.at(-1);
    assert.equal(result.type, 'function_call_output');
    assert.equal(result.output, 'Hello, world!');
    return answer(result.output); // Fake model repeats the actual MCP result.
  } };
  const result = await converse(responses, ['Say hello using your MCP tool.', 'Do it again.', 'exit'], line => visible.push(line));
  assert.equal(result.protocol, '2026-07-28');
  assert.equal(result.toolCalls, 2);
  assert.equal(result.modelCalls, 4);
  assert.throws(() => process.kill(result.serverPid, 0), { code: 'ESRCH' });
  assert.equal(requests[2].input.filter(item => item.type === 'function_call_output').length, 1);
  assert.equal(visible.filter(line => line === 'MCP> Hello, world!').length, 2);
  assert.equal(visible.filter(line => line === 'Agent> Hello, world!').length, 2);
  assert.equal(visible.at(-1), 'Disconnected: MCP child exited 0 and was reaped.');
  console.log(visible.join('\n'));
});

test('no model-requested call means no MCP invocation; no hardcoded greeting in agent', async () => {
  const source = await readFile(new URL('./agent.mjs', import.meta.url), 'utf8');
  assert.ok(!source.includes('Hello, world!'));
  const visible = [];
  const result = await converse({ create: async () => answer('No tool requested.') }, ['Just chat.'], line => visible.push(line));
  assert.equal(result.toolCalls, 0);
  assert.ok(!visible.some(line => line.startsWith('Tool>') || line.startsWith('MCP>')));
});

for (const [label, requested] of [
  ['unknown tool', call('shell')],
  ['command argument', call('hello_world', '{"command":"touch forbidden"}')],
  ['array arguments', call('hello_world', '[]')],
  ['malformed JSON', call('hello_world', '{')]
]) {
  test(`rejects ${label} before tool dispatch and reaps child`, async () => {
    const visible = [];
    await assert.rejects(converse({ create: async () => reply([requested]) }, ['Synthetic input'], line => visible.push(line)), /Rejected/);
    assert.ok(!visible.some(line => line.startsWith('Tool>')));
    assert.equal(visible.at(-1), 'Disconnected: MCP child exited 0 and was reaped.');
  });
}

test('second tool request is rejected at the two-request bound', async () => {
  let count = 0;
  const visible = [];
  await assert.rejects(converse({ create: async () => { count++; return reply([call()]); } }, ['Synthetic input'], line => visible.push(line)), /iteration limit/);
  assert.equal(count, 2);
  assert.equal(visible.filter(line => line.startsWith('Tool>')).length, 1);
  assert.equal(visible.at(-1), 'Disconnected: MCP child exited 0 and was reaped.');
});

test('parallel tool requests fail before any dispatch', async () => {
  const visible = [];
  await assert.rejects(converse({ create: async () => reply([call(), call()]) }, ['Synthetic input'], line => visible.push(line)), /iteration limit/);
  assert.ok(!visible.some(line => line.startsWith('Tool>')));
  assert.equal(visible.at(-1), 'Disconnected: MCP child exited 0 and was reaped.');
});

test('API errors are sanitized and child cleanup happens on failure', async () => {
  const visible = [];
  await assert.rejects(converse({ create: async () => { throw new Error('synthetic-secret-do-not-log'); } }, ['Synthetic input'], line => visible.push(line)), error => {
    assert.match(error.message, /^Model API request failed/);
    assert.ok(!error.message.includes('synthetic-secret'));
    return true;
  });
  assert.ok(!visible.join('\n').includes('synthetic-secret'));
  assert.equal(visible.at(-1), 'Disconnected: MCP child exited 0 and was reaped.');
});

test('quota errors explain the provider code without exposing its message', async () => {
  await assert.rejects(converse({ create: async () => {
    throw Object.assign(new Error('synthetic-secret-do-not-log'), { status: 429, code: 'insufficient_quota' });
  } }, ['Synthetic input'], () => {}), error => {
    assert.match(error.message, /HTTP 429/);
    assert.match(error.message, /insufficient_quota: API quota/);
    assert.ok(!error.message.includes('synthetic-secret'));
    return true;
  });
});

test('session bound prevents unbounded API spending', async () => {
  let count = 0;
  await assert.rejects(converse({ create: async () => { count++; return answer('Synthetic reply.'); } }, Array(11).fill('Synthetic input'), () => {}), /Session message limit/);
  assert.equal(count, 10);
});

test('missing key exits usefully; EOF and explicit exit require no API call', async t => {
  // Isolate CLI credential tests from the operator's real repository .env.
  const directory = await mkdtemp(join(tmpdir(), 'h003-cli-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'agent.mjs');
  await writeFile(path, await readFile(new URL('./agent.mjs', import.meta.url)));
  await symlink(fileURLToPath(new URL('./node_modules', import.meta.url)), join(directory, 'node_modules'));
  // Override only the fixture's fixed sibling paths; production paths stay fixed.
  let source = await readFile(path, 'utf8');
  source = source.replace("new URL('../../.env', import.meta.url)", "new URL('./.env', import.meta.url)");
  source = source.replace("new URL('../mcp-hello-world/server.mjs', import.meta.url)", JSON.stringify(new URL('../mcp-hello-world/server.mjs', import.meta.url).href));
  await writeFile(path, source);
  const commandPath = await realpath(path);
  const missing = spawnSync(process.execPath, [commandPath], { encoding: 'utf8', env: { PATH: process.env.PATH }, timeout: 10000 });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /setup incomplete/);
  assert.ok(!missing.stdout.includes('Connected:'));
  for (const input of ['', 'exit\n']) {
    // Intentionally invalid synthetic credential: any accidental API request fails this test.
    const exit = spawnSync(process.execPath, [commandPath], {
      encoding: 'utf8', input, timeout: 10000,
      env: { PATH: process.env.PATH, OPENAI_API_KEY: 'synthetic-not-a-real-key' }
    });
    assert.equal(exit.status, 0, exit.stderr);
    assert.match(exit.stdout, /MCP 2026-07-28/);
    assert.match(exit.stdout, /child exited 0 and was reaped/);
    assert.ok(!exit.stdout.includes('Usage>'));
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} at the prompt closes the actual MCP child`, { timeout: 10000 }, async () => {
    const child = spawn(process.execPath, [fileURLToPath(new URL('./agent.mjs', import.meta.url))], {
      env: { PATH: process.env.PATH, OPENAI_API_KEY: 'synthetic-not-a-real-key' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let sent = false;
    child.stderr.on('data', chunk => { stderr += chunk; });
    const exited = once(child, 'close');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if (!sent && stdout.includes('You>')) { sent = true; child.kill(signal); }
    });
    try {
      const [code] = await exited;
      assert.equal(code, 0, stderr);
      assert.match(stdout, /child exited 0 and was reaped/);
      assert.ok(!stdout.includes('Usage>'));
    } finally {
      child.stdin.destroy();
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  });
}


test('only the API credential is selected from .env, with no environment mutation', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'h003-env-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = join(directory, '.env');
  await writeFile(filename, 'OTHER_PRIVATE_VALUE=synthetic-unrelated\nOPENAI_API_KEY="synthetic-test-key"\n');
  const environment = {};
  assert.equal(configuredApiKey(environment, filename), 'synthetic-test-key');
  assert.deepEqual(environment, {});
  assert.equal(configuredApiKey({ OPENAI_API_KEY: 'synthetic-existing' }, filename), 'synthetic-existing');
  assert.equal(configuredApiKey({}, join(directory, 'absent')), undefined);
});
