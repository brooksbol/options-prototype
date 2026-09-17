/**
 * HOLD vs CLOSE — Existing Short-Obligation Consequence Section (V1)
 *
 * Governing design: docs/design/existing-short-obligation-hold-vs-close-v1-design.md
 *
 * Presentational adjacency ONLY (mirrors ReleaseConsequencesSection). For a
 * qualifying existing single-leg short obligation, it composes the two
 * independently-evaluated alternatives {HOLD, CLOSE} side by side. It does NOT
 * discover, rank, select, or recommend — there is no winner in V1. The evaluator
 * is invoked ONE alternative at a time (design §22); the host supplies the fixed
 * {HOLD, CLOSE} pair.
 *
 * It reads cached evidence + backend admissibility authority + authoritative
 * Activity (for the §14a lifecycle-ambiguity guard) via the async adapter, then
 * renders the pure evaluator's facts or its explicit REFUSAL. Degraded /
 * `unavailable` facts are visually distinguishable so they cannot masquerade as
 * known consequence facts (design §20.19).
 *
 * This adapter never invents provenance, never fills missing economic state,
 * never mutates portfolio/cache state, and makes no provider calls.
 */

import { formatAcquisitionAge, type EvidenceProvenance } from "../write-desk/evidence-provenance";
import { formatGreek } from "../write-desk/option-greeks";
import {
  CLOSE_DEBIT_DISCLAIMER,
  NOMINAL_ENCUMBRANCE_DISCLAIMER,
  X2_MARK_TO_MARKET_DISCLAIMER,
  type ConsequenceResult,
  type NumericFact,
  type QuoteGeometry,
  type CloseFacts,
  type HoldFacts,
  type HistoricalContext,
  type GreekIvEnrichment,
} from "../write-desk/short-obligation-consequences";
import type { EvaluatedPair } from "../write-desk/short-obligation-resolve";
import "./hold-vs-close-section.css";

/**
 * HoldVsCloseSection is PURELY PRESENTATIONAL (Codex: one evaluation, two
 * consumers). It does NOT evaluate — it renders the CURRENT evaluated pair that
 * the Console owns (produced once per position by `useHoldCloseNotices`). The
 * row bell and this section therefore render the SAME evaluated result and can
 * never disagree, even if evidence advances between a render and a modal open.
 *
 * Props:
 *   - `pair`     — the current evaluated pair for the selected obligation, or
 *                  null when there is no current comparison (obligation absent,
 *                  or evaluation failed/pending). Null renders nothing / pending.
 *   - `pending`  — true while the Console-owned evaluation is being (re)computed;
 *                  shows a pending state rather than stale facts. When a subject
 *                  genuinely has no pair (e.g. gone), the section renders nothing.
 *   - `renderPending` — whether to show the pending placeholder for a null pair.
 *                  The modal passes true while a comparison is expected; false
 *                  means "no comparison for this subject" (render nothing).
 */
export function HoldVsCloseSection({
  pair,
  renderPending = false,
}: {
  pair: EvaluatedPair | null;
  renderPending?: boolean;
}) {
  if (!pair) {
    if (!renderPending) return null;
    return (
      <section className="hvc-section" aria-label="Hold versus close consequences">
        <h3 className="hvc-title">
          Hold vs Close
          <span className="hvc-note"> · independent forward consequences · not a recommendation</span>
        </h3>
        <div className="hvc-loading">Assembling evidence…</div>
      </section>
    );
  }

  return (
    <section className="hvc-section" aria-label="Hold versus close consequences">
      <h3 className="hvc-title">
        Hold vs Close
        <span className="hvc-note"> · independent forward consequences · not a recommendation</span>
      </h3>
      {renderRefusalBanner(pair)}
      <div className="hvc-grid">
        <AlternativeColumn title="HOLD" result={pair.hold} />
        <AlternativeColumn title="CLOSE" result={pair.close} />
      </div>
      <HistoricalContextBlock result={pair.hold} />
    </section>
  );
}

// --- Refusal banner (§14a / fail-closed) ---

function renderRefusalBanner(pair: EvaluatedPair) {
  // Both alternatives share the same refusal cause in V1 (the evidence gate is
  // per-obligation), so surface the HOLD result's refusal as the banner.
  const r = pair.hold;
  if (r.kind !== "refused") return null;
  // Distinct, cause-specific labels (Codex #7) — do NOT collapse every refusal to
  // "backend inadmissible".
  const label = REFUSAL_LABELS[r.reason] ?? "Comparison refused";
  return (
    <div className="hvc-refusal" role="status">
      <span className="hvc-refusal-label">{label}</span>
      <span className="hvc-refusal-note">{r.note}</span>
    </div>
  );
}

