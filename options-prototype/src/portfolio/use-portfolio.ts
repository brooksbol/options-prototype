/**
 * React hook for consuming application-scoped Portfolio state.
 *
 * Uses useSyncExternalStore (React 18) for tear-free reads
 * from the module-level portfolio store.
 */

import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getSource,
  getImportStatus,
  type ImportStatus,
} from "./portfolio-store";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";

export interface PortfolioState {
  source: PortfolioSourceType;
  snapshot: PortfolioSnapshot | null;
  importStatus: ImportStatus;
}

export function usePortfolio(): PortfolioState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const source = useSyncExternalStore(subscribe, getSource);
  const importStatus = useSyncExternalStore(subscribe, getImportStatus);
  return { source, snapshot, importStatus };
}
