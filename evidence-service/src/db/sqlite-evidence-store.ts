/**
 * SqliteEvidenceStore — Durable evidence persistence backed by SQLite.
 *
 * Implements the same public interface as the in-memory EvidenceStore.
 * SQLite is the authoritative store. The in-memory EvidenceStore is retained
 * only as a test oracle for behavioral equivalence verification.
 *
 * Key behaviors:
 *   - Failed refresh preserves last successful payload (data/retrieved_at unchanged)
 *   - Absence is a resolution outcome (empty expirations), not a separate evidence type
 *   - Generation increments on publishSnapshot(), not on individual writes
 *   - No 'current'/'stale' stored — derived from facts at query time
 */

import type Database from "better-sqlite3";
import { openDatabase } from "./connection.js";
import type { MarketExpiration, MarketChain } from "../providers/tradier.js";
import type { SymbolEvidence, SymbolStatus, EvidenceSnapshot } from "../evidence-store.js";

// --- Primary expiration selection (shared logic) ---

function selectPrimaryExpiration(expirations: MarketExpiration[]): string | null {
  const TARGET_DTE = 21;
  const MIN_DTE = 7;
  const MAX_DTE = 45;

  const eligible = expirations.filter((e) => e.dte >= MIN_DTE && e.dte <= MAX_DTE);
  if (eligible.length === 0) {
    if (expirations.length === 0) return null;
    const sorted = [...expirations].sort((a, b) => Math.abs(a.dte - TARGET_DTE) - Math.abs(b.dte - TARGET_DTE));
    return sorted[0].date;
  }
  const sorted = eligible.sort((a, b) => Math.abs(a.dte - TARGET_DTE) - Math.abs(b.dte - TARGET_DTE));
  return sorted[0].date;
}

// --- SqliteEvidenceStore ---

export class SqliteEvidenceStore {
  private db: Database.Database;
  private _upstreamCalls = 0;
  private _cacheHits = 0;
  private _symbolsChangedSincePublish = 0;

  constructor(dbPath?: string) {
    this.db = openDatabase(dbPath);
  }

  get generation(): number {
    const row = this.db.prepare("SELECT generation FROM snapshot_state WHERE id = 1").get() as any;
    return row?.generation ?? 0;
  }

  get generatedAt(): string {
    const row = this.db.prepare("SELECT published_at FROM snapshot_state WHERE id = 1").get() as any;
    return row?.published_at ?? new Date().toISOString();
  }

  /**
   * Initialize universe symbols. Idempotent — only adds symbols not already present.
   */
  initUniverse(symbols: string[]): void {
    const now = new Date().toISOString();
    const insertSymbol = this.db.prepare(
      "INSERT OR IGNORE INTO symbols (symbol, added_at) VALUES (?, ?)"
    );
    const insertResolution = this.db.prepare(
      "INSERT OR IGNORE INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')"
    );

    const batch = this.db.transaction(() => {
      for (const symbol of symbols) {
        insertSymbol.run(symbol, now);
        insertResolution.run(symbol);
      }
    });
    batch();
  }

  /**
   * Record expirations for a symbol.
   */
  setExpirations(symbol: string, expirations: MarketExpiration[], retrievedAt: string): void {
    const resolution = this.getResolution(symbol);
    if (!resolution) return;

    const data = JSON.stringify(expirations);

    // Write evidence (upsert: preserve structure, update on success)
    this.db.prepare(`
      INSERT INTO evidence (symbol, evidence_type, expiration, data, retrieved_at, session_date, last_attempt_at, attempt_result, failure_count)
      VALUES (?, 'expirations', '', ?, ?, ?, ?, 'success', 0)
      ON CONFLICT(symbol, evidence_type, expiration) DO UPDATE SET
        data = excluded.data,
        retrieved_at = excluded.retrieved_at,
        session_date = excluded.session_date,
        last_attempt_at = excluded.last_attempt_at,
        attempt_result = 'success',
        failure_count = 0,
        failure_reason = NULL
    `).run(symbol, data, retrievedAt, this.currentSessionDate(), retrievedAt);

    // Update resolution
    if (expirations.length === 0) {
      this.db.prepare(
        "UPDATE symbol_resolution SET resolution = 'absent', resolved_at = ?, session_date = ?, primary_expiration = NULL WHERE symbol = ?"
      ).run(retrievedAt, this.currentSessionDate(), symbol);
    } else {
      const primary = selectPrimaryExpiration(expirations);
      this.db.prepare(
        "UPDATE symbol_resolution SET resolution = 'partial', resolved_at = ?, session_date = ?, primary_expiration = ? WHERE symbol = ?"
      ).run(retrievedAt, this.currentSessionDate(), primary, symbol);
    }

    this._symbolsChangedSincePublish++;
  }

