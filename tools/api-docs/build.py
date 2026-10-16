#!/usr/bin/env python3
"""Pinned Redocly build with a derived public presentation and private provenance.
No server, CI framework or second authored API contract. Publication requires accepted identity.
"""
import argparse
import base64
import copy
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOOL = ROOT / 'tools/api-docs'
sys.path.insert(0, str(ROOT / 'scripts'))
from v2_oas import COMMON, Contracts

ALLOWLIST = {'index.html', 'LICENSES.txt'}
SECURITY_PROSE = re.compile(
    r'authenticat|authoriz|\bgrants?\b|\bpermissions?\b|credentials?|\bBearer\b|\bOAuth\b|'
    r'\busers\.admin\b|\bquote\.(?:read|acquire|force)\b|\baccount\.\w+\.\w+|'
    r'visibility binding|disclosure protections|'
    r'\b(?:read|write|administrator|acquisition) authority\b|expand authority|source scopes? deny', re.I)
INTERNAL_BLOCK = re.compile(r'<!-- internal-only:start -->.*?<!-- internal-only:end -->', re.S)


def public_description(text):
    text = INTERNAL_BLOCK.sub('', text)
    # Keep ordinary validation/cache/identity semantics when they share a sentence
    # with an internal security qualifier. Full original prose remains in OAS.
    text = re.sub(r' after authentication and (?:explicit|applicable) Account authorization', '', text, flags=re.I)
    text = re.sub(r' after (?:applicable )?authorization', '', text, flags=re.I)
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    return ' '.join(part for part in parts if not SECURITY_PROSE.search(part)).strip()


def public_projection(value, property_names=False):
    if isinstance(value, list):
        return [public_projection(item) for item in value]
    if not isinstance(value, dict):
        return value
    result = {}
    for key, item in value.items():
        if not property_names and key in {'security', 'securitySchemes', 'x-required-grants'}:
            continue
        if key == 'description' and isinstance(item, str) and not property_names:
            result[key] = public_description(item)
        else:
            result[key] = public_projection(item, key == 'properties')
    return result


# Principal-selected public boundary; authoritative source operations are retained.
EXCLUDED_PUBLIC = {
    ('get', '/v2/users'), ('get', '/v2/users/{userId}'),
    ('post', '/v2/position-acquisitions'), ('get', '/v2/market-evidence-subjects'),
}


def component_refs(value):
    if isinstance(value, list):
        for item in value: yield from component_refs(item)
    elif isinstance(value, dict):
        for key, item in value.items():
            if key == '$ref':
                if not item.startswith('#/components/'):
                    raise ValueError('Expected bundled local component reference: ' + item)
                parts = item.split('/')
                yield parts[2], parts[3].replace('~1', '/').replace('~0', '~')
            else: yield from component_refs(item)