const REFUSAL_LABELS: Record<string, string> = {
  "lifecycle-state-ambiguous": "Lifecycle state ambiguous — comparison refused",
  "authority-pending": "Session authority pending — comparison refused",
  "backend-inadmissible": "Chain not admissible this session — comparison refused",
  "missing-evidence": "No chain evidence for this expiration — comparison refused",
  "cache-unusable": "Chain evidence not currently usable — comparison refused",
};

// --- Alternative column ---

function AlternativeColumn({ title, result }: { title: string; result: ConsequenceResult }) {
  if (result.kind === "refused") {
    return (
      <div className="hvc-alt hvc-alt-refused">
        <div className="hvc-alt-title">{title}</div>
        <div className="hvc-unavailable">Refused — see note above.</div>
      </div>
    );
  }
  return (
    <div className="hvc-alt">
      <div className="hvc-alt-title">{title}</div>
      {result.close && <CloseColumn facts={result.close} />}
      {result.hold && <HoldColumn facts={result.hold} />}
    </div>
  );
}

function CloseColumn({ facts }: { facts: CloseFacts }) {
  return (
    <>
      {/* C1 + C2 — estimated close debit WITH quote geometry (never detached). */}
      <FactRow
        label="Est. close debit"
        fact={facts.estimatedCloseDebit}
        render={(v) => `${fmtMoney(v)}${chainAgeSuffix(facts.optionProvenance)}`}
        title={CLOSE_DEBIT_DISCLAIMER}
        extra={<QuoteGeometryLine geometry={facts.quoteGeometry} />}
      />
      {/* C4 — nominal encumbrance removed (never a cash claim). */}
      <Row label="Encumbrance removed" title={NOMINAL_ENCUMBRANCE_DISCLAIMER}>
        {facts.nominalEncumbranceRemoved.nominalDollars != null
          ? `${fmtMoney(facts.nominalEncumbranceRemoved.nominalDollars)} nominal (cash-secured)`
          : facts.nominalEncumbranceRemoved.shares != null
            ? `${facts.nominalEncumbranceRemoved.shares} shares un-encumbered (not cash)`
            : "—"}
      </Row>
      {/* C7 — moneyness. */}
      <MoneynessRow facts={facts.moneyness} />
      {/* C8 — exposure removed. */}
      <Row label="Exposure removed" title="Resolution exposure eliminated by closing.">
        {facts.exposureRemoved}
      </Row>
      {/* C5 — resulting state. */}
      <Row label="Resulting state" title="Holding label after CLOSE — never a cash-release claim.">
        {facts.resultingState}
      </Row>
      {/* C11 — execution uncertainty. */}
      <div className="hvc-caveat">{facts.executionUncertainty}</div>
      {/* C6 / C12 — DTE + next boundary. */}
      <Row label="Next boundary" title="Closing now is itself the decision.">
        now · {facts.currentDte}d to scheduled expiration
      </Row>
      {/* C9/C10 — optional greek/IV enrichment. */}
      <EnrichmentBlock enrichment={facts.enrichment} />
    </>
  );
}

function HoldColumn({ facts }: { facts: HoldFacts }) {
  return (
    <>
      {/* H1 — obligation remains. */}
      <Row label="Obligation" title="The existing short obligation continues unchanged.">
        {facts.obligationRemains}
      </Row>
      {/* H2 — nominal encumbrance remains. */}
      <Row label="Encumbrance remains" title={NOMINAL_ENCUMBRANCE_DISCLAIMER}>
        {facts.nominalEncumbranceRemains.nominalDollars != null
          ? `${fmtMoney(facts.nominalEncumbranceRemains.nominalDollars)} nominal (cash-secured)`
          : facts.nominalEncumbranceRemains.shares != null
            ? `${facts.nominalEncumbranceRemains.shares} shares remain encumbered`
            : "—"}
      </Row>
      {/* H3 — exposure duration. */}
      <Row label="Exposure duration" title={facts.nextScheduledBoundary.note}>
        {facts.exposureDurationDays}d to scheduled expiration (not guaranteed lockup)
      </Row>
      {/* H5 — moneyness. */}
      <MoneynessRow facts={facts.moneyness} />
      {/* H4 — resolution branches. */}
      <div className="hvc-branches" title="Mechanically possible resolutions. Early assignment is possible, not predicted.">
        {facts.resolutionBranches.map((b, i) => (
          <div key={i} className="hvc-branch">{b}</div>
        ))}
      </div>
      {/* H8/H9/H10 — outlay, exposure, optionality. */}
      <div className="hvc-caveat">{facts.noImmediateOutlay}</div>
      <Row label="Continued exposure" title="Exposure retained while holding.">{facts.continuedExposure}</Row>
      <Row label="Optionality" title="Optionality preserved by holding.">{facts.retainedOptionality}</Row>
      {/* H11 — next scheduled boundary. */}
      <Row label="Next boundary" title={facts.nextScheduledBoundary.note}>
        scheduled expiration {facts.nextScheduledBoundary.expiration} (early assignment possible, not predicted)
      </Row>
      {/* Assignment intent — carried, never inferred. */}
      <Row label="Assignment intent" title="Externally authoritative. Never inferred by the system.">
        {facts.assignmentIntent === "unknown" ? "unknown (not supplied)" : facts.assignmentIntent}
      </Row>
      {/* H6/H7 — optional greek/IV enrichment. */}
      <EnrichmentBlock enrichment={facts.enrichment} />
    </>
  );
}

