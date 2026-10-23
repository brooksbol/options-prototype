# PL-MCP-01 — H-001 authorization and 4AM stopping-point snapshot

**Date:** 2026-10-22  
**Standing:** Category D historical authorization and handoff evidence. Explicit Principal authorization of a tightly bounded experimental outcome, **not** PL-MCP-01 reconciliation completion, production agent architecture selection, blanket Git permission, or release acceptance.  
**Starting remote main observed:** `4a942d0f595014123bebeecd5d6f84a6d1d4e304` (verify current SHA again on resumption).

## Principal's explicit choice

After the [bounded three-actor reconciliation](4am-pl-mcp-01-bounded-evidence-reconciliation-2026-10-22.md), the Principal selected:

**“A. have codex build it. gen the prompt first , then persist a snapshot.”**

This accepts Option A as defined in the reconciliation: authorize **only a local, inert, data-free MCP hello-world end-to-end invocation**, with reproducible evidence. It names **Codex** the implementation actor. The authorization does not settle which runtime, transport or hosting topology a real conversational financial Product might later use.

Earlier Principal guidance is project-wide: **“the simplest thin slice is a hello world.”** Maintained owner: [Product-first mandate](../mandates/product-first-continuous-engineering-2026-10-13.md#principal-clarification--smallest-thin-slice-october-22-2026).

**Principal scope exclusion:** “we don't care about ww cli compatibility issues in this thread.” No CLI migration, parity or adapter compatibility work is in H-001.

## H-001 authorized outcome

- Launch a minimal local MCP server exposing one deterministic hello-world tool.
- Invoke and discover the tool from a local MCP client, exercising actual protocol wiring.
- Observe an exact deterministic `Hello, world!` text response and clean termination.
- Record supported SDK and exercised/negotiated protocol version, repeatable command, actual output, and deterministic integration verification.
- Prefer inert local stdio if compatible; this is a disposable experiment and does not select a production host.
- Codex should follow repository-root `AGENTS.md`, specific actor bootstrap, current execution/gate state, protected worktrees, applicable review and independent acceptance rules. An implementation report is not independent acceptance.

**Explicit exclusions:** no LLM requirement; no private data; no brokerage credentials or API v2 financial requests; no User/Account grants; no memory, retrieval, embeddings, or persistent conversations; no multi-user privacy assurance; no generated financial claims; no hosted/public deployment; no autonomous activity/trading; no OAS/domain model/API modification; no general-purpose agent infrastructure; no CLI compatibility tasks.

**Boundary:** This Principal choice authorizes the bounded experimental *outcome* and preparatory prompt, but does not override currently staged/inactive mutation gates, branch protections, review separation or other technical authority conditions. If a gate blocks write/integration, Codex must report it, not bypass it.

## Current evidence and reconciliation state

- [Kiro 4AM stopping point](4am-pl-mcp-01-stopping-point-2026-10-22.md), supplemented by Kiro's later bounded re-pin at `5081a39`: reusable HTTP-boundary Account/User grants and more granular published OAS; agent inference-context controls still absent.
- [Muse external research](../research/muse-mcp-agent-runtime-cross-user-isolation-2026-10-22.md): all compared agent approaches require application-managed authorization and context protection; provider internals not independently verifiable from app egress; original report has material MCP 2026-07-28 release-version correction.
- [Codex 4AM independent review](4am-pl-mcp-01-codex-independent-review-receipt-2026-10-22.md): strategy fit supported, context custody and answer integrity unresolved, first executable hello world separable from later domain and privacy specimens.
- [Bounded three-actor evidence reconciliation](4am-pl-mcp-01-bounded-evidence-reconciliation-2026-10-22.md): H-001 ready to propose and now specifically authorized by Principal, not yet implemented.
- Parallel API v2 Product-conformance verification is independent, conditionally relevant only if a material result invalidates a relied-upon premise; not a prerequisite for this data-free MCP wiring test.

## Status at this stopping point

- **Authorization:** H-001 local-only inert MCP wiring experiment **YES**, as constrained above.
- **Assigned implementation actor:** Codex.
- **Prompt:** complete copy-paste Codex implementation prompt delivered in the Principal conversation on October 22, 2026; this repository record is a durable boundary/goal handoff, not a verbatim prompt copy.
- **Implementation:** not observed, not claimed.
- **Independent verification/acceptance:** not performed.
- **Merge/integration:** not authorized by this snapshot alone; not observed.
- **PL-MCP-01:** remains **INTAKE / DISCOVERY**, no Reconciliation Completion Record.
- **Open later architecture:** authenticated model context assembly, authorization lineage and revocation, tool permissions, provider terms, financial answer integrity, and real-user isolation. H-001 is not evidence for their fitness.

## Resumption checks

1. Reverify remote `main`, current repo gate state, and actor ownership before implementation.
2. Read H-001 Principal authorization, exclusions and direct-repository instructions.
3. Execute H-001 only within actual mutation permissions; record real MCP version, execution, reproducibility, and tests.
4. Freeze and submit evidence for independent review through normal repository process.
5. Preserve strict distinction between working protocol wiring and acceptance of production security/finance semantics.
6. Continue broader PL-MCP-01 reconciliation separately, not as a hidden H-001 scope expansion.

**CURRENT STATE:** H-001 authorized by Principal for Codex as a local-only, data-free MCP hello-world learning experiment; prompt prepared. Not implemented or independently accepted. PL-MCP-01 INTAKE.

**DECISION REQUIRED:** NO.

**NEXT AUTHORIZED ACTION:** Codex performs bounded H-001 within the verified repository gate/worktree and review constraints.

## H-001 accepted-candidate integration receipt — October 22, 2026

This subsequent receipt supersedes the earlier pending implementation/acceptance/integration statements **for H-001 only**. Their historical standing is preserved. PL-MCP-01 remains INTAKE; H-002 is a separate bounded local conversational-host experiment.

**Principal-supplied review evidence:** The corrective H-001/H-002 handoff reports Kiro's explicit **VERDICT: ACCEPT** of frozen archive `h001-d7656d3c7e08.tar.gz`, SHA-256 `f1f240641febf2b82febb46440f8340792d8698dd40d88f68fff1b2b88e25946`. Kiro reportedly verified the archive hash, exactly five regular files, working-tree equivalence, locked dependency installation, actual stdio tool discovery/invocation, protocol 2026-07-28, exact greeting, clean termination and unknown-tool rejection; all 11 mutation tests detected their intended failures and no material defect was found. This is attributed Principal-supplied independent-review evidence, not a new Codex review or a claim that the original Kiro report is archived here.

**Preserved nonblocking finding:** Kiro reported an MCP SDK 2.3.1 protocol-version enforcement anomaly after a valid request. Exact reproducer is not supplied in this handoff; mechanism and generality remain unverified here. Preserve for a later authorized protocol/security investigation. H-001 is not modified to solve it, and its success does not establish protocol/security conformance generally.

**Principal exact acceptance supplied in the corrective handoff:** “I choose A. Accept H-001 and authorize Codex to commit and integrate the independently accepted five-file specimen, subject to the repository's Git workflow.” Source: Principal's current corrective execution handoff, not an invented earlier repository citation. Missing prior persistence was a knowledge gap, not missing authorization. No further H-001 development or independent review was commissioned.

**Actual integration:** Codex independently compared the five local file bytes against the five regular archive members and verified the accepted archive SHA-256. Starting local and remotely verified main were `8bd75f5700a2cee39b7a9edb5e685c2d5a365312`; the only changes were the untracked H-001 directory. Commit **`3173f8649ab52a63b7c6874d5b8a8c4fd4f0736b`** contains exactly `tools/mcp-hello-world/{README.md,client.mjs,server.mjs,package.json,package-lock.json}`, without candidate-byte edits. Direct push under the current Principal Git workflow succeeded; `git ls-remote origin refs/heads/main` returned that SHA afterward, and all five paths are tracked in its tree. No branch-protection bypass, new review, SDK change, operational deployment, or unrelated worktree change occurred. Gate 001 remains STAGED/inactive.

**Standing now:** H-001 IMPLEMENTED, AUTHOR-VERIFIED, INDEPENDENTLY ACCEPTED (Principal-supplied Kiro verdict), PRINCIPAL-ACCEPTED, COMMITTED and INTEGRATED. The frozen README retains its original pending-state text intentionally because accepted candidate bytes were integrated unchanged; this dated receipt owns the subsequent acceptance/integration state. Repository synchronization can advance with this documentary receipt without changing the accepted specimen identity.

## H-002 resumed local Codex observation — October 22, 2026

**Scope/authority:** Principal's corrective handoff directs completion of H-001 integration and resumption of the existing bounded H-002 assignment. No H-003/H-004, domain integration, new host implementation, production architecture, model key or private financial data. This section records author observation, **not Principal observation or H-002 acceptance**.

**Host configuration:** installed `codex-cli 0.163.0`. Added only the project-local `.codex/config.toml` table `mcp_servers.h001_hello`, using the existing local Node executable, absolute accepted `tools/mcp-hello-world/server.mjs` argument and that directory as cwd. No user-global configuration or other registrations changed. This machine-local configuration remains uncommitted pending Principal observation/acceptance; it is not part of H-001's five-file identity. `codex mcp get h001_hello --json` returned enabled=true and the expected stdio executable/argument/cwd. Configuration presence alone was not counted as connection.

**Actual conversational execution:** a fresh `codex exec --ephemeral --json -C <repository>` received “Use my hello_world MCP tool to say hello.” with additional instructions to invoke `h001_hello` directly and do no shell/file/repository work. It exited 0. The JSONL host trace showed an actual `mcp_tool_call` for server `h001_hello`, tool `hello_world`, arguments `{}`, followed by a completed result with text content `Hello, world!`, error=null, and a subsequent agent message `Hello, world!`. Raw local diagnostic outputs were retained outside the repository; only relevant synthetic evidence is summarized here.

**Important actual protocol qualification:** To verify the host's version rather than assume it from H-001, a second ephemeral invocation used temporary command-line overrides to pass the unchanged server's stdio through existing Unix `tee` commands into local diagnostic files. No additional MCP client/server or persistent wrapper was created; the project's direct-Node configuration is unchanged. Observed wire excerpts (unrelated host metadata omitted):

```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","clientInfo":{"name":"codex-mcp-client","title":"Codex","version":"0.163.0"}}}
{"result":{"protocolVersion":"2025-06-18","serverInfo":{"name":"h001-server","version":"0.0.0"}},"jsonrpc":"2.0","id":0}
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
{"result":{"tools":[{"name":"hello_world","description":"Return a constant greeting.","inputSchema":{"type":"object","properties":{}}}]},"jsonrpc":"2.0","id":1}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hello_world","arguments":{}}}
{"result":{"content":[{"type":"text","text":"Hello, world!"}]},"jsonrpc":"2.0","id":2}
```

Codex's observed host path therefore exercises **2025-06-18**, using the accepted SDK's existing legacy compatibility behavior. No accepted source/SDK/protocol configuration was changed or downgraded. H-001 separately author-/reviewer-verified **2026-07-28** through its pinned programmatic client. Successful H-002 tool execution is **not proof of Codex 0.163.0 support for 2026-07-28**. No modern host-version option was established in this bounded pass; no host upgrade, server redesign or permanent architecture was selected.

**Principal walkthrough in the installed environment:**
1. Open a terminal at the repository and run `codex` (a fresh conversation, not the already-running original session).
2. Type `/mcp`. Confirm `h001_hello` is connected and lists `hello_world`.
3. Type exactly: `Use my hello_world MCP tool to say hello.`
4. Observe the tool-call indication naming `h001_hello` / `hello_world`, then the actual result `Hello, world!`. A greeting without a tool call is not success.
5. Send the same request again to repeat it. No separate server launch is needed.
6. After closing the experimental sessions, remove only the `[mcp_servers.h001_hello]` block from project `.codex/config.toml`, or set its `enabled = false`, and open a fresh session. The newly created project file currently contains only that block; preserve any subsequently added entries. Do not remove or change user-global integrations.

**State:** HOST-CONFIGURED, CONNECTED, TOOL DISCOVERED, TOOL-INVOKED and AUTHOR-VERIFIED. PRINCIPAL-OBSERVED and ACCEPTED remain PENDING. H-002's configuration is local/uncommitted; these dated observations are documentation evidence only. The local MCP subprocess is distinct from normal Codex model-provider inference. This proves neither provider handling, cross-user privacy, finance semantics nor production suitability.

## H-002 Principal acceptance and portable configuration integration — October 22, 2026

This subsequent receipt supersedes the previous H-002 pending observation/acceptance state. H-001 remains unchanged at `3173f8649ab52a63b7c6874d5b8a8c4fd4f0736b`, independently ACCEPTED by Kiro and Principal-accepted; the preceding integration/observation receipt was persisted at `0f0da265d0a79282c44c6f544aacb245f9d89655`.

**Principal-observed PASS, twice:** The Principal supplied the installed Codex 0.163.0 terminal transcript: `/mcp` showed `h001_hello: connected (1 tool)`. On each of two requests, “Use my hello_world MCP tool to say hello.”, Codex displayed `Called h001_hello.hello_world`, the tool result `Hello, world!`, and final response `Hello, world!`. Reported interaction times were 6s and 7s at 6:23 PM. This is Principal-supplied observation evidence, not a new author simulation or a claim of separate H-002 Kiro review.

**Principal exact acceptance/integration authorization:** “I choose A. I accept H-002 and authorize Codex to commit the project-local MCP configuration and acceptance receipt, subject to repository Git safeguards.” Source: Principal's H-002 Integration Engineer handoff in the current conversation. It was not previously represented by an earlier repository citation. No repeated acceptance or authorization was requested.

**Portable configuration:** `.codex/config.toml` registers only `h001_hello`, with `command = "node"`, `args = ["server.mjs"]` and `cwd = "tools/mcp-hello-world"`. It contains no credentials, absolute machine paths, provider configuration, other tools or services. Existing user-global registrations are untouched. Another trusted checkout requires Node.js >=20 on PATH and the locked H-001 dependencies installed. Launch Codex **from that checkout's root**. Codex 0.163.0 was observed to interpret the MCP cwd relative to the session working directory; a preliminary config-folder-relative `../tools/...` attempt did not expose the tool and was discarded. The final root-relative configuration succeeded with the actual installed host. This is a narrow portability correction, not a new runtime or MCP client.

**Current reproducible operator procedure:**

```sh
# In the root of this repository checkout:
npm ci --prefix tools/mcp-hello-world --ignore-scripts --no-audit --no-fund
codex
```

In the fresh Codex conversation, type `/mcp` and confirm `h001_hello` exposes `hello_world`; then type `Use my hello_world MCP tool to say hello.` Observe the actual tool-call indication and `Hello, world!`. Send the same request again to repeat. No separate server launch, API key, backend service or brokerage access is needed. The project must be trusted under the normal Codex rules; do not bypass trust controls.

For cleanup, close the experimental sessions, then set `enabled = false` inside only `[mcp_servers.h001_hello]`, or remove only that table from `.codex/config.toml`, and open a fresh session. Do not remove unrelated registrations. This is a local checkout change to the now-versioned project configuration; undo it later if the specimen is wanted again.

**Verification:** `codex mcp get h001_hello --json` recognizes the project registration. A fresh actual `codex exec --ephemeral --json -C <checkout-root>` against the portable configuration completed an `mcp_tool_call` for `h001_hello.hello_world` with `{}`, no error, exact text content `Hello, world!`, and a subsequent agent response `Hello, world!`; process exit 0. This verifies the portability edit without repeating Principal acceptance. Configuration presence alone was not counted as discovery or invocation. H-001 files are compared against their integrated commit before persistence; no server/client/dependency/readme bytes are changed. Only this existing receipt and the approved project-local configuration belong to the H-002 integration change set. Transient host logs and installed dependencies are excluded. Final commit/remote synchronization identities are reported after actual push; the commit containing this receipt is the H-002 persistence identity.

**Protocol/assurance boundary unchanged:** H-001's programmatic test exercised **2026-07-28**. The observed Codex 0.163.0 conversational host uses **2025-06-18** through the existing SDK compatibility path; native modern-protocol host support is not established. No H-001 downgrade or protocol repair was made. The previously recorded nonblocking SDK version-enforcement anomaly remains for separately authorized investigation. H-002 establishes only local conversational tool discovery/invocation of the inert greeting. It establishes no financial semantics, privacy isolation, provider handling or production architecture. Normal Codex model-provider inference remains distinct from the local MCP process. No persistent memory, User/Account data, finance/broker integration, remote service, H-003, or trading functionality is included.

**Accepted state:** H-002 HOST-CONFIGURED, CONNECTED, TOOL DISCOVERED, TOOL-INVOKED, AUTHOR-VERIFIED, PRINCIPAL-OBSERVED (twice), and PRINCIPAL-ACCEPTED. Repository persistence/integration is carried by the containing accepted-main commit after its verified push, not by this prose alone. PL-MCP-01 remains **INTAKE**; no Reconciliation Completion Record or broader Product/architecture selection is implied.
