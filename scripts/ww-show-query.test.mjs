import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseArgs } from './wheelwright.mjs';
import { parseShowJson, validateShowObservation, selectShowObservations, presentShowRows,
  presentShow, humanShowNumber, showColorEnabled, SHOW_FIELDS, decodePathSymbol } from './ww-show.mjs';
import { capture, TOKEN, REQUEST_ID } from './ww-fetch-fixtures.mjs';
const cli = new URL('./wheelwright.mjs', import.meta.url).pathname;
const ww = new URL('./ww', import.meta.url).pathname;
const pty = new URL('./ww-acceptance-pty.py', import.meta.url).pathname;
const number = s => JSON.rawJSON(s);
const strip = s => s.replace(/\x1b\[[0-9;]*m/g, '');
const raw = (symbol, type = 'ETF', change = '1') => ({
  observationId: '22222222-2222-4222-8222-222222222222', subject: { symbol, securityType: type },
  facts: { last: { price: number('12.3456') }, bid: { price: number('12.3') },
    reportedChange: number(change), reportedChangePercent: number(change) },
  provenance: { provider: 'tradier', environment: 'PRODUCTION',
    acquisitionId: '33333333-3333-4333-8333-333333333333', authorityEpoch: 'old',
    acquisitionPhase: 'CLOSED', receivedAt: '2026-10-06T04:01:25.123456789123Z',
    committedAt: '2026-10-06T04:01:26Z' }
});
const valid = q => validateShowObservation(parseShowJson(JSON.stringify(q)), q.subject.symbol);
const problem = (status, code) => ({ type: `urn:wheelwright:problem:${code.toLowerCase()}`,
  title: code === 'NOT_FOUND' ? 'Not found' : 'Internal error', status, code, requestId: REQUEST_ID,
  detail: 'Fixture held read failed.' });
const selectedSymbols = (rows, args) => selectShowObservations(rows.map(valid), parseArgs(['show', ...args]))
  .map(q => q.subject.symbol);
async function fixture(work) {
  const calls = [], state = { rows: {}, inventory: undefined, inventoryStatus: 200, before: undefined };
  for (const [s, t, c] of [['AAA', 'EQUITY', '999'], ['BBB', 'ETF', '-12'], ['CCC', 'ETF', '5'],
    ['DDD', 'ETF', '12'], ['EEE', 'ETF', '0']]) state.rows[s] = raw(s, t, c);
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    calls.push({ method: req.method, path: req.url, body });
    assert.equal(req.method, 'GET'); assert.equal(body, '');
    assert.equal(req.headers.authorization, `Bearer ${TOKEN}`);
    assert.match(req.url, /^\/v2\/quotes(?:\/[A-Z0-9_.-]+)?$/);
    if (state.before) await state.before(req.url);
    let status = 200, result;
    if (req.url === '/v2/quotes') {
      status = state.inventoryStatus;
      result = state.inventory ?? { requestId: REQUEST_ID, items: Object.keys(state.rows).sort().map(s => {
        const q = state.rows[s]?.body ?? state.rows[s];
        return { observationId: q.observationId, subject: q.subject,
          provenance: { provider: q.provenance.provider, environment: q.provenance.environment,
            receivedAt: q.provenance.receivedAt, committedAt: q.provenance.committedAt } };
      }) };
    } else {
      const symbol = decodePathSymbol(req.url.split('/').at(-1)), entry = state.rows[symbol];
      if (!entry) { status = 404; result = problem(404, 'NOT_FOUND'); }
      else if (entry.status) { status = entry.status; result = entry.body; }
      else result = entry;
    }
    res.statusCode = status;
    res.setHeader('Content-Type', status === 200 ? 'application/json' : 'application/problem+json');
    res.setHeader('X-Request-Id', REQUEST_ID);
    res.end(typeof result === 'string' ? result : JSON.stringify(result));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const env = { WW_BASE_URL: `http://127.0.0.1:${server.address().port}`, WW_API_TOKEN: TOKEN,
    TZ: 'America/Denver', TERM: 'xterm-256color', NO_COLOR: '' };
  const run = (args, more = {}) => capture([cli, 'show', ...args], { ...env, ...more });
  const terminal = async (args, more = {}) => JSON.parse((await capture([pty, ww, 'show', ...args],
    { ...env, ...more }, 'python3')).stdout);
  try { await work({ state, calls, env, run, terminal }); }
  finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
}

test('query grammar, typed exact filters and all conflicts fail before HTTP', async () => fixture(async ({ run, calls }) => {
  const invalid = [[], ['SPY', '--quotes'], ['--quotes', '--only', 'bid', '--all-fields'],
    ['SPY', '--all-fields', '--verbose'], ['SPY', '--table', '--verbose'],
    ['SPY', '--table', '--tsv'], ['SPY', '--jsonl', '--table'], ['SPY', '--jsonl', '--tsv'],
    ['SPY', '--absolute'], ['SPY', '--descending'], ['SPY', '--sort-by', 'type', '--absolute'],
    ['SPY', '--sort-by', 'missing'], ['SPY', '--sort-by'], ['SPY', '--by', 'last'],
    ['SPY', '--sort-by', 'last', '--sort-by', 'bid'], ['SPY', '--limit', '1', '--limit', '2'],
    ...['0', '-1', '+1', '1.5', '1e2', '', 'Infinity', 'NaN', '2\n'].map(n => ['SPY', '--limit', n]),
    ['SPY', '--limit'], ['SPY', '--where'], ['SPY', '--where', 'type'],
    ['SPY', '--where', '=ETF'], ['SPY', '--where', 'unknown=1'],
    ...['', 'NaN', '01', '1x', '1\n'].map(n => ['SPY', '--where', `last=${n}`]),
    ['SPY', '--where', 'receivedAt=2026-10-06'], ['SPY', '--where', 'regularSessionDate=2026-02-30']];
  for (const args of invalid) {
    const r = await run(args); assert.equal(r.status, 2, args.join(' ')); assert.equal(r.stdout, '');
    assert.ok(!r.stderr.includes(TOKEN));
  }
  assert.deepEqual(calls, []);
  const parsed = parseArgs(['show', '--quotes', '--where', 'type=ETF', '--where', 'description=a=b',
    '--sort-by', 'last', '--descending', '--absolute', '--limit', '0002', '--all-fields', '--table', '--table']);
  assert.equal(parsed.limit, 2n); assert.equal(parsed.where[1].value, 'a=b');
  assert.equal(parseArgs(['show', 'SPY', '--limit', '999999999999999999999999']).limit,
    999999999999999999999999n);
  const noCredential = await run(['SPY', '--where', 'last=bad'], { WW_API_TOKEN: '' });
  assert.equal(noCredential.status, 2); assert.deepEqual(calls, []);
}));

test('primary question: complete collection, filter before absolute sort before limit, stable ties', async () => fixture(async ({ run, calls }) => {
  const r = await run(['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent',
    '--absolute', '--descending', '--limit', '2', '--all-fields', '--table']);
  assert.equal(r.status, 0); assert.equal(r.stderr, '');
  const lines = strip(r.stdout).trimEnd().split('\n');
  assert.equal(lines.length, 3); assert.deepEqual(lines.slice(1).map(s => s.split(/\s+/)[0]), ['BBB', 'DDD']);
  assert.ok(!r.stdout.includes('FIELD                        VALUE'));
  const headings = lines[0].split(/\s{2,}/).map(s => s.trim());
  assert.deepEqual(headings, SHOW_FIELDS.map(f => f.heading));
  assert.equal(headings.length, 36);
  assert.deepEqual(calls.map(c => c.path), ['/v2/quotes', ...['AAA', 'BBB', 'CCC', 'DDD', 'EEE'].map(s => '/v2/quotes/' + s)]);
  assert.ok(calls.every(c => c.method === 'GET' && c.body === ''));
  assert.match(r.stdout, /\x1b\[31m\s*-12%/); assert.match(r.stdout, /\x1b\[32m\s*\+12%/);
}));

test('public sorting asc/desc, unprojected key, missing last, ties and limit-only', async () => fixture(async ({ state, run }) => {
  delete state.rows.EEE.facts.reportedChangePercent;
  for (const [flags, expected] of [[[], ['BBB', 'CCC', 'DDD', 'EEE']],
    [['--descending'], ['DDD', 'CCC', 'BBB', 'EEE']],
    [['--absolute'], ['CCC', 'BBB', 'DDD', 'EEE']],
    [['--absolute', '--descending'], ['BBB', 'DDD', 'CCC', 'EEE']]]) {
    const r = await run(['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent', ...flags, '--only', 'symbol']);
    assert.equal(r.status, 0); assert.equal(r.stdout, expected.join('\n') + '\n');
  }
  assert.equal((await run(['--quotes', '--limit', '2', '--only', 'symbol'])).stdout, 'AAA\nBBB\n');
  assert.equal((await run(['DDD', 'BBB', '--sort-by', 'reportedChangePercent', '--absolute', '--only', 'symbol'])).stdout, 'DDD\nBBB\n');
}));

test('exact numeric equality/order beyond Number precision and extreme exponents', () => {
  const rows = [raw('AAA', 'ETF', '9007199254740993'), raw('BBB', 'ETF', '9007199254740992'),
    raw('CCC', 'ETF', '1e1000000'), raw('DDD', 'ETF', '1e-1000000'), raw('EEE', 'ETF', '-1e1000000')];
  assert.deepEqual(selectedSymbols(rows, ['--quotes', '--sort-by', 'reportedChange']), ['EEE', 'DDD', 'BBB', 'AAA', 'CCC']);
  assert.deepEqual(selectedSymbols(rows, ['--quotes', '--where', 'reportedChange=9007199254740993']), ['AAA']);
  assert.deepEqual(selectedSymbols([raw('AAA', 'ETF', '1.00'), raw('BBB', 'ETF', '1e0')],
    ['--quotes', '--where', 'reportedChange=1']), ['AAA', 'BBB']);
  assert.deepEqual(selectedSymbols([raw('AAA', 'ETF', '-0'), raw('BBB', 'ETF', '0e1000')],
    ['--quotes', '--where', 'reportedChange=0']), ['AAA', 'BBB']);
});

test('exact case-sensitive text/empty/missing filters, AND and public OTHER', () => {
  const a = raw('AAA', 'OTHER_UNDERLYING'), b = raw('BBB'), c = raw('CCC');
  a.facts.description = ''; b.facts.description = 'a=b';
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'type=OTHER']), ['AAA']);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'description=']), ['AAA']);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'description=a=b', '--where', 'type=ETF']), ['BBB']);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'type=etf']), []);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'bidVenue=']), []);
});

