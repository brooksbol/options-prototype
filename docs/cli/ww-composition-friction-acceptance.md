# Wheelwright CLI composition-friction acceptance specimens

**Status:** Product acceptance specimens / diagnostic tests. These complement correctness and contract acceptance; they do not replace it.

**Authority:** The Composition Friction Guideline in `PL-CLI-01` (`docs/parking-lot-10.md`).

## Why these tests exist

A command can be machine-readable and compositionally correct while still imposing unnecessary friction on ordinary Unix use.

These cases deliberately test a different question from the deterministic `ww fetch` contract suite:

> How many Wheelwright-specific or serialization-specific adaptation steps stand between a promised domain fact and an ordinary Unix operation?

The diagnostic smell is:

    ww | jq | Unix

when the `jq` step exists only to unpack Wheelwright's default representation before an ordinary tool such as `sort`, `awk`, `cut`, `rg`, `uniq`, or `head` can perform the actual operator task.

This is **not** a rule that JSON/JSONL is bad. Rich structured serialization is valuable and should remain intentionally available when the complete evidence record is the desired result, for example:

    ww --jsonl | jq ...

The Product guideline is:

> Choose a default projection that preserves its promised domain facts while minimizing friction for common Unix composition.

Do not infer a new output format from these specimens. Row semantics and absence semantics must be decided before representation/delimiter.

## How to record a friction result

For every CF case, record:

- exact command;
- exit status;
- stdout;
- stderr;
- whether the requested ordinary Unix operation was accomplished;
- **adapter required: YES/NO**;
- adapter(s), if any;
- domain fact lost or distorted, if any.

An **adapter** is a command whose only purpose in the pipeline is to translate/unpack Wheelwright's default output so a standard Unix utility can perform the operator's actual task.

Examples:

- `jq -r '[.symbol,.price] | @tsv'` before `sort` is an adapter.
- `sort` used to sort is not an adapter.
- `awk` used to calculate/filter is not an adapter.
- `jq` used because the operator genuinely wants JSON structure/query semantics is not friction by itself.

These are diagnostic acceptance specimens. A case may be **correct but friction-bearing**. Do not turn today's accepted JSONL behavior into a fake regression failure merely because it requires an adapter. When a new default projection is proposed, rerun these cases and compare adapter requirements explicitly.

## Fixture / symbols

Use a small explicit set with distinct numeric prices and at least one known evidence-state variation when practical:

    QQQ SPY XLE

When testing absence semantics, include a symbol whose price is explicitly absent in the deterministic fixture. Do not substitute zero for absence.

Fetch may be performed first when the case needs held observations:

    ww fetch -q QQQ SPY XLE >/dev/null

The fetch result stream is intentionally discarded here when the task under test concerns price inspection.

---

## CF01 — Sort a promised numeric fact with ordinary `sort`

**Operator job:** list symbol and price ordered numerically by price.

Run the most direct form the current CLI makes possible. Record whether an adapter is required before ordinary `sort`.

Current baseline shape:

    ww prices QQQ SPY XLE | jq -r '[.symbol,.price] | @tsv' | sort -t $'\t' -k2,2n

Desired diagnostic question:

> Can ordinary numeric `sort` operate directly on the default projection without a serialization-unpacking step?

Do not accept lexical numeric ordering as equivalent to numeric ordering.

---

## CF02 — Select the symbol field with ordinary `cut`

**Operator job:** print only symbols.

Current baseline shape:

    ww prices QQQ SPY XLE | jq -r '[.symbol,.price] | @tsv' | cut -f1

Diagnostic question:

> Can `cut` select a stable promised field directly from the default projection?

Record adapter requirement separately from correctness.

---

## CF03 — Calculate from price with ordinary `awk`

**Operator job:** use price as a number in a simple calculation/filter.

Example task:

    ww prices QQQ SPY XLE | jq -r '[.symbol,.price] | @tsv' | awk -F '\t' '$2 > 100 {print $1, $2}'

Diagnostic question:

> Can `awk` consume the promised numeric fact directly, or must JSON first be unpacked?

The threshold is merely a specimen. The acceptance concern is field usability, not the particular trading meaning of 100.

---

## CF04 — Count evidence/acquisition states with `sort | uniq -c`

**Operator job:** count records by a categorical state.

Current baseline shape:

    ww prices QQQ SPY XLE | jq -r '.acquisitionStatus' | sort | uniq -c

Diagnostic question:

> Can a promised categorical fact reach ordinary counting tools without a serialization adapter?

Do not add a Wheelwright-specific `count` command to make this case pass.

---

## CF05 — Select records with `rg` / `grep`

**Operator job:** select the line for a symbol using an ordinary line-oriented search tool.

Example:

    ww prices QQQ SPY XLE | rg '^QQQ'

If the current default representation prevents a safe direct match and requires an adapter, record that explicitly.

Diagnostic question:

> Is one default result represented as one useful ordinary line with stable enough field boundaries for line selection?

A substring match buried inside JSON punctuation is not automatically evidence of a good default projection; record whether the operation is robust enough for ordinary use.

---

## CF06 — Preserve a stream with `tee` and continue composition

**Operator job:** save the result stream while continuing to another ordinary operation.

Baseline specimen:

    ww prices QQQ SPY XLE | tee /tmp/ww-prices.out | jq -r '.symbol'

Record whether `tee` itself works normally and whether the downstream operator task still requires an adapter.

