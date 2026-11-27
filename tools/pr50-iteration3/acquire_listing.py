"""Read-only orchestration of installed catalog and Greek readers; no order methods."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import select
import subprocess
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy
import runtime
runtime.configure_environment()
import time

sys.dont_write_bytecode = True
RELEASE = Path.home() / '.local/share/wheelwright/pr46/releases/20261116T145837Z-722d9bc31ff5'
sys.path.insert(0, str(RELEASE))
from webull_identity import load_credentials, HOST
from pr46_universe import Reader
from pr46_monday_support import validate_catalog

assert HOST == 'api.sandbox.webull.com'
SYMBOLS = 'SPY QQQ SPX NVDA VIX IWM AAPL SPCX TSLA MU IBIT AMD TLT MSFT SLS INTC EWZ XSP AMZN MSTR TQQQ SOXL SOFI XLF GLD GOOGL CRWV NFLX META IREN SMH PLTR SLV HOOD DRAM ORCL BABA NKE AVGO TSM NBIS SMCI HYG SNDK EEM UBER TGT NXPI KRE NOW GOOG BTDR'.split()
assert SYMBOLS==policy.ROSTER and len(SYMBOLS) == len(set(SYMBOLS)) == 52
EXPIRY = policy.EXPIRY.isoformat()
ROOT = Path(sys.argv[1]).resolve()
ROOT.mkdir(mode=0o700, parents=True, exist_ok=False)
KEY, SECRET = load_credentials()
PINS = json.loads((RELEASE / 'MONDAY-REUSE.json').read_text())['tastytrade_credential_module_graph']
assert PINS and all(hashlib.sha256(Path(p).read_bytes()).hexdigest() == h for p, h in PINS.items())
worker = None
results = []


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def save(path, obj):
    raw = (json.dumps(obj, indent=2, allow_nan=False) + '\n').encode()
    with path.open('xb') as f:
        f.write(raw)
    path.chmod(0o600)
    return hashlib.sha256(raw).hexdigest()


def greeks(symbol, folder):
    global worker
    if worker is None:
        worker = subprocess.Popen(['node', str(RELEASE / 'pr46_monday_greek_worker.mjs'), str(Path.home() / 'kiro/options/scripts/tastytrade.mjs')], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
    q = {'symbol': symbol, 'expiration': EXPIRY, 'right': 'PUT'}
    save(folder / 'greek-request.json', {'request': q, 'started_at': now(), 'source': 'Installed Tastytrade metadata/DXLink Greek worker; not broker fill evidence'})
    worker.stdin.write(json.dumps(q) + '\n')
    worker.stdin.flush()
    if not select.select([worker.stdout], [], [], 90)[0]:
        worker.terminate()
        worker.wait(timeout=5)
        worker = None
        raise ValueError('GREEK_WORKER_TIMEOUT')
    line = worker.stdout.readline()
    if not line:
        worker = None
        raise ValueError('GREEK_WORKER_ENDED')
    raw = line.encode()
    with (folder / 'greek-worker-result.json').open('xb') as f:
        f.write(raw)
    (folder / 'greek-worker-result.json').chmod(0o600)
    return json.loads(line), hashlib.sha256(raw).hexdigest()


save(ROOT / 'request.json', {'symbols_literal': SYMBOLS, 'expiry': EXPIRY, 'short_target_delta': -0.30, 'long_target_delta': -0.20, 'fresh_delta_max_age_seconds': 300, 'standing': 'READ_ONLY_PREPARATION_NOT_ORDER_OR_QUOTE_QUALIFICATION', 'started_at': now()})
order = ['SPY', 'QQQ', 'NVDA', 'IWM'] + [s for s in SYMBOLS if s not in {'SPY', 'QQQ', 'NVDA', 'IWM'}]
try:
    for symbol in order:
        folder = ROOT / symbol
        folder.mkdir(mode=0o700)
        result = {'symbol': symbol, 'expiry': EXPIRY, 'started_at': now(), 'status': 'WAIT', 'orders_authorized': False}
        try:
            reader = Reader(KEY, SECRET, folder / 'webull')
            catalog = reader.put_contracts(symbol, EXPIRY, EXPIRY)
            raw = catalog['data']
            result.update(raw_contract_count=len(raw), complete_catalog_query=catalog['complete_for_query'], listed_expiries=sorted({r.get('expiration_date', '') for r in raw}))
            if symbol in {'SPX', 'XSP', 'VIX'}:
                result['reason'] = 'INDEX_SETTLEMENT_NOT_SUPPORTED_BY_REUSED_PHYSICAL_100_SHARE_PIPELINE'
            elif not raw:
                result['reason'] = 'NO_EXACT_TARGET_EXPIRY_WEBULL_PUT_LISTINGS'
            else:
                contracts = validate_catalog(raw, symbol, 'PUT')
                if any(c.get('expiration_date') != EXPIRY for c in contracts):
                    raise ValueError('CATALOG_EXPIRY_MISMATCH')
                save(folder / 'validated-catalog.json', contracts)
                result['supported_contract_count'] = len(contracts)
                if not contracts:
                    result['reason'] = 'NO_SUPPORTED_STANDARD_PHYSICAL_CONTRACTS'
                else:
                    greek, sha = greeks(symbol, folder)
                    result.update(greek_capture_sha256=sha, greek_receipt=greek.get('receipt_utc'), greek_request_counts=greek.get('requests'))
                    if greek.get('error'):
                        result['reason'] = 'GREEK_SOURCE_UNAVAILABLE'
                    else:
                        clock = time.time()
                        fresh = {}
                        duplicates = set()
                        for row in greek.get('greeks', []):
                            name = ''.join(str(row.get('symbol', '')).split())
                            delta, stamp = row.get('delta'), row.get('updatedAt')
                            if name in fresh:
                                duplicates.add(name)
                            if type(delta) not in (int, float) or type(stamp) not in (int, float):
                                continue
                            age = clock - stamp / 1000
                            if 0 <= age <= 300 and -1 <= delta < 0:
                                fresh[name] = {'delta': delta, 'updatedAt': stamp, 'age_seconds_at_selection': age}
                        if duplicates:
                            raise ValueError('DUPLICATE_GREEK_IDENTITY')
                        pool = [(c, fresh[c['symbol']]) for c in contracts if c['symbol'] in fresh]
                        result.update(greek_events=len(greek.get('greeks', [])), fresh_supported_contract_count=len(pool), missing_or_stale_contract_count=len(contracts) - len(pool), selected_at=now(), selection_scope='NEAREST_AMONG_FRESH_OBSERVED_WEBULL_LISTED_CONTRACTS; no global-nearest claim for missing Greeks')
                        if not pool:
                            result['reason'] = 'NO_FRESH_MATCHED_NEGATIVE_PUT_DELTA'
                        else:
                            def nearest(target):
                                best = min(abs(g['delta'] - target) for c, g in pool)
                                tied = [(c, g) for c, g in pool if abs(abs(g['delta'] - target) - best) < 1e-12]
                                if len(tied) != 1:
                                    raise ValueError('NEAREST_DELTA_TIE')
                                c, g = tied[0]
                                return {'contract': c, 'greek': g, 'target_delta': target, 'absolute_delta_distance': best}
                            short, long = nearest(-0.30), nearest(-0.20)
                            result.update(short=short, long=long)
                            if short['contract']['instrument_id'] == long['contract']['instrument_id'] or float(long['contract']['strike_price']) >= float(short['contract']['strike_price']):
                                result['reason'] = 'DISTINCT_LOWER_LONG_STRIKE_NOT_ESTABLISHED'
                            else:
                                result.update(status='CANDIDATE_REQUIRES_CURRENT_QUOTES_ACCOUNT_AND_OWNERSHIP_CHECK', reason='NO_ORDER_OR_EXECUTABLE_CREDIT_CLAIM', quantity_each_leg=1)
        except Exception as error:
            result.update(status='WAIT', reason=str(error) if str(error).isupper() and len(str(error)) < 100 else type(error).__name__ + '_SOURCE_OR_VALIDATION_UNAVAILABLE')
            # A request-level auth/rate failure stops the pass rather than retrying every root.
            stop = 'HTTP 429' in str(error) or 'HTTP 401' in str(error) or 'HTTP 403' in str(error)
            result['stop_shared_source_failure'] = stop
        result['finished_at'] = now()
        result['result_sha256'] = save(folder / 'result.json', result)
        results.append(result)
        with (ROOT / 'progress.jsonl').open('a') as f:
            f.write(json.dumps({k: result.get(k) for k in ['symbol', 'status', 'reason', 'raw_contract_count', 'supported_contract_count', 'fresh_supported_contract_count', 'missing_or_stale_contract_count', 'finished_at', 'result_sha256']}) + '\n')
        (ROOT / 'progress.jsonl').chmod(0o600)
        print(json.dumps({k: result.get(k) for k in ['symbol', 'status', 'reason', 'raw_contract_count', 'fresh_supported_contract_count', 'finished_at']}), flush=True)
        if result.get('stop_shared_source_failure'):
            break
finally:
    if worker is not None:
        worker.stdin.close()
        try:
            worker.wait(timeout=5)
        except subprocess.TimeoutExpired:
            worker.terminate()
            worker.wait(timeout=5)
    attempted = {r['symbol'] for r in results}
    for symbol in SYMBOLS:
        if symbol not in attempted:
            results.append({'symbol': symbol, 'expiry': EXPIRY, 'status': 'NOT_ATTEMPTED', 'reason': 'PASS_STOPPED', 'orders_authorized': False})
    save(ROOT / 'results.json', {'finished_at': now(), 'rows': results, 'original_order': SYMBOLS, 'source_calls_are_read_only': True, 'orders_submitted': 0})
    manifest = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.rglob('*') if p.is_file()}
    save(ROOT / 'manifest.json', manifest)
