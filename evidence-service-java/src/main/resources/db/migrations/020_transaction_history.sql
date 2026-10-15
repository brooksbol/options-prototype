-- One history capability includes policy-bounded backend read-through. Existing grants stay false.
ALTER TABLE v2_user_account ADD COLUMN transactions_read INTEGER NOT NULL DEFAULT 0 CHECK(transactions_read IN (0,1));
CREATE TABLE account_history_attempt (
  account TEXT NOT NULL REFERENCES brokerage_account(account_id),
  attempt_id TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT,
  end_at TEXT NOT NULL, status TEXT NOT NULL, pages INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(account,attempt_id)
);
CREATE TABLE account_history_page (
  account TEXT NOT NULL, attempt_id TEXT NOT NULL, page_offset INTEGER NOT NULL,
  artifact_id TEXT NOT NULL, received_at TEXT NOT NULL,
  PRIMARY KEY(account,attempt_id,page_offset),
  FOREIGN KEY(account,attempt_id) REFERENCES account_history_attempt(account,attempt_id),
  FOREIGN KEY(account,artifact_id) REFERENCES brokerage_artifact(account,artifact_id)
);
CREATE TABLE account_transaction (
  account TEXT NOT NULL REFERENCES brokerage_account(account_id),
  transaction_id TEXT NOT NULL UNIQUE, source_key TEXT NOT NULL,
  current_observation_id TEXT NOT NULL,
  PRIMARY KEY(account,source_key)
);
CREATE TABLE account_transaction_observation (
  account TEXT NOT NULL, observation_id TEXT NOT NULL, transaction_id TEXT NOT NULL,
  content_hash TEXT NOT NULL, artifact_id TEXT NOT NULL, source_row INTEGER NOT NULL,
  received_at TEXT NOT NULL, previous_observation_id TEXT, payload_json TEXT NOT NULL,
  PRIMARY KEY(account,observation_id),
  FOREIGN KEY(account,artifact_id) REFERENCES brokerage_artifact(account,artifact_id)
);
CREATE TABLE account_history_state (
  account TEXT PRIMARY KEY REFERENCES brokerage_account(account_id),
  accepted_attempt_id TEXT NOT NULL, checked_at TEXT NOT NULL, end_at TEXT NOT NULL
);