test('instant equality and chronological order preserve sub-millisecond precision; dates/text ordinal', () => {
  const a = raw('AAA'), b = raw('BBB'), c = raw('CCC');
  a.provenance.receivedAt = '2026-01-01T00:00:00.000000000002Z';
  b.provenance.receivedAt = '2026-01-01t00:00:00.0000000000010Z';
  c.provenance.receivedAt = '2025-12-31T23:59:59.999999999999Z';
  a.provenance.regularSessionDate = '2026-01-01'; b.provenance.regularSessionDate = '2025-12-31';
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--sort-by', 'receivedAt']), ['CCC', 'BBB', 'AAA']);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--where', 'receivedAt=2026-01-01T00:00:00.000000000001Z']), ['BBB']);
  assert.deepEqual(selectedSymbols([a, b, c], ['--quotes', '--sort-by', 'regularSessionDate', '--descending']), ['AAA', 'BBB', 'CCC']);
  assert.deepEqual(selectedSymbols([c, a, b], ['--quotes', '--sort-by', 'symbol', '--descending']), ['CCC', 'BBB', 'AAA']);
});

test('human adaptive decimal precision/signs, exact zero, extreme values and exact counts', () => {
  for (const [source, expected] of [['12.3456', '12.35'], ['12.30000', '12.3'], ['0.000123456', '0.000123'],
    ['0.0099999', '0.01'], ['1e-1000000', '1e-1000000'], ['1e1000000', '1e+1000000'],
    ['0', '0'], ['-0', '0'], ['999.9999', '1000']])
    assert.equal(humanShowNumber(number(source), 'price'), expected);
  assert.equal(humanShowNumber(number('1.2345'), 'change'), '+1.23');
  assert.equal(humanShowNumber(number('-1.2345'), 'percent'), '-1.23%');
  assert.equal(humanShowNumber(number('0'), 'percent'), '0%');
  assert.equal(humanShowNumber(number('9007199254740993'), 'integer'), '9007199254740993');
  assert.equal(humanShowNumber(number('1.234500'), 'change', true), '+1.234500');
});

