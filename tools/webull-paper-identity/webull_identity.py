"""Bounded Portfolio account-identity acquisition. No trading or token creation."""
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
}
ROOT = Path.home() / "Library/Application Support/Wheelwright/webull-paper-identity"
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
    expected = [] if parsed.path == PATHS["accounts"] else ["account_id"]
    if sorted(k for k, _ in pairs) != expected:
        raise AuditError("Unexpected query parameters rejected.")
    if pairs and not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", pairs[0][1]):
        raise AuditError("Invalid account reference.")


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

    def _read(self, kind, account_id=None):
        factory = {"accounts": GetAccountListRequest, "balances": AccountBalanceRequest,
                   "positions": AccountPositionsRequest}
        if kind not in factory or (kind == "accounts") != (account_id is None):
            raise AuditError("Read operation rejected.")
        request = factory[kind]()
        if account_id is not None:
            request.set_account_id(account_id)
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
        meta = {"operation": kind, "host": HOST, "started_at": utc_now(), "method": "GET"}
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observe", action="store_true", help="Perform the authorized Sandbox account reads")
    args = parser.parse_args()
    if not args.observe:
        parser.print_help()
        return 2
    try:
        private_directory(ROOT)
        evidence = ROOT / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        evidence.mkdir(mode=0o700)
        key, secret = load_credentials()
        reader = IdentityReader(key, secret, evidence)
        accounts = reader.accounts()
        for number, account in enumerate(accounts, 1):
            ref = account["account_id"]
            reader.balances(ref)
            reader.positions(ref)
            # No upstream strings (including IDs) are printed. Compare privately.
            print(f"Paper API account {number}: balances and positions retained.")
        print(f"Account count: {len(accounts)}. Identity verdict: UNRESOLVED pending Desktop comparison.")
        print(f"Private evidence: {evidence}")
        return 0
    except AuditError as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print("Acquisition stopped; inspect the local configuration and private evidence. No automatic retry.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
