#!/usr/bin/env node

// Black-box ww fetch acceptance against a deterministic local Wheelwright-shaped HTTP fixture.
// Emits observed evidence as Markdown; it does not write repository files.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ww = resolve(root, "scripts/ww");
const pty = resolve(root, "scripts/ww-acceptance-pty.py");
const cases = [];
const requests = [];
let mode = { kind: "complete" };

const server = createServer((request, reply) => {
  const url = new URL(request.url, "http://localhost");
  requests.push({ method: request.method, path: url.pathname,
    symbols: url.searchParams.getAll("symbol") });
  reply.setHeader("content-type", "application/json");
  // Monitored-membership read for the bare-fetch default selector. The fixture's
  // monitored set is configurable per case via mode.monitored (default: empty).
  if (url.pathname === "/api/evidence/monitored") {
    if (mode.kind === "monitored-error") {
      reply.statusCode = 503;
      reply.end('{"error":"monitored unavailable"}');
      return;
    }
    const symbols = mode.monitored ?? [];
    reply.end(JSON.stringify({ symbols, count: symbols.length,
      meaning: "last declared monitored symbols" }));
    return;
  }
  if (mode.kind === "http-error") {
    reply.statusCode = 503;
    reply.end('{"error":"fixture unavailable"}');
    return;
  }
  if (mode.kind === "incomplete") {
    reply.end(JSON.stringify({ outcome: "NOT_COMPLETED", completed: false,
      perSymbol: mode.invalid ? [{ symbol: "QQQ", acquisitionOutcome: "ACQUIRED", heldPrice: true }] : [] }));
    return;
  }
  const perSymbol = url.searchParams.getAll("symbol").map(symbol => ({
    symbol,
    acquisitionOutcome: mode.states?.[symbol]?.outcome ?? "ACQUIRED",
    heldPrice: mode.states?.[symbol]?.held ?? true,
  }));
  reply.end(JSON.stringify({ outcome: "ACQUIRED", completed: true, perSymbol }));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;

async function capture(program, args, env) {
  const child = spawn(program, args, { cwd: root, env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const [status] = await once(child, "close");
  return { status, stdout, stderr };
}

async function run(args, { tty = false, authority = base, shell = false } = {}) {
  const env = { WW_BASE_URL: authority };
  const start = requests.length;
  let result;
  let command;
  if (shell) {
    command = `WW_BASE_URL=${authority} zsh -c ${JSON.stringify(args[0])}`;
    result = await capture("zsh", ["-c", args[0]], env);
  } else if (tty) {
    command = `WW_BASE_URL=${authority} python3 scripts/ww-acceptance-pty.py ./scripts/ww ${args.join(" ")}`;
    const wrapper = await capture("python3", [pty, ww, ...args], env);
    if (wrapper.status !== 0) {
      result = { status: wrapper.status, stdout: wrapper.stdout, stderr: wrapper.stderr };
    } else {
      result = JSON.parse(wrapper.stdout);
    }
  } else {
    command = `WW_BASE_URL=${authority} ./scripts/ww ${args.join(" ")}`;
    result = await capture(ww, args, env);
  }
  return { ...result, command, requests: requests.slice(start) };
}

async function check(name, args, fixture, verify, options = {}) {
  mode = fixture;
  let evidence;
  let failure;
  try {
    evidence = await run(args, options);
    verify(evidence);
  } catch (error) {
    failure = error.stack ?? String(error);
    evidence ??= { command: String(args), stdout: "", stderr: "", status: "not run", requests: [] };
  }
  cases.push({ name, ...evidence, pass: !failure, failure });
}

function lines(stdout) {
  return stdout.trim().split("\n").map(JSON.parse);
}

const full = { kind: "complete" };
await check("A01 normal explicit symbols, TTY", ["fetch", "QQQ", "SPY", "XLE"], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr, "fetch complete: 3/3 prices held\r\n");
  assert.deepEqual(r.requests[0].symbols, ["QQQ", "SPY", "XLE"]);
}, { tty: true });

await check("A02 verbose TTY and Wheelwright origin", ["fetch", "-v", "QQQ", "SPY", "XLE"], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.ok(r.stderr.startsWith(`From ${base}\r\n`));
  assert.match(r.stderr, /QQQ  acquisition ACQUIRED\r\n/);
  assert.match(r.stderr, /fetch complete: 3\/3 prices held\r\n/);
  assert.doesNotMatch(r.stderr, /Tradier|Tastytrade|price held|749\.58/);
}, { tty: true });

await check("A03 quiet TTY is silent", ["fetch", "-q", "QQQ", "SPY", "XLE"], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr, "");
}, { tty: true });

await check("A04 quiet redirected streams retain records", ["fetch", "--quiet", "QQQ", "SPY", "XLE"], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
  assert.deepEqual(lines(r.stdout).map(row => row.symbol), ["QQQ", "SPY", "XLE"]);
  assert.ok(lines(r.stdout).every(row => row.kind === "fetch-result/v1" && row.heldPrice));
  assert.doesNotMatch(r.stdout, /\x1b|fetch complete|From /);
});

