# PL-CLI-01 — Bare `ww fetch` Experimental Acceptance Snapshot

**Date:** October 4, 2026
**Status:** Reconciliation / checkpoint artifact (Category D) for `PL-CLI-01`. Records the Principal's **experimental acceptance** of the preliminary bare `ww fetch` slice. Not a ratification of a final default universe, selector authority, or acquisition redesign.
**Pre-implementation checkpoint:** `docs/72-pl-cli-bare-fetch-pre-implementation-checkpoint-2026-10-04.md`
**Implementation:** commit `b251738` (bare fetch) + `f030bd2` (interpretation corrections), on `origin/main`.
**Companion evidence:** `docs/cli/ww-bare-fetch-experiment-2026-10-04.md` (real run), `docs/73-bare-fetch-architecture-api-bug-survey-2026-10-04.md` (survey), `docs/cli/ww-composition-friction-acceptance.md` (CF01–CF12).

---

## 1. What was accepted

The Principal ran a substantial off-hours (Sunday) shell gauntlet against the **live** backend, in addition to the deterministic suite, and experimentally accepted the preliminary bare-`ww fetch` slice. The next interesting work is a separate Product decision, not another fetch correction.

> **Disposition: experimentally accepted. Stop touching this slice. No further fetch correction is authorized.**

## 2. Selector behavior confirmed (live)

- Bare `ww fetch` resolved the five last-declared monitored symbols (`BN, ETHA, URA, USO, XHB`) UNION the fixed ten-symbol seed (`SPY QQQ IWM SLV GLD TQQQ USO SMH SOXL GDX`).
- `USO` recognized as the single overlap → **14 distinct** symbols, acquired once each.
- Per-symbol provenance (monitored / experimental-seed / both) rendered on **stderr only**; machine **stdout** uncontaminated by selection prose.
- Explicit operands (`ww fetch QQQ SPY`) bypassed default resolution entirely (no monitored read, no seed added).

## 3. Explicit-fetch path confirmed healthy (live, not just fixtures)

Demonstrated directly in the live CLI: normalization/deduplication (`qqq QQQ SPY` → 2/2), the 0/1/2 exit contract, quiet success silence, verbose diagnostics with the `From <endpoint>` line, stdout/stderr separation, `&&` sequencing, redirection, and the accepted `fetch && prices | sort` composition.

- CLI unit tests: **15/15**.
- Deterministic acceptance (`ww-fetch.acceptance.mjs`): **30 passed / 0 failed / 0 not executable**.
- Roadmap projection: **in sync**.

Particularly strong confirmation: `ww fetch QQQ SPY XLE | head -1` completed cleanly — human completion status to stderr, exactly one JSONL record through the pipe, and **no EPIPE/broken-pipe stack trace** when `head` closed. This is stronger evidence than the earlier fixture-based broken-pipe test.

## 4. Off-hours (Sunday) acquisition behavior — empirical, bounded

- A bare 14-symbol fetch hit `NOT_COMPLETED` under the current **20-second synchronous forced-acquisition bound**, while smaller explicit requests completed normally.
- This is useful empirical evidence for the **timeout/configuration question** only. It does **not** imply or justify asynchronous CLI design, background jobs, polling, handles, or an acquisition-architecture redesign. All 14 prices being held on a subsequent read shows the request was viable and progressing; the single synchronous bound was simply shorter than the work took.
- `PROVIDER_UNAVAILABLE` immediately after a backend restart is **normal startup state** (provider authority takes a couple of minutes to establish), not a defect.

## 5. Composition-friction pressure independently reproduced

The Principal's live run reproduced the CF01-style adapter friction on its own:

```
ww prices QQQ SPY XLE | jq -r '[.symbol,.price] | @tsv' | sort ...
```

Here `jq` does nothing domain-specific — it merely unpacks Wheelwright's default JSONL so ordinary `sort` can reach two fields. This is exactly the friction deliberately recorded in `docs/cli/ww-composition-friction-acceptance.md` (CF01). Nothing changes now; the manual run independently confirmed the design pressure.

Relatedly, the human `ww prices` TTY display is already a clean, aligned projection (`SPY 769.64 …`, `QQQ 749.58 …`, `XLE 62.82 …`). So when a future `ww ls` is taken up, the evidence that a simpler default projection is useful already exists; it does not need to be rediscovered.

## 6. One observed oddity (explained, not a defect)

In an early unlabeled paste, a redirected bare fetch appeared to emit a `BN` record even though a preceding bare verbose fetch had reported `NOT_COMPLETED`. This is attributable to sequential commands running against a **live backend whose state was changing** between invocations (acquisition continued on the backend thread; a later invocation observed completed work). The labeled rerun showed the expected behavior cleanly: a `NOT_COMPLETED` fetch emits no first stdout record. Not a contract violation.

## 7. Explicit non-ratifications

This snapshot does **not** ratify a final default universe, a backend-owned default selector, the six-source model, a watchlist, `ww ls`, a change to the 20s forced-acquisition bound, CLI asynchrony, or any acquisition redesign. The provisional default remains experimental; `PL-CLI-01`'s broader catalog remains **INTAKE**. The open timeout/configuration question and the `ww ls` projection question are separate Product decisions.
