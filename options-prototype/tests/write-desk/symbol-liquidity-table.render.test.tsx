// @vitest-environment jsdom
/**
 * Observed Symbol Liquidity table (PL-EVID-OBS v1) — render behavior:
 * default sort median spread ascending, unmeasured rows pinned last in both
 * directions, limited coverage labelled, click-through hands the symbol to the
 * Cash Deployment symbol filter.
 */
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { SymbolLiquidityTable } from "../../src/components/SymbolLiquidityTable";
import { CrossEntryStrip } from "../../src/components/CrossEntryStrip";
import type { SnapshotSymbol } from "../../src/write-desk/symbol-liquidity";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import type { PutCandidate } from "../../src/write-desk/candidate-types";

const ADM = { admissible: true };
const quote = (spreadPct: number, n: number) =>
  Array(n).fill({ delta: -0.3, bid: 1 - spreadPct / 200, ask: 1 + spreadPct / 200, openInterest: 5000, volume: 3 });
const s = (symbol: string, spreadPct: number, n: number, expirations = 2, admissible = true): SnapshotSymbol => ({
  symbol,
  status: "ready",
  expirations: [{ date: "2026-11-06", dte: 10 }, { date: "2026-11-20", dte: 24 }],
  chains: ["2026-11-06", "2026-11-20"].slice(0, expirations).map((expiration) => ({
    expiration,
    admissibility: admissible ? ADM : { admissible: false },
    chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: new Date().toISOString() },
    data: { expiration, puts: quote(spreadPct, n), calls: [] },
  })),
});

const SYMBOLS: SnapshotSymbol[] = [
  s("WIDE", 9, 20),
  s("TIGHT", 0.5, 30),
  s("STALE", 0.1, 30, 2, false), // not current → unmeasured, pinned last
  s("ONEX", 2, 40, 1), // one deep expiration: measured, single-expiration breadth
  s("FEW", 3, 4), // thin sample
  { symbol: "NOOPT", status: "absent" },
];

