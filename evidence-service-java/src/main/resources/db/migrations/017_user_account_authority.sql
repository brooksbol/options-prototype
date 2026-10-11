-- User identity is independent of Account identity and credential rotation.
CREATE TABLE v2_user (
    user_id TEXT PRIMARY KEY,
    bootstrap_subject TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    administrator INTEGER NOT NULL CHECK(administrator IN (0,1)),
    quote_read INTEGER NOT NULL CHECK(quote_read IN (0,1)),
    quote_acquire INTEGER NOT NULL CHECK(quote_acquire IN (0,1)),
    quote_force INTEGER NOT NULL CHECK(quote_force IN (0,1))
);
CREATE TABLE v2_user_account (
    user_id TEXT NOT NULL REFERENCES v2_user(user_id),
    account_id TEXT NOT NULL REFERENCES brokerage_account(account_id),
    metadata_read INTEGER NOT NULL CHECK(metadata_read IN (0,1)),
    positions_read INTEGER NOT NULL CHECK(positions_read IN (0,1)),
    artifacts_read INTEGER NOT NULL CHECK(artifacts_read IN (0,1)),
    artifacts_write INTEGER NOT NULL CHECK(artifacts_write IN (0,1)),
    PRIMARY KEY(user_id,account_id)
);
