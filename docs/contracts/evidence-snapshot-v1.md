# Evidence Snapshot Contract v1

**Date:** July 2026
**Status:** Frozen
**Authority:** INV-PUB-05 (Published contract versioning)
**Test coverage:** `evidence-service/tests/snapshot-contract.test.ts`

---

## Endpoint

```
GET /api/evidence/snapshot
```

## Conditional HTTP

| Header | Behavior |
|--------|----------|
| `If-None-Match: "<etag>"` | If ETag matches current generation, returns **304 Not Modified** with no body |
| (no header) | Returns full snapshot payload |

## Response Headers

| Header | Value |
|--------|-------|
| `ETag` | `"gen-<N>"` where N is the monotonically increasing generation |
| `Cache-Control` | `private, no-cache` |
| `Content-Type` | `application/json` |
| `X-Generation` | Generation number (informational) |
| `X-Payload-Bytes` | Response size in bytes (informational) |

## ETag Semantics

- Format: `"gen-<integer>"`
- Monotonically increasing (each publication produces a higher generation)
- A consumer receiving a higher generation can assume it supersedes all lower generations
- Weak validator prefix (`W/`) is accepted and normalized during comparison

---

## Response Shape

```jsonc
{
  "apiVersion": "1",                    // Contract version — always "1" for this schema
  "generation": 42,                     // Monotonically increasing snapshot version
  "generatedAt": "2026-07-16T14:30:00.000Z",  // ISO-8601 publication timestamp
  "universe": 1286,                     // Total monitored symbols
  "coverage": {
    "ready": 850,                       // Symbols with complete evidence (expirations + chain)
    "absent": 131,                      // Symbols confirmed non-optionable (zero expirations)
    "expirationsKnown": 5,              // Expirations acquired, chain pending
    "pending": 300,                     // Not yet evaluated
    "failed": 0                         // Exceeded failure threshold
  },
  "symbols": [                          // Array of per-symbol evidence records
    {
      "symbol": "XLE",
      "status": "ready",                // One of: pending, expirations_known, ready, absent, failed
      "expirations": [                  // Array of MarketExpiration or null
        { "date": "2026-08-03", "dte": 21 }
      ],
      "primaryExpiration": "2026-08-03",  // Selected target expiration or null
      "chain": {                        // MarketChain or null
        "symbol": "XLE",
        "expiration": "2026-08-03",
        "underlying": {
          "symbol": "XLE",
          "name": "Energy Select Sector",
          "price": 92.50
        },
        "puts": [
          {
            "strike": 88,
            "bid": 1.50,
            "ask": 1.70,
            "delta": -0.28,
            "openInterest": 520,
            "volume": 110
          }
        ],
        "calls": [
          {
            "strike": 95,
            "bid": 1.20,
            "ask": 1.40,
            "delta": 0.32,
            "openInterest": 300,
            "volume": 80
          }
        ]
      },
      "retrievedAt": "2026-07-16T14:30:00Z",  // When evidence was successfully acquired
      "failureReason": null,            // Last failure reason or null
      "failureCount": 0,                // Consecutive failure count
      "lastAttemptAt": "2026-07-16T14:30:00Z"  // Most recent attempt timestamp
    }
  ],
  "telemetry": {
    "symbolsChangedThisGeneration": 10, // Symbols modified since last publication
    "upstreamCalls": 2500,              // Total provider calls since process start
    "cacheHits": 1800                   // Total cache hits since process start
  }
}
```

---

## Field Guarantees

| Field | Type | Guaranteed |
|-------|------|-----------|
| `apiVersion` | string literal `"1"` | Always present, always `"1"` for this contract |
| `generation` | positive integer | Monotonically increasing per INV-PUB-03 |
| `generatedAt` | ISO-8601 string | Always present |
| `universe` | non-negative integer | Count of active (non-removed) symbols |
| `coverage.*` | non-negative integers | Sum equals `universe` |
| `symbols` | array | One entry per active symbol |
| `symbols[].symbol` | string | Uppercase ticker |
| `symbols[].status` | enum | One of: `pending`, `expirations_known`, `ready`, `absent`, `failed` |
| `symbols[].retrievedAt` | string or null | Present when evidence exists (INV-PERSIST-03) |
| `symbols[].chain` | object or null | Present only when status is `ready` |
| `telemetry` | object | Always present; values are process-lifetime counters |

## Stability Commitment

Per INV-PUB-05:

> Published evidence contracts are versioned. Breaking changes require an explicit version transition.

A breaking change is:

- Removing a field documented above
- Renaming a field
- Changing a field's type
- Changing the semantic meaning of a field value

Non-breaking additions (new fields, additional telemetry) are permitted without version increment but should be documented.

---

## Consumer Compatibility

The primary consumer (`useEvidenceSnapshot.ts`) depends on:

- `generation` — for ETag tracking
- `generatedAt` — for display
- `universe` — for display
- `coverage.*` — for status display
- `symbols[]` — for evidence consumption by the recommendation engine

The consumer ignores fields it does not recognize (additive compatibility).
