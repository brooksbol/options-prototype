"""Offline coverage/provenance checks; no financial or execution authority."""

import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path

VERSION = "pr49-pr50-underlying-research/0.1-PROPOSED"
GROUPS = ("technical", "market", "volatility", "fundamentals", "catalysts")
OUTCOMES = ("BUY_RESEARCH", "WAIT", "EXCLUDED", "UNASSESSED")
ACQUISITION = ("OBSERVED", "PARTIAL", "FAILED", "NOT_ATTEMPTED")
ROSTER_IDENTITY = ("securityId", "issuerCik", "shareClass", "symbol", "listing", "currency")


class Refusal(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise Refusal(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def clock(value):
    require(nonempty(value), "Missing timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise Refusal("Invalid timestamp") from None
    require(parsed.tzinfo is not None and parsed.utcoffset() is not None,
            "Timestamp must include timezone")
    return parsed


def object_pairs(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "Duplicate JSON object key")
        result[key] = value
    return result


def read_json(path):
    return decode_json(path.read_bytes())


def decode_json(content):
    def invalid_constant(_):
        raise Refusal("Nonfinite JSON number")
    return json.loads(content, object_pairs_hook=object_pairs,
                      parse_constant=invalid_constant)


def checked_file(root, relative, expected_hash):
    require(nonempty(relative) and not Path(relative).is_absolute(),
            "Evidence path must be relative")
    require(isinstance(expected_hash, str) and len(expected_hash) == 64
            and all(c in "0123456789abcdef" for c in expected_hash),
            "Invalid SHA-256")
    path = (root / relative).resolve(strict=True)
    require(path.is_relative_to(root) and path.is_file(),
            "Evidence path escapes root or is not a file")
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    require(digest.hexdigest() == expected_hash, "Evidence digest mismatch")
    return path


def sources_for(cut, root, target):
    sources = {}
    require(isinstance(cut["sourceManifest"], list), "Manifest must be an array")
    for source in cut["sourceManifest"]:
        sid = source["id"]
        require(nonempty(sid) and sid not in sources, "Missing/duplicate source identity")
        checked_file(root, source["path"], source["sha256"])
        received = clock(source["receivedAt"])
        require(received <= target, "Evidence received after target knowledge cutoff")
        if source.get("sourceTime") is not None:
            require(clock(source["sourceTime"]) <= received, "Future source clock")
        sources[sid] = source
    return sources


def check_references(references, sources, produced, target):
    require(isinstance(references, list), "Evidence references must be an array")
    for reference in references:
        sid = reference["sourceId"]
        require(sid in sources, "Unresolved source reference")
        classification = reference["classification"]
        require(classification in ("DV", "HR", "U"), "Unknown evidence classification")
        recorded = clock(reference["recordedAt"])
        received = clock(sources[sid]["receivedAt"])
        require(received <= recorded <= produced, "Inconsistent evidence recording clock")
        if classification == "DV":
            decision = clock(reference["decisionAt"])
            require(recorded <= decision <= target,
                    "Later evidence cannot be decision-time verified")


def check_member(member, sources, method, produced, target, roster):
    identity = member["identity"]
    for field in ("securityId", "issuerCik", "shareClass", "symbol", "listing",
                  "currency", "mappingStatus", "mappingVersion", "gicsSector",
                  "classificationSourceVersion", "brokerContractId"):
        require(field in identity, "Missing security identity field: " + field)
    require(nonempty(identity["securityId"]), "Missing security identity")
    require(identity["securityId"] in roster, "Security absent from roster")
    require(all(identity[field] == roster[identity["securityId"]][field]
                for field in ROSTER_IDENTITY), "Member identity differs from roster")
    require(identity["gicsSector"] is None or nonempty(identity["gicsSector"]),
            "Invalid sector identity")
    require(isinstance(member["acquisition"]["attempts"], int)
            and not isinstance(member["acquisition"]["attempts"], bool)
            and member["acquisition"]["attempts"] >= 0, "Invalid attempt count")
    acquisition = member["acquisition"]
    require(acquisition["outcome"] in ACQUISITION, "Unknown acquisition outcome")
    require((acquisition["outcome"] == "NOT_ATTEMPTED") == (acquisition["attempts"] == 0),
            "Acquisition outcome contradicts attempts")
    for group in GROUPS:
        data = member[group]
        require(data["qualification"] in ("QUALIFIED", "UNRESOLVED", "UNAVAILABLE"),
                "Unknown evidence qualification")
        check_references(data["evidenceReferences"], sources, produced, target)
        if data["qualification"] == "QUALIFIED":
            require(bool(data["evidenceReferences"]), "Qualified group without evidence")
            require(all(r["classification"] == "DV" for r in data["evidenceReferences"]),
                    "Qualified current evidence requires DV references")
    for field in ("unknowns", "qualifications"):
        require(isinstance(member[field], list), field + " must be an array")
    research = member["research"]
    outcome = research["outcome"]
    require(outcome in OUTCOMES, "Unknown research outcome")
    require(isinstance(research["reasonCodes"], list) and research["reasonCodes"]
            and all(nonempty(x) for x in research["reasonCodes"]), "Missing decision reason")
    require(nonempty(research["rationale"]), "Missing research rationale")
    if outcome == "BUY_RESEARCH":
        require(acquisition["outcome"] == "OBSERVED", "BUY_RESEARCH requires observed acquisition")
        require(method["adoptionStatus"] == "ACCEPTED"
                and nonempty(method.get("authorityReference"))
                and nonempty(method.get("ruleVersion"))
                and research.get("ruleVersion") == method["ruleVersion"],
                "BUY_RESEARCH requires accepted matching rule reference")
        require(all(member[g]["qualification"] == "QUALIFIED" for g in GROUPS),
                "BUY_RESEARCH has unresolved dependencies")
        require(identity["mappingStatus"] == "QUALIFIED", "Unqualified security mapping")
    return identity["securityId"], outcome


def coverage_for(members):
    outcomes = Counter(m["research"]["outcome"] for m in members)
    return {"attempted": sum(m["acquisition"]["attempts"] > 0 for m in members),
            "observed": sum(m["acquisition"]["outcome"] == "OBSERVED" for m in members),
            "qualified": outcomes["BUY_RESEARCH"], "excluded": outcomes["EXCLUDED"],
            "unresolved": outcomes["WAIT"] + outcomes["UNASSESSED"],
            "notAttempted": sum(m["acquisition"]["attempts"] == 0 for m in members)}


def check_summaries(cut):
    coverage = coverage_for(cut["members"])
    require(cut["coverage"] == coverage and all(type(v) is int for v in cut["coverage"].values()),
            "Coverage summary contradicts member outcomes")
    expected = {}
    for member in cut["members"]:
        sector = member["identity"]["gicsSector"] or "UNKNOWN"
        item = expected.setdefault(sector, {"sector": sector, "observedCount": 0,
                                           "qualifiedCount": 0, "totalCount": 0})
        item["totalCount"] += 1
        item["observedCount"] += member["acquisition"]["outcome"] == "OBSERVED"
        item["qualifiedCount"] += member["research"]["outcome"] == "BUY_RESEARCH"
    require(isinstance(cut["sectorCoverage"], list), "Sector coverage must be an array")
    actual = {}
    for item in cut["sectorCoverage"]:
        require(nonempty(item["sector"]) and item["sector"] not in actual,
                "Duplicate/missing sector summary")
        require(all(type(item[k]) is int for k in ("observedCount", "qualifiedCount", "totalCount")),
                "Invalid sector count")
        actual[item["sector"]] = item
    require(actual == expected, "Sector summary contradicts member outcomes")
    return coverage, [expected[k] for k in sorted(expected)]


def preflight(cut, evidence_root):
    root = Path(evidence_root).resolve(strict=True)
    require(isinstance(cut, dict) and cut["contractVersion"] == VERSION,
            "Unsupported cut contract")
    require(nonempty(cut["cutId"]) and nonempty(cut["producerIdentity"]),
            "Missing cut/producer identity")
    require(cut["acquisitionMode"] == "ASSISTED", "Unqualified acquisition mode")
    produced = clock(cut["producedAt"])
    target = clock(cut["targetAsOf"])
    require(target <= produced, "Future target boundary")
    universe = cut["universe"]
    require(nonempty(universe["version"]) and nonempty(universe["sourceStanding"]),
            "Missing universe version/standing")
    require(clock(universe["effectiveAt"]) <= target,
            "Universe not effective at target boundary")
    roster_path = checked_file(root, universe["artifactPath"], universe["artifactHash"])
    # Parse the exact bytes whose digest was verified, not a later reread.
    roster_bytes = roster_path.read_bytes()
    require(hashlib.sha256(roster_bytes).hexdigest() == universe["artifactHash"],
            "Roster changed during verification")
    roster = decode_json(roster_bytes)["securities"]
    require(isinstance(roster, list) and roster, "Empty/malformed universe")
    expected = [r["securityId"] for r in roster]
    require(all(nonempty(sid) for sid in expected) and len(set(expected)) == len(expected),
            "Duplicate/missing universe security identity")
    require(all(all(field in r for field in ROSTER_IDENTITY) for r in roster),
            "Roster missing core identity fields")
    count = universe["expectedMemberCount"]
    require(isinstance(count, int) and not isinstance(count, bool) and count == len(expected),
            "Universe count mismatch")
    method = cut["method"]
    require(method["adoptionStatus"] in ("PROPOSED", "ACCEPTED", "UNKNOWN"),
            "Unknown method adoption status")
    require(isinstance(method["derivationVersions"], dict), "Missing method derivation versions")
    sources = sources_for(cut, root, target)
    require(isinstance(cut["members"], list), "Members must be an array")
    roster_by_id = {r["securityId"]: r for r in roster}
    outcomes = [check_member(m, sources, method, produced, target, roster_by_id) for m in cut["members"]]
    seen = [sid for sid, _ in outcomes]
    require(len(seen) == len(set(seen)), "Duplicate member outcome")
    require(set(seen) == set(expected), "Exact-universe coverage mismatch")
    coverage, sectors = check_summaries(cut)
    return {"schema": "pr50.offline-preflight/1", "cutId": cut["cutId"],
            "status": "STRUCTURALLY_VALID", "memberCount": len(seen),
            "outcomes": dict(Counter(outcome for _, outcome in outcomes)),
            "captureCount": len(sources), "coverage": coverage, "sectorCoverage": sectors,
            "executionReady": False,
            "marketEvidenceVerified": False, "authorityVerified": False,
            "checks": "exact coverage, local digests, references and clock consistency"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cut", type=Path)
    parser.add_argument("--evidence-root", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = preflight(read_json(args.cut), args.evidence_root)
    except (Refusal, KeyError, TypeError, ValueError, OSError, AttributeError,
            RecursionError, MemoryError) as error:
        # Paths/native identities from an arbitrary input must not leak in diagnostics.
        reason = str(error) if isinstance(error, Refusal) else "Malformed or unreadable input"
        print(json.dumps({"status": "REFUSED", "reason": reason, "executionReady": False}))
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
