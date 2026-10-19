# 4AM First Knowledge-Assimilation Slice — Verification Record

**Category:** D — verification/checkpoint evidence. Not authority for domain meaning (see `knowledge/`) or obligation state (see `assimilation-obligations.md`).
**Workstream:** 4AM — Canonical Knowledge: First Working Assimilation Slice.
**Authorization:** Principal, October 19, 2026, "PRINCIPAL AUTHORIZED — OPTION A". Bounded to:
- two maintained domain pages (Account, Operating Regime, Position, Governed Quantity);
- a minimal Git-tracked obligation ledger;
- narrow navigation, bootstrap and steering corrections;
- sequential fresh-actor verification;
- commit/push to `main`;
- a ceiling of 1,500 Kiro credits.

No code, API, policy, data, deployment or brokerage change is authorized. A8 Candidate 4 is not ratified.
**Implementer:** Kiro (repository-resident Implementation Engineer).

## 1. Baseline

| Item | Value |
|---|---|
| Starting remote `main` = local `HEAD` | `345a4d7b1c91e42937a62f0d9d7276b3bc0edb1f` (verified by `git ls-remote`, Oct 19, 2026 ~16:20Z) |
| Working tree at start | clean; no in-flight work to protect |
| Existing `ASSIM-*` IDs before allocation | none (repository search) |
| A8 Candidate 4 packet consulted | local `wheelwright-a8-v3-r4-2026-10-18-cbcc55b2.zip`: `A8-durable-obligations.md`, `A8-ledger-example.md` (guidance only) |
| Approved Codex implementation plan | not available as a separate artifact in this session. The Principal's October 19 authorization prompt (file list, safeguards, increments) was used as the plan |

## 2. Persistence receipt and first GitHub recovery (Session One — before assimilation)

| Item | Value |
|---|---|
| Ledger commit | `b765bae9857cc9575773c7d697d3f25a87038249`, verified on remote `main` via `git ls-remote` |
| Allocated | handoff `AH-c55f13e0ce4d` (RECEIVED, count 2); `ASSIM-0001` PENDING; `ASSIM-0002` PENDING |
| Reader | Kiro `general-task-execution` sub-agent: fresh context window, same IDE session and model family |
| Isolation | fresh `git clone` from GitHub into `/tmp/ww-fresh-1`, instructed not to read the working checkout |
| Commit read by reader | `b765bae9857cc9575773c7d697d3f25a87038249` |
| Exact prompt (request part) | "Recover any unfinished knowledge-assimilation work in Wheelwright — learning that has been recognized but not yet carried into maintained knowledge, and open semantic questions waiting on a decision. For each item, tell me its status, where it came from (provenance), who is responsible for it, who has authority to decide it, what condition lets it resume, and what would close it." Plus repository identity and clone instructions. No path, ID or document number given |
| Injected context reported by reader | workspace steering (project-identity, domain-vocabulary, architecture, development-workflow, engineering-methodology, current-investigation, parking-lot, idea-intake) and the workspace `AGENTS.md`. That injected `AGENTS.md` is read from the local working tree, which equalled `b765bae` at the time, and it already routed to the ledger |
| Discovery path | root `AGENTS.md` → `docs/AGENTS.md` → `docs/assimilation-obligations.md` → `docs/knowledge/README.md` → handoff source checkpoint |
| Result | **PASS.** Recovered both obligations with correct state, provenance, receiver, resolver, permission boundary, resume trigger and closure criterion |
| Reader findings → bounded corrections | (1) Stopping-point priorities 3–4 and §10 were not visibly dispositioned → receipt now states them as deferred, not dropped. (2) `knowledge/README.md` "Being established" status was vague → replaced with links and states once pages existed. (3) Checker missing → delivered in Increment 5. (4) Authorization not linked → this record is linked from the receipt |
| Limitations | Not a separate human-started session. Steering injection is shared with the implementer's workspace and includes the root entry point, so it is not "zero context". Sub-agent independence is a context-window boundary, not an organizational one |

## 3. Commits (all verified on remote `main` by `git ls-remote` after push)

| Commit | Content |
|---|---|
| `b765bae9857cc9575773c7d697d3f25a87038249` | Ledger, receipt, ASSIM-0001/0002 PENDING; `knowledge/README.md`; routing in root `AGENTS.md`, `docs/AGENTS.md`, `docs/README.md` |
| `65e8d61c7f798ad4e3768bb315e76ec95188c17d` | Two maintained subject pages; knowledge index links; receipt scope note; this record (skeleton) |
| `c8c85c551c3fa9f58b802485786c1fea90ba2dfd` | Steering (4 files), bootstraps (3), project-memory protocol, `07-architecture-current.md` scope notes; ASSIM-0001 → APPLIED |
| `0a6535a6d5a9c83cd639739e25546a7eb7bc2dd1` | `scripts/check-knowledge-slice.py` |

