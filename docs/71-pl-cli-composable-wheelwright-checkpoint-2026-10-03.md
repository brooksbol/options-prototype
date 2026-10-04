# PL-CLI-01 — Composable Wheelwright CLI Exploration Checkpoint

**Date:** October 3, 2026  
**Status:** Exploration / why-state checkpoint supporting `PL-CLI-01`; not ratified architecture, final Product contract, command grammar, API contract, or implementation authorization.  
**Canonical intake identity:** `PL-CLI-01` in the complete `docs/parking-lot*.md` sequence.

---

## Purpose

This checkpoint preserves the materially developed exploration behind `PL-CLI-01` before implementation begins producing new evidence.

The idea worth preserving is smaller than a CLI design:

> **Wheelwright offers reusable domain capabilities; `ww` exposes small, discoverable tools over them; people, scripts, and agents use ordinary Unix composition to construct questions and workflows Wheelwright did not anticipate.**

The Principal's guiding heuristics are:

> **Build capabilities, not anticipated workflows.**

> **Are you giving me another building block, or are you predicting what I'm going to build?**

> **What did you just make impossible by making this convenient?**

A broader design preference underlies these questions: when future use is uncertain, preserve useful optionality instead of unnecessarily embedding a prediction about the future into the architecture.

This document intentionally preserves hypotheses, specimens, boundaries, and learning tests. It does **not** turn the specimens into an implementation backlog.

---

## 1. Principal-selected exploration constraints

### 1.1 Small Wheelwright-native building blocks

`ww` should expose small, useful capabilities with strong Wheelwright meanings rather than one command per anticipated operator workflow.

**Flags specialize an operation; composition combines operations.**

The unit of Product capability is the primitive, not the workflow. Ordinary Unix facilities provide orchestration: pipes, redirection, `&&`, `||`, command substitution, loops, variables, `find`, `xargs`, `watch`, scripts, cron, and related mechanisms.

A useful shorthand is:

> **Small Wheelwright tools designed for Unix composition.**

and:

> **The shell is the SDK.**

### 1.2 Humans, scripts, and agents share the toolbox

Humans may invoke `ww` directly, compose one-liners, or save scripts. Agents should discover and compose the same primitives rather than requiring a separate Wheelwright command language.

There is no requirement to create an agent-specific orchestration API merely because agents are an important consumer.

### 1.3 Agent-friendly from day one

Agent-friendly is a Product constraint, not a synonym for MCP.

Candidate qualities include:

- discoverable root and per-command help;
- semantic explanations, not syntax alone;
- predictable stdin/stdout/stderr behavior;
- meaningful exit status;
- explicit provenance, freshness, uncertainty, assumptions, and authority boundaries where material;
- composable structured results;
- sufficient self-description for an unfamiliar agent to learn the available toolbox.

A core Product test is:

> **Can an unfamiliar agent, given shell access and only `ww --help` plus discoverable command help, safely discover and compose Wheelwright capabilities to answer a question that was never implemented as a dedicated workflow?**

MCP or another agent protocol may later be useful. This exploration deliberately does not assume it is required.

### 1.4 One command, one meaning; representation adapts to output context

A command has one semantic meaning. Output context may change its representation.

A direct invocation such as `ww observed-prices ...` may render aligned headings, friendly labels, elapsed ages, Unicode, or color when stdout is a terminal.

The same command in a pipe or redirect should naturally emit undecorated composition-oriented data without requiring routine `--machine`, `--quiet`, or `--json` ceremony.

TTY state describes output context, not whether the consumer is human or agent.

Explicit stable formats such as future JSON/CSV/TSV forms may still be useful when a caller requires a guaranteed representation. Exact formats remain unresolved.

Consequential semantics and authority must never change because stdout is or is not a TTY.

### 1.5 Shared Wheelwright backend and domain capabilities

At least for the current exploration, the web application and `ww` should be two clients of the same Wheelwright backend and semantic authority.

The desired pressure is:

> **The web app and `ww` share backend domain capabilities, not backend representations tailored to either client.**

A React-shaped endpoint is suspicious if the CLI must unpack screen layout to recover the underlying domain capability. The inverse is also true: the backend should not become shaped around shell records merely because `ww` exists.

