# SJ1B: Journal survey, project-journal.md lines 4022–8350

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and method
- Segment: `docs/journal/project-journal.md` lines 4022–8350, from main bef03dd. This covers 59 `## ` entries dated 2026-07-16 to 2026-08-19.
- Every line was read (FULL). No segment was partial or skipped. The next entry starts at line 8351, outside this assignment.
- Outputs: 111 entries, 36 decision candidates, and 59 coverage rows.
- Redactions: the Fidelity account identifier (lines 5877, 5898), the Principal's personal name (5077), real production/target/resolving dollar amounts (5233-5250, 7231-7239, 7355), and the real Activity History totals.
- Integration was spot-checked with grep outside the journal. A few greps timed out, so integration status for those items is unverified.

## Top 10 findings
1. Evidence Appliance origin (4255-4297): the browser is a viewport ("You don't 'refresh' a thermometer. You read it."). Listed consequences include single acquisition authority, required persistence, session awareness as correctness, sealed validity, and Refresh as an administrative diagnostic. The journal records no ratifier.
2. Evidence-state semantics were corrected twice on 07-16. Freshness became the oldest evidence among displayed recommendations, trust and activity became separate, Evaluable was split from Eligible, and thresholds became policy defaults. The 08-11 live session showed freshness was still derived from publication time. That session separated publication freshness, per-symbol age and admissibility, which produced "These recommendations are valid; this search is incomplete" and probably the REGULAR_OPEN_DELAY state.
3. Origin of the "no browser shadow evidence store" rule (7006-7062). IndexedDB was found to be "an independent durable evidence store with merge semantics" that mixed generations. The 07-16 promise to remove IndexedDB market evidence was still unmet on 08-12.
4. Production accounting semantics (5170-5279), encoded in implementation rather than an ADR: cash basis, Asymmetric Realization (erosion never netted), "does NOT silently apply FIFO", run-date attribution, and backend-only semantics. This is an early Mechanics/Evidence/Policy separation.
5. Buy-write construction ran through a chain of falsifications. Prod v0 conflated production with lifecycle consequence. The ATM-bias hypothesis was falsified, and the real gap was a missing strategy-fitness layer. 76% of selections were dominated, so "delta proximity is not an optimization". Finally, delta was treated as emergent, with a 0.37–0.53 cluster. Delta targeting had been carried over from CSP; a cross-structure symmetry assumption failed.
6. Capital-state hypothesis: CSP and BW are inverse state machines over {cash, equity}, and encumbrance may be a missing primitive ("Cash securing a short put is not the same state as idle cash"). This connects to the Capital and Governed Quantity subjects.
7. Epistemic Pipeline (5563-5690): Reality → Evidence → Facts → Derived Facts → Interpretation → Policy+Situation → Recommendation → Decision → Execution. The entry says "This is not an ADR". It also gives "Evidence belongs to providers; Facts belong to Wheelwright" and a test for derived fact vs interpretation.
8. Mission and Outlook: "Mission/output pressure must never weaken deployment admissibility policy". Linear calendar-pace extrapolation is invalid. Outlook has tiers O-1/O-2/O-3 and a decomposability test. Forecast uses a dual-clock model with temporal quantization.
9. Project memory: "Persistence is not recall". Failure A is persistence without recall; Failure B is recall without persistence. The journal carries fidelity, not correctness. Retrieval must be topical, not recency-based.
10. Operator Console principles: "shows what IS" vs what the system is DOING. The Console is a projection through a chosen axis. It is a data grid, high-contrast black-on-white, with "Health" not an architectural concept. Snapshot state and provenance enrichment are kept separate (BW origin found by same-day purchase+STO matching). Kreature: "always watching; Evidence remembers".

## Principal statements (exact or attributed)
- "Principal corrected again with explicit boundary: the Three Actor Model refers to the development methodology, not runtime surfaces" (5096, attributed)
- Capacity constraints: "No synthetic ratios or composite metrics — only directly interpretable facts." (5457, Principal-directed constraint list)
- "The Principal explicitly rejected \"capacity utilization\"…" (5483)
- "How am I tracking this month?" / "I don't know my total portfolio value in Wheelwright." / "What about after all this capital cycles?" (7353, 7356, 7452). Accuracy over precision was explicitly stated.
- "I do not want the pale gray-on-white typography that modern web UIs often use." (7887)
- "We independently wandered toward some of the same solutions because Fidelity has spent decades learning how to put a lot of financial information on a screen without making it unusable." (7916)
- Inferred Principal origin, not attributed: "maintain the human in the loop while reducing the probability that the idiot gets into the loop" (4341); "Kreature is always watching." (8201); "Make as much money in a bear market as in a bull market" (6386)
- Process: "The Principal repeatedly needed to remind the AI actors to perform documentation reconciliation…" (7487); UX collaboration model (7719)

## Decision candidates not in ADR-001–023
Evidence Appliance identity (D003); backend acquisition with 30s polling (D001); evidence-state corrections (D002); SQLite via test oracle (D004); parking-lot doctrine (D006); selection validity (D008); Epistemic Integrity acceptance (D010); recovery-probe policy (D012); Three Actor split (D013); production accounting semantics (D014); yield not suppressed (D015); fail-fast credential check (D016); capacity sidebar constraints (D017, Principal-directed); Fifth Engine rejection (D019); BW Fidelity handoff (D020); BW Increment 1, the pause, and delta removal (D025–D027); strategy-expansion semantics (D028, Principal-accepted); Workstream gate (D030, Principal-directed); bootstrap and journal-role changes (D032–D033); provenance enrichment (D034).
D031 amends ADR-013 and ADR-014 but adds Epistemic Precision and Resolution Outlook. Most of these record no named ratifier.

## Contradictions and reversals
- SQLite "deferred" (4330) vs implemented the same day (4345).
- Root cause of the live/offline discrepancy: "the real defect" was named as IndexedDB incoherence (7006), then the next entry said the delta range was "the actual cause … (not cache incoherence)" (7068).
- Universe 1306 in live entries vs 1,286 in the seed and steering vocabulary.
- 07-24 "fix parked" for prior-epoch failures was reversed by the 08-04 implementation.
- "Wheelwright stays client-side" (4158) later became the PL-ARCH-06 debt.
- Raw Activity CSV is persisted in browser localStorage (5418), in tension with the later no-browser-shadow-store rule.
- The 08-19 entry cites an "August 11" source for the cold-start acceptance test; the actual source is 08-06 (5106).
- T0/T1/T2 is called a "Durable principle" (5001) but was "deliberately NOT promoted" the same day (5038).
- Dark high-contrast direction (5536) was later displaced by light black-on-white (7887).
- Six headings are dated 2025-08-12 (year typo). The Calls Horizon entries are undated and out of order. ET and MT are mixed.

## Challenges to assumptions
- The vocabulary entry "Delta target 0.30" is CSP-specific. BW evidence says delta is explanatory, not governing.
- "Failed refresh preserves evidence" was accepted for Java on a behavioral test, not live observation (4856).
- Several "principles" (Epistemic Integrity, global freshness contract, state-oriented console, parking-lot doctrine) appear as accepted or established with no recorded ratifier. Their standing needs Principal confirmation.

## Coverage gaps
None within the assignment. Not verified: current implementation state of the 08-11 admissibility invariants, the localStorage CSV, and BW delta policy after 08-12.
