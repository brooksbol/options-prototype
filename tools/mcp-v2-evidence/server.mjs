import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { inspectQuotes } from './quotes.mjs';
import { inspectPositions } from './positions.mjs';

serveStdio(() => {
  const server = new McpServer({ name: 'wheelwright-v2-evidence', version: '0.0.0' });
  server.registerTool('inspect_market_quotes', {
    description: 'Read Wheelwright retained underlying market-quote evidence. Omit symbol to discover identities and receipt/commit provenance ONLY; discovery intentionally omits facts and cannot prove their absence. Supply a canonical symbol to inspect actual bid/ask, provider-reported displayed sizes, daily volume and provenance where present. Missing observation fields are unknown, not zero. sourceEventAt is the side-specific source clock; receivedAt/committedAt are storage clocks, not observation times. Prices/sizes retain source units; do not infer currency, lots, shares, or an execution guarantee. Provider/environment qualify every observation; retained evidence is not necessarily current or live. ETFs and index benchmarks are distinct from listed options. Does not acquire/refresh data, inspect options chains, prove execution depth, score liquidity or recommend trades.',
    inputSchema: z.object({ symbol: z.string().optional().describe('Canonical underlying symbol, e.g. SPY or ^SPX. Omit for discovery.') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async args => {
    try { return await inspectQuotes(args, { base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN }); }
    catch { return { isError: true, content: [{ type: 'text', text: 'Market-evidence read failed; no new finding established.' }] }; }
  });
  server.registerTool('inspect_account_positions', {
    description: 'Inspect backend-established Positions for an authenticated, authorized Wheelwright Account nickname. Reuses Account discovery and the current API v2 portfolio contract. Preserve returned source dates, financial statuses and qualifications: retained holdings do not establish opening cash flow, continuous ownership, live prices, realized earnings or executed fills. Does not acquire broker data, modify policy or submit orders.',
    inputSchema: z.object({ account: z.string().describe('Exact Account nickname from authorized discovery, without descriptive adjectives or broker labels.') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async args => {
    try { return await inspectPositions(args, { base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN }); }
    catch { return { isError: true, content: [{ type: 'text', text: 'Position-evidence read failed; no new finding established.' }] }; }
  });
  return server;
});
