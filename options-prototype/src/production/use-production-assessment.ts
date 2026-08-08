/**
 * API hook for production assessment.
 *
 * Posts a Fidelity Activity History CSV to the backend and returns the
 * authoritative production assessment. No accounting logic here — the
 * browser uploads evidence and receives backend-derived facts.
 */

import { useState, useCallback } from "react";
import type { ProductionAssessmentResponse } from "./production-types";

export type AssessmentState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "result"; data: ProductionAssessmentResponse }
  | { status: "error"; message: string };

export function useProductionAssessment() {
  const [state, setState] = useState<AssessmentState>({ status: "idle" });

  const assess = useCallback(async (file: File, period?: string) => {
    setState({ status: "uploading" });

    try {
      const form = new FormData();
      form.append("file", file);
      if (period) form.append("period", period);

      const res = await fetch("/api/production/assess", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setState({ status: "error", message: body.error || `Assessment failed (${res.status})` });
        return;
      }

      const data: ProductionAssessmentResponse = await res.json();
      setState({ status: "result", data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, assess, reset };
}
