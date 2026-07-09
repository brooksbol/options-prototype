/**
 * CSV Import Lab — document model visibility laboratory.
 *
 * Page narrative:
 *   1. IDENTITY — "What document is this?" (2-second verification)
 *   2. TRUST — warnings only when relevant (silence = success)
 *   3. DOCUMENT CONTENTS — "What did the parser find?" (grouped by concept)
 *   4. IMPORT PREVIEW — "What would importing do?" (one action statement)
 *   5. ADVANCED — engineering details (collapsed, secondary)
 */

import { useState } from "react";
import { parseCsv, detectDelimiter, type CsvDocument } from "../csv/reader";
import { classifyDocument, type ClassificationResult, type ParsedDocument } from "../csv/registry";
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { HoldingRow } from "../csv/fidelity/positionsParser";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import { FIDELITY_OPTION_SUMMARY_FIXTURE, UNKNOWN_CSV_FIXTURE } from "../csv/fixtures/optionSummary";
import { FIDELITY_POSITIONS_FIXTURE } from "../csv/fixtures/positions";
import { FIDELITY_ACTIVITY_FIXTURE } from "../csv/fixtures/activity";

import "../csv/fidelity/index";

// --- Collapsible ---

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="csv-collapsible">
      <button className="csv-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="csv-collapsible-arrow">{open ? "▼" : "▶"}</span>
        <span>{title}</span>
      </button>
      {open && <div className="csv-collapsible-body">{children}</div>}
    </div>
  );
}

// --- Formatting ---

function formatEventType(et: string): string {
  switch (et) {
    case "sell_to_open": return "Sell to Open";
    case "buy_to_close": return "Buy to Close";
    case "assigned": return "Assigned";
    case "expired": return "Expired";
    case "shares_bought_assignment": return "Shares Bought (Assignment)";
    case "shares_sold_assignment": return "Shares Sold (Assignment)";
    case "dividend": return "Dividend";
    case "treasury": return "Treasury";
    case "cash_movement": return "Cash Movement";
    case "reinvestment": return "Reinvestment";
    case "other": return "Other";
    default: return et;
  }
}

// --- SECTION: Document Contents (payload-specific) ---

