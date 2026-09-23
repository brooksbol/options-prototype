# Practitioner Corpus v1 Charter

**Status:** FROZEN FOR EXTRACTION  
**Version:** 1.0  
**Frozen:** 2026-09-23  
**Scope:** Practitioner Corpus methodology and evidence protocol  
**Authority:** Research-method authority for Practitioner Corpus v1 only; no authority over Wheelwright domain semantics, policy, architecture, product behavior, or implementation  
**Governing principle:** **Wheelwright-blind, domain-informed, provenance-bound.**

---

## 1. Purpose

Practitioner Corpus v1 is a durable research artifact for preserving and synthesizing practitioner reality before reconciling that reality with Wheelwright.

The corpus is designed to answer:

> What are practitioners actually trying to understand, decide, calculate, monitor, avoid, explain, manage, and accomplish in options practice?

It is **not** designed to answer:

> How should Wheelwright model, implement, recommend, or automate those things?

Those questions are deliberately separated.

Practitioner Corpus v1 exists so that later domain discovery, semantic falsification, and product discovery can operate against an evidence base that was not classified through Wheelwright's current ontology, feature set, architecture, roadmap, or desired conclusions.

The corpus therefore serves as:

1. an evidence base about practitioner behavior, reasoning, vocabulary, examples, rules, frictions, exceptions, and failures;
2. a consulting-style synthesis of recurring practitioner patterns and insights;
3. a source of representative specimens suitable for later domain, semantic, and product challenge;
4. a durable record of contradictions, unresolved questions, and claims requiring external verification.

The corpus is not a textbook, trading manual, recommendation engine, canonical options reference, or Wheelwright requirements document.

---

## 2. Governing methodological principle

### 2.1 Wheelwright-blind

Corpus extraction MUST NOT use Wheelwright's current ontology, semantic model, feature set, architecture, roadmap, ADRs, implementation vocabulary, or desired conclusions as the corpus classification system.

The extractor MUST NOT ask:

- Which Wheelwright concept does this fit?
- Does this validate Semantic Model v1.4?
- Which existing feature does this support?
- What feature should Wheelwright build?
- Which current architecture component should own this?

Those questions belong downstream.

### 2.2 Domain-informed

Wheelwright-blind does not mean domain-ignorant.

The extractor MAY and SHOULD use competent options-domain understanding to faithfully recognize what occurs in the evidence.

Examples:

- recognizing that a practitioner closes one leg while leaving another open;
- distinguishing exercise from sale-to-close;
- recognizing assignment as a lifecycle event;
- preserving whether a spread is debit or credit;
- retaining strike, expiry, DTE, premium, Greeks, and underlying state accurately.

Domain competence may support faithful description.

It MUST NOT be used to silently correct, normalize, reconcile, or replace what the practitioner actually said or did.

### 2.3 Provenance-bound

Every evidentiary or analytical record MUST retain a traceable path back to admitted source evidence.

No cross-evidence synthesis may become self-authorizing.

A conclusion without traceable supporting records does not belong in the corpus.

---

## 3. Relationship to other Wheelwright artifacts

The corpus sits between raw external research and downstream Wheelwright reconciliation.

```text
External source material
        ↓
Practitioner Corpus v1
        ↓
 ┌──────┼────────┐
 ↓      ↓        ↓
Domain  Semantic Product
Discovery Falsification Discovery
```

The corpus describes practitioner reality.

It does not define Wheelwright reality.

### 3.1 Current external source artifact

The preserved external research artifact for the initial corpus is:

`docs/research/external-artifacts/cashflow-academy-options-knowledge-base.md`

The source artifact remains intact, including material that is not admitted into Practitioner Corpus v1.

### 3.2 Current semantic work

Existing practitioner-oriented semantic work, including the current practitioner-strategy falsification and Scenario / Market Thesis work, is downstream analytical work.

Practitioner Corpus v1 MUST NOT be reverse-engineered to confirm those conclusions.

Further practitioner-driven semantic advancement SHOULD wait until Practitioner Corpus v1 has been built from this charter.

---

## 4. Corpus architecture

Practitioner Corpus v1 has three epistemic layers.

```text
LAYER 1 — SOURCE EVIDENCE
│
├── Sources
├── Observations
├── Specimens
└── Vocabulary Occurrences
         │
         ▼
LAYER 2 — EVIDENCE-PRESERVING EXTRACTION
│
├── Decision Jobs
├── Frictions
├── Failure Modes
├── Relationships
└── Exceptions
         │
         ▼
LAYER 3 — CROSS-EVIDENCE ANALYSIS
│
├── Patterns
├── Contradictions
├── Insights
├── Red Flags
├── Takeaways
├── Open Questions
└── Candidate Findings
```

The layers represent increasing epistemic distance from the source.

