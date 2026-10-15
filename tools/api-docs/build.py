#!/usr/bin/env python3
"""Pinned Redocly build with a derived public presentation and private provenance.
No server, CI framework or second authored API contract. Output is unpublished.
"""
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


def run(*args):
    return subprocess.check_output(list(map(str, args)), cwd=ROOT, text=True).strip()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else TOOL / 'dist'
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
    public = public_projection(copy.deepcopy(spec))
    release = json.loads((TOOL / 'release.json').read_text())
    overview = (TOOL / 'overview.md').read_text().replace('2026-10-15', release['previewDate'])
    if release['publicationDate'] is not None:
        raise ValueError('Step 2 must remain unpublished')
    history = run('git', 'log', '-5', '--date=short', '--format=%ad — %s', '--', 'docs/contracts')
    public['info']['title'] = 'Wheelwright API v2'
    public['info']['description'] = overview + '\n# Recent contract changes\n\n' + '\n'.join(
        '- ' + line for line in history.splitlines() if not SECURITY_PROSE.search(line))
    # Avoid offering the authoritative OAS download through the public presentation.
    public.pop('externalDocs', None)
    projection = private / 'public-projection.json'
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
    inputs = list((ROOT / 'docs/contracts').glob('api-v2-*')) + [ROOT / 'scripts/v2_oas.py']
    inputs += [p for p in TOOL.iterdir() if p.is_file()]
    manifest = dict(sourceCommit=run('git', 'rev-parse', 'HEAD'),
                    sourceDirty=bool(run('git', 'status', '--porcelain')), publication='NOT_PUBLISHED',
                    independentReview='PENDING', node=run('node', '--version'), npm=run('npm', '--version'),
                    packages=package['devDependencies'], rendererAssetIntegrity=sri,
                    python=sys.version, packagedRendererSha256=hashlib.sha256(renderer.encode()).hexdigest(),
                    inputs={str(p.relative_to(ROOT)): digest(p) for p in sorted(inputs)},
                    publicFiles={p.name: digest(p) for p in sorted(site.iterdir())},
                    authoritativeBundleSha256=digest(internal), projectionSha256=digest(projection))
    (private / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Unpublished artifact:', site)


if __name__ == '__main__':
    main()
