# BUG-010 — Frontend session gate derives provider-delay semantics from a hardcoded Sandbox profile; phantom 09:30–09:45 Open Delay on real-time Production

- **Status:** Resolved
- **Severity:** S2
- **Area:** Operator Console / Write Desk (session-gate authority boundary; frontend/backend authority duplication)
- **Provenance:** GitHub Issue #16 (https://github.com/brooksbol/options-prototype/issues/16) — historical, non-authoritative. Created 2026-09-11; closed 2026-09-11. Labels: `defect`, `S2`.

## Observed failure

At **09:43 ET on a Production (real-time) trading session**, the Operator Console session badge showed **"Open Delay"** (`REGULAR_OPEN_DELAY`). On the real-time Production feed there is **no** provider delay, so the regular session begins at 09:30 ET and there should be no open-delay window at all.

## Intended semantics violated

An authority-boundary violation: the backend owns and computes provider-aware session truth; the frontend re-derived it from a locally chosen provider profile. The frontend was effectively deciding *"what market-data authority am I looking at, and therefore when is this evidence admissible?"* — which is not a frontend policy decision. Same class of boundary failure as consequence facts / provenance (ADR-015/016): the frontend must compose and display authority, not invent it.

## Evidence

### Root cause

The frontend `MarketSessionPolicy` (`options-prototype/src/market-session/session-policy.ts`) hardcodes the Tradier **sandbox** session profile (`ETF_OPTIONS_TRADIER_SANDBOX`, `providerDelayMinutes: 15`) regardless of the live provider authority, and independently derives session state from it. On the real-time Production feed it manufactures a phantom `REGULAR_OPEN_DELAY` window **09:30–09:45 ET**.

This is **not** display-only. The single `providerDelayMs` drives three coupled semantics in `session-policy.ts`:

1. **Session-level state / badge** — phantom `REGULAR_OPEN_DELAY` 09:30–09:45 ET on real-time authority.
2. **Admissibility boundary** (`getAdmissibilityBoundary`) — pushed to 09:45 instead of 09:30.
3. **Canonical-evidence acceptance** (`shouldAcceptAsCanonical` / evidence provenance) — real-time regular-session evidence refused as canonical until 09:45.

`WriteDesk.tsx` treats `REGULAR_OPEN_DELAY` as `sessionClosed`, so the first 15 minutes of every real-time trading session behave as if the market is not yet live (Console badge + Write Desk).

### Live evidence (captured 2026-09-11 09:43 ET, inside the phantom window)

`GET /api/status`:

- `"environment":"production"`; `providerAvailability.activeEnvironment: "production"`; `lifecycle: "PRODUCTION_ACTIVE"`
- backend `sessionState`: `"Regular observation — real-time provider, no opening delay (9:43 ET)"`

Snapshot chain provenance: 3271 `environment:production`, 1 `sandbox`, 1266 `unknown` (mixed per-subject authority present in one snapshot).

Backend and frontend were in **direct, observable contradiction**: backend = real-time regular observation, no opening delay; frontend UI = "Open Delay".

### Reconciliation: incomplete wiring, not a regression

The **backend** `SessionGate` is already provider-aware (`SessionGate(Clock, BooleanSupplier realtimeData)`): real-time → FULL at 09:30 with the exact "no opening delay" posture; delayed/sandbox → EXPIRATIONS_ONLY through 09:45; reflects runtime failover. The provider-aware session gate was **accepted and implemented on the backend but never wired into the frontend** `MarketSessionPolicy`, which still assumed the sandbox 15-min profile. The frontend maintained a second, provider-unaware session model that contradicted backend authority.

## Consequence

The first 15 minutes of every real-time trading session were misrepresented as not-yet-live (phantom Open Delay badge, delayed admissibility, delayed canonicality), on the primary operator surfaces. Severity S2 (major operator-facing consequence).

## Diagnosis / root cause

Frontend/backend authority duplication: backend already computed provider-aware session truth; the frontend independently derived session/admissibility/canonicality from a hardcoded sandbox provider profile.

## Scope / non-goals

Session-gate authority boundary only. No scheduler-policy, acquisition, provider-selection, PL-DEPLOY/A, or broader FE/BE migration changes. Remediation design was deferred to a bounded Architect pass (see remediation history).

Architectural starting position (Principal-directed at filing time):

> Backend owns provider/session/admissibility/canonicality semantics. Frontend renders/composes backend authority and must not derive those semantics from provider identity.

Explicitly rejected remediations (historical): a global frontend `providerDelayMinutes`; merely wiring `activeEnvironment` into the existing FE `MarketSessionPolicy` (still leaves FE owning environment→delay→canonicality policy — the same authority leak).

## Acceptance criteria (for the fix)

- Production authority does NOT manufacture a 09:30–09:45 ET `REGULAR_OPEN_DELAY`.
- Production evidence becomes canonical/admissible at the regular open per accepted backend session semantics.
- Sandbox/degraded retains delayed-provider behavior.
- Existing closed / pre-market / post-market semantics unchanged.
- Mixed-authority: sandbox evidence is not silently laundered into production semantics.
- No duplicate FE authority model: session/admissibility semantics originate from backend-computed facts.

## Remediation history

Resolved 2026-09-11. Remediation delivered by **PR #17** — *"fix(#16): backend owns session + per-subject admissibility; frontend consumes"* (merged 2026-09-11, https://github.com/brooksbol/options-prototype/pull/17). Backend owns session + per-subject admissibility; the frontend consumes backend authority rather than deriving it from provider identity.

## Verification

Verified through the PR #17 change set (backend-owned session/admissibility with frontend consuming). The GitHub Issue was closed 2026-09-11T16:01:41Z coincident with the PR #17 merge.

## Related — subsequent architectural learning (does not predate the defect)

After remediation, the authority-precedence lesson from this defect was ratified as **ADR-017** via **PR #18** — *"docs(#16): ratify authority-precedence lesson as ADR-017 (post-#16 ratchet)"* (merged 2026-09-11, https://github.com/brooksbol/options-prototype/pull/18). ADR-017 is **subsequent** architectural-learning provenance derived from this defect's resolution; it did not exist before the defect and did not govern the original behavior.