// --- Historical context block (X1–X4) — explicitly labeled historical ---

function HistoricalContextBlock({ result }: { result: ConsequenceResult }) {
  if (result.kind !== "facts") return null;
  const h: HistoricalContext = result.historical;
  return (
    <details className="hvc-historical">
      <summary>Historical context (not forward value)</summary>
      <div className="hvc-historical-note">
        These describe what has happened so far. They are never inputs to the forward HOLD/CLOSE
        facts above, and there is no verdict.
      </div>
      <FactRow label="Opening credit" fact={h.openingCredit} render={fmtMoney} title="Gross opening credit when the obligation was opened." />
      <FactRow
        label="Est. gross mark-to-market"
        fact={h.estimatedGrossMarkToMarket}
        render={fmtMoney}
        title={X2_MARK_TO_MARKET_DISCLAIMER}
      />
      <FactRow
        label="Premium captured %"
        fact={h.premiumCapturedPercent}
        render={(v) => `${v.toFixed(1)}% (gross/gross)`}
        title="Premium captured % on a gross basis. Historical context, not a forward CLOSE signal."
      />
    </details>
  );
}

// --- Shared presentational primitives ---

/**
 * Render a NumericFact. Degraded / unavailable / not-applicable facts get a
 * distinct class so they CANNOT masquerade as a known consequence fact (§20.19).
 */
function FactRow({
  label,
  fact,
  render,
  title,
  extra,
}: {
  label: string;
  fact: NumericFact;
  render: (value: number) => string;
  title: string;
  extra?: React.ReactNode;
}) {
  const known = fact.precision === "known" && fact.value != null;
  const approx = fact.precision === "approximate" && fact.value != null;
  const display =
    fact.value == null
      ? fact.precision === "not-applicable"
        ? "n/a"
        : "unavailable"
      : `${render(fact.value)}${approx ? " (approx)" : ""}`;
  const cls = known ? "hvc-known" : approx ? "hvc-approx" : "hvc-unavailable";
  return (
    <div className="hvc-row" title={`${title}${fact.note ? ` — ${fact.note}` : ""}`}>
      <span className="hvc-lbl">{label}</span>
      <span className={`hvc-val ${cls}`}>{display}</span>
      {extra}
    </div>
  );
}

function Row({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="hvc-row" title={title}>
      <span className="hvc-lbl">{label}</span>
      <span className="hvc-val">{children}</span>
    </div>
  );
}

function MoneynessRow({ facts }: { facts: CloseFacts["moneyness"] }) {
  if (facts.precision === "unavailable" || facts.classification == null) {
    return (
      <div className="hvc-row" title="Moneyness unavailable — no admissible underlying observation.">
        <span className="hvc-lbl">Moneyness</span>
        <span className="hvc-val hvc-unavailable">unavailable</span>
      </div>
    );
  }
  const dist = facts.distanceDollars != null ? ` · $${facts.distanceDollars.toFixed(2)} from strike` : "";
  // Spot freshness is normally not authoritatively known (ADR-015 gap) → qualify
  // rather than present as unqualified current truth (Codex #4).
  const freshnessNote = facts.spotFreshnessKnown ? "" : " · spot freshness unknown";
  const cls = facts.spotFreshnessKnown ? "hvc-val" : "hvc-val hvc-approx";
  return (
    <div className="hvc-row" title="Moneyness from the current underlying observation; the underlying quote's own freshness is not authoritatively established (ADR-015).">
      <span className="hvc-lbl">Moneyness</span>
      <span className={cls}>{facts.classification}{dist}{freshnessNote}</span>
    </div>
  );
}

