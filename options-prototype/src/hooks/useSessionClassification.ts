/**
 * useSessionClassification — market session state, sourced from BACKEND AUTHORITY.
 *
 * Issue #16 authority boundary: market-session state and evidence admissibility are
 * DOMAIN judgments that depend on the active provider authority (real-time Production
 * vs 15-min-delayed Sandbox). Only the backend knows the active provider authority, so
 * only the backend may compute them. This hook therefore CONSUMES the backend's
 * authoritative session classification published on `GET /api/status` under the `session`
 * key. It does NOT re-derive session state from a local provider-delay profile — doing so
 * was the defect (a hardcoded Sandbox 15-min delay produced a phantom 09:30–09:45 ET
 * "Open Delay" on the real-time Production feed and suppressed canonical/admissible
 * evidence).
 *
 * The hook polls on a fixed interval (session transitions happen at fixed clock moments
 * but the AUTHORITATIVE transition — including provider failover — is the backend's to
 * declare). While the backend is briefly unreachable, the last known classification is
 * retained; before the first successful read a conservative bootstrap is used.
 */

import { useState, useEffect } from "react";
import type { MarketSessionClassification, MarketSessionState } from "../market-session/session-policy";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/** Backend `/api/status` -> `session` block (Issue #16 additive contract). */
interface BackendSessionBlock {
  state: MarketSessionState;
  canonicalSessionDate: string;
  currentTradingSessionDate: string | null;
  acceptingCanonicalEvidence: boolean;
  priorSessionOperationallyValid: boolean;
  providerDelayMinutes: number;
  admissibilityBoundaryEpochMs: number | null;
}

/**
 * Conservative bootstrap used ONLY before the first successful backend read (Codex
 * blocker #3: startup must not be permissive). It must NOT assert a live/open session
 * before the backend authority has spoken, because consumers derive session-closed and
 * evidence-admissibility behavior from `state`. We therefore bootstrap to a CLOSED-like,
 * non-accepting placeholder: every consumer that gates on `state` (e.g. WriteDesk's
 * `sessionClosed`) treats the session as not-yet-open until the backend confirms it. This
 * fails safe: at worst the UI briefly shows a closed/sealed posture for the first poll
 * interval, rather than briefly treating stale evidence as live-admissible. It is replaced
 * on the first successful `/api/status` read.
 */
const BOOTSTRAP: MarketSessionClassification = {
  // `state` is a required field, but it is NOT the authority signal here — `authorityPending`
  // is. We deliberately do NOT fabricate a real market-session posture: a fabricated
  // CLOSED_CANONICAL previously (and wrongly) unlocked the sealed-session validity shortcut,
  // making "conservative" startup permissive. `authorityPending: true` makes evidence
  // consumers fail closed regardless of this placeholder `state`, and the placeholder is
  // replaced wholesale on the first successful /api/status read.
  state: "CLOSED_CANONICAL",
  canonicalSessionDate: "",
  currentTradingSessionDate: null,
  acceptingCanonicalEvidence: false,
  priorSessionOperationallyValid: false,
  profileId: "backend-authority-pending",
  admissibilityBoundaryEpochMs: null,
  authorityPending: true,
};

/** True when every consumed field is equal (Codex blocker #2 — no dropped updates). */
function sameClassification(a: MarketSessionClassification, b: MarketSessionClassification): boolean {
  return a.state === b.state
    && a.canonicalSessionDate === b.canonicalSessionDate
    && a.currentTradingSessionDate === b.currentTradingSessionDate
    && a.acceptingCanonicalEvidence === b.acceptingCanonicalEvidence
    && a.priorSessionOperationallyValid === b.priorSessionOperationallyValid
    && (a.admissibilityBoundaryEpochMs ?? null) === (b.admissibilityBoundaryEpochMs ?? null)
    && (a.authorityPending ?? false) === (b.authorityPending ?? false);
}

function toClassification(b: BackendSessionBlock): MarketSessionClassification {
  return {
    state: b.state,
    canonicalSessionDate: b.canonicalSessionDate,
    currentTradingSessionDate: b.currentTradingSessionDate,
    acceptingCanonicalEvidence: b.acceptingCanonicalEvidence,
    priorSessionOperationallyValid: b.priorSessionOperationallyValid,
    // profileId now names the AUTHORITY, not a local provider-delay profile. The FE no
    // longer owns a provider profile for session purposes.
    profileId: "backend-authority",
    admissibilityBoundaryEpochMs: b.admissibilityBoundaryEpochMs,
    // Backend authority has arrived — consumers may leave fail-closed.
    authorityPending: false,
  };
}

export function useSessionClassification(): MarketSessionClassification {
  const [classification, setClassification] = useState<MarketSessionClassification>(BOOTSTRAP);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return; // retain last known classification on transient failure
        const data = await res.json();
        const session = data?.session as BackendSessionBlock | undefined;
        if (!session || typeof session.state !== "string") return;
        const next = toClassification(session);
        if (cancelled) return;
        // Codex blocker #2: dedup must compare EVERY consumed field, not just state +
        // canonicalSessionDate. acceptingCanonicalEvidence, priorSessionOperationallyValid,
        // admissibilityBoundaryEpochMs, and currentTradingSessionDate can change while the
        // coarse state stays the same (e.g. the admissibility boundary advancing, or the
        // acceptance flag flipping at the open). Dropping those updates would leave
        // consumers acting on stale session facts.
        setClassification(prev => (sameClassification(prev, next) ? prev : next));
      } catch {
        // Retain last known classification; the backend is the authority and will be
        // re-read on the next tick. Never fall back to a locally-derived session state.
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    void poll(); // immediate read on mount

    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return classification;
}
