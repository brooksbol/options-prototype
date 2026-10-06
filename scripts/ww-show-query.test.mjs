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
const foregroundAfter = (foreground, sequence) => {
  const codes = sequence.slice(2, -1).split(';').map(Number);
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if ((code === 38 || code === 48) && codes[i + 1] === 5) {
      if (code === 38) foreground = codes[i + 2];
      i += 2;
    } else if (code === 0 || code === 39) foreground = 39;
    else if (code >= 30 && code <= 37) foreground = code;
  }
  return foreground;
};
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

test('primary question: complete collection, magnitude selection before signed output order, stable cutoff ties', async () => fixture(async ({ run, calls }) => {
  const r = await run(['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent',
    '--absolute', '--descending', '--limit', '2', '--all-fields', '--table']);
  assert.equal(r.status, 0); assert.equal(r.stderr, '');
  const lines = strip(r.stdout).trimEnd().split('\n');
  assert.equal(lines.length, 3); assert.deepEqual(lines.slice(1).map(s => s.split(/\s+/)[0]), ['DDD', 'BBB']);
  assert.ok(!r.stdout.includes('FIELD                        VALUE'));
  const headings = lines[0].split(/\s{2,}/).map(s => s.trim());
  assert.deepEqual(headings, SHOW_FIELDS.map(f => f.heading));
  assert.equal(headings.length, 36);
  assert.deepEqual(calls.map(c => c.path), ['/v2/quotes', ...['AAA', 'BBB', 'CCC', 'DDD', 'EEE'].map(s => '/v2/quotes/' + s)]);
  assert.ok(calls.every(c => c.method === 'GET' && c.body === ''));
  assert.match(r.stdout, /\x1b\[38;5;203m\s*-12%/); assert.match(r.stdout, /\x1b\[32m\s*\+12%/);
}));

test('public sorting asc/desc, unprojected key, missing last, ties and limit-only', async () => fixture(async ({ state, run }) => {
  delete state.rows.EEE.facts.reportedChangePercent;
  for (const [flags, expected] of [[[], ['BBB', 'CCC', 'DDD', 'EEE']],
    [['--descending'], ['DDD', 'CCC', 'BBB', 'EEE']],
    [['--absolute'], ['BBB', 'CCC', 'DDD', 'EEE']],
    [['--absolute', '--descending'], ['DDD', 'CCC', 'BBB', 'EEE']]]) {
    const r = await run(['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent', ...flags, '--only', 'symbol']);
    assert.equal(r.status, 0); assert.equal(r.stdout, expected.join('\n') + '\n');
  }
  assert.equal((await run(['--quotes', '--limit', '2', '--only', 'symbol'])).stdout, 'AAA\nBBB\n');
  assert.equal((await run(['DDD', 'BBB', '--sort-by', 'reportedChangePercent', '--absolute', '--only', 'symbol'])).stdout, 'BBB\nDDD\n');
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

test('human fixed monetary decimals, adaptive percentages, signs and exact counts', () => {
  for (const [source, expected] of [['12.3456', '12.35'], ['12.30000', '12.30'], ['0.000123456', '0.00'],
    ['0.0099999', '0.01'], ['0.005', '0.01'], ['0.004999999', '0.00'], ['1e-1000000', '0.00'],
    ['1e1000000', '1.00e+1000000'], ['0', '0.00'], ['-0', '0.00'], ['999.9999', '1000.00']])
    assert.equal(humanShowNumber(number(source), 'price'), expected);
  assert.equal(humanShowNumber(number('-0.005'), 'change'), '-0.01');
  assert.equal(humanShowNumber(number('0.00001'), 'change'), '+0.00');
  assert.equal(humanShowNumber(number('0.000123456'), 'percent'), '+0.000123%');
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
  assert.equal((colored.match(/\x1b\[38;5;203m/g) ?? []).length, 2);
  assert.match(colored, /\x1b\[32m\+1.23\x1b\[37m/);
  assert.match(colored, /\x1b\[32m\+1.23%\x1b\[37m/);
  assert.match(colored, /\x1b\[38;5;203m-2.35\x1b\[37m/);
  assert.match(colored, /\x1b\[38;5;203m-2.35%\x1b\[37m/);
  assert.doesNotMatch(colored.split('\n')[3], /\x1b\[(?:38;5;203|32)m/);
  assert.ok(!colored.includes('\x1b[32m12.35'));
  // Isolated renderer guard: even a negative non-change value is never sign-colored.
  // Canonical validation still rejects negative prices; this is not an admitted observation.
  rows[0].facts.last.price = number('-12.3456');
  const guarded = presentShowRows([rows[0]], { ...opts, only: ['last'] });
  assert.doesNotMatch(guarded, /\x1b\[(?:38;5;203|32)m/); assert.match(guarded, /-12.35/);
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
  assert.match(pipedTable.stdout, /\x1b\[38;5;203m/); assert.equal(strip(pipedTable.stdout).trimEnd().split('\n').length, 2);
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
  assert.match(strip(pipedTable.stdout), /Oct 5 22:01/);
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
  assert.match(r.stdout, /\x1b\[32m/); assert.match(r.stdout, /\x1b\[38;5;203m/);
  assert.match(r.stdout, /\x1b\[37mSYMBOL/);
  assert.match(r.stdout, /\x1b\[32m(?:\x1b\[(?:40|48;5;232)m)*\+1\.00\x1b\[37m(?:\x1b\[(?:40|48;5;232)m)* +\x1b\[32m(?:\x1b\[(?:40|48;5;232)m)*\+1%(?:\x1b\[[0-9;]*m)*\x1b\[37m/);
  assert.ok(calls.length >= 2); assert.ok(calls.every(c => c.path === '/v2/quotes/BBB'));
}));


test('all-fields timestamps share compact local clocks; canonical machines and calendar date unchanged', () => {
  const source = raw('AAA');
  source.facts.last.sourceEventAt = '2026-10-06T00:00:01Z';
  source.facts.bid.sourceEventAt = '2026-10-06T04:01:23.123456789Z';
  source.facts.ask = { price: number('12.4'), sourceEventAt: '2026-10-06T04:02:59Z' };
  source.provenance.regularSessionDate = '2026-10-05';
  const q = valid(source), before = JSON.stringify(q), old = process.env.TZ;
  try {
    process.env.TZ = 'America/Denver';
    const expected = ['Oct 5 18:00', 'Oct 5 22:01', 'Oct 5 22:02', 'Oct 5 22:01', 'Oct 5 22:01'];
    const instants = SHOW_FIELDS.filter(f => f.kind === 'instant');
    assert.equal(instants.length, 5);
    const all = presentShow(q, { allFields: true, format: 'table', env: { NO_COLOR: '1' } });
    instants.forEach((f, i) => {
      const cell = presentShow(q, { only: [f.name], format: 'table', env: { NO_COLOR: '1' } }).trimEnd().split('\n')[1];
      assert.equal(cell, expected[i]);
      const [heading, row] = all.split('\n'), start = heading.indexOf(f.heading);
      assert.equal(row.slice(start, start + Math.max(f.heading.length, 8, expected[i].length)).trim(), expected[i]);
      const column = SHOW_FIELDS.indexOf(f);
      const tsv = presentShow(q, { allFields: true, format: 'tsv' }).trimEnd().split('\t');
      assert.equal(tsv[column], f.extract(q));
      assert.equal(f.extract(JSON.parse(presentShow(q, { format: 'jsonl' }))), f.extract(q));
    });
    assert.doesNotMatch(all, /-06:00|T04:|\.123456789/);
    assert.match(all, /2026-10-05/); // calendar date is not an instant
    delete q.facts.bid.sourceEventAt;
    assert.equal(presentShow(q, { only: ['bidSourceEventAt'], format: 'table', env: { NO_COLOR: '1' } }).trimEnd().split('\n')[1], '-');
    q.facts.bid.sourceEventAt = source.facts.bid.sourceEventAt;
    assert.equal(JSON.stringify(q), before);
  } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});

test('ANSI spans contain only signed change values; green-default terminal ordinary content is white', () => {
  const rows = [valid(raw('AAA', 'ETF', '1')), valid(raw('BBB', 'ETF', '-12')), valid(raw('CCC', 'ETF', '0'))];
  const options = { format: 'table', only: ['symbol', 'reportedChange', 'last', 'reportedChangePercent', 'bid'], env: { TERM: 'xterm' } };
  const output = presentShowRows(rows, options);
  assert.ok(output.startsWith('\x1b[37m'));
  assert.ok(output.endsWith('\x1b[0m'));
  const spans = [...output.matchAll(/\x1b\[(38;5;203|32)m([^\x1b]*)\x1b\[37m/g)];
  assert.deepEqual(spans.map(m => [m[1], m[2]]), [['32', '+1.00'], ['32', '+1%'], ['38;5;203', '-12.00'], ['38;5;203', '-12%']]);
  // Track foreground state rather than merely stripping ANSI. Inherit green
  // initially, like the Principal's terminal; every non-value character is white.
  let foreground = 32, plain = '', coloredValues = [];
  for (const chunk of output.split(/(\x1b\[[0-9;]*m)/)) {
    if (chunk.startsWith('\x1b[')) {
      foreground = foregroundAfter(foreground, chunk);
    }
    else if (chunk) {
      plain += chunk;
      if (foreground === 203 || foreground === 32) {
        assert.match(chunk, /^[+-]\d+(?:\.\d+)?%?$/);
        coloredValues.push(chunk);
      } else if (foreground === 226) assert.match(chunk, /^(AAA|BBB|CCC)$/);
      else if (foreground === 208) assert.equal(chunk, '12.35');
      else assert.equal(foreground, 37, JSON.stringify(chunk));
    }
  }
  assert.deepEqual(coloredValues, ['+1.00', '+1%', '-12.00', '-12%']);
  assert.equal(plain, presentShowRows(rows, { ...options, env: { NO_COLOR: '1' } }));
  const lines = plain.trimEnd().split('\n');
  // Right-aligned semantic values and subsequent cells occupy identical columns.
  assert.equal(lines[1].indexOf('12.35'), lines[2].indexOf('12.35'));
  assert.match(output, /\x1b\[37m  +\x1b\[38;5;208m12.35\x1b\[37m/); // following LAST is explicitly orange; padding is white
  assert.match(output, /\x1b\[37m  +12.30 *\x1b\[49m\n\x1b\[37m\x1b\[48;5;232m\x1b\[38;5;226mBBB/); // padding, separator, next row stay white
});

test('complete registry puts description immediately after symbol without changing exact --only', () => {
  assert.deepEqual(SHOW_FIELDS.slice(0, 2).map(f => f.name), ['symbol', 'description']);
  const q = valid(raw('AAA')); q.facts.description = 'Example ETF';
  const all = presentShow(q, { allFields: true, format: 'table', env: { NO_COLOR: '1' } });
  assert.deepEqual(all.split('\n')[0].split(/\s{2,}/).slice(0, 3), ['SYMBOL', 'DESCRIPTION', 'TYPE']);
  assert.equal(presentShow(q, { only: ['type', 'symbol', 'description'], format: 'tsv' }), 'ETF\tAAA\tExample ETF\n');
});


test('human ID suffixes preserve full canonical machine, verbose and selection identities', () => {
  const q = valid(raw('AAA')), before = JSON.stringify(q);
  const only = ['observationId', 'acquisitionId'];
  const full = [q.observationId, q.provenance.acquisitionId];
  for (const mode of [{ tty: true }, { format: 'table' }]) {
    const output = presentShow(q, { ...mode, only, env: { NO_COLOR: '1' } });
    assert.deepEqual(output.trimEnd().split('\n')[1].split(/\s{2,}/), full.map(id => id.slice(-12)));
    const complete = presentShow(q, { ...mode, allFields: true, env: { NO_COLOR: '1' } });
    for (const id of full) { assert.ok(complete.includes(id.slice(-12))); assert.ok(!complete.includes(id)); }
  }
  assert.equal(presentShow(q, { only, format: 'tsv' }), full.join('\t') + '\n');
  assert.equal(presentShow(q, { only }), full.join('\t') + '\n');
  for (const id of full) {
    assert.ok(presentShow(q, { format: 'jsonl' }).includes(id));
    assert.ok(presentShow(q, { tty: true, verbose: true, env: { NO_COLOR: '1' } }).includes(id));
  }
  assert.deepEqual(selectedSymbols([raw('AAA')], ['--quotes', '--where', 'observationId=' + full[0]]), ['AAA']);
  assert.deepEqual(selectedSymbols([raw('AAA')], ['--quotes', '--where', 'observationId=' + full[0].slice(-12)]), []);
  assert.equal(JSON.stringify(q), before);
});


test('actual clipped watch -c -w restores row foreground and scoped yellow symbols/changes', { timeout: 10000 }, async () => fixture(async ({ state, env, calls }) => {
  for (const [symbol, change] of [['AAA', '1'], ['BBB', '-2'], ['CCC', '0']]) {
    state.rows[symbol] = raw(symbol, 'ETF', change);
    state.rows[symbol].facts.description = 'Long description that deliberately extends past the watch viewport';
  }
  const command = `${ww} show AAA BBB CCC --only symbol,reportedChange,reportedChangePercent,description --table`;
  const result = JSON.parse((await capture([pty, '--stdin-tty', 'watch', '-c', '-w', '-t', '-n', '0.1', '-q', '1', command],
    { ...env, COLUMNS: '60', LINES: '10' }, 'python3')).stdout);
  assert.equal(result.status, 0); assert.equal(result.stderr, '');
  const output = result.stdout;
  // The clipped header and every clipped row cause watch 4.0.7 to reset its
  // own ANSI state. Follow emitted foreground state at real visible symbols.
  let foreground = 39, seen = [];
  for (const part of output.split(/(\x1b\[[0-9;]*m)/)) {
    if (part.startsWith('\x1b[')) {
      foreground = foregroundAfter(foreground, part);
    } else for (const symbol of ['AAA', 'BBB', 'CCC']) if (part.includes(symbol)) {
      assert.equal(foreground, 226, symbol + ' must be yellow even after a clipped preceding line');
      seen.push(symbol);
    }
  }
  assert.deepEqual(seen, ['AAA', 'BBB', 'CCC']);
  assert.match(output, /\x1b\[32m(?:\x1b\[(?:40|48;5;232)m)*\+1\.00\x1b\[37m/);
  assert.match(output, /\x1b\[38;5;203m(?:\x1b\[(?:40|48;5;232)m)*-2\.00\x1b\[37m/);
  assert.ok(calls.every(c => ['AAA', 'BBB', 'CCC'].some(s => c.path === '/v2/quotes/' + s)));
}));


test('absolute ranks limit membership then signed order; directions, no limit, ties, missing and exact keys', () => {
  const rows = [raw('AAA', 'ETF', '-20'), raw('BBB', 'ETF', '12'), raw('CCC', 'ETF', '-11'),
    raw('DDD', 'ETF', '3'), raw('EEE', 'ETF', '0'), raw('FFF', 'ETF', '-11'), raw('GGG', 'ETF', '1'), raw('HHH')];
  delete rows.at(-1).facts.reportedChangePercent;
  const args = ['--quotes', '--sort-by', 'reportedChangePercent', '--absolute'];
  assert.deepEqual(selectedSymbols(rows, [...args, '--descending', '--limit', '3']), ['BBB', 'CCC', 'AAA']);
  assert.deepEqual(selectedSymbols(rows, [...args, '--descending', '--limit', '4']), ['BBB', 'CCC', 'FFF', 'AAA']);
  assert.deepEqual(selectedSymbols(rows, [...args, '--limit', '3']), ['EEE', 'GGG', 'DDD']);
  const negatives = [raw('AAA', 'ETF', '-2'), raw('BBB', 'ETF', '-1'), raw('CCC', 'ETF', '3')];
  assert.deepEqual(selectedSymbols(negatives, [...args, '--limit', '2']), ['AAA', 'BBB']);
  for (const direction of [[], ['--descending']]) {
    const canonical = selectedSymbols(rows, ['--quotes', '--sort-by', 'reportedChangePercent', ...direction]);
    assert.deepEqual(selectedSymbols(rows, [...args, ...direction]), canonical);
    assert.deepEqual(selectedSymbols(rows, [...args, ...direction, '--limit', '99']), canonical);
    assert.equal(canonical.at(-1), 'HHH');
  }
  const precise = [raw('AAA', 'ETF', '-9007199254740993'), raw('BBB', 'ETF', '9007199254740992'), raw('CCC', 'ETF', '1')];
  assert.deepEqual(selectedSymbols(precise, [...args, '--descending', '--limit', '1']), ['AAA']);
  assert.deepEqual(selectedSymbols(precise, [...args, '--descending', '--limit', '2']), ['BBB', 'AAA']);
});

test('same magnitude-selected signed output order in human, TSV and JSONL with an unprojected sort key', async () => fixture(async ({ state, run, calls }) => {
  state.rows.AAA = raw('AAA', 'EQUITY', '999');
  state.rows.BBB = raw('BBB', 'ETF', '-20'); state.rows.CCC = raw('CCC', 'ETF', '12');
  state.rows.DDD = raw('DDD', 'ETF', '-11'); state.rows.EEE = raw('EEE', 'ETF', '3');
  const args = ['--quotes', '--where', 'type=ETF', '--sort-by', 'reportedChangePercent', '--absolute', '--descending', '--limit', '3'];
  assert.equal((await run([...args, '--only', 'symbol', '--tsv'])).stdout, 'CCC\nDDD\nBBB\n');
  const table = await run([...args, '--all-fields', '--table']); assert.equal(table.status, 0);
  assert.deepEqual(strip(table.stdout).trimEnd().split('\n').slice(1).map(row => row.split(/\s+/)[0]), ['CCC', 'DDD', 'BBB']);
  const jsonl = await run([...args, '--jsonl']); assert.equal(jsonl.status, 0);
  assert.deepEqual(jsonl.stdout.trim().split('\n').map(line => JSON.parse(line).facts.reportedChangePercent), [12, -11, -20]);
  assert.doesNotMatch(jsonl.stdout, /\x1b\[/);
  assert.equal(calls.length, 18); // all five observations inspected in each invocation
}));


test('short Tradier venue labels are human-only; raw codes still govern machines, verbose and filters', () => {
  const q = valid(raw('AAA')); q.facts.bid.venue = 'P';
  q.facts.ask = { price: number('12.4'), venue: 'Z' }; q.facts.exchange = 'Q';
  const before = JSON.stringify(q), only = ['bidVenue', 'askVenue', 'exchange'];
  const options = { only, format: 'table', env: { NO_COLOR: '1' } };
  assert.deepEqual(presentShow(q, options).trimEnd().split('\n')[1].split(/\s{2,}/), ['NYSEArca', 'BATS', 'Nasdaq']);
  const all = presentShow(q, { allFields: true, format: 'table', env: { NO_COLOR: '1' } });
  for (const text of ['NYSEArca', 'BATS', 'Nasdaq']) assert.ok(all.includes(text));
  const colored = presentShow(q, { ...options, env: { TERM: 'xterm' } });
  assert.equal(strip(colored), presentShow(q, options));
  assert.doesNotMatch(colored, /\x1b\[(?:38;5;203|32)m/);
  assert.equal(presentShow(q, { only, format: 'tsv' }), 'P\tZ\tQ\n');
  assert.equal(presentShow(q, { only }), 'P\tZ\tQ\n');
  assert.equal(presentShow(q, { format: 'jsonl' }), before + '\n');
  const verbose = presentShow(q, { tty: true, verbose: true, env: { NO_COLOR: '1' } });
  assert.match(verbose, /bidVenue +P\n/); assert.match(verbose, /askVenue +Z\n/); assert.match(verbose, /exchange +Q\n/);
  const source = raw('AAA'); source.facts.exchange = 'Q';
  assert.deepEqual(selectedSymbols([source], ['--quotes', '--where', 'exchange=Q']), ['AAA']);
  assert.deepEqual(selectedSymbols([source], ['--quotes', '--where', 'exchange=Nasdaq']), []);
  assert.equal(JSON.stringify(q), before);
  q.facts.bid.venue = '?'; delete q.facts.ask.venue;
  assert.deepEqual(presentShow(q, options).trimEnd().split('\n')[1].split(/\s{2,}/), ['?', '-', 'Nasdaq']);
  q.provenance.provider = 'other-provider'; q.facts.bid.venue = 'P'; q.facts.ask.venue = 'Z';
  assert.deepEqual(presentShow(q, options).trimEnd().split('\n')[1].split(/\s{2,}/), ['P', 'Z', 'Q']);
});

test('all documented Tradier underlying exchange codes have labels at most eight characters', () => {
  const q = valid(raw('AAA'));
  for (const code of 'ABCDEFGHIJKLMNPQSTUVWXYZ'.replace('H', '')) {
    q.facts.exchange = code;
    const label = presentShow(q, { only: ['exchange'], format: 'table', env: { NO_COLOR: '1' } }).trimEnd().split('\n')[1];
    assert.ok(label.length <= 8, code + ': ' + label); assert.notEqual(label, code, code);
  }
});


test('every monetary field has two human decimals while canonical machine and verbose values stay exact', () => {
  const source = raw('AAA');
  for (const name of ['open', 'high', 'low', 'close', 'previousClose', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow']) source.facts[name] = number('1.2');
  source.facts.ask = { price: number('0.0001') }; source.facts.reportedChange = number('2');
  const q = valid(source), before = JSON.stringify(q);
  const fields = SHOW_FIELDS.filter(f => ['price', 'change'].includes(f.kind));
  assert.equal(fields.length, 11);
  const options = { only: fields.map(f => f.name), format: 'table', env: { NO_COLOR: '1' } };
  const cells = presentShow(q, options).trimEnd().split('\n')[1].trim().split(/\s{2,}/);
  assert.equal(cells.length, 11);
  for (const cell of cells) assert.match(cell, /^[+-]?\d+\.\d{2}$/);
  const machine = presentShow(q, { ...options, format: 'tsv' }).trim().split('\t');
  assert.deepEqual(machine, fields.map(f => f.extract(q).rawJSON));
  assert.equal(presentShow(q, { format: 'jsonl' }), before + '\n');
  assert.match(presentShow(q, { tty: true, verbose: true, env: { NO_COLOR: '1' } }), /ask +0.0001\n/);
  assert.equal(JSON.stringify(q), before);
});


test('each known venue label has its own stable scoped color, consistent across all three fields', () => {
  const q = valid(raw('AAA')); q.facts.ask = { price: number('12.4') };
  const options = { only: ['bidVenue', 'askVenue', 'exchange', 'last'], format: 'table', env: { TERM: 'xterm-256color' } };
  const colors = new Set();
  for (const code of 'ABCDEFGHIJKLMNPQSTUVWXYZ'.replace('H', '')) {
    q.facts.bid.venue = code; q.facts.ask.venue = code; q.facts.exchange = code;
    const output = presentShow(q, options), spans = [...output.matchAll(/\x1b\[38;5;(\d+)m([^\x1b]+)\x1b\[37m/g)].filter(span => span[1] !== '208');
    assert.equal(spans.length, 3, code);
    assert.equal(new Set(spans.map(s => s[1])).size, 1);
    assert.equal(new Set(spans.map(s => s[2])).size, 1);
    assert.ok(spans[0][2].length <= 8); assert.ok(!spans[0][2].endsWith(' '));
    colors.add(spans[0][1]);
    assert.equal(strip(output), presentShow(q, { ...options, env: { NO_COLOR: '1' } }));
    assert.doesNotMatch(output, /\x1b\[(?:38;5;203|32)m/); // venue colors are categorical, not change-sign colors
    assert.match(output, /\x1b\[37m +\x1b\[38;5;208m12.35\x1b\[37m/); // following LAST is orange, padding stays white
  }
  assert.equal(colors.size, 23);
  for (const env of [{ NO_COLOR: '1' }, { TERM: 'dumb' }]) assert.doesNotMatch(presentShow(q, { ...options, env }), /\x1b\[/);
  for (const format of ['tsv', 'jsonl']) assert.doesNotMatch(presentShow(q, { ...options, only: undefined, format }), /\x1b\[/);
  assert.doesNotMatch(presentShow(q, { ...options, format: undefined, tty: false }), /\x1b\[/);
  assert.doesNotMatch(presentShow(q, { tty: true, verbose: true, env: options.env }), /\x1b\[38;5;/);
  q.facts.bid.venue = '?'; q.facts.ask.venue = '?'; q.facts.exchange = '?';
  assert.doesNotMatch(presentShow(q, { ...options, only: ['bidVenue', 'askVenue', 'exchange'] }), /\x1b\[38;5;/);
  q.provenance.provider = 'other-provider'; q.facts.bid.venue = 'P'; q.facts.ask.venue = 'Z'; q.facts.exchange = 'Q';
  assert.doesNotMatch(presentShow(q, { ...options, only: ['bidVenue', 'askVenue', 'exchange'] }), /\x1b\[38;5;/);
});

test('actual clipped watch preserves the human venue colors and restores white afterward', { timeout: 10000 }, async () => fixture(async ({ state, env }) => {
  state.rows.BBB.facts.bid.venue = 'P'; state.rows.BBB.facts.ask = { price: number('12.4'), venue: 'Z' };
  state.rows.BBB.facts.exchange = 'Q'; state.rows.BBB.facts.description = 'Long description that deliberately extends past the viewport';
  const command = `${ww} show BBB --only symbol,bidVenue,askVenue,exchange,description --table`;
  const result = JSON.parse((await capture([pty, '--stdin-tty', 'watch', '-c', '-w', '-t', '-n', '0.1', '-q', '1', command],
    { ...env, COLUMNS: '65', LINES: '10' }, 'python3')).stdout);
  assert.equal(result.status, 0); assert.equal(result.stderr, '');
  for (const [color, label] of [[45, 'NYSEArca'], [201, 'BATS'], [214, 'Nasdaq']])
    assert.match(result.stdout, new RegExp('\\x1b\\[38;5;' + color + 'm(?:\\x1b\\[(?:40|48;5;232)m)*' + label + '\\x1b\\[37m'));
}));


test('horizontal rows alternate full-width black/dark-gray backgrounds without color or machine leakage', () => {
  const rows = [valid(raw('AAA', 'ETF', '1')), valid(raw('BBB', 'ETF', '-2')), valid(raw('CCC', 'ETF', '0'))];
  rows.forEach(q => { q.facts.bid.venue = 'P'; q.facts.description = 'Fund'; });
  const options = { only: ['symbol', 'bidVenue', 'reportedChangePercent', 'last', 'description'], format: 'table', env: { TERM: 'xterm-256color' } };
  const output = presentShowRows(rows, options), lines = output.split('\n');
  assert.doesNotMatch(lines[0], /\x1b\[(?:40|48;5;232)m/); // header is not an observation stripe
  for (const [index, background] of [[1, '\x1b[40m'], [2, '\x1b[48;5;232m'], [3, '\x1b[40m']]) {
    assert.ok(lines[index].startsWith('\x1b[37m' + background));
    assert.ok(lines[index].endsWith('   \x1b[49m')); // include last-cell padding, restore background before LF
  }
  assert.equal(new Set(lines.slice(1, 4).map(line => strip(line).length)).size, 1);
  assert.equal(strip(output), presentShowRows(rows, { ...options, env: { NO_COLOR: '1' } }));
  assert.match(output, /\x1b\[38;5;45mNYSEArca\x1b\[37m/);
  assert.match(output, /\x1b\[32m\+1%(?:\x1b\[[0-9;]*m)*\x1b\[37m/); assert.match(output, /\x1b\[38;5;203m-2%\x1b\[37m/);
  assert.ok(output.endsWith('\x1b[0m'));
  for (const env of [{ NO_COLOR: '1' }, { TERM: 'dumb' }]) assert.doesNotMatch(presentShowRows(rows, { ...options, env }), /\x1b\[/);
  for (const format of ['tsv', 'jsonl']) assert.doesNotMatch(presentShowRows(rows, { ...options, only: undefined, format }), /\x1b\[/);
  assert.doesNotMatch(presentShowRows(rows, { ...options, format: undefined, tty: false }), /\x1b\[/);
});

test('actual clipped watch retains alternating backgrounds and venue foreground colors', { timeout: 10000 }, async () => fixture(async ({ state, env }) => {
  for (const [symbol, venue] of [['AAA', 'P'], ['BBB', 'Q'], ['CCC', 'Z']]) {
    state.rows[symbol] = raw(symbol); state.rows[symbol].facts.bid.venue = venue;
    state.rows[symbol].facts.description = 'Long description that deliberately extends past the viewport';
  }
  const command = `${ww} show AAA BBB CCC --only symbol,bidVenue,description --table`;
  const result = JSON.parse((await capture([pty, '--stdin-tty', 'watch', '-c', '-w', '-t', '-n', '0.1', '-q', '1', command],
    { ...env, COLUMNS: '55', LINES: '10' }, 'python3')).stdout);
  assert.equal(result.status, 0); assert.equal(result.stderr, '');
  assert.match(result.stdout, /\x1b\[40m/); assert.match(result.stdout, /\x1b\[48;5;232m/);
  for (const color of [45, 214, 201]) assert.ok(result.stdout.includes('\x1b[38;5;' + color + 'm'));
}));


test('table styles scope symbol, description, LAST and each TYPE value without changing widths or machine facts', () => {
  const palette = { EQUITY: 81, ETF: 219, INDEX: 179, OTHER: 245 };
  assert.equal(new Set(Object.values(palette)).size, 4);
  for (const [type, color] of Object.entries(palette)) {
    const q = valid(raw('AAA', type === 'OTHER' ? 'OTHER_UNDERLYING' : type)); q.facts.description = 'Example fund';
    const options = { only: ['symbol', 'description', 'type', 'last', 'bid'], format: 'table', env: { TERM: 'xterm-256color' } };
    const output = presentShow(q, options);
    for (const [index, value] of [[226, 'AAA'], [250, 'Example fund'], [color, type], [208, '12.35']])
      assert.ok(output.includes(`\x1b[38;5;${index}m${value}\x1b[37m`));
    assert.doesNotMatch(output, /\x1b\[(?:38;5;203|32)m/);
    assert.equal(strip(output), presentShow(q, { ...options, env: { NO_COLOR: '1' } }));
    for (const env of [{ NO_COLOR: '1' }, { TERM: 'dumb' }]) assert.doesNotMatch(presentShow(q, { ...options, env }), /\x1b\[/);
    for (const format of ['tsv', 'jsonl']) assert.doesNotMatch(presentShow(q, { ...options, only: undefined, format }), /\x1b\[/);
    assert.doesNotMatch(presentShow(q, { ...options, format: undefined, tty: false }), /\x1b\[/);
    assert.doesNotMatch(presentShow(q, { tty: true, verbose: true, env: options.env }), /\x1b\[38;5;/);
    delete q.facts.last;
    assert.doesNotMatch(presentShow(q, { ...options, only: ['last'] }), /\x1b\[38;5;208m/);
  }
});

test('horizontal descriptions truncate after 40 Unicode characters plus ellipsis; machines and verbose retain full text', () => {
  const q = valid(raw('AAA'));
  const options = { only: ['description'], format: 'table', env: { NO_COLOR: '1' } };
  for (const length of [0, 39, 40, 41, 80]) {
    q.facts.description = 'x'.repeat(length);
    const shown = presentShow(q, options).split('\n')[1].trimEnd();
    assert.equal(shown, length > 40 ? 'x'.repeat(40) + '...' : q.facts.description);
    assert.equal(presentShow(q, { ...options, format: 'tsv' }), q.facts.description + '\n');
    assert.equal(JSON.parse(presentShow(q, { format: 'jsonl' })).facts.description, q.facts.description);
    assert.ok(presentShow(q, { tty: true, verbose: true, env: options.env }).includes('description                  ' + q.facts.description + '\n'));
  }
  q.facts.description = '😀'.repeat(41);
  assert.equal(presentShow(q, options).split('\n')[1].trimEnd(), '😀'.repeat(40) + '...');
  const colored = presentShow(q, { ...options, env: { TERM: 'xterm-256color' } });
  assert.ok(colored.includes('\x1b[38;5;250m' + '😀'.repeat(40) + '...\x1b[37m'));
  delete q.facts.description;
  assert.equal(presentShow(q, options).split('\n')[1].trimEnd(), '-');
});
