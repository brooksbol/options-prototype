/**
 * useEvidenceSnapshot — polls the backend snapshot endpoint with conditional HTTP.
 *
 * - Polls every 30s (configurable)
 * - Uses ETag / If-None-Match for efficient 304 responses
 * - No overlapping requests
 * - Triggers callback when evidence changes
 * - Does not blank state during polling
 */

import { useEffect, useRef, useCallback, useState } from "react";

export interface SnapshotCoverage {
  ready: number;
  absent: number;
  expirationsKnown: number;
  pending: number;
  failed: number;
}

export interface EvidenceSnapshotMeta {
  generation: number;
  generatedAt: string;
  universe: number;
  coverage: SnapshotCoverage;
}

const POLL_INTERVAL_MS = 30_000;

export function useEvidenceSnapshot(
  enabled: boolean,
  onNewEvidence: (snapshot: any) => void
): { meta: EvidenceSnapshotMeta | null; polling: boolean; lastPollResult: "200" | "304" | "error" | null } {
  const etagRef = useRef<string | null>(null);
  const pollingRef = useRef(false);
  const [meta, setMeta] = useState<EvidenceSnapshotMeta | null>(null);
  const [lastResult, setLastResult] = useState<"200" | "304" | "error" | null>(null);
  const onNewEvidenceRef = useRef(onNewEvidence);
  onNewEvidenceRef.current = onNewEvidence;

  const poll = useCallback(async () => {
    if (pollingRef.current) return; // No overlapping
    pollingRef.current = true;

    try {
      const headers: Record<string, string> = {};
      if (etagRef.current) {
        headers["If-None-Match"] = etagRef.current;
      }

      const res = await fetch("/api/evidence/snapshot", { headers });

      if (res.status === 304) {
        setLastResult("304");
        return;
      }

      if (res.ok) {
        const etag = res.headers.get("etag");
        if (etag) etagRef.current = etag;

        const snapshot = await res.json();
        setMeta({
          generation: snapshot.generation,
          generatedAt: snapshot.generatedAt,
          universe: snapshot.universe,
          coverage: snapshot.coverage,
        });
        setLastResult("200");
        onNewEvidenceRef.current(snapshot);
      } else {
        setLastResult("error");
      }
    } catch {
      setLastResult("error");
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    poll();

    // Poll on interval
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, poll]);

  return { meta, polling: pollingRef.current, lastPollResult: lastResult };
}
