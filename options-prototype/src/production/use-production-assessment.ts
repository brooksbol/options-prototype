/**
 * API hook for production assessment.
 *
 * Posts a Fidelity Activity History CSV to the backend and returns the
 * authoritative production assessment. No accounting logic here — the
 * browser uploads evidence and receives backend-derived facts.
 */

import { useState, useCallback, useRef } from "react";
import type { ProductionAssessmentResponse } from "./production-types";
import { getActiveBrokerageAccountId } from "../portfolio/active-account";

export type AssessmentState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "result"; data: ProductionAssessmentResponse }
  | { status: "error"; message: string };

export interface AssessOptions {
  /**
   * Account-switch race guard (Increment 8): the BrokerageAccount this assessment is FOR.
   * When provided, the async result is DISCARDED if the active account has changed by the
   * time the request completes — so an assessment started under account A can never become
   * account B's visible Production state. Also guarded by a monotonic request token so a
   * stale in-flight request never overwrites a newer one.
   */
  expectedAccountId?: string | null;
}

export function useProductionAssessment() {
  const [state, setState] = useState<AssessmentState>({ status: "idle" });
  // Monotonic token: only the most recent request may write state.
  const requestTokenRef = useRef(0);

  const assess = useCallback(async (file: File, period?: string, options?: AssessOptions) => {
    const token = ++requestTokenRef.current;
    const expectedAccountId = options?.expectedAccountId;
    setState({ status: "uploading" });

    // True only if this is still the latest request AND (when an account was expected) the
    // active account has not changed since the request began.
    const isStillCurrent = (): boolean => {
      if (token !== requestTokenRef.current) return false;
      if (expectedAccountId !== undefined && getActiveBrokerageAccountId() !== expectedAccountId) return false;
      return true;
    };

    try {
      const form = new FormData();
      form.append("file", file);
      if (period) form.append("period", period);

      const res = await fetch("/api/production/assess", {
        method: "POST",
        body: form,
      });

      if (!isStillCurrent()) return; // stale (account switched or superseded) — discard

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (!isStillCurrent()) return;
        setState({ status: "error", message: body.error || `Assessment failed (${res.status})` });
        return;
      }

      const data: ProductionAssessmentResponse = await res.json();
      if (!isStillCurrent()) return; // account switched while parsing — discard
      setState({ status: "result", data });
    } catch (err) {
      if (!isStillCurrent()) return;
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, assess, reset };
}
