#!/usr/bin/env node
/**
 * Seed Portfolio Capital Trajectory History
 *
 * Scans ~/Downloads for Fidelity Balances and Option Summary CSVs,
 * pairs them by date, computes Portfolio Capital for each pair, and
 * outputs a JSON array suitable for injecting into localStorage key
 * "wheelwright:portfolio-capital:history".
 *
 * Usage:
 *   node scripts/seed-trajectory-history.mjs
 *   # Then copy the output JSON into browser console:
 *   # localStorage.setItem("wheelwright:portfolio-capital:history", '<paste>')
 *
 * Or pipe directly:
 *   node scripts/seed-trajectory-history.mjs | pbcopy
 *   # Then in browser console: localStorage.setItem("wheelwright:portfolio-capital:history", `<paste>`)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const DOWNLOADS = join(process.env.HOME, "Downloads");
const ACCOUNT = "Z39411514";

// --- Find all relevant files ---

const allFiles = readdirSync(DOWNLOADS);

const balancesFiles = allFiles
  .filter(f => f.startsWith(`Balances_for_Account_${ACCOUNT}`) && f.endsWith(".csv"))
  .map(f => {
    const fullPath = join(DOWNLOADS, f);
    const stat = statSync(fullPath);
    return { filename: f, path: fullPath, mtime: stat.mtime };
  })
  .sort((a, b) => a.mtime - b.mtime);

const optionSummaryFiles = allFiles
  .filter(f => f.includes(`Option_Summary_${ACCOUNT}`) && f.endsWith(".csv"))
  .map(f => {
    // Extract date from filename: ..._Aug-21-2026.csv or ..._Aug-21-2026-2.csv
    const match = f.match(/_(\w{3})-(\d{2})-(\d{4})(?:-\d+)?\.csv$/);
    if (!match) return null;
    const [, month, day, year] = match;
    const dateStr = `${month} ${day}, ${year}`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return { filename: f, path: join(DOWNLOADS, f), date };
  })
  .filter(Boolean)
  .sort((a, b) => a.date - b.date);

console.error(`Found ${balancesFiles.length} Balances files`);
console.error(`Found ${optionSummaryFiles.length} Option Summary files`);

// --- Parse Balances CSV ---

function parseBalancesTotalAccountValue(filePath) {
  const text = readFileSync(filePath, "utf-8");
  const lines = text.split("\n");
  // Line 2 (index 1): "Total account value,118991.93,33092.89"
  for (const line of lines) {
    if (line.toLowerCase().startsWith("total account value")) {
      const parts = line.split(",");
      const value = parseFloat(parts[1]);
      if (!isNaN(value)) return value;
    }
  }
  return null;
}

// --- Parse Option Summary for aggregate short-option MTM ---

function parseShortOptionMTM(filePath) {
  const text = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // strip BOM
  const lines = text.split("\n");

  // Find the header line (starts with "Symbol,")
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("Symbol,")) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) return null;

  const headers = lines[headerIndex].split(",");
  const qtyCol = headers.indexOf("Quantity");
  const mvCol = headers.indexOf("Market value");

  if (qtyCol < 0 || mvCol < 0) return null;

  let totalShortMTM = 0;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith("*") || line.startsWith('"')) break;

    const parts = line.split(",");
    const qtyRaw = parts[qtyCol];
    const mvRaw = parts[mvCol];

    // Short options have negative quantity (e.g., "-2")
    const qty = parseInt(qtyRaw, 10);
    if (isNaN(qty) || qty >= 0) continue;

    // Market value for short options is negative (e.g., "-$228.00" or "-228.00")
    const mvClean = mvRaw?.replace(/[$"]/g, "");
    const mv = parseFloat(mvClean);
    if (isNaN(mv)) continue;

    totalShortMTM += mv; // negative values accumulate
  }

  return totalShortMTM; // should be negative or zero
}

// --- Pair Balances with nearest Option Summary by date ---

function findNearestOptionSummary(balanceDate) {
  let best = null;
  let bestDist = Infinity;

  for (const os of optionSummaryFiles) {
    const dist = Math.abs(os.date.getTime() - balanceDate.getTime());
    // Only pair if within 2 days
    if (dist < bestDist && dist < 2 * 24 * 60 * 60 * 1000) {
      best = os;
      bestDist = dist;
    }
  }
  return best;
}

// --- Compute observations ---

const observations = [];
const seenDates = new Set();

for (const bal of balancesFiles) {
  const balDate = bal.mtime;
  const dateKey = balDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // Skip duplicate dates (keep the latest file for each day)
  // Actually, process all but deduplicate at the end by date
  const totalAccountValue = parseBalancesTotalAccountValue(bal.path);
  if (totalAccountValue == null) {
    console.error(`  SKIP ${bal.filename}: could not parse Total Account Value`);
    continue;
  }

  const nearestOS = findNearestOptionSummary(balDate);
  let shortOptionMTM = 0;
  if (nearestOS) {
    const mtm = parseShortOptionMTM(nearestOS.path);
    if (mtm != null) {
      shortOptionMTM = mtm;
    } else {
      console.error(`  WARN ${bal.filename}: could not parse short MTM from ${nearestOS.filename}`);
    }
  } else {
    console.error(`  WARN ${bal.filename} (${dateKey}): no matching Option Summary within 2 days`);
  }

  // Portfolio Capital = Total Account Value - short-option MTM
  // (shortOptionMTM is negative, so subtracting it adds the absolute value)
  const portfolioCapital = totalAccountValue - shortOptionMTM;

  // Use the balance file's mod time as the observation timestamp
  const timestamp = balDate.toISOString();

  // Deduplicate: keep the latest observation per calendar day
  if (seenDates.has(dateKey)) {
    // Replace: find and update
    const idx = observations.findIndex(o => o.timestamp.startsWith(dateKey));
    if (idx >= 0) {
      observations[idx] = { timestamp, value: Math.round(portfolioCapital * 100) / 100 };
    }
  } else {
    seenDates.add(dateKey);
    observations.push({ timestamp, value: Math.round(portfolioCapital * 100) / 100 });
  }

  console.error(`  ${dateKey}: TAV=$${totalAccountValue.toFixed(2)}, shortMTM=$${shortOptionMTM.toFixed(2)}, PC=$${portfolioCapital.toFixed(2)} (${bal.filename} + ${nearestOS?.filename ?? "no OS"})`);
}

observations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

console.error(`\n--- Result: ${observations.length} observations ---\n`);

// Output the JSON to stdout (pipe to pbcopy or paste into console)
console.log(JSON.stringify(observations));