Layer 2 and Layer 3 are valuable precisely because they synthesize practitioner reality, but their derived status MUST remain explicit.

---

## 5. Universal derivation status

Every non-source metadata record MUST carry a derivation status.

Allowed values:

| Status | Meaning |
|---|---|
| `SOURCE_EXPLICIT` | The source directly states, demonstrates, calculates, decides, or otherwise makes the item explicit. |
| `EXTRACTED` | The extractor faithfully abstracts an item from one or more source observations without requiring cross-source synthesis. |
| `CROSS_OBSERVATION_DERIVED` | The item is an analytical result derived across multiple observations and/or sources. |

These statuses describe **distance from source**, not confidence, importance, or truth.

A high-quality `EXTRACTED` Decision Job may be more useful than a literal source phrase. It remains extracted.

---

## 6. Source admission model

### 6.1 Admission states

Each source or source segment MUST carry one of these admission states:

| State | Meaning |
|---|---|
| `ADMITTED` | Sufficient source fidelity for evidentiary use. |
| `PARTIALLY_ADMITTED` | Some segments are sufficiently faithful; other segments are not. |
| `PRESERVED_INSUFFICIENT_FIDELITY` | Preserved for research context but barred from evidentiary support in this corpus version. |
| `EXCLUDED` | Deliberately excluded for a documented reason other than insufficient fidelity. |

### 6.2 Practitioner Corpus v1 admission decision

For the initial Cashflow Academy evidence set:

- videos **1–12**: `ADMITTED`
- videos **13–24**: `PRESERVED_INSUFFICIENT_FIDELITY`
- videos **25–36**: `ADMITTED`

Therefore Practitioner Corpus v1 has **24 admitted transcript-backed source studies**.

Videos 13–24 contribute **zero evidentiary weight** to Practitioner Corpus v1.

They MAY remain visible in the preserved external Muse artifact.

They MUST NOT:

- support an Observation;
- establish a Pattern;
- corroborate a Finding;
- contribute to recurrence counts;
- create a Decision Job;
- create a Friction;
- create a Failure Mode;
- create an Exception;
- create a Contradiction;
- justify a Red Flag;
- establish a Candidate Finding.

They may be reconsidered only after source fidelity is upgraded and the admission record is changed in a later corpus version or explicit amendment.

### 6.3 Segment-level admission

The model supports segment-level admission.

A source MAY be `PARTIALLY_ADMITTED` when:

- transcript material is missing;
- captions are corrupted;
- quoted material cannot be attributed;
- audio is unintelligible;
- source continuity is uncertain.

An inadmissible segment MUST NOT contaminate otherwise admissible source material.

### 6.4 Admission is not truth certification

`ADMITTED` means:

> sufficiently faithful to serve as evidence of what the practitioner said, did, calculated, demonstrated, decided, or recommended.

It does **not** mean:

- correct;
- empirically valid;
- theoretically valid;
- representative of all practitioners;
- safe;
- desirable;
- adopted by Wheelwright.

---

## 7. Source schema

Source identifiers use:

`SRC-###`

Example: `SRC-008`

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `source_id` | yes | Stable corpus identifier. |
| `title` | yes | Original source title. |
| `url` | yes when available | Original source location. |
| `publisher` | yes | Channel, publication, institution, or source owner. |
| `speaker(s)` | yes when known | Practitioner(s) or presenter(s). |
| `published_at` | when available | Original publication date. |
| `source_type` | yes | Video, transcript, interview, article, document, etc. |
| `fidelity` | yes | Transcript, captions, direct notes, description, etc. |
| `admission_state` | yes | Admission state from Section 6. |
| `admitted_segments` | when partial | Explicit segment boundaries. |
| `excluded_segments` | when partial | Explicit excluded boundaries. |
| `admission_reason` | yes | Why admitted, partially admitted, preserved, or excluded. |
| `external_artifact_path` | yes | Durable repository provenance pointer. |
| `source_notes` | optional | Provenance caveats only. |

---

## 8. Observation schema

Observation identifiers use:

`OBS-#####`

Observation is the atomic evidentiary unit.

An Observation records something the practitioner actually says, does, calculates, demonstrates, chooses, recommends, compares, rejects, or reacts to.

It MUST NOT be a Wheelwright interpretation.

### 8.1 Evidence act

Each Observation MUST carry exactly one primary `evidence_act`:

| Evidence act | Meaning |
|---|---|
| `STATEMENT` | Descriptive statement not primarily asserting external truth. |
| `CLAIM` | Assertion about how options, markets, behavior, probability, economics, or the world works. |
| `ACTION` | Practitioner actually performs an action. |
| `CALCULATION` | Practitioner calculates or derives a value. |
| `DEMONSTRATION` | Practitioner demonstrates a mechanism, workflow, or behavior. |
| `DECISION` | Practitioner chooses among alternatives or explicitly rejects one. |
| `RECOMMENDATION` | Practitioner advises a course of action. |
| `REACTION` | Practitioner responds to a changed condition, result, or event. |

