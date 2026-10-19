# ww positions — Human presentation contract — October 17, 2026

**Status: Principal-accepted presentation reference (Category B); NOT implemented or installed.**
**Owner:** existing PL-CLI-01. **Authority:** Principal's iterative mock review ending
“this is what a good human output looks like for ww positions”, followed by
“persist this in github”. This authorizes documentation persistence, not engineering,
API changes, installation or resumption of the stopped ww live workstream.

## Operator outcome and accepted grammar

The operator should see what is held, why it is held, and which option obligations
its collateral supports. Fidelity Cash/Margin carrying classification does not answer
whether assets are committed, borrowed against or available; remove CUSTODY from
the default human table. Preserve carrying classification as source evidence rather
than deleting or reinterpreting it. This presentation acceptance does not redesign
verbose/structured contracts.

Use one aligned table across authorized Accounts, with this column order:

`BROKER | ACCOUNT | POSITION | CONTRACT | QTY | PURPOSE | STATE | COLLATERAL | DTE(today) | OPEN P/L | MKT VALUE`

- Separate POSITION (for example `URA 43 CALL`) from CONTRACT (`261106C43`).
  Stock rows have blank CONTRACT cells. Human shorthand is not canonical identity.
- PURPOSE replaces the proposed ROLE heading. Accepted labels in these specimens:
  `Long Shares`, `Collateral Shares`, `Cash Secured Put`, `Covered Call`, `Treasury Bill`.
  These examples do not define a complete domain taxonomy.
- Put STATE between PURPOSE and COLLATERAL. Retain broker-reported quantity,
  open P/L and market value and the supported DTE presentation.
- COLLATERAL shows the actual associated shares or cash on an option row, and
  the linked option contract on a collateral-share row. No arrow characters.
- Split share holdings into separate display rows by allocation: unallocated shares
  as Long Shares; committed shares as Collateral Shares linked to their respective
  option contract. Do not list ten contracts in one widening collateral cell.
  Display allocation does not create a new canonical Position or managed membership.
- Use blank cells for absent/unavailable values in this default human table, rather
  than `—`, `?`, or repeated `Cash backing unknown`. Preserve reasons and the
  distinction between not applicable, unknown and conflicting in detailed/structured
  evidence; a blank is not a zero or proof of absence.
- Calculate column widths across the complete displayed collection and pad every
  row from the same widths, including empty cells. Right-align numeric columns.
  The Principal rejected multiple hand-spaced mocks for misalignment.
- Proposed `--options` selects option Positions AND their associated collateral;
  excludes unrelated shares, unallocated share remainders and unrelated fixed income.
  It is not simply a filter on instrument type. The flag is hypothetical and is
  not currently supported. Unresolved option evidence must not silently disappear.
- Preserve accepted brokerage/Account conventions, terminal-default colors,
  authorization, compatibility alias and machine evidence. No extra explanatory
  diagnostic footer is part of the illustrated ordinary table.

This supersedes conflicting October 15 default-human presentation details only
as the accepted target. The October 15 installed release remains the current
operational behavior until separately authorized engineering and delivery.
The blank-cell decision is scoped to this ww positions reference; it does not
silently amend the separate ww live Product contract.

## Evidence and implementation boundary

All authoritative purpose, collateral association, quantity allocation and financial
conclusions remain Wheelwright v2 backend responsibilities. Clients render qualified
backend results; matching symbols, strikes and quantities alone do not establish
membership or collateral. A short put's strike obligation or broker margin
requirement is not proof that that much cash is actually pledged. Long Shares does
not, by itself, certify unencumbered or immediately available assets.

Existing retained `/v2/positions` supplies inventory quantities, source identity,
reported economics and inspection-time DTE. The inspected PTS response did not
establish the collateral allocations illustrated below. Do not treat this accepted
visual contract as evidence that the existing API can supply all its semantics.
Unknown allocations require honest detailed qualifications, not client inference.
Partial allocation economics must not duplicate the whole holding's P/L or value;
the backend must supply qualified allocation economics or leave them unavailable.
No particular endpoint, schema, aggregate, implementation or acquisition is selected
or authorized here. Existing raw source confidentiality and Account isolation apply.

## PTS — Full inventory mock

Quantities, open P/L, market value and displayed DTE reproduce the retained October 17
inventory inspected in this conversation. PURPOSE collateral classifications, links
and cash allocations are illustrative, NOT verified Account conclusions. This is a
presentation specimen, not an operational output or actual-Account readiness claim.
DTE values are frozen specimen values, not a continuously current calculation.

