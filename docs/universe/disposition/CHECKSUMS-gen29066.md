# Generation 29066 Universe Disposition — Provenance & Checksums

**Status:** Canonical Project / Operational State (Category C) — frozen audit record
**Evidence generation:** `29066`
**Predicate version:** `gen29066-v1`
**Effective date:** 2026-09-14
**Decision run evaluated:** ~2026-09-14T17:13:55Z
**Repository SYNC SHA at persistence:** `0a06bd7754be7b412de288cc7b6c2a2fcffbe260`

This record ties the persisted disposition artifacts to the frozen generation-29066
analysis. The frozen analytical artifact is **evidence, not implementation**. The cohorts
were **not** recomputed, refreshed, substituted, or regenerated during persistence.

## Source artifacts (frozen, external to the repository at persistence time)

The four artifacts below were supplied by the Principal from `~/Downloads`. The Markdown
report is the human-readable audit record; the three CSV exports are the BUG-016 Decision
exports the report was frozen from and reconciled against.

| Artifact | Role | SHA-256 |
|----------|------|---------|
| `wheelwright-universe-disposition-gen29066.md` | Human-readable disposition report (frozen) | `eb540354ef87f794d0f7c5052cb84dd4cb7ac2e5e9c7b4dd78713d5700eda49e` |
| `wheelwright-funnel-csp-2026-09-14T17-13-55-113Z-csp-gen29066-2026-09-14-1789406035113-0.csv` | CSP Decision-funnel membership export | `154740c02dc61d350ddcd867f84d7d8b176f912d26f4bf5355cf5942850b2f6a` |
| `wheelwright-funnel-buy_write-2026-09-14T17-13-55-274Z-buy_write-gen29066-2026-09-14-1789406035274-2.csv` | Buy-Write Decision-funnel membership export | `398b7fc80a4fdd63dc972a1ab921e1a94108903487e9eba310dee541932b385a` |
| `wheelwright-funnel-covered_call-2026-09-14T17-13-55-114Z-covered_call-gen29066-2026-09-14-1789406035114-1.csv` | Covered-Call Decision-funnel membership export | `0e1af5a8e22860e74798f63e1aefd64bd9b509c12e1474a266c3de42ce7decab` |

## Persisted repository artifacts

| Path | Role |
|------|------|
| `docs/universe/disposition/wheelwright-universe-disposition-gen29066.md` | Byte-identical copy of the frozen human-readable report (SHA-256 matches source above) |
| `data/universe/disposition-gen29066.csv` | Machine-readable disposition artifact (authoritative for implementation). One row per symbol with full provenance. Runtime code consumes this CSV — it does **not** parse the Markdown report. |
| `docs/universe/disposition/CHECKSUMS-gen29066.md` | This provenance manifest |

## Report identity carried by the machine-readable artifact

Every row of `data/universe/disposition-gen29066.csv` carries the same generation-29066
identity as the Markdown report:

- `evidence_generation = 29066`
- `report_identity = wheelwright-universe-disposition-gen29066.md`
- `report_sha256 = eb540354ef87f794d0f7c5052cb84dd4cb7ac2e5e9c7b4dd78713d5700eda49e`
- `predicate_version = gen29066-v1`
- `effective_date = 2026-09-14`

## Independent validation (from the machine-readable CSV alone)

| Disposition | Count |
|-------------|------:|
| `CANONICAL_REMOVE` | 340 |
| `WEEKLY_REFRESH` | 487 |
| `NORMAL_PROTECTED` | 84 |
| Total distinct symbols | 911 |
| Deduplicated union removed from routine servicing (`CANONICAL_REMOVE` ∪ `WEEKLY_REFRESH`) | 827 |

No duplicate symbol within a cohort. No symbol in more than one cohort.

## Provenance reconciliation against the source CSVs

Reconciled from the CSP and Buy-Write exports (both `evidence_generation = 29066`):

- CSP governed denominator: 1,306 unique symbols
- Buy-Write governed denominator: 1,306 unique symbols
- Current Zero OI union (CSP `hardNoZeroOI` ∪ BW `hardNoZeroOI`): 592
- Zero OI with no current Actionable/Edge/Wait in either strategy: 571
- 571 = 487 `WEEKLY_REFRESH` + 84 `NORMAL_PROTECTED`
- All 487 `WEEKLY_REFRESH` symbols are in the Zero-OI union with zero current useful outcomes
- All 84 `NORMAL_PROTECTED` symbols are in the Zero-OI / no-current-useful domain
- All 340 `CANONICAL_REMOVE` symbols are drawn from the 351-symbol current `incomplete`
  (non-optionable / no evaluable surfaces) domain

The historical-usefulness partition that separates the 84 protected symbols from the 487
weekly symbols is **not** reproducible from the funnel CSVs alone — it required the retained
opportunity history, exactly as the report's reconciliation states. This split is therefore
consumed from the frozen report, not recomputed.

## Predicate wording (do not broaden)

- `WEEKLY_REFRESH`: *Current Zero OI in CSP or buy-write AND no current Actionable, Edge, or
  Wait in either strategy AND no retained historical Actionable, Edge, or Wait in either
  strategy.* Wide Spread alone and No Delta Match alone do **not** change cadence.
- `NORMAL_PROTECTED`: Current Zero OI / no current useful outcome, but demonstrated historical
  Actionable/Edge/Wait usefulness — retained at normal cadence.
- `CANONICAL_REMOVE`: Current incomplete / non-optionable cohort with no retained
  `HAS_EVALUABLE_SURFACES` history.
