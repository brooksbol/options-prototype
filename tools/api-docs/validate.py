#!/usr/bin/env python3
"""Read-only agent reconstruction, example/coverage checks and publication-boundary checks.
This emits verification evidence, never an alternate agent contract or API invocation.
"""
import json
import re
import shlex
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from jsonschema import Draft202012Validator, FormatChecker

TOOL = Path(__file__).resolve().parent
ROOT = TOOL.parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from v2_oas import (COMMON, Contracts, implemented_v2_operations, normalized_route,
                    without_documentation)
from build import ALLOWLIST, SECURITY_PROSE, EXCLUDED_PUBLIC, component_refs, public_projection


def without_authorized_f6_delta(current, baseline, name):
    """Verify the exact Principal-authorized routing/grant additions, then compare all other wire fields.
    This is not permission to refresh the preserved b48 baseline or ignore arbitrary contract changes.
    """
    import copy
    value=copy.deepcopy(current)
    common='api-v2-direct-quote-acquisition-proposal.yaml'
    if name==common:
        expected=copy.deepcopy(baseline['components']['schemas']['HeldQuoteReadProblem'])
        expected['properties']['status']['enum'].append(405)
        expected['properties']['code']['enum'].append('METHOD_NOT_ALLOWED')
        expected['oneOf'].append({'type':'object','properties':{'status':{'const':405},'code':{'const':'METHOD_NOT_ALLOWED'},'title':{'const':'Method not allowed'},'type':{'const':'urn:wheelwright:problem:method_not_allowed'}}})
        assert without_documentation(value['components']['schemas'].pop('RoutingProblem'))==without_documentation(expected)
        expected_response={'headers':{'X-Request-Id':{'required':True,'schema':{'type':'string','format':'uuid'}},'Cache-Control':{'required':True,'schema':{'const':'private, no-store'}},'Allow':{'required':True,'schema':{'type':'string','minLength':1}}},'content':{'application/problem+json':{'schema':{'allOf':[{'$ref':'#/components/schemas/RoutingProblem'},{'type':'object','properties':{'status':{'const':405},'code':{'const':'METHOD_NOT_ALLOWED'}}}]}}}}
        assert without_documentation(value['components']['responses'].pop('MethodNotAllowed'))==expected_response
    for path,item in value['paths'].items():
        for method,op in item.items():
            if method not in {'get','post'}:continue
            assert op['responses'].pop('405')=={'$ref':('' if name==common else common)+'#/components/responses/MethodNotAllowed'}
            if name==common and path=='/v2/quotes' and method=='post':
                assert op.pop('x-required-grants')==['quote.acquire']
                assert op.pop('x-required-grants-when-force')==['quote.force']
            if path.startswith('/v2/market-observations'):
                assert op.pop('x-required-grants-for-account-scope')==['account.market.read:{accountId}']
    return value


