/**
 * Production Evidence CSV Export — PL-PROD-EXPORT-01 V1 tests.
 *
 * Proves the hybrid artifact serializes backend assessment state AND presented EpisodeChapter
 * claims into one CSV, without recomputing economics, and makes backend/presentation divergence
 * (the #11 class) mechanically visible.
 */

import { describe, it, expect } from "vitest";
import { buildProductionCsv, NULL_TOKEN, CSV_COLUMNS } from "../../src/production/production-csv-export";
import type { ProductionAssessmentResponse, DispositionResult } from "../../src/production/production-types";
import type { EpisodeChapter } from "../../src/production/episode-derivation";

// --- CSV parsing helper (RFC-4180-aware, enough for these tests) ---

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(field); field = ""; i++; continue; }
    if (ch === "\r" && text[i + 1] === "\n") {
      row.push(field); rows.push(row); row = []; field = ""; i += 2; continue;
    }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

interface ParsedCsv {
  header: string[];
  rows: Record<string, string>[];
}

function parse(text: string): ParsedCsv {
  const raw = parseCsv(text).filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
  const header = raw[0];
  const rows = raw.slice(1).map(cells => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = cells[idx] ?? ""; });
    return obj;
  });
  return { header, rows };
}

// --- Builders ---

function chapter(overrides: Partial<EpisodeChapter>): EpisodeChapter {
  return {
    date: "2026-09-08",
    primitive: "CC",
    underlying: "BNO",
    strike: 54,
    whatHappened: "Called away · shares sold",
    productionLabel: "+$799.77 episode",
    productionAmount: 799.77,
    capitalLabel: "$10,200.00 capital returned",
    capitalAmount: 10200,
    linkDate: "2026-09-01",
    linkDirection: "opened",
    state: "complete",
    episodeId: "-BNO260904C54",
    confidence: "deterministic",
    constituentEvents: [],
    rawSymbol: "-BNO260904C54",
    contracts: 2,
    conditionalLabel: null,
    ...overrides,
  };
}

function disposition(overrides: Partial<DispositionResult>): DispositionResult {
  return {
    dispositionFingerprint: "abc123",
    contractActivityKey: "-BNO260904C54",
    symbol: "BNO",
    date: "2026-09-08",
    dispositionAction: "YOU SOLD ASSIGNED CALLS AS OF 2026-09-08 BNO",
    kind: "ASSIGNED_CALL_STOCK_SALE",
    quantity: 200,
    salePricePerShare: 54,
    netSaleProceeds: 5099.89,
    attributableAcquisitionCash: 4300.12,
    realizedAppreciation: 799.77,
    realizedErosion: null,
    state: "RESOLVED",
    provenance: "assoc=-BNO260904C54; dispositionFingerprint=abc123; realized appreciation",
    ...overrides,
  };
}

function assessment(overrides: Partial<ProductionAssessmentResponse>): ProductionAssessmentResponse {
  return {
    period: "2026-09",
    periodDescription: "September 2026",
    reconciliationStatus: "PRODUCTION_UNCERTAIN",
    reconciliationIssues: [],
    knownCashProduction: 1234.56,
    unresolvedPotentialProduction: 0,
    realizedCapitalErosion: 0,
    netStrategyResult: 2034.33,
    productionBreakdown: { OPTION_PREMIUM: 1234.56, REALIZED_APPRECIATION: 799.77 },
    erosionEvents: [],
    transactionSummary: { included: 3, excluded: 1, uncertain: 0, notApplicable: 2 },
    transactions: [],
    dispositionResults: [],
    ...overrides,
  };
}

const CTX = { exportGeneratedAt: "2026-09-30T12:00:00.000Z", targetMonth: "2026-09", sourceFilename: null };

// --- Tests ---

