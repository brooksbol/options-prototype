#!/usr/bin/env node
/**
 * Generate Roadmap Projection — standalone Node.js script.
 *
 * Parses Wheelwright's canonical roadmap authorities and emits a derived,
 * read-only projection consumed by the Roadmap operator surface (/app/roadmap):
 *
 *   docs/roadmap.md              -> Lean Value Tree (strategy)
 *   docs/architecture-roadmap.md -> AR1..ARn architectural pressures
 *   docs/parking-lot*.md         -> PL-* unresolved work / ideas
 *
 * Output: src/roadmap/roadmap-projection.json
 *
 * Usage:
 *   node scripts/generate-roadmap-projection.mjs
 *
 * AUTHORITY: the Markdown files remain the single source of truth. This
 * generated JSON is derived and regenerable; it is never authoritative and the
 * UI cannot edit canonical state. Relationships are explicit-only (see the
 * parser module). The generator FAILS (non-zero exit) rather than shipping a
 * projection that violates its integrity invariants.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import {
  parseLvt,
  parseArchitecture,
  parseParkingLotFile,
  parseGraduatedIndex,
  parseAdrs,
  parsePriority,
  parseComingSoon,
  parsePrinciples,
} from "./roadmap-projection-parsers.mjs";

const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const repoRoot = resolve(projectRoot, "..");
const docsDir = resolve(repoRoot, "docs");
const outputPath = resolve(projectRoot, "src/roadmap/roadmap-projection.json");

function fail(message) {
  console.error(`\n[generate-roadmap-projection] INTEGRITY FAILURE: ${message}\n`);
  process.exit(1);
}

// ---------- Read canonical authorities ----------

const roadmapPath = resolve(docsDir, "roadmap.md");
const archPath = resolve(docsDir, "architecture-roadmap.md");

const roadmapMd = readFileSync(roadmapPath, "utf-8");
const archMd = readFileSync(archPath, "utf-8");

// Complete logical parking lot: every docs/parking-lot*.md, in stable order.
const parkingLotFiles = readdirSync(docsDir)
  .filter((f) => /^parking-lot.*\.md$/.test(f))
  .sort((a, b) => {
    // parking-lot.md first, then numbered continuations in numeric order.
    const na = a.match(/parking-lot-(\d+)\.md/);
    const nb = b.match(/parking-lot-(\d+)\.md/);
    const va = na ? parseInt(na[1], 10) : 0;
    const vb = nb ? parseInt(nb[1], 10) : 0;
    return va - vb;
  });

if (parkingLotFiles.length === 0) {
  fail("no docs/parking-lot*.md files found");
}

// ---------- Parse ----------

const notes = [];

const { nodes: lvt, aliasToId, notes: lvtNotes } = parseLvt(roadmapMd);
notes.push(...lvtNotes);

const validLvtIds = new Set(lvt.map((n) => n.id));

const { pressures: architecture, notes: archNotes } = parseArchitecture(archMd, aliasToId);
notes.push(...archNotes);

const validArIds = new Set(architecture.map((p) => p.id));

const parkingLot = [];
const seenPlIds = new Set();
for (const file of parkingLotFiles) {
  const content = readFileSync(join(docsDir, file), "utf-8");
  const { items, notes: plNotes } = parseParkingLotFile(content, file, validLvtIds, validArIds);
  notes.push(...plNotes);
  for (const item of items) {
    if (seenPlIds.has(item.id)) {
      // One logical parking lot; first physical occurrence owns identity.
      continue;
    }
    seenPlIds.add(item.id);
    parkingLot.push(item);
  }
}

// ---------- Integrity checks (fail-closed) ----------

if (lvt.length === 0) fail("parsed zero LVT nodes from docs/roadmap.md");

const visionNodes = lvt.filter((n) => n.type === "vision");
if (visionNodes.length !== 1) {
  fail(`expected exactly 1 LVT vision node, found ${visionNodes.length}`);
}

// Parentage integrity: every non-vision node has a resolvable parent; every
// child id resolves; no node is its own ancestor.
const byId = new Map(lvt.map((n) => [n.id, n]));
for (const node of lvt) {
  if (node.type === "vision") {
    if (node.parentId !== null) fail(`vision node ${node.id} has a parent`);
    continue;
  }
  if (!node.parentId) fail(`non-vision node ${node.id} has no parent`);
  if (!byId.has(node.parentId)) fail(`node ${node.id} references missing parent ${node.parentId}`);
  for (const childId of node.childIds) {
    if (!byId.has(childId)) fail(`node ${node.id} references missing child ${childId}`);
  }
}

// AR pressure sources must resolve to real LVT ids.
for (const ar of architecture) {
  for (const lvtId of ar.pressureFromLvtIds) {
    if (!validLvtIds.has(lvtId)) fail(`${ar.id} references missing LVT id ${lvtId}`);
  }
}

// Explicit-only relationship integrity: every PL relationship target must exist.
for (const item of parkingLot) {
  for (const lvtId of item.relatedLvtIds) {
    if (!validLvtIds.has(lvtId)) fail(`${item.id} references missing LVT id ${lvtId}`);
  }
  for (const arId of item.relatedArIds) {
    if (!validArIds.has(arId)) fail(`${item.id} references missing AR id ${arId}`);
  }
}

if (parkingLot.length === 0) fail("parsed zero PL items");

// Graduated / closed index — the resolved landscape. Lives in the primary
// parking-lot.md file.
const primaryParkingLot = readFileSync(resolve(docsDir, "parking-lot.md"), "utf-8");
const { items: graduated } = parseGraduatedIndex(primaryParkingLot);
if (graduated.length === 0) {
  fail("parsed zero graduated/closed items from parking-lot.md (expected a Graduated / Closed Index)");
}

// Architecture Decision Records — ratified decisions.
const adrMd = readFileSync(resolve(docsDir, "07c-adrs.md"), "utf-8");
const { items: adrs } = parseAdrs(adrMd);
if (adrs.length === 0) {
  fail("parsed zero ADRs from docs/07c-adrs.md");
}

// Provisional priority stack + curated Coming Soon. Both are honest-empty by
// default (the exercise/curation may not have happened yet); a missing file is
// treated as empty rather than a failure.
const knownIds = new Set([
  ...validLvtIds,
  ...validArIds,
  ...parkingLot.map((i) => i.id),
  ...graduated.map((g) => g.id),
  ...adrs.map((a) => a.id),
]);

const priorityPath = resolve(docsDir, "roadmap-priority.md");
const priority = existsSync(priorityPath)
  ? parsePriority(readFileSync(priorityPath, "utf-8"), knownIds)
  : { established: false, entries: [] };

const comingSoonPath = resolve(docsDir, "roadmap-coming-soon.md");
const comingSoon = existsSync(comingSoonPath)
  ? parseComingSoon(readFileSync(comingSoonPath, "utf-8"))
  : { curated: false, items: [] };

// Principles register — the canonical set of ratified enduring principles.
const principlesPath = resolve(docsDir, "principles.md");
const principles = existsSync(principlesPath)
  ? parsePrinciples(readFileSync(principlesPath, "utf-8")).items
  : [];
if (existsSync(principlesPath) && principles.length === 0) {
  fail("docs/principles.md exists but no ratified principles were parsed");
}

// Integrity: a priority entry that references a canonical id must resolve, else
// it is a stale reference the authority should fix (fail-closed).
for (const e of priority.entries) {
  if (e.refId && e.refResolves === false) {
    fail(`priority entry #${e.rank} references unknown id ${e.refId}`);
  }
}

// ---------- Assemble projection ----------

const lvtByType = {
  vision: 0,
  goal: 0,
  bet: 0,
  direction: 0,
  initiative: 0,
  experiment: 0,
};
for (const n of lvt) lvtByType[n.type]++;

const plWithExplicitRelationship = parkingLot.filter(
  (i) => i.relatedLvtIds.length > 0 || i.relatedArIds.length > 0
).length;

const projection = {
  meta: {
    generatedAt: new Date().toISOString(),
    sources: [
      "docs/roadmap.md",
      "docs/architecture-roadmap.md",
      "docs/07c-adrs.md",
      "docs/principles.md",
      "docs/roadmap-priority.md",
      "docs/roadmap-coming-soon.md",
      ...parkingLotFiles.map((f) => `docs/${f}`),
    ],
    counts: {
      lvtTotal: lvt.length,
      lvtByType,
      arTotal: architecture.length,
      plTotal: parkingLot.length,
      plWithExplicitRelationship,
      graduatedTotal: graduated.length,
      adrTotal: adrs.length,
      priorityTotal: priority.entries.length,
      comingSoonTotal: comingSoon.items.length,
      principleTotal: principles.length,
    },
    notes,
  },
  lvt,
  architecture,
  parkingLot,
  graduated,
  adrs,
  priority,
  comingSoon,
  principles,
};

// ---------- Write or check ----------

const checkMode = process.argv.includes("--check");

// Substantive content excludes the volatile generatedAt timestamp so a freshness
// check compares the projection's meaning, not the moment it was produced.
const substantive = (proj) => {
  const clone = JSON.parse(JSON.stringify(proj));
  delete clone.meta.generatedAt;
  return JSON.stringify(clone);
};

if (checkMode) {
  if (!existsSync(outputPath)) {
    fail(`--check: ${outputPath} does not exist; run the generator to create it`);
  }
  const committed = JSON.parse(readFileSync(outputPath, "utf-8"));
  if (substantive(committed) !== substantive(projection)) {
    fail(
      "--check: committed roadmap-projection.json is STALE relative to canonical authority.\n" +
        "  Regenerate with: npm run generate:roadmap-projection\n" +
        "  (ADR-018: projection synchronization is a completion criterion.)"
    );
  }
  console.log("[generate-roadmap-projection] --check: projection is in sync with canonical authority.");
  process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(projection, null, 2) + "\n", "utf-8");

console.log("[generate-roadmap-projection] wrote", outputPath);
console.log(`  LVT nodes:   ${lvt.length}  (vision ${lvtByType.vision}, goals ${lvtByType.goal}, bets ${lvtByType.bet}, directions ${lvtByType.direction}, initiatives ${lvtByType.initiative}, experiments ${lvtByType.experiment})`);
console.log(`  AR pressures: ${architecture.length}`);
console.log(`  PL items:     ${parkingLot.length}  (with explicit LVT/AR relationship: ${plWithExplicitRelationship})`);
console.log(`  Graduated:    ${graduated.length}  (resolved landscape)`);
console.log(`  ADRs:         ${adrs.length}  (ratified decisions)`);
console.log(`  Priority:     ${priority.entries.length}  (${priority.established ? "established" : "NOT established yet"})`);
console.log(`  Coming Soon:  ${comingSoon.items.length}  (${comingSoon.curated ? "curated" : "nothing curated yet"})`);
console.log(`  Principles:   ${principles.length}  (ratified register)`);
if (notes.length > 0) {
  console.log(`  Notes (${notes.length}):`);
  for (const n of notes) console.log(`    - ${n}`);
}
