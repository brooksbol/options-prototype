# SPL2 — Survey of docs/parking-lot-8.md + docs/parking-lot-9.md

Classification: internal, redacted, non-normative survey evidence. Not for publication. Not authority.

## Scope / reading
- Assignment: FULL depth, all lines. parking-lot-8.md 1–1043 (Sep 9 – Oct 3, 2026), parking-lot-9.md 1–1626 (Sep 17 – Sep 24, 2026). Every line was read. 47 segment rows are in coverage.tsv.
- Context: prior-ledgers/P-parking-lots.md. Items that ledger already captured are marked `duplicate-of:prior-ledger` and kept only where line grounding adds value.
- Outputs: 88 entries, 38 decision candidates.

## Top 10 findings
1. **Targeted re-observation exception (PL-OPS-09) is a shipped capability.** POST `/api/evidence/refresh?symbol=` bypasses the freshness/due gate and the session gate. It does not bypass provider stewardship: "Force fresh bypasses freshness policy, not provider stewardship." (-8:222). An Oct 3 addition gives a per-symbol result: `acquisitionOutcome` plus `heldPrice`. The held price is a postcondition. It does not certify freshness (-8:252).
2. **Winner-selection collapse.** `recommendPuts` reduces each symbol to one contract, choosing by execution posture first, before ranking (-8:815, 948). Recipes must therefore see the pre-collapse population. This is load-bearing Decision Engine knowledge, and it sits only in the PL record.
3. **Unencumbered Shares semantics (PL-ELIG).** Free Shares are "snapshot-derived", deterministic but not authoritative. Missing ownership is null, never zero. The encumbrance clamp is "safety behavior", not reconciliation. Provenance is the Option Summary export time only (-8:450–541). The Sep 14 expansion (5c01175) reversed part of the V1 exclusions.
4. **Provider IV semantics.** midIv and smvVol are distinct measurements. Absolute IV ≠ richness. "midIv > smvVol ⇒ overpriced" is inadmissible (-8:869). A raw provider zero is preserved. Quality tags must not resolve BUG-011. Export is "capture, not refresh", and one CSV ≠ one evidence generation (-8:668).
5. **Broker-fact layering.** "broker-native facts → account-regime classification → Wheelwright semantic projection → policy" (-9:187). MARGIN → AWMI, CASH → all-settled available-to-trade, INDETERMINATE → null. Tradable ≠ withdrawable. "Settled cash" is never Deployable. No synthetic Fidelity engine.
6. **Import identity.** Selection-as-identity (e6e743b) coexists in code with a content-identity resolver. Real Fidelity files carry no embedded account identity. Provenance should record the attribution method: OPERATOR_SELECTED / BROKER_EMBEDDED / EXPLICITLY_RESOLVED / LEGACY_UNKNOWN (-9:797–822).
7. **Incognito invariant.** A fresh browser must be able to reconstruct economically meaningful BrokerageAccount state from durable authority (-9:769). The Principal identified it as a test. I found it only here, and it was not on the prior ledger's buried list.
8. **Semantic model v1.1–v1.4 (draft, not ratified).**
   - Event ≠ Observation ≠ Reconciled Transition. Capability ≠ Feasibility ≠ Support.
   - Position is not one identity. Wheel is an Operating Program. HOLD is a normalized Alternative.
   - One share unit cannot fully cover two deliverable obligations.
   - Scenario/Market Thesis is an Assertion family, because "market expectation is not outcome desirability".
9. **Governance rule buried in a semantic-model refinement:** "Explicit Principal direction is valid decision ingress … lack of an already-persisted record must not recursively invalidate the Principal decision." (-9:1187).
10. **Covered-call surface falsified by a lived trade.** On Sep 17 an ATM (~0.50Δ) trade was executed in Fidelity's tool, because the 0.15–0.50 / 0.30 delta band cannot express it. ATM-harvest and basis-recovery postures are owed. The basis definition (strict vs effective-sale; stock vs cycle) is the first open decision (-8:997–1018).

