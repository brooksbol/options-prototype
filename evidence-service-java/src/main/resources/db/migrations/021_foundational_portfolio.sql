-- Wheelwright domain interpretations are distinct from immutable broker source snapshots.
CREATE TABLE portfolio_resource (
 uri TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('POSITION','CONSTRUCTION','MODEL','MODEL_VERSION','ORDER','INSTRUMENT','HOLDING','MARKET_OBSERVATION','AUDIT')),
 account_id TEXT REFERENCES brokerage_account(account_id),
 payload_json TEXT NOT NULL,
 source_snapshot TEXT,
 source_key TEXT,
 recorded_at TEXT NOT NULL
);
CREATE INDEX portfolio_scope ON portfolio_resource(kind,account_id,uri);
CREATE INDEX portfolio_source ON portfolio_resource(account_id,source_snapshot,source_key);
CREATE TABLE portfolio_admission (
 account_id TEXT NOT NULL,
 snapshot_id TEXT NOT NULL,
 admitted_at TEXT NOT NULL,
 PRIMARY KEY(account_id,snapshot_id)
);

-- Extend the existing fixed permission model; no client-managed grant mechanism.
ALTER TABLE v2_user ADD COLUMN reference_read INTEGER NOT NULL DEFAULT 0 CHECK(reference_read IN (0,1));
ALTER TABLE v2_user ADD COLUMN market_read INTEGER NOT NULL DEFAULT 0 CHECK(market_read IN (0,1));
ALTER TABLE v2_user_account ADD COLUMN holdings_read INTEGER NOT NULL DEFAULT 0 CHECK(holdings_read IN (0,1));
ALTER TABLE v2_user_account ADD COLUMN orders_read INTEGER NOT NULL DEFAULT 0 CHECK(orders_read IN (0,1));
ALTER TABLE v2_user_account ADD COLUMN positions_audit_read INTEGER NOT NULL DEFAULT 0 CHECK(positions_audit_read IN (0,1));
ALTER TABLE v2_user_account ADD COLUMN market_read INTEGER NOT NULL DEFAULT 0 CHECK(market_read IN (0,1));
