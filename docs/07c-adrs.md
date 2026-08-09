# Architecture Decision Records

**Status:** Authoritative as of July 2026

---

## ADR-001: Evidence Acquisition and Recommendation are Separate Concerns

**Date:** July 2026
**Status:** Accepted

**Context:** The initial prototype combined market data fetching and recommendation generation in a single scan pass. This made recommendations dependent on network availability and created coupling between evidence freshness and ranking logic.

**Decision:** Separate Evidence Acquisition (makes provider calls, populates cache) from the Recommendation Engine (reads cache only, zero provider calls). Evidence Acquisition owns market evidence. Wheelwright owns recommendation generation.

**Consequences:**
- Recommendations can be regenerated instantly when policy changes (no network round-trip)
- Cached evidence survives browser reloads and session transitions
- The operator can change ranking mode without triggering new provider calls
- Evidence quality and recommendation quality are independently assessable

---

## ADR-002: Wheelwright as the Recommendation Craftsmanship Layer

**Date:** July 2026
**Status:** Accepted

**Context:** The recommendation engine needed a domain identity to distinguish it from the Write Desk (UI) and Evidence Acquisition (network). "Recommendation Lab" was the prior name but implied experimentation rather than operational craftsmanship.

**Decision:** Introduce "Wheelwright" as the internal domain concept for the recommendation engine. The user-facing product feature remains "Write Desk." Wheelwright represents the precision and craftsmanship of recommendation generation.

**Consequences:**
- Internal naming: `buildWheelwrightBrief`, `WheelwrightBriefViewModel`, `WheelwrightProvenance`
- The Write Desk is the workbench; Wheelwright is the craftsman
- Clear ownership: Wheelwright owns ranking, contract selection, execution assessment, and brief building

---

## ADR-003: Recommendation Rank Independent of Presentation Sort

**Date:** July 2026
**Status:** Accepted

**Context:** When column sorting was added to the candidate table, there was a question of whether changing the sort should reset or recompute the recommendation order.

**Decision:** Recommendation rank and table presentation sort are independent concepts. The operator may sort by any column without affecting the underlying recommendation order. The Brief displays both "Recommendation #N" and "Table Position #M (sorted by X)" when they differ.

**Consequences:**
- No auto-reset of user's column sort when policy changes
- Rank column always shows the Wheelwright-assigned rank regardless of view sort
- UI explicitly communicates when view order differs from recommendation order

---

## ADR-004: Broker Handoff via Pre-Populated Trade Ticket

**Date:** July 2026
**Status:** Accepted

**Context:** Discovered that Fidelity accepts externally constructed option trade-ticket URLs with pre-populated fields (ORDER_TYPE, ORDER_ACTION, LIMIT_STOP_PRICE, SECURITY_ID).

**Decision:** Implement broker handoff as a URL construction + new-tab open. The system constructs a `WriteIntent` (broker-neutral), converts it via a `FidelityTradeLinkBuilder` (broker adapter), and opens the result in a new tab. The system must not submit orders, interact with credentials, or assume order acceptance.

**Consequences:**
- Execution boundary is explicit and documented
- Operator must verify: account, quantity, TIF, limit price, contract identity
- Multiple broker adapters possible in future (same WriteIntent, different URL builders)
- Portfolio state is never mutated by opening a trade link

---

## ADR-005: Progressive Disclosure for Portfolio Context

**Date:** July 2026
**Status:** Accepted

**Context:** The portfolio state panels (call capacity, put budget, existing positions) consumed ~300px of vertical space before the recommendation table. On laptop viewports, this meant scrolling to reach the operational surface.

**Decision:** Recompose the pre-table area into 3 compact bands. Portfolio detail moves behind a `<details>` disclosure element. The collapsed state shows only operational facts (chips: "Calls: XLE·1", "Short puts: XLF $42 08-15"). Full inventory tables and detailed balances are one click away.

**Consequences:**
- Candidate table starts within ~120px of the top on a laptop viewport
- All portfolio detail remains accessible (not removed)
- The operator spends most time in the recommendation board, not the portfolio summary
- The page reads as a Write Desk, not a portfolio dashboard

---

## ADR-006: Right-Side Drawer for Recommendation Brief

**Date:** July 2026
**Status:** Accepted

**Context:** Three options were considered for displaying recommendation detail: inline row expansion, modal dialog, and side drawer.

**Decision:** Use a right-side drawer. The table remains visible while the Brief is open. The operator can click different rows to update the drawer without closing it.

