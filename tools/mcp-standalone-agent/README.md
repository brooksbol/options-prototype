# H-003 — Standalone conversational MCP hello world

Uncommitted experiment candidate, implemented by Codex. **Live two-turn author verification has passed. The Principal supplied two
successful live-turn transcripts; independent acceptance, Principal-observed
shutdown and explicit Principal acceptance remain PENDING.**
PL-MCP-01 remains INTAKE. This is not a production architecture selection.

## Authority and reuse

The Principal's H-003 assignment explicitly authorized:

> I choose A. Authorize H-003 as a bounded local standalone conversational-agent experiment using the existing H-001 MCP server, with no financial data or production architecture commitment.

This quotation is supplied conversation authority, not an independently recovered
repository decision. The assignment permits implementation, author verification
and preparation for independent review; it does not authorize commit/integration
before the applicable acceptance safeguards are satisfied.

Baseline: `65604784ee4ea6141cab66f7bb482a437cbe6e7b`, independently checked against
remote main at investigation start. H-001's accepted server is reused unchanged
from `3173f8649ab52a63b7c6874d5b8a8c4fd4f0736b`; H-002 was accepted/integrated at
the baseline SHA. See the existing [acceptance receipt](../../docs/discovery/4am-pl-mcp-01-h001-authorization-stopping-point-2026-10-22.md),
[canonical intake continuation](../../docs/parking-lot-10.md),
[project-wide hello-world guidance](../../docs/mandates/product-first-continuous-engineering-2026-10-13.md),
and [Git safeguards](../../.kiro/steering/development-workflow.md).
WW-GATE-001 is STAGED / experiment_started false; H-003 does not activate it.

The missing capability is a standalone conversational host. One Node process owns
the terminal and model/tool loop, using the OpenAI SDK and MCP SDK directly. It
starts only the fixed sibling H-001 server via stdio, discovers `hello_world`,
advertises that single capability to the model, validates a requested call, sends
the actual MCP result back to the model, and accepts another message. No other
Codex registrations are loaded. There is no framework or new MCP server.

## Install and run

Use Node.js **22 or later** and npm **10 or later** (author verified with Node
**24.18.0**, npm **11.16.0**). From the repository root:

```sh
npm ci --prefix tools/mcp-hello-world --ignore-scripts
npm ci --prefix tools/mcp-standalone-agent --ignore-scripts
npm test --prefix tools/mcp-standalone-agent
```

The test does not need an API key. It uses controlled model responses and the
real H-001 MCP server. Passing it does not establish live model tool selection.

For the live experiment, you need an OpenAI API project key, API billing/access,
and access to `gpt-5.6-luna`. A ChatGPT or Codex subscription does not establish
these prerequisites. The Principal supplied a key in the ignored root `.env`. A model-metadata
request authenticated and confirmed access to `gpt-5.6-luna`; live inference
initially returned HTTP 429. After the Principal reported payment, live inference
succeeded. Codex did not change billing settings. Do not put a key in this repository,
paste one into a conversation, or reuse brokerage credentials.

The installed single-command launcher is:

```sh
wwt
```

It installs missing dependencies from the lockfiles and starts the agent without
asking for a key. The agent selects `OPENAI_API_KEY` from the existing ignored
repository-root `.env` (an existing process environment value takes precedence).
No other `.env` values are added to the process environment or model context.
There is no Keychain lookup, credential discovery or setup wizard. API access
must be provisioned before Principal acceptance; an empty entry is not a usable
credential. The Principal has now populated the local entry. The authenticated model-access
check succeeded, but live inference returned HTTP 429 (quota/rate-limit category;
the precise account-side cause was not established). The Principal subsequently
reported payment, after which the bounded live retest succeeded.
`wwt --test` runs deterministic tests without a real API credential.

The Principal rejected the prompt-based launcher: “acceptance failed.  wwt should
start without user pasting”. The prompt-based frozen candidate remains unchanged
for review history. The Principal then directed use of `.env`; this revision
removes the prompt and uses that existing convention. **The quota blocker cleared after the Principal reported payment.** The
subsequent live two-turn author test passed; explicit Principal acceptance and
independent review remain pending.

On this machine, `~/.local/bin/wwt` is a symlink to this directory's executable
`wwt`. From another checkout, install that link once (preserve any existing
command with the same name):

```sh
mkdir -p "$HOME/.local/bin"
ln -s "$PWD/tools/mcp-standalone-agent/wwt" "$HOME/.local/bin/wwt"
```

