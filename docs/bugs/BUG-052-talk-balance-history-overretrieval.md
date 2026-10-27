# BUG-052 — Talk balance answer retrieves and displays retained history

- **Status:** Open
- **Severity:** Not established
- **Area:** API v2 balance evidence / MCP / SDK Talk
- **Provenance:** Principal report, October 27, 2026; real retained-read preview at 46835d68

## Observed failure
Principal reported nearly 2,000 lines of historical records/raw JSON preceding a short PTS margin answer. The persisted real SDK probe independently records 82 returned balance observations and 34,260 input tokens for the original question. The line count is operator-reported, not independently measured.

## Intended semantics violated
ADR-024 leaves authoritative evidence selection in the backend and conversation in SDK Talk. Evidence must support a qualified operator answer without indiscriminate disclosure or source records dominating the answer. Latest retained evidence does not establish current buying power.

## Evidence
[Original real probe](../reviews/sdk-talk-real-read-profile-2026-10-27-probe.json), [bounded retest](../reviews/sdk-talk-bounded-balances-2026-10-27.json), and [implementation receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md). No protected financial amounts are included in this record.

## Consequence
Unnecessary private history crosses the model boundary, increases context consumption, and obscures the useful historical facts. Principal requested high-priority correction; that sequencing is distinct from severity, which has not been ratified.

## Diagnosis / root cause
The balance API's collection read was reused without a source-time selector. MCP forwarded all observations; Talk rendered all fields plus raw JSON. Collapsing the old JSON alone would not address model disclosure.

## Scope / non-goals
Authorized bounded candidate engineering under PL-MCP-01. No new Account grants, acquisition, trades, production installation, v1 changes, financial engine in MCP/Talk, or new Product capital-allocation policy.

## Acceptance criteria
- Backend selection returns at most one qualified source-time observation; receipt order never establishes source order or currentness. Ties and unorderable clocks are explicit.
- MCP defaults to that selection and preserves source facts, missingness, authorization and chronology qualifications.
- Original question reaches the model with no historical collection; demonstrate bounded bytes and observation count.
- Compact card emphasizes relevant reported facts and historical date. Provenance requires deliberate interaction; balance raw JSON is not rendered.
- A request for a missing later session returns no selected amount and explains known source coverage.
- Principal can inspect the preview; author verification must not be labeled independent approval or Product acceptance.

## Remediation history
October 27 candidate adds API v2 `selection=latest-source`, optional `sourceAtOrAfter`, selection metadata and source display lexemes. MCP defaults to the bounded read. Talk renders a compact typed card and lazy provenance details. Existing API collection behavior remains compatible for explicit callers.

## Verification
Author evidence: 11 Java balance tests; 8 MCP tests; 8 OAS contract groups (38 operations); 19 Talk tests including actual Java HTTP/MCP and lazy provenance DOM assertions. Real authorized SDK question selects one October 19 source, 2,882 bytes, 6,634 input tokens. Follow-up naturally selects the source-time bound and returns zero observations for October 26. Browser visual verification is unavailable because this session has no browser provider. Record remains Open pending that final presentation check; no Principal acceptance claimed.

## Related
ADR-024; PL-MCP-01; October 26 real-world case study; BUG-022 governs a separate Regime/capital issue. BUG-051 belongs to concurrent v1 work and is untouched.