Cheap deterministic composition over already-established facts may remain local: sorting, limiting, selecting fields, presentation, serialization, and similarly narrow transformations.

If a seemingly small `ww` primitive would require duplicating substantial browser/domain semantics, that is architectural pressure to inspect rather than permission to create a second Wheelwright implementation.

Current caveat: portfolio state remains substantially client-owned today. This exploration must not pretend `ww positions` already has a shared authoritative backend source when it does not.

### 1.6 Ontology informs the toolbox without mechanically becoming it

The Category E draft Wheelwright Semantic Model is useful for preventing semantic collapse, but it is not a command catalog and is not promoted by this exploration.

Relevant distinctions include Account/capital concepts; Instrument versus Contract; holding/obligation versus Economic Construction versus Complete Position; Observation versus Assertion versus Reconciled State; Candidate versus Alternative versus Recommendation; Action versus Order versus Execution; and Scenario/Market Thesis versus constraint, preference, or outcome desirability.

Trader-friendly terms such as positions, puts, iron condors, and covered calls remain legitimate operator vocabulary when their scope and meaning are precise.

### 1.7 Freedom in composition; rigor at semantic and authority boundaries

Humans and agents should be free to invent unusual read-only compositions.

Composition must not silently turn:

- an observation into an authoritative portfolio fact;
- a Candidate into an Alternative;
- an Alternative into a Recommendation;
- a Recommendation into operator selection;
- a selection into an Order;
- an Order into an Execution;
- absence into false or zero;
- stale or unavailable evidence into established truth.

A useful summary is:

> **Unix openness on the outside, Wheelwright epistemic discipline underneath.**

---

## 2. Named scripts as learned compositions

A useful composition may later be named and preserved as inspectable ordinary shell.

The emerging distinction is:

- **Primitives:** durable Wheelwright capabilities and meanings.
- **Named scripts:** optional, inspectable compositions learned through use.
- **Workflows:** belong to the composer unless repeated evidence establishes a stronger reusable Product/domain capability.

An agent receiving a question may search the script library for a duplicate, parameterized variation, or useful sibling before constructing a new composition. If no fit exists, it can compose primitives dynamically. The Principal or another authorized operator may choose to preserve a useful composition.

The script library must not become a proprietary workflow language or a second implementation of Wheelwright semantics.

Repeated awkward composition is useful evidence. If humans and agents repeatedly reconstruct the same stable domain concept from several primitives, Wheelwright may be missing a reusable primitive or shared backend capability.

Script-library storage, metadata, governance, naming, and implementation remain unresolved and are not part of the first thin slice.

---

## 3. Composition specimen catalog

The following are **operator-question specimens and illustrative compositions, not accepted syntax, promised commands, implementation requirements, or backlog items**. They preserve the intended Unix character and provide future human/agent learning tests.