await check("A05 quiet and verbose conflict before HTTP", ["fetch", "-q", "--verbose", "QQQ"], full, r => {
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /--quiet and --verbose cannot be combined/);
  assert.equal(r.requests.length, 0);
});

await check("A06 failed attempt with previous price still succeeds", ["fetch", "-v", "QQQ", "SPY"],
  { kind: "complete", states: { SPY: { outcome: "FAILED", held: true } } }, r => {
    assert.equal(r.status, 0);
    assert.match(r.stderr, /QQQ  acquisition ACQUIRED\n/);
    assert.match(r.stderr, /SPY  acquisition FAILED\s+previous price retained/);
    assert.deepEqual(lines(r.stdout).map(row => row.heldPrice), [true, true]);
  });

await check("A07 failed attempt without local price fails", ["fetch", "-v", "QQQ", "XLE"],
  { kind: "complete", states: { XLE: { outcome: "FAILED", held: false } } }, r => {
    assert.equal(r.status, 1);
    assert.match(r.stderr, /XLE  acquisition FAILED\s+no local price stored/);
    assert.match(r.stderr, /XLE has no local price stored/);
    assert.deepEqual(lines(r.stdout).map(row => row.heldPrice), [true, false]);
  });

await check("A08 ACQUIRED without local price still fails", ["fetch", "-v", "XLE"],
  { kind: "complete", states: { XLE: { outcome: "ACQUIRED", held: false } } }, r => {
    assert.equal(r.status, 1);
    assert.match(r.stderr, /XLE  acquisition ACQUIRED  no local price stored/);
    assert.match(r.stderr, /XLE has no local price stored/);
  });

await check("A09 UNKNOWN with local price stays neutral", ["fetch", "-v", "QQQ"],
  { kind: "complete", states: { QQQ: { outcome: "UNKNOWN", held: true } } }, r => {
    assert.equal(r.status, 0);
    assert.match(r.stderr, /QQQ  acquisition UNKNOWN  local price stored/);
    assert.doesNotMatch(r.stderr, /previous price retained/);
  });

await check("A10 noncompletion certifies no per-symbol records", ["fetch", "-v", "QQQ"],
  { kind: "incomplete" }, r => {
    assert.equal(r.status, 1);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /fetch did not complete \(NOT_COMPLETED\)/);
    assert.doesNotMatch(r.stderr, /From |price retained|local price stored/);
  });

await check("A11 duplicate and case-varied operands normalize", ["fetch", "qqq", "QQQ", "SPY"], full, r => {
  assert.equal(r.status, 0);
  assert.deepEqual(r.requests[0].symbols, ["QQQ", "SPY"]);
  assert.deepEqual(lines(r.stdout).map(row => row.symbol), ["QQQ", "SPY"]);
});

await check("A12 duplicate count in terminal summary", ["fetch", "qqq", "QQQ", "SPY"], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "fetch complete: 2/2 prices held\r\n");
}, { tty: true });

const alternate = createServer(server.listeners("request")[0]);
alternate.listen(0, "127.0.0.1");
await once(alternate, "listening");
const otherBase = `http://127.0.0.1:${alternate.address().port}`;
await check("A13 WW_BASE_URL selects the reported authority", ["fetch", "-v", "QQQ"], full, r => {
  assert.equal(r.status, 0);
  assert.ok(r.stderr.startsWith(`From ${otherBase}\n`));
  assert.equal(r.requests[0].symbols[0], "QQQ");
  assert.doesNotMatch(r.stderr, /Tradier|Tastytrade/);
}, { authority: otherBase });
alternate.close();

await check("A14 HTTP failure stays on stderr", ["fetch", "QQQ"], { kind: "http-error" }, r => {
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /backend returned HTTP 503/);
});

await check("A15 quiet failure still diagnoses", ["fetch", "-q", "XLE"],
  { kind: "complete", states: { XLE: { outcome: "FAILED", held: false } } }, r => {
    assert.equal(r.status, 1);
    assert.match(r.stderr, /XLE has no local price stored/);
    assert.equal(lines(r.stdout).length, 1);
  });

await check("A16 incomplete backend response cannot certify results", ["fetch", "QQQ"],
  { kind: "incomplete", invalid: true }, r => {
    assert.equal(r.status, 1);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /per-symbol results for incomplete refresh/);
  });

for (const [name, args, text] of [
  ["A17 top-level -h", ["-h"], "Working commands:"],
  ["A17b top-level --help", ["--help"], "Working commands:"],
  ["A18 top-level --man", ["--man"], "WW(1)"],
  ["A19 fetch -h", ["fetch", "-h"], "Usage: ww fetch"],
  ["A20 fetch --help", ["fetch", "--help"], "Usage: ww fetch"],
  ["A21 fetch --man", ["fetch", "--man"], "WW-FETCH(1)"],
]) {
  await check(name, args, full, r => {
    assert.equal(r.status, 0);
    assert.equal(r.stderr, "");
    assert.ok(r.stdout.includes(text));
    assert.equal(r.requests.length, 0);
  });
}

