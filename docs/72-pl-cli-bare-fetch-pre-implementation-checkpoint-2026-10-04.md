# PL-CLI-01 — Bare `ww fetch` Pre-Implementation Checkpoint

**Date:** October 4, 2026
**Status:** Reconciliation / checkpoint artifact (Category D) supporting `PL-CLI-01`; establishes the authority boundary immediately before the bounded bare-fetch experiment. Not ratified architecture, final Product contract, command grammar, API contract, or authorization beyond the already-authorized bounded experiment.
**Canonical intake identity:** `PL-CLI-01` in the complete `docs/parking-lot*.md` sequence.
**Authority baseline before this experiment:** `d7e588d4c29aaf017a19ff03e9cf66a0e32824c1` — *Record CLI composition friction guideline*.

---

## Purpose

This checkpoint recreates a lost pre-implementation snapshot. A prior Codex session reported writing a four-file pre-implementation checkpoint (checkpoint, PL-CLI-01 pointer, documentation index, generated roadmap projection) and validating its roadmap projection, then exhausted its usage limit before committing or pushing. Independent inspection established that the attempted snapshot never reached the remote, is not in the working tree, and is not in any stash, reflog, or branch. It is treated as lost and recreated here concisely from verified Product authority rather than reconstructed from the lost prose.

The checkpoint fixes the authority boundary so that evidence produced by the bare-fetch experiment can be read against a known, durable "before" state.

---

## 1. Accepted authority at this boundary

The following are the accepted, current facts before the experiment:

- **Authority baseline.** Remote and local `main` resolve to `d7e588d4c29aaf017a19ff03e9cf66a0e32824c1`.
- **Explicit-symbol fetch is accepted.** `ww fetch SYMBOL...` is the promoted, accepted targeted-acquisition primitive. The `ww refresh` CLI spelling was retired with no alias; the backend endpoint retains its own `/api/evidence/refresh` path (a CLI vocabulary change, not a backend redesign).
- **Bounded fetch acceptance evidence.** The bounded `ww fetch` acceptance pass reported **26 passed / 0 failed / 0 not executable** (`docs/cli/ww-fetch-acceptance-2026-10-04.md`).
- **Accepted fetch semantics remain unchanged.** Acquisition and observation are separate; reading does not make evidence fresh; fetch does not assert freshness, newly acquired values, or trade suitability; a failed acquisition may retain an existing stored price; acquisition outcome and stored-price state are orthogonal; exit 0 requires completed work and a held price for every distinct requested symbol; exit 1 is failure/noncompletion or an absent requested price; exit 2 is invalid usage; `-q`/`-v` are mutually exclusive; noncompletion fabricates no per-symbol certification.
- **Bare `ww fetch` is not yet implemented.** At this baseline, bare `ww fetch` has no default context; invoking `ww fetch` with no operands is a usage error.
- **The Composition Friction Guideline is accepted authority** (`PL-CLI-01`, October 4): machine-readable output is necessary but not sufficient for Unix composability; favor a direct `ww | Unix` path where facts can be represented honestly; repeated `ww | jq | Unix` is a design-review diagnostic, not a prohibition.
- **`ww ls` is not implemented.** The inspection direction remains separate, unauthorized Product work.
- **`ww sort` remains.** Its possible retirement is separate Product work and is not decided here.
- **No six-source selector is ratified.** The investigated future reasons (current exposure; recent trades; all historical trades; high market activity; high Exit Reliability; high IV/premium interest) remain hypotheses.
- **No watchlist is required or authorized.**
- **Authority/API gaps are exposed but not yet surveyed.** The CLI investigation has exposed browser-as-system-of-record concerns and other authority/API gaps. They are not yet fully surveyed; the categorized survey is a deliverable of the experiment, not of this checkpoint.

---

## 2. Authorized bare-fetch experiment

The Principal authorizes a deliberately **provisional** bare-fetch experiment and, separately, requires a categorized survey of architecture/authority gaps, API/capability gaps, and actual bugs/contract defects exposed while implementing it. These are parallel deliverables.

### 2.1 Experimental selector

Bare `ww fetch` resolves exactly:

> **last declared monitored symbols**
> **UNION**
> **fixed ten-symbol experimental seed**

The fixed seed is exactly:

```
SPY QQQ IWM SLV GLD TQQQ USO SMH SOXL GDX
```

All ten are used; the seed is not sanitized or shrunk.

The seed:

- derives from dated **September 23** options-volume research;
- is **experimental**;
- is **not** a live ranking;
- is **not** authoritative market-representation policy;
- is **not** a final default universe;
- intentionally retains potentially awkward entries such as **TQQQ** and **SOXL** so the experiment can falsify the selection.

Explicit operands **replace** this default: `ww fetch QQQ SPY` fetches the explicit normalized/deduplicated operands only, never augmented with monitored or seed symbols.

### 2.2 Known backend boundary

> Monitored membership exists internally (via `SqliteEvidenceStore.getMonitoredSymbols()` or its current equivalent) but is **not truthfully exposed** through the current public API. `/api/status` exposes monitored-position **counts**, not membership; the evidence snapshot represents a wider universe.

The CLI must not infer monitored membership from counts, snapshots, browser state, frontend state, or incidental evidence. The experiment implements the smallest truthful backend read capability exposing exactly the last declared monitored symbols. These are not described as current exposure, holdings, portfolio symbols, currently traded symbols, or brokerage positions.

### 2.3 Acquisition-pressure hypothesis

> A symbol being worth observing does not necessarily imply that full option-chain evidence should be acquired for it.

The experiment runs the ten-symbol seed plus monitored symbols honestly against the real targeted-acquisition path (relatively expensive per symbol, with an approximately 20-second wait). Timeout, throughput, provider, acquisition-cost, granularity, or completion-semantics problems are to be measured and recorded, not hidden with CLI compensation, and not used to justify a wholesale acquisition redesign unless a correctness defect makes the bounded experiment impossible.

### 2.4 Preserved invariant — resolved empty ≠ unresolved

An explicitly resolved empty target set acquires nothing and must never fall through to the backend's no-symbol whole-cycle acquisition behavior. Failure to resolve a required source is not the same as resolving that source empty.

---

## 3. Deliberately not expanded here

This checkpoint deliberately does **not** contain the architecture/API/bug survey (that is an implementation deliverable), does not settle the final default selector, does not implement or ratify the six-source model, and does not authorize `ww ls`, a watchlist, weighted relevance scoring, a generalized market taxonomy, an acquisition redesign, API v2, or portfolio-state migration.

---

## 4. Reconciliation posture

`PL-CLI-01` remains **INTAKE** for its broader catalog. The bounded bare-fetch experiment has separate authorization recorded in the canonical `PL-CLI-01` sequence. This checkpoint is provenance (Category D) and does not itself ratify any consequence; any ratified consequence belongs in Category A/B/C after the experiment produces evidence.

The Principal's Product acceptance question for the experiment remains:

> Does an experienced operator look at this result and think, "Of course these are the symbols you'd fetch by default"?
