import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

serveStdio(() => {
  const server = new McpServer({ name: 'h001-server', version: '0.0.0' });
  server.registerTool('hello_world', { description: 'Return a constant greeting.' }, async () => ({
    content: [{ type: 'text', text: 'Hello, world!' }]
  }));
  return server;
});

// Lifecycle evidence goes to stderr; stdout contains only MCP messages.
process.on('exit', code => console.error(`H-001 server exit: ${code}`));
