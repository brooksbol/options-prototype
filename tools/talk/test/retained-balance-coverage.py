import sqlite3,json,collections,re,hashlib,sys
from pathlib import Path
path=Path(sys.argv[1]).resolve()
result={'mode':'SQLite read-only; counts, statuses and field-presence only','protectedPayloadsExported':False,'providerRequests':0}
with sqlite3.connect(path.as_uri()+'?mode=ro',uri=True) as db:
 result['imports']=[{'type':t,'status':s,'count':n} for t,s,n in db.execute('select file_type,status,count(*) from brokerage_import group by 1,2')]
 # Fixed known keys only; never reflect arbitrary data, names, IDs, money or filenames.
 keys=['cash-balance','equity-buying-power','derivative-buying-power','day-trading-buying-power','margin-equity','maintenance-requirement','reg-t-margin-requirement','used-derivative-buying-power','pending-margin-interest','updated-at','snapshot-date','currency']
 rows=db.execute("select distinct a.payload,a.sha256 from brokerage_artifact a join brokerage_import i using(account,artifact_id) where i.file_type='API_BALANCES'").fetchall()
 stats={k:0 for k in keys}; valid=0
 for raw,h in rows:
  valid+=hashlib.sha256(raw).hexdigest()==h
  try:d=json.loads(raw).get('data',{})
  except Exception:continue
  for k in keys:stats[k]+=k in d and d[k] is not None
 result['tastytradeBalanceArtifacts']={'count':len(rows),'validHashes':valid,'nonNullFieldPresence':stats}
 labels=['Available without margin impact','Settled cash','Margin buying power','Non-margin buying power','Cash reserved for options strategies','Cash reserved for options','Margin credit/debit','Margin debit','Margin credit','Total account value']
 import csv,io
 stats={k:0 for k in labels}; rows=db.execute("select distinct a.payload,a.sha256 from brokerage_artifact a join brokerage_import i using(account,artifact_id) where i.file_type='BALANCES'").fetchall()
 for raw,h in rows:
  try:observed={row[0].strip() for row in csv.reader(io.StringIO(raw.decode('utf-8-sig'))) if row}
  except Exception:continue
  for k in labels:stats[k]+=k in observed
 result['fidelityBalanceArtifacts']={'count':len(rows),'fieldPresence':stats}
 result['resourceKinds']=dict(db.execute('select kind,count(*) from portfolio_resource group by kind'))
 result['transactionCount']=db.execute('select count(*) from account_transaction').fetchone()[0]
print(json.dumps(result,indent=2))
