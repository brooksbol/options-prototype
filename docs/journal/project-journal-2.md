# Options Prototype — Project Journal, Continuation 2

> Logical continuation of `docs/journal/project-journal.md`.
>
> The original project journal is intentionally append-only and has grown large. This continuation preserves the same authority, purpose, chronology, and journal rules. Future context reconstruction should treat `project-journal.md` and `project-journal-2.md` as one chronological project-memory stream.

---

## 2026-09-03 — Provider Failover Experiment, Four-Actor Learning, Implementation-Standards Discovery, and Architecture-to-Code Coherence

### Context

This entry preserves the why-state and conversation-level learning from the September 2–3 provider-failover work and the surrounding architectural discussion. It is intentionally broader than the failover implementation itself. The most important outcome of the session was not only that Wheelwright recovered production-provider operation after Tradier credentials were restored; the session also exposed a deeper concern about the implementation architecture, the way Java is being written, the cost of architectural rediscovery, the role of Kiro/Codex/ChatGPT in the engineering process, and the need to make correct implementation behavior both obvious and easy.

The Principal had begun reading the Java implementation directly. This was a meaningful change in vantage point: prior work had often evaluated behavior, architecture documents, tests, and runtime evidence, whereas this discussion focused on whether the Java code itself *expressed* the intended architecture in a way an experienced Java developer would recognize as coherent.

The Principal's reaction was negative. Some of the code read as procedural machinery expressed in Java: mutable lifecycle state, state-machine transitions, flags, control variables, and broad orchestration objects carrying too many concerns. The concern was not that the code necessarily failed tests or that the observed behavior was wrong. The concern was that the implementation shape could be technically correct while still making future change unnecessarily expensive and architecture unnecessarily difficult to see.

This matters because Wheelwright is increasingly being built and changed by AI agents. If the repository does not make the correct implementation shape obvious, agents repeatedly reconstruct architectural intent from journals, ADRs, old conversations, and code archaeology. That consumes time, Kiro credits, review cycles, and Principal attention. The session therefore connected implementation architecture directly to engineering throughput and cost.

### Provider failover experiment — what happened

The immediate implementation thread was `PL-PROV-FAILOVER`: automatic production-provider degradation and recovery while preserving provider isolation, evidence provenance, and operator-visible evidence semantics.

The architectural intent had converged on several important boundaries:

- Wheelwright asks for semantic evidence work; a provider privately determines how to obtain it.
- Provider identity is legitimate for provider control, provenance, diagnostics, audit, export, and governed analysis, but normal domain behavior should not branch on provider identity.
- Failover changes evidence authority, not Wheelwright's normal operating semantics.
- Sandbox is a degraded evidence regime, not a second normal operating mode.
- Provider-local mechanics such as Tradier pacing, recovery probing, credentials, caches, and the approximate +15-minute delayed-data behavior belong below the provider/evidence boundary.
- Provider availability must remain independent from Market Session Model. A BLOCKED market session may block ordinary acquisition but must not prevent provider-control recovery evaluation.
- Recovery and restoration are different facts. Restoring production authority is not enough; operator-facing NORMAL requires usable normalized production evidence committed under the currently active production authority epoch.
- In-flight work must be fenced across authority transitions so stale work from an old authority cannot become current evidence after the boundary changes.

Implementation review found several real defects before the runtime experiment. Early versions could falsely boot NORMAL, fail to validate an active-but-unrestored production authority, potentially infer restoration from cache hits or string-level state, dead-end from suspended production recovery, and allow ordinary acquisition before verification. These were corrected before the final experiment.

The accepted failover implementation became commit `097844f` and ultimately converged to `main`. A temporary experiment branch had been created during the process, but this was later recognized as inconsistent with the Principal's delivery philosophy and deleted after the accepted commit reached `origin/main`.

### Delivery philosophy clarified

A major process correction occurred around release-state thinking.

The Principal's rule is:

> Every accepted change is intended to be production-ready. Environments provide progressively stronger evidence of readiness; they do not provide progressively weaker definitions of done.

Staging is valid and useful. What is rejected is the idea that a special branch makes incomplete work acceptable or that an approved change should remain stranded in an invented release state.

The preferred model is:

```text
change
→ PR / review boundary
→ CI/CD and mechanical evidence
→ approval
→ merge to main
→ main remains deployable
→ immutable artifact moves through staging / production
```

A commit SHA is immutable code identity. A PR is a review boundary. CI/CD provides mechanical evidence. Approval is authorization. `main` is accepted project state. Deployment history records where an accepted artifact ran. Branches are useful for concurrent development; they should not become invented lifecycle states such as "approved but not main," "safety copy," "experiment version," or "production candidate."

The durable invariant from this discussion is:

> Approved changes converge immediately to `main`. Deployment safety comes from verification, immutable artifact identity, rollback, and recovery — not from keeping approved code on special branches.

### Four-Actor Model learning

The session clarified the emerging Four-Actor Model:

- **Principal** — owns intent, authorization, acceptance/rejection, and consequential decisions.
- **Kiro** — architectural reasoning, experiment design, implementation/execution when designated, project-memory reconciliation, and integration with durable repository authority.
- **Codex** — adversarial/mechanical independent reviewer and falsifier; read-only by default unless explicitly handed execution.
- **ChatGPT** — independent review, challenge, synthesis, and cross-actor handoff.

The key discovery was that Codex had improved verification but had also displaced some of the speculative architectural conversation that had previously happened between the Principal, Kiro, and ChatGPT. Before Codex, prompts such as "what about this?" often produced useful architecture discovery. With Codex active, there was a tendency to route too much thinking into implementation-review mode.

The corrected split is:

```text
Exploration loop:
Principal ↔ Kiro ↔ ChatGPT
hypotheses, alternatives, consequences, architectural discovery
NO implementation authorization

Verification loop:
Kiro implementation
→ Codex adversarial inspection
→ ChatGPT reconciliation
→ Principal decision
```

Durable rule:

> Exploration does not authorize implementation.

Codex is most valuable as a falsifier after something concrete exists to inspect. It should replace speculative implementation review, not speculative architectural discovery.

### Shared-working-tree process defect

A concrete process failure occurred when Kiro and Codex ran Gradle concurrently against the same worktree/build directory. Shared daemon/test-result state was corrupted, including EOF/missing `in-progress-results-generic.bin` behavior.

Durable execution rule:

> Gradle execution is exclusive within a worktree. Independent executable verification must wait or use an isolated worktree/build environment.

More generally, only one actor should own implementation/execution in a shared working tree at a time unless isolation is explicit.

### Runtime experiment and provider recovery

The provider experiment began while Tradier production access was returning HTTP 401 and sandbox remained usable. This independently demonstrated that production and sandbox entitlements can fail separately.

The first armed runtime correctly entered degraded operation:

- production representative probe returned 401;
- sandbox representative probe returned usable market data;
- authority/fence transitioned to sandbox;
- evidence availability remained DEGRADED;
- ordinary acquisition remained blocked while the market session was BLOCKED;
- production recovery probes continued independently of Market Session Model.

An external observer/monitor persisted the bounded in-process recorder stream so event history could survive recorder eviction. The run accumulated enough events to overflow the 50k in-process ring, but the external durable files retained the early sequences. This also exposed an instrumentation-format weakness: sequence numbers are recorder-epoch scoped, yet raw event records do not carry recorder epoch on every event. Independent merging therefore requires external epoch context. This is a future instrumentation-format finding, not part of the failover implementation itself.

Tradier support subsequently advised regenerating the production token after account reactivation. The Principal installed a new production key. The experimental backend was restarted with the new credential.

The second recorder epoch then observed successful startup recovery against production:

- first production HTTP 200 about 1.75 seconds after recorder start;
- production remained `PRODUCTION_UNVERIFIED` until verification completed;
- no ordinary acquisition occurred before verification;
- three usable verification probes established production authority in roughly 64 seconds;
- first fresh production acquisition commit occurred roughly 4.4 seconds after verification;
- operator-facing evidence reached `PRODUCTION_ACTIVE / NORMAL` roughly 76 seconds after boot.

Important proof boundary:

> Startup verification and production restoration after an operator-installed credential plus restart were observed against production. Automatic in-process degraded→production failback and stale-work fencing were **not** naturally observed.

Thus startup restoration is production-proven. Live failback remains implementation- and test-proven but not naturally production-observed.

### Codex post-restart performance analysis

After credential recovery, Codex performed one final read-only analysis over saved observer/status artifacts. The result materially strengthened the provider-path understanding.

Over the longer deduplicated post-recovery segment (approximately 19:29:01–19:52:57 UTC):

- 2,776 completed provider requests;
- 2,776/2,776 HTTP 200;
- 100% transport result SUCCESS;
- 828 successful acquisition commits;
- 3 acquisition outcomes with no usable evidence;
- no HTTP/authentication/transport failures;
- maximum request-start concurrency = 1;
- no provider backoff;
- provider queue depth at the saved checkpoint = 0.

