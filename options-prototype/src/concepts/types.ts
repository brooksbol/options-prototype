/**
 * Concept Definition Framework
 *
 * Centralized, testable, reusable explanatory content for the
 * progressive-learning surface. Each concept provides three layers:
 *
 *   1. Generic domain explanation — what this concept means in options generally
 *   2. Contract-specific explanation — contextualizes the concept with actual values
 *   3. Wheelwright interpretation — how this system computes/uses the measurement
 *
 * Concepts are product/domain content, not incidental UI copy.
 * They can be tested, reviewed, and evolved independently of React.
 */

import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { PositionDetail } from "../portfolio/position-detail";
import type { InventoryPosition } from "../write-desk/types";

export interface ConceptContext {
  position: MonitoredPosition;
  detail?: PositionDetail;
  inventory?: InventoryPosition | null;
}

export interface ConceptDefinition {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Human-readable title */
  title: string;

  /**
   * Generic domain explanation — what this concept means in options generally.
   * 2-4 sentences. No contract-specific references.
   * Must not contain recommendations or value judgments.
   */
  generic: string;

  /**
   * Generate contract-specific explanation using actual position values.
   * Makes the concept concrete for this exact contract.
   * Factual and direct — may describe consequences but not advise action.
   * Returns null if the concept isn't applicable to this position.
   */
  specific: (context: ConceptContext) => string | null;

  /**
   * How Wheelwright specifically computes or uses this measurement.
   * Clearly system-level documentation. Optional.
   */
  systemNote?: string;

  /** Related concept IDs the learner might explore next */
  related?: string[];
}