| Operator question | Illustrative composition / capability shape |
|---|---|
| What positions expire soon? | `ww positions \| ww expiring --within 14` |
| What positions expire soon, with just useful fields? | `ww positions --account PTS --status open \| ww expiring --within 14 \| ww table --columns symbol,structure,expiration,dte` |
| What are my five worst-performing near-term iron condors? | `ww positions --account PTS --status open \| ww structure --name iron-condor \| ww expiring --within 21 \| ww sort --by unrealized-pnl --ascending \| ww limit --count 5 \| ww table` |
| Show me XLE in detail. | `ww positions --account PTS --symbol XLE --status open \| ww inspect --include evidence,history` |
| What positions are losing and expiring soon? | `ww positions \| ww losers \| ww expiring --within 14` |
| What requires attention among positions expiring soon? | `ww positions \| ww expiring --within 21 \| ww rank pressure` — early specimen only; attention/pressure semantics unresolved. |
| What recent Fidelity files do I have, and what are they? | `find ~/Downloads -type f -name '*.csv' -mmin -10 -print0 \| ww files --null \| ww identify --broker fidelity \| ww table --columns file,type,recognized` |
| Which recent Fidelity files are valid for some later admission step? | Filesystem selection → `ww files` → identification → validation. Recognition/validation is not admission. |
| Produce a report of positions expiring in 30 days, but only if production connectivity is healthy. | `ww doctor --profile production --check read && ww positions --account Roth --status open \| ww expiring --within 30 \| ww csv --columns symbol,structure,expiration,dte > ~/reports/expiring.csv` |
| What contracts fit a DTE/delta/liquidity window? | Future contracts source → DTE → delta → liquidity/open-interest selection → ordering. |
| What option expirations are available for this underlying? | Future contracts/chains source → expiration selection → presentation. |
| What strikes fit the probability/delta region I care about? | Future contracts source → DTE → delta/strike → liquidity → sort/limit. |
| What defined-risk structures fit my risk/capital constraints? | Future candidates/contracts → width → governed max-loss/buying-power consequence → selection/order. |
| Which choices have acceptable buying-power effect? | Future Alternatives/Candidates → governed consequences → local selection/order. |
| What orders are currently working? | Future Orders source → status selection → sort/presentation. |
| What filled today? | Future Executions source → time selection → presentation. |
| What happened to the order I submitted? | Orders + Executions/history composition, preserving that order disappearance is not evidence of execution. |
| How did fills compare with the plan? | Decision/plan history + Executions → comparison; possible learned composition `fill-versus-plan`. |
| What is my capital burden by account? | Account/capital facts → grouping/netting/summary; possible learned composition `capital-burden-by-account`. |
| What near-expiration iron condors deserve inspection? | Positions → conventional structure selection → expiration selection → ordering/inspection; possible learned composition `near-expiration-iron-condors`. |
| Are my working exit orders where I expect them to be? | Positions/Decisions → working Orders → comparison/inspection; possible learned composition `working-exit-check`. |
| What is the current volatility context for XLE? | Evidence/market observations → symbol selection → volatility projections/inspection; possible learned composition `xle-volatility-context`. |
| What new broker artifacts arrived this morning? | Filesystem selection → `ww files` → broker identification → validation/inspection; possible learned composition `morning-broker-inbox`. |
| Which observed prices are missing or oldest? | Backend observations → missing-observation selection / observation-time ordering, preserving later acquisition failure separately from an earlier successful observation. |
| Which displayed market index has the largest reported daily move? | Existing Markets capability → ordering by provider-reported change; useful future API-contract probe. |

Candidate primitive families explored, without commitment: account/symbol selection; DTE ranges; calls/puts; open/closed; conventional structure selection; winners/losers; sort; limit; group; compare; net; freshness/staleness; provenance; uncertainty; consequences; expected move; P&L; buying-power effect; max loss/profit; order status; fill history.

The specimens serve three purposes:

1. preserve why composition is interesting;
2. provide future cold-start agent questions;
3. provide real operator questions from which later thin slices may be selected.

They are not a roadmap or implementation checklist.

---

## 4. Conversation is above `ww`, not inside it

A later insight sharpened the division of responsibility:

> **`ww` is a composable Wheelwright capability surface, not a conversational interface. Humans can use it directly; scripts and agents use the same primitives. An ordinary AI chat session may handle conversation, references, planning, and explanation while using the shell to discover and compose `ww`. Those conversational abilities do not need to become `ww ask`, `ww chat`, an agent-specific grammar, or a Wheelwright conversation subsystem.**

The layers have distinct jobs:

- **Primitives:** durable Wheelwright capabilities and meanings.
- **Named scripts:** optional, inspectable compositions learned through use.
- **Chat:** adaptive reasoning and orchestration for the current interaction.

A chat session may remember what “that opportunity” referred to, but conversational memory does not establish a Wheelwright fact or authorize an action. The agent must obtain facts from the appropriate capabilities and preserve uncertainty, provenance, time, and authority boundaries.

Direct human CLI use remains first-class.

A useful conceptual stack is:

> **Wheelwright backend/domain capabilities → `ww` primitives → Unix compositions → answers → ordinary AI conversation**

A useful formulation is:

> **Wheelwright supplies capabilities. Unix composes capabilities into answers. Conversation composes answers into investigations.**

