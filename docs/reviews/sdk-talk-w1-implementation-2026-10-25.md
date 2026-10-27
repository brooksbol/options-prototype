# SDK Talk W1 — implementation and independent-review receipt

**Recorded:** October 25, 2026. **Implementer:** Codex, explicitly assigned by the
Principal's “Wheelwright Talk Implementing Engineer” W1 instruction.
**Standing:** author verification / submitted candidate, not independent ACCEPT,
Principal Product acceptance, installed successor or production deployment.

## Identity, authority and protected state

- Verified remote main/base: **`265ecedf005516594a14a0e20b70138565d6a439`**; it matches
  the supplied baseline. No later main advancement was observed at submission.
- Frozen implementation source: **`28e5c3449eb932abb06eac391ee83d6615b931ee`**.
  This receipt and raw evidence are subsequent evidence-only additions; application
  bytes remain those of that source commit.
- Branch: `codex/sdk-talk-w1-20261025`. Protected worktree:
  `/Users/bollich/kiro/options-candidates/sdk-talk-w1-20261025`.
- **Single successor application: `tools/talk/`.** Continue authorized future work
  here; the isolated worktree is source protection, not another Product architecture.
- Scope: W0 preparation and W1 only, synthetic data, existing approved model access,
  local tests/preview and review submission. No W2, provider acquisition, real-data
  expansion, credential/grant changes, existing installation/process changes or
  production deployment. Independent review of this code must be by another actor.

Root AGENTS, docs/AGENTS, docs/README, Codex bootstrap, ADR-024, the existing delivery
plan, PL-MCP-01 history/receipts, Product-first mandate, Technology Quality Constitution
and fitness controls, API v2 authority and Gate state were recovered. The complete
parking-lot/journal continuation set was indexed topically; unchanged authorities read
earlier in this session were reused. ADR-024 controls over earlier custom-host reuse
and runtime-economy recommendations. This explicit W1 assignment supersedes the earlier
unassigned planning state. WW-GATE-001 remains STAGED and was not activated.

The original checkout was clean and left unchanged. The feedback candidate still had
**21 uncommitted entries** at final check. Existing preview listeners retained their
original PIDs: 8787/92386, 8791/9384, 8793/25258 and 8794/25254. Existing `wwt` still
points at the trades r3 installed launcher. These are scoped dated observations,
not certification of all installed bytes. No old host was stopped, deleted or extended;
only this newly created W1 preview was restarted during its own development.

## Architecture and reuse

Pinned versions: **`@openai/agents` 0.21.0**, **`openai` 7.43.0**,
**`@modelcontextprotocol/client` 2.3.1**. Existing MCP servers retain their unchanged
2.3.1 dependencies. Node **24.18.0**, npm **11.16.0**. Both native SDK MCP connections
actually negotiated **2026-07-28**, observed in the raw live evidence; compatibility
was exercised, not inferred from package ranges.

`conversation.mjs` constructs native SDK `Agent`, `Runner`, `OpenAIProvider` and
`MemorySession`. `runner.run(...)` owns model/tool iteration and history. The app does
not call `responses.create`, define tool parameter schemas, route question phrases,
force every reply to use a tool or discard legitimate non-tool replies. SDK MCP
integration discovers schemas from the existing servers. Trusted tool admission is
configuration; backend authentication remains separate.

Reuse is deliberately bounded:

- Unchanged H-001 greeting MCP server, transport/lock precedents and constant result.
- Unchanged H-004 Account MCP server and its narrow backend projection/validation.
- Existing approved model/key access and the prior single-key-loading pattern; no
  credential files created or migrated, and no unrelated `.env` values imported.
- Lessons: credential isolation, deterministic evidence surviving narration failure,
  latest-subject continuity and explicit privacy control before exposure.

The Account adapter is connected only to the app-owned ephemeral loopback fixture.
Invented `harbor` and `orchard` records use synthetic IDs and a fresh fixture-only token.
No actual User/Account grant or operational backend is queried. This fixture is an
in-process test dependency for the existing capability, not a new domain tool or
additional conversational host. Existing tool schemas are not copied into Talk.

**Native-facility gap found and corrected:** SDK 0.21.0 rolled back the latest user
turn after a provider failure in the negative test. A small exception-path extension
uses public `MemorySession.getItems/addItems` to preserve the failed latest intent
and an explicit failure marker when SDK persistence rolled it back. It performs no
subject parsing or routing and does not replace the SDK run loop. The negative test
failed before this extension and passed afterwards.

## Actual execution and transcript