Observed request latency:

| Request | Count | Mean | Median | p95 | p99 | Max |
|---|---:|---:|---:|---:|---:|---:|
| Quote | 828 | ~103 ms | ~83 ms | ~193 ms | ~389 ms | ~705 ms |
| Chain | 1,945 | ~141 ms | ~106 ms | ~296 ms | ~618 ms | ~2.63 s |
| Expirations | 3 | ~272 ms | ~365 ms | ~367 ms | ~367 ms | ~367 ms |
| Overall | 2,776 | ~130 ms | — | — | — | ~2.63 s |

Observed pacing/admission behavior:

- approximately 116 provider requests/minute;
- configured ceiling = 119 request starts / trailing 60 seconds;
- roughly 97% utilization of configured request allowance;
- median admission wait = 0 ms;
- p95 = ~1.37 s;
- p99 = ~2.46 s;
- maximum = ~30.46 s;
- max concurrency at request start = 1.

The long maximum admission wait was consistent with a rolling-window boundary, not provider slowness or an accumulating application queue.

The durable performance conclusion is:

> Under the observed production workload, Wheelwright was admission-budget-bound, not provider-latency-, concurrency-, queue-, authentication-, or transport-failure-bound.

This is strategically important because it tells future work what **not** to optimize. Seeing single-flight concurrency of one could tempt an engineer or agent to add concurrency. The evidence argues against that optimization: at ~97% of the allowed request budget, higher concurrency cannot materially increase sustained throughput unless the governing provider allowance itself changes. It would mostly alter burst shape and add complexity.

The result independently reinforces the existing `PL-EVID-AGE` / roadmap G6-N1 direction: once the provider path is already consuming nearly all safely configured capacity, the more important question becomes **which evidence deserves that scarce capacity**, not how to create more provider traffic.

### Evidence-state semantics reinforced

The post-recovery status showed approximately 955 READY and 351 ABSENT symbols with zero failed symbols. This must not be described as ~27% acquisition failure.

`ABSENT` is an evidence-state outcome. It is distinct from transport/provider failure.

Similarly, the three `no usable evidence` acquisition outcomes in the captured interval are evidence-quality outcomes, not HTTP/provider failures.

This distinction is important for future status, metrics, SCA, and operator language: unavailable/absent evidence, provider failure, transport failure, policy rejection, and scheduler non-execution are not interchangeable failure states.

### Principal begins reading Java implementation

During the failover work, the Principal began reading the Java code directly and expressed concern with what the implementation looked and felt like.

The concern was not language fashion. The Principal has written Java since 1995 and described a long-lived object-design heuristic learned through experience:

> Well-written Java has three basic kinds of objects:
>
> 1. **State objects** — preferably immutable.
> 2. **Behavior objects** — preferably one coherent kind of behavior.
> 3. **Creation objects** — preferably polymorphic creation/selection/assembly boundaries.
>
> That's it. No more.

This is not intended as a literal prohibition on every hybrid or framework-required shape. It is a classification discipline. A production class should be able to answer what kind of object it primarily is. If it cannot, that is an architectural finding requiring explanation.

The implementation smelled procedural in places because control state and behavior had accumulated together. The issue was described as Java that can read like "janky old C code": mutable state variables and lifecycle transitions driving procedural orchestration rather than objects whose responsibilities and variation are expressed through composition and polymorphism.

`ProviderAuthorityManager` became a useful example because it appeared to own or coordinate multiple kinds of concern: provider lifecycle, active authority, epochs, verification, recovery probes/streaks, evidence availability, transition state, and related coordination. This does not automatically mean the class is wrong; it means it should fail the "what kind of object is this?" test cleanly or be decomposed.

### Emerging Java / implementation standards

The discussion produced the following candidate implementation standards. They are not yet all ratified formal policy; this journal entry preserves the discovery so it can be deliberately codified rather than lost.

#### Object ontology

Every production class should classify primarily as one of:

- **state**;
- **behavior**;
- **creation**.

If a class cannot be classified, that is an architectural smell/finding.

#### State objects

- Prefer immutability.
- Mutable state requires an explicit invariant.
- Mutable state should exist because the system must remember something that cannot safely be derived, not because procedural code found it convenient to add another flag.
- State objects should not also become orchestration engines.
- Prefer authoritative facts over duplicated/derived mutable state.

#### Behavior objects

- Prefer one coherent behavioral responsibility.
- Operate on explicit state rather than becoming long-lived bags of mutable control state.
- Important state transitions should have a clear single owner.
- Workers execute work; they should not silently become control planes.

#### Creation objects

- Own concrete selection, assembly, and construction where variation exists.
- Prefer polymorphic creation boundaries so downstream behavior depends on abstractions rather than provider/type switches.
- Constructors/factories should establish valid objects, not manufacture unobserved operational facts merely to satisfy predicates.

#### Polymorphism vs procedural branching

When behavior genuinely varies by type/kind, prefer polymorphism/composition to broad conditionals, boolean mode flags, or state-machine branching.

Boolean parameters that fundamentally alter behavior are suspect.

Strings should not become hidden type systems or selectors.

#### Orthogonal concerns must remain orthogonal

Do not encode the Cartesian product of independent concerns into one lifecycle state machine simply because the concerns interact.

Provider selection, evidence fitness, Market Session Model, acquisition, caching, recovery, fencing, and publication can affect each other without constituting one concept.

A revealing question from this session was:

> Why is an acquisition worker responsible for keeping provider authority healthy when acquisition isn't even permitted?

That question exposed the difference between execution work and control-plane responsibility.

#### Responsibility boundaries

A candidate concise implementation rule:

> Workers execute. Control planes control. Persistence persists. Presentation projects.

Provider-specific behavior should remain encapsulated below provider/evidence boundaries. Generic domain/application services should not branch on provider identity. Domain/application code should consume normalized Wheelwright concepts rather than provider-native representation.

Cache semantics belong at provider/evidence acquisition boundaries, not scattered through consumers.

### Naming smells

The discussion explicitly rejected turning naming into a simplistic banned-word list. Names such as:

- `Manager`
- `Helper`
- `Util`
- `Processor`
- `Handler`
- `Service`
- `Context`

are not automatically forbidden. They are **classification smells** because they often conceal a class with unclear responsibility or mixed ontology.

When one of these names appears, ask:

- Is this state, behavior, or creation?
- What single responsibility does it own?
- What state does it own, and what invariant requires that state?
- Is it coordinating orthogonal concerns because the implementation lacked a better boundary?
- Would polymorphism/composition make the variation explicit?

The standard should make the correct structure obvious rather than encouraging superficial renaming.

### Kotusev-style traceability and implementation architecture

The Principal referenced Kotusev-style architectural thinking not as doctrine but as a useful discipline: architectural intent must remain traceable all the way to ordinary source code.

The emerging chain is:

```text
Business / operating model
→ Conceptual architecture
→ Application architecture
→ Implementation architecture
→ Coding / implementation standards
→ Code
→ Mechanical verification
```

The critical gap identified in Wheelwright is between architecture and implementation. The repository contains substantial conceptual/application architectural material, ADRs, and foundation documents, but it does not yet make the intended **implementation architecture** sufficiently explicit for Kiro to reliably produce the right code shape without reconstructing years of Java experience from conversation.

The purpose of standards is therefore not aesthetic uniformity. It is architectural transmission.

### Governing axiom — make the right thing easy and obvious

The Principal stated the axiom that should govern this work:

> **Make the right thing easy to do. Make what is right easy to know.**

This is broader than documentation.

A good engineering system should create a paved road through:

- architecture;
- package/module topology;
- responsibility boundaries;
- interfaces;
- examples/reference implementations;
- coding standards;
- tests;
- automated architecture checks;
- SCA;
- Sonar/mechanical quality gates;
- CI/CD.

If Kiro must read six months of journal history and reconstruct architectural intent before it can correctly add one class, then the repository has failed even if the correct intent technically exists somewhere.

Similarly, cleanup must address not only individual violations but also the conditions that made those violations easy to create.

Success should eventually show up as:

- smaller blast radius for changes;
- fewer unrelated components touched;
- fewer implementation/review correction cycles;
- less architectural rediscovery;
- fewer mutable/control-state additions;
- reduced Kiro-credit cost per accepted change;
- faster path from intent to production-ready accepted code.

### SCA — the architectural scoreboard

The Principal's formulation:

> **SCA is the scoreboard. Sonar is the brutal arbiter of truth.**

In this project, SCA means **Architecture-to-Code Coherence Assessment**, not conventional static code analysis.

The core SCA question is:

> Is implementation structure converging toward or diverging from intended architecture?

SCA should not merely produce an absolute score that engineers attempt to game. The Principal emphasized:

> The game with SCA isn't necessarily any score in a moment in time. It's trends.

Therefore the more important signal is longitudinal:

- Is architecture-to-code coherence improving or degrading?
- Is the system becoming easier or harder to absorb change?
- Does a feature introduce more architectural ambiguity than existed before?
- Is responsibility becoming clearer or more entangled?

Candidate governance rule:

> SCA regression is a build failure unless explicitly approved as an architectural exception.

This requires deterministic scoring, versioned standards, stable weights, and historical baselines tied to commit SHA. Some architectural invariants should hard-fail independently of aggregate score.

Potential validation chain:

```text
architectural invariants
→ SCA trend / baseline
→ Sonar Quality Gate / New Code
→ build
```

A feature need not improve the absolute SCA score every time. It should not produce unexplained regression.

### SCA and Sonar are complementary

SCA is not a replacement for Sonar, and Sonar cannot prove architecture.

Architectural invariants include things that are wrong even if the code is mechanically clean, for example:

- provider identity leaking into generic frontend/domain behavior;
- control-plane concerns hidden inside acquisition workers;
- provider-native semantics crossing the normalized evidence boundary;
- independent concepts collapsed into one state machine.

Implementation standards describe the intended realization:

- responsibility separation;
- state ownership;
- immutability;
- polymorphism;
- dependency direction;
- object classification.

Mechanical standards belong to Sonar/static tooling:

- complexity;
- duplication;
- coverage;
- vulnerabilities;
- dead code;
- common maintainability defects.

A class may be spotless in Sonar and still be architecturally wrong. Conversely, a beautiful architecture narrative does not excuse mechanically bad code.

The desired system uses both.

### Architecture as a Theory-of-Constraints problem

The session connected architectural coherence to the Principal's real resource consumption. Roughly a quarter-month of Kiro credits had been consumed in about two days, with repeated implementation/review loops.

This suggested a system-level hypothesis:

> Architecture can become a Theory-of-Constraints bottleneck when the existing code structure cannot absorb change without repeated reasoning, rework, and cross-component correction cycles.

This is not a claim that Kiro itself is inefficient. If every change requires Kiro to rediscover responsibility boundaries and then Codex/ChatGPT to repeatedly correct the resulting implementation, the constraint may be the implementation architecture.

A potentially useful business-level metric is **Kiro credits per accepted change**. It should not be optimized in isolation, but it can act as a cost-of-change signal alongside:

- number of components touched;
- unrelated components touched;
- architectural invariant violations;
- implementation/review cycles;
- SCA trend;
- Sonar findings;
- time from authorization to accepted main.

The intent is not to minimize AI usage. It is to observe whether the system's structure lets engineering effort convert efficiently into accepted change.

### Database/persistence concern discovered during experiment

The evidence database grew materially during the experiment (roughly ~211 MB before the day of sandbox acquisition to ~290 MB afterward). This raised a concern that the persistence model may be storing unnecessary state/control metadata or redundant historical payloads.

This should be investigated later under PL-COHERE/SCA rather than during the closed experiment. A useful future assessment would include:

- table and index sizes;
- row counts and growth rates;
- historical evidence versus current snapshots;
- audit/control metadata versus durable domain evidence;
- redundant payloads;
- legacy/dead tables;
- current-code reachability;
- whether persistence primarily represents domain evidence or accumulated implementation/control-state machinery.

This is an architectural/coherence question, not merely a disk-space optimization.

### Frontend blast-radius / dead-surface concern

The failover work unexpectedly touched or exposed many frontend files and old Opportunity Lab/application surfaces. This reinforced a PL-CLEANUP hypothesis:

> A dead product surface with live architectural coupling is more than cleanup debt.

A useful deletion-value metric:

> If deleting a dead feature would materially reduce the blast radius of unrelated architectural changes, deletion has architectural value beyond cosmetic cleanup.

Provider-wall test:

> If switching Tradier to a hypothetical second provider requires broad frontend edits, the provider boundary is wrong.

This ties cleanup directly to architecture-to-code coherence.

### Observer architecture lesson

The experiment required a strong observer so system behavior could be reconstructed independently of implementation state-machine knowledge.

The observer invariant developed during the session was:

> An observer can reconstruct every acquisition attempt, authority boundary, and usable-evidence transition without knowing the provider implementation/control state machine.

Provider-specific mechanisms such as the Tradier pacer should not become generic architectural concepts merely because they are useful to observe. The observer should report neutral facts such as request start/completion, waits, provider-directed retry/backoff, outcome, concurrency, timing, and fencing.

This distinction — observe mechanics without promoting them into domain concepts — should inform future observability design.

### Experiment closure and Git/runtime handoff

After the evidence was sufficient, the experiment was deliberately closed rather than extended indefinitely.

Kiro inventoried and stopped experiment-owned backend, monitor, caffeinate, and stale/orphaned frontend processes. Ports 3100 and 5173 were left free. The Principal regained ordinary runtime control through `./scripts/dev.sh` and subsequently started the servers personally.

Git reconciliation established:

- accepted failover implementation on `main`;
- local and `origin/main` converged to `097844f` at experiment close;
- temporary experiment remote branch deleted;
- temporary credential file absent/untracked;
- unrelated frontend work preserved in a local stash rather than folded into failover work;
- working tree clean;
- experiment artifacts preserved outside the repository and not mutated during closure.

A later documentation-only commit preserved the final provider recovery/performance findings on `main` as `7d4c455` (`docs/42-provider-failover-production-findings-2026-09-03.md`).

### What was codified vs what remained missing

A repository check after closure established an important gap.

Already durable:

- `PL-COHERE-01` exists as Architecture-to-Code Coherence Assessment;
- temporal-coherence findings and related architecture work exist under it;
- provider architecture/failover reconciliation exists;
- provider recovery/performance findings now exist in `docs/42-provider-failover-production-findings-2026-09-03.md`.

Not yet adequately codified before this journal entry:

- the state / behavior / creation Java object ontology;
- immutability and mutable-state-invariant expectations;
- responsibility-separation implementation standards;
- naming smells as classification triggers;
- polymorphism-vs-state-machine guidance;
- orthogonal-concern rule;
- explicit implementation-architecture layer between architecture and code;
- SCA as a longitudinal scoreboard;
- SCA regression as a potential build gate;
- SCA/Sonar complementary enforcement model;
- the governing "right thing easy / right thing clear" axiom as an implementation-system requirement.

This entry intentionally preserves those discoveries before formal ratification so they are not lost before the next architecture/standards discussion.

### Decisions / implications

1. **Do not treat passing tests as sufficient evidence of implementation quality.** Behavioral correctness and architecture-to-code coherence are separate dimensions.
2. **Create an explicit Wheelwright implementation architecture / coding-standards layer.** It should translate durable architecture into ordinary code-shape guidance that Kiro can follow without archaeology.
3. **Use the state / behavior / creation ontology as a primary Java classification lens.** Treat inability to classify a class as an architectural finding, not merely a naming complaint.
4. **Prefer immutable authoritative state and explicit invariants.** Avoid proliferating derived mutable state and procedural lifecycle flags.
5. **Prefer composition/polymorphism when behavior varies by kind.** Do not encode independent dimensions as combinatorial state machines.
6. **Make responsibility ownership obvious.** Workers execute; control planes control; persistence persists; presentation projects.
7. **Treat generic names as smells, not banned words.** The test is responsibility clarity and object ontology, not vocabulary compliance.
8. **Develop SCA as a longitudinal architecture-to-code coherence scoreboard.** Trend is more meaningful than a point score.
9. **Eventually gate unexplained SCA regression.** Some invariants should hard-fail regardless of score; Sonar remains the mechanical quality layer.
10. **Preserve Sonar as an independent truth source.** Do not let architectural narrative excuse mechanically poor code.
11. **Measure architecture by cost of change as well as elegance.** Rework cycles, blast radius, AI-credit consumption, and architectural rediscovery are legitimate system-level evidence.
12. **Do not optimize provider concurrency absent new evidence.** Production observation showed the request allowance, not concurrency or provider latency, was the active provider-path constraint.
13. **Move future acquisition optimization upward toward evidence-value allocation.** Once the provider pipe is healthy and near its budget, ask what evidence deserves scarce capacity (`PL-EVID-AGE` / G6-N1).
14. **Keep proof boundaries explicit.** Startup recovery is production-observed; automatic live failback/stale-work fencing remain unobserved in natural production transition.
15. **Make the right thing easy and clear.** Repository structure, standards, examples, SCA, Sonar, tests, and CI should form a paved road rather than requiring repeated reconstruction of intent.

### Open questions / next conversation

The Principal indicated that a "hard conversation" follows this cleanup. Before that conversation, the implementation-standards discovery needed to be preserved durably.

Questions intentionally left open for deliberate reconciliation:

