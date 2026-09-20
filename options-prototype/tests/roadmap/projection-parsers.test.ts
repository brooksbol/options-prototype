/**
 * Tests for the roadmap projection parsers.
 *
 * These verify the EXPLICIT-ONLY relationship discipline and faithful parsing of
 * the canonical authority formats, using representative fixtures. The parser
 * module is authored as .mjs (shared with the build-time generator); it is
 * imported here directly.
 */

import { describe, it, expect } from "vitest";
// @ts-expect-error - .mjs parser module has no type declarations; shapes asserted in tests.
import {
  parseLvt,
  parseArchitecture,
  parseParkingLotFile,
  expandPressureTokens,
  lvtTypeFromId,
  parsePriority,
  parseHorizons,
  parseDomainReference,
  parseBugIndex,
  parseBugRecord,
} from "../../scripts/roadmap-projection-parsers.mjs";

const LVT_FIXTURE = [
  "# Canonical Lean Value Tree",
  "",
  "- **`LVT-VISION-WHEELWRIGHT` — Wheelwright Vision** — Connect evidence, choices, and consequences.",
  "  - **`LVT-GOAL-CHOICES` — Understand the Choices** *(legacy `G2`)* — Identify the complete set of governed actions.",
  "    - **`LVT-BET-WAIT` — WAIT as a Genuine Alternative** *(legacy `C1`)* — Treating WAIT as first-class improves decisions.",
  "      - **`LVT-INIT-WAIT-REPRESENT` — Represent WAIT** — Represent WAIT alongside actionable alternatives.",
  "    - **`LVT-BET-STRATEGIES` — Broader Governed Trade Shapes** *(legacy `C2`)* — A broader repertoire improves deployment.",
  "  - **`LVT-GOAL-CONTINUITY` — Operate Continuously** *(legacy `G6`)* — Operate continuously and reliably.",
  "    - **`LVT-DIRECTION-ALWAYS-ON` — Always-On Durable Wheelwright** — Wheelwright becomes an always-on appliance.",
  "",
  "## LVT Notes Preserved from the Prior Representation",
  "- This note must not be parsed as a tree node.",
].join("\n");

describe("lvtTypeFromId", () => {
  it("maps semantic prefixes to types", () => {
    expect(lvtTypeFromId("LVT-VISION-WHEELWRIGHT")).toBe("vision");
    expect(lvtTypeFromId("LVT-GOAL-CHOICES")).toBe("goal");
    expect(lvtTypeFromId("LVT-BET-WAIT")).toBe("bet");
    expect(lvtTypeFromId("LVT-DIRECTION-ALWAYS-ON")).toBe("direction");
    expect(lvtTypeFromId("LVT-INIT-WAIT-REPRESENT")).toBe("initiative");
    expect(lvtTypeFromId("LVT-EXP-VOL-TRAJECTORY")).toBe("experiment");
    expect(lvtTypeFromId("LVT-UNKNOWN-X")).toBeNull();
  });
});

describe("parseLvt", () => {
  const { nodes, aliasToId, notes } = parseLvt(LVT_FIXTURE);
  const byId = new Map(nodes.map((n: { id: string }) => [n.id, n]));

  it("parses exactly one vision root with no parent", () => {
    const visions = nodes.filter((n: { type: string }) => n.type === "vision");
    expect(visions).toHaveLength(1);
    expect(visions[0].parentId).toBeNull();
  });

  it("derives parentage from indentation", () => {
    expect(byId.get("LVT-GOAL-CHOICES").parentId).toBe("LVT-VISION-WHEELWRIGHT");
    expect(byId.get("LVT-BET-WAIT").parentId).toBe("LVT-GOAL-CHOICES");
    expect(byId.get("LVT-INIT-WAIT-REPRESENT").parentId).toBe("LVT-BET-WAIT");
    expect(byId.get("LVT-DIRECTION-ALWAYS-ON").parentId).toBe("LVT-GOAL-CONTINUITY");
  });

  it("records children on parents", () => {
    expect(byId.get("LVT-VISION-WHEELWRIGHT").childIds).toEqual([
      "LVT-GOAL-CHOICES",
      "LVT-GOAL-CONTINUITY",
    ]);
    expect(byId.get("LVT-GOAL-CHOICES").childIds).toEqual(["LVT-BET-WAIT", "LVT-BET-STRATEGIES"]);
  });

  it("captures name, description, and legacy alias", () => {
    const bet = byId.get("LVT-BET-WAIT");
    expect(bet.name).toBe("WAIT as a Genuine Alternative");
    expect(bet.description).toContain("Treating WAIT as first-class");
    expect(bet.legacyAlias).toBe("C1");
  });

  it("builds an alias -> canonical id map", () => {
    expect(aliasToId.get("G2")).toBe("LVT-GOAL-CHOICES");
    expect(aliasToId.get("C1")).toBe("LVT-BET-WAIT");
    expect(aliasToId.get("G6")).toBe("LVT-GOAL-CONTINUITY");
  });

  it("does not parse notes after the tree region as nodes", () => {
    expect(nodes.some((n: { name: string }) => n.name.includes("must not be parsed"))).toBe(false);
  });

  it("emits no parse notes for a clean fixture", () => {
    expect(notes).toEqual([]);
  });
});

