/**
 * Durable Crawl State — IndexedDB-backed generation and cursor tracking.
 *
 * Tracks progress through the Yahoo 496 universe across page reloads,
 * route changes, source switches, and application restarts.
 *
 * A "generation" is one attempt to obtain complete coverage.
 * The cursor advances within a generation.
 * Repeated scans continue the current generation.
 * A new generation starts only when the operator explicitly resets
 * or when the universe version changes.
 */

// --- Types ---

export type SymbolResultClass =
  | "ACTIONABLE"
  | "EDGE"
  | "WAIT"
  | "HARD_NO"
  | "DATA_ERROR"
  | "DEFERRED"
  | "NOT_EVALUATED";

export interface PerSymbolState {
  symbol: string;
  resultClass: SymbolResultClass;
  lastAttemptedAt: number | null;  // epoch ms
  lastSuccessAt: number | null;
  evaluationScore: number | null;
  /** When this symbol is next eligible for refresh */
  nextRevisitAt: number | null;
}

export interface CrawlGeneration {
  id: string;
  universeId: string;
  universeVersion: string;
  totalSymbols: number;
  startedAt: number;
  completedAt: number | null;
  cursor: number;
  symbolOrder: string[];
  perSymbol: Record<string, PerSymbolState>;
}

export interface CrawlStats {
  evaluated: number;
  actionable: number;
  edge: number;
  wait: number;
  hardNo: number;
  dataError: number;
  deferred: number;
  notEvaluated: number;
}

// --- IndexedDB Storage ---

import { openDB, CRAWL_STORE } from "./db";

const CRAWL_KEY = "current-generation";

// --- Crawl State Service ---

export class CrawlStateService {
  private generation: CrawlGeneration | null = null;