```text
$ ww positions --account pts

BROKER    ACCOUNT  POSITION       CONTRACT        QTY  PURPOSE            STATE  COLLATERAL       DTE(today)  OPEN P/L  MKT VALUE
────────  ───────  ─────────────  ───────────  ──────  ─────────────────  ─────  ───────────────  ──────────  ────────  ─────────
Fidelity  pts      USO                            100  Collateral Shares  LONG   261023C153                    1012.00   16176.00
Fidelity  pts      GDXJ                           100  Long Shares        LONG                                -1769.24   10991.00
Fidelity  pts      ETHA                            66  Long Shares        LONG                                 -399.11    3597.66
Fidelity  pts      SPYI                        69.829  Long Shares        LONG                                   -7.34    3725.37
Fidelity  pts      SPYI                            31  Long Shares        LONG                                   -2.48    1653.85
Fidelity  pts      SLV                            100  Collateral Shares  LONG   261023C54.5                   -282.00    5151.00
Fidelity  pts      DRAM                           300  Long Shares        LONG                                -4090.00   13935.00
Fidelity  pts      IBIT                           100  Collateral Shares  LONG   261023C47                      -92.10    4615.00
Fidelity  pts      URA                            200  Collateral Shares  LONG   261023C41                    -1520.91    7086.00
Fidelity  pts      BDRY                           100  Collateral Shares  LONG   261120C15                     -229.00    1255.00
Fidelity  pts      EWY 170 PUT    261023P170       -1  Cash Secured Put   SHORT  $17,000 Cash              6  -1500.66   -1974.00
Fidelity  pts      USO 153 CALL   261023C153       -1  Covered Call       SHORT  100 USO shares            6   -586.66    -982.00
Fidelity  pts      KRE 69.5 PUT   261023P69.5      -1  Cash Secured Put   SHORT  $6,950 Cash               6     25.34     -78.00
Fidelity  pts      IBIT 47 CALL   261023C47        -1  Covered Call       SHORT  100 IBIT shares           6     39.34     -52.00
Fidelity  pts      BDRY 15 CALL   261120C15        -1  Covered Call       SHORT  100 BDRY shares          34     -0.66     -15.00
Fidelity  pts      SLV 54.5 CALL  261023C54.5      -1  Covered Call       SHORT  100 SLV shares            6     98.34     -13.00
Fidelity  pts      URA 41 CALL    261023C41        -2  Covered Call       SHORT  200 URA shares            6     -0.53     -10.00
Fidelity  pts      912797UM7                     1000  Treasury Bill      LONG                                   16.43     998.18
Fidelity  pts      912797UY1                     1000  Treasury Bill      LONG                                   15.67     997.39
Fidelity  pts      912797UZ8                     1000  Treasury Bill      LONG                                   14.90     996.62
Fidelity  pts      912797SU2                     1000  Treasury Bill      LONG                                   14.26     995.71
Fidelity  pts      912797VA2                     1000  Treasury Bill      LONG                                   13.57     995.04
Fidelity  pts      912797VH7                     1000  Treasury Bill      LONG                                    3.49     993.45
Fidelity  pts      912797TC1                     1000  Treasury Bill      LONG                                    2.77     992.62
Fidelity  pts      912797UD7                     1000  Treasury Bill      LONG                                    3.29     982.76
Fidelity  pts      912797WL7                     1000  Treasury Bill      LONG                                    2.92     981.91
Fidelity  pts      912797WM5                     1000  Treasury Bill      LONG                                    2.65     980.99
Fidelity  pts      912797WU7                     1000  Treasury Bill      LONG                                    1.17     980.11
```

## PTS — Proposed --options mock

Same illustrative allocations and evidence limitations as above. All option rows
remain; associated collateral-share rows remain; unrelated inventory is excluded.
Cash backing is displayed on the option row in this specimen.

