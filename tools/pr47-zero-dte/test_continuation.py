import unittest
from copy import deepcopy
from continuation import check
from execute import initialize,r
from model import Blocked
from prepare import session_symbols

class Tests(unittest.TestCase):
    def batches(self):
        first=list(r.COHORT);rest=['ZZ'+chr(65+i//26)+chr(65+i%26) for i in range(41)]
        return dict(nov13=first,nov20=rest,universe=first+rest)
    def test_remaining41_only_and_active_session_required(self):
        batches=self.batches();state=initialize(batches);receipt=check(state,batches)
        self.assertEqual(receipt['batch_size'],41);self.assertTrue(receipt['requires_active_agent_session']);self.assertFalse(receipt['unattended_order_execution_installed'])
        self.assertEqual(session_symbols(batches['universe'],batches['nov13'],'2026-11-20'),batches['nov20'])
        self.assertEqual(len(session_symbols(batches['universe'],batches['nov13'],'2026-11-13')),69)
    def test_original_treatment_cannot_change_assigned_day_or_identity(self):
        batches=self.batches();original=initialize(batches)
        for field,value in [('execution_date','2026-11-20'),('client_order_id','new identity')]:
            state=deepcopy(original);state['treatments'][batches['nov13'][0]][field]=value
            with self.assertRaises(Blocked):check(state,batches)

if __name__=='__main__':unittest.main()
