/**
 * Acquisition Worker — Self-scheduling, single-flight background evidence acquisition.
 *
 * INVARIANT: Only one acquisition cycle is ever in flight.
 *
 * The worker:
 *   1. Inspects the evidence store for pending/stale work
 *   2. Acquires a bounded batch using the existing TradierAdapter
 *   3. Publishes evidence incrementally to the store
 *   4. Schedules the next cycle after completing (never overlapping)
 *
 * Rate-limit authority:
 *   Provider rate compliance is owned EXCLUSIVELY by RequestPacer (0.9 req/sec).
 *   The worker does NOT add independent pacing delays.
 *
 * Retained delays (scheduling/backoff only):
 *   - 30s when idle (no work remaining)
 *   - 5s after a symbol failure (backoff)
 *   - 1s between cycles (scheduling)
 */

import type { ServiceConfig } from "./config.js";
import { TradierAdapter } from "./providers/tradier.js";
import { getEvidenceStore } from "./evidence-store.js";
import type { SqliteEvidenceStore } from "./db/sqlite-evidence-store.js";
import { loadUniverse } from "./universe.js";

// --- Session Gate (emergency stopgap) ---
// Full session model will be shared from frontend in Phase 1.
// This minimal check prevents acquisition during weekends, holidays, and off-hours.

const US_MARKET_HOLIDAYS_2026 = new Set([
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
  "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
]);

/** Early-close dates: options market closes at 13:15 ET (+ 15-min delay = 13:30 ET cutoff). */
const US_EARLY_CLOSE_2026 = new Set([
  "2026-11-27", // Day after Thanksgiving
  "2026-12-24", // Christmas Eve
]);

const EARLY_CLOSE_WITH_DELAY = 13 * 60 + 30; // 13:30 ET (13:15 close + 15-min provider delay)

/** Check if acquisition is permitted based on market session (minimal gate). */
export function isAcquisitionPermitted(now: Date = new Date()): { permitted: boolean; reason: string } {
  // Convert to ET (approximate: UTC-4 for EDT Mar 8 – Nov 1, UTC-5 otherwise)
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const etOffsetHours = (month > 3 && month < 11) || (month === 3 && day >= 8) || (month === 11 && day < 1) ? -4 : -5;
  const etMs = now.getTime() + etOffsetHours * 3600_000;
  const etDate = new Date(etMs);
  const dateStr = etDate.toISOString().split("T")[0];
  const dow = etDate.getUTCDay(); // 0=Sun, 6=Sat
  const hours = etDate.getUTCHours();
  const minutes = etDate.getUTCMinutes();
  const timeMinutes = hours * 60 + minutes;

  // Weekend
  if (dow === 0 || dow === 6) {
    return { permitted: false, reason: `Weekend (${dow === 0 ? "Sunday" : "Saturday"})` };
  }

  // Holiday
  if (US_MARKET_HOLIDAYS_2026.has(dateStr)) {
    return { permitted: false, reason: `Exchange holiday (${dateStr})` };
  }

  // Off-hours: permit only 09:30–close ET
  const marketOpen = 9 * 60 + 30;   // 09:30 ET
  const marketCloseWithDelay = US_EARLY_CLOSE_2026.has(dateStr)
    ? EARLY_CLOSE_WITH_DELAY           // 13:30 ET on early-close days
    : 16 * 60 + 15;                    // 16:15 ET standard (close + provider delay)

  if (timeMinutes < marketOpen) {
    return { permitted: false, reason: `Pre-market (${hours}:${String(minutes).padStart(2, "0")} ET)` };
  }
  if (timeMinutes > marketCloseWithDelay) {
    const closeType = US_EARLY_CLOSE_2026.has(dateStr) ? "Early close" : "Market closed";
    return { permitted: false, reason: `${closeType} (${hours}:${String(minutes).padStart(2, "0")} ET)` };
  }

  return { permitted: true, reason: "Regular session" };
}

// --- Worker State ---

export type WorkerState = "starting" | "acquiring" | "idle" | "session_blocked" | "stopped";

