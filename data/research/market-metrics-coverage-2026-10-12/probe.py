#!/usr/bin/env python3
"""Bounded read-only full-universe tastytrade /market-metrics coverage probe.

Records a per-symbol coverage matrix and a summary. Missing SYMBOLS and missing
FIELDS are recorded separately (a symbol can be present while a field is absent).
No durable Wheelwright state is written; output is a research artifact only.
"""
import os, json, urllib.request, urllib.parse, time, datetime

BASE = "https://api.tastyworks.com"
cid, secret, rtok = os.environ["TT_CID"], os.environ["TT_SECRET"], os.environ["TT_RTOK"]
OUTDIR = "data/research/market-metrics-coverage-2026-10-12"
FIELDS = [
    "implied-volatility-index-rank",
    "implied-volatility-index-rank-source",
    "tos-implied-volatility-index-rank",
    "tw-implied-volatility-index-rank",
    "implied-volatility-percentile",
    "implied-volatility-index",
    "historical-volatility-30-day",
    "iv-hv-30-day-difference",
    "implied-volatility-updated-at",
]


def oauth():
    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": cid,
        "client_secret": secret,
        "refresh_token": rtok,
    }).encode()
    req = urllib.request.Request(
        BASE + "/oauth/token", data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)["access_token"]


def load_universe():
    syms = []
    with open("data/seeds/yahoo-merged-etf-tickers.csv") as f:
        for i, line in enumerate(f):
            s = line.strip().upper()
            if i == 0 and s == "TICKER":
                continue
            if s:
                syms.append(s)
    return syms


def main():
    syms = load_universe()
    print("universe_symbols", len(syms))
    tok = oauth()
    returned = {}
    batch_size = 100
    for i in range(0, len(syms), batch_size):
        batch = syms[i:i + batch_size]
        url = BASE + "/market-metrics?symbols=" + urllib.parse.quote(",".join(batch))
        req = urllib.request.Request(url, headers={"Accept": "application/json", "Authorization": "Bearer " + tok})
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                d = json.load(r)
            for it in d.get("data", {}).get("items", []):
                returned[it.get("symbol", "").upper()] = it
        except Exception as e:
            print("batch_error", i, repr(e)[:120])
        time.sleep(0.6)

    present = [s for s in syms if s in returned]
    missing = [s for s in syms if s not in returned]

    field_present = {f: 0 for f in FIELDS}
    ivrank_null = 0
    for s in present:
        it = returned[s]
        for f in FIELDS:
            if it.get(f, None) is not None:
                field_present[f] += 1
        if it.get("implied-volatility-index-rank") is None:
            ivrank_null += 1

    summary = {
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "universe_total": len(syms),
        "symbols_present": len(present),
        "symbols_missing": len(missing),
        "ivrank_present_symbols": len(present) - ivrank_null,
        "ivrank_null_among_present": ivrank_null,
        "field_present_counts": field_present,
        "missing_symbols_sample": missing[:80],
    }
    os.makedirs(OUTDIR, exist_ok=True)
    with open(OUTDIR + "/coverage-summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    with open(OUTDIR + "/coverage-matrix.csv", "w") as f:
        f.write("symbol,present,ivRank,ivRankSource,ivPercentile,hv30,ivUpdatedAt\n")
        for s in syms:
            it = returned.get(s)
            if it is None:
                f.write(s + ",no,,,,,\n")
            else:
                f.write("{},yes,{},{},{},{},{}\n".format(
                    s,
                    it.get("implied-volatility-index-rank", ""),
                    it.get("implied-volatility-index-rank-source", ""),
                    it.get("implied-volatility-percentile", ""),
                    it.get("historical-volatility-30-day", ""),
                    it.get("implied-volatility-updated-at", "")))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