`~/.local/bin` must be on PATH. The launcher works from any current directory.
You can also run `./tools/mcp-standalone-agent/wwt` from the checkout root.

At `You>`, type:

```text
Say hello using your MCP tool.
```

Look for these distinct lines:

```text
Tool> hello_world (model requested; local MCP invocation)
MCP> Hello, world!
Agent> Hello, world!
```

These lines match the corrected live author retest and the Principal-provided
two-turn transcript. The actual model wording can still vary. `Tool>` is printed immediately
before dispatch; `MCP>` is printed only after the MCP result arrives. An `Agent>`
greeting alone does not show that a tool ran. The connected banner also reports
the runtime-negotiated MCP protocol version.

Then type `Do it again.` without restarting. Observe a second `Tool>` and `MCP>`
result. Type `exit` or `quit`, or press Ctrl-D, to finish. The closing message
confirms the MCP child exited with code 0 and was reaped. Ctrl-C/SIGTERM also
close the input; an already active API request can take up to its 20-second
timeout to finish. No further operator message is submitted after input closes.

The credential remains in the ignored root `.env`; never commit or share that
file. To disable API access, remove its `OPENAI_API_KEY` value. To remove the
command, remove only the `~/.local/bin/wwt` symlink. No shell startup file or MCP
registration is changed. Preserve accepted H-001/H-002 files.

## Model, MCP and usage boundaries

Direct dependencies are pinned and locked: `openai@7.43.0` and
`@modelcontextprotocol/client@2.3.1`. The unchanged sibling server uses
`@modelcontextprotocol/server@2.3.1` from its own lockfile.

