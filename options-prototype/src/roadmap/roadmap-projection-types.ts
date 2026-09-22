/**
 * Roadmap Projection — shared types.
 *
 * These describe the DERIVED, read-only projection of Wheelwright's canonical
 * roadmap authorities:
 *   - docs/roadmap.md              (Lean Value Tree — strategy)
 *   - docs/architecture-roadmap.md (AR1..ARn architectural pressures)
 *   - docs/parking-lot*.md         (PL-* unresolved work / ideas)
 *
 * AUTHORITY BOUNDARY: the Markdown files are the single source of truth. This
 * projection is generated from them (see scripts/generate-roadmap-projection.mjs)
 * and is never authoritative. The Roadmap operator surface reads this projection
 * and cannot edit canonical state.
 *
 * EXPLICIT-ONLY RELATIONSHIPS: relationships between PL items and LVT/AR objects
 * are emitted only where the canonical text states them. Absence of a relationship
 * is represented as absence — never inferred, never manufactured. Row order carries
 * no priority; no dates, owners, estimates, progress, or authorization state are
 * synthesized.
 */

/** LVT semantic object type, derived from the semantic ID prefix in docs/roadmap.md. */
export type LvtNodeType =
  | "vision"
  | "goal"
  | "bet"
  | "direction"
  | "initiative"
  | "experiment";

/** A single Lean Value Tree node. Parentage is derived from indentation. */
export interface LvtNode {
  /** Canonical semantic identifier, e.g. "LVT-GOAL-CHOICES". */
  id: string;
  type: LvtNodeType;
  /** Human-readable short name (dominant in the UI). */
  name: string;
  /** Concise authoritative description from the canonical bullet. */
  description: string;
  /** Legacy alias recorded in parentheses, e.g. "G2". Historical traceability only. */
  legacyAlias: string | null;
  /** Canonical IDs of direct children (empty for leaves). */
  childIds: string[];
  /** Canonical ID of the direct parent, or null for the Vision root. */
  parentId: string | null;
}

/**
 * An architecture-roadmap pressure (AR1..ARn).
 * `pressureFromLvtIds` lists the LVT objects the AR record explicitly cites as
 * the source of the pressure (mapped from legacy aliases to canonical IDs where
 * the mapping is unambiguous). Aliases that cannot be resolved are preserved in
 * `pressureFromRaw` so nothing is silently dropped.
 */
export interface ArPressure {
  /** e.g. "AR3". */
  id: string;
  /** Short title from the AR heading. */
  title: string;
  /** The one-line candidate transition, when present. */
  candidateTransition: string | null;
  /** Canonical LVT IDs explicitly cited as pressure sources. */
  pressureFromLvtIds: string[];
  /** Raw tokens from the "Pressure from:" line that did not resolve to a canonical LVT ID. */
  pressureFromRaw: string[];
}

/**
 * A parking-lot item (PL-*).
 * `section` is the repository-supported grouping/disposition the item sits under.
 * `relatedLvtIds` / `relatedArIds` are populated ONLY from explicit references in
 * the item's own text.
 */
export interface PlItem {
  /** e.g. "PL-EVID-AGE". */
  id: string;
  /** Human-readable name where the source provides one; otherwise null. */
  name: string | null;
  /** Repository section / disposition grouping this item was found under. */
  section: string;
  /** Physical source file (pagination only), e.g. "parking-lot-9.md". */
  sourceFile: string;
  /** Canonical LVT IDs explicitly referenced by this item's text. */
  relatedLvtIds: string[];
  /** AR IDs explicitly referenced by this item's text. */
  relatedArIds: string[];
}

/**
 * A graduated/closed parking-lot item — the RESOLVED landscape.
 * Derived from the primary parking-lot file's "Graduated / Closed Index".
 * `id` may be a `PL-*` id or a historical numeric id (e.g. "#7"). Disposition is
 * the authority's own word (Implemented / Promoted / Superseded / Merged /
 * Reframed / Dissolved / Split), normalized to plain text.
 */
export interface GraduatedItem {
  id: string;
  name: string | null;
  disposition: string;
  destination: string | null;
}

/**
 * An Architecture Decision Record (ADR) from docs/07c-adrs.md.
 * The full ADR text remains canonical in the Markdown; this carries identity,
 * title, date, status, and a concise context excerpt for the projection.
 */
export interface AdrRecord {
  /** e.g. "ADR-018". */
  id: string;
  title: string;
  date: string | null;
  status: string | null;
  /** Concise context excerpt (first paragraph), or null. */
  context: string | null;
}

