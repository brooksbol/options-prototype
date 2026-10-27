# Wheelwright

## 📖 [**API DOCUMENTATION — OPEN THE WHEELWRIGHT API REFERENCE**](https://brooksbol.github.io/options-prototype/)

**Browse the API:** https://brooksbol.github.io/options-prototype/


**Evidence-driven decision support for options-income trading.** Wheelwright explores how to turn brokerage observations, market evidence, explicit policy and operator judgment into inspectable, repeatable decisions. It is **not an automated trading bot**: brokerage order construction and execution remain under the operator's control.

The repository also serves as a working experiment in specification-driven engineering: working software produces evidence, evidence changes our understanding, and accepted decisions shape the next iteration.

## What works today

Wheelwright has multiple **distinct operational surfaces**. They are not interchangeable, and the v2 transition is not complete.

| Surface | Current role | Evidence / limitations |
|---|---|---|
| **v1 Web** (React/Vite + Java evidence service) | **Operational Cash Deployment and opportunity-selection system of record**; put, call and buy-write recommendations, Write Desk, briefs and production views | Retains historical v1 browser-owned decision logic and evidence cache. Protected transitional software; no forced cutover. |
| **v2 backend** | Foundational Holdings API: independently identified economic Positions, immutable Constructions/Model versions, separate broker Holdings/snapshots, read-only Orders, financial evaluations and retained evidence | Accepted backend installed locally on3101; source qualifications and Account grants apply. See the [deployment record](docs/implementation/api-v2-foundational-2026-10-21/deployment-2026-10-22.md) for verification and limitations. |
| **Wheelwright Talk** | Installed SDK conversation at [localhost:8787](http://localhost:8787/), or `wwt` | MCP exposes authorized backend reads; tracing and response storage are off. Source timestamps qualify answers; no trading tools. |
| **`ww` CLI** | Human held-evidence, Account inspection and explicit Fidelity CSV synchronization | Installed from current main against the same operational v2 evidence used by Talk. CSV synchronization is explicit; complete brokerage history is not implied. |
| **`tt positions` / `tt live`** | Standalone, read-only tastytrade API companion for broker positions and recognizable live-trade monitoring | Transitional companion, **not** v2 Position admission. Broker observations and indicative calculations are not execution or governed advice. |

**Accepted multi-broker Account discovery:** `ww ls accounts` shows authorized Fidelity and tastytrade Accounts using operator-selected aliases (`pts`, `sawdust`, `tt1` in the current operator setup) and masked native account numbers. Account identity, nickname resolution and User–Account grants are backend-owned.

**Current delivery:** The independently verified foundational Holdings backend is integrated and locally installed. Separate source-qualified broker custody observations and economic Positions are available through v2; missing occurrence/Order history remains unknown. The October27 Talk delivery adds installed SDK/MCP reads and verified Fidelity import catch-up; one authorized tastytrade refresh supplied real balance/holdings evidence. V1 remains a separate protected surface; `ww live` and v2 trading/execution are not delivered by this change.

See [the convergence intake](docs/parking-lot-10.md) and [the roadmap](docs/roadmap.md) for current dispositions; this README is an overview, not the project-state ledger.

## Architecture at a glance

- **Brokerage sources** supply observations, not Wheelwright policy or decisions. Fidelity evidence enters v2 through CSVs; backend tastytrade acquisition/normalization is implemented and fixture-verified. This release does not establish new live brokerage coverage. Standalone `tt` remains separate.
- **Authoritative v2 backend** owns durable evidence, Account/Position semantics, authorization, acquisition, business rules, policy and decision logic. Clients own interaction and presentation. Equivalent evidence and governance should yield equivalent domain conclusions across clients.
- **Evidence first:** retain provenance and distinguish source observation, acquisition, recording and inspection. Missing lifecycle history does not establish continuity, a working order, executable pricing or a management objective.
- **Operational separation:** v1 Web and v2 use separate Java services and SQLite files. The existing v1 Web workflow remains protected until an accepted replacement exists.

The governing architecture is documented in [principles](docs/principles.md), [API v2 guardrails](docs/77-api-v2-architectural-guardrails.md) and the [Evidence Appliance foundation](docs/foundations/evidence-appliance.md). Existing v1 client-side business logic is transitional debt, **not** a precedent for new v2 clients.

## Everyday commands

The installed `ww` CLI is intended to be used with familiar aliases, not internal Account IDs:

    ww ls accounts
    ww show positions --account pts
    ww show positions --account sawdust
    ww sync account pts
    ww show SPY
    ww ls quotes

`ww sync account pts` scans supported Fidelity CSV exports. It does not imply complete brokerage lifecycle coverage. Newly downloaded CSVs require an explicit sync; downloading a file alone does not ingest it. Talk reads accepted operational evidence directly. See the [October27 delivery receipt](docs/reviews/sdk-talk-real-read-profile-2026-10-27.md#installed-result--october27-final-production-observation) for verification and scope.

The standalone tastytrade companion provides:

    tt accounts
    tt positions
    tt live
    tt live --tsv

`tt live` uses the accepted compact **Ten-Second Read** layout:

    SYMBOL | PAYOFF | RANGE | SPOT | SPAN | EXIT PROFIT | P/L | QUOTE

It summarizes supported recognizable trades using qualified broker evidence. Incomplete or ambiguous history must not become invented economic or management facts. See [tt live display contract](docs/cli/tt-live-panel.md) for current meanings, limitations and colors; do not rely on older column descriptions.

For command options and output contracts, consult [the ww manual](docs/cli/ww-man.txt), [Account and Position guidance](docs/cli/ww-account-evidence.md) and the relevant CLI help. Human terminal output may be colored; explicit machine formats remain suitable for scripts.

## Local development

**Requirements:** Java 21, Node.js and npm, the Gradle wrapper, and appropriate private credentials for the services you intend to run. Never commit credentials, brokerage account numbers or token material.

The existing **v1 development** topology is:

| Component | Typical local port | Data |
|---|---:|---|
| Java v1 evidence backend | 3100 | `data/evidence.sqlite3` |
| Vite v1 frontend | 5173 | Browser presentation and transitional client-side state |
| Java v2 evidence backend | 3101 | `data/positions-v2.sqlite3` |

Ports and paths describe the accepted local setup, not universal deployment defaults. Do not point experimental work at operational databases without authorization. The repository's `scripts/dev.sh` controls the **v1** development stack; do not use it to restart the v2 service.

For a manual v1 development session, from separate terminals:

    cd evidence-service-java
    ./gradlew bootRun

    cd options-prototype
    npm run dev

The v1 frontend proxies `/api/*` to the v1 backend. Market acquisition needs the relevant provider configuration; an otherwise running service does not guarantee fresh market evidence.

**Tests:**

    cd evidence-service-java && ./gradlew test
    cd options-prototype && npx vitest run

Use the appropriate focused CLI/backend tests for the component being changed. Operational acceptance and visual acceptance are distinct from automated tests.

**Host availability matters:** scheduled market acquisition requires an awake, running host during the relevant market window. Display sleep is different from system sleep. Investigate host suspension when acquisition gaps appear. See the [current architecture](docs/07-architecture-current.md) and service-specific operating documentation for details.

## Repository map

| Path | Purpose |
|---|---|
| `AGENTS.md` | **AI-agent entry point**; agent cold-start routing belongs here, not in this README |
| `docs/README.md` | Documentation authority and index |
| `docs/principles.md`, `docs/foundations/` | Governing principles and architectural foundations |
| `docs/contracts/` | API and evidence contracts |
| `docs/parking-lot*.md`, `docs/roadmap.md` | Canonical intake, reconciliation and strategic direction |
| `docs/bugs/` | Authoritative defect records |
| `docs/journal/` | Project history and decision provenance |
| `evidence-service-java/` | Java/Spring evidence backend, v1 and v2 capabilities |
| `options-prototype/` | React/Vite v1 Web frontend |
| `scripts/` | CLI entry points and local development tools |
| `data/` | Local evidence databases and supporting assets (not all tracked) |

## Documentation and project history

Start with [the documentation guide](docs/README.md) to explore the current system, [the roadmap](docs/roadmap.md) for direction, and [the project journal](docs/journal/project-journal.md) for historical learning. Historical constraint-identification experiments and the earlier provider-admission investigation remain in [Doc 39](docs/39-constraint-identification-restart-plan.md) and [Doc 40](docs/40-provider-admission-controller-findings-2026-08-31.md); they are **not** presented here as the current active investigation.

The product goal remains a trustworthy, observable system that improves trading decisions while keeping the operator in control. Accepted software and evidence, not aspirational architecture, determine what Wheelwright can claim today.
