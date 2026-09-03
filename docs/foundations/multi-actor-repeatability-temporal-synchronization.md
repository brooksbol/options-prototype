# Multi-Actor Repeatability and Temporal Synchronization Operating Model

**Status:** Ratified methodology
**Authority:** Category B — Ratified Methodology
**Scope:** Multi-actor synchronization, convergence, and scoped execution ownership
**System of record:** GitHub
**Relationship:** Extends the Project Memory Protocol

---

## 1. Purpose

Wheelwright is being built through an operating model in which a human Principal works with multiple independently reasoning AI participants.

The purpose of that operating model is not governance for its own sake.

It is to make it possible to:

- move quickly without allowing speed to create hidden damage;
- build high-quality systems without requiring the Principal to inspect every detail personally;
- trust accepted work because important claims and changes are grounded in evidence;
- preserve product and engineering quality as AI increases development throughput;
- reduce financial, operational, architectural, and execution risk;
- compound learning rather than repeatedly rediscovering project context;
- produce work that is credible and explainable to people outside the immediate project;
- develop a repeatable way of building serious systems with human judgment and multiple AI collaborators.

Governance that materially impedes those outcomes without providing commensurate protective value should be simplified or retired.

The operating model therefore seeks **minimum sufficient coordination**, not maximum ceremony.

The Project Memory Protocol governs durable remembering and reacquisition.

This methodology governs remaining current and convergent while work is underway.

Its central requirement is:

> **At every consequential boundary, an actor must be authority-current, repository-current, and convergence-safe.**

**Authority-current** means the actor understands the authority governing the contemplated action and possesses the capabilities required to perform it.

**Repository-current** means the actor has reconciled its understanding to GitHub's remotely verified accepted `main` at the most recent synchronization boundary required for the contemplated action.

**Convergence-safe** means no known unresolved material interpretive divergence would make the contemplated action premature.

These are bounded claims about the contemplated action, not universal claims that the actor knows everything currently true about Wheelwright.

---

## 2. Three Repeatability Requirements

The operating model requires three kinds of repeatability.

### Cold-start repeatability

A capable participant beginning without conversational memory must be able to reconstruct the governing project world through the normal repository bootstrap.

It should recover:

- current durable authority;
- accepted project state;
- relevant authority provenance;
- its role and authorization boundary;
- relevant unresolved context.

This should not require exceptional repository archaeology.

### Temporal repeatability

An actor that was correct earlier must remain capable of becoming correct again after the repository changes.

Correctness at the beginning of a session is not a permanent property.

Repository advancement must be detected and reconciled at consequential boundaries.

### Convergence repeatability

Independently reasoning actors are not expected to think identically.

Different actors may discover different evidence, challenge different assumptions, or reach different interpretations.

That diversity is useful.

The requirement is:

> **Material interpretive divergence must be reconciled before it becomes durable authority or implementation.**

Repeatability therefore does not mean uniform reasoning.

It means a common governing world, explicit synchronization with changing durable state, and reliable convergence before consequential mutation.

---

## 3. Authority Provenance

Durable authority must be both recoverable and cheaply understandable.

A cold actor should be able to determine through normal repository routing:

- which governing artifact or version is current;
- what prior ratified authority it superseded;
- why the transition occurred;
- where the current routing decision is recorded.

Prior ratified versions may be retained as historical provenance.

They must not appear to remain simultaneously current.

The governing principle is:

> **Ratified authority must have cheaply reconstructable provenance.**

Where explicit versioning materially reduces ambiguity for high-authority artifacts, version progression is preferable to ambiguous in-place mutation.

This does not require every document to be versioned.

The authority root must make current governing authority discoverable without requiring a future actor to reconstruct it through commit forensics.

---

## 4. Bootstrap and Synchronization

Bootstrap and synchronization solve different problems.

**Bootstrap asks:**

> What must I know to participate safely?

**Synchronization asks:**

> What changed since the repository state I understood?

Therefore:

> **Bootstrap establishes competence. Synchronization preserves competence through time.**

Every substantive actor establishes an explicit synchronization token:

> **SYNC SHA = the commit SHA currently advertised by GitHub for the accepted `main` branch after required reconciliation.**

A local `origin/main` reference must not be presumed current without remote verification.

An actor may therefore state:

> **I am repository-current through SHA X for this action.**

SYNC SHA describes repository freshness only.

It does **not** establish freshness of:

