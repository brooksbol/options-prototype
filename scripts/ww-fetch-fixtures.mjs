import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";

export const TOKEN = "ww-fixture-secret-DO-NOT-PRINT";
export const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const instant = "2026-10-05T15:00:00Z";
export function observation(symbol) {
  return { observationId: "22222222-2222-4222-8222-222222222222",
    subject: { symbol, securityType: "ETF" }, facts: { last: { price: 100 } },
    provenance: { provider: "tradier", environment: "PRODUCTION",
      acquisitionId: "33333333-3333-4333-8333-333333333333", authorityEpoch: "1",
      acquisitionPhase: "REGULAR_USABLE", regularSessionDate: "2026-10-05",
      feedIdentity: "realtime", receivedAt: instant, committedAt: instant } };
}
export function result(symbol, outcome = "NEWLY_ACQUIRED", retained = false) {
  const fulfilled = ["NEWLY_ACQUIRED", "REUSED"].includes(outcome);
  return { subject: { symbol }, outcome, fulfilled,
    observation: fulfilled || retained ? observation(symbol) : null,
    priorRetained: !fulfilled && retained,
    ...(!fulfilled ? { failure: { code: outcome, retryable: true, detail: "fixture failure" } } : {}) };
}
export function acquisition(symbols, mode = "ORDINARY", states = {}) {
  return { requestId: REQUEST_ID, mode, startedAt: instant, completedAt: instant,
    results: symbols.map(symbol => result(symbol, states[symbol]?.outcome, states[symbol]?.retained)) };
}
export async function fixture() {
  const calls = [];
  const state = { outcomes: {}, status: 200, body: undefined };
  const server = createServer(async (request, reply) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    let body;
    try { body = JSON.parse(raw); } catch { body = null; }
    calls.push({ path: request.url, method: request.method, authorization: request.headers.authorization, body });
    // Every unexpected request is a regression: monitored/refresh/expirations/
    // chains and follow-up inspection are forbidden. Only the v2 batch can pass.
    if (request.url !== "/v2/quotes" || request.method !== "POST") {
      reply.statusCode = 500; reply.end('{}'); return;
    }
    reply.setHeader("content-type", state.status === 200 ? "application/json" : "application/problem+json");
    reply.statusCode = state.status;
    reply.end(typeof state.body === "string" ? state.body : JSON.stringify(state.body ??
      acquisition(body.subjects.map(s => s.symbol), body.mode, state.outcomes)));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { calls, state, base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
export async function capture(args, env, program = process.execPath) {
  const child = spawn(program, args, { env: { ...process.env, WW_API_TOKEN: TOKEN, ...env } });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const [status] = await once(child, "close");
  return { status, stdout, stderr };
}
