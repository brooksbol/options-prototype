/**
 * Existing Short-Obligation HOLD vs CLOSE — Consequence Assessment V1
 *
 * Governing design: docs/design/existing-short-obligation-hold-vs-close-v1-design.md
 * LVT homes: LVT-BET-LIFECYCLE-CHOICES (LVT-INIT-LIFE-COMPARE / LVT-INIT-LIFE-TRANSITIONS)
 *            LVT-BET-CONSEQUENCE-ENVELOPE (LVT-INIT-CONSEQUENCE-RELEASE-COST — extended
 *            from owned shares to existing short-option obligations).
 * Architectural precedent: release-cost-consequences.ts (owned-share consequence v1).
 *
 * WHAT THIS IS
 *   A pure, deterministic, read-only consequence evaluator for ONE existing
 *   single-leg short-option obligation and ONE supplied governed alternative
 *   from {HOLD, CLOSE}. It emits INDEPENDENT forward consequence facts
 *   (CLOSE: C1–C12; HOLD: H1–H11) plus optional/degradable historical context
 *   (X1–X4). It does NOT choose a winner. There is no verdict, no scalar score,
 *   no ranking in V1 (design §17, §20.1).
 *
 * OWNERSHIP BOUNDARY (governing — design §2)
 *   evaluateShortObligationConsequences(obligation, suppliedAlternative, evidence)
 *     → consequence facts | lifecycle-ambiguous refusal
 *   It CONSUMES an already-known alternative. It does NOT discover, enumerate,
 *   rank, select, or recommend alternatives. Alternative enumeration (roll
 *   strikes, replacement expirations, spread legs) belongs to
 *   LVT-BET-LIFECYCLE-CHOICES — NOT here (design §2, §17).
 *
 * AUTHORITY / EVIDENCE (design §14, §14a; ADR-013/015/016/017; the consolidated
 * brokerage lifecycle-evidence authority in 07-architecture-current.md)
 *   - The evaluator is a CONSUMER: it presents authoritative facts and preserves
 *     provenance. It does not re-derive admissibility/session policy (ADR-017),
 *     does not reconstruct provenance (ADR-015), does not manufacture a competing
 *     association (ADR-016), and never promotes interpretation into fact (ADR-013).
 *   - It is NOT a portfolio authority. It never mutates portfolio/overlay state,
 *     never repairs the activity overlay, never reconstructs lifecycle history,
 *     never establishes lifecycle episodes (design §14a; Codex constraint #3).
 *   - Lifecycle ambiguity FAILS CLOSED: when authoritative post-checkpoint
 *     brokerage Activity contains an exact-contract resolution event (buy-to-close,
 *     expiration, assignment) conflicting with the projected open obligation, the
 *     subject is `lifecycle state ambiguous` and the comparison is REFUSED.
 *     Exact-contract association only; where association cannot be established
 *     without inference, REFUSE rather than associate (design §14a; ADR-016;
 *     Codex constraints #1, #2).
 *
 * PRICING (design §11; Codex constraint #5)
 *   There is NO authoritative executable BTC price before execution. The close
 *   estimate uses midpoint (bid+ask)/2 and is labeled indicative — never fill,
 *   executable price, or guaranteed debit. It ALWAYS carries the bid/ask/spread
 *   geometry that produced it. A structurally weak/wide market, or a quote that
 *   cannot be distinguished from an unusable zero, degrades to weak/unavailable
 *   rather than a precise-looking confident number.
 *
 * GREEKS / IV (design §12; Codex constraint #6)
 *   Optional, degradable ENRICHMENT — never a hard dependency, never an action
 *   input. null ≠ 0; a genuine provider 0 is data; only an EXACT all-five-zero
 *   vector is an unavailable placeholder (whole-vector rule — this module does
 *   NOT use the per-field zero→null display sanitizer). `midIv` and `smvVol` are
 *   DISTINCT (never aliased/averaged/collapsed; there is no generic iv). No local
 *   IV computation. Greek/IV age = the chain's acquisition age (no independent
 *   provenance). Delta is not assignment probability.
 *
 * HISTORICAL vs FORWARD (design §8; Codex constraint #4)
 *   X1-X4 are historical/context facts ("what has happened so far"). The CLOSE
 *   facts (C1-C12) and HOLD facts (H1-H11) are forward consequences ("from this
 *   instant onward"). Historical facts degrade to approximate/unavailable and
 *   NEVER suppress the forward facts and NEVER masquerade as forward value.
 *   (There is no verdict for them to feed anyway.)
 *
 * NON-GOALS (design §17)
 *   No verdict/winner/scalar/ranking; no BTC/take-profit policy; no ROLL;
 *   no replacement-contract search; no alternative enumeration; no lifecycle
 *   state machine / episode model; no generalized CapitalState; no partial /
 *   multi-leg close; no assignment-desirability or assignment-probability
 *   inference; no automatic redeployment; no equating nominal-encumbrance
 *   removal with deployable cash/buying power; no local option-pricing/IV solver;
 *   no new provider calls; no tax computation/inference; no portfolio-state repair.
 */

import type { EvidenceProvenance } from "./evidence-provenance";
import { PROVENANCE_UNAVAILABLE } from "./evidence-provenance";
import type { RawExportGreeks } from "./option-greeks";
import { UNAVAILABLE_RAW_EXPORT_GREEKS } from "./option-greeks";

// --- Alternatives (exactly two; design §4) ---

export type ShortObligationAlternative = "hold" | "close";

/** Side of the existing short obligation. */
export type ObligationSide = "put" | "call";