/**
 * A single entry in the provisional priority stack (docs/roadmap-priority.md).
 * Rank is authority-established list order, never inferred. `refId` points at a
 * canonical identity (PL-* / LVT-* / AR*) when the authority cites one.
 */
export interface PriorityEntry {
  rank: number;
  refId: string | null;
  /** Whether refId resolves to a known projection object (null when no refId). */
  refResolves: boolean | null;
  reason: string | null;
}

/** The provisional priority stack. `established` is false when the authority is empty. */
export interface PriorityStack {
  established: boolean;
  entries: PriorityEntry[];
}

/**
 * A curated user-facing capability in the Coming Soon snapshot
 * (docs/roadmap-coming-soon.md). A product capability, not implementation work.
 * No rank, date, status, or percentage fields — horizon placement is attention/
 * intent, not commitment, and item order within a horizon is non-semantic.
 */
export interface ComingSoonItem {
  name: string;
  description: string | null;
}

/**
 * The Coming Soon product-horizon snapshot. Three unordered horizons. Any horizon
 * may be empty (the honest default). Ordering within a horizon carries no meaning;
 * Priority (docs/roadmap-priority.md) is the sole ordinal execution authority.
 */
export interface ComingSoon {
  now: ComingSoonItem[];
  next: ComingSoonItem[];
  later: ComingSoonItem[];
}

/**
 * A ratified enduring principle from the canonical register (docs/principles.md).
 * The register is the sole source of truth for which principles are ratified;
 * the projection never infers principles from other documents.
 */
export interface PrincipleRecord {
  /** e.g. "PRIN-ARCH-EVIDENCE-APPLIANCE". */
  id: string;
  name: string;
  /** Family label, e.g. "Architectural / build" or "Epistemic". */
  family: string;
  statement: string | null;
  /** Provenance text when the register lists explicit multi-source provenance. */
  provenance: string | null;
}

/**
 * A single entry within a Domain Part — a heading from the options domain
 * reference plus its faithful content. Content is canonical text verbatim or a
 * mechanically-sliced excerpt (never an actor-written summary); `truncated`
 * indicates additional canonical detail exists in the source. `tags` are the
 * grounding classifications ([MECH]/[THEORY]/[EMPIRICAL]/…) mechanically
 * detected in the entry.
 */
export interface DomainTable {
  /** Verbatim header cells. */
  header: string[];
  /** Verbatim body-row cells (separator row dropped). */
  rows: string[][];
}

export interface DomainEntry {
  heading: string;
  level: number;
  content: string;
  truncated: boolean;
  tags: string[];
  /** Canonical Markdown tables in the entry, rendered structurally (verbatim cells). */
  tables: DomainTable[];
}

/** A Part of the options domain reference (its own heading) with its entries. */
export interface DomainPart {
  title: string;
  entries: DomainEntry[];
}

/**
 * The Domain projection — a read-only, faithful projection of the canonical
 * options domain reference (Category E specialized reference). Describes the
 * domain; does not establish Wheelwright policy or authorize trading behavior.
 */
export interface DomainReference {
  parts: DomainPart[];
}

/**
 * A known defect, projected verbatim from the canonical bug index
 * (docs/bugs/INDEX.md). Exposes what Wheelwright knows is wrong, independently of
 * whether the defect is prioritized or authorized for remediation. Severity is
 * consequence evidence, NOT remediation priority; `Not established` is preserved
 * verbatim, never inferred. No ranking/assignee/workflow fields exist.
 */
/**
 * A section of a canonical bug record, projected faithfully: heading and content
 * verbatim (content may be a mechanically-sliced excerpt when long), embedded
 * tables rendered structurally with verbatim cells. No synthesized text.
 */
export interface BugSection {
  heading: string;
  level: number;
  content: string;
  truncated: boolean;
  tables: DomainTable[];
}

export interface BugRecord {
  /** e.g. "BUG-018". */
  id: string;
  /** Title from the INDEX row (verbatim). */
  title: string;
  area: string;
  /** "S1".."S4" or "Not established" — verbatim. */
  severity: string;
  /** "Open" | "Resolved" | "Won't Fix" | "Duplicate" — verbatim. */
  status: string;
  /** Canonical record path (e.g. "BUG-018-*.md") — reference only, not a link. */
  recordFile: string;
  provenance: string;
  /** The record's own `#` title (verbatim), when the record file is present. */
  recordTitle: string | null;
  /** Faithful projection of the record's `##`/`###` sections, in document order. */
  sections: BugSection[];
}