[Raw synthetic live evidence](sdk-talk-w1-evidence-2026-10-25.json) contains the full
eight-turn transcript, SDK-emitted tool names/arguments/results, usage, actual outbound
request metadata and synthetic backend reads. Actual model: **gpt-5.6-luna**, reasoning
effort none, reusing the existing Talk model access.

| Operator turn | Actual observed outcome |
|---|---|
| Hello. | Natural greeting; **zero tool calls**. |
| Use connected capabilities to list accessible synthetic accounts. | SDK selected `list_authorized_accounts`; existing MCP server read the synthetic backend; answer identified Harbor/Fidelity and Orchard/tastytrade. |
| Which broker does harbor use? | Fidelity, from local conversational context; no new handler or forced tool call. |
| Use the other connected tool for its constant greeting. | SDK selected `hello_world`; “Hello, world!” returned. No host source change between the two tools. |
| Show balances and positions for orchard. | Explained that connected tools do not expose financial data; no invented balances or recovery offer. |
| Which broker is that account with? | Orchard/tastytrade; retained the latest subject through the unsupported request. |
| Switch to harbor and read inventory again. | Actual synthetic backend 503, MCP `isError` outcome; model explained failure and qualified the older successful read. |
| Which account did I just switch to? | Harbor, not the earlier Orchard subject. |

The final recorded specimen used **11 actual model requests, 6,399 input tokens and
233 output tokens**, over **13 seconds**. The earlier development Hello and six-turn
specimen were additional calls; these counts describe the durable final specimen,
not total session billing. Monetary cost/credits were unavailable. Receipt preparation
checkpoint was approximately **14.3 minutes** after task start; final elapsed time is
reported separately. No Principal compliance intervention or additional approval was
required after the explicit implementation assignment.

## Privacy and normal-runtime outbound evidence

- Trace export disabled before SDK import, global SDK tracing disabled, default
  processors removed, Runner tracing disabled and sensitive span capture disabled.
  Model/tool debug logging is also disabled. No model-based guardrail was added.
- SDK MemorySession keeps local history. No provider conversation session, prior
  response chaining, remote compaction or background inference is configured.
- The OpenAI client and normal runtime fetch boundary permit only nonstored POSTs to
  `https://api.openai.com/v1/responses`, refuse remote conversation/compaction/trace
  endpoints and refuse redirects. This is trusted code outside the model.
- In the actual normal Node runtime (`NODE_ENV` unset, **not test mode**), all 11
  observed outbound requests were permitted Responses POSTs with `store:false`,
  no conversation and no previous-response ID. An explicit SDK trace flush produced
  no additional outbound event. Local history was visibly present in subsequent
  request bodies; local sessions are not claimed to avoid inference replay.
- Assertions inspected real synthetic request bodies for model credential, fixture
  token and synthetic canonical Account-ID absence. Only projected nicknames, broker
  labels and count entered Account tool results. Headers/keys are not in evidence.
- MCP children receive controlled synthetic fixture configuration and the transport's
  minimal inherited process environment, not `OPENAI_API_KEY`. No existing backend
  address, User grant or brokerage/provider credential is supplied.

The observation/enforcement boundary covers the pinned SDK's fetch-based HTTP paths,
plus separately observed synthetic backend reads. It is not an operating-system
network sandbox or packet capture. W1's free-form input is explicitly restricted to
synthetic/test content; this is not an automatic detector of arbitrary private text
an operator might enter. Broader disclosure and real-data integration remain outside
this workstream.

## Tests and negative specimens

`npm test --prefix tools/talk`: **6 tests passed, 0 failed**, final run approximately
1.75 seconds, using the real SDK and existing MCP processes with scripted models.

1. SDK-owned greeting, both discovered tools, ordinary follow-up history, failed-turn
   continuity and new-conversation history clearing.
2. Trusted admission rejects a model-requested unavailable tool; the synthetic backend
   independently returns 403 without its fixture authentication token. This is not an
   actual Model A grants test or multi-user acceptance claim.
3. Malicious source display-name text is excluded by the unchanged adapter projection;
   an unavailable backend remains an MCP error rather than successful empty inventory.
4. Completed tool evidence remains visible after an injected narration/provider failure;
   private provider-error canaries do not appear in the response.
5. Injected instructions actually reach the scripted model through a tool result. Even
   when that adversarial model obeys them, trusted admission prevents the unadmitted
   Account call. No fixture read occurs. This proves the tested authority boundary,
   not universal model immunity to prompt injection or prose correctness.