  /**
   * Record chain evidence for a symbol.
   */
  setChain(symbol: string, chain: MarketChain, retrievedAt: string): void {
    const resolution = this.getResolution(symbol);
    if (!resolution) return;

    const expiration = resolution.primary_expiration ?? "";
    const data = JSON.stringify(chain);

    this.db.prepare(`
      INSERT INTO evidence (symbol, evidence_type, expiration, data, retrieved_at, session_date, last_attempt_at, attempt_result, failure_count)
      VALUES (?, 'chain', ?, ?, ?, ?, ?, 'success', 0)
      ON CONFLICT(symbol, evidence_type, expiration) DO UPDATE SET
        data = excluded.data,
        retrieved_at = excluded.retrieved_at,
        session_date = excluded.session_date,
        last_attempt_at = excluded.last_attempt_at,
        attempt_result = 'success',
        failure_count = 0,
        failure_reason = NULL
    `).run(symbol, expiration, data, retrievedAt, this.currentSessionDate(), retrievedAt);

    // Update resolution to ready
    this.db.prepare(
      "UPDATE symbol_resolution SET resolution = 'ready', resolved_at = ?, session_date = ? WHERE symbol = ?"
    ).run(retrievedAt, this.currentSessionDate(), symbol);

    this._symbolsChangedSincePublish++;
  }

  /**
   * Record a failure. Does NOT overwrite last successful data.
   */
  setFailure(symbol: string, reason: string): void {
    const resolution = this.getResolution(symbol);
    if (!resolution) return;

    const now = new Date().toISOString();
    const currentType = resolution.resolution === "pending" ? "expirations" : "chain";
    const expiration = currentType === "chain" ? (resolution.primary_expiration ?? "") : "";

    // Update attempt tracking on the evidence row without touching data/retrieved_at
    const existing = this.db.prepare(
      "SELECT failure_count FROM evidence WHERE symbol = ? AND evidence_type = ? AND expiration = ?"
    ).get(symbol, currentType, expiration) as any;

    if (existing) {
      this.db.prepare(`
        UPDATE evidence SET
          last_attempt_at = ?,
          attempt_result = 'failure',
          failure_count = failure_count + 1,
          failure_reason = ?
        WHERE symbol = ? AND evidence_type = ? AND expiration = ?
      `).run(now, reason, symbol, currentType, expiration);
    } else {
      // No evidence row yet — create one with failure state and no data
      this.db.prepare(`
        INSERT INTO evidence (symbol, evidence_type, expiration, last_attempt_at, attempt_result, failure_count, failure_reason)
        VALUES (?, ?, ?, ?, 'failure', 1, ?)
      `).run(symbol, currentType, expiration, now, reason);
    }

    // Update resolution if failures exceed threshold
    const newCount = (existing?.failure_count ?? 0) + 1;
    if (newCount >= 3) {
      this.db.prepare(
        "UPDATE symbol_resolution SET resolution = 'failed' WHERE symbol = ?"
      ).run(symbol);
    }

    this._symbolsChangedSincePublish++;
  }

  /**
   * Record upstream call / cache hit metrics.
   */
  recordMetrics(upstream: number, cacheHit: number): void {
    this._upstreamCalls += upstream;
    this._cacheHits += cacheHit;
  }

  /**
   * Get symbols that need work.
   */
  getWorkQueue(): string[] {
    const rows = this.db.prepare(`
      SELECT sr.symbol FROM symbol_resolution sr
      WHERE sr.resolution IN ('pending', 'partial')
         OR (sr.resolution = 'failed' AND (
           SELECT failure_count FROM evidence e
           WHERE e.symbol = sr.symbol
           ORDER BY e.last_attempt_at DESC LIMIT 1
         ) < 3)
    `).all() as any[];
    return rows.map(r => r.symbol);
  }

