/**
 * Access to the derived roadmap projection.
 *
 * The projection is a build-time-derived, read-only view of canonical authority
 * (docs/roadmap.md, docs/architecture-roadmap.md, docs/parking-lot*.md). It is
 * imported statically; the Roadmap surface never fetches or mutates authority.
 */

import projection from "./roadmap-projection.json";
import type {
  RoadmapProjection,
  LvtNode,
  ArPressure,
  PlItem,
} from "./roadmap-projection-types";

const PROJECTION = projection as unknown as RoadmapProjection;

export function getProjection(): RoadmapProjection {
  return PROJECTION;
}

/** Index of LVT nodes by canonical id. */
export function lvtIndex(): Map<string, LvtNode> {
  return new Map(PROJECTION.lvt.map((n) => [n.id, n]));
}

/** Index of AR pressures by id. */
export function arIndex(): Map<string, ArPressure> {
  return new Map(PROJECTION.architecture.map((a) => [a.id, a]));
}

/**
 * PL items that explicitly reference a given LVT node id.
 * Explicit-only: derived solely from relationships recorded in the projection.
 */
export function plItemsForLvt(lvtId: string): PlItem[] {
  return PROJECTION.parkingLot.filter((i) => i.relatedLvtIds.includes(lvtId));
}

/** PL items that explicitly reference a given AR id. */
export function plItemsForAr(arId: string): PlItem[] {
  return PROJECTION.parkingLot.filter((i) => i.relatedArIds.includes(arId));
}

/** AR pressures whose explicit "Pressure from:" cites a given LVT node id. */
export function arPressuresForLvt(lvtId: string): ArPressure[] {
  return PROJECTION.architecture.filter((a) => a.pressureFromLvtIds.includes(lvtId));
}