The disposable model choice is `gpt-5.6-luna`, Responses API at the fixed
`https://api.openai.com/v1` endpoint, reasoning effort `none`. Current
[official model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
lists function calling, Responses, and this effort setting, and describes the
model as intended for cost-sensitive workloads. No dated snapshot is listed;
the alias can move. Authenticated model-metadata access and a live four-request, two-turn
interaction were verified after the reported billing prerequisite was resolved. The implementation
follows the [official function-calling loop](https://developers.openai.com/api/docs/guides/function-calling).
Earlier nano choices were not retained because current documentation labels
them deprecated. No model-provider or production runtime commitment follows.

At most **2 model requests and 1 MCP invocation per message**, **10 messages per
session**, **1,000 characters per message**, **256 output tokens per request**,
**20 seconds per API request**, and **zero automatic retries**. The second model
request disables tool selection; an unexpected further call is rejected. Any API
or validation error terminates this small experiment and cleans up MCP. There
are no autonomous follow-on requests beyond the bounded result-to-model step.

Only instructions, the discovered inert tool description/schema, the running
synthetic conversation and actual tool results are sent to OpenAI. No repository
documents, financial records or unrelated local files are loaded as model
context. Use synthetic messages only. Local MCP execution does **not** make model
inference local. `store: false` requests no stored Responses conversation; it
does not establish provider retention guarantees. SDK logging is disabled; API
error bodies are not printed. The API credential is not inherited by the MCP
child. Conversation state lives only in this process; the application creates
no session files, database or memory service. Terminal scrollback remains the
operator's normal terminal behavior.

H-003 author tests observe **MCP 2026-07-28** through the SDK's pinned modern
negotiation path and real tool calls. This is distinct from H-002's Codex 0.163.0
observation of **2025-06-18** via compatibility. No H-001 downgrade/change is made.
Kiro's H-001 nonblocking SDK 2.3.1 version-enforcement anomaly after a valid
request remains separately unresolved; H-003 does not test or fix that issue.

## Author verification and independent-review handoff

October 22, 2026 author run: `npm test --prefix tools/mcp-standalone-agent`
passed **15 tests, 0 failures** in approximately 3.6 seconds. Both actual MCP
results were `Hello, world!`; the server exited 0 and its PID was absent after
cleanup. Zero billable model API calls were made. Displayed zero token counts in
that transcript belong to the fake model, not measured live API usage.

The deterministic suite covers two real MCP invocations returning exactly
`Hello, world!`, forwarding each result to the fake model, conversational display,
in-process follow-up history, no invocation without a model call, unknown tools,
extra command arguments, arrays/malformed JSON, parallel/repeated calls, bounded
session usage, sanitized API failures, missing-key setup, EOF/exit and signal
cleanup. Shutdown checks the actual child PID is absent and H-001's stderr exit
receipt is `H-001 server exit: 0`. The agent contains no greeting literal.

The fake model does **not** prove natural-language interpretation. The corrected
implementation separately passed a live two-turn author test; the Principal
provided successful first- and second-turn transcripts. Independent ACCEPT,
Principal observation of exit and explicit Principal acceptance remain
PENDING. Do not commit or
integrate this candidate on the strength of author tests.

Six candidate files only: `agent.mjs`, `agent.test.mjs`, `package.json`,
`package-lock.json`, the executable `wwt` launcher, and this README. The launcher
addition supersedes the earlier five-file review candidate; that archive remains
unchanged. The user explicitly requested the single `wwt` command. Review the frozen archive/hash supplied in
the implementation handoff, overlay it onto the stated accepted baseline, run
the two `npm ci` commands and `npm test` above, and inspect/falsify the controls
independently. Dependencies, credentials and transient output are not archived.

This specimen can establish standalone bounded host wiring and, once observed
live, model-directed invocation. It establishes no financial semantics,
cross-user isolation, complete context provenance, provider retention assurance,
generated-answer integrity, production security or architecture suitability.
H-004 is not implemented or authorized by this candidate.

## Live prerequisite receipt after the .env correction

The Principal populated `OPENAI_API_KEY` in the existing ignored root `.env`;
Codex did not display, archive or commit the credential. Normal `wwt` startup no
longer reads a key from the terminal. Two bounded live launches connected to
H-001/MCP 2026-07-28 and each failed at the first model request, before any tool
call. The second launch reported HTTP 429 after safe HTTP-status diagnostics
were added. No automatic retry occurred. A separate model-metadata GET
authenticated successfully and returned `gpt-5.6-luna`. The live runs did not
produce token usage; billable consumption was not reported. Each MCP child
exited 0 and was reaped; each failed host exited 1. This is not live-model PASS
or Principal acceptance. API quota/rate-limit availability requires resolution
before another acceptance attempt; no billing changes are authorized here.

The current deterministic suite passes 15 tests, including isolated .env parsing
and credential selection without mutating unrelated environment variables. Old
five-file and prompt-based six-file frozen archives remain unchanged; this
correction requires a new review identity.

The Principal subsequently launched `wwt` and observed a live failure: MCP
connected, but the first inference request returned HTTP 429; the MCP child
exited 0. This is Principal-observed FAIL, not acceptance. Error reporting now
distinguishes the allowlisted provider codes `insufficient_quota`,
`rate_limit_exceeded`, and `billing_hard_limit_reached` when supplied, without
printing arbitrary provider bodies. The change was verified deterministically;
no further live request was made. The exact cause of the observed 429 remains
unclassified until provider evidence or account quota/limits establish it.

## Post-payment live retest and first Principal observation

The Principal reported “i paid.  retest”. The first post-payment run made two
actual model-requested MCP calls returning `Hello, world!`, but the model's final
answers incorrectly denied tool access. This was a live answer failure, despite
a too-weak harness printing PASS based on call/result presence. Codex identified
and reported the failure; it is not accepted evidence of full success.

The correction separates tool-selection instructions from post-result
presentation instructions: after MCP completes, the model is told to present the
latest actual function_call_output exactly. No greeting is hardcoded in the agent
and no server/tool behavior changed. The subsequent live test required two exact
`Agent> Hello, world!` lines as well as actual calls/results and cleanup. It
passed, with MCP 2026-07-28, two tool calls, two actual greetings, two correct
conversational responses, server exit 0/reaped and host exit 0.

Live synthetic input was `Say hello using your MCP tool.`, `Do it again.`, `exit`.
The corrected run used four model requests: input tokens 160/195/209/244
(total 808), output tokens 15/8/15/8 (total 46). The earlier failed-answer run
reported 844 input and 62 output tokens. Actual billed dollars were not exposed.
No automatic API retries occurred.

The Principal then supplied a personal `wwt` transcript with `say hello`: model
request, actual MCP `Hello, world!`, and conversational `Hello, world!` all
visible (353 input / 23 output tokens across two requests). This establishes
Principal observation of one successful live turn; it is not yet an explicit
Principal acceptance or evidence of personal repeat/exit. H-001/H-002 remain
unchanged; this new prompt/configuration candidate requires separate review.

The Principal subsequently supplied the second turn: `do it again` produced a
second actual `hello_world` call, MCP `Hello, world!` and agent `Hello, world!`
without restarting. Principal-observed live two-turn behavior is now PASS. That
second turn reported 449 input / 23 output tokens; the complete Principal
conversation reported 802 input / 46 output tokens. Personal shutdown observation
and explicit acceptance are not yet supplied.
