# SRC1 — Practitioner corpus survey summary

Classification: internal, redacted, non-normative survey evidence. Not authority. Surveyor: Kiro (read-only), main bef03dd.

## Scope and depth
- All of `docs/research/practitioner-corpus/` (8 md files, 7,234 lines, plus 1 PDF).
- FULL: both reconciliation files, repaired `practitioner-corpus-v1.1.md` (diffed line by line against rec-v1.1 and FULL-read for §12), reader v1.1, the Hourglass final reader, corpus v1, Product Challenge Test 2. That is 6,701 lines.
- Charter PARTIAL: read §§1–8, 17–20, 22–24, 28–37. Only indexed §§9–16 (record schemas), §21 (extraction passes), §§25–27 (specimen/framework/narrative standards). 292 lines indexed only.
- SKIPPED: `the-edge-and-the-hourglass.pdf` (binary, 8 pages).
- Downstream checked by grep plus targeted reads: parking-lot-9 PL-RESEARCH-05 and the PL-DEC-BEH refinement, project-journal-5:510-606, Doc 61 (excerpts), ADR-019 header, options-domain-reference / competence contract (grep).

## Top 10 findings
1. No Principal sentence is preserved anywhere in the corpus. Principal involvement is recorded only by actors (journal-5, PL-9): the Option A intake, the explicit-version choice, and the Option A bounded repair. Journal-5:530 attributes the reconciliation work itself to the Principal ("analyst/principal synthesis", rec-v1.0:10). The overlay never says which conclusions are Principal judgments.
2. The corpus's external "verification" cannot be audited from the repository. Except Bollerslev–Tauchen–Zhou (2009), no durable locators exist for CBOE/OCC figures, Tastytrade-style backtests or OCC ex-by-ex. Corpus-v1.1:666-668 calls these reported conclusions and "Resolved" a research state, not validation.
3. Repaired corpus v1.1 contradicts itself. §6 and §12.9 give 7 fully / 2 partially / 3 open, but §5 intro (368), §9 (511) and §11.6 (600) still say 9 closed / 3 open.
4. `practitioner-corpus-v1-reconciliation-v1.1.md` was rejected by Codex but still calls itself "REVIEW CANDIDATE", with no in-file rejection marker. PL-RESEARCH-05 (parking-lot-9:1393) still repeats its superseded findings (binary VERIFY_BY_REFERENCE/EVIDENCE split, broad population qualifier).
5. The most consequential downstream Product use runs from the Hourglass "Inner Game" chapter to the PL-DEC-BEH refinement, Doc 61, and ADR-019 (Accepted: governed decision context and durable replay). Quoted corpus claims include "A system that demands heroic discipline is probably a poor system…" and "Patience is a position", which became "Patience was the process."
6. Mechanics survive; prescriptions and performance claims do not (rec-v1.0:457). Theta convergence, N(d1)/N(d2), ATM decay shape and ex-by-ex are Mechanics. VRP and vol mean reversion are bounded Evidence. DTE rules, the 20/50 filter and management menus are practitioner Policy heuristics.
7. The corpus never evaluates Wheelwright's 0.30Δ / 7–45 DTE / ~21 DTE bands, because it is Wheelwright-blind. The 45/21 literature (manage at 21 after a 45 entry) is "related, not equivalent" even to the corpus's own ≤60 DTE / 1–2-month prescriptions (corpus-v1.1:172). Citing the corpus for Wheelwright bands would be a misuse.
8. Lifecycle semantics recur: payoff equivalence ≠ lifecycle equivalence (CSP vs CC); the Wheel is transition logic (cash→put→stock→call→cash); assignment desirability depends on inventory intent; cross-expiry residual legs persist. Test 2's single NOT FOUND capability was cross-expiry residual-leg management (HYP-09).
9. The Test 2 corpus-first product challenge found 0 existing / 9 partial / 1 not found. Corroborated: Assignment Consequence, Recommendation Brief, Unencumbered Shares. Pressure: covered-call opportunity cost, planned-loss/invalidation, monitoring beyond state display, volatility qualification, probability vs payoff. It is a reconstructed ChatGPT-thread result: "useful pilot, not a pristine double-blind validation".
10. Evidence hygiene that can be reused: the evidence ladder (said→recommended→calculated→demonstrated→decided→executed→observed) and the five number types (realized example ≠ backtest ≠ model probability ≠ historical frequency ≠ heuristic target). The repair corrected two evidence-act promotions: the SanDisk planned exit (never executed) and the 69.6% figure (a prospective calculation, not a realized return).

