# SJ1A survey summary: project-journal.md lines 1–4021

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and method
- Source: `docs/journal/project-journal.md` lines 1–4021 (journal start through the 2026-07-15 entries). 55 `## ` segments, all read FULL (4,021 lines).
- I grep-checked cross-references in `docs/` (principles.md, foundations/, 07c-adrs.md) and the backend build file. Real account holdings and balances (L1476-1494, L1514, the cash-state table after L1536, L3898/3906) are withheld or redacted.
- Outputs: 61 entries, 23 decision candidates, 55 coverage rows.

## Top 10 findings
1. **No explicit Principal attribution exists in this span.** "Principal" never appears in L1–4021. The human appears as "operator", "we", "user" or "instinct". The only explicitly attributed actor block is "Kiro's Analysis" (L3031). Every Principal statement in this period is inferred, and "Decision" sections have no named decider (E059).
2. **Many principles exist only in the journal.** The following have zero hits elsewhere in docs/: "Three Kinds of Knowledge" (computability gate, self-declared "standing methodology rule", L840/884), "History should refine operation, not prophecy" (L1120), "Policy is evidence-generating" (L775), "Institutional Reasoning Stack" (L2240), "Capabilities reveal composition" (L1017), the "ingress ladder" (L1203) and "the browser may cache data; it should not own the job" (L3729).
3. **Some foundations were promoted but never written.** Retire Uncertainty ("the telos"), Reality Arbitrates and Capabilities Over Containers were "promoted to foundation" (L3184, L3246, L3286). No such documents exist. The 07-15 reconciliation still claimed "No orphaned ideas" (L3889) (E045, E061).
4. **Inventory authority was reassigned twice.** It went from the Activity CSV as authoritative causal source (L1466), to Option Summary as "inventory authority" for /app/write (L3421), to Positions under ADR-020. The activity-replay vision was never recorded as rejected (E030).
5. **Key terms changed meaning.** "Three Actor Model" first meant the Explorer/Governor/Operator product roles (L3131, L3396). It now means Principal/Architect/IE, and the product sense moved to cognitive-role-separation.md. "Wheelwright" first named only the internal recommendation layer (L3613) and now names the whole system (E048, E051).
6. **The Evidence definition drifted.** In 2026-07-08 it covered "market data, portfolio state, or Fidelity exports" (L603). Current vocabulary narrows it to observed market facts. Recommendation was "an application feature" (L602) (E009, E010).
7. **Velvet Rope was built in the browser.** In July 2026 it was a working page with an immutable localStorage audit, 369 tests and later multi-expiration evaluation. Current steering says "designed, not live". A cold actor could misread that as "never built" (E026).
8. **Several invariants have early precursors here.** "Provider failure ≠ rejection … must never overwrite the latest successful policy evaluation" (L1635) prefigures "failed refresh preserves evidence". Evidence Context (operational vs observational, L2971+) prefigures the session gate. The after-hours gap prefigures sealed evidence: "the after-hours experience should be the system's strongest moment" (L3918). Top-20-regardless-of-affordability (L3930) prefigures "affordability is not a gate".
9. **Several assumptions were falsified or challenged:**
   - single-contract market quality (XLK/XLE)
   - relative spread as execution quality (SCHD)
   - SEC ticker file as a catalog
   - one Wheel operating model for all instruments (SOXS)
   - one "available cash" number (Fidelity rejected an order when a pending EFT was not counted as collateral)
10. **The chronology has defects.** Three entries are dated 2025 (L306, L362, L447). Ten entries headed 2026-07-03 (L2971-3571) sit after the 07-13 entries, and their content implies about 07-13/14. "Experiment 003" names two different experiments (L2151, L2343).

## Candidate Principal statements (none explicitly attributed; exact source text)
- "Optimize for observation cadence, not merely implementation cadence." (L202)
- "**Do not elevate rationale into architecture until it becomes computable.**" (L840)
- "**History should refine operation, not prophecy.**" (L1120)
- "A profitable individual contract is not automatically a good overlay decision." (L1137)
- "Architecture should converge at the rate of learning, not the rate of spending." (L3262)
- "This isn't a UX bug. It's an architectural boundary being revealed." (L3742)
- "Yield is the market's compression of multiple risk factors into a single price." (L3970)
- "That's not a score. It's a translation." (L3998)
- Backend preferences (Java/Spring Boot, SQLite, AWS, "Security from day one") were recorded "based on operator familiarity" (L3797-3811). That makes them the strongest Principal-directed decision in the span.

## Decision candidates not in the ADR-001–023 register
- Slice-1 no-backend/no-Java stack (D001, later superseded), and the constraint on Kiro's role (D002).
- Computability gate (D006) and the history/ML guardrail (D007).
- Velvet Rope first-slice rules (D008) and the measurement freeze (D010).
- ProductStructure as facts, with Strategy Authorization parked behind a "3+ instruments" revisit trigger (D011).
- Prior-audit context that does not filter (D012).
- /app/write decisions: portfolio-snapshot input contract, Demo as first-class, cash by direct assignment, graded execution risk (D015–D017).
- The 07-15 backend move (D019). This is the ADR in `docs/08-adr-backend-evidence-service.md`, which sits outside the 07c numbering. Its Phase 2 "TypeScript" was superseded the same day.
- Single-click loop bridge (D021), Conditioned Operating Opportunity as explanation before ranking (D022), and affordability as an annotation rather than a filter (D023).

## Contradictions and tensions
- Membership in the 07-13 universe was "evidence of external curation, not institutional suitability" (L2767). ADR-008 then lists "Yahoo 496 as authoritative put universe" (L3629). That universe was later replaced by the 1,286-symbol seed.
- "Security from day one" (L3809) appears unimplemented. A grep shows no Spring Security dependency in `evidence-service-java/build.gradle.kts` at bef03dd. I did not check other auth mechanisms.
- "Wheelwright stays client-side" (L3701) is now labeled transitional (PL-ARCH-06).
- An explanation was corrected after an overclaim ("Correction accepted", L3974-3978). The corrector is not named.

## Learning left where it is (parked, never closed in this span)
- Operational-fit third axis
- Policy response signatures
- Structured decision-trace triggers
- Unit of observation for market quality
- Liquidity topology and side-specific operating modes
- Progressive Attenuation
- Reality Arbitrates
- Strategy Authorization

## Coverage gaps and challenges
- All assigned lines were read FULL. I did not read the referenced docs (velvet-rope/*, 08/09/10/11 design docs, conditioned-operating-opportunity.md, market-priced-risk.md), so their integration of these ideas is unverified.
- **This challenges an assumption of the survey design.** The focus brief says "journals are the main home of exact Principal wording". For July 2026 that does not hold: the journal speaks in a collective or actor voice. Exact Principal wording for this period would need another source, if any exists.
