"""Bounded Portfolio paper-account evidence acquisition. No trading or token creation."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
import logging
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import parse_qsl, urlsplit

import requests
from webull.core.auth.signers.signer_factory import SignerFactory
from webull.trade.request.v2.get_account_list_request import GetAccountListRequest
from webull.trade.request.v2.get_account_balance_request import AccountBalanceRequest
from webull.trade.request.v2.get_account_positions_request import AccountPositionsRequest
from webull.trade.request.v3.get_order_open_request_v2 import OrderOpenRequestV2
from webull.trade.request.v3.get_order_history_request_v2 import OrderHistoryRequestV2
from webull.trade.request.v3.get_order_detail_request import OrderDetailRequest
from webull.trade.request.get_activities_request_v2 import GetActivitiesRequestV2
from activity_records import RecordError, timestamp, window, page, order_records, cash_records

# The official signer emits signing headers/material at DEBUG. This isolated
# harness must remain safe even when imported by a caller with verbose logging.
logging.getLogger("webull.core.auth.composer.default_signature_composer").disabled = True

HOST = "api.sandbox.webull.com"
BASE = "https://" + HOST
SERVICE = "portfolio.webull-sandbox"
PATHS = {
    "accounts": "/trading/accounts/list",
    "balances": "/trading/assets/balances/get",
    "positions": "/trading/assets/positions/list",
    "working": "/trading/orders/open-orders/list",
    "history": "/trading/orders/historical-orders/list",
    "detail": "/trading/orders/get",
    "cash": "/trading/activities/cash-activities/list",
}
FACTORIES = {"accounts": GetAccountListRequest, "balances": AccountBalanceRequest,
             "positions": AccountPositionsRequest, "working": OrderOpenRequestV2,
             "history": OrderHistoryRequestV2, "detail": OrderDetailRequest, "cash": GetActivitiesRequestV2}
PAGED = {"working", "history", "cash"}
MAX_PAGES, MAX_RECORDS, MAX_DETAILS = 20, 2000, 20
ROOT = Path.home() / "Library/Application Support/Wheelwright/webull-paper-identity"
VERIFIED_RUN = ROOT / "20261106T185745.422065Z"
MAX_BYTES = 2_000_000


class AuditError(Exception):
    """Only preselected, non-sensitive messages may cross the CLI boundary."""


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def validate_request(method, url, body=None):
    parsed = urlsplit(url)
    if (method != "GET" or parsed.scheme != "https" or parsed.netloc != HOST
            or parsed.path not in PATHS.values() or parsed.fragment or body):
        raise AuditError("Sandbox read-only request rejected.")
    pairs = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
    kind = next(k for k, v in PATHS.items() if v == parsed.path)
    required = set() if kind == "accounts" else {"account_id"}
    optional = {"pagination_key"} if kind in PAGED else set()
    if kind in ("history", "cash"):
        required |= {"start_time", "end_time"}
    if kind == "detail":
        required.add("client_order_id")
    values = dict(pairs)
    if len(values) != len(pairs) or not required <= values.keys() or values.keys() - required - optional:
        raise AuditError("Unexpected query parameters rejected.")
    for key in ("account_id", "client_order_id"):
        if key in values and not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", values[key]):
            raise AuditError("Invalid provider reference.")
    if "pagination_key" in values and not re.fullmatch(r"[!-~]{1,4096}", values["pagination_key"]):
        raise AuditError("Invalid pagination cursor.")
    if kind in ("history", "cash"):
        try:
            canonical = window(values["start_time"], values["end_time"], cash=kind == "cash")
            if canonical != (values["start_time"], values["end_time"]):
                raise RecordError()
        except RecordError:
            raise AuditError("Invalid or noncanonical bounded history window.") from None


class SandboxSession(requests.Session):
    """The final prepared request is checked immediately before network I/O."""
    def __init__(self):
        super().__init__()
        self.trust_env = False

    def send(self, request, **kwargs):
        validate_request(request.method, request.url, request.body)
        if request.headers.get("Host", HOST) != HOST:
            raise AuditError("Host override rejected.")
        # No ambient proxy, netrc, redirects, custom CA override or SDK retries.
        kwargs.update(allow_redirects=False, verify=True, proxies={}, timeout=(5, 15), stream=True)
        return super().send(request, **kwargs)


def load_credentials(run=subprocess.run):
    values = []
    for account in ("app-key", "app-secret"):
        try:
            result = run(["/usr/bin/security", "find-generic-password", "-s", SERVICE,
                          "-a", account, "-w"], capture_output=True, text=True,
                         timeout=15, check=False)
        except (OSError, subprocess.SubprocessError, UnicodeError):
            raise AuditError("Keychain read failed; no request sent.") from None
        value = result.stdout.strip()
        if result.returncode or not re.fullmatch(r"[!-~]{1,4096}", value):
            raise AuditError("Webull Sandbox Keychain item unavailable or invalid.")
        values.append(value)
    return tuple(values)


def secret_free(value, secrets):
    """Reject credential echoes, including JSON-escaped echoes, before retention."""
    if isinstance(value, str):
        return not any(secret in value for secret in secrets)
    if isinstance(value, list):
        return all(secret_free(item, secrets) for item in value)
    if isinstance(value, dict):
        return all(not any(word in str(key).lower() for word in
                           ("token", "secret", "password", "authorization", "credential", "signature", "app_key"))
                   and secret_free(key, secrets) and secret_free(item, secrets)
                   for key, item in value.items())
    return True


def private_directory(path):
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    if path.is_symlink() or path.stat().st_uid != os.getuid() or path.stat().st_mode & 0o077:
        raise AuditError("Evidence directory must be owner-only (0700).")


def retain(path, content):
    # Exclusive creation: never replace earlier acquisition evidence or follow symlinks.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(content)


def account_rows(document):
    # SDK examples specify a top-level account array. Unknown schemas fail closed.
    if not isinstance(document, list):
        raise AuditError("Unrecognized account-list schema; inspect private evidence.")
    ids = []
    for row in document:
        if not isinstance(row, dict) or not isinstance(row.get("account_id"), str):
            raise AuditError("Missing account identity; inspect private evidence.")
        ref = row["account_id"]
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", ref) or ref in ids:
            raise AuditError("Invalid or duplicate account identity.")
        ids.append(ref)
    if len(ids) > 10:
        raise AuditError("Account count exceeds this pilot's bounded scope.")
    return document


def require_unpaginated(document):
    # The three SDK request builders do not document cursor setters. Never invent
    # cursor parameters or silently call a first page a complete portfolio.
    if isinstance(document, dict):
        for name in ("pagination_key", "next_page_token", "next_cursor", "has_more"):
            if document.get(name):
                raise AuditError("Pagination requires supported schema verification; evidence is incomplete.")
        for value in document.values():
            require_unpaginated(value)
    elif isinstance(document, list):
        for value in document:
            require_unpaginated(value)


def balances_summary(document):
    if not isinstance(document, dict):
        raise AuditError("Unrecognized balance schema; inspect private evidence.")
    result = {"currency": document.get("total_asset_currency")}
    for source, target in (("total_cash_balance", "cash"),
                           ("total_net_liquidation_value", "net_liquidation_value"),
                           ("total_market_value", "market_value")):
        value = document.get(source)
        if value is None:
            result[target] = None
            continue
        try:
            parsed = Decimal(str(value))
        except InvalidOperation:
            raise AuditError("Invalid reported balance.") from None
        if not parsed.is_finite():
            raise AuditError("Non-finite reported balance.")
        result[target] = parsed
    return result


def position_rows(document):
    if not isinstance(document, list) or any(not isinstance(row, dict) for row in document):
        raise AuditError("Unrecognized position schema; inspect private evidence.")
    # Preserve broker-native quantities/contract fields. Never manufacture a 100
    # multiplier, parse contracts from symbol guesses, or coerce missing facts to zero.
    return document


def compare_identity(accounts, balances, desktop_number, desktop_nav):
    """Exact broker account NUMBER comparison, not internal API account_id.

    Desktop inputs are independently observed evidence; never populate from API.
    Balances are keyed by API account_id. Missing/delayed facts remain unresolved.
    """
    if not isinstance(desktop_number, str) or not desktop_number:
        return "UNRESOLVED"
    if any(not isinstance(a.get("account_number"), str) for a in accounts):
        return "UNRESOLVED"
    matched = [a for a in accounts if a["account_number"] == desktop_number]
    if not matched:
        return "DIFFERENT ACCOUNT" if accounts else "UNRESOLVED"
    if len(matched) != 1:
        return "UNRESOLVED"
    account = matched[0]
    observed = balances.get(account["account_id"])
    if account.get("account_class") != "INDIVIDUAL_CASH" or observed is None:
        return "UNRESOLVED"
    summary = balances_summary(observed)
    try:
        expected_nav = Decimal(str(desktop_nav))
    except InvalidOperation:
        return "UNRESOLVED"
    return ("SAME ACCOUNT" if expected_nav.is_finite() and summary["currency"] == "USD"
            and summary["net_liquidation_value"] == expected_nav else "UNRESOLVED")


class IdentityReader:
    def __init__(self, key, secret, evidence, session=None):
        self._secrets = (key, secret)
        self._signer = SignerFactory.get_signer({"app_key": key, "app_secret": secret, "credential": None})
        self._session = session or SandboxSession()
        self._evidence = evidence
        self._sequence = 0

    def _read(self, kind, account_id=None, **parameters):
        if kind not in FACTORIES or (kind == "accounts") != (account_id is None):
            raise AuditError("Read operation rejected.")
        request = FACTORIES[kind]()
        if account_id is not None:
            request.set_account_id(account_id)
        for name, value in parameters.items():
            setter = getattr(request, "set_" + name, None)
            if setter is None:
                raise AuditError("Unsupported SDK query parameter.")
            setter(value)
        request.set_endpoint(HOST)
        url = BASE + PATHS[kind]
        prepared = requests.Request("GET", url, params=request.get_query_params()).prepare()
        validate_request(prepared.method, prepared.url, prepared.body)
        if request.get_method() != "GET" or request.get_action_name() != PATHS[kind]:
            raise AuditError("SDK request contract changed; refused.")
        headers = self._signer.sign(request)
        prepared.headers.update(headers)
        prepared.headers["User-Agent"] = "Wheelwright-Webull-paper-identity/1"
        signing_secrets = self._secrets + tuple(str(v) for k, v in headers.items()
                                               if k.lower() in ("x-signature", "x-access-token"))
        self._sequence += 1
        prefix = f"{self._sequence:02d}-{kind}"
        meta = {"operation": kind, "host": HOST, "started_at": utc_now(), "method": "GET",
                "query": dict(request.get_query_params())}
        try:
            with self._session.send(prepared) as response:
                meta["http_status"] = response.status_code
                chunks, size = [], 0
                for chunk in response.iter_content(65536):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise AuditError("Response too large; stopped without retry.")
                    chunks.append(chunk)
                body = b"".join(chunks)
                try:
                    document = json.loads(body)
                except (ValueError, UnicodeError):
                    raise AuditError("Non-JSON response; stopped without retry.") from None
                if not secret_free(document, signing_secrets):
                    raise AuditError("Response contained authentication material; body not retained.")
                retain(self._evidence / (prefix + ".json"), body)
                meta["body_sha256"] = hashlib.sha256(body).hexdigest()
                if response.status_code != 200:
                    raise AuditError(f"Sandbox HTTP {response.status_code}; stopped without retry. Inspect private evidence.")
                if kind not in PAGED:
                    require_unpaginated(document)
                return document
        except requests.RequestException:
            raise AuditError("Sandbox transport failed; stopped without retry.") from None
        finally:
            meta["finished_at"] = utc_now()
            retain(self._evidence / (prefix + "-metadata.json"), json.dumps(meta, indent=2).encode())

    def accounts(self):
        return account_rows(self._read("accounts"))

    def balances(self, account_id):
        document = self._read("balances", account_id)
        balances_summary(document)
        return document

    def positions(self, account_id):
        return position_rows(self._read("positions", account_id))

    def _pages(self, kind, account_id, **parameters):
        if kind not in PAGED:
            raise AuditError("Paginated operation rejected.")
        rows, seen, receipts = [], set(), []
        for _ in range(MAX_PAGES):
            document = self._read(kind, account_id, **parameters)
            items, cursor = page(document)
            rows.extend(items)
            receipts.append({"request_sequence": self._sequence, "count": len(items),
                             "has_next_page": bool(cursor)})
            if len(rows) > MAX_RECORDS:
                raise AuditError("Record bound reached; retained pages are incomplete.")
            if not cursor:
                return {"data": rows, "pages": receipts, "complete_for_query": True}
            if cursor in seen:
                raise AuditError("Repeated pagination cursor; retained pages are incomplete.")
            seen.add(cursor)
            parameters["pagination_key"] = cursor
        raise AuditError("Page bound reached; retained pages are incomplete.")

    def working_orders(self, account_id):
        return self._pages("working", account_id)

    def historical_orders(self, account_id, start, end):
        start, end = window(start, end)
        return self._pages("history", account_id, start_time=start, end_time=end)

    def cash_activities(self, account_id, start, end):
        start, end = window(start, end, cash=True)
        return self._pages("cash", account_id, start_time=start, end_time=end)

    def order_detail(self, account_id, client_order_id):
        return self._read("detail", account_id, client_order_id=client_order_id)


def verified_account(accounts, prior_accounts, desktop):
    number = desktop.get("account_number")
    if not isinstance(number, str) or not number:
        raise AuditError("Prior verified Desktop account number is unavailable.")
    prior = [a for a in prior_accounts if a.get("account_number") == number
             and a.get("account_class") == "INDIVIDUAL_CASH"]
    if len(prior) != 1:
        raise AuditError("Prior verified account anchor is unavailable.")
    matching = [a for a in accounts if a.get("account_id") == prior[0]["account_id"]
                and a.get("account_number") == number and a.get("account_class") == "INDIVIDUAL_CASH"]
    if len(matching) != 1:
        raise AuditError("Previously verified account is not uniquely present; stopped.")
    return matching[0]["account_id"]


def collect_activity(reader, ref, start, end):
    """Independent reads: preserve partial evidence while reporting any failure.

    No caller-supplied order IDs: details are limited to IDs actually enumerated
    in this observation. Working/history snapshots are never added as cash flows.
    """
    start, end = window(start, end, cash=True)
    summary = {"account_id": ref, "start_time": start, "end_time": end,
               "started_at": utc_now(), "operations": {}, "details": []}
    clients = set()
    operations = {
        "balances": lambda: reader.balances(ref), "positions": lambda: reader.positions(ref),
        "working": lambda: reader.working_orders(ref),
        "history": lambda: reader.historical_orders(ref, start, end),
        "cash": lambda: reader.cash_activities(ref, start, end),
    }
    for name, read in operations.items():
        try:
            result = read()
            if name in ("working", "history"):
                records = order_records(result["data"], ref)
                for group in result["data"]:
                    for item in [group] + group["orders"]:
                        cid = item.get("client_order_id")
                        if isinstance(cid, str) and cid:
                            clients.add(cid)
                result["normalized_orders"] = records
            elif name == "cash":
                result["normalized_activities"] = cash_records(result["data"], ref)
            summary["operations"][name] = {"status": "OBSERVED", "result": result}
        except (AuditError, RecordError) as error:
            summary["operations"][name] = {"status": "FAILED", "reason": str(error)}
    if len(clients) > MAX_DETAILS:
        summary["details_status"] = "INCOMPLETE: detail count exceeds this pilot's bound"
    else:
        summary["details_status"] = "NOT EXERCISED: no observed client order IDs" if not clients else "OBSERVED"
        for cid in sorted(clients):
            try:
                detail = reader.order_detail(ref, cid)
                records = order_records([detail], ref)
                summary["details"].append({"status": "OBSERVED", "client_order_id": cid,
                                           "provider": detail, "normalized_orders": records})
            except (AuditError, RecordError) as error:
                summary["details"].append({"status": "FAILED", "client_order_id": cid, "reason": str(error)})
        if any(item["status"] == "FAILED" for item in summary["details"]):
            summary["details_status"] = "INCOMPLETE: one or more detail reads failed"
    summary["finished_at"] = utc_now()
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--observe", action="store_true", help="Perform the original Sandbox identity reads")
    modes.add_argument("--activity", action="store_true", help="Observe orders/cash for the previously verified paper account")
    parser.add_argument("--start", help="Explicit ISO8601 window start, with timezone")
    parser.add_argument("--end", help="Explicit ISO8601 window end, with timezone")
    args = parser.parse_args()
    if not args.observe and not args.activity:
        parser.print_help()
        return 2
    try:
        if args.activity:
            start, end = window(args.start, args.end, cash=True)
        elif args.start is not None or args.end is not None:
            raise AuditError("History windows require --activity.")
        private_directory(ROOT)
        evidence = ROOT / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        evidence.mkdir(mode=0o700)
        key, secret = load_credentials()
        reader = IdentityReader(key, secret, evidence)
        accounts = reader.accounts()
        if args.activity:
            prior = json.loads((VERIFIED_RUN / "01-accounts.json").read_bytes())
            desktop = json.loads((VERIFIED_RUN / "desktop-observation.json").read_bytes())
            ref = verified_account(accounts, prior, desktop)
            result = collect_activity(reader, ref, start, end)
            if not secret_free(result, (key, secret)):
                raise AuditError("Normalized result contains authentication material; not retained.")
            retain(evidence / "activity-observation.json", json.dumps(result, indent=2).encode())
            print(f"Window UTC: {start} through {end}")
            for name, entry in result["operations"].items():
                count = len(entry["result"]["data"]) if name in PAGED and entry["status"] == "OBSERVED" else None
                print(f"{name}: {entry['status']}" + (f"; objects: {count}" if count is not None else ""))
            print(f"Order detail status: {result['details_status']}; requests: {len(result['details'])}. Desktop order reconciliation: UNRESOLVED.")
            print(f"Private evidence: {evidence}")
            failed = any(e["status"] == "FAILED" for e in result["operations"].values())
            failed |= any(e["status"] == "FAILED" for e in result["details"])
            failed |= result["details_status"].startswith("INCOMPLETE")
            return 1 if failed else 0
        for number, account in enumerate(accounts, 1):
            ref = account["account_id"]
            reader.balances(ref)
            reader.positions(ref)
            # No upstream strings (including IDs) are printed. Compare privately.
            print(f"Paper API account {number}: balances and positions retained.")
        print(f"Account count: {len(accounts)}. Identity verdict: UNRESOLVED pending Desktop comparison.")
        print(f"Private evidence: {evidence}")
        return 0
    except (AuditError, RecordError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print("Acquisition stopped; inspect the local configuration and private evidence. No automatic retry.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
