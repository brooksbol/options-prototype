-- Migration 010: Governed Decision plane (Candidate B) — append-only, account-partitioned.
--
-- PURPOSE: Durably own, per ADR-019, the two immutable governance/decision roles the
-- bounded production Console walking slice requires:
--   1. Governed Context Version — the FIRST durable capture of explicitly authorized
--      governance for one governed scope (Candidate B). Immutable; amendment creates a
--      new version rather than mutating an existing one.
--   2. Lifecycle Decision Record — an immutable historical governed Recommendation
--      (LET_RESOLVE | SELL_CALL | UNRESOLVED) plus the exact replay-bound consumed inputs.
--
-- DISCIPLINE:
--   - Append-only + duplicate-safe (deterministic ids + INSERT OR IGNORE). Rows never mutate.
--   - Account-partitioned by brokerage_account_id (opaque stable partition identity;
--     ADR-019 §4 — this does NOT ratify a backend BrokerageAccount registry).
--   - Bitemporal: effective_from (governance/decision effective time) is distinct from
--     recorded_at (backend durable record time). A later-recorded backdated context
--     version does not rewrite an earlier Decision, because a Decision pins the exact
--     context_version_id it consumed.
--   - Strategy-family-neutral substrate: the tables store Wheel values as opaque columns;
--     no Wheel lifecycle state is a universal decision field, and Recommendation is a
--     bounded string, not a universal enum.
--   - This is NOT a separate Program-association or Outcome-Stance assertion store, NOT
--     generic event sourcing, and NOT a generic Program registry.

-- One immutable Governed Context Version. Identity = deterministic content+lineage hash
-- (context_version_id) supplied by the authoring client. A (brokerage_account_id,
-- governed_scope_id) family accumulates versions 1..N; version N+1 supersedes N.
CREATE TABLE governed_context_version (
  context_version_id      TEXT PRIMARY KEY,      -- deterministic immutable identity
  brokerage_account_id    TEXT NOT NULL,         -- opaque stable account partition
  governed_scope_id       TEXT NOT NULL,         -- opaque durable scope identity
  version                 INTEGER NOT NULL,      -- monotonic within (account, scope)
  supersedes_version_id   TEXT,                  -- prior context_version_id, or NULL for v1
  program                 TEXT NOT NULL,         -- 'assignment-centric-wheel' (bounded)
  config_version          TEXT NOT NULL,         -- program-configuration/governance revision
  call_away_stance        TEXT NOT NULL,         -- 'accepted' | 'unknown'
  eligibility_gate        TEXT NOT NULL,         -- 'CLEAR' | 'ACTIVE' | 'UNKNOWN'
  intervention_gate       TEXT NOT NULL,         -- 'CLEAR' | 'ACTIVE' | 'UNKNOWN'
  no_write_gate           TEXT NOT NULL,         -- 'CLEAR' | 'ACTIVE' | 'UNKNOWN'
  authority_provenance    TEXT NOT NULL,         -- 'operator-governance' (authoring authority)
  effective_from          TEXT NOT NULL,         -- ISO8601 governance effective time
  recorded_at             TEXT NOT NULL          -- ISO8601 backend durable record time
);

CREATE INDEX idx_gcv_family ON governed_context_version(brokerage_account_id, governed_scope_id, version);
CREATE INDEX idx_gcv_effective ON governed_context_version(brokerage_account_id, governed_scope_id, effective_from);

-- One immutable Lifecycle Decision Record. decision_id is the deterministic hash of the
-- exact consumed input bundle, so a re-emitted identical Decision dedups (INSERT OR
-- IGNORE) and a changed input yields a new Decision. The full canonical input bundle is
-- stored as an opaque JSON payload (replay-bound consumed values) plus the pinned
-- context_version_id; the Recommendation and structured reasoning are stored explicitly.
CREATE TABLE governed_decision (
  decision_id             TEXT PRIMARY KEY,      -- deterministic: hash(canonical input bundle)
  brokerage_account_id    TEXT NOT NULL,         -- opaque stable account partition
  governed_scope_id       TEXT NOT NULL,
  subject_type            TEXT NOT NULL,         -- 'covered-call' | 'share-block'
  subject_id              TEXT NOT NULL,         -- stable Decision Subject identity
  symbol                  TEXT NOT NULL,
  context_version_id      TEXT NOT NULL REFERENCES governed_context_version(context_version_id),
  rule_id                 TEXT NOT NULL,         -- 'DOC65-RULE-1-LET-RESOLVE' | 'DOC65-RULE-2-SELL-CALL'
  evaluator_id            TEXT NOT NULL,         -- 'wheel-covered-call' | 'wheel-share-phase'
  evaluator_version       TEXT NOT NULL,
  recommendation          TEXT NOT NULL,         -- 'LET_RESOLVE' | 'SELL_CALL' | 'UNRESOLVED'
  reasoning_json          TEXT NOT NULL,         -- structured reasons (opaque JSON)
  unresolved_causes_json  TEXT NOT NULL,         -- causes array (opaque JSON; '[]' when affirmative)
  input_bundle_json       TEXT NOT NULL,         -- exact replay-bound consumed inputs (opaque JSON)
  bundle_hash             TEXT NOT NULL,         -- canonical bundle integrity hash
  decision_time           TEXT NOT NULL,         -- ISO8601 evaluation time
  recorded_at             TEXT NOT NULL          -- ISO8601 backend durable record time
);

CREATE INDEX idx_gd_account_subject ON governed_decision(brokerage_account_id, subject_id, decision_time);
CREATE INDEX idx_gd_scope ON governed_decision(brokerage_account_id, governed_scope_id);
CREATE INDEX idx_gd_context ON governed_decision(context_version_id);

-- Explicit, evidence-backed Decision-Subject -> governed-scope association (Correction 3).
-- A subject may consume a governed scope ONLY via an explicit association row. Sameness of
-- account/ticker/shares/mechanics/buy-write provenance NEVER establishes association; it is
-- an authorized act (operator-governance) or an authoritative broker-evidence successor
-- recognition. Append-only; the most recent effective row for a subject is the binding.
CREATE TABLE subject_scope_association (
  association_id        TEXT PRIMARY KEY,        -- deterministic: hash(account, subject, scope, effective_from)
  brokerage_account_id  TEXT NOT NULL,
  subject_id            TEXT NOT NULL,
  governed_scope_id     TEXT NOT NULL,
  provenance            TEXT NOT NULL,           -- 'operator-governance' | 'broker-evidence'
  effective_from        TEXT NOT NULL,           -- ISO8601
  recorded_at           TEXT NOT NULL            -- ISO8601
);

CREATE INDEX idx_ssa_lookup ON subject_scope_association(brokerage_account_id, subject_id, effective_from);
