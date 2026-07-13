# Velvet Rope — Requirements (First Slice)

## Purpose

Define the requirements for the first working slice of the Velvet Rope subsystem.

The Velvet Rope determines which ETFs are admitted into the institutional universe for further evaluation. Its output is an approved registry of underlyings. Downstream systems (Opportunity Lab, future Decision Lab) will eventually operate only on approved underlyings.

The first slice is **observational**. It operates in parallel with the existing legacy curated universe and does not yet govern downstream behavior.

---

## Scope

### In Scope (First Slice)

- Bootstrapped registry of existing curated ETFs + SPY
- Explicit, versioned admission policy
- Operator-triggered evaluation against live market data
- Append-only audit of every evaluation attempt
- Separate call-side and put-side evidence
- Operator override (manual admit/exclude)
- Universe comparison: legacy curated vs. Velvet Rope effective universe
- Stale-evaluation detection after policy changes
- Progressive evaluation display
- localStorage persistence (transitional)

### Out of Scope (Deferred)

- Automated broad-universe discovery/crawler
- Opportunity Lab cutover to Velvet Rope registry
- Watch/Suspended/Revoked lifecycle states
- Rolling-average or multi-observation criteria
- Server-side persistence / cloud storage
- Notifications for new admissions or revocations
- Policy version history comparison UI
- Time-of-day-aware volume assessment

---

## Requirements

### VR-1: Bootstrap Registry

The system shall initialize a registry containing the existing 15 curated ETFs (XLE, XLF, XLV, XLU, XLI, XLP, XLY, XLK, XLB, XLRE, XLC, IWM, DIA, TLT, GLD) plus SPY (16 total).

Each shall be marked with `discoverySource: "bootstrap"` and `operatorDisposition: { type: "none" }`.

Bootstrapped members begin as `effectiveStatus: "unevaluated"` until explicitly evaluated.

### VR-2: Admission Policy Definition

The system shall define an explicit admission policy containing:

- Expiration DTE range (min/max)
- Contract selection semantics (target delta, delta range, tie-breaker, zero-bid exclusion, greeks requirement)
- Side requirement (both/either/puts_only/calls_only)
- Market quality criteria: minimum open interest (hard), minimum option volume (observational), maximum bid-ask spread percent (hard), require greeks (hard)
- Institutional criteria: maximum capital per contract (hard), minimum capital per contract (soft)
- Income criteria: minimum annualized yield at target delta (soft)
- Near-miss tolerance percentage

Each criterion shall specify a severity level: hard, soft, or observational.

### VR-3: Policy Versioning

Each policy shall carry a version identifier and creation timestamp.

Changing the policy creates a new version. Existing evaluations remain historically valid under their original policy snapshot. Evaluations performed under a previous policy version are marked stale relative to the new active policy.

Policy changes shall NOT automatically trigger re-evaluation. Evaluation is a separate explicit action.

### VR-4: Operator-Triggered Evaluation

On explicit operator action ("Evaluate Registry"), the system shall evaluate all registry members sequentially against the active policy using available Tradier data.

Evaluation shall be progressive — results appear in the UI as each symbol completes.

Each evaluation attempt creates an append-only audit record regardless of outcome.

### VR-5: Evaluation Pipeline

For each symbol, the evaluation shall execute the following pipeline:

1. Select an expiration within the policy DTE range (prefer longest within range)
2. Fetch the options chain for the selected expiration
3. Select a call contract nearest target delta per contract selection policy
4. Select a put contract nearest target delta per contract selection policy
5. Evaluate per-side criteria for each side with a selected contract
6. Evaluate cross-side criteria (capital, greeks availability)
7. Aggregate into an admission outcome

Failures during expiration selection or chain retrieval shall produce appropriate attempt statuses (evidence_incomplete or provider_failed), not ordinary rejection.

### VR-6: Contract Selection Semantics

Contract selection shall reuse the same `findClosestToDelta` logic as Opportunity Lab with `PreferOTM` tie-break.

The Velvet Rope's delta range may be broader than Opportunity Lab's target delta because it validates market viability rather than selecting a specific trade.

Contracts with zero bid shall be excluded. Contracts without meaningful greeks (delta = 0 or null) shall be excluded when requireGreeks is enabled.

### VR-7: Non-Binary Outcomes

Evaluation outcomes shall be one of: admit, reject, insufficient_evidence, or manual_review.

Near-miss values (measured value fails but is within the configured nearMissPercent of the threshold) shall produce manual_review rather than reject for soft criteria.

### VR-8: Separate Call/Put Evidence

Call-side and put-side evidence shall be evaluated and displayed independently.

Each side produces its own contract selection result and per-side criteria evaluations.

The policy's `sideRequirement` determines how sides aggregate into the overall outcome:
- "both": both sides must select a contract and not produce hard failures
- "either": at least one side must pass
- "puts_only" / "calls_only": only the specified side is evaluated

### VR-9: Evidence Provenance

Each evaluation audit record shall capture evidence provenance per symbol:

- Provider identity
- When the market data was observed by the provider
- When the data was retrieved by the system
- Whether it came from network or cache
- Cache age in seconds (if cached)
- Whether the data is delayed (sandbox/15-min delay)

A fresh evaluation using old cached evidence must not be displayed as fresh market observation.

### VR-10: Append-Only Audit

