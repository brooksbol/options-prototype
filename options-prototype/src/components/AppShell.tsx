/**
 * Application Shell — shared operating context for all Wheelwright operator surfaces.
 *
 * Provides:
 *   - Application identity
 *   - Primary navigation (Console / Deployment / Production)
 *   - Active-surface indication
 *   - Session classification (wall-clock-driven)
 *   - Persistent portfolio capital context (capital-state triad)
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
import { usePortfolio } from "../portfolio/use-portfolio";
import { deriveShellCapitalContext } from "../portfolio/shell-capital-context";
import { navigateTo } from "../router";
import type { AppRoute } from "../router";
import { HeaderPortfolioStatus } from "./HeaderPortfolioStatus";
import { PortfolioTrajectoryChart } from "./PortfolioTrajectoryChart";
import "./app-shell.css";

interface AppShellProps {
  route: AppRoute;
  children: ReactNode;
}

export function AppShell({ route, children }: AppShellProps) {
  const session = useSessionClassification();
  const { readiness: tierReadiness, error: tierError } = useOpeningReadiness(true);
  const { snapshot } = usePortfolio();

  // Capital-state triad — persistent portfolio context
  const capitalContext = snapshot ? deriveShellCapitalContext(snapshot) : null;

  return (
    <div className="app-shell" data-route={route}>
      <div className="as-chrome">
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

        <div className="as-spacer" />
      </header>

        <PortfolioTrajectoryChart
          capitalContext={capitalContext}
          tierReadiness={tierReadiness}
          tierError={tierError}
          sessionState={session.state}
        />
      </div>

      <div className="as-body">
        {children}
      </div>
    </div>
  );
}

/** Format a dollar amount compactly: $119,960 → "119.9K", $42,500 → "42.5K", $1,200 → "1,200" */
function formatCompact(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
