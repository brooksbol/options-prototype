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

### Additive fields — Evidence Provenance (ADR-015, September 2026)

Per ADR-015 (Evidence Provenance Authority and Preservation), the snapshot carries **subject-scoped** option-chain acquisition provenance. These are **additive, non-breaking** fields under INV-PUB-05 (no version increment); they are documented here as required by the contract's own rule and covered by compatibility tests.

Each element of `symbols[].chains[]` gains a field describing the acquisition provenance of *that specific chain*:

```jsonc
"chains": [
  {
    "expiration": "2026-08-03",
    "retrievedAt": "2026-08-03T14:30:00Z",
    "chainAcquisitionProvenance": {           // ADDITIVE — subject: THIS chain only
      "kind": "chain-acquired",
      "acquiredAt": "2026-08-03T14:30:00Z"     // authoritative per-chain acquisition instant
    },
    "data": { /* MarketChain */ }
  }
]
```

The legacy/primary single `chain` gains a **distinctly named** sibling describing the primary chain specifically (a symbol can contain many chains, so the symbol-level name must not be ambiguous):

```jsonc
"chain": { /* MarketChain */ },
"primaryExpiration": "2026-08-03",
"primaryChainAcquisitionProvenance": {         // ADDITIVE — subject: the legacy primary chain
  "kind": "chain-acquired",
  "acquiredAt": "2026-08-03T14:30:00Z"
}
```

Provenance value semantics:

| Field | Type | Meaning |
|-------|------|---------|
| `chains[].chainAcquisitionProvenance` | object | Acquisition provenance of that chain element. `{ "kind": "chain-acquired", "acquiredAt": <ISO-8601> }` when the publisher has an authoritative per-chain acquisition time; `{ "kind": "unavailable" }` when a chain representation exists but its authoritative acquisition provenance cannot be established. |
| `primaryChainAcquisitionProvenance` | object | Same, scoped to the legacy primary `chain`. For a `ready` symbol the publisher derives this from the primary-expiration chain row's authoritative `retrieved_at`; it is **not** `unavailable` merely because the legacy representation historically omitted a timestamp. |

Rules (ADR-015):

- `chainAcquisitionProvenance` / `primaryChainAcquisitionProvenance` describe **option-chain acquisition only**. They say nothing about the acquisition age of the underlying quote embedded in the composite chain (which may be a cached quote acquired up to ~60s **before** the chain) or about the composite as a whole.
- `{ "kind": "unavailable" }` requires an existing chain subject whose authoritative acquisition provenance the publisher cannot establish. It is not emitted where there is no chain subject at all.
- **Consumer compatibility:** an older snapshot that supplies a chain but omits these provenance fields is interpreted by consumers as `unavailable`. Consumers must never reconstruct provenance from `symbols[].retrievedAt`, cache TTL timestamps, or `Date.now()`.

### Additive fields — Per-Subject Admissibility (Issue #16, September 2026)

Per Issue #16 (session/admissibility authority), the snapshot carries a **subject-scoped admissibility verdict** for each chain. Market-session state and evidence admissibility/canonicality are **domain judgments owned by the backend**, because only the backend knows the active provider authority (real-time Production vs 15-min-delayed Sandbox) and the session policy. Consumers **must not** re-derive admissibility by mapping provider identity/environment to a delay policy themselves — that is the authority leak this field closes. These are **additive, non-breaking** fields under INV-PUB-05 (no version increment).

```jsonc
"chains": [
  {
    "expiration": "2026-08-03",
    "retrievedAt": "2026-08-03T14:30:00Z",
    "chainAcquisitionProvenance": { "kind": "chain-acquired", "acquiredAt": "2026-08-03T14:30:00Z" },
    "environmentProvenance": { "kind": "provider-acquired", "environment": "production" },
    "admissibility": {                          // ADDITIVE — subject: THIS chain only
      "admissible": true,
      "basis": "real-time",                      // "real-time" | "delayed" | "unknown"
      "canonicalSessionDate": "2026-08-03"
    },
    "data": { /* MarketChain */ }
  }
]
```

The legacy/primary single `chain` gains a sibling `primaryChainAdmissibility` of the same shape.

| Field | Type | Meaning |
|-------|------|---------|
| `chains[].admissibility` / `primaryChainAdmissibility` | object | Backend verdict for that subject. `admissible` (bool): may this subject be relied upon now. `basis`: the semantics applied — `real-time` (production authority, no delay), `delayed` (sandbox authority, 15-min), or `unknown` (environment could not be established → conservative, not admissible). `canonicalSessionDate`: the session date this subject is canonical for (or null when unknown). |

Rules (Issue #16):

- The verdict is derived from **that subject's own** provider `environment` + its authoritative acquisition instant + backend session policy — **never** from the currently-active authority. A sandbox-acquired subject retains delayed semantics even while Production is active (no laundering), and a production-acquired subject is never charged Sandbox delay.
- A production-acquired subject is admissible/canonical at the regular 09:30 ET open (no phantom 09:30–09:45 open-delay window). A sandbox-acquired subject retains its 15-minute delayed-open behavior.
- `basis: "unknown"` (unknown/absent environment) yields `admissible: false` — an explicit conservative result. Consumers must not promote unknown to production.
- **Consumer compatibility:** an older snapshot (or a build without session context) that omits `admissibility` is interpreted by consumers as absent/unknown — never fabricated. Consumers must not reconstruct admissibility from `environmentProvenance` alone.

> Session-LEVEL classification (the six-state session model for the UI badge and session-closed behavior) is published on `GET /api/status` under the additive `session` key, not in the snapshot. See `07-architecture-current.md` / `StatusController`.

---

## Consumer Compatibility

The primary consumer (`useEvidenceSnapshot.ts`) depends on:

- `generation` — for ETag tracking
- `generatedAt` — for display
- `universe` — for display
- `coverage.*` — for status display
- `symbols[]` — for evidence consumption by the recommendation engine

The consumer ignores fields it does not recognize (additive compatibility).
