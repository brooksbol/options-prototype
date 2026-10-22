# R2 current exposure versus retained history

`PortfolioCurrentExposure` uses the existing current applicable Account snapshot owner. `PortfolioContinuity` resolves a unique compatible inventory interpretation, not an economic event. The optional typed Position.exposure makes current evidence separate from lifecycle. Canonical historical holdings, source Artifacts, GUIDs and immutable Construction predecessors remain independently navigable.

| Newly constructed deterministic case | Outcome / proof |
|---|---|
| A identical repeated snapshot | Unique UNRESOLVED GUID reused; no extra economic Position or opening date. Source-package-before-holdings creates exactlyone Position; refresh without new facts does not create new C |
| B changed quantity | Same unique interpreted GUID, new immutable current C with actual latest quantity; previous C unchanged. No inferred fill or basis allocation |
| C explicit zero | ZERO_OBSERVED empty current composition; UNRESOLVED lifecycle, no fabricated closing event |
| D absent from complete authoritative securities cut | ZERO_OBSERVED; old quantity is not current, predecessor remains readable. Failure of separate cash supplement does not invalidate complete securities |
| E rejected partial pagination / failed acquisition | Current successful snapshot retained, no erasure; failure retained as operation/source outcome |
| E accepted but incomplete Fidelity scope / unavailable cash | RETAINED last facts; no established current financial totals. Intentional Cash exclusion alone does not mark a complete securities export incomplete |
| F scoped proven CLOSED then same series | CLOSED resource never reused; new GUID for later exposure. No opening date inferred from new holdings alone |
| G one matching unresolved interpretation | Qualified continuity remains UNRESOLVED even if quantities agree. Snapshots cannot detect an unobserved intervening close/reopen |
| H multiple eligible / overlapping interpretations | UNKNOWN current allocation, no arbitrary GUID match/split/recombine; independent holdings retained. Empty unknown C is not zero |
| late older observation | Existing current-cut ordering by parsed source/receipt chronology prevents rollback; original retained source remains readable |
| package evidence arrives after provisional singletons | Only raw one-leaf holdings fallback interpretations may become SUPERSEDED_INTERPRETATION with successor link; GUID/history retained, no economic merge/closure claimed |
| later close spans existing source-backed packages | No automatic merge into another GUID; unresolved economic split/recombine policy remains untouched |

`PortfolioCurrentExposure.java:15–38` reconciles source scopes/quantities; `:40–50` distinguishes complete securities/cash and reads bounded same-Position predecessors; `:51` withholds current analytics for UNKNOWN/RETAINED. `PortfolioContinuityTest:25–54` covers repeat/ambiguity/conflicting terms/closure; `PortfolioCurrentExposureTest:24–28` covers changing/zero/absent/full/partial/failed/Fidelity evidence. Old tests that expected a stale currentConstruction pointer were corrected to assert the new current interpretation **and preserved old immutable resources**, rather than freezing the demonstrated defect.

Position lifecycle is unchanged by mere snapshot disappearance. Where a previously asserted OPEN state cannot remain currently established, it becomes UNRESOLVED with retained history, never synthetic CLOSED. Current evidence status can be filtered using standard `/v2/positions?exposureStatus=OBSERVED&projection=expanded&include=currentConstruction,orderSummaries`. No screen-specific live endpoint, new lifecycle engine or Order submission was added.

## Runtime obligations beyond schema

JSON Schema constrains the exposure enum, unresolved-continuity marker, successor navigation requirement and excludes exposure from CLOSED responses. It cannot prove snapshot completeness, temporal applicability, inventory identity/compatibility, unambiguous matching, financial association truth, conservation, immutable persistence, same-Account predecessor resolution or authorization. Runtime tests and source predicates exercise those obligations on finite fixtures.

Global reconciliation still requires both Position and holdings grants. Coverage claims require whole-Account aggregate demand and propagate conflicts to affected Positions/Constructions. No current financial conclusion can become established merely because a reconciliation/import succeeds. All links, source clocks, composition recognition and Order-derived fields pass existing runtime authorization; Position access alone confers no Order/Artifact access. New tests exercise actual MockMvc summary/expanded and foreign-Account paths; these are runtime deterministic tests, not live deployment verification.
