# Workstream B — Knowledge Reconstruction Survey (2026-10-18)

**Classification:** internal, redacted, non-normative survey evidence. **Not authority. Not for publication.** The basis for this survey is ADR-023 D4/D5 (`docs/07c-adrs.md`). Nothing here ratifies, supersedes or migrates anything.

**Durability:** this directory is **UNTRACKED and uncommitted** in the local working tree at `~/kiro/options`, so it is not durable GitHub memory. Persisting it is a pending Principal decision (decision A in `docs/discovery/4am-*workstream-b-completion-report-checkpoint-2026-10-18.md`, main `ef5c54c`). That decision follows a review of this report and of `raw/prior-ledgers/`. The automated redaction scan found no identifier matches.

**Baseline:** surveys ran against main `bef03dd`. Main advanced to `d03d8d1`, which adds one discovery snapshot; no surveyed source changed except that new file.

## Contents

| Path | What it is |
|---|---|
| `REPORT.md` | Final report: 12 sections, findings, challenges, remaining work |
| `coverage-ledger.tsv` | Coverage ledger by source segment. It covers 5,004 heading segments and 411 files. Each segment is labelled with its best depth across surveyors: FULL, PARTIAL, INDEXED, SKIPPED or UNSURVEYED. Git months are appended. |
| `catalog/principal-knowledge-review-catalog.{jsonl,md}` | Principal Knowledge Review Catalog. It has 784 rows: 269 read by surveyors and 515 mechanical marker-scan lines. |
| `catalog/decision-inventory.{jsonl,md}` | Retrospective decision candidates: 583 in total, 534 of them read by surveyors |
| `catalog/knowledge-entries-all.jsonl` | Every typed entry from every surveyor (3,478) |
| `domain-semantics.md` | Accepted and candidate semantics, grouped by term |
| `precedents.md` | Product precedents and specimens |
| `implementation-witnesses.md`, `raw/surveyors/SWIT/witnesses.md` | Implementation and operational witnesses, each tied to a date |
| `contradictions.md` | Contradictions, reversals, falsified assumptions and rejected designs |
| `meta-standard-regression-cases.md` | 19 real specimens for falsifying Codex A8 |
| `kotusev-v3-name-verification.md` | Independent transcription of the 34 artifact titles in the canonical PDF |
| `BUG-043-DRAFT-trading-calendar-2026-only.md` | Draft defect record. **Not filed.** Filing is pending Principal decision B. |
| `raw/SURVEYOR-PROTOCOL.md` | Extraction schema and protection rules |
| `raw/segments-base.tsv` | Mechanical heading segmentation |
| `raw/surveyors/<ID>/` | Per-surveyor `entries.jsonl`, `decisions.jsonl`, `coverage.tsv` and `summary.md` |
| `raw/prior-ledgers/` | Seven earlier-session surveyor ledgers, regex-redacted. The eighth, the code ledger, was lost and is replaced by SWIT. |

## Method

1. Run 22 surveyors that each read their sources, using the protocol schema.
2. Write the code and installed-system witnesses (SWIT) and the git-history ledger (SGIT) directly.
3. Mark lines in the remaining folders with a mechanical scan (SDB, PARTIAL depth; it does not interpret anything). The folders are design, cli, contracts, bugs, reviews, experiments, discovery, velvet-rope, universe and reference-data.
4. Merge everything with a script.
5. Apply the protection pass:
   - regex redaction of account numbers, brokerage IDs, emails, UUIDs, serials, personal names and home paths;
   - every dollar amount ≥ $1,000 replaced with `[amount-redacted]`.

   The scan after redaction found zero matches for the identifier patterns.

The surveyor IDs are S61A–D, S81A–B, SD47, SJ1A–C, SJ2, SJ5, SPL1–3, SRC1–2, SN0–2, SFND1–2, SDB, SGIT and SWIT.

Catalog rows are **not deduplicated** across surveyors. The same statement can appear several times, once from each source that carries it. That is deliberate: it preserves the variants.