- runtime state;
- provider state;
- browser state;
- market state;
- databases or external artifacts;
- external systems;
- unpersisted current Principal intent.

Those require their own evidence.

### Synchronization is read-only

Establishing remote repository state does not itself authorize repository mutation.

> **Synchronization does not authorize modification of the local branch, index, working tree, untracked files, another actor's work, or repository history.**

Fetching or remotely querying state for inspection is distinct from pulling, merging, rebasing, resetting, stashing, checking out, or otherwise changing local work.

Local convergence occurs only after ownership, safety, and mutation authority have been established.

---

## 5. Synchronization Boundaries and Staleness

Continuous polling is unnecessary.

Synchronization occurs at consequential boundaries.

A **consequential boundary** is a point where an actor is about to:

- change durable state;
- begin implementation;
- edit governed repository content;
- rely materially on prior authorization;
- establish or alter project authority;
- commit or publish work;
- advance accepted repository state;
- perform an irreversible or materially costly action;
- represent repository or project state as current.

Judgment remains necessary. Trivial reasoning does not require synchronization ceremony.

At a required boundary the actor:

1. remotely verifies GitHub's accepted `main`;
2. compares it with its current SYNC SHA;
3. if unchanged, proceeds;
4. if advanced, examines evidence sufficient to understand the relevant change;
5. determines whether the advancement affects authority, assumptions, authorization, scope, or planned action;
6. reconciles affected understanding;
7. establishes the new SHA as its SYNC SHA;
8. then crosses the boundary.

An actor must not merely assert that an advancement is irrelevant. It must have evidence sufficient for that conclusion.

### Staleness

If accepted `main` advances beyond the actor's SYNC SHA, the actor is repository-stale until required reconciliation occurs.

Staleness is not an actor failure.

Acting as though stale knowledge were current is.

If the advancement is immaterial to the contemplated action, the actor may reconcile it, advance the SYNC SHA, and continue without unnecessary Principal escalation.

> **Relevant advancement stops stale action. Irrelevant advancement must not create paralysis.**

### Remote unavailable

If GitHub's accepted `main` SHA cannot be remotely verified, an actor may continue bounded exploration that does not assert current repository truth.

It may not cross a consequential boundary unless operating under explicit urgent-incident authority.

### Check/use race

Repository-current means current at the most recent required synchronization boundary, not permanently current.

Remote state may advance immediately after verification.

Therefore verification is required at boundaries appropriate to the capability being exercised, including before editing governed state, before commit, and before publication or advancement of accepted state.

If accepted `main` advances after a local commit is created, the local commit may be preserved.

It remains proposed state.

It is not converged merely because its author has reconciled it locally.

> **A change becomes converged repository state only when it has passed the governing repository process, is part of remotely verified accepted `main`, and is therefore retrievable by other actors as durable project state.**

Destructive history movement must not be used to manufacture apparent convergence.

---

## 6. Live Principal Authority and Contextual Authorization

GitHub is Wheelwright's durable project authority and accepted-state plane.

The Principal may also issue current instructions that are newer than GitHub.

These are different forms of authority.

### Durable project authority

Durable authority is persisted through the governing repository process and can be reconstructed by future cold actors.

### Active task authorization

A current Principal instruction may grant task-specific authority to the addressed actor.

That instruction does not become durable project-wide authority for future actors merely because it occurred in conversation.

Its accepted consequences and relevant provenance must be persisted through the governing repository process before cold actors can rely upon it.

Conversely, an older GitHub state does not invalidate a newer explicit Principal instruction to the addressed actor.

The rule is:

> **Current Principal instruction may grant task-specific authority now; future actors may rely only on authority made durable through the project's governing process.**

### Authorization is contextual

Authorization is not a perpetual capability token.

Before relying on prior authorization, an actor must determine whether repository advancement materially changed:

- the object being changed;
- governing authority;
- assumptions;
- constraints;
- scope;
- risk;
- the basis upon which authorization was granted.

> **Authorization survives repository advancement only when its material assumptions survive repository advancement.**

If those assumptions materially changed or cannot reasonably be established, the actor stops and reconciles.

---

## 7. Authority Mutation Gate

Before modifying ratified or otherwise governed authority, an actor must establish:

