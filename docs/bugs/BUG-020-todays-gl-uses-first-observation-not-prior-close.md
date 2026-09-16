# BUG-020 — "Today's G/L $/%" uses Wheelwright's first intraday observation as the baseline instead of the prior session close, producing broker-mismatched (often sign-inverted) daily G/L

- **Status:** Resolved
- **Severity:** S2 (operator-visible economic-correctness defect: values labeled "Today's gain/loss" materially disagree with the broker and can show the opposite sign)
- **Area:** Operator Console / Unencumbered Shares (per-row + totals) and DTE-ladder "Today's G/L"; Console CSV export; per-symbol quote/evidence path (`today-gl.ts`, `UnencumberedInventory.tsx`, `OperatorConsole.tsx`, backend quote normalization)
- **Provenance:** Discovered 2026-09-16 (Principal side-by-side comparison of the Operator Console against a real Fidelity `Portfolio-Positions-Sep-16-2026` export). Prior investigation report established root cause before this record was filed.

## Observed failure

On the Operator Console (Fidelity source), the Unencumbered Shares table's **Today's gain/loss $** and **Today's gain/loss %** did not match Fidelity's real-time daily position G/L. Several values were materially off and some had the **opposite sign**.

Sep. 16, 2026 comparison (real account evidence):

| Symbol | Wheelwright Today's G/L $ | Fidelity Today's G/L $ | Fidelity last / prior close |
|---|---:|---:|---|
| COPX | ≈ −$12 (−0.14%) | +$134 (+1.58%) | 85.93 / 84.59 |
| GDXJ | ≈ −$25 (−0.21%) | +$113 (+0.93%) | 121.44 / 120.31 |
| SMH  | ≈ −$98 (−0.18%) | +$891 (+1.64%) | 551.02 / 542.11 |
| SPYI | ≈ $0 (−0.00%)   | +$13.18 (+0.35%) | 52.855 / 52.666 (qty 69.829) |
| URA  | ≈ +$4 (+0.10%)  | +$10 (+0.23%)   | 41.87 / 41.77 |

COPX/GDXJ/SMH show a sign reversal; SMH is off by nearly $1,000. This is **not** acceptable quote-timing drift.

The same defect is visible on the DTE ladder's "Today's G/L" for the same underlyings (e.g. Fidelity DBO last-price-change −$1.00 vs ladder `+$0.05`; UNG −$0.105 vs ladder `+$0.02`).

## Intended semantics violated

"Today's gain/loss" is a **broker-comparison daily figure**. The operator reads Wheelwright's column next to Fidelity's and expects them to mean the same thing. The Principal-stated target semantics are:

```
Today's G/L $ = (current price − previous close) × quantity
Today's G/L % = (current price − previous close) / previous close × 100
```
For Unencumbered Shares, quantity is the displayed free-share quantity (fractional supported).

The label "Today's gain/loss" promises previous-close semantics; the implementation delivered a different metric under that label.

## Evidence

Root cause (traced, current `main` @ `1156178`): the shared derivation in
`options-prototype/src/operator-console/today-gl.ts` computes

```
todayΔ$/share = latest.price − firstObservationOfLatestDay.price
```

where `firstObservationOfLatestDay` is the **earliest `spot_history` row Wheelwright happened to record on the latest observed UTC day** — not the prior session official close. Consumers:

- `UnencumberedInventory.tsx` per-row: `(latest − firstOfDay) × freeShares`, plus dollar-weighted totals.
- `UnencumberedInventory.tsx` `buildUnencumberedCsvRows`: identical derivation (CSV inherits the defect; it is not a separate calculation).
- `OperatorConsole.tsx` DTE-ladder CSV: same `computeTodayUnderlyingChange/Percent`.

The baseline is supplied by `/api/evidence/history` (`spot_history`, `{price, observedAt}` only). The acquisition worker's first same-day sample of a symbol lands well after 09:30 ET, so the calculation (a) **excludes the open gap** — the bulk of most days' move — and (b) **inverts sign** whenever a symbol is up vs prior close but has drifted down since Wheelwright's first sample (COPX/GDXJ), or vice-versa.

Provider evidence sufficiency: Tradier's `/markets/quotes` payload **already carries `prevclose`** (proven by `TradierAdapter.getIndexQuote`, which reads `extractDouble(body, "prevclose")` for the Markets card). The per-symbol quote path (`normalizeQuote`) discarded it, retaining only `last`/`close` + `description`. So Fidelity-equivalent daily G/L was computable from evidence already on the wire; the pipeline dropped it.

Reconstruction of the observed rows (baseline = first-obs-of-day ≈ last − displayed move):

- COPX: prior close 84.59, WW baseline ≈ 86.01 → up vs prior close but down since first sample → sign flip.
- SMH: prior close 542.11; the +$8.91 open gap excluded, only a small intraday down-drift captured; high share price magnifies to −$98 vs +$891.
- SPYI: gain occurred before WW's first sample → ≈ $0.

