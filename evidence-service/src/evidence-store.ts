/**
 * Evidence Store — Process-lifetime evidence authority (transitional).
 *
 * NOT a durable system of record. Resets on service restart.
 * Stores evidence by symbol, tracks generations, supports incremental updates.
 *
 * Future: replaced by SQLite persistence (Phase 2).
 */

import type { MarketExpiration, MarketChain } from "./providers/tradier.js";

// --- Evidence Record ---

export type SymbolStatus = "pending" | "expirations_known" | "ready" | "absent" | "failed";

export interface SymbolEvidence {
  symbol: string;
  status: SymbolStatus;
  expirations: MarketExpiration[] | null;
  primaryExpiration: string | null;
  chain: MarketChain | null;
  retrievedAt: string | null;
  failureReason: string | null;
  failureCount: number;
  lastAttemptAt: string | null;
}

// --- Snapshot Shape ---

export interface EvidenceSnapshot {
  generation: number;
  generatedAt: string;
  universe: number;
  coverage: {
    ready: number;
    absent: number;
    expirationsKnown: number;
    pending: number;
    failed: number;
  };
  symbols: SymbolEvidence[];
  telemetry: {
    payloadBytes?: number;
    symbolsChangedThisGeneration: number;
    acquisitionCycleDuration?: number;
    upstreamCalls: number;
    cacheHits: number;
  };
}

// --- Store ---

export class EvidenceStore {
  private evidence = new Map<string, SymbolEvidence>();
  private _generation = 0;
  private _generatedAt = new Date().toISOString();
  private _symbolsChangedThisGeneration = 0;
  private _upstreamCalls = 0;
  private _cacheHits = 0;

  get generation(): number { return this._generation; }
  get generatedAt(): string { return this._generatedAt; }

  /**
   * Initialize with universe symbols (all pending).
   */
  initUniverse(symbols: string[]): void {
    for (const symbol of symbols) {
      if (!this.evidence.has(symbol)) {
        this.evidence.set(symbol, {
          symbol,
          status: "pending",
          expirations: null,
          primaryExpiration: null,
          chain: null,
          retrievedAt: null,
          failureReason: null,
          failureCount: 0,
          lastAttemptAt: null,
        });
      }
    }
  }

  /**
   * Record expirations for a symbol.
   */
  setExpirations(symbol: string, expirations: MarketExpiration[], retrievedAt: string): void {
    const existing = this.evidence.get(symbol);
    if (!existing) return;

    if (expirations.length === 0) {
      existing.status = "absent";
      existing.expirations = [];
      existing.retrievedAt = retrievedAt;
      existing.lastAttemptAt = retrievedAt;
    } else {
      existing.status = "expirations_known";
      existing.expirations = expirations;
      existing.retrievedAt = retrievedAt;
      existing.lastAttemptAt = retrievedAt;
      // Select primary expiration (nearest to 21 DTE within 7-45 range)
      existing.primaryExpiration = selectPrimaryExpiration(expirations);
    }

    this.advanceGeneration();
  }

  /**
   * Record chain evidence for a symbol.
   */
  setChain(symbol: string, chain: MarketChain, retrievedAt: string): void {
    const existing = this.evidence.get(symbol);
    if (!existing) return;

    existing.status = "ready";
    existing.chain = chain;
    existing.retrievedAt = retrievedAt;
    existing.lastAttemptAt = retrievedAt;
    existing.failureCount = 0;
    existing.failureReason = null;

    this.advanceGeneration();
  }

  /**
   * Record a failure for a symbol.
   */
  setFailure(symbol: string, reason: string): void {
    const existing = this.evidence.get(symbol);
    if (!existing) return;

    existing.failureCount++;
    existing.failureReason = reason;
    existing.lastAttemptAt = new Date().toISOString();
    if (existing.failureCount >= 3) {
      existing.status = "failed";
    }

    this.advanceGeneration();
  }

  /**
   * Record upstream call / cache hit metrics.
   */
  recordMetrics(upstream: number, cacheHit: number): void {
    this._upstreamCalls += upstream;
    this._cacheHits += cacheHit;
  }

