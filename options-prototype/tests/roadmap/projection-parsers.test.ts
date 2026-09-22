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
  parseLogEvents,
  parseLeadingCalendarDate,
  deriveEventKind,
  deriveIntakeEvidence,
  faithfulExcerpt,
  sliceIntoSections,
  parseAdrs,
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

describe("faithfulExcerpt", () => {
  it("collapses whitespace and returns short text untruncated", () => {
    const { text, truncated } = faithfulExcerpt("Line one.\n\nLine   two.");
    expect(text).toBe("Line one. Line two.");
    expect(truncated).toBe(false);
  });

  it("cuts long text at a boundary and flags truncation (never rewords)", () => {
    const raw = "First sentence is short. " + "word ".repeat(300);
    const { text, truncated } = faithfulExcerpt(raw, 120);
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThanOrEqual(120);
    // The retained text is a verbatim prefix of the collapsed source.
    expect("First sentence is short. ".startsWith(text.slice(0, 20))).toBe(true);
  });

  it("returns empty for empty/whitespace input", () => {
    expect(faithfulExcerpt("   \n  ")).toEqual({ text: "", truncated: false });
    expect(faithfulExcerpt(null)).toEqual({ text: "", truncated: false });
  });
});

describe("faithfulExcerpt — uncapped mode", () => {
  it("returns full text (untruncated) when limit is Infinity", () => {
    const raw = "Sentence. " + "word ".repeat(500);
    const { text, truncated } = faithfulExcerpt(raw, Infinity);
    expect(truncated).toBe(false);
    // Whitespace is still collapsed, but nothing is cut.
    expect(text.startsWith("Sentence. word word")).toBe(true);
    expect(text.length).toBeGreaterThan(1000);
  });
});

