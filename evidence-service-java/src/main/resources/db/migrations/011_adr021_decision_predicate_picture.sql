--
-- 011 — ADR-021: predicate picture + no-context UNRESOLVED Decisions.
--
-- ADR-021 §10 ratifies that an UNRESOLVED outcome is a legitimate durable Decision even
-- when NO Governed Context Version exists. The 010 schema made context_version_id NOT NULL
-- with a FOREIGN KEY into governed_context_version, which cannot represent that honest
-- absence. This migration rebuilds governed_decision so that:
--   - context_version_id is NULLABLE and has no FK (an explicit absent-context binding,
--     recording that no context was known — never a fabricated Context Version);
--   - governed_scope_id is NULLABLE (a no-context Decision has no scope);
--   - the complete decision-time predicate picture and program-applicability projection are
--     stored as immutable Decision output for deterministic explanation/replay comparison.
--
-- Immutability/append-only discipline (deterministic decision_id + INSERT OR IGNORE) and
-- bitemporal effective/recorded distinctions are unchanged. This is a bounded ADR-021
-- change; it introduces no generic predicate store.

-- SQLite table rebuild (relax NOT NULL/FK + add columns). governed_decision is an
-- append-only immutable log; copy preserves any existing rows verbatim.
CREATE TABLE governed_decision_new (
  decision_id             TEXT PRIMARY KEY,
  brokerage_account_id    TEXT NOT NULL,
  governed_scope_id       TEXT,                  -- NULL for a no-context Decision
  subject_type            TEXT NOT NULL,
  subject_id              TEXT NOT NULL,
  symbol                  TEXT NOT NULL,
  context_version_id      TEXT,                  -- NULL = explicit absent-context binding (ADR-021 §10)
  rule_id                 TEXT NOT NULL,
  evaluator_id            TEXT NOT NULL,
  evaluator_version       TEXT NOT NULL,
  recommendation          TEXT NOT NULL,
  program_applicability   TEXT NOT NULL DEFAULT 'applicable',  -- 'applicable' | 'outside-program'
  reasoning_json          TEXT NOT NULL,
  unresolved_causes_json  TEXT NOT NULL,
  predicate_results_json  TEXT NOT NULL DEFAULT '[]',          -- ADR-021 complete ordered picture
  input_bundle_json       TEXT NOT NULL,
  bundle_hash             TEXT NOT NULL,
  decision_time           TEXT NOT NULL,
  recorded_at             TEXT NOT NULL
);

INSERT INTO governed_decision_new (
  decision_id, brokerage_account_id, governed_scope_id, subject_type, subject_id, symbol,
  context_version_id, rule_id, evaluator_id, evaluator_version, recommendation,
  program_applicability, reasoning_json, unresolved_causes_json, predicate_results_json,
  input_bundle_json, bundle_hash, decision_time, recorded_at)
SELECT
  decision_id, brokerage_account_id, governed_scope_id, subject_type, subject_id, symbol,
  context_version_id, rule_id, evaluator_id, evaluator_version, recommendation,
  'applicable', reasoning_json, unresolved_causes_json, '[]',
  input_bundle_json, bundle_hash, decision_time, recorded_at
FROM governed_decision;

DROP TABLE governed_decision;

ALTER TABLE governed_decision_new RENAME TO governed_decision;

CREATE INDEX idx_gd_account_subject ON governed_decision(brokerage_account_id, subject_id, decision_time);
CREATE INDEX idx_gd_scope ON governed_decision(brokerage_account_id, governed_scope_id);
CREATE INDEX idx_gd_context ON governed_decision(context_version_id);
