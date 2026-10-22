# Independent Kiro R1/R2 verification handoff

Review the **containing correction commit**, branch `codex/api-v2-r1-r2-correction-2026-10-22`, worktree `/Users/bollich/kiro/options-candidates/api-v2-r1-r2-correction-2026-10-22`. Resolve/freeze exact SHA with `git rev-parse HEAD`; final Principal report supplies it. Compare `b27971d80a0cd3e4a8db371763acbffb3e1acd30..HEAD`. Baseline b279 and detached a2 review, native source fixtures, KiroProbe and all original candidate commits are preserved. Do not review this package as its own Product authority.

Bootstrap normally from AGENTS/authority. Read verification.md, correction-ledger.md, evidence-map.md and reconciliation.md. Independently challenge the actual source predicates, especially:

1. Current explicit broker closing-instruction scope plus unique compatible observed holdings supports **qualified current financial composition**, without proving opening occurrence or managed Program membership. Test exact native source IDs, Account, quantities, directions, terms/Model constraints and source capability grants. Geometry alone and multiple candidates must refuse.
2. Later source-backed package evidence may supersede raw provisional one-leaf fallback interpretations, retaining GUID/history and successor navigation; it must never silently merge established packages or select among ambiguous occurrences.
3. CoveredCall/CSP aggregate coverage must not claim tax lots, reservations or unrestricted buying power; competing calls propagate insufficient coverage. BuyWrite source formation is not proved by the supplied native fixture. Do not mistake its Model predicate test for source acceptance.
4. Current quantity/change/zero/complete absence differs from lifecycle state. Incomplete/failed source must preserve prior evidence without pricing stale quantity as current. Scoped CLOSED stays terminal; identical series later gets a new GUID. Check retained immutable predecessors and historical sources directly.
5. Current-scope closing association may be a node subset; partial reported fills must not change holdings. Historical opening cannot follow a GUID into a new C without exact scope. Old active-status Order absent from latest scan is unconfirmed, not invented cancellation/fill.
6. New source associations/recognition must not leak through Position-only summary/expanded, source refs, history, clocks, Order-derived money or foreign-Account links.

Commands from worktree root, sequential Gradle only:

```sh
./evidence-service-java/gradlew -p evidence-service-java test --console=plain
python docs/implementation/api-v2-foundational-2026-10-21/validate-runtime-responses.py
python scripts/v2-oas-conformance-test.py
python docs/implementation/api-v2-foundational-2026-10-21/operative-contract-test.py
python docs/implementation/api-v2-foundational-2026-10-21/r1-r2/verify-contract.py
python docs/implementation/api-v2-foundational-2026-10-21/entry-corrections-test.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py
node docs/implementation/api-v2-foundational-2026-10-21/verify-mark-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-session-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-management-parity.mjs
```

Python uses already-present jsonschema, referencing, YAML and OpenAPI validation dependencies. Author used the preexisting `pl-cli-01-capital-history/private/verify-env/bin/python`; no install authorized/performed. Clear only generated `evidence-service-java/build/portfolio-responses/*.json` before an intentionally fresh capture run, not source fixtures. Do not overlap Gradle builds or mix XML totals across targeted runs. Header checking applies to captures that include HTTP headers; emitted payload count is not route/authorization coverage.

`PortfolioSourcePackageTest` reads actual native sanitized fixtures and admits a declared synthetic compact-reference supplement via the production decoder. Mutated scenarios are explicit new falsifiers, not live broker results. `PortfolioCurrentExposureTest`, `PortfolioContinuityTest` and `PortfolioOrderEvaluationTest` supply deterministic R2/identity/origin guards. Existing financial/auth/source/transport suites remain in the full run.

Unchanged prior Kiro Java probe was compiled/run by Codex against this successor (temporary SQLite/loopback, no live contact): `results/kiro-probe-author-rerun.log`. E4 retained GUIDs; E5 now displays/allocates200 shares; E6 retains200 rather than older300; E3 remains403, T1/T2 redaction remains. This is **author execution of independent-authored probes**, not independent successor verification. Original16 historical inputs and full Kiro report remain unavailable. No claim of their reproduction.

Return source-backed disposition of R1/R2, concrete residual counterexamples and acceptance recommendation. Principal backend acceptance remains withheld until independent verification and Principal disposition. No ww live, push/merge/deploy or live brokerage access is authorized by this handoff.