1. the artifact's current authority classification;
2. the current governing version;
3. applicable amendment or ratification rules;
4. current work mode;
5. the specific authority permitting the proposed mutation;
6. whether Principal ratification is required;
7. whether the change requires a new version, amendment, ADR, recorded revision, or other governing mechanism;
8. whether repository advancement changes any of those conclusions.

A proposal may be excellent and still unauthorized.

> **Useful judgment does not authorize mutation of ratified authority.**

Evidence and reasoning inform change.

Explicit authority governs change.

---

## 8. Divergence, Evidence Completeness, and Convergence

Independent reasoning is a feature of the operating model.

Agreement among AI participants does not itself create authority.

Disagreement among them is not itself a defect.

Divergence becomes material when competing interpretations would produce meaningfully different:

- authority;
- architecture;
- implementation;
- product behavior;
- policy;
- project or program state;
- prioritization;
- irreversible or materially costly action.

Trivial divergence may be resolved inline.

Material divergence requires explicit convergence.

### Evidence completeness

A correct observation is not automatically a complete change surface.

> **Do not convert an observed example into an assumed complete edit set. Inventory the governing surface when completeness matters.**

Where a change requires complete reconciliation—such as terminology, authority routing, duplicated invariants, or affected policy surfaces—the relevant surface must be examined before the proposed edit set is treated as complete.

Intentional non-changes may be recorded where doing so demonstrates that omission was deliberate rather than accidental.

### Convergence protocol

For material divergence:

1. independently reconstruct the issue from current authority and evidence;
2. compare interpretations explicitly;
3. identify common ground, disagreement, evidence, assumptions, and consequences;
4. inventory the governing surface where completeness matters;
5. reconcile against durable authority, accepted state, implementation evidence, and relevant why-state;
6. return unresolved material authority or architectural questions to the Principal;
7. obtain task-specific authorization for any resulting mutation;
8. designate one execution owner with an explicit capability envelope;
9. execute only the authorized mutation;
10. converge through the normal repository process;
11. resynchronize affected participants.

The governing rule is:

> **Divergent interpretations remain proposals until reconciled. Review convergence does not itself authorize mutation.**

---

## 9. Scoped Execution Ownership

When repository mutation is required, one participant owns preparation of the authorized change set.

Execution ownership is scoped.

It is not a standing role or general capability.

An execution-ownership envelope should establish, as appropriate:

- change-set identity;
- scope;
- base/SYNC SHA;
- files or systems included;
- files or systems explicitly excluded;
- authorized capabilities;
- start condition;
- completion or expiry condition;
- transfer procedure.

Relevant capabilities are distinct.

They may include:

| Capability | Meaning |
|---|---|
| Draft / working-tree edit | Prepare an exact proposed change |
| Amend Category A/B authority | Modify governed authority under applicable ratification rules |
| Commit | Create a local durable Git object |
| Push branch | Publish proposed repository state |
| Merge / advance `main` | Advance accepted repository state |
| Deploy / runtime mutation | Change operational or external state |

Authority for one capability does not imply authority for another.

> **Execution ownership identifies who prepares the authorized mutation; it does not implicitly grant authority to amend ratified artifacts, commit, push, merge, deploy, or modify external state.**

Those capabilities must be established by the task's authorization boundary.

Execution ownership ends when the change is:

- accepted;
- abandoned;
- superseded;
- expired;
- explicitly transferred.

Transfer must be explicit enough that two participants cannot reasonably believe they simultaneously own the same mutation.

> **Many may reason. One owns preparation. Capabilities remain explicit. GitHub records accepted state. Everyone resynchronizes.**

---

## 10. Shared Working-State Discipline

Unexpected local state is evidence.

It is not an inconvenience to be erased.

Before editing a repository-resident actor should establish:

- its base/SYNC SHA;
- its execution envelope;
- whether the working tree contains changes outside that envelope;
- whether another participant may own those changes.

Unexpected modifications, staged content, or untracked files are coordination findings.

They must not be silently:

- overwritten;
- absorbed;
- reset;
- stashed;
- committed;
- attributed to the current actor.

Their provenance and ownership must first be established.

Where practical, substantive concurrent work should use isolated branches or worktrees.

The preferred pattern is:

> **Isolated execution; GitHub convergence.**

The local filesystem must not become accidental multi-actor authority.

---

## 11. Urgent Incident Exception

Synchronization and governance exist to reduce risk.

They must not prevent necessary recovery.

Under **explicit current incident authority**, an actor may cross a normally blocked consequential boundary when waiting for ordinary synchronization would materially worsen an active incident.

