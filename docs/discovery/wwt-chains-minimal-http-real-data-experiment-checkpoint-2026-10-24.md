# Wheelwright chains — minimal REST contract and real-data experiment checkpoint

**Captured:** October 24, 2026. **Standing:** Principal Product/API direction and bounded experiment request, not ratified OAS, implemented behavior, blanket live-provider permission or deployment authority. Kiro excluded. This succeeds the [REST/read-through clarification](wwt-construction-search-rest-readthrough-clarification-2026-10-24.md) and [complete Product walkthrough](wwt-construction-search-product-walkthrough-2026-10-24.md).

## Principal correction following Codex's latest REST review

Codex's candidate `GET /v2/chains` used a `basis` token, two pagination dimensions, a `compare` parameter and an optional `202` flow that repeated the original query. The Principal explicitly revised it:

1. “i'd get rid of evidence basis, one pagination dimension , and compare for now”
2. “202 response should provide an update uri HATEOAS”
3. “i think small is good for mcp. snapshot this and get codex started on an experiment with real data.”

### Working Product/API direction

- **Small query-oriented interface:** `GET /v2/chains` with explicit, typed query parameters and projection; no `/v2/construction-searches` registry, no client-exposed evidence-basis token and no `compare` parameter in the first slice. `sort` may choose a supported dimension; the backend still owns all leader/financial conclusions, rather than inferring that no compare parameter eliminates multiobjective facts.
- **One pagination dimension:** one governed bounded collection and one `next` hypermedia continuation, not separate outer Chain and nested Candidate cursors. Precisely choose the pagination unit during contract verification; this clarification does not itself ratify whether the collection is flattened or grouped by expiration.
- **202 with HATEOAS:** if real backend work continues, return `202 Accepted` with a server-provided update/status URI (through `Location` and/or a documented relation), appropriate polling guidance and truthful progress. Client follows links; never guesses or reconstructs polling URL. Completion and failure have defined HTTP representations. No needless permanent search lifecycle.
- **Client-transparent read-through:** backend selects qualified retained observations or acquires through **existing permitted** provider mechanisms; no MCP-side cache management. HTTP GET safety is preserved for domain actions; read grants do not automatically confer chain acquisition permission. Provenance remains visible.
- **Projection discipline:** summary/expanded selection affects returned detail, not evaluation meaning, source acquisition scope or ranking. Keep MCP surface minimal.
- **Ephemeral candidate values:** typed, by-value prospective Constructions referencing an immutable Construction Model version; no mandatory GUID, URI, Order, Position or durable result history.
- **Off-hours:** evaluate latest qualified evidence from an open session. Do not require an active trading session to exercise a real-data test.
- **Experience:** primary output is a legible funnel plus one compact row per distinct evaluated construction, with leg strikes, deltas if actually supported, credit and risk. Optional progress must not block an inexpensive completed result.
- **Future flexibility:** saving search definitions and answer presentations is separately deferred under My Questions, not required for the first experiment.

## Next bounded experiment authorized in Product direction

The Principal requests Codex to try a **real-data** experiment next, not merely another synthetic contract paper exercise. Scope should be one underlying (SPY as exemplar), one selected expiration or tight explicitly stated window, and a limited set of widths/criteria; **do not assume 45 DTE**. Recover nearest working acquisition/payoff precedent, protect in-flight and accepted software, and prove the smallest end-to-end source-qualified request and operator-readable result. Use existing retained real-source observations first; any provider contact must have its own actual acquisition permission, credentials and non-production isolation. If real chain evidence is missing or inadequate and permitted acquisition cannot be verified, report the gap and stop before provider contact rather than silently reverting to synthetic-only evidence or inventing completion. No trading, brokerage orders, grants, production DB/service changes, main integration, API publication or Kiro assignment.

Deliver a source-qualified real-data specimen, provenance/coverage/accounting of candidate enumeration/exclusion, quote/Greek limitations, independently checked economics, compact comparison, and a minimal HTTP trace including `200` or truthful `202` plus update link if acquisition is genuinely pending. Falsify missing/adjusted terms, stale legs, off-hours reuse, missing delta, one-page pagination and backend-vs-MCP authority. Keep source observations clearly distinct from modeled economics and hypothetical fill assumptions.

**Disposition:** Direction captured; Codex experiment commissioned by Principal but no change to accepted API/OAS and no implicit protected-operation permission. The next actor must verify its current task state and allowed workspace before mutation.
