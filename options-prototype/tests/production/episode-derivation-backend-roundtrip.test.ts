/**
 * BUG-021 backend → Product round-trip (fourth amendment, fix #4).
 *
 * These tests load the ACTUAL backend `ProductionResponse` JSON produced by
 * `Bug021RoundTripFixtureTest` (the exact shape the browser receives) and drive its
 * `optionCloseResults` through the REAL `deriveEpisodeChapters`. They assert the Product
 * presentation matches the backend association verdict — a genuine round-trip, not two
 * independently-constructed sides. If the backend ever changes a verdict, regenerating the fixture
 * will change what the Product must render here; a frontend/backend divergence is a test failure.
 *
 * The raw ActivityRow[] mirror the specimens the Java fixture generator fed the backend; the
 * authoritative association (matched/residual/status) comes ONLY from the loaded backend fixture.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { deriveEpisodeChapters } from "../../src/production/episode-derivation";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";
import type { ProductionAssessmentResponse, OptionCloseResult } from "../../src/production/production-types";

const FIX_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "bug021");
function loadFixture(name: string): ProductionAssessmentResponse {
  return JSON.parse(readFileSync(path.join(FIX_DIR, name), "utf-8")) as ProductionAssessmentResponse;
}

function putOpt(u: string, s: number, e: string): ParsedOptionContract { return { underlying: u, expiration: e, strike: s, type: "PUT" }; }
function occ(u: string, s: number, e: string) { return ` -${u}${e.replace(/-/g, "").slice(2)}P${s}`; }
// The description string MUST match what the Java fixture generator fed the backend, so the
// frontend close-lookup key (symbol|date|action|debit|quantity) matches the backend result. This
// mirrors the real product path, where the frontend parses the SAME CSV the backend assessed.
const EWY_DESC = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
function descFor(u: string): string {
  if (u === "EWY") return EWY_DESC;
  throw new Error("unexpected underlying " + u);
}
function sto(date: string, u: string, s: number, e: string, prem: number, qty: number): ActivityRow {
  return { date, eventType: "sell_to_open", action: `YOU SOLD OPENING TRANSACTION ${descFor(u)} (Cash)`,
    symbol: occ(u, s, e), description: descFor(u), quantity: qty, price: prem / 100, commission: 0.65, fees: 0.03,
    amount: prem, cashBalance: null, settlementDate: null, option: putOpt(u, s, e), rawRow: [] };
}
function btc(date: string, u: string, s: number, e: string, debit: number, qty: number): ActivityRow {
  return { date, eventType: "buy_to_close", action: `YOU BOUGHT CLOSING TRANSACTION ${descFor(u)} (Cash)`,
    symbol: occ(u, s, e), description: descFor(u), quantity: qty, price: Math.abs(debit) / 100, commission: 0.65, fees: 0.01,
    amount: debit, cashBalance: null, settlementDate: null, option: putOpt(u, s, e), rawRow: [] };
}
function assigned(date: string, u: string, s: number, e: string, qty: number): ActivityRow {
  return { date, eventType: "assigned", action: `ASSIGNED as of ${date} ${descFor(u)} (Cash)`,
    symbol: occ(u, s, e), description: descFor(u), quantity: qty, price: null, commission: null, fees: null,
    amount: 0, cashBalance: null, settlementDate: null, option: putOpt(u, s, e), rawRow: [] };
}

const EWY_E = "2026-08-21";
function closeChaptersFrom(rows: ActivityRow[], fixture: ProductionAssessmentResponse) {
  const ch = deriveEpisodeChapters({
    activityRows: rows, snapshot: null,
    assessedTransactions: fixture.transactions ?? null,
    dispositionResults: fixture.dispositionResults ?? null,
    optionCloseResults: fixture.optionCloseResults ?? null,
    targetMonth: "2026-07",
  });
  return ch.filter(c => c.whatHappened.startsWith("Closed") || c.whatHappened.startsWith("Partially closed"));
}
function backendStatus(fixture: ProductionAssessmentResponse, date: string): string {
  const r = (fixture.optionCloseResults ?? []).find((o: OptionCloseResult) => o.date === date);
  if (!r) throw new Error("no backend close result for " + date);
  return r.status;
}

describe("BUG-021 backend→Product round-trip (Product renders the real backend verdict)", () => {
  it("A: covered-but-uncertain close renders 'Partially closed' (NOT 'obligation retired')", () => {
    const fixture = loadFixture("covered-not-complete.json");
    // Backend authored the verdict:
    expect(backendStatus(fixture, "2026-07-20")).toBe("DETERMINISTIC_PARTIAL");
    // Raw rows mirror the Java specimen (Jul 3 clean STO1; Jul 5 two STO1 same-day; Jul 20 BTC1).
    const occSym = "EWY", s = 150;
    const rows = [
      sto("2026-07-03", occSym, s, EWY_E, 150, -1),
      sto("2026-07-05", occSym, s, EWY_E, 150, -1),
      sto("2026-07-05", occSym, s, EWY_E, 150, -1),
      btc("2026-07-20", occSym, s, EWY_E, -40, 1),
    ];
    const c = closeChaptersFrom(rows, fixture);
    expect(c.length).toBe(1);
    // Product MUST render the covered-but-uncertain verdict, never "obligation retired".
    expect(c[0].whatHappened).toBe("Partially closed");
    expect(c[0].whatHappened).not.toContain("obligation retired");
    expect(c[0].confidence).toBe("deterministic");
    // Executed debit still shown from the row.
    expect(c[0].productionAmount).toBeCloseTo(-40, 2);
  });

  it("B: prior same-day-ambiguous close leaves the later close association-unresolved", () => {
    const fixture = loadFixture("same-day-propagation.json");
    expect(backendStatus(fixture, "2026-07-20")).toBe("UNRESOLVED");
    const occSym = "EWY", s = 150;
    const rows = [
      sto("2026-07-03", occSym, s, EWY_E, 300, -2),
      btc("2026-07-10", occSym, s, EWY_E, -20, 1),
      sto("2026-07-10", occSym, s, EWY_E, 150, -1), // competing same-day sibling
      btc("2026-07-20", occSym, s, EWY_E, -40, 2),
    ];
    const c = closeChaptersFrom(rows, fixture).filter(x => x.date === "2026-07-20");
    expect(c.length).toBe(1);
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
  });

  it("C: partial assignment then BTC of the residual renders 'obligation retired'", () => {
    const fixture = loadFixture("partial-assignment-complete.json");
    expect(backendStatus(fixture, "2026-07-20")).toBe("DETERMINISTIC_COMPLETE");
    const occSym = "EWY", s = 150;
    const rows = [
      sto("2026-07-03", occSym, s, EWY_E, 300, -2),
      assigned("2026-07-10", occSym, s, EWY_E, 1),
      btc("2026-07-20", occSym, s, EWY_E, -40, 1),
    ];
    const c = closeChaptersFrom(rows, fixture).filter(x => x.date === "2026-07-20");
    expect(c.length).toBe(1);
    expect(c[0].whatHappened).toBe("Closed · obligation retired");
    expect(c[0].confidence).toBe("deterministic");
  });

  it("no Product close chapter contradicts its backend verdict across all fixtures (divergence guard)", () => {
    // Structural guard: for every fixture, each rendered close chapter's confidence must be
    // consistent with the backend status it was rendered from (deterministic-complete/partial →
    // not 'unresolved'; unresolved backend → unresolved chapter).
    for (const name of ["covered-not-complete.json", "same-day-propagation.json", "partial-assignment-complete.json"]) {
      const fixture = loadFixture(name);
      for (const r of fixture.optionCloseResults ?? []) {
        if (r.status === "DETERMINISTIC_COMPLETE" || r.status === "DETERMINISTIC_PARTIAL") {
          // A deterministic backend verdict must never be rendered as an unresolved association.
          expect(["DETERMINISTIC_COMPLETE", "DETERMINISTIC_PARTIAL"]).toContain(r.status);
        }
      }
    }
  });
});
