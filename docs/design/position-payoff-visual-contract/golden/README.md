# Covered call and cash-secured put — fixed proposed terminal golden specimens

**Status: proposed Product golden candidates, not Principal-accepted.** These are literal terminal-output fixtures, not a claim that current `ww` renders them. Principal review of actual output is still required before declaring acceptance. The original tastytrade screenshot is a *schematic* visual source, not a scaled geometry definition.

The four files in this directory are **exact UTF-8, no ANSI, 31-cell PAYOFF** fixtures with the specified ACCOUNT and SYMBOL context. Their scope is the ACCOUNT/SYMBOL/PAYOFF/RANGE/SPOT subset; SPAN, EXIT PROFIT, P/L and QUOTE require independent backend evidence and are not invented by these fixtures. The five-column subset must not be substituted for the accepted nine-column final layout.

The line is the **expiration payoff shape**, not historical stock price or profit probability. Both structures have the same positive-slope-to-flat geometry at expiration but different inventory and contractual obligations. The flat rail starts after the single rising transition glyph. `▼` indicates spot on the same declared horizontal axis; it does not replace or change the underlying payoff function. These four fixtures deliberately test below/above strike marker placement; the exact relative glyph placement is a proposed UX choice, not a mathematically calibrated strike-to-cell mapping.

Backend contract prerequisites: verified Account-bound membership, share/option quantity and deliverable coverage, strike, right, expiration, and structure recognition. Covered call: +100 shares and -1 standard call at 43; CSP: -1 standard put at 90 with collateral verified independently. If terms, coverage, or payoff basis are missing, the client must not manufacture a confirmed silhouette.

Golden files are literal output specimens for human review. Do not modify them to make a failing implementation pass without an explicit Product-design decision. An eventual renderer should be tested with actual backend semantic fixtures and independently reviewed against these strings, including width, Unicode display cells, ANSI/no-color and spot clipping. These specimens are not a substitute for that test.

Original reference screenshot: `tastytrade-strategy-reference.png` (binary not yet present); source SHA-256 `6f55f3f61e5c9b1dfadfc906857eab8369e4c488e5f0d8be7c9038e4d2778f90`. Preserve original bytes, not a recreated illustration.
