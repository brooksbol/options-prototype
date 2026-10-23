import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client, ProtocolError } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

await test('H-001: real MCP discovery, invocation, rejection and shutdown', { timeout: 15000 }, async () => {
  const client = new Client({ name: 'h001-client', version: '0.0.0' }, {
    versionNegotiation: { mode: { pin: '2026-07-28' } }
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('./server.mjs', import.meta.url))],
    stderr: 'pipe'
  });
  const requests = [];
  const send = transport.send.bind(transport);
  transport.send = message => {
    if (message.method) requests.push(structuredClone(message));
    return send(message);
  };
  let stderr = '';
  transport.stderr.on('data', chunk => { stderr += chunk; });
  const stderrEnded = once(transport.stderr, 'end');
  let pid;
  try {
    await client.connect(transport, { timeout: 5000 });
    pid = transport.pid;
    assert.ok(pid > 0);
    assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28');
    assert.equal(client.getProtocolEra(), 'modern');
    const discovery = client.getDiscoverResult();
    assert.ok(discovery.supportedVersions.includes('2026-07-28'));
    assert.equal(client.getServerVersion().name, 'h001-server');
    const { tools } = await client.listTools({}, { timeout: 5000 });
    assert.deepEqual(tools.map(tool => tool.name), ['hello_world']);
    const result = await client.callTool({ name: 'hello_world', arguments: {} }, { timeout: 5000 });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.content, [{ type: 'text', text: 'Hello, world!' }]);
    let negative;
    await assert.rejects(
      client.callTool({ name: 'unknown_tool', arguments: {} }, { timeout: 5000 }),
      error => {
        assert.ok(error instanceof ProtocolError);
        assert.equal(error.code, -32602);
        negative = { code: error.code, message: error.message };
        return true;
      }
    );
    assert.deepEqual(requests.map(request => request.method), [
      'tools/list', 'tools/call', 'tools/call'
    ]);
    for (const request of requests) {
      assert.equal(request.params._meta['io.modelcontextprotocol/protocolVersion'], '2026-07-28');
    }
    console.log(result.content[0].text);
    console.log(JSON.stringify({ discovery, protocolVersion: client.getNegotiatedProtocolVersion(), requests, discovered: tools.map(tool => tool.name), result, negative }, null, 2));
  } finally {
    await client.close();
    await stderrEnded;
  }
  assert.match(stderr, /^H-001 server exit: 0\n$/);
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  console.log('Server exit: 0; child reaped. Client test: PASS.');
});
