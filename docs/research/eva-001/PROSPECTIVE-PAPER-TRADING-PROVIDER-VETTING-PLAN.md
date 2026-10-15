# EVA-001 — Prospective Paper-Trading Provider Vetting Plan

**Status: PARKED.** Research qualification plan only. No provider selected, account creation, simulated/live order, purchase, architecture change or implementation authorized. Keep separate from `HISTORICAL-BACKTESTING-FEASIBILITY-PLAN.md` and EVA-001 draft protocol 0.2.

## Preserve evidence

Archive the original Muse interactive HTML **byte-for-byte** under `docs/research/eva-001/muse-raw/prospective-options-paper-trading-20261015.html`, clearly classified as unverified actor research. Preserve Codex's subsequent review as a separate corrective note; do not silently edit Muse's claims.

## Goal

Qualify **one** prospective paper trading provider for an auditable SPX two-leg defined-risk credit vertical, with SPY/XSP as possible alternatives. A working simulator is not proof of live execution fidelity, EVA forecast skill or economic value. Avoid a three-provider stack by default.

## Candidates

- **Alpaca** — leading API candidate. Verify actual Trading API paper entitlement for SPX multi-leg (do not substitute Broker API docs); index option contract OPRA quotes versus underlying SPX index level; simulated fill rules (marketable fills, NBBO size ignored, random partial fills), order persistence, fees, export, account isolation and retention. Documentation mentions default $100k paper balance and account creation/deletion; simultaneous access remains unproven.
- **Tradier** — sandbox alternative. Verify exact two-leg package submission and whether OTO/OCO/OTOCO genuinely supports package-level entry **and** exits. Independent documentation of multileg orders and brackets does not establish multileg brackets. Verify fill behavior, delayed data, persistence, fees and export.
- **Interactive Brokers** — alternative comparison simulator, **not** a real-fill reference. Document limited combo trading, paper fill mechanics, SPX support, statements, fees and API exports.
- **Webull** — optional manual practice only if it resolves a specific uncertainty; do not automatically add a third venue.

## Gate 0 — Documentation and entitlements (no spend)

Establish the precise plan/account entitlements, SPX/SPXW option quotes, order type, package order lifecycle, working GTC/nonfill behavior, fees, cash/buying power, and exportable order/leg/position records. Distinguish **documented, demonstrated, inferred, unknown**. Explicitly separate underlying index levels from index option contract data. Confirm whether independent control/treatment ledgers are possible (separate accounts optional). Record vendor sources and costs. If no credible export path exists, stop.

## Gate 1 — One complete prospective paper lifecycle (only when authorized)

Using a single candidate and a predefined bounded SPX vertical (fallback only with explanation), record entry-known timestamped market evidence, net-credit package limit, leg identifiers, order acceptance/rejection/nonfill, actual simulator fill event, persistent working closing order seeking 50% credit capture, or a time-based close at 21 DTE, itemized fees, cash/buying power and complete export. Independently recompute gross and net P/L. A parent order ID is not proof of synchronized fills; a fill inside the spread is not proof of live executability. Spread crossing and extra latency slippage may both apply if they represent distinct costs. Expiration/settlement is a **separate** optional simulator-qualification task, not a requirement for the 21-DTE experiment.

## Gate 2 — Decision memo

Report observed behavior, unknowns, export completeness, fee fidelity, order semantics and operating cost. Classify as documented, demonstrated, suitable for bounded forward observation, or not demonstrated. Add a second simulator **only** to resolve a named uncertainty. Cross-simulator agreement establishes neither live fill fidelity nor profitability.

## Future experiments — outside this plan

If qualified, prospective paper control and treatment books require identical eligible opportunity sets, frozen decisions before outcomes, comparable capital and management, independent ledgers and a no-trade option. Forecast skill, economic selection value, tail risk and small real-money execution calibration are separate studies. Historical backtesting remains its own workstream. Own strategic economics/validation; adopt mature commodity infrastructure.

**Next action:** None until Principal resumes and authorizes Gate 0.
