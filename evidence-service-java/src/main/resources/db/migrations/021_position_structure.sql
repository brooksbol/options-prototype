-- Source-only migration; operational application requires separate delivery authority.
ALTER TABLE v2_user_account ADD COLUMN positions_associate INTEGER NOT NULL DEFAULT 0 CHECK(positions_associate IN (0,1));
CREATE TABLE position_association (
 account TEXT NOT NULL REFERENCES brokerage_account(account_id),
 association_id TEXT NOT NULL UNIQUE,
 snapshot_id TEXT NOT NULL,
 author_user_id TEXT NOT NULL REFERENCES v2_user(user_id),
 submission_id TEXT NOT NULL,
 request_json TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 supersedes_id TEXT,
 PRIMARY KEY(account,association_id),
 UNIQUE(account,author_user_id,submission_id),
 UNIQUE(account,supersedes_id),
 FOREIGN KEY(account,snapshot_id) REFERENCES account_position_snapshot(account,snapshot_id),
 FOREIGN KEY(account,supersedes_id) REFERENCES position_association(account,association_id)
);
CREATE TABLE position_contract_evidence (
 account TEXT NOT NULL,
 snapshot_id TEXT NOT NULL,
 holding_id TEXT NOT NULL,
 observation_id TEXT NOT NULL UNIQUE,
 acquisition_id TEXT NOT NULL,
 option_artifact_id TEXT,
 underlying_artifact_id TEXT,
 recorded_at TEXT NOT NULL,
 PRIMARY KEY(account,observation_id),
 FOREIGN KEY(account,snapshot_id) REFERENCES account_position_snapshot(account,snapshot_id),
 FOREIGN KEY(account,option_artifact_id) REFERENCES brokerage_artifact(account,artifact_id),
 FOREIGN KEY(account,underlying_artifact_id) REFERENCES brokerage_artifact(account,artifact_id)
);
CREATE TABLE position_contract_acquisition (
 account TEXT NOT NULL REFERENCES brokerage_account(account_id),
 acquisition_id TEXT NOT NULL UNIQUE,
 payload_json TEXT NOT NULL,
 PRIMARY KEY(account,acquisition_id)
);
