/**
 * §14a Lifecycle-Ambiguity Guard — Existing Short-Obligation HOLD vs CLOSE V1
 *
 * Governing design: docs/design/existing-short-obligation-hold-vs-close-v1-design.md §14a
 * Authority basis: 07-architecture-current.md §Ownership and Authority Boundary
 *   (consolidated brokerage lifecycle-evidence authority) + ADR-016 (association-as-claim)
 *   + ADR-017 (fail-closed on unresolved authority).
 *
 * WHY THIS EXISTS
 *   The live activity overlay (`activity-projection.ts`) can retain a GHOST
 *   obligation after it has been bought-to-close, expired, or assigned — those
 *   event types fall through its mutation switch without reducing positions
 *   (Finding B / BUG-001 + sibling). Confidently offering HOLD/CLOSE facts on a
 *   ghost obligation is exactly the trustability failure the HOLD-vs-CLOSE
 *   capability exists to eliminate. This guard makes the evaluator REFUSE
 *   (classify `lifecycle state ambiguous`) rather than confidently evaluate.
 *
 * GOVERNING DISCIPLINE (post-Codex-review, hard constraints)
 *   - Detect-and-refuse ONLY. It READS authoritative post-checkpoint brokerage
 *     Activity to detect a resolution event that conflicts with the projected
 *     open obligation, and returns an ambiguity determination. It never mutates
 *     portfolio/overlay state, never repairs the overlay, never reconstructs
 *     lifecycle history, never establishes a lifecycle episode, never nets
 *     transactions, and never becomes a second position-projection authority.
 *   - EXACT-CONTRACT ASSOCIATION ONLY (ADR-016). A conflict is recognized only
 *     when a resolution event is associated to the exact contract WITHOUT
 *     inference — via row.option.{type, underlying, strike, expiration}. When
 *     that association cannot be established (row.option is null) for a
 *     resolution-class row on the same underlying, it REFUSES rather than
 *     assuming the event is unrelated.
 *   - NO REOPEN INFERENCE (Codex correction #1). A later same-series
 *     sell-to-open does NOT clear a prior resolution conflict. A subsequent
 *     opening does not prove the supplied projected subject represents that new
 *     opening, its quantity, or its lifecycle episode. Any exact-contract
 *     post-checkpoint resolution event makes the subject ambiguous, full stop.
 *     (Newer authoritative checkpoint supersession is handled by checkpoint
 *     scoping — a resolution on-or-before the checkpoint day is already outside
 *     scope — never by STO inference.)
 *   - FAIL CLOSED ON UNCERTAIN ORDERING (Codex correction #2). Activity dates
 *     are day-granularity. When the checkpoint is intraday and an Activity event
 *     falls on the SAME calendar day, the ordering relative to the checkpoint
 *     cannot be established, so the event is treated as potentially-relevant and
 *     included in the conflict scan (refuse), never excluded. Inability to order
 *     or associate is never converted into permission to continue.
 *
 * This guard is deliberately CONSERVATIVE: it prefers refusing a still-open
 * obligation over confidently evaluating a possibly-resolved one. Conservative
 * refusal is acceptable; unsupported inference is not.
 */

import type { ActivityRow } from "../csv/fidelity/activityParser";
import { parseOptionContract } from "../csv/fidelity/parseOptionContract";
import { parseCheckpoint } from "./activity-projection";
import type { LifecycleAmbiguity } from "../write-desk/short-obligation-consequences";
import type { ObligationSide } from "../write-desk/short-obligation-consequences";

/** The exact-contract key of the obligation under evaluation. */
export interface ObligationContractKey {
  side: ObligationSide;
  underlying: string;
  strike: number;
  expiration: string;
}

/** A resolution event type that RETIRES a short obligation. */
type ResolutionEventType =
  | "buy_to_close"
  | "expired"
  | "assigned"
  | "shares_sold_assignment"
  | "shares_bought_assignment";

