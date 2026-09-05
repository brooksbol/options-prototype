/**
 * Production Evidence CSV Export — PL-PROD-EXPORT-01 V1
 *
 * A single downloadable CSV that captures, in one artifact:
 *   1. backend Production ASSESSMENT state (serialized verbatim from ProductionAssessmentResponse); and
 *   2. material Economic Activity claims actually PRESENTED to the operator (serialized from the
 *      already-derived EpisodeChapter[] view-model).
 *
 * PURPOSE: debugging / testing / forensic review / actor-to-actor evidence exchange without
 * screenshots — and specifically to make backend/presentation divergence (the #11 class of defect:
 * a presented "capital returned" value differing from authoritative net sale proceeds) mechanically
 * visible in one file.
 *
 * CRITICAL DISCIPLINE (ADR-015 / ADR-016):
 *   - This module SERIALIZES existing backend values and existing frontend presentation values.
 *   - It MUST NOT invent, recompute, or re-derive any economic semantics for the export.
 *   - A PRESENTATION row is authoritative evidence of *what Wheelwright showed the operator*; it is
 *     NOT automatically authoritative economic truth.
 *   - Export-local keys (record_key / parent_record_key / supports_record_key) are unique ONLY within
 *     one exported file. They are NOT lifecycle, evidence, broker, or durable semantic identity, and
 *     are NOT a replacement for dispositionFingerprint or contractActivityKey.
 *   - dispositionFingerprint is preserved as a NON-UNIQUE trace field and is never used as a key.
 *
 * Determinism is promised for ONE (response, view-model) pair only. Record keys are NOT stable
 * across corrected/reordered evidence imports.
 */

import type { ProductionAssessmentResponse } from "./production-types";
import type { EpisodeChapter } from "./episode-derivation";

// --- Layer / ownership vocabulary (kept minimal and orthogonal) ---

/** Which layer the row's content belongs to. */
export type RecordLayer = "ASSESSMENT" | "PRESENTATION" | "SOURCE_CONTEXT";
/** Who owns the content the row serializes. */
export type RecordOwner = "PRODUCTION_BACKEND" | "PRODUCTION_FRONTEND" | "EXPORT";

/** Explicit sentinel for an unavailable/null value — distinct from numeric 0 and empty text. */
export const NULL_TOKEN = "NULL";

/**
 * Ordered CSV columns. Every row supplies every column (sparse rows leave irrelevant columns as
 * the empty-string cell, which is DISTINCT from NULL — see encodeText/encodeNumber).
 */
export const CSV_COLUMNS = [
  "record_key",
  "parent_record_key",
  "supports_record_key",
  "presentation_group_key",
  "record_layer",
  "owner",
  "record_type",
  "presentation_role",
  "claim_name",
  "symbol",
  "label_text",
  "value_numeric",
  "value_text",
  "state_or_confidence",
  "broker_run_date",
  "disposition_fingerprint",
  "contract_activity_key",
  "provenance_text",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** An internal, fully-typed row prior to serialization. Missing keys render as empty text (""). */
type Row = Partial<Record<CsvColumn, string>>;

export interface ProductionCsvContext {
  /** ISO-8601 instant the export was generated. EXPORT-time only — never evidence/assessment time. */
  exportGeneratedAt: string;
  /** Target month key "YYYY-MM" the operator was viewing. */
  targetMonth?: string | null;
  /** Uploaded Activity filename, if the workflow already has it. Optional context only. */
  sourceFilename?: string | null;
}

// ---------------------------------------------------------------------------
// Value encoding — preserve the null / zero / empty-text distinction deterministically.
// ---------------------------------------------------------------------------

/** Encode a nullable number. null/undefined -> NULL token; numbers -> fixed, locale-independent. */
function encodeNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return NULL_TOKEN;
  // Locale-independent. Preserve cent precision; do not force 2 dp for integer counts.
  // Use a plain decimal string; avoid toLocaleString (browser-locale dependent).
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

/** Encode a nullable text value. null/undefined -> NULL token; "" stays "" (distinct from null). */
function encodeText(s: string | null | undefined): string {
  if (s === null || s === undefined) return NULL_TOKEN;
  return s;
}

// ---------------------------------------------------------------------------
// CSV field serialization — RFC-4180 quoting + reversible spreadsheet-formula safety.
// ---------------------------------------------------------------------------

/**
 * Spreadsheet-formula safety: cells whose text begins with a formula-trigger character
 * (= + - @, or a leading tab / CR) can be executed by spreadsheet software. We prefix a single
 * apostrophe. This is REVERSIBLE (strip exactly one leading apostrophe) and does not change the
 * semantic text a careful reader parses. Applied only to free TEXT fields, never to the numeric
 * or key/enumerated fields (which cannot begin with a trigger in normal data).
 *
 * NOTE: a negative number rendered as text (e.g. an amount that lives in a *_text field) would be
 * neutralized; that is why numeric economic values live in value_numeric (never neutralized) and
 * text fields carry labels/provenance/action strings.
 */
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

function neutralizeFormula(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGERS.has(value[0])) {
    return "'" + value;
  }
  return value;
}

