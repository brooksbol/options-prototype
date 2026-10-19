# SJ2 — Journal continuations 2, 3, 4 (FULL depth)

Classification: internal, redacted, non-normative survey evidence. Not authority.
Scope: `docs/journal/project-journal-2.md` (1,332 lines, 2026-09-03..09-09), `-3.md` (1,037 lines, 09-09..10-02), `-4.md` (373 lines, 09-16..09-18). All 2,742 lines read FULL. 59 coverage rows (56 `## ` entries + 3 preambles). Output: 164 entries, 48 decision candidates.
Context ledger: `raw/prior-ledgers/J-journals.md` (deepened; several of its attributions corrected below).

## Top 10 findings
1. The "Make the right thing easy" axiom was verified at j2:331, with explicit attribution at j2:329 ("The Principal stated the axiom that should govern this work"). It is repeated identically at j2:596. Variants: j2:327 (heading "easy and obvious"), j2:544, j2:564 ("easy and clear"), j2:15. It names an explicit failure criterion: Kiro having to read months of journal before adding one class (j2:337). The exact wording appears nowhere else in docs except a 2026-10-18 discovery snapshot.
2. Three prior-ledger [D] items are actually Principal-attributed: the Java state/behavior/creation ontology (j2:202), "SCA is the scoreboard…" (explicit, j2:365) and "The game with SCA… It's trends." (explicit, j2:375).
3. Vocabulary hazard: in Wheelwright, SCA means Architecture-to-Code Coherence Assessment, not static code analysis (j2:369). A later entry nevertheless titles a Sonar run "SCA (Sonar)" (j2:968).
4. Two recurring execution failures share one root cause. In gen-29066 (j3:482-532) and BTS/HOLD-CLOSE (j4:150-240), the governance already existed but actors let legitimate intermediate concerns displace the Principal's objective. This lineage produced the authorized-execution steering, the three-AI contract and the specimen-first / "Principal-visible outcome YES/NO" ratchet (j4:201-213), the likely origin of the Shared Execution Contract (not verified).
5. The authority spine was refined repeatedly: meaning-location, not arithmetic-location (j2:1166); association is authority (j2:1170); authority must reach the consumer, and a "conservative" fabricated CLOSED_CANONICAL state was more permissive (j3:339-344); lifecycle facts originate only from brokerage evidence (j4:137-141); unknown ≠ zero, kept as a range (j4:340).
6. Economic semantics not in the ADR register: purpose-qualified basis and date (j2:1044, 1094); strike notional is not "capital returned" (j2:1074); settled cash ≠ non-margin buying power (j2:1240-1291); account-regime orthogonality (j3:904-921); closing releases nominal encumbrance, not cash (j4:48, 90); assignment is not inherently undesirable (j4:49); CLOSE ≠ ROLL (j4:51); HOLD ≠ survival to expiration (j4:94); BTC debit nets into OPTION_PREMIUM, not erosion (j4:278).
7. Accepted Product precedent: DBO $21 short PUT is red with "BTC THIS PUT", while DBO $26 buy-write and PDBC ITM covered call are not red (j4:246-262). The cross-structure asymmetry ("near-expiry+OTM=red" is economically backwards for a covered call) is a ready specimen for the options-domain reference.
8. Falsified assumptions: "Tradier can't serve indices" (j3:799); generation bump means the targeted symbols were refreshed (j3:221); ACQUIRED means new evidence (j3:289); premium-reduced basis (j2:1040); settled cash and non-margin buying power are "equivalent" (j2:1256); EWY display was the bug (j2:1080); PL-CLEANUP "cannot lead" (j2:714); "no implemented gate" meant approval (j3:600).
9. Reversals inside the assignment: the Sep-15 Principal decision to keep Today's G/L on spot_history was superseded by BUG-020 (j3:851); Unencumbered Shares V1 exclusions were reversed by the Principal, "add all four; also add freshness" (j3:768); HOLD/CLOSE "V1 does not choose the winner" was superseded at product level by "BTC THIS PUT" (j4:167); GitHub-Issues defect tracking was replaced by docs/bugs (j3:367); SCA regression-as-build-failure was softened to "trend over build-killers" (j2:388 vs 632).
10. Time-qualified operational facts: Tradier production 401 then token regeneration, startup recovery about 76 s (j2:112-140); 119/60 s pacer at about 97% utilization, admission-budget-bound (j2:182); cache TTLs 5m/60s/90s (j3:318); seed universe 1306→1313 on 09-14 (j3:619), which the steering's 1,286 does not reflect; a stale local backend on port 3100 (j4:284); Kiro had no browser automation on 09-04 (j2:952).

