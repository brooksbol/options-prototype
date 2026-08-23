# Wheelwright — Domain Vocabulary

## System Concepts

| Term | Definition |
|------|-----------|
| **Evidence** | Observed market facts (chains, quotes, expirations) with provenance. Not predictions, not recommendations. |
| **Evidence Appliance** | The architectural identity of the backend — always-on, session-aware, maintaining authoritative evidence. |
| **Snapshot** | A coherent, point-in-time view of the evidence store, published via HTTP with ETag semantics. |
| **Generation** | Monotonically increasing identifier for snapshot versions. ETag format: `"gen-<N>"`. |
| **Sealed Evidence** | Evidence from a closed session that remains valid until superseded by the next session. Not stale by wall-clock age. |
| **Session Gate** | Mechanism preventing acquisition during non-trading hours. Correctness feature, not optimization. |
| **Universe** | The canonical set of symbols (1,286 ETFs from seed CSV) that the appliance maintains. |
| **Resolution** | A symbol's lifecycle state: pending → expirations_known → ready OR absent. |
| **Absence** | A successful observation that a symbol has no options expirations. A resolution outcome, not a failure. |
| **Epoch** | A trading session day. Evidence lifecycle resets at epoch boundaries for freshness. |

## Recommendation Domain

| Term | Definition |
|------|-----------|
| **Recommendation** | A deterministic, policy-governed assessment of a candidate opportunity. Not a prediction or advice. |
| **Posture** | Classification of a recommendation: ACTIONABLE, EDGE, or WAIT. |
| **Velvet Rope** | Instrument admission governance — the policy gate that determines whether an instrument qualifies. |
| **Write Desk** | The deployment and recommendation surface where the operator assesses candidates. |
| **Recommendation Brief** | A detailed decision-support drawer showing evidence, governance, neighborhood, and explanation for one candidate. |
| **Deployment Opportunity** | A normalized, situation-aware portfolio action (accepted direction, not yet fully realized). |

## Options Domain

| Term | Definition |
|------|-----------|
| **Cash-Secured Put (CSP)** | Obligation to acquire shares at strike, compensated by premium. Both outcomes (assignment, expiration) must be acceptable. |
| **Covered Call** | Obligation to sell held shares at strike, compensated by premium. Both outcomes governed. |
| **Buy-Write** | Simultaneous share acquisition + covered call. Bounded upside, reduced basis. |
| **Delta** | Control variable for probability/risk. Puts: absolute value of negative delta. Calls: raw positive delta. Target: 0.30. |
| **DTE** | Days to expiration. Eligible range: 7–45. Target: ~21. |
| **Midpoint** | Valuation convention: `(bid + ask) / 2`. Used for all indicative economics (yield, premium). Not a guaranteed fill. |
| **Moneyness** | Relationship of strike to underlying price: OTM (out of the money), ATM (at the money), ITM (in the money). |
| **Premium** | Income received for accepting an options obligation. The "production output" of the system. |
| **Assignment** | State transition where the obligation is exercised. A governed outcome, not a failure. |
| **Collateral** | Capital reserved against an obligation (strike × 100 for CSP). |

## Operational Concepts

| Term | Definition |
|------|-----------|
| **Operator Console** | Home surface showing portfolio state via expiration-native DTE ladder and moneyness visualization. |
| **Production** | Realized economic output from options activity. Assessed against mission targets. |
| **Bridge Income** | First named operating situation — monthly cash-flow production over a finite horizon (accepted, not implemented). |
| **Situation** | Cross-cutting operating context that shapes recommendations, explanations, and targets. |
| **Mission** | Situation-derived production target (e.g., monthly income requirement). |
| **Nudge** | Administrative action: "Reevaluate whether acquisition work is due." Not a refresh request. |
| **Broker Handoff** | WriteIntent → pre-populated Fidelity trade link. System opens ticket; broker confirms and submits. |

## Acquisition Concepts

| Term | Definition |
|------|-----------|
| **Tiered Scheduler** | A/B/C/D classification for acquisition priority based on symbol state and freshness. |
| **Class A** | Ready symbols with qualifying puts — highest freshness priority (≤ 15 min). |
| **Class B** | Ready symbols without qualifying puts — best-effort freshness. |
| **Class C** | Lifecycle work (pending, partial, retriable failures). |
| **Class D** | Prior-epoch absent symbols — one probe per epoch. |
| **Recovery Probe** | Bounded single attempt to re-acquire a previously failed symbol in a new session. |
| **Publication Coalescing** | Batching evidence writes before advancing the snapshot generation. |
| **Provider Stewardship** | Not re-acquiring equivalent evidence when existing data satisfies policy. |

## Architectural Terminology

| Term | Definition |
|------|-----------|
| **Policy over Prediction** | Governing principle: apply explicit rules to evidence, never forecast outcomes. |
| **Persist facts; derive trust** | Store raw observations. Compute freshness/validity at query time from session context. |
| **Single Acquisition Authority** | One process, one evidence model. No split-brain. |
| **Failed refresh preserves evidence** | A provider failure never overwrites the last successful payload. |
| **Deterministic recommendation** | Same evidence + same policy = same output. No hidden state. |
| **Cold-start reconstruction** | A fresh session must be able to rebuild context from the repository alone. |
| **Learning checkpoint** | Explicit pause at subsystem boundaries to assess what was learned. |