/**
 * The existing single-leg short obligation being evaluated (design §3). This is
 * a SUPPLIED, fully-specified subject — the evaluator does not discover it.
 * Modeled on OpenShortPut / OpenShortCall, carried on a MonitoredPosition.
 */
export interface ShortObligation {
  symbol: string;
  side: ObligationSide;
  strike: number;
  expiration: string;
  /** Number of short contracts. Both alternatives evaluate the SAME block (no partial close). */
  contracts: number;
  /** Days to expiration (scheduled contractual boundary). */
  dte: number;
  /**
   * Whether this obligation originated as a buy-write (covered-call origin).
   * Presentation-only context; does not change consequence semantics.
   */
  origin?: "buy-write" | null;
}

// --- Precision metadata (design §10) ---

/**
 * Precision of an emitted fact.
 *   - `known`         — authoritative value + provenance.
 *   - `approximate`   — derivable with a named caveat (aged quote, blended basis).
 *   - `unavailable`   — no synthesis; represented explicitly.
 *   - `not-applicable`— the fact does not apply to this alternative.
 * `exact` is deliberately NOT in this union: V1 never claims exactness beyond
 * what evidence proves (mirrors the release-cost precedent's reserved `exact`).
 */
export type FactPrecision = "known" | "approximate" | "unavailable" | "not-applicable";

/** A numeric consequence fact with its own precision + provenance. Never bare. */
export interface NumericFact {
  value: number | null;
  precision: FactPrecision;
  provenance: EvidenceProvenance;
  /** Short human-readable note; caveat when approximate/unavailable. */
  note: string;
}

// --- Quote geometry (design §11, C1/C2; Codex constraint #5) ---

/**
 * The market shape behind an indicative close estimate. C1 must NEVER be a
 * precise-looking dollar figure detached from this geometry.
 */
export interface QuoteGeometry {
  bid: number | null;
  ask: number | null;
  /** ask − bid, when both present. */
  spread: number | null;
  /** spread / mid × 100, when computable. */
  spreadPercent: number | null;
  /**
   * Structural quote quality (no execution-quality policy — Codex #5):
   *   - `usable`          — two-sided, positive, non-crossed quote (midpoint computable).
   *   - `weak`            — one-sided/nonpositive/crossed — cannot form a two-sided midpoint.
   *   - `indistinct-zero` — a zero that cannot be told apart from an unusable/absent quote.
   *   - `unavailable`     — no quote evidence at all.
   */
  quality: "usable" | "weak" | "indistinct-zero" | "unavailable";
}

// --- Greek / IV enrichment (design §12; optional, degradable) ---

/**
 * Optional greek/IV enrichment for the obligation contract. Uses the RAW export
 * representation (provider exact 0 and null preserved verbatim; `midIv`/`smvVol`
 * distinct; whole-vector all-zero is the only placeholder). NEVER an action input.
 * `chainAcquiredAtMs` is the chain's authoritative acquisition moment (greek age =
 * chain age; no independent greek provenance — ADR-015 / design §12).
 */
export interface GreekIvEnrichment {
  greeks: RawExportGreeks;
  /** True only when all five greeks are exactly 0 (whole-vector unavailable placeholder). */
  allFiveZeroPlaceholder: boolean;
  /** Chain acquisition epoch-ms (greek age = chain age), or null when unavailable. */
  chainAcquiredAtMs: number | null;
}

// --- Evidence context supplied to the pure evaluator (nothing discovered) ---

/**
 * Everything the evaluator reads. Assembled upstream by the (async) adapter that
 * reads cached evidence and consumes backend admissibility/session authority.
 * The pure evaluator itself performs NO I/O and makes NO provider calls.
 */
export interface ShortObligationEvidence {
  /**
   * §14a lifecycle-ambiguity determination, decided upstream from AUTHORITATIVE
   * post-checkpoint brokerage Activity by exact-contract association only. When
   * `ambiguous` is true the evaluator refuses. This module does not read Activity
   * itself (that is the adapter's job via `detectLifecycleAmbiguity`), but the
   * determination is passed in so the pure core stays deterministic/testable.
   */
  lifecycle: LifecycleAmbiguity;

  /**
   * Whether the obligation's evidence is admissible per BACKEND authority
   * (ADR-017), decided upstream via isSubjectAdmissible. When false, or when
   * authority is pending, the evaluator fails closed (refuses the forward facts).
   */
  admissible: boolean;
  /** True while backend session authority has not yet been received (fail closed). */
  authorityPending: boolean;
  /**
   * Fine-grained admissibility diagnosis, decided UPSTREAM by the adapter, so the
   * refusal reason reflects what was actually observed rather than collapsing
   * every gate into "backend inadmissible" (Codex #7). This does NOT change the
   * gate outcome — `admissible`/`authorityPending` still decide pass/fail — it
   * only names the cause when the gate fails.
   */
  admissibilityDiagnosis: AdmissibilityDiagnosis;

  /** Current option quote for the obligation contract (close leg). */
  quote: QuoteGeometry;
  /** Chain-acquisition provenance for the option leg (ADR-015). */
  optionProvenance: EvidenceProvenance;

  /** Observed underlying spot (for moneyness), or null. */
  observedSpot: number | null;
  /**
   * Underlying-quote provenance. Wheelwright has no authoritative independent
   * quote-acquisition time (ADR-015 known gap): spot is folded into the chain
   * record. So spot-derived facts carry `unavailable` provenance and are labeled
   * "quote freshness unknown" — never laundered from chain provenance.
   */
  spotProvenance: EvidenceProvenance;

  /** Optional greek/IV enrichment (design §12). Absent → forward facts still emit. */
  enrichment?: GreekIvEnrichment | null;