describe("expandPressureTokens", () => {
  it("expands comma lists, ranges, and slash groups", () => {
    const { aliases } = expandPressureTokens("A2, C5, O1/O2, L1, X1.");
    expect(aliases).toEqual(["A2", "C5", "O1", "O2", "L1", "X1"]);
  });

  it("expands numeric ranges including a trailing period", () => {
    const { aliases } = expandPressureTokens("C1–C6, K1–K8.");
    expect(aliases).toEqual([
      "C1", "C2", "C3", "C4", "C5", "C6",
      "K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8",
    ]);
  });

  it("keeps non-alias tokens as raw rather than dropping them", () => {
    const { aliases, raw } = expandPressureTokens("A2, C5, O1, L1, G6, G7; also current PL-ARCH-06 pressure.");
    expect(aliases).toContain("A2");
    expect(raw.join(" ")).toContain("PL-ARCH-06");
  });
});

describe("parseArchitecture", () => {
  const archFixture = [
    "## AR3 — From Strategy-Specific Recommendations Toward Governed Alternatives",
    "",
    "**Pressure from:** C1–C6, K1–K8.",
    "",
    "**Candidate transition:** from parallel pipelines toward a common Alternative.",
    "",
    "## AR9 — Continuity Is a Cross-Cutting System Property",
    "",
    "**Pressure from:** G6.",
    "",
    "# Some Other Heading",
    "**Pressure from:** X1.",
  ].join("\n");

  const { nodes, aliasToId } = parseLvt(LVT_FIXTURE);
  void nodes;
  // Extend the alias map so the fixture's aliases resolve.
  aliasToId.set("K1", "LVT-BET-STRATEGIES"); // arbitrary valid mapping for the test

  const { pressures } = parseArchitecture(archFixture, aliasToId);

  it("parses each AR heading with its title", () => {
    expect(pressures.map((p: { id: string }) => p.id)).toEqual(["AR3", "AR9"]);
    expect(pressures[0].title).toContain("Governed Alternatives");
  });

  it("resolves pressure aliases to canonical LVT ids where known", () => {
    const ar3 = pressures.find((p: { id: string }) => p.id === "AR3");
    expect(ar3.pressureFromLvtIds).toContain("LVT-BET-WAIT"); // C1
    expect(ar3.pressureFromLvtIds).toContain("LVT-BET-STRATEGIES"); // C2 and K1
  });

  it("captures candidate transition when present", () => {
    const ar3 = pressures.find((p: { id: string }) => p.id === "AR3");
    expect(ar3.candidateTransition).toContain("common Alternative");
  });

  it("stops AR parsing at a non-AR top-level heading", () => {
    expect(pressures.some((p: { id: string }) => p.id === "AR-other")).toBe(false);
    expect(pressures).toHaveLength(2);
  });
});

