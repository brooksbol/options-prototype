/**
 * Candidate Universe — Domain Types.
 *
 * The Candidate Universe holds symbols that might be worth evaluating
 * by institutional policy. It is intentionally larger than the admitted
 * registry or the Opportunity Lab scan set.
 *
 * Inclusion in the Candidate Universe does NOT imply:
 * - admission or suitability
 * - optionability
 * - sufficient liquidity
 * - deployment readiness
 */

export interface CandidateSymbol {
  /** Uppercase ticker symbol */
  symbol: string;
  /** Source tags identifying how this candidate entered the universe */
  sources: string[];
  /** ISO date — earliest known addition date */
  addedAt: string;
}

// --- Universe Descriptor ---

export interface CandidateUniverseDescriptor {
  /** Stable identifier for this universe composition */
  id: string;
  /** Human-readable name */
  name: string;
  /** Version tag (tracks source data vintage) */
  version: string;
  /** Total symbol count */
  totalSymbols: number;
  /** Origin description */
  source: string;
}

export interface CandidateUniverseResult {
  descriptor: CandidateUniverseDescriptor;
  candidates: CandidateSymbol[];
  symbols: string[];
}
