# Accepted Wheelwright update/history delivery — October 15, 2026

Principal-authorized engineering extends the Account-scoped history component checkpoint (`dc19cdd`) and the update Product contracts (`e7b09da`). Principal acceptance: **PASSED**, October 15, 2026, for the installed operator gate `ww pull && ww history` from any directory. Earlier author verification and this subsequent Principal decision are distinct evidence.

## Implemented composition

Bare sync discovers authorized Accounts and composes existing holdings/import acquisition with Account-scoped transaction reads. Bare fetch obtains its subjects from the backend's new pure `/v2/market-evidence-subjects` facade, then reuses existing explicit quote acquisition in bounded batches. Pull orders SYNC → DISCOVER → FETCH → REPORT. Newly admitted holdings therefore affect acquisition in the same invocation. Explicit targeted commands remain available. History aggregates only discovered history-readable Accounts through nested resources.

The backend selects authorized holdings' underlyings UNION configured monitoring subjects, deduplicated using the existing canonical underlying-symbol identity. Closed holdings are excluded; failed synchronization retains previous evidence. Legacy monitoring configuration has no intrinsic User ownership: explicit `wheelwright.market-evidence.monitoring-users` visibility bindings prevent cross-User leakage. Nonempty unbound monitoring, missing holdings, or adjusted-option roots lacking unambiguous same-day broker root-to-share evidence produce incomplete coverage, not a silently reduced universe. Fixed-income holdings do not supply equity-underlying subjects; their exclusion is reported. Explicit same-day Option Summary root-to-share mappings carry retained artifact/row provenance; adjusted suffixes are never stripped. Empty subjects are a legitimate no-op.

Normal output reports actual Account outcomes, retained files/imports, available history record counts, quote acquisition/reuse/failure and coverage limitations. It does not infer new transaction/Position counts. Partial failure exits nonzero and prevents the shell's history command. Backend authority, exact amounts, originals, revisions, authorization and separate freshness/coverage clocks remain intact. No strategy/accounting interpretation is added.

## Reproducible engineering evidence

- CLI suite: 122 passed, zero failures.
- Backend v2 suite: 176 tests, 175 passed, one optional private-reference test skipped; private-reference history suite previously passed all nine tests.
- Actual HTTP/OAS validation: five subject-selection specimens; common explicit quote operation and shared schemas unchanged.
- Isolated integration uses real public controllers, disposable SQLite, synthetic provider evidence and the normal CLI installation shape. Exact shell command succeeds, including Fidelity imported activity and tastytrade history. Verifies same-invocation new holdings selection, synchronization before fetch, repeated reuse/stable transaction identity, failed synchronization preserving retained holdings, quote failure retaining prior evidence, nonzero short-circuit, empty scope and preserved explicit fetch.
- Reproduction: Gradle `integratedUpdateFixture`, then `node scripts/ww-update-integration.mjs READY_JSON OUTPUT_DIRECTORY`; validate selection with `python3 scripts/ww-update-oas-validation.py OUTPUT_DIRECTORY/selection-http-samples.json` (Python environment with PyYAML, jsonschema and openapi-spec-validator). Fixture writes only exclusive uniquely named synthetic Downloads files and removes its own files; no real provider credentials/contact.

Detailed private test artifacts: `options-candidates/ww-integrated-update-2026-10-15-r2/evidence` adjacent to the checkout. Real financial/source material must not be committed.

## Accepted operational delivery

Principal subsequently authorized live delivery when ready. A private immutable release preserves previous CLI target, executable, runtime configuration and source-verified SQLite backup. Offline migration/retained-Fidelity normalization and previous-binary recovery rehearsals passed. Only the v2 backend and normal ww target are changed; existing credentials/User identity/Account grants remain, with necessary scoped history grants and quote acquisition capability added to the existing operator. Unrelated services remain protected.

Operational engineer verification succeeded against installed ww/backend from `/tmp` and the User home directory: exact `ww pull && ww history`, exit 0 in both cases, 16 quote subjects acquired with zero failures and 1,281 retained history records across authorized Accounts. No operator environment configuration or preview launcher. Fidelity diagnostics truthfully retain unverified brokerage freshness; lifetime history coverage remains unknown. Normal broker evidence, source originals and prior snapshots are preserved. Detailed operational output/configuration/backup stays private outside Git.

Final isolated integration/OAS checks were rerun after the live-discovered identity correction; all passed. Documentation integrity/freshness:58 passed. Source implementation checkpoint `e6e3b55`; includes parallel API-documentation checkpoints without changing their runtime scope. Principal subsequently reported **“acceptance PASSED”**, satisfying the reserved Product gate and authorizing the requested end-of-session protocol and push. This accepts the bounded installed update/history capability, not broader CLI scope, EVA execution, strategy interpretation or architectural governance changes. No independent reviewer verdict is claimed.

## Closeout / reconstructable state

Runtime source checkpoint: `e6e3b55`; pre-acceptance evidence checkpoint: `ed8a48d`. Installed private release: `~/.local/share/wheelwright/pl-cli-01-update/operational-20261015-r2/`, with previous runtime/CLI target, backup and private recovery/deployment records. Normal `~/.local/bin/ww` resolves to that release's client. Private credentials and financial artifacts stay outside Git.

Learning: integrated Product acceptance exposed deployment configuration and instrument-identity gaps that isolated tests did not. Recovery stopped a failed backup before migration; real evidence supplied explicit adjusted-root identity. These corrections preserve truthful failure behavior rather than weakening the gate. No new Product/architecture decision is introduced by closeout.

Limits remain: Fidelity brokerage freshness and lifetime transaction completeness are not established; monitoring visibility requires explicit backend User bindings; unsupported adjusted identities fail coverage. Forecasting, tax/realized-P/L calculation, strategy reconstruction, cloud delivery and wider CLI work remain outside this accepted slice. Existing Coming Soon priorities remain unchanged. No further engineering is commissioned by closing this session.
