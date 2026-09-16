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

### Additive fields — Underlying Previous Close (BUG-020, September 2026)

Per BUG-020 (Today's G/L broker parity), each chain's `underlying` object carries the
provider's prior-session official close as `previousClose`. This is the baseline for the
broker-comparison "Today's G/L" (`last − previousClose`), replacing the prior
first-observation-of-day baseline that mismatched the broker. It is an **additive,
non-breaking** field under INV-PUB-05 (no version increment).

```jsonc
"chain": {
  "symbol": "XLE",
  "expiration": "2026-08-03",
  "underlying": {
    "symbol": "XLE",
    "name": "Energy Select Sector",
    "price": 92.50,
    "previousClose": 91.30      // ADDITIVE — provider prevclose; number | null
  },
  "puts": [ /* ... */ ],
  "calls": [ /* ... */ ]
}
```

The same `underlying.previousClose` field appears on `symbols[].chains[].data`. The
per-symbol quote endpoint `GET /api/evidence/quotes` surfaces it as
`quotes[].observation.previousClose` (same value, read back from the stored chain blob).

| Field | Type | Meaning |
|-------|------|---------|
| `underlying.previousClose` | number \| null | Provider prior-session official close (Tradier `prevclose`). The broker-parity daily-G/L baseline. |
| `quotes[].observation.previousClose` | number \| null | The same prior close, exposed on the quote observation for consumers computing Today's G/L. |

Rules (BUG-020):

- **Absence is `null`, never `0`.** When the provider does not supply a prior close (field
  omitted, explicit `null`, or unparseable), `previousClose` is serialized as JSON `null`.
  Numeric `0` means the provider supplied zero. Consumers must render "Today's G/L" as
  unavailable (a dash) when `previousClose` is null or non-positive — never fabricate a zero
  and never fall back to a different baseline under the "Today's G/L" label.
- **It rides in the chain blob.** `previousClose` is stored inside the existing
  `evidence.data` chain JSON (via `marshalChain`) and read back with the same minimal parser
  used for `underlying.price` — **no schema/migration change**.
- **Consumer compatibility:** an older snapshot (or a build without a provider prior close)
  that omits `previousClose` is interpreted by consumers as absent/`null`. Consumers must not
  reconstruct a prior close from `spot_history` or any first-observation baseline.

### Additive fields — Secondary Greeks (September 2026)

Each option contract in `symbols[].chain.puts[]`, `symbols[].chain.calls[]`, and the
corresponding arrays within `symbols[].chains[].data` carries five greeks —
`delta` plus the four secondary greeks `gamma`, `theta`, `vega`, `rho`. These are
**additive, non-breaking** fields under INV-PUB-05 (no version increment); they are
documented here as required by the contract's own stability rule.

**All five greeks are nullable** (`number | null`). Each is an independent
observation: the value is a number **only when the provider actually supplied a
number** (including a genuine `0`). Provider **absence** — field omitted, explicit
`null`, or an unparseable value — is serialized as JSON `null`, **never** fabricated
as `0`. This preserves the "persist facts; derive trust" invariant at the provider
boundary.

```jsonc
{
  "strike": 88,
  "bid": 1.50,
  "ask": 1.70,
  "delta": -0.28,      // number | null
  "gamma": 0.0412,     // number | null
  "theta": null,       // provider did not supply → null, NOT 0
  "vega": 0.0561,      // number | null
  "rho": 0.0093,       // number | null
  "openInterest": 520,
  "volume": 110
}
```

Value semantics:

| Field | Type | Meaning |
|-------|------|---------|
| `delta` | number \| null | Rate of change of option price per $1 move in the underlying (puts negative, calls positive). Provider sign, as-reported. |
| `gamma` | number \| null | Rate of change of delta per $1 move in the underlying. Provider sign, as-reported. |
| `theta` | number \| null | Time decay per day. Typically negative. Provider sign, as-reported. |
| `vega` | number \| null | Sensitivity to a 1-point change in implied volatility. Provider sign, as-reported. |
| `rho` | number \| null | Sensitivity to a 1-point change in the risk-free rate. Provider sign, as-reported. |

Rules:

- These are observed provider greeks (Tradier `greeks=true`), acquired with the same
  chain observation as the contract. They carry no independent provenance; their
  acquisition age equals the chain's.
- **Each greek is independent.** A missing or invalid value in one field says nothing
  about the others; consumers must evaluate availability field by field. A missing
  `delta` does not invalidate `theta`, and vice versa.
- **Absence is `null`, never `0`.** Numeric zero means the provider supplied zero.
  Producers must not substitute zero for unavailable data; consumers must not treat
  `null` (or an omitted field, in an older snapshot) as a meaningful `0`.
- **Sign is preserved as-reported by the provider.** Consumers that need a normalized
  magnitude (e.g. absolute delta for a magnitude view) must normalize themselves.
- **Provider placeholder vector:** some providers emit an exact five-field zero vector
  (`delta`=`gamma`=`theta`=`vega`=`rho`=`0`) as an *uncomputed* placeholder even on a
  real-bid contract. This is a provider-level sentinel, not data; consumers may treat a
  fully-supplied exact all-zero vector as unavailable. This is the only justified
  set-level rejection — a partially populated vector must remain partially populated.

### Additive fields — Provider Implied Volatility + Greek Update Time (`PL-DEPLOY-EXPORT`, September 2026)

Each option contract additionally carries two **distinct** provider implied-volatility
measurements and the provider's greek/IV update time, all acquired with the same
`greeks=true` chain observation as the greeks above. These are **additive, non-breaking**
fields under INV-PUB-05 (no version increment).

```jsonc
{
  "strike": 88,
  "bid": 1.50,
  "ask": 1.70,
  "delta": -0.28,
  "gamma": 0.0412,
  "theta": null,
  "vega": 0.0561,
  "rho": 0.0093,
  "openInterest": 520,
  "volume": 110,
  "midIv": 0.4213,                 // number | null — Tradier midpoint-derived IV
  "smvVol": 0.3987,                // number | null — ORATS smoothed/surface volatility
  "greeksUpdatedAt": "2026-09-11 16:58:53"  // string | null — provider-reported, verbatim
}
```

Value semantics:

| Field | Type | Meaning |
|-------|------|---------|
| `midIv` | number \| null | Tradier's **midpoint-derived** implied volatility (inverted from the option midpoint price). Decimal volatility, provider as-reported (e.g. `0.42` = 42%). |
| `smvVol` | number \| null | The **ORATS smoothed/surface** volatility measurement. Decimal volatility, provider as-reported. |
| `greeksUpdatedAt` | string \| null | The provider-reported greek/IV update time, preserved **verbatim** as the provider string. |

Rules:

- **`midIv` and `smvVol` are DISTINCT measurements.** They are never aliased, averaged,
  substituted, or collapsed into a generic `iv`. `midIv` is midpoint-price inversion;
  `smvVol` is the ORATS smoothed surface. Repository fixture evidence shows they can
  diverge materially (e.g. `mid_iv=1.5178` vs `smv_vol=0.833`). There is no generic `iv`
  field, and IV is **never computed locally** (no pricing model / solver). `bid_iv` and
  `ask_iv` are intentionally **not** exposed in this contract.
- **Absence is `null`, never `0`.** Provider absence (field omitted, explicit `null`, or
  unparseable) serializes as JSON `null`. Numeric zero means the provider supplied zero.
  As with the greeks, `0.0` is preserved verbatim in the machine-consumable evidence; any
  "zero = unavailable" trust is a *presentation-layer* derivation and must not be applied
  to this raw evidence.
- **IV magnitude is unconstrained.** Values `> 1` are valid (IV is not a probability); no
  `[0, 1]` clamp is applied.
- **`greeksUpdatedAt` is provider-local and zone-unspecified.** It is preserved exactly as
  the provider returns it (Tradier form `"YYYY-MM-DD HH:MM:SS"`, no timezone marker). It is
  **never** parsed into an ISO instant, never assigned/appended a timezone (no `Z`), and is
  **distinct** from Wheelwright's chain-acquisition provenance (`chains[].retrievedAt` /
  `chainAcquisitionProvenance`). It describes when the provider computed the greeks/IV, not
  when Wheelwright acquired the chain; consumers must not derive a freshness claim from it
  beyond what the raw value supports.
- **Consumer compatibility:** an older snapshot (or a build without provider IV) that omits
  these fields is interpreted by consumers as absent/`null` — never fabricated.

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