The exception requires:

- explicit current incident authority;
- minimum necessary scope;
- no opportunistic unrelated changes;
- preservation of evidence where feasible;
- avoidance of destructive actions where safer alternatives exist;
- synchronization and durable reconciliation immediately after stabilization.

If GitHub is unavailable during the incident, remote verification may be deferred only until stabilization.

The incident exception is not governance-free operation.

It is bounded emergency authority followed by mandatory reconciliation.

---

## 12. Normal Actor Loop

The normal operating loop is:

> **Acquire → Anchor → Work → Revalidate → Reconcile → Converge → Act → Persist**

### Acquire

Retrieve the durable authority and project state needed for the task.

### Anchor

Remote-verify accepted repository state and establish SYNC SHA, work mode, task authorization, and relevant capability boundaries.

### Work

Reason, investigate, design, review, or execute within those boundaries.

### Revalidate

At a consequential boundary, verify whether accepted repository state has advanced.

### Reconcile

If it has advanced, determine from evidence whether authority, assumptions, authorization, scope, or planned action changed.

### Converge

If material interpretive divergence exists, resolve it before durable authority or implementation is created.

### Act

Exercise only the capabilities actually authorized.

### Persist

Make accepted consequences, relevant provenance, project state, and durable learning reconstructable for future actors through the governing repository process.

Then repeat.

The operating model does not assume that:

- yesterday's understanding survives today;
- this morning's repository state survives this afternoon;
- one actor's interpretation is automatically authoritative;
- agreement among AI participants substitutes for Principal authority;
- authorization to prepare work implies authorization to publish it.

---

## 13. Governing Axioms

The normative operating model reduces to the following rules:

1. **Read before reasoning.**
2. **Durable authority must be reconstructable through the normal routine.**
3. **Verify remote repository state before consequence.**
4. **A local remote-tracking reference is not proof of current GitHub state.**
5. **SYNC SHA describes repository freshness only.**
6. **Synchronize without mutating local work.**
7. **Repository-current is a bounded state established at required synchronization boundaries.**
8. **Relevant advancement stops stale action; irrelevant advancement must not create paralysis.**
9. **Current Principal instruction may grant task-specific authority; durable authority must be persisted for future actors.**
10. **Authorization is contextual, not perpetual.**
11. **Useful judgment does not authorize mutation of ratified authority.**
12. **A valid finding is not automatically a complete inventory.**
13. **Material divergence must converge before it becomes durable authority or implementation.**
14. **Actor agreement is not authority.**
15. **Execution ownership does not imply mutation capabilities.**
16. **Mutation capabilities are explicit and scoped.**
17. **Unexpected working state is evidence to reconcile, not state to erase.**
18. **Prefer isolated execution and GitHub convergence.**
19. **Emergency authority is narrow, temporary, and followed by durable reconciliation.**
20. **Persist accepted consequences so the next actor can start correctly.**

The operating axiom is:

> **Read before reasoning. Verify remote state before consequence. Synchronize without mutation. Reconcile material divergence before durable decision or mutation. Establish exact capability authority before mutation. Persist accepted consequences so the next actor can start correctly.**

---

# Appendix A — Constitutional Relationship

**Status:** Informative reference only. This appendix does not establish or amend constitutional authority. It becomes descriptive of governing topology only after that topology has been separately ratified through the appropriate authority process.

The intended relationship is:

> **Product authority governs the meaning and required behavior of Wheelwright; technology-quality authority governs the integrity and evolvability of its realization. Neither may silently override the other within the other's domain. Material conflict requires explicit Principal reconciliation.**

And:

> **Evidence can create pressure across an authority boundary; evidence cannot exercise authority across that boundary.**

This methodology depends on the separately governed constitutional relationship.

It does not ratify that relationship itself.

---

# Appendix B — Candidate Conformance Specifications

**Status:** Candidate specifications — manual, non-enforcing, and not promoted to standing controls.

These scenarios exist to test whether the operating model produces its intended outcomes.

They do not authorize creation of an automated actor-evaluation framework.

Initial use should be manual.

Where a scenario is exercised, useful evidence may include:

- starting prompt;
- remotely verified starting SHA;
- expected governing invariants;
- actor response or behavior;
- observed result;
- assessment;
- failure classification where applicable.

Automation should be considered only after repeated manual use demonstrates protective value sufficient to justify maintenance cost.

