# 3AM Design Brief — Temporal Contract for the Decision Surface (PL-COHERE-01 Finding #1)

**Date:** August 27, 2026
**Status:** Design brief for 3AM decision. **No code. No ratified architecture.** Prepared by the Architect actor for Principal ratification of a temporal contract before any Engineer work.
**Governing finding:** `docs/35-evidence-decision-temporal-coherence.md`
**Parking-lot owner:** PL-COHERE-01 (Architecture-to-Code Coherence Assessment)
**Band:** Architecture recovery (Band 1). Feature roadmap remains paused.

---

## 0. The Question 3AM Must Answer

> What must be true before Wheelwright is allowed to claim that Deployment is evaluating the 7–45 DTE surface — and which subsystem owns guaranteeing that condition?

This brief does not answer it. It frames the decision: it presents the measured current state, three coherent temporal-contract models, their consequences, and a recommended ownership boundary. 3AM ratifies the contract; only then does the Engineer touch the machinery.

---

## 1. What Is Actually True Today (Measured, Not Assumed)

### 1.1 Backend acquisition cadence (`SchedulerConfig`)

| Parameter | Value | Meaning |
|---|---|---|
| Class A freshness target | 15 min | Ready symbols with qualifying puts — refreshed to ≤15 min chain age |
| Class B max age | 120 min | Ready symbols without qualifying puts — best-effort |
| Expiration freshness | 6 h | Expiration lists refreshed at most every 6h |
| Anti-starvation B floor | every 10 A dispatches | B serviced at least this often |
| Anti-starvation C/D floor | every 20 dispatches | lifecycle/absent serviced at least this often |
| Request pacer | 0.9 req/sec (~54/min) | Serialized upstream calls (Tradier 60/min limit) |

**Critical structural fact:** Class A freshness applies to a **symbol**, and in practice its **primary** chain. Multi-expiration acquisition (`acquireAllEligibleChains`) fetches every eligible expiration (7–45 DTE) for a weekly-capable symbol — roughly 8 chains for a liquid ETF. At 0.9 req/sec, a single weekly symbol's full surface costs ~9 seconds of serialized pacer time. The **non-primary** chains are acquired as part of the same batch but are not independently held to a 15-minute freshness target. When the scheduler moves on, they age at wall-clock rate until the symbol's next full-surface refresh.

### 1.2 Frontend Decision validity (`recommend.ts` `isEligible` + `durable-cache.ts`)

During an **open** session (`useSessionValidity = false`), a cached chain must pass two gates:

1. **Admissibility:** `retrievedAt >= sessionOpen + providerDelay` (today: 09:30 ET + 15 min = 13:45 UTC). Rejects pre-session / delayed-feed evidence.
2. **Freshness TTL:** `classifyFreshness` must return `fresh` or `stale_usable`.

| Data type | fresh | stale_usable (usable ceiling) |
|---|---|---|
| chain | 5 min | **30 min** |
| expirations | 6 h | 24 h |
| quote | 2 min | 10 min |

During a **closed/sealed** session (`useSessionValidity = true`), all TTLs are bypassed — sealed evidence is valid regardless of age. This is the sealed-evidence precedent (see §5).

### 1.3 The composition failure

Class A targets 15-min freshness for a symbol's primary chain. Decision's chain stale-usable ceiling is 30 min. For the **primary** expiration during steady state, these are roughly compatible. For the **non-primary** expirations of a weekly symbol, nothing holds them to any freshness target tighter than the symbol's full-surface revisit cadence — which, on a multi-hour cycle (worse at cold start; Class B backlog observed at ~20.8h during the incident), routinely exceeds 30 min. Those chains are present in cache but `expired` per Decision, so they are silently dropped and the board collapses toward the single fresh (primary) expiration.

### 1.4 Steady-state can be near-benign — which matters for the contract

Live telemetry captured while writing this brief (Regular observation, well-serviced):