const order = () => Array.from(document.querySelectorAll("tbody tr")).map((tr) => tr.querySelector(".ic-col-symbol")?.textContent);
const header = (label: string) => screen.getAllByRole("columnheader").find((th) => th.textContent?.startsWith(label))!;

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("SymbolLiquidityTable", () => {
  it("defaults to median spread ascending with unmeasured evidence last", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect(order()).toEqual(["TIGHT", "ONEX", "FEW", "WIDE", "STALE"]);
    expect(screen.getByText(/1 with no listed options/)).toBeTruthy();
  });

  it("keeps unmeasured evidence last when the sort direction is reversed", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    fireEvent.click(header("Med spread")); // toggle to descending
    expect(order()).toEqual(["WIDE", "FEW", "ONEX", "TIGHT", "STALE"]);
  });

  it("separates sample sufficiency from expiration breadth and labels not-current evidence", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    const rowOf = (sym: string) => Array.from(document.querySelectorAll("tbody tr")).find((tr) => tr.querySelector(".ic-col-symbol")?.textContent === sym)!;
    // One deep expiration: Measured, breadth tagged "single" — not a coverage deficiency.
    expect(rowOf("ONEX").textContent).toContain("Measured");
    expect(rowOf("ONEX").textContent).toContain("single");
    expect(rowOf("FEW").textContent).toContain("Thin sample");
    expect(rowOf("FEW").textContent).not.toContain("single");
    expect(rowOf("STALE").textContent).toContain("Not current evidence");
    expect(rowOf("TIGHT").textContent).toContain("Measured");
  });

  it("multi-sorts: Liquid share then Shift-click Contracts orders ties by sample size", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    fireEvent.click(header("Liquid share")); // desc: all measured rows are 100% → tie
    fireEvent.click(header("Contracts"), { shiftKey: true }); // desc within the tie
    expect(header("Contracts").textContent).toContain("2▼");
    // TIGHT 60 > WIDE 40 = ONEX 40 (tie keeps prior order) > FEW 8; unmeasured last.
    expect(order()).toEqual(["TIGHT", "WIDE", "ONEX", "FEW", "STALE"]);
  });

  it("exports the displayed sort order with explicit denominators and breadth", async () => {
    let captured: Blob | null = null;
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = ((b: Blob) => { captured = b; return "blob:test"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    try {
      render(<SymbolLiquidityTable symbols={SYMBOLS} />);
      fireEvent.click(screen.getByTitle(/Download as CSV/));
      expect(captured).not.toBeNull();
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(captured as unknown as Blob);
      });
      const lines = text.trim().split(/\r?\n/);
      const head = lines[0].split(",");
      for (const col of ["Symbol", "Spot", "Evidence", "MedianSpread%", "LiquidShare%", "MeasuredContracts", "ZeroBidContracts", "AdmissibleChains", "NotAdmissibleChains", "SingleExpiration", "VolumePartial"]) {
        expect(head).toContain(col);
      }
      const sym = head.indexOf("Symbol");
      expect(lines.slice(1).map((l) => l.split(",")[sym])).toEqual(["TIGHT", "ONEX", "FEW", "WIDE", "STALE"]);
      const one = lines.slice(1).map((l) => l.split(",")).find((r) => r[sym] === "ONEX")!;
      expect(one[head.indexOf("Evidence")]).toBe("measured");
      expect(one[head.indexOf("SingleExpiration")]).toBe("yes");
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });

  it("hands the selected symbol to the Cash Deployment symbol filter", () => {
    const put = (symbol: string): PutCandidate => ({
      rank: 1, symbol, expiration: "2026-11-20", dte: 24, strike: 30, delta: -0.3, underlyingPrice: 32,
      bid: 0.49, ask: 0.51, mid: 0.5, spreadPercent: 4, openInterest: 1200, volume: 10,
      cashRequired: 3000, cashRemaining: 500, yieldAnnualized: 20,
      assessment: { score: 90, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
      posture: "ACTIONABLE", affordable: true, governance: { status: "authorized", reason: "" },
    });
    let request: { symbol: string; seq: number } | null = null;
    const { rerender } = render(
      <>
        <SymbolLiquidityTable symbols={SYMBOLS} onSelectSymbol={(symbol) => { request = { symbol, seq: (request?.seq ?? 0) + 1 }; }} />
        <CrossEntryStrip putCandidates={[put("TIGHT"), put("WIDE")]} buyWriteCandidates={[]} policy={DEFAULT_RECOMMENDATION_POLICY} onSelectPut={() => {}} onSelectBuyWrite={() => {}} symbolFilterRequest={request} />
      </>,
    );
    const tightRow = Array.from(document.querySelectorAll(".ic-table tbody tr")).find((tr) => tr.textContent?.startsWith("TIGHT"))!;
    fireEvent.click(tightRow);
    rerender(
      <>
        <SymbolLiquidityTable symbols={SYMBOLS} onSelectSymbol={() => {}} />
        <CrossEntryStrip putCandidates={[put("TIGHT"), put("WIDE")]} buyWriteCandidates={[]} policy={DEFAULT_RECOMMENDATION_POLICY} onSelectPut={() => {}} onSelectBuyWrite={() => {}} symbolFilterRequest={request} />
      </>,
    );
    const crossSymbols = Array.from(document.querySelectorAll(".wd-cross-entry-table tbody tr")).map((tr) => tr.querySelector(".wd-symbol")?.textContent);
    expect(crossSymbols).toEqual(["TIGHT"]);
    expect((screen.getByPlaceholderText("e.g. SPY, QQQ") as HTMLInputElement).value).toBe("TIGHT");
  });

  it("applies DTE/type/delta filters to the displayed rows and rejects invalid ranges explicitly", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect(screen.getByLabelText("Active filter").textContent).toContain("7–45 DTE");
    // 24–24 DTE: ONEX only has a 10-DTE chain, so its 24-DTE expiration is listed but not observed.
    fireEvent.change(screen.getByLabelText("Min DTE"), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText("Max DTE"), { target: { value: "24" } });
    const rowOf = (sym: string) => Array.from(document.querySelectorAll("tbody tr")).find((tr) => tr.querySelector(".ic-col-symbol")?.textContent === sym)!;
    expect(rowOf("ONEX").textContent).toContain("Listed, not observed");
    expect(screen.getByLabelText("Active filter").textContent).toContain("24–24 DTE");
    // Out of coverage → rejected, nothing computed, export disabled.
    fireEvent.change(screen.getByLabelText("Max DTE"), { target: { value: "52" } });
    expect(screen.getByRole("alert").textContent).toMatch(/observed coverage/);
    expect((screen.getByTitle(/Fix the filter/) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText("Reset filters"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText("Active filter").textContent).toContain("7–45 DTE");
  });

  it("CSV carries the active filter settings on every row and matches the table population", async () => {
    let captured: Blob | null = null;
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = ((b: Blob) => { captured = b; return "blob:test"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      render(<SymbolLiquidityTable symbols={SYMBOLS} />);
      fireEvent.change(screen.getByLabelText("Option type"), { target: { value: "puts" } });
      fireEvent.change(screen.getByLabelText("Max absolute delta"), { target: { value: "0.30" } });
      fireEvent.click(screen.getByTitle(/Download as CSV/));
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(captured as unknown as Blob);
      });
      const lines = text.trim().split(/\r?\n/);
      const head = lines[0].split(",");
      for (const col of ["FilterMinDTE", "FilterMaxDTE", "FilterOptionType", "FilterMinAbsDelta", "FilterMaxAbsDelta", "WidthDiscovery", "MedianAbsSpreadPerShare", "ListedNotObserved", "QuotedWidthCount", "MinQuotedWidth", "MaxQuotedWidth", "QuotedPairs", "ListedWidthCount", "ListedPairs", "WidthQuotedListedPairs", "ExecutableVerticalEstablished"]) {
        expect(head).toContain(col);
      }
      expect(head).not.toContain("FilterWidths");
      const body = lines.slice(1).map((l) => l.split(","));
      expect(body.length).toBe(document.querySelectorAll("tbody tr").length);
      for (const r of body) {
        expect(r[head.indexOf("FilterOptionType")]).toBe("puts");
        expect(r[head.indexOf("FilterMaxAbsDelta")]).toBe("0.3");
        expect(r[head.indexOf("ExecutableVerticalEstablished")]).toBe("no");
      }
      const tableSymbols = Array.from(document.querySelectorAll("tbody tr")).map((tr) => tr.querySelector(".ic-col-symbol")?.textContent);
      expect(body.map((r) => r[head.indexOf("Symbol")])).toEqual(tableSymbols);
      // Filtering is local: no provider or backend request is made.
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
      fetchSpy.mockRestore();
    }
  });

  it("never labels quoted widths executable", () => {
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect(document.body.textContent).toContain("quoted widths are not executable vertical prices");
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/executable vertical:|executable pair/);
  });

  it("has no width input and discovers all quoted short-put widths automatically (table + CSV)", async () => {
    const strikePut = (strike: number, delta: number, bid: number, ask: number) => ({ strike, delta, bid, ask, openInterest: 5000, volume: 3 });
    const spread: SnapshotSymbol = {
      symbol: "SPRD",
      status: "ready",
      expirations: [{ date: "2026-11-20", dte: 24 }],
      chains: [{
        expiration: "2026-11-20",
        admissibility: ADM,
        chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: new Date().toISOString() },
        // Short 50 (Δ.30) pairs with 49 ($1), 47.5 ($2.50) and 13 ($37, zero-bid → listed only).
        data: { expiration: "2026-11-20", puts: [strikePut(50, -0.3, 1, 1.02), strikePut(49, -0.1, 0.5, 0.52), strikePut(47.5, -0.05, 0.2, 0.22), strikePut(13, -0.01, 0, 0.05)], calls: [] },
      }],
    };
    let captured: Blob | null = null;
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = ((b: Blob) => { captured = b; return "blob:test"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    try {
      render(<SymbolLiquidityTable symbols={[...SYMBOLS, spread]} />);
      expect(screen.queryByLabelText("Spread widths")).toBeNull();
      expect(document.body.textContent).not.toMatch(/Widths \$/);
      const row = Array.from(document.querySelectorAll("tbody tr")).find((tr) => tr.querySelector(".ic-col-symbol")?.textContent === "SPRD")!;
      const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
      expect(cells).toContain("2 · $1–$2.50");
      expect(cells).toContain("2/3");
      // Contracts without strikes cannot form pairs: discovered nothing, not "not evaluated".
      const tight = Array.from(document.querySelectorAll("tbody tr")).find((tr) => tr.querySelector(".ic-col-symbol")?.textContent === "TIGHT")!;
      expect(tight.textContent).toContain("none listed");

      fireEvent.click(screen.getByTitle(/Download as CSV/));
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(captured as unknown as Blob);
      });
      const lines = text.trim().split(/\r?\n/);
      const head = lines[0].split(",");
      const r = lines.slice(1).map((l) => l.split(",")).find((x) => x[head.indexOf("Symbol")] === "SPRD")!;
      expect(r[head.indexOf("QuotedWidthCount")]).toBe("2");
      expect(r[head.indexOf("MinQuotedWidth")]).toBe("1.00");
      expect(r[head.indexOf("MaxQuotedWidth")]).toBe("2.50");
      expect(r[head.indexOf("QuotedPairs")]).toBe("2");
      expect(r[head.indexOf("ListedPairs")]).toBe("3");
      expect(r[head.indexOf("WidthQuotedListedPairs")]).toBe("1:1/1 2.5:1/1 37:0/1");
      expect(r[head.indexOf("ExecutableVerticalEstablished")]).toBe("no");

      // Calls-only: put verticals are not evaluated.
      fireEvent.change(screen.getByLabelText("Option type"), { target: { value: "calls" } });
      const callsRow = Array.from(document.querySelectorAll("tbody tr")).find((tr) => tr.querySelector(".ic-col-symbol")?.textContent === "SPRD")!;
      expect(callsRow.textContent).not.toContain("$2.50");
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });

  it("restores the operator's filter controls after a refresh (remount)", () => {
    const first = render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    fireEvent.change(screen.getByLabelText("Min DTE"), { target: { value: "38" } });
    fireEvent.change(screen.getByLabelText("Option type"), { target: { value: "puts" } });
    fireEvent.change(screen.getByLabelText("Min absolute delta"), { target: { value: "0.20" } });
    fireEvent.change(screen.getByLabelText("Max absolute delta"), { target: { value: "0.30" } });
    fireEvent.change(screen.getByLabelText("Filter symbols"), { target: { value: "TI" } });
    first.unmount();
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect((screen.getByLabelText("Min DTE") as HTMLInputElement).value).toBe("38");
    expect((screen.getByLabelText("Max DTE") as HTMLInputElement).value).toBe("45");
    expect((screen.getByLabelText("Option type") as HTMLSelectElement).value).toBe("puts");
    expect((screen.getByLabelText("Min absolute delta") as HTMLInputElement).value).toBe("0.20");
    expect((screen.getByLabelText("Max absolute delta") as HTMLInputElement).value).toBe("0.30");
    expect((screen.getByLabelText("Filter symbols") as HTMLInputElement).value).toBe("TI");
    expect(screen.getByLabelText("Active filter").textContent).toContain("38–45 DTE");
  });

  it("ignores a width setting saved by the earlier version and Reset restores the defaults across a refresh", () => {
    localStorage.clear();
    const legacy = render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    legacy.unmount();
    // Simulate a workspace saved before width discovery (carried a `widths` field).
    const key = Object.keys(localStorage).find((k) => (localStorage.getItem(k) ?? "").includes("writeDeskSymbolLiquidityControls"))!;
    const ws = JSON.parse(localStorage.getItem(key)!);
    ws.writeDeskSymbolLiquidityControls = { ...ws.writeDeskSymbolLiquidityControls, minDte: "38", optionType: "puts", widths: "" };
    localStorage.setItem(key, JSON.stringify(ws));

    const restored = render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect(screen.getByLabelText("Active filter").textContent).toContain("38–45 DTE");
    expect(screen.queryByLabelText("Spread widths")).toBeNull();
    fireEvent.click(screen.getByText("Reset filters"));
    expect(screen.getByLabelText("Active filter").textContent).toContain("7–45 DTE");
    expect(JSON.parse(localStorage.getItem(key)!).writeDeskSymbolLiquidityControls).not.toHaveProperty("widths");
    restored.unmount();
    render(<SymbolLiquidityTable symbols={SYMBOLS} />);
    expect((screen.getByLabelText("Min DTE") as HTMLInputElement).value).toBe("7");
    expect((screen.getByLabelText("Option type") as HTMLSelectElement).value).toBe("all");
  });
});