describe("buildProductionCsv — structure & vocabulary", () => {
  it("emits the fixed column header", () => {
    const { header } = parse(buildProductionCsv(assessment({}), [], CTX));
    expect(header).toEqual([...CSV_COLUMNS]);
  });

  it("(1) serializes backend headline economics verbatim without recomputation", () => {
    const a = assessment({ knownCashProduction: 1234.56, netStrategyResult: 2034.33 });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const known = rows.find(r => r.record_type === "authoritative_summary" && r.claim_name === "known_cash_production")!;
    const net = rows.find(r => r.record_type === "authoritative_summary" && r.claim_name === "net_strategy_result")!;
    expect(known.value_numeric).toBe("1234.56");
    expect(net.value_numeric).toBe("2034.33");
    expect(known.owner).toBe("PRODUCTION_BACKEND");
    expect(known.record_layer).toBe("ASSESSMENT");
  });

  it("(2/3/4/5) one EpisodeChapter yields multiple presented_claim rows with stable claim_names and preserved numeric+text values", () => {
    const { rows } = parse(buildProductionCsv(assessment({}), [chapter({})], CTX));
    const claims = rows.filter(r => r.record_type === "presented_claim");
    const names = claims.map(c => c.claim_name);
    // multiple scalar claims from ONE chapter
    expect(claims.length).toBeGreaterThan(5);
    // stable machine-readable names present
    for (const n of ["what_happened", "primitive", "capital_label", "capital_amount", "production_amount", "confidence"]) {
      expect(names).toContain(n);
    }
    // numeric preserved separately from text
    const capAmount = claims.find(c => c.claim_name === "capital_amount")!;
    expect(capAmount.value_numeric).toBe("10200");
    const capLabel = claims.find(c => c.claim_name === "capital_label")!;
    expect(capLabel.value_text).toContain("capital returned");
    expect(capLabel.value_numeric).toBe(""); // text claim leaves numeric empty
    // presentation layer/owner
    expect(capAmount.record_layer).toBe("PRESENTATION");
    expect(capAmount.owner).toBe("PRODUCTION_FRONTEND");
  });

  it("(6/16) exposes #11-style divergence: presented capital_amount vs authoritative net_sale_proceeds in one artifact, cent precision preserved", () => {
    const a = assessment({ dispositionResults: [disposition({ netSaleProceeds: 5099.89 })] });
    const presented = chapter({ capitalAmount: 10200, capitalLabel: "$10,200.00 capital returned" });
    const { rows } = parse(buildProductionCsv(a, [presented], CTX));

    const presentedCapital = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "capital_amount")!;
    const authNetProceeds = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "net_sale_proceeds")!;

    expect(presentedCapital.value_numeric).toBe("10200");
    expect(authNetProceeds.value_numeric).toBe("5099.89"); // cent precision survives
    // Divergence is mechanically detectable: the two numbers differ, both present in one file.
    expect(presentedCapital.value_numeric).not.toBe(authNetProceeds.value_numeric);
  });

  it("(7/16) called-away capital_amount links to the SPECIFIC authoritative net_sale_proceeds row, without fingerprint uniqueness", () => {
    const a = assessment({ dispositionResults: [disposition({ contractActivityKey: "-BNO260904C54" })] });
    const { rows } = parse(buildProductionCsv(a, [chapter({ rawSymbol: "-BNO260904C54" })], CTX));

    const netProceeds = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "net_sale_proceeds")!;
    const presentedCapital = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "capital_amount")!;
    // capital_amount links to the net_sale_proceeds economic child (the specific quantity),
    // resolved via contractActivityKey — never fingerprint.
    expect(presentedCapital.supports_record_key).toBe(netProceeds.record_key);
    expect(netProceeds.record_key).toMatch(/^disposition_economic:\d+$/);
  });

  it("correction #3: unrelated claims do not inherit broad disposition support", () => {
    // chapter() defaults linkDirection:"opened" → a called-away RESOLUTION chapter.
    const a = assessment({ dispositionResults: [disposition({ contractActivityKey: "-BNO260904C54" })] });
    const { rows } = parse(buildProductionCsv(a, [chapter({ rawSymbol: "-BNO260904C54" })], CTX));
    const claim = (n: string) => rows.find(r => r.record_type === "presented_claim" && r.claim_name === n)!;
    // primitive/contracts/strike/production_amount(composite)/labels/what_happened get NO support link
    for (const n of ["primitive", "contracts", "strike", "production_amount", "capital_label", "what_happened"]) {
      expect(claim(n).supports_record_key).toBe("");
    }
    // Blocker #3: presentation lifecycle state (complete/in_flight) has NO disposition support.
    expect(claim("state").supports_record_key).toBe("");
    // confidence (rendered from disposition state on called-away resolution) links to the parent.
    const dispParent = rows.find(r => r.record_type === "disposition_result")!;
    expect(claim("confidence").supports_record_key).toBe(dispParent.record_key);
  });

  it("blocker #2: opening chapter sharing the same contract key inherits NO disposition support; only the called-away resolution does", () => {
    const a = assessment({ dispositionResults: [disposition({ contractActivityKey: "-BNO260904C54" })] });
    // An ordinary OPEN chapter (linkDirection "resolves") and a called-away RESOLUTION chapter
    // (linkDirection "opened"), same contract key.
    const opening = chapter({
      rawSymbol: "-BNO260904C54", episodeId: "-BNO260904C54",
      whatHappened: "Wrote call", linkDirection: "resolves", capitalAmount: 5400, confidence: "deterministic",
    });
    const resolution = chapter({
      rawSymbol: "-BNO260904C54", episodeId: "-BNO260904C54",
      whatHappened: "Called away · shares sold", linkDirection: "opened", capitalAmount: 5099.89,
    });
    const { rows } = parse(buildProductionCsv(a, [opening, resolution], CTX));

    // Group the presented claims by presentation_group_key to separate the two chapters.
    const openGroup = rows.filter(r => r.record_type === "presented_claim" && r.presentation_group_key.endsWith("#1"));
    const resolveGroup = rows.filter(r => r.record_type === "presented_claim" && r.presentation_group_key.endsWith("#2"));

    const openCapital = openGroup.find(r => r.claim_name === "capital_amount")!;
    const openConfidence = openGroup.find(r => r.claim_name === "confidence")!;
    expect(openCapital.supports_record_key).toBe("");     // opening capital: NO disposition support
    expect(openConfidence.supports_record_key).toBe("");  // opening confidence: NO disposition support

    const netProceeds = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "net_sale_proceeds")!;
    const dispParent = rows.find(r => r.record_type === "disposition_result")!;
    const resolveCapital = resolveGroup.find(r => r.claim_name === "capital_amount")!;
    const resolveConfidence = resolveGroup.find(r => r.claim_name === "confidence")!;
    expect(resolveCapital.supports_record_key).toBe(netProceeds.record_key); // resolution capital → net_sale_proceeds
    expect(resolveConfidence.supports_record_key).toBe(dispParent.record_key); // resolution confidence → disposition
  });

  it("correction #2: parent_record_key is empty for presented claims; grouping lives in presentation_group_key", () => {
    const { rows } = parse(buildProductionCsv(assessment({}), [chapter({ episodeId: "-BNO260904C54" })], CTX));
    const claims = rows.filter(r => r.record_type === "presented_claim");
    for (const c of claims) {
      expect(c.parent_record_key).toBe(""); // never a grouping token
      expect(c.presentation_group_key).toMatch(/^-BNO260904C54#\d+$/); // episode token here
    }
  });

  it("correction #2: every non-empty parent_record_key resolves to an exported record_key (structural integrity)", () => {
    const a = assessment({
      dispositionResults: [disposition({})],
      transactions: [{ id: "t", date: "2026-09-01", action: "A", symbol: "X", amount: 1, role: "INCLUDED",
        components: [{ type: "PRODUCTION", source: "OPTION_PREMIUM", amount: 1, confidence: "DETERMINISTIC", derivation: "d" }] }],
    });
    const { rows } = parse(buildProductionCsv(a, [chapter({})], CTX));
    const allKeys = new Set(rows.map(r => r.record_key).filter(k => k !== ""));
    for (const r of rows) {
      if (r.parent_record_key !== "") expect(allKeys.has(r.parent_record_key)).toBe(true);
      if (r.supports_record_key !== "") expect(allKeys.has(r.supports_record_key)).toBe(true);
    }
  });

  it("correction #4: presentation_role distinguishes displayed claims from backing values", () => {
    // capital_label displayed differs from capital_amount backing (URA/UNG shape).
    const { rows } = parse(buildProductionCsv(assessment({}),
      [chapter({ capitalLabel: "$4,579.00 deployed", capitalAmount: 4600 })], CTX));
    const label = rows.find(r => r.claim_name === "capital_label")!;
    const amount = rows.find(r => r.claim_name === "capital_amount")!;
    expect(label.presentation_role).toBe("DISPLAYED_CLAIM");
    expect(amount.presentation_role).toBe("PRESENTATION_BACKING_VALUE");
    // The discrepancy is faithfully exposed, not reconciled.
    expect(label.value_text).toContain("4,579.00");
    expect(amount.value_numeric).toBe("4600");
  });

  it("correction #4: expired chapter with null capital_label but non-null capital_amount is exposed faithfully", () => {
    const { rows } = parse(buildProductionCsv(assessment({}),
      [chapter({ primitive: "CC", whatHappened: "Call expired · shares free", capitalLabel: null, capitalAmount: 5400 })], CTX));
    const label = rows.find(r => r.claim_name === "capital_label")!;
    const amount = rows.find(r => r.claim_name === "capital_amount")!;
    expect(label.value_text).toBe(NULL_TOKEN);        // null displayed label
    expect(amount.value_numeric).toBe("5400");         // non-null backing value
    expect(label.presentation_role).toBe("DISPLAYED_CLAIM");
    expect(amount.presentation_role).toBe("PRESENTATION_BACKING_VALUE");
  });

  it("(8/9) duplicate dispositionFingerprint values remain distinct rows; parent/child survives collision", () => {
    const a = assessment({
      dispositionResults: [
        disposition({ dispositionFingerprint: "dup", contractActivityKey: "-AAA260101C10" }),
        disposition({ dispositionFingerprint: "dup", contractActivityKey: "-BBB260101C20" }),
      ],
    });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const parents = rows.filter(r => r.record_type === "disposition_result");
    expect(parents.length).toBe(2);
    // Same fingerprint, DISTINCT export-local keys.
    expect(parents[0].disposition_fingerprint).toBe("dup");
    expect(parents[1].disposition_fingerprint).toBe("dup");
    expect(parents[0].record_key).not.toBe(parents[1].record_key);
    // Each has its own economic children keyed to its own parent.
    const child0 = rows.filter(r => r.record_type === "disposition_economic" && r.parent_record_key === parents[0].record_key);
    const child1 = rows.filter(r => r.record_type === "disposition_economic" && r.parent_record_key === parents[1].record_key);
    expect(child0.length).toBeGreaterThan(0);
    expect(child1.length).toBeGreaterThan(0);
  });

  it("(9) assessed_transaction/component parent relationship survives duplicate transaction ids (non-unique fingerprint)", () => {
    const a = assessment({
      transactions: [
        { id: "same", date: "2026-09-01", action: "A", symbol: "X", amount: 1, role: "INCLUDED",
          components: [{ type: "PRODUCTION", source: "OPTION_PREMIUM", amount: 1, confidence: "DETERMINISTIC", derivation: "d1" }] },
        { id: "same", date: "2026-09-01", action: "A", symbol: "X", amount: 1, role: "INCLUDED",
          components: [{ type: "PRODUCTION", source: "OPTION_PREMIUM", amount: 2, confidence: "DETERMINISTIC", derivation: "d2" }] },
      ],
    });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const txs = rows.filter(r => r.record_type === "assessed_transaction");
    expect(txs.length).toBe(2);
    expect(txs[0].record_key).not.toBe(txs[1].record_key);
    const c0 = rows.filter(r => r.record_type === "economic_component" && r.parent_record_key === txs[0].record_key);
    const c1 = rows.filter(r => r.record_type === "economic_component" && r.parent_record_key === txs[1].record_key);
    expect(c0.map(c => c.value_numeric)).toEqual(["1"]);
    expect(c1.map(c => c.value_numeric)).toEqual(["2"]);
  });

  it("(10) null, zero, and empty text remain distinguishable", () => {
    const a = assessment({ dispositionResults: [disposition({ attributableAcquisitionCash: null, realizedErosion: 0 })] });
    const { rows } = parse(buildProductionCsv(a, [chapter({ conditionalLabel: null, capitalLabel: "" })], CTX));

    const attributable = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "attributable_acquisition_cash")!;
    expect(attributable.value_numeric).toBe(NULL_TOKEN); // null -> NULL token

    const erosion = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "realized_erosion")!;
    expect(erosion.value_numeric).toBe("0"); // zero stays zero

    const conditional = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "conditional_label")!;
    expect(conditional.value_text).toBe(NULL_TOKEN); // null text -> NULL token

    const capLabel = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "capital_label")!;
    expect(capLabel.value_text).toBe(""); // empty string stays empty, distinct from NULL
  });

  it("(11) PARTIAL / UNRESOLVED / BASIS_UNKNOWN remain explicit literal states", () => {
    const a = assessment({
      dispositionResults: [disposition({ state: "PARTIAL" }), disposition({ state: "UNRESOLVED", contractActivityKey: null })],
      transactions: [{ id: "t", date: "2026-09-01", action: "A", symbol: "X", amount: 1, role: "UNCERTAIN",
        components: [{ type: "PRINCIPAL_MOVEMENT", source: null, amount: 1, confidence: "BASIS_UNKNOWN", derivation: "d" }] }],
    });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const states = rows.filter(r => r.record_type === "disposition_result").map(r => r.state_or_confidence);
    expect(states).toContain("PARTIAL");
    expect(states).toContain("UNRESOLVED");
    const comp = rows.find(r => r.record_type === "economic_component")!;
    expect(comp.state_or_confidence).toBe("BASIS_UNKNOWN");
  });

  it("(12) broker run date is named broker_run_date, never a generic economic 'date'", () => {
    const { header, rows } = parse(buildProductionCsv(assessment({ dispositionResults: [disposition({ date: "2026-09-08" })] }), [], CTX));
    expect(header).toContain("broker_run_date");
    expect(header).not.toContain("date");
    const disp = rows.find(r => r.record_type === "disposition_result")!;
    expect(disp.broker_run_date).toBe("2026-09-08");
  });

  it("(13) export generation time is labeled export_generated_at and not confused with evidence time", () => {
    const { rows } = parse(buildProductionCsv(assessment({}), [], CTX));
    const gen = rows.find(r => r.record_type === "assessment_meta" && r.claim_name === "export_generated_at")!;
    expect(gen.value_text).toBe("2026-09-30T12:00:00.000Z");
    expect(gen.owner).toBe("EXPORT");
    expect(gen.record_layer).toBe("SOURCE_CONTEXT");
    expect(gen.provenance_text.toLowerCase()).toContain("not assessment");
    // build revision is honestly NULL, not fabricated
    const build = rows.find(r => r.record_type === "assessment_meta" && r.claim_name === "build_revision")!;
    expect(build.value_text).toBe(NULL_TOKEN);
  });
});

