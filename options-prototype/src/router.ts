/**
 * Lightweight path-based router.
 *
 * No dependencies. Uses native browser pathname + popstate.
 * Supports direct navigation, redirects, browser history, and refresh.
 *
 * Routes:
 *   /app/write  → operational application
 *   /app        → redirect to /app/write
 *   /           → redirect to /app/write
 *   /labs/*     → existing lab application (unchanged)
 *   anything else → existing lab application (backward compat)
 */

export type AppRoute = "write-desk" | "labs";

/**
 * Determine the current route from the browser pathname.
 * Performs redirects via history.replaceState (no page reload).
 */
export function resolveRoute(): AppRoute {
  const path = window.location.pathname;

  // Exact match for the operational application
  if (path === "/app/write") {
    return "write-desk";
  }

  // Redirect /app to /app/write
  if (path === "/app" || path === "/app/") {
    window.history.replaceState(null, "", "/app/write");
    return "write-desk";
  }

  // Redirect root to /app/write
  if (path === "/" || path === "") {
    window.history.replaceState(null, "", "/app/write");
    return "write-desk";
  }

  // Everything else → labs (existing app, unchanged)
  return "labs";
}

/**
 * Navigate to a route programmatically.
 * Pushes to browser history so back/forward work.
 */
export function navigateTo(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
