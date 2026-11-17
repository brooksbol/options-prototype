"""Adversarial fixtures contain no real securities or broker records."""

from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import preflight


class ResearchCutTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        roster = {"securities": [{"securityId": "invented-A"}, {"securityId": "invented-B"}]}
        (self.root / "roster.json").write_text(json.dumps(roster))
        (self.root / "capture.txt").write_text("synthetic source; not market evidence")
        now = "2026-11-17T18:00:00Z"
        ref = {"sourceId": "capture-1", "classification": "DV",
               "recordedAt": "2026-11-17T17:59:00Z", "decisionAt": now}
        members = []
        for sid in ("invented-A", "invented-B"):
            # Same issuer/symbol does not collapse distinct share classes.
            member = {"identity": {"securityId": sid, "issuerCik": "invented-issuer",
                      "shareClass": sid, "symbol": "INVENTED", "listing": "SYNTHETIC",
                      "currency": "USD", "mappingStatus": "QUALIFIED",
                      "mappingVersion": "fixture/1", "gicsSector": None,
                      "classificationSourceVersion": None, "brokerContractId": None},
                      "acquisition": {"outcome": "OBSERVED", "attempts": 1},
                      "research": {"outcome": "WAIT", "reasonCodes": ["RULE_NOT_ADOPTED"],
                                   "rationale": "Synthetic WAIT; no recommendation"},
                      "unknowns": ["not market data"], "qualifications": []}
            for group in preflight.GROUPS:
                member[group] = {"qualification": "UNRESOLVED", "evidenceReferences": [deepcopy(ref)]}
            members.append(member)
        roster = {"securities": [{field: m["identity"][field] for field in preflight.ROSTER_IDENTITY}
                                 for m in members]}
        (self.root / "roster.json").write_text(json.dumps(roster))
        self.cut = {"contractVersion": preflight.VERSION, "cutId": "synthetic-cut/1",
                    "producerIdentity": "fixture", "acquisitionMode": "ASSISTED",
                    "targetAsOf": now, "producedAt": now,
                    "universe": {"version": "synthetic/1", "sourceStanding": "SYNTHETIC",
                                 "effectiveAt": now, "artifactPath": "roster.json",
                                 "artifactHash": self.digest("roster.json"), "expectedMemberCount": 2},
                    "method": {"adoptionStatus": "PROPOSED", "ruleVersion": None,
                               "authorityReference": None, "derivationVersions": {}},
                    "coverage": {"attempted": 2, "observed": 2, "qualified": 0,
                                 "excluded": 0, "unresolved": 2, "notAttempted": 0},
                    "sectorCoverage": [{"sector": "UNKNOWN", "observedCount": 2,
                                        "qualifiedCount": 0, "totalCount": 2}],
                    "sourceManifest": [{"id": "capture-1", "path": "capture.txt",
                                        "sha256": self.digest("capture.txt"),
                                        "receivedAt": "2026-11-17T17:58:00Z", "sourceTime": None}],
                    "members": members}

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def rejected(self, message):
        with self.assertRaisesRegex(preflight.Refusal, message):
            preflight.preflight(self.cut, self.root)

    def test_complete_share_classes_preserved_without_execution_authority(self):
        result = preflight.preflight(self.cut, self.root)
        self.assertEqual(result["memberCount"], 2)
        self.assertEqual(result["outcomes"], {"WAIT": 2})
        for field in ("executionReady", "marketEvidenceVerified", "authorityVerified"):
            self.assertIs(result[field], False)

    def test_omitted_constituent_is_not_complete(self):
        self.cut["members"].pop()
        self.rejected("coverage mismatch")

    def test_duplicate_cannot_replace_missing_share_class(self):
        self.cut["members"][1] = deepcopy(self.cut["members"][0])
        self.rejected("Duplicate member")

    def test_roster_is_not_hardcoded_503(self):
        self.cut["universe"]["expectedMemberCount"] = 503
        self.rejected("count mismatch")

    def test_changed_source_bytes_fail_digest(self):
        (self.root / "capture.txt").write_text("later overwritten content")
        self.rejected("digest mismatch")

    def test_symlink_escape_refused(self):
        with tempfile.TemporaryDirectory() as outside:
            target = Path(outside) / "private.txt"
            target.write_text("do not read outside admitted root")
            (self.root / "escape").symlink_to(target)
            self.cut["sourceManifest"][0]["path"] = "escape"
            self.rejected("escapes root")

    def test_manifest_identity_collision_refused(self):
        self.cut["sourceManifest"].append(deepcopy(self.cut["sourceManifest"][0]))
        self.rejected("duplicate source")

    def test_missing_capture_reference_refused(self):
        self.cut["members"][0]["technical"]["evidenceReferences"][0]["sourceId"] = "absent"
        self.rejected("Unresolved source")

    def test_hindsight_cannot_be_dv(self):
        self.cut["members"][0]["technical"]["evidenceReferences"][0]["decisionAt"] = "2026-11-17T17:57:00Z"
        self.rejected("Later evidence")

    def test_hr_can_reconstruct_earlier_decision_without_dv_claim(self):
        ref = self.cut["members"][0]["technical"]["evidenceReferences"][0]
        ref.update(classification="HR", decisionAt="2026-11-16T12:00:00Z")
        self.assertEqual(preflight.preflight(self.cut, self.root)["status"], "STRUCTURALLY_VALID")

    def test_unzoned_or_future_clock_refused(self):
        self.cut["targetAsOf"] = "2026-11-17T18:00:00"
        self.rejected("timezone")
        self.cut["targetAsOf"] = "2026-11-18T18:00:00Z"
        self.rejected("Future target")

    def test_broker_source_clock_is_not_receipt_clock(self):
        self.cut["sourceManifest"][0]["sourceTime"] = "2026-11-17T17:59:00Z"
        self.rejected("Future source")

    def test_no_buy_under_unadopted_rule(self):
        self.cut["members"][0]["research"]["outcome"] = "BUY_RESEARCH"
        self.rejected("accepted matching rule")

    def test_accepted_rule_cannot_hide_missing_dependencies(self):
        self.cut["method"] = {"adoptionStatus": "ACCEPTED", "ruleVersion": "fixture/1",
                              "authorityReference": "synthetic-unverified-authority", "derivationVersions": {}}
        self.cut["members"][0]["research"].update(outcome="BUY_RESEARCH", ruleVersion="fixture/1")
        self.rejected("unresolved dependencies")

    def test_qualified_without_source_is_not_evidence(self):
        self.cut["members"][0]["catalysts"] = {"qualification": "QUALIFIED", "evidenceReferences": []}
        self.rejected("without evidence")

    def test_wait_and_unassessed_remain_distinct(self):
        self.cut["members"][1]["research"].update(outcome="UNASSESSED", reasonCodes=["NOT_ATTEMPTED"])
        self.assertEqual(preflight.preflight(self.cut, self.root)["outcomes"], {"WAIT": 1, "UNASSESSED": 1})

    def test_duplicate_json_key_and_nan_refused(self):
        path = self.root / "bad.json"
        for content in ('{"same":1,"same":2}', '{"value":NaN}'):
            path.write_text(content)
            with self.assertRaises(preflight.Refusal):
                preflight.read_json(path)

    def test_cli_success_and_malformed_refusal_hide_private_path(self):
        path = self.root / "cut.json"
        path.write_text(json.dumps(self.cut))
        command = [sys.executable, str(Path(preflight.__file__)), str(path),
                   "--evidence-root", str(self.root)]
        good = subprocess.run(command, capture_output=True, text=True, check=True)
        self.assertIs(json.loads(good.stdout)["executionReady"], False)
        self.cut["sourceManifest"][0]["path"] = "missing-private-identifier"
        path.write_text(json.dumps(self.cut))
        bad = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(bad.returncode, 1)
        self.assertNotIn(str(self.root), bad.stdout + bad.stderr)
        self.assertNotIn("missing-private-identifier", bad.stdout + bad.stderr)

    def make_synthetic_buy(self):
        self.cut["method"].update(adoptionStatus="ACCEPTED", ruleVersion="fixture/1",
                                  authorityReference="unverified-synthetic-reference")
        member = self.cut["members"][0]
        member["research"].update(outcome="BUY_RESEARCH", ruleVersion="fixture/1")
        for group in preflight.GROUPS:
            member[group]["qualification"] = "QUALIFIED"
        self.cut["coverage"].update(qualified=1, unresolved=1)
        self.cut["sectorCoverage"][0]["qualifiedCount"] = 1
        return member

    def test_accepted_structural_buy_still_verifies_no_authority_or_market(self):
        self.make_synthetic_buy()
        result = preflight.preflight(self.cut, self.root)
        self.assertEqual(result["outcomes"]["BUY_RESEARCH"], 1)
        self.assertFalse(result["authorityVerified"])
        self.assertFalse(result["marketEvidenceVerified"])
        self.assertFalse(result["executionReady"])

    def test_receipt_after_target_is_not_contemporaneous(self):
        self.cut["targetAsOf"] = self.cut["universe"]["effectiveAt"] = "2026-11-17T12:00:00Z"
        self.rejected("after target knowledge cutoff")

    def test_dv_decision_after_target_cannot_hide_behind_later_production(self):
        self.cut["targetAsOf"] = self.cut["universe"]["effectiveAt"] = "2026-11-17T17:59:30Z"
        self.rejected("Later evidence")

    def test_unknown_only_and_reconstructed_groups_cannot_be_current_qualified(self):
        for classification in ("U", "HR"):
            with self.subTest(classification=classification):
                member = self.make_synthetic_buy()
                member["technical"]["evidenceReferences"][0]["classification"] = classification
                self.rejected("requires DV")

    def test_failed_capture_cannot_support_buy(self):
        self.make_synthetic_buy()["acquisition"]["outcome"] = "FAILED"
        self.rejected("requires observed acquisition")

    def test_arbitrary_acquisition_success_label_is_not_admitted(self):
        self.cut["members"][0]["acquisition"]["outcome"] = "SUCCEEDED_MAYBE"
        self.rejected("Unknown acquisition")

    def test_member_core_identity_must_match_roster(self):
        self.cut["members"][0]["identity"]["shareClass"] = "other-class"
        self.rejected("identity differs")

    def test_fictional_coverage_summary_cannot_override_members(self):
        self.cut["coverage"].update(qualified=2, unresolved=0)
        self.rejected("Coverage summary contradicts")

    def test_fictional_sector_winners_cannot_override_members(self):
        self.cut["sectorCoverage"][0]["qualifiedCount"] = 2
        self.rejected("Sector summary contradicts")

    def test_not_attempted_is_explicit_and_counted(self):
        self.cut["members"][0]["acquisition"].update(outcome="NOT_ATTEMPTED", attempts=0)
        self.cut["members"][0]["research"]["outcome"] = "UNASSESSED"
        self.cut["coverage"].update(attempted=1, observed=1, notAttempted=1)
        self.cut["sectorCoverage"][0]["observedCount"] = 1
        self.assertEqual(preflight.preflight(self.cut, self.root)["coverage"]["notAttempted"], 1)

    def test_deep_json_refuses_without_traceback(self):
        path = self.root / "deep.json"
        path.write_text("[" * 200000 + "]" * 200000)
        result = subprocess.run([sys.executable, "-I", preflight.__file__, str(path),
                                 "--evidence-root", str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)["status"], "REFUSED")
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
