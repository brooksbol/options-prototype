# Wheelwright Talk

The one SDK-based Talk successor under ADR-024. W1 is a synthetic-only development
slice, not Product acceptance, production installation or permission for real Account
data. Subsequent Principal assignments authorize question-driven API v2/MCP
engineering and local real-retained-evidence assessment in this same application,
within existing explicit disclosure permissions. Synthetic tests are not Product coverage.

## Run the isolated development preview

From the repository root, with existing approved model access available:

```sh
npm ci --prefix tools/talk --ignore-scripts
npm ci --prefix tools/mcp-hello-world --ignore-scripts
npm ci --prefix tools/mcp-account-question --ignore-scripts
npm start --prefix tools/talk
```

Open **http://127.0.0.1:8810**. The engineer prepares this before Principal observation;
the operator does not configure services, credentials or backend URLs. If 8810 is in
use, startup fails rather than replacing an existing process. Ctrl-C stops only this
preview and its process-owned synthetic fixture/MCP children.

For the authorized retained-market experiment (JDK 21 required):

```sh
npm ci --prefix tools/mcp-v2-evidence --ignore-scripts
node tools/talk/server.mjs --market --port=8811
```

This launches the same app with the actual Java `HeldQuotesController`, current
`PortfolioController`, Account discovery, SQLite and backend authentication,
isolated in a disposable directory. It imports no
provider beans or operational configuration. Its quote records are invented,
historical sandbox fixtures, not downloaded market data. It enables only existing
GET quote and Position/Account reads. Invented Fidelity CSV observations are
admitted through the existing backend import path; no real files are used.
Harbor has synthetic Position/holding/source-read grants; Orchard has metadata
access but no Position-read grant. A separate ungranted fixture User supports
quote denial tests. No existing User/grant is modified. No acquisition service or
write HTTP controller is imported. Stop only a preview started for this experiment.

The launcher uses the existing `OPENAI_API_KEY`, or reads only that key from the
existing primary checkout's ignored `.env` through Git's common-directory locator.
It does not migrate credentials, populate unrelated environment values, use a
provider-managed session or install a global launcher. Do not enter real financial
data or credentials in this W1 preview.

## What is actually connected

- Unchanged `tools/mcp-hello-world/server.mjs`: `hello_world`.
- Unchanged `tools/mcp-account-question/server.mjs`: `list_authorized_accounts`,
  pointed at the owned synthetic fixture by default. Invented `harbor` and
  `orchard` records are not real Accounts. The explicit metadata profile below
  reuses only its existing approved nickname/broker/count projection.

The SDK discovers the tools and parameter schemas. Trusted admission lives in
`syntheticCapabilities` in `synthetic.mjs`, not in question routing. A capability
can be admitted in configuration without a new conversation handler. No other MCP
servers, operational backend addresses, provider access or arbitrary tool execution
API are exposed by the default W1 runtime. The explicit `--market` profile admits
`inspect_market_quotes` and `inspect_account_positions` from `tools/mcp-v2-evidence/`
against the owned Java fixture; Account discovery also uses that coherent backend.
Parameters come from MCP discovery. The adapter reuses the existing CLI
canonical-symbol codec, lossless parser and public-observation validator; it adds
no financial calculation, scoring or question routing.

The Position tool consumes the current foundational portfolio contract, with its
backend-owned financial qualifications and native holding expansion. It
does not use the incompatible legacy Position CLI representation or the old
test-profile controller. Unknown nicknames return authorized discovery metadata
for model-driven correction, rather than a host-side phrase matcher. Safe GET
transport is shared only because both implemented capabilities need it. The
backend may materialize retained-source interpretations; this fixture registers
no optional order/market acquisition services and performs no provider contact.

Discovery intentionally omits quote facts. Individual reads establish which
fields are present. Source event clocks differ from receipt/commit clocks, missing
values differ from zero, and underlying ETF/equity/index observations do not prove
listed-options liquidity. Safe error code/title/status/requestId survive the new
adapter; arbitrary internal problem detail is withheld. Exact source text is
rendered separately from model commentary without binary-number reserialization.

Run the actual model/SDK/application question loop (existing model access):

```sh
node tools/talk/test/question-loop.mjs /tmp/talk-questions.json --market
node tools/talk/test/live-failure.mjs /tmp/talk-failure.json
```

The first repeats the Principal seed and maintained-inventory questions; the
second uses actual model/tool execution with an injected narration transport
failure. These are author experiments, not automated Product acceptance. Output
contains invented evidence only. `npm test --prefix tools/talk` now includes the
real isolated Java/MCP contract fixture; `npm test --prefix tools/mcp-v2-evidence`
checks transport failure, correlation, privacy and precision cases independently.

