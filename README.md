# Options Prototype

> ## ⚠️ AI / WHEELWRIGHT WORK — START AT `docs/README.md`
>
> **`docs/README.md` is Wheelwright's documentation authority and bootstrap root.**
>
> Before substantive Wheelwright reasoning, review, implementation, reconciliation, or other outcome-bearing work, **stop here and begin with [`docs/README.md`](docs/README.md)**. Follow the current authority/bootstrap routing defined there.
>
> **Do not use this root README's project overview, active-investigation notes, or Documentation Roadmap as a substitute bootstrap path.** This file is the repository/project overview; it does not own the AI authority-acquisition sequence.


> A spec-driven prototype exploring whether an options income strategy can be engineered as a closed-loop financial control system.

This repository serves two purposes:

1. Explore a financial engineering hypothesis using working software.
2. Demonstrate an AI-assisted, spec-driven engineering methodology centered on organizational learning.

The objective is **not** to build a trading bot.

The objective is to build an observable system that continuously produces evidence.

---

# Project Status

| Component | Status |
|-----------|--------|
| Frontend (options-prototype) | ✅ Operational — puts, calls, buy-writes |
| Java backend (evidence-service-java) | ✅ Operational — live-market acceptance recorded August 3, 2026 |
| Migration status | Complete — Java is the sole evidence backend |
| Architecture documentation | ✅ Ratified |
| Behavioral invariants | ✅ Ratified (18 total) |
| Snapshot contract v1 | ✅ Frozen |
| Calls (Horizon A) | ✅ Restored — cache-based call recommendations |
| Multi-expiration evidence | ✅ Full eligible 7–45 DTE acquisition |
| Cloud deployment | 📋 Accepted architecture — post-retooling |

## Active Investigation — Constraint Identification

Before doing new optimization work, read:

1. **`docs/39-constraint-identification-restart-plan.md`** — governing TOC discipline and original restart prescription.
2. **`docs/40-provider-admission-controller-findings-2026-08-31.md`** — latest measured evidence and Kiro handoff.

Current governing position: **Herbie has not yet been identified.** August 31 measurement established that the old provider path materially underutilized Tradier's documented Production market-data allowance while due WIP persisted. A bounded after-hours experiment then demonstrated a strictly single-flight, 119-entry trailing-60-second controller operating without fixed inter-request sleep at 119.72 actual HTTP starts/minute for one hour: 7,200/7,200 HTTP 200, zero 429s, stable provider latency, and no durable-state interference.

This is a machine-level finding, not a system-constraint declaration. The next discriminating work is a regular-session evaluation of what the new admission behavior does to WIP age/depth, Decision coverage, evidence freshness, publication cadence, quota waits, and scheduler handoff behavior.

Kiro steering points to the same active evidence checkpoint via `.kiro/steering/current-investigation.md`.

---

# Local Development

## tastytrade read-only CLI (exploratory)

`tt` is a small, **read-only production** tastytrade utility. It lists accessible accounts, shows broker positions alongside complex orders, and provides a concise live-trade view for clean, recognizable trades. It only exchanges OAuth credentials and calls allowlisted account, position, order, complex-order, and batched equity-option quote GET endpoints at `https://api.tastyworks.com`. It cannot submit, edit, or cancel an order, and it does not use the Wheelwright evidence service or change trading policy. Positions and complex-order child statuses are separate broker facts, not a claim that a position is protected.

From the repository root, install the thin shell launcher once on your local PATH (this machine already has `~/.local/bin` on PATH):

```bash
ln -s "$(pwd)/scripts/tt" "$HOME/.local/bin/tt"
```

Supply **production** OAuth credentials through exported environment variables or the Git-ignored root `.env`. The file may contain `TASTYTRADE_CLIENT_ID=`, `TASTYTRADE_CLIENT_SECRET=`, and `TASTYTRADE_REFRESH_TOKEN=` with the production values after each `=`. Keep it private (`chmod 600 .env`); do not commit, share, or print it. `tt` reads only these three values after validating a broker command. Exported values take precedence over `.env` values. Help and invalid commands do not read credentials or access the network.

```bash
tt
tt --help
tt accounts
tt positions
tt positions --account 5WX01234  # Use this form if you have multiple accounts
tt live
tt live --account 5WX01234       # Use this form if you have multiple accounts
tt live --tsv > foo.tsv           # Explicit tab-separated export; no terminal colors
```

