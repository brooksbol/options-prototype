# SJ5 — project-journal-5 survey summary

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and method
- Source: `docs/journal/project-journal-5.md` (2,268 lines, main bef03dd). Every line read (FULL). 118 coverage rows: preamble + 117 `## ` entries.
- Context: `raw/prior-ledgers/J-journals.md`. Targeted greps checked focus phrases.
- Outputs: 114 entries, 40 decisions. Redacted: account numbers (lines 617, 643, 1025), one personal name (294), observation/request UUIDs (1514–1517) and backtest dollar figures.

## Top 10 findings
1. Journal-5 actually ends **2026-10-17**, not 10-15. Thirty dated entries from line 2067 use `###` headings nested under two `## ` entries, so a `## ` index (the prior ledger's) misses Oct 15–17. That span covers PL-API-02 Steps 2–5, ww live STOPPED, the Positions purpose/collateral view and ww accounts. This is the same depth-blindness defect the Roadmap Log hit (SJ5-E024, E103).
2. v1/v2 transition (10-12): v1 governance was deliberately loosened. As a result, a provider-scope widening (tastytrade market-data) was recorded in the journal "instead of" an ADR and is explicitly not a go-forward provider decision (E001, E082, D028).
3. PRIN-ARCH-BACKEND-AUTHORITY (10-13): ww must talk only to v2. tt is a "transitional UX prototype, not the v2 domain-authority precedent". tt live is UX evidence, not an authority allocation (E003, E004).
4. Acceptance discipline converged across three Principal interventions: no environment variables (10-11), a FAILED isolated replay (10-14), and the gate `ww pull && ww history` on the installed path (10-15). Separately: "source merge is not installed Product delivery" (E012–E014, E073, D036).
5. Two v2 reversals that are not labeled as supersessions:
   - Bare `ww fetch`: usage error (10-05) → backend default-subject union (10-15) (E057).
   - Held-evidence GET never contacts providers (10-05) → universal no-contact constraint withdrawn for read-through REST under Doc 77 (10-13) (E058).
6. The Sep 27 series-key ATTACH identity was rejected on 09-28 and replaced by ADR-022 cohort continuity. The journal carries an explicit "do not use the old entry" warning, which is a cold-start hazard (E044, D010–D011).
7. Semantic model v1.3 rejects a universal Position identity. It also separates World State / Observation / Assertion / Reconciled State and Purpose vs Construction. Still a Category E draft, not ratified (E029–E032).
8. Governance truthfulness: "recognition is not authority". Do not manufacture CLEAR. The drawer explains and routes, while governance/setup changes authority. Desired call-away is not the same as pre-accepted stance (E038–E041).
9. IV Rank: the long-held assumption that a Wheelwright IV-history subsystem was required was overtaken by a provider-served metric. IV Rank stays observational only (E080–E081).
10. Operational witnesses with version identity:
    - Step 3 v2 deploy (10-11): migration 018 and tt1; pushed 1425024 (E074).
    - Release e6e3b55 (10-15): 16 subjects, 1,281 history records (E095).
    - ww positions runtime 3de8dce (E097).
    - API docs on Pages from 011defb; issue #39 closed 2026-10-16 (E098).
    - Version unknown: the IV Rank v1 commit and the skull push.

## Top Principal statements (exact)
- "we've shifted our governance focus to v2 and loosened our grip on v1" (1852)
- "ww pull — Update WW with everything so I can start doing stuff." (2095)
- “The interface answers the operator’s question before the operator has to interpret the data” (2036)
- "perfect. acceptance passed. execute end of session protocol" (1965)
- "yes! that's the visualization" (2023)
- "that's good enough for now. accepted" (1892)
- "acceptance PASSED" (2127); "acceptance PASSED; execute end of session protocol" (1569, 2143)
- "simple beauty" (1772); "hammer shopping when I don't know if I have nails" (390)
- Attributed: capabilities are problem-space currency (390); six "-ities" (394); "no environment variables are allowed in acceptance testing" (1755)

## Decision candidates not in the ADR register (ADR-018/020/021/022 are)
- Review convergence/reopening rule (D005).
- Principles register admits only ratified principles (D003).
- Roadmap meta-state foundation (D002).
- PL-BROKER-CAP incumbent-first (D012).
- Semantic model path B (D013).
- Pass 0 census (D014/D015).
- ww CLI: fetch rename (D016), fetch meaning (D017), bare-fetch usage error then its reversal (D018→D035), held no-contact (D019→D031), path codec (D020), show non-transactional (D026).
- Target-only import (D022); Tokens identify Users (D023); backend-only brokerage acquisition (D025).
- v1 loosening (D028); Iron Condors dead (D029); escape handle (D030).
- Pxx+GTD convention (D032); skull and economic baseline (D033).
- Account-nested history (D034); installed-path acceptance gate (D036); PL-API-02 v2-only publication (D037).
- Positions presentation accepted, ww accounts parked (D038); zero-cash RCA kept in the journal rather than a BUG record (D039).

## Contradictions / tensions
- Bare fetch (E057) and GET no-contact (E058), as in finding 5.
- Iron Condors table: "frozen Exit Reliability v0 research viewport" (10-11, line 1810) vs "dead" (10-12, line 1852) (D029).
- tt reads live quotes outside the backend and that is justified as a non-Wheelwright path (E046). This sits uneasily with "brokerage auth/acquisition exclusively backend" (D025) and ww's v2-only rule. tt's transitional-prototype status is how it is reconciled today.
- Broker red as categorical identity (ww accounts) collides with red meaning loss/stop in the tt grammar (E114).
- A failing RoadmapView test caused by a duplicate `## AR1` heading was carried as "pre-existing" from 09-24 to at least 10-12 (E105).

## Coverage gaps / not found
- "with the transition to v2, we are no longer building a prototype" and "we learn something, we leave it where it is" are **not in journal-5**. They appear only in `docs/discovery/4am-successor-knowledge-architecture-preratification-2026-10-18.md:12,18` (E002).
- PL-CLEANUP is not mentioned anywhere in journal-5 (E104).
- Not verified: the linked design, bug and contract docs; ratification text of Doc 77; the outcome of the Fidelity Tier-2 attempt (E049).

## Challenges to assumptions
- The prior ledger's journal-5 date range is wrong (finding 1).
- Several accepted "Product" artifacts are visual targets only. Their semantic capability is explicitly unverified (E101, E087).
- "Validated interaction principle" (E005) is journal language, with no ratification record in this segment.
- Repeated capability-absence inferences were later corrected by the Principal pointing to existing knowledge (10-12, 10-17) (E079, E102).
