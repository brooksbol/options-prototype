# Project Parking Lot — Continuation 4

> This file is a physical continuation of `docs/parking-lot.md`, `docs/parking-lot-2.md`, and `docs/parking-lot-3.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 6, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace.

- All stable IDs are globally unique across the complete `docs/parking-lot*.md` sequence.
- New material ideas enter through the standard pipeline in `docs/foundations/idea-intake-reconciliation.md`.
- New intake is recorded in the latest continuation after checking the complete parking-lot sequence for an existing concept.
- Row order is not priority.
- Merge, split, supersession, promotion, rejection, and resolution preserve explicit disposition/mapping.
- A Principal decision to work on an item next changes sequencing, not its reconciliation/design state.

---

## Active Items — Architecture / Engineering Method

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-ARCH-FITNESS-01` | Architectural Fitness Functions / Executable Architecture Invariants | **Durable discovery; intake only, not yet reconciled or authorized.** Wheelwright already has tests and structural checks that behave like architectural fitness functions in the evolutionary-architecture sense, but they emerged incidentally rather than as a deliberately classified or governed capability. The useful distinction is between ordinary behavioral regression tests, tests that explicitly protect an invariant, and true architectural fitness functions that protect an architectural property across future implementations. Candidate properties already visible in Wheelwright include engineering-boundary dependency rules, evidence/recommendation separation, ADR-015 provenance-authority preservation, ADR-016 association-authority preservation, and other mechanically observable architecture constraints. Working hypothesis: when an architectural decision creates a property whose violation can be detected mechanically, Wheelwright should **consider** whether that property deserves an executable fitness function; this is not a requirement that every ADR be mechanically tested. A lightweight maturity model may be useful: prose-only where mechanical enforcement is inappropriate; incidental regression coverage; explicitly named invariant tests; structural tooling such as ArchUnit/dependency/schema/static rules; and only where evidence warrants it, continuous quantitative fitness functions with thresholds/trends. This fits the existing deterministic ratchet: **probabilistic reasoning discovers architectural truth → durable authority establishes it → deterministic checks protect the mechanically observable portion.** The concern is avoiding both under-protection and a heavyweight fitness-function program or pseudo-tests that create governance theater. **Unresolved:** whether existing tests should merely be classified/reviewed, whether selected ADR/invariant properties should gain explicit executable protection, what assurance level is proportionate by change class, and whether repeated evidence eventually justifies a more formal program. **Not authorized:** no new governance artifact, testing framework, broad test rewrite, ArchUnit expansion, Sonar policy change, or implementation work. | `docs/foundations/technology-quality-constitution-v1.md`; `docs/technology-quality-program-v1.md`; `docs/07c-adrs.md` (especially ADR-015/ADR-016); existing architecture/invariant tests and structural checks; multi-actor deterministic-ratchet practice |

---

## Intake Note — `PL-ARCH-FITNESS-01`

**Trigger:** During the Production Disposition Truth implementation, the Principal observed that a substantial portion of Wheelwright's existing testing could already be considered architectural fitness functions, but that this protection is incidental rather than rigorous, and questioned whether additional rigor would be valuable.

**Why it may matter:** Wheelwright increasingly converts probabilistically discovered truths into durable architectural authority and deterministic invariants. Explicitly recognizing the subset that can be mechanically protected may reduce repeated reasoning, architectural drift, and future change risk without requiring a heavyweight architecture-compliance regime.

**Related existing concepts:** Technology Quality Constitution / Program; ADR and invariant discipline; ArchUnit-like structural enforcement; SCA as a quality evidence layer; multi-actor adversarial review; the deterministic ratchet from probabilistic discovery to executable evidence.

**Current disposition:** `INTAKE`. Repository search found no existing parking-lot identity specifically owning architectural fitness functions or executable architecture-invariant classification. Strategic and architectural reconciliation remain required before any promotion, decomposition, or implementation.

**Authorization boundary:** Preserve the idea. Do not interrupt the active Production Disposition Truth slice and do not create a formal fitness-function program merely because the concept is durable.

---

