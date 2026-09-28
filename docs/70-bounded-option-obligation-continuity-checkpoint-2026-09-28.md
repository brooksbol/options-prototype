# Bounded Option-Obligation Continuity — Evidence and Design Checkpoint

**Date:** September 28, 2026
**Status:** Reconciliation / checkpoint artifact (Category D). This document preserves why-state and candidate status; **ADR-022** is the ratified authority.
**Scope:** Existing short-option obligation membership in Assignment-Centric Wheel v1. No implementation authority.

## Authority and chronology

At checkpoint start, GitHub-advertised `main` and local `HEAD` were `8093caedf1d64a079c9a74f1b1b6e04570fb81d1`, with a clean tree. Gate Experiment 001 was `STAGED`, `experiment_started: false`, `mutation_permission: INACTIVE`. Doc 69 ratified Program/configuration and its narrow membership semantic; ADR-016/019/020/021 and Doc 67 governed association, replay, evidence roles, and predicate status. The Principal subsequently **ratified** the bounded whole-quantity cohort and conditional evidence-authority contract after model synthesis and independent bounded falsification. ADR-022 records that decision. This checkpoint does not ratify a technical Solution Design or authorize product implementation.

## Material evidence, not source guarantees

The directly inspected file was `~/Downloads/History_for_Account_Z39411514-72.csv` (the Principal's newer file, replacing the filename in the original investigation request). Its 13 headers are `Run Date`, `Action`, `Symbol`, `Description`, `Type`, `Price ($)`, `Quantity`, `Commission ($)`, `Fees ($)`, `Accrued Interest ($)`, `Amount ($)`, `Cash Balance ($)`, and `Settlement Date`. The observed action vocabulary includes 59 `YOU SOLD OPENING TRANSACTION`, 2 `YOU BOUGHT CLOSING TRANSACTION`, 42 `ASSIGNED`, and 36 `EXPIRED` rows, as well as one each of the opposite-side opening and closing actions. These counts describe this file, not all Fidelity exports. Its rows also include transfer actions. The file has no account column, durable broker order/event ID, or intraday timestamp in those headers. Account identity appears in the filename; an accepted account binding cannot be inferred solely from that string.

The export footer states `Date downloaded 09/26/2026 11:58 am`, while observed Run Dates extend to `09/28/2026`; 78 rows contain `as of` text in Action or Description. Run Date, economic effective date, settlement date, and download time cannot be collapsed. The CSV's explicit lifecycle vocabulary materially changes the prior evidence model: a complete accepted interval could distinguish STO → unchanged from STO → BTC → identical STO. A missing close can be evidence **only under a scoped accepted premise** that the relevant economic interval is complete through the Decision cut. The Principal supplied that premise conditionally; neither the file nor Fidelity is thereby universally certified complete.

The current `options-prototype/src/csv/fidelity/activityParser.ts` preserves raw rows and recognizes STO, BTC, assignment, and expiration, but exposes Run Date as `date`; `TRANSFER OF ASSETS` is classified as `cash_movement`, and option transfer/correction semantics are not established. The parser does not make a complete lifecycle ledger, deduplicate across exports, or establish History finality. These are ingestion/design gaps, not proof that the Fidelity source lacks the observed lifecycle semantics.

## Rejected old ATTACH claim

The implemented `POST /api/governed-context/attach` atomically persists a Context Version and association; this implementation fact remains true. Its covered-call subject is derived from `call-<underlying>-<strike>-<expiration>`. The prior claim that this is a **durable bounded obligation identity** was rejected at the model level:

- short 1 S → attach → BTC 1 S → identical STO 1 S → endpoint short 1 S: the reused series key incorrectly presents the replacement as attached;
- short 1 S → attach → another STO 1 S: aggregate short 2 S shares one subject key, while the association records no attached quantity or opening-cohort boundary.

Different same-symbol **series** minting different scopes did not test either counterexample. The older Kiro journal entry is historical implementation evidence, not current architectural validity. Legacy series-key associations are not automatically rebound to a cohort; historical writes remain records, while present bounded applicability is unproven. No patch, migration, or product implementation is authorized by this checkpoint.

## Model outcome and ratified boundary

The first verdict, `ONLY LABORATORY-SCALE SUBSET EXISTS`, was re-examined after the actual CSV supplied explicit lifecycle semantics. Under an accepted complete interval from an observed opening through a defined economic cut, the revised verdict was `USEFUL SAFE SUBSET EXISTS` without a broker position-instance ID. The synthesized model separates brokerage series, opaque governance identity, and economic continuity. An entire opening-anchored quantity `Q` can remain applicable when complete lifecycle evidence proves that no event reduced any of that original quantity and compatible endpoint state reconciles. A later same-series opening does not inherit; after governed and ungoverned openings mix, an ambiguous reduction fails closed. Known Q=2 → reduction 1 establishes an economic survivor but leaves residual membership semantics unratified.

Independent model falsification identified two refinements: completeness must cover **economic effective time and delayed postings**, not merely export/Run Date; and historical membership, economic survivor quantity, full-`Q` intact, and current applicability must be separate predicates. After bounded synthesis, independent falsification found no counterexample within the refined model's admitted evidence conditions. The Principal then chose **A — RATIFIED** for the bounded whole-quantity cohort and conditional evidence-authority contract. ADR-022 is the canonical decision; partial attachment/residual membership and any particular export's admissibility remain outside it.

## First bounded Solution Design candidate — unratified and independently rejected

The candidate proposed immutable recoverable History and endpoint artifacts in the existing Java/SQLite boundary; a separate scoped completeness assertion; one accepted complete-history ledger version per Decision with explicit supersession; an opening-evidence-anchored opaque cohort record; a single derived reconciliation claim; endpoint position reconciliation; and replay-bound references/values. It would not move deterministic DECIDE solely for durability. It also proposed that old series-key associations remain historical but never silently map to new cohorts. These are **candidate technical choices**, not ADR-022 authority.

Independent Solution Design falsification **REJECTED the candidate as incomplete**, while leaving ADR-022 intact. Counterexample: a complete raw History contains an option transfer out ending the original account-local obligation and a later same-series transfer in; final short quantity remains one. If normalization treats both rows as generic cash movement, the lifecycle balance and endpoint both appear unchanged, producing a false continuity claim despite source completeness. Paired omitted effects can net to zero, so endpoint reconciliation cannot detect them. The candidate did not define an enforceable raw-row semantic-admission gate for every potentially option-affecting row. It also did not establish how an economic event cut (rather than Run Date), a compatible endpoint as-of cut (rather than download time), and a single accountable owner/consumer path become authoritative. Those are bounded **design** gaps, not another reason to repeat model synthesis or ask the Principal for a Product decision.

## Exact resume state

**Accepted Product/architecture authority:** Doc 69 and ADR-022, constrained by ADR-016/019/020/021 and Doc 67. The Principal ratified whole-quantity opening-anchored membership only under the scoped conditional evidence-authority contract. No specific History artifact or completeness assertion has been admitted for a Decision.

**Rejected:** old series-key identity as bounded obligation; first bounded Solution Design candidate as an adequate evidence-admission/temporal-cut/ownership contract. The prior implementation remains present in code but does not satisfy ADR-022.

**Next read-only design task:** bounded Solution Design synthesis of (1) exhaustive semantic admission of potentially relevant raw History rows, including paired net-zero changes; (2) economic event and endpoint cut proof; and (3) one authoritative reconciliation owner and actual Decision consumer path. Independently falsify that revised design before any architecture acceptance or implementation handoff. Do not reopen the ratified model absent new decision-relevant evidence, infer Principal ratification of technical design, issue a Kiro prompt, or mutate product code.
