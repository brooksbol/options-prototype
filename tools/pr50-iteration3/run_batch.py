"""Explicit I3 batch command and staged one-date management schedule.
No daemon/job/recurring service is installed. Default action is inspection.
"""
from pathlib import Path
from datetime import datetime,timezone,timedelta
import argparse,json,time,fcntl,os,subprocess
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime,manage,observe
from reuse import components,BASE

def readback(root,label):
    m,_,_=components();account=json.loads((BASE/'one-shot-margin-20261117/prepared-packet.json').read_bytes())['account_id'];folder=root/('readback-'+label+'-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ'));folder.mkdir(mode=0o700,parents=True)
    reader=m.Reader(*m.load_credentials(),folder/'broker');cut=runtime.capture(m,reader,account,folder,full_cash=True);result=observe.evaluate_cohort(root,cut);runtime.save(folder/'lifecycle.json',result);return result

def batch(root,prepared,grant,claims,admission,admission_sha):
    plan=json.loads((prepared/'plan.json').read_bytes());policy.validate_plan(plan)
    freeze=json.loads((prepared/'freeze-receipt.json').read_bytes())
    if freeze['planSha256']!=policy.digest(plan) or freeze['eligibilityEvidenceSha256']!=runtime.hashfile(prepared/'eligibility-evidence.json'):raise policy.Hold('PROSPECTIVE_ELIGIBILITY_FREEZE_CHANGED')
    catalog_root=Path(freeze['catalogRoot'])
    if runtime.hashfile(catalog_root.parent/'final-manifest.json')!=freeze['discoveryManifestSha256']:raise runtime.AccountStop('FROZEN_DISCOVERY_CHANGED')
    account=json.loads((BASE/'one-shot-margin-20261117/prepared-packet.json').read_bytes())['account_id']
    for symbol in plan['eligibleAtFreeze']:runtime.authorize(grant,plan,account,symbol,'ENTRY');runtime.authorize(grant,plan,account,symbol,'P50')
    root.mkdir(mode=0o700,parents=True,exist_ok=False);runtime.save(root/'plan.json',plan);runtime.save(root/'freeze-receipt.json',freeze)
    results=[];started=time.monotonic();m,_,_=components()
    try:
        with (root/'batch.lock').open('a') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            for symbol in policy.ROSTER:
                if symbol not in plan['eligibleAtFreeze']:
                    results.append({'symbol':symbol,'arm':plan['assignment'][symbol],'state':'WAIT_AT_PROSPECTIVE_FREEZE'});continue
                try:
                    enrollment,metrics=runtime.execute_candidate(symbol,plan,catalog_root,root,grant,claims,admission,admission_sha)
                    results.append({'symbol':symbol,'arm':enrollment['arm'],'state':'ENTRY_FILLED_P50_ACCEPTED','metrics':metrics})
                except Exception as error:
                    claimed=any((root/k/symbol/'place-dispatch-claim.json').exists() for k in ('entries','p50'))
                    results.append({'symbol':symbol,'arm':plan['assignment'][symbol],'state':'LOCAL_PENDING_OR_P50_QUALIFICATION_WATCH' if isinstance(error,runtime.LocalPending) else 'ACCOUNT_STOP' if isinstance(error,runtime.AccountStop) else 'STOP_AFTER_CLAIM' if claimed else 'WAIT_REQUALIFIABLE','reason':str(error),'claimExists':claimed})
                    if isinstance(error,runtime.AccountStop) or (claimed and not isinstance(error,runtime.LocalPending)):
                        if not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',{'at':runtime.stamp(),'phase':'ENTRY','reason':str(error)})
                        break
                # Local known entry/history lag never abandons its original-ID watch.
                try:
                    watched=runtime.late_fill_pass(root,plan,grant)
                    if any(x.get('state') in runtime.UNKNOWN_PLACEMENT_STATES for x in watched):raise runtime.AccountStop('UNRESOLVED_PLACEMENT_IN_WATCH_RESULT')
                    if watched:runtime.save(root/('batch-watch-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ')+'.json'),watched)
                except runtime.AccountStop as err:
                    if not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',{'at':runtime.stamp(),'phase':'BATCH_LATE_WATCH','reason':str(err)})
                    break
                except Exception as err:runtime.save(root/('batch-watch-error-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ')+'.json'),{'state':'MANAGEMENT_DELIVERY_FAILURE','reason':str(err)})
            done={x['symbol'] for x in results}
            results.extend({'symbol':s,'arm':plan['assignment'][s],'state':'NOT_ATTEMPTED_AFTER_STOP'} for s in policy.ROSTER if s not in done)
            runtime.save(root/'batch-summary.json',{'at':runtime.stamp(),'rows':results,'seconds':time.monotonic()-started,'noResend':True})
            return readback(root,'batch-final')
    finally:
        if m.worker is not None:
            m.worker.stdin.close()
            try:m.worker.wait(timeout=5)
            except Exception:m.worker.terminate();m.worker.wait(timeout=5)
            m.worker=None

