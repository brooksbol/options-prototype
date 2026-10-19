# SJ1C survey summary — project-journal.md 8351–12469 (2026-08-19 → 2026-09-02)

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and method
- Assigned: `docs/journal/project-journal.md` lines 8351–12470 (file ends at 12469). Repo at `bef03dd`.
- Read every line (FULL) in sequential chunks; 57 `## ` entries → 57 coverage rows, all FULL.
- Context: `prior-ledgers/J-journals.md` (heading-level for this span; it read ~10 short spans here).
- Output: 88 entries, 21 decision candidates. Real balances and account-number-bearing filenames (10252–10266, 8756–8870) withheld/redacted.

## Top 10 findings
1. **Constraint-identification lineage is here and is older than Docs 39/40.** Aug 24 opening burst falsified the capacity model (120 calls/2 min predicted vs 482/11m35s) because multi-expiration acquisition silently multiplied per-symbol cost (E029). Aug 27 Production run: ~96/min pacer, `X-Ratelimit-Allowed: 120`, zero 429s, 64–67% intraday coverage, ~80% frozen-price ceiling, C/D=0 dispatches (E055). Kiro then said "the scheduler is no longer the main villain" and the remaining shortfall is universe composition (E056). Sep 1 says a "provider-bound operating regime" was reached at ~118 starts/min (E064). These readings are stronger than current steering ("Herbie has not been identified"). The Aug 27 interpretation assumed a fixed provider ceiling that Doc 40 later showed was underused.
2. **3AM universe-governance ruling (Aug 27) is a major decision that is not in the ADR register** (D016). It covers: the active universe as a governed bounded resource measured in decision surfaces; "bulletproof" over the promised decision surface; "persist opportunity facts; derive usefulness"; evaluated-failure ≠ not-evaluated; protected obligations that cannot be borrowed; time-to-bulletproof replacing 7:48. The ruler is not named (E058–E061).
3. **The opportunity-history instrument was defective for its load-bearing purpose.** Its 8/8 live acceptance never checked the economics fields. All 62,404 surfaces had NULL winner economics because of a nested-vs-flat DTO mismatch hidden by an error-swallowing emitter (E062, E073). Lesson: "defective evidence instrument", not "insufficient accumulation".
4. **Provider failover learning (Sep 2).** A production 401 and a sandbox 200 occurred at the same time, so entitlements fail independently. Generations kept advancing with zero acquisition. One provider-wide failure produced 124 "failed" symbols. Four concepts were conflated: provider availability, symbol state, regime identity and operator trust (E075, E079). The Principal then reversed the Codex-driven remedy: regime identity is control-plane/provenance, and the domain never branches on provider identity (E080, E081).
5. **Two reversals on put assignment and BW erosion.** The "execution drift dominant for BNO" reading was falsified the same day; the confirmed case is EWY (E013, E019, E034). Put-assignment rendering went through three versions in one day: −$X, then "$X → eq", then shares @ effective basis (E018).
6. **The DTE surface was reconceived.** The ~21-DTE primary was falsified as a liquidity trough, and `selectPrimaryExpiration` had become a Decision constraint by accident (E021). DTE is a feedback-cadence dimension (E051). The DTE-22 collapse was caused by a mismatch between the backend refresh cadence and the 30-min frontend TTL. Evidence presence ≠ Decision admissibility (E052).
7. **Diagnosis failures, each a durable lesson.** Five system-scale hypotheses were falsified before a one-line React dependency was found (E047). A grep-based "frontend never consumed chains" diagnosis was falsified by the Principal using the prior day's live acceptance (E053). A cold-start prompt was corrected by repository memory (E072).
8. **Portfolio Capital semantics.** V1 is broker total minus short-option MTM (D004). A max() inventory repair was rejected as "epistemically dishonest" (E008). Option Summary is a strategy-allocation view, not a holdings ledger (E009). The trajectory has two series (PC plus Appreciation/Erosion). "Don't name a residual" (E023, E025). Withdrawal ≠ capital consumption (E024).
9. **Kreature as independent observer, and "Boring Wheelwright, weird Kreature".** These came from an incident where laboratory debugging broke operational paths. They produced durable engineering standards (fail closed; the snapshot contract is frozen; cache maintenance is load-bearing) and an architecture-recovery band sequence (E044, E046, E049, D013–D015).
10. **Broker-modular execution boundary.** The rule is "common interface does not require common capability". Four pricing concepts are never substituted for each other (midpoint, limit, preview, fill). Lack of integration ≠ lack of capability. Read-only lifecycle observation is a separate authority from submission (E082, E084, E085).

