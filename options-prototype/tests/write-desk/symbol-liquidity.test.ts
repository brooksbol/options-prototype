/**
 * Observed Symbol Liquidity (PL-EVID-OBS v1) — Proves:
 *
 * 1. Window membership comes from backend listed expirations (7–45 DTE); expired/out-of-window chains ignored
 * 2. Backend admissibility is authoritative: inadmissible and verdict-less chains contribute nothing
 * 3. Explicit denominators: zero-bid counts as measured-not-liquid with no spread; invalid quotes and
 *    missing deltas are excluded and reported
 * 4. Median spread uses quoted contracts only (zero-bid cannot distort it)
 * 5. Distinct evidence states; missing evidence never measured as illiquid
 * 6. Sample sufficiency (thin sample) and expiration breadth (single expiration) are independent flags
 * 7. Volume completeness flag; absent symbols are not rows
 * 8. Band constant is independent of recommendation policy
 */
import { describe, it, expect } from "vitest";
import {
  buildSymbolLiquidity,
  buildSymbolLiquidityRow,
  validateSymbolLiquidityFilter,
  SYMBOL_LIQUIDITY_POLICY,
  DEFAULT_SYMBOL_LIQUIDITY_FILTER,
  type SnapshotSymbol,
  type SymbolLiquidityFilter,
} from "../../src/write-desk/symbol-liquidity";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";

const ADM = { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-27" };
const NOT_ADM = { admissible: false, basis: "unknown", canonicalSessionDate: null };
const prov = (iso: string) => ({ kind: "chain-acquired", acquiredAt: iso });

/** A liquid contract: spread 2% of mid, OI 5,000 → v1 grade L1. */
const liquid = (delta: number, volume = 10) => ({ delta, bid: 0.99, ask: 1.01, openInterest: 5000, volume });
/** A thin contract: spread ~18% → L3. */
const thin = (delta: number) => ({ delta, bid: 0.9, ask: 1.08, openInterest: 5000, volume: 1 });

function sym(overrides: Partial<SnapshotSymbol> = {}): SnapshotSymbol {
  return {
    symbol: "AAA",
    status: "ready",
    expirations: [
      { date: "2026-11-06", dte: 10 },
      { date: "2026-11-20", dte: 24 },
      { date: "2027-01-15", dte: 80 }, // outside window
    ],
    chains: [],
    ...overrides,
  };
}

const chain = (expiration: string, contracts: { puts?: unknown[]; calls?: unknown[] }, admissibility: unknown = ADM, acquiredAt = "2026-10-27T17:00:00Z") => ({
  expiration,
  admissibility,
  chainAcquisitionProvenance: prov(acquiredAt),
  data: { expiration, puts: contracts.puts ?? [], calls: contracts.calls ?? [] },
});

describe("buildSymbolLiquidityRow — window and admissibility", () => {
  it("uses only listed 7–45 DTE expirations; out-of-window and expired chains are ignored", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", { puts: Array(12).fill(liquid(-0.3)) }),
        chain("2026-11-20", { calls: Array(12).fill(liquid(0.3)) }),
        chain("2027-01-15", { puts: Array(50).fill(thin(-0.3)) }), // out of window
        chain("2026-09-18", { puts: Array(50).fill(thin(-0.3)) }), // expired, unlisted
      ],
    }))!;
    expect(row.listedExpirations).toBe(2);
    expect(row.observedChains).toBe(2);
    expect(row.measuredContracts).toBe(24);
    expect(row.liquidSharePercent).toBe(100);
    expect(row.state).toBe("measured");
  });

  it("inadmissible and verdict-less chains contribute nothing and are counted separately", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", { puts: Array(30).fill(liquid(-0.3)) }),
        chain("2026-11-20", { puts: Array(30).fill(thin(-0.3)) }, NOT_ADM),
      ],
    }))!;
    expect(row.admissibleChains).toBe(1);
    expect(row.notAdmissibleChains).toBe(1);
    expect(row.measuredContracts).toBe(30);
    expect(row.liquidSharePercent).toBe(100);

    const noVerdict = buildSymbolLiquidityRow(sym({
      chains: [chain("2026-11-06", { puts: Array(30).fill(liquid(-0.3)) }, null)],
    }))!;
    expect(noVerdict.noVerdictChains).toBe(1);
    expect(noVerdict.state).toBe("not-current");
    expect(noVerdict.liquidSharePercent).toBeNull();
  });
});

