#!/usr/bin/env node
/**
 * Generate Description Library — standalone Node.js script.
 *
 * Parses a CSV file (ticker,name,description) and generates
 * src/instrument-catalog/description-library.ts with a lookup function
 * and a size function.
 *
 * Usage:
 *   node scripts/generate-description-library.mjs src/instrument-catalog/refined_etf_descriptions_v7.csv
 *
 * The CSV remains the canonical source. The generated TypeScript file
 * is the runtime representation.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const csvRelativePath = process.argv[2];
if (!csvRelativePath) {
  console.error("Usage: node scripts/generate-description-library.mjs <csv-path>");
  console.error("Example: node scripts/generate-description-library.mjs src/instrument-catalog/refined_etf_descriptions_v7.csv");
  process.exit(1);
}

const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const csvPath = resolve(projectRoot, csvRelativePath);
const outputPath = resolve(projectRoot, "src/instrument-catalog/description-library.ts");

// ---------- CSV parser (handles quoted fields with commas and escaped quotes) ----------

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ---------- Read and parse ----------

console.log(`Reading CSV: ${csvPath}`);

const content = readFileSync(csvPath, "utf-8");
const lines = content.split("\n").filter((l) => l.trim().length > 0);

if (lines.length === 0) {
  console.error("CSV file is empty.");
  process.exit(1);
}

// Validate header
const headerFields = parseCsvLine(lines[0]);
if (headerFields[0]?.trim().toLowerCase() !== "ticker") {
  console.error(`Unexpected header: expected first column "ticker", got "${headerFields[0]}"`);
  process.exit(1);
}

const dataLines = lines.slice(1);
const entries = new Map();
let duplicates = 0;
let rejected = 0;

for (const line of dataLines) {
  const fields = parseCsvLine(line);
  if (fields.length < 3) {
    rejected++;
    continue;
  }
  const ticker = fields[0].trim().toUpperCase();
  const description = fields[2].trim();

  if (!ticker || !description) {
    rejected++;
    continue;
  }

  if (entries.has(ticker)) {
    duplicates++;
  }
  entries.set(ticker, description);
}

// ---------- Generate TypeScript ----------

const generatedAt = new Date().toISOString();
const tsLines = [
  `/**`,
  ` * Description Library — generated from ${csvRelativePath}`,
  ` *`,
  ` * DO NOT EDIT MANUALLY.`,
  ` * Regenerate with:`,
  ` *   node scripts/generate-description-library.mjs ${csvRelativePath}`,
  ` *`,
  ` * Stats:`,
  ` *   Total CSV rows: ${dataLines.length}`,
  ` *   Unique tickers: ${entries.size}`,
  ` *   Duplicates (last wins): ${duplicates}`,
  ` *   Rejected rows: ${rejected}`,
  ` *   Generated: ${generatedAt}`,
  ` */`,
  ``,
  `const DESCRIPTIONS: Record<string, string> = {`,
];

const sorted = [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [ticker, desc] of sorted) {
  const escaped = desc.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  tsLines.push(`  "${ticker}": "${escaped}",`);
}

tsLines.push(`};`);
tsLines.push(``);
tsLines.push(`const descriptionIndex = new Map<string, string>(Object.entries(DESCRIPTIONS));`);
tsLines.push(``);
tsLines.push(`/**`);
tsLines.push(` * Look up a human-readable description by ticker symbol.`);
tsLines.push(` * Returns null if no description exists for this ticker.`);
tsLines.push(` *`);
tsLines.push(` * This is presentation content only — independent of catalog membership,`);
tsLines.push(` * governance, or recommendation eligibility.`);
tsLines.push(` */`);
tsLines.push(`export function lookupLibraryDescription(symbol: string): string | null {`);
tsLines.push(`  return descriptionIndex.get(symbol.toUpperCase()) ?? null;`);
tsLines.push(`}`);
tsLines.push(``);
tsLines.push(`/**`);
tsLines.push(` * Get the number of descriptions in the library.`);
tsLines.push(` */`);
tsLines.push(`export function descriptionLibrarySize(): number {`);
tsLines.push(`  return descriptionIndex.size;`);
tsLines.push(`}`);
tsLines.push(``);

// ---------- Write output ----------

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, tsLines.join("\n"), "utf-8");

console.log(`\nGenerated: ${outputPath}`);
console.log(`  CSV rows processed: ${dataLines.length}`);
console.log(`  Unique tickers:     ${entries.size}`);
console.log(`  Duplicates:         ${duplicates}`);
console.log(`  Rejected:           ${rejected}`);