def main():
    output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else TOOL / 'dist'
    contracts = Contracts(); contracts.validate_structure()
    operations = contracts.operations()
    assert implemented_v2_operations() == {(m, normalized_route(p)) for m, p in operations}
    report = []; examples = 0
    for name, current in contracts.documents.items():
        raw = subprocess.check_output(['git', 'show', 'b48e3c6fc36f9a7feb6abbf97cbacff5934d477e:docs/contracts/' + name], cwd=ROOT, text=True)
        import yaml
        baseline = json.loads(raw) if name.endswith('.json') else yaml.safe_load(raw)
        assert without_documentation(baseline) == without_documentation(without_authorized_f6_delta(current, baseline, name)), 'Wire contract changed: ' + name
    for (method, path), (op, item, name) in operations.items():
        assert op['operationId'] and op['tags'] and op['summary'] != op['operationId']
        assert op['security'] == [{'bearerAuth': []}]
        target = op['externalDocs']['url'].split('/blob/main/', 1)[1]
        assert (ROOT / target).is_file() and (ROOT / target).stat().st_size > 0
        params = item.get('parameters', []) + op.get('parameters', [])
        for parameter in params:
            if 'example' in parameter:
                contracts.validator(parameter['schema'], name).validate(parameter['example'])
        for content in op.get('requestBody', {}).get('content', {}).values():
            assert 'example' in content
            contracts.validator(content['schema'], name).validate(content['example']); examples += 1
        responses = {}
        for status in op['responses']:
            response, owner = contracts.response(method, path, status)
            responses[status] = dict(headers=response.get('headers', {}), content=response.get('content', {}))
            for media, content in response.get('content', {}).items():
                assert content.get('examples'), (method, path, status, media)
                for example in content['examples'].values():
                    contracts.validator(content['schema'], owner).validate(example['value']); examples += 1
                    if media == 'application/problem+json':
                        assert example['value']['status'] == int(status)
        code = op['x-codeSamples'][0]['source']
        assert 'https://api.example.invalid/v2/' in code and 'Authorization' not in code
        # Parse templates as data; never execute cURL or contact an API.
        words = shlex.split(code.replace('\\\n', ''))
        assert words[words.index('--request') + 1] == method
        uri = urlparse(next(word for word in words if word.startswith('https://')))
        values = {('query', key): value[0] for key, value in parse_qs(uri.query).items()}
        for expected, actual in zip(path.split('/'), uri.path.split('/')):
            if expected.startswith('{'): values[('path', expected[1:-1])] = actual
            else: assert expected == actual
        request_headers = {}
        for index, word in enumerate(words):
            if word == '--header':
                key, value = words[index + 1].split(':', 1)
                request_headers[key] = value.strip(); values[('header', key)] = value.strip()
        contracts.validate_parameters(method, path, values)
        if '--data-raw' in words:
            media = request_headers['Content-Type']; data = words[words.index('--data-raw') + 1]
            if media == 'application/json': data = json.loads(data)
            contracts.validator(op['requestBody']['content'][media]['schema'], name).validate(data)
        report.append(dict(method=method, path=path, operationId=op['operationId'],
                           source='docs/contracts/' + name, parameters=params,
                           requestBody=op.get('requestBody'), responses=responses,
                           security=op['security'], requiredGrants=op.get('x-required-grants', []),
                           conditionalRequiredGrants={key:value for key,value in op.items() if key.startswith('x-required-grants-')},
                           domainContract=target, semantics=op['description']))
    identifiers = [op['operationId'] for op in report]
    assert len(identifiers) == len(set(identifiers))
    by_id = {op['operationId']: op for op in report}
    assert 'never acquire' in by_id['listHeldDirectQuotes']['semantics']
    assert 'not fulfillment' in by_id['acquireDirectQuotes']['semantics']
    assert 'Lifetime coverage remains UNKNOWN' in by_id['readAccountTransactions']['semantics']
    assert 'collection-wide single-instant snapshot' in by_id['listHeldDirectQuotes']['semantics']
    entry = (ROOT / 'docs/api-v2/README.md').read_text()
    assert 'does not authorize an agent to invoke' in entry
    assert 'explicit grants' in entry and 'Administrator' in entry
    internal = json.loads((output / 'private/bundled-internal.json').read_text())
    public = json.loads((output / 'private/public-projection.json').read_text())
    assert internal['info']['version'] == public['info']['version']
    assert public['servers']==[{'url':'https://api.example.invalid','description':'Synthetic nonworking example origin; the runtime host is deployment-specific.'}]
    assert internal['components']['securitySchemes'] and 'securitySchemes' not in public['components']
    internal_ops = {(method, path) for path, item in internal['paths'].items() for method in item if method in {'get', 'post'}}
    public_ops = {(method, path) for path, item in public['paths'].items() for method in item if method in {'get', 'post'}}
    assert public_ops == internal_ops - EXCLUDED_PUBLIC
    assert len(internal_ops) == 36 and len(public_ops) == 32
    assert public['paths']['/v2/me']['get']['tags'] == ['Identity']
    assert not any(tag['name'] in {'Users', 'Market evidence'} for tag in public['tags'])
    # Independently check native Redocly pruning: every retained component reachable.
    reachable = set(); pending = list(component_refs(public['paths']))
    while pending:
        kind, name = pending.pop()
        if (kind, name) in reachable: continue
        reachable.add((kind, name)); pending.extend(component_refs(public['components'][kind][name]))
    assert reachable == {(kind, name) for kind, entries in public['components'].items() for name in entries}
    def expanded(value, spec, stack=(), strip_annotations=True):
        if isinstance(value, list): return [expanded(x, spec, stack, strip_annotations) for x in value]
        if not isinstance(value, dict): return value
        if '$ref' in value and value['$ref'] not in stack:
            ref = value['$ref']; target = spec
            for part in ref[2:].split('/'):
                target = target[part.replace('~1', '/').replace('~0', '~')]
            base = expanded(target, spec, stack + (ref,), strip_annotations)
            siblings = {k: v for k, v in value.items() if k != '$ref'}
            if strip_annotations: siblings = without_documentation(siblings); siblings.pop('title', None)
            return {'allOf': [base, expanded(siblings, spec, stack, strip_annotations)]} if siblings else base
        # Strip schema title annotations, preserving actual Problem.title property.
        result = {}
        for key, item in value.items():
            if strip_annotations and key == 'title' and isinstance(item, str): continue
            result[key] = expanded(item, spec, stack, strip_annotations)
        return result
    old_public = public_projection(__import__('copy').deepcopy(internal))
    for path, item in public['paths'].items():
        if path.startswith('/v2/artifacts'):
            import copy
            original_item=old_public['paths'][path];presented=copy.deepcopy(item)
            for method,operation in presented.items():
                if method not in {'get','post'}:continue
                appendix='\n\n### Synthetic cURL\n\n```text\n'+operation['x-codeSamples'][0]['source']+'\n```'
                assert operation['description']==original_item[method]['description']+appendix
                operation['description']=original_item[method]['description']
            assert expanded(presented, public, strip_annotations=False) == expanded(original_item, old_public, strip_annotations=False), 'Artifact documentation changed'
    capital = public['paths']['/v2/portfolio-capital-observations']['get']['description']
    capital=capital.split('\n\n### Synthetic cURL',1)[0]
    assert capital.split() == old_public['paths']['/v2/portfolio-capital-observations']['get']['description'].split()
    assert '\n\n' in capital
    def resolved(value):
        while '$ref' in value:
            reference = value['$ref']; assert reference.startswith('#/')
            value = internal
            for key in reference[2:].split('/'):
                value = value[key.replace('~1', '/').replace('~0', '~')]
        return value
    for item in internal['paths'].values():
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            for response in op['responses'].values():
                for content in resolved(response).get('content', {}).values():
                    validator = Draft202012Validator(dict(content['schema'], components=internal['components']),
                                                      format_checker=FormatChecker())
                    for example in content['examples'].values(): validator.validate(example['value'])
    # Regressions from Kiro's accepted black-box findings: public filtering must
    # preserve provenance/policy/format meaning, not just the wire constraints.
    provenance = public['components']['schemas']['QuoteProvenance']['properties']['authorityEpoch']
    assert 'opaque' in provenance['description'].lower() and 'fencing identifier' in provenance['description']
    assert 'not a timestamp' in provenance['description']
    quote = public['paths']['/v2/quotes']['post']['description']
    assert 'FORCE bypasses reuse, not provider-contact restrictions' in quote
    assert 'CONTACT_NOT_PERMITTED means policy prevented contact' in quote
    assert 'UPSTREAM_UNAVAILABLE means the upstream source is unavailable' in quote
    upload = public['paths']['/v2/artifacts']['post']['description']
    for meaning in ('POSITIONS', 'ACTIVITY', 'BALANCES', 'OPTION_SUMMARY',
                    'Account number; Account name; Investment type',
                    'Run Date; Action; Symbol; Amount ($)', 'Balance; Day change',
                    'Symbol; Strategy; Expiration & Strike; Quantity',
                    'Date downloaded MMM-dd-yyyy', 'History_for_Account_',
                    'Balances_for_Account_', 'Option Summary {broker-account}',
                    '422 before source retention', 'HTTP 200 with status REJECTED',
                    'prior admitted evidence remains intact'):
        assert meaning in upload, meaning
    public_ids = []
    for path, item in public['paths'].items():
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            public_ids.append(op['operationId'])
            assert 'security' not in op and not any(key.startswith('x-required-grants') for key in op)
            original = internal['paths'][path][method]
            expected = {k: v for k, v in original.items() if k != 'security' and not k.startswith('x-required-grants')}
            assert without_documentation(expanded(expected, internal)) == without_documentation(expanded(op, public)), (method, path, 'public wire schema changed')
    assert sorted(public_ids) == sorted(internal['paths'][path][method]['operationId'] for method, path in public_ops)
    # Validate every remaining public example against the actual pruned/titled schema.
    public_examples = 0
    for path, item in public['paths'].items():
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            for response in op['responses'].values():
                while '$ref' in response:
                    response = public['components']['responses'][response['$ref'].rsplit('/', 1)[1]]
                for content in response.get('content', {}).values():
                    validator = Draft202012Validator(dict(content['schema'], components=public['components']), format_checker=FormatChecker())
                    for example in content['examples'].values():
                        validator.validate(example['value']); public_examples += 1
    def descriptions(value):
        if isinstance(value, list):
            for item in value: descriptions(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                if key == 'description' and isinstance(item, str):
                    assert not SECURITY_PROSE.search(item), item
                descriptions(item)
    # The public introduction discusses HTTP errors without execution instructions.
    overview = public['info']['description']
    assert 'never sends API requests' in overview
    # Changelog scope regression: "Recent contract changes" is exactly the API v2
    # contract history, and history touching only other docs/contracts files (for
    # example the v1 snapshot contract) never appears.
    # Independent scope: tracked v2 contract files, not the generator's own
    # changelog pathspec (which would make this check self-confirming).
    release = json.loads((TOOL / 'release.json').read_text())
    v2_contracts = subprocess.check_output(['git','ls-files','docs/contracts/api-v2-*'],cwd=ROOT,text=True).splitlines()
    assert v2_contracts and all(Path(name).name.startswith('api-v2-') for name in v2_contracts)
    def git_lines(*args):
        return subprocess.check_output(['git', *args], cwd=ROOT, text=True).splitlines()
    listed = [line[2:] for line in overview.split('# Recent contract changes', 1)[1].splitlines() if line.startswith('- ')]
    expected = [line for line in git_lines('log', '-5', '--date=short', '--format=%ad — %s', '--', *v2_contracts)
                if not SECURITY_PROSE.search(line)]
    assert listed and listed == expected, 'Public changelog differs from API v2 contract history'
    v2_commits = set(git_lines('log', '--format=%H', '--', *v2_contracts))
    for commit in git_lines('log', '--format=%H', '--', 'docs/contracts'):
        if commit not in v2_commits:
            line = git_lines('log', '-1', '--date=short', '--format=%ad — %s', commit)[0]
            assert line not in listed, 'Unrelated docs/contracts history in public changelog: ' + commit
    descriptions(public)
    site = output / 'site'
    assert {p.name for p in site.iterdir()} == ALLOWLIST
    html = (site / 'index.html').read_text()
    assert not re.findall(r'<script[^>]+src=["\']https?://', html)
    assert not re.findall(r'<link[^>]+href=["\']https?://', html)
    assert 'https://fonts.googleapis.com' not in html
    # Check authored HTML rather than inert strings in the pinned vendor module.
    markup=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S|re.I)
    assert '<form' not in markup.lower() and 'type="password"' not in markup.lower()
    # Native browser checks enforce absent live forms/controls on every operation.
    state=re.search(r'const __redoc_state = (\{.*?\});(?=\s*var container)',html,re.S)
    assert state and json.loads(state.group(1))['spec']['data']==public, 'HTML does not embed the exact full public contract'
    manifest = json.loads((output / 'private/provenance.json').read_text())
    assert manifest['sourceCommit'] not in html
    assert str(ROOT) not in html, 'Local path leaked into generated HTML'
    for method, path in EXCLUDED_PUBLIC:
        assert path not in html and internal['paths'][path][method]['operationId'] not in html
    for filename, expected in manifest['publicFiles'].items():
        from build import digest
        assert digest(site / filename) == expected
    result = dict(mode='READ_ONLY_REPOSITORY_OAS_AND_LINKED_CONTRACTS', independentReview='PENDING',
                  operationCount=len(report), publicOperationCount=len(public_ops), publicOperationIds=public_ids, publicResponseExamples=public_examples, validatedExamples=examples, operations=report,
                  authorityBoundary='OAS availability and grants do not establish Principal/task execution permission.',
                  noNetworkOrOperationalMutation=True)
    (output / 'private/agent-specimen.json').write_text(json.dumps(result, indent=2) + '\n')
    print(f'PASS: internal {len(report)} operations/{examples} examples; public {len(public_ops)} operations/{public_examples} response examples; Artifact docs and wire/security preserved; pruning/allowlist')


if __name__ == '__main__':
    main()
