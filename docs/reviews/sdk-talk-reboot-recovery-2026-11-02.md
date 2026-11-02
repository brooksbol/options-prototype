# SDK Talk reboot recovery — November2, 2026

Status: author-verified operational correction under the Principal's position
regression assignment. Wider BUG053 remains Open. No new Product acceptance or
independent review is claimed. PR43 was already merged and its bounded tactical
visualization accepted November1; that acceptance did not prove reboot persistence.

## First failing boundary

Remote main verified at `c87facff6179ddb1abf4a36fa38f2a4ea0ae5151`; clean local
main fast-forwarded from9cee2a40, preserving three unrelated research commits.
Current assignment covers diagnosing and correcting the reported8787 regression.
WW-GATE001 remains STAGED, not active enforcement. Domain identity/ASSIM0002,
grants, financial semantics and acquisition policy are unchanged.

The permanent launchd Talk service restarted after reboot. Its newer MCP adapter
built a valid inventory query against the older permanently installed backend JAR.
Both unqualified and named-Account requests failed at backend query validation:

| Conversation | Actual selector | Before | After restart with corrected JAR |
|---|---|---|---|
| show me ptf | Before: market quote PTF; after: inventory underlying PTF | Symbol interpretation; reported earlier failure not repeated on this exact turn | Successful underlying selection |
| positions | ALL_AUTHORIZED, no Account | Backend422 INVALID_REQUEST | Native inventory, all three authorized Accounts, READ/complete |
| accounts | Metadata discovery | Success | Success |
| pts positions | ACCOUNT, pts | Backend422 INVALID_REQUEST | Native inventory, PTS only, READ/complete |

Direct authenticated reads isolated the rejection to `view=inventory`, with
backend detail “Unknown or repeated query parameter.” Public evidence contains
only selectors, statuses and request correlation; no holdings, financial values,
Account IDs, tokens, original records or screenshots. Private captures stay local.

## Reuse and correction

Reuse the accepted universal inventory/financial backend and unchanged native
chart assets; no alternative financial engine, host router or prompt workaround.
The installed JAR predated this capability. The corrected JAR is built from
accepted mainc87facff; current Java source is unchanged by this recovery.
The existing permanent JAR path and launchd jobs now use that binary, so reboot
returns to the same contract. A private online SQLite backup and old JAR are
preserved under the existing service directory before replacement. No grants,
credentials, plist, source evidence imports or brokerage actions were changed.

| Artifact | SHA256 |
|---|---|
| Previous installed JAR | 377b3c7e7711af71436b58b034af2152de83e836523372940dcbb1965b533e1f |
| Corrected installed JAR | 9a3619fc67462396dde769961c1f3ff6716cc0c627d29556e7c4dff06223f66f |

Adapter exceptions now return `POSITION_ADAPTER_ERROR` / “Positions unavailable.”
Backend problems retain their safe status/code/requestId; MCP schema refusals
occur before backend reads. The conversational error instruction calls for one
concise operational error without repeated absence-of-holdings boilerplate.
This is a separate UX correction; replacing the JAR fixes navigation.

## Executable evidence

- `node tools/talk/test/installed-positions.mjs`: four actual installed model/SDK/MCP turns PASS after both permanent services restart. This is explicit opt-in real-model evidence, not a scripted model or fixture.
- MCP tests:27 PASS, including all/named/unknown Account routing and correlated old-backend422 without diagnostic disclosure.
- Talk suite:86 pre-existing tests PASS; new real MCP failure-boundary test PASS. Native chart17 tests PASS after the final adapter change.
- Fresh actual PTS/BDRY SDK selection PASS. Existing browser regression replays this authorized response at1360×960 and390×844: one disclosure, keyboard interaction, financial chart, labels inside viewport, no overflow or browser errors. Screenshots remain private. No model/pixel inspection of financial data is claimed.
- Full Java suite and bootJar build PASS in5m43s:1112 tests, zero failures/errors, two skipped. Earlier stale XML results are not counted as this run.
- Served tactical.js, app.js and style.css match accepted source bytes. Operational3100 and3101 health reads both return200; v1 was not restarted.

The deployment regression was invisible to synthetic contract tests because they
started current Java source rather than the permanently installed JAR. The new
installed check must run after restart; health200 alone is insufficient evidence
of the relevant contract. This is a verification command, not an automatic boot
gate or a claim of enforced release control.