interface WorkerStatus {
  state: WorkerState;
  currentSymbol: string | null;
  cycleCount: number;
  symbolsAcquiredTotal: number;
  lastCycleStartedAt: string | null;
  lastCycleDurationMs: number | null;
  nextScheduledAt: string | null;
  failures: number;
}

// --- Delays ---
// NOTE: Provider rate-limiting is owned exclusively by RequestPacer (0.9 req/sec).
// Worker-level delays here serve ONLY scheduling/backoff purposes, not pacing.

const DELAY_IDLE_MS = 30_000;           // 30s when no work remaining
const DELAY_AFTER_FAILURE_MS = 5000;    // 5s backoff after a symbol failure
const DELAY_SESSION_BLOCKED_MS = 300_000; // 5 min when session-blocked (off-hours/weekend/holiday)
const BATCH_SIZE = 10;                  // Symbols per cycle

// --- Worker ---

export class AcquisitionWorker {
  private adapter: TradierAdapter;
  private store: SqliteEvidenceStore;
  private running = false;
  private cycleActive = false;
  private idleLogged = false;
  private sessionBlockLogged = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private status: WorkerStatus = {
    state: "stopped",
    currentSymbol: null,
    cycleCount: 0,
    symbolsAcquiredTotal: 0,
    lastCycleStartedAt: null,
    lastCycleDurationMs: null,
    nextScheduledAt: null,
    failures: 0,
  };

  constructor(config: ServiceConfig) {
    this.adapter = new TradierAdapter(config);
    this.store = getEvidenceStore();
  }

  /**
   * Start the background acquisition worker.
   * Initializes the universe and begins self-scheduling cycles.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.status.state = "starting";

    // Initialize universe from database (imports from CSV on first run)
    const symbols = loadUniverse(this.store.getDb());
    this.store.initUniverse(symbols);

    console.log(`[worker] Started. Universe: ${symbols.length} symbols. Beginning acquisition.`);
    this.scheduleCycle(1000); // Start first cycle in 1s
  }

  /**
   * Stop the worker gracefully.
   */
  stop(): void {
    this.running = false;
    this.status.state = "stopped";
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log("[worker] Stopped.");
  }

  /**
   * Get current worker status for diagnostics.
   */
  getStatus(): WorkerStatus {
    return { ...this.status };
  }

  /**
   * Request immediate cycle (nudge from operator "Refresh Now").
   * Does not create a second concurrent cycle.
   */
  nudge(): void {
    if (!this.running) return;
    if (this.cycleActive) return; // Already working
    // Cancel pending idle timer and start immediately
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.idleLogged = false; // Reset so next idle transition is logged
    this.scheduleCycle(0);
  }

  // --- Self-scheduling core ---

  private scheduleCycle(delayMs: number): void {
    if (!this.running) return;
    this.status.nextScheduledAt = new Date(Date.now() + delayMs).toISOString();
    this.timer = setTimeout(() => this.runCycle(), delayMs);
  }

