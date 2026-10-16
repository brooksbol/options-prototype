# ww live — first runnable inventory specimen

**Historical checkpoint, superseded by the finalized option-only Product scope.**
The implementation has advanced to the [structural candidate](ww-live-structural-specimen-2026-10-16.md).
The old command below targeted the installed backend; use the new isolated preview
for the candidate construction API. The 48-row inventory was never accepted as
the final ww live Product.

Status: local engineering candidate, not independently reviewed, Principal-accepted,
installed or deployed. Base: remote main `4685abe5b07563702a93858e75133d9ade28a16e`.
The [Product decisions](ww-live-product-plan-2026-10-16.md) govern this work under
PL-CLI-01 / PL-CONV-01. No pending membership-policy question remains.

## Runnable outcome and boundary

The candidate adds `ww live`, backed solely by `GET /v2/accounts` and
`GET /v2/positions`. One consolidated table uses accepted BROKER/ACCOUNT labels,
accepted contract typography, retained Position rows and backend remaining DTE.
The first operator run returned 48 inventory rows across three Accounts. This is
an observation of retained evidence, not a current brokerage inventory guarantee.
No acquisition, history read-through, service restart, database mutation, grant
change, installed-client replacement or brokerage operation was performed.

Local candidate: `/Users/bollich/kiro/ww-live-first-specimen`. Its ignored private
configuration is an exact mode-0600 copy of the accepted installed client's
configuration. The operator need not set variables or select ports/IDs:

```sh
/Users/bollich/kiro/ww-live-first-specimen/scripts/ww live
```

`--table` forces human output when redirected; pipes otherwise preserve complete
backend snapshot JSONL. `--account` selects an alias through existing discovery.
`--width`, `--ascii`, `--no-color`, NO_COLOR and TERM=dumb are supported. The
terminal's default foreground is used for neutral text; no background is set.
The ordinary installed `ww` is unchanged. No commit/push or installation is
claimed by this record.

## Reuse and falsifiable limits

- `ww-positions.mjs`: existing complete validation, exact-number parsing, v2 GET
  transport, Account-scoped reads and compact contract typography. Existing
  Positions output remains unchanged; only the label formatter is exported.
- `tastytrade-live-render.mjs`: accepted shared table, widths, Unicode/ASCII,
  narrow fallback and geometry renderer. Optional leading columns and text cells
  let the inventory surface retain unknowns without manufacturing economic tracks.
  TT defaults remain unchanged. No TT acquisition or domain engine is imported.
- Existing snapshot associations are preserved as supplied. Matching contracts
  stay separate; no new association, quantity allocation, managed occurrence or
  brokerage-derived membership is inferred. Backend overlap validation remains
  the accepted whole-holding boundary.
- The current public read supplies neither verified option construction/payoff
  nor Position-qualified retained underlying prices. Shape, range, spot, quote
  age and exit progress therefore display `—` (ASCII `--`). This is the earliest
  inventory/presentation foundation, **not completion of structural monitoring**.
- The first column after ACCOUNT says POSITION / CONTRACT because a recognized
  underlying symbol is not available for every backend Position. Unknown terms
  and adjusted contracts remain visible. Snapshot association labels are preserved.
- Backend single-constituent remaining DTE is formatted directly, including
  negative DTE. Multi-leg expiry compatibility and opening duration are not
  inferred. Holdings receipt time is never substituted for quote age or opening.
- Option inventory is displayed ahead of other holdings. Requested condor →
  credit vertical → single-option strategy ordering awaits backend recognition;
  constituent count and apparent strike geometry do not certify a strategy.
- Account snapshots need not represent one atomic cross-Account instant. An
  empty returned collection does not establish empty brokerage Accounts. Raw
  source timestamps, qualifications and association provenance remain in JSONL.

## Proof index

Authority: Product plan; Doc 77 backend authority/GET/acquisition boundaries;
Product-first mandate and technology-quality fitness controls. Accepted precedents:
`docs/cli/ww-positions-command-2026-10-15.md`, `docs/cli/tt-live-panel.md`, and
`docs/design/tt-live-economic-story/README.md`. October 13/14 scan proposals remain
historical; their inactive patch was not resumed. WW-GATE-001 remains STAGED.

`scripts/ww-live.test.mjs` tests actual command requests against a synthetic local
v2 server, alias selection, cross-Account output, denied/malformed responses with
no partial stdout, exact JSONL, matching-but-unassociated contracts, adjusted
holdings, explicit snapshot groups, unknowns, negative DTE, color independence,
ASCII and narrow fallbacks. Tests are author verification, not independent review
or Product acceptance. Existing Position and TT renderer suites check compatibility.
Real retained-evidence verification additionally used a process-level fetch guard
permitting only GET /v2/accounts and GET /v2/positions; both succeeded.

Author verification: 51 focused tests pass across live, Position alias/table,
TT panel/payoff renderers, shared command dispatch, history and update. Generated
show-manual consistency and scoped whitespace checks pass. The candidate also
ran successfully in a terminal with narrow layout. No visual acceptance or
independent review is inferred from these checks.

Next bounded engineering increment: extend backend snapshot association/term
evidence and construction qualifications to establish supported geometry, beginning
with iron condors, then compose qualified retained underlying observations. Preserve
geometry independently of unavailable market prices. Neither new client logic nor
an invented universal lifecycle engine can fill those evidence gaps. Existing
source precedence is decided; no repeat Principal decision is required.