Secondary acts MAY be recorded when genuinely useful, but one primary act is required.

### 8.2 Observation fields

| Field | Required | Meaning |
|---|---:|---|
| `observation_id` | yes | Stable ID. |
| `source_id` | yes | Source provenance. |
| `segment_locator` | yes when available | Timestamp, chapter, line, or segment reference. |
| `speaker` | when known | Practitioner responsible for the act. |
| `evidence_act` | yes | Section 8.1. |
| `derivation_status` | yes | Normally `SOURCE_EXPLICIT` or `EXTRACTED`. |
| `source_text` | when useful and lawful | Short representative source wording. |
| `faithful_paraphrase` | yes | What happened, preserving practitioner framing. |
| `source_objects` | optional | Ticker, strike, expiry, contract, share position, etc. |
| `source_numbers` | optional | Premiums, Greeks, DTE, probabilities, P/L, etc. |
| `uncertainty` | optional | Ambiguity or extraction uncertainty. |
| `related_observation_ids` | optional | Explicitly related observations. |
| `verification_state` | yes for external claims | See Section 17. |

### 8.3 Say/do distinction

Statements and recommendations MUST NOT be treated as equivalent to demonstrated behavior.

Example:

- practitioner says “sell around 45 DTE” → `RECOMMENDATION`
- practitioner enters a worked example at 31 DTE → `DECISION` or `DEMONSTRATION`

The corpus MUST preserve both if both occur.

It MUST NOT silently reconcile them.

---

## 9. Specimen schema

Specimen identifiers use:

`SPC-###`

A Specimen is a bounded, replayable practitioner situation preserving enough state to reconstruct the reasoning or lifecycle event.

A Specimen SHOULD contain, where the source provides them:

- underlying;
- current underlying price;
- shares/inventory;
- option legs;
- strikes;
- expirations;
- DTE;
- quantity;
- premiums;
- bid/ask information;
- Greeks;
- IV/HV or volatility observations;
- probability claims;
- chart or technical observations;
- stated thesis;
- stated purpose;
- alternatives considered;
- capital/collateral;
- break-even;
- max profit/loss;
- management threshold;
- lifecycle state;
- assignment/exercise state;
- realized or hypothetical result.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `specimen_id` | yes | Stable ID. |
| `title` | yes | Human-readable specimen name. |
| `source_ids` | yes | Source provenance. |
| `observation_ids` | yes | Evidence forming the specimen. |
| `derivation_status` | yes | Source-explicit or extracted. |
| `situation` | yes | Starting state. |
| `practitioner_view` | when explicit | Practitioner expectation/thesis in source language. |
| `alternatives` | when present | Alternatives discussed. |
| `construction_or_action` | yes | What was constructed or done. |
| `economics` | when available | Debit/credit, payoff, risk, return, capital. |
| `management_plan` | when available | Planned actions if state changes. |
| `resolution` | when available | Outcome/lifecycle result. |
| `why_representative` | yes | Why this specimen is preserved. |
| `uncertainty` | optional | Missing/ambiguous fields. |

A Specimen MUST preserve source reality even when internally inconsistent.

---

## 10. Vocabulary occurrence schema

Vocabulary identifiers use:

`VOC-####`

The corpus preserves practitioner-native terminology without turning it into canonical domain vocabulary.

Examples may include phrases such as:

- “cash-flow zone”;
- “speed bump”;
- “five directions”;
- “putting stock to work”;
- “defend the trade”;
- “income”;
- “risk”;
- “probability”;
- “Wheel”.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `vocabulary_id` | yes | Stable ID. |
| `term` | yes | Practitioner-native term. |
| `source_id` | yes | Provenance. |
| `observation_id` | yes | Occurrence evidence. |
| `local_meaning` | yes | Meaning in this occurrence only. |
| `derivation_status` | yes | Normally `SOURCE_EXPLICIT` or `EXTRACTED`. |
| `possible_variants` | optional | Alternate source phrases. |

The corpus MUST NOT assume identical words have identical meanings across occurrences.

---

## 11. Decision Job schema

Decision Job identifiers use:

`JOB-###`

A Decision Job describes practitioner work: a decision, judgment, diagnosis, comparison, monitoring task, or choice the practitioner is trying to perform.

A Job is **not** a feature request.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `job_id` | yes | Stable ID. |
| `job_statement` | yes | Practitioner work in neutral language. |
| `derivation_status` | yes | Explicit distance from source. |
| `supporting_observations` | yes | Evidence. |
| `trigger` | when available | What causes the job to arise. |
| `information_considered` | when available | Evidence practitioner uses. |
| `alternatives_considered` | when available | Choices available. |
| `decision_criteria` | when available | What appears to govern selection. |
| `action_or_outcome` | when available | What follows the judgment. |
| `uncertainty` | optional | What remains unclear. |

