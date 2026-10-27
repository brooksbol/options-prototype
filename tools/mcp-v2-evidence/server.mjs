import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { inspectTransactions } from './transactions.mjs';
import { inspectHoldings } from './holdings.mjs';
import { inspectQuotes } from './quotes.mjs';
import { inspectBalances } from './balances.mjs';
import { inspectPositions } from './positions.mjs';

serveStdio(() => {
  const server = new McpServer({ name: 'wheelwright-v2-evidence', version: '0.0.0' });
  server.registerTool('inspect_market_quotes', {
    description: 'Read Wheelwright retained underlying market-quote evidence. Omit symbol to discover identities and receipt/commit provenance ONLY; discovery intentionally omits facts and cannot prove their absence. Supply a canonical symbol to inspect actual bid/ask, provider-reported displayed sizes, daily volume and provenance where present. Missing observation fields are unknown, not zero. sourceEventAt is the side-specific source clock; receivedAt/committedAt are storage clocks, not observation times. Prices/sizes retain source units; do not infer currency, lots, shares, or an execution guarantee. Provider/environment qualify every observation; retained evidence is not necessarily current or live. ETFs and index benchmarks are distinct from listed options. Does not acquire/refresh data, inspect options chains, prove execution depth, score liquidity or recommend trades.',
    inputSchema: z.object({ symbol: z.string().optional().describe('Canonical underlying symbol, e.g. SPY or ^SPX. Omit for discovery.'),
      measurement: z.boolean().optional().describe('Request backend-calculated retained underlying side-price measurements; requires symbol. No current or options ranking.') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async args => {
    try { return await inspectQuotes(args, { base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN,
      syntheticFixture: process.env.WW_SYNTHETIC_FIXTURE === '1' }); }
    catch { return { isError: true, content: [{ type: 'text', text: 'Market-evidence read failed; no new finding established.' }] }; }
  });
  server.registerTool('inspect_account_positions', {
    description: 'Inspect backend-established Positions for an authenticated, authorized Wheelwright Account nickname. Reuses Account discovery and the current API v2 portfolio contract. This selected Account evaluation graph is not an inventory of independent held market quotes or all history. Preserve returned source dates, financial statuses and qualifications: retained holdings do not establish opening cash flow, continuous ownership, live prices, realized earnings or executed fills. Does not directly acquire broker data, modify policy or submit orders.',
    inputSchema: z.object({
      account: z.string().describe('Exact Account nickname from authorized discovery, without descriptive adjectives or broker labels.'),
      state: z.enum(['OPEN', 'CLOSED', 'UNRESOLVED']).optional().describe('Explicit lifecycle filter ONLY when the operator requests that lifecycle state. Omit for an unfiltered Position read; OPEN is not brokerage inventory/currentness.'),
      cursor: z.string().max(8192).optional().describe('Opaque nextCursor returned by the prior page. Preserve its Account and state selection.')
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async args => {
    try { return await inspectPositions(args, { base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN,
      syntheticFixture: process.env.WW_SYNTHETIC_FIXTURE === '1' }); }
    catch { return { isError: true, content: [{ type: 'text', text: 'Position-evidence read failed; no new finding established.' }] }; }
  });
  server.registerTool('inspect_account_balances', {
    description: 'Read one backend-selected latest known source-time balance observation by exact Account nickname; does not transfer full history. Ties or unknown clocks may prevent selection. Latest retained is never current; report source coverage ending at latestKnownSourceTime and that later trading sessions are not represented. For tastytrade includes separate broker-reported options (derivative), equity and day-trading buying power, cash and margin requirements where reported. For Fidelity preserves native available-without-margin-impact, cash, buying-power and reserve labels. Retained observations are not guaranteed current after trades. Preserve field statuses, units, source identity and clocks; absent/invalid is unknown. Buying power is not cash; margin requirement is not debt; used options buying power is not per-put collateral. Does not establish strategy permissions, actual borrowing, governed capital allocation or deploy/WAIT recommendations. No acquisition or grant changes.',
    inputSchema: z.object({ account: z.string().describe('Exact Account nickname from authorized discovery.'),
      artifactId: z.string().uuid().optional().describe('Optional exact balance artifact from a prior observation; omit for latest known source time.'),
      sourceAtOrAfter: z.string().datetime({offset:true}).optional().describe('Optional earliest acceptable source instant for a dated request; cannot combine with artifactId. A miss reports retained coverage without fabricating newer evidence.') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async args => {
    try { return await inspectBalances(args, { base: process.env.WW_BASE_URL, token: process.env.WW_API_TOKEN,
      syntheticFixture: process.env.WW_SYNTHETIC_FIXTURE === '1' }); }
    catch { return { isError: true, content: [{ type: 'text', text: 'Balance-evidence read failed; no new finding established.' }] }; }
  });
  server.registerTool('inspect_account_holdings', {
    description: 'Read the brokerage positions/holdings inventory, across all authorized Account nicknames when account is omitted. Uses each Account’s latest retained custody cut, not a Wheelwright Position OPEN lifecycle filter. Use for portfolio inventory; unresolved lifecycle does not mean no holdings. Reads all bounded pages and preserves per-Account denied/partial outcomes. A403 means access denied, never zero positions. For option counts or option lists, use optionRight and side selectors: the backend supplies complete selected-cut rows, exact counts, source contract descriptors and related-long context without a CSP or spread inference. A short put is not a cash-secured put; inventory counts are not verified construction counts. Includes observed quantities, source instrument and source dates; no live freshness, managed occurrence continuity, financial calculation or trading action inferred.',
    inputSchema: z.object({account:z.string().optional().describe('Exact authorized Account nickname. Omit to inspect all discovered Accounts and report each read outcome.'),
      optionRight:z.enum(['PUT','CALL']).optional().describe('Backend option-right filter; also requests typed option inventory and counts. Does not classify a cash-secured strategy.'),
      side:z.enum(['SHORT','LONG']).optional().describe('Backend option-side filter; reports matching option contracts, with unknown identities and denied Accounts explicit.')}),
    annotations: {readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}
  }, async args => {
    try { return await inspectHoldings(args,{base:process.env.WW_BASE_URL,token:process.env.WW_API_TOKEN,syntheticFixture:process.env.WW_SYNTHETIC_FIXTURE==='1'}); }
    catch { return {isError:true,content:[{type:'text',text:'Holdings inventory read failed; no complete inventory established.'}]}; }
  });
  server.registerTool('inspect_account_transactions', {
    description:'Read bounded retained Account transaction evidence, with optional exact source symbol and inclusive transaction-date bounds. No provider acquisition. Use source actions, reported value, net cash, fees and provenance to investigate opening-credit questions; holdings alone cannot establish premium. A symbol match does not associate a transaction occurrence with a current holding or construction. Preserve row-equivalence identity, coverage and correction/reversal status. Page completeness is not lifetime completeness. No gross-premium arithmetic or strategy classification in MCP. Continue with opaque nextCursor and unchanged selectors when pageComplete is false.',
    inputSchema:z.object({account:z.string(),symbol:z.string().min(1).max(128).optional(),from:z.string().date().optional(),through:z.string().date().optional(),limit:z.number().int().min(1).max(100).optional(),cursor:z.string().max(256).optional()}),
    annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}
  },async args=>{try{return await inspectTransactions(args,{base:process.env.WW_BASE_URL,token:process.env.WW_API_TOKEN,syntheticFixture:process.env.WW_SYNTHETIC_FIXTURE==='1'});}catch{return {isError:true,content:[{type:'text',text:'Retained transaction read failed; no premium finding established.'}]};}});
  return server;
});