`conversation.mjs` uses SDK `Agent`, `Runner` and `MemorySession`. There is no custom
model/tool loop. One small recovery extension preserves the latest user turn through
the SDK session API after a provider failure: SDK 0.21.0 otherwise rolls it back.
Sessions are ephemeral, single-operator and bounded to 30 turns. New conversation
clears local history. Concurrent turns are refused. This is not multi-user readiness.

## First conversation

1. “Hello.” — natural reply, no required tool call.
2. “Use the connected capabilities to tell me which synthetic accounts I can access.”
3. “Which broker does harbor use?”
4. “Use the other connected tool to give me its constant greeting.”
5. “Show the balances and positions for orchard.” — unavailable capability.
6. “Which broker is that account with?” — retains Orchard.

The same host handles both tools and non-tool replies. Fixture results remain visible
independently of generated commentary; this is not the final financial-authority UX.

## Privacy and tests

Automatic trace export is disabled before SDK import and through SDK configuration;
default trace processors are removed. Conversation state is local. Responses use
`store:false`; provider conversations, previous-response chaining, remote compaction
and background inference are excluded. A fetch-level outbound boundary permits only
nonstored POSTs to the approved Responses endpoint and refuses redirects. MCP children
receive only controlled local-fixture configuration and minimal process environment,
never the OpenAI credential. Debug model/tool logging is disabled.

```sh
npm test --prefix tools/talk
node tools/talk/test/live-specimen.mjs /tmp/talk-w1-live.json
```

The second command intentionally invokes the approved model using synthetic data.
It runs the same application on an ephemeral isolated port, records actual native
SDK/MCP calls and permitted outbound requests, forces a trace flush, checks local
history/no provider storage, and closes its own resources. No headers or model key
are written to evidence. The evidence observer reads the pinned SDK client's
negotiated version for verification only; Product orchestration does not depend on
SDK internals. No broad packet-level or operating-system sandbox guarantee is claimed.

Automated negative tests use the real SDK and MCP servers with scripted models,
including a model deliberately obeying injected tool-result instructions. Trusted
admission still blocks an unavailable tool. These tests do not prove universal
injection resistance or arbitrary narration correctness. Existing H-004 generic
error flattening remains a known adapter limitation; W1 does not repair deprecated
source or complete W4's error/correlation work.

## Real retained assessment and restricted metadata preview

The engineer can start the same app against the existing authorized local backend:

```sh
node tools/talk/server.mjs --account-metadata --backend=http://127.0.0.1:55834 --port=8812
```

This imports only the existing approved model key and backend token from their
existing location. It does not bootstrap grants, migrate credentials, start/stop
that backend or connect financial MCP tools. H-004's existing field/destination
permission covers authorized Account nicknames, broker labels and count only.
Each turn starts a fresh local SDK session to preserve the scoped no-replay
permission. This profile therefore does **not** prove financial multi-turn Product
capability. Do not enter protected financial records. No synthetic fixture is
started or used as Product evidence in this profile.

Canonical UI source is now `ui/`. `public/` is a preserved compatibility snapshot
for an already-running preview that reads those paths dynamically; do not evolve
it. New starts serve a startup snapshot of `ui/` from this same application.
Compact source cards preserve exact source number lexemes, units, status and clocks;
detailed originals remain collapsed and inspectable. Commentary follows separately.
This is presentation, not a host financial calculator or universal claim verifier.

`test/real-metadata.mjs` runs actual model calls within that existing narrow scope,
redacts nicknames in its output, and records safe egress/usage evidence.
`test/real-market.mjs` reads existing retained market evidence through MCP locally,
with zero model calls. Both are manual real-data diagnostics, not automatic test
fixtures or a claim of broader disclosure authorization. The JVM
`retainedCoverageAudit` task requires an explicit existing database path, reads it
using SQLite `mode=ro`, and exports only coverage/status aggregates. It bypasses
source synchronization/provider services and never runs a grant bootstrap.

The candidate adds GET `/v2/quotes/{symbol}/liquidity` for backend-owned retained
side-price arithmetic, exposed by the existing market tool's `measurement` option.
It is not installed in the operational backend. This does not establish a live
ranking, options liquidity or executable depth. The existing Position tool now
accepts backend lifecycle selection and opaque continuation without host changes.

### Closed-report evidence drill-down and display

Closed-trade report rows expose opening/closing transaction IDs. The admitted
`inspect_account_transaction_details` MCP read composes at most eight existing
Account-scoped transaction item reads, with a shared15-second item-read budget
and100000-byte output bound. It preserves exact backend records and grants;
it performs no financial calculation. Period summary views do not accept the
raw transaction view's exact-native-symbol filter; invalid combinations return
an actionable correction instead of a generic read failure.

USD closed-report presentation rounds exact source decimals to two places;
backend amounts and totals remain unrounded and are available in the evidence
accordion. Totals are never recalculated from rounded display rows. Placeholder-only
Markdown tables are suppressed; empty analysis produces no analysis accordion.
