#!/usr/bin/env python3
"""Reproducible, judgmental symbol-level Iron Condor watchlist from frozen dated evidence.

The tier/order and overlap choices are explicit Product research judgment, not a generated
trading threshold. No live requests, score overwrite, or Deployment mutation.
"""
import argparse,csv,datetime as dt,gzip,hashlib,json,re,tarfile
from collections import Counter,defaultdict
from pathlib import Path
P=Path(__file__).resolve().parent;ROOT=P.parents[2];LIVE=P/'live-market-2026-10-02';OUT=P/'working-candidates-2026-10-02';OUT.mkdir(exist_ok=True)
TIERS={
 'CORE':'SPY QQQ IWM DIA TLT IEF GLD SLV XLF XLE XLK SMH GDX SPX XSP'.split(),
 'ESTABLISHED':'XLI XLU XBI USO UNG MDY IJR IEMG VEA EWG EWZ EWT EWY ASHR FEZ ILF KWEB VNQ KRE XOP IGV GDXJ SIL IBIT ETHA VUG MTUM SPMO XLY XLP PAVE URA JETS ITB CIBR RUT NDX'.split(),
 'BREADTH':'EWW SILJ REMX COPX CPER BNO UGA URNM TAN ARKK ARKG ARKQ ARKW DRAM CHAT QTUM BUG PALL MAGS VIG SPHB XES MLPX VXF VOT IWO IWC BSOL XHB XSD IYW VGT VDE IEO HACK FTEC EEM QQQM SIVR IBB'.split(),
}
assert sum(map(len,TIERS.values()))==92 and len(set(sum(TIERS.values(),[])))==92
FAMILIES={
 'US_LARGE':'SPY DIA VTI VOO IVV VIG VUG MTUM SPMO SPHB MAGS',
 'US_NASDAQ':'QQQ QQQM',
 'US_SMALL_MID':'IWM MDY IJR VXF VOT IWO IWC',
 'TREASURY_RATES':'TLT IEF',
 'PRECIOUS_METAL':'GLD SLV SIVR PALL GDX GDXJ SIL SILJ',
 'ENERGY_COMMODITY':'USO UNG BNO UGA',
 'ENERGY_EQUITY':'XLE XOP XES VDE IEO MLPX',
 'US_SECTOR':'XLF XLK XLI XLU XLP XLY VNQ KRE ITB XHB VGT IYW FTEC PAVE JETS',
 'SEMICONDUCTOR_TECH':'SMH XSD IGV DRAM CIBR HACK BUG CHAT QTUM',
 'BIOTECH_HEALTH':'XBI IBB ARKG',
 'INTERNATIONAL':'IEMG EEM VEA EWG EWZ EWT EWY ASHR FEZ ILF KWEB EWW',
 'RESOURCE_THEME':'URA URNM REMX COPX CPER TAN',
 'INNOVATION_THEME':'ARKK ARKQ ARKW',
 'CRYPTO_ASSET':'IBIT ETHA BSOL',
 'INDEX_US':'SPX XSP RUT NDX',
}
family={s:k for k,v in FAMILIES.items() for s in v.split()}
assert all(s in family for s in sum(TIERS.values(),[]))
FIRST_REVIEW=set('ARKW REMX PALL BUG XES MLPX VXF VOT IWO IWC BSOL XHB HACK FTEC EEM SIVR IBB'.split())
assert FIRST_REVIEW<=set(TIERS['BREADTH'])
OVERLAP={
 'QQQM':'QQQ overlap; smaller ETF has two passing PR #33 slots',
 'EEM':'IEMG emerging-market overlap; retained for alternative option market',
 'VGT':'XLK technology overlap; alternative broad tech fund',
 'IYW':'XLK technology overlap; alternative exposure',
 'FTEC':'XLK technology overlap; alternative exposure',
 'VDE':'XLE energy overlap; alternative exposure',
 'IEO':'XOP energy exploration overlap; alternative exposure',
 'HACK':'CIBR cybersecurity overlap; alternative exposure',
 'IBB':'XBI biotech overlap; different weighting',
 'SIVR':'SLV silver overlap; alternative trust',
 'XHB':'ITB homebuilding overlap; alternative basket',
 'GDXJ':'GDX miners overlap; junior-miner exposure',
 'SPX':'SPY exposure overlap; cash-settled index and large notional',
 'XSP':'SPY/SPX exposure overlap; smaller cash-settled index',
 'RUT':'IWM exposure overlap; cash-settled index',
 'NDX':'QQQ exposure overlap; cash-settled index',
}
CAVEAT={
 'SPX':'Prefer SPXW PM-settled root; SPX AM-settled root remains distinct. Large contract notional; confirm intended tastytrade bracket workflow.',
 'XSP':'Separate cash-settled Mini-SPX class; confirm intended tastytrade bracket workflow.',
 'NDX':'DATA METHOD GAP: Tradier derived NDX reference lacked trade timestamp; NDX/NDXP four-leg markets were usable. Prefer NDXP PM settlement subject to exact-class workflow confirmation; large index contract granularity.',
 'RUT':'DATA METHOD GAP: Tradier derived RUT reference lacked trade timestamp; RUT/RUTW four-leg markets were usable. Prefer RUTW PM settlement subject to exact-class workflow confirmation; large index contract granularity.',
 'IBIT':'Spot Bitcoin trust; gap and weekend reference risk; neutral structure still needs opportunity gate.',
 'ETHA':'Spot Ethereum trust; gap and weekend reference risk; neutral structure still needs opportunity gate.',
 'BSOL':'Single crypto-asset fund; one passing probe and short evidence history.',
 'USO':'Commodity futures fund with roll effects; reference is ETF shares.',
 'UNG':'Natural-gas futures fund with roll effects and large moves.',
 'BNO':'Commodity futures fund with roll effects; one passing probe.',
 'UGA':'Gasoline futures fund with roll effects and narrower product.',
 'ARKK':'Concentrated growth theme; one passing probe.',
 'DRAM':'Narrow memory theme despite two passing probes.',
 'MAGS':'Concentrated mega-cap basket; one passing probe.',
}
# Index root choices are not counted as extra underlying symbols.
INDEX_ROOT={'SPX':'SPXW','XSP':'XSP','NDX':'NDXP','RUT':'RUTW'}
INDEX_OPTIONAL={'SPX':'SPX','NDX':'NDX','RUT':'RUT'}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--pr33-dir',type=Path,required=True);a=ap.parse_args();pr=a.pr33_dir
 frozen=json.loads((P/'existing-market-evidence-summary.json').read_text());ps=json.loads((pr/'summary.json').read_text())
 assert sha(pr/'probe-details.json')==ps['files_sha256']['probe-details.json']==frozen['pr33_probe_details_sha256']
 assert sha(pr/'exit-reliability-v0.csv')==ps['files_sha256']['exit-reliability-v0.csv']==frozen['pr33_score_csv_sha256']
 details=json.loads((pr/'probe-details.json').read_text());scores={r['Symbol']:float(r['Exit Reliability']) for r in csv.DictReader((pr/'exit-reliability-v0.csv').open())}
 quote_path=pr/'underlying-quotes.json';quotes=json.loads(quote_path.read_text())['quotes'];by=defaultdict(list)
 for x in details:by[x['symbol']].append(x)
 ledger={(r['underlying'],r['occ_class']):r for r in csv.DictReader((P/'class-ledger.csv').open())}
 live=json.loads((LIVE/'audited-results.json').read_text());lmap={(r['underlying'],r['occ_class']):r for r in live['rows']}
 assert live['summary']['raw_manifest_sha256']==sha(LIVE/'capture-manifest.jsonl')
 archive=ROOT/'data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz';assert sha(archive)==json.loads((P/'summary.json').read_text())['archive_sha256']
 with tarfile.open(archive,'r:gz') as t:
  class_info={(x['occ_underlying_symbol'],x['occ_option_class_symbol']):x for x in map(json.loads,t.extractfile('analysis/classes.jsonl').read().splitlines())}
  cache={};out=[]
  for tier,symbols in TIERS.items():
   for sym in symbols:
    isidx=sym in INDEX_ROOT;root=INDEX_ROOT.get(sym,sym);le=ledger[(sym,root)]
    assert le['provider_root']==root and le['cheap_geometry_state']=='LISTED_FOUR_LEG_SHAPE'
    if isidx:
     lr=lmap[(sym,root)];positive=[p for p in lr['probes'] if p.get('state')=='qualified_by_observation']
     assert positive and lr['state'] in ('qualified_by_observation','reference_price_unavailable')
     p0=positive[0];er=None;slots=None;vol=None;dte=le['four_leg_expirations_21_100_dte'];density=None
     width=p0['half_spread_sum_over_min_wing'];size=p0['min_display_size'];oi=p0['min_open_interest'];optvol=p0['mean_volume'];expiration=p0['expiration']
     source='OCT02';market='four usable option legs on 2026-10-02';watch='DATA_METHOD_GAP' if lr['state']=='reference_price_unavailable' else 'MARKET_EVIDENCE_POSITIVE'
     caveat=CAVEAT[sym]
    else:
     pos=[x for x in by[sym] if x['result'].get('full_four_leg') is True]
     assert pos and sym in scores
     er=scores[sym];slots=len(pos);q=quotes[sym];vol=q.get('volume');dte=int(le['four_leg_expirations_21_100_dte'])
     best=min(pos,key=lambda x:x['result']['half_spread_sum_over_min_wing']);z=best['result'];width=z['half_spread_sum_over_min_wing'];size=z['min_exit_side_size'];oi=z['min_open_interest'];optvol=z['mean_volume'];expiration=best['expiration']
     source='PR33';market=f'{slots}/2 fixed expirations with four usable option legs on 2026-10-01';watch='MARKET_EVIDENCE_POSITIVE';caveat=CAVEAT.get(sym,'')
     ci=class_info[(sym,root)];file=ci['raw_gzip']
     if file not in cache:
      b=gzip.decompress(t.extractfile('full/'+file).read());assert hashlib.sha256(b).hexdigest()==ci['raw_sha256'];cache[file]=json.loads(b)
     spot=q.get('last') or q.get('close');density=0
     for group in cache[file].get('symbols',[]):
      if group.get('rootSymbol')!=root:continue
      dates=defaultdict(lambda:{'P':set(),'C':set()})
      for contract in group.get('options',[]):
       m=re.fullmatch(re.escape(root)+r'(\d{6})([CP])(\d{8})',contract)
       if not m:continue
       date=dt.date(2000+int(m[1][:2]),int(m[1][2:4]),int(m[1][4:6]));days=(date-dt.date(2026,10,1)).days
       if 21<=days<=100:dates[date][m[2]].add(int(m[3])/1000)
      density=max((min(sum(.9*spot<=k<spot for k in sides['P']),sum(spot<k<=1.1*spot for k in sides['C'])) for sides in dates.values()),default=0)
    rank=len(out)+1
    pct=round(100*width,1)
    basis=f'{market}; best displayed half-spread/wing {pct}%; {dte} dated 21–100 DTE four-leg expirations; {family[sym].replace("_"," ").lower()} exposure'
    if density is not None:basis+=f'; {density} near-ATM strike pairs on best dated expiration'
    if not isidx and slots==1:caveat=(caveat+' ' if caveat else '')+'Only one of two fixed PR #33 expiration slots had four usable legs.'
    if sym in OVERLAP: caveat=(caveat+' ' if caveat else '')+OVERLAP[sym]
    if tier=='BREADTH' and sym in FIRST_REVIEW:caveat=(caveat+' ' if caveat else '')+'First to review as better breadth evidence arrives.'
    out.append({'rank':rank,'tier':tier,'symbol':sym,'product_type':'INDEX' if isidx else 'ETF','preferred_exact_class_root':root,'alternate_exact_class_root':INDEX_OPTIONAL.get(sym,''),'watch_status':watch,'family':family[sym],'exit_reliability_v0':f'{er:.1f}' if er is not None else '', 'pr33_four_leg_positive_slots':slots if slots is not None else '', 'four_leg_expirations_21_100_dte':dte,'near_atm_min_side_strikes_best_expiry':density if density is not None else '', 'best_half_spread_sum_over_min_wing':round(width,4),'min_display_size_or_exit_side_size':size,'min_open_interest':oi,'mean_option_leg_volume':optvol,'underlying_volume':vol if vol is not None else '', 'observed_positive_expiration':expiration,'basis':basis,'caveat':caveat,'evidence_source':source,'evidence_sha256':frozen['pr33_probe_details_sha256'] if source=='PR33' else live['summary']['raw_manifest_sha256']})
 assert len(out)==92 and len({x['symbol'] for x in out})==92
 with (OUT/'candidate-universe.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(out[0]),lineterminator='\n');w.writeheader();w.writerows(out)
 summary={'schema':'wheelwright-iron-condor-working-candidates/v1','as_of':'2026-10-02','count':len(out),'tier_counts':dict(Counter(x['tier'] for x in out)),'product_counts':dict(Counter(x['product_type'] for x in out)),'index_data_method_gap':[x['symbol'] for x in out if x['watch_status']=='DATA_METHOD_GAP'],'first_to_review':sorted(FIRST_REVIEW),'pr33_probe_details_sha256':frozen['pr33_probe_details_sha256'],'pr33_score_csv_sha256':frozen['pr33_score_csv_sha256'],'pr33_underlying_quotes_sha256':sha(quote_path),'oct02_raw_manifest_sha256':live['summary']['raw_manifest_sha256'],'oct02_audited_results_sha256':sha(LIVE/'audited-results.json'),'pass_minus_one_archive_sha256':sha(archive),'csv_sha256':sha(OUT/'candidate-universe.csv')}
 (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