describe("parseParkingLotFile — explicit-only relationships", () => {
  const validLvt = new Set(["LVT-INIT-CAP-AVAILABILITY", "LVT-BET-WAIT"]);
  const validAr = new Set(["AR2", "AR5"]);

  it("parses table-row items and their section", () => {
    const md = [
      "### Accepted Direction (Design/Implementation Needed)",
      "| ID | Name | Summary | Concept Home |",
      "|---|---|---|---|",
      "| `PL-ELIG` | Deployment Eligibility | Transparency; relates to `LVT-INIT-CAP-AVAILABILITY`. | home |",
      "| `PL-DEPLOY` | Deployment Opportunity | Normalize candidates. | home |",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot.md", validLvt, validAr);
    const byId = new Map(items.map((i: { id: string }) => [i.id, i]));
    expect(byId.get("PL-ELIG").name).toBe("Deployment Eligibility");
    expect(byId.get("PL-ELIG").section).toContain("Accepted Direction");
    // Explicit LVT reference in the row text is captured.
    expect(byId.get("PL-ELIG").relatedLvtIds).toEqual(["LVT-INIT-CAP-AVAILABILITY"]);
    // No manufactured relationship where none is stated.
    expect(byId.get("PL-DEPLOY").relatedLvtIds).toEqual([]);
    expect(byId.get("PL-DEPLOY").relatedArIds).toEqual([]);
  });

  it("parses prose reconciliation-record items and captures explicit AR references", () => {
    const md = [
      "## `PL-SCHED-DRIFT` — Scheduler Cycle Handoff Drift",
      "",
      "### Intake",
      "This relates to AR2 attention pressure.",
      "",
      "## `PL-UNRELATED` — Something Else",
      "No architecture reference here.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-3.md", validLvt, validAr);
    const byId = new Map(items.map((i: { id: string }) => [i.id, i]));
    expect(byId.get("PL-SCHED-DRIFT").relatedArIds).toEqual(["AR2"]);
    expect(byId.get("PL-UNRELATED").relatedArIds).toEqual([]);
  });

  it("does not invent items from negation/cross-reference mentions", () => {
    // A mention that an id does NOT exist must not create an item for it.
    const md = [
      "### Notes",
      "No `PL-EXPORT` existed; a new identity was minted instead.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-8.md", validLvt, validAr);
    // The mention is inside a section body, not a table row or a PL heading,
    // so no item is created.
    expect(items.map((i: { id: string }) => i.id)).not.toContain("PL-EXPORT");
  });

  it("treats an AR range expression as descriptive, not a relationship to each member", () => {
    // A phrase like "the AR1–AR10 pressures" refers to the AR set as a whole and
    // must NOT manufacture ten relationships. A single explicit AR mention still counts.
    const validArWide = new Set(["AR1", "AR2", "AR5", "AR10"]);
    const md = [
      "## `PL-DESC` — Describes the AR set",
      "The architecture roadmap records the `AR1`–`AR10` structural pressures.",
      "This item genuinely relates to AR5 only.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-9.md", validLvt, validArWide);
    const item = items.find((i: { id: string }) => i.id === "PL-DESC");
    expect(item.relatedArIds).toEqual(["AR5"]);
  });

  it("ignores tokens that merely look like ids but are not in the valid sets", () => {
    const md = [
      "## `PL-X` — Test",
      "References LVT-NOT-REAL and AR999 which are not valid.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-9.md", validLvt, validAr);
    const item = items.find((i: { id: string }) => i.id === "PL-X");
    expect(item.relatedLvtIds).toEqual([]);
    expect(item.relatedArIds).toEqual([]);
  });
});

describe("parsePriority", () => {
  it("is empty (not established) when the Ranked stack section has no numbered entries", () => {
    const md = [
      "# Priority",
      "## Ranked stack",
      "_No authoritative priority ranking has been established yet._",
    ].join("\n");
    const { established, entries } = parsePriority(md, new Set());
    expect(established).toBe(false);
    expect(entries).toEqual([]);
  });

  it("never parses guidance inside HTML comments as entries", () => {
    const md = [
      "## Ranked stack",
      "<!--",
      "  1. `PL-XXXX` — placeholder that must NOT be parsed",
      "-->",
    ].join("\n");
    const { established } = parsePriority(md, new Set());
    expect(established).toBe(false);
  });

  it("parses an authority-established ranked stack and resolves ids", () => {
    const md = [
      "## Ranked stack",
      "1. `PL-ELIG` — capacity explanation first",
      "2. `LVT-BET-WAIT` — WAIT as governed alternative",
      "3. some free-text priority the authority wrote",
    ].join("\n");
    const known = new Set(["PL-ELIG", "LVT-BET-WAIT"]);
    const { established, entries } = parsePriority(md, known);
    expect(established).toBe(true);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({ rank: 1, refId: "PL-ELIG", refResolves: true });
    expect(entries[1]).toMatchObject({ rank: 2, refId: "LVT-BET-WAIT", refResolves: true });
    expect(entries[2]).toMatchObject({ rank: 3, refId: null });
  });

  it("flags an unresolved id reference rather than dropping it", () => {
    const md = ["## Ranked stack", "1. `PL-NOPE` — stale"].join("\n");
    const { entries } = parsePriority(md, new Set(["PL-ELIG"]));
    expect(entries[0]).toMatchObject({ refId: "PL-NOPE", refResolves: false });
  });
});

describe("parseHorizons", () => {
  it("returns empty horizons when the sections have no bullets", () => {
    const md = [
      "# Coming Soon",
      "## Now",
      "_No capabilities are currently on the product horizon._",
      "## Next",
      "## Later",
    ].join("\n");
    const h = parseHorizons(md);
    expect(h.now).toEqual([]);
    expect(h.next).toEqual([]);
    expect(h.later).toEqual([]);
  });

  it("parses capabilities into the three horizons and does not carry rank/date/status", () => {
    const md = [
      "## Now",
      "- Genuine WAIT / governed alternatives — waiting can be preferable",
      "- Position reassessment / attention — recognize when a position needs attention",
      "## Next",
      "- Broader governed trade structures — expand the governed repertoire",
      "## Later",
      "- Continuous / always-on operation — run continuously",
      "- Mobile / attention-first access — remote attention experience",
    ].join("\n");
    const h = parseHorizons(md);
    expect(h.now).toHaveLength(2);
    expect(h.next).toHaveLength(1);
    expect(h.later).toHaveLength(2);
    expect(h.now[0]).toMatchObject({ name: "Genuine WAIT / governed alternatives" });
    // No rank/date/status fields.
    for (const item of [...h.now, ...h.next, ...h.later]) {
      expect(Object.keys(item).sort()).toEqual(["description", "name"]);
    }
  });

  it("preserves authored order within a horizon (no sorting applied)", () => {
    const md = [
      "## Now",
      "- Zebra capability — z",
      "- Apple capability — a",
    ].join("\n");
    const h = parseHorizons(md);
    // Authored order preserved; NOT alphabetized (order is non-semantic, not reordered).
    expect(h.now.map((i: { name: string }) => i.name)).toEqual([
      "Zebra capability",
      "Apple capability",
    ]);
  });

  it("ignores guidance inside HTML comments and non-horizon sections", () => {
    const md = [
      "## Governing rules",
      "- This is not a capability and must not be parsed.",
      "## Now",
      "<!-- - Placeholder — must not appear -->",
    ].join("\n");
    const h = parseHorizons(md);
    expect(h.now).toEqual([]);
    expect(h.next).toEqual([]);
    expect(h.later).toEqual([]);
  });
});

describe("parseDomainReference", () => {
  const md = [
    "# Wheelwright Options Domain Reference",
    "## How to read this reference",
    "Preface text.",
    "# PART 1 — Options Economic Model (the always-read core)",
    "## 1. An option is a contract with two asymmetric sides",
    "`[MECH]` A standardized option has a 100-share deliverable.",
    "## 2. The four order actions (open vs close)",
    "`[MECH]` Every option order is one of a 2×2.",
    "# PART 3 — Semantic Specimens",
    "### Specimen 1 — BTC of CSP vs BTC of covered call",
    "- CSP: a new cash debit retires the obligation.",
    "### Specimen 3 — synthetic similarity",
    "- Same strike/expiration payoff nearly identical `[THEORY]`.",
    "## Reconciliation notes",
    "Some reconciliation is already performed. `[UNRESOLVED]`",
  ].join("\n");

  const { parts } = parseDomainReference(md);

  it("parses parts by their canonical titles", () => {
    const titles = parts.map((p: { title: string }) => p.title);
    expect(titles).toContain("Options Economic Model (the always-read core)");
    expect(titles).toContain("Semantic Specimens");
    // Trailing top-level sections are grouped as Notes & Boundaries.
    expect(titles).toContain("Notes & Boundaries");
    // Preface content is preserved, not dropped.
    expect(titles).toContain("Preface");
  });

  it("preserves canonical entry headings and content verbatim (no synthesis)", () => {
    const part1 = parts.find((p: { title: string }) => p.title.startsWith("Options Economic Model"));
    const entry = part1.entries.find((e: { heading: string }) => e.heading.startsWith("1."));
    expect(entry.heading).toBe("1. An option is a contract with two asymmetric sides");
    // Content is exactly the source line(s), not a paraphrase.
    expect(entry.content).toContain("`[MECH]` A standardized option has a 100-share deliverable.");
  });

  it("mechanically detects grounding tags present in an entry, and none where absent", () => {
    const specimens = parts.find((p: { title: string }) => p.title === "Semantic Specimens");
    const s1 = specimens.entries.find((e: { heading: string }) => e.heading.startsWith("Specimen 1"));
    const s3 = specimens.entries.find((e: { heading: string }) => e.heading.startsWith("Specimen 3"));
    expect(s1.tags).toEqual([]); // no tag in the source specimen 1 body
    expect(s3.tags).toContain("THEORY");
  });

  it("extracts Markdown tables structurally with verbatim cells, separate from prose", () => {
    const tableMd = [
      "# PART 2 — Lifecycle / Structure Matrices",
      "## 2.1 Cash-Secured Put (CSP)",
      "The obligation is to buy shares at strike. `[MECH]`",
      "| Before | Action | Kind |",
      "|---|---|---|",
      "| Cash | STO put | A |",
      "| Short put | HOLD | C |",
    ].join("\n");
    const { parts: tp } = parseDomainReference(tableMd);
    const entry = tp[0].entries[0];
    // Prose excludes the table lines.
    expect(entry.content).toContain("The obligation is to buy shares at strike.");
    expect(entry.content).not.toContain("| Cash |");
    // Table captured with verbatim header + rows; separator dropped.
    expect(entry.tables).toHaveLength(1);
    expect(entry.tables[0].header).toEqual(["Before", "Action", "Kind"]);
    expect(entry.tables[0].rows).toEqual([
      ["Cash", "STO put", "A"],
      ["Short put", "HOLD", "C"],
    ]);
  });

  it("marks long entries as truncated and short entries as not", () => {
    const longMd = [
      "# PART 1 — X",
      "## 1. Long",
      "`[MECH]` " + "word ".repeat(400),
    ].join("\n");
    const { parts: lp } = parseDomainReference(longMd, 600);
    expect(lp[0].entries[0].truncated).toBe(true);
    expect(lp[0].entries[0].content.length).toBeLessThanOrEqual(600);
  });
});

describe("parseBugIndex", () => {
  const md = [
    "# Wheelwright Bug Index",
    "| BUG | Title | Area | Severity | Status | Record | Provenance |",
    "|-----|-------|------|----------|--------|--------|------------|",
    "| BUG-001 | Overlay does not project closure | Portfolio | Not established | Open | [record](BUG-001-x.md) | GH #2 |",
    "| BUG-004 | Composes incompatible evidence | Operator Console | S2 | Open | [record](BUG-004-y.md) | GH #9 |",
    "| BUG-010 | Phantom open delay | Session gate | S2 | Resolved | [record](BUG-010-z.md) | GH #16 |",
  ].join("\n");

  const { items } = parseBugIndex(md);

  it("parses each bug row verbatim, capturing the record path only", () => {
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      id: "BUG-001",
      title: "Overlay does not project closure",
      area: "Portfolio",
      severity: "Not established",
      status: "Open",
      recordFile: "BUG-001-x.md",
      provenance: "GH #2",
    });
  });

  it("preserves 'Not established' severity verbatim (never inferred)", () => {
    expect(items[0].severity).toBe("Not established");
  });

  it("preserves source (index) order — no severity/status sorting", () => {
    expect(items.map((b: { id: string }) => b.id)).toEqual(["BUG-001", "BUG-004", "BUG-010"]);
  });

  it("ignores the header and separator rows", () => {
    expect(items.some((b: { id: string }) => b.id === "BUG")).toBe(false);
  });
});

