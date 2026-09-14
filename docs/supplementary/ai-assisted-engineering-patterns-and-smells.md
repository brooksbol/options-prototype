# Governing AI-Assisted Engineering — Wheelwright Field Notes

**Status:** Supplementary / evolving field notes  
**Purpose:** Capture talk-ready patterns and smells learned from building Wheelwright with multiple AI actors.  
**Authority:** Non-governing supplementary material. This document summarizes lessons from the project; it does not amend Wheelwright architecture, methodology, product authority, or actor governance.  
**Maintenance:** Intentionally living. Add, rename, merge, or sharpen smells as further lessons emerge.

---

## Thesis

> **AI makes producing software dramatically cheaper; governance becomes the scarce engineering resource.**

The recurring pattern across Wheelwright has not been that the AIs are incapable. It is almost the opposite: capable AI actors continuously see plausible things to improve, generalize, reconcile, redesign, or implement. The engineering problem therefore shifts toward governing initiative, preserving authority, maintaining shared memory, separating cognitive roles, synchronizing actors to the same reality, and converting repeated judgment into deterministic protection.

The six themes below organize those lessons as patterns and observable **smells**.

---

# 1. Govern the AI, Don't Just Prompt It

**Pattern:** AI initiative needs explicit boundaries.

### Smells

- **Over-Engineering** — The AI will persistently over-engineer everything unless governed not to.
- **While-I'm-Here** — The AI fixes adjacent things because they look fixable.
- **Scope Creep by Competence** — The more capable the AI is, the more opportunities it sees to exceed the assignment.
- **Premature Abstraction** — The AI invents the general solution before experiencing enough concrete problems.
- **Tomorrow's Problem** — The AI happily solves hypothetical future problems at today's expense.
- **Technical-Debt Magnet** — The existence of debt becomes interpreted as permission to clean it up.
- **Missing Negative Space** — Telling the AI what to do without saying what *not* to do leaves enormous implied scope.
- **No Stop Condition** — Without an explicit stopping point, useful work naturally expands into unauthorized work.

---

# 2. Separate Thinking from Authority

**Pattern:** Discovery, judgment, decision, and action are different things.

### Smells

- **Insight Becomes Requirement** — A useful observation silently becomes something the system "must" do.
- **Requirement Becomes Architecture** — Desired behavior silently acquires a particular implementation shape.
- **Architecture Becomes Authorization** — A sound design is treated as permission to build it.
- **Correct-but-Unauthorized** — The AI makes a genuinely good change it had no authority to make.
- **Implementation Defines Semantics** — What was convenient to build starts determining what the product means.
- **Elegance Over Intent** — Architectural coherence begins overriding the Principal's actual objective.
- **Forced Certainty** — The AI resolves ambiguity rather than saying "insufficient evidence."
- **Invisible Promotion** — Observation → inference → decision → authorization happens without anyone noticing the transitions.

---

# 3. The Repository Is the Memory

**Pattern:** Durable artifacts, not conversations, constitute organizational memory.

### Smells

- **Chat Memory** — Important knowledge exists only in a conversation.
- **Cold-Start Amnesia** — A fresh AI repeats a mistake the project already learned from.
- **Markdown Democracy** — Every document appears equally authoritative simply because it exists.
- **Zombie Authority** — Superseded documentation continues influencing current decisions.
- **Lost Why** — The project remembers what it decided but not why.
- **Repeated Relitigation** — Old decisions keep being reopened because their reasoning was never preserved.
- **Duplicate Truth** — The same concept has multiple durable representations that slowly diverge.
- **Homeless Uncertainty** — Unresolved ideas have nowhere canonical to live, so they either disappear or prematurely become requirements.

---

# 4. Different Actors Need Different Jobs

**Pattern:** Separate cognitive roles and use independent actors deliberately.

### Smells

- **One AI Does Everything** — The same actor discovers, designs, implements, and approves its own work.
- **Self-Review** — The reasoning that produced a solution is also expected to find its hidden assumptions.
- **Committee of Clones** — Multiple AIs are used, but all are given the same role and asked the same question.
- **Consensus Theater** — Agreement among several models is treated as proof.
- **Suppressed Dissent** — Actor disagreement is treated as inconvenience instead of evidence.
- **Architect-as-Principal** — The AI starts choosing product direction because it can see an elegant path.
- **Implementer-as-Architect** — Implementation pressure silently redesigns the system.
- **Human-as-Coder** — The Principal gets dragged back into mechanism instead of governing intent and consequential decisions.

---

# 5. Synchronization Is Part of Correctness

**Pattern:** Every actor must reason from an explicitly shared state of reality.

### Smells

- **Stale Genius** — Excellent reasoning against yesterday's repository.
- **Split-Brain Project** — Two AIs are both correct about different versions of the system.
- **Local-Main Fallacy** — An actor assumes its checkout represents current authority.
- **Unpinned Handoff** — Work passes between actors without identifying the state against which it was produced.
- **Temporal Ambiguity** — Nobody can tell whether a conclusion preceded or followed a consequential change.
- **Context Drift** — A long-running actor continues reasoning from assumptions that another actor has already invalidated.
- **Confident Incompatibility** — Independently reasonable changes fail when combined because their starting states differed.

---

# 6. Turn Judgment into Machinery

**Pattern:** Repeatedly validated judgment should become deterministic protection.

### Smells

- **Permanent AI Wisdom** — The AI has to rediscover the same important rule every time.
- **Prompt-Enforced Architecture** — Critical invariants survive only because somebody remembers to mention them in a prompt.
- **Coverage Theater** — Tests accumulate without protecting meaningful system behavior.
- **Metric Governance** — Quality numbers stop informing judgment and start making decisions.
- **Arbitrary Gates** — A threshold becomes policy merely because a tool can measure it.
- **Manual Invariant** — Everyone agrees something must never happen, but nothing mechanically prevents it.
- **Probabilistic Forever** — A repeatedly confirmed insight never graduates into deterministic enforcement.
- **Missing Ratchet** — The organization learns something, but the system becomes no harder to misuse afterward.

---

## The Progression

**Govern initiative → control authority → preserve memory → divide cognition → synchronize reality → mechanize what you learn.**

Or, in the shorter vocabulary:

**Govern → Separate → Remember → Divide Roles → Synchronize → Ratchet**

---

## Talk Structure

A useful recurring chapter rhythm:

**Pattern → Smells → Wheelwright story → What changed**

The point is not to present the governance model as something designed perfectly in advance. These patterns emerged from repeated concrete failure modes while building Wheelwright with AI actors.

> We didn't design this governance model and then build Wheelwright. We built Wheelwright with AIs, watched where they repeatedly failed, and the governance model emerged from the scars.
