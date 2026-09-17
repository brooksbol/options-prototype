/**
 * use-hold-close-notices — Operator Console adapter that fully resolves each
 * position through NOTICE → EVALUATE → DECIDE ONCE, and owns the result.
 *
 * SINGLE EVALUATION, ONE TRUTH: the row indicator and the opened Position Detail
 * consume the SAME per-position `ResolvedShortObligation` (candidate + governed
 * decision + evaluated pair). The row bell reflects the DECIDE result's
 * attention; the modal leads with the same decision's headline and renders the
 * same pair's facts. They cannot disagree, even if evidence advances between a
 * render and a modal open.
 *
 * The row indicator is driven by the GOVERNED DECISION (what the operator should
 * do), not by consequence completeness and not by chain admissibility. Market
 * closure / inadmissible pricing degrades the execution caveat inside the
 * decision, never the indicator when the action stands on supported inputs
 * (invariant BTS-CLOSURE-INDEPENDENCE).
 *
 * Mirrors `use-position-deltas` (async, re-run on evidence generation).
 * Read-only: no mutation, no acquisition, no provider calls.
 */

import { useState, useEffect } from "react";
import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../write-desk/types";
import type { MarketSessionClassification } from "../market-session/session-policy";
import {
  resolveShortObligation,
  activityIdentity,
  type ResolvedShortObligation,
  type EvaluatedPair,
} from "../write-desk/short-obligation-resolve";
import type { ShortObligation } from "../write-desk/short-obligation-consequences";

/** Per-position fully-resolved result (candidate + decision + pair), by id. */
export type ResolvedMap = ReadonlyMap<string, ResolvedShortObligation>;

/**
 * Row indicator state, derived from the governed decision:
 *   - "actionable" — a governed lifecycle action awaits operator attention
 *     (BTC / HOLD-with-attention / RECONCILE-LIFECYCLE / DECISION-DEFERRED). RED.
 *   - "none"        — no action warranted, or not a short obligation. No indicator.
 * (There is no separate "refused" bell: closure/inadmissibility never downgrades
 * an action that stands; a subject-level blocker surfaces as RECONCILE, which is
 * itself an action requiring attention.)
 */
export type HoldCloseNotice = "actionable" | "none";

export interface HoldCloseNoticesResult {
  /** The fully-resolved per-position result (single source of truth). */
  resolved: ResolvedMap;
  /** Row-indicator per position, derived from `resolved`'s decision. */
  notices: ReadonlyMap<string, HoldCloseNotice>;
}

const EMPTY_RESOLVED: ResolvedMap = new Map();
const EMPTY_NOTICES: ReadonlyMap<string, HoldCloseNotice> = new Map();
const EMPTY_RESULT: HoldCloseNoticesResult = { resolved: EMPTY_RESOLVED, notices: EMPTY_NOTICES };

/**
 * Test seam: per-obligation evaluation loader. Defaults to the shared live path.
 */
export type HoldClosePairLoader = (
  obligation: ShortObligation,
  snapshot: PortfolioSnapshot,
  session: MarketSessionClassification
) => Promise<EvaluatedPair>;

/**
 * Resolve every position ONCE and return the Console-owned resolved map + the
 * derived row indicators.
 */
export function useHoldCloseNotices(
  positions: MonitoredPosition[],
  snapshot: PortfolioSnapshot | null,
  sessionClassification: MarketSessionClassification,
  generation: number | null,
  loadPair?: HoldClosePairLoader,
): HoldCloseNoticesResult {
  const [result, setResult] = useState<HoldCloseNoticesResult>(EMPTY_RESULT);

  const positionKey = positions.map(p => `${p.id}@${p.dte}#${p.moneyness ?? "na"}`).join(",");
  const sessionKey = `${sessionClassification.state}|${sessionClassification.authorityPending ?? false}|${sessionClassification.admissibilityBoundaryEpochMs ?? "null"}`;
  const snapshotKey = snapshot
    ? `${snapshot.provenance?.optionSummaryExportTimestamp ?? "no-checkpoint"}|${snapshot.provenance?.createdAt ?? "no-snapshot"}|${snapshot.snapshotDate ?? "no-date"}`
    : "no-snapshot";
  const invalidationKey = `${positionKey}::${sessionKey}::${snapshotKey}::${activityIdentity()}::gen${generation ?? "null"}`;

  useEffect(() => {
    if (!snapshot || positions.length === 0) {
      setResult(EMPTY_RESULT);
      return;
    }
    let cancelled = false;

    (async () => {
      const resolved = new Map<string, ResolvedShortObligation>();
      const notices = new Map<string, HoldCloseNotice>();
      for (const pos of positions) {
        try {
          const r = await resolveShortObligation(
            pos, snapshot, sessionClassification, undefined,
            loadPair ? (o, s, sc) => loadPair(o, s, sc) : undefined,
          );
          if (!r) {
            notices.set(pos.id, "none");
            continue;
          }
          resolved.set(pos.id, r);
          notices.set(pos.id, r.decision.attention ? "actionable" : "none");
        } catch {
          // Fail closed: a load/eval failure is never advertised as a governed
          // action. No indicator; the modal (if opened) shows nothing/pending.
          notices.set(pos.id, "none");
        }
      }
      if (!cancelled) setResult({ resolved, notices });
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidationKey]);

  return result;
}
