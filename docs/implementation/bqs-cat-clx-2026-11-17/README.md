# BQS CAT/CLX first slice — isolated engineering candidate

**Standing:** DRAFT engineering rehearsal, **not** an installed or accepted Wheelwright capability, an adopted BQS methodology, a production API operation, or a trade recommendation. Do not merge or deploy without independent review and normal product/OAS/release gates.

**Evidence and authorization:** Principal on November 17, 2026 authorized the bounded CAT/CLX slice after reviewing [BQS 4AM Round 2](https://github.com/brooksbol/portfolio/blob/main/research/2026-11-17-bqs-4am-round2-reconciled-report.md). Parent baseline `options-prototype/main` was `5478e32e`; implementation isolated in `research/bqs-cat-clx-first-slice-20261117`. The draft does not change existing v1/v2 services, database, OAS, credentials, broker account or schedules.

## What is runnable now

- `ResearchCandidate`: pure, deterministic provisional assessment with four **separate** outputs (quality, valuation, dislocation, spread), explicit holds, immutable-by-copy fiscal-period-ordered annual metrics and source reference fields. It does not compute a BQS/100, infer intrinsic value or produce a BUY/trade status.
- `ResearchCandidateRehearsal`: operator-visible CLI using the CAT and CLX **dated retained-data specimen**. It intentionally returns CAT quality/value as `NOT_COMPUTED`, dislocation as `OBSERVED` and spread as `HELD`; it returns CLX quality `HELD` because the applicable 2026 annual filing lacked matching annual selected-tag facts in that retained Company Facts packet.
- `ResearchCandidateChecks`: focused Java contract checks with no database/provider access.

Java 21 check, from repository root:

```bash
mkdir -p /tmp/bqs-rehearsal-classes
javac -d /tmp/bqs-rehearsal-classes \
  evidence-service-java/src/main/java/com/wheelwright/evidence/v2/research/ResearchCandidate.java \
  evidence-service-java/src/main/java/com/wheelwright/evidence/v2/research/ResearchCandidateRehearsal.java \
  evidence-service-java/src/test/java/com/wheelwright/evidence/v2/research/ResearchCandidateChecks.java
java -cp /tmp/bqs-rehearsal-classes com.wheelwright.evidence.v2.research.ResearchCandidateChecks
java -cp /tmp/bqs-rehearsal-classes com.wheelwright.evidence.v2.research.ResearchCandidateRehearsal
```

A separate isolated Java 21 check in the authoring environment passed 16 focused assertions and printed the following research-only specimen:

```text
BQS research rehearsal | S&P 500 roster 2026-11-17 | price cut 2026-11-16
SYMBOL  BUSINESS QUALITY     VALUATION     DISLOCATION      SPREAD       DECISION
CAT     REVIEW (EPS trend)   UNASSESSED    -19.6% EMA50     HOLD         NO TRADE
CLX     HOLD (filing gap)    UNASSESSED    UNASSESSED       UNASSESSED   NO TRADE
```

Add `--evidence` to the rehearsal command to display provisional CAGR, latest YoY and explicit hold codes. The foreground deliberately avoids presenting research controls as a financial recommendation.

A new period-continuity guard rejects gaps or mismatched annual dates as `ANNUAL_PERIODS_INCOMPARABLE`; fiscal transitions and accounting semantics still need primary-evidence interpretation.

### Dated source custody and limitations

- Historical **CAT** SEC `companyfacts` SHA-256 `0fe50d57bf90ee91f2997ca309353b4b86c2adc192ba9c469623ea7c2f52cfb7`; submissions SHA `933788676d5d4a469ecc033ac3859adf2cbdaa7a086d06683b84f5d3b00b585e`.
- Historical **CLX** SEC `companyfacts` SHA `f9b61f8b3fed2f3b2a75c062d778ff639e9a9467fbd186d3c1bf3d23d90ce5ce`; submissions SHA `cf9fbf3c4678ec41a803f5425c95cbce75225619fc14313296b9a9fc1ae00828`.
- These four digests were independently recomputed against the exact retained source members of the user-supplied `BQS-Facts-Specimen-2026-11-17.zip` in the authoring environment and matched. **The raw ZIP is not committed here**, and `EvidenceRef` validates the digest **format**, not the actual source bytes at runtime.
- Retained CAT fiscal EPS FY2020–FY2025: `5.46, 11.83, 12.64, 20.12, 22.05, 18.81`; latest-year YoY `-14.69%`. Retained CLX FY2020–FY2025 EPS: `7.36, 5.58, 3.73, 1.20, 2.25, 6.52`; FY2026 selected-tag coverage unresolved despite an applicable 10-K. The 2025 CAGR is **not** evidence that FY2026 is incorporated.
- CAT completed 2026-11-16 research close `570.49`, approximately `709.75` EMA50 and completed one-year bar maximum high `1073.46`. CAT option eligibility is **held**, not computed from potentially delayed legs. The investigative market-evidence pointer references the Principal-supplied Round 2 report, **not** original IBKR HTTP wire bytes. Neither provider status nor an approximate EMA proves an adjusted point-in-time market series.
- This does **not** verify all annual accessions or accounting comparability, an immutable backend source store, 503-company coverage, 503-company financial scoring, original-byte capture on backend intake, synchronized IV/Greeks, event completeness, source-vintage replay or a production API/CLI projection.

### Next bounded implementation tasks (NOT completed by this branch)

1. **Backend-owned original-byte intake and immutable assessment references**, with issuer/share-class identity, accession-level metric coverage, source/vintage clocks, hashes verified against actual bytes, and per-member outcome accounting.
2. **Canonical v2 OAS and authenticated provider-free read contract**, preserving the existing security/authorization and HTTP semantics; reuse existing v2 read patterns. No caller-triggered refresh on GET.
3. **Real CAT/CLX assessment from retained artifacts** rather than hard-coded fixture data, including amendment/transition and source-basis tests, reload/restart replay, unchanged previous cuts after partial acquisition, and independent reviewer.
4. A minimal operator-visible CLI or existing client projection built from the backend read model (no client-owned financial calculation), followed by actual Product observation.
5. Only then, reconsider further companies, sector comparisons, score or trading criteria. This branch cannot establish a qualified sector winner, fair value or executable spread.

**Design principle:** use the first runnable artifact to expose truthful holds and financial uncertainty. Do not make the next engineering increment an ungoverned BQS engine or another independent data service.
