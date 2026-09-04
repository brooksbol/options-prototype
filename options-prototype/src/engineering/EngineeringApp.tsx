import { CsvDiagnostics } from "../components/CsvImportLab";
import { ScenarioReplay } from "../components/ScenarioReplay";
import { UniverseView } from "../components/UniverseView";
import "../App.css";

type EngineeringInstrument = "universe" | "csv" | "scenario-replay";

function resolveInstrument(pathname: string): EngineeringInstrument {
  if (pathname.startsWith("/engineering/csv")) return "csv";
  if (pathname.startsWith("/engineering/scenario-replay")) return "scenario-replay";
  return "universe";
}

/**
 * Subordinate engineering host. These instruments inspect shared/domain
 * capabilities but are not operator surfaces and are not operator navigation.
 */
export function EngineeringApp() {
  const instrument = resolveInstrument(window.location.pathname);

  return (
    <div className="console">
      <header className="console-header">
        <div>
          <h1>Wheelwright Engineering</h1>
          <p className="engineering-boundary-note">Internal inspection and deterministic research instruments</p>
        </div>
        <nav className="console-tabs" aria-label="Engineering instruments">
          <a className={`tab-btn ${instrument === "universe" ? "tab-active" : ""}`} href="/engineering/universe">
            Universe Inspection
          </a>
          <a className={`tab-btn ${instrument === "csv" ? "tab-active" : ""}`} href="/engineering/csv">
            CSV Diagnostics
          </a>
          <a className={`tab-btn ${instrument === "scenario-replay" ? "tab-active" : ""}`} href="/engineering/scenario-replay">
            Scenario Replay
          </a>
        </nav>
      </header>

      {instrument === "csv" ? <CsvDiagnostics /> : instrument === "scenario-replay" ? <ScenarioReplay /> : <UniverseView />}
    </div>
  );
}
