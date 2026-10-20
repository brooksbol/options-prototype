# Construction model — Product checkpoint and Codex geometry experiment report (October 20, 2026)

**Standing:** Principal-requested Category D checkpoint and **reported actor results**, not independently verified tests, Product acceptance, or implementation authorization. The Codex branch was local to the user's machine and was not accessible by GitHub fetch at checkpoint time.

## Principal Product and architectural state

The underlying workstream is ontology-first and Product-first: reusable declarative Construction models; write-once account- and Position-scoped Construction instances; recursively composed cash, share and signed option exposure leaves; quantity and economic decomposition/recomposition; broker-normalized facts interpreted by backend domain logic. `ww live` is an options-focused low-data/high-storytelling human client; `ww positions` remains comprehensive inventory. Agents require deeper financial detail. Existing WW v1 and `tt live` are feasibility precedents, not universal proofs.

**Latest Position/Construction refinement:** Position identity is enduring and its current state/Construction reference can change, while a Construction instance is provisionally write-once. A particular instance may carry a `predecessor` hyperlink to its immediately prior Construction instance. Following this link reconstructs composition evolution; Orders, Executions and ledger facts explain actual transitions. This does **not** resolve the globally exact Position lifecycle or whether a complete close and reopen creates a new Position. `ASSIM-0002` remains PENDING.

**Order relationships:** trader-initiated brokerage instructions with separately retained states and conditions, independent of actual filled exposure. Working, unfilled, expired or canceled closing orders do not by themselves change Construction. Actual executions are needed to establish resulting change. Multi-leg package fills are primary specimen; partial package quantity fill is not a new Product-architecture design track. Time checkpoint and brokerage GTD order expiration are distinct. The tastytrade GTD-as-21-DTE-reminder workaround remains *untested*; none of the relevant trades had reached the expiration trigger at the October 20 discussion.

**Trade Shape Product constraint:** exactly one narrow Unicode/ASCII text row; topology and spot region matter more than proportional strike scaling. No added numerals, disclaimers, ornament or new columns *inside* the shape. Use bottom `▁`, top `▔`, ramps `╱`/`╲`, continuing-upside `ˆ`, continuing-downside `˯`, and cyan `▲`/`▼`/`◆` spot markers as the candidate visual vocabulary. Explicit Principal correction: both bullish and bearish verticals must have visually distinct bottom floors and upper plateaus; the Iron Condor needs `▁▁` lower tails at BOTH ends. The `tt live` visual experience is a constrained acceptance instrument; geometry must be mathematically derived from constituent terms, not Construction-specific hardcoded pictures.

**Intent/color boundary:** A payoff height/structural region is not automatically profitable or strategically desirable. An operator can want covered-call shares called away or to keep them; the same geometry may warrant opposite intent evaluations. Strategy implementation remains out of scope. Any structural red/yellow/green display is a candidate presentation policy, not universal success or profit.

## Codex actor report supplied by Principal

Codex reports its isolated branch `codex/construction-geometry-2026-10-20`, local commit `5bab2195504a0d49b2d3ff37743aa7afe7dd100f`; worktree given as `/Users/bollich/kiro/options-candidates/construction-geometry-2026-10-20/`. **Not a remote-main commit.**

- 33 harness tests and 15 existing payoff/reference tests reportedly passed. Candidate audit intentionally reported failures.
- All 39 model definitions have test fixtures and recomposition results.
- 31 drawable constructions; 321 spot cases; Unicode/ASCII/ANSI inventories.
- Six mixed-expiration models refused unsupported geometry; short shares deferred.
- 33 accepted counterexamples found missing multiplier/deliverable compatibility, currency constraints, and reverse Jade Lizard strike ordering.
- Broken-Wing economics reportedly remain mathematically exact; unequal flat-tail heights not faithfully represented by two glyph levels.
- Remaining Product judgments: unequal-height rendering, exact-turn marker behavior and classification overlap.
- Supplied candidate JSON and 59 protected executable/reference files reportedly unchanged.
- No production integration/deployment claimed; mathematical test pass ≠ independent Product acceptance.

**Named local artifacts, not accessible remotely at checkpoint:**
`experiments/construction-geometry/README.md`;
`experiments/construction-geometry/results/model-results.md`;
`experiments/construction-geometry/results/unicode.txt`;
`experiments/construction-geometry/results/ascii.txt`;
`experiments/construction-geometry/proposed-corrections.json`;
`experiments/construction-geometry/results/verification.json`.

**Retrieval limitation:** Attempted GitHub fetch using the exact branch ref `codex/construction-geometry-2026-10-20`; returned 404 “No commit found for the ref”. No file contents or executable results were independently verified. This checkpoint records the Principal-provided Codex summary, not a claim to have inspected its unpublished local program.

## Scoped architectural assessment

The program **reports** broad feasibility of separating declarative Construction recognition/economics from generic shape rendering. Multiplier/deliverable, currency and Jade Lizard problems are candidate definition/constraint repairs, not evidence of an architectural impossibility. An unequal-height broken-wing flat-tail problem is a real one-row display tradeoff to examine; preserve underlying exact payoff even when visual geometry is lossy. Classification overlap and exact-turn marker behaviors should be assessed against ordinary operator stories without adding UI columns or reopening the entire ontology.

Independent review remains **required** at a substantive stopping/acceptance point: independently inspect and run Codex branch artifacts (once made accessible, uploaded, or promoted under authorization); falsify all reported test findings against the accepted `tt live` evidence/visual contract, Construction ontology and golden specimens; report math fidelity, rendering fidelity, and acceptance separately. No Product decision on the three open topics is silently made by this checkpoint.

## Next action / boundary

Continue bounded Principal review of whether the strict one-row glyph alphabet can represent unequal flat-tail levels without creating misleading economic claims, while arranging actual independent access/verification to the Codex test artifacts. No Code/OAS/operational writes authorized by this snapshot. No strategy/margin implementation.
