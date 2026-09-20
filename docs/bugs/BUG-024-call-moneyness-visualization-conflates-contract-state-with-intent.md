# BUG-024 — Covered-call moneyness visualization conflates strike-relative contract state with economic-consequence/intent, rendering CALL moneyness history neutral instead of communicating its OTM/ATM/ITM trajectory

- **Status:** Resolved (2026-09-17) — Principal visual validation passed on the Operator Console.
- **Severity:** S3 (misleading/absent decision-support signal; underlying numeric moneyness values are correct)
- **Area:** Operator Console / moneyness presentation (`moneyness-color.ts`, `MoneynessCellV4` trace, `PositionTile`, `operator-console.css`) **and** Operator Console Delta cell coloring (`OperatorConsole.tsx` DTE-ladder Delta cell) — see Scope expansion below.
- **Provenance:** Discovered 2026-09-17 (Principal observation on the Operator Console; screenshot supplied). Filed per the repository defect-tracking protocol (`docs/bugs/README.md`). Filing does not authorize remediation.

## Scope expansion — CALL Delta coloring (Principal-authorized, 2026-09-17)

The original defect (below) concerned **CALL moneyness** only. During remediation the Principal **explicitly expanded BUG-024** to also include **CALL Delta coloring**, which exhibits the same class of failure on a different Console surface: the DTE-ladder Delta cell colors CSP and buy-write Delta but renders CALL Delta **neutral/uncolored** (`hue = "neutral"`, comment: *"Call: neutral (no intent-aware coloring)"*). Historical evidence established that CALL Delta was **not** part of the original observation and was not preserved in any other bug/parking-lot item; rather than file a separate BUG-025, the Principal decided both manifestations belong to one defect and are remediated together. This record is the authority for both.

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

### Durable learning — domain theory vs operator semantics (surfaced during remediation)

Investigating the CALL Delta half exposed a layering distinction that the original diagnosis under-specified and that is worth preserving beyond this bug:

> **Domain theory determines what a metric *is*. Operator semantics determine how that metric is made cognitively useful in a particular position context.** Operator semantics may *add* contextual meaning but must not *contradict* the underlying domain theory.

- **Delta value** is an observable local sensitivity (domain theory: not a probability, no intrinsic good/bad — `options-domain-reference.md` D5; ADR-013 dim-1 fact).
- **Position context** (put vs call vs buy-write) determines *why* that sensitivity matters operationally.
- **Delta color** is a position-contextual operator cognitive aid layered onto the fact. It does **not** claim the metric is intrinsically good/bad or that Delta is a probability.

The earlier reasoning that "Delta carries no intrinsic good/bad implication, therefore the UI must not color it" was a **category error**: "no intrinsic desirability" (an epistemic statement about the metric) is not equivalent to "the UI must not interpret it" (a presentation prohibition). CSP and buy-write already color Delta contextually and usefully; CALL was simply missing its contextual interpretation. The same distinction applies to moneyness: the color communicates *where the underlying is relative to strike and how far* (contract-state cognitive aid), not desirability.

**Operator grammar adopted (both metrics):** a shared amber center, intensity graded by distance from that center, polarity set by side/type, PUT and CALL as opposite (mirrored) heuristics.
- **Moneyness:** center = ATM; intensity grades with distance into OTM/ITM; PUT → OTM green / ITM red; CALL & buy-write → OTM red / ITM green (mirror).
- **Delta:** center = 0.50; intensity grades with distance from 0.50 (existing behavior); CSP → low-δ green / high-δ red; CALL → the mirror (low-δ red / high-δ green); buy-write retains its existing specialized lifecycle heuristic.

## Scope / non-goals

