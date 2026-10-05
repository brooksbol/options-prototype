-- Migration 014: canonical direct-quote evidence (API v2, PL-API-03 / Doc 76 §§21-23).
--
-- Durable held direct-quote observations acquired through POST /v2/quotes. This table is
-- DELIBERATELY ISOLATED from the v1 evidence model: it is never read by
-- getQuoteObservations, symbol_resolution, snapshot_state, spot_history, or any Decision
-- path. A direct quote and a chain-embedded spot are distinct evidence claims even when
-- their numeric values match (Doc 76 §21.6). Writing a direct quote here must NOT advance
-- the snapshot generation or make a symbol Decision-visible.
--
-- One authoritative held observation per canonical (uppercase) underlying symbol. A new
-- accepted observation supersedes the prior one (observation identity is the stable
-- observation_id, not numeric equality). A failed later acquisition never overwrites this
-- row (failed-refresh-preserves-evidence) — the v2 service simply does not write on failure.

CREATE TABLE IF NOT EXISTS direct_quote (
    symbol              TEXT PRIMARY KEY,          -- canonical uppercase underlying symbol
    observation_id      TEXT NOT NULL,             -- stable Wheelwright observation identity (uuid)
    security_type       TEXT NOT NULL,             -- EQUITY | ETF | INDEX | OTHER_UNDERLYING
    facts_json          TEXT NOT NULL,             -- serialized QuoteFacts (source-reported facts, absence omitted)
    provider            TEXT NOT NULL,             -- source provider identity, e.g. tradier
    environment         TEXT NOT NULL,             -- PRODUCTION | SANDBOX (provider data environment)
    acquisition_id      TEXT NOT NULL,             -- Wheelwright identity of the accepted upstream attempt (uuid)
    authority_epoch     TEXT NOT NULL,             -- opaque Wheelwright authority/fencing identity (no credential)
    acquisition_phase   TEXT NOT NULL,             -- REGULAR_USABLE | PRE_MARKET | POST_MARKET | CLOSED | UNKNOWN
    regular_session_date TEXT,                     -- applicable US regular-session date when known; else NULL
    feed_identity       TEXT,                      -- stable source-feed identity when distinguished; else NULL
    received_at         TEXT NOT NULL,             -- Wheelwright receipt instant (RFC 3339 UTC)
    committed_at        TEXT NOT NULL              -- authoritative held-evidence acceptance instant (RFC 3339 UTC)
);