```text
$ ww positions --account pts --options

BROKER    ACCOUNT  POSITION       CONTRACT        QTY  PURPOSE            STATE  COLLATERAL       DTE(today)  OPEN P/L  MKT VALUE
────────  ───────  ─────────────  ───────────  ──────  ─────────────────  ─────  ───────────────  ──────────  ────────  ─────────
Fidelity  pts      USO                            100  Collateral Shares  LONG   261023C153                    1012.00   16176.00
Fidelity  pts      SLV                            100  Collateral Shares  LONG   261023C54.5                   -282.00    5151.00
Fidelity  pts      IBIT                           100  Collateral Shares  LONG   261023C47                      -92.10    4615.00
Fidelity  pts      URA                            200  Collateral Shares  LONG   261023C41                    -1520.91    7086.00
Fidelity  pts      BDRY                           100  Collateral Shares  LONG   261120C15                     -229.00    1255.00
Fidelity  pts      EWY 170 PUT    261023P170       -1  Cash Secured Put   SHORT  $17,000 Cash              6  -1500.66   -1974.00
Fidelity  pts      USO 153 CALL   261023C153       -1  Covered Call       SHORT  100 USO shares            6   -586.66    -982.00
Fidelity  pts      KRE 69.5 PUT   261023P69.5      -1  Cash Secured Put   SHORT  $6,950 Cash               6     25.34     -78.00
Fidelity  pts      IBIT 47 CALL   261023C47        -1  Covered Call       SHORT  100 IBIT shares           6     39.34     -52.00
Fidelity  pts      BDRY 15 CALL   261120C15        -1  Covered Call       SHORT  100 BDRY shares          34     -0.66     -15.00
Fidelity  pts      SLV 54.5 CALL  261023C54.5      -1  Covered Call       SHORT  100 SLV shares            6     98.34     -13.00
Fidelity  pts      URA 41 CALL    261023C41        -2  Covered Call       SHORT  200 URA shares            6     -0.53     -10.00
```

## Sawdust — Partial allocation mock

Hypothetical 200 URA shares: 100 unallocated and 100 collateral for the call.
The additional 100-share row and its duplicated numeric economics were expressly
requested as mock data; they are NOT an actual extra holding or an allocation
accounting method. BN/URA encumbrance descriptions and USO/TSLL cash amounts were
supplied by the Principal during the mock review, not reconciled by the API.
PURPOSE uses the subsequent accepted `Collateral Shares` wording throughout.

```text
BROKER    ACCOUNT  POSITION      CONTRACT    QTY  PURPOSE            STATE  COLLATERAL      DTE(today)  OPEN P/L  MKT VALUE
────────  ───────  ────────────  ──────────  ───  ─────────────────  ─────  ──────────────  ──────────  ────────  ─────────
Fidelity  sawdust  BN                        100  Long Shares        LONG                                -810.76    3662.00
Fidelity  sawdust  URA                       100  Long Shares        LONG                                -732.00    3543.00
Fidelity  sawdust  URA                       100  Collateral Shares  LONG   261106C43                    -732.00    3543.00
Fidelity  sawdust  USO 143 PUT   261113P143   -1  Cash Secured Put   SHORT  $14,300 Cash            27    592.32    -185.00
Fidelity  sawdust  TSLL 9.5 PUT  261023P9.5   -1  Cash Secured Put   SHORT  $950 Cash                6    -47.66     -97.00
Fidelity  sawdust  URA 43 CALL   261106C43    -1  Covered Call       SHORT  100 URA shares          20     80.34     -20.00
```

## Why this changed

The margin-debt inquiry exposed the mismatch between operator questions and the
available tools: `ww show account pts` was interpreted as quote subjects, not
Account inspection; Portfolio Capital observation output exposed pairing diagnostics
rather than a usable Account answer. CUSTODY similarly placed carrying metadata
where operators needed asset purpose and collateral links. These observations
motivate the accepted presentation; they do not authorize a new Account summary
command or broaden this record into margin accounting.

The single-column list-of-links and compact allocation-reference alternatives were
rejected. The Principal chose separate rows for share allocations, separate POSITION
and CONTRACT, separate PURPOSE and COLLATERAL, STATE between them, blanks for no
data, and no arrows. The final PTS full/options mocks above preserve that result.

## Human and agentic interfaces — Principal clarification (October 19, 2026)

**Human and agentic interfaces do not have to look the same.** The accepted `ww positions`
human table deliberately omits opaque canonical resource identifiers because they do
not help ordinary operator comprehension. This does **not** make independently
addressable API instance resources such as candidate `GET /v2/positions/{positionId}`
useless. Structured and agentic clients may need stable machine-readable identity,
explicit relationships, provenance, temporal qualification, and navigation to inspect
or revisit a Position without reconstructing its identity from display cells.

Client presentation choices neither define nor negate canonical domain resource
identity. The backend owns authoritative domain semantics; clients may project them
differently for humans and agents. This clarification supports investigating an
independently addressable Position resource; it **does not** ratify Position identity,
its lifecycle, the example URI, a new schema, or implementation. The existing
`ASSIM-0002` Position/governed-scope identity question remains open.

## Current state and recovery

- Presentation accepted; implementation, installation and semantic readiness NOT claimed.
- [October 15 installed behavior](ww-positions-command-2026-10-15.md) remains operational.
- [ww live stopping point](../design/ww-live-session-2026-10-16/README.md) remains STOPPED;
  its pending Principal visual acceptance and both deferred P2 findings are unchanged.
- No runtime/OAS, operational data, grants, credentials or brokerage integration changes.
- Next action after this documentation persistence: NONE until further Principal direction.
