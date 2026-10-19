# Position payoff visual contract — Product reference and falsification specimens

Status: **Product-design reference and executable specimen proposals**, October 13, 2026. Principal accepted the schematic rising-then-flat shape for covered calls and cash-secured puts, with restrained color differentiation. The accepted iron-condor `tt live` presentation remains the only approved scaled terminal payoff implementation. Other structure shapes are **reference/proposed**, not approved scaled renderings or implemented v2 recognizers.

## Source and meaning

The Principal supplied a tastytrade Strategy dropdown screenshot (October 13, 2026, 09:57 AM), with eleven rows: Option, Covered, Vertical, Calendar, Butterfly, Ratio Spread, Strangle, Straddle, Iron Condor, Jade Lizard, Stock. Its **left-edge icons** are the source for the *schematic* vocabulary. The chosen Short/Long, Call/Put, Normal selectors in that screenshot are example settings, **not universal definitions** of the families. The screenshot is not financial authority, evidence of broker holdings, or an acceptance of scaled Wheelwright silhouettes.

Reference transcription and variants: `structures.json`. Accepted scaled reference: `docs/cli/tt-live-panel.md`, `scripts/tastytrade-payoff-render.mjs`, and `scripts/tastytrade-payoff-render.test.mjs`. This contract intentionally does not replace those.

## Rendering invariant

A payoff plot is a function of **underlying price on the horizontal axis** and **position payoff / P&L on the vertical axis** at a **declared evaluation horizon**. Horizontal rails mean constant payoff; rising/falling strokes mean increasing/decreasing payoff as underlying price rises. Strike kinks and breakpoints come from backend-verified terms, not a client guess. Spot is a separate indicator on the same x scale. Exact geometry is not inferred from a tiny dropdown icon.

Backend owns recognized construction, Account-bound constituent membership, actual deliverables/multipliers, strike geometry, expiration payoff or qualified horizon-specific value, and all authoritative financial numbers. `ww show positions` only consumes v2 API claims and renders. No direct broker calls, CLI-side recognition or financial computation. Never draw a verified payoff where relevant terms or a common valuation horizon are unavailable. Unknowns remain visible and constituents inspectable.

### Distinct cases

- **Covered call** (long shares + short call): expiration payoff rises below the call strike and flattens above; the stock/call quantities and deliverables must establish coverage. The screenshot's generic `Covered` with `Short Put` selected is **not** proof of covered-call geometry.
- **Cash-secured put** (short put plus collateral): expiration payoff rises below the put strike and flattens above. Collateral changes financing/capacity, not the option payoff line. A put holding alone does not establish the cash-secured designation.
- **Long stock**: upward straight-line payoff; short stock is downward. Basis is needed for absolute P/L but not directional shape.
- **Calendar/diagonal**: different expirations mean no single exact expiration-payoff polyline without a declared horizon and a valuation assumption for the unexpired leg. Do not render a falsely precise expiration silhouette.
- **Ratios and uncovered structures**: reflect unbounded tails when applicable; never cap them for visual symmetry.
- **Iron condor**: reuse the accepted four-strike renderer only after backend terms and membership are established. Preserve compressed/unknown fallback and actual strike proportionality.

## Principal Product decision — October 13, 2026

The Principal approved the **rising-then-flat expiration-payoff silhouette** for both covered calls and cash-secured puts, and requested judicious color to distinguish them. This accepts the *shape*, not an exact ANSI palette, precise strike-to-cell placement, or a full nine-column terminal specimen. Use a restrained, accessible, structure-specific accent or label; never rely on color alone to distinguish the two. Preserve semantic colors for positive/negative economics, spot, and unavailable evidence, and preserve meaningful monochrome/ASCII behavior. Exact color mappings and scaled spot/strike placement remain proposed pending a working terminal specimen. No color is allowed to imply a difference in payoff economics that is not present.

## Fixtures and proof status

`structures.json` records the eleven dropdown families plus separate explicit covered-call/CSP specimens. Each records its authority level and shape constraints. `golden/reference-icons.txt` preserves a **human-readable schematic transcription**. `golden/covered-call-*.txt` and `golden/cash-secured-put-*.txt` are exact, 31-cell **proposed** Unicode terminal-output fixtures with spot markers; see `golden/README.md` for their deliberately bounded column scope. They are not yet Principal-accepted Product goldens. `tests/visual-contract.test.mjs` runs deterministic assertions on fixture completeness, epistemic status, and geometric invariants. This is a checked-in executable **reference contract**, not yet a v2 renderer integration or enforced architectural boundary.

Before promoting a structure's scaled terminal golden to Product acceptance, obtain a Principal-reviewed actual-terminal specimen for the specified variant, with strike/spot scale, color/ASCII/no-color/width behavior, and a backend-owned semantic fixture. No actor may silently mark a proposal as accepted. A fixture passing its own tests does not prove correctness of the implemented renderer.

**Screenshot custody:** the source screenshot was attached to the October 13 conversation, and the GitHub text-only submission records its eleven visible labels and settings. The original binary is now committed as `tastytrade-strategy-reference.png` (commit `9654c6d`, October 13, 2026); its bytes hash to the previously recorded SHA-256 `6f55f3f61e5c9b1dfadfc906857eab8369e4c488e5f0d8be7c9038e4d2778f90`. Do not replace it with a recreated image. *(Before that commit, this paragraph recorded the binary as not yet stored in GitHub.)*
