# WW Fetch / API v2 Investigation Snapshot — 2026-10-05

Status: investigation snapshot; not Product ratification and not implementation authorization.

Repository anchor at persistence: `main` = `2c49b26b209eb4cca1162e07d7dd0bc9677d68d0`.

This snapshot records the state of the Principal/ChatGPT/Codex investigation into experimental `ww fetch`, provider acquisition behavior, the existing backend API boundary, and the emerging case for a capability-oriented API v2. It intentionally does not resolve the currently in-flight Codex investigation into the final semantic boundary of `ww fetch`.

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

CURRENT STATE: PL-OPS-10 performance evidence has exposed a broader v1 API coupling; API-v2 semantic reconciliation is the emerging direction, with the `ww fetch` boundary currently under Codex investigation.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Complete the read-only `ww fetch` semantic-boundary investigation, including current provider capability reality, before designing v2 API resources.
