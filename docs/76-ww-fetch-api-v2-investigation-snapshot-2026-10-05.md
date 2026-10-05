# WW Fetch / API v2 Investigation Snapshot — 2026-10-05

Status: investigation snapshot, updated after the October 5 Principal Product decision. Canonical Product authority is `PL-CLI-01` in `docs/parking-lot-10.md`; this snapshot is not implementation authorization.

Repository anchor at persistence: `main` = `2c49b26b209eb4cca1162e07d7dd0bc9677d68d0`.

This snapshot records the Principal/ChatGPT/Codex investigation into experimental `ww fetch`, provider acquisition behavior, the existing backend API boundary, and the case for a capability-oriented API v2. Sections 1–19 preserve the investigation state before the Principal's subsequent Product decision; Section 20 records that decision and the remaining boundary.

## 1. Starting point: experimental `ww fetch`

`ww fetch` remains experimental. Its mature Product semantics have not been ratified.

The experiments to date have primarily made spot/held-price observations Principal-visible. That is evidence about the emerging command, not a final declaration that `fetch` means price-only.

The accepted experimental direction has emphasized small, composable CLI operations. Explicit symbol operands replace the default selection. Bare `ww fetch` experimentally resolved last-declared monitored symbols union a fixed seed. The preliminary bare-fetch slice was accepted as an experiment and then frozen pending further Product learning.

A 14-symbol specimen exposed a synchronous completion problem: the CLI returned `NOT_COMPLETED` against the existing 20-second backend wait while backend acquisition continued and eventually committed the requested symbols.

## 2. Quote batching feasibility

Codex investigated whether provider calls could batch symbols rather than acquire them sequentially.

Finding: quote batching is feasible as a provider transport optimization, but the option-expiration and option-chain endpoints used by Wheelwright are not equivalently batchable.

Tradier's quote API supports multiple comma-separated symbols, with POST documented for larger symbol sets. A read-only Production probe returned all 14 specimen quotes in one HTTP 200 response in 327 ms with a 6,942-byte response.

Important provider behavior was established:

- HTTP 200 does not imply complete symbol success.
- A mixed valid/invalid quote request returned valid quote objects plus `unmatched_symbols`.
- An all-invalid request also returned HTTP 200 with unmatched symbols and no quote objects.
- Therefore any batch implementation must reconcile requested identities against returned identities and unmatched symbols; positional inference or treating HTTP success as complete success would be untruthful.
- Tradier documents Production market-data limiting in requests/minute, not symbols/minute. Current evidence supports treating a multi-symbol quote call as one provider request, while the provider's Used/Available headers remain unsuitable as an authoritative admission ledger.

No implementation was authorized.

## 3. Measured 14-symbol targeted acquisition

The same 14 symbols from the October 4 specimen were explicitly fetched against the running Production backend on October 5 during regular-session acquisition. The backend was already consuming its 119-start provider window.

Measured targeted cycle:

| Component | Time | Share |
|---|---:|---:|
| Provider admission waits | 39.40 s | 66.8% |
| Provider HTTP time | 18.51 s | 31.4% |
| Other worker/normalization/store time | ~1.08 s | ~1.8% |
| Total targeted cycle | 58.99 s | 100% |

The request also waited approximately 10 seconds behind scheduled acquisition before its first provider call. The CLI returned `NOT_COMPLETED` after approximately 20.9 seconds with no per-symbol records. The backend continued and committed all 14 symbols roughly 69 seconds after invocation.

Provider topology for the targeted trace:

- 113 HTTP 200 responses
- 99 option-chain calls
- 14 quote calls
- 0 expiration calls

Chain work accounted for 17.65 seconds of HTTP time plus 38.08 seconds of provider-admission wait: 55.73 seconds directly attributable to chain requests.

Quote work accounted for only 0.86 seconds HTTP time plus 1.32 seconds direct admission wait.

The largest single admission wait was 19.62 seconds on a TQQQ chain request.

The provider observer showed contiguous measurement sequences for all 113 calls in the run.

Conclusion: the observed regular-session delay was dominated by quota admission for a large sequential option-chain surface, followed by chain HTTP time. Local processing was negligible by comparison. Quote batching may still be a valid transport optimization, but the measured run does not support treating it as the solution to the 20-second completion problem.

## 4. Why there were 99 chain calls