/** Quote geometry line — C1 must always carry the market shape behind it (§16.6). */
function QuoteGeometryLine({ geometry }: { geometry: QuoteGeometry }) {
  const bid = geometry.bid != null ? `$${geometry.bid.toFixed(2)}` : "—";
  const ask = geometry.ask != null ? `$${geometry.ask.toFixed(2)}` : "—";
  const spread =
    geometry.spreadPercent != null ? ` · spread ${geometry.spreadPercent.toFixed(0)}%` : "";
  const qualityNote =
    geometry.quality === "usable"
      ? ""
      : geometry.quality === "weak"
        ? " · one-sided/crossed — not usable for a midpoint"
        : geometry.quality === "indistinct-zero"
          ? " · zero indistinguishable from absent"
          : " · no quote";
  const cls = geometry.quality === "usable" ? "hvc-geom" : "hvc-geom hvc-geom-weak";
  return (
    <span className={cls}>
      bid {bid} / ask {ask}{spread}{qualityNote}
    </span>
  );
}

/**
 * Greek/IV enrichment block (optional, degradable; Codex #6). RAW semantics:
 *   - individual provider exact 0 stays `0`; null is unavailable;
 *   - the exact all-five-zero vector suppresses ONLY the five greeks (a provider
 *     placeholder), NOT the IV — a valid `midIv`/`smvVol` remains visible;
 *   - `midIv` and `smvVol` are shown DISTINCTLY, never collapsed;
 *   - rho is rendered;
 *   - raw `greeksUpdatedAt` is shown verbatim (no parse, no derived freshness);
 *   - greek age = the chain's acquisition age (no independent provenance).
 * No greek or IV value influences any action (there is no action in V1).
 */
function EnrichmentBlock({ enrichment }: { enrichment: GreekIvEnrichment | null }) {
  if (!enrichment) {
    return (
      <details className="hvc-greeks">
        <summary>Greeks / IV (context)</summary>
        <div className="hvc-unavailable">No greek/IV evidence for this contract.</div>
      </details>
    );
  }
  const g = enrichment.greeks;
  const ageMs = enrichment.chainAcquiredAtMs;
  const ageSuffix =
    ageMs != null
      ? chainAgeSuffix({ kind: "chain-acquired", acquiredAtMs: ageMs })
      : " (chain freshness unknown)";
  const greekVectorSuppressed = enrichment.allFiveZeroPlaceholder;
  return (
    <details className="hvc-greeks">
      <summary>Greeks / IV (context){ageSuffix}</summary>
      {greekVectorSuppressed ? (
        <div className="hvc-unavailable">
          Provider all-zero greek vector — treated as an unavailable placeholder (greeks only).
        </div>
      ) : (
        <div className="hvc-greek-grid">
          <GreekCell label="Δ" value={g.delta} note="Directional/local sensitivity. Not assignment probability." />
          <GreekCell label="Γ" value={g.gamma} note="Local change in delta. Not a CLOSE trigger." />
          <GreekCell label="Θ" value={g.theta} note="Local time-decay sensitivity. Not guaranteed daily income." />
          <GreekCell label="Vega" value={g.vega} note="Local volatility sensitivity." />
          <GreekCell label="ρ" value={g.rho} note="Local rate sensitivity." />
        </div>
      )}
      {/* IV is INDEPENDENT of the greek vector — visible even when greeks are the
          all-zero placeholder. midIv and smvVol are distinct measurements. */}
      <div className="hvc-greek-grid">
        <GreekCell label="Mid IV" value={g.midIv} note="Provider midpoint-inverted IV. Distinct from SMV; never collapsed." />
        <GreekCell label="SMV" value={g.smvVol} note="ORATS surface volatility. Distinct from Mid IV; never collapsed." />
      </div>
      {/* Raw provider greek/IV update time — verbatim, never parsed or normalized. */}
      <div className="hvc-greek-updated" title="Raw provider greek/IV update time (verbatim; zone-unspecified; not parsed).">
        greeks updated (raw): {g.greeksUpdatedAt != null && g.greeksUpdatedAt !== "" ? g.greeksUpdatedAt : "—"}
      </div>
    </details>
  );
}

function GreekCell({ label, value, note }: { label: string; value: number | null; note: string }) {
  // RAW semantics: a provider exact 0 is data (shown as 0), null is unavailable.
  const display = value == null ? "—" : value === 0 ? "0" : formatGreek(value);
  const cls = value == null ? "hvc-greek-val hvc-unavailable" : "hvc-greek-val";
  return (
    <div className="hvc-greek-cell" title={note}>
      <span className="hvc-greek-lbl">{label}</span>
      <span className={cls}>{display}</span>
    </div>
  );
}

// --- formatting helpers ---

function fmtMoney(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(0)}`;
}

/** Chain-acquisition age suffix for option-derived facts (honest chain age). */
function chainAgeSuffix(provenance: EvidenceProvenance): string {
  const age = formatAcquisitionAge(provenance, Date.now());
  return age === "—" ? " (chain freshness unknown)" : ` (chain acquired ${age} ago)`;
}
