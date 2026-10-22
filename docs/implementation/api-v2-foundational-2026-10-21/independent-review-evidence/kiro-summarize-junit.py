#!/usr/bin/env python3
"""Kiro review scratch: summarize the JUnit XML produced by the latest Gradle test run.
Read-only over evidence-service-java/build/test-results/test. Prints totals, failures/errors and skips."""
import glob, os, sys, xml.etree.ElementTree as ET

root = sys.argv[1] if len(sys.argv) > 1 else "evidence-service-java/build/test-results/test"
files = sorted(glob.glob(os.path.join(root, "TEST-*.xml")))
tot = dict(tests=0, failures=0, errors=0, skipped=0)
time = 0.0
bad, skipped, newest = [], [], 0.0
for f in files:
    newest = max(newest, os.path.getmtime(f))
    s = ET.parse(f).getroot()
    for k in tot:
        tot[k] += int(s.get(k, 0))
    time += float(s.get("time", 0))
    for tc in s.iter("testcase"):
        name = f"{tc.get('classname')}#{tc.get('name')}"
        if tc.find("failure") is not None or tc.find("error") is not None:
            bad.append(name)
        if tc.find("skipped") is not None:
            skipped.append(name)
print(f"suites={len(files)} {tot} sumSuiteTime={time:.1f}s newestXmlMtimeEpoch={newest:.0f}")
print("FAILED_OR_ERROR:", bad or "none")
print("SKIPPED:", skipped or "none")