The conversational interface itself need not be a Wheelwright subsystem and need not be tied to a particular AI product or protocol.

### Multi-turn cold-start investigation — later Product test, not first-slice acceptance

A canonical future specimen:

1. Operator: “What does the market look like this morning?”
2. Agent discovers an unusually attractive opportunity that appears only occasionally, but current buying power is insufficient.
3. Operator: “Is it worth buying to close something less lucrative to regain enough buying power for this?”
4. Agent composes different capabilities to compare close consequences, capital released, remaining opportunity, transaction cost, concentration, and the new opportunity.
5. Operator: “Which position would cost me the least to give up?”
6. Operator: “What if I only need $4,000?”
7. Operator: “How much expected income am I giving up?”
8. Operator: “Does that increase concentration somewhere else?”
9. Operator: “Compare the best two choices.”

The follow-up questions cannot be predicted before the preceding answers exist. That is the point.

The later Product test is whether an unfamiliar conversational agent can pursue such an investigation by discovering and recomposing `ww` primitives without Wheelwright developers having designed the conversation.

This is **not** an acceptance criterion for the first thin slice; the first slice intentionally has too few capabilities to test it fairly.

---

## 5. First thin working slice — selected learning specimen

The Principal intends the first implementation attempt, after the required durable checkpoint and separate authorization, to be deliberately small.

### Six required constraints

The first slice must satisfy all six:

1. **Existing visible web capability.** Implement a small real operator-visible capability that exists in the Wheelwright web app. Sharing an endpoint alone is insufficient; the Principal should be able to point to a web capability and say “`ww` gives me that little piece too.”
2. **Real `ww | ww` composition.** At least one meaningful pipeline where both primitives have independently intelligible purposes. Generic `cat` or formatting-only proof does not satisfy this.
3. **Measurably different human versus pipe/redirect output.** Direct TTY output and pipe/redirection output visibly differ while preserving one semantic meaning. Color, headings, alignment, Unicode, friendly labels, or similar terminal affordances are sufficient for the first slice.
4. **Existing Wheelwright backend.** The CLI consumes the existing WW backend used by the web application. No mock as the actual slice, parallel CLI backend, local bypass, new CLI truth source, or duplicated domain computation substituting for the shared capability.
5. **Backend contract quality/versioning is an explicit learning surface.** The second client tests whether the backend exposes reusable domain capabilities or client-shaped contracts.
6. **Cold-start agent discovery.** An unfamiliar agent with shell access and only `ww --help` plus discoverable per-command help should have a reasonable chance of discovering and composing the tiny vocabulary. MCP is not required.

### Selected specimen: Operator Console Spot and Quote Freshness

The selected first-slice candidate is the Operator Console's visible **Spot and Quote Freshness** capability for explicitly named underlyings.

Current web behavior projects backend quote observations into Spot and Quote Freshness for a position's underlying, and position detail exposes when price was observed.

The existing backend selective quote-observation capability returns underlying price and `observedAt` separately from acquisition status and attempt time. Importantly, it preserves a prior successful observation after a later acquisition failure.

Illustrative grammar only:

    ww observed-prices --symbol XLE --symbol SPY
    ww observed-prices --symbol XLE --symbol SPY | ww sort --by observed-at
    ww observed-prices --symbol XLE --symbol SPY > observations.dat

The exact names and pipe encoding are not settled.

#### Human output

A direct terminal invocation should visibly present a human-oriented view, for example aligned, labeled columns such as Symbol, Observed Spot, Observed, and Acquisition, a friendly elapsed age, and useful visual emphasis.

#### Pipe/redirect output

The same source in a pipe or redirect should emit undecorated composition-oriented data retaining the recorded timestamp and separate acquisition state: no ANSI color, human heading, rounded display string replacing the underlying value, or implied freshness verdict.

The exact encoding remains open.

#### Shared versus local meaning

Shared backend meaning:

- observed underlying price;
- observation time;
- acquisition status / attempt facts;
- preservation of a prior successful observation after later acquisition failure.

Local CLI composition/presentation may include:

- ordering established records;
- terminal layout;
- human-readable elapsed age.

The CLI must not independently decide evidence admissibility or convert acquisition failure into loss of the prior observation.

