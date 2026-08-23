/**
 * Episode Derivation — PL-PROD-EVENTS V2
 *
 * Derives operator-facing "episodes" from raw ActivityRow[] by correlating
 * events through the OCC option symbol as a natural key.
 *
 * An episode represents one option contract's lifecycle:
 *   - CSP: put sold → put expired / put assigned
 *   - BW:  shares bought + call sold → call expired / called away
 *   - CC:  call sold (on held shares) → call expired / called away
 *
 * Each episode produces chronological "chapter" events that appear in the
 * ledger at their actual dates (not grouped under the opening date).
 *
 * Multi-leg compound cycles (put→assigned→call→called away) are explicitly
 * NOT connected here. Each option contract is one episode. Connecting them
 * into a "full cycle" is PL-PORT-02 lifecycle reconstruction territory.
 *
 * Data sources:
 *   - ActivityRow[] (parsed Fidelity Activity CSV) — events with dates, amounts, parsed options
 *   - PortfolioSnapshot (Option Summary) — in-flight positions with expiration dates
 *   - AssessedTransaction[] (backend) — economic decomposition for resolved events
 */

import type { ActivityRow } from "../csv/fidelity/activityParser";
import type { PortfolioSnapshot, OpenShortPut, OpenShortCall } from "../write-desk/types";
import type { AssessedTransaction, EconomicComponent } from "./production-types";

// --- Public types ---

export type EpisodePrimitive = "CSP" | "BW" | "CC" | "CALL" | "PUT";

export type ChapterKind =
  | "opened"
  | "put_expired"
  | "put_assigned"
  | "call_expired"
  | "called_away"
  | "sold_after_assignment";

export interface EpisodeChapter {
  /** ISO date of this chapter event */
  date: string;
  /** Wheelwright strategy primitive */
  primitive: EpisodePrimitive;
  /** Operator-facing symbol: "EWY" */
  underlying: string;
  /** Strike price */
  strike: number;
  /** What happened — operator language */
  whatHappened: string;
  /** Production/result description. Null when no economic impact this chapter. */
  productionLabel: string | null;
  /** Dollar production amount (positive = income). Null if not applicable. */
  productionAmount: number | null;
  /** Capital effect description. Null when not derivable. */
  capitalLabel: string | null;
  /** Dollar capital amount. Null if not applicable. */
  capitalAmount: number | null;
  /** Link date: ISO date of the connected event (open date for resolutions, expiration for opens). Null if none. */
  linkDate: string | null;
  /** Direction of link: "opened" = references opening, "resolves" = references resolution */
  linkDirection: "opened" | "resolves" | null;
  /** Episode state */
  state: "complete" | "in_flight";
  /** Episode ID for grouping disclosure detail */
  episodeId: string;
  /** Confidence: deterministic unless something couldn't be resolved */
  confidence: "deterministic" | "partial" | "unresolved";

  // --- Disclosure detail (hidden by default) ---
  /** Constituent ActivityRow event types for provenance */
  constituentEvents: ConstituentEvent[];
  /** Raw OCC symbol */
  rawSymbol: string;
  /** Number of contracts */
  contracts: number;
  /** Conditional consequence for in-flight episodes */
  conditionalLabel: string | null;
}

export interface ConstituentEvent {
  date: string;
  action: string;
  symbol: string;
  amount: number | null;
}

// --- Derivation ---

export interface EpisodeDerivationInput {
  activityRows: ActivityRow[];
  snapshot: PortfolioSnapshot | null;
  assessedTransactions: AssessedTransaction[] | null;
  /** Target month as "YYYY-MM" */
  targetMonth: string;
}

/**
 * Derive episode chapters for the target month.
 *
 * Returns a flat array of chapters sorted by date (newest first),
 * ready for chronological display.
 */
export function deriveEpisodeChapters(input: EpisodeDerivationInput): EpisodeChapter[] {
  const { activityRows, snapshot, assessedTransactions, targetMonth } = input;

  // 1. Build episode map: OCC symbol → linked events
  const episodeMap = buildEpisodeMap(activityRows, targetMonth);

  // 2. Enrich with in-flight positions from snapshot
  if (snapshot) {
    enrichWithInFlightPositions(episodeMap, snapshot, targetMonth);
  }

  // 3. Resolve economic decomposition from backend assessment
  const economicMap = buildEconomicMap(assessedTransactions);

  // 4. Generate chapters for all episodes that have events in the target month
  const chapters: EpisodeChapter[] = [];

  for (const [episodeId, episode] of episodeMap) {
    const generated = generateChapters(episode, episodeId, economicMap, targetMonth);
    chapters.push(...generated);
  }

  // 5. Add non-option production events (dividends, money market, treasury)
  const structuralEvents = deriveStructuralEvents(activityRows, targetMonth);
  chapters.push(...structuralEvents);

  // Sort newest first
  chapters.sort((a, b) => b.date.localeCompare(a.date));

  return chapters;
}