## Principal statements (exact wording as preserved; none verbatim from the Principal)
- "The Principal therefore selected **Option A** on September 23, 2026: create a dedicated practitioner-evidence research PL and preserve the corpus Product Challenge Test 2 output as a separate research artifact." (parking-lot-9.md:1429, actor-recorded)
- "The Principal selected the explicit-version option after observing that Revision 1.1 existed only as metadata inside the original reconciliation filename." (project-journal-5.md:575)
- "The Principal authorized Option A: execute the bounded repair as `docs/research/practitioner-corpus/practitioner-corpus-v1.1.md` and preserve all existing artifacts as history." (project-journal-5.md:591)
- "A Principal-led exploration beginning from *The Edge and the Hourglass* "Inner Game" chapter…" (parking-lot-9.md:1444)

## Decision candidates not in the ADR register (see decisions.jsonl)
D001 charter freeze and 24/12 admission; D002 freeze plus overlay; D003 PL-RESEARCH-05 intake (Option A); D004 explicit revision files; D005 reject rec-v1.1 and bounded repair; D006 #6/#7 downgraded to partial; D007 retire "Friday really means Saturday"; D008 corpus-first experiment ordering; D009 no-authority guardrail; D011 omissions are not automatic Product blockers; D012 population narrowed to Muse-mediated Cashflow Academy teaching. D010 (Inner Game → PL-DEC-BEH, no new PL/LVT) leads to ADR-019 but is not itself an ADR.

## Contradictions
- Corpus v1.1 backlog state: 9/3 vs 7/2/3 (E030).
- Rec-v1.0 vs v1.1 on RED-003, backlog #6/#7, the 69.6% figure, the SanDisk "exit", and slippage/bracket-order leakage from excluded studies 13–14 (E013, E016, E021–E023).
- Population qualifier: §11.2 retained beside the narrower §12.1, and PL-9:1393 is stale (E018).
- Frozen v1 PAT-005 omits the 540-DTE LEAPS exception (E034). Frozen v1's completion audit says PASS despite missing derivation-status fields (E035).
- Hourglass attribution drift: the "shadow cost" phrase is not in the corpus (E053); a hybrid $180/[amount-redacted] specimen (E054); "always buy at least three months" (E055).
- CSP/CC synthetic equivalence: "identical" (OBS-023) → "similar" (reader) → "related under put-call parity" (Hourglass). It is on no backlog item, so it is undispositioned (E037).

## Coverage gaps
- Charter schemas §§9–16, §21, §§25–27 were indexed only. The PDF was skipped.
- The upstream Muse artifact (`external-artifacts/cashflow-academy-options-knowledge-base.md`) and the Codex review artifact were not read. Neither is in my assignment.
- Downstream Doc 61 was sampled, not read in full. ADR-019 header only.

## Challenges to assumptions
- "Verified" or "resolved" in the corpus does not mean externally auditable (E029). The options-domain-reference ex-by-ex mechanics carry their own OCC citations, and I could not establish that they derive from the corpus.
- Doc 59's filename and header say 2026-09-24, but git shows it added on 2026-09-23 before the charter freeze. Its source video looks like corpus study 8 (unverified), which would mean one video fed both the semantic falsification and the "blind" corpus (E061).
- The corpus's "willing to own" and "assignment as plan" match Wheelwright's prior both-outcomes-acceptable principle. They converge with it; they are not its origin.
