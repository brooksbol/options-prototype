/**
 * The Field — Kreature Laboratory Experiment 2.
 *
 * A full-universe perceptual field driven by observed change-from-self.
 * Hundreds of real observed subjects. Motion determined by real temporal change.
 * Disposable scientific instrumentation. Success criterion:
 *   "Does looking at it cause the operator to ask a question he wasn't previously asking?"
 *
 * Modes:
 *   LIVE — shows current field state, updates as evidence arrives
 *   REPLAY — plays back a session's history at 1×/10×/60× speed
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useFieldHistory } from "./use-field-history";
import { deriveFieldState, deriveFieldStateAtTime, getAllTimestamps, deduplicateHistory, type FieldState, type FieldSymbol, type UniverseHistory } from "./field-data";
import { FieldCanvas } from "./FieldCanvas";
import { formatTimeET } from "./observation-derivation";

type FieldMode = "live" | "replay";
type ReplaySpeed = 1 | 10 | 60;

export function TheField() {
  const [mode, setMode] = useState<FieldMode>("live");
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>(10);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayHistory, setReplayHistory] = useState<UniverseHistory | null>(null);
  const [replayTimestampIdx, setReplayTimestampIdx] = useState(0);
  const [replayLoading, setReplayLoading] = useState(false);
  const [pinnedSymbol, setPinnedSymbol] = useState<FieldSymbol | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<FieldSymbol | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Canvas dimensions (responsive — measured from the viewport area)
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  useEffect(() => {
    function measure() {
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(Math.max(rect.width, 400)),
          height: Math.floor(Math.max(rect.height, 300)),
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // --- LIVE MODE ---
  const [fieldHistoryState, triggerFetch] = useFieldHistory();
  const { history, loading: historyLoading } = fieldHistoryState;

  // Auto-trigger fetch on mount (once)
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (mode === "live" && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      triggerFetch();
    }
  }, [mode, triggerFetch]);

  const liveFieldState = useMemo(() => {
    if (mode !== "live" || history.size === 0) return null;
    return deriveFieldState(history);
  }, [mode, history]);

  // --- REPLAY MODE ---
  const replayTimestamps = useMemo(() => {
    if (!replayHistory) return [];
    return getAllTimestamps(replayHistory);
  }, [replayHistory]);

  const replayFieldState = useMemo(() => {
    if (mode !== "replay" || !replayHistory || replayTimestamps.length === 0) return null;
    const ts = replayTimestamps[Math.min(replayTimestampIdx, replayTimestamps.length - 1)];
    return deriveFieldStateAtTime(replayHistory, ts);
  }, [mode, replayHistory, replayTimestamps, replayTimestampIdx]);

  // Replay playback timer
  useEffect(() => {
    if (mode !== "replay" || !replayPlaying || replayTimestamps.length === 0) {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
      }
      return;
    }

    // Interval: at 60×, we advance one timestamp every ~16ms (one real minute per frame at 60fps)
    // At 10×, every ~100ms. At 1×, we'd need real-time gaps which we approximate.
    const intervalMs = Math.max(16, 1000 / replaySpeed);

    replayTimerRef.current = setInterval(() => {
      setReplayTimestampIdx(prev => {
        const next = prev + 1;
        if (next >= replayTimestamps.length) {
          setReplayPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
      }
    };
  }, [mode, replayPlaying, replaySpeed, replayTimestamps.length]);

  // Load replay data (most recent session with data)
  const [replayError, setReplayError] = useState<string | null>(null);
  const startReplay = useCallback(async () => {
    setReplayLoading(true);
    setReplayError(null);
    setMode("replay");
    setReplayPlaying(false);
    setReplayTimestampIdx(0);
    setReplayHistory(null);

    try {
      // Determine the most recent session date from already-loaded live history,
      // or fall back to fetching with a generous window
      let since: string;
      if (history.size > 0) {
        // Find the latest observation date from live data, use that day
        let latestTs = "";
        for (const moments of history.values()) {
          if (moments.length > 0) {
            const last = moments[moments.length - 1].observedAt;
            if (last > latestTs) latestTs = last;
          }
        }
        // Extract date and start from morning of that day
        const sessionDate = latestTs.slice(0, 10);
        since = `${sessionDate}T13:00:00.000Z`;
      } else {
        // No live data — use 24h window as fallback
        since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await fetch(`/api/evidence/history/all?since=${encodeURIComponent(since)}`);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      if (!data.histories || Object.keys(data.histories).length === 0) {
        setReplayError("No observation data found");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 0));
      const hist = deduplicateHistory(data.histories);

      if (hist.size === 0) {
        setReplayError("No data after deduplication");
        return;
      }

      setReplayHistory(hist);
      const ts = getAllTimestamps(hist);
      const startIdx = Math.min(Math.floor(ts.length * 0.1), ts.length - 1);
      setReplayTimestampIdx(Math.max(0, startIdx));
      setReplayPlaying(true);
    } catch (err) {
      setReplayError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setReplayLoading(false);
    }
  }, [history]);

  const goLive = useCallback(() => {
    setMode("live");
    setReplayPlaying(false);
    setReplayHistory(null);
    setReplayTimestampIdx(0);
  }, []);

  // Current field state (whichever mode is active)
  const activeFieldState: FieldState | null = mode === "live" ? liveFieldState : replayFieldState;

  // Info display
  const displaySymbol = pinnedSymbol || hoveredSymbol;
  const currentReplayTime = replayTimestamps.length > 0 && replayTimestampIdx < replayTimestamps.length
    ? replayTimestamps[replayTimestampIdx]
    : null;

  return (
    <div className="kr-field" ref={containerRef}>
      {/* Controls */}
      <div className="kr-field-controls">
        <div className="kr-field-mode-buttons">
          <button
            className={`kr-field-btn ${mode === "live" ? "kr-field-btn--active" : ""}`}
            onClick={goLive}
          >
            Live
          </button>
          <button
            className={`kr-field-btn ${mode === "replay" ? "kr-field-btn--active" : ""}`}
            onClick={startReplay}
          >
            Replay Today
          </button>
        </div>

        {mode === "replay" && replayHistory && (
          <div className="kr-field-replay-controls">
            <button
              className="kr-field-btn"
              onClick={() => setReplayPlaying(!replayPlaying)}
            >
              {replayPlaying ? "⏸" : "▶"}
            </button>
            <button
              className={`kr-field-btn ${replaySpeed === 1 ? "kr-field-btn--active" : ""}`}
              onClick={() => setReplaySpeed(1)}
            >
              1×
            </button>
            <button
              className={`kr-field-btn ${replaySpeed === 10 ? "kr-field-btn--active" : ""}`}
              onClick={() => setReplaySpeed(10)}
            >
              10×
            </button>
            <button
              className={`kr-field-btn ${replaySpeed === 60 ? "kr-field-btn--active" : ""}`}
              onClick={() => setReplaySpeed(60)}
            >
              60×
            </button>

            {/* Scrubber */}
            <input
              type="range"
              className="kr-field-scrubber"
              min={0}
              max={Math.max(0, replayTimestamps.length - 1)}
              value={replayTimestampIdx}
              onChange={(e) => {
                setReplayTimestampIdx(Number(e.target.value));
                setReplayPlaying(false);
              }}
            />

            {currentReplayTime && (
              <span className="kr-field-time">{formatTimeET(currentReplayTime)} ET</span>
            )}
          </div>
        )}

        {/* Status */}
        <div className="kr-field-status">
          {mode === "live" && historyLoading && (
            <span>Loading field\u2026</span>
          )}
          {mode === "live" && !historyLoading && activeFieldState && (
            <span>
              {activeFieldState.activeCount} active / {activeFieldState.observedCount} observed
              {" \u00b7 "}
              <button className="kr-field-btn" onClick={triggerFetch}>Refresh</button>
            </span>
          )}
          {mode === "replay" && replayLoading && <span>Loading session…</span>}
          {mode === "replay" && replayError && (
            <span style={{ color: "#ff6b6b" }}>Error: {replayError}</span>
          )}
          {mode === "replay" && replayFieldState && (
            <span>
              {replayFieldState.activeCount} active / {replayTimestampIdx + 1} of {replayTimestamps.length} moments
            </span>
          )}
        </div>
      </div>

      {/* The Field */}
      <div className="kr-field-viewport" ref={viewportRef}>
        <FieldCanvas
          fieldState={activeFieldState}
          width={dimensions.width}
          height={dimensions.height}
          onHover={setHoveredSymbol}
          onClick={setPinnedSymbol}
        />
      </div>

      {/* Detail panel (hovered/pinned symbol) */}
      {displaySymbol && (
        <div className="kr-field-detail">
          <span className="kr-field-detail-symbol">{displaySymbol.symbol}</span>
          <span className="kr-field-detail-price">${displaySymbol.latestPrice.toFixed(2)}</span>
          <span className="kr-field-detail-change">
            {displaySymbol.displacement >= 0 ? "+" : ""}
            {(displaySymbol.displacement * 100).toFixed(2)}% from session open
          </span>
          <span className="kr-field-detail-obs">{displaySymbol.momentCount} observations</span>
        </div>
      )}
    </div>
  );
}
