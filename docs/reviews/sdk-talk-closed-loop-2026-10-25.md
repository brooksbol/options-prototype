# SDK Talk — Codex closed-loop implementation receipt, October 25, 2026

**Standing:** author implementation/verification evidence for the Principal-authorized
continuous PL-MCP-01 experiment. Not independent acceptance, Principal Product
acceptance, ratification, installation or deployment. Draft PR #42 remains unmerged.

**Frozen application source:** `850c6cf8fb8339dabf03b675334dceae0ffa18e0`.
The subsequent evidence/plan commit changes no application bytes. One successor:
`tools/talk/`, branch `codex/sdk-talk-w1-20261025`, protected workspace
`/Users/bollich/kiro/options-candidates/sdk-talk-w1-20261025`.

## Authority, baseline and recovery

Started through root AGENTS → docs/AGENTS → docs/README A–F model → Codex cold start;
reused unchanged authority recovered earlier in this session and retrieved current
ADR-024, plan, PL-MCP-01/history, maintained Account/Regime knowledge and assimilation
state, Product-first mandate, Technology Quality Constitution/fitness controls and
API v2 contracts. Complete parking-lot/journal continuation headings were indexed
by topic. No actor recommendation was promoted into authority.

Remote main was **`fc985c974d7655e490e8f1be94456fe3846b63e1`**, PR #42 head
**`02422247229081706ad677566d490ac3e21edf39`**. Main's difference from supplied
`265ecedf...` was the existing delivery plan only; the candidate contained current
main. No reset, merge, accepted-main edit or unrelated worktree mutation occurred.
The latest explicit continuous-engineering assignment supersedes the earlier W1-only
execution scope within its stated boundaries; it does not authorize general W2–W6,
real-data expansion, provider acquisition, grants, trading, installation or deployment.