## Active Items — Product / Testing Instrumentation

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-PROD-EXPORT-01` | Production Evidence Export (machine-readable "what Production believed") | **Durable discovery + candidate design; intake, NOT authorized for implementation.** Need (Principal, established): a machine-readable artifact that lets another actor faithfully understand and test the economic truth Production reports against real Fidelity evidence, without relying on screenshots and manual correlation. Arose from the Fidelity/Production investigation and the merged Production Disposition Truth slice (ADR-016). The working phrase "Production whole-page CSV" is **not** a ratified design; "whole page," one-CSV, backend-vs-frontend authorship, and any candidate schema are all open design questions. **Central design tension (discovered, must be resolved before implementation):** Production authority is *split across two layers*. The backend `ProductionResponse` (`POST /api/production/assess`) is the single authoritative source of "what Production believed" — period aggregates (`knownCashProduction`, `unresolvedPotentialProduction`, `realizedCapitalErosion`, `netStrategyResult`), `productionBreakdown`, reconciliation status/issues, the per-transaction audit trail (`transactions[]` with `EconomicComponent` decomposition), and the per-disposition realized economics (`dispositionResults[]`: `dispositionFingerprint`, `contractActivityKey`, `netSaleProceeds`, `attributableAcquisitionCash`, `realizedAppreciation`/`realizedErosion`, `state` ∈ RESOLVED/PARTIAL/UNRESOLVED, `provenance`). BUT the operator-visible page adds a large body of **frontend-derived interpretation with no backend equivalent**: episode chapters/labels, capital encumbered/released (strike notional), buy-write "if called" conditionals, **post-assignment discretionary-sale economics** (`buildDispositionChapter`, `shares_sold_direct` — a genuine second economic interpretation the backend does not produce), `openPremium` derived from raw STO rows, structural-income episode rows, and the entire forecast/capacity/in-flight surface (planning estimates, not accounting). Therefore "export what the operator saw" and "export authoritative Production semantic state" are **not the same set of values**, and blindly exporting the rendered page would (a) omit nothing but (b) elevate frontend-derived interpretation to apparent authority — an ADR-015/ADR-016 violation (transformation must not manufacture semantic authority). **Working candidate design (for adversarial review, not ratified):** V1 = a *Production semantic-state export* sourced **from the backend `ProductionResponse`** (the authoritative belief), authored **backend-side** so no value is re-interpreted in transport, emitted as **CSV with an explicit `record_type` discriminator column** (heterogeneous typed rows: `assessment_meta`, `aggregate`, `production_source`, `reconciliation_issue`, `erosion_event`, `assessed_transaction`, `economic_component`, `disposition_result`) plus a leading `assessment context` record (period, periodDescription, reconciliationStatus, assessment timestamp, source-evidence identification). Frontend-only interpretation (episode chapters, capital encumbered/released, post-assignment economics, forecast) is **deliberately excluded** from V1, or included only in a clearly separated, explicitly non-authoritative section — that inclusion decision is the single most important open question. **Semantic-authority discipline required:** preserve the accepted distinctions verbatim — `dispositionFingerprint` (non-unique trace/dedup, never identity), `contractActivityKey` (association target, not durable lifecycle/episode identity), assessment-local occurrence identity (never exported as durable identity), net sale proceeds vs attributable acquisition cash ("basis for what purpose?"), realized appreciation/erosion, BASIS_UNKNOWN/PARTIAL/UNRESOLVED, provenance-as-text, and run/processing-date vs economic-as-of vs settlement date (only run date is currently carried; do not manufacture the others). Uncertainty (PARTIAL/UNRESOLVED/CHARACTER_UNCERTAIN) must remain explicit in the export, never flattened. **Not authorized:** no download button, endpoint, serializer, DTO, frontend export code, implementation tests, commit, or push; no generalized export/reporting subsystem; no durable lifecycle identity or tax-lot semantics. **Unresolved:** whether frontend-derived economics belong in the artifact at all; whether one CSV with record types vs one-row-per-operator-claim vs a small typed bundle is correct; exact V1 record set; how much source-evidence identification is needed to make the artifact self-describing; deterministic tests that would prove V1 is trustworthy. **Related (cross-link, not double-booked):** GitHub issue #4 (export realized lifecycle / "what changed" history — a *product* export, distinct from this *testing/forensic* artifact); `PL-EXEC-01` (post-execution reconciliation); `PL-PROD-VALUE` (Portfolio Capital accounting). **Design must survive Codex adversarial review before any implementation authorization.** | `evidence-service-java/.../production/ProductionResponse.java` (candidate authoritative payload); `ProductionAssessor.java`, `DispositionResult.java` (semantic owners); `options-prototype/src/production/episode-derivation.ts`, `CurrentMonthView.tsx` (frontend-derived interpretation boundary); `docs/07c-adrs.md` ADR-015/ADR-016; GitHub #4; `PL-EXEC-01`; `PL-PROD-VALUE` |

---

## Intake Note — `PL-PROD-EXPORT-01`

**Trigger:** The live Fidelity / Production investigation and the merged Production Disposition Truth slice (ADR-016) established an operational/testing need: a machine-readable representation of what Production believed at an assessment, so economic truth can be tested against real evidence and reviewed actor-to-actor without screenshots or manual correlation.

**Why it crossed the durability threshold:** "We now need this artifact to test Production economic truth against real operational evidence reliably." Screenshots are adequate for operator-visible evidence but poor for systematic comparison, regression investigation, forensic analysis, and multi-actor review.

**Why intake, not implementation:** The need is established; the design is not. Discovery found a central architectural tension — Production authority is split between the backend authoritative `ProductionResponse` and a substantial frontend-derived interpretation layer (episode ledger, post-assignment economics, forecast). Resolving "export what the operator saw" vs "export authoritative Production semantic state" is a design decision with ADR-015/ADR-016 consequences (an export must not grant frontend-derived interpretation apparent authority). This must be settled and adversarially reviewed before code.

**Current disposition:** `INTAKE`. Repository search of the complete `docs/parking-lot*.md` sequence found no existing identity owning a Production evidence/testing export. GitHub issue #4 (product "what changed" lifecycle export) is related but distinct and is cross-linked, not absorbed. Strategic and architectural reconciliation remain required before promotion, decomposition, or implementation.

**Authorization boundary:** Preserve the idea and the candidate design. Do not implement. Do not create a new artifact structure. Do not mark architecture settled — the design is explicitly staged for Codex adversarial review.

## Reconciliation — `PL-PROD-EXPORT-01` — Second Design Pass (Hybrid Artifact)

**Status:** `INTAKE` → design refined toward a **bounded hybrid** artifact; still NOT authorized for implementation; staged for final Codex adversarial review.

**Falsification that rejected the backend-only design (motivating example):** the historical #11 defect. The operator saw a called-away "capital returned" claim of a strike-notional figure while the authoritative `netSaleProceeds` was materially different (e.g. displayed ~$10,200 vs authoritative $5,099.89). A backend-only semantic export would have shown the correct authoritative proceeds and been *blind to the wrong presented claim* — exactly the divergence the artifact exists to catch. **Governing requirement (ratified this pass):** the artifact must answer both "what did authoritative Production assess?" and "what material economic/evidentiary claims did the Production page present to the operator?", keep the two layers visibly distinct, make neither authoritative-by-export nor omitted-by-weakness, and make backend/presentation divergence mechanically detectable from a single export.

**"Whole page" (working definition):** all material operator-visible *semantic claims* on the assessed Production view, together with the authoritative Production records supporting them and explicit ownership/provenance per claim — **claim coverage, not visual replication**. Explicitly NOT exported: CSS, dimensions, typography, layout, expand/collapse, tab selection, DOM, incidental interaction state.

**V1 record families (validated against code):** (1) `assessment_meta`; (2) authoritative headline economics + reconciliation (`aggregate`, `production_source`, `reconciliation_issue`, `erosion_event`); (3) authoritative `assessed_transaction` + child `economic_component`; (4) authoritative `disposition_result`; (5) `presented_claim` — the operator-visible Economic Activity claims serialized from the **already-derived `EpisodeChapter` view-model** (not recomputed). Family (5) is what the first design lacked and what makes #11 detectable.

**Authority-class vocabulary (first-class column `authority`):** `AUTHORITATIVE` (backend semantic state, serialized without recomputation), `PRESENTED` (frontend view-model claim actually supplied to rendering; NOT authoritative merely by being exported), `SOURCE_REFERENCE` (minimal evidence reference for forensic reconstruction). Every row carries exactly one.

**One-row contract:** one row = **one exported semantic record OR one presented claim**, discriminated by `record_type` and classified by `authority`. Rows may be parents (e.g. `assessed_transaction`) with child rows (`economic_component`) and may cross-link (`presented_claim` → supporting `disposition_result`).

**Export-local linkage (V1 needs it):** a `record_key` unique **only within one export artifact**, deterministic (assigned by stable ordering, e.g. `<record_type>:<ordinal>`), never persisted, not broker/evidence/lifecycle identity, not semantic authority, NOT a replacement for `dispositionFingerprint` or `contractActivityKey`. `parent_record_key` links components to their transaction; `supports_record_key` links a `presented_claim` to the authoritative record it is compared against. This is required specifically because `dispositionFingerprint` is non-unique and cannot serve as a parent key.

**Recommended shape:** **one hybrid CSV** with a small set of common columns + sparse family-specific columns (Candidate A). Beats the typed-bundle (B) on the Principal's "one attachable, diffable artifact" workflow; beats JSON (C) on tabular inspectability, which is a stated design input. B/C retained as fallbacks only if review shows the sparse/heterogeneous rows become unintelligible.

**Common columns (every row):** `record_key`, `record_type`, `authority`, `parent_record_key`, `supports_record_key`, `underlying_or_symbol`, `label`, `value_numeric`, `value_text`, `state_or_confidence`, `broker_run_date`, `provenance_text`. Family-specific detail rides in `value_numeric`/`value_text`/dedicated sparse columns per family (e.g. disposition rows add `net_sale_proceeds`, `attributable_acquisition_cash`, `realized_appreciation`, `realized_erosion`, `disposition_fingerprint`, `contract_activity_key`, `disposition_state`).

**Authoritative disposition ↔ presented called-away claim linkage:** the `presented_claim` row for a called-away chapter carries `supports_record_key` = the `record_key` of the authoritative `disposition_result` row, resolved via `EpisodeChapter.rawSymbol`/`episode.key === contractActivityKey` (the existing exact-lookup join) — **never via fingerprint uniqueness, never manufacturing lifecycle identity**. The two rows expose side-by-side: presented `capitalLabel`/`capitalAmount`/`productionLabel` vs authoritative `netSaleProceeds`/`attributableAcquisitionCash`/`realizedAppreciation|Erosion`/`state`/`contractActivityKey`/`dispositionFingerprint`(non-unique)/`broker_run_date`/`provenance`.

**Metadata:** `export_generated_at` (export-time only — never labeled assessment/evidence/observation/ingestion time); assessment context (period, periodDescription, reconciliationStatus). **Build/version identity: not currently honestly exposable** — backend gradle version is a static `0.1.0-SNAPSHOT`, frontend `package.json` is `0.0.0`, no actuator build-info, no git-SHA injection. V1 must either omit build identity or record it as a KNOWN GAP; wiring real build/commit identity is a separate mechanism to be identified, not fabricated. **Source-evidence reference:** V1 records uploaded filename + row count + evidence date range as `SOURCE_REFERENCE`; a content fingerprint is optional and privacy-considered; do NOT dump all Fidelity rows.

**Temporal design:** export only demonstrated semantics. Broker Run Date → column named `broker_run_date` (never generic `date`). Settlement Date exists upstream but is omitted from the current Production response — include in V1 ONLY if a concrete test need is stated; default exclude. Economic "as of" (raw action text), observation time, ingestion time: absent → not exported. `export_generated_at` is the only new temporal field.

**Null/zero/uncertainty encoding (deterministic):** distinguish null/unavailable (literal token `NULL`), zero (`0` / `0.00`), empty text (empty quoted string `""`), and state tokens (`RESOLVED`/`PARTIAL`/`UNRESOLVED`/`BASIS_UNKNOWN`/`CHARACTER_UNCERTAIN`/`DETERMINISTIC`/`HIGH_CONFIDENCE`) in `state_or_confidence`. Empty cell must not ambiguously mean both null and empty string.

**Spreadsheet-formula safety:** any `value_text`/`label`/`provenance_text`/action string beginning with `= + - @` (also tab/CR) is prefixed with a single apostrophe or wrapped so spreadsheet software does not evaluate it as a formula, WITHOUT altering the semantic content a reader parses (the escaping convention documented in `assessment_meta`). Numbers use fixed, locale-independent formatting.

**Deterministic ordering:** metadata first, then authoritative families in fixed family order, then per-family stable order (transactions by assessmentOccurrence order; components by parent then declaration order; dispositions by a stable composite of run_date+symbol+occurrence), then `presented_claim` rows in the ledger's existing deterministic chapter order. No chronological ordering is inferred where temporal semantics are insufficient. `record_key` is assigned from this ordering so diffs are stable.

**Ownership split (revised — backend-only rejected):** Backend provides AUTHORITATIVE records (already does, via `ProductionResponse` — no new economics). Frontend already owns the `EpisodeChapter` view-model (PRESENTED claims). **Final composition/serialization occurs frontend-side**, combining (a) the backend `ProductionResponse` serialized verbatim as AUTHORITATIVE rows and (b) its own already-derived `EpisodeChapter` view-model as PRESENTED rows. The frontend MUST NOT recompute backend economics to fill authoritative fields — serializing an already-derived presented claim is not recomputation, but reconstructing authoritative economics would violate ADR-015/016. (Alternative to weigh in review: backend emits an export-ready authoritative model the frontend merely embeds.)

**Deliberately excluded from V1:** visual/layout/interaction state; forecast/capacity/in-flight planning estimates (frontend planning, not accounting truth — candidate later, not V1); moving any frontend economic concept to the backend; Settlement Date (unless a test need is stated); build identity (blocked on a real mechanism); generalized export/reporting infrastructure.

**#11-divergence exposure (acceptance):** one export contains an AUTHORITATIVE `disposition_result` (netSaleProceeds=$5,099.89, state=RESOLVED, contractActivityKey, non-unique dispositionFingerprint) and a PRESENTED `presented_claim` (capitalLabel="capital returned", capitalAmount=$10,200) linked by `supports_record_key`; a diff/consumer can mechanically flag capitalAmount ≠ netSaleProceeds. A design that cannot expose this is rejected.

**Acceptance-test targets (design-level, not authorization):** authoritative rows == response values (no recompute); presented rows == view-model values; changing a presented claim with backend unchanged changes the artifact; #11 shape shows both displayed capital and authoritative proceeds; null/zero/empty/PARTIAL/UNRESOLVED distinguishable; duplicate dispositionFingerprint stays separate; parent/child survives fingerprint collisions; record_key semantics are export-local only; broker run date never mislabeled; export_generated_at never evidence time; ordering deterministic; numeric formatting locale-independent; CSV quoting preserves commas/quotes/newlines/Unicode; formula-like strings spreadsheet-safe; export code performs no economic recomputation; disposition↔presented linkage without fingerprint uniqueness; divergence identifiable from one export.

**Strongest remaining counterargument:** serializing the `EpisodeChapter` view-model captures the *ledger's* claims but not necessarily *every* material claim elsewhere on the page (headline "Produced", Net Strategy Result, Sources, Reconciliation are backend-passthrough and thus covered as AUTHORITATIVE, but post-assignment discretionary-sale economics and buy-write "if called" conditionals live only in chapters and have no authoritative counterpart to diff against) — so for those, PRESENTED rows will exist with no AUTHORITATIVE support row, which is honest but means "divergence detection" only applies where a backend counterpart exists. This is acceptable for V1 (it still catches #11), but must be documented so absence of a support link is not read as agreement.

**Unresolved:** whether PRESENTED-without-AUTHORITATIVE claims need an explicit "no authoritative counterpart" marker; whether Settlement Date earns V1 inclusion; the real build-identity mechanism; exact escaping convention for spreadsheet safety; whether backend should emit an export-ready authoritative model vs frontend serializing the raw response.

## Implementation — `PL-PROD-EXPORT-01` V1 (built; awaiting Principal live validation)

**Status:** V1 implemented in the frontend; tests green; NOT committed. This is a diagnostic CSV, not an architecture change — no semantic ownership was migrated.

**What was built:**
- `options-prototype/src/production/production-csv-export.ts` — pure `buildProductionCsv(assessment, chapters, context)`. One heterogeneous CSV, fixed column set, one `record_type` per row. Serializes the backend `ProductionAssessmentResponse` verbatim (ASSESSMENT layer) and the already-derived `EpisodeChapter[]` presented claims (PRESENTATION layer). No economic recomputation.
- `options-prototype/src/production/CurrentMonthView.tsx` — one unobtrusive "Download Production CSV" action; derives chapters via the same `deriveEpisodeChapters` inputs the `EpisodeLedger` already uses (no new derivation path), builds the CSV, downloads a Blob. No config/wizard/redesign.
- `options-prototype/src/production/production.css` — one small button style.
- `options-prototype/tests/production/production-csv-export.test.ts` — 17 focused tests (the acceptance targets).

**Record families:** `assessment_meta`, `authoritative_summary`, `production_source`, `reconciliation_issue`, `erosion_event`, `transaction_summary`, `assessed_transaction` (+child `economic_component`), `disposition_result` (+child `disposition_economic`), `presented_claim`.

**Layer/ownership vocabulary (kept orthogonal, not one overloaded enum):** `record_layer` ∈ {ASSESSMENT, PRESENTATION, SOURCE_CONTEXT}; `owner` ∈ {PRODUCTION_BACKEND, PRODUCTION_FRONTEND, EXPORT}. A PRESENTATION row is authoritative evidence of *what was shown*, not authoritative economic truth.

**Presented claim names (scalar, per chapter):** `primitive`, `what_happened`, `production_label`, `production_amount`, `capital_label`, `capital_amount`, `confidence`, `state`, `conditional_label`, `link_relationship`, `link_date`, `contracts`, `strike`. Numeric values in `value_numeric`, text in `value_text` (kept separate).

**Export-local linkage:** `record_key` = `<record_type>:<ordinal>` (deterministic, artifact-scoped only); `parent_record_key` (component→transaction, economic→disposition); `supports_record_key` (called-away `presented_claim`→authoritative `disposition_result`, resolved via `chapter.rawSymbol === contractActivityKey` — never via `dispositionFingerprint`, which is preserved as a NON-UNIQUE trace field). Not lifecycle/evidence/broker/durable identity; not stable across corrected/reordered imports.

**Temporal / metadata:** `broker_run_date` (never generic `date`; the header omits any `date` column); `export_generated_at` (EXPORT-time only); `build_revision = NULL` (honestly not exposed — backend `0.1.0-SNAPSHOT`, frontend `0.0.0`, no actuator build-info/git-SHA; cross-build attribution not guaranteed by V1). Settlement Date deliberately excluded (not published through `ProductionResponse`).

**Null/zero/empty:** `NULL` token for null/unavailable; numeric `0`/`0.00` preserved; empty text `""` distinct from `NULL`; states literal (`RESOLVED`/`PARTIAL`/`UNRESOLVED`/`BASIS_UNKNOWN`/etc.).

**CSV safety:** RFC-4180 quoting (commas/quotes/CR/LF/Unicode); reversible formula neutralization (single leading apostrophe) applied only to free-text columns, never to numeric columns (negative economic values keep their sign in `value_numeric`).

**#11 divergence exposure (proven by test):** one artifact carries a PRESENTATION `capital_amount` (e.g. 10200) and, linked via `supports_record_key`, an ASSESSMENT `disposition_economic` `net_sale_proceeds` (e.g. 5099.89, cent precision preserved); the two differing numbers are both present and mechanically comparable.

**Validation:** export tests 17/17; focused frontend production 40/40; full frontend 1337 passed / 1 pre-existing unrelated Velvet Rope date-snapshot failure; full backend 434/0/0/1 (unchanged — no backend files touched); `tsc --noEmit` clean.

**Defects/gaps observed (reported, not absorbed):** PRESENTATION claims that have no backend counterpart (post-assignment discretionary-sale economics; buy-write "if called"; frontend-derived `openPremium`, capital encumbered/released) appear as `presented_claim` rows with no `supports_record_key` — honest, but absence of a link must not be read as agreement. Build identity is a genuine gap (no honest source). These are V1-acceptable and documented, not fixed here.

**Explicit follow-on (NOT resolved in this slice):** Production frontend/backend semantic decoupling appears incomplete — several operator-visible economic claims are frontend-derived with no backend authority — and will be investigated separately after the diagnostic CSV is operational. The CSV exists precisely to make that divergence observable; it does not resolve it.

## Trust-Correction Pass — `PL-PROD-EXPORT-01` V1 (built; awaiting Principal live validation)

**Status:** V1 trust corrections applied after live-artifact review; tests green; NOT committed. Narrow pass — no broad export redesign, no FE/BE decoupling, no Product-defect fixes absorbed.

**Corrections applied:**
1. **Single shared `EpisodeChapter[]` derivation.** `CurrentMonthView` now derives chapters once (`useMemo`) and passes the exact same collection to both the `EpisodeLedger` (which no longer derives internally — it takes a `chapters` prop) and `buildProductionCsv`. Rendered claims and exported claims can no longer come from two independent derivations. Proven by `episode-ledger-shared-chapters.test.tsx`.
2. **Grouping vs parent linkage fixed.** New explicit column `presentation_group_key` carries the episode grouping token (e.g. `-BNO260904C54#1`); `parent_record_key` is now EMPTY for presented claims and only ever holds an actual exported `record_key`. Structural-integrity test asserts every non-empty `parent_record_key`/`supports_record_key` resolves to an exported `record_key`.
3. **Claim-specific authoritative support.** `supports_record_key` is no longer a blanket per-chapter link. `capital_amount` (called-away) links to the SPECIFIC authoritative `net_sale_proceeds` `disposition_economic` child; `state`/`confidence` link to the disposition parent (their genuine source for called-away); `production_amount` (a composite of frontend premium + backend appreciation/erosion) and `primitive`/`contracts`/`strike`/labels/link metadata get NO support link. Prefer absent over overstated.
4. **`presentation_role` column** (`DISPLAYED_CLAIM` | `PRESENTATION_BACKING_VALUE`) distinguishes rendered operator claims (e.g. `capital_label`) from backing view-model values (e.g. `capital_amount`), faithfully EXPOSING label/value divergences (URA/UNG; expired null-label/non-null-amount) rather than reconciling them.
5. **Reversible spreadsheet-safe encoding scoped to free text only.** Formula neutralization (single leading apostrophe, reversible) now applies ONLY to free-text columns (`label_text`, `value_text`, `provenance_text`). Identifier/key columns (`record_key`, `parent_record_key`, `supports_record_key`, `presentation_group_key`, `contract_activity_key`, `disposition_fingerprint`, `symbol`) are never mutated — OCC symbols beginning with `-` survive byte-for-byte and remain recoverable. Negative numerics stay numeric.
6. **Source filename** now emitted from the existing workflow via a small read-only `getActivityFilename()` getter (reads the existing `wheelwright:fidelity-csv:activity` `{text,filename}` storage). No new parsing/evidence machinery; no row-count/date-range derivation. `build_revision` remains `NULL` — **V1 does not provide self-contained cross-build attribution** (no honest build/commit source exposed).

