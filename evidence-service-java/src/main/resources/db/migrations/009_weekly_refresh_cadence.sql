-- Migration 009: Weekly-refresh servicing cadence (generation-29066 disposition)
--
-- Adds the smallest durable per-symbol fact needed to govern WEEKLY_REFRESH attempt
-- cadence: the timestamp of the last GOVERNED weekly servicing attempt for a symbol,
-- advanced regardless of the attempt's outcome (complete / partial / absent / failed).
--
-- This is an ATTEMPT clock, not a completion/success clock. It governs cadence only:
-- a WEEKLY_REFRESH symbol is due when it has never had a governed weekly attempt, or
-- when at least the configured weekly interval (default 7 days) has elapsed since the
-- last one. It does not gate acquisition completeness and does not change the normal
-- 7-45 DTE acquisition path.
--
-- Nullable and unused unless the generation-29066 weekly cohort is loaded and a symbol
-- is serviced under weekly cadence, so this migration is inert for all other symbols
-- and reversible (the column is simply left NULL / ignored when the seam is disabled).

ALTER TABLE symbol_resolution ADD COLUMN weekly_last_attempt_at TEXT;
