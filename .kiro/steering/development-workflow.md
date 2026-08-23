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
