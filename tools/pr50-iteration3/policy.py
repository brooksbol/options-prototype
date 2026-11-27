"""PR50 I3 pure, prospectively frozen policy. No I/O, credentials or transport."""
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_FLOOR, ROUND_CEILING
import hashlib, json
from pathlib import Path
from zoneinfo import ZoneInfo

ROSTER = 'SPY QQQ SPX NVDA VIX IWM AAPL SPCX TSLA MU IBIT AMD TLT MSFT SLS INTC EWZ XSP AMZN MSTR TQQQ SOXL SOFI XLF GLD GOOGL CRWV NFLX META IREN SMH PLTR SLV HOOD DRAM ORCL BABA NKE AVGO TSM NBIS SMCI HYG SNDK EEM UBER TGT NXPI KRE NOW GOOG BTDR'.split()
CONFIG=json.loads((Path(__file__).resolve().parent/'cohort.json').read_bytes())
if set(CONFIG)!={'schema','version','entryDate','expiration','assignmentSeed'} or CONFIG['schema']!='pr50-dated-replication/1':raise ValueError('INVALID_DATED_CONFIGURATION')
VERSION=CONFIG['version'];ENTRY_DATE=date.fromisoformat(CONFIG['entryDate']);EXPIRY=date.fromisoformat(CONFIG['expiration']);SEED=CONFIG['assignmentSeed']
if ENTRY_DATE.strftime('%Y%m%d') not in VERSION or ENTRY_DATE.strftime('%Y%m%d') not in SEED:raise ValueError('COHORT_DATE_IDENTITY_REQUIRED')
if (EXPIRY-ENTRY_DATE).days!=1 or ENTRY_DATE.weekday()>4 or EXPIRY.weekday()>4:raise ValueError('EXACT_ONE_CALENDAR_DTE_WEEKDAY_REQUIRED')
def session_clock(day,hour,minute=0):
    return datetime(day.year,day.month,day.day,hour,minute,tzinfo=ZoneInfo('America/New_York')).astimezone(timezone.utc)

MAXIMUM_SPREADS = 33
MAXIMUM_AGGREGATE_GROSS_WIDTH_USD = '11350'
PER_SYMBOL_MAXIMUM_WIDTH = {'SPY': '4.0000000000', 'QQQ': '6.0000000000', 'NVDA': '2.5000000000', 'IWM': '2.0000000000', 'SPCX': '2.0000000000', 'TSLA': '5.0000000000', 'MU': '17.5000000000', 'IBIT': '0.5000000000', 'AMD': '10.0000000000', 'MSFT': '5.0000000000', 'INTC': '1.0000000000', 'AMZN': '2.5000000000', 'MSTR': '2.0000000000', 'TQQQ': '1.0000000000', 'SOXL': '3.0000000000', 'XLF': '0.5000000000', 'GLD': '2.0000000000', 'GOOGL': '2.5000000000', 'CRWV': '1.5000000000', 'META': '7.5000000000', 'SMH': '7.5000000000', 'PLTR': '2.5000000000', 'HOOD': '1.0000000000', 'DRAM': '1.0000000000', 'ORCL': '2.0000000000', 'AVGO': '5.0000000000', 'TSM': '5.0000000000', 'NBIS': '3.0000000000', 'SMCI': '0.5000000000', 'TGT': '2.5000000000', 'KRE': '1.0000000000', 'NOW': '2.0000000000', 'GOOG': '2.5000000000'}
SOURCE_FILES = ("policy.py", "reuse.py", "runtime.py", "manage.py", "observe.py", "run_batch.py", "prepare.py", "cohort.json", "acquire_listing.py", "acquire_quotes.py", "environment.json")

class Hold(ValueError):
    pass

def amount(value):
    if isinstance(value, bool) or value is None:
        raise Hold('MISSING_OR_BOOLEAN_NUMBER')
    try:
        out = Decimal(str(value))
    except InvalidOperation:
        raise Hold('INVALID_NUMBER') from None
    if not out.is_finite():
        raise Hold('NONFINITE_NUMBER')
    return out

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()

