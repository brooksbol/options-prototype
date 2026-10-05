#!/usr/bin/env node
// Black-box terminal and shell acceptance; no live provider or credential needed.
import assert from "node:assert/strict";
import { fixture, capture, TOKEN } from "./ww-fetch-fixtures.mjs";
const ww = new URL("./ww", import.meta.url).pathname;
const pty = new URL("./ww-acceptance-pty.py", import.meta.url).pathname;
const f = await fixture();
const env = { WW_BASE_URL: f.base, WW_API_TOKEN: TOKEN };
let passed = 0;
async function check(name, args, verify, tty = false) {
  const start = f.calls.length;
  const raw = tty ? await capture([pty, ww, ...args], env, "python3") : await capture(args, env, ww);
  const r = tty ? JSON.parse(raw.stdout) : raw;
  assert.ok(!r.stdout.includes(TOKEN) && !r.stderr.includes(TOKEN));
  verify(r, f.calls.slice(start));
  passed++;
  console.log(`PASS ${name}`);
}
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
  let r = await capture(["-c", command], env, "zsh");
  assert.equal(r.status, 0); assert.equal(r.stderr, "");
  assert.equal(r.stdout.trim().split("\n").length, 1); passed++;
  console.log("PASS batch piped to head closes cleanly");
  f.state.outcomes = { S29: { outcome: "UPSTREAM_FAILED", retained: true } };
  r = await capture(["-c", command], env, "zsh");
  assert.equal(r.status, 1); assert.match(r.stderr, /S29: FAILED UPSTREAM_FAILED/); passed++;
  console.log("PASS partial failure stays nonzero through head");
  f.state.outcomes = {};

  r = await capture(["-c", `'${ww}' fetch SPY && printf completed`], env, "zsh");
  assert.equal(r.status, 0); assert.ok(r.stdout.endsWith("completed")); passed++;
  f.state.outcomes = { SPY: { outcome: "UPSTREAM_FAILED", retained: true } };
  r = await capture(["-c", `'${ww}' fetch SPY && printf should-not-run`], env, "zsh");
  assert.equal(r.status, 1); assert.ok(!r.stdout.includes("should-not-run")); passed++;
  assert.ok(f.calls.every(c => c.path === "/v2/quotes" && c.method === "POST"));
  console.log(`Result: ${passed} passed; zero legacy/chain requests.`);
} finally { await f.close(); }