**Newly-exposed Product defects (filed as GitHub Issues, NOT fixed here):**
- **#14** — Production Economic Activity presents inflated contract counts (episode-construction double counting): BNO C51 2 vs 1, BNO C54 3 vs 2, EWY 2 vs 1, GDXJ 2 vs 1.
- **#15** — capital label text diverges from backing capital amount (URA \$4,579 label vs 4600 backing; UNG \$1,070 vs 1100); expired COPX/GDX carry non-null capital amount with null label.
These are frontend/presentation defects, not CSV serializer defects; the export exposes them faithfully.

**Validation:** export tests 24/24; ledger-shared test 2/2; focused frontend production 49/49; full frontend 1346 passed / 1 pre-existing unrelated Velvet Rope date-snapshot failure; full backend 434/0/0/1 (unchanged — no backend files touched); `tsc --noEmit` clean; `git diff --check` clean.

**Follow-on preserved (NOT resolved here):** Production frontend/backend semantic decoupling remains a separate investigation after the CSV is trusted operational evidence. Defects #14/#15 are concrete instances that decoupling work (or targeted fixes) will address; this slice only makes them observable.

## Final Trust Corrections — `PL-PROD-EXPORT-01` V1 (built; end-of-day closure candidate)

**Status:** final V1 trust corrections applied after Codex literal review; tests green; NOT committed; awaiting Principal live-download validation before commit authorization. Narrow pass — no scope broadening, no FE/BE decoupling, no fix of Issues #14/#15, no export redesign.

