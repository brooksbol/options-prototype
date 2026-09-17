# Wheelwright Bug Index

**This is the canonical discovery index for Wheelwright defects.** `docs/bugs/` is the one and only authoritative defect-tracking mechanism (see `docs/bugs/README.md`). GitHub Issues are historical provenance only.

Each row points to the authoritative `BUG-NNN-*.md` record, which carries the full detail. Severity `Not established` means the historical record never asserted a severity; it must not be invented.

| BUG | Title | Area | Severity | Status | Record | Provenance |
|-----|-------|------|----------|--------|--------|------------|
| BUG-001 | Activity overlay does not project assigned-call closure / called-away disposition | Portfolio / lifecycle overlay | Not established | Open | [record](BUG-001-assigned-call-closure-projection.md) | GH #2 |
| BUG-002 | Production cannot derive called-away share basis from direct purchases / buy-writes | Production | Not established | Open | [record](BUG-002-called-away-share-basis.md) | GH #3 |
| BUG-003 | "Produced" result not legible: composite economic sources not first-order visible | Production | S3 | Open | [record](BUG-003-produced-composite-legibility.md) | GH #8 |
| BUG-004 | Console composes temporally incompatible evidence into apparently-coherent view | Operator Console | S2 | Open | [record](BUG-004-incoherent-composed-evidence.md) | GH #9 |
| BUG-005 | Kreature nav advertises a route that renders an empty surface | Application Shell / nav | S3 | Open | [record](BUG-005-kreature-empty-surface.md) | GH #10 |
| BUG-006 | Called-away "capital returned" uses reconstructed strike notional, not actual proceeds | Production | Not established | Open | [record](BUG-006-capital-returned-strike-notional.md) | GH #11 |
| BUG-007 | Unknown stock-disposition basis can leave reconciliation appearing complete | Production | Not established | Open | [record](BUG-007-unknown-basis-appears-reconciled.md) | GH #12 |
| BUG-008 | Economic Activity presents inflated contract counts (episode double counting) | Production | Not established | Open | [record](BUG-008-inflated-contract-counts.md) | GH #14 |
| BUG-009 | Capital label text diverges from backing amount; label-less non-null expired amounts | Production | Not established | Open | [record](BUG-009-capital-label-amount-divergence.md) | GH #15 |
| BUG-010 | Phantom 09:30–09:45 Open Delay: FE session gate hardcodes Sandbox profile | Operator Console / session gate | S2 | Resolved | [record](BUG-010-phantom-open-delay-session-gate.md) | GH #16 |
| BUG-011 | Provider-reported exact-zero Delta is rendered indistinguishably from absent Delta evidence | Operator Console / Greeks evidence presentation | Not established | Open | [record](BUG-011-provider-zero-delta-indistinguishable-from-unavailable.md) | Provider study 2026-09-11 |
| BUG-012 | Deployment (Write Desk) shows zero candidates on a sealed/non-trading session; session authority never reaches the recommendation consumer | Write Desk / consumer-path session-authority reach | S2 | Open | [record](BUG-012-deployment-empty-on-sealed-session-stale-authority.md) | Discovered 2026-09-13 |
| BUG-013 | Trading-day PREMARKET per-subject admissibility invalidates prior-session sealed evidence that session-level classification still treats as canonical | Backend / SessionClassifier per-subject admissibility | S2 | Open | [record](BUG-013-premarket-subject-admissibility-invalidates-sealed-evidence.md) | Discovered 2026-09-14 |
| BUG-014 | Sealed-session completeness reconstructed from mutable current-work state; next-session re-resolution falsely revokes a completed session | Backend / durable sealed-session authority | S2 | Open | [record](BUG-014-sealed-session-completeness-reconstructed-from-mutable-state.md) | Discovered 2026-09-14 |
| BUG-015 | Operator Console moneyness sparkline folds multi-day spot history onto one intraday session (misleading geometry; numeric values correct) | Operator Console / moneyness sparkline | S3 | Open | [record](BUG-015-moneyness-sparkline-folds-multiday-history-into-one-session.md) | Discovered 2026-09-14 |
| BUG-016 | Deployment funnels (CSP/Covered Call/Buy-Write) expose aggregate counts without preserving/exporting the exact evaluation-unit membership that produced them | Write Desk / Decision funnels observability | S3 | Resolved | [record](BUG-016-funnel-aggregate-counts-lack-exportable-membership.md) | Discovered 2026-09-14 |
| BUG-017 | Deployment CSV export may be constrained by presentation row limit | Write Desk / Deployment CSV export | Not established | Open | [record](BUG-017-deployment-csv-export-row-limit.md) | Acceptance testing 2026-09-14 |
| BUG-018 | Newly admitted (pending) universe member is not discoverable on Deployment; evaluated-universe count conceals distinct symbol states; no operator-facing targeted hydration for non-portfolio symbols | Write Desk (Deployment) / operator discoverability + hydration | S3 | Open | [record](BUG-018-admitted-pending-symbol-not-discoverable-on-deployment.md) | Discovered 2026-09-14 |
| BUG-019 | Operator-forced off-hours acquisition succeeds but its newly acquired evidence is marked `admissible: false`, making it unusable by Decision | Backend admissibility semantics ↔ Decision consumer / operator-forced acquisition | S2 | Open | [record](BUG-019-forced-offhours-acquisition-marked-inadmissible.md) | Discovered 2026-09-14 |
| BUG-020 | "Today's G/L $/%" uses Wheelwright's first intraday observation as baseline instead of prior session close, producing broker-mismatched (often sign-inverted) daily G/L | Operator Console / Unencumbered Shares + DTE ladder + CSV; per-symbol quote path | S2 | Resolved | [record](BUG-020-todays-gl-uses-first-observation-not-prior-close.md) | Discovered 2026-09-16 |
| BUG-021 | Buy-to-close option classified as generic asset purchase (CAPITAL_DEPLOYMENT), never netted against recognized premium | Production / accounting (TransactionClassifier → EconomicDecomposer) | Not established | Open | [record](BUG-021-btc-misclassified-as-asset-purchase.md) | Discovered 2026-09-16 |
| BUG-022 | Deployable cash is regime-unaware: balances parser folds margin-derived buying power into the legacy "all settled" slot, over-stating unlevered deployable on a margin-enabled account | Write Desk / broker-balance ingestion + deployable-cash derivation | Not established | Resolved | [record](BUG-022-deployable-cash-regime-unaware-folds-margin-buying-power.md) | Discovered 2026-09-17 |