## Top Principal statements (exact)
- "**Make the right thing easy to do. Make what is right easy to know.**" (j2:331)
- "Every accepted change is intended to be production-ready. Environments provide progressively stronger evidence of readiness; they do not provide progressively weaker definitions of done." (j2:46)
- "Well-written Java has three basic kinds of objects: … That's it. No more." (j2:204-210, attributed j2:202)
- "**SCA is the scoreboard. Sonar is the brutal arbiter of truth.**" (j2:367) / "The game with SCA isn't necessarily any score in a moment in time. It's trends." (j2:377)
- "the next activity should be a round of cleanup (review the cleanup PL) before more feature or infrastructure work." (j2:654)
- Challenge: "where's the source of truth?" (j2:1152)
- "*if this needs a backend change or a server bounce, we've drifted from \"new consumer\" into \"new capability.\"*" (j3:181)
- "**action completion and visible-state convergence are different events; operator-facing completion must correspond to the latter when the visible state is what establishes trust.**" (j3:229)
- "**Consider this a contract between three actors. It's your job to remind these actors of the contract they just signed. Persist it as such. Execute as such.**" (j3:589)
- "add all four; also add freshness" (j3:768)
- "**DBO must show a red BTS indicator and, when governed lifecycle policy supports the conclusion, Wheelwright should directly say \"BTC THIS PUT.\"**" (j4:167; third-person, possibly lightly paraphrased)
- "Acceptance criteria must be **stupid simple and specimen-first**." (j4:198, attributed j4:196)

## Decision candidates not in ADR-001–023 (selection)
- Delivery and done (D001); Constitution byte-for-byte restoration (D006); Sonar/ArchUnit graduation with no default gates (D007).
- PL-CLEANUP phase framing (D008); PL-SHELL topology with "Deployment" as canonical name (D009).
- Settled-cash-only deployable, fail-safe (D016); reuse gate (D020); visual principle #12 (D021); docs/bugs migration (D024).
- Held-expiration monitoring overlay (D025); methodology ratchet and three-AI contract (D027/D028); DANGER is not an admission veto (D029).
- Today's G/L uses prevclose (D036); recipe population boundary (D037); PL-DEPLOY-BAL (D038); Iron Condor projection, GET never acquires (D039).
- Answer-first NOTICE→DECIDE plus specimen ratchet (D042); ATTENTION as a function of the action (D043); BUG-021 netting (D044); backend as single lifecycle authority (D045).
- Category A lifecycle-evidence bullet added by Kiro without recorded Principal ratification of the wording (D041).

## Contradictions / uncertainties
- DTE ranges: the Decision horizon is 0–45 (j3:600, 686), but the vocabulary says "Eligible range 7–45", and acquisition used 7–45 (j3:396). At least three ranges are being conflated.
- Zero-greek rule: per-field "0.0 = unavailable" (j3:401) vs whole-vector-only placeholder (j4:37). BUG-011 is unresolved.
- Kiro's role: architect (j2:73) vs Implementation Engineer (j3:540) vs current steering (Kiro for architecture/interpretation).
- PRs: the preferred delivery model includes a PR boundary (j2:52-60), while current steering forbids routine PRs; isolated worktrees were used for #16 (j3:359).
- Velvet Rope is called "designed, not live" in steering, yet its governance capability is imported by Deployment (j2:887).
- Uncommitted actor-local trees block Codex review (j2:1142) vs the current keep-uncommitted shared-tree workflow.
- Unresolved at end of assignment: BUG-021 acceptance (j4:365); BUG-001 widening (j4:62); BUG-019 semantics; trading-hours Delta replication; deeply-OTM short call BTC vs HOLD (j4:263); the "hard conversation" (j2:568).

## Challenges to assumptions
- "Herbie"/constraint: the provider path was measured admission-budget-bound at about 116/min on 09-03 (j2:182), versus Doc-40 framing of underutilization at about 75/min. Different configs and dates; do not merge.
- The FE/BE split is explicitly a guideline. Four drift instances in one slice were recorded as a trigger to reassess it explicitly (j2:1180, 1213); no reassessment is visible here.
- The journal itself documents five append-only BUG-021 passes on one day, concrete evidence of the "Codex→Kiro patch loop" failure mode.

## Coverage gaps / protection
- None in the assigned scope; all segments FULL.
- Withheld: a Fidelity account number (j2:1244), all real balances ≥[amount-redacted] (j2:1244-1268, j3:908-910, j4:282), account nicknames (j3:908-910), an accounting reviewer's personal name (j2:1058), and a local filesystem path containing a user directory (j3:615). .env was not read.