## Consequence

An operator comparing Wheelwright to Fidelity sees a different daily economic reality — wrong magnitude and sometimes the wrong direction — on a field explicitly labeled to match the broker. This undermines trust in the Unencumbered Shares region (otherwise validated against the real account) and the ladder. S2.

## Diagnosis / root cause

Wrong baseline. "Today's" reference was Wheelwright's first intraday observation of the latest UTC day rather than the prior trading session's close. The provider already supplies `prevclose`; the per-symbol evidence path discarded it, so no truthful prior-close baseline reached the consumer. Secondary: the "day" boundary was UTC, not market session.

## Scope / non-goals

**In scope:** make "Today's G/L $/%" mean `(price − previousClose) × qty` and `(price − previousClose)/previousClose × 100` for Unencumbered Shares (UI + CSV, per-row + totals) and the DTE ladder's underlying-move "Today's G/L"; thread an additive `previousClose` from the provider through to the frontend quote observation.

**Non-goals:** no redesign of Unencumbered Shares, DTE ladder, portfolio ingestion, capital-state architecture, PL-ELIG, CSV structure, or quote infrastructure. Free-share quantity, free-lot derivation, odd-lot visibility, encumbrance classification, current value, average cost, total G/L, and freshness are correct and must not change. No new daily-G/L estimation model; no first-observation fallback under the "Today's G/L" label. Not an options-accounting project — the ladder figure remains the underlying's daily move (market context), now measured correctly vs prior close.

## Acceptance criteria

For the same Fidelity positions at approximately the same market moment, Wheelwright and Fidelity "Today's G/L" match within normal quote-timing / display-rounding tolerance:

- COPX ≈ +$134 (positive; guards the sign reversal).
- GDXJ ≈ +$113.
- SMH ≈ +$891 (guards open-gap exclusion).
- SPYI ≈ +$13.18 with fractional quantity 69.829 handled correctly.
- URA ≈ +$10.
- `$` and `%` are sign-consistent and mutually coherent.
- When `previousClose` is unavailable for a symbol, the cell renders unavailable (em dash) — never a fabricated zero or a wrong-baseline fallback.
- UI and CSV render the same value from one canonical derivation.

## Remediation history

Resolved 2026-09-16. Additive, non-breaking `previousClose` threaded from Tradier `prevclose` → `MarketChain.Underlying` → `marshalChain` stored blob → `SqliteEvidenceStore` read-back → `/api/evidence/quotes` `observation.previousClose` → frontend `QuoteObservation.previousClose`. Canonical `computeTodayGlFromPrevClose` derivation in `today-gl.ts` consumed by the Unencumbered Shares table, its totals, the CSV builder, and the DTE-ladder Today's G/L. No DB migration (rides in the existing chain blob). Contract documented as additive in `docs/contracts/evidence-snapshot-v1.md`. Commit: see journal / INDEX.

## Verification

Backend JUnit + frontend Vitest regression tests added: provider `prevclose` extraction (absence → null, not 0); snapshot/quotes propagation; frontend `previousClose` parsing; `today-gl` prior-close `$`/`%` with sign-reversal (COPX), large-gap (SMH), fractional (SPYI) fixtures; `previousClose`-unavailable → dash; UI/CSV agreement.

- **Full backend suite:** green (JUnit 5).
- **Full frontend suite:** 1589 passing; the sole failure is the pre-existing, unrelated velvet-rope date-drift inline snapshot (a `now`-relative expiration date), documented in the journal and independent of this change. `tsc --noEmit` clean.
- **Live upstream authority (2026-09-16, market open):** direct Tradier production `GET /markets/quotes` returned `prevclose` matching Fidelity's prior close **exactly** for all five rows — COPX 84.59, GDXJ 120.31, SMH 542.11, SPYI 52.6662, URA 41.77 (each equals Fidelity `last − Last-price-change`). This proves the authority the fix consumes is correct against the broker. Computing `(last − prevclose) × qty` at the (later) live moment reproduces broker-parity sign and magnitude (e.g. SMH +$924 vs Fidelity +$891 at 11:22 ET; COPX positive, not the defect's negative). Residual differences are normal real-time-vs-snapshot quote drift, not the semantic defect.
- **Not re-verified against the live appliance's own `/api/evidence/quotes`:** the running backend predates this build and its stored chain blobs lack `previousClose`; a restart + one acquisition cycle per symbol is required before the live Console surfaces the field. Not performed to avoid disrupting the running single acquisition authority without explicit authorization.

## Related

- Prior "first observation of day" semantic was introduced with the Unencumbered Shares column-expansion commits (`5c01175`, `9a39185`, `338750f`, `d1de278`, `8020178`) and the shared `today-gl.ts` used by the ladder. This record supersedes that baseline for the "Today's G/L" label.
- `docs/contracts/evidence-snapshot-v1.md` — additive `underlying.previousClose` field.
- Not a `PL-*` item (defect, not a capability).