def assignments(eligible_symbols=None):
    """Fixed-seed blocked allocation BEFORE exposure; eligibility is not an outcome.

    Qualifiers and WAIT members are separate blocks, each deterministically
    shuffled and alternated. Entry failure never causes reassignment.
    """
    eligible=set(ROSTER if eligible_symbols is None else eligible_symbols)
    if not eligible <= set(ROSTER):raise Hold('ELIGIBILITY_OUTSIDE_ROSTER')
    result={}
    for group in (eligible,set(ROSTER)-eligible):
        ordered=sorted(group,key=lambda s:hashlib.sha256((SEED+'|'+s).encode()).digest())
        result.update({symbol:('A' if rank%2==0 else 'B') for rank,symbol in enumerate(ordered)})
    return result

def freeze_plan(eligible_symbols=None):
    eligible = [s for s in ROSTER if s in PER_SYMBOL_MAXIMUM_WIDTH]
    if eligible_symbols is not None and set(eligible_symbols)!=set(eligible):raise Hold('PRESERVED_APPROVED_RISK_MEMBERSHIP_CHANGED')
    if len(eligible)!=len(set(eligible)) or not set(eligible)<=set(ROSTER):raise Hold('ELIGIBILITY_IDENTITY')
    eligible=[s for s in ROSTER if s in eligible]
    arms = {}
    for arm, hour in [('A', 15), ('B', 11)]:
        start = session_clock(EXPIRY,hour)
        arms[arm] = {
            'selectionAt': start.isoformat(),
            'latestSelectionAtExclusive': (start + timedelta(seconds=60)).isoformat(),
            'mutationDeadline': (start + timedelta(minutes=20)).isoformat(),
            'latestCancelAtExclusive': (start + timedelta(minutes=19)).isoformat(),
            'readbackAt': (start + timedelta(minutes=21)).isoformat(),
            'condition': 'shortStrike >= 0.99 * underlyingMidpoint',
            'p50': 'FLOOR_TO_TICK(confirmedOpeningCredit / 2)',
            'close': 'MIN(width, CEIL_TO_TICK(shortAsk - longBid))',
            'requirePositiveLongBid': True,
            'newTimeCloseAttemptsPerAllocation': 1,
            'additionalPriceAdjustments': 0,
            'unfilled': 'KEEP_ACCEPTED_DAY_LIMIT; REPORT_STILL_HELD; EXPIRY_POSSIBLE',
            'uncertain': 'NO_RESEND; ORIGINAL_ID_READBACK_ONLY; ISOLATE_LOCAL_UNCERTAIN_CANCEL; STOP_ACCOUNT_OR_UNKNOWN_PLACE',
            'beforeCancelFailure': 'HOLD_RETAIN_P50',
            'afterCancelFailure': 'HOLD_NO_NEW_ORDER; REPORT_EXIT_ABSENT',
        }
    return {
        'version': VERSION, 'venue': 'WEBULL_OPENAPI_PAPER_INDIVIDUAL_MARGIN',
        'entryDate': ENTRY_DATE.isoformat(), 'expiration': EXPIRY.isoformat(),
        'roster': ROSTER, 'rosterSha256': digest(ROSTER), 'quantity': 1,
        'entryWindowUTC': [session_clock(ENTRY_DATE,9,30).isoformat(), session_clock(ENTRY_DATE,15,30).isoformat()],
        'p50LatestUTC': session_clock(ENTRY_DATE,16).isoformat(),
        'entryFillPolicy': 'THREE_ORIGINAL_ID_REPOLLS; ACK_KNOWN_LOCAL_PENDING_CONTINUES_WITH_DURABLE_WATCH; UNKNOWN_DISPATCH_STOPS; ONE_P50_BEFORE_DEADLINE; NO_ENTRY_RESEND_OR_AUTO_CANCEL',
        'strategy': 'BULL_PUT_CREDIT_VERTICAL', 'shortDelta': '-0.30', 'longDelta': '-0.20',
        'maximumAbsoluteDeltaDistance': '0.05', 'deltaAgeSeconds': 300,
        'catalogPolicy': 'EXACT_TARGET_EXPIRY_STANDARD_PHYSICAL_100; NO_SUBSTITUTION',
        'liquidity': 'BOTH_LEGS_POSITIVE_TWO_SIDED_BOOK_AND_SIZE_AT_LEAST_ONE',
        'entryCredit': 'POSITIVE_NATURAL_FLOORED_TO_TICK; BELOW_WIDTH; REPRESENTABLE_P50',
        'volumeOpenInterest': 'PRESERVE_SUPPORTED_VALUES_OR_UNKNOWN; NO_INVENTED_ZERO',
        'catalysts': 'PRESERVE_SOURCE_FRESHNESS_AND_UNKNOWNS; NO_RETROACTIVE_RESEARCH',
        'arms': arms, 'assignmentSeed': SEED, 'eligibleAtFreeze': eligible, 'assignment': assignments(eligible),
        'assignmentStanding': 'FIXED_SEED_BLOCKED_BY_PRESERVED_33_RISK_APPROVED_CANDIDATES; FRESH_QUALIFICATION_ATTRITION_RECORDED; NO_POST_ENTRY_REASSIGNMENT; NOT_PAIRED_WITHIN_UNDERLYING',
        'analysisUnit': 'ENTRY_DAY_CLUSTER; NO_INDEPENDENT_MARKET_REGIME_COUNT_PER_SPREAD',
        'executionAuthorized': False,
        'maximumSpreads': MAXIMUM_SPREADS, 'maximumAggregateGrossWidthUSD': MAXIMUM_AGGREGATE_GROSS_WIDTH_USD,
        'perSymbolMaximumWidth': PER_SYMBOL_MAXIMUM_WIDTH, 'uncappedSymbols': 'WAIT_NO_APPROVED_WIDTH_CAP',
        'boundedWaitRequalification': ['SPY','QQQ','AMZN','TQQQ'], 'requalificationPassesPerSymbol': 1,
        'finalReadbackUTC': session_clock(EXPIRY,16,5).isoformat(), 'awakeUntilUTC':session_clock(EXPIRY,16,15).isoformat(),
    }