### Positive and negative observations

Useful evidence includes:

- the Principal recognizes the same small capability in web and CLI;
- direct TTY and redirected/piped output visibly differ while facts agree;
- `ww source | ww sort` answers a question not implemented as a dedicated workflow;
- an unfamiliar agent discovers the source and sorter from help;
- no duplicate evidence policy appears in CLI code;
- no observation remains distinguishable from zero;
- a later failed acquisition remains distinguishable from a missing observation and does not erase the earlier successful observation;
- backend unavailability is distinguishable from a successful empty result.

Evidence weakening the hypothesis includes:

- the CLI is only a prettier HTTP call with no useful composition;
- the transform is not independently useful;
- help is insufficient for cold discovery;
- routine composition requires repeated format-mode incantations;
- uncertainty or provenance is lost;
- the CLI must recreate backend trust/domain semantics to make the answer useful.

### Human test

In the live non-demo Operator Console, point to a position's Spot and Quote Freshness, query the same underlying through `ww`, and compare the observed value/time. Repeat direct, pipe, and redirect forms against the existing backend.

Include a symbol without an observation; it must not become zero. Where available, include a later failed acquisition with a preserved earlier observation.

### First cold-start agent test

Give an unfamiliar agent shell access and only `ww --help` plus discoverable command help.

Ask:

> “For these underlyings, show the observed prices from oldest observation to newest. Say which have no observation, and don't confuse a failed later acquisition with a missing price.”

Observe whether the agent discovers the source and sorter, constructs the pipeline, explains uncertainty correctly, and distinguishes command/backend failure from an empty successful result.

### Deliberately excluded from the first slice

The first slice does not build `ww positions`, account discovery, option chains, acquisition/refresh commands, a general freshness verdict, script library, MCP, conversational syntax, trade execution, portfolio migration, or backend changes merely for CLI serialization.

A second candidate, the existing Markets header glance, remains a useful future specimen and potential backend-contract probe because its fixed index set, display labels, and sparkline-oriented payload may expose screen-shaped pressure. It is not selected for the first slice.

---

## 6. Backend contract evolution / versioning learning rule

The second client is intentionally a test of backend reusability.

Before changing the backend because `ww` dislikes a contract, distinguish:

### A. Presentation/projection difference

The shared domain facts are sound; web and CLI merely need different projections or serializations.

Keep the shared contract. Project locally.

### B. Shared-capability/contract problem

A legitimate second client cannot obtain the domain facts or meaning without unpacking web layout, inventing missing semantics, or duplicating domain logic.

Record the concrete failure and consider a **versioned shared contract** rather than permanently adapting `ww` around the defect or immediately breaking the existing web client.

The intended evolutionary pattern is:

    existing web app -> backend contract v1

If evidence warrants:

    existing web app -> backend contract v1
    ww               -> improved backend contract v2

Use `ww` to exercise and learn from v2. In later separately authorized work:

    web app -> backend contract v2
    ww      -> backend contract v2

Only after migration and evidence should retirement of v1 be considered.

The learning sequence is:

> **observe smell → distinguish projection problem from capability problem → version when the shared capability contract is genuinely wrong → prove the replacement with the second client → later migrate the first client → eventually retire the old contract**

Versioning is a migration option justified by demonstrated capability pressure, not required ceremony for every new client.

No URL version scheme, wire format, compatibility policy, migration mechanism, or retirement policy is decided here.

---

## 7. Strong current hypotheses

The exploration currently proposes, but has not yet proven:

- a few precise primitives plus ordinary shell composition can answer useful questions without dedicated workflows;
- the same primitives can serve direct humans, saved scripts, and agents;
- adaptive TTY/non-TTY presentation can preserve one command meaning while making both direct and composed use pleasant;
- an unfamiliar agent can discover useful compositions from CLI help without a Wheelwright-specific orchestration protocol;
- a materially different second client can expose whether backend capabilities are genuinely reusable rather than web-shaped;
- recurring compositions can become inspectable named scripts without becoming a second workflow engine;
- the ontology can improve command meaning and help without becoming the command tree;
- ordinary AI conversation can orchestrate `ww` without Wheelwright building a conversational subsystem.

