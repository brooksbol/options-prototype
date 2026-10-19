# S81A survey summary — Doc 81 §1–24 (lines 1–1238)

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and depth

- Source: `docs/81-v2-operator-journey-action-surface-discovery-checkpoint-2026-10-06.md`, lines 1–1238 (header, §1–§24.18). Every line read (FULL). §25 starts at line 1239 and is out of scope.
- Context: prior ledger `N2-docs-41-82.md` (it covered Doc 81 only PARTIAL, lines 1–76 plus grep). Grep checks of `docs/README.md`, `principles.md`, `07c-adrs.md`, `roadmap.md` for Doc 81 references and phrases.
- Outputs: 58 entries, 7 decision candidates, 55 coverage rows (all FULL).

## Top findings

1. The doc holds two explicit Principal ratifications: CALL-SIDE PRIMITIVE DISCOVERY CLOSED (l.539, 823; dated 2026-10-06) and PUT-SIDE PRIMITIVE DISCOVERY CLOSED (l.836, 1222; date from the header only). Both are narrow discovery dispositions. They ratify no policy, vocabulary, evaluator, or implementation.
2. The header (l.4) still says "not ratified Product authority", and `docs/README.md:229` indexes the doc as "unresolved management semantics". Grep found no reference to either closure in principles.md, 07c-adrs.md, or roadmap.md. The ratifications are under-indexed (S81A-E057).
3. The central operator question is "How do I get the most work out of these shares?" (l.28). Here "work" means the capital performs its intended job under its regime. It does not mean activity, premium, or yield (l.30–42).
4. Regime vs operator profile: "Regime defines the job. Operator profile influences how the operator prefers to perform that job." (l.302). Profile cannot make an infeasible action feasible, override hard constraints, or change regime.
5. The decision subject is the governed quantity, not the account or ticker. Specimen: 250 SPY split 150 BUY AND HOLD / 100 GROWTH WHEEL. Coverage and governance permission are separate claims (l.62–76, 711–742).
6. 99-share specimen: feasibility is distinct from preference. "SELL SHORT CALL — unavailable: requires 100 shares" plus BUY SHARES as the enabling action. The 100-share assumption must not be universalized because adjusted contracts exist (l.137–165, 711–742).
7. The action surface is not a strategy selector. The doc prefers "enumerate → establish feasibility → evaluate → explain → recommend when governance can establish a recommendation" and rejects "always choose one winner". Codex added a 7-rung distinction ladder, explicitly not an enum (l.106–135, 445–455).
8. The governing comparison is the complete resulting economic state of the governed quantity from the current decision boundary. It is not credit/debit, isolated option P/L, historical gain, a strategy label, or a single metric (l.576).
9. Action, outcome stance, and completed outcome are separate. ALLOW EXPIRATION/ASSIGNMENT are revisable stances, not brokerage actions or terminal states. The intervention window can close before the outcome is authoritatively reconciled. Composed actions must not be projected as completed (l.230–256, 649–686, 937–960).
10. Short put = present liability + contingent acquisition, not cash or inventory. Assignment = "cash + acquisition obligation → shares". "100 owned + 100 contingent + 100 uncommitted" is neither 300 owned nor 300 funded (l.884–895, 962–976, 1061–1091).
11. The Codex reconciliation (l.428) found most of the content restates existing authority. The genuinely new pressure is legibility as an operator journey.
12. The doc separates output from capacity: capital can be productive through capacity it preserves. Neither premium nor deployment % is a universal proxy for work (l.365–375). Cash is not a single figure: AVAILABLE TO TRADE ≠ AVAILABLE TO WITHDRAW ≠ MARGIN ≠ RESERVED FOR OPTIONS (l.351).

## Top Principal statements (exact)

- "Tell the operator journey first, through its materially different permutations, then work backward to the governance and evidence primitives required to support it." (l.16, attributed: "the Principal chose")
- "CALL-SIDE PRIMITIVE DISCOVERY CLOSED." (l.823)
- "PUT-SIDE PRIMITIVE DISCOVERY CLOSED." (l.1222)
- "Growth Wheel supplies a share-retention / ownership preference. It supplies no implied bullish or bearish market bias." (l.982, "The Principal clarified")
- "How do I get the most work out of these shares?" (l.28, Principal authorship inferred)
- Word-choice preference attributed to the Principal: action-oriented, low cognitive load, domain-native, specific (l.82–87).

## Decision candidates not in the ADR register (grep-only check)

- D001 journey-first discovery method (Principal-directed)
- D002 call-side primitive closure (Principal-ratified, 2026-10-06)
- D003 put-side primitive closure plus next scope = cash (Principal-ratified, date from header)
- D004 Growth Wheel has no market bias (Principal clarification)
- D005 candidate recommendation boundary (proposal-only, explicitly unratified)
- D006 exploratory vocabulary / SELL SHORT CALL over WRITE CALL (proposal-only)
- D007 cash side parked (later superseded by the cash pass)

## Contradictions / tensions

- The header and README index say non-ratified/unresolved, while two Principal ratifications sit inside the doc (E057).
- §4/§10 list ALLOW EXPIRATION/ASSIGNMENT as "actions". §23.6 reframes them as outcome stances, not independent brokerage actions. This is a refinement, not a reversal.
- The §17 recommendation-boundary candidate is "not ratified", yet later closure text relies on "recommend only when governed semantics establish one". Its standing beyond §24 was not verified.

## Coverage gaps / uncertainties

- The content of the "Principal corrections" mentioned at l.836 is not recorded, apart from §24.8.
- GitHub issue #34 (l.1113) was not read. The author and standing of its quoted text are unverified.
- Who said "The difference is premium." and "I would buy at $680…" is not recorded. These are likely operator/Principal utterances (inferred).
- Whether later docs (82+) or §25–26 amend these closures was not checked.

## Assumptions challenged

- That Doc 81 is purely unratified discovery. It contains ratified closure dispositions.
- That Doc 81 introduces new primitives. Both closures explicitly found none required.
- That any threshold (delta, P50, 0DTE) has intrinsic meaning. Meaning comes from governing policy, and the universal "review-only" reading is rejected.