**Rejected alternatives:**
- Inline row expansion: too cramped for 5 sections of evidence
- Modal: blocks table visibility, breaks the compare-and-decide workflow

**Consequences:**
- Table and Brief are visible simultaneously
- Layout shifts via `margin-right` when drawer opens
- Independent scrolling for table and drawer
- Drawer width: 370px (leaves usable table space at 1440px)

---

## ADR-007: Session-Aware Evidence Governance

**Date:** July 2026
**Status:** Accepted (provisional implementation)

**Context:** Options evidence has different validity semantics depending on market session state. A chain cached at 3:30 PM during regular session is canonical. The same data retrieved at 8 PM is after-hours and potentially stale.

**Decision:** Implement a 6-state market session model. Evidence acquisition is gated by session state. Cached evidence from the canonical session date remains operationally valid during closed sessions regardless of wall-clock TTL.

**Current status:** The session model is complete. A `sessionClosed: boolean` shortcut is used for recommendation eligibility rather than full provenance verification. This is documented as technical debt with a clear upgrade path.

---

## ADR-008: Yahoo 496 as Authoritative Put Universe

**Date:** July 2026
**Status:** Accepted

**Context:** The system needed a defined ETF universe for put scanning. Options considered: curated 15-symbol list, SEC/FMP catalog, Yahoo Finance top ETFs list.

**Decision:** Use the Yahoo 496 ETFs (captured July 13, 2026) as the authoritative put universe. The former `CURATED_UNIVERSE` is renamed to `PRIORITY_WATCHLIST` (non-authoritative, operator additions for priority scheduling).

**Consequences:**
- Full universe scan covers 496 symbols
- Priority watchlist symbols are scanned first but don't constitute the universe
- Velvet Rope (admission gating) remains a future concern — the Yahoo list serves as a practical starting universe

---

## ADR-009: Numbers-First Typography

**Date:** July 2026
**Status:** Accepted

**Context:** The Write Desk is fundamentally a numerical application. Early designs gave equal visual weight to labels and values.

**Decision:** Numeric values visually dominate their labels. Values render larger, bolder, and in monospace. Labels render smaller, lighter, uppercase, and in sans-serif. The operator's eye naturally finds important numbers before reading supporting context.

**Consequences:**
- Decision summary uses 13–15px bold mono for values, 9px uppercase for labels
- Table cells are monospace primary text
- Position Impact labels are subordinate to values
- Consistent across Brief, table, and all data displays

---

## ADR-010: Centralized Theme Tokens

**Date:** July 2026
**Status:** Accepted

**Context:** CSS values were proliferating as one-off hex colors across multiple component stylesheets.

**Decision:** Centralize all palette values, typographic scales, and spacing into `theme-tokens.css` using CSS custom properties. Component CSS files `@import` the tokens file. No raw hex values in component CSS.

**Token hierarchy:**
- `--wd-text-primary` — numbers, key values, headings
- `--wd-text-secondary` — labels, descriptions, constrained data
- `--wd-text-disabled` — truly unavailable content

**Consequences:**
- Single source of truth for the dark-theme palette
- Typography scale tokens (hero/value/body/label/micro) ensure consistency
- Spacing tokens reduce pixel-counting across components

---

## ADR-011: Application-Scoped Portfolio Ingestion

**Date:** July 2026
**Status:** Accepted

**Context:** Portfolio ingestion (Fidelity CSV import) currently lives inside the WriteDesk component. The raw CSV text persists in localStorage (application-accessible), but the parsed `PortfolioSnapshot`, validation state, provenance, and derived data are owned by WriteDesk's component state. When a second surface needs portfolio data (e.g., the Operator Console), it has no access without duplicating the import mechanism or lifting state.

The current implementation gap: raw imports are technically durable (localStorage), but parsed portfolio state is page-local.

**Decision:** Portfolio ingestion belongs to Wheelwright, not to an individual page or surface.

Specifically:

- Raw imported data, parsed datasets, provenance metadata, validation state, and derived `PortfolioSnapshot` are shared application state.
- Import controls (file inputs, status indicators) may appear on one or more surfaces, but they consume and update shared state rather than owning independent copies.
- Multiple Wheelwright surfaces observe one consistent imported portfolio.
- A portfolio change on any surface is immediately visible to all other surfaces.
- Historical portfolio observations (time-series data for NAV visualization) are a future shared dataset, architecturally distinct from the current point-in-time snapshot. Their acquisition mechanism, schema, and storage lifecycle are unresolved.