describe("buildSymbolLiquidityRow — explicit denominators", () => {
  it("zero-bid in-band contracts are measured, not liquid, and contribute no spread", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", { puts: [...Array(10).fill(liquid(-0.3)), ...Array(10).fill({ delta: -0.2, bid: 0, ask: 0.05, openInterest: 900, volume: 0 })] }),
        chain("2026-11-20", { calls: Array(10).fill(liquid(0.3)) }),
      ],
    }))!;
    expect(row.quotedContracts).toBe(20);
    expect(row.zeroBidContracts).toBe(10);
    expect(row.measuredContracts).toBe(30);
    expect(row.liquidContracts).toBe(20);
    expect(row.liquidSharePercent).toBeCloseTo(66.67, 1);
    // Median over quoted contracts only (all 2%), not distorted by zero-bid.
    expect(row.medianSpreadPercent).toBeCloseTo(2, 5);
  });

  it("invalid/missing quotes and missing deltas are excluded from the denominator and reported", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", {
          puts: [
            ...Array(20).fill(liquid(-0.3)),
            { delta: -0.3, bid: 1.2, ask: 1.0, openInterest: 100, volume: 0 }, // crossed
            { delta: -0.3, bid: null, ask: 1.0, openInterest: 100, volume: 0 }, // missing bid
            { delta: 0, bid: 1, ask: 1.02, openInterest: 100, volume: 0 }, // delta unavailable
            { delta: null, bid: 1, ask: 1.02, openInterest: 100, volume: 0 },
          ],
        }),
        chain("2026-11-20", { calls: Array(5).fill(liquid(0.3)) }),
      ],
    }))!;
    expect(row.invalidQuoteContracts).toBe(2);
    expect(row.unbandedContracts).toBe(2);
    expect(row.measuredContracts).toBe(25);
    expect(row.liquidSharePercent).toBe(100);
  });

  it("contracts outside the delta band are ignored", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", { puts: [...Array(20).fill(liquid(-0.3)), ...Array(20).fill(thin(-0.05)), ...Array(20).fill(thin(-0.8))] }),
        chain("2026-11-20", { calls: Array(5).fill(liquid(0.3)) }),
      ],
    }))!;
    expect(row.measuredContracts).toBe(25);
    expect(row.liquidSharePercent).toBe(100);
  });
});

describe("buildSymbolLiquidityRow — evidence states", () => {
  it("distinguishes unresolved, no window expirations, chains not observed, not current, no in-band", () => {
    expect(buildSymbolLiquidityRow(sym({ status: "pending" }))!.state).toBe("unresolved");
    expect(buildSymbolLiquidityRow(sym({ expirations: [{ date: "2027-01-15", dte: 80 }] }))!.state).toBe("no-window-expirations");
    expect(buildSymbolLiquidityRow(sym({ chains: [] }))!.state).toBe("no-chains");
    expect(buildSymbolLiquidityRow(sym({ chains: [chain("2026-11-06", { puts: [liquid(-0.3)] }, NOT_ADM)] }))!.state).toBe("not-current");
    expect(buildSymbolLiquidityRow(sym({ chains: [chain("2026-11-06", { puts: [thin(-0.05)] })] }))!.state).toBe("no-in-band");
  });

  it("no unmeasured state carries liquidity measures", () => {
    for (const s of [sym({ status: "pending" }), sym({ chains: [] }), sym({ chains: [chain("2026-11-06", { puts: [liquid(-0.3)] }, NOT_ADM)] })]) {
      const row = buildSymbolLiquidityRow(s)!;
      expect(row.liquidSharePercent).toBeNull();
      expect(row.medianSpreadPercent).toBeNull();
      expect(row.bandOpenInterest).toBeNull();
      expect(row.bandVolume).toBeNull();
    }
  });

  it("confirmed absent symbols are not rows and are counted separately", () => {
    const summary = buildSymbolLiquidity([sym(), { symbol: "ZZZ", status: "absent" }]);
    expect(summary.rows.map((r) => r.symbol)).toEqual(["AAA"]);
    expect(summary.absentSymbols).toBe(1);
  });
});

