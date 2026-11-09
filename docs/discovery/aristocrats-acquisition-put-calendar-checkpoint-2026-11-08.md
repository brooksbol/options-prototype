# Aristocrats 0DTE acquisition-put calendar checkpoint

Portfolio completed the calendar on November 8, 2026 (Mountain time). Portfolio owns the research artifacts and calendar. This checkpoint links the evidence from Wheelwright.

- [Readable calendar](https://github.com/brooksbol/portfolio/blob/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742/research/2026-11-08-aristocrats-acquisition-put-calendar.md) and [machine-readable calendar](https://github.com/brooksbol/portfolio/blob/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742/research/2026-11-08-aristocrats-acquisition-put-calendar.json) at Portfolio commit [c8fd0eb](https://github.com/brooksbol/portfolio/commit/c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742).
- [Separate 40–50 DTE chain snapshot](https://github.com/brooksbol/portfolio/blob/3bb9efb8b6b032b5205f3e67eba4e778ef9caec9/research/2026-11-08-aristocrats-option-chains-40-50-dte.json.gz) at Portfolio commit [3bb9efb8](https://github.com/brooksbol/portfolio/commit/3bb9efb8b6b032b5205f3e67eba4e778ef9caec9). Only the frozen 70-symbol universe was reused for the calendar.

The Tradier production snapshot checked 70 symbols and confirmed 724 symbol/date pairs across 25 dates. KVUE returned expiration listings with no confirmed put identities. A calendar entry identifies an expiration session with listed puts. ATM strike selection uses listed strikes and the stock price observed on that session.

## Scope

This checkpoint records the calendar as the first deliverable. Separate paper-account creation and funding, long-stock and covered-call automation, and order submission are deferred.

The [October `/v2/chains` checkpoint](wwt-chains-minimal-http-real-data-experiment-checkpoint-2026-10-24.md) is prior design context. Any v2 API or contract change requires separate Principal review before edits begin.
