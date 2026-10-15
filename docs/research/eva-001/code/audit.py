"""EVA-001 retained-evidence inventory. No forecasting, P/L or backtesting.

Run from any directory with Python 3.9+. An optional read-only probe uses an
already running Theta Terminal; this program never starts it or reads credentials.
"""
import argparse
import collections
import datetime as dt
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import tarfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1] / "evidence"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit(probe=False):
    prior = ROOT / "docs/research/partial-collar-test1"
    manifest_path = prior / "data/theta_history_manifest.json"
    manifest = json.loads(manifest_path.read_text())
    checks = []
    for name, item in sorted(manifest["files"].items()):
        path = prior / "data/raw/theta/history" / name
        checks.append({"file": name, "exists": path.exists(),
                       "hash_matches": path.exists() and digest(path) == item["sha256"],
                       "recorded_rows": item["rows"], "recorded_status": item["status"]})
    archive_records, chain_records = [], []
    for parent in sorted((ROOT / "data/research").glob("*")):
        path, metadata = parent / "evidence.tar.gz", parent / "artifact-manifest.json"
        if not path.exists() or not metadata.exists():
            continue
        info = json.loads(metadata.read_text())
        expected = info.get("archive_sha256")
        if isinstance(info.get("archive"), dict):
            expected = info["archive"].get("sha256")
        actual = digest(path)
        with tarfile.open(path, "r:gz") as archive:
            files = [m for m in archive.getmembers() if m.isfile()]
            archive_records.append({"file": str(path.relative_to(ROOT)), "files": len(files),
                                    "sha256": actual, "hash_matches": actual == expected})
            for member in files:
                if "._" in member.name or "chain" not in member.name or not member.name.endswith(".body"):
                    continue
                raw = archive.extractfile(member).read()
                data = json.loads(raw)
                options = data.get("options", {}).get("option", [])
                if not isinstance(options, list) or not options:
                    continue
                count = lambda field: sum(isinstance(o.get("greeks"), dict) and
                    o["greeks"].get(field) is not None for o in options)
                chain_records.append({"archive": str(path.relative_to(ROOT)), "member": member.name,
                    "sha256": hashlib.sha256(raw).hexdigest(), "rows": len(options),
                    "underlyings": sorted({o["underlying"] for o in options}),
                    "expirations": sorted({o["expiration_date"] for o in options}),
                    "rights": dict(collections.Counter(o.get("option_type") for o in options)),
                    "bid_ask_present": sum(o.get("bid") is not None and o.get("ask") is not None for o in options),
                    "mid_iv_present": count("mid_iv"), "smv_vol_present": count("smv_vol"),
                    "delta_present": count("delta"),
                    "quote_timestamp_min": min(o.get("bid_date", 0) for o in options),
                    "quote_timestamp_max": max(o.get("ask_date", 0) for o in options)})
    report = {"schema": "eva-001-evidence-audit/v1", "checked_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "repository_head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "scope": "Named retained research archives, partial-collar source data and one offline backup; not a machine-wide or live-service census.",
        "theta_history": {"manifest": str(manifest_path.relative_to(ROOT)), "manifest_sha256": digest(manifest_path),
            "recorded_retrieved_utc": manifest["retrieved_utc"], "recorded_rows": manifest["rows"],
            "checks": checks},
        "theta_comparison": json.loads((prior / "data/theta_comparison.json").read_text()),
        "archives": archive_records, "chains": chain_records,
        "theta_terminal": {"status": "NOT_PROBED", "current_entitlement": "UNVERIFIED"},
        "muse": {"handoff": "Principal relays prompts and returned research", "result": "PENDING"}}
    backup = Path.home() / ".local/share/wheelwright/pl-conv-01-step5/operational-r2/final-pre-migration.sqlite3"
    if backup.exists():
        connection = sqlite3.connect(backup.as_uri() + "?mode=ro&immutable=1", uri=True)
        connection.execute("PRAGMA query_only=ON")
        counts = {}
        for table in ["evidence", "spot_history", "direct_quote", "brokerage_artifact", "account_position_snapshot"]:
            counts[table] = connection.execute('SELECT count(*) FROM "' + table + '"').fetchone()[0]
        connection.close()
        report["offline_backup"] = {"path_relative_to_home": str(backup.relative_to(Path.home())),
            "sha256": digest(backup), "read_mode": "read-only immutable; offline backup only", "table_counts": counts}
    if probe:
        url = "http://127.0.0.1:25503/v3/stock/history/eod?symbol=SPY&start_date=20260901&end_date=20260901&format=json"
        entry = {"url": url, "checked_utc": dt.datetime.now(dt.timezone.utc).isoformat(), "current_entitlement": "UNVERIFIED"}
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                raw = response.read(1_000_000)
                entry.update(status="REACHABLE", http_status=response.status,
                             response_sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw))
                parsed = json.loads(raw)
                rows = parsed.get("response", []) if isinstance(parsed, dict) else parsed
                entry["rows"] = len(rows) if isinstance(rows, list) else None
                entry["current_entitlement"] = "ONLY_THIS_STOCK_EOD_REQUEST_OBSERVED; OPTIONS_UNVERIFIED"
        except urllib.error.HTTPError as error:
            entry.update(status="HTTP_ERROR", http_status=error.code)
        except (OSError, ValueError) as error:
            entry.update(status="UNAVAILABLE", error_class=type(error).__name__,
                         reason_class=type(getattr(error, "reason", None)).__name__)
        report["theta_terminal"] = entry
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "inventory.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"theta_files": len(checks), "theta_hash_failures": sum(not x["hash_matches"] for x in checks),
        "archives": len(archive_records), "archive_hash_failures": sum(not x["hash_matches"] for x in archive_records),
        "chain_snapshots": len(chain_records), "terminal": report["theta_terminal"]["status"]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--probe-theta-existing", action="store_true")
    audit(parser.parse_args().probe_theta_existing)
