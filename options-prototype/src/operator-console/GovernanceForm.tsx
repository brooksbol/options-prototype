/**
 * GovernanceForm — the explicit, authority-bearing governance act (Candidate B, Correction 1),
 * extracted from the former standalone GovernanceAuthoringModal so the single governed
 * Recommendation drawer can own both inspection AND governance establishment/update.
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
 * Versioning discipline (unchanged): each submission writes a governed Context Version via
 * the backend, which is append-only. An update therefore creates a SUCCESSOR immutable
 * Context Version; historical governance and Decision replay are never mutated.
 *
 * This is intentionally a bounded governance form, not a generalized policy editor. The
 * full operator-facing setup/configuration experience remains PL-SETUP-01 (design only).
 */

import { useState } from "react";
import type { GateState, CallAwayStance } from "../governed-decision/types";
import { writeGovernedContext, writeSubjectScopeAssociation } from "../governed-decision/client";
import "./governance-form.css";

interface Props {
  brokerageAccountId: string;
  /** The subject the operator is governing (its stable id + human label). */
  subjectId: string;
  subjectLabel: string;
  /** True when governance already exists for the subject (drawer shows "amend" framing). */
  amend?: boolean;
  /** Called after a successful governed Context Version + association write. */
  onAuthored: () => void;
}

export function GovernanceForm({
  brokerageAccountId,
  subjectId,
  subjectLabel,
  amend = false,
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
  };

  return (
    <section className="gf" aria-label="Establish or update governance">
      <h3 className="gf-title">{amend ? "Amend governance" : "Establish governance"}</h3>
      <p className="gf-notice">
        You are durably {amend ? "updating" : "establishing"} governance for <strong>{subjectLabel}</strong>.
        This records a new versioned governance act — it never rewrites history. Missing values remain
        <code> UNKNOWN</code> and fail closed to <code>UNRESOLVED</code>.
      </p>

      <label className="gf-field">
        <span>Governed scope id</span>
        <input
          type="text"
          value={governedScopeId}
          placeholder="e.g. wheel-GDXJ-2026Q3"
          onChange={(e) => setGovernedScopeId(e.target.value)}
        />
      </label>

      <label className="gf-field">
        <span>Program</span>
        <input type="text" value="assignment-centric-wheel" disabled />
      </label>

      <label className="gf-field">
        <span>Configuration version</span>
        <input type="text" value={configVersion} onChange={(e) => setConfigVersion(e.target.value)} />
      </label>

      <label className="gf-field">
        <span>Call-away stance</span>
        <select value={callAwayStance} onChange={(e) => setCallAwayStance(e.target.value as CallAwayStance)}>
          <option value="unknown">unknown (fails closed)</option>
          <option value="accepted">accepted</option>
        </select>
      </label>

      <GateSelect label="Eligibility gate" value={eligibilityGate} onChange={setEligibilityGate} />
      <GateSelect label="Intervention gate" value={interventionGate} onChange={setInterventionGate} />
      <GateSelect label="No-write gate" value={noWriteGate} onChange={setNoWriteGate} />

      {error && <p className="gf-error">{error}</p>}

      <div className="gf-actions">
        <button className="gf-submit" onClick={submit} disabled={busy || governedScopeId.trim() === ""}>
          {busy ? "Recording…" : amend ? "Record new version" : "Record governance"}
        </button>
      </div>
    </section>
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
    <label className="gf-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as GateState)}>
        <option value="UNKNOWN">UNKNOWN (fails closed)</option>
        <option value="CLEAR">CLEAR</option>
        <option value="ACTIVE">ACTIVE (fails closed)</option>
      </select>
    </label>
  );
}