  /**
   * Historical/context inputs (X1–X4; design §7/§8). All optional and degradable.
   * `openingCredit` is the gross opening credit for the obligation (positive $),
   * where derivable; null otherwise. Never a hard dependency.
   */
  openingCredit?: number | null;
  /**
   * Attribution quality of `openingCredit` (Codex #4). The evaluator NEVER
   * promotes a value to `known` unless attribution is authoritatively
   * established for THIS obligation:
   *   - `authoritative` — lot/contract-attributed opening credit → may be `known`.
   *   - `blended`       — position/symbol-level or broker-blended basis → at best
   *                       `approximate`, never `known`.
   *   - `unavailable`   — no attributable opening credit.
   * A position-level `brokerOptionBasis` is `blended`, not `authoritative`.
   */
  openingCreditAttribution?: "authoritative" | "blended" | "unavailable";

  /**
   * Externally-authoritative assignment intent (design §9, §16 cases 3/4). The
   * evaluator NEVER creates or infers intent. Default `unknown`. A supplied value
   * is carried but never used to produce a "high exposure ⇒ CLOSE" conclusion.
   */
  assignmentIntent?: "unknown" | "assignment-desired" | "assignment-unwanted";
}

// --- §14a lifecycle-ambiguity refusal ---

/**
 * Result of the exact-contract lifecycle-ambiguity check (design §14a). Decided
 * upstream from authoritative post-checkpoint Activity; carried into the pure
 * evaluator so it can refuse deterministically.
 */
export type LifecycleAmbiguity =
  | { ambiguous: false }
  | {
      ambiguous: true;
      /** Which conflicting resolution event was observed on the exact contract. */
      conflictingEvent: "buy_to_close" | "expired" | "assigned";
      /** ISO date (day precision) of the conflicting Activity event. */
      eventDate: string;
      /** Human-readable, non-repairing explanation. */
      note: string;
    };

/**
 * Fine-grained admissibility diagnosis (Codex #7). Distinguishes WHY forward
 * evidence is or is not usable, so a refusal names the actual observed cause.
 * Decided upstream by the adapter; the evaluator only surfaces it.
 *   - `admissible`      — backend verdict admissible and evidence usable → proceed.
 *   - `authority-pending` — backend session authority not yet received (fail closed).
 *   - `backend-inadmissible` — explicit backend per-subject `admissible:false`.
 *   - `missing-evidence` — no cached chain record for this exact expiration.
 *   - `cache-unusable`  — a record exists but is not cache-usable and carries no
 *                         admissibility verdict (locally stale/expired transport).
 */
export type AdmissibilityDiagnosis =
  | "admissible"
  | "authority-pending"
  | "backend-inadmissible"
  | "missing-evidence"
  | "cache-unusable";

// --- Refusal vs facts result ---

export type ConsequenceResult =
  | {
      kind: "refused";
      reason:
        | "lifecycle-state-ambiguous"
        | "authority-pending"
        | "backend-inadmissible"
        | "missing-evidence"
        | "cache-unusable";
      /** The alternative that was requested (echoed for the caller). */
      alternative: ShortObligationAlternative;
      note: string;
      /** Present only for lifecycle-state-ambiguous refusals. */
      lifecycle?: Extract<LifecycleAmbiguity, { ambiguous: true }>;
    }
  | {
      kind: "facts";
      alternative: ShortObligationAlternative;
      close?: CloseFacts;
      hold?: HoldFacts;
      historical: HistoricalContext;
    };

// --- CLOSE facts (C1–C12; design §7) ---

export interface CloseFacts {
  /** C1 — estimated close debit (indicative midpoint; carries quote geometry via C2). */
  estimatedCloseDebit: NumericFact;
  /** C2 — quote convention + quality used to produce C1. */
  quoteGeometry: QuoteGeometry;
  /** C2 — the convention name behind C1. Always "midpoint" in V1. */
  quoteConvention: "midpoint";
  /** C3 — quote/evidence provenance + age subject (chain acquisition; never timeless). */
  optionProvenance: EvidenceProvenance;
  /** C4 — nominal encumbrance removed (CSP: strike×100×contracts cash-secured; CC: shares un-encumbered). */
  nominalEncumbranceRemoved: EncumbranceFact;
  /** C5 — resulting holding/obligation state after CLOSE (a holding label, never a cash-release claim). */
  resultingState: string;
  /** C6 — current DTE of the obligation being retired. */
  currentDte: number;
  /** C7 — current moneyness (ITM/ATM/OTM + distance), or unavailable. */
  moneyness: MoneynessFact;
  /** C8 — assignment/expiration exposure removed by closing. */
  exposureRemoved: string;
  /** C9/C10 — optional greek/IV context (enrich, never decide). */
  enrichment: GreekIvEnrichment | null;
  /** C11 — explicit execution uncertainty (fill unknown pre-execution). */
  executionUncertainty: string;
  /** C12 — next decision boundary. */
  nextDecisionBoundary: { kind: "now"; note: string };
}

// --- HOLD facts (H1–H11; design §7) ---