6. Egress rejects trace, provider conversation, remote compaction, unapproved origin,
   stored inference and remote conversation/response chaining before network forwarding.

The real-model specimen separately verifies live SDK/MCP execution, the two tools,
capability misses, an unsuccessful read and subject continuity. An unauthenticated
local chat POST is refused with 403. HTTP checks of `/`, `/app.js`, `/style.css` and
`/api/status` returned 200 with expected content types and security headers. JavaScript
syntax and Git whitespace checks passed. None of this is Principal UX acceptance.

## Operator-visible preview and independent review

**Running isolated preview: http://127.0.0.1:8810**.
Open the link, say “Hello,” then follow the six-turn example in
[`tools/talk/README.md`](../../tools/talk/README.md). No Principal environment variables,
internal IDs or backend wiring are required. New conversation clears local state.
The preview was provided early, before the full negative-test/evidence pass.

The browser connector was unavailable and Safari was in active use, so automated
visual inspection was not completed. Existing browser work was left alone. Actual
HTTP/API operation was exercised; the Principal can observe the running interface.
That initial check did not establish visual acceptance or Principal use. The subsequent
operator-reported observation below establishes actual use separately from acceptance.

An independent reviewer can check out the frozen source, install locked dependencies
inside a protected workspace as described in the app README, run six deterministic
checks, inspect the raw evidence and optionally rerun the synthetic live specimen
with existing approved access. Inspect real execution paths rather than accepting
this receipt's assertions. No Kiro patch request or self-issued independent ACCEPT
is part of submission.

Changed source: `tools/talk/package.json`, lockfile, `privacy.mjs`, `synthetic.mjs`,
`conversation.mjs`, `server.mjs`, three `public/` assets, two test/specimen files and
the app README. The **existing** delivery plan records W0/W1 state and this authorization;
no competing plan was created. This receipt and JSON preserve evidence. No old MCP/host
source, dependency locks, service, credential, grant or installation was changed.

## Subsequent operator observation — liquidity question

**Source:** Principal supplied the W1 screen/conversation text in this session after
the preview was delivered. This is operator-reported observation, not an independently
captured model/network trace or a statement of Product acceptance.

Exact operator questions:

> what are the most liquid etfs and indexes right now?

> a combination of chain depth, trading volume, and tight spreads. score the top ten
> accordingly, starting with tight spreads as the first parameter

Talk provided general candidate instruments, disclosed that no live market-data feed
was connected, and declined to claim a defensible current scored top ten. It retained
the topic across turns. Its proposed framework assigned 50% to tight spreads, 25% to
volume and 25% to depth, and suggested 20/60-session windows. No such weights, windows
or scoring policy had been selected by the operator or established by a connected
backend capability. The transcript did not contain a backend-computed liquidity score.

**Assessment:** conversational continuity and acknowledgment of the capability gap
are useful W1 evidence. The proposed weights were framed as commentary, which ADR-024
permits; that is not proof of a financial-authority breach. However, “spreads first”
does not establish those weights. Chain-depth meaning, ETF versus index-option scope,
available evidence/session, normalization and spread-first ordering versus weighted
scoring need Product clarification before an authoritative ranking can exist. The
speculative candidate list is not evidence of today's top ten.

**Disposition:** preserve this as an important operator question emerging through
conversation under PL-MCP-01. Do not add a liquidity tool, market/provider connection,
question handler, ranking formula or prompt-specific patch under W1. Any later selected
capability must recover existing backend evidence/composition first, clarify the actual
question/metric meaning, and obtain the relevant later-stage authority. This observation
does not accept W1, select W2, authorize data acquisition or ratify a scoring policy.

## Limits and stopping point

W1 is a synthetic, single-operator, ephemeral-local-session implementation. Both
admitted existing tools have zero arguments; no parameterized financial tool or full
financial UX is claimed. General capability evolution remains to be tested through
real operator questions under later authority. H-004's generic error flattening remains
a known adapter limitation; complete API problem/correlation fidelity belongs to later
authorized work, not a silent edit of deprecated code here.

Model prose remains fallible and separate from displayed raw fixture results. This is
not arbitrary financial-claim enforcement, multi-user security, durable session storage,
full injection protection, final visual acceptance, W2, installation or deployment.
No broad quality gate or new framework was introduced. Independent review and Principal
Product acceptance remain pending; operator use has now been reported above. Do not
advance automatically to W2 or merge as accepted code.

CURRENT STATE: W1 author-verified candidate and running synthetic preview prepared for
independent review; Product acceptance and W2 are not claimed.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Independent W1 review of this candidate.