describe("buildSymbolLiquidityRow — coverage, volume, age", () => {
  it("sample sufficiency and expiration breadth are independent (Principal adjustment)", () => {
    // Thin sample: few contracts across two expirations.
    const thin = buildSymbolLiquidityRow(sym({
      chains: [chain("2026-11-06", { puts: Array(3).fill(liquid(-0.3)) }), chain("2026-11-20", { calls: Array(3).fill(liquid(0.3)) })],
    }))!;
    expect(thin.state).toBe("thin-sample");
    expect(thin.singleExpiration).toBe(false);
    expect(thin.liquidSharePercent).toBe(100);

    // One deep expiration: sufficient sample, single-expiration breadth — NOT a thin sample.
    const deep = buildSymbolLiquidityRow(sym({
      chains: [chain("2026-11-20", { puts: Array(200).fill(liquid(-0.3)) })],
    }))!;
    expect(deep.state).toBe("measured");
    expect(deep.singleExpiration).toBe(true);
    expect(deep.measuredContracts).toBe(200);
    expect(deep.liquidSharePercent).toBe(100);
    expect(deep.medianSpreadPercent).toBeCloseTo(2, 5);

    // Both: six contracts on one expiration.
    const both = buildSymbolLiquidityRow(sym({
      chains: [chain("2026-11-20", { puts: Array(6).fill(liquid(-0.3)) })],
    }))!;
    expect(both.state).toBe("thin-sample");
    expect(both.singleExpiration).toBe(true);

    // The two single-expiration symbols are distinguished by sample sufficiency.
    expect(deep.state).not.toBe(both.state);
  });

  it("volume is summed from admissible chains and flagged partial when expirations are missing", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [chain("2026-11-06", { puts: Array(25).fill(liquid(-0.3, 4)) })],
    }))!;
    expect(row.bandVolume).toBe(100);
    expect(row.volumePartial).toBe(true); // 1 admissible of 2 listed
  });

  it("spot comes from the newest admissible chain; inadmissible or unpriced chains are ignored", () => {
    const withSpot = (expiration: string, price: number | null, adm: unknown, acquiredAt: string) => {
      const c = chain(expiration, { puts: Array(15).fill(liquid(-0.3)) }, adm, acquiredAt);
      return { ...c, data: { ...c.data, underlying: { price } } };
    };
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        withSpot("2026-11-06", 50.1, ADM, "2026-10-27T17:00:00Z"),
        withSpot("2026-11-20", 50.4, ADM, "2026-10-27T17:20:00Z"),
      ],
    }))!;
    expect(row.spotPrice).toBe(50.4);

    const newerButInadmissible = buildSymbolLiquidityRow(sym({
      chains: [
        withSpot("2026-11-06", 50.1, ADM, "2026-10-27T17:00:00Z"),
        withSpot("2026-11-20", 99, NOT_ADM, "2026-10-27T21:00:00Z"),
      ],
    }))!;
    expect(newerButInadmissible.spotPrice).toBe(50.1);

    expect(buildSymbolLiquidityRow(sym({ chains: [withSpot("2026-11-06", null, ADM, "2026-10-27T17:00:00Z")] }))!.spotPrice).toBeNull();
    expect(buildSymbolLiquidityRow(sym({ chains: [withSpot("2026-11-06", 50, NOT_ADM, "2026-10-27T17:00:00Z")] }))!.spotPrice).toBeNull();
  });

  it("reports oldest and newest authoritative chain acquisition times from admissible chains", () => {
    const row = buildSymbolLiquidityRow(sym({
      chains: [
        chain("2026-11-06", { puts: Array(15).fill(liquid(-0.3)) }, ADM, "2026-10-27T17:00:00Z"),
        chain("2026-11-20", { calls: Array(15).fill(liquid(0.3)) }, ADM, "2026-10-27T17:20:00Z"),
      ],
    }))!;
    expect(row.oldestAcquiredAtMs).toBe(Date.parse("2026-10-27T17:00:00Z"));
    expect(row.newestAcquiredAtMs).toBe(Date.parse("2026-10-27T17:20:00Z"));
  });
});

describe("SYMBOL_LIQUIDITY_POLICY and default filter", () => {
  it("defaults preserve the original 7–45 DTE, |Δ| 0.15–0.50, puts + calls behavior, independent of recommendation policy", () => {
    expect(SYMBOL_LIQUIDITY_POLICY.version).toBe("v0-provisional");
    expect([SYMBOL_LIQUIDITY_POLICY.coverageMinDte, SYMBOL_LIQUIDITY_POLICY.coverageMaxDte]).toEqual([7, 45]);
    expect(DEFAULT_SYMBOL_LIQUIDITY_FILTER).toMatchObject({ minDte: 7, maxDte: 45, optionType: "all", minAbsDelta: 0.15, maxAbsDelta: 0.5 });
    expect(DEFAULT_SYMBOL_LIQUIDITY_FILTER).not.toBe(DEFAULT_RECOMMENDATION_POLICY.contractSelection);
    expect(SYMBOL_LIQUIDITY_POLICY.thinSampleMinContracts).toBe(20);
  });
});

