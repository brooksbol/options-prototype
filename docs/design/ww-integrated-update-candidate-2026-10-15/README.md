# Integrated Wheelwright update/history candidate — October 15, 2026

Principal-authorized engineering extends the accepted Account-scoped history component (`dc19cdd`) and the update Product contracts (`e7b09da`). Required operator gate: `ww pull && ww history` from any directory. Author verification is not Principal acceptance.

## Implemented composition

Bare sync discovers authorized Accounts and composes existing holdings/import acquisition with Account-scoped transaction reads. Bare fetch obtains its subjects from the backend's new pure `/v2/market-evidence-subjects` facade, then reuses existing explicit quote acquisition in bounded batches. Pull orders SYNC → DISCOVER → FETCH → REPORT. Newly admitted holdings therefore affect acquisition in the same invocation. Explicit targeted commands remain available. History aggregates only discovered history-readable Accounts through nested resources.

The backend selects authorized holdings' underlyings UNION configured monitoring subjects, deduplicated using the existing canonical underlying-symbol identity. Closed holdings are excluded; failed synchronization retains previous evidence. Legacy monitoring configuration has no intrinsic User ownership: explicit `wheelwright.market-evidence.monitoring-users` visibility bindings prevent cross-User leakage. Nonempty unbound monitoring, missing holdings, or adjusted-option roots lacking unambiguous same-day broker root-to-share evidence produce incomplete coverage, not a silently reduced universe. Fixed-income holdings do not supply equity-underlying subjects; their exclusion is reported. Explicit same-day Option Summary root-to-share mappings carry retained artifact/row provenance; adjusted suffixes are never stripped. Empty subjects are a legitimate no-op.

Normal output reports actual Account outcomes, retained files/imports, available history record counts, quote acquisition/reuse/failure and coverage limitations. It does not infer new transaction/Position counts. Partial failure exits nonzero and prevents the shell's history command. Backend authority, exact amounts, originals, revisions, authorization and separate freshness/coverage clocks remain intact. No strategy/accounting interpretation is added.

## Reproducible engineering evidence

- CLI suite: 122 passed, zero failures.
- Backend v2 suite: 176 tests, 175 passed, one optional private-reference test skipped; private-reference history suite previously passed all nine tests.
- Actual HTTP/OAS validation: five subject-selection specimens; common explicit quote operation and shared schemas unchanged.
- Isolated integration uses real public controllers, disposable SQLite, synthetic provider evidence and the normal CLI installation shape. Exact shell command succeeds, including Fidelity imported activity and tastytrade history. Verifies same-invocation new holdings selection, synchronization before fetch, repeated reuse/stable transaction identity, failed synchronization preserving retained holdings, quote failure retaining prior evidence, nonzero short-circuit, empty scope and preserved explicit fetch.
- Reproduction: Gradle `integratedUpdateFixture`, then `node scripts/ww-update-integration.mjs READY_JSON OUTPUT_DIRECTORY`; validate selection with `python3 scripts/ww-update-oas-validation.py READY_JSON OUTPUT_DIRECTORY`. Fixture writes only exclusive uniquely named synthetic Downloads files and removes its own files; no real provider credentials/contact.

Detailed private test artifacts: `options-candidates/ww-integrated-update-2026-10-15-r1/evidence` adjacent to the checkout. Real financial/source material must not be committed.

## Operational release boundary

Principal subsequently authorized live delivery when ready. A private immutable release preserves previous CLI target, executable, runtime configuration and source-verified SQLite backup. Offline migration/retained-Fidelity normalization and previous-binary recovery rehearsals passed. Only the v2 backend and normal ww target are changed; existing credentials/User identity/Account grants remain, with necessary scoped history grants and quote acquisition capability added to the existing operator. Unrelated services remain protected.

Operational engineer verification and Principal acceptance are pending at this source checkpoint. Final end-of-session reconciliation and push must wait for explicit Principal acceptance PASSED. No independent review is claimed.