test('human semantic colors decorate only change fields, preserve alignment and obey opt-outs', () => {
  const rows = [valid(raw('AAA', 'ETF', '1.2345')), valid(raw('BBB', 'ETF', '-2.3456')), valid(raw('CCC', 'ETF', '0'))];
  const opts = { only: ['symbol', 'last', 'reportedChange', 'reportedChangePercent', 'bid', 'receivedAt'], format: 'table', env: { TERM: 'xterm', NO_COLOR: '' } };
  const colored = presentShowRows(rows, opts);
  const plain = presentShowRows(rows, { ...opts, env: { NO_COLOR: '1' } });
  assert.equal(strip(colored), plain);
  assert.equal((colored.match(/\x1b\[32m/g) ?? []).length, 2);
  assert.equal((colored.match(/\x1b\[31m/g) ?? []).length, 2);
  assert.match(colored, /\x1b\[32m\s*\+1.23\x1b\[39m/);
  assert.match(colored, /\x1b\[32m\s*\+1.23%\x1b\[39m/);
  assert.match(colored, /\x1b\[31m\s*-2.35\x1b\[39m/);
  assert.match(colored, /\x1b\[31m\s*-2.35%\x1b\[39m/);
  assert.doesNotMatch(colored.split('\n')[3], /\x1b\[/);
  assert.ok(!colored.includes('\x1b[32m12.35'));
  // Isolated renderer guard: even a negative non-change value is never sign-colored.
  // Canonical validation still rejects negative prices; this is not an admitted observation.
  rows[0].facts.last.price = number('-12.3456');
  const guarded = presentShowRows([rows[0]], { ...opts, only: ['last'] });
  assert.doesNotMatch(guarded, /\x1b\[/); assert.match(guarded, /-12.35/);
  for (const env of [{ NO_COLOR: '1' }, { NO_COLOR: '0' }, { TERM: 'dumb' }]) {
    assert.equal(showColorEnabled(opts, env), false);
    assert.doesNotMatch(presentShowRows(rows, { ...opts, env }), /\x1b\[/);
  }
  assert.equal(showColorEnabled(opts, { NO_COLOR: '' }), true);
  assert.equal(showColorEnabled({ tty: false }, {}), false);
  assert.equal(showColorEnabled({ tty: true }, {}), true);
});

test('explicit formats across TTY/pipe; all fields remain horizontal, canonical and ANSI-free machines', async () => fixture(async ({ run, terminal }) => {
  const args = ['BBB', '--all-fields'];
  const pipedTable = await run([...args, '--table']);
  assert.match(pipedTable.stdout, /\x1b\[31m/); assert.equal(strip(pipedTable.stdout).trimEnd().split('\n').length, 2);
  assert.equal(strip(pipedTable.stdout), strip((await terminal(args)).stdout).replaceAll('\r\n', '\n'));
  const auto = await run(args); assert.doesNotMatch(auto.stdout, /\x1b\[/);
  assert.equal(auto.stdout.split('\n')[0].split('\t').length, 36);
  assert.equal((await run([...args, '--tsv'])).stdout, auto.stdout);
  assert.equal((await terminal([...args, '--tsv'])).stdout.replaceAll('\r\n', '\n'), auto.stdout);
  for (const output of [run, terminal]) {
    const r = await output(['BBB', '--jsonl', '--all-fields']); assert.equal(r.status, 0);
    assert.doesNotMatch(r.stdout, /\x1b\[/); assert.equal(JSON.parse(r.stdout).facts.reportedChangePercent, -12);
    assert.match(r.stdout, /12.3456/); assert.match(r.stdout, /2026-10-06T04:01:25.123456789123Z/);
  }
  const noColor = await run([...args, '--table'], { NO_COLOR: '1' }); assert.doesNotMatch(noColor.stdout, /\x1b\[/);
  const dumb = await run([...args, '--table'], { TERM: 'dumb' }); assert.doesNotMatch(dumb.stdout, /\x1b\[/);
  assert.match(strip(pipedTable.stdout), /2026-10-05 22:01:25 -06:00/);
  assert.ok(!strip(pipedTable.stdout).includes('.123456789123'));
}));

test('limits inspect excluded/malformed subjects; partial ranked successes are truthful', async () => fixture(async ({ state, calls, run }) => {
  state.rows.AAA.facts.bid.sourceEventAt = 'asksize'; // EQUITY would be excluded, but must fail strict validation.
  const r = await run(['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent',
    '--absolute', '--descending', '--limit', '1', '--only', 'symbol']);
  assert.equal(r.status, 1); assert.equal(r.stdout, 'BBB\n');
  assert.match(r.stderr, /AAA:.*invalid complete canonical observation/);
  assert.match(r.stderr, /partial results.*4 successfully read observations of 5 selected; 1 failed/);
  assert.equal(calls.length, 6);
  const explicit = await run(['MISS', 'BBB', 'BAD', '--sort-by', 'last', '--jsonl']);
  assert.equal(explicit.status, 1); assert.equal(explicit.stdout.trim().split('\n').length, 1);
  assert.match(explicit.stderr, /MISS:.*NOT_FOUND/); assert.match(explicit.stderr, /BAD:.*NOT_FOUND/);
  assert.match(explicit.stderr, /partial results/);
  const failed = await run(['MISS', 'BAD', '--sort-by', 'last', '--table']); assert.equal(failed.stdout, '');
}));

test('ranked stdout is withheld until every selected subject is inspected', async () => fixture(async ({ state, env }) => {
  let reached; const waiting = new Promise(resolve => reached = resolve);
  let release; const gate = new Promise(resolve => release = resolve);
  state.before = async path => { if (path === '/v2/quotes/CCC') { reached(); await gate; } };
  const child = spawn(process.execPath, [cli, 'show', 'BBB', 'CCC', '--sort-by', 'last', '--limit', '1', '--only', 'symbol'], { env: { ...process.env, ...env } });
  let stdout = '', stderr = ''; child.stdout.on('data', c => stdout += c); child.stderr.on('data', c => stderr += c);
  await waiting; assert.equal(stdout, ''); release();
  const [status] = await once(child, 'close'); assert.equal(status, 0); assert.equal(stdout, 'BBB\n'); assert.equal(stderr, '');
}));

test('inventory failures cannot become empty/partial success; empty and no matches succeed', async () => fixture(async ({ state, run, calls }) => {
  state.inventory = { requestId: REQUEST_ID, items: [] };
  for (const args of [['--quotes'], ['--quotes', '--jsonl'], ['--quotes', '--all-fields', '--tsv']]) {
    const r = await run(args); assert.equal(r.status, 0); assert.equal(r.stdout, '');
  }
  assert.equal((await run(['--quotes', '--table'])).stdout, 'No canonical direct quotes held.\n');
  state.inventory = undefined;
  assert.equal((await run(['--quotes', '--where', 'type=BOND', '--table'])).stdout,
    'No canonical direct quotes match the selected filters.\n');
  state.inventory = '{'; const before = calls.length;
  const r = await run(['--quotes', '--where', 'type=ETF', '--limit', '1']);
  assert.equal(r.status, 1); assert.equal(r.stdout, ''); assert.equal(calls.length, before + 1);
}));

test('buffered output failure and clean EPIPE preserve existing exit conventions', async () => fixture(async ({ env }) => {
  const hook = 'data:text/javascript,' + encodeURIComponent('process.stdout.write=()=>{const e=new Error("fixture output failure");e.code="ENOSPC";throw e;}');
  const r = await capture(['--import', hook, cli, 'show', '--quotes', '--sort-by', 'last'], env);
  assert.equal(r.status, 1); assert.equal(r.stdout, ''); assert.match(r.stderr, /fixture output failure/);
  const pipe = await capture(['-o', 'pipefail', '-c', '"$WW_TEST_CLI" show --quotes --table | head -n 1'],
    { ...env, WW_TEST_CLI: ww }, 'bash');
  assert.equal(pipe.status, 0); assert.equal(pipe.stderr, '');
}));

test('installed discovery/help/manual advertise the exact question and color convention', async () => {
  const manual = await readFile(new URL('../docs/cli/ww-show-man.txt', import.meta.url), 'utf8');
  for (const text of ['--where FIELD=VALUE', '--sort-by FIELD', '--all-fields', '--table', 'NO_COLOR', 'watch -c']) assert.ok(manual.includes(text));
  const help = await capture([cli, 'show', '--help'], { WW_API_TOKEN: 'bad', WW_BASE_URL: 'bad' });
  assert.equal(help.status, 0); assert.match(help.stdout, /--where type=ETF/); assert.match(help.stdout, /--sort-by/);
});

test('actual watch -c preserves piped --table positive/negative change colors', { timeout: 10000 }, async () => fixture(async ({ state, env, calls }) => {
  let count = 0;
  state.before = async path => { if (path === '/v2/quotes/BBB') state.rows.BBB = raw('BBB', 'ETF', ++count === 1 ? '1' : '-1'); };
  const command = `${ww} show BBB --only symbol,reportedChange,reportedChangePercent --table`;
  const r = JSON.parse((await capture([pty, '--stdin-tty', 'watch', '-c', '-t', '-n', '0.1', '-q', '1', command],
    { ...env, COLUMNS: '120', LINES: '24' }, 'python3')).stdout);
  assert.equal(r.status, 0, JSON.stringify(r)); assert.equal(r.stderr, '');
  assert.match(r.stdout, /\x1b\[32m/); assert.match(r.stdout, /\x1b\[31m/);
  assert.ok(calls.length >= 2); assert.ok(calls.every(c => c.path === '/v2/quotes/BBB'));
}));
