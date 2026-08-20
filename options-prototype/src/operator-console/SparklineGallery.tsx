/**
 * Sparkline Treatment Gallery — temporary comparison surface.
 *
 * Displays 8 materially different moneyness sparkline visualizations
 * against identical representative data. Each treatment is labeled A-H
 * and rendered at approximately Console-row density.
 *
 * Purpose: visual comparison to select/combine/reject approaches before
 * production integration. This is a UX experiment surface, not a product feature.
 *
 * Access: /app/sparkline-gallery
 */

import { GALLERY_SCENARIOS, type GalleryScenario } from "./sparkline-gallery-data";
import {
  TreatmentA,
  TreatmentB,
  TreatmentC,
  TreatmentD,
  TreatmentE,
  TreatmentF,
  TreatmentG,
  TreatmentH,
  TreatmentBCG,
  TreatmentBCG1,
  TreatmentBCG2,
  TreatmentBCG3,
  TreatmentBCG4,
  TreatmentBCG5,
  TreatmentV4W66,
  TreatmentV4W90,
  TreatmentV4W120,
  TreatmentV4W150,
} from "./SparklineTreatments";
import type { MoneynessPoint } from "./moneyness-history";
import type { PositionType } from "../portfolio/position-monitoring";

// --- Treatment metadata ---

interface TreatmentMeta {
  id: string;
  label: string;
  hypothesis: string;
  Component: React.FC<{ points: MoneynessPoint[]; type: PositionType; currentMoneyness: number }>;
}

const TREATMENTS: TreatmentMeta[] = [
  { id: "A", label: "Neutral trace + prominent zero", hypothesis: "The zero-line alone provides enough reference. Trace is pure shape.", Component: TreatmentA },
  { id: "B", label: "Segmented by contract state", hypothesis: "Color each segment by whether that portion is ITM or OTM, respecting intent.", Component: TreatmentB },
  { id: "C", label: "Neutral trace over shaded regions", hypothesis: "Background shading provides context without coloring the trace itself.", Component: TreatmentC },
  { id: "D", label: "Semantic trace (intent-aware color)", hypothesis: "Entire trace in the same semantic color as the numeric moneyness value.", Component: TreatmentD },
  { id: "E", label: "Filled area from zero", hypothesis: "Area fill emphasizes magnitude of distance from strike, not just direction.", Component: TreatmentE },
  { id: "F", label: "Endpoint-emphasized (dot + faded trace)", hypothesis: "Current state matters most; history is context at reduced visual weight.", Component: TreatmentF },
  { id: "G", label: "Combined moneyness + sparkline cell", hypothesis: "Spatial locality: numeric value and history together in one compound element.", Component: TreatmentG },
  { id: "H", label: "Gradient trace (recency emphasis)", hypothesis: "Recent history matters more. Older observations fade out.", Component: TreatmentH },
  { id: "B×C×G", label: "Hybrid: segmented + regions + combined", hypothesis: "Locality (G) + spatial context (C) + state-colored trajectory (B). Answers: where am I, where have I been, which side, when did I cross?", Component: TreatmentBCG },
];

const BCG_VARIANTS: TreatmentMeta[] = [
  { id: "B×C×G", label: "Original", hypothesis: "Moderate trace, subtle regions, light zero", Component: TreatmentBCG },
  { id: "V1", label: "Regions dominate", hypothesis: "Stronger shading + bold solid zero. Trace rides on the coordinate system.", Component: TreatmentBCG1 },
  { id: "V2", label: "Trace dominates", hypothesis: "Bold trace is primary. Regions and zero are whisper-level context.", Component: TreatmentBCG2 },
  { id: "V3", label: "Number dominates", hypothesis: "Larger/bolder numeric. Compact chart is supporting evidence only.", Component: TreatmentBCG3 },
  { id: "V4", label: "Chart dominates", hypothesis: "Wider chart (66px). Compact numeric. Trajectory is the primary story.", Component: TreatmentBCG4 },
  { id: "V5", label: "Final synthesis (V2 + locality)", hypothesis: "V2's bold trace dominance with original compound-cell reading. Number anchors, trajectory tells the story.", Component: TreatmentBCG5 },
];