Diagnostic question:

> Does Wheelwright behave as an ordinary stream producer, and is the saved default representation itself useful without mandatory decoding?

---

## CF07 — Early termination with `head`

**Operator job:** take the first result and stop.

Run against a sufficiently large deterministic stream to make early closure meaningful:

    ww ... | head -1

Record:
- clean exit behavior;
- no stack trace;
- no decorative stderr caused by the pipe closing;
- adapter requirement.

This complements the existing broken-pipe correctness acceptance. Here the additional question is whether `head` can operate on one-result-per-line default output directly.

---

## CF08 — Command substitution

**Operator job:** capture a small Wheelwright result using normal shell command substitution.

Example target shape:

    symbol=$(ww ...)

or, for a multi-field row:

    row=$(ww ...)

Record whether the default projection can be captured without ANSI, headings, diagnostics, or a serialization adapter when the requested command contract promises a terse projection.

Do not treat rich evidence JSONL as defective merely because it is rich; this case becomes binding only for a command/default projection that promises terse ordinary composition.

---

## CF09 — Ordinary redirection

**Operator job:** redirect results to a file and use the file with standard text tools.

Example:

    ww prices QQQ SPY XLE > /tmp/ww-prices.out
    sort /tmp/ww-prices.out

Record:
- stdout contains only results;
- stderr contains only diagnostics/status;
- no ANSI/decorative terminal bytes in redirected output;
- adapter requirement for the actual text operation.

---

## CF10 — Absence must remain absence

**Operator job:** compose a row whose numeric fact is absent.

This case MUST be run with a deterministic absent-price specimen.

Record:
- how absence is represented;
- whether the row remains visible;
- whether ordinary numeric sort/filter silently interprets absence as zero;
- whether missing values can be distinguished from a genuine numeric zero;
- adapter requirement.

A representation that reduces friction by turning absence into `0` FAILS the domain-semantics requirement even if the shell command becomes simpler.

Order of design authority for future projections:

    row semantics
    -> absence semantics
    -> projection fields
    -> representation/delimiter
    -> shell friction acceptance

---

## CF11 — Explicit rich serialization remains available

When a command gains a low-friction default projection, verify that the complete evidence record remains intentionally available through an explicit structured mode such as `--jsonl` if that is the accepted command design.

Example shape only:

    ww <command> --jsonl ... | jq ...

Diagnostic question:

> Did reducing default composition friction accidentally make complete evidence facts unavailable?

This case prevents "Unix-friendly" from becoming "throw evidence away."

---

## CF12 — No Wheelwright reinvention of generic Unix tools

Review the proposed solution to any failed/friction-bearing case.

FAIL the design review if the response to ordinary text-operation friction is merely to add generic commands such as:

    ww grep
    ww filter
    ww head
    ww cut
    ww count

unless a separate Wheelwright domain capability independently justifies such a command.

The preferred composition remains:

    ww | Unix

not:

    ww | ww-generic-text-tool

---

## Baseline interpretation for the accepted `prices` JSONL projection

At the 2026-10-04 accepted baseline, non-TTY `ww prices` emits rich `observed-price/v1` JSONL records. That representation is machine-readable and preserves evidence facts. It also means several ordinary field-oriented tasks above require `jq` merely to project fields before standard Unix tools can operate conveniently.

That is **accepted baseline behavior and recorded Product evidence**, not a retroactive correctness failure.

The purpose of CF01-CF12 is to ensure future CLI work cannot say "it composes" and stop there. Future acceptance must report both:

1. **composition correctness** — did the pipeline work without violating the command/domain contract?
2. **composition friction** — what adaptation was required before the ordinary Unix operation?

## Relationship to existing acceptance

These specimens complement:

- `scripts/ww-fetch.acceptance.mjs` — deterministic black-box fetch contract;
- `scripts/wheelwright.test.mjs` — CLI regression/composition correctness;
- `docs/cli/ww-fetch-acceptance-2026-10-04.md` — captured acceptance evidence and real terminal walk;
- `PL-CLI-01` Composition Friction Guideline — Product authority.

The existing fetch acceptance report already names a future Unix gauntlet (`cut`, numeric `sort`, `awk`, `rg`, `sed`, command substitution, redirection, `head`, non-TTY ANSI, explicit JSONL, and absence semantics). This document promotes that direction into explicit numbered acceptance specimens so an implementation actor does not have to infer the intended tests.

## Acceptance reporting requirement for future CLI projections

Any future change to the default projection of a composable Wheelwright listing/inspection command MUST include a CF table in its acceptance evidence with at least:

| Case | Operator job | Correct? | Adapter required? | Adapter | Domain loss/distortion? |
|---|---|---:|---:|---|---|
| CF01 | numeric sort | | | | |
| CF02 | field selection | | | | |
| CF03 | awk calculation/filter | | | | |
| CF04 | categorical count | | | | |
| CF05 | line selection | | | | |
| CF06 | tee + continue | | | | |
| CF07 | head / early close | | | | |
| CF08 | command substitution | | | | |
| CF09 | redirection | | | | |
| CF10 | absent numeric fact | | | | |
| CF11 | explicit rich serialization | | | | |
| CF12 | no generic-utility reinvention | | | | |

Do not collapse "Correct?" and "Adapter required?" into one pass/fail column. That distinction is the reason these acceptance specimens exist.
