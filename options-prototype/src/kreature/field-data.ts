/**
 * Kreature Field Data Layer — transforms spot_history into a perceptual field.
 *
 * DESIGN PRINCIPLES:
 *   - Change-from-self is the primitive: how different is the latest observation
 *     from recent history for the same symbol?
 *   - Acquisition cadence does NOT determine apparent importance.
 *     Class A symbols (sampled every 15 min) should not look more active than
 *     Class B (sampled every 2 hours) merely because they have more observations.
 *   - Change is normalized as percentage movement from a reference point
 *     (first observation of the session), making heterogeneous securities comparable.
 *   - Every visual property traces to real retained evidence.
 *
 * NORMALIZATION STRATEGY:
 *   Rather than using observation count or raw pixel displacement,
 *   each symbol's visual state is determined by:
 *     - displacement = (latest price - session reference price) / session reference price
 *     - velocity = displacement change between last two distinct observation moments
 *   These are cadence-independent: a symbol observed 6 times and one observed 150 times
 *   produce equally valid displacement values.
 *
 * DEDUP:
 *   Same provisional 30-second heuristic as V1 (multi-expiration artifact collapse).
 */

// --- Types ---

/** A single symbol's temporal state for rendering */
export interface FieldSymbol {
  /** Uppercase symbol ticker */
  symbol: string;
  /** Deterministic spatial position (0-1 range, x and y) */
  x: number;
  y: number;
  /** Session-relative displacement: (latest - reference) / reference. Signed. */
  displacement: number;
  /** Recent velocity: displacement change between last two moments. Signed. */
  velocity: number;
  /** Magnitude of displacement (absolute value) — drives brightness */
  magnitude: number;
  /** Trail: recent displacement history (oldest first, up to TRAIL_LENGTH points) */
  trail: number[];
  /** Latest observed price */
  latestPrice: number;
  /** Reference price (first observation of session) */
  referencePrice: number;
  /** Number of distinct observation moments this session */
  momentCount: number;
  /** Timestamp of latest observation */
  latestObservedAt: string;
  /** Whether this symbol has sufficient data (>= 2 moments) */
  hasSufficientData: boolean;
}

/** Complete field state for one point in time */
export interface FieldState {
  /** All symbols with any observation data */
  symbols: FieldSymbol[];
  /** Timestamp this state represents (latest observation across all symbols) */
  asOf: string;
  /** Total symbols in the universe */
  universeSize: number;
  /** Symbols with at least one observation */
  observedCount: number;
  /** Symbols with sufficient data for displacement (>= 2 moments) */
  activeCount: number;
}

/** Raw observation moment (after dedup) */
export interface FieldObservation {
  price: number;
  observedAt: string;
}

/** Raw history for all symbols (from API) */
export type UniverseHistory = Map<string, FieldObservation[]>;

// --- Constants ---

const DEDUP_WINDOW_MS = 30_000;
const TRAIL_LENGTH = 8;

// --- Spatial Assignment ---

/**
 * Assign a deterministic, stable (x, y) position to a symbol.
 * Uses a hash of the symbol name → position in [0, 1] × [0, 1].
 * Same symbol always gets the same position across sessions.
 *
 * Uses a simple but effective string hash (djb2 variant) to avoid
 * needing external dependencies. Produces visually acceptable distribution.
 */
export function assignPosition(symbol: string): { x: number; y: number } {
  // Two independent hashes for x and y
  let hashX = 5381;
  let hashY = 7919;
  for (let i = 0; i < symbol.length; i++) {
    const c = symbol.charCodeAt(i);
    hashX = ((hashX << 5) + hashX + c) | 0;
    hashY = ((hashY << 7) + hashY + c) | 0;
  }
  // Normalize to [0.02, 0.98] to keep symbols away from edges
  const x = 0.02 + (((hashX >>> 0) % 10000) / 10000) * 0.96;
  const y = 0.02 + (((hashY >>> 0) % 10000) / 10000) * 0.96;
  return { x, y };
}

// --- Data Processing ---

/**
 * Collapse raw spot_history API response into deduplicated observation moments.
 * Same provisional 30-second heuristic as V1.
 */
export function deduplicateHistory(
  rawHistories: Record<string, Array<{ price: number; observedAt: string }>>
): UniverseHistory {
  const result = new Map<string, FieldObservation[]>();

  for (const [symbol, observations] of Object.entries(rawHistories)) {
    if (!observations || observations.length === 0) {
      result.set(symbol, []);
      continue;
    }

    const deduped: FieldObservation[] = [];
    let clusterStart = observations[0];
    deduped.push({ price: clusterStart.price, observedAt: clusterStart.observedAt });

    for (let i = 1; i < observations.length; i++) {
      const obs = observations[i];
      const gap = new Date(obs.observedAt).getTime() - new Date(clusterStart.observedAt).getTime();
      if (gap > DEDUP_WINDOW_MS) {
        clusterStart = obs;
        deduped.push({ price: obs.price, observedAt: obs.observedAt });
      }
    }

    result.set(symbol, deduped);
  }

  return result;
}

