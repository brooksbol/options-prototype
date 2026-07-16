# Design Review: Recommendation Vocabulary

**Date:** July 3, 2026
**Status:** Design analysis — no implementation requested
**Scope:** Architectural review of overlapping categorical labels

---

## 1. Current Vocabulary Inventory

| Term | Where Used | Dimension | Type |
|------|-----------|-----------|------|
| **ACTIONABLE** | Posture label, UI badge | Execution quality | Categorical bucket on a continuous score |
| **EDGE** | Posture label, UI badge | Execution quality | Categorical bucket on a continuous score |
| **WAIT** | Posture label, waitCandidates | Execution quality | Categorical bucket on a continuous score |
| **UNAVAILABLE** | Posture label | Execution quality | Hard-no safety net |
| **preferredDeltaBand** | ContractSelectionPolicy | Preference match | Governance range |
| **admissibleDeltaRange** | ContractSelectionPolicy | Governance | Hard filter boundary |
| **eligibleDteRange** | ContractSelectionPolicy | Governance | Hard filter boundary |
| **targetDelta** | ContractSelectionPolicy | Preference | Ideal center point |
| **targetDte** | ContractSelectionPolicy | Preference | Ideal center point |
| **hardExclude*** | ExecutionPolicy | Governance | Absolute exclusion |
| **preferred*** | ExecutionPolicy | Scoring reference | 100% score anchor |

---

## 2. Dimensional Analysis

The vocabulary operates across three independent dimensions:

### Dimension A: Governance (Admissibility)
> "Is this contract within bounds we're willing to consider at all?"

- `admissibleDeltaRange`: hard gate. Outside = invisible.
- `eligibleDteRange`: hard gate. Outside = invisible.
- `excludeZeroBid`: hard gate.
- `requireGreeks`: hard gate.
- `hardExcludeSpreadPercent` (80%): hard gate.
- `hardExcludeZeroOI`: hard gate.

**Nature:** Binary. In or out. No score attached.

### Dimension B: Execution Quality
> "If this contract is admissible, how good is the market for actually executing a trade?"

- `spreadPercent` scored against `preferredSpreadPercent`
- `openInterest` scored against `preferredOpenInterest`
- `volume` scored against `preferredVolume`
- `bid` scored against `preferredMinBid`
- Composite weighted score: 0–100
- Bucketed into: ACTIONABLE (≥65), EDGE (≥35), WAIT (≥15), UNAVAILABLE (<15)

**Nature:** Continuous score, discretized into 4 labels.

### Dimension C: Preference Match
> "How close is this contract to what the operator actually wants?"

- `targetDelta` (0.30): ideal risk exposure
- `preferredDeltaBand` (0.25–0.35): preferred zone
- `targetDte` (21): ideal time horizon

**Nature:** Continuous distance from ideal, but currently only used for **selection** (pick the closest contract) rather than **scoring** or **ranking**.

---

## 3. The Collapsing Problem

The system currently collapses dimension C (preference match) into selection and only surfaces dimension B (execution quality) as posture labels. This creates confusion:

1. A contract with delta = 0.15 (edge of admissible range, far from target) that scores 70 on execution quality is labeled **ACTIONABLE** — even though it's a poor preference match.

2. A contract with delta = 0.30 (perfect target) that scores 40 on execution quality is labeled **EDGE** — even though it's an excellent preference match.

The operator sees ACTIONABLE/EDGE and assumes these are overall recommendation strength. They're actually only execution quality.

---

## 4. What Each Label Actually Means

| Label | What it communicates to operator | What it actually means |
|-------|----------------------------------|----------------------|
| ACTIONABLE | "Go ahead and trade this" | "The market microstructure is good" |
| EDGE | "Proceed with caution" | "The market microstructure is mediocre" |
| WAIT | "Don't trade this yet" | "The market microstructure is poor" |
| UNAVAILABLE | "Can't trade this" | "Hard-no triggered" |

The labels are **execution quality labels pretending to be recommendation strength labels**.

---

## 5. What's Missing: Recommendation Strength

A true recommendation strength would combine:

1. **Execution quality** — can I actually get filled at a reasonable price?
2. **Preference match** — is this the risk/time profile I want?
3. **Yield attractiveness** — is the premium worth deploying capital?
4. **Ranking position** — is this better than alternatives?

Currently, ranking mode (execution_first / yield_first / balanced / capital_efficiency) provides this composite — but only as sort order, not as a visible score or label.

---

## 6. Architectural Observation

The current architecture is:

```
Governance gates → Contract selection → Execution scoring → Posture label → Ranking sort
       (binary)    (preference-nearest)    (continuous)      (categorical)    (continuous)
```

The categorical discretization (posture label) happens too early. It:
- Determines what enters the eligible population (ACTIONABLE + EDGE only)
- Is used as the primary UI badge
- Is used as the first tier in ranking sort

But it discards the continuous score information the operator needs to distinguish candidates.

---

## 7. Possible Future Architecture (Not Implemented)

```
Governance gates → Contract selection → Multi-dimensional scoring → Continuous ranking → Presentation labels
```

Where multi-dimensional scoring produces:
- **Execution score** (0–100): market microstructure quality
- **Preference score** (0–100): distance from operator's target profile
- **Yield score** (0–100): attractiveness of premium relative to capital

And presentation labels are derived from the composite at display time:
- Top 20% of composite → visually prominent
- 20-50% → standard
- 50-80% → de-emphasized
- Bottom 20% → excluded from primary view

The current ACTIONABLE/EDGE/WAIT labels would become presentation convenience rather than architectural load-bearing decisions.

---

## 8. Current Terminology Conflicts

| Pair | Conflict |
|------|----------|
| **admissible** vs **eligible** | Both mean "allowed in" but at different stages. Admissible = delta/DTE range gate. Eligible = passed execution scoring. |
| **preferred** vs **target** | Both express "what the operator wants." Target = center point. Preferred = band around it. Different from `preferredSpreadPercent` which is a scoring reference, not an operator preference. |
| **eligible** vs **ranked** | Currently identical populations (eligible = ranked up to maxResults). Creates false impression that ranking is a further reduction. |
| **EDGE** as posture vs **edge** as colloquial | "Edge case" vs "edge of acceptable quality." Operator may confuse with "edge" in financial sense (information advantage). |

---

## 9. Recommendations (Design Only)

1. **Rename "posture" to "execution quality" in operator-facing surfaces.** The label already communicates this — just not accurately named.

2. **Consider surfacing preference distance.** A contract at target delta scoring ACTIONABLE is meaningfully better than one at admissible boundary scoring ACTIONABLE. The operator can't see this distinction.

3. **Consider continuous ranking score in the UI.** The `assessment.score` (0-100) is already available but only shown as the small "Exec" column. It may be more informative than the discrete badge.

4. **Clarify "preferred" overloading.** `preferredSpreadPercent` (scoring reference) vs `preferredDeltaBand` (operator preference) vs `preferredMinBid` (scoring reference) — three different meanings of "preferred."

5. **Defer categorical label changes.** The current system works. The labels create mild confusion but don't cause incorrect behavior. A vocabulary cleanup should wait until actual execution evidence reveals whether the thresholds are well-placed.

---

## 10. Parking Lot

- Product-structure inference receives empty instrument names → all symbols pass → structural complexity filter is currently inert in the `recommendPuts` path
- `includeEdge` and `includeWait` policy fields are declared but not enforced in code
- `preferredDeltaBand` is declared in policy but not used in scoring or selection
- Preference distance is not a factor in ranking (only execution quality + yield)
