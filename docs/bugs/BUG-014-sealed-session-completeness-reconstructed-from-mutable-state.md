# BUG-014 — Sealed-session completeness (prior-session operational validity) is reconstructed from mutable current-work state, so next-session re-resolution falsely revokes a completed session

- **Status:** Open (fix implemented, awaiting Principal browser verification)
- **Severity:** S2
- **Area:** Backend / durable sealed-session authority (`SqliteEvidenceStore.hasCompletePublishedSession`)
- **Provenance:** Discovered 2026-09-14 during BUG-013 authority-source diagnosis. No GitHub Issue (repository-native defect system).

## Observed failure

Live `/api/status` on Monday 2026-09-14 00:28 ET reported `priorSessionOperationallyValid: false` for canonical session `2026-09-11` (Friday), even though Friday's session had fully resolved the recommendation universe. This false `false` is what made prior-session sealed evidence ineligible (via the session classifier and BUG-013), contributing to the empty Deployment board.

## Intended semantics violated

Prior-session operational validity is a durable **fact about a completed session**: "on session date D, the recommendation universe was fully resolved." Once true, it must remain true until superseded by a later completed session. It must not be revoked by the next session's in-progress work. "Persist facts; derive trust" — but this particular trust was being *reconstructed from mutable state*, which is not the same as a persisted fact.

## Evidence

`hasCompletePublishedSession(sessionDate)` computed (paraphrased):

```
total    = COUNT(all symbol_resolution rows)
resolved = COUNT(rows WHERE session_date = ? AND resolution IN ('ready','absent'))
return generation>0 AND published_at IS NOT NULL AND total>0 AND resolved == total
```

`symbol_resolution.session_date` is **mutated in place** as symbols re-resolve. Live DB at diagnosis:

- `total = 1308`
- rows resolved *for Friday* (`session_date='2026-09-11'`, ready/absent) = **1288**
- the mismatch = exactly **20 rows** re-stamped `session_date='2026-09-14'` (Monday) — symbols the scheduler re-resolved overnight after the ET date advanced. All 20 are active-universe symbols (not stale/removed).

So `resolved (1288) != total (1308)` ⇒ predicate returns **false**. The moment the next session re-resolves even one symbol, a fully-completed prior session is judged incomplete. The check conflates "how many symbols are resolved *for date D*" with "how many resolution rows exist *right now*."

**Relationship to the 957-vs-955 discrepancy (kept distinct):** the same 20 Monday-dated ready rows are why `symbol_resolution` has 957 ready rows (937 Friday + 20 Monday) while the snapshot serialized 955 `status:"ready"` symbols. That serialized 957-vs-955 gap is noted but **not proven** to share a single mechanism with this defect and is **not** claimed as resolved here; it remains a separate open observation.

## Consequence

Any completed session's durable validity is silently revoked as soon as the next session begins re-resolving symbols (which happens automatically overnight). Downstream, this defeats sealed-evidence admissibility (BUG-013) and empties operator-facing surfaces. **S2**.

## Diagnosis / root cause

Completeness was derived from mutable `symbol_resolution` rather than persisted as a durable fact when the session was demonstrably complete. Filtering the mutable rows by `session_date` alone would not fix it (a completed session's row can be legitimately overwritten by the next session), so the completeness fact must be captured durably at the time completeness is observed.

## Scope / non-goals

Durable sealed-session completeness persistence + repointing the reader. No change to the acquisition scheduler, freshness horizons, cache TTLs, provider profile, or snapshot contract shape. Does not resolve the 957-vs-955 serialized-count observation (left open). Does not weaken fail-closed behavior (absent a durable sealed fact, validity is false).

## Acceptance criteria

- A durable sealed-session fact is written when a session is demonstrably complete (every active-universe symbol resolved ready/absent; nothing pending/partial/failed).
- The fact survives restart.
- The fact is NOT invalidated when next-session `symbol_resolution` rows mutate.
- `hasCompletePublishedSession(sessionDate)` reads the durable fact, not reconstructed history.
- Fail-closed when no durable sealed fact exists for the requested date.
- For the pre-existing Friday 2026-09-11 session, the fact is established ONLY from evidence already durably present (no fabrication).

## Remediation history

Implemented (not committed; awaiting Principal browser verification):

- **Migration `008_sealed_session.sql`** — new durable table `sealed_session(session_date PK, expected_universe, resolved_count, complete, sealed_at)`, registered in `DatabaseManager`. Includes an **evidence-backed, guarded backfill**: an `INSERT OR IGNORE` that records completeness for the earliest resolved `session_date` **only if** the DB currently proves it (zero unresolved rows AND resolved count == active-universe count AND a prior session date exists). If any guard fails it records nothing (no-op).
- **`SqliteEvidenceStore.recordSealedSessionIfComplete()`** — records the durable fact when the current universe is fully resolved (idempotent `INSERT OR IGNORE`, keyed by `MIN(session_date)` among resolved rows so a few next-session re-resolutions do not misattribute it). Called from `publishSnapshot()`.
- **`SqliteEvidenceStore.hasCompletePublishedSession()`** — now reads `sealed_session.complete` for the date instead of reconstructing from mutable `symbol_resolution`.

Because `EvidenceStoreConfig` wires `persistedSessionValid = hasCompletePublishedSession`, this single repair fixes both the session-level `priorSessionOperationallyValid` and the BUG-013 per-subject admissibility gate.

## Verification

- `SqliteEvidenceStoreTest.DurableSealedSession` (3 tests): completed session recorded on publish and durable across restart; **next-session re-resolution does NOT revoke the sealed prior session (the BUG-014 core)**; an incomplete session is not sealed. All pass. The pre-existing restart test (`hasCompletePublishedSession('2026-07-16')` true after restart) remains green.
- Backfill validated against a COPY of the live DB: seeds `2026-09-11 | expected 1308 | resolved 1308 | complete 1`, no Monday row, idempotent on re-apply. Evidence-backed (live DB has 0 unresolved, 1308/1308), not fabricated.
- **Live verification pending** the single backend restart (which runs migration 008 on the live DB and should flip live `priorSessionOperationallyValid` to true for 2026-09-11).

## Related

- **BUG-013** — the per-subject admissibility defect that consumes this authority; both required for the board to recover.
- **BUG-012** — the frontend consumer-path race (separate defect, same symptom).
- 957-vs-955 serialized-ready discrepancy — related observation, deliberately NOT conflated or claimed resolved here.
