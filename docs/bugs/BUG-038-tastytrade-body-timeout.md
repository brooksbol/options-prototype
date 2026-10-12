# BUG-038 — Tastytrade acquisition response-body deadline is incomplete

- **Status:** Resolved
- **Severity:** S2
- **Area:** Backend / v2 tastytrade evidence acquisition and disclosure
- **Provenance:** PL-CONV-01 Step 5 independent Kiro verification, October 11, 2026; Principal reconciled both findings and authorized bounded correction A.

## Observed failure
The frozen Step 5 candidate's ten-second HttpRequest timeout did not bound response-body consumption. Independent Kiro probes ran 60–92 seconds until the loopback server closed the connection; a stalled body also held `PositionAcquisition.acquire` synchronization beyond the deadline. Frozen JAR SHA-256 `323ef24b1db20957f307c91aad938748957b386fa5b2555ced9f0211b2da798a`. No live outage is established.

## Intended semantics violated
The bounded explicit acquisition must terminate on upstream failure, preserve previous evidence and release acquisition resources for later requests.

## Consequence / diagnosis
An upstream that sends headers and stalls/trickles its body can hold the service acquisition monitor indefinitely. The size-limited subscriber had no time bound; request timeout did not bound the demonstrated body-read path.

## Scope / acceptance criteria
Cover the whole upstream OAuth and holdings operation with a deadline including body consumption, cancel abandoned exchanges, preserve byte-size limits and diagnostics, release the monitor, preserve the prior snapshot and permit recovery. No generalized async framework, serialization redesign or scheduler.

## Remediation / verification
Principal explicitly authorized R2. `TastytradeClient` now waits on JDK asynchronous exchange futures under one monotonic ten-second budget, cancelling the underlying exchange and body subscription on timeout/interruption. `TastytradeDeadlineTest` uses raw loopback peers to verify client EOF after cancellation, no remaining stalled handler, preserved snapshot, successful subsequent acquisition and concurrent lock release. Combined OAuth/holdings budget and oversized-response guards pass. R2 subsequently passed independent Kiro verification and Principal operational/visual acceptance; see closure below.

## Related
PL-CONV-01; BUG-036 (accepted Fidelity protection preserved); `../design/pl-conv-01-step5-candidate.md`; original frozen submission and review artifacts under `/Users/bollich/.local/share/wheelwright/pl-conv-01-step5/`.


## Principal acceptance / closure — October 11, 2026 (America/Denver)
Kiro independently ACCEPTED frozen R2 JAR SHA-256 `33d5e3360c697db8863eafc4bc173452b2c8f4c9a49f9e60318386e9026d15e4`. Complete-envelope fail-closed disclosure, valid-byte access, admission/disclosure separation, whole-body deadline, socket cancellation, released monitor, snapshot preservation and subsequent acquisition recovery passed. Fidelity protection remains preserved; the corrected raw-socket reviewer harness and the exact executed-versus-reused regression evidence are documented in the Step5 design closeout. The Principal accepted the independent report, authorized deployment, successfully exercised ordinary installed ww acquisition/read commands, supplied the color screenshot and explicitly selected A accepting functionality/presentation. This defect is **Resolved**, not merely candidate-remediated. No live incident is inferred from the synthetic original failure.
