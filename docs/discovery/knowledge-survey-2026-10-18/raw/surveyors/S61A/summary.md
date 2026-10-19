# S61A survey summary — Doc 61 §1–24 (lines 1–1208)

Internal, redacted, non-normative survey evidence. Not authority.

## Scope

- Source: `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`, lines 1–1208 (header plus §1–24). Every line read (FULL).
- Context: the prior ledger N2 had only the headers of Doc 61. This survey adds full extraction.
- Light cross-checks: grep for formulation variants across the whole of Doc 61; grep for references to Doc 61 (`parking-lot-9.md:1440`, `docs/README.md:275`, Docs 62/62b/62c).
- Output: 53 entries, 7 decisions, 25 coverage rows.

## Top 10 findings

1. Doc 61 is Category E. It is a capture artifact under `PL-DEC-BEH` that the Principal directed (l.17). It is not ratified, and its completion record authorizes no implementation, UI or architecture change (l.1071, l.1206).
2. GDXJ is the main falsifier. The same mechanical covered call gives different prescriptions once governed purpose is supplied. Mechanics plus evidence are not enough (l.198–210). "Patience was the process." (l.237)
3. The PTS (Income) and Sawdust Roth IRA (Growth/Compounding) specimen shows identical evidence carrying a different meaning under a different mandate (l.274–306).
4. Vocabulary corrections (l.281–290):
   - Accounts are not strategies.
   - A Portfolio Mandate is not an Account Regime. Account Regime is a semantic/accounting/execution context.
   - Wheel is an Operating Program.
   - A covered call is an Economic Construction.
   - Call-away desired is an Outcome Stance.
   - "GDXJ will rise" is a Thesis Assertion.
5. A 17-row decision-journey spine (l.310–369) defines Inventory Block as "which governed quantity is involved". It also defines Recommendation, Action, Execution and Reconciled Outcome as distinct rows. The doc itself admits two compressions: operator selection is folded into Action, and Thesis is omitted.
6. Invariant candidate: "Missing normative context must not be silently replaced with assumed intent." (l.406) This is balanced by the cognitive-load-debt test (l.412–414).
7. There are three reasoning outcomes to preserve: recommended Alternative, governed WAIT/HOLD/natural resolution, and insufficient context. "State 3 must not be mislabeled as state 2." (l.1174)
8. Plan change vs abandonment has four categories: continuation, legitimate reconsideration, governance change, and operator departure. The doc requires temporal provenance so history cannot be rewritten, and says departure should not be moralized (l.464–496).
9. Practitioner heuristics are a specimen library. They must be classified before any use (l.604). 45/21 DTE and delta ranges are only "Policy candidates, not universal truths" (l.633).
10. Sell-side bias is an open falsification question. The roadmap Vision is still "options-income". The danger named is accidental narrowing in Alternative generation (l.686–718).

## Top Principal statements (exact; attributed in doc)

- "recover cost basis through premium and ultimately get the shares called away." (l.188)
- "by-the-book Wheel." (l.194)
- The following are document paraphrases of Principal intent, not exact Principal wording:
  - the capture directive (l.17)
  - "The Principal explicitly wants varying combinations of semantic dimensions without Cartesian explosion." (l.722)
  - the Principal's gear-beside-account proposal (l.847)

## Product thesis variants ("make the right thing easy")

- l.25: "Make the disciplined, process-consistent action the path of least cognitive resistance while preserving final operator authority."
- l.29: "…the HITL primarily exercises authority, not reconstructs the process."
- l.1149: "Wheelwright should make following the disciplined process the path of least cognitive resistance…"
- Outside S61A's range, so speaker not checked:
  - l.3025
  - l.4283
  - l.4702: "Make the right thing to do the easiest thing to do." (called the "original sentiment")
  - l.4706
- No in-range wording attributes the thesis to the Principal. The section 1 goal is described as "discovered in the thread".

## Decision candidates (not in ADR-001–023)

- D001: refine `PL-DEC-BEH`, no new PL.
- D002: no new LVT Bet and no Vision change.
- D003: 17-row working spine.
- D004: no implementation; problem-space mode only.
- D005: contrastive specimen method. Directed by the Principal.
- D006: heuristics must be classified before use.
- D007: mandate coloring kept separate from ActionPosture.
- All except D005 are recorded only as document dispositions. No Principal ratification is recorded in the range.

## Contradictions / tensions

- §5 is headed "Locked" but is "not ratified architecture" (l.367). Who locked it is not recorded.
- Steering domain vocabulary states Delta 0.30 and DTE ~21 as system facts. Doc 61 treats these as policy candidates and calls "30 delta = 30%" a folk rule. This is a tension the surveyor observed; Doc 61 does not state it.
- WAIT is a governed Alternative or Recommendation here, but a Posture in the steering vocabulary. Doc 61 also splits WAIT, HOLD, LET RESOLVE and NO TRADE.
- The options-income identity and Vision versus the open sell-side-bias question.
- The spine compresses selection into Action. The §22 working shape (l.1159) separates them again.

## Coverage gaps / deferred

- §25 onward (l.1209+) is outside this assignment. It contains the Principal's Operating Program survey, the technical Wheel definition and the Mandate-binding falsification. These may revise this segment's Mandate and Operating Program model (see E020, E025).
- The original `PL-DEC-BEH` parking-lot text was not re-read. E044 relies on Doc 61's summary of it.

## Challenges to assumptions

- "Strategy" is not a valid account-level concept. Neither "covered call" nor "Wheel" encodes purpose.
- Current sell-side engines (puts, calls, buy-writes) may carry an unexamined Alternative-generation bias. The doc states this as a question, not a finding.
