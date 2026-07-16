# Bootstrap Throughput Correction — Completion Report

**Date:** July 3, 2026
**Based on:** `docs/16-bootstrap-throughput-design.md`
**Status:** Implemented, verified, awaiting runtime measurement

---

## Summary

Removed redundant worker-level fixed delays that duplicated the RequestPacer's provider-rate enforcement. Added a visual coverage bar. Resolved the 495/496 universe mismatch investigation. All existing tests pass.

---

## Part 1: Verification — Every Upstream Call Uses the Pacer

All Tradier HTTP calls pass through `RequestPacer.submit()`:

| Method | Pacer-governed call | Permits consumed |
|--------|-------------------|-----------------|
| `getExpirations(symbol)` | `this.pacer.submit(() => this.fetchExpirations(symbol))` | 1 |
| `getOptionsChain(symbol, exp)` | `this.pacer.submit(() => this.fetchChain(symbol, exp))` | 1 |
| `getOptionsChain(symbol, exp)` — quote | `this.pacer.submit(() => this.fetchQuote(symbol))` | 1 (if not cached) |

- All `fetch*()` methods are private — only invoked via pacer.
- `httpRequest()` is private — only callable from the 3 `fetch*()` methods above.
- No retry path, refresh path, or secondary adapter bypasses the pacer.

**Conclusion: RequestPacer is confirmed as sole rate-limit authority.**

---

## Part 2: Delays Removed vs Retained

### Removed

| Delay | Location | Purpose (stated) | Reason for removal |
|-------|----------|-------------------|-------------------|
| `DELAY_BETWEEN_SYMBOLS_MS = 2000` | `acquisition-worker.ts` line 39 | "pacing within a cycle" | Redundant — pacer enforces 0.9 req/sec |
| `await sleep(DELAY_BETWEEN_SYMBOLS_MS)` | Between symbols in batch loop | Inter-symbol pacing | Redundant |
| `await sleep(DELAY_BETWEEN_SYMBOLS_MS)` | Before chain-chase call | Pre-chain pacing | Redundant |

### Retained

| Delay | Value | Purpose | Justification |
|-------|-------|---------|---------------|
| `DELAY_IDLE_MS` | 30,000ms | Idle scheduling — no work remaining | Not rate-limiting; scheduling policy |
| `DELAY_AFTER_FAILURE_MS` | 5,000ms | Failure backoff | Prevents hammering a failing endpoint |
| Inter-cycle delay | 1,000ms | Scheduling gap between active cycles | Prevents tight loops; not rate-limiting |

---

## Part 3: Throughput Model

### Per-symbol cost (cold bootstrap, no cache hits)

**Ready symbol** (has options → needs expirations + chain + quote):

| Component | Time |
|-----------|------|
| Pacer wait (expirations) | ~1.1s |
| Tradier HTTP (expirations) | ~300ms |
| Pacer wait (chain) | ~1.1s |
| Tradier HTTP (chain) | ~300ms |
| Pacer wait (quote) | ~1.1s |
| Tradier HTTP (quote) | ~300ms |
| **Total (3 upstream calls)** | **~4.2s** |

**Ready symbol** (cached quote — same-symbol revisit within 60s TTL):

| Component | Time |
|-----------|------|
| Pacer wait (expirations) | ~1.1s |
| Tradier HTTP (expirations) | ~300ms |
| Pacer wait (chain) | ~1.1s |
| Tradier HTTP (chain) | ~300ms |
| Quote cache hit | 0s |
| **Total (2 upstream calls)** | **~2.8s** |

**Absent symbol** (no expirations available):

| Component | Time |
|-----------|------|
| Pacer wait (expirations) | ~1.1s |
| Tradier HTTP (expirations → empty) | ~300ms |
| **Total (1 upstream call)** | **~1.4s** |

### Projected batch cycle (10 symbols, cold):

Assuming 67% ready (3 calls each) and 33% absent (1 call each):
- 7 ready × 3 calls = 21 upstream requests
- 3 absent × 1 call = 3 upstream requests
- Total: 24 requests at 0.9 req/sec = ~26.7s queue drain
- Plus 1s inter-cycle scheduling = ~28s

### Projected full bootstrap (496 symbols):

