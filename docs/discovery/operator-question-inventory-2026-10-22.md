# Operator question inventory — consolidated intake for question-first exploration

**Captured:** October 22, 2026  
**Status:** Category D — consolidated discovery/inventory only; **not** a new Product authority, prioritized roadmap, requirements register, canonical Herbie definition, or implementation authorization.  
**Purpose:** Bring operator questions scattered across conversations and repository sources into one place for review, clustering, deduplication, and eventually choosing a smallest useful question-first specimen.  
**Method:** Preserve user-facing questions as utterances rather than prematurely decomposing them into endpoints. Sources distinguish near-verbatim questions in current Principal conversation, existing historical documents and proposed phrasing. **Coverage is an initial harvest, not a claim that all past conversations or repository continuations were exhaustively extracted.**

## How to read this inventory

- **Source C:** Current October 22 conversation and its referenced separate-thread condor-question transcript. Verbatim or near-verbatim user-facing questions unless marked *candidate phrasing*.
- **Source 80:** [Question-driven lifecycle checkpoint](../80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md). Historical Product/architecture discovery, not current authorization.
- **Source 81:** [Operator journey checkpoint](../81-v2-operator-journey-action-surface-discovery-checkpoint-2026-10-06.md). Historical operator discovery, not current authorization.
- **Source M:** [PL-MCP-01 discovery](mcp-conversational-client-and-llm-isolation-intake-2026-10-21.md). Candidate operator questions and test ideas.
- **Classification U:** Current State Understanding — what exists, changed, means *in this case*, is missing, or breaches an explicitly existing trigger; not an action recommendation.
- **Classification A:** Action/decision or policy question; **not** interchangeable with U.
- **Classification G:** Governance/capital-purpose question.
- **Classification T:** Trust, evidence, authorization, history or meta-question.
- **Herbie:** The Principal suggested “each question might be a herbie, dunno.” **Do not assign a formal Herbie identity or impose a taxonomy without recovering and reconciling its actual governing meaning.** For now these are simply question specimens, not Herbie records.

Questions are grouped for browsing, not sequenced as a roadmap. Numbering is a stable *local reference in this discovery document only*, not canonical project identity.

## A. Orientation and basic current state

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q01 | What accounts do I have? | U | C, candidate first H-004 question |
| Q02 | What's in this account? | U | C |
| Q03 | What's in Sawdust? | U | M §3 |
| Q04 | What positions do I currently have? | U | C, candidate phrasing |
| Q05 | What changed since yesterday? | U | C |
| Q06 | What needs my attention today, and why? | U | C / M conversational trajectory |
| Q07 | Which positions have triggered existing alerts? | U | C, candidate phrasing |
| Q08 | What can Wheelwright establish now, and what remains unknown? | T | C, candidate phrasing |
| Q09 | Am I looking at current state or a historical observation? | T | C, candidate phrasing |
| Q10 | Is the information fresh enough to answer this question? | T | C, candidate phrasing |

## B. Whole-position explanation — simple before complex

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q11 | How is this position doing? | U | C |
| Q12 | Is this position improving? | U | C |
| Q13 | Compared with yesterday, is it getting better or worse? | U | C, contextualized phrasing |
| Q14 | How much have I earned? | U | C, separate-thread condor question |
| Q15 | How much is the position worth right now? | U | C, candidate phrasing |
| Q16 | How much has the estimated cost to close changed? | U | C, candidate phrasing |
| Q17 | Is price positioned well? | U | C, separate-thread condor question |
| Q18 | Which side of this Construction is being tested? | U | C, candidate phrasing |
| Q19 | What's driving the change? | U | C, separate-thread condor question |
| Q20 | How much risk remains? | U | C, separate-thread condor question |
| Q21 | Have I reached a management trigger? | U | C, separate-thread condor question |
| Q22 | Can I actually exit at that price? | U | C, separate-thread condor question |
| Q23 | Are my exit orders correct? | U | C, separate-thread condor question |
| Q24 | How is this trade doing, and what needs my attention? | U | C, separate-thread quoted prompt |
| Q25 | How is my iron condor doing? | U | C, later rejected as *first* H-004 question, not excluded generally |
| Q26 | Is the marked P/L meaningfully different from an executable closing estimate? | U | C, candidate phrasing |
| Q27 | What does “down” mean for this particular position and metric? | U | C, candidate phrasing |

## C. Historical evidence and source confidence

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q28 | How did we get into this position? | T | C, candidate phrasing |
| Q29 | Do we actually know the opening economics, or only today's holding? | T | C, candidate phrasing |
| Q30 | What evidence supports this calculation? | T | C, candidate phrasing |
| Q31 | What observations are missing from this historical view? | T | C / M, candidate phrasing |
| Q32 | Can I request fresher evidence? | T | C, candidate phrasing |
| Q33 | Why is a fee, P/L component, or cost basis unknown? | T | C, candidate phrasing |
| Q34 | What is observed, what is inferred, and what is unsupported? | T | C, candidate phrasing |
| Q35 | Do historical snapshots conflict with today's custody? | T | C, candidate phrasing |