export interface HoldFacts {
  /** H1 — obligation remains. */
  obligationRemains: string;
  /** H2 — nominal encumbrance remains committed. */
  nominalEncumbranceRemains: EncumbranceFact;
  /** H3 — DTE / time to SCHEDULED contractual boundary (exposure duration; not guaranteed lockup). */
  exposureDurationDays: number;
  /**
   * H4 — assignment/expiration resolution branches. Expiration branches are
   * scoped "if held through expiration"; early (American) assignment is
   * acknowledged as possible, never predicted (design §5, §16 case 4).
   */
  resolutionBranches: string[];
  /** H5 — current moneyness (same measure as C7). */
  moneyness: MoneynessFact;
  /** H6/H7 — optional greek/IV context. */
  enrichment: GreekIvEnrichment | null;
  /** H8 — no immediate closing cash outlay. */
  noImmediateOutlay: string;
  /** H9 — continued exposure (directional/volatility/time). */
  continuedExposure: string;
  /** H10 — retained ability to close later (optionality preserved). */
  retainedOptionality: string;
  /**
   * H11 — next SCHEDULED decision boundary (expiration); early assignment remains
   * possible (not predicted); not asserted as the only/guaranteed resolution date.
   */
  nextScheduledBoundary: { kind: "scheduled-expiration"; expiration: string; note: string };
  /**
   * Assignment intent as CARRIED from an external authoritative source (design §9).
   * Never inferred here. Default "unknown". Presentation-only context.
   */
  assignmentIntent: "unknown" | "assignment-desired" | "assignment-unwanted";
}

// --- Encumbrance fact (design §13; Codex constraints) ---

/**
 * Nominal encumbrance consequence. CANONICAL term: "nominal encumbrance". This is
 * NEVER a claim about cash/buying-power/deployable-capacity change — that is
 * unknown until broker/account evidence establishes it (design §13, §16 cases 5/14).
 */
export interface EncumbranceFact {
  /** Dollar nominal encumbrance for a CSP (strike×100×contracts); null for a covered call. */
  nominalDollars: number | null;
  /** Shares un-encumbered by closing a covered call; null for a CSP. */
  shares: number | null;
  /** Fixed disclaimer: nominal-only, not a cash/buying-power claim. */
  disclaimer: "nominal-encumbrance-not-cash-or-buying-power";
  note: string;
}

// --- Moneyness fact (design C7/H5) ---

export interface MoneynessFact {
  classification: "ITM" | "ATM" | "OTM" | null;
  /** Signed distance from strike as a fraction of strike; null when spot unavailable. */
  distanceFraction: number | null;
  /** Absolute dollar distance from strike; null when spot unavailable. */
  distanceDollars: number | null;
  provenance: EvidenceProvenance;
  precision: FactPrecision;
  /**
   * Whether the underlying spot's own freshness/fitness is authoritatively known
   * (Codex #4). Wheelwright currently has NO authoritative independent
   * quote/spot acquisition provenance (ADR-015 gap), so this is normally false:
   * moneyness must be presented as "current spot, freshness unknown" rather than
   * unqualified current truth.
   */
  spotFreshnessKnown: boolean;
}

// --- Historical / context facts (X1–X4; design §7/§8) ---

export interface HistoricalContext {
  /** X1 — gross opening credit, where authoritatively attributable. */
  openingCredit: NumericFact;
  /**
   * X2 — estimated GROSS mark-to-market option result vs attributable opening
   * credit: openingCredit − currentObligationValue. NOT realized P/L: the
   * obligation value is quote-derived (midpoint, indicative), no close has
   * occurred, closing costs/slippage excluded (design §7 X2, §8, §16 case 1).
   */
  estimatedGrossMarkToMarket: NumericFact & { basis: "gross-mark-to-market-not-realized-pl" };
  /**
   * X3 — premium captured %: (openingCredit − currentObligationValue) / openingCredit.
   * GROSS numerator over GROSS denominator; the gross/net basis is stated and never
   * silently mixed with a net figure (design §7 X3).
   */
  premiumCapturedPercent: NumericFact & { basis: "gross-over-gross" };
  /** X4 — realized-to-date economics, where attributable (not modeled in V1 beyond passthrough). */
  realizedToDate: NumericFact;
}

// --- Canonical disclaimer strings (one authoritative home) ---

export const CLOSE_DEBIT_DISCLAIMER =
  "Indicative midpoint estimate of the buy-to-close debit; not an execution price, " +
  "expected fill, or guaranteed debit. Actual fill depends on market conditions at order time.";

export const NOMINAL_ENCUMBRANCE_DISCLAIMER =
  "Removes the obligation's nominal encumbrance. Whether that produces cash, buying power, " +
  "or deployable capacity is unknown until authoritative broker/account evidence establishes it.";

export const X2_MARK_TO_MARKET_DISCLAIMER =
  "Estimated gross mark-to-market result vs attributable opening credit. Not realized P/L: " +
  "the obligation value is quote-derived (midpoint, indicative), no close has occurred, and " +
  "closing costs/slippage are excluded.";

// --- Core evaluator ---

/**
 * Evaluate the forward consequences of ONE supplied alternative on ONE existing
 * short obligation. Pure and deterministic: identical inputs ⇒ identical output.
 *
 * PER-FACT EVIDENCE DEPENDENCY (Principal-approved governing rule):
 *   "Establish each consequence independently from its required evidence.
 *    Missing close-price support makes DEPENDENT facts unavailable; it does not
 *    cancel an independently established comparison."
 *
 * The governing unit is the individual fact and its evidence dependencies — NOT
 * a crude price/non-price split. A wholesale refusal happens ONLY for a
 * SUBJECT-LEVEL blocker: a condition under which Wheelwright cannot establish the
 * authoritative subject / current obligation state required to evaluate the
 * alternatives at all.
 *
 * Subject-level blockers (wholesale refuse):
 *   1. lifecycle ambiguous (§14a) — cannot confirm the obligation is current.
 *   2. authority pending (ADR-017) — no backend session authority yet.
 * Market/session closure or chain inadmissibility is NEVER a subject-level
 * blocker (invariant BTS-CLOSURE-INDEPENDENCE). It makes chain-quote-dependent
 * facts (close debit, quote geometry, Greeks/IV, and any current-valuation-
 * derived historical fact) unavailable — carrying the diagnosis as the per-fact
 * reason — while facts standing on independent evidence (encumbrance, DTE/
 * exposure, resolution branches, moneyness from a supported underlying
 * observation, resulting state, optionality) remain available.
 */