// --- Operator filters (TT1 short put spread screening, Oct 29 2026) ---

const F = (over: Partial<SymbolLiquidityFilter> = {}): SymbolLiquidityFilter => ({ ...DEFAULT_SYMBOL_LIQUIDITY_FILTER, ...over });
const put = (strike: number, delta: number | null, bid: number | null, ask: number | null, openInterest = 5000) => ({ strike, delta, bid, ask, openInterest, volume: 2 });

function tt1Symbol(): SnapshotSymbol {
  return {
    symbol: "TT1",
    status: "ready",
    expirations: [
      { date: "2026-11-06", dte: 10 },
      { date: "2026-12-04", dte: 38 },
      { date: "2026-12-11", dte: 45 },
      { date: "2026-12-18", dte: 52 }, // listed, never acquired (outside coverage)
    ],
    chains: [
      chain("2026-11-06", { puts: Array(30).fill(thin(-0.3)), calls: Array(30).fill(thin(0.3)) }),
      chain("2026-12-04", {
        puts: [put(50, -0.30, 0.99, 1.01), put(49, -0.12, 0.60, 0.62), put(48, -0.08, 0.30, 0.32), put(45, -0.04, 0, 0.05)],
        calls: Array(10).fill(liquid(0.3)),
      }),
      chain("2026-12-11", {
        puts: [put(51, -0.25, 0.99, 1.01), put(50, -0.20, 0.80, 0.84), put(46, -0.06, 0, 0.05), put(41, -0.02, 0.01, 0.03)],
        calls: [],
      }),
    ],
  };
}

describe("validateSymbolLiquidityFilter", () => {
  it("accepts the default and the TT1 setting", () => {
    expect(validateSymbolLiquidityFilter(F())).toEqual([]);
    expect(validateSymbolLiquidityFilter(F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.15, maxAbsDelta: 0.30 }))).toEqual([]);
  });

  it("rejects inverted ranges, out-of-coverage DTE and bad delta explicitly", () => {
    expect(validateSymbolLiquidityFilter(F({ minDte: 45, maxDte: 38 })).join(" ")).toMatch(/greater than max DTE/);
    expect(validateSymbolLiquidityFilter(F({ minDte: 42, maxDte: 52 })).join(" ")).toMatch(/observed coverage \(7–45\)/);
    expect(validateSymbolLiquidityFilter(F({ minDte: 3 })).join(" ")).toMatch(/observed coverage/);
    expect(validateSymbolLiquidityFilter(F({ minDte: 38.5 })).join(" ")).toMatch(/whole calendar days/);
    expect(validateSymbolLiquidityFilter(F({ minAbsDelta: 0.4, maxAbsDelta: 0.2 })).join(" ")).toMatch(/Min \|Δ\|/);
    expect(validateSymbolLiquidityFilter(F({ maxAbsDelta: 1.5 })).join(" ")).toMatch(/between 0 and 1/);
  });

  it("has no width setting: widths are discovered, never configured", () => {
    expect(Object.keys(DEFAULT_SYMBOL_LIQUIDITY_FILTER).sort()).toEqual(["maxAbsDelta", "maxDte", "minAbsDelta", "minDte", "optionType"]);
  });
});

