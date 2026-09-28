--
-- 012 — ADR-022 / Doc 70: bounded option-obligation continuity assessment (durable, replay-bound).
--
-- The backend OWNS the evidence-to-cohort continuity assessment (Doc 70 §1). This table
-- durably records each assessment result so a governed Decision can pin/replay it and a
-- fresh client can recover it from authority — never reconstructing membership from a series
-- key, local CSV, or an associationEstablished flag.
--
-- Append-only and immutable. assessment_id is a deterministic hash of the bound evidence
-- contract, so a byte-identical re-assessment dedups (INSERT OR IGNORE) and a changed
-- input/rule/cut yields a new assessment. Bitemporal: effective_from (economic/endpoint
-- cut day) is distinct from recorded_at (backend durable time). A later correction records a
-- new row and affects only later Decisions; it never rewrites an earlier Decision's picture.
--
-- This is intentionally NOT a generalized brokerage identity, event-sourcing, or lifecycle
-- store. It records the outcome + pinned evidence contract of the bounded whole-quantity
-- assessment defined by the engine.

CREATE TABLE option_obligation_continuity_assessment (
  assessment_id           TEXT PRIMARY KEY,      -- deterministic: hash(bound evidence contract + rule + cut)
  brokerage_account_id    TEXT NOT NULL,         -- opaque stable account partition
  governed_scope_id       TEXT,                  -- opaque cohort/governance scope, or NULL when unbound
  underlying              TEXT NOT NULL,
  option_type             TEXT NOT NULL,         -- 'CALL' | 'PUT'
  strike                  REAL NOT NULL,
  expiration              TEXT NOT NULL,         -- ISO date of the series expiration
  opening_quantity        INTEGER NOT NULL,      -- governed whole quantity Q
  verdict                 TEXT NOT NULL,         -- FULL_Q_INTACT_APPLICABLE | AUTHORITY_MISSING | EVIDENCE_INSUFFICIENT | POLICY_UNDEFINED | EXHAUSTED
  reconciled_quantity     INTEGER,               -- surviving governed quantity when determinable, else NULL
  blockers_json           TEXT NOT NULL,         -- ordered blocker keys (opaque JSON; '[]' when affirmative)
  admission_rule_version  TEXT NOT NULL,         -- interpretation/admission rule version consumed
  accepted_completeness   INTEGER NOT NULL,      -- 0/1: accepted completeness premise present
  quiet_day               TEXT,                  -- ISO date of the quiet endpoint day P, or NULL
  evidence_hash           TEXT NOT NULL,         -- deterministic content hash of the admitted evidence contract
  effective_from          TEXT NOT NULL,         -- ISO8601 economic/endpoint cut boundary
  recorded_at             TEXT NOT NULL          -- ISO8601 backend durable record time
);

CREATE INDEX idx_ooca_lookup ON option_obligation_continuity_assessment(brokerage_account_id, underlying, option_type, expiration, strike, effective_from);
CREATE INDEX idx_ooca_scope ON option_obligation_continuity_assessment(brokerage_account_id, governed_scope_id);
CREATE INDEX idx_ooca_recorded ON option_obligation_continuity_assessment(brokerage_account_id, recorded_at);