export function evaluateShortObligationConsequences(
  obligation: ShortObligation,
  alternative: ShortObligationAlternative,
  evidence: ShortObligationEvidence
): ConsequenceResult {
  // (1) §14a — lifecycle ambiguity is a SUBJECT-LEVEL blocker: we cannot confirm
  // the obligation is current, so we cannot analyze its alternatives at all.
  if (evidence.lifecycle.ambiguous) {
    return {
      kind: "refused",
      reason: "lifecycle-state-ambiguous",
      alternative,
      note:
        "Lifecycle state ambiguous: authoritative post-checkpoint brokerage Activity contains an " +
        `exact-contract ${evidence.lifecycle.conflictingEvent} (${evidence.lifecycle.eventDate}) that ` +
        "conflicts with the projected open obligation. HOLD/CLOSE evaluation is refused until the " +
        "portfolio lifecycle is reconciled from authoritative brokerage evidence.",
      lifecycle: evidence.lifecycle,
    };
  }

  // (2) Authority pending is a SUBJECT-LEVEL blocker (ADR-017): no backend
  // authority has been received, so nothing about the subject can be trusted yet.
  if (evidence.authorityPending) {
    return {
      kind: "refused",
      reason: "authority-pending",
      alternative,
      note:
        "Session/admissibility authority has not yet been received this session; failing closed " +
        "rather than fabricating a consequence comparison.",
    };
  }

  // Chain inadmissibility / closure is NOT a subject-level blocker. Proceed to
  // per-fact evaluation; chain-quote-dependent facts will individually degrade
  // to `unavailable` with the diagnosis reason, while facts on independent
  // evidence remain available (invariant BTS-CLOSURE-INDEPENDENCE).
  const historical = buildHistoricalContext(obligation, evidence);

  if (alternative === "close") {
    return { kind: "facts", alternative, close: buildCloseFacts(obligation, evidence), historical };
  }
  return { kind: "facts", alternative, hold: buildHoldFacts(obligation, evidence), historical };
}

/**
 * Whether the option-chain QUOTE evidence supports quote-dependent facts (close
 * debit, quote geometry, Greeks/IV, current-valuation-derived historical facts).
 * Requires both a structurally usable quote AND backend admissibility. When
 * false, dependent facts are individually `unavailable` — never a wholesale
 * refusal.
 */
function chainQuoteSupported(evidence: ShortObligationEvidence): boolean {
  return evidence.admissible && evidence.quote.quality === "usable";
}

/** Per-fact unavailability note for a chain-quote-dependent fact, by cause. */
function chainQuoteUnavailableNote(evidence: ShortObligationEvidence): string {
  if (!evidence.admissible) {
    switch (evidence.admissibilityDiagnosis) {
      case "backend-inadmissible":
        return "Current close-price evidence is not admissible this session (backend verdict); this fact is unavailable. The obligation is still analyzed from independently supported evidence.";
      case "missing-evidence":
        return "No current option-chain evidence for this expiration; this quote-dependent fact is unavailable.";
      case "cache-unusable":
        return "Current option-chain evidence is present but not usable (stale/expired transport); this quote-dependent fact is unavailable.";
      default:
        return "Current close-price evidence is not available; this quote-dependent fact is unavailable.";
    }
  }
  return "Current quote is not structurally usable for a midpoint; this quote-dependent fact is unavailable.";
}

// --- CLOSE fact construction ---

function buildCloseFacts(obligation: ShortObligation, evidence: ShortObligationEvidence): CloseFacts {
  const { quote } = evidence;
  // C1 close debit is a QUOTE-DEPENDENT fact: it requires SUPPORTED close-price
  // evidence (structurally usable AND admissible). When support is missing it is
  // individually `unavailable` with the cause — it does NOT cause a wholesale
  // refusal (invariant BTS-CLOSURE-INDEPENDENCE).
  const supported = chainQuoteSupported(evidence);
  const mid = supported ? computeMid(quote) : null;
  const debit = buildCloseDebit(mid, obligation.contracts, quote, evidence.optionProvenance, supported ? null : chainQuoteUnavailableNote(evidence));

  // C4 — nominal encumbrance removed (side-specific; never a cash claim).
  const encumbrance = buildEncumbrance(obligation, "removed");

  // C5 — resulting state (holding label; no cash-release claim).
  const resultingState =
    obligation.side === "put"
      ? "Short-put obligation removed. Any change to cash, buying power, or deployable capacity " +
        "is unknown until authoritative broker/account evidence establishes it."
      : "Shares no longer encumbered by this call; they remain held as shares. No cash is created " +
        "from those shares by closing the call.";

  const exposureRemoved =
    obligation.side === "put"
      ? "Removes assignment exposure (acquiring shares at strike) and the expiration outcome."
      : "Removes call-away exposure (selling shares at strike) and the expiration outcome.";

  return {
    estimatedCloseDebit: debit,
    quoteGeometry: quote,
    quoteConvention: "midpoint",
    optionProvenance: evidence.optionProvenance,
    nominalEncumbranceRemoved: encumbrance,
    resultingState,
    currentDte: obligation.dte,
    moneyness: buildMoneyness(obligation, evidence),
    exposureRemoved,
    enrichment: normalizeEnrichment(evidence.enrichment, chainQuoteSupported(evidence)),
    executionUncertainty:
      "Actual fill is unknown before execution; spread and slippage are not hidden (see quote geometry).",
    nextDecisionBoundary: { kind: "now", note: "Closing now is itself the decision." },
  };
}