function OptionSummaryContents({ rows }: { rows: OptionSummaryRow[] }) {
  // Group by strategy
  const coveredCalls = rows.filter((r) => r.strategy === "CoveredCall");
  const ccShares = coveredCalls.filter((r) => r.positionType === "share").length;
  const ccOptions = coveredCalls.filter((r) => r.positionType === "option");

  const csPuts = rows.filter((r) => r.strategy === "CashCoveredPut");
  const unpaired = rows.filter((r) => r.strategy === "UnpairedShares");

  const contracts = rows.filter((r) => r.option).map((r) => r.option!);
  const symbols = [...new Set(rows.map((r) => r.symbol))];

  return (
    <div className="csv-contents">
      <div className="csv-contents-group">
        <h4>Covered Calls</h4>
        {coveredCalls.length > 0 ? (
          <>
            <div className="csv-contents-row">
              <span className="csv-contents-value">{ccShares}</span>
              <span className="csv-contents-label">share rows (paired)</span>
            </div>
            <div className="csv-contents-row">
              <span className="csv-contents-value">{ccOptions.length}</span>
              <span className="csv-contents-label">call contracts</span>
            </div>
            {ccOptions.map((r, i) => r.option && (
              <div key={i} className="csv-contents-contract">
                {r.option.underlying} {r.option.expiration} ${r.option.strike} {r.option.type} × {Math.abs(r.quantity)}
              </div>
            ))}
          </>
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Cash-Covered Puts</h4>
        {csPuts.length > 0 ? (
          <>
            <div className="csv-contents-row">
              <span className="csv-contents-value">{csPuts.length}</span>
              <span className="csv-contents-label">put contracts</span>
            </div>
            {csPuts.map((r, i) => r.option && (
              <div key={i} className="csv-contents-contract">
                {r.option.underlying} {r.option.expiration} ${r.option.strike} {r.option.type} × {Math.abs(r.quantity)}
              </div>
            ))}
          </>
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Unpaired Shares</h4>
        {unpaired.length > 0 ? (
          unpaired.map((r, i) => (
            <div key={i} className="csv-contents-row">
              <span className="csv-contents-value">{r.quantity}</span>
              <span className="csv-contents-label">{r.symbol}</span>
            </div>
          ))
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Summary</h4>
        <div className="csv-contents-row">
          <span className="csv-contents-value">{rows.length}</span>
          <span className="csv-contents-label">strategy rows</span>
        </div>
        <div className="csv-contents-row">
          <span className="csv-contents-value">{contracts.length}</span>
          <span className="csv-contents-label">option contracts</span>
        </div>
        <div className="csv-contents-detail">
          Symbols: {symbols.join(", ")}
        </div>
      </div>
    </div>
  );
}

function HoldingsContents({ rows }: { rows: HoldingRow[] }) {
  const equity = rows.filter((r) => r.assetClass === "equity");
  const options = rows.filter((r) => r.assetClass === "option");
  const fixedIncome = rows.filter((r) => r.assetClass === "fixed_income");
  const cash = rows.filter((r) => r.assetClass === "cash_equivalent");

  // Option underlyings (deduplicated)
  const optionUnderlyings = [...new Set(options.filter((r) => r.option).map((r) => r.option!.underlying))];
  // Fixed income count (CUSIPs)
  const cusips = fixedIncome.map((r) => r.symbol);

  return (
    <div className="csv-contents">
      <div className="csv-contents-group">
        <h4>Equity / ETF</h4>
        {equity.length > 0 ? (
          equity.map((r, i) => (
            <div key={i} className="csv-contents-row">
              <span className="csv-contents-value">{r.quantity}</span>
              <span className="csv-contents-label">{r.symbol}</span>
            </div>
          ))
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Options</h4>
        {options.length > 0 ? (
          <>
            <div className="csv-contents-row">
              <span className="csv-contents-value">{options.length}</span>
              <span className="csv-contents-label">contracts on {optionUnderlyings.join(", ")}</span>
            </div>
            {options.filter((r) => r.option).map((r, i) => (
              <div key={i} className="csv-contents-contract">
                {r.option!.underlying} {r.option!.expiration} ${r.option!.strike} {r.option!.type} × {Math.abs(r.quantity)}
              </div>
            ))}
          </>
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Fixed Income</h4>
        {fixedIncome.length > 0 ? (
          <div className="csv-contents-row">
            <span className="csv-contents-value">{cusips.length}</span>
            <span className="csv-contents-label">Treasury bills (CUSIPs)</span>
          </div>
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Cash</h4>
        {cash.length > 0 ? (
          cash.map((r, i) => (
            <div key={i} className="csv-contents-row">
              <span className="csv-contents-value">{r.currentValue != null ? `$${r.currentValue.toLocaleString()}` : "—"}</span>
              <span className="csv-contents-label">{r.symbol.replace("**", "")}</span>
            </div>
          ))
        ) : (
          <div className="csv-contents-empty">None</div>
        )}
      </div>

      <div className="csv-contents-group">
        <h4>Summary</h4>
        <div className="csv-contents-row csv-contents-total">
          <span className="csv-contents-value">{rows.length}</span>
          <span className="csv-contents-label">total positions</span>
        </div>
      </div>
    </div>
  );
}

function ActivityContents({ rows }: { rows: ActivityRow[] }) {
  const typeCounts = new Map<string, number>();
  for (const r of rows) {
    typeCounts.set(r.eventType, (typeCounts.get(r.eventType) ?? 0) + 1);
  }
  const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Option lifecycle subset
  const optionTypes = ["sell_to_open", "buy_to_close", "assigned", "expired"];
  const optionEvents = rows.filter((r) => optionTypes.includes(r.eventType));
  const optionContracts = optionEvents.filter((r) => r.option).map((r) => r.option!);
  const uniqueContracts = [...new Map(optionContracts.map((c) => [`${c.underlying}${c.expiration}${c.strike}${c.type}`, c])).values()];

  return (
    <div className="csv-contents">
      <div className="csv-contents-group">
        <h4>Event Breakdown</h4>
        {sorted.map(([type, count]) => (
          <div key={type} className="csv-contents-row">
            <span className="csv-contents-value">{count}</span>
            <span className="csv-contents-label">{formatEventType(type)}</span>
          </div>
        ))}
        <div className="csv-contents-row csv-contents-total">
          <span className="csv-contents-value">{rows.length}</span>
          <span className="csv-contents-label">total events</span>
        </div>
      </div>
      {uniqueContracts.length > 0 && (
        <div className="csv-contents-group">
          <h4>Option Contracts Referenced</h4>
          {uniqueContracts.map((c, i) => (
            <div key={i} className="csv-contents-contract">
              {c.underlying} {c.expiration} ${c.strike} {c.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentContents({ parsed }: { parsed: ParsedDocument }) {
  switch (parsed.payload.type) {
    case "option_summary": return <OptionSummaryContents rows={parsed.payload.rows} />;
    case "holdings": return <HoldingsContents rows={parsed.payload.rows} />;
    case "activity": return <ActivityContents rows={parsed.payload.rows} />;
    default: return <div className="csv-contents-detail">No detailed view for this document type.</div>;
  }
}

// --- SECTION: Import Preview ---

function ImportPreview({ parsed }: { parsed: ParsedDocument }) {
  if (parsed.payload.type === "option_summary") {
    return <p className="csv-import-line">Replace current Option Summary snapshot ({parsed.payload.rows.length} strategy rows)</p>;
  }
  if (parsed.payload.type === "holdings") {
    return <p className="csv-import-line">Replace current Holdings snapshot ({parsed.payload.rows.length} positions)</p>;
  }
  if (parsed.payload.type === "activity") {
    return <p className="csv-import-line">Import {parsed.payload.rows.length} activity events</p>;
  }
  return <p className="csv-import-line csv-import-unavailable">Import unavailable for this document type</p>;
}

// --- Main ---

export function CsvImportLab() {
  const [sourceKind, setSourceKind] = useState<"upload" | "fixture" | "">("");
  const [sourceName, setSourceName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [docKey, setDocKey] = useState(0);
  const [document, setDocument] = useState<CsvDocument | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);

  function processContent(content: string, kind: "upload" | "fixture", name: string) {
    const delimiter = detectDelimiter(content);
    const lines = content.split(/\r?\n/);
    let csvStart = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].toLowerCase().includes("symbol") && lines[i].toLowerCase().includes("description")) { csvStart = i; break; }
      if (lines[i].toLowerCase().includes("run date") && lines[i].toLowerCase().includes("action")) { csvStart = i; break; }
    }
    const preamble = lines.slice(0, csvStart).filter((l) => l.trim());
    const doc = parseCsv(lines.slice(csvStart).join("\n"), delimiter);

    setSourceKind(kind);
    setSourceName(name);
    setFileSize(content.length);
    setDocument(doc);
    setDocKey((k) => k + 1);

    const classResult = classifyDocument(doc);
    setClassification(classResult);
    setParsed(classResult.parser ? classResult.parser.parse(doc, { filename: name, preambleLines: preamble }) : null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processContent(evt.target?.result as string, "upload", file.name);
    reader.readAsText(file);
  }

  const warnings = parsed?.diagnostics.filter((d) => d.level === "warning") ?? [];
  const trailerCount = parsed?.trailerRows.length ?? 0;
  const hasDocument = document !== null;
  const classified = classification?.parser !== null;

  return (
    <div className="csv-lab">
      {/* SOURCE */}
      <section className="csv-section">
        <h3 className="csv-section-heading">Source</h3>
        <div className="csv-source-row">
          <div className="csv-source-upload">
            <input type="file" accept=".csv,.txt" onChange={handleFile} className="csv-file-input" />
          </div>
          <div className="csv-source-fixtures">
            <span className="csv-source-fixtures-label">Reference fixtures:</span>
            <button className="rec-evidence-toggle" onClick={() => processContent(FIDELITY_OPTION_SUMMARY_FIXTURE, "fixture", "Option Summary")}>Option Summary</button>
            <button className="rec-evidence-toggle" onClick={() => processContent(FIDELITY_POSITIONS_FIXTURE, "fixture", "Positions")}>Positions</button>
            <button className="rec-evidence-toggle" onClick={() => processContent(FIDELITY_ACTIVITY_FIXTURE, "fixture", "Activity")}>Activity</button>
            <button className="rec-evidence-toggle" onClick={() => processContent(UNKNOWN_CSV_FIXTURE, "fixture", "Unknown CSV")}>Unknown</button>
          </div>
        </div>
      </section>

      {/* IDENTITY: Source + Classification as distinct lines */}
      {hasDocument && (
        <section className="csv-section csv-identity">
          <div className="csv-identity-source">
            <span className="csv-identity-source-label">Source:</span>
            <span className="csv-identity-source-value">
              {sourceKind} — {sourceName}
            </span>
            <span className="csv-identity-file-meta">
              {(fileSize / 1024).toFixed(1)} KB · {document!.rows.length} rows
            </span>
          </div>
          <div className="csv-identity-classification">
            <span className="csv-identity-source-label">Classification:</span>
            {classified ? (
              <span className="csv-identity-class-value">
                {classification!.parser!.label}
                <span className="csv-identity-confidence">
                  {((classification!.detection!.confidence) * 100).toFixed(0)}% match
                </span>
              </span>
            ) : (
              <span className="csv-identity-class-none">No parser matched</span>
            )}
          </div>
          {parsed && (
            <div className="csv-identity-meta">
              {parsed.metadata.accountNumber && <span>Account: {parsed.metadata.accountNumber}</span>}
              {parsed.metadata.accountName && <span>{parsed.metadata.accountName}</span>}
              {parsed.metadata.quoteDate && <span>{parsed.metadata.quoteDate}</span>}
              {parsed.metadata.downloadTimestamp && <span>Downloaded: {parsed.metadata.downloadTimestamp}</span>}
            </div>
          )}
        </section>
      )}

      {/* TRUST — only when there are issues */}
      {warnings.length > 0 && (
        <section className="csv-section csv-trust-warning">
          {warnings.map((w, i) => (
            <div key={i} className="csv-trust-item">
              ⚠ {w.row ? `Row ${w.row}: ` : ""}{w.message}
            </div>
          ))}
        </section>
      )}

      {/* DOCUMENT CONTENTS */}
      {parsed && (
        <section className="csv-section">
          <h3 className="csv-section-heading">Document Contents</h3>
          <DocumentContents parsed={parsed} />
          {trailerCount > 0 && (
            <p className="csv-trailer-note">{trailerCount} informational trailer records (disclaimers, timestamps)</p>
          )}
        </section>
      )}

      {/* Unclassified document — show what we know */}
      {hasDocument && !classified && !parsed && (
        <section className="csv-section">
          <h3 className="csv-section-heading">Document Contents</h3>
          <div className="csv-contents-detail">
            Document type not recognized. {document!.headers.length} columns, {document!.rows.length} data rows.
          </div>
          <div className="csv-contents-detail" style={{ marginTop: 4 }}>
            Headers: {document!.headers.slice(0, 8).join(", ")}{document!.headers.length > 8 ? "…" : ""}
          </div>
        </section>
      )}

      {/* IMPORT PREVIEW */}
      {parsed && parsed.payload.rows.length > 0 && (
        <section className="csv-section csv-import-section">
          <ImportPreview parsed={parsed} />
        </section>
      )}

      {/* ADVANCED */}
      {hasDocument && (
        <section className="csv-section csv-advanced-section" key={docKey}>
          <h3 className="csv-section-heading csv-advanced-heading">Advanced</h3>

          <Collapsible title={`Classification (${classification?.allDetections.length ?? 0} parsers)`}>
            <div className="csv-class-details">
              {classification?.allDetections.map((d, i) => (
                <div key={i} className="csv-class-row">
                  <span className="csv-class-parser-name">{d.label}</span>
                  <span className="csv-class-parser-conf">{(d.detection.confidence * 100).toFixed(0)}%</span>
                  {d.detection.reasons.map((r, j) => <span key={j} className="csv-class-reason">{r}</span>)}
                </div>
              ))}
            </div>
          </Collapsible>

          <Collapsible title={`Headers (${document!.headers.length})`}>
            <div className="csv-headers">{document!.headers.map((h, i) => <span key={i} className="csv-header-badge">{h}</span>)}</div>
          </Collapsible>

          <Collapsible title={`Source Data (${document!.rows.length - trailerCount} rows)`}>
            <div className="csv-raw-table-wrap">
              <table className="options-table csv-raw-table">
                <thead><tr><th>#</th>{document!.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                <tbody>
                  {document!.rows.slice(0, document!.rows.length - trailerCount).map((row, i) => (
                    <tr key={i}><td>{i + 1}</td>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Collapsible>

          {trailerCount > 0 && (
            <Collapsible title={`Trailer Records (${trailerCount})`}>
              <div className="csv-trailer-list">
                {parsed?.trailerRows.map((row, i) => {
                  const text = row.join(" ").trim();
                  return text ? <p key={i} className="csv-trailer-item">• {text.slice(0, 150)}</p> : null;
                })}
              </div>
            </Collapsible>
          )}

          <Collapsible title={`Diagnostics (${parsed?.diagnostics.length ?? 0})`}>
            <div className="csv-diagnostics">
              {parsed?.diagnostics.map((d, i) => (
                <div key={i} className={`csv-diag csv-diag-${d.level}`}>
                  <span className="csv-diag-level">{d.level}</span>
                  {d.row && <span className="csv-diag-row">row {d.row}</span>}
                  <span>{d.message}</span>
                </div>
              ))}
            </div>
          </Collapsible>
        </section>
      )}
    </div>
  );
}
