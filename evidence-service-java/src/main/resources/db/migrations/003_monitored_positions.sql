-- Migration 003: Monitored-position observation obligation (PL-EVID-01)
--
-- A held/open portfolio position is an INDEPENDENT reason to observe a symbol,
-- separate from its recommendation acquisition class (A/B/C/D). Capital is already
-- exposed to it, so its evidence must be kept current enough to monitor throughout
-- the session — even when the symbol is a poor candidate for new deployment today
-- and therefore legitimately Class B for recommendation acquisition.
--
-- This overlay does NOT change a symbol's recommendation class. It records, per
-- symbol, whether it is currently a monitored position and when that was last
-- declared by a consumer (the frontend posts the live Fidelity open-position
-- underlyings to /api/evidence/observe).
--
-- monitored_at IS NULL  -> not a monitored position
-- monitored_at = <ts>   -> monitored; timestamp is the last declaration time

ALTER TABLE symbol_resolution ADD COLUMN monitored_at TEXT;

CREATE INDEX idx_resolution_monitored ON symbol_resolution(monitored_at);
