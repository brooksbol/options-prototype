# BUG-048 — Empty-composition zero reference violates Metric evidence constraint

- **Status:** Open
- **Severity:** S3
- **Area:** Holdings API v2 response schema
- **Provenance:** Installed-data read-only release verification, October 22, 2026; independently replayed against the prior installed JAR on a private database copy. Author observation, not Kiro finding.

## Observed failure

A Position with `exposure.status=ZERO_OBSERVED` and empty current constituents returns `evaluation.management.zeroGrossPl` as value `"0"`, status `QUALIFIED`, method `ZERO_REFERENCE`, and `evidence: []`. Both summary and expanded collection members fail the operative Metric `minItems: 1` evidence condition. No source opening, closure or profit is thereby established. This is a serialization/contract defect in the zero reference, not a demonstrated erroneous trading result.

## Intended semantics violated

The operative `docs/contracts/api-v2-foundational-portfolio.json#/components/schemas/Metric` requires nonempty evidence for QUALIFIED metrics. A successful API operation must still produce its documented schema. UNKNOWN states and terminal lifecycle qualifications must not be invented to hide missing evidence.

## Evidence and reproduction

`evidence-service-java/src/main/java/com/wheelwright/evidence/v2/portfolio/PortfolioMath.java:23` constructs the zero metric using Construction evidence, which can be empty for an empty current composition. Real installed authorized GET `/v2/positions?limit=5&projection=summary` and `projection=expanded` produced this failure. The prior JAR SHA-256 `1d94fb29d0ce8ef4de4d435746e134e74dc5e38b4fa52d3d697d6a16ed07172e` reproduced the same Metric error in an isolated database-copy replay. Current corrected JAR `c94389c9b4a47ce4538f7cd744ebe1dfafdd4547412a2d9a6e113e9b8f0b85f4` has the same issue. This is pre-existing, not an F1/F2 correction regression.

Private payloads remain outside Git. The nonprivate minimal shape is `{value:"0", unit:"MONEY", currency:"USD", status:"QUALIFIED", origin:"WHEELWRIGHT_DERIVED", method:"ZERO_REFERENCE", asOf:<valid timestamp>, assumptions:[], evidence:[], warningCodes:[], dependencies:[]}`. Validating this against Metric reproduces the minItems failure. Source observations, associations and lifecycle states must remain truthful in any future correction.

## Consequence and scope

Strict clients can reject affected Position representations. Other supplied deterministic representations pass. No grant weakening, invented P/L, lifecycle policy or brokerage activity is demonstrated. Record as an existing limitation of the accepted release; do not silently broaden this release into implementation repair or claim complete installed-response conformance. Narrow correction and regression verification remain pending separate authorization.

## Related

[Release record](../implementation/api-v2-foundational-2026-10-21/product-conformance-release-2026-10-22.md). F3 lifecycle policy remains reserved.