const RESOLUTION_EVENTS: ReadonlySet<string> = new Set<ResolutionEventType>([
  "buy_to_close",
  "expired",
  "assigned",
  // "sold assigned calls" — downstream evidence of a CALL assignment resolving a
  // short-call obligation.
  "shares_sold_assignment",
  // "bought assigned puts" — downstream evidence of a PUT assignment resolving a
  // short-put obligation (Codex correction #2). Treated as ambiguity/refusal
  // evidence only — never used to reconstruct a replacement position.
  "shares_bought_assignment",
]);

/**
 * Detect whether an existing projected-open short obligation is lifecycle-ambiguous
 * given authoritative brokerage Activity and the Option Summary checkpoint.
 *
 * Determination:
 *   - Scope Activity to events that are NOT provably at-or-before the checkpoint.
 *     Day checkpoint: strictly-later calendar day is in scope. Intraday
 *     checkpoint: strictly-later day OR same calendar day (unorderable → in
 *     scope, fail closed). No checkpoint: everything in scope.
 *   - Within scope, any resolution-class event (buy_to_close / expired /
 *     assigned / shares_sold_assignment) that is exact-contract associated to
 *     the obligation → AMBIGUOUS (refuse). No reopen inference clears it.
 *   - Within scope, a resolution-class option row on the SAME underlying that
 *     cannot be exact-contract associated (row.option is null) → AMBIGUOUS
 *     (refuse rather than assume unrelated).
 *
 * Returns `{ ambiguous: false }` only when no such conflict is detected in scope.
 * This is the absence of a detected conflict, not a positive proof the obligation
 * is open — but it is the condition under which the evaluator may proceed.
 *
 * PURE and READ-ONLY: mutates no input, writes no state.
 */
export function detectLifecycleAmbiguity(
  obligation: ObligationContractKey,
  activityRows: readonly ActivityRow[],
  checkpointQuoteDate: string | null | undefined
): LifecycleAmbiguity {
  if (!activityRows || activityRows.length === 0) {
    return { ambiguous: false };
  }

  const checkpoint = parseCheckpoint(checkpointQuoteDate);
  const precision = checkpoint.precision;
  // Derive the checkpoint calendar day WITHOUT a UTC/local round-trip. Activity
  // dates are ISO YYYY-MM-DD (day granularity); comparing calendar-day strings
  // avoids inventing an intra-day ordering and avoids timezone skew.
  const checkpointCalendar = checkpointCalendarDay(checkpointQuoteDate, checkpoint.timestamp);

  const targetType = obligation.side === "put" ? "PUT" : "CALL";
  const underlying = obligation.underlying.toUpperCase();

  // Scan for a conflicting resolution. The FIRST conflict refuses — there is no
  // accumulation/clearing state (no reopen inference). Uncertainty that could
  // invalidate the obligation refuses unless the evidence can be established as
  // irrelevant (Codex correction #2).
  for (const row of activityRows) {
    if (!RESOLUTION_EVENTS.has(row.eventType)) continue;

    // Can this resolution-class row be established as UNRELATED to the obligation?
    // Only exact-contract identity or a provably-different exact contract/underlying
    // lets us safely exclude it. Anything less cannot exclude relevance.
    const relation = classifyContractRelation(row.option, row.symbol, targetType, underlying, obligation);
    if (relation === "unrelated") continue; // provably a different exact contract/underlying

    // From here the row is either an exact-contract match or its relevance cannot
    // be excluded (missing/partial identity). Both are conflict candidates.

    // Chronology: only events strictly after the checkpoint conflict. But a
    // MISSING/unusable date on a potentially-relevant resolution cannot be shown
    // to predate the checkpoint → refuse rather than silently drop it (Codex #2).
    const dateScope = chronologyScope(row.date, checkpointCalendar, precision);
    if (dateScope === "before") continue; // provably at/before checkpoint → out of scope
    // dateScope is "after" (conflicts) or "unknown" (cannot exclude → refuse).

    if (relation === "match") {
      return {
        ambiguous: true,
        conflictingEvent: normalizeConflictEvent(row.eventType),
        eventDate: row.date || "(date unknown)",
        note:
          `Authoritative post-checkpoint Activity contains an exact-contract ${row.eventType} ` +
          `${row.date ? `on ${row.date} ` : "with an unusable date "}that conflicts with the projected ` +
          "open obligation. The obligation may no longer exist (or its quantity/lifecycle may differ); " +
          "refusing HOLD/CLOSE evaluation. A later reopening does not clear this.",
      };
    }
    // relation === "unresolvable": a resolution-class event whose relevance to
    // this obligation cannot be excluded (no parsed contract, or same underlying
    // without exact identity, or an unusable date). Refuse rather than associate
    // or assume harmless (ADR-016).
    return {
      ambiguous: true,
      conflictingEvent: normalizeConflictEvent(row.eventType),
      eventDate: row.date || "(date unknown)",
      note:
        "A post-checkpoint option resolution event could not be established as unrelated to this " +
        "obligation without inference (missing contract identity, unresolved association, or an " +
        "unusable date). Refusing rather than assuming it is harmless (ADR-016).",
    };
  }

  return { ambiguous: false };
}