// --- HOLD fact construction ---

function buildHoldFacts(obligation: ShortObligation, evidence: ShortObligationEvidence): HoldFacts {
  const encumbrance = buildEncumbrance(obligation, "remains");

  // H4 — resolution branches. Expiration branches scoped "if held through expiration".
  // Early American assignment acknowledged as possible, never predicted.
  const branches: string[] =
    obligation.side === "put"
      ? [
          "If held through expiration and OTM: the put expires; the obligation resolves without assignment.",
          "If held through expiration and ITM: assignment acquires shares at strike.",
          "Early assignment is possible before expiration (American-style); not predicted.",
        ]
      : [
          "If held through expiration and OTM: the call expires; shares remain held.",
          "If held through expiration and ITM: assignment sells shares at strike (called away).",
          "Early assignment is possible before expiration (American-style); not predicted.",
        ];

  return {
    obligationRemains: "The existing short obligation continues unchanged.",
    nominalEncumbranceRemains: encumbrance,
    exposureDurationDays: obligation.dte,
    resolutionBranches: branches,
    moneyness: buildMoneyness(obligation, evidence),
    enrichment: normalizeEnrichment(evidence.enrichment, chainQuoteSupported(evidence)),
    noImmediateOutlay: "Holding incurs no buy-to-close debit now.",
    continuedExposure:
      obligation.side === "put"
        ? "Retains directional (downside), volatility, and time exposure of the short put."
        : "Retains directional (upside-capped), volatility, and time exposure of the short call.",
    retainedOptionality:
      "Retains the ability to buy-to-close, roll, or let the obligation resolve later.",
    nextScheduledBoundary: {
      kind: "scheduled-expiration",
      expiration: obligation.expiration,
      note:
        "Expiration is the scheduled contractual boundary. It is exposure duration, not guaranteed " +
        "capital lockup, and not a guarantee the obligation survives that long (early assignment " +
        "remains possible; the operator may also close or roll).",
    },
    assignmentIntent: evidence.assignmentIntent ?? "unknown",
  };
}

// --- Historical context (X1–X4) — degradable; never suppresses forward facts ---

function buildHistoricalContext(
  obligation: ShortObligation,
  evidence: ShortObligationEvidence
): HistoricalContext {
  const openingCredit = evidence.openingCredit ?? null;
  const attribution = evidence.openingCreditAttribution ?? (openingCredit != null ? "blended" : "unavailable");
  // Current obligation valuation is a QUOTE-DEPENDENT fact: it requires SUPPORTED
  // close-price evidence (structurally usable AND admissible), not merely a
  // parseable midpoint. X2/X3 depend on it and therefore become unavailable when
  // that support is missing — they do NOT survive merely because they are
  // "historical" (Principal rule; per-fact evidence dependency).
  const mid = chainQuoteSupported(evidence) ? computeMid(evidence.quote) : null;
  const currentObligationValue = mid != null ? mid * 100 * obligation.contracts : null;

  // X1 — opening credit. NEVER `known` unless attribution is authoritative for
  // THIS obligation (Codex #4). A blended/position-level broker basis is at best
  // `approximate`; without a value it is `unavailable`.
  const x1: NumericFact =
    openingCredit != null && attribution !== "unavailable"
      ? {
          value: openingCredit,
          precision: attribution === "authoritative" ? "known" : "approximate",
          provenance: PROVENANCE_UNAVAILABLE, // historical/accounting, not chain-provenanced
          note:
            attribution === "authoritative"
              ? "Gross opening credit, authoritatively attributed to this obligation."
              : "Gross opening credit from a position-level / blended broker basis (approximate — " +
                "not lot/contract-attributed).",
        }
      : {
          value: null,
          precision: "unavailable",
          provenance: PROVENANCE_UNAVAILABLE,
          note: "Opening credit not authoritatively attributable.",
        };

  // X2 — estimated GROSS mark-to-market vs opening credit. NOT realized P/L.
  // Always at best `approximate` (quote-derived obligation value); `unavailable`
  // when either input is missing or opening-credit attribution is unavailable.
  const haveX = openingCredit != null && attribution !== "unavailable" && currentObligationValue != null;
  const x2Value = haveX ? openingCredit! - currentObligationValue! : null;
  // When the mark-to-market is unavailable specifically because current close-price
  // support is missing (not because opening credit is unattributable), say so.
  const x2UnavailableForQuote = x2Value == null && openingCredit != null && attribution !== "unavailable" && !chainQuoteSupported(evidence);
  const x2: HistoricalContext["estimatedGrossMarkToMarket"] = {
    value: x2Value,
    precision: x2Value == null ? "unavailable" : "approximate",
    provenance: PROVENANCE_UNAVAILABLE,
    basis: "gross-mark-to-market-not-realized-pl",
    note: x2UnavailableForQuote
      ? `${X2_MARK_TO_MARKET_DISCLAIMER} Unavailable now: ${chainQuoteUnavailableNote(evidence)}`
      : X2_MARK_TO_MARKET_DISCLAIMER,
  };

  // X3 — premium captured % (gross/gross). Undefined when no/zero opening credit
  // or unavailable attribution.
  const x3Value =
    haveX && openingCredit! !== 0 ? ((openingCredit! - currentObligationValue!) / openingCredit!) * 100 : null;
  const x3: HistoricalContext["premiumCapturedPercent"] = {
    value: x3Value,
    precision: x3Value == null ? "unavailable" : "approximate",
    provenance: PROVENANCE_UNAVAILABLE,
    basis: "gross-over-gross",
    note:
      "Premium captured % on a GROSS basis (gross numerator over gross opening credit); " +
      "not mixed with any net figure. Historical context, not a forward CLOSE signal.",
  };

  // X4 — realized-to-date. Not modeled in V1 (no attribution engine here).
  const x4: NumericFact = {
    value: null,
    precision: "unavailable",
    provenance: PROVENANCE_UNAVAILABLE,
    note: "Realized-to-date economics for this obligation are not attributed in V1.",
  };

  return {
    openingCredit: x1,
    estimatedGrossMarkToMarket: x2,
    premiumCapturedPercent: x3,
    realizedToDate: x4,
  };
}

