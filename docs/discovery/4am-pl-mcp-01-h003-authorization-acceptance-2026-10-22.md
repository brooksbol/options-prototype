# H-003 — Wheelwright Talk: authorization, acceptance and integration receipt

**Date:** October 22, 2026 (America/Denver)
**Standing:** Category D receipt of bounded experiment authority and evidence; current workstream disposition is indexed under [PL-MCP-01](../parking-lot-10.md). No production architecture ratification.
**Implementation actor:** Codex. **Independent reviewer:** Kiro (Principal-supplied ACCEPT evidence).

## Authority and accepted outcome

The Principal's original H-003 authorization, supplied in the implementation assignment:

> I choose A. Authorize H-003 as a bounded local standalone conversational-agent experiment using the existing H-001 MCP server, with no financial data or production architecture commitment.

The Principal's exact acceptance and integration authorization, supplied in the current integration handoff:

> I choose A. I accept H-003 and authorize Codex to commit and integrate the independently accepted six-file candidate, including the wwt launcher and a dated H-003 authorization and acceptance receipt, subject to repository Git safeguards.

These are attributed Principal-supplied conversation records, not quotations reconstructed from an earlier repository decision. They establish this bounded assignment; they do not authorize H-004, financial services, operational deployment, production host selection or broader PL-MCP-01 implementation.

The nearest accepted working precedents are unchanged [H-001](../../tools/mcp-hello-world/README.md) (integrated at `3173f8649ab52a63b7c6874d5b8a8c4fd4f0736b`) and H-002 (integrated at `65604784ee4ea6141cab66f7bb482a437cbe6e7b`). Their [existing acceptance receipt](4am-pl-mcp-01-h001-authorization-stopping-point-2026-10-22.md) preserves the evidence. H-003 supplies only the missing standalone conversational host, reusing H-001 as-is under the [project-wide hello-world mandate](../mandates/product-first-continuous-engineering-2026-10-13.md).

## Frozen identity and independent acceptance

Accepted archive: `/var/folders/gc/73hvgtms3fdfdwh4ckhf61380000gn/T/wheelwright-h003-live-sfbs4bdq/h003-live-candidate.tar.gz`.

**Archive SHA-256:** `b367522c0c981313af562a8597ab7625a8590c88838f7176cfd72b38759daab1`.

Exactly six regular files, verified against the working files before integration, with unchanged bytes and modes:

| Path within `tools/mcp-standalone-agent/` | SHA-256 |
|---|---|
| `agent.mjs` | `540a616f37579a6a2fb3e4cce078a0d94c87d89f8b922aee27231ae78824843e` |
| `agent.test.mjs` | `3f67f6dd71cecd133952372a920de0c92908415346320ecc4b964ee77b6bb618` |
| `package.json` | `6a28417827c5644ed8e12a38c1cfbb235a73670ebce6d4647daa8d00825d5703` |
| `package-lock.json` | `c1aa2b763aa125d1c3150601dca80b4bb52d970d361b43c3b4cf059f0d15fa4f` |
| `README.md` | `b3b89aa0927b8c2e71519290e8962a0400aa9a1aa2368e6e29c7d41e4b38798b` |
| `wwt` (executable, 0755) | `21663a99eeaa4c3f40268fe5692db6daff3fa07929e50095b92df64ec28f44a8` |

**Kiro VERDICT: ACCEPT.** The Principal's integration handoff reports an independent review of this six-file archive against the previously reviewed five-file baseline, verifying archive integrity, actual MCP invocation, credential containment, launcher behavior, clean installation, all 15 deterministic tests and relevant negative cases. This is Principal-supplied independent-review evidence. Codex neither repeats nor self-certifies Kiro's acceptance; the raw Kiro report is not supplied as a repository artifact here.

The archive and working candidate exclude `.env`, credentials, `node_modules`, logs and temporary files. A local containment check compared candidate contents with existing credential values without printing them and found no inclusion. This is an artifact check, not a proof of complete runtime isolation.

## Verification and Principal observation

Runtime verified for integration: Node **24.18.0**, npm **11.16.0**, `openai` **7.43.0**, MCP client **2.3.1**, unchanged H-001 MCP server **2.3.1**. H-003 actually exercised **MCP 2026-07-28** over local stdio through the SDK's pinned modern path. H-002's Codex 0.163.0 observation of **2025-06-18** through SDK compatibility remains a separate fact.

Final deterministic command: `wwt --test` (equivalent to `npm test --prefix tools/mcp-standalone-agent`). **15 tests PASS, 0 failures**, using controlled model responses and the actual H-001 server. Coverage includes two-turn discovery/invocation and result forwarding, no invocation without a requested call, unauthorized tools/arguments, malformed JSON, parallel/repeated call bounds, session bounds, sanitized API/quota errors, isolated `.env` credential selection, missing-key handling and normal/error/signal cleanup. No billable API call was needed for this integration check.

The actual live model is `gpt-5.6-luna` via the OpenAI Responses API. API authentication initially was missing; the Principal supplied the key in ignored root `.env`. HTTP 429 initially blocked inference. After the Principal reported payment, live calls proceeded. The first live answer specimen still failed: MCP returned the correct greeting but the model denied tool access. The corrected post-result instruction then produced the actual greeting conversationally. That failure and correction remain preserved in the frozen README; they are not erased by later success.

Codex's corrected live author test made two actual model-requested `hello_world` calls, received two exact `Hello, world!` MCP results and two exact conversational greetings, then observed server exit 0/reaped and host exit 0. Four model requests reported 808 input and 46 output tokens; actual billed dollars were not exposed.

