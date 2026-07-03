# Options Prototype — Project Journal

## Purpose

This is an append-only project journal.

It exists to preserve context that may otherwise be lost across ChatGPT threads, Kiro sessions, screenshots, implementation reports, and informal conversations.

This is not a formal specification.
This is not an ADR log.
This is not polished documentation.

It is a raw chronological memory layer for reconstructing the "why" of the project.

Use this when:
- A chat thread loses context.
- A future session needs to recover project intent.
- The team needs to understand why a decision was made.
- The repository no longer explains the learning path clearly enough.
- The project needs to resume after time away.

Append new entries at the bottom.

---

## Journal Rules

1. Append only.
2. Do not over-edit older entries.
3. Prefer raw useful context over polished prose.
4. Capture why-state, not just what-state.
5. Include implementation milestones only when they changed understanding.
6. Do not duplicate formal specs unless the context matters.
7. Screenshots may be referenced but do not need to be embedded.
8. This file is read only when rebuilding context.

---

## Entry Template

```markdown
## YYYY-MM-DD — Short Title

### Context

### What happened

### What we learned

### Decisions / implications

### Open questions
```

---

## 2026-07-03 — Bootstrap, Methodology, and First Observable System

### Context

Options Prototype began as the first working slice of a larger options-income control-system idea that emerged from a Crazy Investing discussion.

The original financial idea was not "build an options screener." It was the question of whether an options income strategy could be understood as a closed-loop financial control system.

Core conceptual background:

- Options premium as production output.
- ETF capital as productive capacity.
- Assignment as a state transition, not failure.
- Delta as a control variable / actuator.
- Covered calls and cash-secured puts as mechanisms for moving between cash and ETF ownership.
- The eventual system may observe portfolio state, compare it to a desired equilibrium, and recommend delta adjustments.

Slice 1 was deliberately narrowed to an options-chain module.

Purpose of Slice 1:

- Observe an options chain.
- Filter contracts.
- Calculate income metrics.
- Highlight contracts near target delta.
- Avoid brokerage integration.
- Avoid automation.
- Avoid prediction.

### What happened

The project was renamed from the broader "Crazy Investing" framing to **Options Prototype**.

We chose to begin with:

- React
- TypeScript
- Mock data
- No backend
- No Java
- No Docker
- No Postgres
- No brokerage connection

This was intentional. The first slice should produce working observable software, not infrastructure complexity.

A clean MacBook Air environment was bootstrapped. Important environment friction from the earlier GIA prototype was avoided by explicitly installing and verifying:

- Xcode Command Line Tools / Git
- Homebrew
- nvm
- Node LTS
- npm

A GitHub repo was created:

- `options-prototype`

The repository started with specifications and project knowledge before meaningful implementation code.

Created documentation structure:

```text
docs/
  00-project-charter.md
  01-environment.md
  02-domain.md
  03-requirements.md
  04-architecture.md
  05-design.md
  05a-component-map.md
  06-tasks.md
  development-machine.md
  foundations/
    closed-loop-engineering.md
```

Also created a root `README.md` after realizing the repo needed a public interface and clean-laptop bootstrap instructions.

### What we learned

#### 1. Kiro is useful, but we are using it inside a larger methodology

Kiro's native model appears to be:

```text
requirements.md
↓
design.md
↓
tasks.md
↓
implementation
```

That is useful for implementation-ready features.

This project started earlier than that.

We began with:

```text
Question
↓
Hypothesis
↓
Conversation
↓
Mental model
↓
Specification
↓
Architecture
↓
Implementation
↓
Evidence
```

This means we are shifting left relative to Kiro's default workflow.

That is acceptable.

Kiro is not the whole methodology. Kiro is one component inside a larger learning loop.

#### 2. Working software is the mechanism of learning

A key thesis emerged:

> AI accelerates organizational learning by reducing the cost of building working experiments that generate evidence.

Working software is not merely the end product.

Working software is the instrument that closes the learning loop.

This was true in GIA and is being made explicit here.

#### 3. Observable working software matters more than hidden implementation

We realized that several implementation tasks could produce no browser-visible changes.

That is risky because it lengthens the observation cycle.

New principle:

> Optimize for observation cadence, not merely implementation cadence.

This led to the idea of inserting an Engineering Console before the full end-user UI.

#### 4. The Engineering Console is not debug UI

Inspired by the GIA prototype, we inserted a T-04a task to replace the default Vite screen with an internal observability surface.

The console shows:

- Implementation status
- Domain module inventory
- Calculation probes
- Raw sample domain object JSON

This is not final product UI.

It is an observability surface.

It lets the running system participate in the learning loop before end-user features are ready.

#### 5. Domains are not yet known

Unlike GIA, this project does not begin with well-developed BRDs, business capability maps, or a master architecture.

The domain structure is still tentative.

Current files like `types.ts`, `calculations.ts`, and future `policy.ts` are modules, not necessarily domains.

We should avoid naming durable domains too early.

Potential future domains may emerge through implementation evidence.

The console may become a place where those emerging domains become visible.

#### 6. The repository is becoming institutional memory

The repository now holds:

- Specs
- Environment contract
- Architecture
- Design
- Tasks
- README
- Engineering philosophy
- Running code
- Test evidence
- Journal

This is more than source control.

It is a record of learning.

### Decisions / implications

- Keep Kiro constrained during implementation tasks.
- Allow Kiro to participate in bounded design-review checkpoints, as in GIA.
- Do not let Kiro silently change domain, architecture, or design.
- Insert observable UI / console slices when too many invisible implementation tasks accumulate.
- Use small commits at meaningful boundaries.
- Maintain root README as the operational/public entry point.
- Maintain this journal as raw append-only context recovery.
- Treat `docs/foundations/` as durable project philosophy.
- Treat `docs/journal/` as chronological project memory.

### Implementation state at this entry

Accepted or effectively completed:

- T-01 Project scaffold
- T-02 Vitest configuration
- T-03 Domain types
- T-04 Calculation library
- T-04a Engineering Console Bootstrap

Visible app state:

- Browser shows Engineering Console.
- Calculation probes are live and call domain calculation functions.
- Sample `OptionContract` JSON is visible.
- Default Vite screen is gone.

Test state:

- TypeScript compile passes.
- Build passes.
- Tests pass.
- At T-04a report: 2 test files, 31 tests passing.

### Open questions

- Should the Engineering Console remain permanent? Current instinct: yes.
- Should the console be renamed "Observatory" later?
- When should Kiro be invited into bounded design review?
- At what point do modules become domains?
- Should screenshots be stored in repo or outside repo?
- Should `docs/README.md` remain, since root `README.md` now exists?
- Should task plan be updated to formally include observation-cadence rules and Engineering Console milestones?