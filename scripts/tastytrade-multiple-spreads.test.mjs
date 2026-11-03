import test from 'node:test';
import assert from 'node:assert/strict';
import { projectLive, renderLive } from './tastytrade-live.mjs';
import { sampleTrade } from './tastytrade-fixtures.mjs';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function vertical(root, long, short, credit, date, target) {
  const t = sampleTrade(root, '261211', [['P', long], ['P', short]],
    [2, 2 + credit], [2, 2.5], target, credit + .2);
  const identity = `${root}-${short}`;
  t.opening.id = `${identity}-open`;
  t.opening.legs.forEach(l => l.fills.forEach(f => f['filled-at'] = date));
  t.closing.id = `${identity}-bracket`;
  t.closing.orders.forEach((o, i) => { o.id = `${identity}-${i}`; o['complex-order-id'] = t.closing.id; });
  t.quotes.forEach(q => q['updated-at'] = '2026-10-30T18:00:00Z');
  return t;
}
function evidence() {
  const trades = [vertical('IWM', 269, 272.5, .65, '2026-10-29T18:56:01Z', .3),
    vertical('IWM', 265, 268, .58, '2026-10-30T16:22:03Z', .3),
    vertical('QQQ', 590, 595, 2.41, '2026-10-28T18:00:00Z', 1.11),
    vertical('SPY', 660, 665, 3.09, '2026-10-28T18:00:00Z', 1.42),
    sampleTrade('UNG', '261127', [['P', 8.5], ['P', 9], ['C', 13], ['C', 13.5]],
      [.1, .11, .28, .2], [.1, .11, .28, .2], .02, .06)];
  trades.at(-1).quotes.forEach(q => q['updated-at'] = '2026-10-30T18:00:00Z');
  return { account: '5WX01234', holdings: trades.flatMap(t => t.holdings),
    orders: trades.flatMap(t => [t.opening, ...t.closing.orders]),
    complexOrders: trades.map(t => t.closing), quotes: trades.flatMap(t => t.quotes),
    now: new Date('2026-10-30T18:00:00Z') };
}
const iwm = e => projectLive(e).positions.filter(p => p.symbol === 'IWM');

test('two same-underlying, same-expiration verticals retain independent economics and exit orders', () => {
  const e = evidence(), all = projectLive(e), ps = iwm(e);
  assert.equal(all.positions.length, 5);
  assert.equal(ps.length, 2);
  for (const [i, credit] of [.65, .58].entries()) {
    const p = ps[i];
    assert.equal(p.status, 'recognized'); assert.equal(p.strategy, 'Bull Put Credit Spread');
    near(p.credit, credit); near(p.market.closeDebit, .5); near(p.pnl, (credit - .5) * 100);
    near(p.progress, (credit - .5) / (credit - .3)); assert.equal(p.target, .3);
    assert.equal(p.dte, 42); assert.equal(p.lifespan.openingDte, i === 0 ? 43 : 42);
    assert.equal(p.openedAt, Date.parse(i === 0 ? '2026-10-29T18:56:01Z' : '2026-10-30T16:22:03Z'));
    assert.equal(p.targetOrder.id, `IWM-${i === 0 ? 272.5 : 268}-0`);
    assert.equal(p.stopOrder.id, `IWM-${i === 0 ? 272.5 : 268}-1`);
    assert.deepEqual(p.issues, []);
  }
  const legs = ps.flatMap(p => p.targetOrder.legs.map(l => l.symbol));
  assert.equal(new Set(legs).size, 4);
  assert.deepEqual(new Set(legs), new Set(e.holdings.filter(h => h['underlying-symbol'] === 'IWM').map(h => h.symbol)));
  const single = projectLive({...e, holdings:e.holdings.filter(h => h['underlying-symbol'] !== 'IWM')});
  assert.deepEqual(all.positions.slice(2), single.positions); assert.deepEqual(all.rows.slice(2), single.rows);
  for (const format of ['table', 'tsv']) {
    const text = renderLive({...e, format, columns:189});
    assert.equal(text.split('\n').filter(l => /^IWM\s|^5WX01234\tIWM\t|^XXXX1234\tIWM\t/.test(l)).length, 2);
    assert.doesNotMatch(text, /unsupported|ambiguous/);
  }
});