  /**
   * Get symbols that need work (missing expirations or chains).
   */
  getWorkQueue(): string[] {
    const work: string[] = [];
    for (const [symbol, ev] of this.evidence) {
      if (ev.status === "pending") {
        work.push(symbol);
      } else if (ev.status === "expirations_known" && ev.primaryExpiration) {
        work.push(symbol);
      } else if (ev.status === "failed" && ev.failureCount < 3) {
        work.push(symbol);
      }
    }
    return work;
  }

  /**
   * Get current coverage counts.
   */
  getCoverage(): EvidenceSnapshot["coverage"] {
    let ready = 0, absent = 0, expirationsKnown = 0, pending = 0, failed = 0;
    for (const ev of this.evidence.values()) {
      switch (ev.status) {
        case "ready": ready++; break;
        case "absent": absent++; break;
        case "expirations_known": expirationsKnown++; break;
        case "pending": pending++; break;
        case "failed": failed++; break;
      }
    }
    return { ready, absent, expirationsKnown, pending, failed };
  }

  /**
   * Get a symbol's current evidence.
   */
  get(symbol: string): SymbolEvidence | undefined {
    return this.evidence.get(symbol);
  }

  /**
   * Build the full snapshot for the API.
   */
  buildSnapshot(): EvidenceSnapshot {
    const symbols = Array.from(this.evidence.values());
    const snapshot: EvidenceSnapshot = {
      generation: this._generation,
      generatedAt: this._generatedAt,
      universe: this.evidence.size,
      coverage: this.getCoverage(),
      symbols,
      telemetry: {
        symbolsChangedThisGeneration: this._symbolsChangedThisGeneration,
        upstreamCalls: this._upstreamCalls,
        cacheHits: this._cacheHits,
      },
    };
    return snapshot;
  }

  /**
   * Build a lightweight snapshot (chains as ready symbols only, for transfer efficiency).
   */
  buildReadySnapshot(): EvidenceSnapshot {
    const readySymbols = Array.from(this.evidence.values()).filter(
      (ev) => ev.status === "ready" || ev.status === "absent"
    );
    return {
      generation: this._generation,
      generatedAt: this._generatedAt,
      universe: this.evidence.size,
      coverage: this.getCoverage(),
      symbols: readySymbols,
      telemetry: {
        symbolsChangedThisGeneration: this._symbolsChangedThisGeneration,
        upstreamCalls: this._upstreamCalls,
        cacheHits: this._cacheHits,
      },
    };
  }

  /**
   * Get the ETag for the current generation.
   */
  getETag(): string {
    return `"gen-${this._generation}"`;
  }

  private advanceGeneration(): void {
    this._generation++;
    this._generatedAt = new Date().toISOString();
    this._symbolsChangedThisGeneration++;
  }

  /**
   * Reset the symbols-changed counter (called after snapshot is served).
   */
  resetGenerationCounter(): void {
    this._symbolsChangedThisGeneration = 0;
  }
}

// --- Primary expiration selection (nearest to 21 DTE within 7-45) ---

function selectPrimaryExpiration(expirations: MarketExpiration[]): string | null {
  const TARGET_DTE = 21;
  const MIN_DTE = 7;
  const MAX_DTE = 45;

  const eligible = expirations.filter((e) => e.dte >= MIN_DTE && e.dte <= MAX_DTE);
  if (eligible.length === 0) {
    // Fallback: nearest to target regardless of range
    if (expirations.length === 0) return null;
    const sorted = [...expirations].sort((a, b) => Math.abs(a.dte - TARGET_DTE) - Math.abs(b.dte - TARGET_DTE));
    return sorted[0].date;
  }

  const sorted = eligible.sort((a, b) => Math.abs(a.dte - TARGET_DTE) - Math.abs(b.dte - TARGET_DTE));
  return sorted[0].date;
}

// --- Singleton ---

let instance: EvidenceStore | null = null;

export function getEvidenceStore(): EvidenceStore {
  if (!instance) instance = new EvidenceStore();
  return instance;
}
