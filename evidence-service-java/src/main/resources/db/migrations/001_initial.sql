-- Migration 001: Initial persistence schema
-- Evidence Appliance durable operational state

-- ═══ UNIVERSE ═══

CREATE TABLE symbols (
  symbol     TEXT PRIMARY KEY,
  added_at   TEXT NOT NULL,
  removed_at TEXT
);

CREATE TABLE universe_sources (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  imported_at  TEXT NOT NULL,
  symbol_count INTEGER NOT NULL
);

CREATE TABLE symbol_membership (
  symbol    TEXT NOT NULL REFERENCES symbols(symbol),
  source_id TEXT NOT NULL REFERENCES universe_sources(id),
  PRIMARY KEY (symbol, source_id)
);

-- ═══ EVIDENCE ═══

CREATE TABLE evidence (
  symbol           TEXT NOT NULL REFERENCES symbols(symbol),
  evidence_type    TEXT NOT NULL,
  expiration       TEXT NOT NULL DEFAULT '',
  -- Last successful evidence
  data             TEXT,
  retrieved_at     TEXT,
  session_date     TEXT,
  -- Latest attempt tracking (independent of success)
  last_attempt_at  TEXT,
  attempt_result   TEXT,
  failure_count    INTEGER NOT NULL DEFAULT 0,
  failure_reason   TEXT,
  PRIMARY KEY (symbol, evidence_type, expiration)
);

-- ═══ RESOLUTION ═══

CREATE TABLE symbol_resolution (
  symbol             TEXT PRIMARY KEY REFERENCES symbols(symbol),
  resolution         TEXT NOT NULL,
  primary_expiration TEXT,
  resolved_at        TEXT,
  session_date       TEXT
);

-- ═══ SNAPSHOT ═══

CREATE TABLE snapshot_state (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  generation   INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  sealed_at    TEXT,
  session_date TEXT,
  session_state TEXT
);

-- Seed singleton snapshot row
INSERT INTO snapshot_state (id, generation) VALUES (1, 0);

-- ═══ INDEXES ═══

CREATE INDEX idx_evidence_symbol ON evidence(symbol);
CREATE INDEX idx_resolution_status ON symbol_resolution(resolution);