  /** Load current generation from IndexedDB. */
  async load(): Promise<CrawlGeneration | null> {
    if (this.generation) return this.generation;
    try {
      const db = await openDB();
      const tx = db.transaction(CRAWL_STORE, "readonly");
      const store = tx.objectStore(CRAWL_STORE);
      const result = await new Promise<CrawlGeneration | null>((resolve, reject) => {
        const req = store.get(CRAWL_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
      this.generation = result;
      return result;
    } catch {
      return null;
    }
  }

  /** Save current generation to IndexedDB. */
  async save(): Promise<void> {
    if (!this.generation) return;
    try {
      const db = await openDB();
      const tx = db.transaction(CRAWL_STORE, "readwrite");
      const store = tx.objectStore(CRAWL_STORE);
      store.put({ ...this.generation, id: CRAWL_KEY });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fail silently — in-memory state remains
    }
  }

  /** Start or continue a generation for the given universe. */
  async ensureGeneration(universeId: string, universeVersion: string, symbols: string[]): Promise<CrawlGeneration> {
    const existing = await this.load();

    // Continue existing generation if universe matches
    if (existing && existing.universeId === universeId && existing.universeVersion === universeVersion) {
      return existing;
    }

    // Start new generation
    const gen: CrawlGeneration = {
      id: CRAWL_KEY,
      universeId,
      universeVersion,
      totalSymbols: symbols.length,
      startedAt: Date.now(),
      completedAt: null,
      cursor: 0,
      symbolOrder: symbols,
      perSymbol: {},
    };

    // Initialize all symbols as NOT_EVALUATED
    for (const symbol of symbols) {
      gen.perSymbol[symbol] = {
        symbol,
        resultClass: "NOT_EVALUATED",
        lastAttemptedAt: null,
        lastSuccessAt: null,
        evaluationScore: null,
        nextRevisitAt: null,
      };
    }

    this.generation = gen;
    await this.save();
    return gen;
  }

  /** Mark a symbol as evaluated with a result. */
  async markEvaluated(symbol: string, resultClass: SymbolResultClass, score: number | null): Promise<void> {
    if (!this.generation) return;
    const now = Date.now();
    this.generation.perSymbol[symbol] = {
      symbol,
      resultClass,
      lastAttemptedAt: now,
      lastSuccessAt: resultClass !== "DATA_ERROR" ? now : (this.generation.perSymbol[symbol]?.lastSuccessAt ?? null),
      evaluationScore: score,
      nextRevisitAt: this.computeRevisitTime(resultClass, now),
    };
    // Don't save on every symbol — caller should batch-save
  }

  /** Advance cursor past a batch of symbols. */
  advanceCursor(newPosition: number): void {
    if (!this.generation) return;
    this.generation.cursor = Math.min(newPosition, this.generation.totalSymbols);

    // Check completion
    const stats = this.getStats();
    if (stats.notEvaluated === 0 && stats.deferred === 0 && !this.generation.completedAt) {
      this.generation.completedAt = Date.now();
    }
  }

  /** Get the next batch of symbols to evaluate (from cursor position). */
  getNextBatch(budget: number, prioritySymbols: string[] = []): string[] {
    if (!this.generation) return [];

    const result: string[] = [];
    const added = new Set<string>();

    // 1. Priority symbols that need refresh
    for (const sym of prioritySymbols) {
      if (result.length >= budget) break;
      const state = this.generation.perSymbol[sym];
      if (!state) continue;
      if (state.resultClass === "NOT_EVALUATED" || this.isDueForRefresh(state)) {
        if (!added.has(sym)) {
          result.push(sym);
          added.add(sym);
        }
      }
    }

    // 2. Fill from cursor (unseen symbols first)
    const order = this.generation.symbolOrder;
    let pos = this.generation.cursor;
    while (result.length < budget && pos < order.length) {
      const sym = order[pos];
      if (!added.has(sym)) {
        const state = this.generation.perSymbol[sym];
        if (state?.resultClass === "NOT_EVALUATED") {
          result.push(sym);
          added.add(sym);
        }
      }
      pos++;
    }

    // 3. Wrap around if we hit the end but still have budget
    if (result.length < budget) {
      for (let i = 0; i < this.generation.cursor && result.length < budget; i++) {
        const sym = order[i];
        if (!added.has(sym)) {
          const state = this.generation.perSymbol[sym];
          if (state?.resultClass === "NOT_EVALUATED") {
            result.push(sym);
            added.add(sym);
          }
        }
      }
    }

    return result;
  }

  /** Get coverage statistics. */
  getStats(): CrawlStats {
    if (!this.generation) {
      return { evaluated: 0, actionable: 0, edge: 0, wait: 0, hardNo: 0, dataError: 0, deferred: 0, notEvaluated: 0 };
    }
    const stats: CrawlStats = { evaluated: 0, actionable: 0, edge: 0, wait: 0, hardNo: 0, dataError: 0, deferred: 0, notEvaluated: 0 };
    for (const state of Object.values(this.generation.perSymbol)) {
      switch (state.resultClass) {
        case "ACTIONABLE": stats.actionable++; stats.evaluated++; break;
        case "EDGE": stats.edge++; stats.evaluated++; break;
        case "WAIT": stats.wait++; stats.evaluated++; break;
        case "HARD_NO": stats.hardNo++; stats.evaluated++; break;
        case "DATA_ERROR": stats.dataError++; stats.evaluated++; break;
        case "DEFERRED": stats.deferred++; break;
        case "NOT_EVALUATED": stats.notEvaluated++; break;
      }
    }
    return stats;
  }

  /** Whether the generation is complete. */
  isComplete(): boolean {
    if (!this.generation) return false;
    return this.generation.completedAt !== null;
  }

  /** Get the current generation (in-memory). */
  current(): CrawlGeneration | null {
    return this.generation;
  }

  private isDueForRefresh(state: PerSymbolState): boolean {
    if (!state.nextRevisitAt) return state.resultClass === "NOT_EVALUATED";
    return Date.now() >= state.nextRevisitAt;
  }

  private computeRevisitTime(resultClass: SymbolResultClass, now: number): number {
    switch (resultClass) {
      case "ACTIONABLE": return now + 5 * 60 * 1000;  // 5 min — high priority
      case "EDGE": return now + 10 * 60 * 1000;       // 10 min
      case "WAIT": return now + 30 * 60 * 1000;       // 30 min
      case "HARD_NO": return now + 60 * 60 * 1000;    // 1 hour
      case "DATA_ERROR": return now + 60 * 1000;      // 1 min retry
      default: return now;
    }
  }
}

// --- Singleton ---

let crawlInstance: CrawlStateService | null = null;

export function getCrawlState(): CrawlStateService {
  if (!crawlInstance) {
    crawlInstance = new CrawlStateService();
  }
  return crawlInstance;
}
