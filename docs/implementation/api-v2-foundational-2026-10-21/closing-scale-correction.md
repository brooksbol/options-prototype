# Current closing-instruction scale — bounded successor correction

Frozen independent-review target: `a2ed63062edce5af65c1ea635ddfce97b520c475`. This successor does not modify that checkout or the independent reviewer's probes.

A NEWLY CONSTRUCTED Codex falsifier removed the synthetic closing Order multiplier while retaining compatible evidenced current held-option terms. The frozen implementation returned an unavailable profit-target dollar result even though the current scale was established. This is a backend derivation gap, not evidence of a brokerage event or a Product decision. The original source replay had supplied that multiplier synthetically and therefore did not expose the gap.

The successor derives a WORKING closing instruction's dollar scale from compatible current held-contract multipliers when the instruction's declared price unit is per underlying unit and its own multiplier is absent. It retains the source Order unchanged, requires common positive scale, matching currency and nonconflicting evidenced terms, and adds the held-term provenance/dependency and an explicit assumption. Missing package quantity, incompatible terms or currencies, and missing historical fill scale remain unsupported. Current held terms cannot establish a past opening fill multiplier or an expired historical instruction's scale.

Targeted Java verification: `./evidence-service-java/gradlew -p evidence-service-java test --tests '*PortfolioOrderEvaluationTest' --tests '*PortfolioManagementParityTest' --console=plain` — PASS. The negative/positive test covers absent current scale, conflicting terms, differing scales/currencies, expired instruction, unchanged retained Order, and missing historical fill scale. Existing tests retain terminal/authorization/economic boundaries.

Source-derived comparison: `node docs/implementation/api-v2-foundational-2026-10-21/verify-management-parity.mjs` — PASS against the actual normalized-Order Java evaluation. The working instruction now has no injected multiplier. Opening historical multiplier, package-size, zero-fill declarations and admitted membership remain explicitly synthetic preconditions; this does not demonstrate live brokerage behavior.

Full combined successor regression PASS961 tests,0 failures/errors,2 optional private-file skips. Independent reviewer disposition remains pending. This document does not declare API acceptance or authorize ww live.