Job statements SHOULD use practitioner-neutral verbs such as:

- determine;
- decide;
- compare;
- assess;
- monitor;
- choose;
- diagnose;
- evaluate;
- respond.

They MUST NOT contain Wheelwright solution language.

---

## 12. Friction schema

Friction identifiers use:

`FRI-###`

A Friction is something that makes practitioner work difficult, uncertain, costly, cognitively demanding, operationally awkward, or error-prone.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `friction_id` | yes | Stable ID. |
| `friction_statement` | yes | The obstacle. |
| `derivation_status` | yes | Explicit distance from source. |
| `supporting_observations` | yes | Evidence. |
| `affected_job_ids` | optional | Related jobs. |
| `consequence` | when available | What the friction causes. |
| `workaround` | when observed | Practitioner coping behavior. |
| `recurrence` | later | Cross-evidence recurrence after synthesis. |

The extractor MUST distinguish:

- source-explicit friction: “this is hard because…”;
- extracted friction: difficulty inferred from behavior or repeated reasoning;
- cross-observation friction: only visible across multiple sources.

---

## 13. Failure Mode schema

Failure Mode identifiers use:

`FAIL-###`

A Failure Mode is a way practitioner reasoning, construction, execution, management, lifecycle resolution, or process can produce an unwanted or surprising result.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `failure_id` | yes | Stable ID. |
| `failure_statement` | yes | What fails and how. |
| `derivation_status` | yes | Source distance. |
| `supporting_observations` | yes | Evidence. |
| `expected_condition` | when available | What practitioner expected. |
| `adverse_condition` | when available | What changed or differed. |
| `failure_mechanism` | when visible | How the failure occurred. |
| `consequence` | when available | Economic/operational result. |
| `practitioner_response` | when available | Exit, roll, hedge, accept, etc. |
| `avoidable_status` | optional | Avoidable / manageable / accepted / unresolved, if source supports it. |

Possible analytical tags MAY include thesis, structure, magnitude, volatility, timing, sizing, assignment, opportunity cost, liquidity, execution, management, mechanics misunderstanding.

Tags are descriptive aids only and MUST NOT become domain ontology by implication.

---

## 14. Relationship schema

Relationship identifiers use:

`REL-####`

A Relationship records a source-supported or extracted connection between practitioner-relevant things.

Common relationship forms may include:

- depends on;
- constrains;
- causes;
- changes;
- offsets;
- exposes to;
- protects against;
- trades off with;
- equivalent under;
- differs from;
- precedes;
- follows;
- triggers;
- invalidates;
- survives;
- exception to.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `relationship_id` | yes | Stable ID. |
| `left_term` | yes | First side of relation. |
| `relationship` | yes | Relationship as faithfully expressed. |
| `right_term` | yes | Second side. |
| `derivation_status` | yes | Source distance. |
| `supporting_observations` | yes | Evidence. |
| `conditions` | when relevant | Boundary under which relation holds. |
| `counterevidence` | when available | Source evidence that limits relation. |

Normalized relationship labels MAY be added during synthesis but MUST preserve the original practitioner relationship.

---

## 15. Exception schema

Exception identifiers use:

`EXC-###`

An Exception captures a stated or observed boundary on an apparent rule, recommendation, behavior, relationship, or pattern.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `exception_id` | yes | Stable ID. |
| `applies_to` | yes | Rule/pattern/observation/relationship being limited. |
| `exception_statement` | yes | Boundary condition. |
| `derivation_status` | yes | Source distance. |
| `supporting_observations` | yes | Evidence. |
| `conditions` | when available | When exception applies. |
| `effect` | when available | How ordinary guidance changes. |

Extraction MUST actively look for exceptions rather than treating them as edge noise.

---

## 16. Pattern schema

Pattern identifiers use:

`PAT-###`

Patterns are cross-evidence analytical products.

A Pattern MUST distinguish recurrence type.

Allowed recurrence types:

| Type | Meaning |
|---|---|
| `PRACTICE_RECURRENCE` | Practitioner repeatedly does X. |
| `BELIEF_RECURRENCE` | Practitioner repeatedly claims/believes X. |
| `RELATIONSHIP_RECURRENCE` | X and Y repeatedly appear connected. |
| `PEDAGOGICAL_RECURRENCE` | Practitioner repeatedly teaches or frames material using the same device. |

