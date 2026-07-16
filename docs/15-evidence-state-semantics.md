# Evidence-State Semantics — Design Specification

**Date:** July 2026 (revised)
**Status:** Design specification — not yet implemented
**Companion:** `foundations/state-oriented-console.md`

---

## Core Operator Question

The evidence-state indicator must answer:

> Can I trust and act on the recommendations currently displayed?

---

## Evidence Population Vocabulary

The recommendation pipeline moves symbols through a precise sequence of stages. Each stage is a distinct concept.

| Stage | Definition | What changes it |
|-------|-----------|-----------------|
| **Covered** | Symbol resolved: has usable evidence OR confirmed absence. | Acquisition completing. |
| **Ready** | Sufficient usable market evidence exists (expirations + chain). | Acquisition success. |
| **Evaluable** | Wheelwright has sufficient evidence and metadata to apply analysis. Evidence sufficiency, not policy. | Evidence completeness, not operator settings. |
| **Eligible** | Passes current operator policy (delta range, DTE, affordability, etc.) and can enter the ranked set. | Policy changes. |
| **Ranked** | Has a position in the ordered recommendation set under current ranking mode. | Policy or evidence changes. |
| **Displayed** | Inside the operator-selected display limit (Show 10/20/50/100). | Operator display setting. |
| **Absent** | Confirmed no qualifying options. Resolved but not evaluable. | Acquisition finding no expirations. |
| **Pending** | Not yet resolved — acquisition incomplete. | Acquisition progress. |
| **Failed** | Acquisition repeatedly failed. Cannot currently resolve. | Provider errors. |

**Relationships:**
```
Universe = Covered + Pending + Failed
Covered = Ready + Absent
Evaluable ⊆ Ready (evidence sufficiency, not policy)
Eligible ⊆ Evaluable (policy filters)
Ranked ⊆ Eligible (ordered by ranking mode)
Displayed ⊆ Ranked (capped by Show limit)
```

**Key distinctions:**
- `Evaluable` is NOT "passes policy." It means Wheelwright has enough evidence to assess the symbol. Changing delta range does not change whether a symbol is evaluable — it changes whether it's eligible.
- `Eligible` changes with operator policy. `Evaluable` changes with evidence acquisition.
- `Absent` is covered but not ready, not evaluable.
- Policy changes alter Eligibility, Ranking, and Display — never Evaluable or Ready.

---

## Trust Scope

### Display Trust (primary collapsed indicator)

The freshness and validity of evidence supporting the **currently displayed** recommendation rows.

Drives the primary operator-facing trust state.

**Derivation input:** The displayed recommendations (the rows the operator is actually looking at).

### Population Context (expanded view)

The freshness and validity across the full **eligible or ranked** recommendation population — not just the visible subset.

**Purpose:** Prevents the display limit from concealing broader evidence-quality problems.

**Behavior when scopes differ:**

| Scenario | Display Trust | Population Context | Indicator behavior |
|----------|-------------|-------------------|-------------------|
| Top 10 current, broader Top 100 contains stale | Current | Mixed (note in expanded) | Collapsed: Current. Expanded shows "10 displayed current; 8 of top 100 are >10m" |
| Changing Show from 10 to 100 introduces older evidence | May change to Partially Current | Unchanged | Collapsed indicator updates to reflect new display scope |
| Affordability filter hides stale candidates | Current (visible set is fresh) | May contain stale filtered items | No change — hidden items don't affect displayed trust |

**Rule:** The collapsed indicator reflects what the operator can see. The expanded view makes the broader population honest. Changing the display limit may change the collapsed trust state — this is correct behavior, not a bug.

---

## Freshness Measure

### Display freshness

The **oldest** evidence observation among the currently displayed recommendations.

```
displayFreshness = max age among Displayed recommendations' evidence observations
```

The set is only as trustworthy as its weakest evidence link.

### Population freshness (expanded)

Reported separately:
- Median evidence age across Eligible population
- Oldest evidence in Ranked set
- Count of Ranked symbols exceeding the freshness threshold

---

## Trust State

Trust describes whether the operator can rely on the visible recommendations.

| State | Definition | Operator meaning |
|-------|-----------|-----------------|
| **Current** | All displayed recommendations supported by evidence within session freshness threshold, AND coverage is sufficient | "I can act on these" |
| **Partially Current** | Displayed evidence is within threshold, but coverage is incomplete (more symbols may produce better recommendations) | "I can act, but the set may improve" |
| **Stale but Usable** | Displayed evidence exceeds freshness threshold but remains valid under sealed-session rules | "Evidence is from today's session. Still valid." |
| **Degraded** | Significant systemic problems: high failure rate OR provider outage OR no displayed evidence within reasonable bounds | "Recommendations exist but reliability is reduced" |
| **Unavailable** | Evidence service unreachable or no evidence at all | "Cannot produce recommendations" |

---

## Trust-State Derivation (Deterministic)

