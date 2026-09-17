# BUG-023 — Activity overlay can double-count direct-share-sale proceeds into Deployable when the projection checkpoint (Option Summary timestamp) predates the Balances export that already reflects the sale

- **Status:** Open
- **Severity:** Not established
- **Area:** Portfolio state / Activity projection ↔ broker-balance reconciliation (`options-prototype/src/portfolio/activity-projection.ts`, checkpoint sourced in `options-prototype/src/portfolio/portfolio-store.ts`; Deployable sourced in `options-prototype/src/write-desk/fidelity-snapshot.ts`)
- **Provenance:** Discovered 2026-09-17 during BUG-022 remediation (Codex review + Kiro read-only investigation). Not previously filed; confirmed not covered by an existing BUG record (see Related).

## Observed failure

Wheelwright can overstate `Deployable` when a `shares_sold_direct` Activity event is projected onto a Fidelity Balances-derived `deployableCash` that **already** reflects the sale proceeds. The Activity projection adds the proceeds a second time.

## Intended semantics violated

The overlay contract is: **authoritative checkpoint + subsequent executed Activity = current state** — where "subsequent" must mean *not already reflected in the authoritative broker evidence being projected onto*. `Deployable` is a broker-authoritative capacity figure. Post-balance Activity may legitimately adjust it, but Activity that the Balances snapshot **already incorporates** must not be re-applied. The current implementation reconciles Activity against the **Option Summary** checkpoint while `Deployable` is sourced from the **Balances** export — two independent timestamps — so cash proceeds can be counted twice.

## Evidence

Epistemic tags: **[established diagnosis]** = confirmed by reading committed code on `main`; **[reproduced]** = demonstrated by a synthetic falsifier; **[observed]** = seen in a real export.

Implementation path, current `main` (`46132f7`): **[established diagnosis]**

1. **Deployable originates from the Balances CSV.** `options-prototype/src/write-desk/fidelity-snapshot.ts:65`:
   ```ts
   const deployableCash = deriveDeployableCash(input.balances);
   ```
   (`input.balances` is parsed from the Fidelity **Balances** export; `deriveDeployableCash` returns the regime-appropriate broker figure per BUG-022.)

2. **The projection checkpoint is the Option Summary timestamp, not the Balances timestamp.** `options-prototype/src/portfolio/portfolio-store.ts:265-266`:
   ```ts
   const checkpointDate = currentSnapshot.provenance?.optionSummaryExportTimestamp ?? null;
   const checkpoint = parseCheckpoint(checkpointDate);
   ```
   passed into `projectActivityOverlay(...)` at `portfolio-store.ts:268`.

3. **Event inclusion is gated against that Option Summary checkpoint.** `options-prototype/src/portfolio/activity-projection.ts:389`:
   ```ts
   const postCheckpoint = activityRows.filter(row => isAfterCheckpoint(row, checkpointTimestamp, precision));
   ```
   (`isAfterCheckpoint` defined at `activity-projection.ts:130`.)

4. **The `shares_sold_direct` case adds proceeds directly to Deployable.** `options-prototype/src/portfolio/activity-projection.ts:553` (case) and `:573` (mutation):
   ```ts
   case "shares_sold_direct": {
     // ...
     const proceeds = Math.abs(row.amount ?? 0);
     // ... inventory removal ...
     if (deployableCash != null) {
       deployableCash += proceeds;   // line 573
     }
   }
   ```

Temporal contradiction (the defect mechanism): **[established diagnosis]**

- The Option Summary checkpoint can be **older** than the Balances export.
- A `shares_sold_direct` event dated **after** the Option Summary checkpoint but **at or before** the Balances export passes the `isAfterCheckpoint` gate (which only knows the Option Summary time) and is projected.
- But the newer Balances export already reflects that sale's cash impact — the parser comment at `activity-projection.ts` (the `cash_movement` default case) even asserts "The Balances CSV already reflects all same-day cash impacts."
- Net effect: the same proceeds are counted once by the Balances-derived `deployableCash` and again by the `shares_sold_direct` mutation.

