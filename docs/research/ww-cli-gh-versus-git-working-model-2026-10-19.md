# Product Research — `ww` CLI Working Model: `gh` versus `git`

**Date:** October 19, 2026  
**Status:** Principal-originated Product research / working-model thesis; exploratory, not ratified Product contract, architecture decision, command grammar, or implementation authorization.  
**Canonical idea identity:** `PL-CLI-01` (composable Unix Wheelwright CLI).  
**Related precedent:** `docs/71-pl-cli-composable-wheelwright-checkpoint-2026-10-03.md`; `docs/design/ww-pull-ux-feedback-2026-10-15.md`.

## Principal thesis

> The `ww` CLI will end up looking more like `gh` than `git` on the command line.

**Important clarification by the Principal:** This is **not** a comparison of software-development and financial-trading domains, their risks, or which service initiates which kind of transaction. The analogy concerns the **working model** and **design/interaction model** experienced by humans and agents.

The Principal additionally observed:

> Agents use both `gh` and `git`, just for different things.

That complementary use is material to the thesis; it is not a claim that `gh` universally replaces `git`.

## Distinction being investigated

- **`git` — workspace-oriented working model:** an operator works *inside* a local repository/worktree, inspecting changes, editing, staging, committing, and synchronizing local state. The working loop emphasizes local transformations and version history.
- **`gh` — domain-resource-oriented working model:** an operator works *with* discoverable resources such as issues, pull requests, and workflows: discover, inspect, operate, observe status, and iterate. Commands offer a navigable vocabulary over broader capabilities.
- **Potential `ww` trajectory:** the dominant interface may feel closer to the second model: discover accounts/positions/evidence and other Wheelwright resources, inspect them, request bounded operations, and observe resulting state. This is a **hypothesis about operator interaction**, not a ratified mapping of Product ontology directly to CLI nouns.

Both tools serve agents because they address **different aspects of the same workflow**. An agent may use `git` for local change operations and `gh` for hosted workflow resources. By analogy, Wheelwright can preserve Unix/local composition while developing a resource-oriented command discovery and interaction layer. These are not mutually exclusive models.

## Relation to already preserved Wheelwright Product direction

The existing `PL-CLI-01` exploration states:

- Build reusable Wheelwright capabilities rather than pre-scripted operator workflows.
- Small, discoverable `ww` tools should compose through ordinary Unix facilities; **the shell is the SDK**.
- Humans, scripts, and agents share the toolbox, including discoverable help, composable structured results, meaningful exit status, and bounded semantics.
- A web application and `ww` should use shared backend domain capabilities, rather than duplicating business meaning in clients.
- Composition must not collapse evidence, assertion, recommendation, order, and execution authority.

This new analogy **refines the interaction-model lens** for those aspirations; it does not supersede their Unix-composability principle. Earlier `ww pull` UX research also used `git pull` as a narrowly scoped benchmark for truthful, proportionate human output. That remains a useful *presentation* precedent, despite the broader `gh`-like resource-navigation thesis.

## Candidate Product research questions

1. When operators and unfamiliar agents use `ww`, is the natural unit of interaction a **domain resource and its operations**, a local workspace artifact, or a mix?
2. Which tasks are best expressed through `ww`-native resource commands versus ordinary shell tools, files, and scripts?
3. Does a discoverable, consistent noun/verb grammar help agents learn `ww` independently from `ww --help` and command help without imposing one command per workflow?
4. Can agent operators move from discovery to inspection to bounded action to observation without hidden command-specific conventions?
5. Can machine-readable results, stable identifiers, explicit scopes, honest errors, and observable state transitions coexist with concise human default output?
6. Which existing commands and accepted operator specimens support or falsify the `gh` analogy? Would a concrete task still be more naturally implemented via Unix composition or a `git`-like local operation?

## Candidate evaluation, not commitment

A useful falsifiable test is to give an unfamiliar agent a set of real Wheelwright operator questions and only installed `ww` command discovery, and observe whether it can find resources, inspect their meanings, compose results, and explain any authority or evidence boundary. Compare this against actual human terminal usage and accepted `tt live`/CLI precedents. Do **not** predeclare a command hierarchy, rewrite a CLI, mandate remote hosting, or infer missing primitives without testing existing `ww` and Unix composition.

A possible shorthand for the thesis is:

> `ww` may converge toward `gh` as a discoverable, resource-oriented interface for humans and agents, while retaining `git`-like strengths in local tooling and Unix composability.

This shorthand is an **assistant synthesis**, not a separate Principal ratification.

## Open status and authorization

- **Observed:** Principal explicitly supplied the thesis and the complementary agent-`git`/`gh` observation.
- **Inferred/candidate:** comparative working-model taxonomy and possible implications for `ww`.
- **Ratified here:** nothing new. Existing `PL-CLI-01` and API v2 authority remain controlling.
- **Unresolved:** command grammar, how strongly a resource model should shape the CLI, scope of local operations, and the most useful falsifying operator/agent tasks.
- **Not authorized:** code changes, new endpoints, architecture changes, a new roadmap initiative, or promotion of this research to a Product requirement.

## Provenance

Principal/ChatGPT discussion, October 19, 2026. Initial assistant framing incorrectly emphasized domain/risk differences; Principal corrected that framing to working and interaction models. The revised analysis contrasted workspace-oriented `git` with resource-oriented `gh` and treated agents' use of both as a signal of complementary interfaces.
