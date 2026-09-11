# BUG-009 — Production Economic Activity: capital label text diverges from backing capital amount; expired chapters carry non-null capital amount with null label

- **Status:** Open
- **Severity:** Not established
- **Area:** Production (frontend Economic Activity ledger / presentation model)
- **Provenance:** GitHub Issue #15 (https://github.com/brooksbol/options-prototype/issues/15) — historical, non-authoritative. Created 2026-09-05. Labels: `defect`, `area:production`.

> **Preservation note (2026-09-11 migration):** The tail of the historical Issue body ("## Interpretation" section) is **corrupted in the source record** — it contains repeated/garbled text that does not resolve into a coherent sentence. Per Principal migration ruling, the surviving historical text is preserved verbatim below and the corruption is marked explicitly; meaning has **not** been reconstructed or repaired.

## Observed failure

In the Production **Economic Activity** ledger, the displayed capital **label** and the backing capital **amount** (frontend `EpisodeChapter.capitalLabel` vs `capitalAmount`) are inconsistent, and some expired chapters carry a non-null backing amount with no displayed label.

Exposed by the PL-PROD-EXPORT-01 Production Evidence CSV, which classifies claims as `DISPLAYED_CLAIM` vs `PRESENTATION_BACKING_VALUE` and thereby made the divergence visible.

## Intended semantics violated

The operator-visible capital presentation should not contradict or obscure its backing value. In the observed expired chapters, a non-null backing amount existed with no corresponding displayed label, producing an inconsistent presentation state.

## Evidence — Observed

- **URA**: `capital_label` displayed `$4,579.00 deployed` while backing `capital_amount` = `4600`.
- **UNG**: displayed `$1,070.00 deployed` while backing numeric value = `1100`.
- **Expired COPX / GDX**: `capital_label = NULL` (nothing displayed) but `capital_amount` is non-null.

## Consequence

Displayed capital label text does not match the numeric backing value, and expired-chapter capital backing values are populated without a corresponding operator-visible label. (Severity was not established in the historical record.)

## Diagnosis / root cause

Not established. The divergence between displayed label and backing amount, and the label-less non-null expired-chapter amounts, are frontend presentation/model inconsistencies surfaced by the Production Evidence CSV.

## Interpretation (corrupted source text preserved verbatim)

> **Corrupted source text (preserved verbatim; do not treat as coherent):**
>
> "Displayed rounded/derived label text does not match the numeric backing value, and expired-chapter capital backing values are populated without a corresponding operator-visible label. These are frontend presentation/model inconsistDisplayed rounded/derived label text does not match the numeric backing value, and expired-chapter capital backing values are populated without a corresponding operator-visible label. These are frontend presentation/model inconsistDisplayed rounded/derived label text does not mtes to the Production FE/BE semantic-decoupling follow-on (PL-PROD-EXPORT-01), but is a concrete, independently-fixable presentation defect."
>
> The above is the literal surviving text of the historical Interpretation section. It is garbled (repeated fragments, truncated words "inconsist", "does not mtes to"). The recoverable intent appears to be: displayed rounded/derived label text does not match the numeric backing value, and expired-chapter backing values lack a visible label; these are frontend presentation/model inconsistencies relating to the Production FE/BE semantic-decoupling follow-on (`PL-PROD-EXPORT-01`), but constitute a concrete, independently-fixable presentation defect. **This interpretation is noted as uncertain and is not authoritative; the corruption prevents confident reconstruction.**

## Scope / non-goals

Filing does not authorize remediation. A concrete, independently-fixable presentation defect (per the recoverable-but-uncertain intent above).

## Acceptance criteria

Not established in the historical record.

## Remediation history

None.

## Verification

None.

## Related

- Production FE/BE semantic-decoupling follow-on: `PL-PROD-EXPORT-01` (context only).
