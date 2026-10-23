import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

export const MODEL = 'gpt-5.6-luna';

export function configuredApiKey(environment = process.env, filename = new URL('../../.env', import.meta.url)) {
  if (environment.OPENAI_API_KEY?.trim()) return environment.OPENAI_API_KEY.trim();
  try {
    // Select only this credential; never populate process.env with unrelated entries.
    return parseEnv(readFileSync(filename, 'utf8')).OPENAI_API_KEY?.trim();
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw new Error('Cannot read the local .env credential configuration.');
  }
}

// The injectable Responses client is the only test seam; MCP always uses H-001.
export async function converse(responses, lines, write = text => console.log(text)) {
  const client = new Client({ name: 'h003-agent', version: '0.0.0' }, {
    versionNegotiation: { mode: { pin: '2026-07-28' } }
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../mcp-hello-world/server.mjs', import.meta.url))],
    // Do not pass the model API credential to the MCP child.
    env: { PATH: process.env.PATH ?? '' },
    stderr: 'pipe'
  });
  let serverExit = '';
  transport.stderr.on('data', chunk => { serverExit += chunk; });
  const stderrEnded = once(transport.stderr, 'end');
  const evidence = { serverPid: undefined, protocol: undefined, toolCalls: 0, modelCalls: 0 };
  const history = [];
  try {
    await client.connect(transport, { timeout: 5000 });
    evidence.serverPid = transport.pid;
    evidence.protocol = client.getNegotiatedProtocolVersion();
    const { tools } = await client.listTools({}, { timeout: 5000 });
    if (client.getServerVersion()?.name !== 'h001-server' ||
        tools.length !== 1 || tools[0].name !== 'hello_world' ||
        evidence.protocol !== '2026-07-28') throw new Error('Unexpected MCP server or capability.');
    const tool = {
      type: 'function', name: tools[0].name, description: tools[0].description,
      parameters: { type: 'object', properties: {}, additionalProperties: false }, strict: true
    };
    write(`Connected: hello_world (MCP ${evidence.protocol})`);
    write(`Model: ${MODEL}; OpenAI API, up to 2 requests/message, 10 messages/session; no retries.`);
    write('Only enter synthetic, non-sensitive text. Type exit or quit, or press Ctrl-D.');
    write('You>');
    let turns = 0;
    for await (const raw of lines) {
      const message = raw.trim();
      if (/^(exit|quit)$/i.test(message)) break;
      if (!message) { write('You>'); continue; }
      if (message.length > 1000) throw new Error('Message exceeds the 1000-character limit.');
      if (++turns > 10) throw new Error('Session message limit reached. Restart for another session.');
      history.push({ role: 'user', content: message });
      for (let step = 0; step < 2; step++) {
        let response;
        try {
          evidence.modelCalls++;
          response = await responses.create({
            model: MODEL, reasoning: { effort: 'none' }, store: false, max_output_tokens: 256,
            instructions: step === 0
              ? 'Help with this inert hello-world experiment. Use hello_world when asked to say hello using the tool, including follow-up requests. Never claim a tool ran unless its result is present.'
              : 'The requested MCP tool has already run successfully. Its actual result is the latest function_call_output item in this conversation. Reply with that result exactly, without additional text. No further tool call is needed.',
            input: structuredClone(history), tools: [tool], parallel_tool_calls: false,
            tool_choice: step === 0 ? 'auto' : 'none'
          });
        } catch (error) {
          // Provider error bodies can contain request text or sensitive details.
          const status = Number.isInteger(error.status) ? `HTTP ${error.status}` : 'connection or timeout';
          const reasons = {
            insufficient_quota: 'API quota is exhausted or API credit/billing is unavailable.',
            rate_limit_exceeded: 'The API request or token rate limit was reached.',
            billing_hard_limit_reached: 'The API billing limit was reached.'
          };
          const reason = Object.hasOwn(reasons, error.code)
            ? `${error.code}: ${reasons[error.code]}`
            : 'Check API access, billing and connectivity.';
          throw new Error(`Model API request failed (${status}). ${reason} No retry was made.`);
        }
        write(`Usage> request ${evidence.modelCalls}: input ${response.usage?.input_tokens ?? 'unknown'}, output ${response.usage?.output_tokens ?? 'unknown'} tokens`);
        if (response.status !== 'completed' || !Array.isArray(response.output)) {
          throw new Error('Model response did not complete.');
        }
        const calls = response.output.filter(item => item.type === 'function_call');
        if (!calls.length) {
          if (!response.output_text?.trim()) throw new Error('Model returned no conversational answer.');
          history.push(...response.output);
          write(`Agent> ${response.output_text}`);
          break;
        }
        if (step !== 0 || calls.length !== 1) throw new Error('Model/tool iteration limit exceeded.');
        const call = calls[0];
        let args;
        try { args = JSON.parse(call.arguments); } catch { throw new Error('Rejected malformed tool arguments.'); }
        if (call.name !== 'hello_world' || !args || Array.isArray(args) ||
            typeof args !== 'object' || Object.keys(args).length || typeof call.call_id !== 'string') {
          throw new Error('Rejected unauthorized tool or arguments.');
        }
        write('Tool> hello_world (model requested; local MCP invocation)');
        const result = await client.callTool({ name: 'hello_world', arguments: {} }, { timeout: 5000 });
        evidence.toolCalls++;
        if (result.isError || result.content?.length !== 1 || result.content[0].type !== 'text') {
          throw new Error('MCP returned an unexpected result.');
        }
        const text = result.content[0].text;
        write(`MCP> ${text}`);
        history.push(...response.output, { type: 'function_call_output', call_id: call.call_id, output: text });
      }
      write('You>');
    }
    return evidence;
  } finally {
    // SDK close terminates/reaps the fixed child, including on model/API errors.
    evidence.serverPid ??= transport.pid;
    await client.close();
    if (evidence.serverPid) {
      await stderrEnded;
      let alive = false;
      try { process.kill(evidence.serverPid, 0); alive = true; } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
      if (alive || serverExit !== 'H-001 server exit: 0\n') throw new Error('MCP child shutdown verification failed.');
      write('Disconnected: MCP child exited 0 and was reaped.');
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const apiKey = configuredApiKey();
  if (!apiKey) {
    console.error('H-003 setup incomplete: set OPENAI_API_KEY in the repository-root .env before operator acceptance. No API request was made.');
    process.exitCode = 1;
  } else {
    let input;
    let stopping = false;
    const stop = () => { stopping = true; input?.close(); };
    // Start readline only once MCP is connected, so piped input is not lost.
    async function* messages() {
      if (stopping) return;
      input = createInterface({ input: process.stdin, crlfDelay: Infinity });
      for await (const line of input) {
        if (stopping) return;
        yield line;
      }
    }
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    try {
      const api = new OpenAI({
        apiKey, baseURL: 'https://api.openai.com/v1',
        maxRetries: 0, timeout: 20000, logLevel: 'off'
      });
      await converse(api.responses, messages());
    } catch (error) {
      // Only controlled application messages; never print arbitrary SDK errors.
      const safe = /^(Model |Rejected |Message |Session |Unexpected MCP|MCP (returned|child))/.test(error.message);
      console.error(safe ? error.message : 'Local MCP experiment failed; no retry was made.');
      process.exitCode = 1;
    } finally {
      input?.close();
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
    }
  }
}