describe("buildProductionCsv — CSV fidelity & safety", () => {
  it("(14) preserves commas, quotes, newlines, and Unicode via RFC-4180 quoting", () => {
    const a = assessment({
      reconciliationIssues: [{ type: "X", description: 'has, comma "quote" and\nnewline · café ☕', potentialImpact: null }],
    });
    const text = buildProductionCsv(a, [], CTX);
    const { rows } = parse(text);
    const issue = rows.find(r => r.record_type === "reconciliation_issue")!;
    expect(issue.label_text).toBe('has, comma "quote" and\nnewline · café ☕');
  });

  it("(15) formula-like FREE TEXT is neutralized reversibly (leading apostrophe, content recoverable)", () => {
    const a = assessment({
      reconciliationIssues: [{ type: "X", description: "=SUM(A1:A2)", potentialImpact: null }],
    });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const issue = rows.find(r => r.record_type === "reconciliation_issue")!;
    // Free text neutralized with one leading apostrophe; stripping it recovers the original.
    expect(issue.label_text).toBe("'=SUM(A1:A2)");
    expect(issue.label_text.replace(/^'/, "")).toBe("=SUM(A1:A2)");
  });

  it("(15/correction #5) IDENTIFIERS (OCC symbol / keys) survive round-trip byte-for-byte, NOT neutralized", () => {
    // OCC contract symbols begin with "-" (a formula trigger) — they must NOT be mutated.
    const a = assessment({ dispositionResults: [disposition({ contractActivityKey: "-BNO260904C54" })] });
    const { rows } = parse(buildProductionCsv(a, [chapter({ rawSymbol: "-BNO260904C54" })], CTX));
    const disp = rows.find(r => r.record_type === "disposition_result")!;
    // contract_activity_key recovers exactly, no apostrophe prefix.
    expect(disp.contract_activity_key).toBe("-BNO260904C54");
    const presented = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "primitive")!;
    expect(presented.contract_activity_key).toBe("-BNO260904C54");
    // presentation_group_key (also starts with "-") is preserved exactly.
    expect(presented.presentation_group_key).toBe("-BNO260904C54#1");
  });

  it("(15b) negative economic numbers live in value_numeric and are NOT formula-neutralized", () => {
    const a = assessment({ realizedCapitalErosion: -12.5 });
    const { rows } = parse(buildProductionCsv(a, [], CTX));
    const erosion = rows.find(r => r.record_type === "authoritative_summary" && r.claim_name === "realized_capital_erosion")!;
    expect(erosion.value_numeric).toBe("-12.50"); // no apostrophe on numeric column
  });

  it("(clarification #5) source filename appears when supplied and is labeled workflow/source context (not backend-attested)", () => {
    const { rows } = parse(buildProductionCsv(assessment({}), [], { ...CTX, sourceFilename: "Accounts_History.csv" }));
    const fn = rows.find(r => r.record_type === "assessment_meta" && r.claim_name === "source_filename")!;
    expect(fn.value_text).toBe("Accounts_History.csv");
    expect(fn.owner).toBe("EXPORT");
    expect(fn.record_layer).toBe("SOURCE_CONTEXT");
    expect(fn.provenance_text.toLowerCase()).toContain("not backend-attested");
  });

  it("(blocker #4) encoding-contract metadata rows are present and honest (no simultaneous byte-exact + spreadsheet-safe claim)", () => {
    const { rows } = parse(buildProductionCsv(assessment({}), [], CTX));
    const contract = rows.filter(r => r.record_type === "assessment_meta" && r.claim_name.startsWith("encoding."));
    const byName = Object.fromEntries(contract.map(r => [r.claim_name, r.value_text]));
    expect(byName["encoding.free_text"]).toContain("REVERSIBLE");
    expect(byName["encoding.identifiers"]).toContain("NOT guaranteed spreadsheet-safe");
    expect(byName["encoding.numeric"]).toContain("locale-independent");
    expect(byName["encoding.null_zero_empty"]).toContain("distinct");
  });

  it("(17) ordering is deterministic for a fixed response/view-model pair", () => {
    const a = assessment({ dispositionResults: [disposition({})], transactions: [] });
    const chapters = [chapter({}), chapter({ episodeId: "-XYZ260101C10", rawSymbol: "-XYZ260101C10", underlying: "XYZ" })];
    const first = buildProductionCsv(a, chapters, CTX);
    const second = buildProductionCsv(a, chapters, CTX);
    expect(first).toBe(second);
  });

  it("(18) export performs no economic recomputation — presented economics equal the chapter values supplied, backend equals response", () => {
    // Deliberately make presented and backend disagree; the export must faithfully carry BOTH,
    // proving it did not "reconcile" or recompute either side.
    const a = assessment({ dispositionResults: [disposition({ netSaleProceeds: 5099.89, realizedAppreciation: 799.77 })] });
    const presented = chapter({ productionAmount: 999.99, capitalAmount: 10200 }); // intentionally != backend
    const { rows } = parse(buildProductionCsv(a, [presented], CTX));

    const presentedProd = rows.find(r => r.record_type === "presented_claim" && r.claim_name === "production_amount")!;
    const authAppreciation = rows.find(r => r.record_type === "disposition_economic" && r.claim_name === "realized_appreciation")!;
    expect(presentedProd.value_numeric).toBe("999.99"); // exactly what the chapter carried
    expect(authAppreciation.value_numeric).toBe("799.77"); // exactly what the response carried
  });

  it("handles a null assessment (no rows beyond export/source context meta)", () => {
    const { rows } = parse(buildProductionCsv(null, [], CTX));
    expect(rows.every(r => r.record_type === "assessment_meta")).toBe(true);
    expect(rows.some(r => r.claim_name === "export_generated_at")).toBe(true);
  });
});
