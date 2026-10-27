/**
 * Liquidity Grade — contract-level, display/sort only.
 *
 * Classifies one option contract into L1 (Liquid) … L4 (Illiquid) from two
 * observed contract facts:
 *
 *   - spread % of mid ((ask − bid) / mid × 100) — the entry cost of getting filled
 *   - open interest — depth for closing or rolling later
 *
 * Weakest link (non-compensatory): each measure is graded on its own and the
 * contract receives the WORSE of the two. Deep open interest cannot rescue a
 * wide spread, and a tight spread cannot rescue a thin market. This is
 * deliberately different from the Exec score, which is a weighted composite.
 *
 * Deliberately excluded:
 *   - Volume: resets each session, so a grade using it would depend on time of day.
 *   - Buy-Write stock-leg spread: not observed on the row (option leg only).
 *   - Underlying/ETF share liquidity: not present in v1 Deployment evidence.
 *
 * Authority: presentation and operator sorting ONLY. Must never feed posture,
 * ranking, Production v0, filtering, or any recommendation decision. The
 * thresholds are PROVISIONAL Principal-adjustable parameters (approved
 * October 27, 2026 as a starting point), not ratified policy.
 */

export type LiquidityTier = 1 | 2 | 3 | 4;

/** Which measure held the contract below L1 (null when L1 or ungraded). */
export type LiquidityLimitedBy = "spread" | "openInterest" | "both" | null;

export interface LiquidityGrade {
  tier: LiquidityTier;
  /** "L1" … "L4" */
  label: string;
  /** Human tier name */
  name: string;
  limitedBy: LiquidityLimitedBy;
  spreadTier: LiquidityTier;
  openInterestTier: LiquidityTier;
}

export interface LiquidityTierThreshold {
  tier: Exclude<LiquidityTier, 4>;
  name: string;
  /** Inclusive upper bound on spread % of mid */
  maxSpreadPercent: number;
  /** Inclusive lower bound on open interest */
  minOpenInterest: number;
}

export interface LiquidityGradePolicy {
  version: string;
  tiers: readonly LiquidityTierThreshold[];
}

export const LIQUIDITY_GRADE_POLICY: LiquidityGradePolicy = {
  version: "v0-provisional",
  tiers: [
    { tier: 1, name: "Liquid", maxSpreadPercent: 5, minOpenInterest: 1000 },
    { tier: 2, name: "Adequate", maxSpreadPercent: 10, minOpenInterest: 250 },
    { tier: 3, name: "Thin", maxSpreadPercent: 20, minOpenInterest: 50 },
  ],
};

const TIER_NAMES: Record<LiquidityTier, string> = { 1: "Liquid", 2: "Adequate", 3: "Thin", 4: "Illiquid" };

function tierFor(
  value: number,
  passes: (t: LiquidityTierThreshold, v: number) => boolean,
  policy: LiquidityGradePolicy,
): LiquidityTier {
  for (const t of policy.tiers) {
    if (passes(t, value)) return t.tier;
  }
  return 4;
}

/**
 * Grade one contract. Returns null when either input is not an observed,
 * finite, non-negative number. Missing evidence is never graded as liquid
 * or illiquid.
 */
export function gradeLiquidity(
  input: { spreadPercent: number | null | undefined; openInterest: number | null | undefined },
  policy: LiquidityGradePolicy = LIQUIDITY_GRADE_POLICY,
): LiquidityGrade | null {
  const { spreadPercent, openInterest } = input;
  if (spreadPercent == null || !Number.isFinite(spreadPercent) || spreadPercent < 0) return null;
  if (openInterest == null || !Number.isFinite(openInterest) || openInterest < 0) return null;

  const spreadTier = tierFor(spreadPercent, (t, v) => v <= t.maxSpreadPercent, policy);
  const openInterestTier = tierFor(openInterest, (t, v) => v >= t.minOpenInterest, policy);
  const tier = Math.max(spreadTier, openInterestTier) as LiquidityTier;

  let limitedBy: LiquidityLimitedBy = null;
  if (tier > 1) {
    if (spreadTier === tier && openInterestTier === tier) limitedBy = "both";
    else if (spreadTier === tier) limitedBy = "spread";
    else limitedBy = "openInterest";
  }

  return { tier, label: `L${tier}`, name: TIER_NAMES[tier], limitedBy, spreadTier, openInterestTier };
}

/**
 * Total "most liquid first" ordering: tier ascending, then spread % ascending,
 * then open interest descending. Ungraded rows sort after graded rows.
 * Returns negative when `a` is more liquid than `b`.
 */
export function compareLiquidity(
  a: { liquidity: LiquidityGrade | null; spreadPercent: number; openInterest: number },
  b: { liquidity: LiquidityGrade | null; spreadPercent: number; openInterest: number },
): number {
  if (a.liquidity == null && b.liquidity == null) return 0;
  if (a.liquidity == null) return 1;
  if (b.liquidity == null) return -1;
  if (a.liquidity.tier !== b.liquidity.tier) return a.liquidity.tier - b.liquidity.tier;
  if (a.spreadPercent !== b.spreadPercent) return a.spreadPercent - b.spreadPercent;
  return b.openInterest - a.openInterest;
}

/**
 * Attach a numeric `liquiditySortKey` (higher = more liquid) so the shared
 * single-key table sort orders rows by {@link compareLiquidity}. Rows that tie
 * on tier, spread and open interest share a key; ungraded rows get undefined,
 * which the shared sort pins last in both directions.
 */
export function withLiquiditySortKeys<T extends { liquidity: LiquidityGrade | null; spreadPercent: number; openInterest: number }>(
  rows: T[],
): Array<T & { liquiditySortKey: number | undefined }> {
  const graded = rows.filter((r) => r.liquidity != null).sort(compareLiquidity);
  const keyByRow = new Map<T, number>();
  let key = graded.length;
  for (let i = 0; i < graded.length; i++) {
    if (i > 0 && compareLiquidity(graded[i - 1], graded[i]) !== 0) key = graded.length - i;
    keyByRow.set(graded[i], key);
  }
  return rows.map((r) => ({ ...r, liquiditySortKey: keyByRow.get(r) }));
}

/** Plain-language explanation for tooltips and CSV. */
export function describeLiquidity(
  grade: LiquidityGrade | null,
  facts: { spreadPercent: number; openInterest: number },
): string {
  if (!grade) return "Not graded: spread or open interest not observed";
  const base = `${grade.label} ${grade.name} · spread ${facts.spreadPercent.toFixed(1)}% · OI ${facts.openInterest.toLocaleString()}`;
  if (grade.limitedBy === "spread") return `${base} — limited by spread`;
  if (grade.limitedBy === "openInterest") return `${base} — limited by open interest`;
  if (grade.limitedBy === "both") return `${base} — limited by spread and open interest`;
  return base;
}
