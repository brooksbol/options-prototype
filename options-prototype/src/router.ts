/**
 * Lightweight path-based router.
 *
 * No dependencies. Uses native browser pathname + popstate.
 * Supports direct navigation, redirects, browser history, and refresh.
 *
 * Routes:
 *   /             → Operator Console (home)
 *   /app          → Operator Console (home)
 *   /app/write    → operational/recommendation surface
 *   /engineering/* → subordinate engineering instruments
 *   anything else → Operator Console (home)
 */

export type AppRoute = "operator-console" | "write-desk" | "production" | "kreature" | "engineering" | "sparkline-gallery";

/**
 * Determine the current route from the browser pathname.
 */
export function resolveRoute(): AppRoute {
  const path = window.location.pathname;

  // Kreature — temporal observation surface
  if (path === "/app/kreature") {
    return "kreature";
  }

  // Operational/recommendation surface
  if (path === "/app/write") {
    return "write-desk";
  }

  // Production assessment
  if (path === "/app/production") {
    return "production";
  }

  // Sparkline gallery (temporary UX experiment)
  if (path === "/app/sparkline-gallery") {
    return "sparkline-gallery";
  }

  // Subordinate engineering instruments (outside operator navigation)
  if (path.startsWith("/engineering")) {
    return "engineering";
  }

  // Everything else → Operator Console (home)
  return "operator-console";
}

/**
 * Navigate to a route programmatically.
 * Pushes to browser history so back/forward work.
 */
export function navigateTo(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