def public_reference(spec):
    for method, path in EXCLUDED_PUBLIC:
        del spec['paths'][path][method]
        if not any(m in spec['paths'][path] for m in ('get', 'post', 'put', 'patch', 'delete', 'head', 'options')): del spec['paths'][path]
    spec['paths']['/v2/me']['get']['tags'] = ['Identity']
    used = {tag for path in spec['paths'].values() for method, op in path.items() if method in {'get', 'post'} for tag in op.get('tags', [])}
    spec['tags'] = [tag for tag in spec.get('tags', []) if tag['name'] in used]
    spec['tags'].append(dict(name='Identity', description='Current caller identity.'))
    for tag in spec['tags']:
        if tag['name'] == 'Positions': tag['description'] = 'Retained Position inspection.'

    # COTS schema titles only. Copy error presentation for non-Artifact views;
    # do not change the shared definitions still rendered by Artifact operations.
    schemas = spec['components']['schemas']; titled = {}
    for name, schema in list(schemas.items()):
        variants = schema.get('oneOf', [])
        if not variants or not all('const' in v.get('properties', {}).get('status', {}) for v in variants): continue
        clone = copy.deepcopy(schema)
        for variant in clone['oneOf']:
            fields = variant['properties']
            variant['title'] = str(fields['status']['const']) + ' — ' + fields['title']['const']
        titled['#/components/schemas/' + name] = '#/components/schemas/' + name + 'PublicLabels'
        schemas[name + 'PublicLabels'] = clone
    def redirect(value):
        if isinstance(value, list):
            for item in value: redirect(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                if key == '$ref' and item in titled: value[key] = titled[item]
                else: redirect(item)
    for name in titled.values(): redirect(schemas[name.rsplit('/', 1)[1]])
    for path, item in spec['paths'].items():
        if path.startswith('/v2/artifacts'): continue
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            for status, response in op['responses'].items():
                if '$ref' in response:
                    name = response['$ref'].rsplit('/', 1)[1]
                    clone = copy.deepcopy(spec['components']['responses'][name]); redirect(clone)
                    spec['components']['responses'][name + 'PublicLabels'] = clone
                    op['responses'][status] = {'$ref': '#/components/responses/' + name + 'PublicLabels'}
                else: redirect(response)
    op = spec['paths']['/v2/portfolio-capital-observations']['get']
    # Editorial grouping only: preserve every existing sentence/qualification.
    text = op['description']
    for sentence in ('One row per admitted Balances artifact;', 'This is a two-source composite,',
                     'Missing, malformed, ambiguous', 'ExportedAt has MINUTE precision',
                     'Duplicate timestamps retain', 'Coverage remains UNKNOWN.', 'Complete collection with'):
        text = text.replace(' ' + sentence, '\n\n' + sentence)
    op['description'] = text
    return spec


def run(*args):
    return subprocess.check_output(list(map(str, args)), cwd=ROOT, text=True).strip()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('output', nargs='?', default=str(TOOL / 'dist'))
    parser.add_argument('--publish', action='store_true', help='Require accepted preview identity; update publication metadata only')
    args = parser.parse_args()
    output = Path(args.output).resolve()
    site, private = output / 'site', output / 'private'
    site.mkdir(parents=True, exist_ok=True); private.mkdir(parents=True, exist_ok=True)
    if {p.name for p in site.iterdir()} - ALLOWLIST:
        raise ValueError('Refusing to overwrite a directory containing non-artifact files')
    package = json.loads((TOOL / 'package.json').read_text())
    if run('node', '--version') != 'v' + package['engines']['node'] or run('npm', '--version') != package['engines']['npm']:
        raise ValueError('Use the exact pinned Node/npm versions')
    contracts = Contracts(); contracts.validate_structure()
    cli = TOOL / 'node_modules/.bin/redocly'
    internal = private / 'bundled-internal.json'
    print(run(cli, 'bundle', ROOT / 'docs/contracts' / COMMON, '--output', internal,
              '--config', TOOL / 'redocly.yaml'))
    spec = json.loads(internal.read_text())
    public = public_reference(public_projection(copy.deepcopy(spec)))
    release = json.loads((TOOL / 'release.json').read_text())
    overview = (TOOL / 'overview.md').read_text().replace('2026-10-15', release['previewDate'])
    history = run('git', 'log', '-5', '--date=short', '--format=%ad — %s', '--', 'docs/contracts')
    public['info']['title'] = 'Wheelwright API v2'
    public['info']['description'] = overview + '\n# Recent contract changes\n\n' + '\n'.join(
        '- ' + line for line in history.splitlines() if not SECURITY_PROSE.search(line))
    public['info']['description'] = '\n'.join(line for line in public['info']['description'].splitlines()
                                             if not line.startswith('- **Select subjects:**'))
    # Avoid offering the authoritative OAS download through the public presentation.
    public.pop('externalDocs', None)
    projection = private / 'public-projection.json'
    projection.write_text(json.dumps(public, indent=2) + '\n')
    pruned = private / 'public-pruned.json'
    print(run(cli, 'bundle', projection, '--remove-unused-components', '--output', pruned, '--config', TOOL / 'redocly.yaml'))
    public = json.loads(pruned.read_text())
    projection.write_text(json.dumps(public, indent=2) + '\n')
    print(run(cli, 'lint', internal, '--config', TOOL / 'redocly.yaml'))
    print(run(cli, 'build-docs', projection, '--output', site / 'index.html',
              '--config', TOOL / 'redocly.yaml', '--disableGoogleFont',
              '--theme.openapi.hideSecuritySection=true', '--theme.openapi.hideDownloadButtons=true',
              '--theme.openapi.hideTryItPanel=true', '--theme.openapi.disableSearch=false',
              '--theme.openapi.expandResponses=200,401,403,404,422,500,503',
              '--theme.openapi.showExtensions=false'))
    html = (site / 'index.html').read_text()
    asset = TOOL / 'node_modules/redoc/bundles/redoc.standalone.js'
    sri = 'sha384-' + base64.b64encode(hashlib.sha384(asset.read_bytes()).digest()).decode()
    url = 'https://cdn.redocly.com/redoc/v2.5.4/bundles/redoc.standalone.js'
    if html.count(url) != 1 or sri not in html:
        raise ValueError('COTS renderer version/integrity differs from pinned local asset')
    # Package the exact integrity-checked COTS script inline. No custom browser
    # logic: this also permits native search from file:// without CORS or a server.
    tag = re.compile(r'<script[^>]+src="' + re.escape(url) + r'"[^>]*></script>')
    renderer = asset.read_text()
    logo_url = 'https://cdn.redoc.ly/redoc/logo-mini.svg'
    logo = (TOOL / 'redoc-logo.svg').read_bytes()
    if re.search(rb'<script|\bon\w+\s*=|(?:href|src)\s*=', logo, re.I) or renderer.count(logo_url) != 1:
        raise ValueError('Review changed COTS logo asset before packaging')
    renderer = renderer.replace(logo_url, 'data:image/svg+xml;base64,' + base64.b64encode(logo).decode())
    html, count = tag.subn(lambda _: '<script>' + renderer.replace('</script', '<\\/script') + '</script>', html)
    if count != 1:
        raise ValueError('Expected exactly one pinned renderer script')
    # The pinned CLI's prerendered markup produces React hydration mismatches for
    # this schema graph. Reuse Redoc's documented native initializer, with the same
    # embedded specification/options; no replacement rendering or search code.
    hydrate = 'Redoc.hydrate(__redoc_state, container);'
    if html.count(hydrate) != 1:
        raise ValueError('Unexpected COTS bootstrap; review before changing versions')
    options = dict(hideSecuritySection=True, hideDownloadButtons=True, hideTryItPanel=True,
                   disableSearch=False, showExtensions=False,
                   expandResponses='200,401,403,404,422,500,503')
    html = html.replace(hydrate, 'Redoc.init(__redoc_state.spec.data, ' + json.dumps(options) + ', container);')
    (site / 'index.html').write_text(html)
    licenses = [TOOL / 'node_modules/redoc/LICENSE', TOOL / 'node_modules/@redocly/cli/LICENSE',
                TOOL / 'node_modules/@redocly/cli/THIRD_PARTY_NOTICES']
    bundle_notice = asset.with_name(asset.name + '.LICENSE.txt')
    if bundle_notice.exists(): licenses.append(bundle_notice)
    (site / 'LICENSES.txt').write_text('\n\n'.join(p.read_text() for p in licenses))
    preview_hash = digest(site / 'index.html')
    if args.publish:
        subprocess.run(['git', 'merge-base', '--is-ancestor', release['acceptedSource'], 'HEAD'], cwd=ROOT, check=True)
        for name, expected in release['acceptedContractInputs'].items():
            if digest(ROOT / name) != expected:
                raise ValueError('Publication blocked: unaccepted contract input ' + name)
        if preview_hash != release['acceptedPreviewSha256'] or digest(site / 'LICENSES.txt') != release['acceptedLicensesSha256']:
            raise ValueError('Publication blocked: generated preview differs from accepted artifact; reconcile acceptance record first')
        date = release['publicationDate']
        if not isinstance(date, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            raise ValueError('Publication requires an explicit reproducible ISO date')
        marker = 'not published — local preview'
        if html.count(marker) != 3:
            raise ValueError('Publication metadata layout differs from accepted renderer')
        # Only the three native prerender/state copies of this label may change.
        (site / 'index.html').write_text(html.replace(marker, date))
        public['info']['description'] = public['info']['description'].replace(marker, date)
        projection.write_text(json.dumps(public, indent=2) + '\n')
    inputs = list((ROOT / 'docs/contracts').glob('api-v2-*')) + [ROOT / 'scripts/v2_oas.py']
    inputs += [p for p in TOOL.iterdir() if p.is_file()]
    manifest = dict(sourceCommit=run('git', 'rev-parse', 'HEAD'),
                    sourceDirty=bool(run('git', 'status', '--porcelain')), publication='PUBLICATION_CANDIDATE' if args.publish else 'NOT_PUBLISHED',
                    publicationDate=release['publicationDate'] if args.publish else None,
                    acceptedPreviewSha256=preview_hash, acceptedSource=release['acceptedSource'],
                    independentReview=('ACCEPTED_BASELINE; PRINCIPAL_SCOPED_CLEANUP' if release.get('principalCleanupSource') else 'ACCEPTED_PREVIEW') if args.publish else 'PENDING', node=run('node', '--version'), npm=run('npm', '--version'),
                    packages=package['devDependencies'], rendererAssetIntegrity=sri,
                    python=sys.version, packagedRendererSha256=hashlib.sha256(renderer.encode()).hexdigest(),
                    inputs={str(p.relative_to(ROOT)): digest(p) for p in sorted(inputs)},
                    publicFiles={p.name: digest(p) for p in sorted(site.iterdir())},
                    authoritativeBundleSha256=digest(internal), projectionSha256=digest(projection))
    (private / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Publication candidate:' if args.publish else 'Unpublished artifact:', site)


if __name__ == '__main__':
    main()
