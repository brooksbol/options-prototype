-- Acquisition authority never follows from read or artifact-write authority.
ALTER TABLE v2_user_account ADD COLUMN positions_acquire INTEGER NOT NULL DEFAULT 0 CHECK(positions_acquire IN (0,1));
CREATE TABLE brokerage_position_acquisition (
    acquisition_id TEXT PRIMARY KEY,
    account TEXT NOT NULL REFERENCES brokerage_account(account_id),
    artifact_id TEXT,
    started_at TEXT NOT NULL,
    received_at TEXT,
    completed_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACCEPTED','REJECTED','FAILED')),
    interpretation_version TEXT NOT NULL,
    FOREIGN KEY(account,artifact_id) REFERENCES brokerage_artifact(account,artifact_id)
);
