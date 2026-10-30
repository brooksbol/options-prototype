# Independent Fidelity share-plus-call geometry assessment — 2026-10-29

**Disposition: Existing semantics support a qualified basis-independent contractual shape when contract terms and quantities establish it. The supplied BDRY evidence does not currently establish an actual capped shape.** This is a read-only financial assessment, not implementation or deployment approval. Runtime examined: b399cfe07b45a53ee4d1023c16b042c1d7170ae1;3ce306fb is documentation-only relative to it.

Independent synthetic probe compiles the exact PortfolioMath source and calls both terminalPayoff and evaluate:

-100shares plus1short call, strike10, evidenced multiplier/deliverable100 and matching underlying/currency/common expiry: QUALIFIED TERMINAL_VALUE; slope100 below strike, slope0 above; terminal-value plateau1000. Opening basis stays unknown. Break-even array stays empty, opening cash and gross unrealized P/L stay unknown. The ordinary evaluate path already emits this geometry; a new financial engine or special cap calculator is unnecessary.
-150shares versus1such call: above-strike slope50, not capped.50shares: slope-50, not a capped long-share terminal value. Existing math truthfully evaluates these configurations; a renderer must not force the matched-cap template onto them.
-100shares versus2calls with independently supplied multiplier/deliverable50: slope0 above strike. The existing implementation does not require a100 assumption.
-Unknown multiplier, deliverable, adjustment, settlement or payoff applicability: unqualified/unsupported with null geometry, as required by the current contract.

For plain standard physical calls the synthetic algebra is V(S)=shares×S−contracts×multiplier×max(S−strike,0). The upper tail is flat only when shares=contracts×multiplier and the actual deliverable/underlying/currency terms satisfy the evaluator. Unknown opening basis affects profit and economic break-even; unknown contract terms affect the contractual shape itself. Those are different missing dependencies.

The author’s safe BDRY audit says Instrument.option=null, multiplier unknown, adjustment/settlement UNKNOWN and no shareCoverage. I did not inspect protected records or independently certify that audit. **Conditional on those supplied facts, plotting actual BDRY as capped is unsupported.** Parseable code establishes some source identity/right/strike/expiration; it does not establish ordinary100-share deliverable or exact cancellation. The absence of shareCoverage is not itself a shape prerequisite; qualified terms and exact held quantities are. Conversely, share support alone would not establish trade membership, governed collateral or current opening continuity.

Smallest justified correction: recover exact admissible contract terms already retained, if present, and enrich through the existing contract/reference evidence owner with Account/source identity and conflict checks. Then reuse current evaluate→inventory projection→native contractual geometry, preserving TERMINAL_VALUE labels and withholding dollar P/L, economic break-even, entry/tenure and exit progress. A terminal-value axis in source currency is not dollar P/L; any visual simplification must keep that distinction. TT1 renderer remains the accepted visual precedent.

If those terms are not retained, this is an **evidence boundary**, not a basis/mathematics defect. Obtain appropriate separately authorized contract-reference evidence through existing acquisition controls, or seek explicit semantics for a conditional normalized template. A hypothetical matched-cap illustration must not be represented as the actual BDRY held shape, and current acceptance does not silently authorize that new meaning. No provider acquisition, new grant or Product authority follows from this report.

Evidence: `/tmp/ww-independent-share-call-assessment-20261029/ShareCallProbe.java`, checks.json, synthetic-terminal-value.json, classpath and SHA256SUMS. Incremental exact-source compilation against previously recorded unchanged supports, not author tests/full-suite/private parity. No protected payload, model/provider request, service/grant/policy/source mutation. Earlier reports remain unchanged.

CURRENT STATE: Qualified capped terminal geometry already works on sufficient synthetic terms; actual BDRY remains evidence-blocked under the supplied audit.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the exact dependency finding for commissioning-actor reconciliation; independently inspect admissible retained contract-term availability before choosing a correction.
