-- Migration 002: Spot History — bounded temporal observation retention
-- Appends one row per successful chain acquisition containing the underlying price.
-- Consumed by future observation history APIs. Never overwritten, only appended.

CREATE TABLE spot_history (
  symbol      TEXT NOT NULL,
  price       REAL NOT NULL,
  observed_at TEXT NOT NULL
);

CREATE INDEX idx_spot_history_symbol_time ON spot_history(symbol, observed_at DESC);