Codex accounted for the entire 99-call chain surface.

The current targeted path is conceptually:

`ww fetch` -> v1 targeted `POST /api/evidence/refresh` -> `forceAcquireSymbols` -> serial per-symbol `acquireSymbolTiered` -> `acquireAllEligibleChains`.

For the 14-symbol specimen, the 99 chain calls were:

- 14 primary expirations
- 85 additional known eligible expirations
- no demonstrated retry
- no duplicate symbol/expiration pair
- no accidental second pass

The expiration surface was the complete known eligible 7–45 DTE surface. The primary expiration is selected nearest 21 DTE. Stored expiration lists were already available, explaining the zero expiration-discovery calls.

The 99 calls therefore were not an implementation accident. They were the consequence of the current full Decision-surface acquisition behavior.

## 5. Full Decision-surface behavior is legitimate

The 85 secondary chains are not waste merely because `ww` did not visibly need them.

Accepted `PL-EVID-07` Product evidence established that non-primary expirations can materially affect recommendation quality and selection. Wheelwright therefore intentionally acquires all eligible 7–45 DTE expirations for the full Decision evidence surface.

That Product finding should not be undone as a performance shortcut.

The important distinction is:

- the full 7–45 DTE surface is legitimate Product behavior;
- it has not been established that every experimental `ww fetch` invocation should implicitly request that behavior.

A primary-only hypothetical would have reduced the measured chain surface from 99 to 14, but that would change the meaning of the existing shared targeted-refresh capability and could alter candidate selection, Decision coverage, visible age, and provenance. No such change is authorized.

## 6. Architectural diagnosis: v1 is workflow-oriented

The investigation exposed a deeper API-boundary issue.

The existing backend API grew closely around specific web-client workflows. In particular, targeted `/api/evidence/refresh` is not a narrow acquisition primitive. For selected symbols it invokes the existing per-symbol acquisition path, attempts the complete known Decision-eligible chain surface, persists evidence, and forces publication.

That behavior is coherent for Console/Deployment consumers.

It is broader than the narrow Principal-visible behavior explored so far through `ww fetch`.

Thus the observed amplification:

14 explicitly requested underlyings -> 113 provider requests -> 99 chains + 14 quotes

is best understood as a client/API semantic mismatch, not simply a slow loop.

The design direction emerging from the investigation is:

- small, composable CLI commands;
- small, composable backend capabilities;
- side effects should generally be avoided unless they are inherent and predictable consequences of the requested capability;
- side effects with material performance or scalability impact deserve particular scrutiny;
- capability scope and approximate cost class should be reasonably inferable from explicit intent;
- backend capabilities should remain domain-meaningful rather than exposing microscopic provider mechanics.

## 7. One API, many clients

The architectural direction is not to create a special CLI backend.

The desired model is one common Wheelwright API serving multiple clients:

- `ww` as the first proving client for capability-oriented composition;
- the web client initially remaining on coherent v1 behavior;
- later web-client migration toward the same capability model;
- future clients consuming the same semantic API.

`ww` is useful as an architectural probe because Unix-style composition makes hidden coupling and surprising side effects visible.

The web client is a future migration/proving client: a valid v2 model must be capable of reproducing its legitimate richer workflows without requiring a separate private semantic API.

## 8. Candidate v2 direction, not yet a contract

The Principal and investigators have identified a plausible need for an API v2 rather than progressively deforming v1.

The semantic intent would be:

- preserve v1 while it serves the current web client and accepted Product behavior;
- define v2 around general-purpose Wheelwright capabilities;
- use `ww` first to pressure-test those boundaries;
- later migrate web workflows onto v2 compositions where appropriate.

This is a semantic version boundary first. Concrete URI versioning such as `/api/v2` has not been selected.

Candidate capability categories surfaced by the read-only API inventory:

1. observe underlying evidence;
2. acquire explicitly scoped chain evidence under backend validation/policy;
3. refresh the complete Decision-eligible surface.

These are investigation candidates, not selected routes/resources.

The backend should continue to own provider selection/admission, authority fencing, persistence, provenance, expiration policy where applicable, and publication semantics. Clients should compose domain capabilities, not reconstruct Tradier mechanics.

## 9. Existing v1 capability inventory

Read-only inventory identified these current boundaries:

- `POST /api/evidence/observe`: declares observation demand, replacing monitored symbols and, when supplied, held-expiration declarations. It schedules future acquisition rather than completing immediate acquisition.
- `POST /api/evidence/refresh`: with no symbols performs whole-cycle recovery; with symbols forces full eligible-chain acquisition for those symbols, persists evidence, and forces publication.
- `GET /api/evidence/quotes`: side-effect-free read of held prices, but price/timestamp are derived from the primary-chain row.
- `GET /api/evidence/snapshot`: governed Decision evidence publication consumed by web recommendation surfaces.

The key coupling is that current immediate acquisition and current held-price representation are tied to option-chain acquisition.

## 10. Price is not currently first-class independent evidence

A concrete obstacle to narrower capability design was identified.

Today, `TradierAdapter.getOptionsChain` obtains a quote while constructing normalized chain evidence. The store's held-price read derives the held price from the persisted primary-chain row.

Therefore a provider quote request by itself does not currently create the same authoritative Wheelwright held observation.

This is an implementation/storage-model fact, not yet a Product requirement.

If future semantic reconciliation concludes that underlying observations deserve independent capability/evidence status, the model must settle at least:

- observation identity;
- provider/environment provenance;
- observed-at semantics;
- persisted-at semantics if distinct;
- freshness;
- authority epoch/fencing;
- retained-old-value behavior after failed acquisition;
- relationship between independent underlying observations and spot values embedded in chain evidence.

No persistence design has been selected.

## 11. What has NOT been decided about `ww fetch`

It is important not to harden experimental behavior into Product semantics prematurely.

Not decided:

- that `fetch` means price-only;
- that `fetch` can never involve option evidence;
- that `fetch` should pull a primary chain;
- that `fetch` should expose provider-native operations;
- that `fetch` is a universal acquisition verb;
- that full Decision-surface acquisition belongs or does not belong under some explicitly scoped future form of `fetch`;
- final CLI syntax;
- final v2 resource boundaries.

Principal intuition is that `ww fetch` may naturally encompass substantially more than spot, while complete option chains probably do not belong inside the unqualified command. That intuition is currently being tested rather than ratified.

## 12. Current in-flight semantic investigation

Codex is currently investigating the rigorous boundary of experimental `ww fetch` before v2 APIs are designed.

The investigation is intended to derive a classification rule, not merely an allow-list.

It is testing dimensions including:

- observation versus derived interpretation;
- explicitly requested subject/entity scope;
- cardinality amplification;
- explicit evidence scope;
- predictable cost class;
- legitimate versus surprising side effects;
- acquisition versus read versus derive;
- backend domain-policy ownership;
- composability;
- provider portability.

Option chains are the hard boundary test, with separate treatment of:

- complete Decision-eligible chain surface;
- one explicitly identified underlying + expiration chain;
- one explicitly identified option contract.

Expiration discovery is another boundary test.

## 13. Provider reality is a first-class design input

The semantic model must be durable across providers, but it must also respect the acquisition substrate.

The current Codex investigation therefore includes an inventory of current provider-native capabilities and official provider documentation.

For each relevant provider capability it will distinguish:

1. provider-native acquisition unit;
2. Wheelwright evidence unit;
3. client capability.

These units are not assumed to be identical.

Provider considerations include:

- batching;
- natural request subject;
- response cardinality;
- rate-limit/request cost;
- partial-success behavior;
- unmatched symbols;
- timestamps/provenance;
- whether results expand into related entities;
- whether Wheelwright currently normalizes/persists the evidence independently.

The known 14-symbol quote probe is useful evidence because the provider can obtain many underlying observations in one bounded request. This supports operational feasibility of a narrow underlying-observation capability but does not by itself define `fetch`.

Likewise, chain acquisition naturally expands underlying + expiration into many contracts. That expansion is relevant to the semantic boundary but does not make chains invalid merely because they are expensive.

The desired abstraction should permit provider adapters to optimize transport without changing client semantics.

## 14. Emerging architectural principles under consideration

The investigation currently supports, but has not yet formally ratified, the following direction:

- one API, many clients;
- v1 remains intact while v2 is reconciled;
- v2 should be capability-oriented rather than web-workflow-oriented or CLI-specific;
- acquisition scope should be explicit;
- narrow capabilities should not silently invoke broader evidence workflows;
- expensive cardinality expansion should correspond to explicit Product intent;
- legitimate evidence commits may naturally persist evidence, update provenance/freshness, and cause publication;
- changing monitoring/demand declarations or invoking broad unrelated evidence acquisition are qualitatively different side effects and should not occur implicitly;
- provider transport optimization belongs below stable Wheelwright client semantics;
- full Decision-surface refresh remains a legitimate capability even if it ultimately becomes explicit rather than implicit in narrower acquisition;
- API semantics should be defined before concrete v2 routes/schemas/controllers;
- current provider behavior informs API design but must not define Wheelwright's domain model.

These remain subject to the current fetch-boundary investigation and subsequent Principal reconciliation.


## 15. Selected v2 design constraints: authoritative OAS and security plumbing

Two additional architectural constraints have been selected for the fresh v2 boundary. These are design constraints for v2 reconciliation; they do not authorize implementation or select concrete mechanisms.

### 15.1 Authoritative OpenAPI Specification

API v2 MUST expose and maintain an OpenAPI Specification (OAS) as part of its authoritative interface contract.

The specification must describe the actual runtime contract rather than being documentation generated as an afterthought. V2 API design must remain faithfully representable in OAS, including request and response schemas, status/error shapes, parameter semantics, optionality/nullability, and applicable security requirements.

The intended design order remains:

Product semantics -> capability boundaries -> HTTP semantics -> OAS representation -> implementation.

OAS does not define the Wheelwright domain model and must not drive capability decomposition merely to suit tooling. It is the machine-readable representation of the API contract selected after the semantic boundary is understood.

This constraint complements PL-API-02's machine-readable-contract concern while remaining distinct from the unresolved v2 capability-granularity work.

### 15.2 Security designed in, enforcement deployment-aware

API v2 MUST include a security boundary from inception rather than being designed as an unsecured API to be retrofitted during cloud migration.

Security architecture and deployment-specific enforcement are distinct concerns.

Conceptually, requests should pass through:

request -> authentication/identity establishment -> authorization policy -> v2 capability.

The capability layer should therefore be designed to receive an established caller identity/authority context rather than depending directly on a specific cloud provider's security mechanism.

Because Wheelwright currently runs locally and the future Render/cloud identity mechanism is not yet available, localhost MAY use an explicitly configured trusted-local authentication mode. That mode should establish a well-known local principal through the same security boundary used by secured deployments rather than bypassing security plumbing entirely.

Deployed environments MUST fail closed unless an approved authentication mechanism is configured.

A generic production-capable `SECURITY=false` bypass is not the desired model. Local development bypass semantics should be explicit, environment-constrained, and incapable of silently becoming the deployed security posture.

The production authentication mechanism is NOT selected by this constraint. Render-specific facilities may later supply or participate in identity/authentication, but v2 semantics should not depend on Render.

Authorization boundaries should inform capability design where different capabilities may require different authority. OAS should represent the real secured API contract and applicable security requirements even while localhost satisfies that contract through its trusted-local identity mode.

This pulls forward a security prerequisite previously associated with the cloud-migration Product work without requiring cloud migration itself to happen first.


## 16. Related but distinct API work

`PL-API-02` concerns machine-readable HTTP contracts and response-boundary typing. The persisted HTTP-boundary survey is adjacent evidence.

Capability granularity and v2 semantic boundaries are a separate architectural question.

Do not treat work on machine-readable contracts as having already selected v2 capability semantics.

## 17. Deferred optimization findings

Quote batching remains a potentially useful transport optimization.

For the measured 14-symbol run, batching 14 quote misses could reduce quote HTTP starts from 14 to 1, saving up to 13 provider starts. However:

- the run contained 99 chain calls;
- chains consumed 55.73 seconds of directly observed admission + HTTP time;
- quote calls consumed only 2.18 seconds directly;
- indirect effects on quota-window geometry remain unmeasured.

Therefore quote batching is recorded as feasible but is not the current architectural priority.

Likewise, simply increasing the 20-second synchronous timeout is not supported as the next move. The timeout symptom exposed the broader semantic/API coupling and should not be papered over before the capability boundary is understood.

## 18. Current interpretation

The investigation has moved through these stages:

