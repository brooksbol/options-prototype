--
-- 013 — ADR-022 / Doc 70 remediation: Decision-cut coverage boundary for continuity.
--
-- Independent review found that a continuity assessment must not remain affirmatively usable
-- for a LATER Decision cut merely because effective_from <= effectiveAsOf. The evidence /
-- completeness contract must cover the Decision cut being evaluated. This adds an explicit
-- `covered_through` boundary: the last day through which the assessment's accepted completeness
-- and endpoint reconciliation actually extend (the quiet endpoint day for an affirmative). The
-- resolve path requires effectiveAsOf <= covered_through, so a September 26 assessment cannot
-- satisfy a later Decision cut without admissible evidence through that later cut.
--
-- Append-only migration (013). Existing rows get covered_through = quiet_day when present, else
-- effective_from — a conservative backfill that never extends coverage beyond the evidence.

ALTER TABLE option_obligation_continuity_assessment ADD COLUMN covered_through TEXT;

UPDATE option_obligation_continuity_assessment
   SET covered_through = COALESCE(quiet_day, substr(effective_from, 1, 10))
 WHERE covered_through IS NULL;

CREATE INDEX idx_ooca_covered ON option_obligation_continuity_assessment(brokerage_account_id, governed_scope_id, covered_through);