- Covers the Operator Console moneyness **coloring** semantics for CALL positions (trace + numeric + cell) and the dimension conflation in `moneyness-color.ts` / `MoneynessCellV4`.
- **Does not** cover the moneyness sparkline horizontal/time-axis geometry — that is **BUG-015** (multi-day history folded onto one intraday session), a distinct concern. The two may both touch `MoneynessCellV4` but are independent defects.
- **Non-goal / explicit guardrail:** the fix must **not** redefine covered-call OTM/ITM as economically favorable/unfavorable (i.e., must not simply give the CALL trace put-like or BW-like intent semantics). The concern is *separation*: moneyness color communicates strike-relative state (a contract-state cognitive aid); any economic-consequence/intent signal remains a separate layer (e.g. `assignment-consequence.ts`). CALL is the contract-side **mirror** of PUT, not a copy, and not an inferred desirability.
- **Scope expansion (Principal-authorized, 2026-09-17):** also covers **CALL Delta coloring** in the DTE-ladder Delta cell (`OperatorConsole.tsx`) — the CALL branch mirrors the existing CSP Delta heuristic around 0.50. CSP and buy-write Delta behavior are unchanged.
- **Moneyness grading (Principal-authorized "Option 3", 2026-09-17):** the fix adds distance-from-ATM intensity grading to moneyness for all applicable types so a deep OTM position reads darker than a shallow one. This changes CSP/BW moneyness rendering **from flat to graded (intensity only)**; their polarity/meaning is preserved. This is the one place the remediation is intentionally not CALL-only, and it is explicitly authorized.
- **Out of scope:** no generalized color framework; no Greeks redesign; no change to Gamma/Theta/Vega/Rho; the intent-aware `moneynessColor` function is retained (not deleted) but is no longer the Console's coloring path.
- Filing did not authorize remediation; remediation proceeded under separate explicit Principal authorization (2026-09-17).

## Acceptance criteria (updated for the expanded scope)

**CALL moneyness:**
- CALL moneyness color communicates the position's **strike-relative** state/trajectory (OTM/ATM/ITM), no longer rendered gray/neutral — participating in the same graded visual grammar as PUT/BW.
- Polarity is the contract-side **mirror** of PUT/CSP: CALL OTM = red, CALL ITM = green (ATM amber). It does **not** encode covered-call OTM/ITM as economically favorable/unfavorable.
- Numeric moneyness values unchanged; text remains legible over the graded background.
- No regression to BUG-015's separate time-axis concern.

**CALL Delta (expanded scope):**
- CALL Delta is colored as the contract-side **mirror** of the existing CSP Delta heuristic around the shared 0.50 amber center (low δ = red, 0.50 = amber, high δ = green), using the identical bands/intensity math as CSP with poles swapped — no longer neutral/uncolored.
- The color is a position-contextual operator cognitive aid, not a claim that Delta is intrinsically good/bad or a probability.

**Shared grammar / non-regression:**
- Shared amber center (moneyness ATM; Delta 0.50); intensity grades with distance from center; deeper OTM/ITM (moneyness) and farther-from-0.50 (Delta) read stronger. Sanity check: a **deep OTM put is visibly darker green than a barely-OTM put**.
- Existing CSP and buy-write **Delta** behavior is unchanged.
- Existing CSP/buy-write **moneyness** polarity/meaning is preserved; only the missing intensity grading is added (Principal-authorized "Option 3").
- No generalized color framework, no Greeks redesign, no change to Gamma/Theta/Vega/Rho.

## Remediation history

Implemented 2026-09-17 (uncommitted at time of writing, pending Principal validation per the direct-`main` workflow acceptance gate). Changed files:

- **`options-prototype/src/operator-console/moneyness-color.ts`** — added `moneynessGradedColor(type, signedMoneyness)` returning a graded `rgba(...)`: ATM band (`|m| ≤ ATM_TOLERANCE`) → amber `rgba(202,138,4,0.12)`; otherwise intensity `0.08 + t²·0.30` with `t = (|m| − ATM_TOLERANCE)/(0.15 − ATM_TOLERANCE)` (saturates ~0.38 by ~15% from strike); polarity PUT → OTM green / ITM red, CALL & buy-write → OTM red / ITM green (mirror). Header docstring updated. The prior intent-aware `moneynessColor` is retained but no longer used by the Console.
- **`options-prototype/src/components/OperatorConsole.tsx`**
  - DTE-ladder moneyness `<td>`: replaced discrete `oc-td-moneyness-<class>` background with the inline graded background from `moneynessGradedColor`.
  - `MoneynessCellV4`: dropped the intent `colorClass` prop; numeric text fixed to high-contrast `#1f2937` for legibility over any tint; trace polarity now PUT = ITM red / OTM green, CALL & buy-write (call-side) = ITM green / OTM red (CALL previously rendered gray/neutral).
  - `PositionTile`: moneyness field uses the graded background + `#1f2937` text.
  - DTE-ladder **Delta** cell: added a `call` branch that mirrors the existing CSP block around 0.50 (δ ≤ 0.35 → red, 0.35–0.55 → amber `0.12`, δ > 0.55 → green), identical bands/intensity to CSP with green/red poles swapped. CSP and buy-write Delta blocks untouched.
  - Removed now-unused imports (`moneynessColor`, `MoneynessColorClass`, `classifyMoneyness`) and dead `mState` bindings.
