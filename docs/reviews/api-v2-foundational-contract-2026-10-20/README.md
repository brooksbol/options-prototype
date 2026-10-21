> Implementation successor: this package was imported from preserved a32c7c79 and receives the three mandatory implementation-entry corrections here. The following final-correction account is historical provenance. Current incomplete backend scope and verification live in [the implementation entry](../../implementation/api-v2-foundational-2026-10-21/README.md); do not infer runtime acceptance from this review package.

# Final bounded foundational v2 candidate

Branch `codex/api-v2-final-correction-2026-10-21`, based on preserved `c8ddbffc28e68dcd4c198ee10a5516603783eb8f`. The exact successor SHA is the containing commit (`git rev-parse HEAD`). Original847315f and correctedc8ddbffc worktrees remain unchanged. Remote main verified `72c602f8740fcbd9c25d67a13b35d81385b6e76b`.

Review [verification-report.md](verification-report.md), [final-correction-ledger.md](final-correction-ledger.md), [openapi.json](openapi.json) and [runtime-invariants.md](runtime-invariants.md). This pass addresses one residual Major and six Moderate findings only; Kiro's next task is targeted verification, not another architectural audit. No operative specification or application changes.

## Deterministic verification

Run from the worktree root in an existing Python environment with jsonschema4.25.1/openapi-spec-validator0.7.2, and Node24:

```sh
python -B docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py
python -B docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py
node --test docs/reviews/api-v2-foundational-contract-2026-10-20/tt-live-replay.test.mjs docs/reviews/api-v2-foundational-contract-2026-10-20/final-source-replay.test.mjs
node --test scripts/tastytrade.test.mjs scripts/tastytrade-credit-spreads.test.mjs scripts/tastytrade-economic-story.test.mjs scripts/tastytrade-manual-exit.test.mjs scripts/tastytrade-payoff-render.test.mjs docs/design/position-payoff-visual-contract/tests/visual-contract.test.mjs
```

Only review artifacts are rewritten by the optional regeneration commands below:

```sh
python docs/reviews/api-v2-foundational-contract-2026-10-20/regenerate-final-examples.py
node docs/reviews/api-v2-foundational-contract-2026-10-20/regenerate-tt-examples.mjs
python docs/reviews/api-v2-foundational-contract-2026-10-20/finalize-review-fixtures.py
```

`examples/final-source-fixtures.json` supplies the synthetic CSP/Buy-Write/IC facts. The generator calculates their economics; independent tests calculate directly from source quantities/costs/quotes and mutate costs to falsify mismatches. TT generation calls actual repository projectLive; independent tests do not import its adapter and compare raw fills/quote timestamps, NY calendar arithmetic and exact held-leg economics as well as projectLive output. No live broker call or application evaluator is introduced.

The retained Artifact contains explicit synthetic `coverageSource` and `historyTransitions` witnesses. These are supplied review specimens, not reconstructions of missing broker history. Prior original/current/cumulative arithmetic remains intact. [results/changed-files.json](results/changed-files.json) and [results/comparison-to-c8.json](results/comparison-to-c8.json) identify the exact bounded delta. No push or merge.
