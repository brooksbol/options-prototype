/**
 * The Watch — a living stream of what Wheelwright is observing.
 *
 * New observations appear without operator action as evidence generations advance.
 * Deliberately under-interpreted. Its purpose is presence, emergence, and discovery.
 *
 * Motion on The Watch corresponds to real new evidence.
 * If Wheelwright did not observe anything new, nothing appears.
 *
 * Perceptual design:
 *   - Observations that existed before mount render in settled state (no animation)
 *   - Observations that arrive after mount animate in (subtle fade/slide)
 *   - Stream grows chronologically (oldest at top, newest at bottom)
 *   - When new observations arrive in a batch, they stagger slightly
 */

import { useRef, useEffect, useState } from "react";
import type { ObservationMoment } from "./observation-derivation";
import { formatTimeETWithSeconds } from "./observation-derivation";

interface TheWatchProps {
  /** All observation moments (chronological, deduplicated) */
  moments: ObservationMoment[];
  /** Whether the market session is currently active */
  sessionActive: boolean;
}

export function TheWatch({ moments, sessionActive }: TheWatchProps) {
  // Track which observations were present at initial render (no animation for those)
  const initialMomentCountRef = useRef<number | null>(null);
  const [animateFrom, setAnimateFrom] = useState<number>(Infinity);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Limit displayed moments to avoid DOM overload on initial history load
  const MAX_DISPLAY = 50;
  const displayMoments = moments.length > MAX_DISPLAY
    ? moments.slice(moments.length - MAX_DISPLAY)
    : moments;
  // Offset: how many moments were trimmed from the front
  const displayOffset = moments.length - displayMoments.length;

  // On first render, mark all current moments as "settled"
  useEffect(() => {
    if (initialMomentCountRef.current === null) {
      initialMomentCountRef.current = moments.length;
      setAnimateFrom(moments.length);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When new moments arrive, update animateFrom AFTER they've had time to animate
  useEffect(() => {
    if (moments.length <= animateFrom) return;

    // After animation completes, promote new entries to settled state
    const timeout = setTimeout(() => {
      setAnimateFrom(moments.length);
    }, 1500); // Animation duration + buffer

    return () => clearTimeout(timeout);
  }, [moments.length, animateFrom]);

  // Auto-scroll to bottom when new observations arrive
  useEffect(() => {
    if (bottomRef.current && moments.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [moments.length]);

  if (moments.length === 0) {
    return (
      <div className="kr-watch kr-watch--empty">
        <div className="kr-watch-empty-state">
          {sessionActive
            ? "Waiting for observations\u2026"
            : "No observations today."}
        </div>
      </div>
    );
  }

  return (
    <div className="kr-watch">
      <div className="kr-watch-stream">
        {displayOffset > 0 && (
          <div className="kr-watch-truncated">
            {displayOffset} earlier observations not shown
          </div>
        )}
        {displayMoments.map((moment, idx) => {
          const globalIdx = idx + displayOffset;
          const isNew = globalIdx >= animateFrom;
          // Stagger delay for batch arrivals
          const staggerDelay = isNew ? (globalIdx - animateFrom) * 120 : 0;

          return (
            <WatchEntry
              key={`${moment.symbol}-${moment.observedAt}`}
              moment={moment}
              animate={isNew}
              staggerDelay={staggerDelay}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// --- Watch Entry ---

interface WatchEntryProps {
  moment: ObservationMoment;
  animate: boolean;
  staggerDelay: number;
}

function WatchEntry({ moment, animate, staggerDelay }: WatchEntryProps) {
  const time = formatTimeETWithSeconds(moment.observedAt);
  const contractSummary = moment.contracts
    .map(c => {
      const typeLabel = c.type === "put" ? "P" : "C";
      return `${typeLabel}${c.strike} · ${c.moneynessLabel}`;
    })
    .join("  ");

  return (
    <div
      className={`kr-watch-entry ${animate ? "kr-watch-entry--entering" : ""}`}
      style={animate ? { animationDelay: `${staggerDelay}ms` } : undefined}
    >
      <span className="kr-watch-time">{time}</span>
      <span className="kr-watch-symbol">{moment.symbol}</span>
      <span className="kr-watch-price">${moment.price.toFixed(2)}</span>
      <span className="kr-watch-arrow">{"\u2192"}</span>
      <span className="kr-watch-contracts">{contractSummary}</span>
    </div>
  );
}
