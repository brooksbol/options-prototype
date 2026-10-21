# API v2 foundational Portfolio specification — Principal acceptance checkpoint (2026-10-21)

**Standing:** Principal-selected Option A, **architectural/specification baseline accepted with conditions**. This does not mean the operative OpenAPI or running backend has been updated, and does not authorize deployment or trading.

## Accepted baseline
- Local candidate commit: `a32c7c79a059cc58d5262cf3e30c520d2e087825` on `codex/api-v2-final-correction-2026-10-21`, at `/Users/bollich/kiro/options-candidates/api-v2-final-correction-2026-10-21`. The candidate was reported local-only; GitHub main does not contain its complete OAS package.
- Independent Kiro report: 294/294 deterministic checks reproduced, four of seven targeted findings fully resolved, three partially resolved; architecture expresses accepted Product requirements with no demonstrated domain/financial regression. Runtime authorization and live broker behavior remain unverified.
- Principal response: **“A”** selecting acceptance now with the three findings mandatory in the initial implementation work, rather than requiring another cleanup commit before specification acceptance.
- Accepted meaning: domain/resource design baseline for engineering. Not blanket acceptance of demonstrably incorrect synthetic examples, redaction leakage, or incomplete coverage reconciliation.

## Three mandatory implementation-entry corrections (not optional deferrals)

1. **Examples and temporal qualifications:** regenerate six remaining template-derived Position examples from own constituent/evidence inputs. Remove unsupported “terms unavailable”, copied USD 123.45 / September 1 warnings, and unsupported withheld payoff. Set gross/net/fees `asOf` to actual evaluation time, not opening date. Add source-derived coherence tests detecting warnings contradictory to established field states.
2. **Redaction:** redacted Order-derived metrics must not retain `asOf` opening timestamps. Correct schema rule, redaction projection, fixtures, and tests. Verify summary and expanded projections do not leak protected Order facts.
3. **Account reconciliation:** show the two-calls/100-shares coverage conflict in Account reconciliation and affected Position states; repair Position warning pointers to actual affected fields. Distinguish aggregate economic coverage from broker-confirmed collateral and no tax-lot-association machinery.

All three must be closed by tests and targeted verification **before their relevant representations are used as implementation authority or pronounced running/accepted**. In particular the redaction defect is a security correctness issue, not merely sample polish.

## Immediate Product goal and constraints
- Continue with an authorized bounded v2 backend implementation slice adequate to reproduce accepted `tt live` semantics through API v2, then `ww live`. Do not claim implementation completion merely because the specification is accepted.
- Preserve unique Position GUID and terminal CLOSED; versioned write-once Construction Models; immutable Construction instances and predecessors; constituent-preserving fallback; original/current/cumulative qualified economics; broker holdings as separately readable sourced observations; field-level warnings and Account grants; exact financial geometry independent of lossy CLI.
- API-as-Product: no external alpha backwards-compatibility veto; reuse useful code/evidence, not sunk-cost structures.
- Portfolio membership, first-class Execution, full split/recombine identity, Strategy/margin, trading automation and tax-lot assignment remain outside this acceptance.
- Before software writes, follow repository bootstrap, authority, experiment/task gates and proper separate implementation authorization. Acceptance of this candidate does not bypass them.

**Next handoff:** Codex/Kiro should locate the preserved local candidate, check current repo task/gate authority, incorporate and independently verify the three bounded corrections at implementation entry, and execute the smallest backend slice supporting `ww live` Product proof under separate authorized development scope.
