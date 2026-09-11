# BUG-004 — Console composes temporally incompatible evidence (stale contract Greek beside fresh underlying) into an apparently-coherent current position view

- **Status:** Open
- **Severity:** S2
- **Area:** Operator Console (evidence coherence / presentation)
- **Provenance:** GitHub Issue #9 (https://github.com/brooksbol/options-prototype/issues/9) — historical, non-authoritative. Created 2026-09-04. Labels: `defect`, `area:console`, `S2`.

## Observed failure

Wheelwright can present temporally incompatible market observations as though they form a coherent current description of a monitored position. In the observed EWY case, a nearly seven-day-old contract delta was displayed alongside current underlying-price / moneyness evidence, producing a materially misleading current-state representation of a live position.

This is an **observed production defect**, not a hypothetical product gap. Reproduced against the running production appliance on 2026-09-04.

## Intended semantics violated

Precisely scoped:

- **Not a defect:** stale evidence *existing* in the appliance. Retention is by design (failed refresh preserves successful evidence; sealed evidence remains valid).
- **Not (in itself) the defect logged here:** stale evidence remaining *eligible for use*. Eligibility policy is a separate concern with its own prior work.
- **The actual defect:** presenting temporally **incompatible** evidence *together* — an old contract greek beside fresh underlying evidence — **without making the lack of temporal coherence apparent to the operator**. The operator is shown a single, confident "current" picture that is internally incoherent.

## Evidence

### Empirical specimen (Sep 4, 2026) — Wheelwright Console, live

- Displayed the EWY **Sep 4 $185 call** with underlying ≈ **$185.26** and delta ≈ **0.33**.

Forensic trace (live investigation against the running system):

- Displayed delta traced to **0.3296**, sourced from the **Sep 4 $185 call chain acquired `2026-08-28T20:14:53Z`**, when that chain's underlying price was **$180.20**.
- Current Sep 4 quote evidence at investigation time was ≈ **$184.85–$185.26**.
- Result: ≈ **7 days** of temporal skew between the delta observation and the underlying-price observation, across ≈ **$5** of underlying movement.
- The **Sep 4 expiration was no longer actively maintained**; the actively maintained EWY primary chain was **Sep 25** (delta for the $185 strike on the fresh Sep 25 chain ≈ 0.5076, consistent with a near-ATM contract).
- The delta 0.3296 is **coherent with its own chain's underlying** ($180.20 → $185 strike is OTM) — the number is correct *for its moment*. The defect is that this moment was composed with a different, fresher moment for the underlying.

The frontend allowed the old Sep 4 contract greek to render beside fresh underlying evidence **without exposing the incompatibility**.

### Independent empirical corroboration (Fidelity)

Fidelity at 9:18 AM showed the same covered-call strategy: **100 EWY shares + short Sep 4 $185 call**.

- Fidelity **displayed** net strategy delta **42.66794**.
- With ≈ **+100** delta from the 100 shares, this implies ≈ **−57.33** strategy delta contribution from the short call, i.e. ≈ **+0.573** call delta before applying the short sign.
- **Derivation note:** the ≈ **0.573** call delta is a **derived value**, computed from the displayed net strategy delta minus the share delta. Fidelity did **not** directly display a 0.573 per-contract call delta.

This independent source places the true current call delta near **~0.57**, contradicting Wheelwright's displayed **~0.33** and confirming the displayed value was materially stale rather than merely imprecise.

### Provenance clarification (do not conflate)

The `"sandbox"` string observed in the frontend cache key was **separately proven** to be a historical frontend **namespace artifact**, not evidence that the greek came from the Tradier sandbox. The live acquisition authority and this chain's provenance are **production**. This is **not** part of this defect and must not be conflated with it.

## Consequence

An operator monitoring a live covered-call position was shown a per-contract delta that was materially wrong (~0.33 vs a true ~0.57) because two incompatible observations were composed into one apparently-current view, with no signal that the values did not share a moment. Delta is a primary risk descriptor; a materially misleading current delta on a held position is a major (S2) operator-facing consequence.

## Diagnosis / root cause

The frontend composes a contract greek and an underlying observation from different acquisition moments into one "current" view without a temporal-coherence signal.

## Scope / non-goals

Remediation is **not** authorized or prescribed here. Refreshing the expiration, age-gating greeks, suppressing stale values, joint provenance / coherence rules, or any other approach are design decisions for later.

## Acceptance criteria

Not separately enumerated beyond the scoped defect statement (remediation explicitly deferred).

## Remediation history

None.

## Verification

None.

## Related

- Temporal coherence between subsystems has prior context in `docs/35-evidence-decision-temporal-coherence.md` (Decision vs Evidence temporal consistency) — context only; this is **not** scheduler-policy work and creates no parking-lot item.
- Architecturally analogous (independent): `BUG-007`, `BUG-006`.
