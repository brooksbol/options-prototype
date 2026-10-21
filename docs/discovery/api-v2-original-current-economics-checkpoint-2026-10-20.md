# API v2 original/current economics — Principal-approved candidate extension

**Standing:** Dated Product-design checkpoint for the next corrected candidate specification. Does not amend operative OAS, implement a feature, or change Codex's isolated candidate.

**Requirement:** A Position should expose original investment economics, current held contractual exposure, and cumulative changes across successive rolls/replacements, when supported by source evidence. Each is independently qualified; historical loss protection is not current protection. Reuse immutable Construction history, versioned Models, and source-qualified Orders/Transactions rather than introducing a tax-lot engine or separate strategy lifecycle machinery.

**Falsification cases:**

1. Covered call rolled ten times: retain originally evidenced share cost basis, current call economics, and cumulative documented opening premiums, closing debits, and fees. Economic breakeven is not broker tax basis; if entries are missing, cumulative economics is incomplete.
2. Protective puts replaced repeatedly: show original strike, premium and initial downside-loss estimate, versus currently held put and currently effective loss floor. Expired protection must not appear operative; original premium or roll history may be unknown.
3. Long-dated LEAPS replaced at maturity milestones: preserve original and current option type, strike, expiration, premium and contractual rights. A long call grants possible future share acquisition; it is not ownership of shares before exercise.

**Specification direction:** An optional, evidence-qualified original/current/cumulative economic comparison in a Position's detailed evaluation is sufficient. Field naming and schema are engineering decisions. No separate resource is required. Do not infer fill events, specific tax-lot associations, share-delivery choices, or fabricated costs from broker snapshots. Warnings must distinguish insufficient history from valid current exposure.

**Scope:** This adds a bounded accepted Product requirement to the ongoing candidate specification correction after Kiro's independent review. Any behavior dependent on missing brokerage evidence remains explicitly unknown. Specific share-to-option tax-lot linkage, operator association feature, margin and Strategy execution are not justified by this requirement.

**Context:** Principal decision in conversation on October 20, 2026: original investment and loss floor can remain useful after many roll/protection iterations, with LEAPS maturity milestones the more likely scenario; accepted as a minor addition of potentially substantial operator value. Related candidate `docs/discovery/api-v2-candidate-resource-contract-2026-10-20.md` and Codex local candidate `847315f1b2bf2964db20f417c9936e961eb5f750`.
