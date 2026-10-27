"""Read-only coverage metadata only. Never prints payloads, identifiers or filenames."""
import argparse, datetime, json, re, sqlite3
from pathlib import Path
from urllib.parse import quote
parser = argparse.ArgumentParser()
parser.add_argument('operational_store')
parser.add_argument('retained_account_store')
args = parser.parse_args()
TABLES = ('direct_quote', 'evidence', 'brokerage_account', 'brokerage_artifact',
          'brokerage_import', 'account_position_snapshot', 'account_transaction',
          'account_transaction_observation', 'portfolio_resource', 'governed_context_version',
          'subject_scope_association', 'governed_decision', 'option_obligation_continuity_assessment')
def audit(path):
    with sqlite3.connect('file:' + quote(str(Path(path).resolve())) + '?mode=ro', uri=True) as db:
        result = {'tableCounts': {table: db.execute('select count(*) from ' + table).fetchone()[0] for table in TABLES}}
        result['marketEvidenceCounts'] = [{'kind': kind, 'environment': env, 'count': count}
            for kind, env, count in db.execute("""select
                case when evidence_type in ('chain','expirations') then evidence_type else 'OTHER' end,
                case when upper(environment) in ('PRODUCTION','SANDBOX') then upper(environment) else 'UNKNOWN' end,
                count(*) from evidence group by 1,2""")]
        # Source dates only; invalid values are not reflected back as arbitrary text.
        def safe_date(value):
            return value if value is None or re.fullmatch(r'\d{4}-\d{2}-\d{2}(T[0-9:.+Z-]+)?', value) else 'INVALID_DATE'
        def interval(table, column):
            first,last = db.execute('select min('+column+'),max('+column+') from '+table).fetchone()
            return {'first':safe_date(first),'last':safe_date(last)}
        result['quoteReceiptRange'] = interval('direct_quote','received_at')
        result['snapshotEvidenceDateRange'] = interval('account_position_snapshot','evidence_date')
        result['distinctSnapshotDates'] = db.execute('select count(distinct evidence_date) from account_position_snapshot').fetchone()[0]
        result['positionLifecycleCounts'] = dict(db.execute("""select case when json_extract(payload_json,'$.state')
            in ('OPEN','CLOSED','UNRESOLVED') then json_extract(payload_json,'$.state') else 'UNKNOWN' end,count(*)
            from portfolio_resource where kind='POSITION' group by 1"""))
        result['acceptedImportsLinkedToOriginals'] = db.execute("""select count(*) from brokerage_import i
            join brokerage_artifact a on a.account=i.account and a.artifact_id=i.artifact_id where i.status='ACCEPTED'""").fetchone()[0]
        result['importsWithExplicitSyntheticFilename'] = db.execute("""select count(*) from brokerage_import
            where lower(original_filename) like '%synthetic%' or lower(original_filename) like '%fixture%'
            or lower(original_filename) like '%sandbox%'""").fetchone()[0]
        result['upstreamSourceAuthenticityIndependentlyVerified'] = False
        return result
print(json.dumps({'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'operational': audit(args.operational_store), 'retainedAccounts': audit(args.retained_account_store),
    'rawPayloadsExported':False, 'mode':'SQLite mode=ro; counts/dates only'}, indent=2))
