/**
 * CSV Import Lab — progressive disclosure UX.
 *
 * Primary UI answers: What file? Recognized? Correct? What happens next?
 * Advanced sections provide engineering visibility behind expandable panels.
 */

import { useState } from "react";
import { parseCsv, detectDelimiter, type CsvDocument } from "../csv/reader";
import { classifyDocument, type ClassificationResult, type ParsedDocument } from "../csv/registry";
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import { FIDELITY_OPTION_SUMMARY_FIXTURE, UNKNOWN_CSV_FIXTURE } from "../csv/fixtures/optionSummary";

// Ensure parsers are registered
import "../csv/fidelity/index";

// --- Collapsible Section ---

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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

// --- Main Component ---

export function CsvImportLab() {
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState(0);
  const [document, setDocument] = useState<CsvDocument | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);

  function processContent(content: string, name: string) {
    const delimiter = detectDelimiter(content);

    // Find actual header row (skip preamble)
    const lines = content.split(/\r?\n/);
    let csvStart = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].toLowerCase().includes("symbol") && lines[i].toLowerCase().includes("description")) {
        csvStart = i;
        break;
      }
    }

    const preamble = lines.slice(0, csvStart).filter((l) => l.trim());

    const csvContent = lines.slice(csvStart).join("\n");
    const doc = parseCsv(csvContent, delimiter);

    setFileName(name);
    setFileSize(content.length);
    setDocument(doc);

    const classResult = classifyDocument(doc);
    setClassification(classResult);

    if (classResult.parser) {
      setParsed(classResult.parser.parse(doc, { filename: name, preambleLines: preamble }));
    } else {
      setParsed(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processContent(evt.target?.result as string, file.name);
    reader.readAsText(file);
  }

  function loadFixture(name: string, content: string) {
    processContent(content, `fixture:${name}`);
  }

  // Computed summary — use typed payload
  const items: OptionSummaryRow[] = (parsed?.payload.type === "option_summary" ? parsed.payload.rows : []);
  const shareRows = items.filter((i) => i.positionType === "share").length;
  const optionRows = items.filter((i) => i.positionType === "option").length;
  const strategies = [...new Set(items.map((i) => i.strategy))];
  const symbols = [...new Set(items.map((i) => i.symbol))];
  const trailerCount = parsed?.trailerRows.length ?? 0;
  const warnings = parsed?.diagnostics.filter((d) => d.level === "warning") ?? [];

  // Extract quote date from metadata
  const quoteDate = parsed?.metadata.quoteDate ?? null;

  return (
    <div className="csv-lab">
      {/* === UPLOAD === */}
      <section className="csv-section">
        <div className="csv-upload-row">
          <input type="file" accept=".csv,.txt" onChange={handleFileSelect} className="csv-file-input" />
          <span className="csv-fixtures-label">Fixtures:</span>
          <button className="rec-evidence-toggle" onClick={() => loadFixture("Option Summary", FIDELITY_OPTION_SUMMARY_FIXTURE)}>
            Option Summary
          </button>
          <button className="rec-evidence-toggle" onClick={() => loadFixture("Unknown CSV", UNKNOWN_CSV_FIXTURE)}>
            Unknown CSV
          </button>
        </div>
        {fileName && (
          <div className="csv-file-info">
            <span>{fileName}</span>
            <span>{(fileSize / 1024).toFixed(1)} KB</span>
            {document && <span>{document.rows.length} rows</span>}
            {document && <span>{document.headers.length} cols</span>}
          </div>
        )}
      </section>

      {/* === DOCUMENT SUMMARY === */}
      {classification && (
        <section className="csv-section csv-summary-section">
          <div className="csv-summary-card">
            <div className="csv-summary-header">
              <span className="csv-summary-type">{classification.parser?.label ?? "Unknown Document"}</span>
              <span className="csv-summary-confidence">
                {((classification.detection?.confidence ?? 0) * 100).toFixed(0)}% match
              </span>
            </div>

            <dl className="csv-summary-details">
              {quoteDate && <><dt>Quote Date</dt><dd>{quoteDate}</dd></>}
              {parsed?.metadata.accountNumber && <><dt>Account</dt><dd>{parsed.metadata.accountNumber}</dd></>}
              <dt>Positions</dt><dd>{items.length} rows</dd>
              <dt>Shares</dt><dd>{shareRows}</dd>
              <dt>Options</dt><dd>{optionRows}</dd>
              <dt>Symbols</dt><dd>{symbols.join(", ") || "—"}</dd>
              <dt>Strategies</dt><dd>{strategies.join(", ") || "—"}</dd>
            </dl>

            {trailerCount > 0 && (
              <p className="csv-summary-trailer">{trailerCount} informational trailer records detected</p>
            )}
          </div>
        </section>
      )}

      {/* === IMPORT PREVIEW === */}
      {parsed && items.length > 0 && (
        <section className="csv-section">
          <h2 className="rec-section-title">Import Preview</h2>
          <div className="csv-import-preview">
            <div className="csv-import-action">
              <span className="csv-import-check">✓</span>
              Replace current Option Summary snapshot
            </div>
            <dl className="csv-import-stats">
              <dt>Incoming strategy rows</dt><dd>{items.length}</dd>
              <dt>Share rows</dt><dd>{shareRows}</dd>
              <dt>Option rows</dt><dd>{optionRows}</dd>
            </dl>
            {warnings.length === 0 ? (
              <p className="csv-import-ok">No parser warnings detected.</p>
            ) : (
              <p className="csv-import-warn">{warnings.length} parser warning(s) — see Diagnostics below.</p>
            )}
          </div>
        </section>
      )}

      {/* === ADVANCED === */}
      {document && (
        <section className="csv-section csv-advanced-section">
          <h2 className="rec-section-title">Advanced</h2>

          <CollapsibleSection title={`Classification (${classification?.allDetections.length ?? 0} parsers evaluated)`}>
            <div className="csv-class-details">
              {classification?.allDetections.map((d, i) => (
                <div key={i} className="csv-class-row">
                  <span className="csv-class-parser-name">{d.label}</span>
                  <span className="csv-class-parser-conf">{(d.detection.confidence * 100).toFixed(0)}%</span>
                  {d.detection.reasons.map((r, j) => (
                    <span key={j} className="csv-class-reason">{r}</span>
                  ))}
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={`Headers (${document.headers.length})`}>
            <div className="csv-headers">
              {document.headers.map((h, i) => (
                <span key={i} className="csv-header-badge">{h}</span>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={`Source Data (${document.rows.length - trailerCount} data rows)`}>
            <div className="csv-raw-table-wrap">
              <table className="options-table csv-raw-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {document.headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {document.rows.slice(0, document.rows.length - trailerCount).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          {trailerCount > 0 && (
            <CollapsibleSection title={`Ignored Trailer Records (${trailerCount})`}>
              <div className="csv-trailer-list">
                {parsed?.trailerRows.map((row, i) => {
                  const text = row.join(" ").trim();
                  return text ? <p key={i} className="csv-trailer-item">• {text.slice(0, 120)}</p> : null;
                })}
              </div>
            </CollapsibleSection>
          )}

          {parsed && items.length > 0 && (
            <CollapsibleSection title={`Normalized Objects (${items.length})`}>
              <div className="csv-raw-table-wrap">
                <table className="options-table csv-raw-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Strategy</th>
                      <th>Contract</th>
                      <th>Qty</th>
                      <th>Bid</th>
                      <th>Ask</th>
                      <th>Last</th>
                      <th>Cost Basis</th>
                      <th>Mkt Value</th>
                      <th>P/L</th>
                      <th>P/L %</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className={item.positionType === "option" ? "region-otm" : ""}>
                        <td>{item.symbol}</td>
                        <td>{item.positionType}</td>
                        <td>{item.strategy}</td>
                        <td>{item.option ? `${item.option.underlying} ${item.option.expiration} $${item.option.strike} ${item.option.type}` : "—"}</td>
                        <td>{item.quantity}</td>
                        <td>{item.bid != null ? `$${item.bid.toFixed(2)}` : "—"}</td>
                        <td>{item.ask != null ? `$${item.ask.toFixed(2)}` : "—"}</td>
                        <td>{item.last != null ? `$${item.last.toFixed(2)}` : "—"}</td>
                        <td>{item.costBasis != null ? `$${item.costBasis.toFixed(2)}` : "—"}</td>
                        <td>{item.marketValue != null ? `$${item.marketValue.toFixed(2)}` : "—"}</td>
                        <td>{item.totalGainLoss != null ? `$${item.totalGainLoss.toFixed(2)}` : "—"}</td>
                        <td>{item.totalGainLossPercent != null ? `${item.totalGainLossPercent.toFixed(2)}%` : "—"}</td>
                        <td>{item.marginRequirement != null ? `$${item.marginRequirement.toFixed(0)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection title={`Diagnostics (${parsed?.diagnostics.length ?? 0})`}>
            <div className="csv-diagnostics">
              {parsed?.diagnostics.map((d, i) => (
                <div key={i} className={`csv-diag csv-diag-${d.level}`}>
                  <span className="csv-diag-level">{d.level}</span>
                  {d.row && <span className="csv-diag-row">row {d.row}</span>}
                  <span>{d.message}</span>
                </div>
              ))}
              {(!parsed || parsed.diagnostics.length === 0) && (
                <p className="csv-diag-empty">No diagnostics.</p>
              )}
            </div>
          </CollapsibleSection>
        </section>
      )}
    </div>
  );
}
