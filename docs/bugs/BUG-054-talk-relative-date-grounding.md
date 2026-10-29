# BUG-054 — Talk relative dates lack trusted per-turn calendar context

- **Status:** Open
- **Severity:** Not established
- **Area:** Installed SDK Talk / temporal context
- **Provenance:** Principal's October 29, 2026 production incident and remediation assignment

## Observed failure
On October 29 the Principal reported fresh installed answers treating “today” as October 27 and “this month” as ending October 27. The retained source dates were older than the operator date. These are operator-reported incidents, not a recovered provider-request trace.

## Intended semantics violated
Operator-relative calendar dates must come from the current clock in an explicit applicable timezone, never the last brokerage observation. Source, execution, receipt and conversation clocks are distinct.

## Evidence
[October 29 remediation receipt](../reviews/sdk-talk-temporal-executions-remediation-2026-10-29.md). Controlled-clock T1–T5 specimens live in `tools/talk/test/temporal-context.test.mjs`; backend interval specimens live in `TransactionExecutionsTest.java`.

## Consequence
Wrong requested periods can omit executions and make historical coverage look like current operational evidence.

## Diagnosis / root cause
The installed pre-correction SDK instructions/run context supplied no trusted current clock. The host clock was October 29; no hardcoded October 27 date was found in runtime instructions. Stale-history/source anchoring is a plausible explanation for the model's particular date, not an independently established internal model trace. Missing temporal grounding is the demonstrated implementation defect.

## Scope / non-goals
Fresh trusted runtime calendar metadata for every SDK turn, with Denver operator and New York market calendars. No phrase router, financial calculation in Talk, provider clock rewrite or inferred account performance.

## Acceptance criteria
- Current turn time supersedes earlier conversational dates; the same local conversation crosses midnight correctly.
- Today, yesterday and month-to-date use explicit operator calendar anchors; differing market date remains explicit.
- Backend execution periods use real timezone boundaries, including DST, and source execution timestamps.
- Controlled clocks and actual installed SDK arguments verify the correction; privacy remains unchanged.

## Remediation history
Per-turn native SDK dynamic instructions and run context implemented. Backend period projections preserve timezone, start/end and observation cutoffs. Author verification and installed status are recorded in the linked receipt; no independent review or Principal acceptance claimed.

## Verification
Controlled-clock tests pass. Final runtime verification is recorded in the linked receipt. Remains Open pending independent review and Principal observation.

## Related
ADR-024; PL-MCP-01; BUG-053 (transaction acquisition disconnect); BUG-052 (evidence presentation).