**Three blockers fixed:**
1. **Hook ordering / TDZ.** `CurrentMonthView` now declares the `episodeChapters` `useMemo` BEFORE `handleDownloadCsv`, so the callback closes over an initialized binding. Proven by an integration-level test (`current-month-view-hook-composition.test.tsx`) that renders the real `CurrentMonthView` (exercising the full hook composition) and drives the download click — not an isolated ledger test.
2. **Support restricted to the called-away RESOLUTION chapter.** Disposition-derived support (`capital_amount → net_sale_proceeds` child; `confidence → disposition parent`) now attaches ONLY when the chapter is a resolution (`linkDirection === "opened"`) AND a disposition exists for its key. Opening chapters sharing the same contract key (`linkDirection === "resolves"`) receive NO disposition support. Uses the smallest existing discriminator; no lifecycle identity invented. Regression test covers an open+resolution pair for the same key.
3. **Presentation lifecycle `state` de-linked from disposition state.** `EpisodeChapter.state` (`complete`/`in_flight`, presentation lifecycle) is a DIFFERENT semantic claim from `DispositionResult.state` (`RESOLVED`/`PARTIAL`/`UNRESOLVED`, economic resolution). Presented `state` now carries NO `supports_record_key`; disposition economic state remains independently in authoritative rows. Test asserts presented `state` has no disposition support.

