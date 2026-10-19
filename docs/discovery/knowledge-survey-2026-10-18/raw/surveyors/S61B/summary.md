# S61B — Doc 61 §§25–31 survey summary

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md` lines 1209–3052 (§25 Operating Program, §26 Economic Construction, §27 Portfolio Mandate, §28 Policy Rule, §29 technical Wheel, §30 Mandate↔Program mapping, §31 Mandate-scope falsification). Every line read (FULL); 96 heading-level segments.
- Cross-checks only (not surveyed): Doc 61 lines 1–30, 3056–3100, 3910–3950, 4120–4230; Doc 58, 62a, 69, 80, 81 (cited lines).
- Output: 63 entries, 10 decisions, 96 coverage rows.

## Top 10 findings

1. Every section is labelled Principal-supplied *independent survey*, explicitly unratified Category E falsification input. The raw Principal-typed text is **not** in the repo. What we have is actor-curated tables plus attributed blockquotes, and §29 is preserved only "verbatim in substance and structure" (2080). Exact Principal wording and typos can't be verified (E058).
2. Operating Program is never formally defined in the segment. The working criterion is "durable, repeatable, rule-governed process spanning states/positions rather than a construction label or mandate synonym" (2615). The candidate set has 12 programs in §25 and 4 more in §30 (accumulation, dividend-growth, asymmetric convexity, cash-reserve ladder).
3. Economic Construction is a point-in-time structure independent of program/purpose (1342). Construction ≠ purpose, program, provenance, Outcome Stance, thesis or policy. CSP = short put + a collateral/encumbrance fact (1356). PMCC exists both as a construction and as a program (1405).
4. Mandate is "what capital is fundamentally for", and Inventory Role is "what a governed quantity is currently doing" (1629). There are 8 candidate mandates. The Principal gave PASS verdicts for Acquisition, Disposition and Protection. Each mandate is said to carry a counterfactual (1637).
5. Policy Rule is defined as "Governed rules that determine how decisions get made" (1773). The survey gives 20+ families across entry, live management, expiration, portfolio and meta levels. The meta level includes rule-change governance: "the constitution's amendment clause" (1832).
6. §29 is the richest single specimen: a 5-state Wheel machine, PR-W-01..16, C1–C6, PF1–PF4 ("natural resolution > intervention"), UNRESOLVED-vs-WAIT, and a proposed "machine-checkable" defining invariant. Sections 7 and 8 are deliberately left open and must not be silently completed.
7. The Principal falsified their own same-day §29/§30 models. Mandate single-valued per Program: falsified. Per Program-phase: falsified. Capital Pool: "vacuous". Inventory Block: "circular". Decision Aspect "survives" (2857).
8. Later in the same document, §32 Muse and the Kiro audit reject DecisionAspect: "has not earned entity status" (4142). A controlled collision found that changing only the declared Mandate produced no legitimate Recommendation change (3946). Anyone reading §31 alone gets the wrong current answer.
9. The binding-vs-inheritance distinction (where a Mandate is durably *declared* vs where it is *applied*, 2966–2985) is the part that carries forward into the surviving "durable declared purpose" line.
10. Sell-side-bias guardrails: tail hedge falsifies "premium received = productive" (1302). Income program density must not be read as priority evidence, and the taxonomy must not be artificially balanced (2517–2526, 2708–2725).

## Top Principal statements (as recorded; attributed)

- "The Wheel treats assignment as the machine working." (1243)
- "A Portfolio Mandate earns its place only if it changes the decision rules and the success metric; otherwise it is just a label." (1485)
- strike governed by "price I'd celebrate owning," not premium maximization (1495)
- "Capital migrates between mandates." (1601)
- "Every Portfolio Mandate smuggles in a counterfactual, and mandate misclassification corrupts performance judgment before any trade is evaluated." (1637)
- "Rule-change rules are the constitution's amendment clause. Without them, every losing week can rewrite the system." (1832)
- "Most retail “strategies” ship with only entry and live-management rules and improvise the rest. Portfolio-level and meta rules are what separate a durable governed program from a collection of trades." (1840)
- "… Any program violating (a) is not the Wheel — it is a premium program with assignment risk." (2288)
- "Portfolio Mandate ↔ Operating Program is n-to-n." (2443)
- "If Wheelwright needs a clean key, phase-qualified programs are the honest unit." (2532)
- "Same Program, same phase, different mandate frame. Phase alone does not determine the evaluation frame; strike-selection intent does." (2799)
- "Mandate binds at decision-aspect scope …" (2857). "Those aggregate mandate sets are descriptive, never prescriptive." (2918)

## Decision candidates not in the ADR register

- D001 surveys preserved as unratified falsification input.
- D002 mandatory reacquisition handoff for future prompts. This is a routing rule that lives only inside a Category E doc.
- D003 no new PL/LVT.
- D004 Acquisition/Disposition/Protection PASS (proposal-only, later reopened).
- D005 Wheel invariant not accepted.
- D006 do not complete §29 open sections.
- D007/D008 Mandate-scope falsification and Decision-Aspect schema (proposal-only; Decision-Aspect superseded).
- D009 17-row spine unchanged.
- D010 sparse regions are not priority evidence.

## Contradictions / tensions

- Internal to §29: "unique Income-mandate" vs the multi-mandate phase model (2292). S0 cash is both "uncommitted" and acquisition-reserve (2301).
- §31 H1 says "Four of thirteen surveyed programs". The §30 mapping has 17 programs and ≥5 multi-mandate ones; long-dated put-write is in both Income and Acquisition at 2461/2465 (E053, my own observation).
- §29 Wheel vs the ratified Doc 69 Assignment-Centric Wheel v1 (69:5, 69:17, 69:57). Doc 69 has no mandates and leaves CSP entry, contract selection and rolling unratified. §29 looks complete enough to be mistaken for the ratified Wheel (E056).
- §29 invariant (desired call-away) vs Growth Wheel's retention preference with "same or substantially similar mechanical topology" (80:58, 80:201, 81:982) (E057).
- Vocabulary drift: §§25–31 use Mandate + Program. Doc 81 uses "Regime" per governed quantity, with ACCOUNT→REGIME not 1:1 (81:58–76). Doc 80:242 uses "Account Regime" in a different sense. "Operating Regime" and "Governed Quantity" don't appear as named concepts in this segment (E060).
- PR-W-09's 20/50-crossover no-write filter is a technical-indicator rule, which may sit uneasily with "policy over prediction". Not flagged in the source.

## Coverage gaps

- None within the assigned lines. The ~35-row construction catalog (1346–1425) is indexed under E007 rather than extracted row by row.
- Not checked: PL-SEM-01 / PL-DEC-BEH current state in the parking-lot files, the earlier Doc 61 "locked 17-row spine" origin, whether the prompts under `docs/prompts/` honor D002, and Doc 61 §32–34 beyond the cited lines.

## Assumption challenged

- Domain-vocabulary steering calls premium "the production output of the system" and defines CSP/Collateral as single concepts. This segment pressures both.
- Wheel identity is not settled by "assignment desired". Topology and governance (Assignment-Centric vs Growth) are the live discriminators.
