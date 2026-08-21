/**
 * Application Shell — shared operating context for all Wheelwright operator surfaces.
 *
 * Provides:
 *   - Application identity
 *   - Primary navigation (Console / Deployment / Production)
 *   - Active-surface indication
 *   - Session classification (wall-clock-driven)
 *   - Global portfolio status + Fidelity upload (application-level concern)
 *
 * Does NOT own:
 *   - Evidence polling or acquisition
 *   - Detailed evidence status
 *   - Surface-specific layout or content
 */

import type { ReactNode } from "react";
import { useSessionClassification } from "../hooks/useSessionClassification";
import { useOpeningReadiness } from "../hooks/useOpeningReadiness";
import { navigateTo } from "../router";
import type { AppRoute } from "../router";
import { HeaderPortfolioStatus } from "./HeaderPortfolioStatus";
import { TierReadinessIndicator } from "./TierReadinessIndicator";
import "./app-shell.css";

interface AppShellProps {
  route: AppRoute;
  children: ReactNode;
}

function formatSessionState(state: string): string {
  switch (state) {
    case "PREMARKET": return "Pre-Market";
    case "REGULAR_OPEN_DELAY": return "Open Delay";
    case "REGULAR_OBSERVATION": return "Regular Session";
    case "DELAY_DRAIN": return "Closing";
    case "CLOSED_CANONICAL": return "Closed";
    case "NON_TRADING_DAY": return "Market Closed";
    default: return state;
  }
}

export function AppShell({ route, children }: AppShellProps) {
  const session = useSessionClassification();
  const { readiness: tierReadiness, error: tierError } = useOpeningReadiness(true);

  return (
    <div className="app-shell">
      <header className="as-header">
        <h1 className="as-title">Wheelwright</h1>

        <nav className="as-nav">
          <button
            className="as-nav-link"
            aria-current={route === "operator-console" ? "page" : undefined}
            onClick={() => navigateTo("/")}
          >
            Console
          </button>
          <button
            className="as-nav-link"
            aria-current={route === "write-desk" ? "page" : undefined}
            onClick={() => navigateTo("/app/write")}
          >
            Deployment
          </button>
          <button
            className="as-nav-link"
            aria-current={route === "production" ? "page" : undefined}
            onClick={() => navigateTo("/app/production")}
          >
            Production
          </button>
        </nav>

        <HeaderPortfolioStatus />

        <TierReadinessIndicator readiness={tierReadiness} error={tierError} />

        <div className="as-spacer" />

        <span className="as-session">
          <span className={`as-session-pip as-session-${session.state.toLowerCase()}`} />
          <span>{formatSessionState(session.state)}</span>
        </span>
      </header>

      <div className="as-body">
        {children}
      </div>
    </div>
  );
}