1. `ww fetch` exposed a >20-second completion symptom.
2. Quote batching was investigated as a possible performance solution.
3. Measurement showed the dominant surface was 99 chain calls, not 14 quote calls.
4. The 99 calls were fully explained as deliberate full 7–45 DTE Decision evidence.
5. Therefore the issue is not accidental chain acquisition.
6. The mismatch is that experimental `ww fetch` reused a broad web-workflow-oriented v1 backend capability.
7. This exposed the need to investigate a general-purpose capability-oriented API boundary.
8. A semantic v2 is now being considered: `ww` first, web migration later, one API for many clients.
9. Before v2 APIs are designed, the semantic boundary of `ww fetch` must be derived rigorously and tested against actual provider capabilities.

## 19. Authority state

This snapshot records evidence and emerging design direction. It does not authorize:

- API v2 implementation;
- v1 endpoint changes;
- `ww fetch` semantic changes;
- persistence changes;
- quote batching implementation;
- scheduler changes;
- concurrency changes;
- timeout changes;
- DTE/freshness/cache-policy changes;
- provider-profile changes.

The concurrent unrelated investigation explains the dirty shared worktree observed during read-only Codex work. Its changes are not evidence of a problem in this investigation and must remain untouched.

## 20. Principal-selected fetch boundary and close of v1 archaeology

The Principal selected the following **mature Product boundary**, recorded canonically under `PL-CLI-01` in `docs/parking-lot-10.md`:

> `fetch` acquires a declared family of external market observations for named subjects. Unqualified `fetch SYMBOL` defaults to the direct quote-observation family. It does not silently traverse additional evidence units selected by Wheelwright policy.

This is broader than “price only”: a quote observation may carry last, bid/ask, volume, source times, prior close, and instrument metadata where available. It is narrower than “all raw market data related to a symbol.” A named chain can legitimately contain many contracts; that **cardinality within an evidence unit** differs from silently discovering dates and traversing many policy-selected chain units. A complete 7–45 DTE Decision surface retains its accepted `PL-EVID-07` Product meaning and remains an explicit higher-order workflow. Whether named calendars, chains, and option-contract observations eventually share the CLI `fetch` spelling remains open.

Acquisition, held-evidence read, and derivation are separate acts. An evidence commit may inherently persist provenance and cause publication; it does not silently change observation demand, monitoring declarations, held-expiration declarations, or Decision workflow scope. The CLI is a projection of common Wheelwright capabilities, not the definition of the API; web and future clients may project the same canonical evidence differently.

The Principal also selected an acquisition-policy refinement: ordinary fetch **may reuse** evidence the backend judges acceptable for its declared family and context; an explicit force intention would **require upstream reacquisition** of that family. The proxy/cache analogy is useful for reasoning about reusable held evidence versus re-contacting the external authority, but HTTP cache freshness alone cannot confer Wheelwright domain acceptability. Syntax, acceptance criteria and failure semantics remain design questions. Current v1 targeted “force” bypasses due/session gates while still allowing response-cache hits; it is not the future force definition.

The short [Tradier capability sheet](cli/tradier-market-data-capabilities-2026-10-05.md) is the last bounded provider inventory before v2 reconciliation. It distinguishes provider-native units from current Wheelwright evidence units. Official docs and the prior Production probe establish multi-symbol quote acquisition, while documented expirations and chains accept one underlying or one underlying-plus-expiration respectively. Provider batching remains below stable Wheelwright semantics.

V1 acquisition archaeology is now sufficient for this boundary question. `PL-API-03` owns the common capability-oriented API intake; [Doc 77](77-api-v2-architectural-guardrails.md) carries the already ratified cross-cutting v2 guardrails, including authoritative OAS and security from inception. The first unresolved semantic pressure is canonical underlying-quote evidence: the current held price derives from a primary-chain row, so quote identity, time, provenance, failure retention, and relationship to chain-embedded spot must be reconciled before concrete v2 design. The existing experimental `ww fetch`, coherent v1 refresh, and `PL-API-02` state are unchanged by this decision.

CURRENT STATE: `ww fetch` Product boundary selected under `PL-CLI-01`; v1 acquisition archaeology sufficient; `PL-API-03` remains INTAKE and Doc 77 guardrails are ratified; no v2 implementation authorized.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Reconcile `PL-API-03` around canonical underlying-quote evidence under the selected fetch boundary and Doc 77 guardrails.


## 21. Principal reconciliation — canonical underlying-quote evidence