const WIDTH_VARIANTS: TreatmentMeta[] = [
  { id: "66px", label: "66px", hypothesis: "Current V4 width", Component: TreatmentV4W66 },
  { id: "90px", label: "90px", hypothesis: "Moderate expansion", Component: TreatmentV4W90 },
  { id: "120px", label: "120px", hypothesis: "Generous width", Component: TreatmentV4W120 },
  { id: "150px", label: "150px", hypothesis: "Maximum before diminishing returns?", Component: TreatmentV4W150 },
];

// --- Gallery component ---

export function SparklineGallery() {
  return (
    <div style={{ padding: "24px 32px", maxWidth: "1200px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1a1d26", background: "#f8f9fb", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Moneyness Sparkline — Treatment Gallery</h1>
      <p style={{ fontSize: "11px", color: "#4b5563", marginBottom: "24px", maxWidth: "700px", lineHeight: 1.5 }}>
        8 materially different visualization hypotheses against identical representative contract histories.
        Each row shows one scenario; each column shows one treatment at approximately Console-row density.
      </p>

      {/* Column header row */}
      <div style={{ display: "grid", gridTemplateColumns: "180px repeat(9, 1fr)", gap: "1px", marginBottom: "2px" }}>
        <div style={{ padding: "6px 8px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db" }}>
          SCENARIO
        </div>
        {TREATMENTS.map(t => (
          <div key={t.id} style={{ padding: "6px 4px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db", textAlign: "center" }}>
            {t.id}
          </div>
        ))}
      </div>

      {/* Data rows — one per scenario */}
      {GALLERY_SCENARIOS.map(scenario => (
        <div key={scenario.id} style={{ display: "grid", gridTemplateColumns: "180px repeat(9, 1fr)", gap: "1px", borderBottom: "1px solid #eef0f4", alignItems: "center" }}>
          {/* Scenario label */}
          <div style={{ padding: "4px 8px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#1f2937" }}>{scenario.label}</div>
            <div style={{ fontSize: "8px", color: "#6b7280", lineHeight: 1.3 }}>{scenario.description}</div>
          </div>
          {/* Treatments */}
          {TREATMENTS.map(t => (
            <div key={t.id} style={{ padding: "3px 4px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "24px" }}>
              <t.Component points={scenario.points} type={scenario.type} currentMoneyness={scenario.currentMoneyness} />
            </div>
          ))}
        </div>
      ))}

      {/* Treatment descriptions */}
      <div style={{ marginTop: "32px", borderTop: "1px solid #d1d5db", paddingTop: "16px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>Treatment Hypotheses</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
          {TREATMENTS.map(t => (
            <div key={t.id} style={{ fontSize: "10px", lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: "#111318" }}>{t.id}:</span>{" "}
              <span style={{ fontWeight: 600, color: "#374151" }}>{t.label}</span>
              <br />
              <span style={{ color: "#4b5563" }}>{t.hypothesis}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual semantics key */}
      <div style={{ marginTop: "24px", fontSize: "9px", color: "#6b7280", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
        <strong>Zero line</strong> = strike boundary. Above = ITM (positive moneyness). Below = OTM (negative moneyness).
        <br />
        <strong>Color semantics (where applicable):</strong> PUT OTM=green/ITM=red · BW ITM=green/OTM=red · CALL=neutral (intent unknown).
        <br />
        <strong>Note:</strong> All treatments show the same 7 scenarios. Differences are in visual encoding, not data.
      </div>

      {/* === B×C×G Hierarchy Variants === */}
      <div style={{ marginTop: "40px", borderTop: "2px solid #d1d5db", paddingTop: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>B×C×G — Hierarchy Variants</h2>
        <p style={{ fontSize: "10px", color: "#4b5563", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.5 }}>
          Same composition (segmented trace + shaded regions + combined cell). Different relative weight of the four signal layers.
          Compare the original B×C×G against these tuning variants to find the right hierarchy.
        </p>

        {/* Variant descriptions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", marginBottom: "16px", fontSize: "10px" }}>
          <div><strong>B×C×G (original):</strong> Moderate trace (1.3), subtle regions (0.05), light zero (0.5), 56px chart</div>
          <div><strong>V1 — Regions dominate:</strong> Stronger regions (0.10), bold zero (1.0 solid), thinner trace (1.1)</div>
          <div><strong>V2 — Trace dominates:</strong> Bold trace (1.8), whisper regions (0.04), fine dashed zero</div>
          <div><strong>V3 — Number dominates:</strong> Larger numeric (11px/800), reduced chart (44px), moderate everything</div>
          <div><strong>V4 — Chart dominates:</strong> Wider chart (66px), compact numeric (9px), strong zero</div>
          <div><strong>V5 — Final synthesis:</strong> V2's bold trace + original compound-cell locality (10px/700, 56px). Number anchors, trajectory tells the story.</div>
        </div>

        {/* Variant comparison grid */}
        <div style={{ display: "grid", gridTemplateColumns: "180px repeat(6, 1fr)", gap: "1px", marginBottom: "2px" }}>
          <div style={{ padding: "6px 8px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db" }}>SCENARIO</div>
          {["B×C×G", "V1", "V2", "V3", "V4", "V5"].map(id => (
            <div key={id} style={{ padding: "6px 4px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db", textAlign: "center" }}>{id}</div>
          ))}
        </div>
        {GALLERY_SCENARIOS.map(scenario => (
          <div key={scenario.id} style={{ display: "grid", gridTemplateColumns: "180px repeat(6, 1fr)", gap: "1px", borderBottom: "1px solid #eef0f4", alignItems: "center" }}>
            <div style={{ padding: "4px 8px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#1f2937" }}>{scenario.label}</div>
            </div>
            {BCG_VARIANTS.map(v => (
              <div key={v.id} style={{ padding: "3px 4px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "24px" }}>
                <v.Component points={scenario.points} type={scenario.type} currentMoneyness={scenario.currentMoneyness} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* === V4 Width Variants === */}
      <div style={{ marginTop: "40px", borderTop: "2px solid #d1d5db", paddingTop: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>V4 — Width Tuning</h2>
        <p style={{ fontSize: "10px", color: "#4b5563", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.5 }}>
          Same V4 treatment (chart-dominates, compact numeric, strong zero, moderate regions). Only the sparkline width changes.
          Looking for the point where trajectory becomes legible at a glance before additional width stops adding value.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "180px repeat(4, 1fr)", gap: "1px", marginBottom: "2px" }}>
          <div style={{ padding: "6px 8px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db" }}>SCENARIO</div>
          {["66px", "90px", "120px", "150px"].map(w => (
            <div key={w} style={{ padding: "6px 4px", fontSize: "9px", fontWeight: 600, color: "#374151", background: "#f0f1f4", borderBottom: "1px solid #d1d5db", textAlign: "center" }}>{w}</div>
          ))}
        </div>
        {GALLERY_SCENARIOS.map(scenario => (
          <div key={scenario.id} style={{ display: "grid", gridTemplateColumns: "180px repeat(4, 1fr)", gap: "1px", borderBottom: "1px solid #eef0f4", alignItems: "center" }}>
            <div style={{ padding: "4px 8px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#1f2937" }}>{scenario.label}</div>
            </div>
            {WIDTH_VARIANTS.map(v => (
              <div key={v.id} style={{ padding: "3px 4px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "24px" }}>
                <v.Component points={scenario.points} type={scenario.type} currentMoneyness={scenario.currentMoneyness} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
