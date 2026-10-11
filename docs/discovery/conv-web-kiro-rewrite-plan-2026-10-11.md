# Wheelwright v2 Web Client — High-Level Rewrite Plan

**Status:** Planning evidence under the OPEN `PL-CONV-01` / **CONV-WEB** reconciliation. **Not** a ratified migration architecture, accepted estimate, or implementation authorization. Does not reorder the Principal-selected six-step `PL-CONV-01` sequence. Grounded at `origin/main` `beaea80`.

**Author's framing:** Called a *rewrite* deliberately. `PRIN-ARCH-BACKEND-AUTHORITY` moves both the web client's **data substrate** (IndexedDB `DurableMarketCache`) and its **business logic** (client-side recommendation/decision engines) to the backend. What remains on the client is presentation + interaction. When the substrate and the logic both leave, there is no client architecture left to *migrate* — only a presentation layer to rebuild against a new contract.

---

## 1. Governing constraints (non-negotiable inputs)

| Constraint | Source | Consequence for this plan |
|---|---|---|
| Backend owns authoritative state, domain semantics, business rules, decision logic; clients own presentation; equivalent evidence+governance ⇒ equivalent conclusions across interfaces | `PRIN-ARCH-BACKEND-AUTHORITY` (`docs/principles.md`) | The target web client computes nothing authoritative. It renders backend conclusions. |
| Client caching limited to standard HTTP caching semantics; no independent client state store | Doc 77 §authority mandate | No IndexedDB shadow store. ETag/304 + cache-control only. |
| Backend owns state and business logic; clients own presentation (v2 mandate) | Doc 77 §V2 backend authority mandate | v2 API must *grow* the capabilities the browser currently owns before the browser can shed them. |
| v1 Web remains the live Cash Deployment client until v2 demonstrates + is accepted for equivalent capability; no forced cutover; heavy Oct 12 session protected | `PL-CONV-01` operational restrictions | Strangler pattern mandatory. v1 runs untouched throughout. v1 retirement is the *last* gate, Principal-accepted. |
| v1 topology is evidence/lessons, not an architecture to copy | Doc 77 | Do not re-implement the funnel/engines "as-is" server-side. Extract and ratify their real Product semantics. |
| Prefer backend capabilities serving multiple interfaces (tt, ww, web) over isolated client migrations | CONV-WEB disposition | v2 capability design is shared with `ww`/`tt`, not web-specific. |

---

## 2. What actually has to move (the real scope)

The web client today **owns** (not merely displays) a large body of Wheelwright domain logic. Each item is a principle violation with a defined destination.

| Currently client-owned | Where it lives today | Target owner |
|---|---|---|
| Evidence substrate for computation | IndexedDB `DurableMarketCache` (raw `symbols[]/chains[]`) | Backend evidence model; client holds no domain store |
| Put / call / buy-write recommendation generation | `recommend.ts`, `recommend-calls.ts`, `recommend-buy-writes.ts` | Backend v2 recommendation capability |
| Policy application ("re-recommend on policy change") | `RecommendationPolicy` evaluated in browser | Backend (policy is governance) |
| Brief / neighborhood / contingent-call construction | `*-brief-builder.ts`, `contract-greek-lookup`, `short-obligation-evidence` | Backend explanation capability |
| Admissibility / session HOLD-vs-CLOSE gating | `trust-state`, `session-policy` | Backend (already partly true via `/api/status`) |
| Opportunity-history epoch accumulation | `OpportunityAccumulator` | Backend |
| Presentation, interaction, request initiation, non-authoritative projection | Components / surfaces | **Client (stays)** |

**The dominant cost is backend capability work, not frontend work.** The new web client is comparatively cheap *because* it is presentation-only.

---

## 3. Rewrite shape: backend-capability-led strangler

Two parallel tracks, with the client track gated on the backend track per capability.

```
Track B (Backend v2 capabilities)      Track C (New presentation client)
  specify → OAS → implement → verify     consume ratified v2 capability → render
        │                                      ▲
        └──── each capability unblocks ────────┘
                 the matching client surface

Throughout: v1 Web runs UNTOUCHED as the live Cash Deployment client (strangler)
```

Nothing in the client track may begin for a given surface until its backing v2 capability is ratified and implemented (Doc 77 §22 review gate: Product semantics → capability boundary → HTTP → OAS → implementation).

---

## 4. Phased plan (high-level, dependency-ordered — not a schedule)

### Phase 0 — Reconciliation close-out (discovery/design only)
Satisfy the CONV-WEB completion conditions already recorded in `PL-CONV-01`:
- Independently verify the FE dependency inventory + v2 capability/contract mapping against full OAS and current `main`.
- Reconcile against the whole parking-lot/roadmap authority (avoid duplicate ownership; identify shared tt/ww/web backend capabilities).
- Establish capability **parity** targets and operator-value milestones, not endpoint parity.
- Define Cash Deployment regression/acceptance gates and the v1-retirement gate.
**Exit:** a Reconciliation Completion Record + Principal-ratified capability roadmap. No code.

