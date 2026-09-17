# BUG-024 — Covered-call moneyness visualization conflates strike-relative contract state with economic-consequence/intent, rendering CALL moneyness history neutral instead of communicating its OTM/ATM/ITM trajectory

- **Status:** Open
- **Severity:** S3 (misleading/absent decision-support signal; underlying numeric moneyness values are correct)
- **Area:** Operator Console / moneyness presentation (`moneyness-color.ts`, `MoneynessCellV4` trace, `PositionTile`, `operator-console.css`)
- **Provenance:** Discovered 2026-09-17 (Principal observation on the Operator Console; screenshot supplied). Filed per the repository defect-tracking protocol (`docs/bugs/README.md`). Filing does not authorize remediation.

## Observed failure

On the Operator Console, **CALL moneyness sparklines render gray/neutral while PUT and BW moneyness sparklines render with semantic colors**, even when the CALL position has a well-defined OTM/ATM/ITM state and a real trajectory relative to strike.

Principal-reported screenshot (2026-09-17), same Console view:

- UNG — CALL — OTM −1.2% — gray trace
- COPX — CALL — ATM −0.4% — gray trace
- GDXJ — CALL — ATM −0.4% — gray trace
- SHR — CALL — ATM −0.4% — gray trace
- URA — CALL — ATM −0.4% — gray trace

PUT and BW rows in the same Console render colored moneyness traces. Epistemic status: the specific rows/values are **operator-reported from the screenshot**; the code path that produces the gray CALL trace is **traced/observed** in the repository (below).

## Intended semantics violated

ADR-013 (Position Monitoring Model, ratified) decomposes monitoring into **three independent dimensions** with an explicit fact-to-interpretation boundary:

1. **Contract State (observable facts)** — "objective measurements requiring no interpretation." Moneyness OTM/ATM/ITM lives here.
3. **Economic Consequence (data-dependent assessment)** — "requires inputs beyond contract state — particularly cost basis for calls... When these are unavailable, the assessment is explicitly partial or indeterminate." ADR-013 further states economic consequence "is arithmetic, not judgment... **Whether that is desirable depends on context that this dimension does not supply**," and that "**'ITM near expiration' is never architecturally encoded as a defect.**"

The ratified Operator Console architecture (`docs/26-operator-console-architecture.md`) assigns moneyness color to dimension 1 explicitly: state encoding is "green = OTM, yellow = ATM, red = ITM — **answering only 'where is the underlying relative to strike?'**" It does **not** exempt calls, and it does not make moneyness color depend on economic desirability.

`moneyness-presentation.ts` likewise scopes moneyness classification to dimension 1: its rule "answers ONLY 'Where is the underlying relative to this option's strike?' It does NOT mean good/bad, safe/dangerous, or profitable/unprofitable." `options-domain-reference.md` (§4) reinforces that moneyness "describes intrinsic value... it does **not** by itself establish exercise, assignment, desirability, or final holdings."

The defect is that the production moneyness *coloring* for CALL positions is derived from **economic-consequence/intent** (a dimension-3 concern) rather than from **strike-relative contract state** (the dimension-1 concern that moneyness color is architecturally assigned to). Because covered-call economic intent (is call-away desirable?) is treated as unknown, the CALL moneyness trace is forced neutral — collapsing a well-defined dimension-1 fact into dimension-3 indeterminacy.

## Evidence

Traced implementation (read-only, SYNC `48752b44f8d3bc5816f6ca959ec12ca1ba8acdad`):

1. `options-prototype/src/operator-console/moneyness-color.ts` — `moneynessColor(type, state)` returns `"neutral"` for `type === "call"` unconditionally:

   ```ts
   case "call":
     // Intent unknown: conventional CC doesn't necessarily reveal whether assignment is desirable.
     // Use neutral coloring — the operator needs other context (consequence, mission) to judge.
     return "neutral";
   ```

   The file's own header declares its **epistemic status: "Exploratory hypothesis, not ratified architecture."** It reasons from intent/desirability ("whether call-away is desirable"), a dimension-3 concern, to withhold the dimension-1 strike-relative color.

2. `options-prototype/src/components/OperatorConsole.tsx` — the production DTE-ladder moneyness cell (`MoneynessCellV4`, rendered at the ladder row, and `PositionTile`) colors the sparkline **trace segments** with the same call→gray conflation, inlined:

   ```ts
   if (type === "put") {
     color = isAboveZero ? "#dc2626" : "#16a34a";
   } else if (type === "buy-write") {
     color = isAboveZero ? "#16a34a" : "#dc2626";
   } else {
     color = "#6b7280"; // call → gray
   }
   ```

   The numeric moneyness text and cell fill are colored via `moneynessColor(position.type, mState)` → also `neutral` for calls.

3. `options-prototype/src/operator-console/operator-console.css` — the neutral treatment is deliberately wired to "intent unknown":

   ```css
   .oc-td-moneyness-neutral { /* No fill — intent unknown, no visual signal */ }
   ```