Reproduced falsifier (mechanism, not a live-account trace): **[reproduced]**
- Base snapshot with Balances-derived `deployableCash = $0` and an inventory position for the sold symbol.
- One `shares_sold_direct` Activity event, dated after the Option Summary `quoteDate` but on/before the Balances export, with `amount ≈ $5,000` proceeds.
- Projected `deployableCash` becomes ≈ **$5,000** — even though a Balances export taken after the sale would already include those proceeds (i.e. base should have been ≈ $5,000 and projection should add $0). Base `$0` → projected `$5,000` is the double-count signature.

Note on epistemic status: the *mechanism* is established from code and reproducible synthetically. Whether a specific real import currently exhibits it depends on the actual relative timestamps of the operator's two exports; a live specimen with an Option-Summary-older-than-Balances pairing and an intervening direct sale would upgrade this from mechanism to observed instance.

## Consequence

Overstated `Deployable` inflates put-writing/CSP sizing capacity — an outcome-bearing figure. The magnitude equals the double-counted direct-sale proceeds for sales falling in the checkpoint/Balances timestamp gap. Severity is left **Not established** pending a Principal decision (per `docs/bugs/README.md`); consequence is a materially overstated capacity figure in a specific timestamp-ordering condition.

## Diagnosis / root cause

**Temporal-reconciliation mismatch between two independent broker exports.** Activity inclusion is gated by the Option Summary checkpoint, but the cash figure it mutates (`deployableCash`) is sourced from the Balances export. When the Balances export is newer than the Option Summary checkpoint, cash-affecting Activity in the gap is already reflected in Balances yet still projected, double-counting proceeds. This is distinct from BUG-022 (which was incorrect *interpretation* of Balance fields across cash vs margin regimes); BUG-023 is about *when* Activity should be applied to broker cash evidence.

## Scope / non-goals

**Filing only. This record does not authorize remediation.**

Non-goals:
- Do not design or implement a fix.
- Do not change Activity projection behavior.
- Do not alter BUG-022 or its remediation.
- Do not touch the parked BUG-021 candidate.
- Do not start or modify Gate Experiment 001.
- No unrelated cleanup.

## Acceptance criteria

Direction (not an implementation prescription): an eventual fix should **prevent double-counting of broker cash impacts already reflected in the Balances evidence while preserving legitimate projection of genuinely post-Balance Activity.** Concretely, the eventual remediation should establish acceptance that:

- Cash-affecting Activity (at minimum `shares_sold_direct`) already incorporated in the Balances-derived `deployableCash` is **not** re-applied.
- Genuinely post-Balance cash Activity **is** still reflected (no regression to under-counting).
- The reconciliation uses a checkpoint appropriate to the cash evidence being mutated (i.e. cash mutations reconcile against the Balances provenance, not solely the Option Summary quoteDate), or an equivalent mechanism that removes the timestamp mismatch.
- A falsifier of the double-count (base `$0` → projected `$0` when the sale is already in Balances) and a guard of legitimate projection (post-Balance sale still adds proceeds) are both covered by tests.

The specific mechanism (dual checkpoints, per-event provenance, Balances-timestamp gating, etc.) is intentionally left to remediation design.

## Remediation history

_(empty — Open)_

## Verification

_(empty — Open)_

## Related

- **BUG-022** (Resolved 2026-09-17) — regime-aware Deployable field *interpretation*. Same output figure (`Deployable`), different root cause. BUG-023 was surfaced during BUG-022 remediation and deliberately kept separate.
- **BUG-001** (Open) — Activity overlay assigned-call closure / called-away disposition. Its acceptance criteria mention deployable-cash "without double-counting" only as an **acceptance constraint**, and its sibling note concerns `assigned` / `shares_sold_assignment` / `buy_to_close` / `expired` *fall-through* (missing mutations). Neither is the `shares_sold_direct` cash double-count mechanism described here. This is a distinct defect identity, not covered by BUG-001.
- Not a `PL-*` item (defect, not a capability).
