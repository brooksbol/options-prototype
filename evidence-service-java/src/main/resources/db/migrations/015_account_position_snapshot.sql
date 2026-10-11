-- Immutable admitted brokerage snapshots. No activity/ledger replacement occurs here.
CREATE TABLE brokerage_account (
    account TEXT PRIMARY KEY,
    broker_account TEXT NOT NULL UNIQUE
);
CREATE TABLE brokerage_evidence_row (
    account TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    source_row INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    row_json TEXT NOT NULL,
    PRIMARY KEY (account, artifact_id, source_row)
);
-- Exact observed activity rows, with within-export multiplicity; not lifecycle identities.
CREATE TABLE brokerage_ledger_observation (
    account TEXT NOT NULL,
    row_hash TEXT NOT NULL,
    occurrence INTEGER NOT NULL,
    first_artifact_id TEXT NOT NULL,
    row_json TEXT NOT NULL,
    PRIMARY KEY (account, row_hash, occurrence)
);
CREATE TABLE brokerage_artifact (
    account TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    payload BLOB NOT NULL,
    received_at TEXT NOT NULL,
    PRIMARY KEY (account, artifact_id),
    UNIQUE (account, sha256)
);
CREATE TABLE brokerage_import (
    account TEXT NOT NULL,
    import_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    imported_at TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT NOT NULL,
    PRIMARY KEY (account, import_id),
    FOREIGN KEY (account, artifact_id) REFERENCES brokerage_artifact(account, artifact_id)
);
CREATE TABLE account_position_snapshot (
    account TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    evidence_date TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    PRIMARY KEY (account, snapshot_id)
);
