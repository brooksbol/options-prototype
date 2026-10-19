# S61D survey summary — Doc 61 §§36–45

Internal, redacted, non-normative survey evidence. Not authority.

## Scope and reading
- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md` lines 4694–7115 (file ends at 7115), §§36–45: FULL, every line.
- Comparison context: ADR-019 (`docs/07c-adrs.md` 690–771) FULL; spot greps of `07-architecture-current.md:538–685`, `architecture-roadmap.md:329–379`, `.kiro/steering/architecture.md:44`; prior ledger N2 (Doc 61 was HEADER-ONLY there).
- Markdown bold markers were stripped from verbatim quotes; the words are exact.

## Top findings
1. §§36→45 is one convergence chain: Product reframing → 14-item minimum decision/provenance contract (§37) → seven structural gaps (§38) → Kiro falsifier (§40) → Muse generic challenge (§41) → concrete SQLite candidate (§42) → Codex NARROWED (§43) → Kiro SURVIVES + refinement (§44) → Principal decision A (§45) → ADR-019.
2. Promoted: backend Java+SQLite durably owns three immutable logical roles (Governed Context Version, Lifecycle Decision Record, Operator Disposition Record). DECIDE stays in the browser. Records are partitioned by opaque `brokerageAccountId`. Bitemporal recorded_at is backend-assigned. The canonical input bundle carries resolved values. Purpose stays upstream. UNRESOLVED ≠ inactivity. Disposition ≠ execution.
3. Left as proposal (not promoted): §37's full 14-item contract, §36 UX (Recommendation column on existing surfaces), LET RESOLVE as a distinct Alternative, REVIEW-as-attention, the §42 HTTP surface and field lists, the §44 canonicalization rules, the §42 threat-model enumeration, and Sawdust = Growth (explicitly unratified).
4. Replay semantics hardened twice. §43 showed that evidence generation/provenance ids describe evidence but cannot recover it, because evidence rows are overwritten in place. §44 showed that a policy-version label cannot recover in-code literals. Rule: persist the values DECIDE actually consumed; recompute only pure derivatives.
5. Replay is historical, not reinterpretive. A past BTC must replay as BTC under the old evaluator, even though a corrected evaluator would now say LET RESOLVE (§44, 6868).
6. Implementation witness (2026-09-24): live DECIDE consumed only side/DTE/moneyness/candidate/closePriceSupported. assignmentIntent was hard-wired "unknown". The provisional near-DTE + deep-OTM → BTC rule could contradict natural resolution for GDXJ. Literal values are recorded in E022.
7. Muse showed full server custody is logically unnecessary. The forcing invariant is "no-hindsight rewriting under self-distrust across time". Wheelwright still chose direct SQLite semantic persistence, on engineering minimality only.
8. ADR-019 realized slice (impl note, 2026-09-26) differs from §42's proposed physical shape. Tables are governed_context_version, governed_decision and subject_scope_association. The Disposition role is "defined-but-unused".
9. Two specimens anchor everything: GDXJ covered-call LET RESOLVE (anti-activity bias) and adverse CSP willing-to-own (anti-hindsight). Pre-resolution LET RESOLVE does not depend on BUG-001; full resolution does.
10. Status vocabulary drift for the same decision: §45 says "now ratified", ADR-019 says "Accepted", 07-architecture-current says "Ratified September 24, 2026".

## Top Principal statements (exact)
- "Don't make me think unnecessarily, otherwise I may become emotional and make a mistake." (4718; explicit Principal)
- "A — promote the §§42–44 reconciled candidate into Wheelwright architecture authority before decomposition." (6996; the Principal's literal input appears to be the letter "A")
- "Make the right thing to do the easiest thing to do." (4702; "original sentiment", attribution inferred)
- Principal-affirmed framing (4696) covers "Make the governed process the path of least cognitive resistance." and "Wheelwright determines what the governed process says should happen. The operator determines whether it actually happens." (4862; variants at 33, 4291)
- Principal-supplied guidance: Muse sanitization boundary (§39); PTS/Sawdust contrast; ~31% Codex reserve (6348).

## §45 vs ADR-019: kept vs dropped
- Kept: all 15 §45 promotion bullets, mapped to ADR items 1–11. The ADR-001/004/013/015/016/017/018 relations and the AR1/6/7/8 summary are also kept.
- ADR adds: an explicit minimality list, a "decomposition must define canonical serialization" consequence, a concise boundary principle, and the 2026-09-26 implementation note.
- Dropped by the ADR:
  - LVT Bet mapping, and "no new Bet/Goal/Initiative/AR".
  - "Principal did not change priority/horizon".
  - AR2/3/4/5/9/10 "unchanged" statements.
  - Roadmap-projection regeneration gate.
  - Actor allocation.
  - Explicit threat-model exclusions (§42).
  - "Explanation prose is non-authoritative" (§42 6174).
  - Default knowledge cutoff = the Decision's own recorded_at (§43 6474).
  - context_payload_hash naming and the §44 canonicalization specifics.
  - LET RESOLVE vocabulary.

## Decision candidates not in ADR register as separate ADRs
- D007 REVIEW is attention, not an Alternative (proposal portion).
- D008 no new LVT/AR, no priority change.
- D010 roadmap-projection gate before decomposition.
- D011 threat-model scope for anchoring.
- D012 the §37 contract as bounded scope (proposal-only).
- D013 Muse sanitization protocol (Principal-directed).
- D014 Sawdust Growth explicitly not ratified.

## Contradictions / reversals
- §36 REVIEW Recommendation cell, reversed by §37 (4964).
- §38 four parts → §40 three parts → §41 three logical records in one capability.
- §42 evidence refs falsified by §43. §42 policy_version label insufficient per §44.
- Steering `.kiro/steering/architecture.md:44` ("backend must NOT … know about portfolio state") is in tension with ADR-019 backend-owned account-partitioned decision records containing subject state. The steering may be stale.
- §37 disposition vocabulary (accepted/followed, declined/departed, deferred) vs FOLLOW/DEFER/DEPART.

## Coverage gaps
- None in the assigned range.
- I did not verify that the roadmap-projection.json regeneration occurred.
- I did not read Doc 65 or the migration 010 contents.
- Earlier variant lines (25, 33, 1149, 3025, 4283, 4291) were seen via grep only.

## Challenges to assumptions
- "Authoritative" ≠ "server must hold full semantics" (Muse). The SQLite choice is minimality, not necessity.
- The ADR-019 realized slice has never exercised Disposition. Claims that operator departure is preserved are unproven in running code, per the impl note.
