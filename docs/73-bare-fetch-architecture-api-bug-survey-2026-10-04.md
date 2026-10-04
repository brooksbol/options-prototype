# Bare `ww fetch` — Architecture / API / Bug Survey

**Date:** October 4, 2026
**Status:** Current Specialized Reference (Category E) companion deliverable to the bounded bare-`ww fetch` experiment under `PL-CLI-01`. Investigative survey, not ratified architecture, not an implementation backlog, not defect authority. Demonstrated defects, if any, must be filed under `docs/bugs/` to receive a durable identity; this survey references but does not replace that mechanism.
**Pre-implementation checkpoint:** `docs/72-pl-cli-bare-fetch-pre-implementation-checkpoint-2026-10-04.md`
**Implementation baseline:** the checkpoint commit `04c3755…` (reconciled onto `070e144…`).

---

## Purpose and method

The Principal required, in parallel with the working bare-fetch result, a categorized survey of what implementing bare `ww fetch` exposed. This document classifies findings into exactly three categories and keeps them distinct:

1. **Architecture / authority gaps** — where a domain fact lacks a durable backend authority, or where authority lives in the wrong place (e.g. browser-owned).
2. **API / capability gaps** — where a capability exists internally but has no truthful public read, or does not exist at all.
3. **Bugs / contract defects** — demonstrated broken behavior: a violated contract, false semantic claim, regression, or incorrect status.

An architectural gap is **not** a bug. A missing endpoint is **not** a bug unless something that exists is demonstrably broken. Each finding records category, the concrete finding, evidence/reference, why it matters to an independent client, whether it blocks the final authoritative default selection, whether it blocks today's experiment, and the smallest plausible correction.

Findings were grounded by reading the backend and CLI source at the implementation baseline (controllers under `evidence-service-java/src/main/java/com/wheelwright/evidence/`, `db/SqliteEvidenceStore.java`, and `scripts/wheelwright.mjs`) and by live probes of the running appliance on `:3100` where available (session `NON_TRADING_DAY`; `monitoredPositions` = `{total:10, current:0, degraded:10}`; `/api/evidence/monitored` returned HTTP 404 on the pre-rebuild instance).

The composition-friction dimension is governed by `docs/cli/ww-composition-friction-acceptance.md` (CF01–CF12) and its two-axis rule (**Correct?** vs **Adapter required?**); this survey does not re-derive it and defers friction verdicts to that suite.

---

## 1. Architecture / authority gaps

### A-1. Monitored membership is backend-owned but the only durable "default-ish" symbol authority is the operator's open positions
- **Finding.** The one backend-owned, durable set of symbols with a clear domain meaning is the *monitored* set (`symbol_resolution.monitored_at IS NOT NULL`), declared via `POST /api/evidence/observe`. There is no backend-owned *default universe selector* — no durable authority answering "which symbols would you fetch by default."
- **Evidence.** `SqliteEvidenceStore.getMonitoredSymbols()`, `ObserveController` (`store.setMonitoredSymbols(normalized)`), checkpoint grounding notes. The experiment's seed is a CLI-side constant precisely because no backend default authority exists.
- **Why it matters to an independent client.** An independent client cannot ask the backend "what is the default set?" It must either read monitored membership (now possible) or carry its own seed (as the CLI does). The default is therefore not reconstructable from backend authority alone.
- **Blocks final authoritative default selection?** Yes — a final, non-experimental default must be owned somewhere authoritative; today nowhere owns it.
- **Blocks today's experiment?** No. The experiment deliberately uses monitored UNION a CLI-side experimental seed.
- **Smallest plausible correction.** None required for the experiment. Longer term, decide where a default selector is owned before promoting any default beyond experimental.