Working software and operator/agent observation should now become the preferred source of new evidence.

---

## 8. Deliberately unresolved

This checkpoint does not settle:

- final command names or grammar;
- final pipe/wire encoding;
- explicit JSON/CSV/TSV contracts;
- general TTY behavior for `watch`, PTYs, `tee`, command substitution, cron, or other mixed contexts;
- the full command tree;
- script-library storage, metadata, governance, or implementation;
- the eventual `tt` / `ww` boundary;
- which future computations belong in the shared backend;
- broader portfolio-state ownership/migration;
- whether broad `positions`, `attention`, or `import` commands have sufficiently precise meanings;
- MCP or another agent protocol;
- conversational product/interface choice;
- backend API version syntax or compatibility policy;
- configuration/secrets details;
- local/offline versus remote-client scope;
- final Product acceptance criteria beyond the bounded first slice.

---

## 9. Explicitly not authorized or decided

This checkpoint does **not** authorize:

- implementation of the CLI or the selected thin slice;
- a roadmap Bet;
- promotion of the Semantic Model;
- a full CLI design or command catalog;
- implementation of the specimen catalog;
- a script library;
- MCP;
- a Wheelwright chat/conversation subsystem;
- `ww ask`, `ww chat`, or natural-language CLI grammar;
- new backend APIs merely because the CLI exists;
- API versioning without a demonstrated shared-capability problem;
- migration of the web application to a new API contract;
- portfolio-state migration;
- broker execution or autonomous trading;
- brokerage credential storage;
- recommendation-policy changes;
- replacement of `tt`;
- duplication of Wheelwright domain semantics inside the CLI.

The selected first slice is a bounded learning specimen awaiting separate implementation authorization after the canonical intake/reconciliation state is made explicit.

---

## 10. Reconciliation posture at this checkpoint

`PL-CLI-01` remains **INTAKE**.

This document preserves enough why-state that future actors should not need the originating conversation to recover:

- the capability-over-workflow hypothesis;
- the Unix/platform motivation;
- the human/script/agent symmetry;
- the agent-discoverability hypothesis;
- the adaptive output hypothesis;
- the shared-backend/reuse pressure;
- the composition specimen catalog;
- the named-script distinction;
- the conversation/`ww` division of responsibility;
- the first Spot/Quote Freshness slice;
- the backend contract/versioning learning rule;
- positive observations and falsifiers;
- unresolved questions and explicit non-authorizations.

Strategic and architectural reconciliation must still satisfy `docs/foundations/idea-intake-reconciliation.md`, including a durable Reconciliation Completion Record, before `PL-CLI-01` is labeled **RECONCILED**.

---

## October 3 post-observation note — temporal meaning of market evidence

**Status:** Principal-originated candidate Product/architectural principle and experiment why-state; **not ratified** into `docs/principles.md`. The bounded first slice has separate implementation authority in the canonical `PL-CLI-01` item. This note neither reconciles the broader intake nor authorizes further CLI/backend work.

The Principal's walking observation established that the real backend can serve `ww`, that `ww | ww` performs nontrivial numeric reordering, and that direct TTY, pipe, and redirect representations can preserve the same facts. The all-null `XLE SPY QQQ` observation and later held-price `ARKK BNO GDXJ` observation also made time/provenance impossible to treat as mere display decoration. The current TTY command name and metadata-heavy timestamp presentation remain Product findings, not accepted UX. See the canonical `PL-CLI-01` entry for F1–F5 and the still-open language gate.

**Candidate principle, in the Principal's formulation:**

> Market observations are temporally situated facts, not current state. Wheelwright records what it knows and when/how it knows it; consumers decide whether that knowledge is timely enough for their purpose.

The market continues changing after an observation. A price value alone therefore does not establish what is true in the market at evaluation time. A record needs the subject/value, truthful observation or acquisition provenance when available, acquisition state, and publication context. These are distinct times and states. Exact provenance belongs in the composition record even when a human TTY presentation becomes concise.

