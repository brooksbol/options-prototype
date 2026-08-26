/**
 * Kreature Page — TEMPORARILY DISABLED
 * 
 * The Field experiment caused page crashes during active market sessions
 * due to full-universe data processing on the main thread.
 * Disabled until performance architecture is resolved.
 */

import "./kreature.css";

export function KreaturePage() {
  return (
    <div className="kr-page" style={{ padding: "40px 20px", textAlign: "center" }}>
      <h2 className="kr-title">Kreature</h2>
      <p style={{ color: "var(--wd-text-disabled)", marginTop: "20px" }}>
        Temporarily disabled during market hours while performance issues are resolved.
      </p>
      <p style={{ color: "var(--wd-text-disabled)", fontSize: "11px" }}>
        Use Console, Deployment, or Production.
      </p>
    </div>
  );
}