## D. Shares, calls, cash, and governed alternatives

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q36 | What are my moves with this call? | A | 80 §6 |
| Q37 | What are my moves with this existing covered call? | A | 80 |
| Q38 | Should I retain these shares unencumbered, or sell this identified short call against them? | A | 81 |
| Q39 | How do I get the most work out of these shares? | G/A | 81 §2 |
| Q40 | How do I get the most work out of this cash? | G/A | 81 |
| Q41 | Can these shares remain held under the applicable governance? | G | 80 |
| Q42 | Can I acquire additional or replacement inventory? | G/A | 80 |
| Q43 | Which replacement alternatives are admissible, rejected, or unresolved? | A | 80 |
| Q44 | Which interventions are permitted, and what would they cost? | A | 80 |
| Q45 | Is leaving this capital alone a valid outcome? | G/A | 81, candidate phrasing |
| Q46 | What should I do? | A | 80, explicitly distinguished from established permissible alternatives |

## E. Portfolio, objectives, and capital governance

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q47 | How do allocations, liquidity, concentration, correlations and time horizons interact? | G/U | M §10 |
| Q48 | Which purposes, commitments, constraints and priorities govern this capital? | G | M §10 |
| Q49 | Does this Account determine its Operating Regime? | G/T | Maintained [Account/Regime owner](../knowledge/domain/accounts-and-operating-regimes.md) |
| Q50 | Available for what proposed use, in what amount, by when, and without defeating which commitments? | G | 81 |
| Q51 | Can the same capital satisfy every obligation that may require it? | G | 81 |
| Q52 | What capability must this governed quantity provide? | G | 81 |
| Q53 | When must that capability exist? | G | 81 |
| Q54 | Can this quantity take on the proposed use without defeating surviving purposes? | G | 81 |
| Q55 | Has something changed enough to alter its availability? | G/U | 81 |

## F. Context and conversational integrity (questions about the answer)

| # | Operator-language question | Type | Source |
|---|---|---|---|
| Q56 | What do you mean by “better” in this case? | T/U | C, candidate phrasing |
| Q57 | Which exact Construction are we discussing? | T | C, candidate phrasing |
| Q58 | Compared with what point in time? | T | C, candidate phrasing |
| Q59 | Which part of the explanation is certain and which is qualified? | T | C, candidate phrasing |
| Q60 | Does “what needs attention?” identify observed exceptions or recommend actions? | T | C, candidate phrasing |
| Q61 | What about the risk? | U | C, follow-up illustrating conversational referent retention |
| Q62 | Does the operator's conversational context determine referents without becoming authority for financial facts? | T | C, candidate engineering falsifier |

## G. Candidate inventory questions for selecting H-004

The first question need not be about options or complex Construction economics. **“What accounts do I have?” (Q01)** is currently a *candidate*, not a selected or authorized H-004 specification. Consider Q02, Q05, Q08 and Q10 alongside it before choosing. The operator explicitly rejected treating an iron condor as the default first question.

Suggested selection lenses for later review (not assigned scores): genuine operator relevance, semantic unambiguity, existing authoritative API coverage, permission and evidence complexity, falsifiability, operator-visible outcome, and smallest extra capability.

**Crucial semantic boundary:** The Principal explicitly distinguishes **Current State Understanding** from **Decision Support**. “What needs attention?” may report existing triggers, exceptions and missing evidence without prescribing actions. Favorable/unfavorable and up/down require *in this case* context: Construction, metric, comparison time, source quality and applicable operational scope. Do not promote an LLM's generic interpretation into backend financial authority.

## Next harvesting and assimilation work

1. Retrieve remaining relevant question utterances from older project conversations and all relevant journal / parking-lot continuations; this is a partial first harvest, not an exhaustive history export.
2. Separate truly original operator utterances from assistant-proposed phrasings, including consolidating aliases and follow-ups without losing context.
3. Reconcile whether the project's existing “Herbie” concept is relevant and, if so, what a Herbie formally denotes before using that identity.
4. Keep the broad list unranked so the Principal can examine it before selecting the next question. Avoid turning the list into API requirements or a feature backlog.
5. If this recurring question inventory becomes maintained current Product knowledge, route it via the existing 4AM assimilation/owner mechanism; do not turn this historical discovery file into a new unratified owner by accident.

**Disposition:** Collected for inspection, not H-004 selection or implementation authorization. PL-MCP-01 remains INTAKE.


## Principal disambiguation — “Herbie” (October 22, 2026)

**Exact Principal wording:** “Any reference to \"Herbie\" is either a reference to theory of constraints or Hancock. And I never talk about Herbie Hancock.”

**Recovered meaning:** When the Principal says **Herbie** in Wheelwright discussions, interpret it as a **Theory of Constraints** reference (the constraint/bottleneck metaphor), never as the jazz musician Herbie Hancock. Do not create or infer a new Wheelwright entity, question category, backlog status, or Herbie ID from the word. The earlier speculation that each question “might be a herbie” means that a question might reveal a constraint, **not** that all questions inherently are constraints. This clarification supersedes any open-ended “what does Herbie mean?” exploration above, without promoting a new Product Principle.
