# SPL1 survey summary — parking lots 1–7 + ADR-001…022

Classification: internal, redacted, non-normative survey evidence. Not authority. Repo `main` bef03dd.

## Scope and depth
- FULL: `docs/parking-lot.md` (1–231), `-2` (1–40), `-3` (1–509), `-4` (1–191), `-5` (1–422), `-6` (1–307), `-7` (1–217); `docs/07c-adrs.md` 1–919 (ADR-001…ADR-022). ADR-023 (920–967) out of scope / skipped.
- Spot greps only (not read): Doc 70:74, journal-5:1033–1068, docs/09:932, docs/69:85 (to cite later ADR-022/ADR-007 status).
- Output: 100 entries, 40 decisions (22 ADR + 18 PL-embedded), 87 coverage rows.

## Top 10 findings
1. Base-file rows hold several ratified invariants that the ADR register does not have: monitored-position observation (Aug 24), Portfolio Capital semantics (Aug 20), account locality via `brokerageAccountId` (Sep 21), the PL-SHELL operator topology and engineering import rule (Sep 4), and broker modularity (Sep 2). See D023–D028.
2. `-3` has the Principal's provider-failover architecture (Sep 2). It defines a three-layer split (control plane / provenance+capability / domain), subject-scoped current selection, no frontend shadow evidence DB, server-side per-provider cache isolation, and invariants I1–I13. It is design-only, and the record says an ADR is still owed (D032, E052–E055).
3. ADR-015/016/017 share one spine: "transformation does not create semantic authority". The record keeps it as an observation and deliberately does not elevate it to a foundation (E087). It is consistent with the later backend-authority principle.
4. `POST /api/evidence/refresh` is now a forced one-shot acquisition that bypasses the session gate (PL-OPS-08, Sep 9). Steering still calls it an "administrative nudge" and says Nudge is "not a refresh request" (E081/E082).
5. The posture "colored line" is ActionPosture, not Velvet Rope. Live vocabulary includes WIDE_SPREAD, UNAVAILABLE and DATA_INCOMPLETE, while steering lists only ACTIONABLE/EDGE/WAIT. Velvet Rope domain functions are consumed by live recommendation code (E046, E059).
6. Scheduler doc vs code drift: the docs describe a strict A>B cascade, but the code orders oldest-age-first with A only as a tiebreak. Class A is a put-relevance proxy, not the decision frontier (E047/E048).
7. Production authority is split. The backend is authoritative, but the page carries substantial frontend-only economic interpretation. The Production CSV (accepted) exposes the divergence and does not resolve it; FE/BE decoupling was never started (E062–E065).
8. Capital-state semantics (`-6`/`-7`):
   - stock basis ≠ capital-cycle basis;
   - "cost basis is decision context, not a command to wait";
   - monetary vs time release cost; a recovery attempt "buys another decision boundary";
   - position shape ≠ broker order shape ≠ portfolio consequence;
   - broker eligibility is a separate gate from economic fitness (E071–E077).
9. Decision cardinality is 0..N, with a null-recommendation invariant. Admission → policy fitness → opportunity selection must never collapse into one score. Hard constraints are never weakened to produce output (E069/E070). These are research-stage and not ratified.
10. ADR-019/021/022 form the governed-decision core: replay-bound resolved values, disposition ≠ execution, no fake enabled control, series ≠ obligation, and the opening-anchored whole-Q cohort with a "scoped premise" (E092–E094, E099).

## Top Principal statements (exact; most are document-attributed)
- "backend owns provider/session/admissibility/canonicality semantics; the frontend composes and presents them and must not derive them from provider identity." (07c:613)
- "Provider/environment/regime identity is a provider-control and provenance concern. Wheelwright domain state consumes evidence *semantics/capabilities* — it must not branch on production vs sandbox." (-3:200–202)
- "the conceptual trigger is *confirmed production-provider unusability*, not `401`." (-3:194)
- "Principal — make architecture recovery the next major Wheelwright priority." (PL:98)
- "The Principal clarified that prior-month Production is withdrawn." (-6:179)
- "The Principal selected introducing Positions as the authoritative ownership source…" (07c:780)
- "We now need this artifact to test Production economic truth against real operational evidence reliably." (-4:58; the speaker is inferred)
- "Principal verdict: ready to commit." (-4:186)
- Broker modularity (Sep 2), as attributed paraphrase: "Common integration does not imply common capability; unsupported operations must be refused rather than approximated." (PL:47)

## Decision candidates not in the ADR register
D023 PL-SHELL topology · D024 PL-CLEANUP order and exit · D025 account locality · D026 monitored-position observation · D027 Portfolio Capital · D028 broker modularity · D029 seven-symbol admission, with "DANGER is not an admission veto" · D030 Pass −1 freeze · D031 full-surface DTE acquisition · D032 provider-failover three-layer design · D033 opportunity-history 422 repair with no backfill · D034 forced one-shot acquisition · D035 Production CSV V1 · D036 broker execution-eligibility gate · D037 architecture-recovery priority · D038 NSR · D039 Age first slice · D040 basis-positive CC instrumentation.

## Contradictions and staleness
- PL-ARCH-06 is still listed as an "unresolved Principal decision" after the backend-authority ratification (E002).
- PL-OPS-06 is listed active but was absorbed by the completed PL-CLEANUP (E009). The base header date is stale.
- ADR-008 (Yahoo 496) has been overtaken by the 1306→1313 seed. Steering's "1,286" is also stale (E085).
- Naming is inconsistent: ADR-002 and ADR-012 vs "Deployment" vs steering's "Write Desk" (E086).
- ADR-011 places portfolio state in the frontend, against later backend-authority direction; it has no amendment (E097).
- ADR-014's consequences say Forecast and Mission are "unavailable", but both were later implemented (D014).
- ADR-022's closing sentence on Doc 70 is stale against Doc 70:74 acceptance (E096).
- The 07c header says "Authoritative through September 26", which precedes ADR-022 (E084).
- PL-STRAT-01 lists credit spreads as out of scope, while PL-DEC-BEH uses them as the motivating case. `-5` records the credit-spread correction ("payoff geometry ≠ predictive decision process") (E031/E067).
- Numeric doc prefixes collide (two Doc 39 and two Doc 40) (E040).
- **Information protection:** 07c-adrs.md:778 contains a real brokerage account number (E083). PL-PROD-VALUE and -4/-7 contain real-account amounts. All are redacted in these outputs.

## Coverage gaps
- PL continuations -8, -9 and -10 are not in this assignment. The prior-ledger claims for PL-CONV-01, the backend-authority principle and Account GUIDs were not re-verified.
- I did not read the rich discovery docs (41, 43–49), Doc 67, Doc 70, docs/57, or `foundations/acquisition-scheduler-policy.md`, so the drift claims rest on PL text.
- I did not check whether PL-ARCH-FITNESS-01 was later absorbed by technology-quality-fitness-controls-v1.

## Assumption challenges
- "PL item = absent capability" is explicitly refuted at its origin (PL-GOV-02, E010).
- "DTE target ~21" is challenged by the liquidity-trough finding (E022).
- "Class A = decision frontier" is falsified (E047).
- "Nudge recovers after hours" is falsified (E080).
- The ADR register's "Accepted" status rarely names who accepted. Decisions D001–D014, D016 and D018 are therefore classed Principal-accepted by inference from register status, and each is flagged in its notes.
