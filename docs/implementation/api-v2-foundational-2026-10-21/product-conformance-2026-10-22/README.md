# Independent Kiro verification handoff — F1/F2/F4–F6

This is author implementation evidence, not a Kiro report or Product acceptance. Review the isolated correction commit against base8bd75f5700a2cee39b7a9edb5e685c2d5a365312 (accepted underlying backendb48e3c6). Obtain the exact commit with `git log -1` on branch `codex/api-v2-product-conformance-correction-2026-10-22`; do not review a moving root checkout. Full report: [verification.md](verification.md); task/authorization: [STATE.md](STATE.md). No original Kiro probe artifact is claimed; tests here are newly constructed.

Preserve root Muse/MCP/v1 work and existing port3101 service. No financial API calls to the deployed backend, live brokerage acquisition, source data copy, restart, publication, release-metadata refresh, merge or push. Run deterministic tests in a separate clean reviewer worktree, with synthetic/loopback sources only. Do not overlap Gradle processes in one tree. Dependencies are pinned by existing tooling; author reused an existing Python environment and ran npm ci for documentation tools only.

## Reproduce

`python` below means an existing interpreter with tools/api-docs/requirements.txt dependencies. Author used `/Users/bollich/kiro/options-candidates/api-v2-integration-deployment-2026-10-22/tools/api-docs/.venv/bin/python`. All commands run from the candidate repository root.

```sh
./evidence-service-java/gradlew -p evidence-service-java test --console=plain
python scripts/v2-oas-conformance-test.py
python docs/implementation/api-v2-foundational-2026-10-21/validate-runtime-responses.py
python docs/implementation/api-v2-foundational-2026-10-21/operative-contract-test.py
python docs/implementation/api-v2-foundational-2026-10-21/entry-corrections-test.py
python docs/implementation/api-v2-foundational-2026-10-21/r1-r2/verify-contract.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py
python docs/implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/derive-examples.py
python docs/implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verify-corrections.py
node docs/implementation/api-v2-foundational-2026-10-21/verify-mark-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-session-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-management-parity.mjs
python tools/api-docs/build.py
python tools/api-docs/validate.py
node tools/api-docs/human-specimen.mjs
```

The first command generates fresh runtime captures plus `build/product-conformance/{complexity,reconciliation-query-plan,routing-probes}.json` and source-derived HTTP examples. For targeted iteration use tests `PortfolioCollectionCorrectionTest`, `PortfolioPageAcquisitionTest`, `PortfolioDocumentationExamplesTest`, plus existing R1/R2/financial/security suites. The complete997-check result must not be inferred from only those focused tests. Frozen docs examples are intentionally not overwritten by random new GUIDs/receipt clocks; `derive-examples.py --promote` is the explicit author regeneration step and mutates annotations, so do not invoke it as a read-only verifier.

## Falsifiers worth challenging

- Two retained custody cuts with the same contract must not both appear as current. Authorized Accounts choose their own latest cuts. Partial/failed/empty must stay distinct. Explicit historical snapshot still resolves, catalog discovers it. Current continuation after a changed source cut must422; no temporal mixing, deletion or unauthorized count/link exposure.
-10/100/1000 grids × pages5/20 × default/expanded must expand exactly the page, not the whole Account; SQL counts/query plan and timings supplement this. One global invariant remains, not page-local coverage. Cold source admission is separate membership work and reused, not a constant-time promise. Challenge source-input invalidation, new options/reference evidence, and Account scope without disabling correct read-through.
- Mock provider request sets must be5/5disjoint/20 for first/different/expanded pages, with zero extra request on repeated page and zero for unprivileged reader. Orders membership scan is an explicitly bounded policy exception; new source Orders must remain discoverable.
- Inspect public operation-specific text, synthetic Condor terminal VALUE versus unknown opening P/L, working closing scope, coverage100/200, incomplete simple Position, source date/DTE/freshness and current75 versus historic100shares. Verify the strict schema and independent arithmetic assertions, not a manually copied expected file. Public Account evidence must remain redacted.
- Unknown v2 route/method through real Spring dispatch must use problem+json, exact status/code/correlation and405Allow; missing/invalid token and malformed correlation remain fail-closed. Legacy `/api` error remains outside the resolver. Market-private/quote grant metadata must match real runtime checks; no grant instruction leaks in public projection.
- Source-backed membership, terminal closure safeguards, immutable Models/Constructions, immediate predecessors, signed amounts, multiplier, Broken-Wing geometry, original/current/cumulative economics and Order-derived redaction must remain intact.

Inspect both `tools/api-docs/dist/private/desktop.png` and `mobile-position.png` after native transitions settle, alongside mobile overview and browser/network report. Static preview only; unchanged release.json intentionally does not accept the new bytes. Two-file public allowlist must remain exact and repeated builds byte-identical. The candidate will require controlled integration/combined-source tests/publication identity refresh only after your independent verdict. Do not treat this handoff as deployment authorization.

## Reserved decisions / expected verdict

F3 remains a separate Product question: admissible OPEN/CLOSED authority and classification of evidence-only exposure changes. No opening/closure/continuity inferred by this correction. CSP conservatism and maintained Position/ASSIM0002 reconciliation were classified, not changed. Do not demand invented lifecycle policy as a condition of this bounded fix.

Return findings against the exact candidate hash, independently reproduced commands/outcomes, residual defects and an explicit ACCEPT/ACCEPT WITH FINDINGS/REJECT. Author tests, schema counts and preview browser checks are not independent acceptance. No Principal judgment is presently required to complete this correction; independent verification is the next action.
