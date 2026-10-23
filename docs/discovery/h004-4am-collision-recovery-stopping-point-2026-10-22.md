# H-004 — Shared-worktree collision: recovery stop and consensus reset

**Date:** October 22, 2026  
**Standing:** Category D incident/stopping-point evidence and Principal process correction; not implementation authorization or an official Reconciliation Completion Record.  
**Remote main verified before recording:** `00e4fc9ff0a5144dda481ca7b9a14b88251b3d11`. This does **not** establish local working-tree cleanliness or identity. Local evidence below is actor-reported.

## Principal process correction

The Principal asked: **“so let's start over. damage control. then move forward with concensus”**.

The Principal's earlier original sequencing was: snapshot → read-only 4AM consensus → Principal review/agreement → Codex implementation → personally observe a useful answer in `wwt`. The previous combined prompt incorrectly delegated a **consensus finding and conditional immediate implementation** to the actors, and was submitted to both Codex and Kiro. That conflated review with mutation and led to same-worktree writes. This handoff **supersedes the prior prompt's permission to implement before Principal-reviewed consensus**. Do not infer that the old actor prompt authorizes new edits or that remote `main` contains the local mixed implementation.

## Actor-reported collision facts (not fresh local inspection)

- Kiro and Codex both began H-004 code changes in the shared local `main` working tree at `00e4fc9`. Neither reported a commit, push, independent acceptance, or operator-visible `wwt` result.
- Kiro reports an earlier self-consistent candidate passed H-003 15/15 and H-004 11/11 controlled tests against a synthetic v2 authorization boundary. During its work another actor replaced `synthetic-v2.mjs`, `server.mjs`, and `talk.mjs` and added `H004AccountFixture.java` plus a Gradle task. Its prior passing tests **do not establish correctness of the mixed tree**.
- Codex independently reported encountering preexisting partial H-004 files, adding a test-only fixture, and then a model-capacity interruption. Its work has not been verified.
- Kiro noted a **plausible, not proven** risk that a Gradle build targeting a tree used by the running v1 backend could mutate class files. No proof of interference; do not run Gradle or other builds until actual process paths and output isolation are established.
- H-001/H-002/H-003 were accepted/integrated previously. No evidence that the remote accepted versions were changed in this collision, but local worktree and running processes require verification.
- Principal and both actor question harvests support **“What accounts do I have?”** as the first natural-language question, interpreted as authorized Account visibility. This is question-selection evidence **not** acceptance of fixture, tool projection, backend operation or model egress design.

## Phase A — damage control (read-only first)

Assign **one** repository-resident recovery owner; keep all other actors out of this shared working tree until its state is frozen and acknowledged. The owner should:
1. Verify `main` against remote, local status, staged/unstaged/untracked paths, process/build paths and active worktrees without modifying files or executing tests/builds.
2. Preserve a complete collision manifest: file hashes, relevant diffs/untracked file copies or a byte-preserving archive outside the tree; exclude `.env`, secrets, node_modules and other private data. Do not delete, reset, stash, merge, rebase, rebuild or overwrite either actor's files merely to clean up.
3. Attribute files and collision sequence where evidence permits; mark uncertain authorship UNKNOWN.
4. Confirm no prior actor's successful test applied to the current mixed bytes and no live-model answer occurred.
5. Return a compact recovery report with exact safe next choices and genuine blockers. Require an explicit separate mutation assignment before touching the mixed tree.

## Phase B — genuine 4AM consensus (read-only)

After the damage report, freeze the implementation effort and reconcile the independently completed H-004 *question* investigations plus current accepted Product/architecture. Define the exact natural-language question, semantic answer contract, minimal synthetic fixture, model-visible disclosure boundary, falsifiers, and safe execution environment. Distinguish requirements already ratified from new candidate specimen choices. Clarify whether a synthetic example may depend on any runtime/build that risks the installed v1/v2 services. Report genuine disagreements or outstanding Principal decisions.

**Hard stop:** consensus report is delivered **before** any new H-004 code mutation, build, model call, integration, or deployment. An actor's “no blocking contradiction” is not a substitute for Principal agreement to the concrete first-slice execution boundary.

## Phase C — later single-owner implementation (not currently authorized by this record)

After Principal accepts the reconciled specimen boundary, issue **a separate Codex implementation prompt**. One implementer in an isolated worktree, a single frozen candidate, Kiro independent review afterward. Prefer reuse of accepted v2 and `wwt`; no real Accounts, credentials or portfolio data in model context. Avoid CLI compatibility, broad framework/agent architecture, EOD collection or financial claims.

**CURRENT STATE:** remote main verified, H-004 mixed local candidate reported; read-only damage-control and Principal-reviewed consensus pending; no H-004 implementation acceptance or observed answer.

**DECISION REQUIRED:** NO to recover and report local state; subsequent implementation boundaries require Principal-reviewed agreement.

**NEXT AUTHORIZED ACTION:** One actor performs non-mutating collision inventory/backup and hands back a verified recovery report. Then conduct read-only consensus and stop for Principal review.