4. `PositionType = "put" | "call" | "buy-write"` (`position-monitoring.ts`). A `"call"` is a plain covered call (short call against owned shares); `"buy-write"` is the same **Shares → short call** structure differing only by entry mechanism (see `docs/parking-lot-7.md`: "All three could have been ordinary owned shares followed by covered calls. The relevant structure is: Shares → short call"). BW receives full moneyness coloring; the economically equivalent plain covered call does not — the divergence is entry-mechanism-driven, not a contract-state difference.

## Consequence

The moneyness sparkline's primary information job on the Console is to communicate the contract's trajectory relative to strike (dimension 1). For every held covered call, that signal is suppressed: the operator cannot read OTM/ATM/ITM trajectory or direction from the trace, and must fall back to the numeric value alone, while PUT and BW rows in the same view retain the trajectory signal. This is an asymmetric loss of decision-support legibility for a common, first-class position type. Numeric moneyness values are correct, so this is a presentation/cognitive-correctness failure, not an accounting failure → **S3**.

## Diagnosis / root cause

Two ADR-013 dimensions have been conflated in the presentation layer:

- **Strike-relative contract state / history** (OTM/ATM/ITM and its trajectory over time) — dimension 1, a fact that is fully defined for a covered call.
- **Economic consequence / strategy intent** (favorable / ambiguous / unfavorable; whether assignment/call-away is desirable) — dimension 3, which for a plain covered call is legitimately unknown without additional context.

The production coloring path (`moneyness-color.ts` and the inlined trace logic in `MoneynessCellV4`) treats the moneyness *color* as an economic-consequence/intent signal. Because covered-call intent is unknown, it withholds color entirely — thereby also withholding the dimension-1 strike-relative signal that moneyness color is architecturally assigned to. That covered-call **economic intent** is unknown does **not** imply its **strike-relative moneyness history** is unknown or should be visually neutral.

`moneyness-color.ts` is **exploratory (self-declared), not ratified**; it cannot override ADR-013 (Category B, ratified) or the ratified Operator Console architecture, which place moneyness color in dimension 1.

## Scope / non-goals

- Covers the Operator Console moneyness **coloring** semantics for CALL positions (trace + numeric + cell) and the dimension conflation in `moneyness-color.ts` / `MoneynessCellV4`.
- **Does not** cover the moneyness sparkline horizontal/time-axis geometry — that is **BUG-015** (multi-day history folded onto one intraday session), a distinct concern. The two may both touch `MoneynessCellV4` but are independent defects.
- **Non-goal / explicit guardrail for any eventual remediation:** the fix must **not** redefine covered-call OTM/ITM as economically favorable/unfavorable (i.e., must not simply give the CALL trace put-like or BW-like intent semantics). The concern is *separation* of the two semantic dimensions: the moneyness trace should communicate strike-relative trajectory (dimension 1), and any economic-consequence/intent signal remains a separate layer (dimension 3, e.g. `assignment-consequence.ts`). Inventing an intent mapping for calls would repeat the same conflation with the sign reversed.
- Filing does not authorize remediation. Remediation requires separate explicit Principal authorization.

## Acceptance criteria (for an eventual fix)

- CALL moneyness visualization communicates the position's **strike-relative** trajectory (OTM/ATM/ITM and its movement over the observation window), consistent with the ratified "answers only 'where is the underlying relative to strike?'" semantic — on the same footing as PUT and BW *for the dimension-1 signal*.
- The fix does **not** encode covered-call OTM/ITM as economically favorable/unfavorable; strike-relative state and economic-consequence/intent remain distinct dimensions.
- PUT and BW dimension-1 moneyness behavior is unchanged (or, if unified, unified around strike-relative state, not intent).
- Numeric moneyness values unchanged.
- No regression to BUG-015's separate time-axis concern.

## Remediation history

_(empty — Open)_

## Verification

_(empty — Open)_

## Related

- **ADR-013** (`docs/07c-adrs.md`) — Position Monitoring Model; ratified three-dimension decomposition (Contract State / Decision Pressure / Economic Consequence) that this defect conflates.
- **`docs/26-operator-console-architecture.md`** — ratified Console state-encoding semantic ("answers only 'where is the underlying relative to strike?'"); Economic Consequence implemented separately (`assignment-consequence.ts`).
- **`moneyness-presentation.ts`**, **`foundations/options-domain-reference.md` §4** — moneyness is a strike-relative/intrinsic-value fact, not a desirability judgment.
- **BUG-015** — moneyness sparkline time-axis geometry (multi-day folding). Distinct concern; same component family. Not a duplicate.
- **`docs/parking-lot-7.md`** — covered call and buy-write are the same "Shares → short call" structure, differing by entry mechanism; supports the observation that plain CALL and BW should not diverge on a *contract-state* signal.