def schedule(root,grant,admission,admission_sha):
    """Stage/run only after NEW explicit SCHEDULE + arm authorizations.
    Missed selection never becomes a late mutation. Reports remain read-only.
    """
    plan=json.loads((root/'plan.json').read_bytes());policy.validate_plan(plan);members=list((root/'enrollments').glob('*.json'))
    if not members:
        pending=list(root.glob('entries/*/pending-intent.json'))
        if not pending:raise policy.Hold('NO_ENROLLED_OR_PENDING_COHORT')
        members=pending
    for p in members:
        x=json.loads(p.read_bytes());runtime.authorize(grant,plan,x['account_id'],x['symbol'],'SCHEDULE')
    power=subprocess.run(['pmset','-g','batt'],capture_output=True,text=True,timeout=5)
    if power.returncode!=0 or 'AC Power' not in power.stdout:raise policy.Hold('SCHEDULE_REQUIRES_AC_POWER_AND_OPEN_LID')
    until=datetime.fromisoformat(plan['awakeUntilUTC']);seconds=max(1,int((until-runtime.utc()).total_seconds()))
    awake=subprocess.Popen(['/usr/bin/caffeinate','-dimsu','-t',str(seconds)])
    runtime.save(root/('keepawake-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ')+'.json'),{'pid':awake.pid,'until':until.isoformat(),'ACVerified':True,'lidOpenRequired':True,'noGlobalPowerChange':True})
    with (root/'schedule.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        latest=datetime.fromisoformat(plan['p50LatestUTC'])
        while runtime.utc()<latest:
            try:
                observed=[] if (root/'account-global-hold.json').exists() else runtime.late_fill_pass(root,plan,grant)
                if any(x.get('state') in runtime.UNKNOWN_PLACEMENT_STATES for x in observed):raise runtime.AccountStop('UNRESOLVED_PLACEMENT_IN_WATCH_RESULT')
            except runtime.AccountStop as err:
                if not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',{'at':runtime.stamp(),'phase':'SCHEDULE_LATE_WATCH','reason':str(err)})
                observed=[{'state':'ACCOUNT_GLOBAL_HOLD_READBACK_ONLY','reason':str(err)}]
            except Exception as err:observed=[{'state':'UNMANAGED_ENTRY_NEEDS_READBACK','reason':str(err)}]
            if observed:runtime.save(root/('late-fill-watch-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ')+'.json'),observed)
            time.sleep(15)
        for at,kind,arm in [(plan['arms']['B']['selectionAt'],'ACTION','B'),(plan['arms']['B']['readbackAt'],'READBACK','B'),(plan['arms']['A']['selectionAt'],'ACTION','A'),(plan['arms']['A']['readbackAt'],'READBACK','A'),(plan['finalReadbackUTC'],'FINAL',None)]:
            target=datetime.fromisoformat(at)
            while runtime.utc()<target:
                heartbeat={'at':runtime.stamp(),'state':'WAITING','next':at,'kind':kind,'arm':arm}
                # Only a heartbeat is replaceable; all claims/results immutable.
                p=root/'schedule-health.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(heartbeat));tmp.chmod(0o600);os.replace(tmp,p);time.sleep(min(15,max(.1,(target-runtime.utc()).total_seconds())))
            phase=root/('schedule-'+kind.lower()+'-'+str(arm)+'.json')
            if phase.exists():continue  # Immutable completed phase; never reset or replay.
            try:
                if kind=='ACTION':
                    if (root/'account-global-hold.json').exists():result={'state':'ACCOUNT_GLOBAL_HOLD_READBACK_ONLY'}
                    elif runtime.utc()>=target+timedelta(seconds=60):result={'state':'MISSED_SELECTION_NO_MUTATION'}
                    else:result=manage.manage(root,plan,arm,grant,admission,admission_sha,execute=True)
                    if (result.get('accountGlobalStop') is True or any(x.get('scope')=='ACCOUNT' for x in result.get('outcomes',[]))) and not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',{'at':runtime.stamp(),'arm':arm,'reason':'ACCOUNT_OR_UNKNOWN_PLACEMENT_INVARIANT'})
                else:result=readback(root,('arm-'+arm) if arm else 'post-close')
            except Exception as error:
                result={'state':'MANAGEMENT_DELIVERY_FAILURE' if kind=='ACTION' else 'READBACK_FAILURE','reason':str(error),'noReplay':True}
                if isinstance(error,runtime.AccountStop) and not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',result)
            runtime.save(phase,result)
        runtime.save(root/('schedule-finished-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ')+'.json'),{'at':runtime.stamp(),'state':'TERMINAL_NO_FURTHER_MUTATIONS'})


def attempt_tree(path):
    path=Path(path)
    if not path.is_dir() or path.is_symlink():raise policy.Hold('PRIOR_ATTEMPT_MISSING_OR_SYMLINK')
    result={}
    for p in path.rglob('*'):
        if p.is_symlink():raise policy.Hold('HISTORICAL_SYMLINK')
        if p.is_file():result[str(p.relative_to(path))]=runtime.hashfile(p)
    return result

