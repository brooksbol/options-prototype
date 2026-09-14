-- Migration 008: Durable sealed-session completeness fact (BUG-014)
--
-- WHY THIS EXISTS.
-- Prior-session ("sealed") validity is a DURABLE FACT about a COMPLETED session:
-- "on session date D, the recommendation universe was fully resolved (every active
-- symbol ready or absent)." Before this migration, that fact was RECONSTRUCTED at
-- query time by hasCompletePublishedSession() from the MUTABLE symbol_resolution
-- table (resolved == total over all current rows). That reconstruction is invalid
-- the moment the NEXT session begins: as soon as the scheduler re-resolves even one
-- symbol under the new date, that row's session_date advances, so the count of rows
-- matching the prior date drops below the row total and the completed prior session
-- is falsely judged incomplete. Observed live: Friday 2026-09-11 was fully resolved,
-- but 20 symbols re-resolved overnight under 2026-09-14 flipped
-- hasCompletePublishedSession('2026-09-11') to false, which in turn made
-- priorSessionOperationallyValid=false and (via the session classifier) marked
-- Friday's sealed evidence inadmissible on Monday. See docs/bugs/BUG-014.
--
-- A completed session's validity must NOT depend on mutable current-work rows. This
-- table records the completeness fact ONCE, keyed by the session date, so later
-- next-session mutation cannot revoke it.
CREATE TABLE IF NOT EXISTS sealed_session (
    session_date       TEXT PRIMARY KEY,   -- ET trading date whose evidence was sealed (ISO)
    expected_universe  INTEGER NOT NULL,   -- active-universe size at seal time
    resolved_count     INTEGER NOT NULL,   -- symbols resolved (ready|absent) for this session
    complete           INTEGER NOT NULL,   -- 1 iff resolved_count covered the expected universe
    sealed_at          TEXT NOT NULL       -- when the completeness fact was recorded (ISO-8601 UTC)
);

-- Evidence-backed backfill for the pre-existing sealed session, computed ENTIRELY
-- from durable state already present in this database. This is NOT a fabricated
-- fact: it is a guarded INSERT that only records completeness for the dominant
-- prior session date IF that session is provably complete right now, i.e.:
--   (a) there are ZERO unresolved rows (no pending/partial/failed) in symbol_resolution;
--   (b) every active-universe symbol is resolved (ready|absent);
--   (c) at least one resolved row still carries that session date.
-- The backfilled date is the EARLIEST resolved session_date still present (the prior
-- completed session), so a few next-session re-resolutions do not misattribute it.
-- If any guard fails, this INSERT selects zero rows and the migration is a no-op —
-- the appliance will then record the fact the next time it observes full resolution.
INSERT OR IGNORE INTO sealed_session (session_date, expected_universe, resolved_count, complete, sealed_at)
SELECT
    (SELECT MIN(session_date) FROM symbol_resolution
       WHERE resolution IN ('ready', 'absent') AND session_date IS NOT NULL)          AS session_date,
    (SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL)                            AS expected_universe,
    (SELECT COUNT(*) FROM symbol_resolution WHERE resolution IN ('ready', 'absent'))   AS resolved_count,
    1                                                                                  AS complete,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')                                              AS sealed_at
WHERE
    -- (a) nothing unresolved
    (SELECT COUNT(*) FROM symbol_resolution WHERE resolution NOT IN ('ready', 'absent')) = 0
    -- (b) every active symbol resolved
    AND (SELECT COUNT(*) FROM symbol_resolution WHERE resolution IN ('ready', 'absent'))
        = (SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL)
    -- (c) a prior session date exists to attribute the fact to
    AND (SELECT MIN(session_date) FROM symbol_resolution
           WHERE resolution IN ('ready', 'absent') AND session_date IS NOT NULL) IS NOT NULL;