**Age and acceptability are distinct.** Age can be calculated only from a timestamp actually established for the named subject; a chain-associated timestamp does not establish underlying quote age. Acceptability is a time- and purpose-dependent judgment over evidence, policy, and context, not a timeless intrinsic property of a persisted price. The ratified `PRIN-ARCH-PERSIST-FACTS-DERIVE-TRUST` already forbids persisting a durable `fresh` label and requires trust derivation from facts and session context. This candidate makes the Product consequence of that rule explicit; it does not ban a context-specific, evaluated validity verdict at query or decision time.

**Acquisition and inspection are distinct.** A future explicit refresh operation would mean an attempt to acquire newer knowledge, not a guarantee of a fresh price. A provider cache, delayed upstream observation, or failed attempt with a preserved prior price can leave the held value older than a particular purpose permits. Shell `&&` could sequence a separately authorized acquisition request and an inspection command, but request completion alone cannot imply an acceptable observation. The authorized `ww observed-prices` primitive remains read-only.

This reasoning arose from the CLI experiment but is broader than CLI presentation. ADR-015 and `PL-EVID-AGE` already own the independent underlying-quote acquisition-provenance gap; this note is additional evidence under that owner, not a second backlog item or a CLI-side workaround. Ratification of the candidate as a distinct enduring principle, if warranted beyond the existing ratified principle, requires a separate explicit Principal decision. The durable-language/distribution gate remains undecided.

**Subsequent decision:** The Principal selected Node.js as the durable `ww` implementation after this note. The canonical `PL-CLI-01` record carries that transition. Installation mechanics and the Product disposition of F1–F3 remain open.

**Later reconsideration:** The Node selection recorded in `c96dc2c` was genuine. In light of the completed walking observation and further Product exploration, the Principal reopened the durable implementation/distribution gate. The canonical `PL-CLI-01` record preserves both the superseded decision and the current open gate. No replacement language has been selected; the Node specimen remains evidence of the command model.

---

## October 3 subsequent discovery — synchronization is an explicit primitive

**Status:** Principal-originated Product direction within `PL-CLI-01`, not authorization to implement another command or ratification of a new enduring principle.

The all-pending `ww observed-prices XLE SPY QQQ | ww sort --by price --descending` result made the absence of held observations visible. The Principal reframed acquisition as ordinary synchronization of Wheelwright's knowledge with a continuously changing external authority. An agent may reasonably request it before a task that needs recent market evidence, deliberately omit it for historical explanation, or inspect before and after an attempt. The caller chooses that sequence; Wheelwright need not predict those workflows.

Candidate command composition: `ww refresh QQQ SPY XLE && ww prices QQQ SPY XLE`. Like `git fetch` followed by inspection, the two operations have distinct meanings. The analogy is limited: provider capacity, market-session behavior, caches, and provider delay matter, and elapsed time can degrade usefulness rapidly. A refresh request is side-effecting and should be explicit, scoped to the requested symbol set, and subject to the existing backend acquisition authority. It requests newer knowledge; it does not guarantee it. A subsequent read reports held knowledge; it does not silently synchronize.

`PL-OPS-09` already owns the targeted backend `POST /api/evidence/refresh?symbol=...` capability for a bounded operator-supplied symbol set. A future CLI command would be another client of that capability. The endpoint returns an operation outcome (`ACQUIRED`, `NOT_RUNNING`, `PROVIDER_UNAVAILABLE`, or `INTERRUPTED`) and acquisition metadata, while `GET /api/evidence/quotes?symbol=...` reports held evidence. The unresolved CLI design question is what successful exit status can truthfully certify so shell `&&` is useful without implying independently established quote age, changed held value, or purpose-specific admissibility. In particular, an advancing publication generation is not proof that the requested symbol's evidence advanced. No new endpoint, CLI refresh implementation, universal `fresh` label, automatic refresh policy, or Product acceptance of `prices` syntax follows from this discovery.

Before implementation, resolve separately: what `ww refresh` considers success; aggregate exit status when only some requested symbols acquire; what result facts belong on stdout versus diagnostics on stderr; whether completion means an attempt occurred or acquisition succeeded; and whether any age, freshness, or purpose-specific suitability claim is supportable. None is decided by this discovery record.
