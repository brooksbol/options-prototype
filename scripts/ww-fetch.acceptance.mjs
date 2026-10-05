#!/usr/bin/env node
// Black-box terminal and shell acceptance; no live provider or credential needed.
import assert from "node:assert/strict";
import { fixture, capture, TOKEN } from "./ww-fetch-fixtures.mjs";
const ww = new URL("./ww", import.meta.url).pathname;
const pty = new URL("./ww-acceptance-pty.py", import.meta.url).pathname;
const f = await fixture();
const env = { WW_BASE_URL: f.base, WW_API_TOKEN: TOKEN };
let passed = 0;
function shellQuote(arg) {
  return /^[A-Za-z0-9_./:-]+$/.test(arg) ? arg : "'" + arg.replaceAll("'", "'\\''") + "'";
}

function showResult(name, command, result, tty) {
  // Print captured streams even on assertion failure, but redact before rendering.
  const safe = text => text.replaceAll(TOKEN, "[REDACTED]");
  const stream = text => text ? safe(text).replaceAll("\r\n", "\n") +
    (text.endsWith("\n") ? "" : "\n") : "(empty)\n";
  console.log(`\n--- ${name}${tty ? " (terminal)" : " (redirected)"} ---`);
  console.log(`$ WW_BASE_URL=${f.base} ${safe(command)}`);
  process.stdout.write(`stdout:\n${stream(result.stdout)}stderr:\n${stream(result.stderr)}`);
  console.log(`exit: ${result.status}`);
}

async function check(name, args, verify, tty = false, shell = false) {
  const start = f.calls.length;
  const raw = tty ? await capture([pty, ww, ...args], env, "python3") :
    shell ? await capture(["-c", args], env, "zsh") : await capture(args, env, ww);
  const r = tty ? JSON.parse(raw.stdout) : raw;
  const command = shell ? `zsh -c ${shellQuote(args)}` : [ww, ...args].map(shellQuote).join(" ");
  showResult(name, command, r, tty);
  try {
    assert.ok(!r.stdout.includes(TOKEN) && !r.stderr.includes(TOKEN), "credential leaked into CLI output");
    verify(r, f.calls.slice(start));
  } catch (error) {
    console.log(`FAIL ${name}`);
    // Assertion diagnostics may contain captured output; never echo a token there.
    throw new Error(String(error.message).replaceAll(TOKEN, "[REDACTED]"));
  }
  passed++;
  console.log(`PASS ${name}`);
}

console.log("Deterministic local v2 fixture; Bearer credential supplied privately.");
console.log("Each case shows its command, captured streams, and exit status. No live provider work.");

try {
  await check("TTY ORDINARY acquisition and reuse", ["fetch", "SPY", "QQQ"], r => {
    assert.equal(r.status, 0); assert.equal(r.stdout, "");
    assert.match(r.stderr, /SPY: NEWLY_ACQUIRED/);
    assert.match(r.stderr, /fetch complete: 2\/2 fulfilled/);
  }, true);
  f.state.outcomes = { QQQ: { outcome: "REUSED" } };
  await check("TTY reuse is not a new provider acquisition", ["fetch", "SPY", "QQQ"], r => {
    assert.equal(r.status, 0); assert.match(r.stderr, /QQQ: REUSED/);
    assert.match(r.stderr, /1 newly acquired, 1 reused/);
  }, true);
  await check("TTY quiet success", ["fetch", "-q", "SPY"], r => {
    assert.equal(r.status, 0); assert.equal(r.stdout, ""); assert.equal(r.stderr, "");
  }, true);
  await check("TTY verbose authority/correlation", ["fetch", "-v", "SPY"], r => {
    assert.equal(r.status, 0); assert.ok(r.stderr.startsWith(`From ${f.base}`));
    assert.match(r.stderr, /Request .*; mode ORDINARY/);
  }, true);
  f.state.outcomes = { SPY: { outcome: "UPSTREAM_FAILED", retained: true } };
  await check("TTY quiet FORCE retained prior still fails", ["fetch", "-q", "SPY", "--force"], (r, calls) => {
    assert.equal(r.status, 1); assert.equal(r.stdout, "");
    assert.match(r.stderr, /FAILED UPSTREAM_FAILED; prior quote retained/);
    assert.equal(calls.length, 1); assert.equal(calls[0].body.mode, "FORCE");
  }, true);
  await check("TTY bare fetch does no work", ["fetch"], (r, calls) => {
    assert.equal(r.status, 2); assert.equal(calls.length, 0);
  }, true);
  f.state.outcomes = {};
  // Domain cap is 30 subjects. Test early pipe closure within the real cap.
  const symbols = Array.from({ length: 30 }, (_, i) => `S${i}`);
  const command = `set -o pipefail; '${ww}' fetch ${symbols.join(" ")} | head -1`;
  await check("batch piped to head closes cleanly", command, r => {
    assert.equal(r.status, 0); assert.equal(r.stderr, "");
    assert.equal(r.stdout.trim().split("\n").length, 1);
  }, false, true);
  f.state.outcomes = { S29: { outcome: "UPSTREAM_FAILED", retained: true } };
  await check("partial failure stays nonzero through head", command, r => {
    assert.equal(r.status, 1); assert.match(r.stderr, /S29: FAILED UPSTREAM_FAILED/);
  }, false, true);
  f.state.outcomes = {};
  await check("successful fetch allows the next shell command",
    `'${ww}' fetch SPY && printf completed`, r => {
      assert.equal(r.status, 0); assert.ok(r.stdout.endsWith("completed"));
    }, false, true);
  f.state.outcomes = { SPY: { outcome: "UPSTREAM_FAILED", retained: true } };
  await check("failed fetch stops the next shell command",
    `'${ww}' fetch SPY && printf should-not-run`, r => {
      assert.equal(r.status, 1); assert.ok(!r.stdout.includes("should-not-run"));
    }, false, true);
  assert.ok(f.calls.every(c => c.path === "/v2/quotes" && c.method === "POST"));
  console.log(`Result: ${passed} passed; zero legacy/chain requests.`);
} finally { await f.close(); }