- What exact implementation-standards document(s) should be created, and what authority category should they carry?
- Which parts of the state/behavior/creation ontology are hard standards versus strong heuristics?
- How should Java framework classes and unavoidable hybrids be classified/exempted without weakening the standard?
- Which architectural invariants are binary hard-fail rules?
- What SCA dimensions and weights are deterministic enough for CI?
- What is the initial SCA baseline and how is it tied to commit SHA?
- What magnitude/type of SCA regression requires explicit Principal exception?
- How should SCA findings map to PL-COHERE-01 and PL-CLEANUP without turning either into an unbounded technical-debt bucket?
- What Sonar configuration/quality gate best complements rather than duplicates SCA?
- How should Kiro be instructed so the standards become default implementation behavior rather than after-the-fact review criteria?
- Which current classes should be used as positive/negative reference examples?
- Is `ProviderAuthorityManager` the right first concrete case for applying the object/responsibility classification, or should the first pass be broader and evidence-based?
- Can architecture-cost indicators such as Kiro credits per accepted change, review-cycle count, and blast radius be measured without becoming targets that distort engineering behavior?
- Should observer event format eventually carry recorder epoch on every event so independent merge identity is self-contained as `(recorderEpoch, sequence)`?
- What persistence data is actually durable domain evidence versus incidental implementation/control-state accumulation?

### Closing why-state

The session began as a provider-failover implementation and experiment. It ended by exposing a more fundamental engineering concern.

Wheelwright increasingly has enough architecture documents to explain what the system is supposed to mean. The missing layer is making that meaning *structurally inevitable in the code*.

The Principal's governing axiom captures the target:

> **Make the right thing easy to do. Make what is right easy to know.**

The standards/SCA work should be judged by that outcome. If Kiro can see the correct object shape, responsibility boundary, dependency direction, and validation rule directly from the repository — and if CI catches meaningful divergence before human review — then architecture stops being a recurring reconstruction exercise and becomes part of the system itself.

---

## 2026-09-03 — Technology Quality Constitution v1 Authority Reconciliation

The Principal ratified `docs/foundations/technology-quality-constitution-v1.md` in commit `53b4734`. A subsequent Codex commit, `3f81727`, added useful baseline-execution controls directly to that ratified Constitution without obtaining amendment authority. The content was largely sound; the mutation was not legitimate. This was the first live test of the Constitution's own rule that evidence and assistant judgment inform while explicit authority governs change.

The Principal authorized a forward reconciliation rather than history rewriting or a wholesale revert. Constitution v1 was restored byte-for-byte to the text ratified in `53b4734`. Baseline execution controls remain in the separately ratified Technology Quality Program and its required Baseline Charter. Program wording was corrected so those controls no longer depend on the removed Constitution additions.

The documentation-index, Constitution-discoverability, and numbered-journal-continuation routing introduced by `3f81727` were substantively correct and are now explicitly ratified and retained. No production code, baseline execution, or remediation was part of this reconciliation.

Durable governance learning:

> **Useful judgment does not authorize mutation of ratified authority.**


---

## 2026-09-03 — Technology-quality experiments graduate (strict Sonar + ArchUnit)

### Context
An overnight sequence of controlled experiments (SonarQube Community Build 25.9, isolated ArchUnit probe) tested how far commodity tooling can carry Wheelwright's Java design standard. The Principal decided to graduate the useful parts into the durable Technology Quality Program. Recorded as `docs/technology-quality-fitness-controls-v1.md` (Category C) + `docs/reference-data/sonar/wheelwright-clean-code-profile-delta-v1.md`.

### What the experiments established (why-state)
- **Three-layer quality model.** Strict Sonar = commodity/local structural quality (size, complexity, nesting, field/method pressure). ArchUnit = ratified architectural invariants (direction, cycles, boundary/construction confinement). Human/AI = design judgment (SRP substance, abstraction quality, IoC/seams, implicit state machines, semantic contracts).
- **`DatabaseManager` is the preserved discriminator.** Neither strict Sonar nor ArchUnit saw its weak-IoC / hidden-infra-dependency / `DriverManager`+classloader resource discovery / `Instant.now()` / no-seam concerns. ArchUnit correctly said "in `db`, using JDBC — permitted." Those concerns are **not automated**. Do not claim they are.
- **`AcquisitionWorker` showed complementarity.** Sonar: 58 fields, 53 methods, cognitive complexity 54, brain method. ArchUnit independently: orchestration constructs its own executor (a seam/boundary fact Sonar cannot express).
- **`MultiExpirationSurfaceAnalysis` was the strongest evidence against hypothesis-fitting.** A *general* JDBC-boundary invariant (R4) found a violation there without the rule being built around it — and we had not nominated that class.

### Governing standard for the middle layer
> **Only automate architectural propositions we are prepared to defend independently of the code that happens to violate them.**
An ArchUnit rule is executable architecture policy, not another lint. R4 (JDBC construction confined to persistence boundary) is a strong candidate. R5 (executor construction confined to composition boundary) is a strong candidate but blocked on ratifying Wheelwright's actual composition boundary. **R2a (`db → root` via `SchedulerConfig`) is explicitly NOT ratified** — it demonstrated that package topology ≠ conceptual architecture; the dependency is real but not shown to be wrong.

### Fifth principle added at graduation — trend over build-killers
Make quality visible/measurable/directionally improvable; prefer baselines, trends, new-vs-legacy debt distinction, and regression surfacing over turning every smell into a build failure. Graduating the strict profile does NOT make its ~559 rules gates; a ratified ArchUnit invariant does NOT automatically become a hard failure. Hard gates are reserved for a small ratified high-confidence class. Reconciles with Constitution: "No control becomes a hard gate merely because a tool ships with that rule enabled."

### Disposition
Durable now: the model, the operating principle, the strict-Sonar policy as reproducible delta config, ArchUnit as an approved mechanism, and the R4/R5/R2a dispositions. Not built: reproducible profile provisioning script, trend capture, any ArchUnit build integration, any enforcement mode. Experimental SonarQube instance + profile/projects kept intact until the durable mechanism can reproduce the evidence. No findings remediated; `DatabaseManager`/`AcquisitionWorker`/`MultiExpirationSurfaceAnalysis`/`SchedulerConfig` unchanged. Reconciled as the Constitution's Article VI fitness-function lifecycle and Program Workstream 9 / deliverable #11 — no new authority created, no `PL-SONAR` item (Program forbids it); cross-referenced to `PL-COHERE-01`.

### Open Principal decisions carried forward
Composition-boundary definition (unblocks R5); per-control enforcement mode (default: not a gate); durable ArchUnit vehicle (touches build files → separate authorized change); whether to stand up trend infrastructure now.


---

## 2026-09-04 — PL-CLEANUP current-state re-baseline (discovery evidence; PL-CLEANUP not yet rewritten)

### Epistemic status

This entry preserves **verified discovery evidence and a ratified sequencing consensus**, not a rewritten backlog record and not implementation authorization. It exists so a cold actor does not have to re-verify the dead proxy, the already-retired scan pipelines, the Lab/topology coupling, and the two-app-tree structure from scratch. The canonical `PL-CLEANUP` record is intentionally **left unchanged** until the narrow PL-SHELL boundary decision (below) resolves the target; rewriting it now would guarantee editing it twice.

All code facts were verified against the working tree at SYNC `693445a`.

### Why this was done

The session began from a Principal thesis: "the next activity should be a round of cleanup (review the cleanup PL) before more feature or infrastructure work." Kiro's architectural objection was that `PL-CLEANUP` is dependency-gated and its record is stale. Codex supplied evidence that the record is no longer executable as written. Rather than argue from old backlog wording, the cleanup instinct was turned into a **current-state dependency model**. The review led and succeeded; its result is the model below.

### Governing phase framing (Principal-ratified)

> Wheelwright's next phase is **reduction of accidental change surface before the next product-learning expansion** — not "technical cleanup."

This framing decides what belongs (dead proxy coupling, ambiguous retired-UI boundaries, duplicate semantic CSS) and what does not (renaming historical identifiers merely for tidiness). It is a sharper form of the governing test every cleanup intervention must pass:

> Every cleanup intervention must name the future Wheelwright change it makes easier, safer, or cheaper.

### Verified findings (implementation truth at SYNC `693445a`)

1. **Scan pipelines already retired.** `scanPuts` / `scanCalls` / `scanUniversePuts` no longer exist; only a doc-comment remains in `options-prototype/src/write-desk/scan-orchestrator.ts`. That file is **not** dead — it exports live types (`ScanConfig`, `ScanResult`, `PutCandidate`, `CallCandidate`, `GovernanceAnnotation`, incl. the `PL-EVID-AGE` `evidenceProvenance` field). So the `PL-OPS-06` "remove scan functions" behavior is effectively **done**; the surviving artifact is a **naming residue** (a file named for orchestration that is now types-only), not a dead pipeline. These are different classes of cleanup and must not be conflated.

2. **The real dead pipeline is the proxy.** `options-prototype/src/providers/index.ts` constructs `new ProxyMarketDataProvider("/api/market")` for the `tradier` key. The Java backend serves **no** `/api/market` route (only `/api/evidence/*`, `/api/production/*`, `/api/observer/*`, `/api/opportunity-history`, `/api/status`, `/api/health`). The proxy pipeline is therefore **dead at the backend-contract level**.

