# H-001 — minimal local MCP Hello World

Local, inert PL-MCP-01 experiment. Codex is the Principal-assigned implementer.
**Author verification: PASS. Independent review and Principal acceptance: PENDING.**
PL-MCP-01 remains INTAKE. No production architecture is selected.

## Run

Requires Node.js >=20 and npm. From the repository root:

```sh
npm ci --prefix tools/mcp-hello-world --ignore-scripts --no-audit --no-fund
npm test --prefix tools/mcp-hello-world
```

Installation retrieves the locked public npm dependencies. Execution uses only
local subprocess stdio; no backend, network service, model or credential is needed.
The client launches the server itself. No separate server startup is required.

`server.mjs` registers exactly one inert tool, `hello_world`, using the official
MCP SDK. `client.mjs` is the executable integration test, using the official client
and stdio transport. There is no direct import/call of the server's tool function.
The package manifest and lockfile pin the dependency tree; no build step is used.

## Protocol and verification

Checked against the current official specification on October 22, 2026:

- [MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
- [Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [stdio binding](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [Official SDK](https://github.com/modelcontextprotocol/typescript-sdk)

Installed: Node v24.18.0, npm 11.16.0, `@modelcontextprotocol/client` 2.3.1 and
`@modelcontextprotocol/server` 2.3.1 (14 installed packages including transitives).

The client pins modern protocol `2026-07-28` with no legacy fallback. Successful
connection establishes readiness through `server/discover`, not a legacy
`initialize` handshake. The SDK probes using a disposable sibling process before
starting the main transport; this additional short-lived server is SDK behavior.
The test checks the returned supported versions, modern era, server identity,
selected version and actual outgoing per-request version metadata. The captured
transport trace covers `tools/list` and both `tools/call` requests; it does not
capture the sibling's discovery wire exchange.

The test asserts:

1. Discovery returns exactly `hello_world`.
2. Invocation returns exactly one text block containing `Hello, world!`, with no
   tool error.
3. Calling `unknown_tool` throws the SDK's protocol error `-32602` with observed
   message `Tool unknown_tool not found`.
4. Outgoing requests are actual JSON-RPC and use `2026-07-28` metadata.
5. Closing the SDK client ends the server's stdin. The server reports natural
   exit code 0 on stderr; its PID is no longer alive. The client then exits 0.

Requests have five-second timeouts; the test has a fifteen-second bound. Cleanup
runs in `finally`. Server stdout is reserved for protocol messages.

## Observed author evidence — October 22, 2026

Initial remote main: `8bd75f5700a2cee39b7a9edb5e685c2d5a365312`.
Initial local main: `5081a39583e95486e55a3735a25c0a568baf43b0`, clean.
Fast-forwarded only the eight newer documentation commits before implementation.
Governing authorization: [H-001 handoff](../../docs/discovery/4am-pl-mcp-01-h001-authorization-stopping-point-2026-10-22.md).
Gate 001 remains STAGED/inactive; it was not activated or treated as a general
H-001 controller. The current Principal Git workflow keeps this candidate
uncommitted pending acceptance; no push, merge of this candidate, or deployment.

Actual clean-install invocation above returned:

```text
Hello, world!
protocolVersion: 2026-07-28
supportedVersions: [2026-07-28]
discovered: [hello_world]
result.content: [{type: text, text: Hello, world!}]
negative: {code: -32602, message: Tool unknown_tool not found}
Server exit: 0; child reaped. Client test: PASS.
tests 1; pass 1; fail 0
```

This is a compact transcription; the executable prints the actual discovery,
request metadata, tool response and negative result as JSON, followed by the
Node test result. Clean-install run: exit 0, 212.668167 ms reported test duration.
A separate invocation by absolute path from `/tmp` also passed, exit 0.
Syntax checks passed for both scripts. No application regression suite was run:
application code and contracts are unchanged.

A disposable copy renamed only the registered server tool to `broken_wiring`;
the unchanged client test failed with exit 1 at tool discovery. Original files
were unchanged. This establishes that the test detects broken MCP tool wiring.
The first author run failed because it expected the sibling discovery request in
the main transport trace. The corrected assertions separately check SDK discovery
results and the main request trace; no legacy handshake was added.

## Review and limits

Changed files: `package.json`, `package-lock.json`, `server.mjs`, `client.mjs`,
and this `README.md`, all in this directory. `node_modules` is ignored and is not
part of the candidate. No canonical roadmap/intake/Principles/ADR/OAS was edited.

A separate reviewer can extract the frozen five-file candidate, run the two
commands above, inspect the real protocol path, and independently mutate or
remove wiring in a disposable copy. Author PASS is not independent ACCEPT.
Candidate hashes/archive identity are supplied in the implementation handoff.

H-001 proves only this local SDK/protocol discovery, deterministic invocation,
negative error and shutdown path. It does not prove authorization, privacy,
cross-user isolation, inference-context control, financial correctness, answer
integrity, provider handling, production fitness or any future architecture.
No LLM, financial data, User/Account discovery, memory, hosted service or trading
is included. SDK-internal ephemeral connection/cache machinery is not persistent
User context. Later domain/security specimens require their own authority.