/** RFC-4180 field: quote if it contains comma, quote, CR, or LF; double internal quotes. */
function csvQuote(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Columns that carry FREE OPERATOR/SOURCE TEXT and therefore receive reversible formula
 * neutralization. This set deliberately EXCLUDES all identifier/key/enumerated columns
 * (record_key, parent_record_key, supports_record_key, presentation_group_key,
 * contract_activity_key, disposition_fingerprint, symbol, claim_name, record_type, layers,
 * roles, dates, numerics), so semantic identifiers — notably OCC option symbols that begin
 * with "-" — are preserved BYTE-FOR-BYTE and remain recoverable. Only label_text, value_text,
 * and provenance_text (which hold arbitrary operator/source strings) are neutralized.
 */
const NEUTRALIZED_TEXT_COLUMNS = new Set<CsvColumn>([
  "label_text", "value_text", "provenance_text",
]);

function serializeCell(col: CsvColumn, raw: string): string {
  const withSafety = NEUTRALIZED_TEXT_COLUMNS.has(col) ? neutralizeFormula(raw) : raw;
  return csvQuote(withSafety);
}

function serializeRow(row: Row): string {
  return CSV_COLUMNS.map((col) => serializeCell(col, row[col] ?? "")).join(",");
}

// ---------------------------------------------------------------------------
// Export-local key allocation — deterministic, artifact-scoped only.
// ---------------------------------------------------------------------------

class KeyAllocator {
  private counters = new Map<string, number>();
  /** `<record_type>:<ordinal>` — deterministic from emission order (which is deterministic). */
  next(recordType: string): string {
    const n = (this.counters.get(recordType) ?? 0) + 1;
    this.counters.set(recordType, n);
    return `${recordType}:${n}`;
  }
}

// ---------------------------------------------------------------------------
// Main builder.
// ---------------------------------------------------------------------------

/**
 * Build the Production Evidence CSV from the authoritative backend response and the already-derived
 * presentation chapters. Pure function: no I/O, no recomputation of economics.
 */
export function buildProductionCsv(
  assessment: ProductionAssessmentResponse | null,
  chapters: EpisodeChapter[],
  context: ProductionCsvContext,
): string {
  const keys = new KeyAllocator();
  const rows: Row[] = [];

  // ---- Family: assessment_meta + source context (EXPORT / SOURCE_CONTEXT layer) ----
  rows.push({
    record_key: keys.next("assessment_meta"),
    record_layer: "SOURCE_CONTEXT",
    owner: "EXPORT",
    record_type: "assessment_meta",
    claim_name: "export_generated_at",
    value_text: encodeText(context.exportGeneratedAt),
    provenance_text: "Export creation instant (EXPORT time only — NOT assessment/evidence/observation/ingestion time).",
  });
  rows.push({
    record_key: keys.next("assessment_meta"),
    record_layer: "SOURCE_CONTEXT",
    owner: "EXPORT",
    record_type: "assessment_meta",
    claim_name: "build_revision",
    // Build identity is not honestly exposed by the current application; do not fabricate one.
    value_text: NULL_TOKEN,
    provenance_text: "Build/commit revision not exposed by V1; cross-build attribution is not guaranteed.",
  });
  rows.push({
    record_key: keys.next("assessment_meta"),
    record_layer: "SOURCE_CONTEXT",
    owner: "EXPORT",
    record_type: "assessment_meta",
    claim_name: "target_month",
    value_text: encodeText(context.targetMonth ?? null),
  });
  rows.push({
    record_key: keys.next("assessment_meta"),
    record_layer: "SOURCE_CONTEXT",
    owner: "EXPORT",
    record_type: "assessment_meta",
    claim_name: "source_filename",
    value_text: encodeText(context.sourceFilename ?? null),
    provenance_text:
      "Download-time workflow/source context: the browser's currently-stored Activity artifact " +
      "filename. NOT backend-attested provenance — the backend does not guarantee this file " +
      "generated the assessment response.",
  });

  // Encoding-contract metadata (honest, per-field). V1 does NOT claim identifiers are both
  // byte-exact AND spreadsheet-safe simultaneously.
  const encodingContract: [string, string][] = [
    ["encoding.free_text",
      "Free-text fields (label_text, value_text, provenance_text) use REVERSIBLE leading-apostrophe " +
      "neutralization for spreadsheet formula-risk prefixes (= + - @, tab, CR). Strip one leading " +
      "apostrophe to recover the original."],
    ["encoding.identifiers",
      "Structural/identifier fields (record_key, parent_record_key, supports_record_key, " +
      "presentation_group_key, contract_activity_key, disposition_fingerprint, symbol) preserve raw " +
      "semantic bytes EXACTLY and are NOT guaranteed spreadsheet-safe; values beginning with - + = @ " +
      "may require safe-import handling (import as text) in spreadsheet applications."],
    ["encoding.numeric",
      "Numeric fields (value_numeric) are emitted as numeric values, locale-independent; negatives " +
      "keep their sign and are never neutralized."],
    ["encoding.null_zero_empty",
      "'" + NULL_TOKEN + "' = unavailable/null; numeric 0 = zero; empty cell = empty string; these are distinct."],
  ];
  for (const [name, text] of encodingContract) {
    rows.push({
      record_key: keys.next("assessment_meta"),
      record_layer: "SOURCE_CONTEXT",
      owner: "EXPORT",
      record_type: "assessment_meta",
      claim_name: name,
      value_text: encodeText(text),
    });
  }

  if (assessment) {
    // ---- Family: assessment_meta — period/context (ASSESSMENT layer) ----
    rows.push({
      record_key: keys.next("assessment_meta"),
      record_layer: "ASSESSMENT",
      owner: "PRODUCTION_BACKEND",
      record_type: "assessment_meta",
      claim_name: "period",
      value_text: encodeText(assessment.period),
    });
    rows.push({
      record_key: keys.next("assessment_meta"),
      record_layer: "ASSESSMENT",
      owner: "PRODUCTION_BACKEND",
      record_type: "assessment_meta",
      claim_name: "period_description",
      value_text: encodeText(assessment.periodDescription),
    });
    rows.push({
      record_key: keys.next("assessment_meta"),
      record_layer: "ASSESSMENT",
      owner: "PRODUCTION_BACKEND",
      record_type: "assessment_meta",
      claim_name: "reconciliation_status",
      state_or_confidence: encodeText(assessment.reconciliationStatus),
    });

    // ---- Family: authoritative_summary — headline economics (verbatim) ----
    const summaryFields: [string, number | null | undefined][] = [
      ["known_cash_production", assessment.knownCashProduction],
      ["unresolved_potential_production", assessment.unresolvedPotentialProduction],
      ["realized_capital_erosion", assessment.realizedCapitalErosion],
      ["net_strategy_result", assessment.netStrategyResult],
    ];
    for (const [name, value] of summaryFields) {
      rows.push({
        record_key: keys.next("authoritative_summary"),
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "authoritative_summary",
        claim_name: name,
        value_numeric: encodeNumber(value),
      });
    }

    // ---- Family: production_source — breakdown by source (verbatim) ----
    // Deterministic: sort source keys for stable ordering across the same response.
    const sourceKeys = Object.keys(assessment.productionBreakdown ?? {}).sort();
    for (const src of sourceKeys) {
      rows.push({
        record_key: keys.next("production_source"),
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "production_source",
        claim_name: src,
        value_numeric: encodeNumber(assessment.productionBreakdown[src]),
      });
    }

    // ---- Family: reconciliation_issue (verbatim, response order) ----
    for (const issue of assessment.reconciliationIssues ?? []) {
      rows.push({
        record_key: keys.next("reconciliation_issue"),
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "reconciliation_issue",
        state_or_confidence: encodeText(issue.type),
        label_text: encodeText(issue.description),
        value_numeric: encodeNumber(issue.potentialImpact),
      });
    }

    // ---- Family: erosion_event (verbatim, response order) ----
    for (const ev of assessment.erosionEvents ?? []) {
      rows.push({
        record_key: keys.next("erosion_event"),
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "erosion_event",
        symbol: encodeText(ev.symbol),
        broker_run_date: encodeText(ev.date),
        value_numeric: encodeNumber(ev.amount),
        label_text: encodeText(ev.description),
      });
    }

    // ---- Family: transaction_summary (verbatim) ----
    if (assessment.transactionSummary) {
      const ts = assessment.transactionSummary;
      const counts: [string, number][] = [
        ["included", ts.included], ["excluded", ts.excluded],
        ["uncertain", ts.uncertain], ["not_applicable", ts.notApplicable],
      ];
      for (const [name, value] of counts) {
        rows.push({
          record_key: keys.next("transaction_summary"),
          record_layer: "ASSESSMENT",
          owner: "PRODUCTION_BACKEND",
          record_type: "transaction_summary",
          claim_name: name,
          value_numeric: encodeNumber(value),
        });
      }
    }

    // ---- Family: assessed_transaction + child economic_component (verbatim, response order) ----
    // Parent/child linkage uses export-local keys; it does NOT depend on the transaction id being
    // unique (the id is a non-unique fingerprint), so duplicate ids still yield distinct parents.
    for (const tx of assessment.transactions ?? []) {
      const txKey = keys.next("assessed_transaction");
      rows.push({
        record_key: txKey,
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "assessed_transaction",
        symbol: encodeText(tx.symbol),
        broker_run_date: encodeText(tx.date),
        label_text: encodeText(tx.action),
        value_numeric: encodeNumber(tx.amount),
        state_or_confidence: encodeText(tx.role),
        // The transaction id is a non-unique content fingerprint; preserve as trace only.
        disposition_fingerprint: encodeText(tx.id),
      });
      for (const c of tx.components ?? []) {
        rows.push({
          record_key: keys.next("economic_component"),
          parent_record_key: txKey,
          record_layer: "ASSESSMENT",
          owner: "PRODUCTION_BACKEND",
          record_type: "economic_component",
          claim_name: encodeText(c.type),
          symbol: encodeText(c.source ?? null),
          value_numeric: encodeNumber(c.amount),
          state_or_confidence: encodeText(c.confidence),
          provenance_text: encodeText(c.derivation),
        });
      }
    }

    // ---- Family: disposition_result (verbatim, response order) ----
    // Record the export-local key per contractActivityKey so presented claims can link to it
    // WITHOUT relying on dispositionFingerprint uniqueness. Only non-null keys are addressable
    // (mirrors the frontend's own lookup discipline). If two dispositions somehow shared a
    // non-null key, the last is used for linkage — but the backend guarantees assessment-wide
    // uniqueness of non-null contractActivityKey (ADR-016), so this is the same discipline.
    // Per contractActivityKey, remember the disposition parent record_key AND the specific
    // net_sale_proceeds economic child record_key, so a presented claim can link to the exact
    // authoritative quantity it is comparable against (claim-specific support, not blanket).
    const dispositionParentByKey = new Map<string, string>();
    const netProceedsChildByKey = new Map<string, string>();
    for (const d of assessment.dispositionResults ?? []) {
      const dKey = keys.next("disposition_result");
      if (d.contractActivityKey != null) {
        dispositionParentByKey.set(d.contractActivityKey.trim(), dKey);
      }
      // Parent disposition row: identity/association/state anchor.
      rows.push({
        record_key: dKey,
        record_layer: "ASSESSMENT",
        owner: "PRODUCTION_BACKEND",
        record_type: "disposition_result",
        claim_name: encodeText(d.kind),
        symbol: encodeText(d.symbol),
        broker_run_date: encodeText(d.date),
        label_text: encodeText(d.dispositionAction),
        state_or_confidence: encodeText(d.state),
        disposition_fingerprint: encodeText(d.dispositionFingerprint),
        contract_activity_key: encodeText(d.contractActivityKey),
        provenance_text: encodeText(d.provenance),
      });
      // Child economic rows: one clean, individually diffable cell per authoritative quantity.
      // net_sale_proceeds is the primary comparison anchor for #11 divergence detection.
      const economics: [string, number | null][] = [
        ["net_sale_proceeds", d.netSaleProceeds],
        ["attributable_acquisition_cash", d.attributableAcquisitionCash],
        ["realized_appreciation", d.realizedAppreciation],
        ["realized_erosion", d.realizedErosion],
        ["quantity", d.quantity],
        ["sale_price_per_share", d.salePricePerShare],
      ];
      for (const [name, value] of economics) {
        const ecoKey = keys.next("disposition_economic");
        if (name === "net_sale_proceeds" && d.contractActivityKey != null) {
          netProceedsChildByKey.set(d.contractActivityKey.trim(), ecoKey);
        }
        rows.push({
          record_key: ecoKey,
          parent_record_key: dKey,
          record_layer: "ASSESSMENT",
          owner: "PRODUCTION_BACKEND",
          record_type: "disposition_economic",
          claim_name: name,
          symbol: encodeText(d.symbol),
          value_numeric: encodeNumber(value),
          state_or_confidence: encodeText(d.state),
          contract_activity_key: encodeText(d.contractActivityKey),
        });
      }
    }

    // ---- Family: presented_claim — scalar claims from the derived EpisodeChapter view-model ----
    // These are PRESENTATION-layer: authoritative evidence of what was SHOWN, not economic truth.
    // Chapters are emitted in the view-model's existing deterministic order (as supplied to render).
    let chapterOrdinal = 0;
    for (const ch of chapters) {
      chapterOrdinal += 1;
      // Export-/presentation-scoped grouping token (episode key + ordinal). This is NOT a
      // record_key and NOT lifecycle identity — it goes in its own presentation_group_key column,
      // never in parent_record_key.
      const groupKey = `${ch.episodeId}#${chapterOrdinal}`;
      const chKey = ch.rawSymbol ? ch.rawSymbol.trim() : "";
      // Disposition support may ONLY attach to the exact called-away RESOLUTION chapter — never an
      // opening chapter that happens to share the same contract-activity key. The smallest honest
      // discriminator already in the model: a resolution chapter references its opening
      // (`linkDirection === "opened"`); an opening chapter references its resolution
      // (`linkDirection === "resolves"`). Additionally a disposition must actually exist for this
      // key (dispositions are only produced for CALL called-away, so PUT-assigned/expired
      // resolutions naturally have none). Same join the renderer uses; never fingerprint.
      const isResolutionChapter = ch.linkDirection === "opened";
      const netProceedsKey = isResolutionChapter ? netProceedsChildByKey.get(chKey) : undefined;
      const dispositionParentKey = isResolutionChapter ? dispositionParentByKey.get(chKey) : undefined;

      // Per-claim support: prefer ABSENT over overstated. Only claims the authoritative disposition
      // genuinely supports get a link, targeting the SPECIFIC authoritative row.
      //   - capital_amount (called-away resolution) → the net_sale_proceeds economic child;
      //   - confidence (called-away resolution) → the disposition parent, because the frontend
      //     RENDERS called-away confidence FROM DispositionResult.state (episode-derivation);
      //   - production_amount is a COMPOSITE (frontend premium + backend appreciation/erosion) →
      //     NOT wholly supported → no link;
      //   - state is PRESENTATION LIFECYCLE state (complete/in_flight), a DIFFERENT semantic claim
      //     from DispositionResult economic-resolution state (RESOLVED/PARTIAL/UNRESOLVED) →
      //     NO disposition support;
      //   - primitive/contracts/strike/labels/link metadata → no disposition support.
      const supportFor = (name: string): string | undefined => {
        if (name === "capital_amount") return netProceedsKey;    // specific quantity
        if (name === "confidence") return dispositionParentKey;  // rendered from disposition state
        return undefined;                                        // prefer absent over overstated
      };

      // presentation_role: DISPLAYED_CLAIM = an operator-visible rendered claim;
      // PRESENTATION_BACKING_VALUE = a view-model value that backs the display but is not itself the
      // rendered string (e.g. capital_amount numeric vs the capital_label the operator reads). This
      // faithfully exposes label/value divergences (URA/UNG) rather than "fixing" them.
      type Role = "DISPLAYED_CLAIM" | "PRESENTATION_BACKING_VALUE";
      const scalarClaims: {
        name: string; role: Role; numeric?: number | null; text?: string | null; state?: string | null;
      }[] = [
        { name: "primitive", role: "DISPLAYED_CLAIM", text: ch.primitive },
        { name: "what_happened", role: "DISPLAYED_CLAIM", text: ch.whatHappened },
        { name: "production_label", role: "DISPLAYED_CLAIM", text: ch.productionLabel },
        { name: "production_amount", role: "PRESENTATION_BACKING_VALUE", numeric: ch.productionAmount },
        { name: "capital_label", role: "DISPLAYED_CLAIM", text: ch.capitalLabel },
        { name: "capital_amount", role: "PRESENTATION_BACKING_VALUE", numeric: ch.capitalAmount },
        { name: "confidence", role: "DISPLAYED_CLAIM", state: ch.confidence },
        { name: "state", role: "PRESENTATION_BACKING_VALUE", state: ch.state },
        { name: "conditional_label", role: "DISPLAYED_CLAIM", text: ch.conditionalLabel },
        { name: "link_relationship", role: "PRESENTATION_BACKING_VALUE", text: ch.linkDirection },
        { name: "link_date", role: "PRESENTATION_BACKING_VALUE", text: ch.linkDate },
        { name: "contracts", role: "PRESENTATION_BACKING_VALUE", numeric: ch.contracts },
        { name: "strike", role: "PRESENTATION_BACKING_VALUE", numeric: ch.strike },
      ];

      for (const claim of scalarClaims) {
        // Emit every claim (even null) so an actor sees an explicit inclusion decision, and so
        // null/zero/empty distinctions are observable per claim.
        rows.push({
          record_key: keys.next("presented_claim"),
          // parent_record_key stays EMPTY: presented claims have no exported parent row.
          presentation_group_key: groupKey,
          supports_record_key: supportFor(claim.name),
          record_layer: "PRESENTATION",
          owner: "PRODUCTION_FRONTEND",
          record_type: "presented_claim",
          presentation_role: claim.role,
          claim_name: claim.name,
          symbol: encodeText(ch.underlying),
          broker_run_date: encodeText(ch.date),
          contract_activity_key: encodeText(ch.rawSymbol),
          value_numeric: "numeric" in claim ? encodeNumber(claim.numeric) : "",
          value_text: "text" in claim ? encodeText(claim.text) : "",
          state_or_confidence: "state" in claim ? encodeText(claim.state) : "",
        });
      }
    }
  }

  const header = CSV_COLUMNS.join(",");
  const body = rows.map(serializeRow).join("\r\n");
  return header + "\r\n" + body + "\r\n";
}