  private async runCycle(): Promise<void> {
    if (!this.running || this.cycleActive) return;

    // Session gate: suppress acquisition outside market hours
    const session = isAcquisitionPermitted();
    if (!session.permitted) {
      if (!this.sessionBlockLogged) {
        console.log(`[worker] Acquisition suspended · ${session.reason} · routine provider traffic suppressed`);
        this.sessionBlockLogged = true;
      }
      this.status.state = "session_blocked";
      this.scheduleCycle(DELAY_SESSION_BLOCKED_MS);
      return;
    }
    // Reset session-block log flag when session resumes
    if (this.sessionBlockLogged) {
      console.log(`[worker] Acquisition resumed · ${session.reason}`);
      this.sessionBlockLogged = false;
    }

    this.cycleActive = true;
    this.status.state = "acquiring";
    this.status.cycleCount++;
    this.status.lastCycleStartedAt = new Date().toISOString();
    const cycleStart = Date.now();

    try {
      // Get work queue
      const workQueue = this.store.getWorkQueue();

      if (workQueue.length === 0) {
        // Nothing to do — transition to idle (log only on first idle entry)
        if (!this.idleLogged) {
          const coverage = this.store.getCoverage();
          console.log(`[worker] Epoch complete · ${coverage.ready + coverage.absent} resolved · ${coverage.ready} optionable · ${coverage.absent} non-optionable · gen ${this.store.generation}`);
          this.idleLogged = true;
        }
        this.status.state = "idle";
        this.status.lastCycleDurationMs = Date.now() - cycleStart;
        this.cycleActive = false;
        this.scheduleCycle(DELAY_IDLE_MS);
        return;
      }

      // New work available — reset idle log so next completion is logged
      this.idleLogged = false;

      // Process a batch
      const batch = workQueue.slice(0, BATCH_SIZE);

      for (const symbol of batch) {
        if (!this.running) break;
        this.status.currentSymbol = symbol;

        await this.acquireSymbol(symbol);

        // No inter-symbol delay — RequestPacer owns all provider pacing
      }

      this.status.currentSymbol = null;
      this.status.lastCycleDurationMs = Date.now() - cycleStart;

      // Cycle summary (info level)
      const coverage = this.store.getCoverage();
      this.store.publishSnapshot();
      console.log(`[worker] Cycle #${this.status.cycleCount} complete · ${batch.length} symbols · ${Date.now() - cycleStart}ms · coverage: ${coverage.ready}r/${coverage.absent}a/${coverage.pending}p · gen ${this.store.generation}`);
    } catch (err) {
      console.error("[worker] Cycle error:", err);
      this.status.failures++;
    }

    this.cycleActive = false;

    // Determine next delay
    const remainingWork = this.store.getWorkQueue().length;
    const nextDelay = remainingWork > 0 ? 1000 : DELAY_IDLE_MS; // 1s if more work, 30s if idle
    this.status.state = remainingWork > 0 ? "acquiring" : "idle";
    this.scheduleCycle(nextDelay);
  }

  private async acquireSymbol(symbol: string): Promise<void> {
    const ev = this.store.get(symbol);
    if (!ev) return;

    try {
      if (ev.status === "pending" || ev.status === "failed"
          || ev.status === "ready" || ev.status === "absent") {
        // Need expirations: either first-time acquisition, retry after failure,
        // or session refresh. For ready/absent/failed symbols, re-acquiring
        // expirations determines whether the symbol is still optionable and selects
        // the new primary expiration. Prior successful evidence is preserved until
        // overwritten by a new success (INV-PERSIST-01).
        const result = await this.adapter.getExpirations(symbol);
        this.store.recordMetrics(result.cacheHit ? 0 : 1, result.cacheHit ? 1 : 0);
        this.store.setExpirations(symbol, result.expirations, result.retrievedAt);
        this.status.symbolsAcquiredTotal++;

        // Chain-chase: if expirations found and primary selected, get chain immediately
        const updated = this.store.get(symbol);
        if (updated && updated.status === "expirations_known" && updated.primaryExpiration) {
          await this.acquireChain(symbol, updated.primaryExpiration);
        }
      } else if (ev.status === "expirations_known" && ev.primaryExpiration) {
        // Need chain (partial refresh: expirations already refreshed this session)
        await this.acquireChain(symbol, ev.primaryExpiration);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this.store.setFailure(symbol, msg);
      this.status.failures++;
      await sleep(DELAY_AFTER_FAILURE_MS);
    }
  }

  private async acquireChain(symbol: string, expiration: string): Promise<void> {
    const result = await this.adapter.getOptionsChain(symbol, expiration);
    this.store.recordMetrics(result.cacheHit ? 0 : 2, result.cacheHit ? 1 : 0); // chain + quote = 2 upstream if not cached
    this.store.setChain(symbol, result.chain, result.retrievedAt);
    this.status.symbolsAcquiredTotal++;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Singleton ---

let workerInstance: AcquisitionWorker | null = null;

export function getAcquisitionWorker(config: ServiceConfig): AcquisitionWorker {
  if (!workerInstance) {
    workerInstance = new AcquisitionWorker(config);
  }
  return workerInstance;
}
