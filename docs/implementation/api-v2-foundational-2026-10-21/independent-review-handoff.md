# Independent Kiro implementation review

Review the exact isolated submission commit, not this report's claims. Start with repository-root AGENTS.md, docs/AGENTS.md, docs/README.md and the Kiro cold-start procedure. Disclose preloaded steering and recover maintained owners, ADR-016, ASSIM-0002, task/experiment state and accepted Product precedent independently.

The Principal requested the complete accepted foundational API, independent Kiro verification and backend acceptance before ww live. This handoff authorizes read-only review and existing deterministic tests against isolated fixtures/databases, not application/specification changes, production operations, live broker requests, installation, deployment, push or merge. Preserve unrelated work. Report in the review conversation; do not silently implement fixes or declare Principal acceptance.

Start from:

- docs/discovery/api-v2-full-implementation-handoff-2026-10-21.md
- docs/discovery/api-v2-specification-acceptance-checkpoint-2026-10-21.md
- Accepted specification commit a32c7c79a059cc58d5262cf3e30c520d2e087825, plus the mandatory corrections recorded in the implementation package.
- docs/api-v2/README.md and the resolved operative docs/contracts package.
- coverage.json, contract-properties.json, runtime-field-coverage.json and runtime-obligations.md here. These are implementer evidence maps, not independent governing authority.
- qualified-continuity-decision.md records the subsequent Principal direction: uniquely compatible UNRESOLVED GUID reuse, continuity still unproven; no CLOSED resurrection, ambiguous merge, split/recombine or opening-history inference.

Falsify every accepted resource/operation, financial/source invariant and authorization boundary. Separate missing implementation from legitimately missing broker evidence. Do not promote an unsupported source association because its reference is typed, and do not invent financial events to obtain visual parity. Verify actual source-derived examples, current/original/cumulative economics, BWB unequal tails, exact Model binding, immutable predecessors, account-wide competing coverage, successful incomplete reads and Order-derived metadata redaction. Test direct/collection/expanded/history/source paths and the complete production application graph. No substitute ww live slice or new domain redesign.

Run from the review checkout root, sequentially for Gradle:

```sh
./evidence-service-java/gradlew -p evidence-service-java test --console=plain
```

Then use an existing Python environment with jsonschema, PyYAML and openapi-spec-validator (no installation authorized):

```sh
python scripts/v2-oas-conformance-test.py
python docs/implementation/api-v2-foundational-2026-10-21/operative-contract-test.py
python docs/implementation/api-v2-foundational-2026-10-21/validate-runtime-responses.py
python docs/implementation/api-v2-foundational-2026-10-21/entry-corrections-test.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py
node docs/implementation/api-v2-foundational-2026-10-21/verify-mark-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-session-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-management-parity.mjs
```

The existing capable Python is `/Users/bollich/kiro/options-candidates/pl-cli-01-capital-history/private/verify-env/bin/python`. The two optional private-real-file tests require their actual file path; do not fabricate input or claim that synthetic fixtures establish live behavior. Reference Node replay commands remain in the preserved review README. Kiro's earlier16 exact probe payloads/full review artifact were not supplied; newly constructed runtime falsifiers are labelled accordingly.

Return ACCEPT/REJECT with ranked exact file:line findings, concrete runtime/source falsifiers, observed commands/results, genuinely unavailable evidence and bounded corrections. Reviewer ACCEPT is separate from Principal API acceptance. Record the exact reviewed SHA and any local modifications; verify the original candidate remains preserved. Do not begin ww live.
