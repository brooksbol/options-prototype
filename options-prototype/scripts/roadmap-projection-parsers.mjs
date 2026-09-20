/**
 * Roadmap Projection — pure parsers.
 *
 * These functions transform the canonical Wheelwright roadmap authorities into
 * the projection shape (see src/roadmap/roadmap-projection-types.ts). They are
 * intentionally pure (string in, structured data out) so they can be unit-tested
 * directly against representative fixtures.
 *
 * GOVERNING RULES (enforced here, not just documented):
 *   - Relationships are EXPLICIT-ONLY. PL -> LVT/AR links are emitted only when
 *     the item's own text names the target ID. Nothing is inferred.
 *   - No priority, sequence, progress, dates, owners, estimates, or authorization
 *     state is synthesized. Parking-lot row order is not priority.
 *   - Legacy LVT aliases are historical traceability only; the canonical ID wins.
 *
 * The Markdown remains authoritative; this only derives a read-only view.
 */

/** Prefix -> LVT node type. Order matters: longer/more specific prefixes first. */
const LVT_TYPE_BY_PREFIX = [
  ["LVT-VISION-", "vision"],
  ["LVT-GOAL-", "goal"],
  ["LVT-BET-", "bet"],
  ["LVT-DIRECTION-", "direction"],
  ["LVT-INIT-", "initiative"],
  ["LVT-EXP-", "experiment"],
];

/** Determine the LVT node type from its semantic ID. Returns null if unknown. */
export function lvtTypeFromId(id) {
  for (const [prefix, type] of LVT_TYPE_BY_PREFIX) {
    if (id.startsWith(prefix)) return type;
  }
  return null;
}

/**
 * Parse a single canonical LVT bullet line.
 * Format:
 *   <indent>- **`LVT-...` — Name** *(legacy `ALIAS`)* — description
 * The legacy clause is optional. Returns null if the line is not an LVT bullet.
 */