## Top Principal statements (exact, as recorded)
- "Much of the Fidelity / brokerage portfolio information is currently stored only in the frontend/browser." (-9:721)
- The incognito invariant text (-9:769). Plus: "Should this state survive the incognito test?" (-9:775)
- Inquiry order: "incumbent appraisal → observed problem/pressure → solution-neutral “better” → decision criteria → solution-space classes → broad landscape survey → evidence/experiments → decision" (-9:906), described as "explicitly selected".
- "err on the side of verbosity in every detail pane". The operator should never be left asking "wait, what is this one about?" (-9:831)
- Log intent, recorded as "Approximate intent": "look at the Roadmap and see, chronologically, what ideas entered Wheelwright's thinking and what subsequently happened to them." (-9:481)
- The DSL rejection is a recorded Principal decision, but the sentence is document prose: "got ahead of the product model … not to be re-litigated" (-8:872).
- "The Principal owns authority. The system owns transport." (-9:30) and the Inner Game lines (-9:1448, 1452) are discussion/exploration language. The speaker is not explicit.
- Most other "Principal decision" text is document paraphrase: Options 4, A, B, C, D and the authorized expansion.

## Decision candidates not in the ADR register (selection)
- D001–D004: targeted refresh, POST semantics, observe-first stewardship, per-symbol result contract.
- D006: progressive verification. D007/D008: PL-ELIG contract and expansion.
- D013–D016: recipe population boundary, three-arm experiment, DSL closed, Explorer hypothesis.
- D020/D021: cash-layout fix; Upload All dropped.
- D024/D026/D027: Priority never inferred, Log lens, verbosity-first.
- D030: incumbent-first appraisal. D035: decision-ingress rule. D037: Inner Game home.
- ADR-018 (D023) is in the register. I did not check whether the others appear elsewhere as ADRs.

## Contradictions / reversals
- **PL-ELIG status conflict.** The heading and Readiness say "not yet authorized", but the state line says implemented (a129fe1) (-8:398/405/609).
- **Wide-spread gate.** It is a hard-no exclusion in §3 (-8:827) but "annotated, not excluded" in §4 (-8:949).
- **Branch-only work recorded as retained.** The Sep 9 chronology row describes an expanded-row experiment and principle 11 as kept, but both are branch-only. Row -8:270 corrects this.
- **Pacer description drift.** The record says "≤119 starts/60s" (-8:226). The architecture steering says 0.9 req/sec / sandbox 60/min. The steering text is outside my scope; this is a hint only.
- **Log lens counts.** They moved 28 → 30 → 32 events, with 43 → 53 → 51 identities lacking an intake date, after two Codex NOT READY rounds. Earlier records are superseded.
- **PL counts.** "79 PL-* items" (-9:375) vs "60 active" (-9:640). The counting basis is not stated.
- **Superseded "not authorized" lines.**
  - PL-OPS-09 Oct 3: self-noted as superseded.
  - PL-DEPLOY-EXPORT: implementation was not authorized at reconciliation, but the Greeks+IV slice was later committed (7b4a084).
- The Java test-suite intakes have no PL-* id (confirmed at -9:619).

## Coverage gaps
- None within the assignment. I did not open the referenced why-state documents (docs/48, 50, 56, 57, 58, 59, 61), the design doc for the recipe experiment, or the code. Implementation claims are time-qualified to their record SYNCs.
- I did not check the later disposition of PL-ACTOR-01, PL-BROKER-CAP, or the PL-SEM-01 blockers beyond -9.

## Challenges to assumptions
- **Information protection:** -9:249–250 in a tracked file carries what appear to be full brokerage account numbers and real balances. This conflicts with the later account-number confidentiality ratification (prior ledger P-003). Content withheld. This needs a Principal decision.
- Several governance-grade rules live only inside PL refinements:
  - decision ingress;
  - four authorization gates (-8:598);
  - "stop purchasing evidence";
  - transport ≠ authority;
  - the incognito invariant.
  Cold actors reading canonical docs may miss them.
- "Admissible" is explicitly not a safety certificate (-8:821). "Top" on Deployment is display-relative and never a canonical ranking (-8:198).
