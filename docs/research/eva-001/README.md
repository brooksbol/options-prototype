# EVA-001 — Data Feasibility and Experimental Design

Date: October 14, 2026 (America/Denver; machine evidence timestamps are UTC).
Status: bounded audit completed; experimental protocol DRAFT; empirical feasibility unresolved.
Canonical intake: `PL-EVID-04`, EVA-001 refinement in [parking-lot-10](../../parking-lot-10.md).
Repository baseline: `c2bf81c26ebeb00d0f9390de66dd28d9157947ce`, remotely verified against accepted main.

**Finding:** retained evidence is enough to inspect chain fields and reuse research methods, but the audited datasets do not establish a historical four-leg entry/exit panel. Current Theta options entitlement could not be verified because the existing terminal is unavailable. This is a data-feasibility finding, not a rejection of EVA or evidence of positive expectancy.

The Principal commissioned a bounded local data audit and experimental protocol, allowing the investigator to challenge iron condors as the first specimen. The subsequent clarification assigns Muse research tasks, with prompts and returned evidence relayed through the Principal. No experiment execution, model fitting, backtest, strategy admission or production change is commissioned. The audit script inventories evidence only; it does not calculate trade outcomes.

## Deliverables

- [DATA-AUDIT.md](DATA-AUDIT.md): what is held, what vendors document, what was actually verified, and unresolved acquisition/execution dependencies.
- [PROTOCOL.md](PROTOCOL.md): smallest conditional experiment, cohort and management rules, forecast/economic tests and falsifiers. Not a frozen preregistration.
- [MUSE-PROMPT.md](MUSE-PROMPT.md): original self-contained primary-source research assignment for the Principal to relay; returned evidence is tracked separately below.
- [ROUND-1-VERIFICATION.md](ROUND-1-VERIFICATION.md): October 15 partial verification of the first returned Muse report; remaining investigations pending, protocol unchanged.
- [evidence/inventory.json](evidence/inventory.json): measured counts, hashes, source coverage and dated terminal connection result.
- [code/audit.py](code/audit.py): reproducible inventory. `python3 docs/research/eva-001/code/audit.py` reads retained sources and writes only this package's inventory. Optional `--probe-theta-existing` makes one read-only stock-EOD request to an already running terminal; it never starts a process, reads credentials or verifies option entitlement by inference from stocks.

## Recovered precedents and boundaries

Reuse the [research-program controls](../options-trading-research-program-control-2026-09-27.md): distinguish gross marks from executable net returns; freeze specifications before observing results; preserve null findings; separate trade and portfolio expectancy. The later [Q0 parked disposition](../options-trading-research-state-transition-q0-rabbit-hole-parked-2026-09-27.md) makes the missing retail SPX execution estimate a local dependency, not a global research stop. EVA's ETF study must not import an SPX execution scalar or resume Q1 by implication.

Reuse the [Partial Collar Test 1](../partial-collar-test1/README.md) provenance/hashing and causal data conventions, not its strategy or prior authorization. That test closed with FAIL and no successor test authorized. Reuse the accepted [TT Live contract](../../cli/tt-live-panel.md) for verified construction and target-versus-execution distinctions. `P50` is a profit-capture objective; no broker probability is manufactured from it.

Strategic fit is exploratory support for Evidence Trust and Position Reassessment, not a new roadmap Bet or delivery horizon. Any eventual authoritative Wheelwright analysis belongs to the backend under [Doc 77](../../77-api-v2-architectural-guardrails.md); this study adds no service, API, database or client computation. Market evidence, physical forecasts and deployment policy remain distinct under [Policy over Prediction](../../foundations/policy-over-prediction.md). Strategic/architectural reconciliation of future Product use remains separate, with Kiro's role preserved.

## Completion and continuation

Data sufficiency is **UNRESOLVED**, current options subscription access is **UNVERIFIED**, and the protocol is **DRAFT**. The first Muse prior-art report has been returned and partially source-checked; remaining investigations are pending. No economic results exist. The concrete continuation is reconciliation of the remaining research, preserving the round-one corrections and original protocol scope. A subsequent empirical run requires a verified dataset, frozen protocol, independent challenge and separate execution authorization; audit completion does not supply them.
