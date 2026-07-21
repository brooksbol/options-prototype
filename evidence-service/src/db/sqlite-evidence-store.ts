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

// --- Prioritized Work Item ---

export type UrgencyClass = "A" | "B" | "C" | "D";

export interface PrioritizedWorkItem {
  symbol: string;
  urgencyClass: UrgencyClass;
  chainAgeMs: number;
  needsExpirations: boolean;
  isPriorEpoch: boolean;
}

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
        "UPDATE symbol_resolution SET resolution = 'failed', session_date = ? WHERE symbol = ?"
      ).run(this.currentSessionDate(), symbol);
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
   *
   * Work is needed when:
   *   1. Symbol is unresolved (pending or partial) — initial acquisition
   *   2. Symbol resolution failed with < 3 attempts within current epoch — retry
   *   3. Symbol is resolved (ready or absent) but from a prior session date — epoch refresh
   *   4. Symbol is ready and chain evidence age exceeds freshness target — rolling refresh
   *
   * A completed acquisition queue is completion within a validity epoch, not a
   * perpetual terminal state.
   */
  getWorkQueue(currentSessionDate?: string): string[] {
    const sessionDate = currentSessionDate ?? this.currentSessionDate();

    const rows = this.db.prepare(`
      SELECT sr.symbol FROM symbol_resolution sr
      WHERE sr.resolution IN ('pending', 'partial')
         OR (sr.resolution = 'failed' AND sr.session_date = ? AND (
           SELECT failure_count FROM evidence e
           WHERE e.symbol = sr.symbol
           ORDER BY e.last_attempt_at DESC LIMIT 1
         ) < 3)
         OR (sr.resolution IN ('ready', 'absent', 'failed') AND (sr.session_date IS NULL OR sr.session_date != ?))
    `).all(sessionDate, sessionDate) as any[];
    return rows.map(r => r.symbol);
  }

  /**
   * Get the prioritized work queue for the tiered scheduler.
   *
   * Returns symbols ordered by urgency class:
   *   Class A: Plausibly visible ready symbols with stale chain evidence
   *   Class B: Background ready symbols (no qualifying puts OR chain age < target but > max)
   *   Class C/D: Lifecycle work (pending, partial, failed, prior-epoch absent)
   *
   * Each entry includes its urgency class and chain age for scheduling decisions.
   */
  getPrioritizedWorkQueue(config: {
    chainFreshnessTargetMs: number;
    chainMaxAgeMs: number;
    expirationFreshnessMs: number;
    currentSessionDate?: string;
  }): PrioritizedWorkItem[] {
    const sessionDate = config.currentSessionDate ?? this.currentSessionDate();
    const now = Date.now();
    const results: PrioritizedWorkItem[] = [];

    // Get all ready symbols with their evidence timestamps
    const readySymbols = this.db.prepare(`
      SELECT sr.symbol, sr.session_date, sr.primary_expiration,
        (SELECT retrieved_at FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_retrieved_at,
        (SELECT retrieved_at FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'expirations' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as exp_retrieved_at,
        (SELECT data FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_data,
        (SELECT expiration FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_expiration
      FROM symbol_resolution sr
      WHERE sr.resolution = 'ready'
    `).all() as any[];

    for (const row of readySymbols) {
      const isPriorEpoch = row.session_date !== sessionDate;
      const chainAge = row.chain_retrieved_at ? now - new Date(row.chain_retrieved_at).getTime() : Infinity;
      const expAge = row.exp_retrieved_at ? now - new Date(row.exp_retrieved_at).getTime() : Infinity;

      // Determine if stale enough to need work
      if (!isPriorEpoch && chainAge < config.chainFreshnessTargetMs) {
        continue; // Fresh — no work needed
      }

      // Classify: plausibly visible (Class A) or background (Class B)
      const isPlausiblyVisible = isPriorEpoch
        ? this.classifyFromChain(row.chain_data, row.chain_expiration) // provisional from prior data
        : this.classifyFromChain(row.chain_data, row.chain_expiration); // current classification

      const needsExpirations = expAge > config.expirationFreshnessMs;

      if (isPlausiblyVisible) {
        // Class A: past target OR prior epoch
        results.push({ symbol: row.symbol, urgencyClass: "A", chainAgeMs: chainAge, needsExpirations, isPriorEpoch });
      } else if (chainAge >= config.chainMaxAgeMs || isPriorEpoch) {
        // Class B: past maximum age or prior epoch
        results.push({ symbol: row.symbol, urgencyClass: "B", chainAgeMs: chainAge, needsExpirations, isPriorEpoch });
      }
      // Otherwise: background but within max age — skip for now
    }

    // Add absent symbols from prior epoch (Class D)
    const absentPriorEpoch = this.db.prepare(`
      SELECT symbol FROM symbol_resolution
      WHERE resolution = 'absent' AND (session_date IS NULL OR session_date != ?)
    `).all(sessionDate) as any[];
    for (const row of absentPriorEpoch) {
      results.push({ symbol: row.symbol, urgencyClass: "D", chainAgeMs: Infinity, needsExpirations: true, isPriorEpoch: true });
    }

    // Add lifecycle work (Class C): pending, partial, failed with retries remaining
    const lifecycle = this.db.prepare(`
      SELECT sr.symbol FROM symbol_resolution sr
      WHERE sr.resolution IN ('pending', 'partial')
         OR (sr.resolution = 'failed' AND sr.session_date = ? AND (
           SELECT failure_count FROM evidence e
           WHERE e.symbol = sr.symbol
           ORDER BY e.last_attempt_at DESC LIMIT 1
         ) < 3)
    `).all(sessionDate) as any[];
    for (const row of lifecycle) {
      results.push({ symbol: row.symbol, urgencyClass: "C", chainAgeMs: Infinity, needsExpirations: true, isPriorEpoch: false });
    }

    // Sort by urgency: A (oldest first) → B past max (oldest first) → A approaching → B → C → D
    results.sort((a, b) => {
      // Priority 1: Class A past target — oldest chain first
      const aIsOverdueA = a.urgencyClass === "A";
      const bIsOverdueA = b.urgencyClass === "A";
      if (aIsOverdueA && !bIsOverdueA) return -1;
      if (!aIsOverdueA && bIsOverdueA) return 1;

      // Priority 2: Class B past max age
      const aIsBPastMax = a.urgencyClass === "B" && a.chainAgeMs >= config.chainMaxAgeMs;
      const bIsBPastMax = b.urgencyClass === "B" && b.chainAgeMs >= config.chainMaxAgeMs;
      if (aIsBPastMax && !bIsBPastMax && !bIsOverdueA) return -1;
      if (bIsBPastMax && !aIsBPastMax && !aIsOverdueA) return 1;

      // Within same class: oldest first (highest chainAgeMs)
      if (a.urgencyClass === b.urgencyClass) {
        return b.chainAgeMs - a.chainAgeMs; // descending age = oldest first
      }

      // Class order: A > B > C > D
      const classOrder = { A: 0, B: 1, C: 2, D: 3 };
      return classOrder[a.urgencyClass] - classOrder[b.urgencyClass];
    });

    return results;
  }

  /**
   * Get the total classified population by urgency class.
   *
   * Unlike getPrioritizedWorkQueue (which returns only actionable work),
   * this counts ALL symbols that belong to a service class regardless of
   * whether they are currently due for refresh.
   *
   * Class partition:
   *   A: Ready symbols with plausibly visible chain (qualifying puts in DTE/delta range)
   *   B: Ready symbols without plausibly visible chain
   *   C: Lifecycle work — pending, partial, current-epoch failed with retries, prior-epoch failed
   *   D: Absent symbols from prior epoch (need re-verification)
   *
   * Intentionally excluded (no actionable work this epoch):
   *   - Current-session absent symbols (confirmed absent, terminal until next epoch)
   *   - Current-epoch failed symbols with exhausted retries (retry budget spent)
   *
   * Used for telemetry: `eligible` = classified population per class.
   */
  getClassifiedPopulation(config: {
    currentSessionDate?: string;
  } = {}): { classA: number; classB: number; classC: number; classD: number } {
    const sessionDate = config.currentSessionDate ?? this.currentSessionDate();
    let classA = 0;
    let classB = 0;
    let classC = 0;
    let classD = 0;

    // Count ready symbols by A/B classification
    const readySymbols = this.db.prepare(`
      SELECT
        (SELECT data FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_data,
        (SELECT expiration FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_expiration
      FROM symbol_resolution sr
      WHERE sr.resolution = 'ready'
    `).all() as any[];

    for (const row of readySymbols) {
      if (this.classifyFromChain(row.chain_data, row.chain_expiration)) {
        classA++;
      } else {
        classB++;
      }
    }

    // Count absent symbols from prior epoch (Class D)
    const absentCount = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM symbol_resolution
      WHERE resolution = 'absent' AND (session_date IS NULL OR session_date != ?)
    `).get(sessionDate) as any;
    classD = absentCount?.cnt ?? 0;

    // Count lifecycle work (Class C):
    //   - pending (never resolved)
    //   - partial (expirations known, chain pending)
    //   - current-epoch failed with retries remaining (failure_count < 3)
    //   - prior-epoch failed (retry budget renews in new epoch)
    const lifecycleCount = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM symbol_resolution sr
      WHERE sr.resolution IN ('pending', 'partial')
         OR (sr.resolution = 'failed' AND sr.session_date = ? AND (
           SELECT failure_count FROM evidence e
           WHERE e.symbol = sr.symbol
           ORDER BY e.last_attempt_at DESC LIMIT 1
         ) < 3)
         OR (sr.resolution = 'failed' AND (sr.session_date IS NULL OR sr.session_date != ?))
    `).get(sessionDate, sessionDate) as any;
    classC = lifecycleCount?.cnt ?? 0;

    return { classA, classB, classC, classD };
  }

  /**
   * Classify a symbol as plausibly visible from its persisted chain data.
   *
   * A symbol is plausibly visible if it has at least one put contract with:
   *   - expiration DTE in [7, 45]
   *   - |delta| in [0.15, 0.50]
   *   - bid > 0
   *   - openInterest > 0
   *
   * This is a conservative superset of the actual recommendation funnel.
   * It cannot filter by affordability or execution scoring (frontend-owned).
   */
  classifyFromChain(chainDataJson: string | null, chainExpiration: string | null): boolean {
    if (!chainDataJson || !chainExpiration) return false;

    // Check DTE
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(chainExpiration + "T12:00:00");
    const dte = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (dte < 7 || dte > 45) return false;

    // Parse puts from chain JSON and check for qualifying contracts
    // Chain shape: {"puts":[{"strike":...,"bid":...,"delta":...,"openInterest":...},...]}
    try {
      const putsStart = chainDataJson.indexOf('"puts":[');
      if (putsStart < 0) return false;

      const arrayStart = chainDataJson.indexOf('[', putsStart);
      if (arrayStart < 0) return false;

      // Scan for qualifying contracts without full JSON parse (performance)
      // Look for patterns: bid > 0, |delta| in range, openInterest > 0
      let depth = 0;
      let objStart = -1;
      for (let i = arrayStart; i < chainDataJson.length; i++) {
        const c = chainDataJson[i];
        if (c === '[' && depth === 0) { depth++; continue; }
        if (c === '{') { if (depth === 1) objStart = i; depth++; }
        else if (c === '}') {
          depth--;
          if (depth === 1 && objStart >= 0) {
            const obj = chainDataJson.substring(objStart, i + 1);
            if (this.isQualifyingPut(obj)) return true;
            objStart = -1;
          }
        }
        else if (c === ']' && depth === 1) break;
      }
    } catch {
      return false;
    }

    return false;
  }

  private isQualifyingPut(contractJson: string): boolean {
    const bid = this.extractNumber(contractJson, "bid");
    if (bid <= 0) return false;

    const delta = this.extractNumber(contractJson, "delta");
    const absDelta = Math.abs(delta);
    if (absDelta < 0.15 || absDelta > 0.50) return false;

    const oi = this.extractNumber(contractJson, "openInterest");
    if (oi <= 0) return false;

    return true;
  }

  private extractNumber(json: string, key: string): number {
    const pattern = `"${key}":`;
    const idx = json.indexOf(pattern);
    if (idx < 0) return 0;
    let start = idx + pattern.length;
    while (start < json.length && json[start] === ' ') start++;
    if (start >= json.length || json[start] === 'n') return 0;
    let end = start;
    while (end < json.length && (json[end] === '-' || json[end] === '.' || (json[end] >= '0' && json[end] <= '9'))) end++;
    if (end === start) return 0;
    return parseFloat(json.substring(start, end)) || 0;
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
      apiVersion: "1",
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

  private _sessionDateOverride: string | null = null;

  /**
   * Override the session date for testing. Pass null to restore default behavior.
   */
  setSessionDateOverride(sessionDate: string | null): void {
    this._sessionDateOverride = sessionDate;
  }

  // --- Operational Priorities ---

  /**
   * Replace the entire operational priority set atomically.
   * Symbols not in the new set are removed. New symbols are added.
   * This is the authoritative Tier 1 membership for acquisition scheduling.
   */
  replaceOperationalPriorities(symbols: { symbol: string; sources: string[] }[]): void {
    const now = new Date().toISOString();

    const batch = this.db.transaction(() => {
      // Clear existing priorities
      this.db.prepare("DELETE FROM operational_priorities").run();

      // Insert new set
      const insert = this.db.prepare(
        "INSERT OR REPLACE INTO operational_priorities (symbol, sources, asserted_at) VALUES (?, ?, ?)"
      );
      for (const entry of symbols) {
        const normalized = entry.symbol.trim().toUpperCase();
        if (!normalized) continue;
        insert.run(normalized, JSON.stringify(entry.sources), now);
      }
    });
    batch();
  }

  /**
   * Get current operational priority symbols (Tier 1).
   */
  getOperationalPriorities(): string[] {
    const rows = this.db.prepare("SELECT symbol FROM operational_priorities").all() as any[];
    return rows.map(r => r.symbol);
  }

  /**
   * Check if a symbol is in the operational priority set.
   */
  isOperationalPriority(symbol: string): boolean {
    const row = this.db.prepare("SELECT 1 FROM operational_priorities WHERE symbol = ?").get(symbol.toUpperCase());
    return !!row;
  }

  private currentSessionDate(): string {
    if (this._sessionDateOverride) return this._sessionDateOverride;
    // Behavioral parity with TypeScript: new Date().toISOString().split("T")[0]
    return new Date().toISOString().split("T")[0];
  }
}
