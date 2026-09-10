/**
 * Shared helpers for refresh visible-state convergence (PL-OPS-09 consumers).
 *
 * Both the bulk ("Refresh top opportunities") and per-row refresh controls claim operator-facing
 * success only when the VISIBLE evidence has converged — i.e. a row's chain-acquisition instant
 * has advanced past the value observed at click time (visual-design-principles #12). These helpers
 * centralize how that instant is read from provenance and keep the two controls consistent.
 */

import type { EvidenceProvenance } from "./evidence-provenance";

/** A live map of underlying symbol → its current chain-acquisition provenance (or absence). */
export type SymbolProvenanceMap = ReadonlyMap<string, EvidenceProvenance | null | undefined>;

/**
 * Extract the comparable chain-acquisition instant (epoch ms) from provenance, or null when the
 * provenance is unavailable/absent. Null baselines are treated as "any real acquisition is newer"
 * by callers, so an initially-unavailable row still converges when it first acquires.
 */
export function acquiredMs(p: EvidenceProvenance | null | undefined): number | null {
  return p && p.kind === "chain-acquired" ? p.acquiredAtMs : null;
}