### Phase 1 — Client foundation (low-risk, no v1 disruption)
Build the new client's spine without touching v1 behavior:
- One authenticated v2 client module (Bearer; uniform error grammar §4; correlation IDs §5).
- Real **typed** v2 response models (replaces today's `any` snapshot access — this is the migration's safety net).
- HTTP-cache-only data access layer (ETag/304, cache-control). No persistent domain store.
- Partial-success (§10) and honest-completion (§11) handling as first-class client concerns.
Can run against the **already-implemented** v2 reads (quotes read, positions, accounts, users/me) as proof-of-spine.

### Phase 2 — Backend evidence projection capability
Define + build the v2 capability that replaces the browser's snapshot-ingest-into-IndexedDB loop: a backend-owned, proj(ection/)read capability for the evidence the UI needs — not a universe dump re-created client-side.
**Unblocks:** retiring `DurableMarketCache` as a *read source* for presentation.

### Phase 3 — Backend recommendation + explanation capability (the hard, risk-bearing core)
Specify and ratify the **real** Product semantics currently buried in the client engines (funnel, wait/edge/actionable posture, affordability, wide-spread handling, delta/DTE/moneyness selection), then implement them server-side with the determinism guarantee owned by the backend. Explanation/brief construction likewise.
**This is where failure mode #1 ("invent Product outcomes") bites hardest.** Treat it as forced extraction-and-ratification with a Principal-confirmation gate, not a lift-and-shift. Positive/negative operator specimens confirmed before hardening.
**Unblocks:** the Write Desk recommendation surface in the new client; removal of client engines.

### Phase 4 — New presentation surfaces, built on ratified capabilities
Rebuild Operator Console, Write Desk, Recommendation Brief, Markets, Production as presentation-only views over Phase 2–3 capabilities. Salvage v1 components where they are genuinely presentation (visual primitives, layout), discard where they embed logic. Adopt the CONV-UX visual motif where it applies (coordinated with the separate CONV-UX issue).

### Phase 5 — Governed-decision / history / production parity
Bring the remaining v1 endpoints (governed-decision, opportunity-history, production assessment) onto v2 capabilities with proper authority/provenance.

### Phase 6 — Acceptance + v1 retirement (final gate, Principal-accepted)
Only after the new client demonstrates accepted equivalent Cash Deployment capability: run both in parallel, meet the Phase-0 regression gates, then retire v1 Web on explicit Principal acceptance. **Never a forced cutover.**

---

## 5. Effort bands (planning input only — not schedule commitments)

Consistent with the estimate already recorded under CONV-WEB:

| Scope | Band | Qualification |
|---|---|---|
| Phase 1 client foundation against existing v2 reads | ~1–2 wk + ~2–4 wk cross-cutting (overlapping) | Does **not** retire v1; proves the spine. |
| Phase 2 evidence projection capability (BE) | design-gated | New backend capability; cost in Product/OAS design. |
| Phase 3 recommendation+explanation capability (BE) | **the long pole** | Dominated by semantic extraction + ratification + confirmation gates. |
| Phases 4–6 presentation rebuild + parity + retirement | multi-slice | Cheap per-surface *given* ratified capabilities; gated on BE. |
| **Full program (v1 retired)** | **multi-month** | Critical path is backend capability design, not React. |

Bands are code-inspection-derived, not benchmarked. Validate with bounded design + tests before treating as commitments (CONV-WEB completion condition #5).

---

## 6. Principal decision surface

**CURRENT STATE:** CONV-WEB open under `PL-CONV-01`; `PRIN-ARCH-BACKEND-AUTHORITY` ratified; v1 Web operationally protected; six-step sequence governing. This plan is provisional planning evidence.

**DECISION REQUIRED (not taken here):**
1. Accept this rewrite shape (backend-capability-led strangler) as the CONV-WEB reconciliation direction?
2. Where does web-client capability work sequence against the existing six steps (Account → BUG-036 → multi-broker → XLE → tastytrade → reconsideration)? The shared backend capabilities (evidence projection, recommendation) may be common dependencies worth co-designing — but sequencing is a Principal choice.
3. Is a Phase-1-only "client spine against existing v2 reads" worth doing early as a learning checkpoint, or does it introduce unwanted regression surface near the live v1 client?

**NEXT AUTHORIZED MODE:** Read-only reconciliation / design within `PL-CONV-01`. No FE/BE implementation, new API resource, migration, or v1 retirement authorized by this plan.