/**
 * The governed kind of a Log event, derived EXPLICITLY from the canonical record
 * (its heading form and its `**State:**` word) — never guessed from vague prose.
 *
 *   - "intake":          a new-identity intake record (state begins INTAKE) or an
 *                        INTAKE-refinement record. An intake event's date is the
 *                        one kind of event whose date can establish an intake date.
 *   - "reconciliation":  a "Reconciliation Completion Record" heading, or a record
 *                        whose state begins RECONCILED.
 *   - "refinement":      a "... Refinement — ..." record that is not itself an
 *                        intake (state does not begin INTAKE).
 *   - "implementation":  state begins IMPLEMENTED.
 *   - "remediation":     state begins REMEDIATED (or REMEDIATED / CLOSED).
 *   - "unclassified":    a real dated governed record whose kind the authority does
 *                        not let us establish confidently. Shown neutrally; NEVER
 *                        guessed into one of the above.
 *
 * These are the only kinds the current authority reliably supports. Decomposition
 * and authorization are recorded inside reconciliation records' prose rather than
 * as their own dated headings today, so no such kind is invented here.
 */
export type LogEventKind =
  | "intake"
  | "reconciliation"
  | "refinement"
  | "implementation"
  | "remediation"
  | "unclassified";

/**
 * Whether a record carries EXPLICIT canonical evidence that it establishes the
 * original intake of its `PL-*` identity. This is INDEPENDENT of `eventKind`
 * (Codex final finding 1): one dated record may be, say, a remediation event
 * while its `**Date:**` line explicitly marks that date as the intake date, and a
 * reconciliation record may explicitly state it created a new canonical identity.
 *
 * Established ONLY by narrow explicit signals the corpus actually uses:
 *   - the `**Date:**` line marks the date as intake, e.g. "September 1, 2026 (intake)";
 *   - the state line explicitly says a new identity was created, e.g.
 *     "new canonical identity created" / "New canonical identity in the logical parking lot".
 * The mere appearance of the word "INTAKE" (e.g. "INTAKE refinement … no new
 * `PL-*` identity created") does NOT establish original intake.
 */

/**
 * A single EXPLICIT governed temporal event for the Log lens.
 *
 * The Log is a chronology of explicit governed temporal events: *what governed
 * step happened, when, and to which identity.* Each entry corresponds to one
 * canonical record — at ANY heading depth (`##` or nested `###`) — that states
 * its OWN explicit `**Date:**`. A single `PL-*` identity legitimately accrues
 * several such events over time; each is its own event.
 *
 * CRITICAL SEMANTIC DISTINCTION (Codex Blocking 2):
 *   - `eventDate*` is the date of THIS event (intake, reconciliation, refinement,
 *     implementation, remediation, …). It is NOT automatically an intake date.
 *   - An intake date is known for an identity ONLY when an `eventKind === "intake"`
 *     event exists for it. A later reconciliation/refinement/implementation event
 *     NEVER retroactively establishes an unknown intake date.
 *
 * EXPLICIT-ONLY / NO INFERENCE: an entry exists ONLY when the record states an
 * explicit `**Date:**`. Dates are never inferred from row order, file order, Git
 * history, journal/heading order, textual proximity, or later lifecycle events.
 * `plId` is captured only when the record's heading names a `PL-*` identity; else
 * null. `state` is the record's `**State:**` / `**Reconciliation state:**` line,
 * verbatim, or null. Nothing here is a schedule, priority, or progress metric.
 */