Recurrence NEVER establishes empirical or theoretical truth.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `pattern_id` | yes | Stable ID. |
| `pattern_statement` | yes | Cross-evidence synthesis. |
| `recurrence_type` | yes | One of four allowed types. |
| `derivation_status` | yes | `CROSS_OBSERVATION_DERIVED`. |
| `supporting_observations` | yes | Evidence. |
| `supporting_sources` | yes | Distinct sources. |
| `counterevidence` | optional | Conflicting evidence. |
| `exceptions` | optional | Known boundaries. |
| `recurrence_description` | yes | Frequent/occasional/isolated or equivalent qualitative wording. |
| `confidence` | yes | Confidence that the pattern exists in this corpus. |
| `truth_status` | yes | Normally `NOT_ESTABLISHED_BY_CORPUS`. |

No numeric recurrence score should be mistaken for importance or truth.

---

## 17. Claim verification state

Practitioner claims about external reality MUST carry a verification state.

Allowed values:

| State | Meaning |
|---|---|
| `NOT_REQUIRED` | Pure source behavior/description, not an external truth claim. |
| `UNVERIFIED_PRACTITIONER_CLAIM` | Claim preserved; truth not adjudicated. |
| `VERIFY_LATER` | Claim materially important enough for downstream verification. |
| `VERIFIED_EXTERNAL` | Independently verified outside corpus work. |
| `CONTRADICTED_EXTERNAL` | Independently contradicted outside corpus work. |

Practitioner Corpus v1 extraction MUST NOT perform external verification unless separately authorized.

Examples likely to require downstream verification include:

- win-rate claims;
- claims about percentages of options expiring worthless;
- fixed DTE rules;
- volatility relationships;
- probability interpretations;
- performance claims;
- return claims;
- market-behavior generalizations.

---

## 18. Contradiction schema

Contradiction identifiers use:

`CON-###`

A Contradiction preserves unresolved tension between admissible evidence.

Required fields:

| Field | Required | Meaning |
|---|---:|---|
| `contradiction_id` | yes | Stable ID. |
| `side_a` | yes | First claim/practice/relationship. |
| `side_b` | yes | Conflicting claim/practice/relationship. |
| `support_a` | yes | Evidence. |
| `support_b` | yes | Evidence. |
| `derivation_status` | yes | Usually `CROSS_OBSERVATION_DERIVED`. |
| `apparent_dimension` | yes | What appears inconsistent. |
| `possible_context_difference` | optional | Only if supported or clearly labeled as hypothesis. |
| `resolution_status` | yes | Default `UNRESOLVED`. |

The corpus MUST NOT reconcile contradictions merely to produce a cleaner narrative.

---

## 19. Insight, Red Flag, Takeaway, Open Question, Candidate Finding

These are Layer 3 analytical products.

### 19.1 Insight

Identifier: `INS-###`

An Insight is a non-obvious synthesis visible only after combining multiple observations, patterns, relationships, exceptions, or specimens.

It MUST include:

- evidence;
- derivation status;
- reasoning summary;
- counterevidence;
- scope limits.

### 19.2 Red Flag

Identifier: `RED-###`

A Red Flag is a source-supported reason for later scrutiny.

Examples:

- overstated certainty;
- strong empirical claim without evidence;
- inconsistent rule application;
- hidden assumption;
- promotional framing;
- unresolved risk;
- apparent mismatch between recommendation and demonstration.

A Red Flag does not mean “wrong.”

### 19.3 Takeaway

Identifier: `TAK-###`

A Takeaway is a durable conclusion about **practitioner reality represented in this corpus**.

It MUST NOT be written as universal options truth unless separately verified.

### 19.4 Open Question

Identifier: `Q-###`

An Open Question records something the admitted corpus cannot resolve.

Absence of evidence MUST NOT be converted into a negative conclusion.

### 19.5 Candidate Finding

Identifier: `CF-###`

A Candidate Finding is a hypothesis worth downstream investigation.

It MAY later feed:

- domain discovery;
- semantic falsification;
- product discovery;
- external verification.

It does not itself alter Wheelwright.

---

## 20. Corpus absence / negative evidence rule

Practitioner Corpus v1 is not a census of options practice.

Therefore:

> “Not observed in this corpus” does not mean “practitioners do not do this.”

Allowed corpus-level presence states:

| State | Meaning |
|---|---|
| `OBSERVED` | Positive supporting corpus evidence exists. |
| `NOT_OBSERVED_IN_CORPUS` | No admitted evidence located; no negative inference permitted. |
| `CONTRADICTED_WITHIN_CORPUS` | Admitted evidence conflicts. |
| `UNRESOLVED` | Corpus cannot support a clean conclusion. |

The corpus MUST NOT use absence to reject a domain concept or product feature.

---

## 21. Extraction protocol

Extraction proceeds in ordered passes.

### Pass 0 — admission ledger

Before content extraction:

1. enumerate all source studies;
2. assign `SRC-###`;
3. record fidelity;
4. record admission state;
5. record source provenance;
6. exclude non-admitted material from all later evidentiary passes.