def wait_absence(symbol,cut,inventory,m,root):
    cid=runtime.new_identity(symbol,'ENTRY');folder=root/'entries'/symbol
    files=attempt_tree(folder) if folder.exists() else {}
    if any(Path(n).name.startswith('place-') or 'dispatch-claim' in Path(n).name for n in files):raise policy.Hold('CLAIMED_ATTEMPT_NEVER_REQUALIFY_OR_RESEND')
    runtime.new_native_identity_absent(m,cut,{'client_order_id':cid});runtime.claims_unchanged(inventory,root)
    for name in inventory['claimRoots']+[str(root)]:
        for p in Path(name).rglob('*claim*.json'):
            if p.is_file() and cid.encode() in p.read_bytes():raise policy.Hold('EXISTING_CLAIM_NO_REISSUE')
    return files

def requalify_once(root,grant,claims,admission,admission_sha):
    plan=json.loads((root/'plan.json').read_bytes());policy.validate_plan(plan);inventory=json.loads(Path(claims).read_bytes());m,_,_=components()
    freeze=json.loads((root/'freeze-receipt.json').read_bytes());catalog=Path(freeze['catalogRoot']);rows=[]
    for symbol in plan['boundedWaitRequalification']:runtime.authorize(grant,plan,inventory['account_id'],symbol,'WAIT_REQUALIFICATION')
    with (root/'batch.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        runtime.save(root/'wait-pass-claim.json',{'at':runtime.stamp(),'symbols':plan['boundedWaitRequalification'],'passes':1})
        for symbol in plan['boundedWaitRequalification']:
            if (root/'entries'/symbol/'place-dispatch-claim.json').exists():
                rows.append({'symbol':symbol,'state':'ACCEPTED_OR_UNCERTAIN_NO_REQUALIFICATION'});continue
            runtime.authorize(grant,plan,inventory['account_id'],symbol,'WAIT_REQUALIFICATION')
            proof=root/'wait-requalification'/symbol;reader=m.Reader(*m.load_credentials(),proof/'broker')
            with m.qualification_slot():
                cut=runtime.capture(m,reader,inventory['account_id'],proof,True);files=wait_absence(symbol,cut,inventory,m,root)
                archive=root/'exceptions/wait-requalification-01'/symbol
                if files:
                    archive.parent.mkdir(mode=0o700,parents=True,exist_ok=True);(root/'entries'/symbol).rename(archive)
                    if attempt_tree(archive)!=files:raise runtime.AccountStop('HISTORICAL_ARCHIVE_CHANGED')
                runtime.save(proof/'archive-receipt.json',{'at':runtime.stamp(),'files':files,'noDispatchProved':True})
            try:
                en,timing=runtime.execute_candidate(symbol,plan,catalog,root,grant,claims,admission,admission_sha);row={'symbol':symbol,'state':'ENTRY_FILLED_P50_ACCEPTED','metrics':timing}
            except Exception as error:
                claimed=any((root/k/symbol/'place-dispatch-claim.json').exists() for k in ('entries','p50'))
                row={'symbol':symbol,'state':'LOCAL_PENDING_WATCH' if isinstance(error,runtime.LocalPending) else 'READBACK_ONLY_NO_RESEND' if claimed else 'WAIT_REQUALIFIABLE','reason':str(error)}
                rows.append(row)
                if isinstance(error,runtime.AccountStop) or (claimed and not isinstance(error,runtime.LocalPending)):break
                continue
            rows.append(row)
            if files and attempt_tree(archive)!=files:raise runtime.AccountStop('HISTORICAL_ARCHIVE_CHANGED')
    runtime.save(root/'wait-requalification-summary.json',{'at':runtime.stamp(),'rows':rows,'passes':1});return rows

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('--action',choices=['inspect','execute-batch','requalify','schedule','readback'],default='inspect');p.add_argument('--prepared',type=Path);p.add_argument('--grant',type=Path);p.add_argument('--claims',type=Path);p.add_argument('--admission',type=Path);p.add_argument('--admission-sha');a=p.parse_args()
    runtime.configure_environment()
    if a.action=='inspect':print(json.dumps({'executionAuthorized':False,'plan':policy.VERSION,'next':'Reviewed source-bound I3 grant and fresh qualification required; inspect never submits'}))
    elif a.action=='execute-batch':print(json.dumps(batch(a.root,a.prepared,a.grant,a.claims,a.admission,a.admission_sha),indent=2))
    elif a.action=='requalify':print(json.dumps(requalify_once(a.root,a.grant,a.claims,a.admission,a.admission_sha),indent=2))
    elif a.action=='schedule':schedule(a.root,a.grant,a.admission,a.admission_sha)
    else:print(json.dumps(readback(a.root,'manual'),indent=2))
