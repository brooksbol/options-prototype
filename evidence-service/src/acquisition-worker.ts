/**
 * Acquisition Worker — Tiered, self-scheduling background evidence acquisition.
 *
 * INVARIANT: Only one acquisition cycle is ever in flight.
 *
 * Scheduling model: Appropriate freshness with bounded neglect.
 *
 *   Class A: Plausibly visible ready symbols (qualifying puts in DTE/delta range)
 *            Target: chain evidence ≤ 15 minutes old
 *   Class B: Background ready symbols (no qualifying puts, or classification stale)
 *            Maximum: chain evidence ≤ 120 minutes old
 *   Class C: Lifecycle work (pending, partial, failed with retries remaining)
 *   Class D: Absent symbols from prior epoch (once per epoch)
 *
 * Anti-starvation: minimum service floors based on dispatched-job counts (provider-work-aware).
 * Publication: coalesced on meaningful change, not as a heartbeat.
 *
 * Rate-limit authority: Provider rate compliance is owned EXCLUSIVELY by RequestPacer.
 */

import type { ServiceConfig } from "./config.js";
import { TradierAdapter } from "./providers/tradier.js";
import { getEvidenceStore } from "./evidence-store.js";
import type { SqliteEvidenceStore } from "./db/sqlite-evidence-store.js";
import type { PrioritizedWorkItem } from "./db/sqlite-evidence-store.js";
import { loadUniverse } from "./universe.js";

// --- Session Gate ---

const US_MARKET_HOLIDAYS_2026 = new Set([
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
  "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
]);

const US_EARLY_CLOSE_2026 = new Set([
  "2026-11-27",
  "2026-12-24",
]);

const EARLY_CLOSE_WITH_DELAY = 13 * 60 + 30;