Every evaluation attempt shall create an immutable audit record containing:

- Unique audit ID
- Evaluation run ID
- Symbol
- Attempt timestamp
- Attempt status (completed / evidence_incomplete / provider_failed)
- Policy outcome (when completed)
- Effective status after this record
- Complete policy snapshot used
- Expiration selection result
- Call-side evidence
- Put-side evidence
- Aggregated criteria
- Evidence provenance
- Operator disposition at time of record
- Human-readable explanation

Audit records shall never be deleted, capped, or modified.

Rejected ETFs and old decisions remain visible in the audit indefinitely.

### VR-11: Attempt Status vs. Policy Outcome

The system shall distinguish:

- **completed**: evaluation ran fully, outcome is populated, this becomes the latest successful evaluation
- **evidence_incomplete**: evaluation ran but critical evidence was unavailable (no expiration, no contracts in range), outcome may be insufficient_evidence
- **provider_failed**: evaluation could not run due to provider error, no outcome is recorded

Provider failures shall NOT overwrite or replace the latest successful policy evaluation. The UI shall display both the latest successful evaluation and the latest attempt separately.

### VR-12: Effective Status Derivation

Effective status shall be derived as follows:

1. If operator disposition is `manual_admit` → "admitted"
2. If operator disposition is `manual_exclude` → "excluded"
3. If operator disposition is `none`:
   - If no successful evaluation exists → "unevaluated"
   - If latest successful evaluation outcome is `admit` → "admitted"
   - Otherwise → "excluded"

### VR-13: Operator Override

An operator may manually admit or exclude any symbol regardless of policy evaluation.

Overrides take precedence over policy in determining effective status.

Overrides shall be recorded in the audit trail (the audit record captures operator disposition at time of evaluation).

### VR-14: Stale Evaluation Detection

When the active policy version differs from the policy version in a member's latest successful evaluation, the evaluation shall be marked stale.

The page shall display a warning prompting re-evaluation when stale evaluations exist.

### VR-15: Universe Comparison

The page shall display:

- The legacy curated universe (existing CURATED_UNIVERSE list)
- The Velvet Rope effective universe (members with effectiveStatus === "admitted")
- A diff showing: shared symbols, symbols only in legacy, symbols only in Velvet Rope

### VR-16: No Opportunity Lab Cutover

The first slice shall not change the Opportunity Lab's operational universe.

A `UniverseSource` type ("legacy_curated" | "velvet_rope") shall be modeled. The first slice fixes this to "legacy_curated". The future cutover will be a deliberate, reversible operator action.

### VR-17: Evaluation Run Tracking

Each evaluation batch shall be tracked as an EvaluationRun with:

- Unique run ID
- Started/completed timestamps
- Status (running / completed / partial / failed)
- Policy snapshot
- Requested, completed, and failed symbols
- Summary provenance (provider, mixed sources flag, delayed data flag)

### VR-18: Persistence

Registry state (members, audit records, policy, runs) shall persist to localStorage and survive page reloads.

The domain model shall remain storage-agnostic. localStorage is transitional prototype infrastructure. Audit semantics must not be weakened by storage limitations.

### VR-19: Volume Criterion Treatment

Daily option volume shall be included as a criterion with severity "observational".

It shall be recorded and displayed but shall NOT contribute to admission outcome decisions in the first slice.

Rationale: Volume is strongly affected by time of day, day of week, and market regime. Open interest and relative spread are more stable indicators for admission decisions. Volume may be promoted to "soft" severity in a future slice after repeated observations demonstrate stability.

### VR-20: Page Structure

The Velvet Rope page shall include three conceptual sections:

1. **Registry** — current member state, policy result, effective status, universe comparison
2. **Audit** — every historical analysis attempt and decision, with filters
3. **Policy** — active policy display, staleness indicator, explicit Evaluate action

### VR-21: Audit View

The Audit section shall display all audit records with columns including:

- Date/time
- Symbol
- Attempt status
- Policy outcome
- Effective status after decision
- Primary reason/explanation
- Policy version
- Call result summary
- Put result summary
- Evidence age/observed time
- Operator override status
- Evaluation run reference

Filters shall include: all analyzed, accepted, rejected, insufficient evidence, manual review, provider failed, overridden, status changed.

---

## Acceptance Criteria

1. Registry page loads showing 16 bootstrapped members as "unevaluated"
2. Active policy is displayed with all criteria visible
3. Operator clicks "Evaluate Registry" and sees progressive per-symbol results
4. Each completed evaluation shows call and put evidence separately
5. SPY correctly passes market quality but fails capital criterion → rejected
6. Provider failures create audit records without overwriting prior evaluations
7. Operator can override any symbol's effective status
8. Universe comparison shows legacy vs. Velvet Rope diff
9. Policy change marks existing evaluations as stale
10. Audit view shows complete history including rejected and failed attempts
11. All state persists across page reloads
12. TypeScript passes, existing tests pass, build succeeds
13. New tests cover: evaluation pipeline, aggregation rules, derivation rules, audit record creation

---

## Traceability

- Domain model: `docs/velvet-rope/00-domain-model.md`
- Design: `docs/velvet-rope/02-design.md`
- Architecture reference: `docs/04-architecture.md` (Universe Management bounded context)
- Project journal: `docs/journal/project-journal.md`