```
function deriveTrustState(
  displayedRecommendations,    // the visible rows
  coverageFraction,            // covered / universe
  failedFraction,              // failed / universe
  sessionState,
  serviceAvailable
):

  // Service check
  if NOT serviceAvailable OR displayedRecommendations is empty:
    return UNAVAILABLE

  // Systemic failure check
  if failedFraction > FAILURE_THRESHOLD:
    return DEGRADED

  // Compute display freshness
  displayFreshness = oldestEvidenceAge(displayedRecommendations)

  // Session-aware evaluation
  if sessionState in [CLOSED_CANONICAL, NON_TRADING_DAY, PREMARKET]:
    if allDisplayedEvidenceFromCanonicalOrPriorSession:
      if coverageFraction >= COVERAGE_THRESHOLD:
        return CURRENT
      else:
        return PARTIALLY_CURRENT
    else:
      return DEGRADED

  // Regular session
  if displayFreshness <= CURRENT_THRESHOLD:
    if coverageFraction >= COVERAGE_THRESHOLD:
      return CURRENT
    else:
      return PARTIALLY_CURRENT
  elif displayFreshness <= STALE_THRESHOLD:
    return STALE_BUT_USABLE
  else:
    return DEGRADED
```

---

## Policy Default Thresholds

These values are **initial configurable defaults**, not universal architectural constants.

| Threshold | Default | May vary by |
|-----------|---------|-------------|
| `CURRENT_THRESHOLD` | 5 minutes | Session state, evidence type |
| `STALE_THRESHOLD` | 30 minutes | Session state |
| `COVERAGE_THRESHOLD` | 95% | Operating mode |
| `FAILURE_THRESHOLD` | 5% | Universe size, tolerance |

**Rules:**
- During Regular Session: 5-minute current threshold (market is changing)
- During Closed/Pre-market: sealed evidence from canonical session is inherently "current" regardless of wall-clock age
- Thresholds may be adjusted as operational experience develops
- Do not build a generalized policy framework yet — simply acknowledge these are defaults

---

## Activity (Independent of Trust)

| Activity | Display | Meaning |
|----------|---------|---------|
| **Updating** | Shown as suffix | Backend is actively acquiring. Evidence may improve. |
| *(none)* | No label | No relevant work occurring. This is healthy — may mean everything is current. |

"Updating" never implies "not ready." Absence of activity is normal when evidence is fully current.

---

## Collapsed Indicator

**Form:**
```
● [Trust] · [Coverage] · [Freshness] [· Activity]
```

**Examples (with inferable reasons):**

```
● Current · 496/496 covered · ≤ 2m
  → All displayed evidence fresh. Full coverage. Healthy.

● Current · 489/496 covered · ≤ 1m · Updating
  → Evidence fresh. 7 symbols still pending. Backend working.

● Partially Current · 350/496 covered · ≤ 3m · Updating
  → Displayed evidence is fresh, but 146 symbols pending. Set may improve.

● Stale but Usable · 496/496 covered · Sealed today
  → Market closed. Today's sealed evidence is valid. No freshness concern.

● Degraded · 472/496 covered · oldest 42m
  → Displayed evidence exceeds 30m threshold during Regular Session. Investigate.
  → (Reason: provider was unreachable for 40 minutes, now recovering)

● Degraded · 460/496 covered · 24 failures
  → Failed fraction exceeds 5% threshold. Systemic acquisition problem.

● Unavailable
  → Evidence service not reachable. No recommendations possible.
```

---

## Expanded Indicator

```
Trust: Current
Display: Top 20 evidence ≤ 2m (oldest: XLE 1m47s)
Population: Top 100 — 92 within 5m, 8 between 5-12m
Coverage: 489 / 496 covered
  Ready: 409
  Confirmed absent: 80
  Pending: 7
  Failed: 0
Session: REGULAR_OBSERVATION · Jul 16
Last improved: 10:42:17 ET
Activity: Updating (COPX chain)
```

---

## Recommendation Brief

Show recommendation-specific evidence age when it materially differs from the display-level trust:

```
Evidence: Current · observed 2m ago
```

or when this specific recommendation is an outlier:

```
Evidence: Stale · observed 47m ago
⚠ Older than other displayed recommendations
```

Do not include acquisition mechanics by default.

---

## Open Questions

1. **When Show changes, should the trust state transition be instant or debounced?** Probably instant — the operator changed their view scope and should see the trust implication immediately.

2. **Should the collapsed indicator show the reason for non-Current states?** Proposed: not in collapsed. The expanded view explains why. Collapsed is status, not diagnosis.

3. **How should a single stale outlier in an otherwise current display affect trust?** Proposed: if 19 of 20 are ≤2m but one is 45m, state is Stale but Usable (weakest link). The expanded view identifies the outlier.

4. **Should population context influence the collapsed indicator at all?** Proposed: no — collapsed reflects displayed trust only. Population issues appear in expanded. Changing Show is the operator's mechanism to inspect broader trust.

5. **Should sealed-evidence trust distinguish "from today's session" vs "from yesterday's session"?** Proposed: today's session = Current. Prior session = Stale but Usable (valid but the market may have gapped overnight).
