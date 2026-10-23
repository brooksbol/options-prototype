import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { MODEL } from '../mcp-standalone-agent/agent.mjs';
import { accountBase, validateInventory, verifyAnswer } from './accounts.mjs';

export function configuration(env = process.env) {
  let file = {};
  try {
    file = parseEnv(readFileSync(env.WWT_CONFIG_FILE ?? new URL('../../.env', import.meta.url), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Cannot read wwt configuration.');
  }
  // Select three existing settings. Never export or transmit the remainder of .env.
  return Object.fromEntries(['OPENAI_API_KEY', 'WW_API_TOKEN', 'WW_BASE_URL'].map(name => [name, env[name]?.trim() || file[name]?.trim()]));
}
const supportedQuestion = message => /^(?:(?:what|which) (?:wheelwright )?accounts (?:do i have|can i (?:access|inspect|see))|(?:list|show)(?: me)?(?: my| authorized)?(?: wheelwright)? accounts)[?.!]?$/i.test(message);
const tool = {
  type: 'function', name: 'list_authorized_accounts',
  description: 'Discover the authenticated User’s authorized Wheelwright Accounts; returns only nickname, broker and count. No ownership, balances or other financial capabilities.',
  parameters: {type: 'object', properties: {}, additionalProperties: false}, strict: true
};
async function modelCall(responses, request) {
  try {
    const result = await responses.create({
      model: MODEL, reasoning: {effort: 'none'}, store: false, background: false,
      max_output_tokens: 2048, parallel_tool_calls: false, ...request
    });
    if (result.status !== 'completed' || !Array.isArray(result.output)) throw new Error();
    return result;
  } catch { throw new Error('Model request failed; no answer displayed and no retry made.'); }
}
export async function converseAccounts(responses, lines, config, write = console.log) {
  accountBase(config.WW_BASE_URL);
  if (!config.WW_API_TOKEN) throw new Error('Account authentication configuration is missing.');
  const client = new Client({name: 'h004-account-host', version: '0.0.0'}, {
    versionNegotiation: {mode: {pin: '2026-07-28'}}
  });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [fileURLToPath(new URL('./server.mjs', import.meta.url))],
    env: {PATH: process.env.PATH ?? '', WW_API_TOKEN: config.WW_API_TOKEN, WW_BASE_URL: config.WW_BASE_URL},
    stderr: 'pipe'
  });
  let stderr = '';
  transport.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-1024); });
  const ended = once(transport.stderr, 'end');
  const evidence = {modelCalls: 0, toolCalls: 0, serverPid: undefined};
  try {
    await client.connect(transport, {timeout: 5000});
    evidence.serverPid = transport.pid;
    const capabilities = await client.listTools({}, {timeout: 5000});
    if (client.getServerVersion()?.name !== 'h004-account-server' ||
        client.getNegotiatedProtocolVersion() !== '2026-07-28' || capabilities.tools.length !== 1 ||
        capabilities.tools[0].name !== tool.name) throw new Error('Unexpected Account MCP capability.');
    write('Wheelwright Talk — ask “What accounts do I have?” Type exit to finish.');
    write('You>');
    let turns = 0;
    for await (const raw of lines) {
      const message = raw.trim();
      if (/^(exit|quit)$/i.test(message)) break;
      if (!message) { write('You>'); continue; }
      if (++turns > 10) throw new Error('Session message limit reached.');
      if (message.length > 128 || !supportedQuestion(message)) {
        write('wwt: This slice supports authorized Account discovery. Ask “What accounts do I have?”');
        write('You>'); continue;
      }
      // No conversational history, earlier inventory, arbitrary user text or other
      // resources are replayed. The actual bounded question still goes to the model.
      evidence.modelCalls++;
      const first = await modelCall(responses, {
        instructions: 'Interpret this Account discovery question by calling list_authorized_accounts with no arguments. Never answer from memory or infer legal ownership.',
        input: [{role: 'user', content: message}], tools: [tool], tool_choice: 'auto'
      });
      const calls = first.output.filter(x => x.type === 'function_call');
      if (calls.length !== 1 || first.output.some(x => !['function_call', 'reasoning'].includes(x.type)))
        throw new Error('Account tool call required before answering.');
      const call = calls[0];
      let args;
      try { args = JSON.parse(call.arguments); } catch { throw new Error('Rejected Account tool arguments.'); }
      if (call.name !== tool.name || !args || Array.isArray(args) || typeof args !== 'object' ||
          Object.keys(args).length || !/^[a-zA-Z0-9_-]{1,128}$/.test(call.call_id ?? ''))
        throw new Error('Rejected Account tool arguments.');
      const result = await client.callTool({name: tool.name, arguments: {}}, {timeout: 7000});
      evidence.toolCalls++;
      if (result.isError || result.content?.length !== 1 || result.content[0].type !== 'text')
        throw new Error('Authorized Account discovery failed.');
      let inventory;
      try { inventory = validateInventory(JSON.parse(result.content[0].text)); }
      catch { throw new Error('Account inventory is invalid.'); }
      const projected = JSON.stringify(inventory);
      for (const secret of [config.WW_API_TOKEN, config.OPENAI_API_KEY])
        if (secret && projected.includes(secret)) throw new Error('Account inventory is invalid.');
      evidence.modelCalls++;
      const second = await modelCall(responses, {
        instructions: 'Compose a short conversational answer from the actual authorized inventory. Reply only with the sentence, no Markdown. Start with “You have access to these Wheelwright Accounts: ” or “Your authorized Wheelwright Accounts are: ”. Include every Account exactly once as nickname (broker), separated with commas and/or “and”, and end with a period. Do not add any other claim. For count 0 reply “You currently have no authorized Wheelwright Accounts.”',
        // Never forward provider output objects or opaque reasoning, only the
        // validated function call and allowlisted actual MCP result.
        input: [{role: 'user', content: message}, {
          type: 'function_call', name: tool.name, call_id: call.call_id, arguments: '{}'
        }, {type: 'function_call_output', call_id: call.call_id, output: projected}],
        tools: [tool], tool_choice: 'none'
      });
      if (second.output.some(x => !['message', 'reasoning'].includes(x.type)))
        throw new Error('Unexpected Account answer capability.');
      const answer = verifyAnswer(second.output_text?.trim(), inventory);
      write(`wwt> ${answer}`);
      write('You>');
    }
    return evidence;
  } finally {
    evidence.serverPid ??= transport.pid;
    await client.close();
    if (evidence.serverPid) {
      await ended;
      let alive = false;
      try { process.kill(evidence.serverPid, 0); alive = true; } catch (error) { if (error.code !== 'ESRCH') throw error; }
      if (alive || stderr !== 'H-004 server exit: 0\n') throw new Error('Account MCP shutdown failed.');
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let input;
  const stop = () => input?.close();
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    const config = configuration();
    if (!config.OPENAI_API_KEY) throw new Error('OpenAI configuration is missing.');
    async function* messages() {
      input = createInterface({input: process.stdin, crlfDelay: Infinity});
      for await (const line of input) yield line;
    }
    const api = new OpenAI({apiKey: config.OPENAI_API_KEY, baseURL: 'https://api.openai.com/v1', maxRetries: 0, timeout: 20000, logLevel: 'off'});
    await converseAccounts(api.responses, messages(), config);
  } catch {
    // No SDK/backend/model error body or ungrounded generated answer is printed.
    console.error('wwt: Account answer unavailable. No unverified answer was displayed.');
    process.exitCode = 1;
  } finally {
    input?.close(); process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  }
}