Expected output shape (illustrative account values):

```text
tastytrade production: authenticated
accounts: 1
5WX01234  Individual  owner
```

`tt positions` selects the sole accessible account automatically, or requires `--account` when there are multiple accounts. It shows positions and each returned complex order and child status, with explicit complex-order pagination completeness. Zero results are explicit; incomplete retrieval exits nonzero. Run credential-free unit tests with `node --test scripts/tastytrade.test.mjs`. See the [current tastytrade OAuth guide](https://developer.tastytrade.com/docs/authentication/oauth2/) for credential setup. Sandbox and production OAuth credentials are separate.

`tt live` applies the same account selection rule. Its first supported trade shape is a clean, four-leg short iron condor with a unique filled opening order and matching target/stop children. It derives opening credit from executed leg fills and an **indicative** closing debit from timestamped leg quote mids. Its aligned columns show a masked account number, symbol, `DIRECTION`, trade quantity, indicative `TOTAL G/L` since entry, active objective, the executed opening fill date in New York time (`OPENED`, MM/DD), elapsed New York calendar days since that fill (`DAYS`, opening day is 0), DTE, and the age of the oldest leg quote for that trade (`QUOTE`). `DIRECTION` sums signed, current tastytrade leg deltas in the trade’s own underlying (not beta-weighted delta): within 10 share equivalents per condor is `NEUTRAL`, above +10 is `BULLISH`, below −10 is `BEARISH`. Missing or older-than-12-hour Greeks show `—` rather than a guessed direction. Dollar gain/loss uses the contract multiplier and excludes fees. GREEN target progress measures movement from entry credit toward the identified profit-taking close debit; RED shows the indicative debit gap above its target. The terminal table has a blank line before and after it. The human-readable table colors `BULLISH` green, `NEUTRAL` yellow, and `BEARISH` red, alongside the existing green/red economic segments, including when piped to a color-aware display such as `watch -c`; ordinary redirection preserves those ANSI colors. Use `--tsv` for tab-delimited, uncolored rows with the same display values and no extra blank lines. Routine order status and unrelated cancelled/rejected history stay out of the operator view, while an order transition can surface when it changes the story. Quotes older than 12 hours suppress economic color. Unsupported or ambiguous holdings, incomplete paginated evidence, and missing quotes fail safely without a partial trade summary. Use `tt positions` for the underlying broker evidence. This view does not establish that a trade is safe, protected, or compliant with Wheelwright policy.

### Ten-Second Read

The product concept behind `tt live` is the **Ten-Second Read**: within roughly ten seconds, the operator should be able to look at the live account and understand what recognizable trades exist, how each is doing, what managed objective matters, and whether time or evidence freshness requires attention. The operator should not have to regroup legs, reconstruct entry economics, calculate package economics, inspect routine order plumbing, or manually compare current value to the active objective.

The view is intentionally operator-shaped rather than broker-shaped. Its core questions are: What trade is this? Is it currently doing well or badly relative to entry? By roughly how much? Where is it relative to the current managed objective? Is time becoming important? Is the valuation evidence fresh enough for an indicative read? Is there an exceptional condition that needs attention?

For live trades, **GREEN/RED is live-state vocabulary**: GREEN means the trade is economically better than entry under the current indicative valuation; RED means it is economically worse. This is since-entry state, not P/L Day. **Winner/loser is terminal vocabulary** reserved for completed trades. If evidence cannot establish live state truthfully, the view should prefer unknown/failure over fabricated certainty.

`OBJECTIVE` translates the active management objective into operator language. For a GREEN short-premium trade, progress toward a profit-taking close may be useful (for example, `43% to target (0.21)`). RED does not require a symmetrical percentage; a statement such as `off target (0.09) by 0.22` can be more useful. The relevant objective is the actual managed objective, not necessarily the theoretical expiration maximum.

`OPENED`, `DAYS`, and `DTE` answer different time questions: when the trade began, how long it has been live, and how much expiration time remains. `QUOTE` compresses timestamp provenance into the age of the oldest quote supporting the indicative package valuation. Routine OCO/OTOCO state and normal child-order plumbing stay out of the Ten-Second Read unless they materially change the story or create an exception.

Recognition is deliberately **happy-path first and fail-closed**. When broker evidence cleanly supports a recognizable live-trade story, summarize it. When grouping, lifecycle, or economics are ambiguous, do not invent a story; use `tt positions` for the lower-level evidence. Partial closes, scale-ins, rolls, assignment, adjusted contracts, reused contracts, ambiguous grouping, calendars/diagonals, covered-call provenance, and exhaustive tastytrade structure reconstruction are known deferred cases rather than prerequisites for making the clean case useful.

`tt` and Wheelwright are intended to **augment tastytrade, not replace it**. tastytrade remains the trading workstation for chains, curves, order construction, detailed inspection, adjustment, submission, and broker-native state. Wheelwright remains decision-support. `tt positions` is the tastytrade/API evidence companion; `tt live` is the bridge from that evidence into the operator's mental model. A useful guardrail is: if this tooling is rebuilding tastytrade, something has probably gone wrong; if it is translating between tastytrade and the operator's established decision/management model, it is probably in the right territory.


## Quick Start

```bash
# Start the Java backend
cd evidence-service-java
export TRADIER_API_KEY=<your-key>
./gradlew bootRun

# In another terminal: start the frontend
cd options-prototype
npm run dev
```

| Service | Port | Purpose |
|---------|------|---------|
| evidence-service-java | 3100 | Backend evidence appliance |
| options-prototype | 5173 | Frontend (Vite dev server) |

The frontend proxies `/api/*` requests to the backend at `localhost:3100` automatically.

**Requirements:**
- JDK 21 LTS (Temurin recommended)
- Node.js (via nvm)
- `TRADIER_API_KEY` environment variable

## Host Execution Requirement

A Wheelwright evidence-service host must remain continuously executing during time-sensitive acquisition windows.

The evidence service is an always-on appliance, not a tool invoked on demand. Its scheduler performs session-aware acquisition (Phase 1 expiration preparation, Phase 2 delay-window work, Phase 3 opening burst) according to market-session time boundaries. If the host suspends during these windows, scheduled work cannot fire and the operator arrives to find an unprepared board rather than mature evidence.

**Local appliance (development laptop):**
- System sleep during acquisition windows is not acceptable. Display sleep is fine.
- macOS: enable "Prevent automatic sleeping on power adapter when the display is off" in System Settings → Energy. Alternatively, `caffeinate -s` provides process-bound sleep prevention.
- Other hosts: equivalent mechanism to prevent OS suspension while the JVM is running.

**Cloud appliance:**
- Same invariant applies. Avoid scale-to-zero or platform suspension across acquisition windows.
- The evidence service must execute continuously from at least 09:00 ET through 16:15 ET on trading days.

**Diagnostic rule:** A running Wheelwright process does not prove continuous acquisition execution. If unexplained scheduler gaps are observed (e.g., expected work not performed on time), check host sleep/suspension history (`pmset -g log` on macOS) before diagnosing an application scheduling defect. Monday August 24, 2026 established this rule empirically: a 13-minute Phase 3 delay was caused entirely by macOS Maintenance Sleep, not by any Wheelwright defect.

---

# Development Philosophy

This repository intentionally follows a spec-driven engineering process.

```
Question
    ↓
Learning
    ↓
Knowledge
    ↓
Specification
    ↓
Working Software
    ↓
Evidence
    ↓
Learning
```

Working software is not the final objective.

Working software is the mechanism by which architectural hypotheses are tested and organizational learning is accelerated.

---

# Repository Structure

```
README.md                         Repository entry point

docs/
    foundations/                   Constitutional architecture documents
    contracts/                    Versioned API contracts
    journal/                      Append-only project journal
    ...                           Architecture, design, and analysis docs

evidence-service-java/            Java backend (Spring Boot, Java 21, SQLite)
    src/main/java/                Application: worker, scheduler, controllers, store
    src/test/java/                JUnit 5 tests
    build.gradle.kts              Gradle build (Kotlin DSL, Java 21 toolchain)
    gradlew                       Gradle Wrapper (canonical build entry point)

data/                             Wheelwright-owned durable assets
    seeds/                        Canonical universe seed CSV
    evidence.sqlite3              Runtime evidence store (not tracked in Git)

options-prototype/                React frontend (Vite, TypeScript)
    src/                          Components, recommendation engines, domain logic
    tests/                        Vitest frontend tests

scripts/
    dev.sh                        Starts Java Evidence Appliance + Vite frontend
```

---

# Documentation Roadmap

Recommended reading order:

1. `docs/foundations/evidence-appliance.md` — System identity
2. `docs/foundations/system-goal-hierarchy.md` — Goal hierarchy; machinery → widgets → decision quality → productive capital → household mission
3. `docs/foundations/retooling-charter.md` — Migration governance
4. `docs/07-architecture-current.md` — Current architecture
5. `docs/foundations/backend-behavioral-invariants.md` — 18 ratified invariants
6. `docs/contracts/evidence-snapshot-v1.md` — Frozen API contract
7. `docs/foundations/closed-loop-engineering.md` — Engineering methodology
8. `docs/00-project-charter.md` — Original vision

`docs/foundations/system-goal-hierarchy.md` is a recurring orientation document, not merely bootstrap material. Revisit it before major new initiatives or local optimization work to restore the relationship between the immediate technical problem and the higher-level system goal.

For current active work after completing the authority reading order, read `docs/39-constraint-identification-restart-plan.md` followed by `docs/40-provider-admission-controller-findings-2026-08-31.md` before proposing optimization changes.

---

# Clean Laptop Bootstrap

Verified on:

- macOS 26.5.1
- Apple Silicon (arm64)

## 1. Install Xcode Command Line Tools

```bash
xcode-select --install
```

## 2. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(brew --prefix homebrew shellenv)"
```

## 3. Install nvm and Node.js

```bash
brew install nvm
mkdir -p ~/.nvm
```

Add to `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && . "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
```

```bash
source ~/.zshrc
nvm install --lts
nvm alias default 'lts/*'
```

## 4. Install Java 21 LTS

```bash
brew install --cask temurin@21
```

Add to `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
```

```bash
source ~/.zshrc
```

## 5. Verify Toolchain

```bash
git --version        # 2.50+
node --version       # v24.x
npm --version        # 11.x
java -version        # Temurin 21.x
./gradlew --version  # Gradle 9.x (from evidence-service-java/)
```

---

# Running Tests

```bash
# Java backend
cd evidence-service-java && ./gradlew clean test

# Frontend
cd options-prototype && npx vitest run
```

Both suites must pass before merging to main.

---

# Current Scope

The system currently implements:

- **Evidence Appliance** — background acquisition (self-scheduling, session-aware, tiered A/B/C/D freshness, bounded recovery probes for prior-epoch failures, full 7–45 DTE multi-expiration acquisition)
- **Durable SQLite persistence** — failed-refresh preservation, generation tracking, restart recovery
- **Snapshot publication** — ETag/conditional HTTP (304), coherent evidence snapshots
- **Selective quote observations** — `GET /api/evidence/quotes?symbol=...` for lightweight per-symbol price projection
- **Operator Console** (home surface) — expiration-native DTE ladder with d3-hierarchy treemap, moneyness visualization (OTM/ATM/ITM + signed %), position-detail modal with progressive learning
- **Position Monitoring** — Portfolio + Evidence composition producing moneyness, DTE, capital, and full observation provenance
- **Put recommendations** (Wheelwright) — deterministic, cache-backed, zero provider calls
- **Call recommendations** (Horizon A) — inventory-driven, cache-backed, for held unencumbered shares
- **Buy-write recommendations** — share-acquisition + covered-call composite candidates, affordability-gated
- **Write Desk** — collapsible put/call/buy-write sections, sortable tables, policy controls, cross-entry composition
- **Recommendation Brief** — put, buy-write, and covered-call drawers with decision summary, evidence, neighborhood, governance
- **Broker handoff** — Fidelity trade link construction (cash-secured puts and covered calls; buy-write handoff deferred)
- **Production accounting** — backend-authoritative monthly reconciliation from Fidelity Activity History
- **Market session model** — 6-state classification, trading calendar, sealed evidence semantics
- **Instrument governance** — product structure classification, leveraged/inverse detection
- **Instrument Catalog** and Description Library (1,280 tickers with domain-specific descriptions)
- **Position economics** — Fidelity CSV basis data preserved in portfolio snapshot

Out of scope:

- Brokerage API integration (automated trading)
- Multi-user access
- Prediction models
- Portfolio optimization

---

# Evidence Appliance Vision

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support. The backend continuously maintains an authoritative model of the options opportunity environment. Consumers apply operator-configured policy, determine recommendation state, explain it, and support — but do not perform — execution.

The system is governed by ratified architectural principles documented in `docs/foundations/`.

---

# GitHub SSH Setup

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# Add to GitHub → Settings → SSH and GPG Keys → New SSH Key
ssh -T git@github.com
```
