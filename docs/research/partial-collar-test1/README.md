# Partial Collar Protected Growth — Test 1

Isolated, options-free state-machine falsification research. Authorized by the Principal handoff 2026-10-08, under `PL-STRAT-01`. No production Wheelwright behavior changes. [METHOD.md](METHOD.md) defines candidate resolutions and predeclared grid; [DATA.md](DATA.md) distinguishes executable prices, signals and provider evidence; [REPORT.md](REPORT.md) reports measured findings.

## Reproduce

Python 3.9+, tested on macOS arm 64/Python 3.9.6. All dependencies pinned in `requirements-lock.txt`.

```sh
cd docs/research/partial-collar-test1
python3 -m venv .venv
.venv/bin/pip install -r requirements-lock.txt
.venv/bin/python code/data.py
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python code/run.py
.venv/bin/python code/audit.py
.venv/bin/python code/report.py
```

`data.py` downloads only if missing and checks existing raw files against `data/raw/manifest.json`. Use `--refresh` deliberately for a new retrieval vintage. Frozen reference manifest is `data/reference_manifest.json`; compare the rebuilt raw hashes with that reference before claiming reproduction of this run. The normalized data hash is in `data/validation.json` and `results/run_manifest.json`. Vendor revisions can change fresh downloads. No credentials required for Yahoo/FRED/Cboe fallback.

ThetaData optional read-only provenance/coverage crosscheck, requiring a user-authenticated local terminal:

```sh
.venv/bin/python code/theta_probe.py
.venv/bin/python code/theta_download.py
```

These programs send no key or password; they query `127.0.0.1:25503`. Authentication belongs to the user-local terminal. Credentials, logs, terminal binary and dependencies remain outside versioned research artifacts. No secret contents are read by this research harness.

## Artifacts

- `data/raw/`: exact public-provider captures and Theta historical responses (local, ignored).
- `data/normalized/`: executable/reference/causal IWM prices, RVX, dividends, split events and Theta comparisons (local, ignored).
- `data/validation.json`, `data/reference_manifest.json`, `data/theta_*.json`: reproducibility and availability evidence.
- `results/parameter_matrix.csv`: all 291 full/train/test baseline records with candidate parameters and metrics.
- `results/regime_matrix.csv`: every candidate across seven fixed historical stress windows.
- `results/volatility_paired.csv`, `neighbor_robustness.csv`: matched price-only differences and immediate grid neighbors.
- `results/walkforward_*.csv`: expanding prior-only selection, annual independent reset-account folds and actual continuous walk-forward portfolio. Annual policy adoption waits for both vetoes to clear; prior pending orders execute unchanged. Fold accounts are not spliced into a fake continuous equity curve.
- `results/sensitivities.csv`: 11 candidate assumptions paired with five consistent comparators (55 runs).
- `results/fast_event_diagnostics.csv`: closing trigger versus next-open gap and decline already incurred.
- `results/logs/`: per-configuration compressed daily/trade/state CSVs for every baseline, walk-forward and sensitivity run, locally persisted and reproducible (ignored to avoid redundant generated bulk).
- `results/*_trades.csv`, `*_states.csv`, `*_daily.csv`: versioned fixed illustrations/controls.
- Four PNGs: equity/drawdown/exposure, robustness distribution, heatmaps and 2020 state timeline.

Raw historical captures are kept locally rather than redistributed in commits. Cboe RVX is copyrighted and cited to the source. Deterministic source URLs, hashes and exact transformations remain versioned. Results are model outputs, not broker execution records or independently accepted investment policy. No Tests 2–6.