A bounded Codex semantic reconciliation of canonical underlying-quote evidence was reviewed by the Principal on October 5, 2026. The Principal selected the following semantic decisions for `PL-API-03`. These decisions remain upstream of HTTP routes, OAS schemas, persistence design, and implementation.

### 21.1 Separate subject, observation, provenance, and acquisition result

V2 quote semantics MUST distinguish:

- **quote subject** — the identified market-data security in the direct quote-observation family;
- **quote observation** — one subject-verified bundle of direct quote facts reported by an external source;
- **observation provenance** — source/environment/authority/acquisition context and the distinct times actually known for the observation and its fields;
- **acquisition result** — what happened when Wheelwright attempted to satisfy an acquisition request.

An observation is evidence of what a source reported. It is not itself a freshness/admissibility verdict and does not become a failed observation when a later acquisition attempt fails.

Equal numeric values from separate upstream acquisitions do not make them the same observation.

### 21.2 Successful direct quote and field truth

A direct quote observation is successfully acquired when the provider returns a **subject-verified observation containing at least one direct market-price fact from the quote family**.

`last` is NOT mandatory for observation success. A valid bid and/or ask may therefore constitute a direct quote observation even when `last` is absent.

Direct facts retain their own meanings. In particular:

- `last`, bid, ask, close, and previous close are distinct facts;
- absence is distinct from zero;
- a missing `last` MUST remain absent;
- close MUST NOT be relabeled or substituted as `last`.

Whether the facts present in a valid quote observation are sufficient for a downstream calculation or domain capability is that consumer's evidence-admissibility concern, not part of quote-observation identity or acquisition success.

Provider-returned instrument metadata alone, without a direct market-price fact, does not constitute successful acquisition of a price-bearing direct quote observation.

### 21.3 Time and provenance truth

Field-specific source times MUST remain associated with the facts they describe where known. Trade, bid, and ask times MUST NOT be collapsed into one fictitious quote-bundle market timestamp.

Wheelwright receipt time, commit time, and acquisition-result time are distinct from source market-event times. Missing source event time remains unknown; receipt/commit/container time MUST NOT be promoted into source observation time.

A reused held observation retains its original evidentiary provenance and clocks. New upstream acquisition that returns unchanged numeric values is still a new acquisition/observation if accepted.

The existing authority/fencing invariant remains applicable: a superseded acquisition authority cannot publish or commit its result as current-authority evidence. Retained prior evidence preserves the provenance/environment under which it was originally acquired.

### 21.4 Acquisition-result truth and retained prior evidence

Observation truth and request-fulfillment truth are separate.

Therefore:

- a successful new upstream quote may become new held evidence and yields a newly-acquired result;
- a held observation may satisfy an ordinary acquisition request only when the direct-quote acquisition-reuse policy permits it;
- explicit forced upstream reacquisition requires an actual upstream acquisition attempt rather than merely bypassing scheduler gates;
- upstream failure with no held quote yields failure and no invented observation;
- upstream failure while prior quote evidence exists leaves that prior observation unchanged and yields a truthful failed-reacquisition result with retained prior evidence;
- batch acquisition MUST reconcile outcomes by requested subject identity, not HTTP status or response position.

A retained prior observation does not convert a failed reacquisition into successful fulfillment.

### 21.5 Acquisition reuse and evidence admissibility are different policy verdicts

The earlier word **reuse** was overloaded during reconciliation. The selected vocabulary and boundary are:

- **acquisition reuse** — whether a held direct-quote observation may satisfy a new direct-quote acquisition request without contacting the upstream provider;
- **evidence admissibility** — whether a particular downstream capability/consumer may use an observation for its own domain purpose.

These verdicts are independent even though they may inspect some of the same evidence properties.

V2 initially defines **one ordinary direct-quote acquisition-reuse policy plus explicit forced upstream reacquisition**. The direct-quote acquisition capability MUST NOT vary its ordinary reuse semantics merely because the caller happens to be CLI, web, Decision, screening, or another imagined request purpose.

Downstream capabilities independently define evidence-admissibility requirements when their Product semantics require them. A quote may be valid evidence yet inadmissible for a particular calculation; conversely, historical/replay behavior may intentionally consume evidence that would not satisfy a current ordinary acquisition request.

No generalized request-purpose taxonomy is authorized absent demonstrated Product need.

This establishes the composition boundary:

> **Acquisition policy answers whether held evidence can satisfy an acquisition request. Consumer policy answers whether evidence can satisfy a domain decision.**

The initial ordinary direct-quote acquisition-reuse criteria were subsequently selected in §22. They do not alter this acquisition-reuse/evidence-admissibility boundary.

### 21.6 Legacy chain-derived held price is not canonical direct-quote evidence

Current v1 chain-derived held-price state remains compatibility evidence with its honest, limited provenance.

It MUST NOT be silently promoted into a canonical direct-quote observation and MUST NOT satisfy canonical direct-quote acquisition reuse unless independent direct-quote provenance can actually be recovered.

A direct quote and a chain-embedded spot are distinct evidence claims even when their numeric values match. Chain acquisition time does not establish the age of its embedded quote.

Both claims may coexist. Neither silently overwrites or timestamps the other.

### 21.7 Existing Decision semantics remain unchanged

Existing Decision behavior continues to consume its chain-bound spot under its current accepted contract until Decision's own evidence contract is explicitly reconciled.

The canonical v2 direct-quote work does not silently substitute direct-quote evidence into Decision, alter Decision replay semantics, or reopen the accepted full 7–45 DTE Decision surface.

Any future Decision change selecting direct-quote inputs requires its own explicit Product/evidence reconciliation.

### 21.8 Authority boundary

This reconciliation selects semantic truth for canonical direct-quote evidence. It does NOT yet select or authorize:

- v2 routes or HTTP methods;
- OAS schemas or JSON field names;
- persistence tables/migrations;
- Java classes;
- quote batching implementation;
- CLI output or exact `--force` syntax;
- implementation or configuration representation of the selected ordinary acquisition-reuse policy;
- changes to v1 chain/Decision behavior;
- implementation.

CURRENT STATE: Canonical direct-quote subject/observation/provenance/acquisition-result semantics are Principal-selected; direct-quote success and legacy-chain/Decision boundaries are selected; acquisition reuse is explicitly separated from downstream evidence admissibility.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Reconcile the single initial ordinary direct-quote acquisition-reuse policy from actual Wheelwright requirements, provider/session realities, and existing authority invariants. Do not introduce a generalized request-purpose policy framework absent demonstrated Product need.

## 22. Principal reconciliation — initial direct-quote acquisition-reuse policy

The Principal selected this policy on October 5, 2026, after the bounded ordinary-reuse investigation. Section 21's quote-evidence semantics and Doc 77's cross-cutting v2 guardrails remain fixed. This section selects **backend-owned configurable acquisition policy with Product defaults**, not runtime configuration syntax, request syntax, HTTP/OAS design, or implementation.

### 22.1 Fixed semantics versus configurable policy

The following are **fixed v2 semantic invariants**, never configuration or request-policy knobs: subject/observation/provenance/acquisition-result separation; observation truth versus request-fulfillment truth; acquisition reuse versus downstream evidence admissibility; distinct last/bid/ask/close/previous-close facts and their actual source times; no fabricated last, source time, canonical direct quote from legacy chain spot, or success from retained prior evidence after failed reacquisition; per-subject batch outcomes; actual upstream attempt for force; and unchanged Decision chain-bound consumption until separately reconciled. Section 21 provides their full authority and meaning. Configuration and request overrides MUST NOT weaken them.

The initial **configurable acquisition-policy parameters** are maximum active-session contact age, completed-session reuse enablement, and explicit off-hours provider-contact enablement. Provider batch sizing and demonstrated provider/environment operational limits may also be configured beneath stable semantics. Effective policy follows **explicit permitted request override → deployment/operator configuration → Product-defined default**. Only overrides with demonstrated operator meaning are candidates for a client contract; force is the presently selected semantic example. No generic policy language, speculative request-purpose taxonomy, or automatic CLI flag per configuration value is selected. The backend owns the policy for all clients.

### 22.2 Ordinary active-session reuse

The initial Product default maximum successful-upstream-acquisition/receipt contact age is **60 seconds**. The Product selected this value independently; its coincidence with the existing Tradier adapter's 60-second quote-cache TTL confers no authority on that implementation TTL.