// --- Internal types ---

interface EpisodeRecord {
  /** OCC symbol or synthetic key */
  key: string;
  underlying: string;
  strike: number;
  optionType: "PUT" | "CALL";
  expiration: string;
  contracts: number;
  primitive: EpisodePrimitive;

  /** Opening event (STO) */
  openEvent: ActivityRow | null;
  openDate: string | null;
  openPremium: number | null;

  /** Resolution event */
  resolveKind: "expired" | "assigned" | null;
  resolveDate: string | null;

  /** Share acquisition for buy-writes */
  shareEvent: ActivityRow | null;
  shareCost: number | null;

  /** Share disposition for call-away */
  dispositionEvent: ActivityRow | null;
  dispositionProceeds: number | null;

  /** In-flight from snapshot (no resolution in activity) */
  isInFlight: boolean;
}

// --- Episode map building ---

function buildEpisodeMap(rows: ActivityRow[], targetMonth: string): Map<string, EpisodeRecord> {
  const map = new Map<string, EpisodeRecord>();
  const monthPrefix = targetMonth; // "2026-08"

  // Track same-day share purchases for buy-write detection
  const sharePurchasesByDateUnderlying = new Map<string, ActivityRow[]>();

  // First pass: collect share purchases for BW correlation
  for (const row of rows) {
    if (row.eventType === "shares_bought_direct" || row.eventType === "shares_bought_assignment") {
      const underlying = row.option?.underlying ?? extractUnderlying(row.symbol);
      if (underlying) {
        const key = `${row.date}|${underlying}`;
        const existing = sharePurchasesByDateUnderlying.get(key) ?? [];
        existing.push(row);
        sharePurchasesByDateUnderlying.set(key, existing);
      }
    }
  }

  // Second pass: build episodes from option events
  for (const row of rows) {
    if (!row.option) continue;
    const { underlying, strike, type: optionType, expiration } = row.option;
    const occSymbol = row.symbol.trim();
    const episodeId = occSymbol || `${underlying}|${strike}|${optionType}|${expiration}`;

    switch (row.eventType) {
      case "sell_to_open": {
        const existing = map.get(episodeId);
        if (existing) {
          // Accumulate if multiple STO fills for same contract
          existing.openEvent = existing.openEvent ?? row;
          existing.openDate = existing.openDate ?? row.date;
          existing.openPremium = (existing.openPremium ?? 0) + (row.amount ?? 0);
          existing.contracts += Math.abs(row.quantity ?? 0);
        } else {
          const isBuyWrite = optionType === "CALL" &&
            sharePurchasesByDateUnderlying.has(`${row.date}|${underlying}`);

          const episode: EpisodeRecord = {
            key: episodeId,
            underlying,
            strike,
            optionType,
            expiration,
            contracts: Math.abs(row.quantity ?? 0),
            primitive: optionType === "PUT" ? "CSP" :
                       isBuyWrite ? "BW" : "CC",
            openEvent: row,
            openDate: row.date,
            openPremium: row.amount ?? null,
            resolveKind: null,
            resolveDate: null,
            shareEvent: null,
            shareCost: null,
            dispositionEvent: null,
            dispositionProceeds: null,
            isInFlight: false,
          };

          // Attach share purchase for buy-writes
          if (isBuyWrite) {
            const purchases = sharePurchasesByDateUnderlying.get(`${row.date}|${underlying}`);
            if (purchases && purchases.length > 0) {
              episode.shareEvent = purchases[0];
              episode.shareCost = purchases[0].amount != null ? Math.abs(purchases[0].amount) : null;
            }
          }

          map.set(episodeId, episode);
        }
        break;
      }

      case "expired": {
        const existing = map.get(episodeId) ?? createSkeletonEpisode(episodeId, underlying, strike, optionType, expiration);
        existing.resolveKind = "expired";
        existing.resolveDate = row.date;
        if (!map.has(episodeId)) map.set(episodeId, existing);
        break;
      }

      case "assigned": {
        const existing = map.get(episodeId) ?? createSkeletonEpisode(episodeId, underlying, strike, optionType, expiration);
        existing.resolveKind = "assigned";
        existing.resolveDate = row.date;
        if (!map.has(episodeId)) map.set(episodeId, existing);
        break;
      }

      default:
        break;
    }
  }

  // Third pass: link share dispositions to episodes
  for (const row of rows) {
    const underlying = row.option?.underlying ?? extractUnderlying(row.symbol);
    if (!underlying) continue;

    if (row.eventType === "shares_sold_assignment") {
      // Call-away: link to a call episode assigned on the same date
      for (const [, episode] of map) {
        if (episode.underlying === underlying &&
            episode.optionType === "CALL" &&
            episode.resolveKind === "assigned" &&
            episode.resolveDate === row.date) {
          episode.dispositionEvent = row;
          episode.dispositionProceeds = row.amount ?? null;
          break;
        }
      }
    } else if (row.eventType === "shares_bought_assignment") {
      // Put assignment stock purchase: link to the CSP episode for authoritative quantity/cost
      for (const [, episode] of map) {
        if (episode.underlying === underlying &&
            episode.optionType === "PUT" &&
            episode.resolveKind === "assigned" &&
            episode.resolveDate === row.date &&
            !episode.shareEvent) {
          episode.shareEvent = row;
          episode.shareCost = row.amount != null ? Math.abs(row.amount) : null;
          break;
        }
      }
    } else if (row.eventType === "shares_sold_direct") {
      // Discretionary sale after put assignment: link to the CSP episode
      // Criterion: same underlying, put was assigned, sale is on or after assignment date
      for (const [, episode] of map) {
        if (episode.underlying === underlying &&
            episode.optionType === "PUT" &&
            episode.resolveKind === "assigned" &&
            episode.resolveDate != null &&
            row.date >= episode.resolveDate &&
            !episode.dispositionEvent) {
          episode.dispositionEvent = row;
          episode.dispositionProceeds = row.amount ?? null;
          break;
        }
      }
    }
  }

  // Filter: only include episodes with at least one event in the target month
  const filtered = new Map<string, EpisodeRecord>();
  for (const [id, ep] of map) {
    const hasEventInMonth =
      (ep.openDate && ep.openDate.startsWith(monthPrefix)) ||
      (ep.resolveDate && ep.resolveDate.startsWith(monthPrefix)) ||
      (ep.dispositionEvent && ep.dispositionEvent.date.startsWith(monthPrefix));
    if (hasEventInMonth) {
      filtered.set(id, ep);
    }
  }

  return filtered;
}