**Two clarifications:**
4. **Honest encoding contract.** V1 no longer implies identifiers are simultaneously byte-exact AND spreadsheet-safe. Explicit `assessment_meta` metadata rows now document: free-text fields use reversible leading-apostrophe neutralization; structural/identifier fields preserve raw semantic bytes and are NOT guaranteed spreadsheet-safe (may need import-as-text handling); numeric fields are numeric/locale-independent; and the NULL/zero/empty distinction. Identifier byte-fidelity tests retained; a metadata-presence test added.
5. **`source_filename` honesty.** Retained and classified as `SOURCE_CONTEXT`/`EXPORT`; provenance text states it is download-time workflow/source context from the browser's currently-stored Activity artifact, NOT backend-attested provenance that this file generated the assessment. No new provenance plumbing added.

**Preserved intact:** single shared `EpisodeChapter[]` derivation; `presentation_group_key` separate from `parent_record_key`; every non-empty parent/support key resolves to a real export-local record; `presentation_role` (DISPLAYED_CLAIM vs PRESENTATION_BACKING_VALUE); no blanket `production_amount` support; identifier byte fidelity; Issues #14/#15 as separate Product defects (untouched); no FE/BE semantic migration; `build_revision = NULL`; V1 explicitly does not promise self-contained cross-build attribution.