The Principal supplied personal terminal transcripts of `wwt`, `say hello`, and `do it again`, showing both actual `Tool> hello_world` invocations, both `MCP> Hello, world!` results and both `Agent> Hello, world!` answers in one running process. The current integration handoff additionally confirms **successful personal shutdown** and **explicit Principal acceptance**. The full Principal-observed two-turn conversation reported 802 input and 46 output tokens. Shutdown confirmation is attributed to that handoff; no absent transcript is invented.

**Temporal reconciliation:** the frozen README's pending review/acceptance/shutdown text describes its freeze time. This dated receipt supersedes those pending statements. Accepted candidate bytes are deliberately unchanged.

## Operator procedure and credential boundary

From Terminal, run `wwt`, type `Say hello using your MCP tool.`, then `Do it again.`, then `exit`. Observe the separate `Tool>`, `MCP>` and `Agent>` lines, followed by `Disconnected: MCP child exited 0 and was reaped.` The local `~/.local/bin/wwt` symlink points to the accepted repository launcher. Another checkout uses the installation instructions in the unchanged README; the user-local symlink is not a tracked repository file.

The launcher installs missing locked dependencies, then starts the agent without a key prompt. The agent selects `OPENAI_API_KEY` from the existing ignored repository-root `.env`; a process environment value takes precedence. No credential is committed or printed. Dependency commands and the MCP child are not given the model API credential by the application. The model receives the synthetic running conversation, inert tool metadata and actual tool results; `.env` contents and repository documents are not model context. Hosted inference is not local-only processing. Conversation history is in-process only.

## Accepted nonblocking findings and assurance limits

- Kiro's remaining mutation-test coverage gaps are **nonblocking**, not proof of exhaustive falsification. The exact uncovered cases are not enumerated in the supplied integration summary.
- Kiro's Ctrl-C messaging issue is **nonblocking**. Signal cleanup tests passed, but that does not erase the reported messaging limitation. No accepted code is changed to address it here.
- Shared repository-root `.env` access is an accepted bounded-experiment limitation. Selecting only one parsed value for configuration does not create a filesystem sandbox: the host runs as the local operator and can read the shared file. No broader credential or private-data isolation assurance follows.
- H-001's separate nonblocking SDK 2.3.1 version-enforcement anomaly remains unresolved; H-003 neither fixes nor generally certifies protocol enforcement.

This acceptance establishes the bounded single-operator synthetic hello-world experience. It does not establish cross-user isolation, backend grants, financial semantics, generated-answer integrity generally, complete inference-context provenance, provider retention guarantees, production security, deployment suitability or a permanent model/host architecture. No API v2, Holdings, brokerage, trading, H-004, persistent memory or multi-user functionality is integrated.

PL-MCP-01 remains **INTAKE**. No Reconciliation Completion Record is created. No maintained Account/Position subject meaning changes; no new assimilation ID, Principle or ADR is required or allocated.

## Integration receipt

Initial local HEAD: `65604784ee4ea6141cab66f7bb482a437cbe6e7b`. Initial remotely verified main: `d21659c6103543659deee8182372228f5f891af2`. The first two intervening documentation commits were preserved by fast-forward. Remote main then advanced again to `81a15e01b76ee69dac7dc9b9dac8081d545026dd` with Herbie terminology/discovery documentation; Codex inspected the routing change and preserved both further commits by fast-forward before committing. No candidate or H-001/H-002 paths changed. Active concurrent worktrees were inventoried and left untouched. Current Principal direct-main Git safeguards apply; WW-GATE-001 remains STAGED / experiment_started false.

**Accepted implementation commit:** `ddacef0e9343e2583a8e85d1a6785ce46edb810c`, parent `81a15e01b76ee69dac7dc9b9dac8081d545026dd`. Exactly the accepted six files were staged and committed, including unchanged candidate bytes and executable mode. Direct push to main succeeded. `git ls-remote origin refs/heads/main` returned that exact SHA; a subsequent fetch and comparison of each `origin/main` file against the accepted archive confirmed byte identity. No force push, branch-protection bypass or unrelated file inclusion occurred.

Final deterministic verification on the reconciled baseline passed all **15 tests, 0 failures**, in **3.625 seconds**. No additional live/provider request was made for integration. H-001 files and H-002 `.codex/config.toml` and their existing receipt remain unchanged from the initial local baseline.

**State:** IMPLEMENTED; AUTHOR-VERIFIED; INDEPENDENTLY ACCEPTED (attributed Kiro evidence); PRINCIPAL-ACCEPTED; COMMITTED; INTEGRATED at the implementation commit above. Before this follow-on receipt commit, remote main advanced to `587ac836` with a separate H-004 4AM question-harvest kickoff and canonical link. Codex preserved those accepted changes by fast-forward and reapplied only the owned H-003 appendix; no H-004 work was executed as part of integration. This documentary receipt and its canonical index are a follow-on persistence change; their containing commit is recoverable from Git history rather than a self-referential hash. The canonical parking-lot update was followed by `npm run generate:roadmap-projection --prefix options-prototype` and `npm run check:roadmap-projection --prefix options-prototype`; generation and freshness verification passed. Regeneration also incorporated the already-accepted question-harvest and H-004 kickoff continuations that preceding main commits had not yet projected, plus the required derived source-order shifts. No hand-editing, new experiment or H-004 authority is created by that projection.