### A-2. Current exposure / portfolio / imported broker activity are substantially client-owned
- **Finding.** The checkpoint and `PL-CLI-01` record that portfolio/exposure state remains substantially client-owned today. The backend's `monitored` set is a declared overlay (open-position symbols the operator asked to keep observing), not an authoritative executed-position or exposure ledger. There is no durable backend executed-trade history.
- **Evidence.** `ObserveController` records a *declared* monitored set that is atomically **replaced** on each declaration (`setMonitoredSymbols` deletes and rewrites); it is a monitoring overlay, not an accounting authority. No controller or store method exposes executed-trade history (searched controllers; the governed-decision/continuity endpoints concern decisions, not an executed-trade ledger).
- **Why it matters to an independent client.** An independent client cannot establish *recent versus lifetime traded symbols*, current exposure, or imported broker activity from the backend; those facts live in the browser/import layer. The CLI must not present monitored membership as exposure/holdings/positions — and the implemented endpoint explicitly refuses to (`meaning: "last declared monitored symbols"`, documented non-implications).
- **Blocks final authoritative default selection?** Yes for any default source that depends on exposure, recent trades, or trade history (four of the six hypothesized sources). Those cannot be built truthfully today.
- **Blocks today's experiment?** No. The experiment uses only monitored membership (now exposed) and a fixed seed; it claims nothing about exposure or trade history.
- **Smallest plausible correction.** None for the experiment. A durable backend executed-trade/exposure authority would be a prerequisite before any exposure- or trade-history-derived default. Out of scope here.

### A-3. "Monitored" conflates declaration with the lifecycle it rides on
- **Finding.** Monitored membership is stored on `symbol_resolution` (the acquisition-lifecycle table) via a timestamp column, and is replaced wholesale on each declaration. It is a correct and useful fact, but it couples "operator declared interest" to the resolution lifecycle rather than being an independent first-class authority.
- **Evidence.** `getMonitoredSymbols()` reads `symbol_resolution WHERE monitored_at IS NOT NULL`; `setHeldExpirations`/`setMonitoredSymbols` share "atomically REPLACE" semantics.
- **Why it matters to an independent client.** The meaning is subtle: "last declared," replaced each time, not a historical record of what was ever monitored. The implemented endpoint's `meaning` string and manual language make this explicit so a client cannot over-read it.
- **Blocks final authoritative default selection?** No, but it constrains how much a default can lean on "monitored" as if it were exposure.
- **Blocks today's experiment?** No.
- **Smallest plausible correction.** None now; documented boundary is sufficient for the experiment.

---

## 2. API / capability gaps

### C-1. Monitored membership existed internally with no truthful public read (CLOSED by this experiment)
- **Finding.** Before this work, monitored membership was reachable only internally. `/api/status` exposes monitored *counts* (`monitoredPositions.{total,current,degraded}`), never membership; the evidence snapshot represents a wider universe. An independent client could not learn the monitored set without inferring it from counts, snapshots, or browser state.
- **Evidence.** `StatusController.status()` builds `monitoredPositions` from `store.getMonitoredCoverage(...)` (counts only). Pre-rebuild `GET /api/evidence/monitored` → HTTP 404. No membership field anywhere in the status/snapshot payloads.
- **Why it matters to an independent client.** Inferring membership from counts/snapshots/browser state is exactly the prohibited move; without a read, the CLI could not honestly resolve the default's monitored half.
- **Blocks final authoritative default selection?** It did. Now addressed by the smallest truthful read.
- **Blocks today's experiment?** It would have. Resolved by the additive endpoint.
- **Correction implemented.** `MonitoredController` → `GET /api/evidence/monitored` returns `{ symbols[], count, meaning: "last declared monitored symbols" }`. Additive and compatible: no snapshot-contract change, no API version, no acquisition, no mutation. The CLI reads membership only from this endpoint.