function enrichWithInFlightPositions(
  map: Map<string, EpisodeRecord>,
  snapshot: PortfolioSnapshot,
  targetMonth: string
): void {
  // Match open puts
  for (const put of snapshot.existingPuts) {
    const occSymbol = put.symbol.trim();
    const existing = map.get(occSymbol);
    if (existing && !existing.resolveKind) {
      existing.isInFlight = true;
    } else if (!existing) {
      // Position opened in prior month — show as in-flight if expiration is this month or later
      const episode: EpisodeRecord = {
        key: occSymbol,
        underlying: put.underlying,
        strike: put.strike,
        optionType: "PUT",
        expiration: put.expiration,
        contracts: put.quantity,
        primitive: "CSP",
        openEvent: null,
        openDate: null,
        openPremium: put.brokerOptionBasis != null ? Math.abs(put.brokerOptionBasis) : null,
        resolveKind: null,
        resolveDate: null,
        shareEvent: null,
        shareCost: null,
        dispositionEvent: null,
        dispositionProceeds: null,
        isInFlight: true,
      };
      // Only include if expiration is in target month or later
      if (episode.expiration >= targetMonth) {
        map.set(occSymbol, episode);
      }
    }
  }

  // Match open calls
  for (const call of snapshot.existingCalls) {
    const occSymbol = call.symbol.trim();
    const existing = map.get(occSymbol);
    if (existing && !existing.resolveKind) {
      existing.isInFlight = true;
    } else if (!existing) {
      const episode: EpisodeRecord = {
        key: occSymbol,
        underlying: call.underlying,
        strike: call.strike,
        optionType: "CALL",
        expiration: call.expiration,
        contracts: call.quantity,
        primitive: call.origin === "buy-write" ? "BW" : "CC",
        openEvent: null,
        openDate: null,
        openPremium: call.brokerOptionBasis != null ? Math.abs(call.brokerOptionBasis) : null,
        resolveKind: null,
        resolveDate: null,
        shareEvent: null,
        shareCost: null,
        dispositionEvent: null,
        dispositionProceeds: null,
        isInFlight: true,
      };
      if (episode.expiration >= targetMonth) {
        map.set(occSymbol, episode);
      }
    }
  }
}

