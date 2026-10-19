# S81B survey summary — Doc 81 §25–§30 (lines 1239–2293)

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and reading
- Source: `docs/81-v2-operator-journey-action-surface-discovery-checkpoint-2026-10-06.md` lines 1239–2293 (end of file), read FULL; plus context lines 1230–1238.
- Context: prior ledger N2 (Doc 81 previously PARTIAL 1–76 + grep). Targeted greps of docs/README.md, 07c-adrs.md, principles.md, journals, parking lots, src trees for later references.
- Quotes: bold/blockquote markdown stripped; wording otherwise exact. No sensitive content in segment (specimen amounts are illustrative).

## Standing ladder in this segment (important)
- §25 (2026-10-06): OPEN discovery checkpoint; no ratification.
- §26 (2026-10-07): Principal-ratified Product-discovery closure only.
- §27, §28, §29 (2026-10-07): Principal-ratified (Solution Overview; 7 capabilities; technology direction).
- §30 (2026-10-07): Principal-accepted (not "ratified") bounded backend capability proposal + design-falsification obligations.

## Top 10 findings
1. Cash-side primitive discovery closed (ratified): no new cash-specific Product primitive; existing distinctions (purpose, governed quantity, horizon, obligation, evidence, feasibility, execution state) explain all cases.
2. Owner-operator boundary: HITL controls capital; Wheelwright governs only what it can truthfully recommend; four distinct findings (warning, recommendation, HITL judgment, brokerage enforcement).
3. Cash semantics: availability is purpose-relative; "not established" is a first-class finding; job of cash is never inferred from instrument; release ≠ reassignment; future inflow ≠ present funding; cash is not economically inert but Wheelwright is not a valuation/NPV appliance.
4. Scope: household debt optimization out; brokerage financing (margin) in complete-state economics.
5. MVP 1 = bounded RETAIN UNENCUMBERED vs SELL SHORT CALL on an operator-identified contract; first milestone is a comparison, not a recommendation; NO GOVERNED PREFERENCE ESTABLISHED is a successful result.
6. Seven ratified MVP 1 capabilities form a dependency graph of partial findings; evidence sufficiency is conclusion-specific; no global evidence gate; "seven" has no architectural significance.
7. Technology direction (ratified): direct, typed, deterministic functions with explicit, versioned policy; CEL Java and Apache KIE DMN were compared and not rejected as incapable but as unjustified boundaries; explicit reconsideration triggers (CEL, DMN/FEEL, Drools/OPA, custom DSL).
8. §30 resolves §29.8 placement: authoritative governed evaluation in backend under Doc 77 mandate; client caches are HTTP caches only; HTTP freshness ≠ evidence fitness.
9. Capability→component mapping: 5 backend information responsibilities and 4 externally meaningful capability boundaries, explicitly NOT resources/endpoints/commands; comparison is the one new primary operator capability; availability/feasibility/consequence/preference are derived findings, not resources.
10. Each comparison must bind one recoverable AND coherent evaluation basis (conclusion-relative composability, not a universal timestamp); acquisition stays separate from comparison.

## Top Principal statements (exact; markup stripped)
- "CASH-SIDE PRIMITIVE DISCOVERY CLOSED." (81:1476)
- "The HITL controls their capital and accepts the consequences. Wheelwright governs what it can truthfully recommend." (81:1490; within ratified closure)
- "Questions → Capabilities → WW commands and BE resources → Working software → Acceptance tests" (81:1698; "The Principal establishes")
- "Should I retain these shares unencumbered, or sell this identified short call against them?" (81:1706)
- "Derive only the minimum capabilities required to satisfy this accepted Solution Overview." (81:1903)
- "The Principal ratifies seven minimum Product capabilities required by the accepted MVP 1 Solution Overview:" (81:1920)
- "Direct, typed, deterministic functions with explicit, versioned policy." (81:2065)
- "Backend owns state and business logic; clients own presentation." (81:2193; Doc 77 mandate quoted)
- "The Principal accepts the bounded proposal after five design attacks. These are acceptance obligations, not executable verification claims:" (81:2260)
- "Incomplete strategy coverage is acceptable; hidden incompleteness is not." (81:1612)

## Decision candidates not in ADR register (07c-adrs.md grep negative)
- D001 cash-side closure; D002 Product-development progression; D003 MVP 1 Solution Overview; D004 seven capabilities; D005 evaluation technology (direct functions vs CEL/DMN/Drools/OPA/DSL); D006 backend placement of governed evaluation; D007 backend capability proposal (5 responsibilities/4 boundaries/5 obligations); D008 scope boundary (household debt); D009 no mandatory HITL choice event.

## Contradictions / tensions
- Workspace architecture steering ("backend must NOT produce recommendations ... know about portfolio state") vs §30 backend-owned governed evaluation + brokerage/governance state (likely v1-vs-v2 scope split, unreconciled in steering) — S81B-E060.
- §25.12 availability rule (release by "authoritative governance") narrowed in §26.3 to operator revision; §25 candidate superseded — S81B-E014/E018.
- §27.3 decision subject (account+underlying+governed quantity+Growth Wheel context) and §25.10 "governed quantity ... decision subject" vs Doc 82 "Position is the default subject of a Wheelwright decision" (same date) — relationship not reconciled in segment.
- MVP 1 preference status vocabulary (NO GOVERNED PREFERENCE ESTABLISHED, prohibit/permit/prefer) vs v1 Posture ACTIONABLE/EDGE/WAIT — not reconciled.

## Coverage gaps
- None in assigned range (all 1239–2293 FULL). §24 and earlier belong to S81A.
- COTS experiment (§29.6) has no tracked artifact found; Doc 81 is the only record.
- GitHub issue #34 (lifecycle history) referenced but no PL-* intake found by grep; not inspected on GitHub.

## Challenges to assumptions
- docs/README.md:229 indexes Doc 81 only as "Operator-journey discovery and unresolved management semantics" — it actually holds four Principal-ratified/accepted MVP 1 decisions; cold actors will miss them.
- No later doc or code at bef03dd mentions MVP 1 / call-entry comparison / RETAIN UNENCUMBERED (grep); implementation status is unknown, and the last "next authorized action" (81:2291) is a 2026-10-07 historical authorization whose current activity is unverified.
- "Policy Engine" names a responsibility, not a technology — challenges reading the Four Engines as components.
