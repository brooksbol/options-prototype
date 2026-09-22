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

/** Month-name → 1-based month number, for parsing "Month D, YYYY" date text. */
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** Days per month (index 1..12); February handled with a leap-year check. */
function daysInMonth(month, year) {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

/**
 * Parse a LEADING "Month D, YYYY" from an authored date string into a REAL
 * calendar date. Returns { iso } on success, or { error } describing why it is
 * not a valid calendar date. Distinguishes three outcomes deliberately:
 *   - no leading long-form date at all      → { iso: null, error: null }
 *   - a leading date that is NOT a real day  → { iso: null, error: "..." }  (fail closed)
 *   - a valid real calendar date             → { iso: "YYYY-MM-DD", error: null }
 *
 * This NEVER infers a date; it only validates and normalizes one the authority
 * explicitly stated. Impossible dates (Feb 31, Sep 31, month 13) are surfaced as
 * errors so the generator can fail closed rather than silently normalizing or
 * sorting them last.
 */
export function parseLeadingCalendarDate(text) {
  if (!text) return { iso: null, error: null };
  const m = text.match(/^\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\b/);
  if (!m) return { iso: null, error: null };
  const monthName = m[1].toLowerCase();
  const month = MONTHS[monthName];
  if (!month) {
    return { iso: null, error: `unknown month name "${m[1]}"` };
  }
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const max = daysInMonth(month, year);
  if (day < 1 || day > max) {
    return { iso: null, error: `impossible calendar date "${m[1]} ${day}, ${year}" (${monthName} has ${max} days${month === 2 ? " that year" : ""})` };
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return { iso: `${year}-${mm}-${dd}`, error: null };
}

/**
 * Parse a governed event date embedded IN a bug-corpus heading. Bug records do
 * not use the parking-lot `**Date:**` convention; their governed dated events are
 * expressed as dated section headings, e.g.
 *
 *   "## Audit checkpoint — 2026-09-22"
 *   "## Principal acceptance / closure (2026-09-17)"
 *   "## Migration provenance (2026-09-11)"
 *
 * Accepts either a leading/embedded ISO date (YYYY-MM-DD) or a "Month D, YYYY"
 * form, wherever it appears in the heading text. NEVER infers a date; it only
 * validates and normalizes one the heading explicitly states. Impossible ISO
 * dates (month 13, day 32, Feb 30) are surfaced as errors so the generator can
 * fail closed, consistent with parseLeadingCalendarDate.
 *
 * Returns { iso, error, dateText } — dateText is the matched date substring
 * exactly as authored. { iso: null, error: null } when no date is present.
 */
export function parseHeadingEventDate(headingText) {
  if (!headingText) return { iso: null, error: null, dateText: null };

  // ISO form anywhere in the heading.
  const isoMatch = headingText.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month < 1 || month > 12) {
      return { iso: null, error: `impossible calendar date "${isoMatch[0]}" (month ${month})`, dateText: isoMatch[0] };
    }
    const max = daysInMonth(month, year);
    if (day < 1 || day > max) {
      return { iso: null, error: `impossible calendar date "${isoMatch[0]}" (month ${month} has ${max} days${month === 2 ? " that year" : ""})`, dateText: isoMatch[0] };
    }
    return { iso: isoMatch[0], error: null, dateText: isoMatch[0] };
  }

  // "Month D, YYYY" form anywhere in the heading.
  const longMatch = headingText.match(/\b([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\b/);
  if (longMatch) {
    const { iso, error } = parseLeadingCalendarDate(longMatch[0]);
    return { iso, error, dateText: longMatch[0] };
  }

  return { iso: null, error: null, dateText: null };
}

/**
 * Governed bug-corpus heading vocabulary → Log event kind. EXPLICIT-ONLY: a bug
 * heading is a governed Log event ONLY when its leading phrase matches one of the
 * governed forms the `docs/bugs/` corpus actually uses. A heading that merely
 * contains a date (e.g. an evidence-capture subsection like "Empirical specimen
 * (Sep 4, 2026)" or "Live evidence (captured 2026-09-11)") is NOT a governed
 * project event and returns null — it must never be promoted into the Log.
 *
 * The mapping preserves the bug corpus's own semantics onto the existing Log kind
 * vocabulary (no new kinds are invented):
 *   - audit checkpoint / post-resolution validation / migration provenance → reconciliation
 *   - principal authorization / scope expansion (authorized)               → implementation
 *   - principal acceptance / closure                                       → remediation
 *
 * Returns a LogEventKind, or null when the heading is not a governed bug event.
 */
export function deriveBugEventKind(headingText) {
  const t = (headingText || "").trim();
  // Acceptance/closure must be checked before generic "authorization" phrasing.
  if (/^Principal acceptance\b|\bacceptance \/ closure\b/i.test(t)) return "remediation";
  if (/^Principal authorization\b/i.test(t)) return "implementation";
  if (/^Scope expansion\b.*Principal-authorized/i.test(t)) return "implementation";
  if (/^(Open-bug )?[Aa]udit checkpoint\b/i.test(t)) return "reconciliation";
  if (/^Post-resolution validation\b/i.test(t)) return "reconciliation";
  if (/^Migration provenance\b/i.test(t)) return "reconciliation";
  return null;
}

/**
 * Extract explicit governed temporal EVENTS from a single bug-corpus file (a
 * `BUG-NNN-*.md` record or `INDEX.md`) — the Log's semantic unit for the bug
 * authority. Companion to parseLogEvents (parking-lot authority) with the same
 * output shape, so bug events and parking-lot events populate one chronological
 * Log while each preserves its own source-system identity.
 *
 * GOVERNED-FORM-ONLY, EXPLICIT-ONLY. An event is a heading (depth 2..6) whose
 * text BOTH (a) matches a governed bug-event form (deriveBugEventKind) AND (b)
 * carries an explicit calendar date in the heading (parseHeadingEventDate). A
 * heading missing either signal produces no event. Nothing is inferred from file
 * order, Git history, proximity, or an actor's memory — consistent with the
 * ratified cross-authority Log invariant.
 *
 * `bugId` is the record's canonical BUG-NNN identity (from the filename/first
 * heading), preserved on every emitted event; it is NEVER converted into a PL-*
 * identity. `establishesIntake` is always false: the bug corpus does not
 * establish parking-lot original intake.
 *
 * Returns { events, dateErrors, nextOrder }.
 */
export function parseBugLogEvents(content, fileName, bugId, startOrder = 0) {
  const lines = content.split("\n");
  const events = [];
  const dateErrors = [];
  let order = startOrder;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    const headingMatch = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!headingMatch) continue;

    const level = headingMatch[1].length;
    const headingText = headingMatch[2].trim();

    const eventKind = deriveBugEventKind(headingText);
    if (!eventKind) continue; // not a governed bug event form

    const { iso, error, dateText } = parseHeadingEventDate(headingText);
    if (error) {
      dateErrors.push(`${fileName}: "${headingText}" — ${error}`);
      continue;
    }
    if (!iso) {
      // Governed form but no explicit date: not a datable Log event. Do not infer.
      continue;
    }

    events.push({
      plId: null,
      bugId: bugId,
      title: headingText.replace(/`/g, "").trim(),
      eventKind,
      establishesIntake: false,
      eventDateText: dateText,
      eventDateIso: iso,
      state: null,
      headingLevel: level,
      sourceFile: fileName,
      sourceOrder: order++,
    });
  }

  return { events, dateErrors, nextOrder: order };
}

/**
 * Derive the governed EVENT KIND of a record explicitly (never guessed from vague
 * prose). Inputs are the record's heading title and its `**State:**` line.
 *
 * Priority: the state's leading governed word is the strongest explicit signal;
 * heading form ("Reconciliation Completion Record", "... Refinement — ...") is a
 * secondary explicit signal. When neither yields a confident kind, returns
 * "unclassified" rather than guessing.
 *
 * Returns one of: intake | reconciliation | refinement | implementation |
 * remediation | unclassified.
 */
export function deriveEventKind(title, state) {
  const s = (state || "").trim().toUpperCase();
  const leadWord = s.match(/^[A-Z]+/)?.[0] ?? "";
  const t = title || "";
  const isRefinementHeading = /\bRefinement\b/i.test(t);

  // A "... Refinement — ..." heading is refinement work on an EXISTING identity;
  // it is never a new-identity intake, even when its state reads "INTAKE
  // refinement ...". (eventKind is presentation only; intake evidence is derived
  // separately by deriveIntakeEvidence.)
  if (isRefinementHeading) return "refinement";

  // Classification uses ONLY the exact leading state token or the heading form.
  // No substring scan of prose/state (so "V1 NOT IMPLEMENTED — pending" is never
  // read as implementation). Prefer "unclassified" over guessing.
  if (leadWord === "INTAKE") return "intake";
  if (leadWord === "IMPLEMENTED") return "implementation";
  if (leadWord === "REMEDIATED") return "remediation";
  if (leadWord === "RECONCILED") return "reconciliation";

  if (/^Reconciliation Completion Record\b/i.test(t)) return "reconciliation";

  return "unclassified";
}

/**
 * Decide whether a record carries EXPLICIT canonical evidence that it establishes
 * the original intake of its identity — independent of the event kind.
 *
 * Two narrow explicit signals the corpus actually uses:
 *   1. the `**Date:**` line marks the date as intake:  "... , 2026 (intake)";
 *   2. the state line states a new identity was created:
 *        "new canonical identity created", "New canonical identity in the logical
 *        parking lot", "new identity created" (case-insensitive).
 *
 * The word "INTAKE" alone is NOT sufficient — "INTAKE refinement … no new `PL-*`
 * identity created" explicitly does NOT establish original intake. This function
 * therefore never keys on the bare word "INTAKE"; it requires one of the explicit
 * creation/intake signals above.
 *
 * `dateText` is the authored **Date:** text; `state` is the state line (or null).
 */
export function deriveIntakeEvidence(dateText, state) {
  const d = dateText || "";
  // Signal 1: an explicit "(intake)" marker on the date itself.
  if (/\(\s*intake\s*\)/i.test(d)) return true;

  // Signal 2: the state line explicitly states this record CREATED the canonical
  // identity. Two governed phrasings appear in the corpus:
  //   "new canonical identity created …" / "new canonical identity …"
  //   "canonical identity created …"  (e.g. RECONCILED — canonical identity created)
  // The negative case "no new `PL-*` identity created" must NOT match. We first
  // exclude any "no new … identity" statement, then accept an affirmative
  // "canonical identity created"/"new canonical identity".
  const s = state || "";
  const negatesNewIdentity = /\bno\s+new\b[^.;]*\bidentity\b/i.test(s);
  if (!negatesNewIdentity) {
    if (/\bcanonical\s+identity\s+created\b/i.test(s)) return true;
    if (/\bnew(?:ly)?\s+canonical\s+identity\b/i.test(s)) return true;
    if (/\bnew\s+identity\s+created\b/i.test(s)) return true;
  }
  return false;
}

/**
 * Extract explicit governed temporal EVENTS from a single physical parking-lot
 * file — the Log's semantic unit.
 *
 * DEPTH-GENERIC, EXPLICIT-ONLY. An event is any Markdown heading block — at ANY
 * depth 2..6 — that contains its OWN explicit `**Date:**` line, where "its own"
 * means the `**Date:**` appears in the block before the next heading of
 * EQUAL-OR-SHALLOWER depth. This captures top-level `##` records and nested
 * dated records at `###`/`####`/… alike, while NOT treating an undated
 * subsection (### Intake, ### Pipeline state, …) as an event. The rule is the
 * general one — "a temporal field belongs to its nearest enclosing heading, and
 * heading scope ends at the next heading of equal-or-shallower depth" — not a
 * special case for levels 2 and 3.
 *
 * A dated parent and a dated nested child are BOTH emitted; each is one event.
 * Nothing is inferred from order, proximity, Git, or later events. Records with
 * no explicit `**Date:**` produce no event.
 *
 * `startOrder` is the global monotonic capture counter (file order across the
 * whole corpus); each emitted event records its `sourceOrder` from it so the
 * generator can preserve true canonical source order as the same-date tie-break.
 *
 * Returns { events, dateErrors, nextOrder }.
 */
export function parseLogEvents(content, fileName, startOrder = 0) {
  const lines = content.split("\n");
  const events = [];
  const dateErrors = [];
  let order = startOrder;

  // Stack of open heading blocks. A block is finalized (emitted if dated) when a
  // heading of equal-or-shallower depth appears, or at EOF. `order` is captured
  // when the heading is SEEN (source position), not when the block is finalized,
  // so parent-before-child and adjacency follow true source order.
  const stack = [];

  const parseHeading = (headingText) => {
    const idMatch = headingText.match(/`(PL-[A-Z0-9-]+)`/);
    const plId = idMatch ? idMatch[1] : null;
    const title = headingText.replace(/`/g, "").trim();
    return { plId, title };
  };

  const finalize = (block) => {
    if (!block || block.dateText === null) return; // no explicit date → not an event
    const { iso, error } = parseLeadingCalendarDate(block.dateText);
    if (error) {
      dateErrors.push(`${fileName}: "${block.title}" — ${error}`);
      return;
    }
    if (!iso) {
      // Explicit **Date:** present but no recognizable leading calendar date.
      dateErrors.push(`${fileName}: "${block.title}" — **Date:** "${block.dateText}" has no recognizable "Month D, YYYY" calendar date`);
      return;
    }
    events.push({
      plId: block.plId,
      bugId: null,
      title: block.title,
      eventKind: deriveEventKind(block.title, block.state),
      establishesIntake: deriveIntakeEvidence(block.dateText, block.state),
      eventDateText: block.dateText,
      eventDateIso: iso,
      state: block.state,
      headingLevel: block.level,
      sourceFile: fileName,
      sourceOrder: block.order,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const headingMatch = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      // Close every open block at equal-or-shallower depth (nearest-enclosing rule).
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        finalize(stack.pop());
      }
      const { plId, title } = parseHeading(headingMatch[2]);
      stack.push({ level, plId, title, dateText: null, state: null, order: order++ });
      continue;
    }

    if (stack.length === 0) continue;
    const block = stack[stack.length - 1]; // nearest enclosing heading

    const dateMatch = line.match(/^\*\*Date:\*\*\s*(.+?)\s*$/);
    if (dateMatch && block.dateText === null) {
      block.dateText = dateMatch[1].trim();
      continue;
    }

    const stateMatch = line.match(/^\*\*(?:State|Reconciliation state):\*\*\s*(.+?)\s*$/);
    if (stateMatch && block.state === null) {
      block.state = stateMatch[1].trim();
      continue;
    }
  }
  while (stack.length > 0) finalize(stack.pop());

  return { events, dateErrors, nextOrder: order };
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
 * Parse the Coming Soon product-horizon snapshot from docs/roadmap-coming-soon.md.
 *
 * Reads the "## Now", "## Next", and "## Later" sections. Each item is a bullet
 * naming a user-meaningful capability:
 *   - Capability Name — short user-facing description
 *
 * HORIZONS ARE UNORDERED: item order within a horizon carries no priority meaning
 * and is preserved as authored (NOT sorted — sorting would itself imply a
 * governance ordering). No rank, date, status, or percentage fields exist. Nothing
 * is auto-included; empty horizons are the honest default. Never infers items from
 * other authorities. Returns { now, next, later }.
 */
export function parseHorizons(markdown) {
  const lines = stripHtmlComments(markdown).split("\n");
  const horizons = { now: [], next: [], later: [] };
  let current = null; // "now" | "next" | "later" | null

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const h = heading[1].trim().toLowerCase();
      current = h === "now" ? "now" : h === "next" ? "next" : h === "later" ? "later" : null;
      continue;
    }
    if (!current) continue;

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (!bullet) continue;
    const body = bullet[1].trim();
    if (body.length === 0) continue;
    // Skip an italic placeholder line if authored as a bullet (defensive).
    if (/^_.*_$/.test(body)) continue;

    // Split "Capability Name — description". No status/date/rank fields.
    const split = body.match(/^(.*?)\s*[—–-]\s*(.*)$/);
    const name = split ? split[1].trim() : body;
    const description = split ? split[2].trim() : null;

    horizons[current].push({ name, description: description || null });
  }

  return horizons;
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

/** Domain-grounding tags used by the options domain reference. Detected mechanically; never invented. */
const DOMAIN_TAGS = [
  "MECH",
  "THEORY",
  "EMPIRICAL",
  "BROKER",
  "WW-POLICY",
  "UNRESOLVED",
  "HEURISTIC",
];

/**
 * Split an entry's raw lines into prose and Markdown tables.
 *
 * A Markdown table is a run of consecutive lines each starting (after optional
 * whitespace) with "|". The separator row (---|---) is dropped; header and body
 * rows are emitted with verbatim trimmed cells. Non-table lines become prose.
 * This is a structural transformation of canonical content — cells are copied
 * verbatim; nothing is summarized or reworded.
 *
 * Returns { prose, tables: [{ header: string[], rows: string[][] }] }.
 */
export function splitProseAndTables(lines) {
  const tables = [];
  const proseLines = [];
  let i = 0;

  const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparator = (l) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes("-");
  const cells = (l) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (isTableRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const header = cells(line);
      const rows = [];
      i += 2; // skip header + separator
      while (i < lines.length && isTableRow(lines[i]) && !isSeparator(lines[i])) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      tables.push({ header, rows });
      continue;
    }
    proseLines.push(line);
    i += 1;
  }

  return { prose: proseLines.join("\n"), tables };
}

/**
 * Parse the options domain reference (docs/foundations/options-domain-reference.md)
 * into a Part → entry structure for the Roadmap Domain lens.
 *
 * FIDELITY CONSTRAINT (governing): this projects documentation; it never
 * synthesizes a second interpretation. Every emitted string is either canonical
 * text verbatim or a mechanically-sliced excerpt of it, plus the heading and the
 * grounding tags mechanically detected in the entry. No actor-written summaries.
 *
 * Structure:
 *   # PART N — Title            → a Part (also the trailing ## notes/boundary/Fidelity sections)
 *   ## N. / ## N.N / ### ...     → entries within the current Part
 * An entry's `content` is the verbatim body up to `excerptCharLimit`; if longer,
 * it is cut at a paragraph/sentence boundary and `truncated` is set so the UI can
 * point to the canonical source for the remainder. `tags` are the distinct
 * grounding tags found in the entry body.
 *
 * Returns { parts: [{ title, entries: [{ heading, level, content, truncated, tags }] }] }.
 */
export function parseDomainReference(markdown, excerptCharLimit = 600) {
  const lines = markdown.split("\n");
  const parts = [];
  let currentPart = null;
  let currentEntry = null;
  const entryLines = [];

  const flushEntry = () => {
    if (!currentEntry || !currentPart) {
      entryLines.length = 0;
      return;
    }
    const bodyRaw = entryLines.join("\n").trim();
    // Mechanically detect grounding tags actually present in the body.
    const tags = [];
    for (const t of DOMAIN_TAGS) {
      // Match the bracketed tag token, e.g. `[MECH]` (may be inside backticks).
      const re = new RegExp("\\[" + t.replace(/[-]/g, "\\-") + "\\]");
      if (re.test(bodyRaw)) tags.push(t);
    }

    // Separate Markdown tables from prose. Tables are emitted structurally
    // (verbatim header + row cells) so the UI can render a real table rather
    // than raw pipe text; prose is the non-table remainder. Both are canonical —
    // no synthesis, just structural transformation.
    const { prose, tables } = splitProseAndTables(entryLines);

    // Faithful prose content: verbatim up to the limit; if longer, cut at a boundary.
    let content = prose.trim();
    let truncated = false;
    if (content.length > excerptCharLimit) {
      const slice = content.slice(0, excerptCharLimit);
      const para = slice.lastIndexOf("\n\n");
      const sentence = slice.lastIndexOf(". ");
      const space = slice.lastIndexOf(" ");
      const cut = para > 200 ? para : sentence > 200 ? sentence + 1 : space > 0 ? space : slice.length;
      content = slice.slice(0, cut).trim();
      truncated = true;
    }
    currentEntry.content = content;
    currentEntry.truncated = truncated;
    currentEntry.tags = tags;
    currentEntry.tables = tables;
    currentPart.entries.push(currentEntry);
    currentEntry = null;
    entryLines.length = 0;
  };

  const flushPart = () => {
    flushEntry();
    if (currentPart) parts.push(currentPart);
    currentPart = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    // Part boundary: "# PART N — Title".
    const partHeading = line.match(/^#\s+PART\s+\d+\s*[—–-]\s*(.+?)\s*$/i);
    if (partHeading) {
      flushPart();
      currentPart = { title: partHeading[1].trim(), entries: [] };
      continue;
    }

    // Trailing top-level "## " sections after Part 5 (Reconciliation notes,
    // Intentional-boundary note, Fidelity broker-account balance semantics) are
    // grouped under a synthesized-but-labelled "Notes & Boundaries" part using
    // ONLY their own verbatim headings/content.
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);

    if (h2 && !currentPart) {
      // A ## before any PART (e.g. "How to read this reference") — treat as a
      // preface part so nothing is silently dropped.
      flushPart();
      currentPart = { title: "Preface", entries: [] };
    }

    if ((h2 || h3) && currentPart) {
      // If this ## is actually a trailing top-level section after the last PART,
      // start a Notes part the first time we see one.
      if (
        h2 &&
        /^(reconciliation notes|intentional-boundary note|fidelity )/i.test(h2[1].trim()) &&
        currentPart.title !== "Notes & Boundaries"
      ) {
        flushPart();
        currentPart = { title: "Notes & Boundaries", entries: [] };
      }
      flushEntry();
      const heading = (h3 ? h3[1] : h2[1]).trim();
      currentEntry = { heading, level: h3 ? 3 : 2, content: "", truncated: false, tags: [] };
      continue;
    }

    if (currentEntry) entryLines.push(line);
  }

  flushPart();

  // Keep only parts that actually carry entries.
  return { parts: parts.filter((p) => p.entries.length > 0) };
}

/**
 * Parse the canonical bug index from docs/bugs/INDEX.md.
 *
 * The index is the sole defect system-of-record's discovery table:
 *   | BUG | Title | Area | Severity | Status | Record | Provenance |
 * The Record cell is a Markdown link `[record](BUG-NNN-*.md)`; only the canonical
 * record path is captured (no navigation infrastructure). All values are verbatim.
 *
 * FAITHFUL PROJECTION: values are copied as-authored. Severity `Not established`
 * is preserved, never inferred. No ranking/priority/assignee/workflow fields are
 * added. Row order follows the source table. Returns { items }.
 */
export function parseBugIndex(markdown) {
  const lines = markdown.split("\n");
  const items = [];

  const cells = (l) =>
    l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (!/^\s*\|\s*BUG-\d+\s*\|/.test(line)) continue;
    const c = cells(line);
    if (c.length < 7) continue;

    const id = c[0];
    const title = c[1];
    const area = c[2];
    const severity = c[3];
    const status = c[4];
    // Record cell: "[record](BUG-NNN-*.md)" → capture the path only.
    const recordCell = c[5];
    const recordMatch = recordCell.match(/\(([^)]+)\)/);
    const recordFile = recordMatch ? recordMatch[1].trim() : recordCell.replace(/[[\]]/g, "").trim();
    const provenance = c[6];

    items.push({ id, title, area, severity, status, recordFile, provenance });
  }

  return { items };
}

/**
 * Parse a single canonical bug record (docs/bugs/BUG-NNN-*.md) into a faithful
 * structure for the Bugs detail pane.
 *
 * FIDELITY (same rule as Domain): project the record; never synthesize a second
 * interpretation. Emits the record's own `#` title, its metadata bullets, and its
 * `## `/`### ` sections with VERBATIM headings and bodies (long bodies are
 * mechanically boundary-sliced with `truncated`, and embedded Markdown tables are
 * rendered structurally with verbatim cells via splitProseAndTables). No
 * summaries, no inferred fields.
 *
 * Returns { title, sections: [{ heading, level, content, truncated, tables }] }.
 */
export function parseBugRecord(markdown, excerptCharLimit = 900) {
  const lines = markdown.split("\n");
  let title = null;
  const sections = [];
  let current = null;
  const buf = [];

  const flush = () => {
    if (!current) {
      buf.length = 0;
      return;
    }
    const { prose, tables } = splitProseAndTables(buf);
    let content = prose.trim();
    let truncated = false;
    if (content.length > excerptCharLimit) {
      const slice = content.slice(0, excerptCharLimit);
      const para = slice.lastIndexOf("\n\n");
      const sentence = slice.lastIndexOf(". ");
      const space = slice.lastIndexOf(" ");
      const cut = para > 300 ? para : sentence > 300 ? sentence + 1 : space > 0 ? space : slice.length;
      content = slice.slice(0, cut).trim();
      truncated = true;
    }
    current.content = content;
    current.truncated = truncated;
    current.tables = tables;
    sections.push(current);
    current = null;
    buf.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    if (title === null) {
      const t = line.match(/^#\s+(.+?)\s*$/);
      if (t) {
        title = t[1].trim();
        continue;
      }
    }

    const sec = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (sec) {
      flush();
      current = { heading: sec[2].trim(), level: sec[1].length, content: "", truncated: false, tables: [] };
      continue;
    }

    // Metadata bullets before the first section are not part of any section body;
    // the INDEX already carries Status/Severity/Area/Provenance, so they are not
    // re-projected here. Everything else accumulates into the current section.
    if (current) buf.push(line);
  }
  flush();

  return { title, sections };
}