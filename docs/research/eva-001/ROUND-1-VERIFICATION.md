# EVA-001 — Muse Round One Source Verification

Date: October 15, 2026 UTC (Muse report date; October 14 in America/Denver). Codex source checks against the first Principal-relayed Muse report and accompanying ChatGPT review. Status: partial evidence reconciliation; remaining Muse investigations pending. This is not a collective research conclusion or an accepted protocol revision. Repository baseline: `59afdfc6a1b1b580f03e18fb9740eea47a59a7da`.

## Directly checked findings

**Goyal–Saretto:** published [paper](https://academic.oup.com/rfs/article/38/6/1783/8010873), §§2.1–2.2/Table 1 and §4, plus linked Internet Appendix §IA1. It studies delta-hedged common-stock options, approximately 25-DTE monthly expiry-to-expiry portfolios, 1996–2022. With its 30% effective/quoted-spread scenario, 16 strategies retain significant net returns, while all net IPCA alphas are negative. This supports a benchmark/cost warning, not universal negative profit or a managed ETF-condor conclusion. Numerical figure claims beyond these checks remain unverified here.

**Option Alpha:** [vendor study](https://optionalpha.com/blog/trade-ideas-expected-value-probability-and-performance), Methodology and Average P/L sections. Approximately 130,000 ideas over 30 days/155 symbols, 1–30 DTE, compared with subsequently observed expiration outcomes; cash-settlement simulation excludes management, assignment/exercise and costs. This is empirical comparison, not merely repricing consistency. Its dependence structure, uncertainty and selected quiet-period limits prevent a demonstrated net advantage. The linked [probability documentation](https://docs.optionalpha.com/technical-documentation/calculations/probability) specifies BSM/N(d2); vendor explanation is not independent validation of implementation.

**Bliss–Panigirtzoglou:** [primary working paper](https://www.chicagofed.org/~/media/publications/working-papers/2001/wp2001-15r3-pdf.pdf), equation (1) and Table II. Under the stated representative-agent assumptions, q is proportional to p times marginal utility. Therefore p is proportional to q divided by marginal utility; with positive CRRA gamma, the normalized power weight is S^(+gamma). Muse's S^(-gamma) reverses the transformation. The paper's parameter estimation description also requires direct verification rather than substitution with a generic likelihood-fit claim.

## Review findings and research implications

- Muse's VERIFIED labels exceed its declared primary-read evidence in several places. Bibliographic/index/abstract or secondary-code evidence cannot certify primary tables, formulas, implementation or present commercial absence. Keep those claims at their demonstrated evidence grade; no global report ACCEPT is issued.
- RV–IV is a candidate baseline, not a universal sufficient predictor. Latent-factor explanation does not by itself identify an economic causal mechanism or eliminate every interpretation of mispricing.
- The enforcement-case example is not a controlled test of EVA or evidence that tail mismeasurement dominates all other failure mechanisms. Utility improvement is not automatically factor-model alpha. Public search non-discovery is not proof of novelty, proprietary practice or commercial failure.
- Event dependence, correlated idea counts and package execution deserve explicit tests, not a wider method tournament. The existing protocol already preserves costs, overlap, separate forecast/economic tests and the absence of any required Q→P reconstruction.
- Scope mismatch: current [PROTOCOL.md](PROTOCOL.md) evaluates entry forecasts under one fixed management policy. It does not test conditional HOLD/CLOSE/ROLL/HEDGE choice. A later lifecycle experiment would need common decision checkpoints, forward action-specific outcomes and comparable execution/capital assumptions. This note proposes no change of research priority or scope.

## Continuation

Await the remaining Muse research before significant protocol changes. Ask Muse to amend source grades, the power-transform direction and the omitted distinction between net return and IPCA alpha. No models, outcomes or new provider acquisitions were executed. This source note records research evidence only; it does not ratify the protocol or create experiment-execution authority.
