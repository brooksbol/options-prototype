# Wheelwright — Agent Entry Point

**Agents start here.** The root `README.md` is for humans: project overview, setup, and operator/developer guidance. Do not use it as an agent bootstrap or substitute for project authority.

This file is the canonical *entry point* for AI actors, not a new or competing source of Wheelwright Product meaning, governance, execution permission, or architecture. The authoritative documentation model remains in `docs/README.md`; detailed agent cold-start routing is in `docs/AGENTS.md`.

## Mandatory cold start

Before consequential reasoning, review, design, implementation, reconciliation, or execution:

1. Read `docs/AGENTS.md` for mandatory cold-start routing, known-failure-modes reading, and shared actor protocols.
2. Read `docs/README.md` as the authoritative documentation guide and A–F authority model.
3. Follow the actor-specific bootstrap (Codex, Kiro, or other actor) referenced by `docs/AGENTS.md`.
4. Acquire current task and experiment state, complete parking-lot and journal continuation context where required, applicable principles/decisions/contracts, and authorization boundaries.
5. Verify repository synchronization and protect in-flight and unrelated work before any permitted mutation.

Do not treat a prompt, previous session, local checkout, this entry file, or a convenient summary as independent authority. Principal authorization and repository execution gates still govern changes. Apply the documented authority precedence in `docs/README.md` to conflicts. Escalate unresolved conflicts or missing authority to the Principal before proceeding with the affected consequential work.

## Separation of audiences

- `AGENTS.md`: entry and routing instructions for AI actors.
- `docs/AGENTS.md`: detailed agent cold-start routing and shared actor protocols.
- `docs/README.md`: authoritative documentation map, governance, and human reading paths.
- `docs/bootstrap/`: actor-specific and specialized bootstrap procedures.
- Root `README.md`: human-oriented project and developer documentation; no agent cold-start instructions.

Keep this entry concise. Maintain substantive governance in its established authoritative location rather than duplicating or weakening it here.