// --- Chapter generation ---

function generateChapters(
  episode: EpisodeRecord,
  episodeId: string,
  economicMap: Map<string, EconomicComponent[]>,
  targetMonth: string
): EpisodeChapter[] {
  const chapters: EpisodeChapter[] = [];
  const monthPrefix = targetMonth;

  // Opening chapter (if opening occurred this month)
  if (episode.openDate && episode.openDate.startsWith(monthPrefix)) {
    chapters.push(buildOpenChapter(episode, episodeId));
  }

  // Resolution chapter (if resolution occurred this month)
  if (episode.resolveDate && episode.resolveDate.startsWith(monthPrefix)) {
    chapters.push(buildResolveChapter(episode, episodeId, economicMap));
  }

  // Post-assignment disposition chapter (put assigned, then shares sold)
  if (episode.optionType === "PUT" &&
      episode.resolveKind === "assigned" &&
      episode.dispositionEvent &&
      episode.dispositionEvent.date.startsWith(monthPrefix)) {
    chapters.push(buildDispositionChapter(episode, episodeId));
  }

  // In-flight state: if this episode was opened this month and hasn't resolved,
  // augment the opening row with in-flight markers (link date, conditional).
  // Episodes opened in prior months that are still in-flight don't get a ledger row —
  // they're visible in the In-Flight Positions table until something happens.
  if (episode.isInFlight && !episode.resolveKind) {
    if (episode.openDate && episode.openDate.startsWith(monthPrefix)) {
      // Opening was this month — augment it with in-flight state
      const openChapter = chapters.find(c => c.date === episode.openDate);
      if (openChapter) {
        openChapter.state = "in_flight";
        openChapter.linkDate = episode.expiration;
        openChapter.linkDirection = "resolves";
        openChapter.conditionalLabel = deriveConditionalLabel(episode);
      }
    }
    // Prior-month opens that are in-flight: no ledger row (In-Flight table covers these)
  }

  return chapters;
}

function buildOpenChapter(episode: EpisodeRecord, episodeId: string): EpisodeChapter {
  const capitalAmount = episode.strike * 100 * episode.contracts;

  let whatHappened: string;
  let capitalLabel: string | null;

  if (episode.primitive === "BW") {
    whatHappened = "Bought + wrote";
    capitalLabel = `$${fmt(episode.shareCost ?? capitalAmount)} deployed`;
  } else if (episode.primitive === "CSP") {
    whatHappened = "Sold put";
    capitalLabel = `$${fmt(capitalAmount)} encumbered`;
  } else {
    // CC
    whatHappened = "Wrote call";
    capitalLabel = null; // Shares already held
  }

  const productionAmount = episode.openPremium;
  let productionLabel: string | null = null;
  if (productionAmount != null && productionAmount > 0) {
    productionLabel = `+$${fmt(productionAmount)} produced`;
    // Add conditional for in-flight BW
    if (episode.primitive === "BW" && episode.isInFlight && episode.shareCost != null) {
      const ifCalledAppreciation = (episode.strike * 100 * episode.contracts) - episode.shareCost;
      if (ifCalledAppreciation > 0) {
        productionLabel += ` · if called +$${fmt(ifCalledAppreciation)}`;
      } else if (ifCalledAppreciation < 0) {
        productionLabel += ` · if called −$${fmt(Math.abs(ifCalledAppreciation))}`;
      }
    }
  }

  return {
    date: episode.openDate!,
    primitive: episode.primitive,
    underlying: episode.underlying,
    strike: episode.strike,
    whatHappened,
    productionLabel,
    productionAmount,
    capitalLabel,
    capitalAmount,
    linkDate: episode.resolveDate ?? episode.expiration,
    linkDirection: "resolves",
    state: episode.resolveKind ? "complete" : "in_flight",
    episodeId,
    confidence: "deterministic",
    constituentEvents: buildConstituentEvents(episode, "open"),
    rawSymbol: episode.key,
    contracts: episode.contracts,
    conditionalLabel: (!episode.resolveKind) ? deriveConditionalLabel(episode) : null,
  };
}

