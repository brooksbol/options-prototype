/**
 * Funnel Export Visibility — diagnostic-affordance gate (UI ONLY).
 *
 * The three funnel-membership CSV export controls (BUG-016) are diagnostic /
 * observability affordances, not normal operator workflow. They are hidden from
 * the ordinary Write Desk surface and exposed only through an intentional,
 * non-persisted query-parameter easter egg:
 *
 *     ?funnelExport=1
 *
 * CRITICAL: This predicate controls UI VISIBILITY ONLY. It must never condition
 * terminal-membership collection, DecisionExportResult construction, funnel
 * accounting, derived counters, reconciliation assertions, Decision execution,
 * recommendation semantics, acquisition, evidence, or provider behavior. The
 * BUG-016 single-accounting-authority architecture is entirely independent of
 * this flag: the authoritative terminal membership underlying the displayed
 * funnel exists whether or not its diagnostic CSV control is rendered.
 *
 * Semantics are deliberately exact and opt-in:
 *   funnelExport=1   -> enabled
 *   absent           -> disabled
 *   any other value  -> disabled
 *
 * This mirrors the existing `?viz=` query-parameter convention used by the
 * Operator Console. The setting is intentionally not persisted (no Settings
 * preference, no storage, no visible toggle, no environment variable, no
 * feature-flag framework).
 */

/** The opt-in query parameter name. */
export const FUNNEL_EXPORT_PARAM = "funnelExport";

/** The single value that enables the diagnostic controls. */
export const FUNNEL_EXPORT_ENABLED_VALUE = "1";

/**
 * Pure predicate: does the given URL query string opt into the diagnostic
 * funnel CSV controls? Accepts a raw `location.search` string (with or without
 * the leading "?"). Only the exact value "1" enables; everything else, including
 * absence, disables.
 */
export function isFunnelExportEnabled(search: string | undefined | null): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  return params.get(FUNNEL_EXPORT_PARAM) === FUNNEL_EXPORT_ENABLED_VALUE;
}
