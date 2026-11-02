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

## Five-request continuation — subject, display action and expiration

The Principal made the full conversation the next correction specimen:
`show me pts` → `show pts positiosn` → `show me ptf` → `tactical view` →
`show me nov 20 options`. This continuation is within the same regression
assignment; correcting one adapter in isolation is insufficient.

Actual replay after the reboot repair established:

- Account overview, typo and PTF selection now used native PTS tactical inventory.
- PTF was a `TACTICAL_INVENTORY_GROUP`, with no canonical item.id/self. The model
  borrowed an ID from nested source evidence for exact Position lookup;404 was
  correct backend behavior but a failed conversational handoff.
- The option-inventory tool exposed no expiration selector. Existing instructions
  forced implicit option requests to portfolio scope, and the model substituted
  PUT for expiration. This lost PTS and the requested date.

Recovery reuses the existing universal native view, SDK session and renderer.
The falsifiable gap is an unavailable expiration predicate on that view; neither
raw portfolio option inventory nor model-side row filtering can preserve native
contexts and backend selection authority. The bounded extension adds
`expiration=YYYY-MM-DD` only to `GET /v2/positions?view=inventory`, intersecting
Account/underlying selectors. It matches at least one non-conflicting PUT/CALL
constituent with that date and retains the whole context and unchanged evaluation.
Companion shares or other-expiration legs remain context, not falsely relabeled
as selected options. The native heading says “Positions with options expiring”.
Unknown/conflicting terms are not matches. Strict date/duplicate/query/grant
validation and current source-cut conservation remain enforced. OAS is updated;
this is not a public-reference publication claim.

Tool descriptions/instructions distinguish canonical item references from nested
source IDs and keep active inventory scope through follow-ups. A new
expiration-wide request keeps PTS and releases the prior PTF restriction; it
does not invent option right or side. Explicit portfolio-wide requests still use
all authorized Accounts. No host phrase matching, new subject registry, model
financial calculation, grant change or separate conversational runtime is added.

An intermediate actual replay at0e4af656 avoided404 but answered the representation
request with no tool, so no native card appeared in the new reply. It failed the
five-turn specimen and remains preserved. The final generic display contract
explicitly states that prior tool data in model memory is not a current UI render
action; display requests must return a native result. This addresses the
model-to-renderer handoff, rather than treating a no-error reply as success.

Java backend source is0e4af656; final SDK/tool/UI runtime ise3c33e56. The permanent
backend JAR SHA256 is624c0d4e7a0cfb87e2a11f497cb49f5b7a992decfe4f63f3ab82205bfc535e72.
An additional private JAR/database rollback preserves the earlier reboot repair.
Both permanent services were restarted. BDRY financial geometry compares exactly
equal with the previously captured accepted result; no payoff arithmetic changed.

Checks completed before real replay:235 focused portfolio Java tests PASS;
89 Talk tests PASS;28 MCP tests PASS;8 OAS conformance groups/39 operations PASS.
Final SDK/session/error tests10 PASS after the display-contract correction.
The initial concurrent Java/Talk fixture runs raced over shared compiled test
outputs; those infrastructure failures were preserved, compilation restored,
and both suites rerun serially. A presentation test formerly preserving a
standalone heading now requires a report body, matching the Principal's explicit
empty-heading requirement. Nonempty code, numbers, nested findings and material
qualifications retain coverage.

Final actual SDK/MCP outcomes: two separate fresh five-turn conversations
PASS, with no tool error or raw-inventory fallback. Every reply supplies native
PTS tactical results. PTF's representation follow-up preserves exactly the same
source-holding references. November20 selects2026-11-20 in PTS, without a prior
underlying restriction or invented right/side. Successful narration alone is
not sufficient for this test.

The full five-response browser replay PASS at1360×960 and390×844 (ten rendered
turn checks): native cards, no raw inventory/table fallback, no visible technical
response dumps or repeated generic qualifications, no empty headings/lists,
keyboard-operable evidence and no overflow/browser errors. Supporting narration
and exact backend evidence remain available on deliberate expansion. This is
automated real-result browser evidence, not a claimed physical screen-reader or
Principal visual acceptance session. An initial harness observation checked lazy
evidence before its DOM toggle event; the corrected test waits for the actual
evidence node rather than weakening the keyboard/content assertions.

No private responses, nested source identifiers or screenshots are published.
The new `--conversation` mode and browser companion are reproducible engineer
checks; no automatic boot gate or general guarantee of model behavior is claimed.
Independent review remains pending in PR44. Principal acceptance remains reserved.

The original four-request installed regression also passes after the continuation:
the unqualified `positions` request clears prior Account, underlying and expiration
restrictions and returns all three authorized Accounts; `pts positions` narrows to
PTS. Roadmap projection regeneration/freshness and final diff checks PASS.


## November2 observed-state increment — completed before read-only architecture review

Principal supplied a PTF payoff-only card and requested an observed underlying
reference and separately dated broker open P/L. The candidate reuses the existing
local evidence-appliance GET /api/evidence/quotes for an absent underlying spot,
behind global market/reference permissions and a qualified USD equity identity.
It performs bounded read-only local requests; it does not acquire provider data,
change grants, refresh custody or alter financial functions. The legacy observedAt
is chain receipt time: it is explicitly carried as receivedAt with asOf null.
This is a retained last-price reference, not a bid/ask midpoint. The native curve
uses backend spotPoint, with a visible cyan line/intersection marker and room for
its dated label. Source-reported single-holding open P/L is carried separately
with the holding export day, without aggregation or substitution from the curve.

Final source f5841c53; permanent JAR SHA256
ad3f81b7a6cb09da978eb646230e30d833078cafc819c64780f07900c9a4cb16.
Private rollback preserves prior JAR, database and launcher source. Initial live
verification at a88e7691 still lacked a PTF marker; request-budget initialization
and selected-underlying work scoping were corrected before final verification.
The final PTF backend response has an independently sourced spot/spotPoint and
matches the Principal-supplied dated broker P/L. Desktop/mobile browser checks
pass; the selected card was visually inspected. The source clock is not invented.
Focused portfolio Java236, Talk90, MCP28, OAS8/39 operations pass. The complete
five-turn installed conversation also passes after this increment.

This is a bounded, unmerged candidate increment, not Product acceptance or an
independent architecture/release ACCEPT. Existing established spot values remain
preferred over the added absent-spot fallback. Broader cross-Account freshness,
market identity/source selection and acquisition design are now explicitly under
Principal-requested read-only architectural investigation. No further point fix
or running-service change is authorized by that investigation. The investigator
is also this candidate's author; its findings cannot substitute for independent
acceptance of this implementation. Private financial responses/screenshots stay
local; no source amounts are published in this receipt.