describe("DTE, type and delta filtering", () => {
  it("unfiltered default is unchanged (7–45 includes 10, 38 and 45 DTE; puts + calls)", () => {
    const row = buildSymbolLiquidityRow(tt1Symbol())!;
    expect(row.listedExpirations).toBe(3);
    expect(row.measuredExpirations).toBe(3);
    // 10 DTE: 60 thin; 38 DTE: put 50 (Δ .30) + 10 calls; 45 DTE: puts 51, 50.
    expect(row.measuredContracts).toBe(60 + 11 + 2);
  });

  it("38–45 DTE excludes every observation outside the window", () => {
    const row = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45 }))!;
    expect(row.listedExpirations).toBe(2);
    expect(row.measuredContracts).toBe(11 + 2);
    expect(row.liquidSharePercent).toBe(100); // the 10-DTE thin contracts are gone
  });

  it("puts-only excludes calls from every aggregate", () => {
    const row = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45, optionType: "puts" }))!;
    expect(row.measuredContracts).toBe(3); // puts 50 @38; 51, 50 @45
    expect(row.bandVolume).toBe(6);
    expect(row.bandOpenInterest).toBe(15000);
    const calls = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45, optionType: "calls" }))!;
    expect(calls.measuredContracts).toBe(10);
    expect(calls.widths).toEqual([]); // put verticals not evaluated for calls-only
    expect(calls.quotedPairsTotal).toBeNull();
    expect(calls.quotedWidthCount).toBeNull();
    expect(calls.listedPairsTotal).toBeNull();
  });

  it("delta filtering compares |Δ| (negative put delta) and changes the measured band", () => {
    const narrow = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.15, maxAbsDelta: 0.22 }))!;
    expect(narrow.measuredContracts).toBe(1); // only the -0.20 put
    const wide = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.01, maxAbsDelta: 0.5 }))!;
    expect(wide.measuredContracts).toBe(8);
  });

  it("missing delta is excluded and reported, never treated as zero; all-missing is insufficient evidence", () => {
    const s: SnapshotSymbol = { ...tt1Symbol(), chains: [chain("2026-12-04", { puts: [put(50, null, 0.99, 1.01), put(49, 0, 0.6, 0.62)] })] };
    const row = buildSymbolLiquidityRow(s, F({ minDte: 38, maxDte: 45, optionType: "puts" }))!;
    expect(row.unbandedContracts).toBe(2);
    expect(row.measuredContracts).toBe(0);
    expect(row.state).toBe("insufficient-quotes");
  });
});

describe("evidence states under filtering", () => {
  it("listed-not-observed is distinct from no listed expiration and from no matching contracts", () => {
    // 52 DTE is listed but cannot be observed; a 38–38 window with only an out-of-band put → no matching contracts.
    const s = tt1Symbol();
    const unobserved = buildSymbolLiquidityRow({ ...s, chains: [] }, F({ minDte: 38, maxDte: 45 }))!;
    expect(unobserved.state).toBe("no-chains");
    expect(unobserved.unobservedExpirations).toBe(2);

    const noListed = buildSymbolLiquidityRow(s, F({ minDte: 20, maxDte: 30 }))!;
    expect(noListed.state).toBe("no-window-expirations");

    const noMatch = buildSymbolLiquidityRow(s, F({ minDte: 38, maxDte: 38, optionType: "puts", minAbsDelta: 0.4, maxAbsDelta: 0.5 }))!;
    expect(noMatch.state).toBe("no-in-band");

    const partial = buildSymbolLiquidityRow({ ...s, chains: s.chains!.filter((c) => c.expiration !== "2026-12-11") }, F({ minDte: 38, maxDte: 45 }))!;
    expect(partial.unobservedExpirations).toBe(1);
    expect(partial.listedExpirations).toBe(2);
  });

  it("matching contracts with only invalid quotes are insufficient quote evidence, not illiquid", () => {
    const s: SnapshotSymbol = { ...tt1Symbol(), chains: [chain("2026-12-04", { puts: [put(50, -0.3, null, 1), put(49, -0.25, 1.2, 1.0)] })] };
    const row = buildSymbolLiquidityRow(s, F({ minDte: 38, maxDte: 45, optionType: "puts" }))!;
    expect(row.state).toBe("insufficient-quotes");
    expect(row.liquidSharePercent).toBeNull();
    expect(row.medianSpreadPercent).toBeNull();
  });

  it("filtered counts reconcile: measured = quoted + zero-bid; liquid share = liquid / measured", () => {
    const row = buildSymbolLiquidityRow(tt1Symbol(), F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.01, maxAbsDelta: 0.5 }))!;
    expect(row.measuredContracts).toBe(row.quotedContracts + row.zeroBidContracts);
    expect(row.zeroBidContracts).toBe(2);
    expect(row.liquidSharePercent).toBeCloseTo((row.liquidContracts / row.measuredContracts) * 100, 10);
  });
});

