<!--
DRAFT — NOT FILED. Prepared 2026-10-18 by Kiro under Workstream B. Filing into docs/bugs/ (record + INDEX row + roadmap projection regeneration) awaits Principal decision B recorded in docs/discovery/4am-*workstream-b-completion-report-checkpoint-2026-10-18.md. BUG-043 was the next unused identity at main ef5c54c; re-check before filing.
-->

# BUG-043 — Trading calendars know only 2026; v1 will treat 2027 exchange holidays as trading days and v2 loses session identity for all of 2027

- **Status:** Open
- **Severity:** Not established (proposed for independent assessment; see Consequence)
- **Area:** Backend session semantics (v1 `SessionGate`, v1 `SessionClassifier`, v2 `TradingCalendar` / `DirectQuoteSessionIdentity`); frontend `market-session/trading-calendar.ts`
- **Provenance:** Kiro Product-maturity blind-spot review (B4), 2026-10-18, source inspection at main `bef03dd`; Principal directed entry into `docs/bugs/` for independent verification and prioritization

## Observed failure

Not yet observed in running software. This is a **source-derived, date-certain** defect: every calendar table in source is bounded to 2026, and the first affected instant is 2027-01-01 00:00 ET. Epistemic status: source inspection only; no runtime reproduction, no clock-injected test run.

## Intended semantics violated

- `docs/foundations/backend-behavioral-invariants.md:138–139`, "Trading calendar correctness": "The backend must correctly identify US market holidays, weekends, early-close days, and regular session boundaries for the operational year."
- The session-gated acquisition invariant (`docs/foundations/backend-behavioral-invariants.md:125–131`) gives as its prohibited outcome: "Provider requests issued during closed sessions, weekends, or holidays".
- v2 Doc 79 bounded-authority design: outside known years the calendar must fail closed (it does). Failing closed for an entire calendar year was presumably not the intended steady state.

## Evidence

Source at `bef03dd` (paths relative to repo root):

1. `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/TradingCalendar.java:35`: `KNOWN_YEARS = Set.of(2026)`. Holiday and early-close tables at lines 37–43 contain only 2026 dates.
2. `evidence-service-java/src/main/java/com/wheelwright/evidence/SessionGate.java:37–44`:
   - `US_MARKET_HOLIDAYS_2026` and `US_EARLY_CLOSE_2026` are hard-coded.
   - `getPosture` (lines ~97–115) blocks weekends and members of those sets only. It has no known-year check.
3. `evidence-service-java/src/main/java/com/wheelwright/evidence/SessionClassifier.java`:
   - `US_MARKET_HOLIDAYS_2026` is defined at line 59.
   - It is used at lines 112, 187 and 353, for classification and previous-trading-day computation. There is no known-year check.
4. `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/DirectQuoteSessionIdentity.java:47, 85, 97`: when `isKnownYear` is false, it returns `AcquisitionPhase.UNKNOWN` and `Optional.empty()`.
5. `options-prototype/src/market-session/trading-calendar.ts:25–46`: only `CALENDAR_2026` exists, and it is the constructor default at line ~106. `isTradingDay` checks weekends plus that year's holiday set only.
6. The same 2026 holiday list is duplicated by value in four places (items 1, 2, 3 and 5).

Derived behavior (inference from code; not executed):

- **v1 acquisition:** on any weekday 2027 exchange holiday (the first is 2027-01-01, a Friday), `SessionGate` will not block for the holiday. Posture follows time of day, so FULL acquisition is admissible during normal hours on a closed-exchange day. 2027 early-close days will be treated as full days.
- **v1 classification:** `SessionClassifier` will classify 2027 holidays as trading-day states. Its previous-trading-day walk can name a 2027 holiday as the canonical session.
- **v2 direct quotes:** for every 2027 instant, `phaseAt` returns UNKNOWN, `regularSessionDate` is absent, and `latestCompletedRegularSessionDate` is empty. Session-specific reuse therefore fails closed for the whole year, including normal trading days. The downstream effect on reuse, provider contact volume and read-through behavior is not established.
- **Frontend:** `USMarketCalendar` defaults to 2026 data, so 2027 holidays are trading days to any frontend session policy that uses it.

## Consequence

- v1 would acquire, and classify evidence, on closed-exchange days. The project treats that as a modeling failure ("Acquiring during closed sessions is a modeling failure").
- v2 would lose regular-session identity for all of 2027. That degrades session-aware reuse, and possibly increases provider contact.

The defect is time-certain and lands in about 2.5 months. Severity is left Not established so the independent verifier can assess it.

## Diagnosis / root cause

Calendar truth is hard-coded per year, duplicated by value across four components, and has no year-rollover obligation or test. v2 added an explicit bounded-authority guard (`KNOWN_YEARS`); v1 and the frontend have none.

## Scope / non-goals

This record is for independent verification and prioritization. Filing does not authorize remediation. The record does not choose a calendar source, consolidation approach or release/install plan, and it does not assert 2027 holiday dates; those must come from an authoritative exchange source at remediation time.

## Acceptance criteria

Proposed for Principal and verifier confirmation; not established historically.

1. Clock-injected tests for representative 2027 instants: a 2027 weekday holiday, an early-close day, and a normal trading day. They must fail against `bef03dd` and pass after remediation, for v1 `SessionGate`, v1 `SessionClassifier`, v2 `TradingCalendar` / `DirectQuoteSessionIdentity`, and the frontend calendar where it is still used.
2. 2027 holiday and early-close dates are sourced from an authoritative exchange calendar and cited.
3. A known-year horizon guard or test makes the next rollover fail visibly before the year boundary.
4. The fix is verified on the **installed** v1 and v2 runtimes, not only in source, consistent with installed-path acceptance discipline.

## Remediation history

## Verification

## Related

- `docs/foundations/backend-behavioral-invariants.md` (session and trading-calendar invariants)
- Doc 79 (`docs/79-api-v2-direct-quote-reject-invariant-reconciliation-2026-10-05.md`), bounded calendar authority
- ADR-023 D2/D3: realization events (an installed calendar update) must reconcile State/Time knowledge