describe("parseBugRecord", () => {
  const md = [
    "# BUG-004 — Console composes temporally incompatible evidence",
    "",
    "- **Status:** Open",
    "- **Severity:** S2",
    "- **Area:** Operator Console",
    "",
    "## Observed failure",
    "The console blends premarket and sealed evidence into one view.",
    "",
    "## Intended semantics violated",
    "Evidence from different sessions must not be composed as coherent.",
    "",
    "## Evidence",
    "| Before | Event |",
    "|---|---|",
    "| A | B |",
    "",
    "## Remediation history",
    "Empty (Open).",
  ].join("\n");

  const { title, sections } = parseBugRecord(md);

  it("captures the record's own title verbatim", () => {
    expect(title).toBe("BUG-004 — Console composes temporally incompatible evidence");
  });

  it("projects each ## section heading and body verbatim, in document order", () => {
    expect(sections.map((s: { heading: string }) => s.heading)).toEqual([
      "Observed failure",
      "Intended semantics violated",
      "Evidence",
      "Remediation history",
    ]);
    expect(sections[0].content).toContain("blends premarket and sealed evidence");
  });

  it("does not fold the metadata bullets into a section body", () => {
    const joined = sections.map((s: { content: string }) => s.content).join("\n");
    expect(joined).not.toContain("**Status:**");
    expect(joined).not.toContain("**Severity:**");
  });

  it("renders embedded tables structurally with verbatim cells", () => {
    const evidence = sections.find((s: { heading: string }) => s.heading === "Evidence");
    expect(evidence.tables).toHaveLength(1);
    expect(evidence.tables[0].header).toEqual(["Before", "Event"]);
    expect(evidence.tables[0].rows).toEqual([["A", "B"]]);
    // Table lines are not duplicated into prose content.
    expect(evidence.content).not.toContain("| A |");
  });

  it("preserves honest 'Empty (Open).' bodies verbatim", () => {
    const rem = sections.find((s: { heading: string }) => s.heading === "Remediation history");
    expect(rem.content).toBe("Empty (Open).");
  });
});
