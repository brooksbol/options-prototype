# Independent final bounded tactical re-review — 2026-10-29

**Disposition: ACCEPT for the bounded tactical correction at immutable `e88708959c8899327ee6f19a25121635fa40295c`.** The previously demonstrated vertical range/region availability gap is resolved. This is independent engineering/financial-semantic acceptance within the reviewed source scope, not installation, full real-profile parity or Principal Product acceptance. Later attachment/CSV work is excluded and requires its separate review.

The preceding f524 qualification report remains unchanged in this candidate: SHA-256 `f108c5ed53b0b008bbbf63190cf01a597ea04a2e2741c290734ed7671380f91e`. Earlier e163 rejection and financial qualifications remain preserved; this report does not rewrite their historical dispositions.

## Independent findings

The sole production delta from f524 is in the existing PortfolioMath range selector. When the prior selector finds no range, it now accepts exactly three segments with flat first/last tails, a nonzero middle transition and two flat tails; it selects the unique greater flat intercept. Existing unique-interior/sole-flat handling retains precedence. All geometry comes from the same backend evaluator with compatible units/currency. This is a maximum contractual half-line, independent of whether opening basis is known; it does not establish positive profit, entry credit, collateral, governance or a recommendation.

My preserved independent actual-evaluation probes now pass:

- Bull put LONG90put/SHORT95put: qualified maximum lower half-line beginning95; spots85/92/100 classify ADVERSE_TAIL/TRANSITION/NEUTRAL_PLATEAU.
- Bear call SHORT105call/LONG110call: qualified maximum upper half-line through105; spots100/107/115 classify NEUTRAL_PLATEAU/TRANSITION/ADVERSE_TAIL.
- Removing attributed basis preserves terminal-value geometry and correctly classified adverse regions for both vertical directions, without asserting P/L.
- Reversing the put vertical selects the opposite contractual maximum through90. Model recognition is absent from these synthetic evaluation inputs: supported mathematical geometry is not silently promoted into named package membership.
- The earlier inverse condor still has supported gross geometry but UNAVAILABLE region interpretation. Ordinary condor center/tail behavior remains correct, including terminal-value geometry.
- Redacted or foreign-currency spot stays unavailable. Independent vertical-recognition membership/quantity/Account/expiration negatives remain effective.

The earlier fixes also remain intact: null exposure and null-status exposure are omitted from the compact DTO; Account-scoped SQL missing/null/recorded monitoring membership is applied before limit/lookahead; and my separate actual-controller orchestration probe verifies that post-Order new membership reaches Market selection before response expansion. Renderer probes still distinguish terminal value from P/L and enforce money/currency/day dimensions for exit/timeline displays.

These are independent probes, not the author's new test rerun. Assertions over the stored independent receipts passed. No new failing financial-semantic or representation counterexample was established in this bounded delta.

## Reproduction and evidence

Detached exact source, clean tree: `/tmp/ww-independent-tactical-final-20261029`.
Independent harness/evidence: `/tmp/ww-tactical-independent-final-evidence-20261029/`.

```sh
python3 /tmp/ww-tactical-independent-final-evidence-20261029/run.py
```

`Probe.java` builds complete synthetic constructions and invokes actual PortfolioMath.evaluate/spotRegion, actual PortfolioTactical.project and actual repository SQL. `ControllerProbe.java` invokes the real controller with deliberately changing mocked admission boundaries; this is an orchestration falsifier, not a real-provider simulation. `render_probe.mjs` checks actual native renderer dimensional behavior.

The harness compiles the exact candidate PortfolioMath/Controller/Tactical sources into its own output directory. Unchanged supporting classes/dependencies come from the independently built frozen f524 worktree; the production diff was verified to contain only the Math change above. This is an incremental-source compilation check, not a new full-suite run. Local classpath/probe files record reproduction details. Receipts are `java-checks.json`, `controller-checks.json`, `renderer-checks.json`.

All fixture records and amounts are invented. No protected records, external models, provider acquisition, source mutation, grants or installed services were used or changed. Prior limitations remain: no complete monthly/portfolio accounting claim, no unrestricted live Orders/market profile, no three-structure real same-cut parity or Principal visual acceptance, no full authorization audit, and no extension of the renderer beyond its declared geometry support. Canonical details remain the route to expanded component provenance; per-component clocks must not be confused with evaluation time.

CURRENT STATE: Exact e8870895 independently accepted for the bounded tactical financial/representation corrections; operational and Principal acceptance remain separate.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the immutable acceptance evidence for commissioning-actor reconciliation.