/**
 * Classify a resolution-class row's contract relation to the obligation:
 *   - "match":        exact-contract identity (side/underlying/strike/expiration).
 *   - "unrelated":    a DIFFERENT underlying is POSITIVELY established.
 *   - "unresolvable": relevance cannot be excluded — refuse.
 *
 * IRRELEVANCE MUST BE POSITIVELY ESTABLISHED (Codex correction #1). It is not
 * enough that a symbol string fails to contain the target underlying. A blank
 * symbol, an "UNKNOWN"/placeholder, a malformed/unrecognized symbol, or a mere
 * substring mismatch does NOT establish another underlying → "unresolvable".
 *
 * Positive other-underlying identity is established only by:
 *   - a parsed option contract whose underlying differs from the target; or
 *   - a row symbol that itself parses to a recognized option contract whose
 *     underlying differs from the target.
 * Only "unrelated" is safe to ignore.
 */
function classifyContractRelation(
  option: { type: "CALL" | "PUT"; underlying: string; strike: number; expiration: string } | null,
  rowSymbol: string,
  targetType: "PUT" | "CALL",
  underlying: string,
  obligation: ObligationContractKey
): "match" | "unrelated" | "unresolvable" {
  if (option != null) {
    const sameContract =
      option.type === targetType &&
      option.underlying.toUpperCase() === underlying &&
      option.strike === obligation.strike &&
      option.expiration === obligation.expiration;
    // A parsed contract authoritatively names its underlying; a different one is
    // positively a different instrument.
    return sameContract ? "match" : "unrelated";
  }
  // No parsed contract on the row. Attempt POSITIVE identification of the symbol
  // as a recognized option contract. Only a recognized contract for a DIFFERENT
  // underlying establishes irrelevance; anything else is unresolvable → refuse.
  const parsed = parseOptionContract((rowSymbol ?? "").trim());
  if (parsed && parsed.underlying.toUpperCase() !== underlying) {
    return "unrelated";
  }
  // Blank, placeholder ("UNKNOWN"), malformed/unrecognized, or a recognized
  // contract that IS this underlying but without a parsed option on the row:
  // relevance cannot be excluded → refuse.
  return "unresolvable";
}

// --- helpers (pure) ---

/** Map a raw resolution eventType to the reported conflicting-event enum. */
function normalizeConflictEvent(eventType: string): "buy_to_close" | "expired" | "assigned" {
  if (eventType === "buy_to_close") return "buy_to_close";
  if (eventType === "expired") return "expired";
  // "assigned" and "shares_sold_assignment" both report as assigned-class.
  return "assigned";
}