def validate_plan(plan):
    if digest(plan) != digest(freeze_plan(plan.get('eligibleAtFreeze'))):
        raise Hold('FROZEN_PLAN_CHANGED')
    return digest(plan)

def tick(contracts):
    return Decimal('.01') if all(c.get('ppind') is True for c in contracts) else Decimal('.05')

def p50(fill, increment):
    fill, increment = amount(fill), amount(increment)
    if fill <= 0 or increment not in (Decimal('.01'), Decimal('.05')):
        raise Hold('INVALID_P50_INPUT')
    value = (fill / 2 / increment).to_integral_value(rounding=ROUND_FLOOR) * increment
    if value <= 0:
        raise Hold('UNREPRESENTABLE_P50')
    return value

def select(contracts, greeks, now_ms):
    """Unique nearest among fresh OBSERVED Webull-listed contracts; coverage retained."""
    if amount(now_ms) < 1000000000000:
        raise Hold('EPOCH_MILLISECONDS_REQUIRED')
    if not contracts:
        raise Hold('NO_EXACT_TARGET_LISTINGS')
    by = {}
    for g in greeks:
        symbol = ''.join(str(g.get('symbol', '')).split())
        if symbol in by:
            raise Hold('DUPLICATE_GREEK_IDENTITY')
        by[symbol] = g
    pool = []
    for c in contracts:
        if c.get('expiration_date') != EXPIRY.isoformat():
            raise Hold('EXPIRATION_SUBSTITUTION')
        g = by.get(c.get('symbol'))
        if not g or type(g.get('delta')) not in (int, float) or type(g.get('updatedAt')) not in (int, float):
            continue
        delta, stamp = amount(g['delta']), amount(g['updatedAt'])
        if -1 <= delta < 0 and 0 <= amount(now_ms) - stamp <= 300000:
            pool.append((c, g, delta))
    if not pool:
        raise Hold('NO_FRESH_MATCHED_DELTAS')
    selected = []
    for target in (Decimal('-.30'), Decimal('-.20')):
        distance = min(abs(d - target) for _, _, d in pool)
        nearest = [(c, g) for c, g, d in pool if abs(abs(d - target) - distance) <= Decimal('0.000000000001')]
        if distance > Decimal('.05') or len(nearest) != 1:
            raise Hold('DELTA_DISTANCE_OR_TIE')
        selected.append(nearest[0])
    (short, sg), (long, lg) = selected
    if short['instrument_id'] == long['instrument_id'] or amount(short['strike_price']) <= amount(long['strike_price']):
        raise Hold('DISTINCT_LOWER_LONG_NOT_ESTABLISHED')
    return {'short': {'contract': short, 'greek': sg}, 'long': {'contract': long, 'greek': lg},
            'freshCoverage': len(pool), 'catalogCount': len(contracts),
            'missingOrStale': len(contracts) - len(pool), 'nearestScope': 'FRESH_OBSERVED_ONLY'}

