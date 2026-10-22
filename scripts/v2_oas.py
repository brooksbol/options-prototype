"""Local-only v2 OAS resolution and HTTP conformance helpers (engineering only)."""
import copy
import json
import re
import subprocess
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

ROOT = Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / 'docs/contracts'
COMMON = 'api-v2-direct-quote-acquisition-proposal.yaml'
ACCOUNT = 'api-v2-account-evidence.json'
SELECTION = 'api-v2-market-evidence-subjects.json'
FOUNDATION = 'api-v2-foundational-portfolio.json'
METHODS = {'get', 'post', 'put', 'patch', 'delete', 'head', 'options'}


def without_documentation(value, property_names=False):
    """Compare wire constraints while allowing descriptions and synthetic examples.

    Preserve literal property names such as `description` inside schema properties.
    """
    annotations = {'description', 'summary', 'example', 'examples', 'tags', 'externalDocs', 'x-codeSamples'}
    # Historical YAML flow-map descriptions split at unquoted commas. These exact
    # null keys are prose fragments, corrected by quoting in the documentation build.
    prose_fragments = {'RFC 3339 UTC when known.', 'if supplied.', 'not Wheelwright-derived.',
                       'e.g. tradier.', 'RFC 3339 UTC.'}
    if isinstance(value, list):
        return [without_documentation(item) for item in value]
    if not isinstance(value, dict):
        return value
    return {key: without_documentation(item, key == 'properties')
            for key, item in value.items()
            if property_names or (key not in annotations and not (key in prose_fragments and item is None))}


class Contracts:
    def __init__(self):
        self.documents = {}
        for name in (COMMON, ACCOUNT, SELECTION, FOUNDATION):
            raw = (CONTRACTS / name).read_text()
            self.documents[name] = json.loads(raw) if name.endswith('.json') else yaml.safe_load(raw)
        self.registry = Registry().with_resources(
            ((CONTRACTS / name).as_uri(), Resource.from_contents(
                self.absolute(doc, name), default_specification=DRAFT202012))
            for name, doc in self.documents.items())

    def absolute(self, value, name):
        if isinstance(value, list):
            return [self.absolute(item, name) for item in value]
        if not isinstance(value, dict):
            return value
        result = {key: self.absolute(item, name) for key, item in value.items()}
        if '$ref' in result:
            filename, fragment = result['$ref'].split('#', 1)
            target = filename or name
            if target not in self.documents:
                raise ValueError('Only the declared local v2 contracts may be referenced')
            result['$ref'] = (CONTRACTS / target).as_uri() + '#' + fragment
        return result

    def resolve(self, value, name):
        while '$ref' in value:
            filename, fragment = value['$ref'].split('#', 1)
            name = filename or name
            value = self.documents[name]
            for part in fragment.lstrip('/').split('/'):
                value = value[part.replace('~1', '/').replace('~0', '~')]
        return value, name

    def operations(self):
        result = {}
        for path, item in self.documents[COMMON]['paths'].items():
            item, name = self.resolve(item, COMMON)
            for method in METHODS.intersection(item):
                result[(method.upper(), path)] = (item[method], item, name)
        return result

    def validator(self, schema, name):
        return Draft202012Validator(self.absolute(schema, name), registry=self.registry,
                                    format_checker=FormatChecker())

    def validate_structure(self):
        for name, doc in self.documents.items():
            validate(self.absolute(doc, name))
            # Walk every local reference, including ones not reached by a specimen.
            def walk(value):
                if isinstance(value, dict):
                    if '$ref' in value:
                        self.resolve(value, name)
                    for item in value.values():
                        walk(item)
                elif isinstance(value, list):
                    for item in value:
                        walk(item)
            walk(doc)

    def response(self, method, path, status):
        op, _, name = self.operations()[(method.upper(), path)]
        return self.resolve(op['responses'][str(status)], name)

    def validate_response(self, method, path, status, payload, headers=None, media=None):
        response, name = self.response(method, path, status)
        media = media or ('application/problem+json' if status >= 400 else 'application/json')
        self.validator(response['content'][media]['schema'], name).validate(payload)
        if headers is not None:
            headers = {key.lower(): value for key, value in headers.items()}
            actual_media = headers.get('content-type', '').split(';', 1)[0].strip()
            if actual_media != media:
                raise ValueError('HTTP Content-Type disagrees with selected response')
            for key, definition in response.get('headers', {}).items():
                value = headers.get(key.lower())
                if value is None:
                    if definition.get('required'):
                        raise ValueError('Missing required response header: ' + key)
                else:
                    self.validator(definition['schema'], name).validate(value)
            if isinstance(payload, dict) and 'requestId' in payload:
                if payload['requestId'] != headers.get('x-request-id'):
                    raise ValueError('Header/body requestId disagree')

    def validate_parameters(self, method, path, values):
        op, item, name = self.operations()[(method.upper(), path)]
        parameters = {(p['in'], p['name'].lower() if p['in'] == 'header' else p['name']): p
                      for p in item.get('parameters', []) + op.get('parameters', [])}
        values = {(location, key.lower() if location == 'header' else key): value
                  for (location, key), value in values.items()}
        for key, parameter in parameters.items():
            if key not in values:
                if parameter.get('required'):
                    raise ValueError('Missing required parameter: ' + key[1])
            else:
                self.validator(parameter['schema'], name).validate(values[key])


