-- Preserve existing evidence and opaque subordinate identities while moving every
-- account reference to a generated canonical ID. Aliases are mutable metadata only.
PRAGMA defer_foreign_keys = ON;
ALTER TABLE brokerage_account RENAME TO brokerage_account_legacy;
CREATE TABLE brokerage_account (
    account_id TEXT PRIMARY KEY,
    alias TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    broker_account TEXT NOT NULL UNIQUE,
    identity_namespace TEXT NOT NULL
);
INSERT INTO brokerage_account
SELECT 'acct_' || lower(hex(randomblob(16))), account,
       COALESCE((SELECT json_extract(payload_json, '$.accountName')
                 FROM account_position_snapshot s WHERE s.account=l.account
                 ORDER BY evidence_date DESC, recorded_at DESC LIMIT 1), account),
       broker_account, account
FROM brokerage_account_legacy l;
UPDATE account_position_snapshot
SET payload_json=json_set(payload_json, '$.account',
    (SELECT account_id FROM brokerage_account WHERE alias=account_position_snapshot.account));
UPDATE account_position_snapshot SET account=(SELECT account_id FROM brokerage_account WHERE alias=account_position_snapshot.account);
UPDATE brokerage_artifact SET account=(SELECT account_id FROM brokerage_account WHERE alias=brokerage_artifact.account);
UPDATE brokerage_import SET account=(SELECT account_id FROM brokerage_account WHERE alias=brokerage_import.account);
UPDATE brokerage_evidence_row SET account=(SELECT account_id FROM brokerage_account WHERE alias=brokerage_evidence_row.account);
UPDATE brokerage_ledger_observation SET account=(SELECT account_id FROM brokerage_account WHERE alias=brokerage_ledger_observation.account);
DROP TABLE brokerage_account_legacy;

CREATE UNIQUE INDEX brokerage_artifact_global_identity ON brokerage_artifact(artifact_id);