Candidate scenarios include:

### Cold start

Can a capable cold participant reconstruct current authority, accepted state, relevant provenance, authorization boundaries, and unresolved context without conversational coaching?

### Authority provenance

Can a participant identify current and superseded ratified authority through normal routing without commit archaeology?

### Temporal drift

Does a participant detect relevant advancement of accepted `main`, reconcile it, and reassess prior assumptions before consequential action?

### Irrelevant advancement

Can a participant establish from evidence that an advancement is immaterial and continue without unnecessary escalation?

### Convergence

Can independently reasoning participants expose and reconcile material divergence before durable mutation?

### Evidence completeness

Does a participant distinguish a correct observed example from a demonstrated complete change surface?

### Authority drift

Does a participant distinguish "this should change" from "I am authorized to change this"?

### Capability discipline

Does authorization to draft remain distinct from authorization to amend, commit, push, merge, or deploy?

### Shared working state

Does a participant stop and investigate unexpected local changes rather than erasing or absorbing them?

Candidate specifications should be promoted, revised, or retired according to demonstrated value.

---

# Appendix C — Provisional Failure Taxonomy

**Status:** Provisional analytical vocabulary.

Failure classifications are not mutually exclusive.

An assessment may identify a **primary failure** and one or more **contributing causes**.

### Bootstrap Failure

Required durable project state exists but was not recovered through normal bootstrap.

### Persistence Failure

Required durable knowledge was never persisted.

### Routing Failure

Current governing material exists but normal repository routing fails to lead participants to it correctly.

### Authority-Provenance Failure

Current authority exists but determining what governs requires exceptional historical reconstruction.

### Authority Drift

An actor is repository-current but acts outside its authority.

### Temporal Drift

An actor understands authority but acts against stale repository state.

### Convergence Failure

Material interpretive divergence becomes durable before reconciliation.

### Evidence-Completeness Failure

A valid observation is treated as a complete governing surface without sufficient evidence.

### Execution-Ownership Failure

Ownership of preparation is ambiguous or overlapping.

### Capability-Boundary Failure

An actor exercises a mutation capability not granted by its authorization envelope.

### Coordination Failure

Concurrent activity is insufficiently visible or isolated to prevent accidental collision.

### Project-State Representation Failure

Current project or program state is too implicit or fragmented to reconstruct reliably through normal operation.

### Evidence-Plane Confusion

Evidence from one governing domain is incorrectly treated as authority in another.

The taxonomy exists to improve diagnosis.

It should not become bureaucracy for its own sake.

---

# Appendix D — Optional Coordination Visibility Pattern

**Status:** Optional, event-triggered pattern. Not a lock, permission source, synchronization authority, or routine commit obligation.

Most work should not require a coordination artifact.

SYNC discipline, scoped execution ownership, isolation, and GitHub convergence are the primary controls.

For substantial overlapping multi-participant work, a lightweight coordination view may be useful when it reduces ambiguity.

If used, it may record:

- participant;
- current activity;
- base/SYNC SHA;
- execution scope;
- relevant capability envelope;
- expiry or review trigger.

It must:

- be used only when overlapping work justifies it;
- never treat absence of an entry as permission;
- avoid credentials, sensitive runtime information, or unnecessary operational detail;
- have an expiry or review condition;
- avoid turning ordinary status changes into repository commits;
- never supersede remote verification, execution authority, or GitHub state.

If the pattern becomes stale-state theater or costs more than it protects, it should be simplified or retired.

---

## Desired Outcome

This methodology succeeds when the human Principal and multiple AI collaborators can operate as a coherent system without requiring identical reasoning or constant human synchronization.

The desired result is practical:

> **Move faster. Build better. Know what can be trusted. Catch important risk before it becomes expensive. Preserve the reasoning that matters. Let independent AI judgment improve the result instead of fragmenting it. Keep governance lighter than the value it protects.**

For Wheelwright specifically, that supports the larger objective: build a trustworthy system for making money while controlling risk.

More broadly, it establishes a stake in the ground for AI-assisted systems engineering:

> **Human authority and judgment; multiple independent AI collaborators; durable machine-readable project memory; evidence-driven convergence; explicit mutation authority; and enough synchronization to make increased development speed trustworthy.**

The operating model is successful not because its rules are followed.

It is successful when those rules make high-quality outcomes faster, safer, more trustworthy, and more repeatable.