function buildResolveChapter(
  episode: EpisodeRecord,
  episodeId: string,
  economicMap: Map<string, EconomicComponent[]>
): EpisodeChapter {
  const capitalAmount = episode.strike * 100 * episode.contracts;

  let whatHappened: string;
  let capitalLabel: string | null;
  let productionLabel: string | null = null;
  let productionAmount: number | null = null;

  if (episode.optionType === "PUT") {
    if (episode.resolveKind === "expired") {
      whatHappened = "Expired · cash released";
      capitalLabel = `$${fmt(capitalAmount)} released`;
      // Episode result = premium
      if (episode.openPremium != null) {
        productionLabel = `+$${fmt(episode.openPremium)} episode`;
        productionAmount = episode.openPremium;
      }
    } else {
      // Assigned — use authoritative evidence for capital amount
      whatHappened = "Assigned · shares acquired";
      // Prefer actual assignment cost from shareEvent (shares_bought_assignment row)
      const actualAssignmentCost = episode.shareCost ?? capitalAmount;
      capitalLabel = `$${fmt(actualAssignmentCost)} → shares`;
      // Premium was already recognized at open; assignment is form change
      productionLabel = null;
      productionAmount = null;
    }
  } else {
    // CALL
    if (episode.resolveKind === "expired") {
      whatHappened = episode.primitive === "BW"
        ? "Call expired · shares retained"
        : "Call expired · shares free";
      capitalLabel = null; // Shares remain held
      if (episode.openPremium != null) {
        productionLabel = `+$${fmt(episode.openPremium)} episode`;
        productionAmount = episode.openPremium;
      }
    } else {
      // Called away
      whatHappened = episode.primitive === "BW"
        ? "Called away · capital returned"
        : "Called away · shares sold";
      capitalLabel = `$${fmt(capitalAmount)} returned`;

      // Try to get episode result from economic decomposition
      const econComponents = economicMap.get(episode.resolveDate + "|" + episode.underlying);
      const appreciation = econComponents?.find(c => c.source === "REALIZED_APPRECIATION");
      const erosion = econComponents?.find(c => c.type === "CAPITAL_EROSION");

      if (appreciation) {
        const total = (episode.openPremium ?? 0) + appreciation.amount;
        productionLabel = `+$${fmt(total)} episode`;
        productionAmount = total;
      } else if (erosion) {
        const net = (episode.openPremium ?? 0) - erosion.amount;
        productionLabel = net >= 0
          ? `+$${fmt(net)} episode`
          : `−$${fmt(Math.abs(net))} episode`;
        productionAmount = net;
      } else if (episode.openPremium != null) {
        productionLabel = `+$${fmt(episode.openPremium)} premium`;
        productionAmount = episode.openPremium;
      }
    }
  }

  return {
    date: episode.resolveDate!,
    primitive: episode.primitive,
    underlying: episode.underlying,
    strike: episode.strike,
    whatHappened,
    productionLabel,
    productionAmount,
    capitalLabel,
    capitalAmount,
    linkDate: episode.openDate,
    linkDirection: "opened",
    state: "complete",
    episodeId,
    confidence: "deterministic",
    constituentEvents: buildConstituentEvents(episode, "resolve"),
    rawSymbol: episode.key,
    contracts: episode.contracts,
    conditionalLabel: null,
  };
}

/**
 * Build a disposition chapter for a CSP episode where the assigned shares were
 * subsequently sold. This tells the "what ultimately happened" story.
 *
 * The episode net = premium received − capital erosion (if sold below strike)
 * or premium received + appreciation (if sold above strike, though unlikely for
 * a discretionary sale after assignment).
 *
 * IMPORTANT: Derive assignment cost from the disposition evidence (shares sold × strike)
 * rather than from episode.contracts, because the contracts field may have been
 * accumulated from multiple STO fills and the disposition may cover only a partial
 * lot. The disposition's own quantity is authoritative for what was actually sold.
 */