test('cancelled older exits stay absent and cannot inherit the second spread management', () => {
  const e = evidence();
  e.orders.filter(o => String(o.id).startsWith('IWM-272.5-') && o.status !== 'Filled').forEach(o => o.status = 'Cancelled');
  e.complexOrders[0].orders.forEach(o => o.status = 'Cancelled');
  const [old, recent] = iwm(e);
  assert.equal(old.targetOrder, null); assert.equal(old.stopOrder, null);
  assert.equal(old.protectiveExitEvidence.state, 'absent'); assert.equal(old.progress, null);
  near(old.credit, .65); near(old.pnl, 15);
  assert.equal(recent.targetOrder.id, 'IWM-268-0'); near(recent.credit, .58);
});

for (const [name, mutate] of [
  ['missing one opening', e => e.orders = e.orders.filter(o => o.id !== 'IWM-268-open')],
  ['missing both openings', e => e.orders = e.orders.filter(o => !(String(o.id).startsWith('IWM-') && o.status === 'Filled'))],
  ['duplicate opening evidence', e => e.orders.push(structuredClone(e.orders[0]))],
  ['overlapping historical opening', e => { const o = structuredClone(e.orders[0]); o.id = 'historical'; e.orders.push(o); }],
  ['partial aggregate quantity', e => e.holdings[0].quantity = '2'],
  ['malformed fills', e => e.orders[0].legs[0].fills[0].quantity = '0'],
  ['future fills', e => e.orders[0].legs[0].fills[0]['filled-at'] = '2026-11-01T18:00:00Z'],
  ['cross-package opening', e => { e.orders[0].legs.push(structuredClone(e.orders[3].legs[0])); }],
  ['duplicate holding', e => e.holdings.push(structuredClone(e.holdings[0]))],
]) test(`${name}: membership stays explicitly ambiguous without double counting`, () => {
  const e = evidence(); mutate(e); const ps = iwm(e);
  assert.equal(ps.length, 1); assert.equal(ps[0].status, 'ambiguous holdings');
  assert.equal(ps[0].pnl, null); assert.equal(ps[0].payoff, null);
  assert.deepEqual(projectLive(e).positions.slice(1).map(p => p.symbol), ['QQQ', 'SPY', 'UNG']);
});

test('membership follows filled orders even when strike-nearest pairing would differ', () => {
  const e = evidence();
  // Cross the opening-order membership: long 269 belongs to short 268 (unsupported
  // orientation); long 265 belongs to short 272.5. Never silently repair this by strikes.
  const [a, b] = [e.orders[0].legs[0], e.orders[3].legs[0]];
  [a.symbol, b.symbol] = [b.symbol, a.symbol];
  const ps = iwm(e);
  assert.equal(ps.length, 2);
  assert.ok(ps.some(p => p.status === 'unsupported strategy'));
  assert.ok(ps.some(p => p.status === 'recognized' && p.targetOrder === null));
});

test('two independent wings are not merged into an iron condor by geometry', () => {
  const e = evidence();
  const symbols = new Map(e.holdings.slice(2,4).map(h => [h.symbol, h.symbol.replace('P00265000','C00280000').replace('P00268000','C00277000')]));
  for (const h of e.holdings.slice(2,4)) h.symbol = symbols.get(h.symbol);
  for (const o of [e.orders[3], ...e.complexOrders[1].orders]) for (const l of o.legs) l.symbol = symbols.get(l.symbol);
  for (const q of e.quotes.slice(2,4)) q.symbol = symbols.get(q.symbol);
  const ps = iwm(e);
  assert.deepEqual(ps.map(p => p.strategy), ['Bull Put Credit Spread', 'Bear Call Credit Spread']);
});
