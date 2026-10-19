# SN0 Survey Summary — docs 00–22 (excl. 07c)

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and run state
- Assignment: `docs/0*.md`, `docs/1*.md`, `docs/20-*`, `21-*`, `22-*` except `07c-adrs.md` (31 files, 11,333 lines).
- Resumed run. The interrupted run left E001–E046 and D001–D017. This run added E047–E069 and D018–D024, then wrote `coverage.tsv` and this summary.
- Tree read: local HEAD `d03d8d1`, which descends from the assigned `bef03dd`. `git diff bef03dd d03d8d1` shows no changes to any assigned doc. Code witnesses are time-qualified to `d03d8d1`.
- Depth: 355 of 357 segments FULL (10,979 lines). The 2 INDEXED segments are the Slice-1 task bodies in `06-tasks.md:5-354` (354 lines, headings only, disposition deferred).
- This run read everything except those two in full. That includes the docs the prior run never reached (01, 03, 04, 05, 05a, 07d, 09a, 16, 18, 19) and re-reads of the docs it did cover.
- No `.env*` read. No sensitive content found in scope.

## Current vs historical (supersession record, path:line)
- 00 charter: HISTORICAL (00:3), superseded by `foundations/evidence-appliance.md` and 07. Its sequential three-actor model is superseded (E059).
- 01 environment: no status line. It still calls `TRADIER_API_KEY` a sandbox credential (01:63; E054).
- 02 domain: current Category E, subordinate to the options-domain reference (02:3). BR-5/A-3 superseded. Its ADR-001..004 collide with 07c IDs (E011, D002, D003, D018).
- 03 requirements: no HISTORICAL header. 07d:32 calls it partially superseded (E032, E062).
- 04, 05, 05a, 06: HISTORICAL (04:3, 05:3, 05a:3, 06:3). Superseded by 07 / 07a per 07d:17-19.
- 07d: HISTORICAL, superseded by docs 30/31/32 (07d:3). Its "still accurate" claims are stale (E062).
- 09: "design valid" (09:3), but its API, ETag format, IndexedDB removal and off-hours acquisition contradict the frozen contract (E019). 09a has no header and the same stale content (E069). 09b is HISTORICAL (09b:3).
- 11, 12, 13, 16, 16a: HISTORICAL. 14: "Implemented (transitional)". 15: "not yet implemented" (July).
- 21-write-desk: "Ratified design". 22: "Approved design", specified in TypeScript and implemented in Java. 21-primary: spike "not approved" (21-primary:4).

## Top 10 findings
1. Category A 07/07a describe only the v1 appliance. They are silent on v2 API/auth/Accounts and on ADR-020..023 (E001), and the "August 2026" status header coexists with a section ratified Sept 24 (E002).
2. Always-injected steering carries scarcity-era values: sandbox 60 req/min, pacer 0.9 req/sec, Class A ≤15 min. 07 and the code say Production authority, ≤119 starts per trailing 60s, and Class A 25 min (`SchedulerConfig.DEFAULT`, whose javadoc is stale). See E068.
3. The cognitive-role mapping conflicts. Steering has Operator = Console + Broker Handoff, with no Production surface. 07b has Console = orient, Write Desk = assess/deploy/handoff, Production = reconcile (E047).
4. Posture is an execution-quality bucket, not recommendation strength (18:87). The steering vocabulary still defines it as a recommendation classification (E048, D020).
5. Target DTE 21 was provisional sampling: "NOT a discovered optimum and NOT established operator policy" (21-primary:398). On Aug 20 it was not consumed by the put and buy-write engines (E049, E043).
6. Authentication conflicts across docs. 09/12 say no auth on localhost; 10 says auth is required even for one user. At d03d8d1 there is no Spring Security dependency and no explicit bind address (E052, E053).
7. Removal of browser IndexedDB evidence was planned three times (08, 09:548, 14:350). It was instead retained as a bounded, reconstructible cache (07:434), and no reversal decision was found (E055).
8. Ratified Sept 24 domain semantics in 07: account locality (opaque `brokerageAccountId` partition, no registry, no multi-user authz), the Recommendation ≠ disposition ≠ execution ≠ lifecycle-fact distinction, and purpose-label-agnostic DECIDE (E057, E058, E040, E041).
9. Ownership of the admissible delta range is contradictory. 19:132 lists it as a UI control; ratified 21-write-desk:88-99 makes it system governance (E050).
10. Some early-doc meanings are now traps. "Wheelwright" meant the browser recommendation engine (E010). "Eligible" and "Evaluable" each have several meanings (E012, E013). Sealed-evidence trust labels vary by doc (E014). The readiness contract was defined around puts (E051).

## Top Principal statements (exact; none in scope is labeled as verbatim Principal speech)
- "User initially mentioned 0.33." (02:257, reported speech; E046)
- "Build enough security that adding a second real user does not require redesigning the data model." (10:208). The doc is Principal-directed per D004, but the speaker is not stated (E053).
- "**Represent the environment, not the machinery.**" (21-write-desk:12). Self-declared ratified design; ratifier not named (E067).
- "Continuous observation must not mean continuous provider traffic." (20:12; E066)
- "No trade submission from the backend (ever, without a separate explicit decision)" (09:818; D022)

## Decision candidates outside the ADR-001–023 register
- D001: doc 08 backend-evidence ADR (Accepted; README calls it ratified).
- D002, D003, D018: 02-domain's own ADR-001/003/004.
- D004: doc 10 preferences.
- D005–D008: proxy, cache/pacer, worker, delay removal.
- D009: yield always computed.
- D010: emergency session gate.
- D011: Evidence Validity Model R1–R7.
- D012: SQLite design.
- D013: Option E multi-expiration.
- D014: migration answers.
- D015: PendingIntent.
- D016: instrument catalog.
- D017: Velvet Rope slice.
- D019: async provider interface and tie-breaker as policy.
- D020: defer label changes.
- D021: readiness via trust state.
- D022: backend no-submission non-goals.
- D023: retain historical docs.
- D024: one recommendation per underlying.

## Contradictions (index)
E001–E005, E007, E011, E014, E018, E019, E024, E031, E032, E036, E043, E044, E047, E050, E052, E054, E055, E059, E062, E068.

## Coverage gaps
- `06-tasks.md:5-354` (Slice-1 task bodies) is INDEXED only.
- I did not verify in code: v2 bearer authentication (cited from E020), current Write Desk policy-control placement, current readiness semantics, the current universe count, or later multi-expiration resolution (docs 35/36, outside scope).
- Steering files were consulted only as conflicting variants. They are outside the assignment.

## Assumption challenges
- "Category A = current" does not hold for 07/07a/07b as a whole. Each claim needs its own date (E001–E007, E043, E068).
- Cold-start steering is itself stale relative to Category A and the code (E047–E049, E068).
- "Historical" docs still originate current-sounding principles that cold actors quote. Examples: the backend no-submission rule (09:818), user-ownership boundary (10:186), "Inference is not evidence" (11), and fail-closed on missing Greeks (04:357).
