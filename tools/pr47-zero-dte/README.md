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
catalog, Greeks and quotes, and reconciliation of November 13 outcomes. No
unattended scheduler is installed or demonstrated by this slice. The current
read-only preparation command is the November 13 specimen; later-session
preparation and full assignment economics require their separately verified
continuation. Preserve all original treatments even if unfilled or unassigned;
do not retry those treatments in the remaining-41 batch.

Performance uses retained startup, provider request, pacing/lock and
preparation-to-ack events. Fills and position proof are measured separately.
Read-only discovery request counts are not requests per accepted order, and
single puts cannot establish improvement over two-leg buy-writes or sequential
call rolls without a comparable workload and measurement interval.
