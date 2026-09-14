# Wheelwright — Development Workflow

## Prerequisites

- JDK 21 LTS (Temurin recommended)
- Node.js LTS (via nvm)
- `TRADIER_API_KEY` environment variable (stored in `.env` at workspace root)

## Running the System

```bash
# Java backend (port 3100)
cd evidence-service-java
export TRADIER_API_KEY=<key>
./gradlew bootRun

# Frontend dev server (port 5173)
cd options-prototype
npm run dev
```

The frontend proxies `/api/*` requests to the backend at `localhost:3100` automatically.

## Running Tests

```bash
# Java backend (173+ tests, JUnit 5)
cd evidence-service-java && ./gradlew clean test

# Frontend (1112+ tests, Vitest)
cd options-prototype && npx vitest run
```

Total: 1,285+ tests across both suites. Always run relevant tests after changes.

## Build Commands

```bash
# Backend build (compile + test)
cd evidence-service-java && ./gradlew build

# Frontend build
cd options-prototype && npm run build
```

## Principal Git Workflow

This is the current Principal-directed operating rule for routine Wheelwright development and defect work.

- The normal workflow is a single working tree on `main`.
- Do **not** create routine feature branches, bug-fix branches, worktrees, or pull requests.
- Do **not** create a branch merely because work is substantive.
- Kiro is the implementation actor in the active working tree.
- Codex may review that same working tree read-only when the Principal requests independent review.
- During implementation, diagnosis, review, or Principal browser testing, keep changes uncommitted unless the Principal explicitly authorizes persistence.
- Passing automated tests does not itself authorize commit or push.
- For operator-visible behavior, successful Principal validation is the normal acceptance gate.
- After the Principal explicitly accepts a coherent change, commit it and push directly to `main`.
- Before commit/push, remotely verify accepted `main` and reconcile any advancement; never assume local `origin/main` is current.
- Branches, worktrees, and pull requests are exceptions. Use them only when the Principal explicitly requests isolation or when a demonstrated technical necessity makes direct-`main` work unsafe. In the latter case, explain the necessity before creating one.
- Do not revive an older branch/worktree convention merely because an older project document recommends isolated execution. For routine Wheelwright work, this Principal workflow is the current operational rule.

This steering rule is intentionally explicit because conversational context is transient. A cold-start actor must recover the workflow from GitHub rather than rely on prior-chat memory.

## Authority Before Consumers

When an authority-bearing fact is wrong or inconsistent, repair the authoritative source before teaching downstream consumers exceptions.

- Trace an incorrect fact upstream to the component or persisted state that owns it.
- Do not compensate in frontend/UI/Decision code for a backend authority defect unless the architecture explicitly assigns that responsibility there.
- Before implementing a downstream fix, prove that each upstream authority the proposed fix depends on is correct in the live system.
- A test that injects the desired authority value does not prove correctness when the live appliance supplies a different value.
- Prefer repairing one incorrect authoritative fact over adding compensating logic to multiple consumers.
- When session, provenance, admissibility, canonicality, persistence, or other authority-bearing facts disagree, stop at the first incorrect authority boundary and diagnose there before proceeding downstream.

This does not weaken fail-closed behavior or authority precedence. It clarifies where defects should be repaired.

## Existing Capability Before New Machinery

A backlog item, future workflow, operator surface, or automation proposal is **not** evidence that the underlying capability is absent.

Before deferring an authorized task behind new architecture, design, UI, workflow automation, or a parking-lot item:

- Inspect current repository authority and implementation for an existing executable mechanism that already performs the required underlying operation.
- Distinguish **capability** from **product expression** from **workflow automation**. An existing capability may be usable even when its polished operator-facing workflow remains unfinished.
- Treat parking-lot items as declarations of an **unresolved delta**, not as negative capability declarations. The presence of `PL-*` means the concern described there remains open; it does not imply that every capability named in that item is unimplemented.
- If an existing canonical mechanism can safely perform the authorized work, use it rather than inventing a parallel path or deferring execution until a future workflow is built.
- Do not create a second mechanism merely to satisfy a one-time execution request when the existing mechanism is adequate.
- When an unfinished backlog item depends on or improves an already-existing capability, document that boundary explicitly so cold-start actors do not mistake future productization for a prerequisite.
- If a genuine missing capability or hard prerequisite prevents execution, identify the exact missing substrate and authoritative evidence for the blocker rather than inferring it from backlog wording.

**Anti-pattern:** treating “there is a parking-lot item for a better way to do X” as “Wheelwright cannot currently do X.”

## Project Layout

```
/                                 Workspace root
├── evidence-service-java/        Java backend (Spring Boot)
│   ├── src/main/java/com/wheelwright/evidence/   Application code
│   ├── src/test/java/            JUnit 5 tests
│   ├── build.gradle.kts          Gradle build (Kotlin DSL)
│   └── gradlew                   Gradle wrapper (canonical entry point)
├── options-prototype/            React frontend (Vite, TypeScript)
│   ├── src/                      Components, recommendation engines, domain logic
│   └── tests/                    Vitest tests
├── data/                         Durable assets
│   ├── seeds/                    Canonical universe seed CSV (1,286 symbols)
│   └── evidence.sqlite3          Runtime evidence store (not tracked in Git)
├── docs/                         Architecture, design, foundations, journal
│   ├── foundations/              Constitutional architecture documents
│   ├── contracts/                Versioned API contracts
│   └── journal/                  Append-only project journal
└── .env                          Environment variables (TRADIER_API_KEY)
```

## Code Style Conventions

### Java (backend)
- Java 21 features (records, sealed classes, pattern matching where appropriate)
- Spring Boot conventions for configuration and lifecycle
- SQLite via JDBC (no ORM)
- Tests: JUnit 5, AssertJ preferred for assertions
- No unnecessary Spring ecosystem imports — standard library first

### TypeScript (frontend)
- TypeScript strict mode
- React hooks for state management (no external state library)
- CSS custom properties for theming
- Vitest for tests
- Domain logic separated from UI components

## Important Constraints

- **No new technology without demonstrated need.** Every technology carries architectural burden. Current stack (SQLite, Spring Boot, React/Vite) is intentionally minimal.
- **No prediction logic.** The system applies policy to evidence, never forecasts.
- **No provider calls from frontend.** All market data comes through the backend evidence appliance.
- **ETag/304 contract is frozen.** Do not change snapshot shape without explicit version transition.
- **Credential custody.** TRADIER_API_KEY never appears in responses, logs, or frontend code.

## Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `TRADIER_API_KEY` | Provider authentication | `.env` file or shell export |

## Ports

| Service | Port |
|---------|------|
| evidence-service-java | 3100 |
| options-prototype (Vite) | 5173 |
