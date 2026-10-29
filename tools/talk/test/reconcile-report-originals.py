import sqlite3,json,hashlib
from decimal import Decimal
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
# Engineer-only, read-only forensic check. Not imported by Talk/MCP or used as a financial engine.
import argparse
parser=argparse.ArgumentParser(description='Reconcile a qualified tastytrade closed report directly against retained originals, without printing financial values.')
parser.add_argument('database');parser.add_argument('report');parser.add_argument('output');args=parser.parse_args()
report=json.loads(Path(args.report).read_text());assert report['view']=='closed-trades' and report['provider']=='TASTYTRADE'
account=report['accountId'];db=sqlite3.connect(Path(args.database).resolve().as_uri()+'?mode=ro',uri=True)
period=report['period'];zone=ZoneInfo(period['timeZone']);cutoff=datetime.fromisoformat(period['requestedCutoff'].replace('Z','+00:00'))

attempt=db.execute('select accepted_attempt_id from account_history_state where account=?',(account,)).fetchone()[0]
originals=db.execute('select a.payload,a.sha256 from account_history_page p join brokerage_artifact a on a.account=p.account and a.artifact_id=p.artifact_id where p.account=? and p.attempt_id=? order by p.page_offset',(account,attempt)).fetchall()
rows=[]
for payload,sha in originals:
 assert hashlib.sha256(payload).hexdigest()==sha
 rows.extend(json.loads(payload)['data']['items'])
assert len({str(r['id'])for r in rows})==len(rows)
def signed(row,field):
 assert field in row and field+'-effect'in row
 effect=row[field+'-effect'];assert effect in ['Credit','Debit','None'];return Decimal(str(row[field]))*(-1 if effect=='Debit'else 1)
def at(row):return datetime.fromisoformat(row['executed-at'].replace('Z','+00:00'))
def shape(group,opening):
 result={};sides=({'Sell to Open':'SHORT','Buy to Open':'LONG'}if opening else{'Buy to Close':'SHORT','Sell to Close':'LONG'})
 for r in group:
  if r.get('action')not in sides:return None
  key=(r['symbol'],sides[r['action']]);q=Decimal(str(r['quantity']));assert q>0;result[key]=result.get(key,Decimal(0))+q
 return result
orders={}
for row in rows:
 if row.get('transaction-type')=='Trade'and row.get('order-id')is not None:orders.setdefault(str(row['order-id']),[]).append(row)
matched=[];feeReconciliations=[]
for closeId,closing in orders.items():
 if not shape(closing,False):continue
 if not all(period['from']<=at(r).astimezone(zone).date().isoformat()<=period['through'] and at(r)<=cutoff for r in closing):continue
 candidates=[]
 for openId,opening in orders.items():
  if openId==closeId or shape(opening,True)!=shape(closing,False):continue
  if max(map(at,opening))>min(map(at,closing)):continue
  symbols={r['symbol']for r in opening+closing};ids={str(r['id'])for r in opening+closing}
  if any(str(r['id'])not in ids and (r.get('symbol')in symbols or str(r.get('order-id'))in {openId,closeId})for r in rows):continue
  candidates.append(opening)
 assert len(candidates)==1
 pair=candidates[0]+closing;net=sum((signed(r,'net-value')for r in pair),Decimal(0));label=' / '.join(sorted({r['underlying-symbol']for r in closing}));actual=next(t for t in report['trades']if t['label']==label);assert net==Decimal(actual['netPnl']['value'])
 for r in pair:
  charges=sum((signed(r,k)for k in ['commission','clearing-fees','regulatory-fees','proprietary-index-option-fees','currency-conversion-fees']if k in r),Decimal(0))
  feeReconciliations.append(signed(r,'value')+charges==signed(r,'net-value'))
 matched.append({'symbol':label,'openingRows':len(candidates[0]),'closingRows':len(closing),'contractsAndQuantitiesMatch':True,'uniqueWithinAcceptedSource':True,'sourceOriginalNetMatchesBackend':True,'allFeesEstimated':all(r.get('is-estimated-fee')is True for r in pair),'net':net})
assert {r['symbol']for r in matched}=={r['label']for r in report['trades']};assert sum((r['net']for r in matched),Decimal(0))==Decimal(report['totals']['netPnl']['value']);assert all(feeReconciliations)
summary={'method':'Separate Python Decimal computation directly from hash-verified accepted broker originals; does not invoke report matching/accounting code','sourcePages':len(originals),'sourceRecords':len(rows),'tradeCount':len(matched),'trades':[{k:v for k,v in r.items()if k!='net'}for r in matched],'exactNetTotalMatchesBackend':True,'reportedGrossPlusReportedChargesMatchesReportedNetForEveryMatchedLeg':True,'matchedLegs':len(feeReconciliations),'missingFeeFieldsAssumedZero':False,'noFinancialValuesPersisted':True,'independentReviewerApproval':False,'remainingBoundary':'Source fee estimates and brokerage/period completeness remain qualified; this is source-original reconciliation, not tax or independent reviewer acceptance.'}
Path(args.output).write_text(json.dumps(summary,indent=2));print(json.dumps(summary))
