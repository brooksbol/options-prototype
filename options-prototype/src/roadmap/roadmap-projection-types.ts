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
 * canonical identity (PL-*/LVT-*/AR*) when the authority cites one.
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
 * A curated user-facing "Coming Soon" item (docs/roadmap-coming-soon.md).
 * Curated by explicit decision only; never auto-populated. No delivery dates.
 */
export interface ComingSoonItem {
  name: string;
  description: string | null;
  /** Optional coarse, honest status word (e.g. "Exploring"); no dates. */
  status: string | null;
}

/** The curated Coming Soon list. `curated` is false when the authority is empty. */
export interface ComingSoon {
  curated: boolean;
  items: ComingSoonItem[];
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
}