export function isAcquisitionPermitted(now: Date = new Date()): { permitted: boolean; reason: string } {
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const etOffsetHours = (month > 3 && month < 11) || (month === 3 && day >= 8) || (month === 11 && day < 1) ? -4 : -5;
  const etMs = now.getTime() + etOffsetHours * 3600_000;
  const etDate = new Date(etMs);
  const dateStr = etDate.toISOString().split("T")[0];
  const dow = etDate.getUTCDay();
  const hours = etDate.getUTCHours();
  const minutes = etDate.getUTCMinutes();
  const timeMinutes = hours * 60 + minutes;

  if (dow === 0 || dow === 6) {
    return { permitted: false, reason: `Weekend (${dow === 0 ? "Sunday" : "Saturday"})` };
  }
  if (US_MARKET_HOLIDAYS_2026.has(dateStr)) {
    return { permitted: false, reason: `Exchange holiday (${dateStr})` };
  }

  const marketOpen = 9 * 60 + 30;
  const marketCloseWithDelay = US_EARLY_CLOSE_2026.has(dateStr)
    ? EARLY_CLOSE_WITH_DELAY
    : 16 * 60 + 15;

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

// --- Scheduler Configuration ---

export interface SchedulerConfig {
  chainFreshnessTargetMs: number;
  chainMaxAgeMs: number;
  expirationFreshnessMs: number;
  classBMinServiceInterval: number;
  classCDMinServiceInterval: number;
  publicationCoalesceMs: number;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  chainFreshnessTargetMs: 15 * 60 * 1000,
  chainMaxAgeMs: 120 * 60 * 1000,
  expirationFreshnessMs: 6 * 60 * 60 * 1000,
  classBMinServiceInterval: 10,
  classCDMinServiceInterval: 20,
  publicationCoalesceMs: 5000,
};

// --- Delays ---

const DELAY_AFTER_FAILURE_MS = 5000;
const DELAY_SESSION_BLOCKED_MS = 300_000;
const DELAY_IDLE_MS = 30_000;
const BATCH_SIZE = 10;

// --- Scheduler Telemetry (observational, captured during real cycles) ---

export interface SchedulerTelemetry {
  /** When the queue was last assessed */
  lastAssessedAt: string | null;
  /** Current session state from the gate */
  sessionState: string;

  /** Total symbols classified into each service class (excludes current-epoch terminal: confirmed absent and retry-exhausted failed) */
  eligible: { classA: number; classB: number; classC: number; classD: number };
  /** Symbols currently in the work queue (past freshness target, actionable now) */
  due: { classA: number; classB: number; classC: number; classD: number };
  /** Oldest evidence age in seconds for each class (null if no symbols in class) */
  oldestAgeSeconds: { classA: number | null; classB: number | null; classC: number | null; classD: number | null };

  /** Last dispatched symbol info */
  lastDispatch: { symbol: string; serviceClass: string; workType: string; dispatchedAt: string } | null;
  /** Cumulative dispatches by class */
  dispatchesByClass: { classA: number; classB: number; classC: number; classD: number };

  /** Service-debt state */
  serviceDebt: { bJobsSinceService: number; cdJobsSinceService: number };
  /** Cumulative floor-triggered dispatches */
  floorDispatches: { classB: number; classCD: number };

  /** Publication counters */
  publications: { total: number; skippedNoChange: number; skippedCoalescing: number; lastChangedSymbols: number };

  /** Cycle state */
  cycleCount: number;
  idleReason: string | null;
}

// --- Worker ---

export class AcquisitionWorker {
  private adapter: TradierAdapter;
  private store: SqliteEvidenceStore;
  private _clock: () => Date;
  private running = false;
  private cycleActive = false;
  private idleLogged = false;
  private sessionBlockLogged = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private schedulerConfig: SchedulerConfig;
  private dispatchedJobs = 0;
  private lastBServiceJob = 0;
  private lastCDServiceJob = 0;
  private lastPublishAt = 0;
  private evidenceChangedSincePublish = false;
  private changedSymbolsThisPublish = 0;

  // Publication counters
  private pubTotal = 0;
  private pubSkippedNoChange = 0;
  private pubSkippedCoalescing = 0;
  private pubLastChangedSymbols = 0;

  // Dispatch counters by class
  private dispatchCountA = 0;
  private dispatchCountB = 0;
  private dispatchCountC = 0;
  private dispatchCountD = 0;
  private floorDispatchB = 0;
  private floorDispatchCD = 0;

  // Scheduler telemetry snapshot (captured during real cycles, read by status endpoint)
  private telemetry: SchedulerTelemetry = {
    lastAssessedAt: null,
    sessionState: "unknown",
    eligible: { classA: 0, classB: 0, classC: 0, classD: 0 },
    due: { classA: 0, classB: 0, classC: 0, classD: 0 },
    oldestAgeSeconds: { classA: null, classB: null, classC: null, classD: null },
    lastDispatch: null,
    dispatchesByClass: { classA: 0, classB: 0, classC: 0, classD: 0 },
    serviceDebt: { bJobsSinceService: 0, cdJobsSinceService: 0 },
    floorDispatches: { classB: 0, classCD: 0 },
    publications: { total: 0, skippedNoChange: 0, skippedCoalescing: 0, lastChangedSymbols: 0 },
    cycleCount: 0,
    idleReason: null,
  };

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

  constructor(config: ServiceConfig, schedulerConfig: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG, clock: () => Date = () => new Date()) {
    this.adapter = new TradierAdapter(config);
    this.store = getEvidenceStore();
    this.schedulerConfig = schedulerConfig;
    this._clock = clock;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.status.state = "starting";

    const symbols = loadUniverse(this.store.getDb());
    this.store.initUniverse(symbols);

    console.log(`[worker] Started. Universe: ${symbols.length} symbols. Beginning acquisition.`);
    this.scheduleCycle(1000);
  }

  stop(): void {
    this.running = false;
    this.status.state = "stopped";
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log("[worker] Stopped.");
  }

  getStatus(): WorkerStatus {
    return { ...this.status };
  }

  /**
   * Get the scheduler telemetry snapshot.
   * This is an immutable copy of state captured during real scheduling cycles.
   * It does NOT recompute scheduling decisions on demand.
   */
  getSchedulerTelemetry(): SchedulerTelemetry {
    return { ...this.telemetry };
  }

  nudge(): void {
    if (!this.running) return;
    if (this.cycleActive) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.idleLogged = false;
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

    // Session gate
    const session = isAcquisitionPermitted(this._clock());
    if (!session.permitted) {
      if (!this.sessionBlockLogged) {
        console.log(`[worker] Acquisition suspended · ${session.reason}`);
        this.sessionBlockLogged = true;
      }
      this.status.state = "session_blocked";
      this.scheduleCycle(DELAY_SESSION_BLOCKED_MS);
      return;
    }
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
      // Build prioritized work queue
      const workQueue = this.store.getPrioritizedWorkQueue(this.schedulerConfig);

      // --- Capture telemetry from the real scheduling assessment ---
      this.telemetry.lastAssessedAt = new Date().toISOString();
      this.telemetry.sessionState = session.reason;
      this.telemetry.cycleCount = this.status.cycleCount;

      // Eligible: total classified population (all symbols, regardless of freshness)
      this.telemetry.eligible = this.store.getClassifiedPopulation();

      // Due: symbols in the work queue that are past their freshness targets
      const classA = workQueue.filter(i => i.urgencyClass === "A");
      const classB = workQueue.filter(i => i.urgencyClass === "B");
      const classC = workQueue.filter(i => i.urgencyClass === "C");
      const classD = workQueue.filter(i => i.urgencyClass === "D");

      this.telemetry.due = {
        classA: classA.length,
        classB: classB.length,
        classC: classC.length,
        classD: classD.length,
      };

      // Oldest age per class (in seconds)
      this.telemetry.oldestAgeSeconds = {
        classA: classA.length > 0 ? Math.round(classA[0].chainAgeMs / 1000) : null,
        classB: classB.length > 0 ? Math.round(classB[0].chainAgeMs / 1000) : null,
        classC: classC.length > 0 ? null : null, // lifecycle doesn't have meaningful chain age
        classD: null,
      };

      this.telemetry.serviceDebt = {
        bJobsSinceService: this.dispatchedJobs - this.lastBServiceJob,
        cdJobsSinceService: this.dispatchedJobs - this.lastCDServiceJob,
      };
      this.telemetry.dispatchesByClass = {
        classA: this.dispatchCountA,
        classB: this.dispatchCountB,
        classC: this.dispatchCountC,
        classD: this.dispatchCountD,
      };
      this.telemetry.floorDispatches = { classB: this.floorDispatchB, classCD: this.floorDispatchCD };
      this.telemetry.publications = {
        total: this.pubTotal,
        skippedNoChange: this.pubSkippedNoChange,
        skippedCoalescing: this.pubSkippedCoalescing,
        lastChangedSymbols: this.pubLastChangedSymbols,
      };
      this.telemetry.idleReason = null;
      // --- End telemetry capture ---

      if (workQueue.length === 0) {
        if (!this.idleLogged) {
          console.log(`[worker] All evidence within targets · gen ${this.store.generation}`);
          this.idleLogged = true;
        }
        this.telemetry.idleReason = "all_within_targets";
        this.status.state = "idle";
        this.status.lastCycleDurationMs = Date.now() - cycleStart;
        this.cycleActive = false;
        this.publishIfDue(true);
        this.scheduleCycle(DELAY_IDLE_MS);
        return;
      }

      this.idleLogged = false;

      // Select batch with anti-starvation floors
      const batch = this.selectBatchWithFloors(workQueue);

      for (const item of batch) {
        if (!this.running) break;
        this.status.currentSymbol = item.symbol;
        await this.acquireSymbolTiered(item);
        this.dispatchedJobs++;

        // Dispatch classification telemetry
        switch (item.urgencyClass) {
          case "A": this.dispatchCountA++; break;
          case "B": this.dispatchCountB++; break;
          case "C": this.dispatchCountC++; break;
          case "D": this.dispatchCountD++; break;
        }
        const workType = item.needsExpirations ? "full" : "chain-only";
        this.telemetry.lastDispatch = {
          symbol: item.symbol,
          serviceClass: item.urgencyClass,
          workType,
          dispatchedAt: new Date().toISOString(),
        };
      }

      this.status.currentSymbol = null;
      this.status.lastCycleDurationMs = Date.now() - cycleStart;
      this.publishIfDue(false);

    } catch (err) {
      console.error("[worker] Cycle error:", err);
      this.status.failures++;
    }

    this.cycleActive = false;

    // Continuous refresh: always check for more work
    const hasMoreWork = this.store.getPrioritizedWorkQueue(this.schedulerConfig).length > 0;
    const nextDelay = hasMoreWork ? 1000 : DELAY_IDLE_MS;
    this.status.state = hasMoreWork ? "acquiring" : "idle";
    this.scheduleCycle(nextDelay);
  }

  // --- Batch selection with anti-starvation floors ---

  /**
   * Select work items with service-debt-based anti-starvation guarantees.
   *
   * Floor semantics: once a class's service interval has elapsed (measured by
   * dispatched symbol jobs), it becomes OWED until satisfied. Simultaneous
   * obligations are both eventually satisfied. Selecting one class does not
   * erase the debt of another.
   *
   * Uses lastBServiceJob / lastCDServiceJob tracking rather than transient
   * modulo checks to ensure obligations persist across batch boundaries.
   */
  private selectBatchWithFloors(queue: PrioritizedWorkItem[]): PrioritizedWorkItem[] {
    if (queue.length === 0) return [];

    const batch: PrioritizedWorkItem[] = [];
    const batchSymbols = new Set<string>();
    const classB = queue.filter(i => i.urgencyClass === "B");
    const classCD = queue.filter(i => i.urgencyClass === "C" || i.urgencyClass === "D");

    // Service debt: B is owed when dispatchedJobs - lastBServiceJob >= interval
    const bDebt = classB.length > 0 &&
      (this.dispatchedJobs - this.lastBServiceJob) >= this.schedulerConfig.classBMinServiceInterval;
    const cdDebt = classCD.length > 0 &&
      (this.dispatchedJobs - this.lastCDServiceJob) >= this.schedulerConfig.classCDMinServiceInterval;

    // Satisfy debts first (both can be owed simultaneously)
    if (bDebt && classB.length > 0) {
      batch.push(classB[0]);
      batchSymbols.add(classB[0].symbol);
      this.lastBServiceJob = this.dispatchedJobs;
      this.floorDispatchB++;
    }
    if (cdDebt && classCD.length > 0) {
      const cdItem = classCD.find(i => !batchSymbols.has(i.symbol)) ?? classCD[0];
      if (!batchSymbols.has(cdItem.symbol)) {
        batch.push(cdItem);
        batchSymbols.add(cdItem.symbol);
        this.lastCDServiceJob = this.dispatchedJobs;
        this.floorDispatchCD++;
      }
    }

    // Fill remaining batch from priority-sorted queue
    for (const item of queue) {
      if (batch.length >= BATCH_SIZE) break;
      if (batchSymbols.has(item.symbol)) continue;
      batch.push(item);
      batchSymbols.add(item.symbol);
    }

    return batch;
  }

  // --- Tiered symbol acquisition ---

  private async acquireSymbolTiered(item: PrioritizedWorkItem): Promise<void> {
    const ev = this.store.get(item.symbol);
    if (!ev) return;

    try {
      if (ev.status === "pending" || ev.status === "failed") {
        // Lifecycle: full acquisition
        const result = await this.adapter.getExpirations(item.symbol);
        this.store.recordMetrics(result.cacheHit ? 0 : 1, result.cacheHit ? 1 : 0);
        this.store.setExpirations(item.symbol, result.expirations, result.retrievedAt);
        this.status.symbolsAcquiredTotal++;
        this.evidenceChangedSincePublish = true; this.changedSymbolsThisPublish++;

        const updated = this.store.get(item.symbol);
        if (updated && updated.status === "expirations_known" && updated.primaryExpiration) {
          await this.acquireChain(item.symbol, updated.primaryExpiration);
        }
      } else if (ev.status === "expirations_known" && ev.primaryExpiration) {
        // Partial: chain only
        await this.acquireChain(item.symbol, ev.primaryExpiration);
      } else if (ev.status === "ready" || ev.status === "absent") {
        // Refresh: skip expirations if fresh
        if (item.needsExpirations) {
          const result = await this.adapter.getExpirations(item.symbol);
          this.store.recordMetrics(result.cacheHit ? 0 : 1, result.cacheHit ? 1 : 0);
          this.store.setExpirations(item.symbol, result.expirations, result.retrievedAt);
          this.status.symbolsAcquiredTotal++;
          this.evidenceChangedSincePublish = true; this.changedSymbolsThisPublish++;

          const updated = this.store.get(item.symbol);
          if (updated && updated.status === "expirations_known" && updated.primaryExpiration) {
            await this.acquireChain(item.symbol, updated.primaryExpiration);
          }
        } else if (ev.primaryExpiration) {
          // Expirations fresh — chain-only refresh (saves 1 provider call)
          await this.acquireChain(item.symbol, ev.primaryExpiration);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this.store.setFailure(item.symbol, msg);
      this.status.failures++;
      this.evidenceChangedSincePublish = true; this.changedSymbolsThisPublish++;
      await sleep(DELAY_AFTER_FAILURE_MS);
    }
  }

  private async acquireChain(symbol: string, expiration: string): Promise<void> {
    const result = await this.adapter.getOptionsChain(symbol, expiration);
    this.store.recordMetrics(result.cacheHit ? 0 : 2, result.cacheHit ? 1 : 0);
    this.store.setChain(symbol, result.chain, result.retrievedAt);
    this.status.symbolsAcquiredTotal++;
    this.evidenceChangedSincePublish = true; this.changedSymbolsThisPublish++;
  }

  // --- Publication coalescing ---

  private publishIfDue(forceBeforeIdle: boolean): void {
    if (!this.evidenceChangedSincePublish) {
      this.pubSkippedNoChange++;
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastPublishAt;

    if (forceBeforeIdle || elapsed >= this.schedulerConfig.publicationCoalesceMs) {
      this.store.publishSnapshot();
      this.lastPublishAt = now;
      this.pubTotal++;
      this.pubLastChangedSymbols = this.changedSymbolsThisPublish;
      this.changedSymbolsThisPublish = 0;
      this.evidenceChangedSincePublish = false;
      console.log(`[worker] Published · gen ${this.store.generation} · changed ${this.pubLastChangedSymbols}`);
    } else {
      this.pubSkippedCoalescing++;
    }
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

/** Test-only: inject a pre-configured worker instance. */
export function _setWorkerForTest(worker: AcquisitionWorker | null): void {
  workerInstance = worker;
}