function buildDispositionChapter(episode: EpisodeRecord, episodeId: string): EpisodeChapter {
  const saleProceeds = episode.dispositionProceeds ?? 0;

  // Derive shares disposed from the disposition event's quantity
  const sharesDisposed = episode.dispositionEvent?.quantity != null
    ? Math.abs(episode.dispositionEvent.quantity)
    : episode.contracts * 100;

  // Assignment cost: prefer authoritative evidence from shares_bought_assignment row,
  // fall back to strike × shares if not available
  const assignmentCost = episode.shareCost ?? (episode.strike * sharesDisposed);
  const capitalErosion = assignmentCost - saleProceeds;

  // Prorate premium if only a partial disposition (rare but possible)
  const contractsDisposed = sharesDisposed / 100;
  const proratedPremium = episode.openPremium != null && episode.contracts > 0
    ? (episode.openPremium / episode.contracts) * contractsDisposed
    : 0;

  const episodeNet = proratedPremium - capitalErosion;

  let productionLabel: string;
  if (capitalErosion > 0) {
    // Sold below assignment cost — erosion
    productionLabel = `−$${fmt(capitalErosion)} erosion`;
    if (proratedPremium > 0) {
      productionLabel += ` · episode ${episodeNet >= 0 ? "+" : "−"}$${fmt(Math.abs(episodeNet))} net`;
    }
  } else if (capitalErosion < 0) {
    // Sold above assignment cost — appreciation
    const appreciation = Math.abs(capitalErosion);
    productionLabel = `+$${fmt(appreciation)} appreciation`;
    if (proratedPremium > 0) {
      productionLabel += ` · episode +$${fmt(episodeNet)} net`;
    }
  } else {
    productionLabel = "at basis";
    if (proratedPremium > 0) {
      productionLabel += ` · episode +$${fmt(proratedPremium)} net`;
    }
  }

  return {
    date: episode.dispositionEvent!.date,
    primitive: episode.primitive,
    underlying: episode.underlying,
    strike: episode.strike,
    whatHappened: "Sold after assignment",
    productionLabel,
    productionAmount: episodeNet,
    capitalLabel: `$${fmt(saleProceeds)} returned to cash`,
    capitalAmount: saleProceeds,
    linkDate: episode.openDate ?? episode.resolveDate,
    linkDirection: "opened",
    state: "complete",
    episodeId,
    confidence: "deterministic",
    constituentEvents: [
      ...(episode.openEvent ? [{ date: episode.openEvent.date, action: episode.openEvent.action, symbol: episode.openEvent.symbol, amount: episode.openEvent.amount }] : []),
      ...(episode.dispositionEvent ? [{ date: episode.dispositionEvent.date, action: episode.dispositionEvent.action, symbol: episode.dispositionEvent.symbol, amount: episode.dispositionEvent.amount }] : []),
    ],
    rawSymbol: episode.key,
    contracts: episode.contracts,
    conditionalLabel: null,
  };
}


// --- Structural (non-option) events ---

function deriveStructuralEvents(rows: ActivityRow[], targetMonth: string): EpisodeChapter[] {
  const chapters: EpisodeChapter[] = [];
  const monthPrefix = targetMonth;

  for (const row of rows) {
    if (!row.date.startsWith(monthPrefix)) continue;

    switch (row.eventType) {
      case "dividend": {
        if (row.symbol.trim() === "SPAXX") {
          chapters.push({
            date: row.date,
            primitive: "CSP", // placeholder — structural income
            underlying: "SPAXX",
            strike: 0,
            whatHappened: "Money market",
            productionLabel: row.amount != null ? `+$${fmt(row.amount)}` : null,
            productionAmount: row.amount,
            capitalLabel: null,
            capitalAmount: null,
            linkDate: null,
            linkDirection: null,
            state: "complete",
            episodeId: `spaxx-${row.date}`,
            confidence: "deterministic",
            constituentEvents: [{ date: row.date, action: row.action, symbol: row.symbol, amount: row.amount }],
            rawSymbol: row.symbol,
            contracts: 0,
            conditionalLabel: null,
          });
        } else if (row.amount != null && row.amount > 0) {
          chapters.push({
            date: row.date,
            primitive: "CSP",
            underlying: row.symbol.trim(),
            strike: 0,
            whatHappened: "Distribution",
            productionLabel: `+$${fmt(row.amount)}`,
            productionAmount: row.amount,
            capitalLabel: null,
            capitalAmount: null,
            linkDate: null,
            linkDirection: null,
            state: "complete",
            episodeId: `div-${row.date}-${row.symbol}`,
            confidence: "partial",
            constituentEvents: [{ date: row.date, action: row.action, symbol: row.symbol, amount: row.amount }],
            rawSymbol: row.symbol,
            contracts: 0,
            conditionalLabel: null,
          });
        }
        break;
      }

      case "treasury": {
        if (row.amount != null && row.amount > 0) {
          chapters.push({
            date: row.date,
            primitive: "CSP",
            underlying: "T-Bill",
            strike: 0,
            whatHappened: "Treasury redeemed",
            productionLabel: null, // Discount income requires basis resolution (backend handles)
            productionAmount: null,
            capitalLabel: null,
            capitalAmount: null,
            linkDate: null,
            linkDirection: null,
            state: "complete",
            episodeId: `treasury-${row.date}-${row.symbol}`,
            confidence: "partial",
            constituentEvents: [{ date: row.date, action: row.action, symbol: row.symbol, amount: row.amount }],
            rawSymbol: row.symbol,
            contracts: 0,
            conditionalLabel: null,
          });
        }
        break;
      }

      default:
        break;
    }
  }

  return chapters;
}