def economics(short, long, contracts):
    for book, contract in zip((short, long), contracts):
        if (book.get('symbol') != contract.get('symbol') or book.get('underlying') != contract.get('underlying_symbol') or book.get('expiration_date') != contract.get('expiration_date') or str(book.get('option_type', '')).upper() != 'PUT' or amount(book.get('strike')) != amount(contract['strike_price']) or book.get('contract_size') != 100):
            raise Hold('QUOTE_CONTRACT_IDENTITY_MISMATCH')
        if not 0 < amount(book.get('bid')) <= amount(book.get('ask')):
            raise Hold('INVALID_OR_ZERO_BID_BOOK')
        if min(amount(book.get('bidsize')), amount(book.get('asksize'))) < 1:
            raise Hold('INSUFFICIENT_QUOTED_SIZE')
    width = amount(contracts[0]['strike_price']) - amount(contracts[1]['strike_price'])
    inc = tick(contracts)
    natural = amount(short['bid']) - amount(long['ask'])
    midpoint = (amount(short['bid']) + amount(short['ask']) - amount(long['bid']) - amount(long['ask'])) / 2
    credit = (natural / inc).to_integral_value(rounding=ROUND_FLOOR) * inc
    if not 0 < credit <= natural <= midpoint < width:
        raise Hold('NO_BOUNDED_NATURAL_CREDIT')
    target = p50(credit, inc)
    return {k: str(v) for k, v in {
        'width': width, 'naturalCredit': natural, 'midpointCredit': midpoint,
        'limitCredit': credit, 'tick': inc, 'minimumP50AtLimit': target,
        'creditWidthRatio': credit / width, 'theoreticalMaxLossAtLimitUSD': (width-credit)*100,
        'shortAssignmentNotionalUSD': amount(contracts[0]['strike_price'])*100,
    }.items()}

def entry_order(symbol, selection, terms, client_id):
    if symbol not in ROSTER or symbol in ('SPX', 'XSP', 'VIX'):
        raise Hold('UNSUPPORTED_OR_OUTSIDE_ROSTER')
    contracts = [selection[k]['contract'] for k in ('short', 'long')]
    if any(c['expiration_date'] != EXPIRY.isoformat() or c.get('underlying_symbol') != symbol or c.get('option_type') != 'PUT' for c in contracts):
        raise Hold('EXPIRATION_SUBSTITUTION')
    order = {'client_order_id': client_id, 'combo_type':'NORMAL', 'option_strategy':'VERTICAL',
             'instrument_type':'OPTION','market':'US','symbol':symbol,'side':'SELL',
             'position_intent':'SELL_TO_OPEN','order_type':'LIMIT','limit_price':terms['limitCredit'],
             'quantity':'1','time_in_force':'DAY','support_trading_session':'CORE','entrust_type':'QTY'}
    order['legs']=[{'side': side,'quantity':'1','symbol':symbol,'strike_price':c['strike_price'],
                    'option_expire_date':EXPIRY.isoformat(),'instrument_type':'OPTION','option_type':'PUT','market':'US'}
                   for side,c in zip(('SELL','BUY'),contracts)]
    return order

def selected(short_strike, bid, ask):
    k,b,a = map(amount,(short_strike,bid,ask))
    if not 0 < b <= a or k <= 0:
        raise Hold('INVALID_SELECTION_BOOK')
    return k >= Decimal('.99') * (b+a)/2

def close_debit(short_ask, long_bid, width, increment):
    a,b,w,t=map(amount,(short_ask,long_bid,width,increment))
    if min(a,b,w) <= 0 or t not in (Decimal('.01'),Decimal('.05')) or a-b <= 0:
        raise Hold('INVALID_OR_ZERO_BID_CLOSE')
    cap=(w/t).to_integral_value(rounding=ROUND_FLOOR)*t
    return min(((a-b)/t).to_integral_value(rounding=ROUND_CEILING)*t,cap)