```
eligible:  A=236 B=719 C=0 D=0
due:       A=2   B=0   C=0 D=0
oldestAge: A=908s (15.1 min)  B=current
chain cache: 1318 rows for 955 ready symbols
```

When the scheduler is caught up, Class A oldest age sits right at the 15-min target and B is current. The mismatch is not constant — it is **worst at cold start and under backlog**, and can nearly vanish in steady state. This tells us the contract is fundamentally about **coverage guarantee + honest degradation**, not about a single wrong TTL number.

Note also: 1318 chains for 955 ready symbols means only ~363 non-primary chains exist across the ~64 weekly-capable symbols — the full weekly surface is thin and cheap to maintain (consistent with PL-EVID-07's ~370-chain / ~14-min estimate).

---

## 2. Why This Is a Contract Problem, Not a Number Problem

Two subsystems each obey their own rules:

- **Acquisition** honors its A/B/C/D freshness targets and pacer limits. It never claims a per-expiration freshness guarantee — it was never asked to.
- **Decision** honors a browser-local TTL. It never asks acquisition whether the surface is maintained — it independently invents freshness from `retrievedAt`.

Neither violates its own contract. There is no shared contract. The gap between "backend has a row" and "Decision may use it" is **implicit and unowned**. That is the PL-COHERE-01 pattern in its purest form:

> Two locally-reasonable components + an unstated cross-boundary contract = globally incorrect behavior.

Raising `chainStaleMs` from 30 to 60 (or any number) would move the symptom without naming the contract or assigning its ownership. It is explicitly rejected as the resolution.

---

## 3. The Behavioral Invariant Under Threat

From PL-EVID-07 (`docs/21-primary-expiration-investigation.md`, resolved Aug 21) and the DTE-production-surface finding (journal, Aug 26): **non-primary expirations carry real, decision-relevant opportunity that can materially change the production frontier.** Therefore:

> If Wheelwright claims to evaluate 7–45 DTE, the Evidence Appliance must either maintain that decision surface within its declared validity contract or explicitly report that the surface is degraded. (Candidate invariant — to be ratified.)

Two clauses, both required: **maintain** (a service guarantee) **or report degraded** (never silently collapse).

---

## 4. Three Coherent Temporal-Contract Models

Each model is internally consistent. They differ in where validity is defined and who owns the guarantee. All three assume the sealed-session bypass for closed markets is retained unchanged.

### Model A — Backend-Owned Coverage Contract (Appliance defines valid/degraded)

**Idea.** The Evidence Appliance owns temporal validity. For each eligible symbol/expiration it publishes an explicit coverage state (e.g., `usable` / `warming` / `degraded` / `unavailable`) derived from its own acquisition facts and session context. Decision consumes that state. Decision does **not** apply a browser-local chain TTL during open sessions — it trusts the published coverage state.

**Ownership boundary.** Acquisition owns "is this evidence current enough to decide on?" Decision owns "given valid evidence, what is recommended?" The browser stops being a second freshness authority.

**Consequences.**
- (+) Directly implements the recommended boundary (§6). Eliminates the dual-authority root cause.
- (+) Degradation becomes a first-class, publishable fact — satisfies the "report degraded" clause structurally.
- (+) Scales: coverage semantics are meaningful at any universe size; a browser TTL is not.
- (+) Frontend hydration simplifies (no independent TTL reasoning for chains during open sessions).
- (−) Requires the snapshot contract to carry per-expiration (or per-symbol-surface) coverage state — a versioned contract change (frozen v1; needs explicit transition).
- (−) Backend must compute session-relative validity (it already has session state via SessionGate and retrieval timestamps, so this is derivation, not new evidence).
- (−) Largest conceptual change; must be sequenced carefully under Band 1.

### Model B — Shared Validity Interval + Service Guarantee (align the numbers, contractually)

**Idea.** Keep Decision's TTL mechanism but make the validity interval a **ratified shared constant** that acquisition is contractually required to satisfy for the advertised surface. Acquisition gains an explicit obligation: maintain every eligible expiration of weekly-capable symbols within the ratified interval (e.g., prioritize full-surface refresh so no eligible chain exceeds the interval). Decision keeps its TTL but the interval is now a joint decision, measured against real cadence, not `30 * 60 * 1000` typed once.

**Ownership boundary.** Shared/negotiated. Acquisition owns meeting the SLA; Decision owns enforcing it as a gate. The contract is the ratified interval + the coverage SLA.

**Consequences.**
- (+) Smallest structural change — no snapshot-shape change if the SLA is met.
- (+) Forces the measured-cadence discipline (§1) into an explicit number.
- (−) Does not, by itself, make degradation observable. If acquisition falls behind (cold start, provider outage), Decision still silently collapses unless a separate degradation signal is added — so this model is incomplete without borrowing Model A's degradation reporting.
- (−) Leaves two freshness authorities in place; the coherence defect can recur whenever the SLA is quietly violated.
- (−) The SLA may be unachievable for the full universe at 0.9 req/sec during cold start, forcing either a scoped guarantee (weekly-capable only) or accepted degradation — which pushes back toward Model A's explicit states.

### Model C — Session-Validity Extension (treat open-session chains like sealed evidence, scoped)

**Idea.** Generalize the existing sealed-evidence bypass. Today, closed sessions accept any cached chain regardless of age. Extend a bounded form of that reasoning into open sessions: a chain acquired **during the current session** (after the admissibility boundary) is valid for Decision until superseded by a newer acquisition of the same expiration — not invalidated by a 30-min wall-clock TTL. Freshness becomes "is this the current session's observation of this expiration?" rather than "is this < 30 min old?"

**Ownership boundary.** Validity is defined by **session epoch + supersession**, owned jointly by the session model (which subsystem hosts it is the sub-decision). The browser stops using wall-clock TTL for chains during open sessions; it uses session-relative validity.

**Consequences.**
- (+) Conceptually elegant — one validity model (session-relative supersession) spanning open and closed sessions. Removes the wall-clock TTL as the villain entirely.
- (+) A cold-start batch acquired at 13:48 stays valid all session until re-acquired, so the full surface persists once acquired.
- (+) No snapshot-shape change strictly required if the frontend can derive session-relative validity from `retrievedAt` + session boundaries it already has.
- (−) Weakens intraday freshness for genuinely fast-moving evidence: a chain from session open may be hours stale by afternoon yet still "valid." Whether that is acceptable for Decision economics (delta, spread, premium drift) is a real question — the 15-min provider delay already means Wheelwright never has truly live data, but session-open-to-close staleness is a different magnitude.
- (−) Still does not make degradation observable during the warming window (0/64 → 64/64). Needs a coverage/warming signal borrowed from Model A.
- (−) Blurs the line between "sealed and unchanging" (closed session, genuinely fixed) and "open and drifting" (intraday) — the sealed-evidence precedent may not transfer cleanly.

---

## 5. Relationship to the Sealed-Evidence Precedent

The sealed-evidence rule (`foundations/evidence-appliance.md`) already establishes that **wall-clock age does not define validity** — session context does. Friday's close is valid through Monday. All three models are, in effect, asking how far that principle extends into open sessions:

- Model A: validity is whatever the appliance publishes (session-aware by construction).
- Model B: validity is a wall-clock interval (rejects the sealed precedent for open sessions).
- Model C: validity is session-epoch + supersession (directly generalizes the sealed precedent).

This is worth 3AM's attention: the sealed-evidence rule already implies that the browser's open-session wall-clock TTL is the anomaly, not the norm.

---

## 6. Recommended Ownership Boundary (Architect's Leading Direction — Not Ratified)

> The Evidence Appliance owns evidence coverage and temporal validity. Decision consumes an explicit valid/degraded evidence surface; it does not independently invent freshness by applying a browser-local TTL.

This points at **Model A**, optionally incorporating **Model C's** session-relative validity as the appliance's *internal* definition of "usable." Model B alone is insufficient because it cannot satisfy the "report degraded" clause without borrowing Model A's degradation signal — and it leaves the dual-authority defect in place.

Rationale:
- It removes the root cause (two freshness authorities) rather than retuning one.
- It makes degradation a publishable fact, satisfying the invariant's second clause structurally.
- It aligns with the Evidence Appliance identity: the appliance maintains an authoritative, session-aware model; the browser is a viewport.
- It scales and it survives cloud/multi-user evolution.

The cost is a versioned snapshot-contract change. That cost is acceptable under Band 1 and is exactly the kind of deliberate, sequenced boundary correction PL-COHERE-01 authorizes.

---

## 7. What 3AM Must Decide

1. **The contract's shape.** Model A, B, C, or a named hybrid (leading: A with C-style internal validity).
2. **The validity definition.** Wall-clock interval, session-epoch + supersession, or appliance-published state — and the measured cadence that justifies it.
3. **The ownership boundary.** Does the appliance own validity (recommended), or is it shared?
4. **The degradation policy.** When the surface is warming or degraded, does Deployment (a) stay usable with a visible degradation banner, (b) show only the currently-valid subset with an explicit "surface warming N/64" indicator, or (c) block? (This is a separate policy from the contract itself.)
5. **The advertised scope.** Is the 7–45 DTE guarantee universe-wide, or scoped to the ~64 weekly-capable symbols (where multi-DTE actually matters and the cost is ~370 chains / ~14 min)? Scoping makes any SLA far more achievable.

---

## 8. Proposed Recovery Slice (After Ratification — Sequenced, Not Authorized Here)

Following the Principal's stated sequence, the first vertical slice should be narrow:

1. **Scope:** the 64 weekly-capable ETFs (where multi-DTE materially matters).
2. **Backend:** maintain and publish their eligible-surface coverage state under the ratified contract.
3. **Decision:** consume that contract for this path; remove the competing frontend chain-TTL interpretation for these symbols.
4. **Degradation:** cold start shows "Decision surface warming: N/64 weekly symbols fully current" (or "DTE coverage degraded") rather than a silent DTE-22 board.
5. **Acceptance test (behavior we care about):** cold restart → warming visible → full 7–45 surface becomes valid → broad DTEs appear → remain available through normal market hours → if acquisition falls behind, Wheelwright reports degradation rather than collapsing → Console/Deployment remain responsive.
6. **Then continue PL-COHERE-01** with Finding #1 marked as the first corrected boundary, and sweep for the same class of implicit cross-boundary contract elsewhere: authority, persistence, lifecycle, reconstruction, surface availability.

Monthly-only symbols (891) are unaffected — they have one eligible expiration regardless — so the slice's blast radius is inherently small.

---

## 9. What This Brief Does NOT Do

- Does not change any runtime code.
- Does not ratify a contract, a validity interval, an ownership boundary, or a degradation policy.
- Does not pick Model A/B/C — it recommends a leading direction for 3AM to accept, modify, or reject.
- Does not resume the feature roadmap.
- Does not re-open Finding #1's diagnosis (settled in doc 35).

---

## 10. Cross-References

- `docs/35-evidence-decision-temporal-coherence.md` — Finding #1 (the diagnosis this brief acts on)
- `docs/21-primary-expiration-investigation.md` — PL-EVID-07: why the 7–45 surface matters
- `docs/foundations/evidence-appliance.md` — sealed-evidence validity precedent; appliance-as-authority identity
- `docs/15-evidence-state-semantics.md` — trust/freshness vocabulary (distinct from Decision-eligibility)
- `docs/07-architecture-current.md` — Evidence↔recommendation boundary, tiered scheduler, session model
- `docs/parking-lot.md` — PL-COHERE-01 (owner), PL-EVID-07, PL-ARCH-06, PL-EVID-01
- Code: `evidence-service-java/.../SchedulerConfig.java`, `AcquisitionWorker.java`; `options-prototype/src/write-desk/recommend.ts`, `src/cache/durable-cache.ts`, `src/components/WriteDesk.tsx`
