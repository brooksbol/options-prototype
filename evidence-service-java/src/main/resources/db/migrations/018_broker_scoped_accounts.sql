-- Preserve Account identities and all grants while replacing native-reference
-- global uniqueness. The migration runner executes this entire file atomically.
-- Save/recreate the child table explicitly so no FK can follow a renamed parent.
CREATE TEMP TABLE step3_account_grants AS SELECT * FROM v2_user_account;
DROP TABLE v2_user_account;
CREATE TABLE brokerage_account_step3 (
    account_id TEXT PRIMARY KEY,
    alias TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    broker_account TEXT NOT NULL,
    identity_namespace TEXT NOT NULL,
    broker TEXT NOT NULL CHECK(broker IN ('FIDELITY','TASTYTRADE')),
    UNIQUE(broker, broker_account)
);
INSERT INTO brokerage_account_step3
SELECT account_id, alias, display_name, broker_account, identity_namespace, 'FIDELITY'
FROM brokerage_account;
DROP TABLE brokerage_account;
ALTER TABLE brokerage_account_step3 RENAME TO brokerage_account;
CREATE TABLE v2_user_account (
    user_id TEXT NOT NULL REFERENCES v2_user(user_id),
    account_id TEXT NOT NULL REFERENCES brokerage_account(account_id),
    metadata_read INTEGER NOT NULL CHECK(metadata_read IN (0,1)),
    positions_read INTEGER NOT NULL CHECK(positions_read IN (0,1)),
    artifacts_read INTEGER NOT NULL CHECK(artifacts_read IN (0,1)),
    artifacts_write INTEGER NOT NULL CHECK(artifacts_write IN (0,1)),
    PRIMARY KEY(user_id,account_id)
);
INSERT INTO v2_user_account SELECT * FROM step3_account_grants;
DROP TABLE step3_account_grants;
