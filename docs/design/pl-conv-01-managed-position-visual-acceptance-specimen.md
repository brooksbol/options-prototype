# PL-CONV-01 — Principal-confirmed managed Position terminal visual specimen

**Status:** Principal-confirmed **visual acceptance target**, October 13, 2026. Product presentation authority; **not** evidence that v2 can yet derive the displayed facts, nor implementation, deployment, Step 6 or release authorization.

## Original visual reference

Principal-supplied screenshot of the **existing `tt live` terminal**, October 13, 2026, 08:37 local screenshot filename: `Screenshot 2026-10-13 at 8.37.01 AM(1).png` (original supplied in ChatGPT conversation; **image binary not yet stored in this repository**).

Original screenshot SHA-256: `4872a29e543b1166ea3de0017be1ce15ff70a202e1e0c3f29ec4d9f51a615de0`.

**Principal's exact instruction:** “I want ww positions to look like this.” Followed by: “Make this screenshot the Principal-confirmed visual acceptance specimen for the eventual managed-Position presentation.”

The screenshot shows a black Apple Terminal background, monospaced aligned columns, sparse semantic color, a one-line Account heading, and three dense one-row managed iron-condor presentations (UNG, EWZ, XLE). Columns are `SYMBOL | PAYOFF | RANGE | SPOT | SPAN | EXIT PROFIT | P/L | QUOTE`. PAYOFF uses Unicode plateau/slopes and cyan spot marker; SPAN uses a compact lifecycle ruler; EXIT PROFIT uses a compact target/progress ruler; P/L and spot are selectively colored; QUOTE shows evidence age. There is **no explanatory footer**. The shell prompt returns immediately after the table.

## Acceptance direction

- The eventual human-facing **managed Position** presentation in `ww` must visually match this established `tt live` grammar: one row per **established managed Position**, compact alignment, semantically restrained color, readable Unicode instruments, minimal header and **no default disclaimer paragraphs**.
- Preserve accepted `tt live` UX as a Product asset. Do not reinvent it simply to standardize a new interface. Validate in a real terminal, not solely plain-text captures; verify ANSI/no-color separately.
- **Critical boundary:** today's `ww show positions` can show observed contract/custody inventory without establishing managed Position grouping. Four XLE legs may be a condor in `tt live`, but v2 must not group by symbol or fabricate economics, lifecycle, objective, payoff or quote freshness. Backend authority must establish every presented fact. When evidence is absent, omit an instrument or show an explicit unknown without pretending the specimen is already achievable.
- Keep constituent-level holdings inspection available. Human projection may be compact, but `--verbose` and machine-readable outputs preserve evidence/provenance/qualifications. Do not conflate accepted *visual design* with ratified *financial semantics* or a command-name decision.
- Before implementing, show the Principal a real or faithfully sourced terminal specimen of the proposed `ww` presentation, identifying any omitted/unavailable columns, and obtain confirmation of the operator-visible result. Independent reviewers must challenge usability even if contract tests pass.

## Product acceptance criterion

A candidate is **not** visually accepted merely because it prints the same column names, colors, or synthetic silhouettes. The Principal must inspect an actual terminal capture showing truthful, authoritative managed Position rows with density, alignment and visual hierarchy comparable to the reference. Report missing domain/evidence prerequisites separately from presentation defects.

**Current state:** Visual acceptance specimen confirmed; managed Position convergence and the necessary v2 semantics remain subject to existing PL-CONV-01 governance. No implementation authorized by this record.
