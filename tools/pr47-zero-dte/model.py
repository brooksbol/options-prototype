"""Pure all-69 experiment rules; no credentials or brokerage mutations."""
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
import hashlib

class Blocked(ValueError):pass

def number(value):
    try:
        result=Decimal(str(value))
        if result.is_finite():return result
    except (InvalidOperation,ValueError,TypeError):pass
    raise Blocked('Missing or invalid numeric evidence')

@dataclass(frozen=True)
class Put:
    symbol:str
    expiration:str
    strike:Decimal
    occ:str

def canonical(symbol):return 'BF.B' if symbol in {'BFB','BF B','BF.B','BF/B'} else symbol

def occ_key(symbol):
    key=''.join(symbol.split())
    return 'BFB'+key[4:] if key.startswith('BF.B') else key

def identity(symbol, row, expiration):
    provider='BF/B' if symbol=='BF.B' else symbol
    if (canonical(row.get('underlying'))!=symbol or canonical(row.get('root_symbol'))!=symbol or row.get('option_type')!='put'
            or row.get('expiration_date')!=expiration or str(row.get('contract_size'))!='100'):
        raise Blocked('Listed standard put identity mismatch')
    strike=number(row.get('strike'))
    root='BFB' if symbol=='BF.B' else symbol
    occ=root+expiration[2:].replace('-','')+'P'+f'{int(strike*1000):08}'
    if strike<=0 or strike*1000!=int(strike*1000) or row.get('symbol')!=occ:
        raise Blocked('Put OCC does not match exact listed terms')
    return Put(symbol,expiration,strike,occ)

def select_lowest(contracts, observation, now_seconds):
    if not contracts or len(set(contracts))!=len(contracts) or len({c.strike for c in contracts})!=len(contracts):
        raise Blocked('Empty or ambiguous listed put grid')
    if (observation.get('right')!='PUT' or {c.expiration for c in contracts}!={observation.get('expiration')}
            or {c.symbol for c in contracts}!={canonical(observation.get('symbol'))}):
        raise Blocked('Wrong put Greek expiration/right')
    fresh={};seen=set()
    for row in observation.get('greeks',[]):
        occ=occ_key(row.get('symbol',''));delta=number(row.get('delta'));age=number(now_seconds)-number(row.get('updatedAt'))/1000
        if occ in seen:raise Blocked('Duplicate Greek observation')
        seen.add(occ)
        if -1<=delta<=1 and 0<=age<=120:fresh[occ]=delta
    # Every lower strike must be observed, establishing minimality rather than
    # cherry-picking an available higher point. Higher missing points do not
    # invalidate an already proved minimum.
    for contract in sorted(contracts,key=lambda c:c.strike):
        if contract.occ not in fresh:raise Blocked('Missing/stale lower-strike put Greek coverage')
        if abs(fresh[contract.occ])>Decimal('.50'):return contract,fresh[contract.occ]
    raise Blocked('No listed put has absolute delta strictly above0.50')

def treatment_id(symbol, date):
    return 'P47Z'+hashlib.sha256(('PR47-0DTE-ALL69|'+date+'|'+symbol).encode()).hexdigest()[:24]

def broker_contract(symbol, row, expiration):
    delivery=row.get('deliverables',[])
    if (canonical(row.get('underlying_symbol'))!=symbol or row.get('expiration_date')!=expiration
            or row.get('option_type')!='PUT' or row.get('status')!='LISTING' or row.get('tradable_status')!='OC'
            or row.get('def_type')!='STANDARD' or row.get('style')!='AMERICAN'
            or row.get('settlement_method')!='PHYSICAL' or row.get('currency')!='USD'
            or row.get('underlying_type')!='EQUITY_PUT_OPTION' or number(row.get('multiplier'))!=100
            or not isinstance(row.get('ppind'),bool) or len(delivery)!=1):
        raise Blocked('Broker put is not a standard tradable physical100-share contract')
    leg=delivery[0]
    if (canonical(leg.get('symbol'))!=symbol or leg.get('asset_type')!='EQUITY' or number(leg.get('amount'))!=100
            or number(leg.get('allocation_percentage'))!=100 or not row.get('underlying_instrument_id')
            or leg.get('instrument_id')!=row['underlying_instrument_id']):raise Blocked('Put deliverable mismatch')
    strike=number(row.get('strike_price'));root='BFB' if symbol=='BF.B' else symbol
    occ=root+expiration[2:].replace('-','')+'P'+f'{int(strike*1000):08}'
    if strike<=0 or strike*1000!=int(strike*1000) or row.get('symbol')!=occ:raise Blocked('Broker OCC/strike mismatch')
    return Put(symbol,expiration,strike,occ)

def tick(contract, bid):
    bid=number(bid)
    if not isinstance(contract.get('ppind'),bool):raise Blocked('Missing penny-program tick evidence')
    step=Decimal('.01' if bid<3 else '.05') if contract['ppind'] else Decimal('.05' if bid<3 else '.10')
    if bid<=0 or bid%step:raise Blocked('Qualified bid is off the verified contract tick; no rounding')
    return bid

def basket_capacity(cash, existing_put_obligations, remaining_reserves):
    # Acquired shares consume cash; their market value is never collateral cash.
    return number(cash)-number(existing_put_obligations)-sum(map(number,remaining_reserves))