No content from videos 13–24 may enter evidentiary extraction in v1.

### Pass 1 — source observations

For each admitted source:

1. identify atomic evidence acts;
2. create Observation records;
3. preserve concrete source numbers;
4. preserve source-native terms;
5. record claims without verifying them;
6. record practitioner actions separately from recommendations;
7. preserve uncertainty rather than resolving it.

Do not synthesize across videos during Pass 1.

### Pass 2 — specimens

Identify worked examples and bounded scenarios suitable for replay.

Create Specimens from groups of source Observations.

Preserve concrete details rather than replacing them with generic summaries.

### Pass 3 — evidence-preserving extraction

Using only admitted Observations and Specimens:

1. extract Decision Jobs;
2. extract Frictions;
3. extract Failure Modes;
4. extract Relationships;
5. extract Exceptions;
6. maintain derivation status;
7. preserve source links.

Do not use Wheelwright concepts or feature names.

### Pass 4 — vocabulary map

Record practitioner-native recurring language and local meanings.

Do not build a canonical glossary.

### Pass 5 — cross-evidence pattern synthesis

Only after source-level extraction is complete:

1. identify recurring practices;
2. identify recurring beliefs;
3. identify recurring relationships;
4. identify recurring pedagogical frames;
5. record counterevidence;
6. record exceptions;
7. qualify recurrence without equating frequency with importance or correctness.

### Pass 6 — contradictions and tensions

Actively search for:

- say/do differences;
- recommendation/example differences;
- source-to-source conflicts;
- context-sensitive reversals;
- beginner-versus-advanced framing differences;
- apparently incompatible heuristics.

Preserve them unresolved unless the evidence itself resolves them.

### Pass 7 — consulting synthesis

Produce:

- Executive Narrative;
- Practitioner Mental Model;
- Practitioner Decision Framework;
- Major Patterns;
- Insights;
- Decision Jobs;
- Frictions;
- Failure Modes;
- Contradictions and Tensions;
- Exceptions and Boundary Conditions;
- Red Flags;
- Takeaways;
- Open Questions;
- Verification Backlog.

Every substantive synthesis item MUST trace to corpus records.

### Pass 8 — reference specimen selection

Select a compact challenge set using Section 25.

No Wheelwright reconciliation occurs in this pass.

---

## 22. Extraction prohibitions

During Practitioner Corpus v1 construction, the extractor MUST NOT:

- map evidence to Wheelwright Semantic Model concepts;
- suggest Wheelwright schema changes;
- propose features inside corpus records;
- classify evidence by current Wheelwright feature ownership;
- use existing Wheelwright implementation as evidence of practitioner reality;
- treat Muse Part A synthesis as primary evidence;
- use videos 13–24 as corroboration;
- convert practitioner claims into domain facts;
- convert recurrence into empirical validity;
- convert frequency into importance;
- convert absence into negative evidence;
- silently correct practitioner terminology;
- silently reconcile contradictory claims;
- silently normalize examples into canonical strategy definitions;
- discard examples because they are repetitive before checking for material variation;
- infer motivation when the source does not support it.

---

## 23. Muse artifact usage rule

The Muse artifact is a discovery and navigation aid, not autonomous evidence authority.

For admitted videos, per-video transcript-derived deep dives MAY be used as extraction scaffolding.

Part A master synthesis MAY be used only to:

- locate candidate themes;
- identify likely source studies;
- accelerate navigation.

Part A MUST NOT independently establish:

- an Observation;
- a Pattern;
- a Job;
- a Friction;
- a Failure Mode;
- a Relationship;
- an Exception;
- a Contradiction;
- an Insight;
- a Takeaway;
- a Candidate Finding.

When a proposed finding originates from Muse synthesis, it must bottom out in admitted transcript-derived per-video evidence before entering the corpus.

---

## 24. Synthesis rules

### 24.1 Repetition is evidence of recurrence, not truth

Repeated source claims establish repeated practitioner belief or pedagogy.

Repeated actions establish repeated practitioner practice.

Neither establishes universal correctness.

### 24.2 Frequency is not importance

A rare observation may be highly consequential.

Examples include:

- an assignment edge case;
- a partial-leg close;
- an expiration anomaly;
- an unusual adjustment;
- a lifecycle transition;
- an explicit exception.

The corpus MUST retain rare-but-consequential specimens.

### 24.3 Preserve meaningful variation

Do not collapse repeated evidence until checking for variation in:

- market state;
- volatility state;
- horizon;
- capital;
- inventory;
- strike selection;
- assignment preference;
- management criteria;
- risk tolerance;
- strategy construction;
- lifecycle stage.

### 24.4 Separate mechanics, claims, heuristics, and advice during synthesis

