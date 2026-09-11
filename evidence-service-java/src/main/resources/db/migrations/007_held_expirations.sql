-- Migration 007: Held-expiration acquisition overlay (PL-EVID-01 extension)
--
-- The monitored-position overlay (003) records, per SYMBOL, that capital is at
-- risk so the symbol's evidence is kept current. But chain acquisition only
-- fetches expirations inside the 7-45 DTE window. An operator's held position can
-- sit at a near-expiry expiration (0-4 DTE) that falls OUTSIDE that window, so its
-- chain — and therefore its greeks — stops being refreshed while it is still held.
--
-- This table records the EXACT expirations the operator currently holds, per
-- symbol, as an additional acquisition reason: "we hold this exact expiration,
-- therefore keep observing it." The acquisition worker unions these into the set
-- of expirations it fetches for a symbol, so held chains stay current regardless
-- of DTE. NON-held sub-7-DTE expirations remain excluded — only explicitly held
-- ones are added.
--
-- Replaced atomically on each declaration (same lifecycle as monitored_at): a
-- closed position stops being held on the next declaration.
CREATE TABLE IF NOT EXISTS held_expiration (
    symbol TEXT NOT NULL,
    expiration TEXT NOT NULL,
    declared_at TEXT NOT NULL,
    PRIMARY KEY (symbol, expiration)
);
CREATE INDEX IF NOT EXISTS idx_held_expiration_symbol ON held_expiration(symbol);