export interface LogEntry {
  /** Canonical `PL-*` identity when the record heading names one; else null. */
  plId: string | null;
  /**
   * Canonical `BUG-NNN` identity when this event comes from the bug corpus; else
   * null. Preserves source-system identity per the ratified cross-authority Log
   * invariant: a bug event stays a bug event and is NEVER given a `PL-*` identity.
   * Exactly one of `plId` / `bugId` is non-null for a given event.
   */
  bugId: string | null;
  /** The record's heading title (verbatim, backticks stripped). */
  title: string;
  /** The explicitly derived governed kind of THIS event, for presentation (never guessed). */
  eventKind: LogEventKind;
  /**
   * Whether THIS record explicitly establishes original intake of its identity.
   * Independent of `eventKind` (see the doc above). Never inferred from the word
   * "INTAKE" alone.
   */
  establishesIntake: boolean;
  /** The event date exactly as authored, e.g. "September 8, 2026 (live operator incident)". */
  eventDateText: string;
  /**
   * ISO-8601 (YYYY-MM-DD) parsed from the LEADING "Month D, YYYY" of eventDateText,
   * used solely for deterministic chronological ordering — never shown as authority.
   * Always a REAL calendar date: the generator fails closed on an impossible date,
   * so this is never null for an emitted event.
   */
  eventDateIso: string;
  /** The record's `**State:**` / `**Reconciliation state:**` line, verbatim, or null. */
  state: string | null;
  /** Heading depth this record was found at (2..6). Provenance only. */
  headingLevel: number;
  /** Physical source file (pagination only), e.g. "parking-lot-7.md". Provenance, not a why-state link. */
  sourceFile: string;
  /**
   * Monotonic global capture position in canonical source order (file order, then
   * line order). Internal ordering metadata used ONLY as the deterministic
   * same-date tie-breaker so parent-before-child and adjacency are preserved. Has
   * no product meaning and is never rendered.
   */
  sourceOrder: number;
}

/** Provenance and integrity metadata for the projection. */
export interface ProjectionMeta {
  /** ISO timestamp the projection was generated. */
  generatedAt: string;
  /** Canonical authority files the projection was derived from. */
  sources: string[];
  counts: {
    lvtTotal: number;
    lvtByType: Record<LvtNodeType, number>;
    arTotal: number;
    plTotal: number;
    /** PL items with at least one explicit LVT or AR relationship. */
    plWithExplicitRelationship: number;
    /** Graduated/closed items (the resolved landscape). */
    graduatedTotal: number;
    /** Architecture Decision Records. */
    adrTotal: number;
    /** Provisional priority stack entries (0 = not established yet). */
    priorityTotal: number;
    /** Curated Coming Soon items (0 = nothing curated yet). */
    comingSoonTotal: number;
    /** Ratified principles in the canonical register. */
    principleTotal: number;
    /** Domain reference entries projected (across all Parts). */
    domainEntryTotal: number;
    /** Known defects in the canonical bug index. */
    bugTotal: number;
    /** Explicit governed temporal events in the Log (any heading depth; explicit dates only). */
    logTotal: number;
    /** Log events that carry explicit intake evidence (establishesIntake === true). */
    logIntakeEvidenceEvents: number;
    /** Active parking-lot `PL-*` identities WITH explicit recorded intake evidence. */
    plWithIntakeDate: number;
    /**
     * Count of active parking-lot `PL-*` identities for which NO record carries
     * explicit intake evidence — their ORIGINAL intake date is not recorded in
     * canonical authority. Listed by identity in `intakeDateUnknown` so the UI
     * names them rather than reducing to a count. Derived from explicit intake
     * evidence only, never from `eventKind`.
     */
    plWithoutIntakeDate: number;
  };
  /**
   * Non-fatal notes recorded during parsing (e.g. an alias that did not resolve).
   * Fatal integrity failures cause the generator to exit non-zero instead.
   */
  notes: string[];
}

export interface RoadmapProjection {
  meta: ProjectionMeta;
  lvt: LvtNode[];
  architecture: ArPressure[];
  parkingLot: PlItem[];
  /** The resolved landscape: graduated / closed items. */
  graduated: GraduatedItem[];
  /** Architecture Decision Records (ratified decisions). */
  adrs: AdrRecord[];
  /** Provisional working order of priority (authority-established only). */
  priority: PriorityStack;
  /** Curated user-facing future capabilities. */
  comingSoon: ComingSoon;
  /** Ratified enduring principles (canonical register). */
  principles: PrincipleRecord[];
  /** Faithful projection of the options domain reference (Category E). */
  domain: DomainReference;
  /** Known defects, verbatim from the canonical bug index (source order). */
  bugs: BugRecord[];
  /**
   * The Log: explicit governed temporal events in deterministic chronological
   * order (earliest first). Explicit dates only, any heading depth; records
   * without their own `**Date:**` produce no entry (see LogEntry).
   */
  log: LogEntry[];
  /**
   * Active parking-lot `PL-*` identities whose ORIGINAL intake date is not
   * recorded in canonical authority — i.e. no `eventKind === "intake"` Log event
   * exists for them. Listed by identity (not reduced to a count) so the operator
   * surface can name the affected items. Never backfilled or inferred; a later
   * reconciliation/implementation/refinement event does NOT remove an identity
   * from this list. Sorted for determinism.
   */
  intakeDateUnknown: string[];
}