The corpus may describe all of them.

It must not make them equivalent.

### 24.5 Do not manufacture consensus

“18 videos repeat X” means:

> X is strongly recurrent in this practitioner corpus.

It does not mean:

> X is established options truth.

### 24.6 Do not manufacture coherence

A coherent executive narrative must still expose contradictions and exceptions.

The narrative is not allowed to erase evidence that makes the practitioner worldview messier.

### 24.7 Every executive conclusion must be drillable

A reader should be able to traverse:

```text
Executive conclusion
   ↓
Pattern / Insight / Takeaway
   ↓
Observation / Relationship / Exception / Specimen
   ↓
Source
```

---

## 25. Reference-specimen criteria

Practitioner Corpus v1 MUST conclude with a compact set of representative reference specimens.

The reference set exists as a practitioner-reality challenge set for later research.

The set SHOULD cover, where admitted evidence supports it:

1. ordinary single-leg construction;
2. ordinary multi-leg construction;
3. terminal-payoff example;
4. pre-expiration sensitivity example;
5. payoff-equivalent but lifecycle-different positions;
6. assignment event;
7. exercise decision;
8. expiration edge case;
9. rolling or management adjustment;
10. defensive hedge or repair;
11. thesis invalidation;
12. volatility-sensitive selection;
13. probability-versus-payoff tradeoff;
14. structural max-loss versus planned management-loss case;
15. position-sizing decision;
16. cross-expiry structure;
17. surviving/residual leg after another leg resolves;
18. Wheel or repeated-process state transition;
19. opportunity-cost case;
20. liquidity/execution friction if admitted evidence supports it;
21. practitioner-rule exception;
22. say/do discrepancy;
23. internal contradiction;
24. outright failure or losing example.

Reference specimens are selected for **coverage and falsifiability**, not for popularity.

A specimen need not be “best practice.”

Some of the most valuable reference specimens should be awkward.

---

## 26. Practitioner Decision Framework synthesis target

The corpus SHOULD attempt to reconstruct the practitioner's apparent decision flow without presuming that the practitioner states one formal model.

Possible stages MAY emerge such as:

- observe market/instrument state;
- form or reject a directional/magnitude/volatility/time view;
- decide whether action is warranted;
- choose construction;
- choose strikes/expiry/quantity;
- evaluate economics/risk/probability;
- establish management conditions;
- enter;
- monitor;
- respond to changed state;
- close/roll/hedge/assign/exercise/expire;
- re-enter or transition into another process state.

This list is a research prompt, not a required conclusion.

The corpus MUST reflect the evidence even if the actual practitioner flow differs.

---

## 27. Executive narrative standard

The Executive Narrative should read like a high-quality consulting synthesis rather than a transcript digest.

It should answer:

- What worldview emerges?
- What recurring decision process appears?
- Where do the practitioners believe edge comes from?
- What do they repeatedly worry about?
- What kinds of uncertainty matter?
- How do they think about risk?
- How do they respond when a trade stops behaving as expected?
- What role do time, volatility, direction, magnitude, probability, capital, and lifecycle play?
- What appears stable across the corpus?
- What appears situational?
- Where are the internal tensions?
- What important questions remain unanswered?

Every conclusion must remain bounded to the admitted corpus.

---

## 28. Product-discovery boundary

The corpus MAY say:

> Practitioners repeatedly need to determine whether assignment is acceptable before entering a short option position.

The corpus MUST NOT say:

> Wheelwright needs an assignment-risk widget.

The first is practitioner evidence/extraction.

The second is downstream product design.

Likewise, the corpus MAY preserve a friction such as:

> Practitioner reasoning repeatedly combines direction, volatility, time, probability, and payoff.

It MUST NOT prescribe a UI, model, API, or workflow.

---

## 29. Semantic-falsification boundary

The corpus MAY discover that practitioners distinguish two things that appear similar.

It MUST NOT decide whether those distinctions:

- require separate Wheelwright entities;
- fit existing assertions;
- require a new value object;
- invalidate an ADR;
- belong in policy;
- belong in the domain reference.

Those are later semantic-falsification questions.

---

## 30. Domain-discovery boundary

The corpus MAY surface practitioner mechanics, claims, relationships, and examples.

It MUST NOT independently ratify them as options-domain truth.

Domain discovery may later use the corpus as evidence, then seek additional support as appropriate.

---

## 31. Quality controls

A corpus build is not complete unless the following checks pass.

### 31.1 Provenance completeness

Every derived record points to supporting admitted evidence.

### 31.2 Admission integrity

No `PRESERVED_INSUFFICIENT_FIDELITY` or `EXCLUDED` source contributes evidentiary support.

### 31.3 Derivation integrity

Every Job, Friction, Failure Mode, Relationship, Exception, Pattern, Contradiction, Insight, Takeaway, Red Flag, and Candidate Finding states its derivation status.

