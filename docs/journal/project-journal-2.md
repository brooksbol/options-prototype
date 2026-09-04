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