/**
 * Classify an Activity date's chronology relative to the checkpoint:
 *   - "before":  provably at/before the checkpoint → out of scope (safe to skip).
 *   - "after":   provably after the checkpoint → in scope (conflicts).
 *   - "unknown": ordering cannot be established → cannot exclude relevance →
 *                refuse (Codex correction #2). This covers a MISSING/unusable
 *                Activity date, and a same-calendar-day event under an intraday
 *                checkpoint (day-granularity cannot be ordered intra-day).
 *
 * Fails closed: a potentially-relevant resolution with no usable date can never
 * be shown to predate the checkpoint, so it is "unknown", never "before".
 */
function chronologyScope(
  activityDate: string,
  checkpointCalendar: string,
  precision: "day" | "intraday" | "none"
): "before" | "after" | "unknown" {
  if (precision === "none") return "after"; // no checkpoint → everything is in scope
  if (!checkpointCalendar) return "after";
  // Validate the Activity date to a REAL calendar day BEFORE any comparison
  // (Codex correction #2). Missing / malformed / unparsable / impossible dates
  // are not safely orderable → "unknown" → refuse. NEVER fall back to raw string
  // comparison (that is what let "01/not-a-date" masquerade as an early date).
  const day = validCalendarDay(activityDate);
  if (day == null) return "unknown";
  if (precision === "intraday") {
    // Same-day cannot be ordered against an intraday checkpoint → unknown.
    if (day === checkpointCalendar) return "unknown";
    return day > checkpointCalendar ? "after" : "before";
  }
  // "day" precision: the checkpoint day is authoritative for itself.
  if (day > checkpointCalendar) return "after";
  return "before";
}

/**
 * Return a strictly-validated calendar day (YYYY-MM-DD) for an Activity date, or
 * null when it cannot be established as a real, orderable calendar date. Requires
 * an extractable YYYY-MM-DD whose month/day are in range AND which round-trips
 * through Date without normalization drift (so impossible dates like 2026-02-30
 * are rejected rather than silently rolled over).
 */
function validCalendarDay(raw: string | null | undefined): string | null {
  const day = extractCalendarDay(raw);
  if (!day) return null;
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const dom = Number(m[3]);
  if (month < 1 || month > 12 || dom < 1 || dom > 31) return null;
  // Round-trip guard: reject impossible dates (Date would roll them over).
  const d = new Date(Date.UTC(year, month - 1, dom));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== dom) {
    return null;
  }
  return day;
}

/**
 * Determine the checkpoint's calendar day (YYYY-MM-DD) for day-granularity
 * comparison against Activity dates.
 *
 * We prefer parsing the calendar day directly out of the raw quoteDate string so
 * we never round-trip through a `Date` (which would introduce UTC/local skew for
 * a bare "YYYY-MM-DD" checkpoint and could shift the day). Only when the raw
 * string has no extractable calendar day do we fall back to a UTC read of the
 * parsed timestamp — deterministic and never inventing an intra-day ordering.
 */
function checkpointCalendarDay(raw: string | null | undefined, parsed: Date): string {
  const fromRaw = extractCalendarDay(raw);
  if (fromRaw) return fromRaw;
  if (isNaN(parsed.getTime())) return "";
  // UTC read (stable, no local-offset skew).
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Extract a YYYY-MM-DD calendar day from common Fidelity date strings, or null. */
function extractCalendarDay(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // ISO YYYY-MM-DD (optionally with time) → take the date portion.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // MM/DD/YYYY or MM-DD-YYYY.
  const us = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (us) return `${us[3]}-${us[1]}-${us[2]}`;
  // "Aug 12, 2026" style.
  const named = s.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const mm = months[named[1].toLowerCase().slice(0, 3)];
    if (mm) return `${named[3]}-${mm}-${String(parseInt(named[2], 10)).padStart(2, "0")}`;
  }
  return null;
}
