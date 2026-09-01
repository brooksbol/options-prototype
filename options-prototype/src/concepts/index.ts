/**
 * Concept Registry — all available concept definitions.
 *
 * Import concepts from here rather than individual files.
 * The registry supports lookup by ID for the progressive-learning UI.
 */

import type { ConceptDefinition } from "./types";
import { moneynessConcept } from "./moneyness";
import { assignmentConcept } from "./assignment";
import { dteConcept } from "./dte";
import { costBasisConcept } from "./cost-basis";

export type { ConceptDefinition, ConceptContext } from "./types";

/** All registered concepts */
export const ALL_CONCEPTS: ConceptDefinition[] = [
  moneynessConcept,
  assignmentConcept,
  dteConcept,
  costBasisConcept,
];

/** Lookup a concept by its ID */
const conceptIndex = new Map<string, ConceptDefinition>(
  ALL_CONCEPTS.map(c => [c.id, c])
);

export function getConcept(id: string): ConceptDefinition | undefined {
  return conceptIndex.get(id);
}

/** Get all concept IDs */
export function getConceptIds(): string[] {
  return ALL_CONCEPTS.map(c => c.id);
}