### C-2. No backend-owned default selector capability
- **Finding.** There is no backend capability that returns a default/opportunity symbol set. The experimental seed is a CLI constant.
- **Evidence.** No controller returns a default selector; the seed lives in `scripts/wheelwright.mjs` (`EXPERIMENTAL_SEED`).
- **Why it matters.** Two clients (web, CLI) would each have to carry their own default, risking divergence — contrary to the shared-capability pressure in Doc 71.
- **Blocks final authoritative default selection?** Yes, structurally — a shared default should ultimately be a backend capability, not a per-client constant.
- **Blocks today's experiment?** No; a CLI-side experimental seed is the authorized method for falsifying the idea first.
- **Smallest plausible correction.** Defer. Do not build a backend default selector until the experiment produces evidence about *what* the default should be. Describing the gap is the deliverable; prescribing the endpoint now would be premature.

### C-3. Comparable backend volume / market-activity evidence is absent (and provider raw volume may be dropped in normalization)
- **Finding.** The hypothesized "high market activity" default source has no backend evidence to stand on. There is no broad, comparable backend volume signal exposed for ranking. Whether the provider supplies underlying/option volume that production normalization discards was not confirmed in this pass and is explicitly left unverified.
- **Evidence.** No volume-ranking capability in the controllers surveyed. The acquisition path centers on option-chain evidence; a volume comparator is not exposed. (Provider-side raw volume availability vs. normalized retention was not traced to ground in this bounded pass.)
- **Why it matters.** Any activity-ranked default would need a comparable, backend-owned volume signal that does not exist today; a client cannot synthesize it truthfully.
- **Blocks final authoritative default selection?** Yes for an activity-based default.
- **Blocks today's experiment?** No; the seed is explicitly *not* a live activity ranking.
- **Smallest plausible correction.** Defer. If an activity-based default is ever pursued, first verify provider raw-volume availability and decide whether a comparable backend volume capability is warranted. Not now.

