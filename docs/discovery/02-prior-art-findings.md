# Prior-Art Findings

**Date:** August 2026
**Status:** Reference documentation — records research findings
**Origin:** Three-actor reconciliation discussion (two Kiro sessions, August 2026)

---

## Purpose

This document records findings from a prior-art reconnaissance across options-income tools, portfolio-tracking systems, and trade-journaling platforms. The purpose is learning from established approaches — understanding what vocabulary, ontology, and UX patterns already exist so that Wheelwright does not reinvent them unnecessarily.

This is NOT:
- A competitive analysis
- A feature-parity roadmap
- Commercial positioning
- A specification for what Wheelwright should build next

---

## Summary of Findings

| Product | Primary Lesson for Wheelwright | What Not to Copy |
|---|---|---|
| TradesViz | Lifecycle semantic richness — assignment, adjusted basis, cycle/premium tracking | Complexity overload; every possible metric shown simultaneously |
| Wheel Strategy Options | Explicit wheel lifecycle model (CSP → assignment → shares → CC) | Narrow focus; limited to one strategy with broker overlay |
| ORATS | Quantitative depth under a compressed analytical surface | Analytical depth as product identity — Wheelwright should not become an inferior ORATS |
| OptionStrat | Visual information shaping; manipulable option economics | Pure visualization focus without governance or institutional reasoning |
| Fidelity | Source-of-record/custody boundary; technically correct but cognitively difficult accounting | Conflation of broker accounting with operator-oriented economic perspective |
| Koyfin | Configurable portfolio perspectives; concentration/exposure views | Dashboard-ification — breadth without depth or governance |
| Sharesight / Portfolio Performance | Transaction/accounting ontology already distinguishes deposits, withdrawals, dividends, interest, fees, trades, principal, income, gains | Over-general portfolio tracking without domain-specific insight |
| Edgewonk / Tradervue | Longitudinal behavioral analysis; trade journaling; pattern recognition over time | Behavioral analytics as a standalone product rather than integrated with evidence/governance |

---

## Detailed Findings

### TradesViz

**What it demonstrates:**
- Option transactions can be linked into semantic lifecycles (open → manage → close/assign)
- Adjusted cost basis can be computed from premium history
- Cycle tracking (how many times a wheel has been run on an instrument) is a meaningful metric
- Assignment and exercise are first-class domain events, not accounting accidents

**Relevance to Wheelwright:**
- The lifecycle-reconstruction domain (HAS HAPPENED) has established prior art
- Transaction ontology for options is well-understood — do not invent new vocabulary
- Adjusted/economic basis (distinct from tax basis) is a recognized concept

**What Wheelwright should not replicate:**
- TradesViz presents enormous metric density simultaneously — every possible calculation is visible. Wheelwright's architecture explicitly rejects this via Cognitive Role Separation and Progressive Disclosure.

---

### Wheel Strategy Options

**What it demonstrates:**
- The wheel lifecycle (CSP → assignment → shares → CC) can be modeled explicitly as a state machine
- Capital-aware screening (filtering by what you can afford) is established practice
- A broker overlay (connecting screening to execution context) is a recognized product pattern

**Relevance to Wheelwright:**
- Confirms that the wheel lifecycle is a specific, modelable domain — not just "options trading"
- The Conditioned Operating Opportunity concept (what calls are available if assigned) has prior art in the wheel-specific context
- Capital feasibility as an admission criterion is established (Wheelwright already does this via deployable-cash gating)

**What Wheelwright should not replicate:**
- Narrow strategic scope. If Wheelwright's architecture eventually reveals a strategy-neutral kernel, it should not be artificially constrained to the wheel alone.

---

### ORATS

**What it demonstrates:**
- Deep quantitative evidence generation (IV surface, skew, probability distributions) is possible
- Backtesting against historical environments is established capability
- Environment matching ("find historical periods similar to now") is a recognized analytical approach
- Analytical depth can exist under a compressed surface — users access depth on demand

**Relevance to Wheelwright:**
- The Market-Priced Risk research direction (PL-EVID-04) has substantial prior art in ORATS
- ORATS demonstrates that IV, skew, and probability-surface evidence are the vocabulary of deep options analytics
- The compressed-surface lesson is important: analytical capability need not mean analytical overload

**What Wheelwright should not replicate:**
- ORATS is fundamentally a quantitative research platform. Wheelwright is an evidence appliance with governance. Attempting to match ORATS's analytical depth would be attempting to become a different product. The architecture should consume quantitative evidence (when available) rather than generate it independently.

---

### OptionStrat

**What it demonstrates:**
- Visual information shaping reduces cognitive load on complex option economics
- Manipulable payoff diagrams allow the operator to explore "what if" scenarios visually
- Probability visualization (showing the probability cone alongside the payoff) is an established UX pattern

**Relevance to Wheelwright:**
- Visual encoding of option economics is established prior art — Wheelwright's Console (DTE ladder, moneyness visualization) operates in this tradition
- The Appreciation Geometry concept (Calls Horizon B) has prior art in payoff-diagram visualization

**What Wheelwright should not replicate:**
- Pure visualization without governance or institutional reasoning. OptionStrat shows what is possible without asking whether it is permissible or advisable.

---

### Fidelity

**What it demonstrates:**
- The custodian/system-of-record boundary is real and important
- Broker accounting (tax lots, cost basis, realized gains) is technically correct but often cognitively unhelpful for operational decision-making
- An operator may legitimately need a different economic perspective than the broker provides
- Both perspectives (broker/tax and operator/economic) can be valid simultaneously because they answer different questions

