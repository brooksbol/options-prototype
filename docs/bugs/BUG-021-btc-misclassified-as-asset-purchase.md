# BUG-021 — Buy-to-close option is classified as a generic asset purchase (CAPITAL_DEPLOYMENT), never netted against recognized premium

- **Status:** Open
- **Severity:** Not established
- **Area:** Production / accounting (backend `TransactionClassifier` → `EconomicDecomposer`)
- **Provenance:** Discovered 2026-09-16 during the Existing Short-Obligation HOLD vs CLOSE V1 reconciliation (Kiro repository-grounded verification; Codex originally surfaced the concern). No GitHub Issue. This is the authoritative record.

## Observed failure

A Fidelity Activity transaction that represents **buying to close a short option** (action string begins `"YOU BOUGHT CLOSING TRANSACTION ..."`) is not recognized by the backend transaction classifier. It falls through the classification chain to the generic catch-all and is classified as **`ASSET_PURCHASE`**, then economically decomposed as **`CAPITAL_DEPLOYMENT`** — a fresh asset purchase against the OCC option symbol — rather than being recognized as the closing of an option obligation and netted against the previously-recognized opening premium.

## Intended semantics violated

- **ADR-014 (Production recognition):** option premium is recognized once, at sell-to-open receipt. The closing debit of that same obligation is part of the *same* economic lifecycle and must not be accounted as unrelated capital deployment. Booking a BTC debit as `CAPITAL_DEPLOYMENT` against the OCC symbol misrepresents the economic event.
- **ADR-016 (evidence-to-domain association):** a closing transaction is an authoritative economic event bound to a specific short-obligation lifecycle; classifying it as a generic asset buy severs that association.
- The classifier already encodes option *opening* semantics (`OPTION_SELL_TO_OPEN_PUT` / `_CALL`); the *closing* counterpart is missing, so the two halves of one obligation lifecycle are accounted incoherently.

## Evidence

Verified against accepted `main` at SYNC `7b4a0843295bfed52584e4b5d97efd4eb7eacdd1`:

- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/TransactionClassifier.java` — recognizes `"YOU SOLD OPENING TRANSACTION PUT"` / `"...CALL"` (option opening) but has **no** `"YOU BOUGHT CLOSING TRANSACTION"` branch. A BTC row is not matched by the treasury branch (requires `isTreasury`) nor `"YOU BOUGHT ASSIGNED PUTS"`, so it reaches the generic `if (action.startsWith("YOU BOUGHT")) return FidelityTransactionKind.ASSET_PURCHASE;`.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/FidelityTransactionKind.java` — has `OPTION_SELL_TO_OPEN_PUT` / `_CALL` but **no** `OPTION_BUY_TO_CLOSE_*` member.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/EconomicDecomposer.java` — `case ASSET_PURCHASE, TREASURY_PURCHASE -> ... ComponentType.CAPITAL_DEPLOYMENT ...`; no branch nets a closing debit against the earlier opening premium.
- The correct action string is already recognized in the **frontend** importers (`options-prototype/src/csv/fidelity/activityParser.ts` maps `"YOU BOUGHT CLOSING TRANSACTION"` → `buy_to_close`; likewise `src/scenarios/parseActivityCsv.ts`, `src/imports/fidelity/parseActivity.ts`, `src/domain/portfolio.ts`), demonstrating the backend classifier is missing a pattern the rest of the repository already knows.
- **No Java test** feeds a `"YOU BOUGHT CLOSING TRANSACTION"` row or asserts its classification/decomposition.

## Consequence

A month containing a buy-to-close would misattribute the closing debit as capital deployment against an option symbol instead of reducing the net production of the closed obligation. This can distort Net Strategy Result and Production accounting. Consequence magnitude in real operation was **not** established in this investigation (no live specimen quantified), so severity is recorded as `Not established` rather than invented.

## Diagnosis / root cause

The transaction classifier lacks a buy-to-close recognition branch and the enum lacks a corresponding kind; consequently the economic decomposer has no path to net the closing debit against recognized premium. The two halves of one option-obligation lifecycle (open credit, close debit) are classified by unrelated rules.

## Scope / non-goals

Records the defect only. **Filing does not authorize remediation.** This record does not prescribe the fix (new enum kind, classifier branch, netting semantics, or lifecycle-association design are all remediation-time decisions). It does not resolve the broader lifecycle-reconstruction maturity tracked by `PL-EXEC-01` / `PL-PORT-02`; it isolates the specific current mis-classification.

## Acceptance criteria (for an eventual, separately-authorized fix)

- A `"YOU BOUGHT CLOSING TRANSACTION"` row is classified as an option-close event, distinct from `ASSET_PURCHASE`.
- The closing debit is economically associated with the corresponding opening premium (or explicitly `UNRESOLVED` when association cannot be established), never booked as generic `CAPITAL_DEPLOYMENT` against the OCC symbol.
- Premium is still recognized exactly once (ADR-014 invariant preserved); the close does not double-count or re-recognize premium.
- Backend tests feed a BTC row and assert both classification and economic decomposition.

## Durable model (governs correct treatment)

Three rounds of independent review (Codex) plus Principal correction established the durable model. A BTC carries separable facts that must never be conflated, and there is **exactly one authority** for the association:

1. **Known executed BTC economics** — the row's own authoritative net closing debit (fees folded into net cash) and its own date. This is a real option-close cash event and reduces net realized period option premium **regardless** of whether a recognized opening exists. It is not a new-asset acquisition. Known whenever the row carries cash. Each executed close is an **individually dated event** — multiple closes are never collapsed into one accumulated debit/date.
2. **Temporally-defensible recognized-lifecycle association** — whether a recognized short obligation for the exact contract **existed at the moment this close executed**, established from **strictly-prior** evidence only, over **individually dated and quantified** opening/close/terminal rows (never a collapsed episode opening date+count). A future opening can never validate an earlier close; a prior terminal resolution consumes only **its own quantity**.
3. **Quantity affected** — the close's own executed quantity. `cash-known` and `quantity-known` are **independent** facts; a close can have authoritative cash yet an unavailable quantity.
4. **Uncertainty is preserved as state** — recognized outstanding before a close is an inclusive integer **range** `[min,max]`. Known events move the bounds; an **unknown-quantity** prior consumption widens the range (min→0, max unchanged) — **unknown consumption is never treated as zero consumption**, so a later close cannot become falsely deterministic. A close of quantity `q` is deterministic only when `min ≥ q`; definitely over-closed when `max < q`; otherwise (`min < q ≤ max`, same-day ambiguity, missing evidence, or an unbounded prior opening) it is **UNRESOLVED**.
5. **One authority; Product renders it** — the backend Production path is the **single** authority for recognized-lifecycle association (matched / residual / excess / status), exposed as an authoritative per-close `OptionCloseResult`. The Product presentation **renders** that result and must not independently reconstruct a competing association (ADR-016). There is no second resolver in TypeScript.

"This BTC reduced period option economics" (fact 1) is **not** the same claim as "this BTC retired a recognized short obligation that existed when it executed" (fact 2). The repair asserts (1) and (3) from the row itself; the backend alone reconciles (2)/(4) chronologically, per-event, with uncertainty preserved as a range; and the Product renders the backend verdict (5). It never manufactures association, never lets future evidence backfill an earlier close, never converts unknown history to zero, and never presents a partial/unmatched/unresolved close as realized closed-lifecycle P&L.

## Principal authorization (2026-09-17) — one bounded implementation attempt

This section is the **durable authorization record** for BUG-021 remediation. It is recorded **before** the implementation attempt begins and does **not** assert that implementation has occurred. BUG-021 remains `Open`.

### Authorization state

On **2026-09-17** the Principal, having reviewed the BUG-021 Product outcome:

- **Product outcome confirmation:** PRESENT — the Principal explicitly confirmed the intended BUG-021 Product behavior described by the Product boundary below.
- **Sequencing decision:** BUG-021 remediation **may resume**.
- **Authorization granted:** exactly **ONE bounded implementation attempt**, constrained to the Product boundary below.
- **Retry does not self-authorize:** a Codex `REJECT` of the resulting candidate does **not** itself authorize another attempt. A further attempt requires a new, separately-recorded Principal authorization.
- **Exclusion preserved:** the separate In-Flight / current-position contradiction (a closed/expired obligation not removed from the projected-position view) is **out of scope** for this authorization and remains a distinct defect to be handled separately.

This authorization governs consequential mutation permission for BUG-021 as a matter of durable state; it is not created or extended by conversation, actor recommendation, defect narrowness, sunk cost, or prior permission (per `docs/foundations/principal-decision-surface.md`).

### Principal-confirmed Product boundary (the authorized outcome)

The one authorized attempt must produce, and Production verification must demonstrate through the **actual BTC accounting path** (not isolated unit behavior only):

- A Fidelity buy-to-close is an **option-close event**, never generic `ASSET_PURCHASE` / `CAPITAL_DEPLOYMENT`.
- **Known BTC closing cash remains visible.**
- **Known BTC executed quantity remains visible.**
- **Unknown BTC executed quantity remains unknown** — never fabricated.
- **Opening quantity must never be substituted or presented as observed closing quantity** when the BTC quantity is unavailable.
- Closing evidence is **associated to the opening short obligation when the evidence establishes that association**; otherwise association remains **explicitly unresolved**.
- **Opening premium is recognized exactly once**; the close must not re-recognize or double-count premium.
- **Historical close evidence must not be validated by later opening evidence.**
- **Do not restore** the broader lifecycle-retirement machinery removed during prior candidate work (`episodeFullyRetiredByBackend` / `byContract` / `fullyRetired` / `isFullyClosed` or equivalents).
- **Do not use BUG-021 to solve** the separate In-Flight / current-position contradiction.
- **Do not assert complete obligation retirement** unless the available evidence actually establishes it.

#### Positive specimen

BTC with **known** quantity — e.g. **3 contracts / −$40**. Expected result:

- option close;
- quantity **3** visible;
- **−$40** closing cash visible;
- opening-obligation association when established, otherwise **explicit unresolved** association;
- never capital deployment;
- no second recognition of opening premium.

#### Negative specimen

**STO quantity 2**, followed by **BTC with quantity unavailable / −$40**. Expected result:

- option close;
- **−$40** closing cash remains visible;
- executed BTC quantity remains **unknown**;
- opening quantity **2 is not substituted** as the BTC execution quantity;
- association uncertainty remains **explicit** where evidence is insufficient;
- no false lifecycle certainty.

### What this authorization does NOT record

- It does **not** claim implementation has occurred, does **not** populate `Remediation history` / `Verification` as though resolved, and does **not** change `Status` from `Open`.
- The uncommitted prior candidate on a working tree is **not** an accepted remediation; acceptance remains the Principal's, after Product-behavior demonstration of a submitted candidate.

## Remediation history

Repair prepared 2026-09-16 (Kiro) against accepted `main` at SYNC `9f10ba3de8c40aaf87e5bc2250aace6c1456cdc8` (the `7b4a084 → 9f10ba3` range was documentation-only; code findings held). Delivered in two passes; the second pass is a **bounded amendment after independent review** that corrected specific overclaims in the first pass.

**Preserved from the first pass (correct):**
- `FidelityTransactionKind.java` — `OPTION_BUY_TO_CLOSE_PUT` / `OPTION_BUY_TO_CLOSE_CALL`.
- `TransactionClassifier.java` — `"YOU BOUGHT CLOSING TRANSACTION PUT"` / `"...CALL"` branches **before** the generic `"YOU BOUGHT" → ASSET_PURCHASE` catch-all.
- `EconomicDecomposer.java` — BTC → `PRODUCTION` / `OPTION_PREMIUM` carrying the **signed** executed debit (fact 1); premium still recognized once at sell-to-open (ADR-014). Never `CAPITAL_DEPLOYMENT`. Missing cash → `UNRESOLVED` / `BASIS_UNKNOWN`.
- `EconomicComponent.java` — `amount` doc allows a signed `OPTION_PREMIUM` close-debit reduction.
- Genuine equity purchase (negative control) remains `CAPITAL_DEPLOYMENT`.

**Amendment (second pass) — required corrections:**
- **Assessment-level reconciliation propagation (was a real gap).** `ProductionAssessor` previously could report `FULLY_RECONCILED` with a materially unresolved BTC. Added `IssueType.OPTION_CLOSE_LIFECYCLE_UNRESOLVED` and `ProductionAssessor.appendOptionCloseReconciliationIssues(...)`, which raises an issue (so the assessment is not `FULLY_RECONCILED`) for a period BTC with missing cash, insufficient contract identity, missing/invalid quantity, same-day ordering ambiguity, no recognized outstanding obligation before the close, or over-close. The executed debit is **never suppressed** — known cash is preserved even when association is unresolved.
- **Principal-visible Product presentation (first pass overclaimed "no frontend change").** The Economic Activity ledger (`options-prototype/src/production/episode-derivation.ts` → `EpisodeLedger`) previously **dropped** `buy_to_close` entirely, so the headline arithmetic changed while the operator-visible ledger still told only the opening story. Added a BTC close/reduction presentation. CSP capital effect is stated as **nominal encumbrance removed** for the matched quantity only — never a cash/buying-power release (HOLD-vs-CLOSE V1 discipline). `formatIssueType` in `CurrentMonthView.tsx` and `ProductionView.tsx` label the new issue.

**Third pass — temporal & per-event correctness (second independent review):** the second-pass association was still **total-contract-quantity** (sum of STO vs sum of BTC across the whole supplied history) and the frontend **collapsed** multiple BTCs into scalar fields. Both are genuine defects. Corrected:
- **Chronological exact-contract association (backend).** `ProductionAssessor.resolveRecognizedOutstandingBefore(...)` now establishes the recognized outstanding short quantity that existed for the exact contract **immediately before each close**, from **strictly-prior** events only: a prior STO increases it; a prior BTC or prior terminal resolution (`ASSIGNMENT_NOTIFICATION` / `EXPIRATION_NOTIFICATION`, keyed by OCC symbol + quantity) consumes it. A **future opening can never validate an earlier close**. Over-close and no-recognized-outstanding are judged against that temporal quantity, per close.
- **Same-day ordering fails closed.** Fidelity evidence is date-granular. If a competing lifecycle event for the same contract shares a close's date, ordering is material and unestablished, so the close is reported unresolved rather than assigned an invented intraday sequence.
- **Quantity-unknown is independent of cash-known (backend).** A BTC with authoritative cash but missing/invalid quantity keeps its debit in period option economics but raises a lifecycle issue and never claims deterministic retirement.
- **Per-event identity preserved (frontend).** `EpisodeRecord.closeEvents: CloseEvent[]` replaced the scalar `closeDate`/`closeDebit`/`closedContracts`. `buildCloseChapters` emits **one dated chapter per executed BTC**, running the same chronological resolver; a later close lands in **its own reporting month** and is never absorbed by an earlier close's date/debit.
- **Partial-close product semantics.** A close chapter's production figure is now the **executed closing debit itself** (per event), not `opening premium − partial debit`. A partial/unmatched/over-close close is never labelled realized closed-lifecycle P&L; the chapter shows executed debit, matched/residual/excess quantity, and confidence.

**Corrected claims (superseded by later passes):**
- ~~"OCC identity alone establishes the lifecycle association."~~ It does not.
- ~~"The frontend already handles BTC presentation."~~ It did not; the ledger dropped BTC. Repaired.
- ~~"Association at the recognized-quantity level = summed BTC vs summed STO for the contract."~~ **Insufficient.** Total-contract-quantity ignores time: a future opening could validate an earlier close and a prior resolution could be ignored. Association is now **chronological and per-close** (outstanding-before, strictly-prior evidence only).
- ~~"A single accumulated close (first date, summed debit) is adequate presentation."~~ **Wrong.** It moved cash/lifecycle across reporting periods. Each BTC is now an individually dated event.
- ~~"BUG-021 is fully repaired/verified."~~ Not self-declared. Remains **Open** pending Principal acceptance.

**Fourth pass — preserve uncertainty as state + eliminate competing lifecycle authority (third independent review):** the third-pass resolver still (a) treated an unknown historical quantity as **zero** consumption (`qty=0` when null), letting a later close become falsely deterministic; and (b) the frontend still ran its **own** chronological resolver over collapsed opening/terminal evidence, which could diverge from the backend. Both corrected:
- **Uncertainty as a range (backend).** `resolveRecognizedOutstandingBefore(...)` now returns an inclusive integer range `[min,max]` (+`openingUncertain`/`sameDayOrderingAmbiguous`). Known STO/BTC/terminal quantities move the bounds; an **unknown-quantity** prior consumption sets `min→0` while leaving `max` unchanged (unknown ≠ zero); an unknown-quantity prior opening marks the upper bound untrusted. A close of `q` is `DETERMINISTIC_*` only when `min ≥ q`, `OVER_CLOSE` when `max < q`, else `UNRESOLVED`.
- **Single authority (backend owns, Product renders).** New `OptionCloseResult` (per executed BTC: `executedDebit`, `closedQuantity`, `outstandingBefore[min,max]`, `matched[min,max]`, `residual[min,max]`, `excessUnmatched`, `status`, `reason`) is produced by `ProductionAssessor.buildOptionCloseResult(...)` — the sole authority — and exposed on `ProductionAssessment`/`ProductionResponse` (`OptionCloseResultDto`). The reconciliation issue is derived from the same result. `episode-derivation.ts` **no longer computes association**: its prior timeline/outstanding resolver was removed; `buildCloseChapters` now looks up the authoritative `OptionCloseResult` (by `symbol|date|action|debit|quantity`, ordinal-consumed) and renders `whatHappened`/confidence/residual/excess/encumbrance strictly from it. A close with no matching result renders **unresolved**, never locally re-derived.

**Corrected claims (superseded by the fourth pass):**
- ~~"Unknown prior consumption can be treated as zero."~~ **Wrong.** It let later closes become falsely deterministic. Uncertainty is now preserved as a range.
- ~~"Accumulated episode opening quantity is sufficient temporal evidence."~~ **Insufficient.** The backend folds individual dated/quantified rows; the frontend no longer reasons about association at all.
- ~~"Backend and frontend independently run the same resolver."~~ **Eliminated.** The backend is the single authority; the frontend renders `OptionCloseResult` (ADR-016).

**Fifth pass — covered ≠ complete, same-day propagation, remove the last frontend lifecycle decision, real round-trip (fourth independent review):** three residual defects were found in the fourth-pass candidate. Corrected:
- **Covered is not complete retirement (backend).** `buildOptionCloseResult` previously set `DETERMINISTIC_COMPLETE` whenever `residualMin == 0` (i.e. any covered close). That overclaims: outstanding `[1,3]`, close 1 → residual `[0,2]` is covered but the obligation is **not definitely fully retired**. `DETERMINISTIC_COMPLETE` now requires `residualMax == 0` (no residual possible under any admissible history); `min ≥ q` with `residualMax > 0` is `DETERMINISTIC_PARTIAL` (covered, residual uncertain).
- **Same-day ambiguity propagates (backend).** `resolveRecognizedOutstandingBefore` previously subtracted a prior known close/terminal quantity exactly, even when that prior event's own ordering was same-day-ambiguous, manufacturing a definite outstanding for a later close. Now: a prior event whose date carries a competing lifecycle event for the same contract is treated as ambiguous — a prior ambiguous **consumption** widens the range (`min→0`), and a prior ambiguous **opening** contributes to `max` only. Ambiguity is thus carried forward instead of erased by occurrence order.
- **Last frontend lifecycle decision removed.** `episode-derivation.ts` still had `isFullyClosed()` deciding the OPEN chapter's complete/in-flight state from raw close quantities. Removed. *(Superseded by the sixth pass below: the interim `episodeFullyRetiredByBackend(...)` / `byContract` replacement was itself subsequently removed — see the sixth pass.)*
- **Real backend→Product round-trip test (fix #4).** `Bug021RoundTripFixtureTest` (Java) drives specimens through the real `ProductionController.assess` (`MockMultipartFile`) and serializes the actual `ProductionResponse` to `options-prototype/tests/fixtures/bug021/*.json`; `episode-derivation-backend-roundtrip.test.ts` loads those fixtures and drives `deriveEpisodeChapters`, asserting the Product renders the backend verdict (covered → "Partially closed"; same-day → unresolved; partial-assignment close chapter → "Closed · obligation retired"). This replaces the prior separate "HTTP output" + "hand-built DTO" testing with one round-trip where both sides use the same backend output.

**Corrected claims (superseded by the fifth pass):**
- ~~"A covered close (`residualMin == 0`) is a complete retirement."~~ **Wrong.** Complete requires `residualMax == 0`; a covered close with `residualMax > 0` is `DETERMINISTIC_PARTIAL`.
- ~~"A prior known consumption can be subtracted exactly regardless of same-day ordering."~~ **Wrong.** A prior same-day-ambiguous event's effect is uncertain and must widen the range, not manufacture a definite outstanding.
- ~~"The frontend `isFullyClosed()` raw-quantity check is acceptable for open-chapter state."~~ **Removed.** (See sixth pass for the current open-chapter state rule.)

**Sixth pass — Package 1 / Option A scope tightening + observed-close-quantity fix (Principal boundary; Codex reject):** Principal confirmed the accepted BUG-021 boundary is **Package 1 / Option A** (complete and demonstrate BTC *accounting*), and that broader **current-lifecycle retirement claims must not be retained merely because earlier candidate code contained them**. Two corrections were made:
- **Standing-retirement machinery removed (scope).** The fifth-pass `episodeFullyRetiredByBackend(...)` and its non-consuming `byContract` index — which flipped the OPEN chapter to `complete`/out-of-in-flight whenever a `DETERMINISTIC_COMPLETE` close existed — were **removed** from `episode-derivation.ts`. The open chapter's complete/in-flight state now derives from a **genuine resolution (expiry/assignment) only**; a BTC close does not restate the opening's current lifecycle state. Each executed BTC is still fully represented by its own close chapter (executed debit vs premium, explicit `OptionCloseResult` status). The per-close consumable `byKey` queue is unchanged. No standing "obligation currently retired" claim remains for the opening. *(The close chapter for a `DETERMINISTIC_COMPLETE` close still reads "Closed · obligation retired" — that is per-event accounting of the executed close, not a standing claim about current opening state.)*
- **Close-chapter quantity uses the OBSERVED close quantity (Codex falsifier).** The close chapter previously took `contracts` from `episode.contracts`, which is `0` for an unmatched BTC (skeleton episode with no recognized opening) — so a genuine unmatched BTC of quantity 3 rendered as `0`, erasing known BTC quantity when association is `UNRESOLVED`. Fixed: the close chapter's `contracts` is the **observed** close quantity (`CloseEvent.quantity`), falling back to `episode.contracts` only when the row carried no usable quantity. Known BTC cash and known BTC quantity now remain visible even when association is unresolved. The confirmed matched DBO case is unchanged (observed quantity equals the matched/opening quantity there).

**Corrected claims (superseded by the sixth pass):**
- ~~"Open-chapter state comes from backend authority via `episodeFullyRetiredByBackend(...)` / a `byContract` index."~~ **Removed.** That standing-retirement machinery is out of BUG-021 scope; open-chapter complete/in-flight state derives from a genuine resolution (expiry/assignment) only.
- ~~"A close chapter's contract quantity is the episode's (opening) quantity."~~ **Wrong.** For an unmatched BTC the opening quantity is `0`; the chapter must show the **observed** close quantity so known BTC quantity stays visible under `UNRESOLVED`.

Change is **uncommitted** pending Principal acceptance (direct-`main` workflow: Principal validation is the acceptance gate; passing tests do not authorize commit).

## Verification

Verified at SYNC `e53ea4d` (working tree; the `9f10ba3 → e53ea4d` advance was documentation-only and touched no code or BUG-021 files):

- **Backend test** `evidence-service-java/.../production/BuyToCloseProductionTest.java` (26 cases): classification; decomposition (signed `OPTION_PREMIUM`; missing cash → `UNRESOLVED`); positive/negative/STO-regression; reconciliation-propagation; temporal/per-event; range-model/authoritative-result cases — including the fifth-pass fixes: a covered-but-uncertain close is `DETERMINISTIC_PARTIAL` (not `COMPLETE`); a prior same-day-ambiguous close leaves a later close `UNRESOLVED`; partial assignment (1 of 2) then BTC 1 → `DETERMINISTIC_COMPLETE` (`outstandingBefore=[1,1]`); over-close → `OVER_CLOSE`; `q` within range → `UNRESOLVED`.
- **Backend round-trip fixtures** `Bug021RoundTripFixtureTest.java` (3 cases): drives specimens through the real `ProductionController.assess` and serializes the actual `ProductionResponse` to `options-prototype/tests/fixtures/bug021/` (asserting `DETERMINISTIC_PARTIAL` for covered-not-complete `[1,3]` residual `[0,2]`, `UNRESOLVED` for same-day propagation, `DETERMINISTIC_COMPLETE` for partial-assignment).
- **Full backend suite:** 598 tests, 0 failures, 1 skipped (manual `RealFileAssessmentTest`).
- **Frontend test** `options-prototype/tests/production/episode-derivation-buy-to-close.test.ts` (13 cases): renders the authoritative `OptionCloseResult` (complete/partial/over-close/unresolved, encumbrance only for an exact deterministic matched qty, divergence guard, missing-cash/quantity, two dated closes, cross-month, negative control) — plus the sixth-pass cases: the **unmatched-BTC quantity falsifier** (quantity 3 / −$40 keeps its observed quantity and cash visible, `UNRESOLVED`, no capital-deployment, no retirement claim) and a **matched-DBO-preserved** regression (observed quantity 1 still renders as 1).
- **Frontend round-trip test** `options-prototype/tests/production/episode-derivation-backend-roundtrip.test.ts` (4 cases): loads the **real backend fixtures** and drives `deriveEpisodeChapters`, asserting the Product renders the backend verdict — covered → "Partially closed"; same-day → "association unresolved"; partial-assignment close chapter → "Closed · obligation retired"; plus a structural divergence guard. This is a genuine backend→Product round-trip (both sides use the same backend output), replacing the prior separate HTTP-output/hand-built-DTO testing.
- **Sixth-pass verification (this amendment).** Observed at SYNC `0e0a3ec` (working tree; the advance from the fifth-pass SYNC to `0e0a3ec` was documentation-only — BUG-022/023/024 filings and a merged BUG-022 write-desk fix — and touched no BUG-021 files). `tsc --noEmit` clean; `episode-derivation-buy-to-close.test.ts` 13/13; full frontend production run 98 pass; full frontend suite 1729 pass / 1 pre-existing **unrelated** failure (`tests/velvet-rope/multi-expiration.test.ts`, a date-relative snapshot). Backend BUG-021 tests unchanged (frontend-only amendment) and green.
- **Single-authority (no divergence).** The Product renders the backend `OptionCloseResult`; the frontend has **no** association resolver, and both `isFullyClosed()` and the interim `episodeFullyRetiredByBackend()` open-chapter state deciders have been removed. The open chapter's complete/in-flight state derives from a genuine resolution (expiry/assignment) only; the close chapter renders each executed BTC (observed debit + observed quantity) with the backend's `OptionCloseResult` status.

Status remains **Open** pending Principal acceptance of the operator-visible result (defect protocol: `Resolved` requires demonstrated + accepted remediation; this record does not self-close).

## Related

- `PL-EXEC-01` (Trade Lifecycle Evolution — anticipates later buy-to-close/roll/unwind economics and post-execution reconciliation; capability context, not a bug record).
- `PL-PORT-02` (Production Accounting remaining — lifecycle reconstruction; capability context).
- ADR-014 (Production recognition), ADR-016 (evidence-to-domain association) — governing semantics.
- `docs/design/existing-short-obligation-hold-vs-close-v1-design.md` §8/§19/§21 — the HOLD-vs-CLOSE V1 design treats this as a bounding constraint (it must not assume Production has netted a BTC), not something it repairs.
- **Finding B / BUG-001** — the live-overlay counterpart (a BTC/expired obligation is not removed from projected positions). Distinct concern (frontend projection vs backend accounting); cross-linked, not double-booked.

## Principal authorization (2026-09-17, second) — one NEW bounded implementation attempt against the validated model

This section is a **durable authorization record**. It is recorded **before** the new implementation attempt begins and does **not** assert that the new implementation has occurred. BUG-021 remains `Open`. It supersedes neither the frozen candidate's own narrative above nor the defect protocol; it records a fresh, separately-granted Principal authorization and the cross-actor evidence that established the intervening workflow state.

### Chronology this record makes durable

1. **Previous authorization (`00bde24`) was consumed.** The "Principal authorization (2026-09-17) — one bounded implementation attempt" section above authorized exactly one attempt. That attempt was executed as the **seventh pass** (negative-specimen / unknown-BTC-quantity fix) and is the currently-preserved uncommitted candidate. That authorization is **spent**.
2. **Codex independently REJECTED the seventh-pass candidate.** Cross-actor evidence (supplied through the Principal per operating-model correction #6, *Cross-actor evidence provenance is mandatory*) established: Codex resumed its interrupted review; all **25 frozen candidate files** matched the pre-interruption SHA-256 inventory; nothing was staged; intervening commits were orthogonal; the candidate was therefore the same candidate submitted for review. **Disposition: REJECT.** The candidate **manufactures an unsupported opening association** — for the reproducer (same OCC contract) `Jul 3 STO 2 / Jul 10 BTC 2 / Jul 20 STO 2`, the backend correctly adjudicates the Jul 10 close `DETERMINISTIC_COMPLETE` with prior recognized outstanding `[2,2]`, but Product asserts `opened Jul 20` and exports `link_date=2026-07-20` — a **future** opening for an earlier close. Codex confirmed the negative specimen (unknown BTC quantity), known-quantity, nullable-consumer, and close-before-opening cases still pass; the candidate remained REJECTED solely for the unsupported opening association. The REJECT created **no** retry authority.
3. **Post-REJECT model validation (non-mutating).** The failure class was analyzed without touching the frozen candidate. Proposed distinction: **economic close certainty is not opening-identity certainty.**
4. **Codex independently falsified the model — core survives.** For this run Codex reported remote `main` `56210cc` and re-confirmed the 25-file candidate unchanged/unstaged. It inspected the candidate backend `OptionCloseResult` and confirmed the authoritative contract publishes executed debit, closed quantity, outstanding-before range, matched/residual ranges, excess, status, and reason — but does **not** establish a particular opening row, an opening date, or allocation among opening fills (the `contractKey` identifies the contract *series* only). Codex then constructed a **stronger falsifier**: same OCC contract `Jul 3 STO 1 / Jul 7 STO 2 / Jul 10 BTC 3`. In **both** CSV row orderings the backend produces the same authoritative result (`DETERMINISTIC_COMPLETE`, outstanding `[3,3]`, residual `[0,0]`), yet Product's singular opening association changes with input order (one ordering → Jul 3, reverse → Jul 7). **Both openings precede the close**, so a fix that merely filters candidate openings to dates before the close is **insufficient** — Product is converting arbitrary encounter/row order into semantic opening identity the backend never established. Four independent model probes (partial close without fill allocation; same-day ambiguity; unknown prior consumption; ADR-016 qualification) supported the model.

### Validated governing invariant (the model this attempt implements)

> **Product must not assert an opening-event relationship, allocation, or provenance that Production's authoritative association contract does not establish. Missing opening identity must not erase established close economics.**

Qualification: the prohibition concerns unsupported semantic specificity for the **same authoritative relationship**. ADR-016 still permits downstream derivation for a genuinely *different* domain purpose. Economic close certainty and specific opening identity are **separate claims**; deterministic close economics do not establish complete brokerage history, current-position retirement, or singular opening identity. Product may **omit** a singular opening relationship when Production does not establish one; alternatively Production may publish additional justified provenance *only* where its evidence actually establishes it. Neither requires durable lifecycle identity.

### Authorization state (2026-09-17, second)

- The Principal, presented with A (authorize one new bounded attempt against the validated model/failure class), B (keep frozen), C (stop), explicitly selected **A**.
- **Authorization granted:** exactly **ONE new bounded implementation attempt** against the validated invariant and failure class — not merely the Jul-20 counterexample.
- **Required falsifier:** the stronger multiple-prior-STO / order-independence specimen (reordering economically identical evidence must not change an asserted authoritative opening relationship when the authoritative Production result is unchanged).
- **Retry does not self-authorize:** a future Codex `REJECT` of the resulting candidate creates **no** further attempt authority; a further attempt requires a new, separately-recorded Principal authorization.
- **Scope exclusions preserved:** no durable lifecycle identity, no universal event-identity/association framework, no broad lifecycle reconstruction, no PL-PORT-02 work, no restoration of removed retirement machinery, no current-position retirement inference, no solving the separate In-Flight/current-position contradiction, no BUG-001/BUG-023 work, no unrelated Product changes. Do **not** change the `Closed · obligation retired` wording as part of this attempt.

### What this authorization does NOT record

- It does **not** claim the new implementation has occurred, does **not** populate remediation/verification as resolved, and does **not** change `Status` from `Open`.
- The frozen seventh-pass candidate remains an **uncommitted, Codex-REJECTED** candidate; its own "pending independent Codex review" wording above is **stale** relative to the later-supplied REJECT evidence and is left intact (not repaired) for provenance.