Governing boundaries are [ADR-024](../07c-adrs.md#adr-024-sdk-based-wheelwright-talk-mcp-integration-and-financial-authority),
Doc 77 §2–5, the [Product-first mandate](../mandates/product-first-continuous-engineering-2026-10-13.md)
and existing fitness-control lifecycle. No new standard or framework was created.
The [one delivery plan](../implementation/pl-mcp-01-sdk-talk-delivery-plan-2026-10-25.md)
records this authorization and candidate state.

**October 24 precedent recovered, not assumed:** the protected feedback candidate's
`tools/wwt-web/README.md` §§“Closed-loop”/continuation and local
`~/.local/share/wheelwright/codex-feedback-loop/checkpoint.json`, particularly
`resumptionAfterRamRecovery.r27`, record **88/88 host tests, 19/19 two-turn real-model
synthetic journeys and a ten-turn Chrome journey**. Those are historical author
reports, not tests rerun here. `stoppingAssessment` also says assignment/corpus
completion was false. Recovering the continuation instruction confirmed that one
passing subset/checkpoint was not the stopping condition. Reused the question →
actual application → diagnosis → reusable correction → deterministic isolation →
original-question retest method. Did not reuse its bespoke router, extend its
source, or extract its protected real-Account conversations into this experiment.

## What changed and what the conversations established

[Machine evidence](sdk-talk-closed-loop-evidence-2026-10-25.json) retains full
questions, responses, tool arguments/results, usage, intermediate failures,
request/correlation observations and sampled actual outbound bodies. Intermediate
uncommitted snapshots are labeled separately from immutable source checks.
These are author observations, not an automatic semantic pass score.

| Genuine journey / inventory source | Before and diagnosis | Correction and observed result |
|---|---|---|
| Principal ETF/options-liquidity seed | No connected market evidence; general suggestions and unsupported scoring inputs. F/G/J, not a ratified 50/25/25 policy. | Existing GET `/v2/quotes` and instance reads exposed as `inspect_market_quotes`. Talk reads actual retained fixture facts and qualifies missing current/options evidence; **current top-ten score remains unanswerable**. |
| Q08–10/Q30–34: provenance, freshness, missing observations | Discovery omits facts by design; model initially treated omission as absence and receipt time as observation time. B/H. | Explicit operation/scope qualifications; native individual reads. Later QQQ replies keep absent ask/size/volume/source time unknown, and preserve source/storage-clock distinction. |
| Q62: failed subject/correction | XLU not found; potential stale SPY subject. A/H. | Actual calls inspect XLU, then QQQ; follow-ups remain on the latest subject. 404 is not zero volume or a successful quote record. |
| Q02/Q03/Q11/Q29/Q33: Account contents and performance | Existing Account tool returned nicknames only. E. Old Position CLI/preview used an incompatible legacy contract. | `inspect_account_positions` consumes the **current** portfolio API, with native holding expansion. The actual Java API supplies invented 75-share SPY custody, $7,500 reported value and $125 qualified reported open P/L; replies distinguish these from current valuation, lifetime earnings, basis and opening fills. |
| Ordinary “Hello” → “What's in harbor?” | Actual visible preview interpreted Harbor as a generic word. A. A later run stopped at metadata and asked whether to inspect. | General financial-workspace orientation and same-turn completion instruction. Native discovery plus Position inspection answers the original ordinary wording; no nickname/phrase matcher or question handler. |
| Exact nickname / authority | Model once passed “synthetic harbor” and stalled. B/C. Orchard metadata access did not confer Position access. G. | Tool returns only authorized nickname recovery metadata; model can correct through its own loop. Actual Orchard read returns backend 403, preserves correlation, and later replies remain on Orchard without substituting Harbor facts. |
| Narration failure | Simulated-model tests missed invalid fallback assistant history; real next turn threw SDK `item.content.map is not a function`. A. MCP error disposition was also lost in the presentation hook on failed narration. | Native SDK `user()`/`assistant()` helpers replace hand-shaped fallback items. Supported MCP `customDataExtractor` preserves `isError` before the end hook. Real model/tool calls followed by injected narration transport failures retain both SPY results and XLU problems; subsequent actual model turn stays on XLU. |
| Injection / financial negative cases | Untrusted description claimed acquisition/all-Account authority; counts can exceed JS safe-integer range. H/security. | Actual model declined the embedded instructions; trusted admission/backend authorization remain independent. Exact `9007199254740993` survives transport/UI and was copied correctly in the observed reply. Ask≠fill, size≠profit, stale quote≠current valuation and unsupported policy recommendation were exercised. |
| Cross-source composition, Q08/Q10/Q30/Q34 | A Position valuation warning was over-generalized to absence of any SPY quote. H. | Tool scope distinguishes the Account evaluation graph from independent held quotes. Native SDK composes both tools: retained 2001 sandbox quote exists, but does not resolve the incomplete valuation of a 2026 custody observation. No host valuation was added. |

No new production backend operation, provider or financial calculation was needed.
Production API v2 source remains unchanged. The Java test-only fixture imports the
existing `HeldQuotesController`, current `portfolio.PortfolioController`, Account
controller, SQLite/authentication and retained-source interpretation; it admits
invented Fidelity-format CSVs through the existing backend importer. It does not
use the legacy test-profile `PositionsController` or invent opening transactions.
The fixture's native broker-export `PRODUCTION` metadata is explicitly qualified
as **simulated source format**, not real brokerage access.

Reusable adapters live in `tools/mcp-v2-evidence/` (renamed from the first market-only
module when the second actual capability justified the broader purpose). A small
GET transport is shared only by those two implemented reads. Existing symbol codec,
lossless JSON parser and public quote validator are reused. Tool schemas remain
server-owned and are discovered by the SDK; Talk copies none. Account discovery
uses the same owned Java backend in this profile. Original greeting/Account adapter
sources and deprecated Talk code remain unchanged.

The native API holding-only expansion reduced this fixture's observed SDK tool
result from approximately **25,208 to 16,809 characters** (~33%). Financial statuses,
holding facts and warnings remain. Conversation token comparisons are confounded
by model call timing/retries, so no controlled cost-saving percentage is claimed.
Source result text is rendered losslessly in a distinct evidence block before
commentary; large sources collapse for readability and open when narration fails.
Expired local sessions disable requests and offer explicit reload without replaying
old financial context. New previews freeze UI assets at startup.

## Execution, privacy and verification

Pinned and actually exercised: **Agents SDK JS 0.21.0**, **OpenAI 7.43.0**,
**MCP client/server 2.3.1**, Node 24.18.0/JDK 21. All three native SDK MCP connections
negotiated **2026-07-28**; four admitted tools include existing greeting/discovery
and the two new reads. `Agent`/`Runner.run`/`MemorySession` execute the loop, tool
selection and local history. No custom Responses loop, hard-coded tool schema,
question routing, host financial engine, numeric whitelist or second model verifier.
Supported native hooks supplement presentation/failure recovery, not orchestration.

Normal development runtime applies trace-disable environment before SDK import,
`setTracingDisabled(true)`, empty trace processors and disabled/sensitive-off runner
tracing. Native Responses requests have `store:false`, no provider conversation/
previous-response chaining, no background operation and no remote compaction.
Actual fetch egress captures show only the permitted Responses endpoint. Later
requests **do include local history**; local sessions are not a disclosure barrier.
Known fixture tokens and the existing model key were checked absent from captured
model bodies. Credentials/headers are not captured. The normal app was not run
under `NODE_ENV=test` to obtain these results.

Backend fixture configuration excludes operational Spring configuration and provider
credentials; startup checks absence of quote-provider/Tastytrade/Tradier beans.
No order/market acquisition service or write HTTP controller is registered. Actual
Java HTTP path/query/status/requestId records corroborate tool results. The fresh
ungranted User and metadata-only Orchard demonstrate independent backend denial.
No real Account evidence was queried or sent. No existing credential/grant changed.
These are scoped source/egress observations, **not an OS network sandbox, proof of
zero provider retention, arbitrary-input DLP, or production multi-user isolation**.

Executed checks: **10 Talk tests**, **5 MCP adapter tests**, **13 targeted Java tests**
(including full production-graph synthetic API wiring), all passed. Talk tests
include actual Java/MCP contracts, native OpenAI serialization across failure,
completed-output retention, admission, injection, precision, egress and expired UI
state. Simulated-model/transport tests are distinguished from actual model runs.
The complete immutable `21b4dd9` run has **41 turns / 67 real model requests**, no
host execution errors, plus a separate three-turn real-tool/narration-fault specimen.
Later exact-wording, projection and cross-source specimens cover final corrections.
There is **no claim of 41/41 semantic passes** or new CI/ratified enforcement gate.

Published mechanisms consulted: [OpenAI SDK ownership of the loop](https://developers.openai.com/api/docs/guides/agents/sdk),
[MCP tool/error contract](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
and [Tradier market-data scope](https://docs.tradier.com/docs/market-data).
Provider documentation is capability reference, **not verified licensing, permission
or evidence acquisition**. Installed JS SDK code and actual protocol execution,
rather than Python guidance or assumed defaults, establish the execution claims.

## Limits, stopping boundary and independent replay

- Full current liquidity ranking: synthetic historical underlying quotes supply no
  comparable current option chains, open interest, executable depth or ten eligible
  records. Earlier one-underlying real-data experiment permission is not blanket
  SDK/provider authorization. Universe, comparability and ranking semantics remain
  unselected; suggested weights were never implemented as policy.
- Yesterday/lifetime/management questions: selected records lack the required date,
  opening fills, fees/cost attribution and authorized order/policy evidence. Missing
  data is not fixed by another endpoint wrapper; no new synthetic opening trades
  were invented merely to make these conversations pass. Whole-position and regime/
  governed-capital conclusions must not be inferred from Account identity.
- Tradier documents no index feed in Sandbox. The invented ^SPX row tests type/transport handling, not actual provider coverage.
- All observations are synthetic. Single local operator/session and 30-turn session
  bound remain; persistent multi-conversation/multi-user Product behavior is not
  established. Final financial-authority UX and broad claim correctness remain open.
  Intermediate narration added an overly broad missing-market claim and suggested
  acting at the broker after declining a synthetic exit request. The final visible
  follow-up still inferred dollar/share quote units and offered rough cross-source
  arithmetic, explicitly without validating current performance. These residual
  narration defects remain open; all specimens are retained. Source separation and prompt
  corrections do not prove universal narration integrity or injection resistance.
- Native browser control was unavailable in the recovered environment; no new actual
  browser visual-acceptance claim. The running UI and its HTTP conversation endpoint
  were exercised, including the actual operator-visible preview. DOM/HTTP checks
  do not equal Principal observation or Product acceptance.

The loop continued through market exposure, financial Account evidence, history
replay, discovery/alias correction, authority negatives, cross-source composition
and projection cost. Further domain expansion against the present records would
require missing evidence/permissions or increasingly invented fixtures, rather than
closing an observed operator evidence gap. Stop at that evidence/economic boundary;
**do not claim the whole question inventory exhausted**. Real-data expansion, provider
acquisition, new ranking policy, merge, deployment and Product acceptance remain
outside this grant. No routine Principal intervention was requested.

**Review/replay:** inspect this source and [machine evidence](sdk-talk-closed-loop-evidence-2026-10-25.json),
then follow `tools/talk/README.md`. Use a free local port or the question driver’s
ephemeral port; do not stop existing previews. `npm ci` the Talk, existing greeting/
Account and v2-evidence packages with `--ignore-scripts`; run `npm test` in Talk and
v2-evidence. Actual model experiments use existing approved access and owned
synthetic fixtures. The final visible development preview is
**http://127.0.0.1:8811**; refresh, start a conversation, say Hello, ask “What's in
harbor?”, follow up, then switch to Orchard. No installation or real Account access.

Original checkout remained clean; protected feedback candidate retained 21 dirty
entries. Existing listener PIDs remained 8787/92386, 8791/9384, 8793/25258,
8794/25254 and 8810/59814. Only this assignment's own 8811 preview and ephemeral
fixtures were restarted. **Qualification:** old 8810 reads UI assets from the same
successor worktree, so working UI edits can appear there without process restart;
its runtime was not upgraded or reconfigured. Frozen assets protect newly started
previews. No claim that old 8810 served byte-identical static files is made.

**Measured through evidence capture:** 75.6 minutes; 286 recorded application turns across 49 distinct question strings, including repeats and failed specimens—not successful-answer counts. SDK/provider usage records 451 model requests, 940,871 input and 36,117 output tokens. Four additional pre-fix model calls lack token capture, so these are lower bounds. Billed currency/credits and engineering-agent token use are unavailable; no prices or savings were invented. Principal interventions after assignment: **zero**.

CURRENT STATE: Author-verified synthetic SDK Talk candidate; independent review and
Principal Product acceptance pending; existing installations/main protected.
DECISION REQUIRED: No routine decision. Broader disclosure/provider or materially new
Product semantics require the separate authority identified above.
NEXT AUTHORIZED ACTION: Independently inspect/replay the candidate; ordinary bounded
correction remains delegated if new evidence warrants it. No self-merge or deployment.