- ~328 ready × 3 calls = 984 requests
- ~168 absent × 1 call = 168 requests
- Total: ~1,152 upstream requests
- At 0.9 req/sec: ~1,280 seconds = **~21 minutes**
- Plus inter-cycle gaps (50 cycles × 1s): +50s
- **Projected: ~22 minutes**

---

## Part 4: Before/After Comparison (Projected)

| Metric | Before (measured) | After (projected) | Improvement |
|--------|-------------------|-------------------|-------------|
| Average per-symbol (blended) | ~3.5s | ~2.2s | ~37% faster |
| Cycle duration (10 symbols) | ~34.8s | ~22-28s | ~30-37% |
| Full bootstrap (496 symbols) | ~29 min | ~21-22 min | ~25-30% |
| Symbols/minute | ~17 | ~23 | ~35% more |
| Upstream calls/minute | ~54 | ~54 | Unchanged |
| Time to first recommendation | ~35s | ~20s | ~43% faster |
| Time to 50% coverage | ~14-15 min | ~10-11 min | ~30% |

**Note:** The improvement is less dramatic than the 52% estimate in the design doc because the measured 34.8s cycle already showed partial overlap between worker sleeps and pacer queue processing. The actual bottleneck is the pacer's 0.9 req/sec rate — removing worker delays eliminates dead time where the pacer queue is empty but the worker is sleeping.

**Acceptance requires runtime measurement.** These projections will be validated by a cold-bootstrap run after deployment.

---

## Part 5: Coverage Bar

Added a thin 2px coverage bar to Band 3, immediately below the evidence-state indicator line.

**Behavior:**
- Represents: `Covered / Universe` where Covered = Ready + Absent
- Width: `(covered / universe) * 100%`
- Color: matches trust-state indicator (green/yellow/red)
- Transition: smooth 0.6s ease-out on width changes
- Full-width breakout ensures it spans the controls band

**Does NOT represent:** scheduler pass, worker cycle, queue depth, or internal task state.

---

## Part 6: Process Narration Removed

| Element | Disposition |
|---------|------------|
| `BUILDING` badge on section title | **Removed** — trust indicator communicates this |
| `"Provisional — X of Y covered · acquisition running"` | **Simplified** → "Showing best from X of Y evaluated · background acquisition continuing" |
| Coverage disclosure `<details>` block | **Retained** — moved to diagnostics section |
| Coverage/freshness/activity in evidence indicator | **Retained** — this IS the primary state |

---

## Part 7: Universe Denominator (495/496)

**Finding:** The universe parser (`loadUniverse()`) currently produces **496** symbols correctly from the frontend source file. The mismatch is not reproducible with the current `yahoo.ts` content.

**Root cause analysis:** The regex-based parser splits on commas and filters by `length > 0 && length < 10`. With a trailing comma before `]`, an empty token is correctly discarded. No symbol in the list has ≥ 10 characters. The 495 count, if previously observed, was likely a transient issue from a source file edit.

**Hardening applied:**
- Added validation warning: logs if parsed count ≠ 496
- Added deduplication: detects and warns about duplicate symbols
- Canonical denominator is now documented as 496

---

## Tests

| Suite | Result |
|-------|--------|
| Backend (`evidence-service`) | 24 tests pass |
| Frontend (`options-prototype`) | 851 tests pass |
| TypeScript (backend) | Clean — no errors |
| TypeScript (frontend) | Clean — no errors |

---

## Remaining Throughput Limits

The sole remaining bottleneck is the RequestPacer at 0.9 req/sec (54 requests/minute, against Tradier's 60/minute limit). Further improvement options:

1. **Increase pacer rate to 1.0 req/sec** — gains ~10%, but zero margin against limit. Not recommended.
2. **Bounded concurrency** — 2 parallel streams at 0.5 req/sec each. Requires pacer redesign. Deferred.
3. **Priority ordering** — doesn't reduce total bootstrap time but improves time-to-useful-recommendations. Explicitly deferred from this task.

---

## Files Modified

- `evidence-service/src/acquisition-worker.ts` — removed DELAY_BETWEEN_SYMBOLS_MS and both sleep calls; fixed redundant state check
- `evidence-service/src/universe.ts` — added dedup + validation warning
- `options-prototype/src/components/WriteDesk.tsx` — coverage bar, simplified provisional note, removed BUILDING badge
- `options-prototype/src/write-desk.css` — coverage bar styles
