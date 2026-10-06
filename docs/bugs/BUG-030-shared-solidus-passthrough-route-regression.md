# BUG-030 — Shared encoded-solidus passthrough changes an existing route’s interpretation

- **Status:** Open
- **Severity:** Not established
- **Area:** Backend / candidate shared Tomcat transport configuration
- **Provenance:** First ww show implementation transport gate, October 5, 2026; synchronized authority `4ff8c7a3d0a8f69330ee4ba1aa55c6d08e07c137`.

## Observed failure

Applying selected shared-connector `encodedSolidusHandling=passthrough` in an isolated real embedded Tomcat/Spring fixture changes the actual existing GovernedDecisionController route. An unauthenticated GET `/api/governed-decision/A%2FB` is rejected by baseline Tomcat with 400 and never invokes `getGovernedDecision`. Under passthrough, Spring dispatches it to the controller and invokes `getGovernedDecision("A/B")`. The mock returns no record, producing 404.

This is a demonstrated integration regression of the candidate transport change, not a claim that baseline production currently has this defect. No production connector setting was changed. No actual Decision data was read and no disclosure was demonstrated.

## Intended semantics violated

The selected show transport is conditional on preserving existing-route interpretation and security behavior. Subject slash support must not cause an unrelated previously rejected encoded path to reach an existing controller/storage capability. The reproduced change falsifies that preservation condition even though slash-containing show subjects route correctly.

## Evidence

`evidence-service-java/src/test/java/com/wheelwright/evidence/v2/HeldQuoteTransportPreservationTest.java` starts real random-port embedded containers with the installed Boot 3.4.3 / Tomcat 10.1.36 / Spring 6.2.3 stack. It imports the actual existing HeldQuotesController and GovernedDecisionController, mocking only storage and configuring a test Bearer principal. A test-only singular symbol probe performs standard PathVariable binding without endpoint-specific parsing. No production application scan, provider, acquisition worker or real SQLite store starts.

Focused command:

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 21) evidence-service-java/gradlew -p evidence-service-java test --tests '*HeldQuoteTransportPreservationTest' --console=plain
```

Final result: two tests, one pass and one failure. Slash binding passes for upper/lower encoded solidus, repeated solidus and encoded slash/dot sequences; a double-encoded input binds as `BRK%2FB`, proving only one decode. Existing plain collection authorization responses remain unchanged. The preservation test verifies baseline storage is not invoked for the Decision identifier, verifies candidate storage receives `A/B`, then fails: expected baseline 400, actual candidate 404. This is more than a status-code difference: controller/storage dispatch changes.

An initial broader matrix also observed `/v2%2Fquotes` changing 400 to 404. That unmatched-route status difference alone was not used as the decisive falsifier; the final test isolates an actual existing controller invocation.

## Consequence / scope

The authorized conditional transport cannot be accepted from this candidate. Implementation stopped before any production runtime/OAS/CLI changes. No alternative transport, parsing guard, query route, symbol exclusion or double-encoding workaround was attempted. Product semantics remain frozen; return to Solution Design.

BUG-029 is unaffected. Filing this record authorizes no transport workaround, Decision change, unrelated remediation or market acquisition. The failing gate is preserved as uncommitted reproduction evidence; implementation acceptance has not passed.