## Migration provenance (2026-09-11)

Migrated from GitHub Issues as a knife-edge authority cutover (Principal decision). Historical defect population → BUG identity, in ascending GitHub Issue number:

| GitHub Issue | BUG |
|---|---|
| #2 | BUG-001 |
| #3 | BUG-002 |
| #8 | BUG-003 |
| #9 | BUG-004 |
| #10 | BUG-005 |
| #11 | BUG-006 |
| #12 | BUG-007 |
| #14 | BUG-008 |
| #15 | BUG-009 |
| #16 | BUG-010 |

**Not migrated (explicitly not defects):** GitHub Issues #1 (roadmap intake), #4 (product gap / export), #7 (discovery note). GitHub numbering gaps (#5, #6, #13) have no significance for BUG identity.

**Migration notes:**
- BUG-001 (GH #2) carried no `defect` label historically; the Principal ruled it **is** a defect based on its authoritative body. Membership is semantic, not label-driven.
- BUG-008 (GH #14) and BUG-009 (GH #15) have **corrupted trailing prose in the source Issue**; the surviving text is preserved verbatim and the corruption is explicitly marked in each record rather than reconstructed.
- BUG-010 (GH #16) is Resolved: remediation PR #17; subsequent architectural-learning provenance PR #18 / ADR-017 (which post-dates the defect).