// --- Shared fact builders ---

/**
 * C1 — estimated close debit. Degrades honestly with quote quality (design §11,
 * §16 case 6): a weak / indistinct-zero / unavailable quote yields `unavailable`
 * (never a precise-looking confident figure); a `wide` quote yields `approximate`.
 */
function buildCloseDebit(
  mid: number | null,
  contracts: number,
  quote: QuoteGeometry,
  optionProvenance: EvidenceProvenance,
  /**
   * When the close-price EVIDENCE is unsupported (inadmissible/missing/unusable
   * chain), the caller passes the per-cause reason and `mid` is null; the debit
   * is individually `unavailable` with that reason. When null, the only reason
   * for unavailability is a structurally-unusable quote.
   */
  supportUnavailableNote: string | null = null
): NumericFact {
  if (supportUnavailableNote != null) {
    return { value: null, precision: "unavailable", provenance: optionProvenance, note: supportUnavailableNote };
  }
  if (mid == null || quote.quality !== "usable") {
    return {
      value: null,
      precision: "unavailable",
      provenance: optionProvenance,
      note:
        "Close estimate unavailable: the quote is not a structurally usable two-sided market " +
        "(one-sided, crossed, or indistinguishable from an absent/zero quote).",
    };
  }
  // The MIDPOINT is mathematically defined from a structurally usable two-sided
  // quote, but the ECONOMIC close-debit estimate is never an unqualified `known`
  // fact: there is no authoritative executable BTC price before execution (§11).
  // So the value is emitted at `approximate` (indicative), carrying its quote
  // geometry so the operator can see the market dispersion behind it. V1 makes NO
  // quantitative wide/weak execution-quality judgment and invents no threshold.
  const value = mid * 100 * contracts;
  return {
    value,
    precision: "approximate",
    provenance: optionProvenance,
    note: CLOSE_DEBIT_DISCLAIMER,
  };
}

/** C4 / H2 — side-specific nominal encumbrance (never a cash/buying-power claim). */
function buildEncumbrance(obligation: ShortObligation, mode: "removed" | "remains"): EncumbranceFact {
  if (obligation.side === "put") {
    const nominal = obligation.strike * 100 * obligation.contracts;
    return {
      nominalDollars: nominal,
      shares: null,
      disclaimer: "nominal-encumbrance-not-cash-or-buying-power",
      note:
        mode === "removed"
          ? `Cash-secured nominal encumbrance removed (strike × 100 × contracts = $${nominal.toLocaleString()}). ${NOMINAL_ENCUMBRANCE_DISCLAIMER}`
          : `Cash-secured nominal encumbrance remains committed ($${nominal.toLocaleString()}). ${NOMINAL_ENCUMBRANCE_DISCLAIMER}`,
    };
  }
  const shares = obligation.contracts * 100;
  return {
    nominalDollars: null,
    shares,
    disclaimer: "nominal-encumbrance-not-cash-or-buying-power",
    note:
      mode === "removed"
        ? `${shares} shares no longer encumbered by this call (they remain held as shares; no cash is created). ${NOMINAL_ENCUMBRANCE_DISCLAIMER}`
        : `${shares} shares remain encumbered by this call. ${NOMINAL_ENCUMBRANCE_DISCLAIMER}`,
  };
}

/** C7 / H5 — moneyness from current spot + strike. ATM tolerance $0.50 (matches BR-4). */
function buildMoneyness(obligation: ShortObligation, evidence: ShortObligationEvidence): MoneynessFact {
  const spot = evidence.observedSpot;
  // Spot freshness is authoritatively known only if the spot carries chain-acquired
  // provenance — which today it does not (ADR-015 gap), so this is normally false.
  const spotFreshnessKnown = evidence.spotProvenance.kind === "chain-acquired";
  if (spot == null || !Number.isFinite(spot) || obligation.strike <= 0) {
    return {
      classification: null,
      distanceFraction: null,
      distanceDollars: null,
      provenance: evidence.spotProvenance,
      precision: "unavailable",
      spotFreshnessKnown,
    };
  }
  const distanceDollars = Math.abs(obligation.strike - spot);
  let classification: "ITM" | "ATM" | "OTM";
  if (distanceDollars <= 0.5) {
    classification = "ATM";
  } else if (obligation.side === "put") {
    classification = obligation.strike > spot ? "ITM" : "OTM";
  } else {
    classification = obligation.strike < spot ? "ITM" : "OTM";
  }
  // Signed distance as fraction of strike: positive = ITM by convention here.
  const signed =
    obligation.side === "put" ? (obligation.strike - spot) / obligation.strike : (spot - obligation.strike) / obligation.strike;
  return {
    classification,
    distanceFraction: signed,
    distanceDollars,
    // Spot has no authoritative independent provenance (ADR-015 gap): honest unknown.
    provenance: evidence.spotProvenance,
    // The classification value is derived from an observed spot, but the spot's own
    // freshness is not authoritatively established — so it is `approximate`, not
    // `known`, and `spotFreshnessKnown` is false (Codex #4).
    precision: spotFreshnessKnown ? "known" : "approximate",
    spotFreshnessKnown,
  };
}