### 31.4 Say/do integrity

Recommendations and claims are not collapsed into demonstrated behavior.

### 31.5 Recurrence integrity

Pattern recurrence does not masquerade as external truth.

### 31.6 Negative-evidence integrity

Corpus absence is not converted into a claim about practitioner reality generally.

### 31.7 Contradiction integrity

Conflicts remain visible unless source evidence resolves them.

### 31.8 Slop firewall

No Muse master-synthesis statement enters the corpus without admissible transcript-derived support.

### 31.9 Wheelwright-blindness

No corpus record is classified using current Wheelwright ontology, feature ownership, product design, or implementation vocabulary.

### 31.10 Human usability

A human reader can understand the consulting synthesis without reading all source records, while still being able to trace important conclusions back to evidence.

---

## 32. Corpus deliverable structure

Practitioner Corpus v1 should ultimately contain:

### Part I — Executive Synthesis

1. Executive Narrative
2. Practitioner Mental Model
3. Practitioner Decision Framework
4. Major Patterns
5. Major Insights
6. Practitioner Decision Jobs
7. Practitioner Frictions
8. Failure Modes
9. Contradictions and Tensions
10. Exceptions and Boundary Conditions
11. Red Flags
12. Takeaways
13. Open Questions
14. Verification Backlog

### Part II — Evidence Model

15. Source Ledger
16. Observation Register
17. Vocabulary Register
18. Decision Job Register
19. Friction Register
20. Failure Mode Register
21. Relationship Register
22. Exception Register
23. Pattern Register
24. Contradiction Register
25. Insight / Red Flag / Takeaway Register

### Part III — Representative Evidence

26. Worked Specimens
27. Reference-Specimen Challenge Set
28. Provenance Index

The exact rendering may change for usability without changing the schemas or evidence rules.

---

## 33. Identifier stability

Once a record ID is assigned in Practitioner Corpus v1, it MUST NOT be silently reused for a different record.

If a record is later withdrawn:

- retain the ID;
- mark it withdrawn/deprecated;
- state why.

If a record is split:

- retain the original historical record;
- create new IDs;
- link the replacement records.

Stable IDs are required so later domain, semantic, and product work can cite corpus evidence durably.

---

## 34. Freeze rule

This charter is frozen **before extraction**.

The following may not change silently during Practitioner Corpus v1 extraction:

- governing principle;
- admission states;
- current 24/12 admission decision;
- epistemic layers;
- derivation statuses;
- Observation evidence-act distinctions;
- source-provenance requirements;
- recurrence-versus-truth rule;
- negative-evidence rule;
- Wheelwright-blindness boundary;
- Muse slop firewall;
- extraction pass ordering;
- synthesis rules;
- reference-specimen criteria.

If extraction reveals a methodological defect, work MUST NOT quietly change the protocol to fit the evidence.

Instead:

1. record the defect;
2. stop the affected transformation if necessary;
3. propose an explicit charter amendment;
4. version the methodology;
5. preserve the original rule and rationale.

Minor editorial corrections that do not change methodology may be committed without a new version.

A material methodology change requires at least v1.1 or an explicitly recorded amendment.

---

## 35. Freeze baseline

Practitioner Corpus v1 extraction is frozen against the preserved Muse artifact present on `main` at:

`3ab9f0ac16d1d432ebd5ff0578c62cf5df1b3fa8`

Artifact:

`docs/research/external-artifacts/cashflow-academy-options-knowledge-base.md`

That artifact preserves all 36 studies.

This charter admits only the 24 transcript-backed studies described above.

---

## 36. Completion test

Practitioner Corpus v1 is complete when:

1. all 24 admitted studies have passed source observation extraction;
2. the 12 insufficient-fidelity studies have contributed no evidence;
3. useful worked specimens have been preserved;
4. practitioner-native vocabulary occurrences have been recorded;
5. Decision Jobs, Frictions, Failure Modes, Relationships, and Exceptions have been extracted with derivation status;
6. cross-evidence Patterns distinguish practice, belief, relationship, and pedagogy recurrence;
7. contradictions remain visible;
8. external claims requiring validation are queued rather than silently accepted;
9. executive synthesis is traceable to evidence;
10. a compact reference-specimen challenge set has been selected;
11. no Wheelwright semantic or product reconciliation has been performed inside the corpus;
12. the corpus is useful to a human reader independently of Wheelwright.

---

## 37. Governing maxim

> **Preserve what practitioners actually say, do, calculate, decide, recommend, struggle with, and contradict before asking what Wheelwright thinks it means.**

The corpus succeeds when the evidence is allowed to reveal not merely answers to questions Wheelwright already knows how to ask, but important practitioner questions Wheelwright has not yet learned to formulate.