## 4. Source-to-subject reconciliation

Every consequential assertion on the two pages was checked against the primary source text in the repository. Each page's mapping table records standing and scope.

| Assertion | Primary source checked | Result |
|---|---|---|
| Account does not determine Operating Regime; governed scope; multi-regime Account; cash-side included; scope identity open | Doc 82 "Operating-regime scope" (verbatim sentence; status line "Principal-ratified … not implementation authority") | **Confirmed.** Prompt formulation matches source |
| Doc 58 "Account Regime … applicable to an Account" | Doc 58 "Identity and economic world" (draft v1.4, unratified) | **Reconciled as distinct concern** (accounting/execution context), consistent with Doc 82's "account accounting/execution context does not establish operating regime" and Doc 80 §6 |
| System-level "cash-flow production regime" | `foundations/regime-objective-function.md` (Aug 10, 2026) | **Additional sense found** beyond the prompt. Scoped as the v1 system-level stance, with a justified non-change to the source and a scope note added in `07-architecture-current.md` |
| Account identity ≠ broker number ≠ nickname ≠ User ≠ grants ≠ ownership | Doc 77 §2 (four Oct 11 sections), Doc 57 Codex review closure (Sept 21) | **Confirmed** |
| Position = default decision subject; no universal identity; URIs candidate | Doc 82 resource-design candidate, "Position versus governed scope", open questions 1–10 | **Confirmed** |
| Ownership / governance / availability separate | Doc 81 §27.4, §28 (both Principal-ratified sections inside a Category D document) | **Confirmed.** Standing recorded per section, not per document |
| 250 SPY = 150 B&H + 100 Growth Wheel | Doc 81 §3 (discovery) and Doc 82 (ratified consequence and standing test) | **Confirmed.** Original context preserved |
| Membership; option cohorts; no inheritance on identical reopen | Doc 69 "Membership semantic"; ADR-022 decisions 1–6 | **Confirmed** |
| Realization claims | `cli/ww-positions-command-2026-10-15.md`, `cli/ww-positions-human-presentation-2026-10-17.md`, journal Oct 11/17 | Dated acceptance kept dated; **current installed/running = UNKNOWN** |

No source contradicted the supplied formulations, so no claim was stopped. One additional semantic surfaced: the formal Operating Regime ↔ Operating Program relationship is not separately ratified. It is recorded as open on the Accounts page, not resolved.

## 5. Steering and bootstrap corrections

| File | Correction |
|---|---|
| `.kiro/steering/architecture.md` | Scope banner (v1 summary; Doc 77 governs v2); "backend must NOT produce recommendations" scoped **v1 only**, with v2 backend business-logic ownership stated; provider row no longer asserts current sandbox limits; v1 section labels |
| `.kiro/steering/engineering-methodology.md` | Shared Execution Contract described as **suspended runtime control**, not "primary execution contract"; permission comes from repository authority/task state/Principal; Product authority not inferred from code defaults or injected context |
| `.kiro/steering/domain-vocabulary.md` | Routing table for Account, Operating Regime, Account Regime (older term), Position, Governed Quantity → maintained owners; delta/DTE targets marked v1 policy examples |
| `.kiro/steering/project-identity.md` | v1 vs v2 recommendation placement; "summary, not authority" routing note; key references add Doc 77, knowledge index, ledger |
| Root `AGENTS.md`, `docs/AGENTS.md` | Route to maintained knowledge and the ledger. Root `AGENTS.md` was not in the planned amend list. It was amended because the authorization's §6 explicitly requires the root entry point to route |
| `docs/README.md` | Maintained Knowledge Rule; index entries (A: knowledge index; C: ledger) |
| Kiro / Codex / ChatGPT cold starts; project-memory protocol | One routing step each; memory protocol adds the assimilation duty (owner update or `ASSIM-*` entry) |
| `docs/07-architecture-current.md` | Scope notes at "Operating Regime and Situation" and "Account locality" |

**Not corrected (outside the authorized file list):** `.kiro/steering/current-investigation.md` still presents the August 31 constraint-identification investigation as ACTIVE. Fresh actors reported it as present but irrelevant. It remains a stale-steering candidate for separate authorization. `.kiro/steering/development-workflow.md` test counts and the architecture steering's "RequestPacer 0.9 req/sec" component line were reported by the fresh actor as unverified/possibly stale; they were left unchanged.

## 6. Structural checks

