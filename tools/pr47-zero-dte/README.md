# PR47 all-69 expiration-day put acquisition research

This scoped paper experiment extends the reviewed PR46/PR47 readers, sender,
coherent financial bracket, durable pre-send claims, provider workers and shared
rate locks. It does not change Product policy, TT1 or installed software.

The retained November 8 calendar assigns 28 original treatments to November 13
and only the remaining 41 to November 20. KVUE is excluded. Source calendar,
native account mapping, evidence, fixed client identities and state are retained
privately under Wheelwright's `pr47-all69-0dte-acquisition-20261113` directory.
Do not copy native identities or raw brokerage responses into the repository.

The Principal explicitly replaced the separate-account requirement with use of
the existing PR47 margin account. Cash collateral remains mandatory: margin
borrowing, automatic funding/reset, stock controls, cancellation/replacement and
automatic retries of attempted orders have no implementation here.

## Entry specimen

`prepare.py` performs bounded read-only catalog, Greek and quote acquisition.
`execute.py observe` reads the bound account and original claimed identities.
`execute.py execute --reviewed-execution` additionally requires verified private
account admission with execution enabled after independent review. The command
permits dispatch only on the assigned expiration date, noon through before
4 p.m. Eastern. It never substitutes a later expiration.

`model.py` selects the lowest listed standard, physical 100-share put strike
whose absolute Tastytrade delta is strictly greater than 0.50. Every lower
eligible strike must have an independently timestamped Greek no older than
120 seconds and not future dated. Qualified real-time Tradier quotes establish
the positive current bid and exact verified contract tick; no rounding occurs.

Full-universe collateral is checked before the first submission and each
dispatch: current short-put obligations, unreflected claims, and all remaining
intended treatments. Later-session reserves are labeled estimates and must be
refreshed. Acquired stocks consume cash; neither their market value nor expected
premium is added to capacity. Qualified data failures hold only that treatment,
retain its reserve, and are reported explicitly; they do not silently delete it
or prevent qualified peers from proceeding. Financial/identity failures stop
dispatch. An attempted identity is never sent again, including unknown outcomes.

Each intended one-contract PUT sell-to-open LIMIT DAY order uses the retained
single sender and pre-send durable claim. Books are acquired in one underlying
plus exact-option batch; session-clock caching and the shared provider pacers
remain in effect, including observation-worker usage. A warm put-specific
Tastytrade worker reuses OAuth and quote tokens and nested-chain metadata.

Acceptance, fill confirmation, position proof and later assignment/delivery are
separate milestones. Entry position proof does not establish share acquisition.
The reused lifecycle reader requires exact contract cash activity plus a full
share bridge. Existing-account call/put obligations must also be accounted for;
ambiguous multiple-lot assignment allocation remains unresolved, never inferred.

## Verification and continuation boundary

Run offline tests with the retained Webull SDK Python environment:

```
python -m unittest discover -s tools/pr47-zero-dte -p 'test_*.py' -v
```

Record source SHA, tests and independent review before enabling execution. Use
the source-graph verification inherited from `pr47-covered-call/runner.py` for
installed dependencies. Default commands never fund or reset an account.

November 20 requires an active agent/operator session, fresh account/collateral,
catalog, Greeks and quotes, and reconciliation of November 13 outcomes.
`continuation.py` verifies the original remaining-41 enrollment and writes the
private recovery receipt. Preparation uses its actual Eastern session date:
November 13 measures 28 entries plus 41 future estimates; November 20 refreshes
only the remaining 41 and keeps the first 28 as prior-session records. Past
unattempted treatments become explicitly missed, never re-enrolled. Explicit
Principal withdrawals stay excluded across same-day and later resumes and are
never dispatched or relabeled missed. Terminal
zero-fill broker orders retain their original identity and release collateral
only after matching native terminal/zero-fill evidence with no working row.

`observe_lifecycle.py` is a separate read-only observer using the retained exact
OCC OPTION_EA cash-event and complete-symbol share bridge, including older calls
and puts. It preserves entry fill/position proof separately from later position
changes. Filled prior-session entries with pending lifecycle proof retain their
full unresolved cash reserve. Assignment requires delivered shares and a
reconciled account cash bridge; original account stock is not a new acquisition.
Multi-lot ambiguity and missing exact-contract events remain explicit. Net
acquisition cost is derived only when entry cash is uniquely attributable,
assignment/debit/share evidence reconciles, and no cash charges remain
unallocated; unreported fee/commission categories stay unknown.

Conflicting cash rows sharing an activity identity stop qualification; identical
repeats count once. This closes the independently reproduced pre-activation
observer defect at candidate `089ba204`; it did not affect the earlier accepted
entry source `0309d84d`.

The shared account can acquire positions outside this experiment. The retained
financial bracket now has default-compatible inventory/signature hooks. For a
foreign one-lot, two-put VERTICAL only, the scoped adapter may retain opaque leg
polarity after complete native history proves a unique filled one-to-one opening
order. Both legs are reserved at full strike times 100; no hedge credit, margin
capacity or invented signed positions are used. Full native position values and
opaque structural signatures remain inside both financial boundaries. Original
69 symbols cannot use this opaque path; unknown calls, ratios, deliverables or
unproved histories block. Supported position counters are explicitly scoped;
the separate foreign reserve is included in whole-basket funding.

The observer supports a bounded scheduled mode through November 24, with no
sender or funding calls. A separately verified private launchd registration may
run that read-only mode every 15 minutes; installation alone is not evidence of
a successful scheduled observation. Preserve its actual source/run receipts.
It skips while an account writer owns state. This does not install unattended
November 20 trading: entry still requires the active agent session described
above. Preserve unfilled, unassigned and unresolved original treatments.

Performance uses retained startup, provider request, pacing/lock and
preparation-to-ack events. Fills and position proof are measured separately.
Read-only discovery request counts are not requests per accepted order, and
single puts cannot establish improvement over two-leg buy-writes or sequential
call rolls without a comparable workload and measurement interval.
