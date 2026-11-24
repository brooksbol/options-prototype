# Aristocrats 0DTE acquisition-put calendar checkpoint

Portfolio completed the calendar on November 8, 2026 (Mountain time). Portfolio owns the research artifacts and calendar. This checkpoint links the evidence from Wheelwright.

- [Readable calendar](https://github.com/brooksbol/portfolio/blob/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742/research/2026-11-08-aristocrats-acquisition-put-calendar.md) and [machine-readable calendar](https://github.com/brooksbol/portfolio/blob/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742/research/2026-11-08-aristocrats-acquisition-put-calendar.json) at Portfolio commit [c8fd0eb](https://github.com/brooksbol/portfolio/commit/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742).
- [Separate 40–50 DTE chain snapshot](https://github.com/brooksbol/portfolio/blob/3bb9efb8b6b032b5205f3e67eba4e778ef9caec9/research/2026-11-08-aristocrats-option-chains-40-50-dte.json.gz) at Portfolio commit [3bb9efb8](https://github.com/brooksbol/portfolio/commit/3bb9efb8b6b032b5205f3e67eba4e778ef9caec9). Only the frozen 70-symbol universe was reused for the calendar.

The Tradier production snapshot checked 70 symbols and confirmed 724 symbol/date pairs across 25 dates. KVUE returned expiration listings with no confirmed put identities and is excluded from the experiment.

## Principal direction for PR #47

The calendar is the completed first deliverable. The experiment seeks confirmed assignment and delivery of 100 shares per symbol across 69 Aristocrats. Schedule the initial attempt at each symbol's earliest confirmed expiration: 28 on November 13 and 41 on November 20, 2026. November 20 ends initial attempts. Completion requires confirmed delivery of all 6,900 shares.

- At noon Eastern on each scheduled expiration day, use qualified real-time underlying and chain data from Tastytrade or Tradier, subject to permitted use with Webull paper execution. Select the lowest listed same-day put strike strictly above the live underlying mark. Submit one sell-to-open contract at its live bid in the separate Webull paper account the Principal plans to fund with $2 million in simulated cash.
- If the live bid changes while the order is working, alert the Principal and leave the original limit working for their decision.
- After a filled put is confirmed expired unassigned, book the premium and retry at the next confirmed expiration. A terminal unfilled order books zero premium and retries on the same schedule. Reconcile uncertain submission or assignment outcomes before retrying. Mark a symbol acquired only after Webull confirms assignment and delivery.

## Engineering posture and authorization

Apply the [Principal's shared PR #46 and PR #47 engineering posture](https://github.com/brooksbol/portfolio/commit/a58ba9d17f8b745bfe6fc5e7564f01b425aa1806). Move promptly toward actual paper evidence and prioritize the checks needed for trustworthy execution. Missed fills and unassigned expirations are experimental results when the method and evidence are sound. Wrong contracts, duplicate orders, and untraceable outcomes are execution defects.

Use the Monday, November 9 open session to exercise the workflow with a separately tracked batch of later-expiring paper puts once authorized. Use the week to address what that run exposes. Target the full 28-symbol 0DTE batch Friday at noon Eastern. A smaller check is useful when it resolves a specific blocker. Keep PR #46's multi-DTE treatments and results separate while reusing applicable account, order and reconciliation capabilities.

This checkpoint records design direction. Programmatic paper orders require separate Principal authorization. Exact paper-account identity, qualified and permitted market data, contract identity, and order reconciliation are execution prerequisites. Stock-purchase and covered-call automation are outside this slice.

The [October `/v2/chains` checkpoint](wwt-chains-minimal-http-real-data-experiment-checkpoint-2026-10-24.md) is prior design context. Any v2 API or contract change requires separate Principal review before edits begin.