- **`options-prototype/tests/operator-console/moneyness-color.test.ts`** (new) — regression coverage (see Verification).

Deliberately **not** changed: CSP/BW Delta heuristics; the retained `moneynessColor` function; BUG-015's time-axis geometry; Greeks other than Delta.

## Verification

- **Regression tests (new `moneyness-color.test.ts`):** ATM → amber for put/call/buy-write; PUT OTM green / ITM red; **CALL is the mirror** (OTM red, ITM green) and never neutral/undefined when an observation exists; CALL vs PUT opposite hues on the same side; buy-write uses call-side polarity; **deep OTM put alpha > barely-OTM put alpha** (the sanity check) and saturates ≈0.38; monotonic intensity for calls; `null` → `undefined`.
- **Targeted run:** `moneyness-color.test.ts` + `moneyness-presentation.test.ts` → **46 passed**.
- **Type check:** `tsc --noEmit` (full program) → clean.
- **Full frontend suite:** `vitest run` → **1877 passed, 1 failed**. The single failure is `tests/velvet-rope/multi-expiration.test.ts`, a **date-sensitive inline snapshot** (expected `2026-09-18` vs `2026-10-04`, a 14-DTE-from-today drift). Confirmed failing **identically on the clean baseline** (changes stashed) — **pre-existing and unrelated** to BUG-024; left untouched.
- **Build:** `npm run build` fails on `src/roadmap/roadmap-projection-types.ts:121` (a spurious `tsc -b` parse error on a valid `refId: string | null` line). Confirmed failing **identically on the clean baseline** — **pre-existing and unrelated** (untouched file; full-program `tsc --noEmit` is clean); left untouched.
- **Visual-strength revision (2026-09-17):** first-pass fills (0.08 → 0.38 alpha, amber 0.12) were too washed out on the Principal's lower-contrast display. Strengthened the shared graded ramp to **0.22 → 0.75 alpha** (amber center 0.22), applied uniformly to moneyness and the whole Delta cell (CSP/CALL/BW). Semantics, polarity, ramp shape, BW mapping, and high-contrast numeric text unchanged.
- **Principal visual validation — PASSED (2026-09-17).** Confirmed on the Operator Console: CALL moneyness and CALL Delta are colored (no longer gray); moneyness graded by distance from ATM and Delta by distance from 0.50; ATM / Delta-0.50 amber; PUT/CALL opposite polarity; CSP/BW Delta semantics and BW lifecycle treatment unchanged; deep OTM put reads dark green; numeric text legible over the stronger fills. This is the acceptance gate for operator-visible behavior → **Resolved**.

## Related

- **ADR-013** (`docs/07c-adrs.md`) — Position Monitoring Model; ratified three-dimension decomposition (Contract State / Decision Pressure / Economic Consequence) that this defect conflates.
- **`docs/26-operator-console-architecture.md`** — ratified Console state-encoding semantic ("answers only 'where is the underlying relative to strike?'"); Economic Consequence implemented separately (`assignment-consequence.ts`).
- **`moneyness-presentation.ts`**, **`foundations/options-domain-reference.md` §4** — moneyness is a strike-relative/intrinsic-value fact, not a desirability judgment.
- **BUG-015** — moneyness sparkline time-axis geometry (multi-day folding). Distinct concern; same component family. Not a duplicate.
- **`docs/parking-lot-7.md`** — covered call and buy-write are the same "Shares → short call" structure, differing by entry mechanism; supports the observation that plain CALL and BW should not diverge on a *contract-state* signal.