**Relevance to Wheelwright:**
- Confirms the dual-perspective accounting problem is architecturally consequential
- Wheelwright's derived economic perspective (wheel-adjusted basis, production accounting) must be:
  - Clearly named (not "the correct basis")
  - Provenance-rich (traceable to source transactions)
  - Reconcilable to Fidelity records
  - Never presented as "Fidelity is wrong"
- Fidelity remains custodian, execution venue, and financial system of record

**What Wheelwright should not replicate:**
- Fidelity's presentation of information optimized for regulatory compliance rather than operational decision-making. That is appropriate for a broker — it is not appropriate for an operator's decision-support tool.

---

### Koyfin

**What it demonstrates:**
- Configurable portfolio perspectives (sector, geography, asset class, concentration) are established prior art
- Multiple analytical lenses over the same portfolio data are a recognized product pattern
- Heat maps, treemaps, and proportional visualizations for portfolio exposure are standard

**Relevance to Wheelwright:**
- Recommendation Set Analysis (PL-EVID-05) with pluggable grouping heuristics has substantial prior art
- The Operator Console's DTE ladder (capital-proportional treemap) operates in the same visual tradition
- Configurable lenses are NOT a Wheelwright invention — the contribution is connecting them to the evidence/policy/principle governance hierarchy

**What Wheelwright should not replicate:**
- Dashboard proliferation without governance depth. Koyfin shows many views but does not ask "should you act on this?" or "does this satisfy your institutional policy?"

---

### Sharesight / Portfolio Performance

**What it demonstrates:**
- Transaction/accounting ontology is well-established and distinguishes:
  - Deposits / withdrawals (principal movements)
  - Dividends / distributions (income)
  - Interest (income)
  - Fees / commissions (costs)
  - Trades (buy/sell)
  - Capital gains (realized appreciation)
- The distinction between principal and production is a solved accounting problem
- Performance attribution (what contributed to returns) is established methodology
- Tax-lot tracking with multiple accounting methods (FIFO, specific lot) is standard

**Relevance to Wheelwright:**
- Do NOT invent accounting vocabulary — the ontology for "what did the portfolio produce?" already exists
- The principal vs production distinction is precisely what portfolio production accounting needs
- Transaction import from broker exports is a solved integration pattern
- Income decomposition (option premium, dividends, interest, fees) is standard accounting

**What Wheelwright should not replicate:**
- Generic portfolio tracking. Sharesight is broad but shallow in any specific strategy domain. Wheelwright should use established accounting ontology but apply it within its governance and evidence framework.

---

### Edgewonk / Tradervue

**What it demonstrates:**
- Longitudinal behavioral analysis (performance over time, pattern recognition) is established prior art
- Trade journaling (recording the operator's reasoning alongside the transaction) creates decision-environment provenance
- Statistical analysis of behavioral patterns (time-of-day effects, position-size effects, holding-period effects) is recognized methodology
- Comparing intended outcomes to actual outcomes is the core of behavioral trading analysis

**Relevance to Wheelwright:**
- Longitudinal learning (the fourth HAS HAPPENED subdomain) has substantial prior art
- Decision-environment provenance — recording what was visible, what the operator chose, and what alternatives existed — is the journaling concept applied to systematic evidence
- Wheelwright's potentially distinctive contribution is preserving the **pre-decision evidence environment** (the full recommendation set, policy state, and market evidence at decision time), not merely the completed trade

**What Wheelwright should not replicate:**
- Behavioral analytics as a standalone journaling product. Wheelwright's contribution would be that the evidence environment is already maintained by the appliance — journaling happens automatically because the system already knows what was visible.

---

## Concepts That Are NOT Wheelwright Inventions

Based on this research, the following should not be treated as novel Wheelwright contributions when they are implemented:

- Wheel lifecycle tracking (put → assignment → shares → call)
- Adjusted/economic cost basis
- Premium accounting and cycle tracking
- Sector/concentration analysis
- Configurable portfolio views and lenses
- Behavioral trade journaling
- Option probability visualization
- Large-universe screening
- Transaction-level accounting ontology
- Income decomposition (premium, dividends, interest)
- Capital-proportional visualization
- Payoff/appreciation geometry

---

## Where Wheelwright's Potential Contribution Lies

The potentially interesting synthesis is not any single capability above, but how these domains are connected while preserving epistemic discipline:

- **Evidence provenance across the full chain** — from market observation through recommendation through decision through outcome, with each step's confidence and derivation preserved
- **Governance integration** — principles and policies are first-class entities that explain, constrain, and learn from the full lifecycle rather than being disconnected configuration
- **Decision-environment preservation** — the system already maintains the evidence environment; longitudinal analysis can reference what was actually observable at decision time rather than reconstructing it after the fact
- **Dual-perspective economics with explicit provenance** — presenting operator-oriented economic views alongside broker/tax accounting without conflating or contradicting them

Whether this synthesis actually produces value beyond established prior art is an empirical question that requires implementation and operational use to answer. It is not established by architectural reasoning alone.

---

## Maturity

| Aspect | Status |
|---|---|
| Research completeness | Sufficient for architectural guidance; not exhaustive |
| Products surveyed | 8 (covering lifecycle, analytics, visualization, accounting, journaling) |
| Conclusions | Stable — unlikely to change with additional research |
| Implementation implications | Informs vocabulary and ontology choices; does not dictate architecture |
| Update frequency | When new relevant prior art is encountered |
