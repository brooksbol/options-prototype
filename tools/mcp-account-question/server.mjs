import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { discoverAccounts } from './accounts.mjs';

serveStdio(() => {
  const server = new McpServer({ name: 'h004-account-server', version: '0.0.0' });
  server.registerTool('list_authorized_accounts', {
    description: 'Read the authenticated User’s authorized Wheelwright Account nicknames, broker labels and count. Does not establish ownership or complete brokerage coverage.'
  }, async () => {
    try {
      const inventory = await discoverAccounts({base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN});
      return {content: [{type: 'text', text: JSON.stringify(inventory)}]};
    } catch {
      return {isError: true, content: [{type: 'text', text: 'Authorized Account discovery failed.'}]};
    }
  });
  return server;
});
process.on('exit', code => console.error(`H-004 server exit: ${code}`));
