# Test 1 — Principal review

**Date:** October 8, 2026  
**Evidence baseline:** `fbaeeb35657961e029e95a9a7f98a368de31cd60`  
**Disposition:** Principal accepts FAIL for the tested tactical state-machine candidate against its combined protection/growth objectives. Broader Partial Collar Protected Growth strategy remains unproven. No further implementation authorized; Test 2 is not authorized.

## Accepted result and scope

The Principal acknowledged negligible full-period incremental protection: maximum portfolio drawdown 15.23% versus 15.22% for passive 300-share ownership. Ending value $154,259 versus $175,429 represents a $21,170 shortfall, approximately 12.1% of the passive ending value. The fast engine's 2020 benefit addresses a local crash problem without establishing complete-cycle portfolio improvement. Supporting measured evidence remains in [REPORT.md](REPORT.md).

This acceptance concerns the tested tactical exposure-management implementation. It does not establish failure of the complete three-component architecture: permanent protected 100-share core, two tactical 100-share blocks, and options-based protection/financing. Test 1 excluded collar economics; the broader thesis is untested.

## Preliminary interpretation and unresolved diagnosis

The Principal's preliminary interpretation is that selling during declines and repurchasing during recovery may be substantially harder to make profitable than stylized examples implied. Cash drag, whipsaw and delayed re-entry appear to consume local crash benefits. This interpretation is not a settled causal diagnosis or an architecture-revision decision.

The next evidence-review question is to distinguish defective parameterization, defective state-transition policy, and a fundamental weakness in tactical share recycling. These remain materially different possible explanations. The Principal intends to inspect the actual findings, trade logs and regime-specific results before deciding whether the architecture needs revision. No successor experiment, tuning, policy change or implementation is authorized by this review.

## Evidence navigation

- [Findings report](REPORT.md), including limitations and regime interpretation.
- [Fixed confirmed-fast trades](results/D_p0.06_v0.50_r0.50_n0.50_trades.csv) and [states](results/D_p0.06_v0.50_r0.50_n0.50_states.csv).
- [Regime matrix](results/regime_matrix.csv) and [parameter matrix](results/parameter_matrix.csv).
- [Candidate state-transition policy](METHOD.md).

This record preserves the Principal disposition separately from generated research findings. No simulations or results were changed during decision reconciliation.