**Rejected alternatives:**

- Keep imports page-local and duplicate import UI per surface: violates single-source-of-truth; operator would re-upload the same files in multiple places.
- Share only raw localStorage and re-parse independently per surface: wasteful; risks inconsistent parse results if parsers diverge; no shared validation state.

**Consequences:**

- Implementation must lift `PortfolioSnapshot` and related state out of the WriteDesk component into application-level shared infrastructure.
- The existing `FidelityUpload` component becomes a consumer/updater of shared state rather than an owner.
- Import provenance (source files, timestamps, validation warnings) is shared — every surface can display import freshness without re-inspecting localStorage.
- Future data types (positions CSV, activity CSV, historical observations) participate in the same shared-ingestion model.
- The specific frontend state mechanism (React Context, external store, module-level singleton) is an implementation choice, not an architectural decision. Any mechanism that provides consistent, observable, application-scoped state satisfies the ADR.

**Unresolved (deliberately excluded):**

- Frontend state technology selection
- Portfolio-history CSV schema and acquisition contract
- Historical-observation storage and lifecycle
- Navigation structure between Wheelwright surfaces
- Whether import UI appears on one surface or multiple surfaces simultaneously

---

## ADR-012: Operator Console as Wheelwright Home Surface

**Date:** July 2026
**Status:** Accepted

**Context:** Wheelwright's operational surface (currently implemented as `WriteDesk.tsx`) combines portfolio monitoring, recommendation discovery, contract selection, and execution support in a single table-oriented page. As the system matures, these responsibilities need distinct surfaces. The operator's first question upon arriving is not "what should I write?" but "where is my capital, what needs attention, and am I on track?" — a monitoring and orientation concern rather than a recommendation concern.

The table-oriented portfolio display answers "what contracts do I own?" rather than the operationally meaningful "where is my capital committed over time and what requires attention?"

**Decision:** The Operator Console becomes Wheelwright's primary home and landing surface.

Specifically:

- The Operator Console is the first operational surface the operator sees (after authentication, when implemented).
- Its purpose is operator orientation: monitoring, urgency awareness, mission progress, and capacity assessment.
- It represents the portfolio operationally — "encumbered capital over time" — rather than as an accounting-style position table. The primary temporal dimension is DTE.
- It consumes application-scoped portfolio state (ADR-011) rather than owning its own import mechanism.
- It incorporates the active situation model (`docs/25-situation-architecture.md`) to provide situation-aware context, health, and mission framing.
- Recommendation, discovery, selection, and execution capabilities remain part of Wheelwright but are not the primary responsibility of the home surface. They will be accessible from a separate functional area.
- The product name "Write Desk" is retired for new architecture and product terminology. Existing code identifiers may retain the old name until deliberate refactoring.

**Rejected alternatives:**

- Keep the current unified table page as the landing surface: conflates monitoring with action; operators spend cognitive effort determining portfolio state before reaching the work they came to do.
- Add a dashboard alongside the existing page without changing the landing: creates redundancy; monitoring information would exist in two places with no clear primary.
- Build the Console as a separate standalone application: unnecessary fragmentation; portfolio state and evidence infrastructure should be shared within one application boundary.

**Consequences:**

- A new route/surface must be created and registered as the application home.
- The existing recommendation and execution functionality continues to exist as a distinct Wheelwright surface (not deleted, not merged into the Console).
- Application-scoped state (ADR-011) becomes a prerequisite for implementation — both surfaces must share portfolio and evidence state.
- The Console's information hierarchy, visualization design, health classification, and progressive disclosure are specified in a separate Operator Console architecture document (not this ADR).
- Navigation between the Console and recommendation capabilities must be designed, but the navigation mechanism is deliberately deferred until implementation informs the right model.

**Relationship to other decisions:**

- **ADR-011** — The Console depends on application-scoped portfolio ingestion. It consumes shared state rather than owning imports.
- **`docs/25-situation-architecture.md`** — The Console renders portfolio state through the lens of the active situation. Situation parameters (regime, objective, horizon) are visible on the Console. Health and urgency may be situation-informed.

---

## ADR-013: Position Monitoring Model

**Date:** July 2026
**Status:** Accepted

