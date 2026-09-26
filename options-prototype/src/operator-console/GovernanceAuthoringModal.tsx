/**
 * GovernanceAuthoringModal — the explicit, authority-bearing governance act
 * (Candidate B, Correction 1).
 *
 * Establishing governance is a deliberate, durable act — NOT a per-row display toggle.
 * The operator explicitly asserts: the governed scope, the ratified Wheel program +
 * configuration, the accepted call-away stance, and the tri-state gates. Nothing here is
 * inferred from ownership, covered-call geometry, ticker, buy-write origin, or a WHEEL
 * label; the operator must supply authorizing values, which are stamped with
 * `operator-governance` provenance.
 *
 * It also authorizes the explicit Subject->scope association so the governed scope actually
 * reaches the subject. Without that association the evaluator remains UNRESOLVED.
 *
 * This is intentionally a bounded governance form, not a generalized policy editor.
 */

import { useState } from "react";
import type { GateState, CallAwayStance } from "../governed-decision/types";
import { writeGovernedContext, writeSubjectScopeAssociation } from "../governed-decision/client";
import "./governance-authoring-modal.css";

interface Props {
  brokerageAccountId: string;
  /** The subject the operator is governing (its stable id + human label). */
  subjectId: string;
  subjectLabel: string;
  onClose: () => void;
  onAuthored: () => void;
}

export function GovernanceAuthoringModal({
  brokerageAccountId,
  subjectId,
  subjectLabel,
  onClose,
  onAuthored,
}: Props) {
  const [governedScopeId, setGovernedScopeId] = useState("");
  const [configVersion, setConfigVersion] = useState("1");
  const [callAwayStance, setCallAwayStance] = useState<CallAwayStance>("unknown");
  const [eligibilityGate, setEligibilityGate] = useState<GateState>("UNKNOWN");
  const [interventionGate, setInterventionGate] = useState<GateState>("UNKNOWN");
  const [noWriteGate, setNoWriteGate] = useState<GateState>("UNKNOWN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const effectiveFrom = new Date().toISOString();
    const ctx = await writeGovernedContext({
      brokerageAccountId,
      governedScopeId: governedScopeId.trim(),
      program: { program: "assignment-centric-wheel", configVersion: configVersion.trim() },
      callAwayStance,
      eligibilityGate,
      interventionGate,
      noWriteGate,
      authorityProvenance: "operator-governance",
      effectiveFrom,
    });
    if (!ctx.ok) {
      setBusy(false);
      setError(ctx.error ?? (ctx.violations ?? []).join("; ") ?? "governance rejected");
      return;
    }
    const assoc = await writeSubjectScopeAssociation({
      brokerageAccountId,
      subjectId,
      governedScopeId: governedScopeId.trim(),
      provenance: "operator-governance",
      effectiveFrom,
    });
    setBusy(false);
    if (!assoc.ok) {
      setError(assoc.error ?? "association rejected");
      return;
    }
    onAuthored();
    onClose();
  };

  return (
    <div className="gam-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gam-panel" onClick={(e) => e.stopPropagation()}>
        <header className="gam-header">
          <h2>Establish governance</h2>
          <button className="gam-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <p className="gam-notice">
          You are durably establishing governance for <strong>{subjectLabel}</strong>. This is a
          recorded, versioned governance act — not a display setting. Missing values remain
          <code> UNKNOWN</code> and fail closed to <code>UNRESOLVED</code>.
        </p>

        <label className="gam-field">
          <span>Governed scope id</span>
          <input
            type="text"
            value={governedScopeId}
            placeholder="e.g. wheel-GDXJ-2026Q3"
            onChange={(e) => setGovernedScopeId(e.target.value)}
          />
        </label>

        <label className="gam-field">
          <span>Program</span>
          <input type="text" value="assignment-centric-wheel" disabled />
        </label>

        <label className="gam-field">
          <span>Configuration version</span>
          <input type="text" value={configVersion} onChange={(e) => setConfigVersion(e.target.value)} />
        </label>

        <label className="gam-field">
          <span>Call-away stance</span>
          <select value={callAwayStance} onChange={(e) => setCallAwayStance(e.target.value as CallAwayStance)}>
            <option value="unknown">unknown (fails closed)</option>
            <option value="accepted">accepted</option>
          </select>
        </label>

        <GateSelect label="Eligibility gate" value={eligibilityGate} onChange={setEligibilityGate} />
        <GateSelect label="Intervention gate" value={interventionGate} onChange={setInterventionGate} />
        <GateSelect label="No-write gate" value={noWriteGate} onChange={setNoWriteGate} />

        {error && <p className="gam-error">{error}</p>}

        <div className="gam-actions">
          <button className="gam-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="gam-submit" onClick={submit} disabled={busy || governedScopeId.trim() === ""}>
            {busy ? "Recording…" : "Record governance"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GateSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: GateState;
  onChange: (g: GateState) => void;
}) {
  return (
    <label className="gam-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as GateState)}>
        <option value="UNKNOWN">UNKNOWN (fails closed)</option>
        <option value="CLEAR">CLEAR</option>
        <option value="ACTIVE">ACTIVE (fails closed)</option>
      </select>
    </label>
  );
}
