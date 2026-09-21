/**
 * Header Portfolio Status — the lightweight account-management surface.
 *
 * Lives in the global AppShell header. The Portfolio dropdown is the ONE place the operator
 * manages Fidelity accounts (no separate account screen):
 *   - Source (Demo / Fidelity)
 *   - Accounts: add, select/switch, rename, remove — all account-local
 *   - Upload / refresh Fidelity CSVs for the SELECTED account
 *   - Compact snapshot provenance for the active account
 *
 * Accounts are created EXPLICITLY (Add account); external Fidelity identity is bound later by
 * the first unambiguous import. Selection expresses intent; evidence establishes identity.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import {
  selectPortfolioSource,
  switchToAccount,
  createAccount,
  renameAccount,
  removeAccount,
} from "../portfolio/portfolio-store";
import { useAccounts } from "../portfolio/use-accounts";
import { FidelityUploadCompact } from "./FidelityUploadCompact";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";

export function HeaderPortfolioStatus() {
  const { source, snapshot, importStatus } = usePortfolio();
  const { accounts, activeBrokerageAccountId } = useAccounts();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
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
    // No-op: the account-aware uploader publishes through the store; the header re-renders
    // from usePortfolio(). See Increment 6.
  }, []);

  // Switch the active BrokerageAccount (no import). The store reloads that account's
  // account-local snapshot and every consumer re-renders through usePortfolio().
  const handleSwitchAccount = useCallback((brokerageAccountId: string) => {
    switchToAccount(brokerageAccountId);
  }, []);

  // --- Add ---
  const handleAddAccount = useCallback(() => {
    const name = newAccountName.trim();
    const created = createAccount(name || "New account");
    // Select it immediately so uploads target it.
    switchToAccount(created.brokerageAccountId);
    setAddingAccount(false);
    setNewAccountName("");
  }, [newAccountName]);

  // --- Rename ---
  const startRename = useCallback((brokerageAccountId: string, currentName: string) => {
    setRenamingId(brokerageAccountId);
    setRenameInput(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId) {
      const name = renameInput.trim();
      if (name) renameAccount(renamingId, name);
    }
    setRenamingId(null);
    setRenameInput("");
  }, [renamingId, renameInput]);

  // --- Remove (with confirmation) ---
  const handleConfirmRemove = useCallback((brokerageAccountId: string) => {
    removeAccount(brokerageAccountId);
    setConfirmRemoveId(null);
  }, []);

  // Derive compact status text
  const statusLabel = source === "demo" ? "Demo" : "Fidelity";
  const isReady = snapshot?.readiness.status === "READY";
  const snapshotDate = snapshot?.snapshotDate ?? null;
  const exportTimestamp = importStatus.optionSummary?.exportTimestamp ?? null;
  const activeAccount = accounts.find((a) => a.brokerageAccountId === activeBrokerageAccountId) ?? null;

  return (
    <div className="as-portfolio" ref={dropdownRef}>
      <button
        className={`as-portfolio-trigger${isReady ? " as-portfolio-ready" : ""}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-label="Portfolio status and upload"
      >
        <span className={`as-portfolio-pip${isReady ? " as-pip-ready" : source === "fidelity" ? " as-pip-fidelity" : ""}`} />
        <span className="as-portfolio-label">
          {source === "demo" ? "Demo" : activeAccount ? activeAccount.displayName : (accounts.length > 0 ? "Select account" : statusLabel)}
        </span>
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

          {/* Accounts management (Fidelity mode): add / select / rename / remove. */}
          {source === "fidelity" && (
            <div className="as-dropdown-section as-dropdown-accounts">
              <span className="as-dropdown-label">Accounts</span>
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
                    ) : confirmRemoveId === a.brokerageAccountId ? (
                      <div className="as-account-confirm">
                        <span className="as-account-confirm-text">Remove “{a.displayName}”?</span>
                        <button
                          className="as-account-confirm-yes"
                          onClick={() => handleConfirmRemove(a.brokerageAccountId)}
                          aria-label={`Confirm remove ${a.displayName}`}
                        >
                          Remove
                        </button>
                        <button
                          className="as-account-confirm-no"
                          onClick={() => setConfirmRemoveId(null)}
                          aria-label="Cancel remove"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className={`as-account-btn${a.brokerageAccountId === activeBrokerageAccountId ? " as-account-active" : ""}`}
                          onClick={() => handleSwitchAccount(a.brokerageAccountId)}
                          aria-pressed={a.brokerageAccountId === activeBrokerageAccountId}
                          title={a.externalAccountRef ?? "No Fidelity account linked yet"}
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
                        <button
                          className="as-account-remove"
                          onClick={() => setConfirmRemoveId(a.brokerageAccountId)}
                          aria-label={`Remove ${a.displayName}`}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add account */}
              {addingAccount ? (
                <div className="as-account-add-row">
                  <input
                    className="as-account-rename-input"
                    value={newAccountName}
                    autoFocus
                    placeholder="Account name (e.g. PTS)"
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddAccount();
                      if (e.key === "Escape") { setAddingAccount(false); setNewAccountName(""); }
                    }}
                    aria-label="New account name"
                  />
                  <button className="as-account-add-confirm" onClick={handleAddAccount} aria-label="Create account">Add</button>
                </div>
              ) : (
                <button
                  className="as-account-add"
                  onClick={() => setAddingAccount(true)}
                  aria-label="Add account"
                >
                  + Add account
                </button>
              )}
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

          {/* Upload / refresh CSVs for the SELECTED account (Fidelity mode). When a real
              account is active, uploads target it explicitly (fail-closed identity binding). */}
          {source === "fidelity" && (
            <div className="as-dropdown-section">
              <span className="as-dropdown-label">
                {activeAccount ? `Upload / refresh CSVs — ${activeAccount.displayName}` : "Upload CSVs"}
              </span>
              {activeAccount ? (
                <FidelityUploadCompact
                  key={activeAccount.brokerageAccountId}
                  onSnapshotChange={handleSnapshotChange}
                  targetBrokerageAccountId={activeAccount.brokerageAccountId}
                  targetAccountName={activeAccount.displayName}
                />
              ) : (
                <div className="as-account-empty-hint">
                  {accounts.length > 0 ? "Select an account to upload CSVs." : "Add an account to upload CSVs."}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