**Context:** The Operator Console (ADR-012) needs to communicate the operational state of held positions on the DTE ladder. Conventional options dashboards use a single "health" classification that equates assignment risk with deterioration (red = ITM, green = far OTM). This is architecturally wrong for Wheelwright: assignment is an outcome, not a defect. A short put approaching assignment may be functioning exactly as intended. A covered call deep ITM near expiration may be excellent (effective exit above basis) or destructive (exit below basis) depending on economics that moneyness alone cannot determine.

A single composite health score would violate Epistemic Integrity by encoding unsupported normative judgments as system-provided classification.

**Decision:** Position monitoring decomposes into three independent dimensions with an explicit fact-to-interpretation boundary:

### 1. Contract State (Observable Facts)

Objective measurements requiring no interpretation:
- Option type, strike, expiration, DTE, quantity
- Encumbered capital
- Current underlying price (when evidence available)
- Moneyness (ITM/ATM/OTM)
- Distance from strike (absolute and percentage)

These are situation-independent and carry no implication of good or bad.

### 2. Decision Pressure (Operational Interpretation)

An assessment of whether resolution is approaching and operator awareness is warranted.

Decision Pressure consumes observable inputs — primarily **resolution proximity** (a derived fact combining current DTE and current moneyness magnitude) — and interprets them as an increasing need for operator attention. Resolution proximity is a point-in-time assessment: how close is expiration (temporal) and how close is the underlying to the strike right now (spatial). No historical moneyness observations or trajectory analysis is implied.

The distinction matters:
- "2 DTE, ITM by $3, assignment path probable" — derived fact (resolution proximity)
- "This position warrants increasing operator awareness" — operational interpretation (decision pressure)

Decision Pressure is derived from contract state using operational logic intrinsic to options lifecycle management. Its initial semantics are situation-independent. It does not require a situation-policy framework to function. Future concrete situations may provide additional interpretation or modified attention thresholds when demonstrated by actual operator requirements.

Decision Pressure indicates "a decision point is approaching" — not "something is going wrong."

### 3. Economic Consequence (Data-Dependent Assessment)

What resolution means economically, calculated from available data:

- For covered calls: effective exit price (strike + premium), gain/loss relative to cost basis
- For short puts: shares acquired at strike, effective basis from premium (when known)
- For both: encumbered capital released or transformed

Economic Consequence requires inputs beyond contract state — particularly cost basis for calls and entry premium for puts. When these are unavailable, the assessment is explicitly partial or indeterminate rather than fabricated.

Economic Consequence is arithmetic, not judgment. "$55.50 effective exit, +$2.20 versus basis" is a calculation. Whether that is desirable depends on context that this dimension does not supply.

### Layering and Independence

```
Contract State (facts)
    ↓
Resolution Proximity (derived fact)
    ↓
Decision Pressure (operational interpretation)

Contract State + Cost Basis (facts)
    ↓
Economic Consequence (arithmetic assessment)

[Future] Situational Interpretation
    ↑ consumes all of the above
    ↑ does not produce or constrain them
```

Each dimension is independently useful. If `docs/25-situation-architecture.md` were removed, the Position Monitoring Model would still be complete and operational.

Situations may later provide interpretive context (e.g., "assignment here serves the Bridge Income mission") on top of these primitives. The monitoring model creates primitives that situations can consume — it does not embed or require situation semantics.

**Consequences:**

- The DTE ladder tile can render resolution proximity and decision pressure without implying normative health judgment.
- Economic consequence can be displayed when data is available without waiting for a situation framework.
- No position is classified as inherently "bad" by the monitoring model — only as approaching resolution, requiring attention, or having specific economic outcomes.
- "ITM near expiration" is never architecturally encoded as a defect.
- The word "health" is not used as an architectural concept. Position monitoring uses the named dimensions instead.
- Categorical thresholds for decision pressure (e.g., how many DTE constitute "approaching") remain unresolved and belong in a subsequent design artifact.
- Visual encoding (colors, shapes, opacity) for these dimensions on the ladder is a design decision, not an architectural one.

**Relationship to other decisions:**

- **ADR-012** — The Console renders position monitoring on the DTE ladder.
- **`docs/25-situation-architecture.md`** — Situations may later interpret monitoring primitives. The monitoring model does not depend on or assume situation semantics.
- **Epistemic Integrity** — The model preserves the fact-to-interpretation boundary. Observations are not presented as judgments.

**Explicitly not decided:**

- Decision-pressure threshold values
- Number of categorical states or their names
- Visual encoding
- How situations modify interpretation
- Frontend implementation
- How missing economic data is visually represented
- Whether resolution proximity should be a separately named field in the data model or remain implicit in the decision-pressure derivation
