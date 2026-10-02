#!/usr/bin/env python3
"""Offline ETF evidence view over the frozen Pass -1 archive; no provider calls."""
import collections
import csv
import datetime as dt
import gzip
import hashlib
import io
import json
import re
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ARCHIVE = HERE.parent / 'pass-minus-one-v0-2026-09-30' / 'evidence.tar.gz'
EXPECTED_ARCHIVE_SHA256 = '1a43983917a7e2b2f96f291afe2c8a7859042e5ec12b9a3ad6630374d8694e25'
OCC_ETF_NAME = re.compile(r'\bETF\b|EXCHANGE.TRADED FUND', re.I)
SUFFIX = re.compile(r'\d{6}[CP]\d{8}\Z')
AS_OF = dt.date(2026, 10, 1)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def csv_bytes(rows, fields):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode()


assert sha256(ARCHIVE.read_bytes()) == EXPECTED_ARCHIVE_SHA256
with tarfile.open(ARCHIVE, 'r:gz') as archive:
    def read(name):
        return archive.extractfile(name).read()

    declared = json.loads(read('declared-population.json'))
    underlyings = {r['occ_underlying_symbol']: r for r in map(json.loads, read('analysis/underlyings.jsonl').splitlines())}
    classes = list(map(json.loads, read('analysis/classes.jsonl').splitlines()))
    assert len(declared['underlyings']) == len(underlyings) == 6072
    assert len(classes) == 6381
    assert declared['denominators'] == {'underlyings': 6072, 'ordinary_option_class_rows': 6381}

    population = []
    tier_by_symbol = {}
    for row in declared['underlyings']:
        symbol = row['occ_underlying_symbol']
        types = sorted({r['symbol_type'] for r in row['cboe_underlying_records']})
        has_occ_etf_name = any(OCC_ETF_NAME.search(c['name']) for c in row['occ_classes'])
        if types == ['ETF']:
            tier = 'CBOE_ETF'
        elif not types and has_occ_etf_name:
            tier = 'OCC_ETF_NAME_CBOE_ABSENT'
        elif not types:
            tier = 'CBOE_ABSENT_UNCLASSIFIED'
        else:
            tier = 'CBOE_OTHER_TYPE'
        tier_by_symbol[symbol] = tier
        provider = underlyings[symbol]
        population.append({
            'occ_underlying': symbol,
            'product_evidence_tier': tier,
            'cboe_symbol_types': '|'.join(types),
            'cboe_company_names': '|'.join(sorted({r['company'] for r in row['cboe_underlying_records']})),
            'cboe_settlement_styles': '|'.join(sorted({r['settlement_style'] for r in row['cboe_underlying_records']})),
            'cboe_markets': '|'.join(sorted({r['market'] for r in row['cboe_underlying_records']})),
            'occ_name_explicit_etf': str(bool(has_occ_etf_name)).lower(),
            'occ_class_symbols': '|'.join(c['option_class_symbol'] for c in row['occ_classes']),
            'occ_names': '|'.join(c['name'] for c in row['occ_classes']),
            'provider_underlying_state': provider['provider_underlying_state'],
            'observed_provider_roots': '|'.join(provider['provider_roots']),
            'lookup_contract_strings_all_roots': provider['provider_contract_count'],
            'lookup_received_at_utc': provider['received_at_utc'],
            'lookup_raw_sha256': provider['raw_sha256'],
        })

    selected = {'CBOE_ETF', 'OCC_ETF_NAME_CBOE_ABSENT'}
    selected_symbols = {r['occ_underlying'] for r in population if r['product_evidence_tier'] in selected}
    classes_by_symbol = collections.defaultdict(list)
    for row in classes:
        if row['occ_underlying_symbol'] in selected_symbols:
            classes_by_symbol[row['occ_underlying_symbol']].append(row)

    class_rows = []
    for symbol in sorted(selected_symbols):
        provider = underlyings[symbol]
        raw = gzip.decompress(read('full/' + provider['raw_gzip']))
        assert sha256(raw) == provider['raw_sha256'], symbol
        body = json.loads(raw)
        groups = {g['rootSymbol']: g['options'] for g in (body.get('symbols') or [])}
        for row in classes_by_symbol[symbol]:
            root = row['occ_option_class_symbol']
            options = groups.get(root)
            expiries = collections.defaultdict(lambda: {'P': set(), 'C': set()})
            put_count = call_count = 0
            if options is not None:
                for option in options:
                    assert option.startswith(root), (symbol, root, option)
                    suffix = option[len(root):]
                    assert SUFFIX.fullmatch(suffix), (symbol, root, option)
                    year = 2000 + int(suffix[:2])
                    expiry = dt.date(year, int(suffix[2:4]), int(suffix[4:6]))
                    right = suffix[6]
                    strike_mills = int(suffix[7:])
                    expiries[expiry][right].add(strike_mills)
                    if right == 'P':
                        put_count += 1
                    else:
                        call_count += 1
            dates = sorted(expiries)
            class_rows.append({
                'occ_underlying': symbol,
                'occ_class': root,
                'product_evidence_tier': tier_by_symbol[symbol],
                'occ_product_type': row['occ_product_type'],
                'occ_class_form': row['occ_class_form'],
                'provider_class_state': row['provider_class_state'],
                'exact_root_in_lookup': str(options is not None).lower(),
                'put_contract_strings': put_count,
                'call_contract_strings': call_count,
                'expiration_count': len(dates),
                'put_expiration_count': sum(bool(v['P']) for v in expiries.values()),
                'put_pair_expiration_count': sum(len(v['P']) >= 2 for v in expiries.values()),
                'earliest_expiration': dates[0].isoformat() if dates else '',
                'latest_expiration': dates[-1].isoformat() if dates else '',
                'earliest_dte_at_capture': (dates[0] - AS_OF).days if dates else '',
                'latest_dte_at_capture': (dates[-1] - AS_OF).days if dates else '',
                'lookup_raw_sha256': provider['raw_sha256'],
            })

    population.sort(key=lambda r: r['occ_underlying'])
    class_rows.sort(key=lambda r: (r['occ_underlying'], r['occ_class']))
    population_bytes = csv_bytes(population, list(population[0]))
    cboe_etf_bytes = csv_bytes([r for r in population if r['product_evidence_tier'] == 'CBOE_ETF'], list(population[0]))
    occ_name_bytes = csv_bytes([r for r in population if r['product_evidence_tier'] == 'OCC_ETF_NAME_CBOE_ABSENT'], list(population[0]))
    class_bytes = csv_bytes(class_rows, list(class_rows[0]))
    (HERE / 'population-product-evidence.csv').write_bytes(population_bytes)
    (HERE / 'cboe-etf-underlyings.csv').write_bytes(cboe_etf_bytes)
    (HERE / 'occ-etf-name-candidates.csv').write_bytes(occ_name_bytes)
    (HERE / 'etf-cohort-class-lookup.csv').write_bytes(class_bytes)

    by_tier = {}
    for tier in sorted(set(tier_by_symbol.values())):
        u = [r for r in population if r['product_evidence_tier'] == tier]
        c = [r for r in class_rows if r['product_evidence_tier'] == tier]
        frozen_c = [r for r in classes if tier_by_symbol[r['occ_underlying_symbol']] == tier]
        by_tier[tier] = {
            'underlyings': len(u),
            'frozen_class_rows': len(frozen_c),
            'lookup_analyzed_class_rows': len(c),
            'underlying_states': dict(sorted(collections.Counter(r['provider_underlying_state'] for r in u).items())),
            'class_states': dict(sorted(collections.Counter(r['provider_class_state'] for r in frozen_c).items())),
            'exact_root_classes_with_put_pair_somewhere': sum(r['put_pair_expiration_count'] > 0 for r in c) if tier in selected else None,
            'exact_root_put_contract_strings': sum(r['put_contract_strings'] for r in c) if tier in selected else None,
            'exact_root_call_contract_strings': sum(r['call_contract_strings'] for r in c) if tier in selected else None,
        }
    summary = {
        'schema': 'wheelwright-pass-minus-one-etf-evidence-view/v0',
        'source_archive_sha256': EXPECTED_ARCHIVE_SHA256,
        'occ_report_date': declared['occ_report_date'],
        'cboe_retrieved_date': declared['cboe_retrieved_date'],
        'tradier_capture_date': AS_OF.isoformat(),
        'frozen_underlying_denominator': 6072,
        'frozen_option_class_denominator': 6381,
        'classification_tiers': by_tier,
        'population_product_evidence_sha256': sha256(population_bytes),
        'cboe_etf_underlyings_sha256': sha256(cboe_etf_bytes),
        'occ_etf_name_candidates_sha256': sha256(occ_name_bytes),
        'etf_cohort_class_lookup_sha256': sha256(class_bytes),
        'lookup_only_not_pass_zero_chain_census': True,
    }
    (HERE / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
