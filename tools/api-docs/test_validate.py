"""BUG-049 must not turn exact wire preservation into a blanket exception."""
import copy
import json
import subprocess
import unittest
from validate import ROOT, without_bug049_disclosure_delta

NAME = 'api-v2-account-evidence.json'

class DisclosureDeltaTest(unittest.TestCase):
    def setUp(self):
        self.baseline = json.loads(subprocess.check_output([
            'git', 'show', 'b48e3c6fc36f9a7feb6abbf97cbacff5934d477e:docs/contracts/' + NAME], cwd=ROOT))
        self.current = json.loads((ROOT / 'docs/contracts' / NAME).read_text())

    def test_number_free_projection_is_the_only_account_exception(self):
        restored = without_bug049_disclosure_delta(self.current, self.baseline, NAME)
        self.assertEqual(restored['components']['schemas']['Account'], self.baseline['components']['schemas']['Account'])
        self.assertEqual(restored['paths'], self.current['paths'])

    def test_reintroduced_number_or_unrelated_identity_changes_are_rejected(self):
        for mutation in ('number', 'identity', 'broker', 'extra'):
            value = copy.deepcopy(self.current)
            account = value['components']['schemas']['Account']
            association = account['properties']['brokerAssociation']
            if mutation == 'number':
                association['properties']['accountNumber'] = {'type': 'string'}
            elif mutation == 'identity':
                account['properties']['id']['pattern'] = '.*'
            elif mutation == 'broker':
                association['properties']['broker']['enum'].append('OTHER')
            else:
                association['additionalProperties'] = True
            with self.assertRaises(AssertionError):
                without_bug049_disclosure_delta(value, self.baseline, NAME)

if __name__ == '__main__':
    unittest.main()
