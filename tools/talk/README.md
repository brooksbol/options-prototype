# Wheelwright Talk

The one SDK-based Talk successor under ADR-024. W1 is a synthetic-only development
slice, not Product acceptance, production installation or permission for real Account
data. The subsequent Principal assignment authorizes continuous synthetic,
question-driven API v2/MCP capability experiments in this same application.

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
npm ci --prefix tools/mcp-market-evidence --ignore-scripts
node tools/talk/server.mjs --market --port=8811
```

This launches the same app with the actual Java `HeldQuotesController`, SQLite
and backend authentication, isolated in a disposable directory. It imports no
provider beans or operational configuration. Its quote records are invented,
historical sandbox fixtures, not downloaded market data. It enables only existing
GET `/v2/quotes` and GET `/v2/quotes/{symbol}` reads; no provider acquisition or
Account-detail route exists. A fresh ungranted fixture User supports denial tests;
no existing grants are modified. Stop only a preview started for this experiment.

The launcher uses the existing `OPENAI_API_KEY`, or reads only that key from the
existing primary checkout's ignored `.env` through Git's common-directory locator.
It does not migrate credentials, populate unrelated environment values, use a
provider-managed session or install a global launcher. Do not enter real financial
data or credentials in this W1 preview.

## What is actually connected

- Unchanged `tools/mcp-hello-world/server.mjs`: `hello_world`.
- Unchanged `tools/mcp-account-question/server.mjs`: `list_authorized_accounts`,
  pointed exclusively at the same app's loopback synthetic fixture, never an
  operational backend. Invented `harbor` and `orchard` records are not real Accounts.

The SDK discovers the tools and parameter schemas. Trusted admission lives in
`syntheticCapabilities` in `synthetic.mjs`, not in question routing. A capability
can be admitted in configuration without a new conversation handler. No other MCP
servers, operational backend addresses, provider access or arbitrary tool execution
API are exposed by the default W1 runtime. The explicit `--market` profile admits
`inspect_market_quotes` from `tools/mcp-market-evidence/` against the owned Java
fixture. Parameters come from MCP discovery. The adapter reuses the existing CLI
canonical-symbol codec, lossless parser and public-observation validator; it adds
no financial calculation, scoring or question routing.

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
real isolated Java/MCP contract fixture; `npm test --prefix tools/mcp-market-evidence`
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
