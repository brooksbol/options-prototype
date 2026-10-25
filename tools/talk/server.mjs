import { egressBoundary } from './privacy.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export async function startPreview({ port = 8810, apiKey, networkFetch = globalThis.fetch } = {}) {
  const boundary = egressBoundary(networkFetch);
  // Cover SDK-owned network paths too, rather than assuming store:false disables tracing.
  const originalFetch = globalThis.fetch;
  globalThis.fetch = boundary.fetch;
  const { syntheticBackend, connectSyntheticMcp } = await import('./synthetic.mjs');
  const { createConversation, MODEL } = await import('./conversation.mjs');
  const backend = await syntheticBackend();
  let servers = [];
  let conversation;
  const csrf = randomUUID();
  let http;
  try {
    servers = await connectSyntheticMcp(backend);
    const tools = (await Promise.all(servers.map(async server => ({
      server: server.name, tools: await server.listTools()
    }))));
    conversation = createConversation({ servers, apiKey, fetchImpl: boundary.fetch });
    http = createServer(async (req, res) => {
      const origin = `http://127.0.0.1:${http.address().port}`;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
      const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
      if (req.headers.host !== new URL(origin).host) return json(403, { error: 'Invalid local host.' });
      if (req.method === 'GET' && req.url === '/api/status') return json(200, {
        profile: 'Synthetic W1', model: MODEL, sdk: '0.21.0', tools, csrf,
        privacy: { traceExport: false, state: 'local-memory', providerStorage: false, remoteCompaction: false }
      });
      const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
      if (req.method === 'GET' && assets[req.url]) {
        const [name, type] = assets[req.url];
        res.writeHead(200, { 'Content-Type': type });
        return res.end(readFileSync(new URL(`./public/${name}`, import.meta.url)));
      }
      if (req.method !== 'POST' || !['/api/chat', '/api/reset'].includes(req.url)) return json(404, { error: 'Not found.' });
      if (req.headers.origin !== origin || req.headers['x-talk-csrf'] !== csrf)
        return json(403, { error: 'Local request authorization failed.' });
      try {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 20000) throw new Error();
        }
        if (req.url === '/api/reset') { conversation.reset(); return json(200, { reset: true }); }
        const data = JSON.parse(body);
        if (Object.keys(data).join(',') !== 'message') throw new Error();
        if (apiKey && data.message?.includes(apiKey)) throw new Error();
        const answer = await conversation.send(data.message);
        return json(200, answer);
      } catch { return json(400, { error: 'Request unavailable. Check the message or wait for the active turn.' }); }
    });
    http.listen(port, '127.0.0.1'); await once(http, 'listening');
    return { url: `http://127.0.0.1:${http.address().port}`, boundary, backend, servers, conversation,
      async close() {
        http.closeAllConnections(); await new Promise(resolve => http.close(resolve));
        await conversation.close();
        await Promise.allSettled(servers.map(server => server.close())); await backend.close();
        globalThis.fetch = originalFetch;
      } };
  } catch (error) {
    await Promise.allSettled(servers.map(server => server.close())); await backend.close();
    globalThis.fetch = originalFetch; throw error;
  }
}

export function existingKey() {
  if (process.env.OPENAI_API_KEY?.trim()) return process.env.OPENAI_API_KEY.trim();
  // Read only the existing credential, without migrating it or importing unrelated environment values.
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8' }).trim();
  try { return parseEnv(readFileSync(resolve(common, '..', '.env'), 'utf8')).OPENAI_API_KEY?.trim(); }
  catch { return undefined; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const apiKey = existingKey();
  if (!apiKey) { console.error('Existing approved model access is unavailable. No model request made.'); process.exitCode = 1; }
  else {
    try {
      const preview = await startPreview({ apiKey });
      console.log(`Wheelwright Talk W1 — ${preview.url} — synthetic data only`);
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await preview.close(); process.exit(0); });
    } catch { console.error('Talk preview startup failed; existing services were not changed.'); process.exitCode = 1; }
  }
}
