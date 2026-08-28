-- Migration 004: Opportunity-History Fact Plane (observe-only, policy-neutral)
--
-- PURPOSE: Retain the minimum policy-neutral Decision/evidence facts necessary to later
-- estimate the historical opportunity usefulness of a decision SURFACE relative to the
-- acquisition capacity required to keep it decision-fresh. The governing question:
-- "Which ~28% of continuously-serviced provider workload can be dropped at lowest
--  demonstrated opportunity cost?"
--
-- DISCIPLINE:
--   - Append-only + duplicate-safe (idempotent via deterministic ids + INSERT OR IGNORE).
--   - Policy-neutral: raw Decision/evidence facts only. NO usefulness/membership/quality score.
--   - Scheduler-independent: describes evaluation STATE + freshness, never A/B/C/D class names.
--   - Winner-only economics (full strike-surface topology deferred).
--
-- COST-DERIVATION (corrected): an epoch is an INCREMENTAL evidence-driven batch, NOT a
--   complete surface snapshot. Do NOT infer required-surface-count from one epoch.
--   Historical acquisition burden = count of distinct evidence-input observations (each
--   surface_observation = one chain retrieval Decision consumed) over a session/window.
--   Maintained surface topology = UNION of distinct expirations over a window. No
--   acquisition-cost field is stored; burden is the observable count of distinct retrievals.

-- One genuine new-evidence Decision run. NOT an execution log: repeated evaluation of
-- unchanged evidence under an unchanged policy produces NO new epoch (same epoch_id).
CREATE TABLE evaluation_epoch (
  epoch_id             TEXT PRIMARY KEY,      -- deterministic: hash(generation, policy, session, provider, env)
  started_at           TEXT NOT NULL,         -- ISO8601 UTC (first emission of this epoch)
  policy_version       TEXT NOT NULL,
  evidence_generation  INTEGER,               -- backend snapshot generation evaluated (nullable)
  session_date         TEXT NOT NULL,         -- trading session (epoch) this evaluation belongs to
  session_posture      TEXT NOT NULL,         -- FULL | EXPIRATIONS_ONLY | BLOCKED
  provider             TEXT NOT NULL,
  environment          TEXT NOT NULL,         -- REAL runtime profile (production/sandbox)
  symbols_evaluated    INTEGER NOT NULL,      -- symbols Decision actually examined this run
  emitter              TEXT NOT NULL          -- 'browser' (B-1) | 'backend' (post-PL-ARCH-06)
);

-- Symbol-scope evaluation fact (NO surface exists). Truthfully symbol-level: pending /
-- no-DTE / non-optionable / has-evaluable-surfaces. We never invent an expiration for these.
CREATE TABLE symbol_observation (
  observation_id  TEXT PRIMARY KEY,           -- deterministic: hash(epoch_id, symbol)
  epoch_id        TEXT NOT NULL REFERENCES evaluation_epoch(epoch_id),
  symbol          TEXT NOT NULL,
  symbol_state    TEXT NOT NULL,              -- HAS_EVALUABLE_SURFACES | NOT_EVALUATED_PENDING | NOT_EVALUATED_NO_DTE | NON_OPTIONABLE
  observed_at     TEXT NOT NULL
);

-- Surface-scope Decision-evaluation fact. This row ONLY exists for a real (symbol,
-- expiration) surface. evaluation_state distinguishes EVALUATED_* (examined, survivorship-safe)
-- from NOT_EVALUATED_* (not examined, and why). Winner economics present iff the state is a
-- qualifying/wait/wide-spread state.
CREATE TABLE surface_observation (
  observation_id      TEXT PRIMARY KEY,       -- deterministic: hash(strategy, symbol, expiration, chain_retrieved_at, policy)
  epoch_id            TEXT NOT NULL REFERENCES evaluation_epoch(epoch_id),
  symbol              TEXT NOT NULL,
  expiration          TEXT NOT NULL,          -- always present (real surfaces only)
  dte                 INTEGER NOT NULL,
  strategy            TEXT NOT NULL,          -- 'csp' | 'buy_write'
  evaluation_state    TEXT NOT NULL,
  chain_retrieved_at  TEXT NOT NULL,          -- evidence-input identity (freshness at decision time)
  observed_at         TEXT NOT NULL,
  -- winner economics (raw governed facts of the surface's best candidate; NULL for non-qualifying states)
  best_delta          REAL,
  best_strike         REAL,
  best_mid            REAL,
  best_spread_pct     REAL,
  best_open_interest  INTEGER,
  best_volume         INTEGER,
  best_yield_annual   REAL,
  best_posture        TEXT                    -- ACTIONABLE | EDGE | WAIT
);

CREATE INDEX idx_oh_surface_symbol_session ON surface_observation(symbol, epoch_id);
CREATE INDEX idx_oh_surface_state ON surface_observation(evaluation_state);
CREATE INDEX idx_oh_surface_observed ON surface_observation(observed_at);
CREATE INDEX idx_oh_symbol_session ON symbol_observation(symbol, epoch_id);
CREATE INDEX idx_oh_epoch_session ON evaluation_epoch(session_date);
