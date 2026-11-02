"""BUG-049 must not turn exact wire preservation into a blanket exception."""
import copy
import json
import subprocess
import unittest
import tempfile
import shutil
import os
import sys
from pathlib import Path
from unittest.mock import patch
from validate import (ROOT, TOOL, Contracts, assert_bundle_fidelity,
                      assert_public_operation_scope, EXCLUDED_PUBLIC,
                      without_bug049_disclosure_delta)

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

class DocumentationFidelityTest(unittest.TestCase):
    """Uses the actual generated preview and unchanged validator, not a second contract."""
    @classmethod
    def setUpClass(cls):
        cls.output = Path(os.environ.get('WW_DOCS_TEST_OUTPUT', TOOL / 'dist'))
        cls.bundle = json.loads((cls.output / 'private/bundled-internal.json').read_text())
        cls.contracts = Contracts()

    def test_current_bundle_and_inherited_liquidity_error(self):
        assert_bundle_fidelity(self.contracts, self.bundle)
        self.contracts.validate_response('GET', '/v2/quotes/{symbol}/liquidity', 405,
            dict(type='urn:wheelwright:problem:method_not_allowed', title='Method not allowed',
                 status=405, code='METHOD_NOT_ALLOWED', requestId='11111111-1111-4111-8111-111111111111'),
            {'Content-Type': 'application/problem+json', 'X-Request-Id': '11111111-1111-4111-8111-111111111111',
             'Cache-Control': 'private, no-store', 'Allow': 'GET, HEAD, OPTIONS'})

    def test_wire_mutations_cannot_hide_behind_valid_examples(self):
        for change in ('security', 'price', 'identity', 'reference', 'operation', 'error_header'):
            value = copy.deepcopy(self.bundle)
            if change == 'security': value['paths']['/v2/quotes']['post']['security'] = []
            elif change == 'price': value['components']['schemas']['QuoteFacts']['properties']['bid'] = {'type': 'string'}
            elif change == 'identity': value['components']['schemas']['Account']['properties']['id']['pattern'] = '.*'
            elif change == 'reference': value['paths']['/v2/quotes/{symbol}']['get']['responses']['200']['content']['application/json']['schema'] = {'$ref': '#/components/schemas/Account'}
            elif change == 'operation': del value['paths']['/v2/quotes/{symbol}/liquidity']
            else: value['paths']['/v2/quotes/{symbol}/liquidity']['get']['responses']['405'] = {'description': 'wrong', 'headers': {}}
            with self.subTest(change=change), self.assertRaises(AssertionError):
                assert_bundle_fidelity(self.contracts, value)

    def test_public_exclusion_identity_and_membership_remain_exact(self):
        operations = {(m.lower(), p) for m, p in self.contracts.operations()}
        public = operations - EXCLUDED_PUBLIC
        assert_public_operation_scope(operations, public)
        for wrong in (operations, public - {next(iter(public))}, public | {('get', '/v2/invented')}):
            with self.assertRaises(AssertionError): assert_public_operation_scope(operations, wrong)

    def test_actual_validator_rejects_disconnected_source_to_bundle_boundary(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'preview'
            shutil.copytree(self.output, output)
            path = output / 'private/bundled-internal.json'
            value = json.loads(path.read_text())
            value['paths']['/v2/quotes']['post']['security'] = []
            path.write_text(json.dumps(value))
            result = subprocess.run([sys.executable, str(TOOL / 'validate.py'), str(output)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0, 'Disconnected validation accepted tampered internal security')
            self.assertIn('Bundled wire', result.stderr)

    def test_actual_publication_rejects_unaccepted_input(self):
        # Exercise the real builder/guard with a forged acceptance digest in a disposable tool copy.
        import build
        with tempfile.TemporaryDirectory() as directory:
            tool = Path(directory) / 'tool'; tool.mkdir()
            for path in TOOL.iterdir():
                if path.is_file(): shutil.copy2(path, tool / path.name)
            (tool / 'node_modules').symlink_to(TOOL / 'node_modules', target_is_directory=True)
            release = json.loads((tool / 'release.json').read_text())
            name = 'docs/contracts/api-v2-account-evidence.json'
            release['acceptedContractInputs'][name] = '0' * 64
            (tool / 'release.json').write_text(json.dumps(release))
            with patch.object(build, 'TOOL', tool), patch.object(sys, 'argv', ['build.py', str(Path(directory) / 'out'), '--publish']):
                with self.assertRaisesRegex(ValueError, 'Publication blocked: unaccepted contract input ' + name):
                    build.main()


if __name__ == '__main__':
    unittest.main()
