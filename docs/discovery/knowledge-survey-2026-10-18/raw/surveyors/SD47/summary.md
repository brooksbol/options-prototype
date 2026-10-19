# SD47 survey summary — internal, redacted, non-normative, not authority

Scope: FULL read, every line, at main bef03dd: Doc 47 (710 lines, last line unterminated), 49 (256), 50 (78), 58 (1238), 80 (474) = 2,756 lines. Context: prior ledger N2-docs-41-82. Spot-checked for contradictions only: Doc 82 lines 9, 48, 104-126; Doc 69 grep. Outputs: 87 entries, 14 decisions, 87 coverage rows (all FULL). Markdown emphasis markers were dropped from verbatims. Real-holding amounts of [amount-redacted] or more and a URL tracking parameter were withheld.

## Top findings
1. All five docs are non-authoritative. Docs 47, 49 and 50 are PL-DEPLOY discovery with explicit non-authorizations. Doc 58 is a Category E unratified draft (58:3-4, 1168, 1236). Doc 80 is a Category D checkpoint with no implementation authority (80:4, 474). None of them records Principal ratification of semantic terms.
2. Accepted vs candidate: no term in these docs is accepted. Doc 58's "settled strongly enough to continue maturation" list (58:1008-1021) is the strongest candidate set. Doc 80 §6 (80:140-149) is the nearest "reuse in v2 unless falsified" set: Account vs Account Regime, governed quantity vs symbol, Mandate vs Program, Constraint/Preference/Outcome Stance, effective vs recorded time, and five distinct negative or blocked kinds.
3. Focus terms with no standalone definition here: Governed Quantity, Operating Regime, bare Construction, Provenance, Production, Evidence, Decision, Outcome, Capital. The nearest defined terms are Inventory Block, Regime/Account Regime, Economic Construction, Formation Provenance, Economic Attribution, Evidence Observation, Decision Subject, Reconciled Outcome, and Capital Boundary/Pool (SD47-E087).
4. Capital-state model (Doc 47): strategies are mechanisms that move capital between states. A recommendation can be a complete path (shares → cash → CSP). Cost basis is context, not a veto. Stock basis ≠ capital-cycle basis. Economic position shape ≠ broker order shape. Midpoint ≠ executable economics.
5. Production (47:479-506): productive output and productive capacity are distinct. Withdrawn Production must not be double-counted as capital repair. The meaning of erosion belongs to the regime, not to mechanics (47:518).
6. Release cost (Doc 49): the choice is between a monetary release cost (realize erosion now) and a time release cost (encumbrance plus risk). A recovery attempt buys a new decision boundary. Doc 49 lists seven dimensions to expose without collapsing them into a scalar.
7. Doc 50 lived off-tool specimen (2026-09-17): this is a negative Product specimen. The operator traded ATM calls in Fidelity's chain tool because the CC surface's delta band (0.15–0.50, target 0.30) offered no ATM-harvest or basis-recovery posture. "The recommendation model, not the data, was the gap" (50:18). Doc 50 classes this as not a defect ticket (50:68).
8. Doc 58 core semantics: Position is vocabulary, not identity (58:778). Complete Position is a conclusion-relative closure. Operating Program persists across constructions, and membership is not inferred from resemblance (58:927-931). Association is a governed, quantity- and time-scoped claim. World, Observation, Assertion and Reconciled State are distinct. There are eight distinct absence states. Recommendation ≠ selection ≠ order ≠ execution. Doc 58 reads "Market expectation is not outcome desirability."
9. Doc 80 v2 milestone: question-driven North Star (80:42, 48). "Clean slate must not become semantic amnesia" (80:130). Economic lifecycle and epistemic evaluation are kept separate. Same Wheel mechanics can sit under different governance, and ROTH ⇏ GROWTH_WHEEL (80:229-237). It defines governed qualitative projection and "complete enough = bounded claim coverage". The first bounded question is "What are my moves with this call?" (80:394).
10. Doc 80 acceptance status: it records no Principal acceptance. Its only Principal voice is the Growth Wheel quote. The scope decision in §12 has no recorded decider.

## Principal statements (exact)
- "Keep my shares until it is foolish to keep them." (80:58, explicitly the Principal's Growth Wheel discovery language)
- 47:485 (document paraphrase): "The Principal clarified an important operating rule: the amount shown by Production for the prior month will be withdrawn."
- 58:1174 "The Principal selected the bounded coherence-and-source-binding path (Option B)."
- 58:1183 "The Principal selected Option D: continue semantic falsification before implementation."
- 50:28-30 (operator voice, Principal attribution inferred): "Sell shares and redeploy the cash." / "Sell ATM calls and wait for another turn later in September." / "Sell basis-recovery calls and hope for the best."

## Decision candidates not in the ADR register (see decisions.jsonl)
D001/D003/D005 PL-DEPLOY dispositions. D002 Doc 46 Collar=Tier 2 mapping superseded by observed UI. D004 Production-withdrawn operating rule (Principal-directed). D006/D007 Principal Option B / Option D for the semantic model. D008 Thesis as an Assertion family. D009 reject a universal Position entity. D010 first v2 question = tactical move set. D011 v2 reuse/defer list. D012 no FOOLISH predicate. D013 completeness definition. D014 regime owns erosion semantics.

## Contradictions and tensions
- 58:766-778 (no universal Position identity) vs 82:104 (Position is the default decision subject). This is a tension. 82:108 acknowledges the burden (SD47-E082).
- 58:125, 161 (Regime / Account Regime bundle operating, accounting and execution context) vs 82:9 (account accounting/execution context does not establish the operating regime). Doc 58 is not annotated (SD47-E048).
- 58:147 (Operating Program = "governed purpose/process") vs 58:135, 80:144 and 80:243-244 (purpose belongs to the Mandate, separate from the Program). This is internal drift (SD47-E046).
- 47:56 (Calls collapses to one call per held symbol) vs 50:43 (Sep 17 export shows several COPX strikes). Probably a time-qualified implementation change; not verified (SD47-E037).
- 58:1, 3 say v1.4, but 58:1125, 1162 and 1164 still say v1.3 (SD47-E066).
- Vocabulary drift across docs: mission regime (47) / Regime, Situation, Portfolio Mandate (58) / Mandate/purpose (80) / operating regime (82). No mapping is recorded (SD47-E083).
- The decision actor widens: "The operator authorizes it" (47:254) becomes "A human, agent, or another explicitly authorized decision layer" (80:30) (SD47-E085).

## Challenges to assumptions
- Steering vocabulary treats "Position" as a plain noun. Doc 58 says it must not carry identity, and Doc 82 re-centres it.
- Domain vocabulary frames delta target 0.30 as the control. Doc 50 shows that applying it to covered calls hid the posture the operator actually traded.
- 80:300 lists ACTIONABLE (a live v1 posture) among unratified qualitative examples. It needs a governed definition under the 80:304 discipline.

## Coverage gaps
- None within the assignment.
- Docs 48, 62b, 67, 69, 81 and 82 were not read in full. Cross-references to them are grep or prior-ledger based.
- Whether ATM-harvest or basis-recovery postures were later implemented was not checked.
- Why COPX calls appear on Sep 17 after the Sep 8 sale (49:45) was not checked.
