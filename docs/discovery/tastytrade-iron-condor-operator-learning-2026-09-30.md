# tastytrade iron-condor operator-learning snapshot — 2026-09-30

**Status:** Current Specialized Reference / empirical operator-learning snapshot.  
**Scope:** Preserve a small real-money tastytrade learning session for later Wheelwright reference.  
**Authority boundary:** This record does **not** admit iron condors into Wheelwright strategy policy, ratify numeric thresholds, or authorize implementation. It preserves observations, workflow learning, and evidence.

## Why preserve this

The Principal used a deliberately tiny tastytrade account to learn the platform's multi-leg workflow and bracket management. The session exposed useful distinctions between broker capability, UI behavior, order lifecycle, and strategy-policy questions that may matter if Wheelwright later supports defined-risk multi-leg strategies or broker-aware execution guidance.

Two sanitized CSV snapshots from the session are preserved alongside this note:

- `data/tastytrade/2026-09-30/tastytrade-positions-2026-09-30-sanitized.csv`
- `data/tastytrade/2026-09-30/tastytrade-activity-2026-09-30-sanitized.csv`

Account identifiers and broker order identifiers were removed/replaced before persistence because this repository is public. Strategy, price, status, timestamp, leg, DTE, IV Rank, and lifecycle evidence were retained.

## Operator workflow learned

The Principal's working tastytrade iron-condor flow at the end of the session was:

1. Clear the existing order ticket.
2. Select the symbol.
3. Go to Table.
4. Deliberately select the intended expiration / DTE.
5. Use the blue strategy control to generate an Iron Condor.
6. Switch to Curve.
7. Use tastytrade's **Width expand** control to move the generated structure outward until the desired P50 / POP region is reached. The Principal was not manually dragging or individually selecting strikes in this workflow.
8. Inspect resulting economics and buying-power consequence.
9. Review & Send.
10. If the ticket validates, Submit.
11. After fill, expand the position and verify that working exits actually exist.

The DTE-selection step needs a conscious visual checkpoint. In this experiment, XLE was accidentally opened at **16 DTE** while the broader exploration was centered on roughly **45 DTE**. For the available XLE cycle discussed earlier in the session, 45 DTE was bracketed by **37 DTE** and **51 DTE**; 51 was numerically closer. This is operator-learning evidence, not a ratified DTE policy.

## Post-fill bracket management learned

A filled four-leg position can be selected leg-by-leg in Positions. With all four legs selected, the bottom Actions menu exposes:

- Close Position
- Close at % Profit
- Analysis
- Advanced Order → Bracket
- Advanced Order → Contingent on Price

For EWZ, the opening iron condor filled without attached exits. Selecting all four filled legs and choosing **Actions → Advanced Order → Bracket** created the missing managed exits in one operation.

Observed EWZ post-fill state after that action:

- opening credit: **$0.42**
- 50% profit close: **$0.21 debit**, GTC
- stop child: **STP $0.53 / LMT $0.53 debit**, GTC
- closing legs were correctly inverted across the entire four-leg package

The exported activity CSV predates the later post-fill EWZ bracket addition, so it contains the EWZ entry but not those later working children. The UI observation above is therefore preserved separately here.

Observed XLE managed state in the activity snapshot:

- opening credit: **$0.18**
- profit child: **$0.09 debit**, GTC
- stop child: **STP $0.24 / LMT $0.24 debit**, GTC

## Filled experimental positions

### EWZ — 51 DTE

- +31P / -32P / -42C / +43C
- $1 wings
- filled for **$0.42 credit**
- position export showed IV Rank **99.8**
- later received post-fill bracket exits as described above

### XLE — 16 DTE

- +59P / -59.5P / -64.5C / +65C
- $0.50 wings
- filled for **$0.18 credit**
- position export showed IV Rank **68.6**
- bracket children were present and working in the activity export

## Transient complex-order validation finding

During construction/testing, tastytrade repeatedly displayed/reported:

`Complex order structure is invalid`

Early hypotheses considered DTE, width manipulation, 50%-profit settings, stop-limit children, and Desktop-vs-Web differences. The session ultimately falsified any simple claim that the broker categorically rejects bracketed four-leg iron condors:

- DRAM has a rejected three-order chain in the activity evidence: opening condor + profit child + stop child, all rejected with the complex-order error.
- XLE later has a successfully filled four-leg parent plus two working GTC children.
- EWZ filled as a plain four-leg condor and later accepted a post-fill bracket from the Positions Actions menu.
- The same error was observed in both Desktop and Web during experimentation.

Therefore the durable conclusion from this session is intentionally narrow:

> The `Complex order structure is invalid` condition behaved transiently during this experiment. A rejection must not by itself be promoted into evidence that the broker lacks the underlying multi-leg/bracket capability.

The exact cause was **not established**. Do not preserve the discarded explanations as fact.

## IV / strategy-screening learning

The session reinforced a useful vocabulary distinction for future exploration:

- **IV Rank**: relative volatility regime for the underlying versus its own historical range.
- **IV Index / absolute IV**: current absolute implied-volatility level.

High absolute IV does not necessarily mean high IV Rank. If Wheelwright later explores defined-risk short-premium strategies, preserving both measures may be useful. This observation does not establish an admission rule or threshold.

The broader exploratory shape discussed was approximately:

`IV regime → target expiration near ~45 DTE → generated iron condor → width adjustment → P50 / POP → economics / buying power → managed exits`

That is an observed/considered workflow, **not Wheelwright policy**.

## Evidence-use cautions

- The account was intentionally tiny and these were learning trades, not a statistically meaningful strategy test.
- P50/POP selections and stop defaults observed in tastytrade are platform outputs/controls, not ratified Wheelwright objective functions.
- The XLE 16-DTE position should not be treated as evidence for a 45-DTE methodology.
- CSV timestamps and prices are point-in-time session evidence.
- Broker UI behavior may change; future execution design should treat broker/interface capability as evidence to reacquire, not timeless truth.
