/**
 * Shared "Show" filter semantics for deployment-page candidate tables.
 *
 * A show-count of `null` means "-" = show all / unlimited (no cap on displayed
 * rows). A numeric value caps the number of displayed rows.
 *
 * The control is rendered as a text input (not a number spinner) so it can
 * display the "-" sentinel: clearing the field, or entering "-", reverts to
 * unlimited rather than snapping to 0.
 */

/** The sentinel string shown in the input when the count is unlimited. */
export const SHOW_ALL_TOKEN = "-";

/** Value to display in the Show input for a given show-count. */
export function showCountInputValue(count: number | null): string {
  return count == null ? SHOW_ALL_TOKEN : String(count);
}

/**
 * Parse raw input text into a show-count.
 *
 * - Empty, "-", or non-numeric → null (all / unlimited).
 * - A numeric value is clamped to [0, max].
 */
export function parseShowCountInput(raw: string, max: number): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === SHOW_ALL_TOKEN) return null;
  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.min(max, parsed));
}

/**
 * Apply a show-count to a candidate list.
 * null (unlimited) returns the list unchanged; a number slices to that many.
 */
export function applyShowCount<T>(items: T[], count: number | null): T[] {
  return count == null ? items : items.slice(0, count);
}

/** Number of rows that will be displayed for a given list length and show-count. */
export function displayedCount(total: number, count: number | null): number {
  return count == null ? total : Math.min(total, count);
}
