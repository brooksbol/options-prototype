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
import { selectPortfolioSource, switchToAccount } from "../portfolio/portfolio-store";
import { useAccounts } from "../portfolio/use-accounts";
import { updateAccount } from "../portfolio/brokerage-account-registry";
import { FidelityUploadCompact } from "./FidelityUploadCompact";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";

export function HeaderPortfolioStatus() {
  const { source, snapshot, importStatus } = usePortfolio();
  const { accounts, activeBrokerageAccountId } = useAccounts();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
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

  const handleSnapshotChange = useCallback((_newSnapshot: PortfolioSnapshot | null) => {
    // No-op (Increment 6): the account-aware uploader publishes through
    // importFidelityEvidence, which already sets the store snapshot and records the
    // account-local capital observation. Re-calling setPortfolio here would double-record
    // the observation and redundantly rewrite writeDeskSource. HeaderPortfolioStatus
    // re-renders from the store via usePortfolio(); nothing further is needed here.
  }, []);

  // Switch the active BrokerageAccount (no import). The store reloads that account's
  // account-local snapshot and every consumer re-renders through usePortfolio().
  const handleSwitchAccount = useCallback((brokerageAccountId: string) => {
    switchToAccount(brokerageAccountId);
  }, []);

  const startRename = useCallback((brokerageAccountId: string, currentName: string) => {
    setRenamingId(brokerageAccountId);
    setRenameInput(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId) {
      const name = renameInput.trim();
      if (name) updateAccount(renamingId, { displayName: name });
    }
    setRenamingId(null);
    setRenameInput("");
  }, [renamingId, renameInput]);

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

          {/* Account picker (Fidelity mode, ≥1 account). Switching is import-free: it loads
              the selected account's own account-local state. */}
          {source === "fidelity" && accounts.length > 0 && (
            <div className="as-dropdown-section as-dropdown-accounts">
              <span className="as-dropdown-label">Account</span>
              <div className="as-account-list">
                {accounts.map((a) => (
                  <div key={a.brokerageAccountId} className="as-account-row">
                    {renamingId === a.brokerageAccountId ? (
                      <input
                        className="as-account-rename-input"
                        value={renameInput}
                        autoFocus
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") { setRenamingId(null); setRenameInput(""); }
                        }}
                        aria-label={`Rename account ${a.displayName}`}
                      />
                    ) : (
                      <>
                        <button
                          className={`as-account-btn${a.brokerageAccountId === activeBrokerageAccountId ? " as-account-active" : ""}`}
                          onClick={() => handleSwitchAccount(a.brokerageAccountId)}
                          aria-pressed={a.brokerageAccountId === activeBrokerageAccountId}
                          title={a.externalAccountRef ?? undefined}
                        >
                          {a.brokerageAccountId === activeBrokerageAccountId && (
                            <span className="as-account-check" aria-hidden="true">✓ </span>
                          )}
                          {a.displayName}
                        </button>
                        <button
                          className="as-account-rename"
                          onClick={() => startRename(a.brokerageAccountId, a.displayName)}
                          aria-label={`Rename ${a.displayName}`}
                          title="Rename"
                        >
                          ✎
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