describe("open interest: reported zero vs unavailable", () => {
  const f = F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.15, maxAbsDelta: 0.5 });
  const oiPut = (strike: number, oi: number | null | undefined) => ({ strike, delta: -0.25, bid: 0.99, ask: 1.01, openInterest: oi, volume: 50 });

  it("reported OI of 0 is preserved, graded L4 (not liquid) even with a tight spread", () => {
    const s: SnapshotSymbol = { ...tt1Symbol(), chains: [chain("2026-12-04", { puts: [oiPut(50, 0), oiPut(49, 0), oiPut(48, 0)] })] };
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row.zeroOiContracts).toBe(3);
    expect(row.oiUnavailableContracts).toBe(0);
    expect(row.bandOpenInterest).toBe(0);
    expect(row.medianSpreadPercent).toBeCloseTo(2, 5);
    expect(row.liquidSharePercent).toBe(0);
  });

  it("unavailable OI is never coerced to 0: excluded from the OI sum and the liquid-share denominator", () => {
    const s: SnapshotSymbol = { ...tt1Symbol(), chains: [chain("2026-12-04", { puts: [oiPut(50, null), oiPut(49, undefined), oiPut(48, 5000)] })] };
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row.oiUnavailableContracts).toBe(2);
    expect(row.zeroOiContracts).toBe(0);
    expect(row.measuredContracts).toBe(3);
    expect(row.bandOpenInterest).toBe(5000);
    expect(row.liquidSharePercent).toBe(100); // 1 graded, 1 liquid
    const allMissing = buildSymbolLiquidityRow({ ...s, chains: [chain("2026-12-04", { puts: [oiPut(50, null)] })] }, f)!;
    expect(allMissing.bandOpenInterest).toBeNull();
    expect(allMissing.liquidSharePercent).toBeNull();
  });
});

describe("absolute spread", () => {
  it("is the median of ask − bid per share over valid two-sided quotes only", () => {
    const s: SnapshotSymbol = {
      ...tt1Symbol(),
      chains: [chain("2026-12-04", { puts: [put(50, -0.3, 1.0, 1.1), put(49, -0.25, 0.5, 0.54), put(48, -0.2, 0.2, 0.26), put(47, -0.18, 0, 0.5), put(46, -0.16, 1.2, 1.0)] })],
    };
    const row = buildSymbolLiquidityRow(s, F({ minDte: 38, maxDte: 45, optionType: "puts" }))!;
    expect(row.quotedContracts).toBe(3);
    expect(row.medianAbsSpread).toBeCloseTo(0.06, 10); // median of 0.10, 0.04, 0.06 — zero-bid and crossed excluded
  });
});