3. **The dead proxy's only live coupling is through retired Lab surfaces.** `getProvider`/proxy consumers are `VelvetRopePage`, `ReferenceDataView`, `RecommendationLab`, `OpportunityLab` (all in the legacy `App.tsx` tree). `WriteDesk` imports only `isTradierConfigured`, not the provider. This is the strongest finding: **a retired/subordinate surface is carrying architectural coupling that makes unrelated provider work more expensive** (independently visible in the Sep 2–3 failover work touching dead surfaces). This passes the governing test as **cost-of-change debt**, not aesthetic debt.

4. **Two parallel app trees.** `Root.tsx` + `AppShell` is the live operational shell (Console, Deployment/WriteDesk, Production, plus a Kreature nav button). `App.tsx` is a legacy view-switcher mounting `ReferenceDataView`, `RecommendationLab`, `OpportunityLab`, `CsvImportLab`, `EtfCatalogExplorer`, `VelvetRopePage`, `SecExplorer`, `MassiveChainView`. The Labs are **still reachable** at `/labs/*` (Root renders `<App/>`) — intentionally retained engineering tooling outside the shell, **not** orphaned code. This confirms the "retired product surface ≠ useless code" distinction is real.

5. **Documentation leg is superseded/overlapping.** The doc-topology work `PL-CLEANUP` absorbed (`PL-OPS-05` ADR coverage; `07d-obsolete-docs.md`) is already reframed: `07d` is HISTORICAL, superseded by docs 30/31/32, and the Technology Quality Program Workstream 0 explicitly owns documentation + authority reconciliation and README reading-path repair. Conclusion: **cede the documentation leg to the Program**; do not run it as a separate cleanup package.

6. **Kreature navigation defect (separated).** `AppShell` advertises a Kreature nav button; `router.ts` resolves `/app/kreature` to route `kreature`; but `Root.tsx` has no `kreature` render branch, so navigation yields shell chrome with an empty body and never reaches the intentional "temporarily disabled" `KreaturePage`. Filed as **GitHub Issue #10** (`defect`, `S3`) under the Sep 4 defect convention. Kept **outside** cleanup scope: independent evidence, independent authority; filing does not authorize remediation.

### Ratified sequencing consensus (Principal + Codex + Kiro)

1. The cleanup review is complete enough to establish the phase (accidental-change-surface reduction before expansion).
2. Preserve verified findings as journal/discovery evidence (this entry); do **not** rewrite `PL-CLEANUP` yet.
3. Issue #10 is correctly separated as a defect and durably recorded.
4. **Next activity is a narrow completion of the unresolved PL-SHELL boundary** — not a broad reopening of the shell (much of the shell is already accepted and implemented). The three unresolved questions are:
   - operational vs engineering topology;
   - a per-Lab survival/disposition principle;
   - the operational name currently rendered as "Write Desk" (route token `write-desk`, `wd-*` CSS, `WriteDesk` identifiers; nav already reads "Deployment").
5. Once decided, rewrite/decompose `PL-CLEANUP` **once** against the resolved target.
6. Then authorize bounded cleanup packages and establish the explicit condition for returning to expansion.

### The boundary question that drives everything else

The most useful thing to settle next is the **engineering boundary**, because per-Lab dispositions become far less subjective once it is clear:

> What is an operator-facing Wheelwright capability, what is an engineering instrument used to build/inspect Wheelwright, and what architectural boundary prevents the latter from increasing the change surface of the former?

### Candidate cleanup packages (recorded for later decomposition — NOT authorized)

Dependency order, each carrying its own exit criteria at decomposition time:

- **A — Dead proxy pipeline** (`ProxyMarketDataProvider` / `/api/market`). Remove or re-point; **depends on** the Lab disposition (C) to be safe. Simplification: moves the provider-wall test (a second provider requires no frontend edits) materially closer; serves `PL-PROV-FAILOVER` and `PL-COHERE-01`.
- **B — `scan-orchestrator` naming residue.** Rename types-only module; prune stale comment. Best folded into D to avoid a double rename.
- **C — Lab/retired-surface disposition.** Apply the ratified capability-migration rubric per Lab (learned what? covered operationally now? preserve as engineering infra behind a subordinate boundary?). **Analysis/design, deletion not presupposed.** Depends on the PL-SHELL engineering-boundary decision.
- **D — `write-desk` / `wd-*` / posture vocabulary.** Adopt the ratified operational name, then mechanical rename + de-duplicate the posture CSS (`PL-POSTURE-01` records the posture-color definition appearing three conflicting times). Blocked on PL-SHELL naming. Note: the `wd-*` token rename **fails the governing test in isolation** and is only worthwhile bundled with the ratified rename.

### Explicit exclusions from this phase

