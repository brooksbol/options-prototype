# Wheelwright Talk — question-first tactical position analysis (Principal direction, October 23, 2026)

**Standing:** Principal's directional Product input and explicit instruction to persist. This records the desired destination and incremental approach; it does **not** ratify unimplemented API semantics, create a new architectural mandate, authorize trading, or require an all-at-once implementation.

## Principal's exact words

- “now we can work up to that. i'm not saying we have to deliver all of that at once. but take that and take tt live as directional input from me. that's where i want to go. remember. simple questions. hard answers that seem simple when you read them.”
- “i don't mind explanations. especially for the complicated stuff. but think about how you use graphics to make your points. and how you use tables to get information across. color. fonts boldings, structure. narrative. it has to tell the story. it has to be tactical not ‘technically correct’.”
- “well, that's part of it. there's still missing data. the thing can't yet recognize a covered call. that's pretty basic stuff. there's really only quantities, and basic positions. nothing about what's going on.”
- Regarding TT Live: “it's use of color and unicode graphics. it's still the gold standard. not a single wasted character. anywhere.”
- The H-005 interpretation preview is an improvement but remains below Product aspiration; don't mistake author tests, model compliance, or pretty prose for operator value.

## Destination — operational question

“How is this trade doing, why is it changing, and what needs my attention?”

A capable answer should join authenticated holdings and economic constructions, actual opening/adjusting/closing fills, fees, current executable closing economics, comparable historical evidence, risk geometry, Greek/IV sensitivities, working orders and configured management rules. It must distinguish observed data, derived arithmetic, estimates, hypotheses, unavailable evidence and actionable attention. This is an **aspiration to grow into**, not a requirement to deliver everything in the next increment.

## Principal's tangible specimen (screenshots on Oct 22–23; not synchronized)

- EWZ iron condor Nov 20 2026: +31P / -32P / -42C / +43C; displayed opening credit $0.42 ($42), not fill-verified; P/L open percentage -54.8% → -41.3%, DTE 29 → 28, ETF delta -2.77 → -3.09; Oct 23 ITM indicator.
- UNG iron condor Nov 27 2026: +8.50P / -9P / -13C / +13.50C; displayed opening credit $0.09 ($9), not fill-verified; P/L -101.6% → -78.6%, DTE 36 → 35, ETF delta +6.39 → +9.25.
- XLF bull put spread Nov 27 2026: +52P / -52.50P; displayed opening credit $0.09 ($9), not fill-verified; P/L +20.7% → +55.6%, DTE 36 → 35, ETF delta +1.45 → +2.59.
- Earlier Oct 22 dollar-mark screenshot: EWZ put side +$6, call side -$29, total -$23; UNG total -$9.14; XLF total +$1.73. Do not treat as synchronized with percentage screenshots.
- All three displayed P/L percentages improved, but magnitude of delta increased. That does not explain causation or establish executable closing value.

## Analytical guardrails from Principal's supplied position-analysis brief

- P50 = 50% of verified opening net credit, before fees unless explicitly specified. The 21-DTE milestone is a management **review**, not an automatic exit. These condor/spread experiments do not use Income Wheel's assignment/Monday liquidation policy.
- A profit plateau is at-expiration geometry, not current profitability or safety. Net delta is local directional sensitivity, not overall risk. Price direction alone does not establish condor economics.
- Compare like-for-like positions and synchronized, quality-qualified quotes. A lower *reliable* buyback cost improves an unchanged short-credit trade.
- Do not conflate mark/midpoint with executable fill or leg-synthetic combo market with native combo quotes. Greek factor attribution is an estimate, with units, models, timestamps, residual and honest uncertainty. Never infer drivers from two P/L percentages and net delta alone.
- Verify fills, opening credit denominators, multipliers, commissions and fees before asserting profit. Distinguish captured-premium percentage from return on risk/capital. Capture open orders and liquidity/session/quote-age issues. Never place or change orders as part of explanation.

## Product interaction and information design

**Simple questions; hard answers that appear simple.** Evidence processing can be deep; the operator-facing answer must be tactical and economical with attention.

- TT Live is the reference **information-density and legibility** standard, not a demand to clone it as a chat window. Use color, Unicode geometry, compact tables, bolding, layout, and focused narrative whenever those tell the story better than prose; give complicated explanations when warranted and details/Greeks on demand.
- Begin with the meaningful outcome and next attention, then the supporting numbers/structure, then only material caveats.
- Recognize ordinary option constructions (covered calls, short puts, verticals, condors) when contract terms, underlying, deliverables, quantity and permitted allocation evidence justify it; distinguish geometric compatibility from confirmed allocation/Operating Program membership.
- Separate **inventory** (what's held), **structure** (what positions/trades), **economics** (where started/now), **change/causality**, and **tactical management** (what needs inspection). These are reusable incremental question capabilities, **not five new projects or a release checklist**.
- Wheelwright API v2 and underlying domain/evidence authorities own facts, identity, permissions, and computation. MCP and model assemble authorized, grounded context and explain; don't merely reformat broker output or invent economic intelligence in a prompt.
- Avoid returning to a cycle of prompt-only polishing, long governance reviews, or overly cautious formulations that bury known facts. Missing data is a genuine capability gap; characterize it explicitly.
- The acceptance standard is practical: does the answer make it easier for the operator to understand and assess a position than looking at individual quote, trade, Greek, payoff and order screens?

## Incremental implementation posture (suggested, not ratified roadmap)

Start with one simple operator question that establishes or reuses *actual trade structure and useful economics*, small enough to run early against a real authorized account. Investigate the nearest working TT Live and API v2 precedents; inspect which required data currently exists, is retained, is accessible through MCP, or is missing. Deliver the smallest real, truthful improvement, expose the result to the Principal early, preserve installed state/rollback and avoid unnecessary Codex ↔ Kiro loops. Next questions can deepen performance, change drivers and attention, as evidence supports.

This record is Product-direction input; it neither supersedes ratified current meaning nor pre-selects H-006 or redesigns API v2.
