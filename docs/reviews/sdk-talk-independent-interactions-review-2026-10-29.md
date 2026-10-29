# Independent interaction/acquisition review — 2026-10-29

**Disposition: REJECT** for immutable `cf84e6346968e9df6751c1a5208b2d3bb84788be`, delta from accepted bounded tactical source `e88708959c8899327ee6f19a25121635fa40295c`.

One independently reproduced input-contract defect remains: an ordinary valid raster below the advertised maximum cannot be attached. No privacy breach or incorrect financial amount was demonstrated. The other scoped findings below support the implementation but do not override the failed supported-input case. No later working changes are reviewed here.

## F1 — valid sub-limit PNG overflows attachment validator stack

`tools/talk/attachments.mjs` validates base64 with a nested quantified regular expression before decoding. On the current Node24 runtime, a valid synthetic 1100×1100 RGB PNG of **3,632,273 bytes**, below4MiB and well inside all dimension/pixel bounds, causes:

`RangeError: Maximum call stack size exceeded`

This is not an oversized file, invalid signature, metadata payload or malformed image. My generator independently checks every PNG chunk CRC, image header, decompressed scanline bytes and terminal chunk boundary. The failure occurs in the base64 pattern. The host catches it as a generic unavailable request, so a declared supported attachment cannot reach native SDK image processing. No service crash or protected-data exposure is claimed.

Exact reproduction:

```sh
python3 /tmp/ww-interactions-independent-evidence-20261029/large_image_probe.py
```

That script deterministically generates the synthetic raster and calls the frozen validator with enabled profile/explicit consent. `large-image-check.json` records validSyntheticPng/withinDeclaredByteLimit true and accepted false; `synthetic-large.png` is the invented input. Header-only size probes corroborated the upper-bound failure but are not the proof of PNG validity.

Smallest correction: replace the recursive/nested base64 pattern with bounded flat validation of characters, length and terminal padding before decode, preserving the advertised limit and existing type/consent/profile checks. Confirm valid near-limit input and malformed-padding/oversized negatives. Do not reinterpret the supported limit downward merely to make the specimen pass. Any correction requires a new immutable submission.

## Independent privacy and interaction evidence

My own controlled native SDK success/failure/follow-up probes passed:

- Disabled profile, missing consent, external URL, SVG and extra filesystem-path input are refused.
- Native SDK serialization includes the selected synthetic image in its permitted turn. Successful and failed turns remove pixel data from local session history; subsequent inference bodies do not replay it.
- Local diagnostic request copies remove image pixels. Provider error-body canaries are absent from returned diagnostics. Reset empties local history.
- A process-owned host with a fake backend/profile independently returns403 for wrong Origin/CSRF,400 for denied image consent/invalid download handle and404 for GET download. None of these denied cases invokes inference. Real retained tool discovery omits the development greeting tool.

Source inspection confirms browser raster decode/re-encode strips source metadata, filename is not transmitted as a filesystem path, and no filesystem/provider-authentication tool is added. PNG header/dimension checks are finite but do not constitute full server-side PNG decoding; the normal browser path performs raster normalization. Consent is per selected attachment. This review does not claim malicious-image decoder certification or that model commentary becomes authoritative evidence. SDK tracing/store/remote-conversation restrictions remain in place. Standard provider processing is not erased by local history cleanup.

## Financial report/export evidence

Independent compilation of the exact new FinancialReportCsv source and separate synthetic CSV parsing passed multi-row precision and unknown tests. Two exact row amounts0.005/0.005 display0.01/0.01; the copied exact total0.010 displays0.01. Exact source decimals and backend totals are preserved rather than allocating a rounding residual or recomputing totals. Unavailable total amount/currency/winners/losers stay blank and UNAVAILABLE remains explicit. Formula-leading text including BOM/whitespace is prefixed as literal; embedded quotes and CRLF round-trip correctly. Numeric columns permit only decimal numeric lexemes. Partial and later closed-report pages are not exportable. SHA-256 matches exact UTF-8 CSV bytes.

Source inspection confirms balance projection copies one selected existing observation, broker-native fields/status/units/source clocks/currentness/coverage. Closed-report projection preserves Account alias, exact period/zone, provider/environment, metric, per-row source qualifications, coverage and estimate statuses. CSV generation performs display rounding only, not financial allocation. Export controllers reuse existing authenticated Account/source grants, regenerate from governed results and refuse mismatched fingerprints. Raw brokerage originals have no export route here. The fingerprint identifies generated CSV bytes; it is not independent proof of brokerage completeness or original authenticity.

My independent mocked transport/handle probes passed exact downloaded bytes, Account denial on a subsequent download, opaque handles, expiry and external/original/policy-mode/cursor/duplicate-selector refusal. The host stores references rather than financial file bytes and re-reads/re-authorizes on download. Reset/close clear references in source. Browser download uses the returned CSV blob/filename, not model-generated rows. No real financial payload was read during this review.

## Acquisition and representation evidence

Independent adapter mocks verified exactly one backend POST after authorized nickname discovery for ACCEPTED, REJECTED, FAILED,403 and transport-UNKNOWN paths. Outcomes remain distinct, denied/private diagnostics are suppressed, no inventory is invented and no automatic retry is added. Source inspection traces the existing POST controller's exact account.positions.acquire check before service acquisition. The agent does not authenticate providers, trade or poll. An accepted acquisition is metadata, not proof of a complete/fresh economic Position.

Shared GET/POST transport retains redirect refusal, finite body/correlation checks and backend credentials. MCP45sec/SDK90sec bounds are explicit, not promises that every acquisition finishes; timeout ambiguity requires retained-evidence inspection. Spot's own observation time/stale warning and package's oldest-material clock remain distinct; incomplete-page warning is now visible.

## Scope and reproducibility

Independent exact source: `/tmp/ww-independent-interactions-review-20261029`. Harness/check-only results: `/tmp/ww-interactions-independent-evidence-20261029/`.

```sh
python3 /tmp/ww-interactions-independent-evidence-20261029/run_csv.py
python3 /tmp/ww-interactions-independent-evidence-20261029/run_node.py
python3 /tmp/ww-interactions-independent-evidence-20261029/large_image_probe.py
```

Receipts: `java-checks.json`, `csv-checks.json`, `node-checks.json`, `server-checks.json`, `large-image-check.json`. Node setup temporarily links existing local pinned dependencies in the detached checkout and removes its links; there is no package installation. Java uses previously built unchanged supporting classes/dependencies plus the exact new CSV class; no new full Java-suite claim is made. No author test was used as the independent oracle. The host probes use an inaccessible/fake financial backend and mocked inference responses, never a live provider.

The declared baseline publication-validator failure and author broad-suite results are not independently waived or certified here. No OAS/full-route/full-security audit is claimed. Existing accounting/coverage qualifications and real-profile parity/Principal acceptance limits remain. No services, grants, operational evidence, credentials or source files were changed; local synthetic fixtures and temporary dependency links were the only new test artifacts. Original tactical/financial reviews remain immutable.

CURRENT STATE: Frozen cf84e634 independently rejected for a valid advertised-size image failure; bounded financial/privacy/acquisition probes otherwise support the stated scope.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the immutable finding and evidence to the commissioned implementation owner.
