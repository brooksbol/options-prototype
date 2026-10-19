#!/usr/bin/env python3
"""Structural checker for the 4AM first knowledge-assimilation slice.

Dependency-free (standard library + git CLI). Validates that maintained
knowledge destinations, anchors, navigation and the assimilation-obligation
ledger are structurally sound.

It does NOT establish semantic correctness. A pass means the structure is
coherent; it does not mean the domain meaning is right.

Usage:
  python3 scripts/check-knowledge-slice.py --local
  python3 scripts/check-knowledge-slice.py --self-test
  python3 scripts/check-knowledge-slice.py --remote <accepted-main-sha>
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from typing import Callable, Optional

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LEDGER = "docs/assimilation-obligations.md"
KNOWLEDGE_INDEX = "docs/knowledge/README.md"
ACCOUNTS_PAGE = "docs/knowledge/domain/accounts-and-operating-regimes.md"
POSITIONS_PAGE = "docs/knowledge/domain/positions-and-governed-quantity.md"
VERIFICATION = "docs/discovery/4am-first-knowledge-slice-verification.md"

REQUIRED_FILES = [LEDGER, KNOWLEDGE_INDEX, ACCOUNTS_PAGE, POSITIONS_PAGE, VERIFICATION]

REQUIRED_ANCHORS = {
    ACCOUNTS_PAGE: [
        "does-an-account-determine-its-operating-regime",
        "account",
        "account-accounting-execution-context",
        "operating-regime",
    ],
    POSITIONS_PAGE: [
        "position",
        "unresolved-position-identity",
        "governed-quantity",
        "option-cohorts",
    ],
}

# Entry points that must route to maintained knowledge and the ledger.
ROUTING_FILES = [
    "AGENTS.md",
    "docs/AGENTS.md",
    "docs/README.md",
    "docs/bootstrap/kiro-cold-start.md",
    "docs/bootstrap/codex-cold-start.md",
    "docs/bootstrap/chatgpt-cold-start.md",
    "docs/bootstrap/project-memory-protocol.md",
]
STEERING_ROUTING_FILES = [
    ".kiro/steering/architecture.md",
    ".kiro/steering/domain-vocabulary.md",
    ".kiro/steering/project-identity.md",
    ".kiro/steering/engineering-methodology.md",
]

# Files whose relative markdown links must resolve.
LINK_CHECK_FILES = [
    LEDGER, KNOWLEDGE_INDEX, ACCOUNTS_PAGE, POSITIONS_PAGE, VERIFICATION,
    "docs/07-architecture-current.md",
]

DISCLOSURE_SCAN_FILES = REQUIRED_FILES + STEERING_ROUTING_FILES

REQUIRED_FIELDS = [
    "ASSIM-ID", "ASSIM-STATE", "ASSIM-SUBJECTS", "ASSIM-DEPENDS", "ASSIM-HANDOFF",
    "ASSIM-SOURCES", "ASSIM-DESTINATION", "ASSIM-RECEIVER", "ASSIM-RESOLVER",
    "ASSIM-PERMISSION", "ASSIM-RESUME", "ASSIM-CLOSURE",
]
STATES = {"PENDING", "READY", "APPLIED", "VERIFIED", "CANCELLED"}
PLACEHOLDER = re.compile(r"^\s*(|none|unknown|tbd|n/?a|\?|-)\s*$", re.I)
REVISION_REF = re.compile(r"^(?P<path>[^\s#@]+)(?:#(?P<anchor>[^\s@]+))?\s*@\s*(?P<sha>[0-9a-f]{40})\b")
SELF_ATTEST = re.compile(r"\b(self[- ]?attest\w*|self[- ]?verified|implementer confirms)\b", re.I)

# Protected-information heuristics (supplements human inspection; never replaces it).
DISCLOSURE_PATTERNS = [
    ("broker-account-number-like", re.compile(r"\b[A-Z]\d{8}\b")),
    ("long-digit-run", re.compile(r"(?<![0-9a-f])\d{9,}(?![0-9a-f])")),
    ("bearer/api-key-like", re.compile(r"\b(?:Bearer\s+[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,})")),
    ("tradier-key-assignment", re.compile(r"TRADIER_API_KEY\s*=\s*\S+")),
]

Reader = Callable[[str], Optional[str]]
RevChecker = Callable[[str, str], Optional[str]]  # (sha, path) -> content at revision or None


# ---------------------------------------------------------------- parsing

def slugify(heading: str) -> str:
    """GitHub-style heading anchor."""
    s = heading.strip().lower()
    s = re.sub(r"[`*_]", "", s)
    s = re.sub(r"[^\w\- ]", "", s)
    return s.replace(" ", "-")


def anchors_in(text: str) -> set[str]:
    found = set(re.findall(r'<a id="([^"]+)"', text))
    in_fence = False
    counts: dict[str, int] = {}
    for line in text.splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r"^#{1,6}\s+(.*)$", line)
        if m:
            slug = slugify(m.group(1))
            n = counts.get(slug, 0)
            found.add(slug if n == 0 else f"{slug}-{n}")
            counts[slug] = n + 1
    return found


def fenced_blocks(text: str) -> list[dict[str, str]]:
    blocks = []
    for body in re.findall(r"```text\n(.*?)```", text, re.S):
        fields: dict[str, str] = {}
        for line in body.splitlines():
            m = re.match(r"^([A-Z][A-Z-]+):\s?(.*)$", line)
            if m:
                fields[m.group(1)] = m.group(2).strip()
        if fields:
            blocks.append(fields)
    return blocks


def parse_ledger(text: str):
    blocks = fenced_blocks(text)
    entries = [b for b in blocks if "ASSIM-ID" in b]
    receipts = [b for b in blocks if "HANDOFF-ID" in b]
    return entries, receipts


# ---------------------------------------------------------------- checks

def check_ledger(text: str, rev: Optional[RevChecker]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    if "<!-- ASSIMILATION-LEDGER v1 -->" not in text:
        errors.append("LEDGER-MARKER: ledger marker missing")
    entries, receipts = parse_ledger(text)
    if not entries:
        errors.append("LEDGER-EMPTY: no ASSIM entries found")

    ids = [e.get("ASSIM-ID", "") for e in entries]
    for i in ids:
        if not re.fullmatch(r"ASSIM-\d{4}", i):
            errors.append(f"ID-FORMAT: {i!r} is not ASSIM-NNNN")
    dupes = {i for i in ids if ids.count(i) > 1}
    for d in sorted(dupes):
        errors.append(f"ID-DUPLICATE: {d}")

    receipt_ids = {r.get("HANDOFF-ID") for r in receipts}
    by_id = {e.get("ASSIM-ID"): e for e in entries}

    for e in entries:
        eid = e.get("ASSIM-ID", "?")
        for f in REQUIRED_FIELDS:
            if f not in e:
                errors.append(f"FIELD-MISSING: {eid} lacks {f}")
        state = e.get("ASSIM-STATE", "")
        if state not in STATES:
            errors.append(f"STATE-INVALID: {eid} state {state!r}")
        if "ASSIM-RECEIVER" in e and PLACEHOLDER.match(e["ASSIM-RECEIVER"]):
            errors.append(f"RECEIVER-MISSING: {eid} has no named receiver")
        if "ASSIM-RESUME" in e and PLACEHOLDER.match(e["ASSIM-RESUME"]) and state in {"PENDING", "READY"}:
            errors.append(f"RESUME-MISSING: {eid} open without resume trigger")
        h = e.get("ASSIM-HANDOFF", "")
        if h and h.lower() != "none" and h not in receipt_ids:
            errors.append(f"HANDOFF-UNKNOWN: {eid} references {h} with no receipt")
        dep = e.get("ASSIM-DEPENDS", "")
        for d in re.findall(r"ASSIM-\d{4}", dep):
            if d not in by_id:
                errors.append(f"DEPENDS-UNKNOWN: {eid} depends on missing {d}")

        if state in {"APPLIED", "VERIFIED"}:
            applied = e.get("ASSIM-APPLIED", "")
            m = REVISION_REF.match(applied)
            if not m:
                errors.append(f"APPLIED-REVISION-MISSING: {eid} {state} without path#anchor @ <40-hex sha>")
            elif rev is not None:
                content = rev(m.group("sha"), m.group("path"))
                if content is None:
                    errors.append(f"APPLIED-REVISION-ABSENT: {eid} target {m.group('path')} not found at {m.group('sha')[:12]}")
                elif m.group("anchor") and m.group("anchor") not in anchors_in(content):
                    errors.append(f"APPLIED-ANCHOR-ABSENT: {eid} anchor #{m.group('anchor')} not at {m.group('sha')[:12]}")
        if state == "VERIFIED":
            w = e.get("ASSIM-WITNESS", "")
            wm = REVISION_REF.match(w)
            if PLACEHOLDER.match(w) or not wm:
                errors.append(f"CLOSURE-UNSUPPORTED: {eid} VERIFIED without witness path @ sha")
            elif SELF_ATTEST.search(w):
                errors.append(f"CLOSURE-UNSUPPORTED: {eid} witness is self-attestation")
            elif rev is not None and rev(wm.group("sha"), wm.group("path")) is None:
                errors.append(f"WITNESS-ABSENT: {eid} witness {wm.group('path')} not found at {wm.group('sha')[:12]}")
        if state == "CANCELLED" and PLACEHOLDER.match(e.get("ASSIM-CANCELLED", "")):
            errors.append(f"CANCEL-UNSUPPORTED: {eid} CANCELLED without evidenced disposition")
        if state in {"PENDING", "READY"}:
            notes.append(f"OPEN: {eid} {state} — {e.get('ASSIM-SUBJECTS', '')}")

    for r in receipts:
        rid = r.get("HANDOFF-ID", "?")
        rstate = r.get("HANDOFF-STATE", "")
        if PLACEHOLDER.match(r.get("HANDOFF-RECEIVER", "")):
            errors.append(f"RECEIPT-RECEIVER-MISSING: {rid}")
        mapping = re.findall(r"ASSIM-\d{4}", r.get("HANDOFF-MAPPING", ""))
        if rstate == "EXPECTED":
            notes.append(f"MISSING-SUBMISSION: {rid} EXPECTED, payload not yet received")
            continue
        if rstate != "RECEIVED":
            errors.append(f"RECEIPT-STATE-INVALID: {rid} {rstate!r}")
            continue
        try:
            expected = int(r.get("HANDOFF-EXPECTED-COUNT", "x"))
        except ValueError:
            errors.append(f"RECEIPT-COUNT-MISSING: {rid}")
            continue
        if expected != len(mapping):
            errors.append(f"RECEIPT-COUNT-MISMATCH: {rid} expected {expected}, mapped {len(mapping)}")
        for a in mapping:
            if a not in by_id:
                errors.append(f"RECEIPT-MAPPING-UNKNOWN: {rid} maps missing {a}")
            elif by_id[a].get("ASSIM-HANDOFF") != rid:
                errors.append(f"RECEIPT-MAPPING-MISMATCH: {rid} maps {a}, which names {by_id[a].get('ASSIM-HANDOFF')}")
    return errors, notes


def check_links(path: str, text: str, read: Reader) -> list[str]:
    errors = []
    base = os.path.dirname(path)
    for target in re.findall(r"\]\(([^)\s]+)\)", text):
        if re.match(r"^[a-z]+://", target) or target.startswith("mailto:"):
            continue
        file_part, _, anchor = target.partition("#")
        dest = path if not file_part else os.path.normpath(os.path.join(base, file_part))
        content = read(dest)
        if content is None:
            if read(dest.rstrip("/") + "/README.md") is None:
                errors.append(f"LINK-BROKEN: {path} -> {target}")
            continue
        if anchor and dest.endswith(".md") and anchor not in anchors_in(content):
            errors.append(f"ANCHOR-BROKEN: {path} -> {target}")
    return errors


def check_routing(read: Reader) -> list[str]:
    errors = []
    for f in ROUTING_FILES:
        t = read(f)
        if t is None:
            errors.append(f"ROUTING-FILE-MISSING: {f}")
            continue
        if "knowledge/README.md" not in t and "knowledge/" not in t:
            errors.append(f"ROUTING-KNOWLEDGE-MISSING: {f}")
        if "assimilation-obligations.md" not in t and f not in ("docs/bootstrap/codex-cold-start.md",):
            errors.append(f"ROUTING-LEDGER-MISSING: {f}")
    for f in STEERING_ROUTING_FILES:
        t = read(f)
        if t is None:
            errors.append(f"ROUTING-FILE-MISSING: {f}")
        elif "docs/knowledge/" not in t:
            errors.append(f"STEERING-ROUTING-MISSING: {f}")
    arch = read(".kiro/steering/architecture.md") or ""
    if re.search(r"^The backend must NOT: produce recommendations", arch, re.M):
        errors.append("STEERING-STALE: unscoped universal backend-recommendation prohibition")
    em = read(".kiro/steering/engineering-methodology.md") or ""
    if re.search(r"is the \*\*primary execution contract\*\*", em):
        errors.append("STEERING-STALE: suspended Shared Execution Contract described as primary")
    return errors


def check_disclosure(read: Reader) -> list[str]:
    errors = []
    for f in DISCLOSURE_SCAN_FILES:
        t = read(f)
        if t is None:
            continue
        # Commit SHAs and AH keys are hex; strip them before scanning.
        scrubbed = re.sub(r"\b[0-9a-f]{12,40}\b", "", t)
        for name, pat in DISCLOSURE_PATTERNS:
            for m in pat.finditer(scrubbed):
                errors.append(f"DISCLOSURE-{name}: {f}: {m.group(0)[:4]}…")
    return errors


def run_all(read: Reader, rev: Optional[RevChecker]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    for f in REQUIRED_FILES:
        if read(f) is None:
            errors.append(f"DESTINATION-MISSING: {f}")
    for page, anchors in REQUIRED_ANCHORS.items():
        t = read(page)
        if t is None:
            continue
        have = anchors_in(t)
        for a in anchors:
            if a not in have:
                errors.append(f"SUBJECT-ANCHOR-MISSING: {page}#{a}")
    for f in LINK_CHECK_FILES:
        t = read(f)
        if t is not None:
            errors += check_links(f, t, read)
    errors += check_routing(read)
    ledger = read(LEDGER)
    if ledger is not None:
        e, n = check_ledger(ledger, rev)
        errors += e
        notes += n
    errors += check_disclosure(read)
    return errors, notes


# ---------------------------------------------------------------- readers

def git(*args: str) -> Optional[str]:
    try:
        return subprocess.run(["git", "-C", REPO, *args], check=True, capture_output=True, text=True).stdout
    except subprocess.CalledProcessError:
        return None


def git_rev_reader(sha: str, path: str) -> Optional[str]:
    return git("show", f"{sha}:{path}")


def local_reader(path: str) -> Optional[str]:
    full = os.path.join(REPO, path)
    if os.path.isfile(full):
        with open(full, encoding="utf-8") as fh:
            return fh.read()
    return None


def remote_mode(sha: str) -> int:
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        print("ERROR: --remote requires a full 40-hex commit SHA")
        return 2
    remote_line = subprocess.run(["git", "-C", REPO, "ls-remote", "origin", "refs/heads/main"],
                                 capture_output=True, text=True).stdout.split()
    if not remote_line:
        print("ERROR: could not read remote main")
        return 2
    remote_main = remote_line[0]
    if git("fetch", "-q", "origin", "main") is None:
        print("ERROR: fetch failed")
        return 2
    if git("merge-base", "--is-ancestor", sha, remote_main) is None:
        print(f"ERROR: {sha[:12]} is not contained in accepted remote main {remote_main[:12]}")
        return 1
    print(f"Accepted remote main: {remote_main}  (checking objects at {sha})")
    return report(*run_all(lambda p: git_rev_reader(sha, p), git_rev_reader))


def report(errors: list[str], notes: list[str]) -> int:
    for n in notes:
        print(f"  note  {n}")
    for e in errors:
        print(f"  FAIL  {e}")
    print(("PASS" if not errors else f"FAIL ({len(errors)} errors)") +
          " — structural only; semantic correctness is not established by this check.")
    return 0 if not errors else 1


# ---------------------------------------------------------------- self-test

def _entry(**over: str) -> dict[str, str]:
    base = {
        "ASSIM-ID": "ASSIM-0001", "ASSIM-STATE": "PENDING", "ASSIM-SUBJECTS": "account",
        "ASSIM-DEPENDS": "none", "ASSIM-HANDOFF": "AH-000000000000", "ASSIM-SOURCES": "docs/x.md",
        "ASSIM-DESTINATION": "docs/knowledge/x.md", "ASSIM-RECEIVER": "Kiro",
        "ASSIM-RESOLVER": "Principal", "ASSIM-PERMISSION": "docs only",
        "ASSIM-RESUME": "page exists", "ASSIM-CLOSURE": "witness recorded",
    }
    base.update(over)
    return {k: v for k, v in base.items() if v is not None and v != "<drop>"}


def _ledger(entries: list[dict[str, str]], receipt: Optional[dict[str, str]] = None) -> str:
    receipt = receipt if receipt is not None else {
        "HANDOFF-ID": "AH-000000000000", "HANDOFF-STATE": "RECEIVED", "HANDOFF-RECEIVER": "Kiro",
        "HANDOFF-EXPECTED-COUNT": str(len(entries)),
        "HANDOFF-MAPPING": "; ".join(e["ASSIM-ID"] for e in entries),
    }
    parts = ["<!-- ASSIMILATION-LEDGER v1 -->", "```text\n" + "\n".join(f"{k}: {v}" for k, v in receipt.items()) + "\n```"]
    for e in entries:
        parts.append("```text\n" + "\n".join(f"{k}: {v}" for k, v in e.items()) + "\n```")
    return "\n\n".join(parts)


SHA = "a" * 40


def _rev(sha: str, path: str) -> Optional[str]:
    return '<a id="good"></a>\n# T\n' if sha == SHA and path.startswith("docs/") else None


def self_test() -> int:
    cases: list[tuple[str, str, Optional[str]]] = [
        ("valid pending ledger", _ledger([_entry()]), None),
        ("valid verified ledger", _ledger([_entry(**{"ASSIM-STATE": "VERIFIED",
            "ASSIM-APPLIED": f"docs/k.md#good @ {SHA}", "ASSIM-WITNESS": f"docs/v.md @ {SHA}"})]), None),
        ("duplicate IDs", _ledger([_entry(), _entry()]), "ID-DUPLICATE"),
        ("bad ID format", _ledger([_entry(**{"ASSIM-ID": "ASSIM-1"})]), "ID-FORMAT"),
        ("missing required field", _ledger([_entry(**{"ASSIM-CLOSURE": "<drop>"})]), "FIELD-MISSING"),
        ("missing receiver", _ledger([_entry(**{"ASSIM-RECEIVER": "unknown"})]), "RECEIVER-MISSING"),
        ("invalid state", _ledger([_entry(**{"ASSIM-STATE": "DONE"})]), "STATE-INVALID"),
        ("applied without revision", _ledger([_entry(**{"ASSIM-STATE": "APPLIED", "ASSIM-APPLIED": "docs/k.md"})]),
         "APPLIED-REVISION-MISSING"),
        ("applied revision absent", _ledger([_entry(**{"ASSIM-STATE": "APPLIED",
            "ASSIM-APPLIED": f"docs/k.md @ {'b' * 40}"})]), "APPLIED-REVISION-ABSENT"),
        ("applied anchor absent", _ledger([_entry(**{"ASSIM-STATE": "APPLIED",
            "ASSIM-APPLIED": f"docs/k.md#nope @ {SHA}"})]), "APPLIED-ANCHOR-ABSENT"),
        ("verified without witness", _ledger([_entry(**{"ASSIM-STATE": "VERIFIED",
            "ASSIM-APPLIED": f"docs/k.md @ {SHA}"})]), "CLOSURE-UNSUPPORTED"),
        ("verified self-attested", _ledger([_entry(**{"ASSIM-STATE": "VERIFIED",
            "ASSIM-APPLIED": f"docs/k.md @ {SHA}", "ASSIM-WITNESS": f"docs/v.md @ {SHA} self-attested"})]),
         "CLOSURE-UNSUPPORTED"),
        ("cancelled without evidence", _ledger([_entry(**{"ASSIM-STATE": "CANCELLED"})]), "CANCEL-UNSUPPORTED"),
        ("unknown handoff", _ledger([_entry(**{"ASSIM-HANDOFF": "AH-ffffffffffff"})]), "HANDOFF-UNKNOWN"),
        ("receipt count mismatch", _ledger([_entry()], {"HANDOFF-ID": "AH-000000000000",
            "HANDOFF-STATE": "RECEIVED", "HANDOFF-RECEIVER": "Kiro", "HANDOFF-EXPECTED-COUNT": "2",
            "HANDOFF-MAPPING": "ASSIM-0001"}), "RECEIPT-COUNT-MISMATCH"),
        ("receipt maps missing entry", _ledger([_entry()], {"HANDOFF-ID": "AH-000000000000",
            "HANDOFF-STATE": "RECEIVED", "HANDOFF-RECEIVER": "Kiro", "HANDOFF-EXPECTED-COUNT": "2",
            "HANDOFF-MAPPING": "ASSIM-0001; ASSIM-0009"}), "RECEIPT-MAPPING-UNKNOWN"),
        ("receipt without receiver", _ledger([_entry()], {"HANDOFF-ID": "AH-000000000000",
            "HANDOFF-STATE": "RECEIVED", "HANDOFF-RECEIVER": "", "HANDOFF-EXPECTED-COUNT": "1",
            "HANDOFF-MAPPING": "ASSIM-0001"}), "RECEIPT-RECEIVER-MISSING"),
        ("missing ledger marker", _ledger([_entry()]).replace("<!-- ASSIMILATION-LEDGER v1 -->", ""), "LEDGER-MARKER"),
    ]
    failures = 0
    for name, text, expect in cases:
        errors, _ = check_ledger(text, _rev)
        ok = (not errors) if expect is None else any(e.startswith(expect) for e in errors)
        failures += 0 if ok else 1
        print(f"  {'ok  ' if ok else 'BAD '} {name}: expected {expect or 'pass'}; got {errors[:2] or 'pass'}")

    # Missing-submission detection: EXPECTED receipt is surfaced as a note.
    _, notes = check_ledger(_ledger([_entry()], {"HANDOFF-ID": "AH-000000000000", "HANDOFF-STATE": "EXPECTED",
                                                  "HANDOFF-RECEIVER": "Kiro"}), _rev)
    ok = any(n.startswith("MISSING-SUBMISSION") for n in notes)
    failures += 0 if ok else 1
    print(f"  {'ok  ' if ok else 'BAD '} expected receipt surfaces missing submission")

    # Link, anchor, routing and disclosure fixtures.
    files = {
        "docs/a.md": "[x](b.md#there) [y](b.md#missing) [z](gone.md)",
        "docs/b.md": "# There\n",
    }
    link_errors = check_links("docs/a.md", files["docs/a.md"], files.get)
    ok = (any(e.startswith("ANCHOR-BROKEN") for e in link_errors)
          and any(e.startswith("LINK-BROKEN") for e in link_errors) and len(link_errors) == 2)
    failures += 0 if ok else 1
    print(f"  {'ok  ' if ok else 'BAD '} broken link and broken anchor detected ({len(link_errors)})")

    stale = {f: "docs/knowledge/README.md assimilation-obligations.md" for f in ROUTING_FILES + STEERING_ROUTING_FILES}
    stale[".kiro/steering/architecture.md"] += "\nThe backend must NOT: produce recommendations, rank candidates."
    r_errors = check_routing(stale.get)
    ok = any(e.startswith("STEERING-STALE") for e in r_errors)
    failures += 0 if ok else 1
    print(f"  {'ok  ' if ok else 'BAD '} stale universal steering rule detected")

    leak = {REQUIRED_FILES[0]: "account Z12345678 and commit " + SHA}
    d_errors = check_disclosure(leak.get)
    ok = len(d_errors) == 1 and "broker-account-number-like" in d_errors[0]
    failures += 0 if ok else 1
    print(f"  {'ok  ' if ok else 'BAD '} account-number-like identifier detected; commit SHA ignored")

    missing = run_all(lambda p: None, None)[0]
    ok = any(e.startswith("DESTINATION-MISSING") for e in missing)
    failures += 0 if ok else 1
    print(f"  {'ok  ' if ok else 'BAD '} missing maintained destinations detected")

    print("SELF-TEST " + ("PASS" if failures == 0 else f"FAIL ({failures})"))
    return 0 if failures == 0 else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--local", action="store_true", help="check the working tree")
    g.add_argument("--self-test", action="store_true", help="run bounded negative fixtures")
    g.add_argument("--remote", metavar="SHA", help="check objects at an accepted remote-main commit")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if a.remote:
        return remote_mode(a.remote)
    print("Local working tree")
    return report(*run_all(local_reader, git_rev_reader))


if __name__ == "__main__":
    sys.exit(main())
