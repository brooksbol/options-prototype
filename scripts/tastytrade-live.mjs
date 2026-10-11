// Compatibility facade: domain projection feeds human and unchanged TSV renderers.
import { projectLive } from "./tastytrade-live-domain.mjs";
import { renderPanel } from "./tastytrade-live-render.mjs";
export { LiveError, maskAccount, projectLive } from "./tastytrade-live-domain.mjs";
export function renderLive(evidence) {
  const projection = projectLive(evidence);
  if (evidence.format === "tsv") {
    const headers = ["ACCOUNT", "SYMBOL", "STRUCTURE", "DIRECTION", "QTY", "P/L DAY", "TOTAL G/L",
      "OPENED@", "CURRENT", "TARGET CLOSE@", "PROGRESS", "OPENED", "DTE", "QUOTE"];
    if (projection.rows.some((row) => row[14])) headers.push("NOTE");
    return [headers, ...projection.rows.map((row) => row.slice(0, headers.length))]
      .map((row) => row.join("\t")).join("\n");
  }
  return renderPanel(projection, evidence);
}
