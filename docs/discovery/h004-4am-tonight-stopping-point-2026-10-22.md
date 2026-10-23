# H-004 — 4AM stopping point and first operator answer objective

**Date:** October 22, 2026  
**Authority:** Category D stopping-point/Principal-intent record. Not an official Reconciliation Completion Record, new Product principle, or independently verified implementation outcome.  
**Remote main at initial check:** `a3a264d6a892c4999b0a2d6e7a1912733a6af241` (reverify before execution).

## Principal's explicit instructions

1. “persist a snapshot of where we are now”
2. “generate a 4AM prompt for consensus”
3. “take the first question we agree upon and have codex implement it”
4. “i want to see an answer to that question myself tonight in wwt”

The Principal earlier explicitly agreed to **“What accounts do I have?”** as the first H-004 question. Independent Kiro and Codex investigations also recommended the bounded authorized-account-discovery family, often phrased **“Which Accounts can I inspect?”**. Thus the natural operator utterance and backend semantics need not use identical words: the truthful response concerns *Accounts Wheelwright permits this authenticated User to inspect*, not asserted legal ownership or exhaustive brokerage coverage. Treat this as strong first-question agreement, subject to the 4AM consensus receipt and any concrete contradiction.

## Current state and evidence

- [Initial question inventory](operator-question-inventory-2026-10-22.md): 62 initial question specimens, a mix of quoted, paraphrased and candidate expressions; not exhaustive or accepted requirements.
- [Independent 4AM H-004 reconciliation](h004-4am-question-harvest-reconciliation-2026-10-22.md): Kiro found ~30 additional questions; Codex recovered 43 grounded formulations with overlap. Added explicit Production/withdrawal, source-time, capital, history, visualization and provenance concerns; both favored basic Account visibility first.
- **Question-first engineering:** attempt a useful operator question against accepted backend evidence, expose a narrow gap, extend only when necessary. Do not convert all questions into requirements.
- **Current State Understanding != Decision Support.** Questions and answers require referent, measure, time, provenance and applicable context. Direction alone (“up/down”) does not imply favorable/unfavorable. Conversation can produce basic text, a simple table, or an ugly graph where relevant; visualization polish is not the objective.
- **Herbie:** Theory of Constraints reference, not a new object type. One operator question can reveal multiple missing capabilities and a single capability can unlock several questions. *Possible* bottlenecks must not be labeled actual system constraints without demonstrated impact.
- **Historical EWY example:** “Draw me a graph of how my EWY iron condor has performed since it filled.” Illustrates how a simple question can expose product needs, such as historic identity, observations and financial calculation; not a mandate to implement EOD collection or an iron-condor demonstration next.
- **Production example:** “How much cash did the portfolio produce last month that can be withdrawn without consuming principal?” A v1 page distilled into one question, but cash production, economic gain and safe withdrawal need distinct semantics; preserve for later.
- **H-001/H-002/H-003:** first MCP hello-world, Codex conversational invocation and standalone `wwt` are accepted/integrated according to dated receipts. H-003 is local, single-user, model API-backed and bounded; no financial backend tool currently in agent. Existing API v2 foundational Holdings service offers authenticated Account discovery, but this alone does not authorize sending any live Account data to an LLM.
- **API v2 conformance release:** recorded at `10f12ea516d0b0dec860f633be416f8ab52673bf`, local backend and public docs released; BUG-048 remains open and is not inherently material to a synthetic Account-discovery demo. Current main at initial check is later than that release.

## Required 4AM consensus before H-004 implementation

Codex and Kiro should reconcile their already frozen independent question-harvest reports against the existing mainline, rather than repeat full historical archaeology. Obtain a compact **consensus/disagreement record** addressing:
- Confirm the first natural-language question and backend-authoritative meaning.
- Explicitly identify any material dissent or unresolved authorization/meaning concern.
- Bound a synthetic-only Account fixture, including A/B Account visibility and a deliberately ungranted Account, with no real identifiers, brokers' tokens or account numbers entering the model.
- Determine the minimum reuse path through accepted v2 authorization, and enforce that the agent does not invent accounts or claim legal ownership.
- Specify a deterministic API-result vs. agent-answer falsifier and operator-visible evidence of an actual MCP tool call.
- Keep question selection distinct from Product authority, implementation authorization, and production readiness. Preserve PL-MCP-01 INTAKE and separate full context-isolation architecture questions.
- Avoid CLI compatibility work, Positions, Orders, valuation, multi-user production, historical EOD capture, dashboards or prettier graphics.

## Same-evening objective and boundaries

The Principal wants to type a basic Account question into **`wwt` and personally see a real answer tonight**, after the 4AM consensus check. Prefer a fast, disposable, **synthetic-only** local demonstration using the existing H-003 agent and actual MCP/v2 request path. An unsupported static/hardcoded response is not sufficient. An H-004 specimen must not expose real private Account numbers, persistent model memory, brokerage credentials, or data outside the synthetic fixture.

This request expresses strong Principal intent to advance on the agreed first question, but repository mutation, model egress, local API setup, independent acceptance and integration retain distinct authority/verification states. The Codex prompt may **conditionally** proceed to bounded implementation only if 4AM finds no consequential contrary authority and current Git/experiment controls permit; if unclear, report the smallest real blocker rather than silently interpreting research permission as unrestricted code authorization.

**Current stopping point:** H-004 question discovery reconciled; Principal and both actor proposals converge on authorized Account orientation; formal compact consensus/evidence receipt and H-004 implementation remain to do. No H-004 financial question has been observed in `wwt` yet.

CURRENT STATE: H-004 ready for bounded consensus check and possible synthetic-only thin slice, no execution/result claimed.  
DECISION REQUIRED: NO to preserve this handoff; consequential design disagreements require Principal.  
NEXT AUTHORIZED ACTION: Conduct compact 4AM consensus and conditional bounded Codex H-004 implementation, then let Principal observe the answer in `wwt`.
