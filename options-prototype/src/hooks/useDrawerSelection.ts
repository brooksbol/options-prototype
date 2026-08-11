import { useState, useCallback } from "react";

/**
 * Drawer selection state management for WriteDesk.
 *
 * Invariant: at most one drawer selection may be active at a time.
 * Selecting a candidate from any surface clears every other selection atomically.
 */

export type DrawerKind = "put" | "call" | "buywrite" | "none";

export interface DrawerSelectionState<TPut, TCall, TBuyWrite, TPos> {
  selectedCandidate: TPut | null;
  tablePosition: TPos | null;
  selectedCallCandidate: TCall | null;
  selectedBuyWriteCandidate: TBuyWrite | null;
  selectDrawerCandidate: (
    kind: DrawerKind,
    payload?: { put?: TPut; putPos?: TPos; call?: TCall; buyWrite?: TBuyWrite }
  ) => void;
  clearAll: () => void;
  /**
   * Conditionally clear the put selection: if the predicate returns true
   * for the current candidate, the selection and tablePosition are cleared.
   * Used after re-recommend when the selected candidate may no longer exist in results.
   */
  clearCandidateIf: (shouldClear: (current: TPut) => boolean) => void;
  /**
   * Conditionally clear the call selection: if the predicate returns true
   * for the current row, the selection is cleared.
   */
  clearCallCandidateIf: (shouldClear: (current: TCall) => boolean) => void;
  /**
   * Conditionally clear the buy-write selection: if the predicate returns true
   * for the current candidate, the selection is cleared.
   */
  clearBuyWriteCandidateIf: (shouldClear: (current: TBuyWrite) => boolean) => void;
  /** Direct setters for onClose (only clears the dismissed drawer) */
  closeCandidate: () => void;
  closeCallCandidate: () => void;
  closeBuyWriteCandidate: () => void;
}

export function useDrawerSelection<TPut, TCall, TBuyWrite, TPos>(): DrawerSelectionState<TPut, TCall, TBuyWrite, TPos> {
  const [selectedCandidate, setSelectedCandidate] = useState<TPut | null>(null);
  const [tablePosition, setTablePosition] = useState<TPos | null>(null);
  const [selectedCallCandidate, setSelectedCallCandidate] = useState<TCall | null>(null);
  const [selectedBuyWriteCandidate, setSelectedBuyWriteCandidate] = useState<TBuyWrite | null>(null);

  const selectDrawerCandidate = useCallback((
    kind: DrawerKind,
    payload?: { put?: TPut; putPos?: TPos; call?: TCall; buyWrite?: TBuyWrite }
  ) => {
    switch (kind) {
      case "put":
        setSelectedCandidate(payload?.put ?? null);
        setTablePosition(payload?.putPos ?? null);
        setSelectedCallCandidate(null);
        setSelectedBuyWriteCandidate(null);
        break;
      case "call":
        setSelectedCallCandidate(payload?.call ?? null);
        setSelectedCandidate(null);
        setTablePosition(null);
        setSelectedBuyWriteCandidate(null);
        break;
      case "buywrite":
        setSelectedBuyWriteCandidate(payload?.buyWrite ?? null);
        setSelectedCandidate(null);
        setTablePosition(null);
        setSelectedCallCandidate(null);
        break;
      case "none":
        setSelectedCandidate(null);
        setTablePosition(null);
        setSelectedCallCandidate(null);
        setSelectedBuyWriteCandidate(null);
        break;
    }
  }, []);

  const clearAll = useCallback(() => {
    setSelectedCandidate(null);
    setTablePosition(null);
    setSelectedCallCandidate(null);
    setSelectedBuyWriteCandidate(null);
  }, []);

  const clearCandidateIf = useCallback((shouldClear: (current: TPut) => boolean) => {
    setSelectedCandidate((prev) => {
      if (!prev) return null;
      if (shouldClear(prev)) {
        setTablePosition(null);
        return null;
      }
      return prev;
    });
  }, []);

  const clearCallCandidateIf = useCallback((shouldClear: (current: TCall) => boolean) => {
    setSelectedCallCandidate((prev) => {
      if (!prev) return prev;
      return shouldClear(prev) ? null : prev;
    });
  }, []);

  const clearBuyWriteCandidateIf = useCallback((shouldClear: (current: TBuyWrite) => boolean) => {
    setSelectedBuyWriteCandidate((prev) => {
      if (!prev) return null;
      return shouldClear(prev) ? null : prev;
    });
  }, []);

  const closeCandidate = useCallback(() => setSelectedCandidate(null), []);
  const closeCallCandidate = useCallback(() => setSelectedCallCandidate(null), []);
  const closeBuyWriteCandidate = useCallback(() => setSelectedBuyWriteCandidate(null), []);

  return {
    selectedCandidate,
    tablePosition,
    selectedCallCandidate,
    selectedBuyWriteCandidate,
    selectDrawerCandidate,
    clearAll,
    clearCandidateIf,
    clearCallCandidateIf,
    clearBuyWriteCandidateIf,
    closeCandidate,
    closeCallCandidate,
    closeBuyWriteCandidate,
  };
}
