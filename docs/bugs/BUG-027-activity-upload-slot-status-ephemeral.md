# BUG-027 — Header Activity upload slot reverts to empty ("— ⬆") on remount despite durably-persisted Activity evidence, misrepresenting loaded state

- **Status:** Resolved
- **Severity:** Not established
- **Area:** Application Shell / Portfolio dropdown upload status (`options-prototype/src/components/FidelityUploadCompact.tsx`)
- **Provenance:** Discovered 2026-09-24 during read-only investigation of the URA incident. The Activity slot displaying "—" with the upload arrow was one of three contradicting observations that motivated the investigation. Remediated 2026-09-24.

## Observed failure

In the Portfolio dropdown's compact upload control, after an Activity CSV has been uploaded and durably persisted:

- **Option Summary** shows a checkmark + filename (loaded).
- **Balances** shows a checkmark + filename (loaded).
- **Activity** shows `—` and the upload (`⬆`) affordance, as though no Activity CSV were loaded.

This occurs even though the Activity evidence **is** persisted for the active account and **is** re-applied to the snapshot on load. The `— ⬆` indicator therefore does not faithfully represent whether Activity evidence is present.

## Intended semantics violated

The upload control is described in-code as reflecting "the active account's already-loaded evidence (from store hydration) as slot status on mount, so reopening the panel shows the current account's files." Activity is account-local durable evidence on equal footing with Option Summary and Balances for display purposes. The slot indicator should reflect persisted state consistently across all three slots; it must not report Activity as absent when it is present.

## Evidence

Code trace, current `main` **[established diagnosis]**:

1. Activity evidence is durably persisted per account and re-applied on load:
   - `options-prototype/src/portfolio/portfolio-store.ts` `loadActiveAccountSnapshot()` reads `readAccountCsv(activeId, "activity")`, parses it into `currentActivityRows`, and calls `applyActivityProjection()`. Hydration and account switch both traverse this path.

2. But `FidelityUploadCompact`'s mount effect reconstructs **only** the Option Summary and Balances slots from snapshot provenance — there is no Activity reconstruction:
   ```ts
   useEffect(() => {
     const snap = getSnapshot();
     if (snap && snap.source.type === "fidelity") {
       const osName = snap.provenance.optionSummaryFilename;
       const balName = snap.provenance.balancesFilename;
       if (osName) setOsSlot({ status: "loaded", ... });
       if (balName) setBalSlot({ status: "loaded", ... });
       // no actSlot reconstruction
     }
   }, []);
   ```

3. The Activity slot (`actSlot`) becomes `"loaded"` **only** inside `handleActFile()` — i.e. only within the lifetime of the component instance that processed the upload. On remount (reopening the dropdown, navigation, re-render that unmounts the control), `actSlot` re-initializes to `{ status: "empty" }`, and `UploadRow` renders `—` plus the `⬆` button for the empty state.

Consequence for diagnosis: the `— ⬆` indicator is **ephemeral component state**, not a projection of persisted evidence. It cannot be used as evidence that Activity is absent.

## Consequence

Operator-facing status misrepresentation: a loaded, active Activity CSV is shown as not loaded after any remount. This is a presentation/cognitive-correctness defect (no economic miscalculation by itself), but it actively misled incident interpretation by suggesting the Activity upload had failed when it had not. Severity **Not established** pending Principal decision.

## Diagnosis / root cause

Asymmetric slot reconstruction: Option Summary and Balances slot status is derived from durable snapshot provenance on mount; Activity slot status is not. Activity's loaded indicator lives only in transient component state seeded by the upload handler.

Note: the Activity slot is genuinely different from the other two in that the snapshot `provenance` object exposes `optionSummaryFilename` / `balancesFilename` but no equivalent activity filename field. Reconstructing the Activity slot therefore requires reading account-local Activity evidence (e.g. via the store's account activity accessor) rather than snapshot provenance alone — this is a remediation-design consideration, recorded here only to bound the fix.

## Scope / non-goals

**Filing only. This record does not authorize remediation.**

Non-goals:
- Do not change Activity persistence or the projection path (they work correctly).
- Do not alter Option Summary / Balances slot behavior.
- Independent of BUG-026 and BUG-023; do not fold this into either.

## Acceptance criteria

Direction (not an implementation prescription):

- On mount with a persisted Activity CSV for the active account, the Activity slot reflects loaded status (and, where available, the filename) — consistent with Option Summary and Balances.
- Switching accounts updates the Activity slot to the newly-active account's Activity state (loaded or empty), never leaking the prior account's state.
- No account with no Activity evidence is shown as loaded.
- Coverage exercises remount/reopen of the control against persisted account evidence (the live status-reconstruction path), not only the in-session upload handler.

## Remediation history

**2026-09-24 — Resolved.** `options-prototype/src/components/FidelityUploadCompact.tsx` mount effect now reconstructs the Activity slot from the active account's persisted evidence via the store accessor `getActivityFilename()` (and the Positions slot via the new `getPositionsFilename()`), alongside the existing Option Summary / Balances reconstruction from snapshot provenance. Activity and Positions have no snapshot-provenance filename of their own, so they are read from account-local persisted evidence through the store's account-aware accessors (`options-prototype/src/portfolio/portfolio-store.ts`) rather than a component-local shadow store. On remount, a durably-persisted Activity/Positions file now shows the loaded checkmark + filename instead of reverting to the empty "— ⬆" state.

## Verification

- `options-prototype/tests/components/FidelityUploadCompact.test.tsx` — persisted Activity survives remount (Activity row shows loaded checkmark + filename, not empty); no persisted Activity → Activity row remains empty/upload state; the existing account-aware live-path test remains green with the added Positions slot (four upload rows).
- Account-switch isolation is provided by the store accessors, which read the active account's own per-account slot (`readAccountCsv(activeId, "activity"|"positions")`); switching accounts reflects the selected account's own evidence and never leaks another account's state.
- No new evidence store or component-local shadow authority was introduced.

## Related

- **BUG-026** (Resolved) — the ownership-derivation defect that caused the URA warning in the same incident. Independent of this display defect; both were surfaced and remediated together. The Positions upload slot added for BUG-026/ADR-020 is reconstructed by the same mechanism as the Activity slot fixed here.
- Not a `PL-*` item (defect, not a capability).