/**
 * Derive the complete field state from deduplicated universe history.
 * This is the main computation: for each symbol, compute displacement,
 * velocity, magnitude, and trail from its observation series.
 */
export function deriveFieldState(history: UniverseHistory): FieldState {
  const symbols: FieldSymbol[] = [];
  let latestOverall = "";
  let observedCount = 0;
  let activeCount = 0;

  for (const [symbol, moments] of history) {
    if (moments.length === 0) continue;
    observedCount++;

    const pos = assignPosition(symbol);
    const referencePrice = moments[0].price;
    const latestObs = moments[moments.length - 1];
    const latestPrice = latestObs.price;

    if (latestObs.observedAt > latestOverall) {
      latestOverall = latestObs.observedAt;
    }

    // Displacement: percentage change from session reference
    const displacement = referencePrice > 0
      ? (latestPrice - referencePrice) / referencePrice
      : 0;

    // Velocity: change in displacement between last two moments
    let velocity = 0;
    if (moments.length >= 2) {
      const prevPrice = moments[moments.length - 2].price;
      const prevDisplacement = referencePrice > 0
        ? (prevPrice - referencePrice) / referencePrice
        : 0;
      velocity = displacement - prevDisplacement;
    }

    // Trail: displacement at each recent moment (up to TRAIL_LENGTH)
    const trailStart = Math.max(0, moments.length - TRAIL_LENGTH);
    const trail: number[] = [];
    for (let i = trailStart; i < moments.length; i++) {
      const d = referencePrice > 0
        ? (moments[i].price - referencePrice) / referencePrice
        : 0;
      trail.push(d);
    }

    const hasSufficientData = moments.length >= 2;
    if (hasSufficientData) activeCount++;

    symbols.push({
      symbol,
      x: pos.x,
      y: pos.y,
      displacement,
      velocity,
      magnitude: Math.abs(displacement),
      trail,
      latestPrice,
      referencePrice,
      momentCount: moments.length,
      latestObservedAt: latestObs.observedAt,
      hasSufficientData,
    });
  }

  return {
    symbols,
    asOf: latestOverall,
    universeSize: history.size,
    observedCount,
    activeCount,
  };
}

/**
 * Derive field state at a specific point in time (for REPLAY mode).
 * Only includes observations up to the given timestamp.
 *
 * Optimization: rather than filtering every observation for every symbol,
 * we use the sorted nature of observations to binary-search for the cutoff.
 */
export function deriveFieldStateAtTime(
  history: UniverseHistory,
  upToTimestamp: string
): FieldState {
  const symbols: FieldSymbol[] = [];
  let latestOverall = "";
  let observedCount = 0;
  let activeCount = 0;

  for (const [symbol, moments] of history) {
    if (moments.length === 0) continue;

    // Fast cutoff: if first observation is after the timestamp, skip
    if (moments[0].observedAt > upToTimestamp) continue;

    // Find the last observation <= upToTimestamp (observations are sorted ascending)
    let endIdx = 0;
    for (let i = moments.length - 1; i >= 0; i--) {
      if (moments[i].observedAt <= upToTimestamp) {
        endIdx = i + 1;
        break;
      }
    }

    if (endIdx === 0) continue;
    observedCount++;

    const visible = moments.slice(0, endIdx);
    const pos = assignPosition(symbol);
    const referencePrice = visible[0].price;
    const latestObs = visible[visible.length - 1];
    const latestPrice = latestObs.price;

    if (latestObs.observedAt > latestOverall) {
      latestOverall = latestObs.observedAt;
    }

    const displacement = referencePrice > 0
      ? (latestPrice - referencePrice) / referencePrice
      : 0;

    let velocity = 0;
    if (visible.length >= 2) {
      const prevPrice = visible[visible.length - 2].price;
      const prevDisplacement = referencePrice > 0
        ? (prevPrice - referencePrice) / referencePrice
        : 0;
      velocity = displacement - prevDisplacement;
    }

    const trailStart = Math.max(0, visible.length - TRAIL_LENGTH);
    const trail: number[] = [];
    for (let i = trailStart; i < visible.length; i++) {
      const d = referencePrice > 0
        ? (visible[i].price - referencePrice) / referencePrice
        : 0;
      trail.push(d);
    }

    const hasSufficientData = visible.length >= 2;
    if (hasSufficientData) activeCount++;

    symbols.push({
      symbol,
      x: pos.x,
      y: pos.y,
      displacement,
      velocity,
      magnitude: Math.abs(displacement),
      trail,
      latestPrice,
      referencePrice,
      momentCount: visible.length,
      latestObservedAt: latestObs.observedAt,
      hasSufficientData,
    });
  }

  return {
    symbols,
    asOf: latestOverall,
    universeSize: history.size,
    observedCount,
    activeCount,
  };
}

/**
 * Get all distinct observation timestamps across the universe (sorted).
 * Used by REPLAY mode to step through the session.
 */
export function getAllTimestamps(history: UniverseHistory): string[] {
  const tsSet = new Set<string>();
  for (const moments of history.values()) {
    for (const m of moments) {
      tsSet.add(m.observedAt);
    }
  }
  return [...tsSet].sort();
}