  /**
   * Get current coverage counts.
   */
  getCoverage(): EvidenceSnapshot["coverage"] {
    const rows = this.db.prepare(
      "SELECT resolution, COUNT(*) as cnt FROM symbol_resolution GROUP BY resolution"
    ).all() as any[];

    const counts: EvidenceSnapshot["coverage"] = { ready: 0, absent: 0, expirationsKnown: 0, pending: 0, failed: 0 };
    for (const row of rows) {
      switch (row.resolution) {
        case "ready": counts.ready = row.cnt; break;
        case "absent": counts.absent = row.cnt; break;
        case "partial": counts.expirationsKnown = row.cnt; break;
        case "pending": counts.pending = row.cnt; break;
        case "failed": counts.failed = row.cnt; break;
      }
    }
    return counts;
  }

  /**
   * Get a symbol's current evidence (composed from resolution + evidence rows).
   */
  get(symbol: string): SymbolEvidence | undefined {
    const resolution = this.getResolution(symbol);
    if (!resolution) return undefined;

    const status = this.mapResolutionToStatus(resolution.resolution);
    const expRow = this.db.prepare(
      "SELECT data, retrieved_at, failure_count, failure_reason, last_attempt_at FROM evidence WHERE symbol = ? AND evidence_type = 'expirations'"
    ).get(symbol) as any;
    const chainRow = this.db.prepare(
      "SELECT data, retrieved_at FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND expiration = ?"
    ).get(symbol, resolution.primary_expiration ?? "") as any;

    const expirations: MarketExpiration[] | null = expRow?.data ? JSON.parse(expRow.data) : null;
    const chain: MarketChain | null = chainRow?.data ? JSON.parse(chainRow.data) : null;

    return {
      symbol,
      status,
      expirations,
      primaryExpiration: resolution.primary_expiration,
      chain,
      retrievedAt: chainRow?.retrieved_at ?? expRow?.retrieved_at ?? null,
      failureReason: expRow?.failure_reason ?? null,
      failureCount: expRow?.failure_count ?? 0,
      lastAttemptAt: expRow?.last_attempt_at ?? null,
    };
  }

  /**
   * Build the full snapshot for the API.
   */
  buildSnapshot(): EvidenceSnapshot {
    const allSymbols = this.db.prepare("SELECT symbol FROM symbols WHERE removed_at IS NULL").all() as any[];
    const symbols: SymbolEvidence[] = [];
    for (const row of allSymbols) {
      const ev = this.get(row.symbol);
      if (ev) symbols.push(ev);
    }

    return {
      generation: this.generation,
      generatedAt: this.generatedAt,
      universe: symbols.length,
      coverage: this.getCoverage(),
      symbols,
      telemetry: {
        symbolsChangedThisGeneration: this._symbolsChangedSincePublish,
        upstreamCalls: this._upstreamCalls,
        cacheHits: this._cacheHits,
      },
    };
  }

  /**
   * Publish the snapshot: increment generation.
   */
  publishSnapshot(): void {
    const now = new Date().toISOString();
    this.db.prepare(
      "UPDATE snapshot_state SET generation = generation + 1, published_at = ? WHERE id = 1"
    ).run(now);
    this._symbolsChangedSincePublish = 0;
  }

  /**
   * Get the ETag for conditional HTTP.
   */
  getETag(): string {
    return `"gen-${this.generation}"`;
  }

  /**
   * Reset the symbols-changed counter.
   */
  resetGenerationCounter(): void {
    this._symbolsChangedSincePublish = 0;
  }

  /**
   * Get the underlying database connection (for universe queries).
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }

  // --- Private helpers ---

  private getResolution(symbol: string): any {
    return this.db.prepare("SELECT * FROM symbol_resolution WHERE symbol = ?").get(symbol);
  }

  private mapResolutionToStatus(resolution: string): SymbolStatus {
    switch (resolution) {
      case "ready": return "ready";
      case "absent": return "absent";
      case "partial": return "expirations_known";
      case "pending": return "pending";
      case "failed": return "failed";
      default: return "pending";
    }
  }

  private currentSessionDate(): string {
    // Simplified: use today's date. Full session model integration comes in Phase 3.
    return new Date().toISOString().split("T")[0];
  }
}