### C-4. Inexpensive underlying-quote synchronization is not independently available from expensive option-chain acquisition
- **Finding.** Targeted `fetch` drives full option-chain acquisition per symbol (relatively expensive, ~20s wait class). There is no cheap "just synchronize the underlying quote" path independent of option-chain work. This is the mechanical basis of the acquisition-pressure hypothesis: *worth observing ≠ worth acquiring a full option chain.*
- **Evidence.** `NudgeController.refresh` → `worker.forceAcquireSymbols` runs the targeted acquisition through the full provider/persistence/pacing path; `AcquisitionWorker` acquisition is chain-oriented. `GET /api/evidence/quotes` reads held observations but does not itself cheaply acquire.
- **Why it matters.** A ten-plus-symbol default fetch pays full option-chain cost for every symbol even when the operator only wanted a cheap market-wide glance. This is the central architectural question the experiment is designed to surface.
- **Blocks final authoritative default selection?** Potentially — if the default is "symbols worth glancing at," full-chain acquisition may be the wrong operation. That is a design question, not a blocker.
- **Blocks today's experiment?** No; the experiment is designed to *measure* this pressure.
- **Smallest plausible correction.** None now. Record the measured cost from the real run (task #8) as evidence; do not redesign acquisition under this bounded experiment.

### C-5. Strategy rankings (Exit Reliability, IV/premium interest) are frontend/research capabilities, not backend capabilities
- **Finding.** The two "quality"-based hypothesized default sources (high Exit Reliability, high IV/premium interest) correspond to frontend/research artifacts, not exposed backend capabilities. (Related research assets exist under `data/research/` and `data/policy/`, and a deployment/exit-reliability experiment is preserved on an unrelated local WIP branch — explicitly out of scope here.)
- **Evidence.** No backend controller exposes an Exit Reliability or IV/premium ranking; `PL-CLI-01` and roadmap material treat these as research/frontend concerns.
- **Why it matters.** A default leaning on these would duplicate research/frontend semantics in a second client — the anti-pattern Doc 71 warns against.
- **Blocks final authoritative default selection?** Yes for quality-ranked defaults.
- **Blocks today's experiment?** No; the seed explicitly adds no Exit Reliability or IV/premium candidates.
- **Smallest plausible correction.** Defer; explicitly out of scope per the experiment's non-goals.

---

## 3. Bugs / contract defects

This category is reserved for demonstrated broken behavior. The bare-fetch implementation was built to preserve the accepted fetch contract and the "resolved empty ≠ unresolved" invariant, and the test suites (CLI unit 15/15; fetch acceptance 30/30 at the time of writing) exercise those preservations.

### B-1. (Latent hazard, NOT triggered) empty-operand `POST /api/evidence/refresh` means whole-cycle acquisition
- **Finding.** The backend endpoint `POST /api/evidence/refresh` interprets *no* `symbol` parameters as a request to run a full acquisition cycle (`worker.forceAcquireOnce()`), bypassing the session gate. A naive bare-fetch default that resolved to an empty set and still POSTed with no symbols would silently trigger whole-cycle acquisition — a serious violation of "resolved empty ≠ unresolved."
- **Evidence.** `NudgeController.refresh`: `boolean targeted = symbols != null && !symbols.isEmpty(); ... targeted ? forceAcquireSymbols : forceAcquireOnce()`.
- **Status.** This is a documented, pre-existing endpoint behavior, not a defect introduced here, and it is **not** triggered by the implementation: the CLI resolves the default set *before* any POST, guards an empty resolved set to return without contacting the endpoint, and aborts (without POSTing) if the monitored read fails. Tests assert no refresh POST occurs on resolved-empty and on monitored-read failure. Classified as a latent hazard the implementation deliberately avoids, not a demonstrated bug.
- **Why it matters to an independent client.** Any other client composing against `/api/evidence/refresh` must apply the same discipline; the empty-operand whole-cycle behavior is a sharp edge. Worth an explicit note in the endpoint's contract, but not a defect to file absent a demonstrated misuse.
- **Blocks final default selection / today's experiment?** No.
- **Smallest plausible correction.** None required. Optional hardening (separate decision, not authorized here): make whole-cycle acquisition an explicit distinct action rather than the empty-operand default of the targeted endpoint.

### No other demonstrated contract defects found in this pass
- Explicit-symbol fetch behavior is unchanged (regression tests pass): acquisition/observation separation, no freshness assertion, failed-acquisition-with-retained-price, orthogonal outcome/held-price, exit 0/1/2 semantics, quiet/verbose mutual exclusion, and no false per-symbol certification on noncompletion.
- No duplicate-acquisition defect: union resolution deduplicates (overlap acquired once; asserted).
- No false certification after noncompletion: unchanged `presentFetchResult` path.
- No incorrect exit status observed in the covered cases.

Any defect discovered later must be filed under `docs/bugs/` with a `BUG-NNN` identity; this survey does not create defect authority.

---

## 4. Deliberately unresolved / out of scope

- The final authoritative default selector and its owner (A-1, C-2) — unresolved by design; the experiment exists to inform it.
- Durable backend executed-trade history and exposure authority (A-2) — not built.
- Provider raw-volume availability vs. normalization retention (C-3) — not traced to ground in this bounded pass; explicitly left unverified.
- Any backend volume/activity, Exit Reliability, or IV/premium capability (C-3, C-5) — not built.
- A cheap underlying-only synchronization path distinct from option-chain acquisition (C-4) — not built; measured as pressure only.
- The six-source model, recency windows, trade-history reconstruction, weighted scoring, watchlists, `ww ls` — explicitly not implemented.

---

## 5. Product acceptance question

The experiment's evidence (real resolved set, overlap, timing, outcomes, exit — recorded separately in the experiment evidence) is to be read against:

> Does an experienced operator look at this result and think, "Of course these are the symbols you'd fetch by default"?

The honest expectation, given A-1/C-2 (no owned default) and the deliberately awkward seed entries (TQQQ, SOXL), is that the answer is **probably not yet** — which is the point: the experiment is built to falsify the provisional default, not to flatter it.
