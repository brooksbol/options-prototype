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
  parseLogEvents,
  parseGraduatedIndex,
  parseAdrs,
  parsePriority,
  parseHorizons,
  parsePrinciples,
  parseDomainReference,
  parseBugIndex,
  parseBugRecord,
  parseBugLogEvents,
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
const logEvents = [];
let logSourceOrder = 0;
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
  // Log: explicit governed temporal events (any heading depth; explicit dates only).
  const { events, dateErrors, nextOrder } = parseLogEvents(content, file, logSourceOrder);
  logSourceOrder = nextOrder;
  logEvents.push(...events);
  // Fail closed on any impossible/malformed explicit calendar date (Codex date-validation).
  for (const err of dateErrors) fail(`Log date validation: ${err}`);
}

// NOTE: bug-corpus governed Log events are appended to `logEvents` further below
// (after the bug corpus is read), then the unified chronology is sorted. Parking-
// lot events are collected above; bug events preserve their own BUG-NNN identity.

// Intake-date knowledge is derived from EXPLICIT INTAKE EVIDENCE only (Codex final
// finding 1/2) — a record's `establishesIntake` flag, NOT its eventKind. A later
// reconciliation / refinement / implementation / remediation event never
// establishes intake merely by existing. List active PL identities for which NO
// record carries explicit intake evidence, by identity; never infer a date. Bug
// events never establish PL intake (establishesIntake === false, plId === null),
// so this parking-lot derivation is unaffected by the cross-authority extension.
const intakeEvidencePlIds = new Set(
  logEvents.filter((e) => e.establishesIntake && e.plId).map((e) => e.plId)
);
const intakeDateUnknown = parkingLot
  .map((i) => i.id)
  .filter((id) => !intakeEvidencePlIds.has(id))
  .sort();
const plWithIntakeDate = parkingLot.filter((i) => intakeEvidencePlIds.has(i.id)).length;

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

// NOTE: unified Log integrity (parking-lot + bug authorities) and the non-empty
// check are applied AFTER the bug corpus is read and bug events are appended —
// see the "Unified chronology across canonical authorities" block below.

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
  ? parseHorizons(readFileSync(comingSoonPath, "utf-8"))
  : { now: [], next: [], later: [] };
const comingSoonTotal = comingSoon.now.length + comingSoon.next.length + comingSoon.later.length;

// Principles register — the canonical set of ratified enduring principles.
const principlesPath = resolve(docsDir, "principles.md");
const principles = existsSync(principlesPath)
  ? parsePrinciples(readFileSync(principlesPath, "utf-8")).items
  : [];
if (existsSync(principlesPath) && principles.length === 0) {
  fail("docs/principles.md exists but no ratified principles were parsed");
}

// Domain reference — faithful projection of the options domain reference (Category E).
const domainPath = resolve(docsDir, "foundations/options-domain-reference.md");
const domain = existsSync(domainPath)
  ? parseDomainReference(readFileSync(domainPath, "utf-8"))
  : { parts: [] };
if (existsSync(domainPath) && domain.parts.length === 0) {
  fail("docs/foundations/options-domain-reference.md exists but no Domain parts were parsed");
}
const domainEntryTotal = domain.parts.reduce((sum, p) => sum + p.entries.length, 0);

// Known defects — verbatim projection of the canonical bug index.
const bugIndexPath = resolve(docsDir, "bugs/INDEX.md");
const bugs = existsSync(bugIndexPath) ? parseBugIndex(readFileSync(bugIndexPath, "utf-8")).items : [];
if (existsSync(bugIndexPath) && bugs.length === 0) {
  fail("docs/bugs/INDEX.md exists but no bug rows were parsed");
}

// Attach each bug's canonical record detail (faithful projection of BUG-NNN-*.md).
// Fail-closed if an index row references a record file that does not exist, so the
// INDEX ↔ record mapping stays exact. Simultaneously extract governed dated Log
// events from each bug record (cross-authority Log invariant): a bug's canonical
// authority explicitly establishes dated governed events (audit checkpoints,
// Principal authorizations/acceptance, post-resolution validation, migration
// provenance). BUG-NNN identity is preserved; bug events never become PL-*.
const bugsDir = resolve(docsDir, "bugs");
for (const bug of bugs) {
  const recordPath = resolve(bugsDir, bug.recordFile);
  if (!existsSync(recordPath)) {
    fail(`${bug.id} references missing record file docs/bugs/${bug.recordFile}`);
  }
  const recordContent = readFileSync(recordPath, "utf-8");
  const record = parseBugRecord(recordContent);
  bug.recordTitle = record.title;
  bug.sections = record.sections;

  const { events: bugEvents, dateErrors: bugDateErrors, nextOrder } = parseBugLogEvents(
    recordContent,
    `bugs/${bug.recordFile}`,
    bug.id,
    logSourceOrder,
  );
  logSourceOrder = nextOrder;
  logEvents.push(...bugEvents);
  for (const err of bugDateErrors) fail(`Bug Log date validation: ${err}`);
}

