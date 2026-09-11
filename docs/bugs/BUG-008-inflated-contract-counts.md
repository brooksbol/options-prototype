# BUG-008 — Production Economic Activity presents inflated contract counts (episode-construction double counting)

- **Status:** Open
- **Severity:** Not established
- **Area:** Production (frontend Economic Activity ledger / episode construction)
- **Provenance:** GitHub Issue #14 (https://github.com/brooksbol/options-prototype/issues/14) — historical, non-authoritative. Created 2026-09-05. Labels: `defect`, `area:production`.

> **Preservation note (2026-09-11 migration):** The tail of the historical Issue body ("## Scope" section) is **corrupted in the source record** — it contains repeated/garbled text that does not resolve into a coherent sentence. Per Principal migration ruling, the surviving historical text is preserved verbatim below and the corruption is marked explicitly; meaning has **not** been reconstructed or repaired.

## Observed failure

The Production **Economic Activity** ledger (frontend `EpisodeChapter` view-model, `episode-derivation.ts`) presents contract counts higher than the authoritative Fidelity evidence.

Exposed by the PL-PROD-EXPORT-01 Production Evidence CSV (which faithfully serialized the presented view-model values against authoritative backend state).

## Intended semantics violated

Presented contract counts must match the authoritative Fidelity evidence. The ledger presents inflated counts.

## Evidence — Observed (presented vs authoritative)

- BNO C51: **2 presented** vs authoritative **1 contract / 100 shares**
- BNO C54: **3 presented** vs authoritative **2 contracts / 200 shares**
- EWY: **2 presented** vs authoritative **1 contract**
- GDXJ: **2 presented** vs authoritative **1 contract**

## Consequence

Operator-visible contract counts in the Economic Activity ledger are inflated relative to authoritative evidence. (Severity was not established in the historical record.)

## Diagnosis / root cause (likely cause, historical)

Episode-construction in `buildEpisodeMap` / STO-fill accumulation appears to double count contracts (e.g. multiple fills or open/resolve events inflating `contracts`).

## Scope / non-goals

This is a **frontend/presentation** defect in episode construction, not a CSV serializer defect and not a backend assessment defect.

> **Corrupted source text (preserved verbatim; do not treat as coherent):**
>
> "The CSV export intentionally does NOT correct it - The CSV export intentionally does NOT correct it - The CSV export intentionally does NOT correct it - The CSV export intentionally does Nc-decoupling follow-on (PL-PROD-EXPORT-01) but is a concrete, independently-fixable defect."
>
> The above is the literal surviving text of the historical Scope section. It is garbled (repeated fragments and a truncated word "Nc-decoupling"). The recoverable intent appears to be: the CSV export intentionally does not correct the inflated counts, and this relates to the Production FE/BE semantic-decoupling follow-on (`PL-PROD-EXPORT-01`) but is a concrete, independently-fixable defect. **This interpretation is noted as uncertain and is not authoritative; the corruption prevents confident reconstruction.**

Filing does not authorize remediation.

## Acceptance criteria

Not established in the historical record.

## Remediation history

None.

## Verification

None.

## Related

- Production FE/BE semantic-decoupling follow-on: `PL-PROD-EXPORT-01` (context only).
