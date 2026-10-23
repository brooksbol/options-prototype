# H-004 — authorized Account question

Implementation candidate, not independently accepted or installed. Base: main
91a627b27aac7fdaac535afe2a736f94383707c4. BUG-049 must be independently accepted
and its backend plus matching ww deployed before real Account verification.

Product: run existing wwt, ask “What accounts do I have?”, receive a model-composed
sentence listing exactly the Accounts visible to the authenticated User. This
means access, not legal ownership or complete brokerage coverage. No balances,
Holdings, artifacts, financial advice or new domain framework.

Reuse: accepted H-003 standalone host/OpenAI SDK 7.43.0/model gpt-5.6-luna;
MCP SDK 2.3.1/2026-07-28 stdio; Account API and canonical nickname authority;
existing ignored root .env convention; existing wwt launcher. H-001/H-002 and
H-003 agent/source tests stay unchanged. The launcher gains this Account mode
as default; `wwt --hello-world` retains the original accepted H-003 behavior.
`wwt --test` runs both test suites. No new launcher or generic tool registry.

Principal authorization: October 23 instruction to deliver working real Account
conversation with selected Option A. Principal provided organization screenshots:
API logging enabled per call, all three sharing options disabled. Principal
confirmed “Yes—correct organization; proceed with this limited data” when asked
whether to permit only authorized nicknames, broker labels and counts under
standard API retention with store:false, including possible abuse-monitoring
retention up to 30 days/documented exceptions. This is scoped risk acceptance,
not verification of ZDR/MAM enrollment or general financial-data clearance.
Official reference: https://developers.openai.com/api/docs/guides/your-data .
No dashboard settings were changed by the implementation.

## Mechanism and boundaries

One zero-argument `list_authorized_accounts` MCP tool. Its sole HTTP operation is
GET /v2/accounts with configured Bearer authentication. No resource ID argument,
filter, arbitrary URL/path, artifact or broker API capability exists. HTTP redirects
are refused; HTTPS is required outside loopback. Responses are size/time bounded,
correlated and strictly checked against the corrected number-free Account shape.
An old number-bearing backend fails closed. UUID-shaped current acct_ IDs and
displayName are validated locally but never returned through MCP or sent to model.
Supported broker codes map only to Fidelity/tastytrade labels. Nicknames use the
backend’s existing [a-z][a-z0-9-]{0,31} grammar. Duplicate/malformed/incomplete
responses fail; never infer identity, numbers or grants from other fields.

Only the question family stated in the candidate is forwarded. Other input stays
local and receives scope guidance. Model interprets the bounded question and must
request exactly the advertised tool with no arguments. The server obtains actual
backend-authorized inventory; the host checks projection/count/duplicates and then
sends that allowlisted result to the model to compose the complete answer.
The host validates every Account mention against the inventory in a small accepted
sentence grammar. Missing/extra/duplicated Accounts, wrong broker, unsupported
claims or further tool calls fail before display. The host does not substitute a
locally generated answer when the model fails. Grammar admits the Principal’s
specimen and a second short conversational introduction, reordered Accounts,
comma/and delimiters and an explicit zero-inventory sentence.

Each turn fetches fresh inventory; no prior turn, tool output, model output object,
provider reasoning, persistent conversation ID or file is replayed. All model
requests explicitly store:false/background:false, no retries, no logging, fixed
OpenAI HTTPS endpoint, same accepted model. No hosted tools, files, background
jobs, model remote-MCP transport or new provider choice. At most two model calls
per accepted question and ten messages per process. Transient local memory only.

The MCP child gets only PATH, WW_BASE_URL and WW_API_TOKEN. Model key is not passed.
The trusted host selects only OPENAI_API_KEY, WW_BASE_URL and WW_API_TOKEN from its
existing environment/root .env; it never exports unrelated brokerage settings.
WWT_CONFIG_FILE is an engineering-only alternate path for isolated testing; no
Operator setup burden. Model/backend error bodies and unverified answers are
not printed. Only a verified sentence reaches terminal output. Both stdout and
stderr MCP transport/lifecycle are checked on close, and the child is reaped.
This is code-path confinement, not an OS filesystem sandbox or general isolation
assurance for arbitrary malicious local code.

## Verification and acceptance

Install locked dependencies in this package and existing sibling standalone-agent
and hello-world packages. Run npm test here, then existing wwt --test. Tests use
real MCP and disposable in-process loopback HTTP, controlled model responses,
projection/authorization/error/redirect/malformed-data/grounding/privacy/history
falsifiers. No new Java fixture or fake Product acceptance environment is created.
Green author tests are not independent review, deployment or actual-data success.

Independent Kiro should verify the exact source archive, check all model request
bodies and child env, attack extra tool/arguments/data/claims/history, and reproduce
fixture tests. Do not query real data or use installed mixed wwt before BUG-049
acceptance/deployment and appropriate H-004 review. Real author verification then
uses the isolated candidate launcher, actual configured User and corrected API,
asks the real question, compares the response to authorized nickname/broker/count
inventory, and reports actual model/egress/shutdown evidence without storing raw
API payloads, credentials, canonical IDs or private unrelated data in Git.

No self-acceptance, integration, deployment or real-data result claimed here.