## Top Principal statements (exact, as recorded)
- "The left and top panel on the Console page are crap right now." (8600; repeated 8682)
- "provenance needs a subject" (11707)
- "Boring Wheelwright, weird Kreature." (11182; 11231 as governing principle). Attributed to Principal direction.
- "Wheelwright has crossed the prototype-to-institution boundary. … The answer is "not yet"" (11220). This is Principal direction and may be a paraphrase.
- "Common interface does not require common capability" (12206). Principal requirement, block-quoted.
- "failover may preserve system operation, but it must never silently promote degraded evidence to production evidence." (12028). Recorded as "Principal framing, adopted".
- "Provider/environment/regime identity is a provider-control and provenance concern. …" (12151). Principal correction.
- "leave it alone." (11635). Recorded as an operator instruction.
- Paraphrases: Principal rejected `owned = max(observed, encumbered)` as epistemically dishonest (8814). The Principal "rejected treating every same-day quantity match as 'deterministic'" (9031). Principal disposition "Only open performance work if normal operation repeatedly collides with actual operator demand" (10379).

## Decision candidates not in ADR-001–023
D001 sparklines; D002 Regime B; D003 top-panel; D004 Portfolio Capital V1 (in foundations, not an ADR); D005 attribution tiers; D006 row temporal model and no-wrap; D007 shell triad; D008 max() revert; D009 full DTE surface; D010 trajectory ownership; D011 opening disposition; D012 monitored-position invariant; D013 lab-incident standards; D014 Kreature independence; D015 recovery bands; D016 3AM universe ruling; D017 opportunity-history activation; D019 DEF01 ingestion invariant; D020 PL-PROV-FAILOVER (a future ADR is promised); D021 broker modularity in PL-EXEC-01. Only D018 (ADR-015) is in the register.

## Contradictions and uncertainties
- PL-EVID-07 "resolved / live Decision changes" (Aug 21) vs "snapshot served only the primary chain" until Aug 26 (E050).
- The freeze RCA falsified the 19MB/924MB load as the cause, but the same-day Recovery Direction cites that load as demonstrated fragility (E047 note).
- "Ratified" headings with no named ratifier and no ADR (E087).
- Stale steering facts vs. this segment's learning: DTE target ~21; posture limited to ACTIONABLE/EDGE/WAIT; 0.9 req/s; sandbox 60/min; DELAY_DRAIN semantics (E088).
- The Aug 20 position that "Option Summary remains primary; Positions is validation only" appears to be later revised by ADR-020. Not verified here.
- Chronology defect: the Sep 2 correction entry at 11927 precedes a Sep 1 entry at 11953.

## Coverage gaps
- None in the assigned span. Detail tables (per-position reconciliation, Kreature idea lists, SQL protocols, experiment phase matrices) are referenced, not itemized.
- Later status of open items was not checked outside the span: A/E accounting, the setExpirations regression fix, the Sep 2 emitter failure, the failover ADR.

## Challenges to assumptions
- "Provider-path improvement ≠ whole-system improvement" (current steering) conflicts with the journal's own Sep 1 claim that "Decision coverage [is] complete" in a provider-bound regime. One of the two needs reconciling before a cold actor relies on either.
- Several acceptances verified the wrong property: opportunity-history 8/8 without economics; "60/60 fresh" correct only under a narrow definition. Acceptance criteria themselves need the load-bearing property named.