| Command | Result |
|---|---|
| `python3 scripts/check-knowledge-slice.py --self-test` | **PASS.** 18 ledger fixtures (2 positive, 16 negative: duplicate/malformed ID, missing field, missing receiver, invalid state, APPLIED without revision, absent revision, absent anchor, VERIFIED without witness, self-attested witness, unsupported CANCELLED, unknown handoff, receipt count mismatch, receipt mapping to missing entry, receipt without receiver, missing marker). Plus missing-submission detection, broken link and anchor, stale-steering detection, account-number-like disclosure (commit SHA not flagged) and missing destinations. First run failed one fixture (self-attestation regex); corrected, then passed |
| `--local` | **PASS** (note: ASSIM-0002 OPEN) |
| `--remote 0a6535a6d5a9c83cd639739e25546a7eb7bc2dd1` | **PASS**: objects read from the accepted remote commit |
| `--remote 345a4d7b…` (pre-slice baseline) | **FAIL, as expected**: 23 errors, including missing destinations and both stale-steering findings |
| `--remote` with a SHA not on remote `main` | **Rejected**: "not contained in accepted remote main" |
| Live negative probe: ASSIM-0001 temporarily set to VERIFIED without witness in the working tree | **FAIL** `CLOSURE-UNSUPPORTED`; ledger restored, no diff |

The checker validates structure only. It does not establish semantic correctness.

**Disclosure inspection.** An automated scan of the full slice diff (`345a4d7..HEAD`) found no account-number-like identifiers, long digit runs, bearer/API keys, key assignments or email addresses. Human inspection found no balances, account numbers, credentials or device details on the new pages. ADR-020's existing embedded account number was deliberately not reproduced. Account nicknames (`pts`, `sawdust`) appear only as already-ratified operator vocabulary from Doc 77.

## 7. Session Two — after assimilation

| Item | Value |
|---|---|
| Reader | Kiro `general-task-execution` sub-agent; new context window, distinct from Session One's reader |
| Isolation | fresh `git clone` into `/tmp/ww-fresh-2`, instructed not to read the working checkout |
| Commit read | `0a6535a6d5a9c83cd639739e25546a7eb7bc2dd1` |
| Exact prompt (questions) | Q1 "Does an Account determine its Operating Regime?" Q2 "Which knowledge-assimilation obligations remain unresolved in Wheelwright, and what would let each resume?" Follow-ups: (a) one broker holding of 250 shares — governed differently? decision subject? (b) 300 owned, 100 governed — use other 200 for a two-contract call? (c) governance established, no evidence shares are free of claims — available? (d) governed short-call cohort fully bought back, identical option sold again — inherits governance? (e) accepted Positions table design — tells you what is installed/running? No paths, IDs or document numbers given |
| Discovery path | root `AGENTS.md` → `docs/AGENTS.md` → `docs/README.md` → ledger → `knowledge/README.md` → both subject pages → spot checks of Doc 82, Oct 17 presentation reference, stopping point, this record |
| Q1 | **Correct.** "No"; governed scope including cash-side; multi-regime Account; cash/margin context separate; scope identity unresolved. Cited the maintained owner, then **independently verified the Doc 82 ratified sentence verbatim**. Treated Doc 58 as an unratified draft, reconciled as a different concern |
| Q2 | **Correct.** ASSIM-0002 PENDING with its resolver, permission and resume triggers. ASSIM-0001 APPLIED, not VERIFIED, because no witness was yet recorded (accurate at that commit). Deferred-not-dropped items named |
| (a) | **Correct.** 150/100 split; decision subject = account + underlying + governed quantity (100) + Growth Wheel context; Position identity unresolved |
| (b) | **Correct.** No; feasibility scoped to the governed quantity; membership not inferred from co-location |
| (c) | **Correct.** Not established; availability requires positive evidence |
| (d) | **Correct.** No inheritance; exhaustion ends applicability; ADR-022 scope stated |
| (e) | **Correct.** No; the presentation reference says "NOT implemented or installed"; current state UNKNOWN. Verified against the file by the implementer |
| Injected context reported | Same workspace steering set, now carrying the corrected files. The reader noted the injected domain-vocabulary routing table **pre-stated the gist of Q1 and part of (c)**, and confirmed both against repository owners and Doc 82 instead of relying on it |
| Contradictions reported | None on the questions. Two unrelated steering tensions (pacer rate; test counts), recorded in §5 |
| Result | **PASS** |

### Limitations of the independence results

- Both readers were Kiro sub-agents launched by the implementer in the same IDE session and model family, not separately started human or Codex sessions. Independence is a fresh context window plus a fresh GitHub clone, not organizational independence.
- Workspace steering and `AGENTS.md` are injected from the local working tree. It equalled remote `main` at each test, but the readers were not zero-context. In Session Two the corrected steering itself carried a short form of the answer, which is the intended D5 routing behavior but means Q1 is not a test of unaided discovery.
- No Codex or ChatGPT cold start was run. Their bootstraps were amended but not exercised. That acceptance claim is **NOT VERIFIED**.
- Semantic correctness of the pages rests on the implementer's source reconciliation (§4) and the reader's spot checks. No independent domain reviewer such as Codex has reviewed the pages.