def normalized_route(path):
    return re.sub(r'\{[^}]+\}', '{}', path)


def implemented_v2_operations():
    """Inventory annotations in production source independently of OAS and CLI."""
    result = set()
    for path in (ROOT / 'evidence-service-java/src/main/java').rglob('*.java'):
        source = re.sub(r'/\*.*?\*/|//[^\n]*', '', path.read_text(), flags=re.S)
        if '@RestController' not in source:
            continue
        prefix = source.split('class ', 1)[0]
        base = re.search(r'@RequestMapping\(\s*"([^"]+)"\s*\)', prefix)
        base = base.group(1) if base else ''
        for mapping in re.finditer(r'@(Get|Post|Put|Patch|Delete|Head|Options)Mapping\b(?:\s*\((.*?)\))?', source, re.S):
            routes = re.findall(r'"([^"]+)"', mapping.group(2) or '') or ['']
            for route in routes:
                route = base + route
                if route.startswith('/v2/'):
                    key = (mapping.group(1).upper(), normalized_route(route))
                    if key in result:
                        raise ValueError('Duplicate mapped v2 operation: ' + str(key))
                    result.add(key)
    return result


def assert_preserved_quote_contract(contracts):
    """Preserve quote meaning; allow only the explicit Step1 and F6 routing/grant deltas."""
    old = yaml.safe_load(subprocess.check_output(
        ['git', 'show', '8914658:' + str(Path('docs/contracts') / COMMON)], cwd=ROOT, text=True))
    current = contracts.documents[COMMON]
    for method in ('get', 'post'):
        before, after = (copy.deepcopy(doc['paths']['/v2/quotes'][method]) for doc in (old, current))
        assert after['responses'].pop('405') == {'$ref':'#/components/responses/MethodNotAllowed'}
        if method == 'post':
            assert after.pop('x-required-grants') == ['quote.acquire']
            assert after.pop('x-required-grants-when-force') == ['quote.force']
            for op in (before, after):
                op['responses'] = {'200': op['responses']['200']}
            # The controller already accepts blank/padded correlation UUIDs.
            # Only that header's schema/description may differ from the baseline.
            for key in ('schema', 'description'):
                after['parameters'][0][key] = before['parameters'][0][key]
        assert without_documentation(before) == without_documentation(after), 'Quote request/success/read contract changed'
    held=copy.deepcopy(current['paths']['/v2/quotes/{symbol}'])
    assert held['get']['responses'].pop('405') == {'$ref':'#/components/responses/MethodNotAllowed'}
    assert without_documentation(old['paths']['/v2/quotes/{symbol}']) == without_documentation(held)
    for name, schema in old['components']['schemas'].items():
        if name != 'Problem':
            assert without_documentation(schema) == without_documentation(current['components']['schemas'][name]), name
