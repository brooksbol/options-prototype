import { egressBoundary } from './privacy.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export async function startPreview({ port = 8810, apiKey, networkFetch = globalThis.fetch, marketFixture = false, retainedMetadataBackend, authorizedRetainedBackend, authorizedMarketBackend } = {}) {
  if (authorizedRetainedBackend && (retainedMetadataBackend || marketFixture || authorizedRetainedBackend.profile !== 'AUTHORIZED_REAL_RETAINED_READS' || authorizedRetainedBackend.providerBeans !== false)) throw new Error('Invalid authorized retained profile.');
  if (retainedMetadataBackend || authorizedRetainedBackend) {
    const configuredBackend = retainedMetadataBackend ?? authorizedRetainedBackend;
    const url = new URL(configuredBackend.base);
    if (marketFixture || url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/' || url.search || url.hash || url.username || url.password || !configuredBackend.token)
      throw new Error('Invalid trusted metadata backend.');
  }
  if (authorizedMarketBackend) {
    const url = new URL(authorizedMarketBackend.base);
    if (!authorizedRetainedBackend || url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/' || url.search || url.hash || url.username || url.password || !authorizedMarketBackend.token) throw new Error('Invalid authorized retained market backend.');
  }
  const boundary = egressBoundary(networkFetch);
  // Cover SDK-owned network paths too, rather than assuming store:false disables tracing.
  const originalFetch = globalThis.fetch;
  globalThis.fetch = boundary.fetch;
  const { syntheticBackend, connectSyntheticMcp, syntheticCapabilities } = await import('./synthetic.mjs');
  const { createConversation, MODEL } = await import('./conversation.mjs');
  const configuredBackend = retainedMetadataBackend ?? authorizedRetainedBackend;
  const backend = configuredBackend ? { ...configuredBackend, reads: [], async close() {} } : await syntheticBackend();
  let servers = [];
  let conversation;
  let market;
  const csrf = randomUUID();
  let http;
  try {
    if (authorizedRetainedBackend) market = backend;
    else if (marketFixture) market = await (await import('./market-fixture.mjs')).marketFixture();
    servers = await connectSyntheticMcp(backend, [...syntheticCapabilities.map(config =>
      market && config.admitted.includes('list_authorized_accounts') ? { ...config, backend: market } : config), ...(market ? [{
      name: authorizedRetainedBackend ? 'wheelwright-retained-accounts' : 'wheelwright-synthetic-market', script: '../mcp-v2-evidence/server.mjs',
      admitted: authorizedMarketBackend ? ['inspect_account_positions', 'inspect_account_balances'] : ['inspect_market_quotes', 'inspect_account_positions', 'inspect_account_balances'], backend: market
    }] : []), ...(authorizedMarketBackend ? [{ name: 'wheelwright-retained-market', script: '../mcp-v2-evidence/server.mjs',
      admitted: ['inspect_market_quotes'], backend: authorizedMarketBackend }] : [])]);
    const tools = (await Promise.all(servers.map(async server => ({
      server: server.name, tools: await server.listTools()
    }))));
    conversation = createConversation({ servers, apiKey, fetchImpl: boundary.fetch, accountMetadataOnly: !!retainedMetadataBackend, authorizedRetainedReads: !!authorizedRetainedBackend });
    // Freeze this preview's UI bytes at startup; later candidate edits must not
    // silently change an already-running preview or introduce mismatched assets.
    const assets = Object.fromEntries([
      ['/', 'index.html', 'text/html'], ['/app.js', 'app.js', 'text/javascript'], ['/style.css', 'style.css', 'text/css'], ['/evidence-view.js', 'evidence-view.js', 'text/javascript']
    ].map(([path, name, type]) => [path, { type, bytes: readFileSync(new URL(`./ui/${name}`, import.meta.url)) }]));
    http = createServer(async (req, res) => {
      const port = http.address().port;
      const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      const origin = `http://${req.headers.host}`;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
      const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
      if (!allowedHosts.has(req.headers.host)) return json(403, { error: 'Invalid local host.' });
      if (req.method === 'GET' && req.url === '/api/status') return json(200, {
        profile: authorizedRetainedBackend ? 'Authorized real retained evidence' : retainedMetadataBackend ? 'Authorized real Account metadata only' : market ? 'Synthetic retained evidence' : 'Synthetic W1', model: MODEL, sdk: '0.21.0', tools, csrf,
        privacy: { traceExport: false, state: 'local-memory', providerStorage: false, remoteCompaction: false }
      });
      if (req.method === 'GET' && assets[req.url]) {
        res.writeHead(200, { 'Content-Type': assets[req.url].type });
        return res.end(assets[req.url].bytes);
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
    return { url: `http://127.0.0.1:${http.address().port}`, boundary, backend, market, servers, conversation,
      async close() {
        http.closeAllConnections(); await new Promise(resolve => http.close(resolve));
        await conversation.close();
        await Promise.allSettled(servers.map(server => server.close())); await backend.close();
        await market?.close();
        globalThis.fetch = originalFetch;
      } };
  } catch (error) {
    await Promise.allSettled(servers.map(server => server.close())); await backend.close();
    await market?.close();
    globalThis.fetch = originalFetch; throw error;
  }
}

function existingValue(name) {
  if (process.env[name]?.trim()) return process.env[name].trim();
  // Read only the existing credential, without migrating it or importing unrelated environment values.
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8' }).trim();
  try { return parseEnv(readFileSync(resolve(common, '..', '.env'), 'utf8'))[name]?.trim(); }
  catch { return undefined; }
}
export function existingKey() { return existingValue('OPENAI_API_KEY'); }
export function existingBackendToken() { return existingValue('WW_API_TOKEN'); }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const apiKey = existingKey();
  if (!apiKey) { console.error('Existing approved model access is unavailable. No model request made.'); process.exitCode = 1; }
  else {
    try {
      const portOption = process.argv.find(arg => arg.startsWith('--port='));
      const port = portOption ? Number(portOption.split('=')[1]) : 8810;
      if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid development port.');
      const metadataOnly = process.argv.includes('--account-metadata');
      const base = process.argv.find(arg => arg.startsWith('--backend='))?.slice('--backend='.length);
      const preview = await startPreview({ apiKey, port, marketFixture: process.argv.includes('--market'),
        ...(metadataOnly ? { retainedMetadataBackend: { base, token: existingBackendToken() } } : {}) });
      console.log(`Wheelwright Talk — ${preview.url} — ${metadataOnly ? 'authorized Account metadata only' : 'synthetic data only'}`);
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await preview.close(); process.exit(0); });
    } catch { console.error('Talk preview startup failed; existing services were not changed.'); process.exitCode = 1; }
  }
}
