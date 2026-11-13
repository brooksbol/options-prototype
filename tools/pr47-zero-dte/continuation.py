"""Verify local November20 enrollment and print active-session recovery steps.

No provider, brokerage or order calls occur here. No unattended sender installed.
"""
from collections import Counter
import json
from pathlib import Path
import sys
from execute import validate_state
from model import Blocked
from prepare import ROOT,r

def check(state,batches):
    validate_state(state,batches)
    future=[x for x in state['treatments'].values() if x['execution_date']=='2026-11-20']
    if len(future)!=41 or {x['symbol'] for x in future}!=set(batches['nov20']):raise Blocked('Continuation not exactly original remaining41')
    if set(batches['nov13'])&{x['symbol'] for x in future}:raise Blocked('Original first28 re-enrolled')
    return dict(target='2026-11-20T12:00:00-05:00',batch_size=41,requires_active_agent_session=True,
        unattended_order_execution_installed=False,original_nov13_dispositions=dict(Counter(x['disposition'] for x in state['treatments'].values() if x['execution_date']=='2026-11-13')),
        recover_from=str(ROOT),actions=[
            'Recover current repo/Portfolio authority and private original69 state; verify the exact GRA5 exception and reviewed source.',
            'Reconcile every original claimed order, all positions, obligations, working/uncertain orders, assignment/share/cash evidence; preserve unresolved lifecycle reserves.',
            'Run prepare.py on actual November20; it acquires fresh Greeks only for original remaining41 and does not query expired November13 contracts.',
            'Refresh whole-basket cash and obligations; no margin borrowing or assumed release of cash held in assigned shares.',
            'At/after noon Eastern and before close, run execute.py execute --reviewed-execution; original claims are always skipped.',
            'Continue read-only observation through expiration, assignment, share delivery and cash/economics reconciliation; do not equate submissions with acquisitions.'])

def main():
    report=check(json.loads((ROOT/'state.json').read_text()),json.loads((ROOT/'calendar-batches.json').read_text()))
    report['verified_at']=r.now().isoformat();r.atomic(ROOT/'nov20-continuation.json',report);print(json.dumps(report,indent=2))

if __name__=='__main__':main()