**Validation:** export tests 26/26; hook-composition 2/2; ledger-shared 2/2; focused frontend production 53/53; full frontend 1350 passed / 1 pre-existing unrelated Velvet Rope date-snapshot failure; full backend 434/0/0/1 (unchanged — no backend files touched); `tsc --noEmit` clean; `git diff --check` clean.

**Live-validation required before commit:** a real download must be inspected after a Principal-controlled reload/restart (checks: parses; all non-empty parent/support keys resolve; opening chapters inherit no called-away support; called-away capital links to `net_sale_proceeds`; presentation lifecycle state has no disposition support; OCC/identifier bytes unchanged; encoding-contract metadata present; `source_filename` present-and-labeled when available; Issues #14/#15 remain visible).

**Follow-on preserved (NOT begun):** Production frontend/backend semantic decoupling remains a separate investigation after the CSV is trusted operational evidence.

## Principal Verdict — `PL-PROD-EXPORT-01` V1 accepted (committed)

Live validation against the running servers passed the ten acceptance checks (real `POST /api/production/assess` response → CSV: parses; parent/support keys resolve; encoding-contract metadata present; source_filename labeled workflow context; identifiers byte-exact; disposition/divergence paths validated via synthetic case since the July fixture carries no called-away dispositions). **Principal verdict: ready to commit.**

Deferred (explicitly out of scope, not blocking):
- **Deferred UX** — the "Download Production CSV" button placement is awkward; treat as a small future UX refinement, not a V1 blocker.
- **Issues #14 / #15** — inflated presented contract counts and capital label/value inconsistencies remain SEPARATE Product defects, faithfully exposed (not corrected) by the export.
- **FE/BE semantic decoupling** — remains a separate investigation for a future session; not begun.
