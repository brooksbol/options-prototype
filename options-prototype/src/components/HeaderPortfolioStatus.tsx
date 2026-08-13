/**
 * Header Portfolio Status — Compact Fidelity snapshot info + upload dropdown.
 *
 * Lives in the global AppShell header. Provides:
 *   - Current portfolio source indicator
 *   - Snapshot freshness/provenance (compact)
 *   - Upload controls behind a dropdown menu
 *
 * This makes Fidelity portfolio evidence an application-level concern
 * rather than something each page manages independently.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import { setPortfolio, selectPortfolioSource } from "../portfolio/portfolio-store";
import { FidelityUploadCompact } from "./FidelityUploadCompact";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";

export function HeaderPortfolioStatus() {
  const { source, snapshot, importStatus } = usePortfolio();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleSourceChange = useCallback((newSource: PortfolioSourceType) => {
    selectPortfolioSource(newSource);
  }, []);

  const handleSnapshotChange = useCallback((newSnapshot: PortfolioSnapshot | null) => {
    if (newSnapshot) {
      setPortfolio("fidelity", newSnapshot);
    }
  }, []);

  // Derive compact status text
  const statusLabel = source === "demo" ? "Demo" : "Fidelity";
  const isReady = snapshot?.readiness.status === "READY";
  const snapshotDate = snapshot?.snapshotDate ?? null;
  const exportTimestamp = importStatus.optionSummary?.exportTimestamp ?? null;

  return (
    <div className="as-portfolio" ref={dropdownRef}>
      <button
        className={`as-portfolio-trigger${isReady ? " as-portfolio-ready" : ""}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-label="Portfolio status and upload"
      >
        <span className={`as-portfolio-pip${isReady ? " as-pip-ready" : source === "fidelity" ? " as-pip-fidelity" : ""}`} />
        <span className="as-portfolio-label">{statusLabel}</span>
        {isReady && snapshot.deployableCash != null && (
          <span className="as-portfolio-cash">${snapshot.deployableCash.toLocaleString()}</span>
        )}
        {isReady && exportTimestamp && (
          <span className="as-portfolio-freshness">{exportTimestamp}</span>
        )}
        {source === "fidelity" && !isReady && (
          <span className="as-portfolio-hint">No data</span>
        )}
        <span className="as-portfolio-chevron">{dropdownOpen ? "▴" : "▾"}</span>
      </button>

      {dropdownOpen && (
        <div className="as-portfolio-dropdown">
          {/* Source selector */}
          <div className="as-dropdown-section">
            <span className="as-dropdown-label">Source</span>
            <div className="as-dropdown-row">
              <button
                className={`as-source-btn${source === "demo" ? " as-source-active" : ""}`}
                onClick={() => handleSourceChange("demo")}
              >
                Demo
              </button>
              <button
                className={`as-source-btn${source === "fidelity" ? " as-source-active" : ""}`}
                onClick={() => handleSourceChange("fidelity")}
              >
                Fidelity
              </button>
            </div>
          </div>

          {/* Snapshot provenance (when ready) */}
          {isReady && (
            <div className="as-dropdown-section as-dropdown-provenance">
              <span className="as-dropdown-label">Snapshot</span>
              {snapshotDate && <div className="as-prov-row"><span className="as-prov-key">Date</span><span className="as-prov-val">{snapshotDate}</span></div>}
              {exportTimestamp && <div className="as-prov-row"><span className="as-prov-key">Export</span><span className="as-prov-val">{exportTimestamp}</span></div>}
              <div className="as-prov-row"><span className="as-prov-key">Source</span><span className="as-prov-val">{snapshot.provenance.sourceLabel}</span></div>
              {snapshot.deployableCash != null && <div className="as-prov-row"><span className="as-prov-key">Deployable</span><span className="as-prov-val">${snapshot.deployableCash.toLocaleString()}</span></div>}
              <div className="as-prov-row"><span className="as-prov-key">Positions</span><span className="as-prov-val">{snapshot.existingPuts.length} puts · {snapshot.inventory.length} equity</span></div>
            </div>
          )}

          {/* Upload controls (Fidelity mode) */}
          {source === "fidelity" && (
            <div className="as-dropdown-section">
              <span className="as-dropdown-label">Upload CSVs</span>
              <FidelityUploadCompact onSnapshotChange={handleSnapshotChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