describe("sliceIntoSections", () => {
  const body = [
    "Lead paragraph before any heading.",
    "",
    "### What was discovered",
    "The discovery prose, on two lines.",
    "Second line of the discovery.",
    "",
    "### Evidence",
    "| Before | After |",
    "|---|---|",
    "| A | B |",
    "",
    "### Next authorized mode",
    "No work.",
  ].join("\n");

  it("captures an untitled lead section and each heading's body verbatim", () => {
    const secs = sliceIntoSections(body.split("\n"), Infinity, 3, true);
    expect(secs[0].heading).toBe("");
    expect(secs[0].level).toBe(0);
    expect(secs[0].content).toContain("Lead paragraph before any heading");
    const disc = secs.find((s: { heading: string }) => s.heading === "What was discovered");
    // Line breaks preserved (not collapsed to one line).
    expect(disc.content).toContain("The discovery prose, on two lines.\nSecond line");
  });

  it("extracts embedded tables structurally, separate from prose", () => {
    const secs = sliceIntoSections(body.split("\n"), Infinity, 3, true);
    const ev = secs.find((s: { heading: string }) => s.heading === "Evidence");
    expect(ev.tables).toHaveLength(1);
    expect(ev.tables[0].header).toEqual(["Before", "After"]);
    expect(ev.tables[0].rows).toEqual([["A", "B"]]);
    expect(ev.content).not.toContain("| A |");
  });

  it("omits the pre-heading lead when keepLead is false", () => {
    const secs = sliceIntoSections(body.split("\n"), Infinity, 3, false);
    expect(secs.some((s: { level: number }) => s.level === 0)).toBe(false);
    expect(secs[0].heading).toBe("What was discovered");
  });

  it("does not truncate under Infinity, and truncates at a boundary under a limit", () => {
    const long = ["## Big", "`x` " + "word ".repeat(400)].join("\n");
    const uncapped = sliceIntoSections(long.split("\n"), Infinity, 3, true);
    expect(uncapped[0].truncated).toBe(false);
    const capped = sliceIntoSections(long.split("\n"), 500, 3, true);
    expect(capped[0].truncated).toBe(true);
    expect(capped[0].content.length).toBeLessThanOrEqual(500);
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
    "Parallel per-strategy pipelines duplicate reasoning and diverge over time.",
    "A single governed-alternative model would unify how candidates are compared.",
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

  it("captures the descriptive prose as a faithful summary, excluding bold-field lines", () => {
    const ar3 = pressures.find((p: { id: string }) => p.id === "AR3");
    // The narrative paragraphs are captured verbatim (whitespace-collapsed)...
    expect(ar3.summary).toContain("Parallel per-strategy pipelines duplicate reasoning");
    expect(ar3.summary).toContain("unify how candidates are compared");
    // ...but the structured **Pressure from:** / **Candidate transition:** lines
    // are surfaced separately and are NOT folded into the summary.
    expect(ar3.summary).not.toContain("Pressure from");
    expect(ar3.summary).not.toContain("Candidate transition");
    expect(ar3.summaryTruncated).toBe(false);
    // An AR with no prose paragraphs yields an empty (not fabricated) summary.
    const ar9 = pressures.find((p: { id: string }) => p.id === "AR9");
    expect(ar9.summary).toBe("");
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

  it("captures the table-row Summary cell as the item's faithful description", () => {
    const md = [
      "### Accepted Direction (Design/Implementation Needed)",
      "| ID | Name | Summary | Concept Home |",
      "|---|---|---|---|",
      "| `PL-ELIG` | Deployment Eligibility | Transparency of why actions are available or unavailable. | home |",
      "| `PL-DEPLOY` | Deployment Opportunity | Normalize candidates. | home |",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot.md", validLvt, validAr);
    const byId = new Map(items.map((i: { id: string }) => [i.id, i]));
    // The Summary column (cell after Name) becomes the description, verbatim.
    expect(byId.get("PL-ELIG").description).toBe(
      "Transparency of why actions are available or unavailable.",
    );
    expect(byId.get("PL-ELIG").descriptionTruncated).toBe(false);
    // Table rows carry no separate **State:** line.
    expect(byId.get("PL-ELIG").state).toBeNull();
    expect(byId.get("PL-DEPLOY").description).toBe("Normalize candidates.");
  });

  it("captures a prose record's lead narrative (with Trigger) and State as description", () => {
    const md = [
      "## `PL-ACTOR-01` — Remove the Principal as Human Clipboard",
      "",
      "**Date:** September 17, 2026  ",
      "**State:** INTAKE — new canonical identity created; not reconciled  ",
      "**Trigger:** Live multi-actor operation exposed that the Principal is the message bus.",
      "",
      "The desired separation: the Principal owns authority; the system owns transport.",
      "",
      "### What was discovered",
      "This subsection body is not the lead narrative.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-9.md", validLvt, validAr);
    const item = items.find((i: { id: string }) => i.id === "PL-ACTOR-01");
    // The Trigger label is kept as plain text; the lead paragraphs follow.
    expect(item.description).toContain("Trigger: Live multi-actor operation");
    expect(item.description).toContain("the Principal owns authority");
    // Metadata (Date/State/Concept home) is NOT folded into the description.
    expect(item.description).not.toContain("September 17");
    // State is captured verbatim, separately.
    expect(item.state).toBe("INTAKE — new canonical identity created; not reconciled");
  });

  it("projects the FULL prose-record body as faithful sections (verbosity-first)", () => {
    const md = [
      "## `PL-ACTOR-01` — Remove the Principal as Human Clipboard",
      "",
      "**Date:** September 17, 2026  ",
      "**State:** INTAKE — new canonical identity created  ",
      "",
      "### What was discovered",
      "The Principal is the physical message bus among the actors.",
      "Second line of the discovery.",
      "",
      "### What remains unresolved",
      "Topology is intentionally unresolved.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-9.md", validLvt, validAr);
    const item = items.find((i: { id: string }) => i.id === "PL-ACTOR-01");
    const headings = item.sections.map((s: { heading: string }) => s.heading);
    expect(headings).toContain("What was discovered");
    expect(headings).toContain("What remains unresolved");
    // Full body, uncapped, line breaks preserved.
    const disc = item.sections.find((s: { heading: string }) => s.heading === "What was discovered");
    expect(disc.content).toContain("physical message bus");
    expect(disc.content).toContain("Second line of the discovery.");
    expect(disc.truncated).toBe(false);
    // Metadata bullets (Date/State) are not projected as a section body.
    expect(item.sections.some((s: { content: string }) => s.content.includes("September 17"))).toBe(false);
  });

  it("keeps the full table-row Summary uncapped and gives table rows no sections", () => {
    const bigSummary = "This is a very detailed summary. " + "detail ".repeat(300);
    const md = [
      "### Accepted Direction",
      "| ID | Name | Summary | Concept Home |",
      "|---|---|---|---|",
      `| \`PL-BIG\` | Big Item | ${bigSummary.replace(/\n/g, " ")} | home |`,
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot.md", validLvt, validAr);
    const item = items.find((i: { id: string }) => i.id === "PL-BIG");
    expect(item.descriptionTruncated).toBe(false);
    expect(item.description.length).toBeGreaterThan(1000);
    expect(item.sections).toEqual([]);
  });

  it("falls back to the first descriptive subsection when the lead region is empty", () => {
    // Well-formed records (### Intake / ### 1. What was discovered) place their
    // description under the first subsection; the lead region is then empty.
    const md = [
      "## `PL-OPS-08` — Observation Continuity / Gap Recovery",
      "",
      "**Date:** September 9, 2026  ",
      "**State:** INTAKE — new canonical identity created  ",
      "**Concept home:** `foundations/evidence-appliance.md`",
      "",
      "### Intake",
      "A local incident exposed a durable operational gap in the always-on promise.",
      "",
      "### What is deferred",
      "The broader problem is preserved for later work.",
    ].join("\n");
    const { items } = parseParkingLotFile(md, "parking-lot-7.md", validLvt, validAr);
    const item = items.find((i: { id: string }) => i.id === "PL-OPS-08");
    expect(item.description).toContain("A local incident exposed a durable operational gap");
    // Only the FIRST descriptive subsection is used, not later ones.
    expect(item.description).not.toContain("preserved for later work");
    expect(item.state).toBe("INTAKE — new canonical identity created");
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

describe("parseAdrs — full Context / Decision / Consequences", () => {
  const md = [
    "# Architecture Decision Records",
    "---",
    "## ADR-001: Separate Concerns",
    "**Date:** July 2026",
    "**Status:** Accepted",
    "**Context:** The prototype combined fetching and ranking in one pass.",
    "**Decision:** Separate Evidence Acquisition from the Recommendation Engine.",
    "**Consequences:**",
    "- Recommendations regenerate instantly.",
    "- Cached evidence survives reloads.",
    "---",
    "## ADR-014: Plural Decisions With Subsections",
    "**Date:** August 2026",
    "**Status:** Accepted",
    "**Context:** Implementing the view exposed a double-counting risk.",
    "**Decisions:**",
    "### Production recognition at receipt",
    "Premium is recognized at receipt.",
    "**Invariant:** One premium receipt contributes exactly once.",
    "### Lifecycle attribution",
    "Realized appreciation is production only under a governed lifecycle event.",
    "**Consequences:**",
    "- Forecast derives from known production only.",
    "---",
    "## ADR-007: No Consequences Field",
    "**Date:** July 2026",
    "**Status:** Accepted",
    "**Context:** Evidence has session-dependent validity.",
    "**Decision:** Implement a 6-state session model.",
    "**Current status:** Provisional shortcut in use.",
  ].join("\n");

  const { items } = parseAdrs(md);
  const byId = new Map(items.map((a: { id: string }) => [a.id, a]));

  it("captures full Context, Decision, and Consequences (line breaks preserved)", () => {
    const a1 = byId.get("ADR-001");
    expect(a1.context).toContain("combined fetching and ranking");
    expect(a1.decision).toContain("Separate Evidence Acquisition");
    // Consequences keeps its bullet lines.
    expect(a1.consequences).toContain("- Recommendations regenerate instantly.");
    expect(a1.consequences).toContain("- Cached evidence survives reloads.");
  });

  it("handles plural **Decisions:** with ### subsections and inline bold fields as one body", () => {
    const a14 = byId.get("ADR-014");
    // The whole Decisions block is captured, including its subsections and the
    // inline **Invariant:** field (which must NOT terminate the field).
    expect(a14.decision).toContain("Production recognition at receipt");
    expect(a14.decision).toContain("**Invariant:** One premium receipt contributes exactly once.");
    expect(a14.decision).toContain("Lifecycle attribution");
    // Consequences is a clean, separate field (no decision bleed-through).
    expect(a14.consequences).toContain("Forecast derives from known production only.");
    expect(a14.consequences).not.toContain("Production recognition at receipt");
  });

  it("leaves Consequences null when the record genuinely has none (faithful, not invented)", () => {
    const a7 = byId.get("ADR-007");
    expect(a7.context).toContain("session-dependent validity");
    expect(a7.decision).toContain("6-state session model");
    // ADR-007 uses "Current status" instead of Consequences — do not fabricate one.
    expect(a7.consequences).toBeNull();
  });

  it("stops a field at the --- record separator (no cross-record bleed)", () => {
    const a1 = byId.get("ADR-001");
    expect(a1.consequences).not.toContain("ADR-014");
    expect(a1.decision).not.toContain("Plural Decisions");
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

// ---------------------------------------------------------------------------
// Log — chronology of explicit governed temporal events (post-review model).
// ---------------------------------------------------------------------------

describe("parseLeadingCalendarDate", () => {
  it("parses a real leading 'Month D, YYYY' into an ISO ordering key", () => {
    expect(parseLeadingCalendarDate("September 7, 2026")).toEqual({ iso: "2026-09-07", error: null });
    expect(parseLeadingCalendarDate("September 8, 2026 (late-night session)")).toEqual({
      iso: "2026-09-08",
      error: null,
    });
    expect(parseLeadingCalendarDate("February 29, 2028")).toEqual({ iso: "2028-02-29", error: null }); // leap year
  });

  it("reports NO leading date distinctly from an INVALID date", () => {
    // No recognizable leading long-form date → not an error, just absent.
    expect(parseLeadingCalendarDate("soon")).toEqual({ iso: null, error: null });
    expect(parseLeadingCalendarDate("Q3 2026")).toEqual({ iso: null, error: null });
    expect(parseLeadingCalendarDate("")).toEqual({ iso: null, error: null });
  });

  it("FAILS CLOSED on impossible calendar dates (never silently normalized)", () => {
    const feb31 = parseLeadingCalendarDate("February 31, 2026");
    expect(feb31.iso).toBeNull();
    expect(feb31.error).toMatch(/impossible calendar date/i);

    const sep31 = parseLeadingCalendarDate("September 31, 2026");
    expect(sep31.iso).toBeNull();
    expect(sep31.error).toMatch(/impossible calendar date/i);

    const feb29_2027 = parseLeadingCalendarDate("February 29, 2027"); // not a leap year
    expect(feb29_2027.iso).toBeNull();
    expect(feb29_2027.error).toMatch(/impossible/i);

    const badMonth = parseLeadingCalendarDate("Septamber 7, 2026");
    expect(badMonth.iso).toBeNull();
    expect(badMonth.error).toMatch(/unknown month/i);
  });
});

describe("deriveEventKind", () => {
  it("classifies from the explicit state leading word", () => {
    expect(deriveEventKind("PL-X — Something", "INTAKE — new canonical identity")).toBe("intake");
    expect(deriveEventKind("PL-X — Something", "IMPLEMENTED (uncommitted)")).toBe("implementation");
    expect(deriveEventKind("PL-X — Something", "REMEDIATED / CLOSED")).toBe("remediation");
    expect(deriveEventKind("PL-X — Something", "RECONCILED — durable knowledge")).toBe("reconciliation");
  });

  it("treats a Refinement heading as refinement even when state leads with INTAKE", () => {
    // Load-bearing: a refinement's date must not establish an identity's intake date.
    expect(deriveEventKind("PL-OPS-01 Refinement — Reliability Fit", "INTAKE refinement under existing PL-OPS-01")).toBe("refinement");
    expect(deriveEventKind("PL-DEPLOY Refinement — X", "RECONCILED exploration")).toBe("refinement");
  });

  it("classifies a Reconciliation Completion Record heading as reconciliation", () => {
    expect(deriveEventKind("Reconciliation Completion Record — PL-X (Y)", null)).toBe("reconciliation");
  });

  it("returns 'unclassified' rather than guessing when authority is silent", () => {
    expect(deriveEventKind("Some Prose Heading With No Signal", null)).toBe("unclassified");
    expect(deriveEventKind("PL-X — Log lens intake/reconciliation (2026-09-21)", null)).toBe("unclassified");
  });

  it("does not misread 'not closed'/'not implemented' as a closure/impl kind", () => {
    // Exact leading token, not a substring scan.
    expect(deriveEventKind("PL-X — Something", "RECONCILED — not yet implemented")).toBe("reconciliation");
  });

  it("does NOT let a substring like 'V1 NOT IMPLEMENTED' become implementation (leak fixed)", () => {
    // Codex final finding 5: no substring scan through state/prose for kinds.
    expect(deriveEventKind("PL-X — Something", "V1 NOT IMPLEMENTED — pending")).toBe("unclassified");
    expect(deriveEventKind("PL-X — Something", "planned; implemented later maybe")).toBe("unclassified");
  });
});

describe("deriveIntakeEvidence — independent of eventKind", () => {
  it("is TRUE when the date explicitly marks intake, regardless of kind", () => {
    // A remediation record can still carry the intake date explicitly.
    expect(deriveIntakeEvidence("September 1, 2026 (intake); remediation later", "REMEDIATED / CLOSED")).toBe(true);
  });

  it("is TRUE when the state states a new/created canonical identity", () => {
    expect(deriveIntakeEvidence("September 9, 2026", "INTAKE — new canonical identity created")).toBe(true);
    expect(deriveIntakeEvidence("September 20, 2026", "RECONCILED — canonical identity created")).toBe(true);
    expect(deriveIntakeEvidence("September 15, 2026", "INTAKE — new canonical identity; shipped")).toBe(true);
  });

  it("is FALSE for a refinement that says 'no new PL-* identity created' even though it contains 'INTAKE'", () => {
    expect(
      deriveIntakeEvidence("September 9, 2026", "INTAKE refinement under existing PL-OPS-01; no new `PL-*` identity created"),
    ).toBe(false);
  });

  it("is FALSE for the bare word INTAKE with no explicit creation/intake marker", () => {
    expect(deriveIntakeEvidence("September 5, 2026", "INTAKE — under reconciliation")).toBe(false);
  });

  it("is FALSE for a later implementation event that does not restate intake", () => {
    expect(deriveIntakeEvidence("September 21, 2026", "IMPLEMENTED (uncommitted)")).toBe(false);
  });

  it("is FALSE when state is null and the date has no intake marker", () => {
    expect(deriveIntakeEvidence("September 13, 2026", null)).toBe(false);
  });
});

const LOG_FIXTURE = [
  "# Parking lot continuation fixture",
  "",
  "## `PL-OPS-08` — Observation Continuity / Gap Recovery",
  "",
  "**Date:** September 9, 2026 (live operator incident)  ",
  "**State:** INTAKE — new canonical identity created; bounded recovery control implemented  ",
  "**Concept home:** `foundations/evidence-appliance.md`",
  "",
  "Some prose about the record.",
  "",
  "## `PL-BIG` — A Parent Record With A Dated Nested Sub-Record",
  "",
  "**Date:** September 20, 2026",
  "**State:** RECONCILED — parent record.",
  "",
  "### Intake",
  "This undated ### subsection must NOT become an event.",
  "",
  "### `PL-BIG` — Implementation follow-up (2026-09-21)",
  "",
  "**Date:** September 21, 2026",
  "**State:** IMPLEMENTED — nested dated sub-record.",
  "",
  "## Reconciliation Completion Record — `PL-DEF` (Some Defect)",
  "",
  "**Date:** September 1, 2026 (intake); remediation later",
  "**Reconciliation state:** REMEDIATED / CLOSED. Repair shipped.",
  "",
  "## `PL-NODATE` — Item With No Explicit Date",
  "",
  "**State:** INTAKE — but this record states no Date line.",
  "**Concept home:** nowhere",
  "",
  "## Free Prose Record With A Date But No PL Id And No State",
  "",
  "**Date:** September 13, 2026",
].join("\n");

describe("parseLogEvents — depth-aware, explicit-only", () => {
  const { events, dateErrors } = parseLogEvents(LOG_FIXTURE, "parking-lot-fixture.md");

  it("captures dated records at BOTH ## and nested ### depth", () => {
    // PL-OPS-08 (##), PL-BIG parent (##), PL-BIG nested (###), PL-DEF (##),
    // and the free-prose dated record (##). PL-NODATE has no Date → excluded.
    expect(events).toHaveLength(5);
    const nested = events.find((e: { headingLevel: number }) => e.headingLevel === 3);
    expect(nested).toBeTruthy();
    expect(nested.plId).toBe("PL-BIG");
    expect(nested.eventKind).toBe("implementation");
  });

  it("keeps the dated parent AND its dated nested sub-record as two distinct events", () => {
    const big = events.filter((e: { plId: string | null }) => e.plId === "PL-BIG");
    expect(big).toHaveLength(2);
    expect(big.map((e: { eventDateIso: string }) => e.eventDateIso).sort()).toEqual([
      "2026-09-20",
      "2026-09-21",
    ]);
  });

  it("does NOT turn an undated ### subsection (### Intake) into an event", () => {
    expect(events.some((e: { title: string }) => e.title === "Intake")).toBe(false);
  });

  it("omits records with no explicit date (never inferred)", () => {
    expect(events.some((e: { plId: string | null }) => e.plId === "PL-NODATE")).toBe(false);
  });

  it("captures PL id when the heading names one, else null; state may be null", () => {
    const free = events.find((e: { title: string }) => e.title.startsWith("Free Prose Record"));
    expect(free.plId).toBeNull();
    expect(free.state).toBeNull();
    expect(free.eventKind).toBe("unclassified");
  });

  it("derives event kind explicitly and preserves state verbatim", () => {
    const ops = events.find((e: { plId: string }) => e.plId === "PL-OPS-08");
    expect(ops.eventKind).toBe("intake");
    const def = events.find((e: { title: string }) => e.title.includes("PL-DEF"));
    expect(def.eventKind).toBe("remediation");
    expect(def.state).toBe("REMEDIATED / CLOSED. Repair shipped.");
  });

  it("preserves the authored date verbatim and derives a validated ISO key", () => {
    const ops = events.find((e: { plId: string }) => e.plId === "PL-OPS-08");
    expect(ops.eventDateText).toBe("September 9, 2026 (live operator incident)");
    expect(ops.eventDateIso).toBe("2026-09-09");
  });

  it("carries only explicit-only fields (no priority/owner/progress/transitions)", () => {
    for (const e of events) {
      expect(Object.keys(e).sort()).toEqual([
        "bugId",
        "establishesIntake",
        "eventDateIso",
        "eventDateText",
        "eventKind",
        "headingLevel",
        "plId",
        "sourceFile",
        "sourceOrder",
        "state",
        "title",
      ]);
      // Parking-lot events carry a null bugId (source identity is PL-*).
      expect((e as { bugId: string | null }).bugId).toBeNull();
    }
  });

  it("separates event classification from intake evidence (Codex final finding 1)", () => {
    // PL-DEF is a REMEDIATION event that ALSO explicitly establishes intake via
    // its "(intake)" date marker — the two facts are independent.
    const def = events.find((e: { title: string }) => e.title.includes("PL-DEF"));
    expect(def.eventKind).toBe("remediation");
    expect(def.establishesIntake).toBe(true);
    // PL-OPS-08 intake record establishes intake.
    const ops = events.find((e: { plId: string }) => e.plId === "PL-OPS-08");
    expect(ops.establishesIntake).toBe(true);
    // The nested IMPLEMENTED follow-up does NOT establish intake.
    const nested = events.find((e: { headingLevel: number }) => e.headingLevel === 3);
    expect(nested.establishesIntake).toBe(false);
  });

  it("captures monotonic source order (parent before nested child)", () => {
    const parent = events.find((e: { headingLevel: number; plId: string | null }) => e.headingLevel === 2 && e.plId === "PL-BIG");
    const child = events.find((e: { headingLevel: number }) => e.headingLevel === 3);
    expect(parent.sourceOrder).toBeLessThan(child.sourceOrder);
  });

  it("reports no date errors for a valid fixture", () => {
    expect(dateErrors).toEqual([]);
  });
});

describe("parseLogEvents — impossible dates fail closed", () => {
  const BAD_FIXTURE = [
    "## `PL-BAD` — Impossible Date Record",
    "",
    "**Date:** September 31, 2026",
    "**State:** INTAKE — bad date.",
  ].join("\n");

  it("surfaces an impossible calendar date as an error and emits no event for it", () => {
    const { events, dateErrors } = parseLogEvents(BAD_FIXTURE, "parking-lot-bad.md");
    expect(events).toHaveLength(0);
    expect(dateErrors.length).toBeGreaterThan(0);
    expect(dateErrors[0]).toMatch(/impossible calendar date/i);
  });
});

describe("parseLogEvents — generic heading depth (not special-cased to ##/###)", () => {
  const DEEP_FIXTURE = [
    "## `PL-A` — Parent",
    "**Date:** September 1, 2026",
    "**State:** INTAKE — new canonical identity created",
    "#### `PL-A` — Deep nested dated sub-record",
    "**Date:** September 2, 2026",
    "**State:** IMPLEMENTED follow-up",
    "##### Undated deep subsection",
    "text only, no date",
  ].join("\n");

  it("attributes a dated #### record to itself, not its ## parent", () => {
    const { events } = parseLogEvents(DEEP_FIXTURE, "fixture.md", 0);
    const deep = events.find((e: { headingLevel: number }) => e.headingLevel === 4);
    expect(deep).toBeTruthy();
    expect(deep.eventDateIso).toBe("2026-09-02");
    expect(deep.eventKind).toBe("implementation");
    // The undated ##### subsection is not an event.
    expect(events.some((e: { headingLevel: number }) => e.headingLevel === 5)).toBe(false);
    // Parent and deep child are two events.
    expect(events).toHaveLength(2);
  });

  it("threads a global source-order counter across files via startOrder/nextOrder", () => {
    const first = parseLogEvents(DEEP_FIXTURE, "a.md", 0);
    const second = parseLogEvents(DEEP_FIXTURE, "b.md", first.nextOrder);
    // Every source order in the second file is greater than in the first.
    const maxFirst = Math.max(...first.events.map((e: { sourceOrder: number }) => e.sourceOrder));
    const minSecond = Math.min(...second.events.map((e: { sourceOrder: number }) => e.sourceOrder));
    expect(minSecond).toBeGreaterThan(maxFirst);
  });
});