// The bug INDEX itself carries governed dated events (the Open-bug audit
// checkpoint and Migration provenance). Project those too, attributed to the
// index rather than a single BUG-NNN.
{
  const indexContent = readFileSync(bugIndexPath, "utf-8");
  const { events: indexEvents, dateErrors: indexDateErrors, nextOrder } = parseBugLogEvents(
    indexContent,
    "bugs/INDEX.md",
    null,
    logSourceOrder,
  );
  logSourceOrder = nextOrder;
  logEvents.push(...indexEvents);
  for (const err of indexDateErrors) fail(`Bug Log date validation: ${err}`);
}

// Unified chronology across canonical authorities (parking lot + bug corpus), in
// deterministic order: by REAL calendar date ascending (every event carries a
// validated eventDateIso — impossible dates already failed generation). Ties on
// the same day break by TRUE canonical capture order (sourceOrder), so a parent
// record precedes its nested child and adjacent records keep their order.
const log = [...logEvents].sort((a, b) => {
  if (a.eventDateIso !== b.eventDateIso) return a.eventDateIso < b.eventDateIso ? -1 : 1;
  return a.sourceOrder - b.sourceOrder;
});
const logIntakeEvidenceEvents = log.filter((e) => e.establishesIntake).length;

// Log integrity (explicit-only, no inference), applied to the UNIFIED log so bug
// and parking-lot events are held to the same contract. Every event must carry a
// validated real calendar date, a title, a known kind, exactly one source-system
// identity, and (if present) a well-formed PL/BUG id.
const KNOWN_KINDS_UNIFIED = new Set([
  "intake", "reconciliation", "refinement", "implementation", "remediation", "unclassified",
]);
for (const ev of log) {
  if (!ev.eventDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(ev.eventDateIso)) {
    fail(`log event "${ev.title}" (${ev.sourceFile}) has no validated calendar date`);
  }
  if (!ev.eventDateText || ev.eventDateText.length === 0) {
    fail(`log event "${ev.title}" (${ev.sourceFile}) has no explicit date text`);
  }
  if (!ev.title || ev.title.length === 0) {
    fail(`log event in ${ev.sourceFile} has no title`);
  }
  if (!KNOWN_KINDS_UNIFIED.has(ev.eventKind)) {
    fail(`log event "${ev.title}" has unknown event kind ${ev.eventKind}`);
  }
  if (typeof ev.establishesIntake !== "boolean") {
    fail(`log event "${ev.title}" has non-boolean establishesIntake`);
  }
  if (ev.plId && ev.bugId) {
    fail(`log event "${ev.title}" has both a PL id and a BUG id (source identity must be single)`);
  }
  if (ev.plId && !/^PL-[A-Z0-9-]+$/.test(ev.plId)) {
    fail(`log event "${ev.title}" has malformed PL id ${ev.plId}`);
  }
  if (ev.bugId && !/^BUG-\d+$/.test(ev.bugId)) {
    fail(`log event "${ev.title}" has malformed BUG id ${ev.bugId}`);
  }
}
if (log.length === 0) {
  fail("parsed zero Log events (expected dated governed records across parking-lot and bug authorities)");
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
      "docs/foundations/options-domain-reference.md",
      "docs/bugs/INDEX.md",
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
      comingSoonTotal,
      principleTotal: principles.length,
      domainEntryTotal,
      bugTotal: bugs.length,
      logTotal: log.length,
      logIntakeEvidenceEvents,
      plWithIntakeDate,
      plWithoutIntakeDate: intakeDateUnknown.length,
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
  domain,
  bugs,
  log,
  intakeDateUnknown,
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
console.log(`  Coming Soon:  now ${comingSoon.now.length} · next ${comingSoon.next.length} · later ${comingSoon.later.length}`);
console.log(`  Principles:   ${principles.length}  (ratified register)`);
console.log(`  Domain:       ${domain.parts.length} parts · ${domainEntryTotal} entries  (options domain reference)`);
console.log(`  Bugs:         ${bugs.length}  (canonical bug index)`);
console.log(`  Log:          ${log.length}  governed temporal events (${logIntakeEvidenceEvents} carry explicit intake evidence; ${plWithIntakeDate} identities have a recorded intake date, ${intakeDateUnknown.length} do not)`);
if (notes.length > 0) {
  console.log(`  Notes (${notes.length}):`);
  for (const n of notes) console.log(`    - ${n}`);
}