/**
 * Normalize optional greek/IV enrichment. Absence → null (forward facts still
 * emit). Preserves the whole-vector all-zero placeholder flag. Never mutates.
 */
function normalizeEnrichment(
  enrichment: GreekIvEnrichment | null | undefined,
  chainSupported: boolean
): GreekIvEnrichment | null {
  // Greeks/IV are CHAIN-QUOTE-DEPENDENT facts. When the chain quote is
  // unsupported (inadmissible/missing/unusable), they are unavailable — the
  // section renders the honest "no greek/IV evidence" state. This does NOT
  // affect the candidate or the independently-supported facts.
  if (!chainSupported) return null;
  if (!enrichment) return null;
  return enrichment;
}

// --- Pure helpers ---

/**
 * Midpoint (bid+ask)/2, but only when the quote is genuinely usable. Returns null
 * for weak / indistinct-zero / unavailable quotes so callers never derive a
 * confident number from a degenerate quote (design §11, §16 case 6).
 */
function computeMid(quote: QuoteGeometry): number | null {
  // Only a structurally usable two-sided market yields an indicative midpoint.
  if (quote.quality !== "usable") return null;
  if (quote.bid == null || quote.ask == null || !Number.isFinite(quote.bid) || !Number.isFinite(quote.ask)) {
    return null;
  }
  return (quote.bid + quote.ask) / 2;
}

// --- Quote-quality classification (used by the adapter; pure, testable here) ---

/**
 * Classify a raw provider bid/ask into a QuoteGeometry with a quality tag
 * (design §11, §16 case 6).
 *
 * STRUCTURAL VALIDITY ONLY — no invented execution-quality policy (Codex #5).
 * V1 does NOT own a spread/execution-quality threshold or a BTC policy, so this
 * classifier makes no percentage-based "wide" vs "weak" judgment. It only tells
 * apart evidence that is structurally usable for an indicative midpoint from
 * evidence that is not:
 *   - both null/absent          → unavailable
 *   - both ≤ 0                   → indistinct-zero (a zero cannot be told apart from absent/unusable)
 *   - one side missing/≤ 0       → weak (cannot form a two-sided midpoint)
 *   - crossed (ask < bid)        → weak (degenerate market)
 *   - two-sided, positive, ask ≥ bid → usable
 * The bid/ask/spread geometry is always carried so the market shape is visible;
 * whether a usable spread is "too wide to act on" is an operator judgment, not a
 * system policy this feature invents.
 */
export function classifyQuoteGeometry(
  bid: number | null | undefined,
  ask: number | null | undefined
): QuoteGeometry {
  const b = bid != null && Number.isFinite(bid) ? bid : null;
  const a = ask != null && Number.isFinite(ask) ? ask : null;

  if (b == null && a == null) {
    return { bid: null, ask: null, spread: null, spreadPercent: null, quality: "unavailable" };
  }
  // A zero/negative quote on both sides cannot be distinguished from an unusable/absent quote.
  if ((b ?? 0) <= 0 && (a ?? 0) <= 0) {
    return { bid: b, ask: a, spread: null, spreadPercent: null, quality: "indistinct-zero" };
  }
  // One side present, the other absent/nonpositive → cannot form a two-sided midpoint.
  if (b == null || a == null || b <= 0 || a <= 0) {
    return { bid: b, ask: a, spread: null, spreadPercent: null, quality: "weak" };
  }
  if (a < b) {
    // Crossed/degenerate market — structurally invalid for a midpoint.
    return { bid: b, ask: a, spread: a - b, spreadPercent: null, quality: "weak" };
  }
  // Structurally usable two-sided market. Carry the geometry (including spread %
  // as descriptive context) but make NO wide/weak policy judgment on it.
  const spread = a - b;
  const mid = (a + b) / 2;
  const spreadPercent = mid > 0 ? (spread / mid) * 100 : null;
  return { bid: b, ask: a, spread, spreadPercent, quality: "usable" };
}

/**
 * Determine whether a raw greek vector is the exact all-five-zero placeholder
 * (design §12 whole-vector rule). ONLY when all five greeks are exactly 0 is the
 * vector an unavailable placeholder; a single zero is genuine data (null ≠ 0).
 */
export function isAllFiveZeroVector(g: RawExportGreeks): boolean {
  return g.delta === 0 && g.gamma === 0 && g.theta === 0 && g.vega === 0 && g.rho === 0;
}

/** Stable all-unavailable enrichment (no chain, no greeks). */
export const UNAVAILABLE_ENRICHMENT: GreekIvEnrichment = Object.freeze({
  greeks: UNAVAILABLE_RAW_EXPORT_GREEKS,
  allFiveZeroPlaceholder: false,
  chainAcquiredAtMs: null,
});

// NOTE: the row-indicator state is no longer derived from consequence
// completeness. It is derived from the GOVERNED DECISION (see
// short-obligation-decision.ts and use-hold-close-notices.ts). Consequence
// facts remain SUPPORTING detail. Deriving the bell from "facts vs refused"
// was the original defect (it conflated "a comparison is available" with "the
// operator has a governed action"); the DECIDE layer replaces it.