// --- Helpers ---

function createSkeletonEpisode(
  key: string, underlying: string, strike: number,
  optionType: "PUT" | "CALL", expiration: string
): EpisodeRecord {
  return {
    key,
    underlying,
    strike,
    optionType,
    expiration,
    contracts: 1,
    primitive: optionType === "PUT" ? "CSP" : "CC",
    openEvent: null,
    openDate: null,
    openPremium: null,
    resolveKind: null,
    resolveDate: null,
    shareEvent: null,
    shareCost: null,
    dispositionEvent: null,
    dispositionProceeds: null,
    isInFlight: false,
  };
}

function buildEconomicMap(transactions: AssessedTransaction[] | null): Map<string, EconomicComponent[]> {
  const map = new Map<string, EconomicComponent[]>();
  if (!transactions) return map;

  for (const tx of transactions) {
    if (tx.role !== "INCLUDED") continue;
    const meaningful = tx.components.filter(
      c => c.type === "PRODUCTION" || c.type === "CAPITAL_EROSION"
    );
    if (meaningful.length > 0) {
      // Key: date + underlying (extracted from symbol)
      const underlying = extractUnderlying(tx.symbol);
      if (underlying) {
        const key = `${tx.date}|${underlying}`;
        const existing = map.get(key) ?? [];
        existing.push(...meaningful);
        map.set(key, existing);
      }
    }
  }

  return map;
}

function extractUnderlying(symbol: string): string {
  const trimmed = symbol.trim();
  // OCC format: -WEAT260821C25 → WEAT
  const match = trimmed.match(/^-?([A-Z]+)\d{6}[CP]/);
  if (match) return match[1];
  // Plain equity symbol
  return trimmed;
}

function deriveConditionalLabel(episode: EpisodeRecord): string | null {
  if (episode.optionType === "PUT") {
    const assignmentCost = episode.strike * 100 * episode.contracts;
    return `if assigned: $${fmt(assignmentCost)} → shares`;
  }
  if (episode.optionType === "CALL" && episode.primitive === "BW" && episode.shareCost != null) {
    const callAwayProceeds = episode.strike * 100 * episode.contracts;
    const appreciation = callAwayProceeds - episode.shareCost;
    if (appreciation > 0) {
      return `if called: +$${fmt(appreciation)} appreciation`;
    } else if (appreciation < 0) {
      return `if called: −$${fmt(Math.abs(appreciation))} erosion`;
    }
    return "if called: at basis";
  }
  if (episode.optionType === "CALL") {
    return "if called: shares sold at strike";
  }
  return null;
}

function buildConstituentEvents(episode: EpisodeRecord, phase: "open" | "resolve"): ConstituentEvent[] {
  const events: ConstituentEvent[] = [];
  if (phase === "open" || phase === "resolve") {
    if (episode.openEvent) {
      events.push({ date: episode.openEvent.date, action: episode.openEvent.action, symbol: episode.openEvent.symbol, amount: episode.openEvent.amount });
    }
    if (episode.shareEvent) {
      events.push({ date: episode.shareEvent.date, action: episode.shareEvent.action, symbol: episode.shareEvent.symbol, amount: episode.shareEvent.amount });
    }
  }
  if (phase === "resolve") {
    if (episode.dispositionEvent) {
      events.push({ date: episode.dispositionEvent.date, action: episode.dispositionEvent.action, symbol: episode.dispositionEvent.symbol, amount: episode.dispositionEvent.amount });
    }
  }
  return events;
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