await check("A21b long --verbose matches short verbose", ["fetch", "--verbose", "QQQ"], full, r => {
  assert.equal(r.status, 0);
  assert.ok(r.stderr.startsWith(`From ${base}\n`));
  assert.match(r.stderr, /QQQ  acquisition ACQUIRED\n/);
  assert.equal(lines(r.stdout).length, 1);
});

const SEED = ["SPY", "QQQ", "IWM", "SLV", "GLD", "TQQQ", "USO", "SMH", "SOXL", "GDX"];

await check("A22 bare fetch with empty monitored resolves exactly the ten seed symbols", ["fetch"],
  { kind: "complete", monitored: [] }, r => {
    assert.equal(r.status, 0);
    // First request is the monitored read; the refresh POST carries exactly the seed.
    const monitored = r.requests.find(req => req.path === "/api/evidence/monitored");
    const refresh = r.requests.find(req => req.path === "/api/evidence/refresh");
    assert.ok(monitored && refresh);
    assert.deepEqual(refresh.symbols, SEED);
    assert.deepEqual(lines(r.stdout).map(row => row.symbol), SEED);
  });

await check("A22b bare fetch unions monitored with the seed, dedupes overlap, acquires once",
  ["fetch"], { kind: "complete", monitored: ["XLE", "QQQ"] }, r => {
    assert.equal(r.status, 0);
    const refresh = r.requests.find(req => req.path === "/api/evidence/refresh");
    const expected = ["XLE", "QQQ", ...SEED.filter(s => s !== "QQQ")];
    assert.deepEqual(refresh.symbols, expected);
    assert.equal(refresh.symbols.filter(s => s === "QQQ").length, 1);
    assert.equal(new Set(refresh.symbols).size, refresh.symbols.length);
    assert.deepEqual(lines(r.stdout).map(row => row.symbol), expected);
  });

await check("A22c bare fetch -v shows selection provenance on stderr, not stdout",
  ["fetch", "-v"], { kind: "complete", monitored: ["XLE", "QQQ"] }, r => {
    assert.equal(r.status, 0);
    assert.match(r.stderr, /Default selection: 11 symbol\(s\)/);
    assert.match(r.stderr, /QQQ\s+both/);
    assert.match(r.stderr, /XLE\s+monitored/);
    assert.match(r.stderr, /SPY\s+experimental-seed/);
    assert.doesNotMatch(r.stdout, /Default selection|experimental-seed/);
  });

await check("A22d explicit operands replace the default and skip the monitored read",
  ["fetch", "QQQ", "SPY"], { kind: "complete", monitored: ["XLE", "ARKK"] }, r => {
    assert.equal(r.status, 0);
    assert.equal(r.requests.find(req => req.path === "/api/evidence/monitored"), undefined);
    const refresh = r.requests.find(req => req.path === "/api/evidence/refresh");
    assert.deepEqual(refresh.symbols, ["QQQ", "SPY"]);
  });

await check("A22e bare fetch aborts without whole-cycle POST when monitored read fails",
  ["fetch"], { kind: "monitored-error" }, r => {
    assert.equal(r.status, 1);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /HTTP 503/);
    assert.equal(r.requests.find(req => req.path === "/api/evidence/refresh"), undefined);
  });

await check("A23 -- terminates fetch options", ["fetch", "--", "QQQ"], full, r => {
  assert.equal(r.status, 0);
  assert.deepEqual(r.requests[0].symbols, ["QQQ"]);
});

const many = Array.from({ length: 650 }, (_, index) =>
  String.fromCharCode(65 + Math.floor(index / 26), 65 + index % 26));
const pipeCommand = `set -o pipefail; ./scripts/ww fetch ${many.join(" ")} | head -1`;
await check("A24 large fetch into head has no broken-pipe stack trace", [pipeCommand], full, r => {
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
  assert.equal(lines(r.stdout).length, 1);
  assert.equal(r.requests[0].symbols.length, 650);
}, { shell: true });

server.close();
const passed = cases.filter(item => item.pass).length;
console.log(`# Deterministic ww fetch acceptance evidence\n`);
console.log(`Fixture origin: \`${base}\`. Each request is handled by a local HTTP server with an explicit completed/incomplete response and per-symbol acquisition/held-price facts. TTY cases use the test-only two-PTY helper so stdout and stderr remain separate. Output below is JSON-escaped to preserve exact newlines and control bytes.\n`);
console.log(`Result: **${passed} passed / ${cases.length - passed} failed / 0 not executable**.\n`);
for (const item of cases) {
  console.log(`## ${item.name} — ${item.pass ? "PASS" : "FAIL"}\n`);
  console.log(`Command: \`${item.command.replaceAll("`", "\\`")}\`\n`);
  console.log(`Actual stdout: \`${JSON.stringify(item.stdout)}\`\n`);
  console.log(`Actual stderr: \`${JSON.stringify(item.stderr)}\`\n`);
  console.log(`Actual exit status: \`${item.status}\`\n`);
  console.log(`HTTP requests: \`${JSON.stringify(item.requests)}\`\n`);
  if (item.failure) console.log(`Failure: \`${JSON.stringify(item.failure)}\`\n`);
}
if (passed !== cases.length) process.exitCode = 1;
