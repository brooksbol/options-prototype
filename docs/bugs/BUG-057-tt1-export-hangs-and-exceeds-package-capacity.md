# BUG-057 — TT1 export hangs and exceeds package capacity

- **Status:** Open
- **Severity:** Not established
- **Area:** CLI / TT1 cadence export
- **Provenance:** Principal report, November 3, 2026: `ww export tt1-cadence` hangs, then prints `ww: Export helper failed`.

## Observed failure

Installed release `operational-20261030-afe50e50` waited in its standalone broker helper. No new ZIP was published by the reported invocation. Instrumented reproduction established two independent obstacles to publication.

## Intended semantics violated

The bounded one-shot export must return after collection and publish all six verified evidence members atomically. Supported ordinary daily evidence must not fail merely because pretty-printing and repeated provenance exceed an undersized serialization bound.

## Evidence and diagnosis

- A dedicated diagnostic received the complete broker JSON (6,298,823 bytes) after approximately 47 seconds, but the helper remained alive. Its market-data connection was still open. The outer helper waits for process close, not merely receipt of valid JSON.
- The pretty-printed market component was 130,581,489 bytes, exceeding the Python writer's 64 MiB component limit and contributing to a package above its 100 MiB input limit. Python stderr is suppressed by the caller, exposing only `Export helper failed`.
- Compact serialization in a subsequent real run still produced an 89,338,354-byte market component, so removing whitespace alone does not resolve the component limit.
- A synthetic child-process regression deliberately keeps a read resource alive. The installed helper emits complete JSON but times out after three seconds; the corrected helper flushes the result and exits successfully.

## Consequence

The operator cannot obtain the daily evidence ZIP despite successful broker reads. Socket shutdown and package-capacity failures are obscured by a generic helper error.

## Scope / non-goals

Repair only dedicated helper lifetime and lossless package serialization/capacity. Preserve all observations, existing financial calculations, independent Greek-time qualification, request budgets, six-member inventory, hashes, atomic no-clobber publication and credential custody. No v2/Talk/service, provider policy, grant, order or credential changes.

## Acceptance criteria

The one-shot helper flushes complete output before exiting even if a read socket lingers. A component above the former 64 MiB bound publishes without truncation inside explicit new bounds. Six members, CRCs, payload lengths/hashes and 0600 permissions verify. The ordinary installed command must be verified after authorized installation; tests do not establish Principal acceptance.

## Remediation history

Repair prepared in `codex/tt1-export-hang-20261103`, based on exporter delivery `4b05ba7a`. The active Talk checkout and installed release remain unchanged. On November 3 the Principal directed: “push without independent review.” This authorizes persistence of this tested repair and explicitly waives independent review for this submission; installation is not claimed. Helper CLI exits only after its stdout write callback. JSON payloads use compact serialization with the same parsed values. Publication remains bounded at 128 MiB per component and 256 MiB input.

## Verification

31 focused tests and 44 existing Account/fetch/standalone CLI compatibility tests passed; one private historical-specimen test skipped because its external fixture was unavailable. Tests include full child-process shutdown with lingering resources, a real ZIP above 64 MiB, atomic failure/collision behavior, source/financial preservation and existing market/Greek deadline qualification.

The candidate generated `~/Downloads/tt1-cadence-2026-11-03.zip` (3,873,041 bytes); all six members/CRCs, five payload hashes/lengths and 0600 permissions passed. Independent Greek coverage was partial in that observation; candidates remained excluded rather than borrowing REST timestamps. No claim of current trade readiness, independent review, installed repair or Principal acceptance.

## Related

`docs/cli/tt1-market-freshness-2026-10-30.md`; `docs/cli/ww-export-tt1-cadence.md`. BUG-056 already exists on accepted main and is unrelated; this isolated exporter branch predates its filing.