describe("short put vertical width discovery (Levels 1–2; Level 3 not established)", () => {
  const f = F({ minDte: 38, maxDte: 45, optionType: "puts", minAbsDelta: 0.15, maxAbsDelta: 0.30 });
  const byWidth = (row: ReturnType<typeof buildSymbolLiquidityRow>) => Object.fromEntries(row!.widths.map((x) => [x.width, x]));

  it("discovers every listed lower strike as a long leg; the delta band applies to the short put only", () => {
    const row = buildSymbolLiquidityRow(tt1Symbol(), f)!;
    // 38 DTE short 50 (Δ.30): longs 49 ($1 quoted), 48 ($2 quoted), 45 zero-bid ($5 listed only).
    // 45 DTE short 51 (Δ.25): longs 50 ($1 quoted), 46 zero-bid ($5 listed), 41 ($10 quoted).
    // 45 DTE short 50 (Δ.20): longs 46 zero-bid ($4 listed), 41 ($9 quoted).
    // Longs at Δ.12/.08/.06/.04/.02 sit outside the band and still pair.
    expect(row.widths.map((x) => x.width)).toEqual([1, 2, 4, 5, 9, 10]);
    const w = byWidth(row);
    expect(w[1]).toMatchObject({ listedPairs: 2, quotedPairs: 2, quotedExpirations: 2 });
    expect(w[2]).toMatchObject({ listedPairs: 1, quotedPairs: 1, quotedExpirations: 1 });
    expect(w[4]).toMatchObject({ listedPairs: 1, quotedPairs: 0, quotedExpirations: 0 });
    expect(w[5]).toMatchObject({ listedPairs: 2, quotedPairs: 0 });
    expect(w[9]).toMatchObject({ listedPairs: 1, quotedPairs: 1 });
    expect(w[10]).toMatchObject({ listedPairs: 1, quotedPairs: 1 });
    expect(row).toMatchObject({
      listedPairsTotal: 8, quotedPairsTotal: 5, listedWidthCount: 6, quotedWidthCount: 4, minQuotedWidth: 1, maxQuotedWidth: 10,
    });
  });

  it("has no width cap and keeps fractional widths at cent precision", () => {
    const s: SnapshotSymbol = {
      ...tt1Symbol(),
      chains: [chain("2026-12-04", { puts: [put(102.5, -0.25, 1.0, 1.02), put(100, -0.1, 0.5, 0.52), put(2.5, -0.001, 0.01, 0.02)] })],
    };
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row.widths.map((x) => x.width)).toEqual([2.5, 100]);
    expect(row).toMatchObject({ quotedWidthCount: 2, minQuotedWidth: 2.5, maxQuotedWidth: 100, quotedPairsTotal: 2 });
  });

  it("requires a valid two-sided quote on BOTH legs for a quoted pair", () => {
    const s: SnapshotSymbol = {
      ...tt1Symbol(),
      chains: [chain("2026-12-04", { puts: [put(50, -0.25, 0, 0.1), put(49, -0.1, 0.5, 0.52), put(48, -0.08, 0.4, 0.38)] })],
    };
    const row = buildSymbolLiquidityRow(s, f)!;
    // Short 50 is zero-bid → listed only at $1 and $2; 49 is out of band so it is never a short.
    expect(row.widths).toEqual([
      { width: 1, listedPairs: 1, quotedPairs: 0, quotedExpirations: 0 },
      { width: 2, listedPairs: 1, quotedPairs: 0, quotedExpirations: 0 },
    ]);
    expect(row).toMatchObject({ quotedWidthCount: 0, quotedPairsTotal: 0, minQuotedWidth: null, maxQuotedWidth: null });
  });

  it("duplicate strikes and missing strikes do not create pairs", () => {
    const s: SnapshotSymbol = {
      ...tt1Symbol(),
      chains: [chain("2026-12-04", { puts: [put(50, -0.25, 1, 1.02), put(50, -0.25, 1, 1.02), put(49, -0.1, 0.5, 0.52), { delta: -0.2, bid: 1, ask: 1.02, openInterest: 5000, volume: 1 }] })],
    };
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row.widths).toEqual([{ width: 1, listedPairs: 1, quotedPairs: 1, quotedExpirations: 1 }]);
  });

  it("a symbol with in-band shorts but no lower strike reports zero listed widths, not 'not evaluated'", () => {
    const s: SnapshotSymbol = { ...tt1Symbol(), chains: [chain("2026-12-04", { puts: [put(50, -0.25, 1, 1.02)] })] };
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row).toMatchObject({ widths: [], listedWidthCount: 0, quotedWidthCount: 0, listedPairsTotal: 0, quotedPairsTotal: 0 });
  });

  it("width discovery does not alter any liquidity measure", () => {
    const withPairs = buildSymbolLiquidityRow(tt1Symbol(), f)!;
    // Same contracts without strikes → no pairs can be formed; every liquidity measure must be identical.
    const noStrikes: SnapshotSymbol = {
      ...tt1Symbol(),
      chains: tt1Symbol().chains!.map((c) => ({ ...c, data: { ...c.data!, puts: (c.data!.puts ?? []).map(({ strike: _s, ...rest }) => rest) } })),
    };
    const withoutPairs = buildSymbolLiquidityRow(noStrikes, f)!;
    const strip = (r: typeof withPairs) => {
      const { widths: _w, listedPairsTotal: _a, quotedPairsTotal: _b, listedWidthCount: _c, quotedWidthCount: _d, minQuotedWidth: _e, maxQuotedWidth: _g, ...rest } = r;
      return rest;
    };
    expect(withoutPairs.widths).toEqual([]);
    expect(strip(withoutPairs)).toEqual(strip(withPairs));
    expect(withPairs.measuredContracts).toBe(3); // puts 50 @38; 51, 50 @45
  });

  it("only evaluates chains inside the DTE range and admissible", () => {
    const s = tt1Symbol();
    s.chains = s.chains!.map((c) => (c.expiration === "2026-12-11" ? { ...c, admissibility: NOT_ADM } : c));
    const row = buildSymbolLiquidityRow(s, f)!;
    expect(row.widths.map((x) => x.width)).toEqual([1, 2, 5]); // the 45-DTE pairs are gone
    expect(row.notAdmissibleChains).toBe(1);
  });
});