- Documentation/authority reconciliation → Technology Quality Program Workstream 0.
- `AcquisitionWorker` / provider-admission restructuring → blocked by the open constraint-identification investigation and a Program exclusion.
- Behavioral defects (`PL-DEPLOY-02-DEF01`, `PL-GOV-01`, Issue #10, etc.) → remain GitHub Issues, not cleanup packages.
- Dependency upgrades, cloud, redesign, and ambient debt.

### Corrected framing (durable learning)

An earlier Kiro phrasing said `PL-CLEANUP` "cannot lead." That was backlog-instrument thinking and is **withdrawn**: the cleanup review *did* lead and succeeded — its output is this dependency model, and we know PL-SHELL is the pivot precisely *because* the re-baseline surfaced it. The correct chain is: cleanup review → PL-SHELL decision → bounded cleanup execution → reassess expansion readiness.

### Next authorized mode

Design exploration of the narrow PL-SHELL boundary (topology / per-Lab disposition principle / operational naming). No implementation, no `PL-CLEANUP` rewrite, no Lab deletion, no proxy removal until that decision is made and separately authorized. This entry is uncommitted working-tree state pending the Principal's persistence/commit decision.


### Ratified — residual PL-SHELL boundary decision (2026-09-04)

The Principal ratified the residual PL-SHELL decision that this re-baseline surfaced as the pivot. This closes the three unresolved boundary questions (operational vs engineering topology, per-Lab disposition principle, operational naming) without reopening the broader shell architecture, which is already accepted and substantially implemented.

**Ratified decision:**

- Wheelwright operator topology is **Console → Deployment → Production** within the shared Application Shell.
- A **subordinate engineering area** exists outside operator topology. `/engineering/*` is **vocabulary direction**; `/labs/*` is **transitional**. This ratification does **not** by itself authorize a mechanical route rename.
- Engineering instruments are **not** operator surfaces and are **not** advertised in operator navigation.
- **Operator application code must not depend on engineering-only behavior or surface implementations.** Shared capabilities must graduate into an appropriate shared/domain boundary; historical file location does not determine architectural status.
- This is a **target boundary with known current violations** that cleanup will reconcile (e.g., the operator-adjacent provider factory and retired Labs currently share the dead `/api/market` proxy chain). The constraint is not asserted as already-true.
- Every Lab capability receives exactly one disposition: **migrate** to operational/shared capability, **preserve** as a subordinate engineering instrument, or **delete**. There is no "leave it because it exists" category.
- **Deployment** is the canonical operator-facing name for the current WriteDesk surface. `WriteDesk` / `write-desk` / `wd-*` are historical implementation vocabulary to reconcile during bounded cleanup **where doing so reduces ambiguity or fragility**.
- **Kreature is explicitly outside this decision.** It is neither ratified here as an operator surface nor classified as engineering tooling. Existing Kreature authority continues to govern it; the navigation inconsistency remains GitHub Issue #10.

**Load-bearing invariant:** the import-direction constraint (operator code must never depend on an engineering/Lab module; engineering may depend on published/domain contracts) is the architectural rule that makes the boundary real. It is deliberately expressed as a logical/import boundary, not a second application or package — a build-system separation is not authorized absent demonstrated evidence that the import boundary is insufficient.

**What this unlocks:** the abstract "Package C" is replaced by a concrete PL-CLEANUP decomposition: (1) inventory every `/labs/*` capability and assign migrate/preserve/delete under the rule above; (2) remove the dead proxy/provider path wherever no preserved engineering capability requires it (preserved tools move to supported contracts, not a kept-alive dead architecture); (3) retire WriteDesk/write-desk/`wd-*` vocabulary toward Deployment incl. semantic CSS cleanup where it removes real ambiguity/fragility; (4) fold the `scan-orchestrator.ts` naming residue into that coherence work rather than treating scan-removal as undone; (5) leave docs/authority work with the Technology Quality Program and defects with Issues.

**Cleanup-round exit criterion (ratified):** cleanup is complete when the operator topology and engineering topology conform to the resolved boundary, obsolete paths no longer enlarge normal change scope, competing historical vocabulary no longer obscures current responsibilities, and the selected cleanup packages are closed — **not** when Sonar has zero findings or the codebase is aesthetically perfect. At that point cleaning stops and feature/infrastructure expansion is reassessed.

**PL-CLEANUP status:** still **not rewritten**. The final `PL-CLEANUP` record and the `PL-SHELL` row reconciliation are deferred until the current-code per-Lab disposition pass returns. This journal entry is the durable provenance for both the re-baseline and this ratification.


---

## 2026-09-04 — PL-CLEANUP Package 2 complete (Minimal Engineering Capability Preservation)

### Status

**P2 — COMPLETE / ACCEPTED.** First bounded package of the ratified PL-CLEANUP decomposition executed. This is an implementation/completion record; no further cleanup is authorized by it.

### SHAs

- **Baseline (accepted `main` before this record):** `41d323927e3c3ebcebddf47dc7ce79241da41d32`
- **P2 implementation commit:** `41d323927e3c3ebcebddf47dc7ce79241da41d32` — `refactor(engineering): extract preserved PL-CLEANUP P2 instruments`

(The implementation commit is itself the accepted baseline this documentation record is written against; verified remotely, not assumed.)

### Resulting topology

**Operator application** — Console → Deployment → Production within the shared Application Shell (unchanged).

**Engineering boundary** — `/engineering/*` now hosts exactly three preserved instruments, outside primary operator navigation:
1. Universe Inspection / browser-local candidate maintenance
2. CSV parsing/classification diagnostics
3. Scenario Replay

**Transitional historical Lab boundary** — `/labs/*` remains temporarily and still contains Velvet Rope, Laboratory / Delta Probe, ReferenceDataView / Options Chain, RecommendationLab, OpportunityLab, EtfCatalogExplorer, SecExplorer, FmpExplorer, MassiveChainView. This is intentionally transitional: **P3 must precede final Velvet Rope migration; P1 must precede final historical Lab-host removal.**

### Verified implementation evidence

- The three P2 capabilities were removed as active instruments from the historical Lab host; `/engineering/*` exposes exactly those three (verified in `router.ts` and `engineering/EngineeringApp.tsx`).
- Universe maintenance explicitly states that browser-local additions do not alter the backend-maintained acquisition/evidence universe.
- CSV Diagnostics uses the existing shared/production parser stack and no longer presents an import-preview workflow.
- Scenario Replay parser/projector/diff behavior and fixtures remain unchanged.
- Velvet Rope was untouched.
- No P1, P3, or P4 work was performed.
- Console, Deployment, Production, acquisition, recommendations, portfolio ingestion, accounting, governance, and provider/provenance behavior remained unchanged.
- No operator module depends on the engineering host or engineering-only UI (import-direction constraint honored for the extracted instruments).
- Build passed. Full frontend suite passed: 110 files / 1,491 tests. Focused P2 tests passed: 9 files / 134 tests. Changed-file lint passed. `git diff --check` passed.
- Repository-wide lint remains non-green **only** because of pre-existing accepted-`main` `OperatorConsole.tsx` hook-order errors/warnings. These are pre-existing and are **not** PL-CLEANUP work; they are not converted into cleanup scope.

### Natural stopping point

P2 reached its intended boundary: the three preserved capabilities are relocated behind `/engineering/*`, operator behavior is unchanged, and the historical Lab host remains intact for P3/P1 to consume. No further extraction, deletion, or vocabulary work is in scope until the next package is authorized.

### Next bounded increment

**P3 — Governance Extraction + Legacy Provider Severance.** Separate governance judgment from evidence acquisition (feed Velvet Rope from the published evidence contract rather than `/api/market`), then retire the dead browser acquisition/provider path where proven safe. P3 must precede final Velvet Rope migration. Execution requires separate Principal authorization; not begun.


---

## 2026-09-04 — PL-CLEANUP Package 3 complete (Governance Extraction + Legacy Provider Severance)

### Status

**P3 — COMPLETE / ACCEPTED.** Second bounded package of the ratified PL-CLEANUP decomposition executed. Implementation/completion record only; no further cleanup authorized by it.

### SHAs

- **Baseline (accepted `main` before this record):** `d8905fa3dd48041a48424cb33346c6000d4cf206`
- **P3 implementation commit:** `d8905fa3dd48041a48424cb33346c6000d4cf206` — `refactor(governance): separate admission judgment from acquisition`

(The implementation commit is itself the accepted baseline this record is written against; verified remotely, not assumed.)

### Governance-boundary change (ratified objective achieved)

> Separate governance judgment from evidence acquisition.

- `evaluateSymbolAdmission(...)` no longer accepts a `MarketDataProvider`; it accepts explicit `AdmissionEvidence` (verified in `velvet-rope/evaluate.ts` + `types.ts`).
- Supplied evidence includes: expirations; chains keyed by expiration; explicit provenance; attempted timestamp; audit identity.
- Governance evaluation is now synchronous and performs no network acquisition, provider calls, clock reads, random/audit-identity generation, or internal provenance manufacture (confirmed by the function contract's own documented invariant: "reads no clock, creates no identity, derives no provenance").
- Preserved governance semantics: admission policy; expiration eligibility/ranking; contract selection; per-side criteria; product-structure inference; structural-complexity judgment; aggregation; audit-record semantics; deterministic narrative behavior.

### Velvet Rope disposition

- The obsolete historical Velvet Rope **Lab UI was retired** while its governance/domain capability was **preserved**.
- Velvet Rope removed from the historical `/labs` host; SEC Explorer's exclusive `Evaluate → Velvet Rope` handoff removed; `pendingVelvetRopeSymbol` removed (its only producer/consumer belonged to that obsolete handoff/UI).
- No replacement operator-facing governance workflow was created; unresolved governance-expression work (`PL-GOV-EXPR`) remains separate.

### Provider / acquisition severance

Accepted removals: `src/providers/proxy/ProxyMarketDataProvider.ts`, `src/providers/index.ts`, `src/write-desk/acquire-evidence.ts`, obsolete provider-driven session-gating tests, and obsolete synthetic stall assertions tied only to the removed acquisition path.

Reverse-dependency evidence: `ProxyMarketDataProvider` was used only by the deleted provider factory; the factory's meaningful consumers were Velvet Rope, historical P1 Labs, and Deployment's stable provider-identity helper; Velvet Rope UI was retired; P1 Labs were isolated to existing mock fixtures rather than deleted; Deployment's prior always-true provider helper was replaced by the equivalent literal `"tradier"` identity; `acquireEvidence` had no production callers; removed stall assertions reconstructed local booleans rather than protecting surviving production behavior.

Deliberately retained until P1 (still required by historical P1 surfaces; no longer implying a supported live browser acquisition path): `src/domain/provider.ts`, `src/providers/mock/MockMarketDataProvider.ts`, relevant mock fixtures, `src/hooks/useOptionsChain.ts`, `src/opportunity/evaluate.ts`, applicable tests.

### Preserved identity / `/api/market` semantics

- Current frontend source/tests contain **no** `/api/market` coupling (verified: zero matches); backend has no `/api/market` endpoint family; supported evidence publication remains under `/api/evidence/*`.
- Deployment provider/cache identity remains `"tradier"`; existing `"sandbox"` environment identity unchanged; cache keys, opportunity-history provider identity, recommendation provenance, and recommendation behavior remain stable.
- Historical documentation mentioning `/api/market` as prior-state context is retained as historical evidence, not rewritten away.

### Transitional topology after P3

- **Operator:** Console / Deployment / Production (unchanged).
- **Engineering (`/engineering/*`):** still exactly Universe Inspection, CSV Diagnostics, Scenario Replay.
- **Historical Labs (`/labs/*`):** still retained for the eight P1 deletion candidates — Laboratory / Delta Probe, ReferenceDataView / Options Chain, RecommendationLab, OpportunityLab, EtfCatalogExplorer, SecExplorer, FmpExplorer, MassiveChainView. **Velvet Rope is no longer among them.** `App.tsx` and the historical Lab host remain intentionally; P1 owns their final deletion/collapse.

### Verification evidence

Build passed. Full frontend suite passed: 109 files / 1,483 tests. Focused P3 suite passed: 17 files / 273 tests. Fixed-evidence golden test proves governance parity and zero network acquisition. Changed-file lint passed with no errors. `git diff --check` passed. P1 surface-presence check passed. Remote accepted `main` reverified after push. Repository-wide lint remains non-green **only** because of pre-existing accepted-`main` hook errors/warnings (especially `OperatorConsole.tsx`); these are pre-existing and are **not** converted into PL-CLEANUP work.

### Natural stopping point

P3 reached its intended boundary: governance judgment is decoupled from acquisition, the obsolete Velvet Rope UI and dead browser acquisition path are gone, and identity/provenance/recommendation behavior is unchanged. Historical Lab host and the eight P1 surfaces remain intact for P1.

### Next bounded increment

**P1 — Historical Lab / Spike Deletion.** Delete the eight superseded surfaces + exclusive supports and collapse the `App.tsx` Lab host, only after reverse-dependency evidence clears each. Execution requires separate Principal authorization; not begun.

---

## 2026-09-04 — PL-CLEANUP Package 1 complete (Historical Lab / Spike Deletion)

### Status

**P1 — COMPLETE / ACCEPTED.** Third bounded package of the ratified PL-CLEANUP decomposition executed (execution order P2 → P3 → P1 → P4). Implementation/completion record only; it authorizes no further cleanup. P4 remains the next bounded increment and requires separate Principal authorization.

### SHAs

- **Baseline (accepted `main` before this package):** `ce371a050fc6214f82b5af3a6bff4300ec8fe8f1` — remotely verified, not assumed.
- **P1 implementation commit:** `475ae1aff0200ee50c931ab4399c82f06983f90c` — `refactor(labs): remove superseded historical surfaces` (parent is the baseline SHA; the commit sits directly on the reviewed baseline).
- **Accepted `main` after push:** `475ae1aff0200ee50c931ab4399c82f06983f90c` — reverified remotely after push.

### Deletion result (ratified objective achieved)

> Collapse the obsolete historical Lab topology now that P2/P3 extracted every survivor.

All eight ratified superseded historical surfaces removed: Laboratory / Delta Probe (inline in `App.tsx`), ReferenceDataView / Options Chain, RecommendationLab, OpportunityLab, EtfCatalogExplorer, SecExplorer, FmpExplorer, MassiveChainView. The historical `/labs` route and the historical `App.tsx` Lab host were removed — no surviving legitimate responsibility remained in that host (its only inline surface was #1, and its only consumer was the `labs` branch in `Root.tsx`).

### Reverse-dependency discipline

Supporting code/config/tests/fixtures were deleted only after reverse-dependency evidence established that each was exclusive to the deleted surfaces or was residue whose only purpose disappeared with them. Historical file location was never treated as architectural evidence.

Exclusive support removed: `src/engineering/probeData.ts` (sole importer `App.tsx`); `src/hooks/useOptionsChain.ts`; `src/domain/provider.ts`; the orphaned presentation components `src/components/{OptionsTable,MetricsPanel,UnderlyingSelector,DeltaInput}.tsx` (importers were only deleted surfaces); the obsolete provider spikes/fixtures under `src/providers/*` (`mock/` + `data/*.json`, `massive/`, `etf-catalog/`, `sec-catalog/`, `fmp-catalog/`, and the now-empty `providers/` directory); and `src/opportunity/{evaluate,explain,sweep,types}.ts`. Tests protecting only deleted behavior were removed (`tests/opportunity/*`, `tests/hooks/useOptionsChain.test.ts`, `tests/providers/mock.test.ts`, `tests/sec-catalog/secCatalog.test.ts`, `tests/fmp-catalog/fmpProvider.test.ts`, `tests/components/{ReferenceDataView,OptionsTable,MetricsPanel}.test.tsx`).

### Preserved survivor boundaries

Deliberately retained, with live consumers: `/engineering/*` (Universe Inspection, CSV Diagnostics, Scenario Replay), shared `universe/*`, production/shared CSV infrastructure, Scenario Replay logic/fixtures/tests; surviving `velvet-rope/*` governance/domain capability and Deployment's governance imports (`velvet-rope/evaluate`, `velvet-rope/product-structure`); `opportunity-history/*` (a distinct surviving module, not to be confused with the deleted `opportunity/*`); shared domain calculations/policy/types; operator Console / Deployment / Production; evidence/acquisition/portfolio/accounting/recommendation/cache/provenance capability; and shared `App.css` (still imported by the surviving `EngineeringApp`).

### Workspace state / tests

Lab-only workspace fields were removed only where their sole consumers disappeared with P1 (`activeTab`, `providerKey`, `selectedSymbol`, `selectedExpiration`, `callTargetDelta`, `putTargetDelta`, `tieBreaker`, `strikesCount`, `showFullEvidence`, and the `chain*` and `opportunity*` lab-only fields). All `writeDesk*` fields and `missionTarget` retained; no broader workspace or vocabulary normalization was performed (that is P4).

Surviving tests were adjusted minimally: the deleted `/labs` assertion was removed from `tests/router.test.ts`; assertions protecting the deleted `PRIORITY_WATCHLIST` concept (and the dynamic-import guard against the deleted `opportunity/types`) were removed from `tests/universe/shared-universe.test.ts` while all shared-universe-service coverage was preserved. `PRIORITY_WATCHLIST` was deliberately **not** relocated into `universe/*` — moving a historical Opportunity Lab artifact into surviving domain code merely to keep an old assertion alive would have preserved accidental architecture.

### Resulting topology after P1

- **Operator:** Console / Deployment / Production (behaviorally unchanged).
- **Engineering (`/engineering/*`):** exactly Universe Inspection, CSV Diagnostics, Scenario Replay.
- **Historical Labs:** removed. `/labs` and the historical `App.tsx` host no longer exist.
- **Kreature:** explicitly outside PL-CLEANUP; not touched. GitHub Issue #10 was **not** remediated (the mention of `/app/kreature` in route topology is descriptive only and implies no Issue #10 work).

### Verification evidence

Build passed (`tsc -b && vite build`). Full frontend suite passed: **99 files / 1,314 tests**. Focused router/universe/engineering suite passed: **12/12**. Changed-file lint clean (5 changed files: `src/router.ts`, `src/Root.tsx`, `src/workspace/workspace.ts`, `tests/router.test.ts`, `tests/universe/shared-universe.test.ts`). `git diff --check` passed. All eight historical surfaces absent; `/labs` absent; historical `App.tsx` absent; `/engineering/*` still exactly the three P2 instruments; operator behavior preserved. Repository-wide lint remains non-green **only** because of pre-existing accepted-`main` errors/warnings outside the P1 change set (notably `OperatorConsole.tsx` hooks-rules errors); these are pre-existing and were **not** converted into PL-CLEANUP work. Remote accepted `main` reverified after push.

### Natural stopping point

P1 reached its intended boundary: the superseded historical Lab topology is gone, the eight surfaces and their exclusive dependencies are removed, and no supported evidence/acquisition/portfolio/accounting/recommendation/governance/cache/provenance capability changed. This is a clean decision point for whether P4 is worth executing now or cleanup is declared functionally complete for the day.

### Next bounded increment

**P4 — Vocabulary / Coherence.** Residual coherence per the ratified P4 definition: WriteDesk→Deployment naming where it reduces ambiguity, move live types out of `scan-orchestrator.ts`, prune remaining `/labs` terminology and obsolete workspace/CSS, reconcile `PL-POSTURE-01`; explicitly no mechanical `wd-*` rename campaign. Execution requires separate Principal authorization; not begun.

---

## 2026-09-04 — PL-CLEANUP Package 4 complete + PL-CLEANUP closed (Vocabulary / Coherence)

### Status

**P4 — COMPLETE / ACCEPTED.** Fourth and final bounded package of the ratified PL-CLEANUP decomposition executed. With P4 accepted, **PL-CLEANUP is COMPLETE / ACCEPTED as a whole** against its ratified exit criterion. This is a closure record only; it authorizes no further cleanup and begins no new pass.

### SHAs

- **P4 baseline (accepted `main` before this package):** `00cf8be757c61cf10443c72ff995b6ffe5f004c1`
- **P4 implementation commit / PL-CLEANUP closure SHA:** `51ee08f757ee28d742fc0715adf29a8b838ac6e8` — `refactor(cleanup): reconcile deployment vocabulary and ownership` (parent `00cf8be`). Verified remotely as accepted `main`; local `main` fast-forwarded to match; working tree clean.

### P4 change result (ratified objective achieved)

> Reconcile vocabulary/coherence after structural deletion established what remains genuinely live.

- Public route/component vocabulary aligned to **Deployment**: `WriteDesk.tsx` exports `Deployment`; `AppRoute` uses `"deployment"`; `Root.tsx`/`AppShell.tsx` render and label Deployment. Operator navigation is **Console → Deployment → Production** (Kreature separately governed).
- `/app/write` **retained** (deep links/history unaffected); resolves to the `deployment` route.
- Stable persistence/cache/evidence/provenance identifiers **retained** — provider identity `"tradier"`, `"sandbox"` env, ETag `gen-*`, cache keys, opportunity-history identity, recommendation provenance unchanged.
- `src/write-desk/scan-orchestrator.ts` **removed** (154 lines); live candidate/governance result types moved to `src/write-desk/candidate-types.ts` (93 lines); obsolete scan-era declarations removed.
- `CsvImportLab.tsx` **renamed** to `CsvDiagnostics.tsx` (content-identical rename; import updated in `EngineeringApp.tsx`).
- Bounded Lab/CSS residue reconciled: `write-desk.css` reduced; residual `/labs` terminology pruned from router doc/comments and workspace; obsolete workspace fields already removed in P1 not reintroduced.
- **No** mechanical `wd-*` rename campaign; scope stayed bounded to ambiguity/fragility reduction.
- Commit touched 41 files (+165 / −275), consistent with net accidental-change-surface reduction rather than feature change.

### PL-CLEANUP exit-criterion verification (against `51ee08f`)

The ratified exit criterion (`docs/parking-lot-3.md` §"Cleanup exit criterion") is satisfied on every clause:

1. **Only the three approved engineering capabilities remain behind the engineering boundary** — met. `/engineering/*` exposes exactly Universe Inspection, CSV Diagnostics, Scenario Replay.
2. **Governance evaluation no longer depends on legacy browser acquisition** — met (P3). `evaluateSymbolAdmission` consumes explicit `AdmissionEvidence`; no `/api/market` coupling.
3. **The eight superseded Lab/spike surfaces and their exclusive dependencies are gone** — met (P1). Surfaces, `/labs` route, and the historical `App.tsx` host are absent.
4. **`/api/market` and obsolete direct-provider coupling no longer enlarge ordinary change scope** — met. Backend returns 404 for `/api/market`; zero frontend references.
5. **Operator behavior remains stable** — met (see verification below).

> Zero Sonar findings and aesthetic perfection were explicitly NOT exit criteria; this closure does not claim them.

### Verification evidence

- **Principal browser smoke test:** PASS (Principal-performed, against Principal-restarted servers).
- **Kiro runtime/API/topology verification** (SYNC SHA `51ee08f`, servers restarted by the Principal — not Kiro): backend `/api/health` and `/api/status` 200; evidence snapshot 200 with `ETag "gen-22922"` and correct `304` on conditional retrieval; `/api/evidence/quotes` 200; `/api/market` and `/api/market/quotes` return **404**; every operator/engineering render-target module transformed and served by Vite without error; operator topology Console → Deployment → Production confirmed in running code with no `/labs` navigation; `CsvDiagnostics.tsx` present and served, old `CsvImportLab.tsx` absent on disk. Verdict: **PASS WITH KNOWN EXISTING DEFECT(S)** — the only outstanding item is the pre-existing, separately-governed Kreature/Issue #10 render defect.
- **Method limitation recorded honestly:** no browser-automation tool (Playwright/Puppeteer/headless Chromium) was available in Kiro's environment, so Kiro's runtime evidence is HTTP/route-resolution/module-transform based plus source at the exact SYNC SHA, not rendered-pixel/in-browser-console capture. The rendered-UI pass is the Principal's browser smoke test.

### Scope discipline preserved

GitHub Issue #9, GitHub Issue #10, and Kreature remain **explicitly outside** PL-CLEANUP and were not touched. The `/app/kreature` route still exists and its module transforms; its known render defect is an existing defect, not a P4 regression. No Sonar/lint remediation, dependency upgrade, backend/scheduler feature work, or new cleanup pass was performed.

### Natural stopping point

PL-CLEANUP reached its governing stopping rule. Accidental change surface has been reduced structurally (P1/P3 deletions) and semantically (P4 vocabulary/coherence), and the running system verifies stable. Wheelwright now reassesses readiness for the next product/infrastructure expansion.

### Next

Post-cleanup quality measurement: re-run SCA against `51ee08f` and produce a before/after comparison versus the prior SCA baseline (measurement, not remediation). No further PL-CLEANUP work is authorized.

---

## 2026-09-04 — PL-CLEANUP post-cleanup SCA (Sonar) before/after — measurement complete

### Status

Measurement only; no remediation, no product-code change. Durable artifact: `docs/reference-data/sonar/pl-cleanup-sca-before-after-v1.md`.

### What was measured

A **retrospective paired frontend Sonar comparison** of the PL-CLEANUP change — created because the only prior recorded Sonar baseline was **Java-only** while PL-CLEANUP was frontend-heavy (a real coverage gap). Same SonarQube 25.9 / SonarScanner 8.1 / Sonar Way profile / scope (`src`) / exclusions, isolated worktrees; BEFORE `f289fa5` vs AFTER accepted `main` `53918071dad0e8229df19c4d872a3d5e83669980`.

### Headline result

Files 210→175, ncloc 39,705→34,199, bugs 26→20, code smells 553→436, total issues 579→456, cognitive complexity 5,078→4,129, tech debt 3,681→2,928 min. Ratings: Maintainability A and Security A unchanged; **Reliability remains D**; **duplication density rose 1.9%→2.1%**; **vulnerabilities remain 0**. No Sonar rule increased.

### Conservative reading

Reductions are **primarily attributable to deleted code** (proportional to ~5.5k ncloc / 35 files removed); **no surviving-code remediation is claimed** (no issue-level differencing performed). Residual findings are **not** a remediation backlog.

### Separations preserved

Historical **Java** Sonar experiment kept separate and **unchanged** (zero Java source changed across PL-CLEANUP — git-verified). oxlint / LOC / file counts recorded as **supplemental** only, explicitly not the SCA result.

### Evidence / environment

Raw paired-scan evidence preserved off-repo at `/tmp/sca-raw/`. Local SonarQube was reinitialized to restore analysis access (prior H2 backed up to `sonar.mv.db.bak-20260904-125142`); this touched only the local evaluation instance, never the repository.

---

## 2026-09-04 — Post-PL-CLEANUP direction snapshot (current sequencing intuition)

Small snapshot of what we currently think to do next and why. Not ratified architecture, not a strict waterfall, not a new operating/phase/governance model — just a current hypothesis that may change as we learn. No parking-lot semantics changed.

- **PL-CLEANUP is complete.**
- Current rough view of the major product concerns:
  - **Economic Truth** — Portfolio + Production
  - **Trustworthy Knowledge** — Evidence + Universe
  - **Decision Quality** — Unified Deployment + strategy expansion
  - **Lifecycle Management** — Trade Lifecycle + Kreature
  - **Operator Discipline** — Behavioral HITL + morning workflow (cross-cutting the others)
- Current working dependency intuition (approximate, not a waterfall):

  ```
  Economic Truth
      ↓
  Trustworthy Knowledge
      ↓
  Decision Quality
      ↓
  Lifecycle Management
  ```
  with **Operator Discipline cross-cutting** those concerns.

- **Immediate implication:** we currently intend to explore **Portfolio + Production economic truth** next.
- **Credit spreads** remain desirable, but they provide a useful *horizon* rather than the immediate implementation target.
- Reasoning:

  > Wheelwright should understand the economic object it is managing before substantially increasing the complexity of the economic objects it can create.

- This does **not** mean "finish all accounting before credit spreads." We want to follow the dependency intuition and see how far it takes us. Work on economic truth should be driven by demonstrated needs, with future multi-leg/defined-risk strategies providing a useful forcing function.

---

## 2026-09-04 — Economic Truth discovery: "basis for what purpose?" (XLE) — settled why-state

Light preservation of a settled discovery branch. Not ratified architecture, not a new accounting model, not an implementation plan. No product change authorized.

### The XLE example

- Fidelity **Activity History**: 200 XLE shares acquired through put assignment at **$57.50/share**, transaction amount **$11,500**.
- A later Fidelity **position / Option Summary**: displayed **average cost $55.93**, cost-basis value **$11,186.35**.
- At the **$55** disposition (call-away), the **transaction-acquisition-cost** view implies roughly **$500** of stock erosion; the **Fidelity-displayed-value** view implies roughly **$186**.
- The **~$313.65** difference is **unexplained**.
- We explicitly do **not** attribute the difference to option premium, rounding, tax-lot treatment, wash sales, or any other mechanism without evidence. (An earlier premium-reduced-basis hypothesis was withdrawn; the arithmetic did not support it, and Fidelity documents covered-call premium as adjusting the *sale price at assignment*, not held-share basis.)

### The discovery question

> Basis for what purpose?

Current **hypothesis** (discovery, not ratified): economic truth may legitimately involve multiple basis-like quantities with different meanings and uses. The problem may therefore be **silent substitution between meanings**, not the existence of multiple numbers.

### The semantic-substitution finding

- Wheelwright's call-away consequence path can consume **either** an Activity-derived acquisition cost **or** a Fidelity-displayed average-cost/cost-basis value in the **same logical basis position**.
- Downstream behavior treats those values as though they have the **same economic meaning**.
- Wheelwright preserves useful **provenance** (where a value came from) but, in this path, does not preserve enough about **what the economic quantity means**.
- Symmetry worth noting: on the **put side**, Wheelwright already distinguishes broker acquisition-at-strike from an analytical effective basis — evidence that the system already recognizes multiple legitimate economic views in at least one area.

### Why this matters / next

- **Do not fix the calculation yet.** We have not established which quantity belongs in which calculation.
- The next domain question belongs partly with **accounting judgment**. Intended Jeff/CFO question: *"What does each of these numbers mean, and which belongs in which calculation — management economics, called-away decision support, realized strategy performance, and tax/accounting?"*