export function parseLvtLine(line) {
  // Count leading spaces before the "- " bullet marker.
  const bulletMatch = line.match(/^(\s*)-\s+\*\*`(LVT-[A-Z0-9-]+)`/);
  if (!bulletMatch) return null;

  const indent = bulletMatch[1].length;
  const id = bulletMatch[2];

  // Name is the text between the backticked ID and the closing ** of the bold span.
  // e.g. `LVT-GOAL-AWARENESS` — Understand the Situation**
  const afterId = line.slice(line.indexOf(id) + id.length);
  // afterId starts with "` — Understand the Situation** *(legacy `G1`)* — desc..."
  const boldEnd = afterId.indexOf("**");
  let name = "";
  if (boldEnd >= 0) {
    // Strip leading "` — " (backtick, spaces, em/en dash, spaces).
    name = afterId
      .slice(0, boldEnd)
      .replace(/^`/, "")
      .replace(/^\s*[—–-]\s*/, "")
      .trim();
  }

  // Legacy alias, if present: *(legacy `G1`)*
  const legacyMatch = line.match(/\(legacy\s+`([^`]+)`\)/);
  const legacyAlias = legacyMatch ? legacyMatch[1].trim() : null;

  // Description: text after the bold span's closing **, minus an optional
  // legacy clause and its trailing dash separator.
  let description = "";
  if (boldEnd >= 0) {
    let rest = afterId.slice(boldEnd + 2); // after closing **
    // Remove an optional legacy clause.
    rest = rest.replace(/\*\(legacy\s+`[^`]+`\)\*/, "");
    // Remove a leading dash separator.
    rest = rest.replace(/^\s*[—–-]\s*/, "");
    description = rest.trim();
  }

  return { id, indent, name, description, legacyAlias };
}

/**
 * Parse the full canonical LVT tree from docs/roadmap.md content.
 * Parentage is derived from indentation depth using a running stack.
 * Returns { nodes, aliasToId, notes }.
 */
export function parseLvt(markdown) {
  const lines = markdown.split("\n");
  const nodes = [];
  const byId = new Map();
  const aliasToId = new Map();
  const notes = [];

  // Only parse the canonical tree region: from the Vision bullet until the
  // first heading after it (the "## LVT Notes ..." section). We detect the
  // region by starting at the first LVT-VISION bullet and stopping at the next
  // level-2 heading.
  let inTree = false;
  const stack = []; // entries: { indent, id }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    if (!inTree) {
      if (/^\s*-\s+\*\*`LVT-VISION-/.test(line)) {
        inTree = true;
      } else {
        continue;
      }
    } else if (/^#{1,6}\s/.test(line)) {
      // A heading ends the canonical tree region.
      break;
    }

    const parsed = parseLvtLine(line);
    if (!parsed) continue;

    const type = lvtTypeFromId(parsed.id);
    if (!type) {
      notes.push(`LVT id with unrecognized type prefix: ${parsed.id}`);
      continue;
    }

    if (byId.has(parsed.id)) {
      notes.push(`Duplicate LVT id encountered (ignored second): ${parsed.id}`);
      continue;
    }

    // Determine parent from the indentation stack.
    while (stack.length > 0 && stack[stack.length - 1].indent >= parsed.indent) {
      stack.pop();
    }
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

    const node = {
      id: parsed.id,
      type,
      name: parsed.name,
      description: parsed.description,
      legacyAlias: parsed.legacyAlias,
      childIds: [],
      parentId,
    };
    nodes.push(node);
    byId.set(node.id, node);
    if (parentId) {
      byId.get(parentId).childIds.push(node.id);
    }
    if (node.legacyAlias) {
      aliasToId.set(node.legacyAlias, node.id);
    }

    stack.push({ indent: parsed.indent, id: node.id });
  }

  return { nodes, aliasToId, notes };
}

/**
 * Expand a "Pressure from:" token list into individual legacy alias tokens.
 * Handles comma separation, slash groups (X1/X2, O1/O2), and ranges (A1–A3).
 * Non-alias tokens (e.g. "PL-ARCH-06", prose) are returned as raw tokens.
 * Returns { aliases, raw }.
 */
export function expandPressureTokens(text) {
  const aliases = [];
  const raw = [];

  // Split on commas and semicolons and the word "and".
  const chunks = text
    .split(/[,;]| and /i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  for (const chunk of chunks) {
    // A chunk may contain slash-joined aliases: X1/X2, O1/O2.
    const slashParts = chunk.split("/").map((p) => p.trim());
    for (const rawPart of slashParts) {
      // Strip trailing sentence punctuation (e.g. a period ending the line).
      const part = rawPart.replace(/[.]+$/, "").trim();
      // Range like A1–A3 / A1-A3 (en dash, em dash, or hyphen between two aliases).
      const rangeMatch = part.match(/^([A-Z]+)(\d+)\s*[–—-]\s*([A-Z]+)?(\d+)$/);
      if (rangeMatch) {
        const startLetters = rangeMatch[1];
        const start = parseInt(rangeMatch[2], 10);
        const endLetters = rangeMatch[3] || startLetters;
        const end = parseInt(rangeMatch[4], 10);
        if (startLetters === endLetters && end >= start) {
          for (let n = start; n <= end; n++) {
            aliases.push(`${startLetters}${n}`);
          }
          continue;
        }
      }
      // Simple alias like A2, C5, K8, G6, L1, N1, X1.
      if (/^[A-Z]{1,2}\d+$/.test(part)) {
        aliases.push(part);
      } else if (part.length > 0) {
        raw.push(part.replace(/\.$/, ""));
      }
    }
  }

  return { aliases, raw };
}

/**
 * Parse the architecture roadmap (AR1..ARn) from docs/architecture-roadmap.md.
 * `aliasToId` maps legacy LVT aliases to canonical LVT IDs (from parseLvt).
 * Returns { pressures, notes }.
 */
export function parseArchitecture(markdown, aliasToId) {
  const lines = markdown.split("\n");
  const pressures = [];
  const notes = [];

  let current = null;

  const finalize = () => {
    if (current) pressures.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const headingMatch = line.match(/^##\s+(AR\d+)\s*[—–-]\s*(.+?)\s*$/);
    if (headingMatch) {
      finalize();
      current = {
        id: headingMatch[1],
        title: headingMatch[2].trim(),
        candidateTransition: null,
        pressureFromLvtIds: [],
        pressureFromRaw: [],
      };
      continue;
    }

    if (!current) continue;

    // Another top-level heading (not an AR) ends AR parsing.
    if (/^#{1,2}\s/.test(line) && !line.startsWith("## AR")) {
      finalize();
      // Continue scanning; there may be nothing more, but stay safe.
      continue;
    }

    const pressureMatch = line.match(/^\*\*Pressure from:\*\*\s*(.+?)\s*$/);
    if (pressureMatch) {
      const { aliases, raw } = expandPressureTokens(pressureMatch[1]);
      const seen = new Set();
      for (const alias of aliases) {
        const canonical = aliasToId.get(alias);
        if (canonical) {
          if (!seen.has(canonical)) {
            current.pressureFromLvtIds.push(canonical);
            seen.add(canonical);
          }
        } else {
          current.pressureFromRaw.push(alias);
          notes.push(`${current.id}: legacy alias "${alias}" did not resolve to a canonical LVT id`);
        }
      }
      for (const r of raw) current.pressureFromRaw.push(r);
      continue;
    }

    const transitionMatch = line.match(/^\*\*Candidate transition:\*\*\s*(.+?)\s*$/);
    if (transitionMatch && current.candidateTransition === null) {
      current.candidateTransition = transitionMatch[1].trim();
    }
  }

  finalize();
  return { pressures, notes };
}

/**
 * True when a section heading denotes the RESOLVED landscape rather than active
 * work. Rows under these headings are graduated/closed history, owned by
 * parseGraduatedIndex, and must not be captured as active parking-lot items.
 */
export function isResolvedLandscapeSection(section) {
  const s = (section || "").toLowerCase();
  return (
    /graduated\s*\/?\s*closed/.test(s) ||
    /merge\s*\/?\s*split\s*\/?\s*supersession/.test(s) ||
    /supersession history/.test(s)
  );
}

/**
 * Extract parking-lot items from a single physical parking-lot file's content.
 *
 * Two shapes are supported:
 *   (a) TABLE rows:      | `PL-ID` | Name | ... |   (primary parking-lot.md)
 *   (b) PROSE headings:  ## `PL-ID` — Name         (continuation reconciliation records)
 *
 * The item's section is the nearest preceding "###"/"##" section heading (for
 * table rows) or derived from the heading itself (for prose records). Relationships
 * to LVT/AR are populated ONLY from explicit ID mentions in the item's own text.
 *
 * `validLvtIds` / `validArIds` are the sets of canonical IDs that actually exist,
 * so a stray token that merely looks like an ID cannot invent a relationship.
 */
export function parseParkingLotFile(content, fileName, validLvtIds, validArIds) {
  const lines = content.split("\n");
  const items = new Map(); // id -> item (first occurrence wins for identity/name/section)
  const notes = [];

  let currentSection = "(unsectioned)";

  // Accumulate text per item so we can scan for explicit relationships. For table
  // rows, the item's text is the row. For prose records, the text is the block
  // from the heading until the next PL heading or top-level heading.
  const itemText = new Map(); // id -> accumulated text
  let activeProseId = null;

  const recordItem = (id, name, section) => {
    if (!items.has(id)) {
      items.set(id, {
        id,
        name: name || null,
        section,
        sourceFile: fileName,
        relatedLvtIds: [],
        relatedArIds: [],
      });
      itemText.set(id, "");
    }
  };

  const appendText = (id, text) => {
    itemText.set(id, (itemText.get(id) || "") + "\n" + text);
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    // Section headings (### or ##) — but a "## `PL-...`" heading is a prose item, handled below.
    const proseHeading = line.match(/^##\s+`(PL-[A-Z0-9-]+)`\s*(?:[—–-]\s*(.+?))?\s*$/);
    if (proseHeading) {
      const id = proseHeading[1];
      const name = proseHeading[2] ? proseHeading[2].trim() : null;
      // Section for a prose reconciliation record is the record itself.
      recordItem(id, name, "Reconciliation / continuation record");
      activeProseId = id;
      appendText(id, line);
      continue;
    }

    // A level-2 heading (## ...) that is not a PL record ends any active prose
    // block and updates the current table section. Level-3 headings (### ...)
    // are SUBSECTIONS of a prose reconciliation record (Intake, Strategic
    // disposition, etc.) and must NOT terminate the active prose block, or the
    // explicit relationships stated in those subsections would be lost.
    const level2Heading = line.match(/^##\s+(.+?)\s*$/);
    if (level2Heading) {
      currentSection = level2Heading[1].replace(/`/g, "").trim();
      activeProseId = null;
      continue;
    }

    const level3Heading = line.match(/^###\s+(.+?)\s*$/);
    if (level3Heading) {
      if (activeProseId) {
        // Subsection of the active prose record: keep accumulating.
        appendText(activeProseId, line);
      } else {
        // A table-context section grouping (e.g. "### Accepted Direction").
        currentSection = level3Heading[1].replace(/`/g, "").trim();
      }
      continue;
    }

    // Table row beginning with a backticked PL id: | `PL-ID` | Name | ... |
    // BUT rows under the resolved-landscape sections (Graduated/Closed Index,
    // Merge/Split/Supersession History) are NOT active items — they describe
    // work that has already been resolved and are owned by the graduated-index
    // parser. Capturing them here would double-book a closed id as active.
    const tableRow = line.match(/^\|\s*`(PL-[A-Z0-9-]+)`\s*\|\s*([^|]*?)\s*\|(.*)$/);
    if (tableRow && !isResolvedLandscapeSection(currentSection)) {
      const id = tableRow[1];
      const name = tableRow[2].trim();
      recordItem(id, name || null, currentSection);
      appendText(id, line);
      // A table row is self-contained; do not treat following lines as its text.
      continue;
    }

    // Otherwise, if we are inside a prose PL record, accumulate its text.
    if (activeProseId) {
      appendText(activeProseId, line);
    }
  }

  // Now resolve explicit relationships from accumulated text.
  for (const [id, item] of items) {
    const text = itemText.get(id) || "";

    const lvtSeen = new Set();
    for (const m of text.matchAll(/LVT-[A-Z0-9-]+/g)) {
      const candidate = m[0];
      if (validLvtIds.has(candidate) && !lvtSeen.has(candidate)) {
        lvtSeen.add(candidate);
      }
    }
    item.relatedLvtIds = [...lvtSeen].sort();

    // AR relationships: explicit single-AR mentions only. A RANGE expression
    // such as "AR1–AR10" (or "AR1-AR10") is descriptive of the AR set as a
    // whole, not a targeted relationship to each member, so we neutralize range
    // spans before scanning. This prevents manufacturing 10 false relationships
    // from a phrase that merely refers to "AR1..AR10 pressures".
    const arScanText = text.replace(/`?\bAR\d+`?\s*[–—-]\s*`?AR\d+`?/g, " ");
    const arSeen = new Set();
    for (const m of arScanText.matchAll(/\bAR\d+\b/g)) {
      const candidate = m[0];
      if (validArIds.has(candidate) && !arSeen.has(candidate)) {
        arSeen.add(candidate);
      }
    }
    item.relatedArIds = [...arSeen].sort();
  }

  return { items: [...items.values()], notes };
}

/**
 * Parse the "Graduated / Closed Index" table from the primary parking-lot file.
 *
 * This surfaces the RESOLVED landscape — what has already been implemented,
 * promoted, superseded, merged, reframed, dissolved, or split — as a companion
 * to the active parking-lot items. Format:
 *
 *   ## Graduated / Closed Index
 *   | Former ID | Name | Disposition | Destination |
 *   |---|---|---|---|
 *   | `PL-OPS-03` | Prior-Epoch ... | Implemented (Java) | Recovery-probe ... |
 *   | #7 | PendingIntent ... | Implemented | src/execution/... |
 *
 * The disposition cell may contain markdown emphasis (**Promoted**); it is
 * normalized to plain text. Only rows under the Graduated/Closed heading are
 * captured. Returns { items }.
 */
export function parseGraduatedIndex(content) {
  const lines = content.split("\n");
  const items = [];
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      inSection = /graduated\s*\/?\s*closed/i.test(heading[1]);
      continue;
    }
    if (!inSection) continue;

    // Table row: | former-id | name | disposition | destination |
    const row = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/);
    if (!row) continue;

    const rawId = row[1].replace(/`/g, "").trim();
    // Skip the header row and the separator row.
    if (/^former id$/i.test(rawId) || /^-+$/.test(rawId) || rawId.length === 0) continue;

    const name = row[2].trim();
    const disposition = row[3].replace(/\*\*/g, "").replace(/`/g, "").trim();
    const destination = row[4].replace(/`/g, "").trim();

    // A graduated/closed row must actually carry a disposition; otherwise it is
    // some other table that happened to follow the heading.
    if (!disposition) continue;

    items.push({
      id: rawId,
      name: name || null,
      disposition,
      destination: destination || null,
    });
  }

  return { items };
}

/**
 * Parse Architecture Decision Records from docs/07c-adrs.md.
 *
 * Format:
 *   ## ADR-001: Evidence Acquisition and Recommendation are Separate Concerns
 *   **Date:** July 2026
 *   **Status:** Accepted
 *   **Context:** ...
 *   **Decision:** ...
 *   **Consequences:** ...
 *
 * Captures id, title, date, status, and a concise context excerpt. The full ADR
 * text remains in the canonical Markdown; this is a projection, not a copy.
 * Returns { items }.
 */
export function parseAdrs(markdown) {
  const lines = markdown.split("\n");
  const items = [];
  let current = null;

  const finalize = () => {
    if (current) {
      // Trim the collected context to a concise excerpt (first paragraph).
      const contextText = current._context.join(" ").replace(/\s+/g, " ").trim();
      current.context = contextText.length > 0 ? contextText : null;
      delete current._context;
      delete current._collecting;
      items.push(current);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const heading = line.match(/^##\s+(ADR-\d+)\s*:\s*(.+?)\s*$/);
    if (heading) {
      finalize();
      current = {
        id: heading[1],
        title: heading[2].trim(),
        date: null,
        status: null,
        context: null,
        _context: [],
        _collecting: false,
      };
      continue;
    }
    if (!current) continue;

    const dateMatch = line.match(/^\*\*Date:\*\*\s*(.+?)\s*$/);
    if (dateMatch) {
      current.date = dateMatch[1].trim();
      continue;
    }
    const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+?)\s*$/);
    if (statusMatch) {
      current.status = statusMatch[1].trim();
      continue;
    }
    const contextMatch = line.match(/^\*\*Context:\*\*\s*(.*)$/);
    if (contextMatch) {
      current._collecting = true;
      if (contextMatch[1].trim().length > 0) current._context.push(contextMatch[1].trim());
      continue;
    }
    // A subsequent bold field (Decision:, Consequences:, etc.) ends context collection.
    if (/^\*\*[A-Z][a-z]+.*:\*\*/.test(line)) {
      current._collecting = false;
      continue;
    }
    if (current._collecting) {
      if (line.trim().length === 0) {
        // Blank line ends the first context paragraph.
        if (current._context.length > 0) current._collecting = false;
      } else {
        current._context.push(line.trim());
      }
    }
  }

  finalize();
  return { items };
}

/** Remove HTML comment blocks so authoring guidance inside <!-- --> is never parsed as data. */
export function stripHtmlComments(markdown) {
  return markdown.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Parse the provisional priority stack from docs/roadmap-priority.md.
 *
 * Reads ONLY the "## Ranked stack" section. Each ranked entry is a numbered
 * list item, optionally referencing a canonical id:
 *   1. `PL-XXXX` — short reason
 *   2. `LVT-BET-...` — short reason
 *
 * Priority is authority-established only; this parser NEVER infers order. If the
 * section has no numbered entries (the honest default), it returns an empty list.
 * `known` (optional) is a Set of valid ids used to mark whether a referenced id
 * resolves; unresolved refs are preserved verbatim, never dropped.
 * Returns { established, entries }.
 */
export function parsePriority(markdown, known) {
  const lines = stripHtmlComments(markdown).split("\n");
  const entries = [];
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      inSection = /ranked stack/i.test(heading[1]);
      continue;
    }
    if (!inSection) continue;

    // Numbered entry: "1. `ID` — reason"  or  "1. free-text reason"
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (!numbered) continue;
    const body = numbered[1].trim();
    if (body.length === 0) continue;

    const idMatch = body.match(/^`([A-Z][A-Z0-9-]+)`\s*(?:[—–-]\s*(.*))?$/);
    if (idMatch) {
      const refId = idMatch[1];
      entries.push({
        rank: entries.length + 1,
        refId,
        refResolves: known ? known.has(refId) : null,
        reason: idMatch[2] ? idMatch[2].trim() : null,
      });
    } else {
      entries.push({
        rank: entries.length + 1,
        refId: null,
        refResolves: null,
        reason: body,
      });
    }
  }

  return { established: entries.length > 0, entries };
}

/**
 * Parse the curated user-facing list from docs/roadmap-coming-soon.md.
 *
 * Reads ONLY the "## Items" section. Each item is a bullet:
 *   - Capability Name — one-line description [optional: Status]
 *
 * Nothing is auto-included; if the section has no bullets (the honest default),
 * returns an empty list. Never infers items from other authorities.
 * Returns { curated, items }.
 */
export function parseComingSoon(markdown) {
  const lines = stripHtmlComments(markdown).split("\n");
  const items = [];
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      inSection = /^items$/i.test(heading[1].trim());
      continue;
    }
    if (!inSection) continue;

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (!bullet) continue;
    let body = bullet[1].trim();
    if (body.length === 0) continue;
    // Skip an italic placeholder line if authored as a bullet (defensive).
    if (/^_.*_$/.test(body)) continue;

    // Optional trailing status in brackets: "... [Exploring]"
    let status = null;
    const statusMatch = body.match(/\[([^\]]+)\]\s*$/);
    if (statusMatch) {
      status = statusMatch[1].trim();
      body = body.slice(0, statusMatch.index).trim();
    }

    // Split "Name — description".
    const split = body.match(/^(.*?)\s*[—–-]\s*(.*)$/);
    const name = split ? split[1].trim() : body;
    const description = split ? split[2].trim() : null;

    items.push({ name, description: description || null, status });
  }

  return { curated: items.length > 0, items };
}

/**
 * Parse the canonical Principles register from docs/principles.md.
 *
 * Reads ONLY the "## Ratified principles" section. Family is the "### Family"
 * subheading; each principle is a bullet:
 *   - **`PRIN-...` — Name.** statement...
 *
 * The register is the single source of truth for which principles are ratified;
 * this parser never infers principles from other documents. Anything outside the
 * "Ratified principles" section (e.g. the "Not yet in this register" section) is
 * intentionally ignored. Returns { items }.
 */
export function parsePrinciples(markdown) {
  const lines = stripHtmlComments(markdown).split("\n");
  const items = [];
  let inRatified = false;
  let family = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      inRatified = /^ratified principles$/i.test(h2[1].trim());
      family = null;
      continue;
    }
    if (!inRatified) continue;

    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      family = h3[1].trim();
      continue;
    }

    // - **`PRIN-...` — Name.** statement
    const bullet = line.match(/^\s*-\s+\*\*`(PRIN-[A-Z0-9-]+)`\s*[—–-]\s*(.+?)\*\*\s*(.*)$/);
    if (bullet) {
      const id = bullet[1];
      const name = bullet[2].trim().replace(/\.$/, "");
      let rest = bullet[3].trim();

      // Optional explicit provenance: "**Provenance:** ...". Split it out of the
      // statement so a consolidated (multi-source) principle carries its provenance.
      let provenance = null;
      const provMatch = rest.match(/\*\*Provenance:\*\*\s*(.*)$/);
      if (provMatch) {
        // Provenance text runs to the end (may include a trailing parenthetical note).
        provenance = provMatch[1].trim();
        rest = rest.slice(0, provMatch.index).trim();
      }

      items.push({
        id,
        name,
        family: family || "(unspecified)",
        statement: rest.length > 0 ? rest : null,
        provenance,
      });
    }
  }

  return { items };
}
