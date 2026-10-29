# Independent shared-deadline successor review — 2026-10-29

**ACCEPT for the bounded transport correction** at immutable `a254c5a18478d6656218a83ecd039517e8391771`.

The preceding immutable review remains unchanged. The new helper establishes one monotonic default40sec resource budget at entry, before discovery, and passes only the remaining budget to Position/Construction requests. It refuses a subsequent resource hop after expiration. Discovery retains its default5sec individual timeout; explicit shorter overrides are shared across the operation. No financial, source-association, authorization, route or selection semantics change.

## Independent falsification

My own synthetic fetch/AbortSignal probes against the exact frozen helper passed:

- A cold5.5sec resource read succeeds beyond the original5sec premature cutoff.
- Two95ms detail hops under one150ms override abort within the shared budget, rather than receiving150ms each.
- A75ms discovery plus75ms resource under120ms aborts within120ms, proving discovery elapsed time reduces the resource allowance.
- Deliberately late discovery returning after an expired60ms budget starts no Position request.
- Deliberately late Position returning after that expired budget starts no Construction request. These late-return fixtures intentionally ignore abort to independently test the no-next-hop guard.
- Default discovery delayed5.5sec aborts at5sec and performs no resource read.

All six checks passed. Source uses performance.now, so wall-clock adjustments do not renew the budget. The default40sec shared read budget leaves nominal headroom beneath the enclosing45sec MCP timeout, resolving the prior default85sec detail sequence limitation. This is a cooperative I/O deadline, not a hard real-time CPU guarantee or proof the backend made no permitted retention after cancellation. Trusted explicit overrides are not capped by the helper; this acceptance establishes the default and tested shorter overrides, not arbitrary larger configurations.

Reproduce with `node /tmp/ww-shared-deadline-independent-evidence-20261029/probe.mjs`. Results: `checks.json` in that directory. Independent source: `/tmp/ww-independent-shared-deadline-20261029`. No author tests, provider, external model, private records, services or grant mutations were used. The source tree remained clean. No new full-suite or installed-runtime claim is made.

## Configuration/parity test design — source-only assessment

The existing bootstrap **replaces** the selected User's configured permissions; it is not an additive three-flag setter. Therefore a complete before/after field comparison for the User and every Account, including PTS/Sawdust, is the appropriate safeguard for the stated exact-three-additions operation. Merely observing the three desired flags would be insufficient. The existing controller independently requires Account Orders permission and both global plus Account-market permissions before their respective read-through. Process-wide enablement does not substitute for those Account checks.

The source defaults and freshness predicates support request-triggered Orders300s/market30s reuse: they compare the source import instant to an injected/current clock, require nonnegative age and strict age<reuse. The stated31sec/281sec/319sec/33sec observations are sensible boundary specimens, provided receipts track the same Account/subject cache keys, import/acquisition identities and clock origin. I did not inspect private configuration/diffs or independently verify those actual operational observations; this is test-design assessment, not configuration acceptance.

Comparing actual existing projectors on identical original inputs and evaluation time is a sound parity design. It must compare contracts/sides/quantities, source-qualified spot clocks and remaining DTE separately from opening occurrence, basis, payoff and management authority. Equal unknown clocks do not establish observation time. A CLI unique-Filled matching policy cannot replace a separately governed backend occurrence association merely to achieve visual parity. The reported unresolved backend opening and cash-coverage CONFLICT mean full financial parity remains unestablished. This review neither approves changing those financial dependencies nor certifies that every conflict is semantically correct; that would be a separate domain review.

Earlier source/privacy/financial qualifications remain. Principal Product acceptance, installed-state verification and operational authorization are separate from this transport disposition.

CURRENT STATE: Exact a254c5a1 independently accepted for the default shared monotonic resource deadline; configuration/parity discussion remains source-only design assessment.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable transport-acceptance evidence for commissioning-actor reconciliation.