During an active regular-observation phase, an ordinary request may be fulfilled from a backend-selected canonical held direct-quote observation only if its identity/provenance are unambiguous, it satisfies §21's direct-quote evidence criteria, it was successfully acquired after the applicable provider feed's regular-observation phase became usable, and its successful upstream acquisition/receipt age is within the configured maximum. A newly usable regular-observation boundary triggers reevaluation even when the prior observation is younger than the limit. Source trade/bid/ask, commit, cache, container, and generic quote times cannot substitute for the upstream acquisition/receipt clock. The contact-age parameter governs **acquisition reuse only**; it is not a universal freshness or downstream admissibility rule.

### 22.3 Ordinary closed-session reuse

Completed-session reuse is configurable and **enabled by Product default**. While the market remains closed, an observation actually acquired during the latest completed regular session may fulfill an ordinary request if it remains the backend-selected canonical held quote and no later session/feed-authority boundary makes selection invalid or ambiguous. This includes overnight, weekend, and holiday closure. No near-close acquisition requirement is imposed; an intraday last trade MUST NOT be labeled a closing price. All original field source times, acquisition/receipt time, provider, environment, and authority provenance remain intact. Wall-clock passage during the same closed period does not itself end this reuse eligibility. At the next usable regular-observation boundary, active-session policy governs instead.

An observation first acquired through an explicit **off-hours** upstream request remains valid evidence with its true context, but it does not satisfy the specific “acquired during the latest completed regular session” reuse condition merely because its returned values may describe that session. This follows from the selected condition; no separate off-hours-observation reuse mode is selected. Disabling completed-session reuse prevents fulfillment through this rule but neither deletes nor invalidates held evidence.

### 22.4 Explicit off-hours acquisition and force

Explicit off-hours upstream contact is configurable and **enabled by Product default**. Routine/scheduled acquisition remains governed by its own session gate. For an explicit ordinary direct-quote request, resolve the subject set, evaluate ordinary reuse per subject, then attempt upstream acquisition for unresolved subjects when the effective provider-contact policy permits. A subject-verified acceptable response becomes new evidence with its actual provider facts, source times, acquisition time, environment, and provenance. An off-hours response is never represented as active regular-market evidence. If contact is disabled, blocked, unavailable, or fails, report the distinct non-fulfillment reason and retain prior evidence separately; exact HTTP/CLI grammar remains future work.

Force bypasses acquisition reuse and requires an **actual upstream attempt**. It does not mean only “ignore the age limit” or “bypass scheduler gates.” If another selected provider-contact restriction blocks the attempt, force reports that restriction rather than succeeding from prior evidence. No additional request override of the off-hours contact restriction is selected here.

Provider availability does not itself change reuse eligibility. An eligible held observation may be reused during an outage; an ineligible one does not become eligible because upstream is unavailable. Observation validity, ordinary acquisition-reuse eligibility, downstream evidence admissibility, and provider availability remain four distinct verdicts.

### 22.5 Multi-subject execution and authority

Doc 77's ratified rule is **determine semantic work first; batch compatible upstream work second**. After per-subject reuse evaluation, the backend SHOULD batch remaining compatible provider quote work when possible, including for an explicit or resolved default subject set. Configured/provider limits may require multiple requests. Transport grouping never changes evidence identity, authority fencing, stable API semantics, or independent per-subject outcomes. A provider HTTP 200 is not batch-wide evidence success; unmatched, missing, failed, retained-prior, newly acquired, reused, and no-evidence subjects remain distinct. Provider request count and batch shape are not stable client promises.

### 22.6 Authority and next boundary

These selected Product defaults are configurable acquisition-policy defaults; §21 and the fixed invariants above are not configurable. This reconciliation changes no current v1 behavior, Decision evidence contract, provider profile, runtime setting, CLI, or persistence. It authorizes no v2 route, method, OAS schema, storage design, Java class, speculative CLI policy flag, batching implementation, or Kiro handoff. The ordinary direct-quote acquisition/reuse semantics are sufficiently selected for the next v2 capability-boundary reconciliation; concrete contract and implementation design remain separate later work under Docs 77–78.

CURRENT STATE: Canonical direct-quote evidence semantics and the initial session-aware ordinary acquisition-reuse policy are Principal-selected; the 60-second live contact-age default, completed-session reuse default, explicit off-hours contact default, force meaning, and Doc 77 batch-if-needed guardrail are established. No v2 implementation is authorized.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Reconcile the first common v2 direct-quote capability boundary under the selected semantics and Docs 77–78 before HTTP/OAS design.
