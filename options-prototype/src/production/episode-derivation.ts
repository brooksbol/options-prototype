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
import type { PortfolioSnapshot } from "../write-desk/types";
import type { AssessedTransaction, EconomicComponent, DispositionResult, OptionCloseResult } from "./production-types";

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
  /**
   * Number of contracts for this chapter's event. For opening/resolution/disposition chapters this
   * is the episode's (opening) quantity. For a CLOSE chapter it is the OBSERVED close quantity and
   * may be `null` when the BTC row carried no usable quantity — an unknown executed quantity stays
   * unknown and is NEVER backfilled from the opening quantity (BUG-021 negative specimen).
   */
  contracts: number | null;
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
  /**
   * Backend-authoritative per-disposition interpreted economics. When provided, realized
   * called-away economics (net proceeds, appreciation/erosion, resolution state) are RENDERED
   * from these results — the frontend does not reconstruct them. Optional for compatibility.
   */
  dispositionResults?: DispositionResult[] | null;
  /**
   * Backend-authoritative per-buy-to-close lifecycle-association results (BUG-021). When provided,
   * each close chapter RENDERS matched/residual/excess/status FROM the corresponding result — the
   * frontend does NOT recompute association (ADR-016). Optional for compatibility.
   */
  optionCloseResults?: OptionCloseResult[] | null;
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
  const { activityRows, snapshot, assessedTransactions, dispositionResults, optionCloseResults, targetMonth } = input;

  // 1. Build episode map: OCC symbol → linked events
  const episodeMap = buildEpisodeMap(activityRows, targetMonth);

  // 2. Enrich with in-flight positions from snapshot
  if (snapshot) {
    enrichWithInFlightPositions(episodeMap, snapshot, targetMonth);
  }

  // 3. Economic decomposition from backend assessment.
  //    economicMap remains for non-disposition uses; realized called-away disposition
  //    economics are owned by the backend DispositionResult lookup below.
  const economicMap = buildEconomicMap(assessedTransactions);
  const dispositionLookup = buildDispositionLookup(dispositionResults ?? null);
  // Backend-authoritative BTC lifecycle-association results (BUG-021). The frontend RENDERS these;
  // it does NOT recompute association. A close with no matching authoritative result is presented
  // as unresolved (the backend did not establish it) — never locally re-derived.
  const optionCloseLookup = buildOptionCloseLookup(optionCloseResults ?? null);

  // 4. Generate chapters for all episodes that have events in the target month
  const chapters: EpisodeChapter[] = [];

  for (const [episodeId, episode] of episodeMap) {
    const generated = generateChapters(episode, episodeId, economicMap, dispositionLookup, optionCloseLookup, targetMonth);
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

/** One executed buy-to-close event (preserves per-event identity: date, signed debit, quantity). */
interface CloseEvent {
  row: ActivityRow;
  date: string;
  /** Executed net closing cash (signed; a debit is negative). null when the row carried no amount. */
  debit: number | null;
  /** Executed closed quantity (|quantity|). null when the row carried no usable quantity. */
  quantity: number | null;
}

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

  /**
   * Option-close (buy-to-close) events for this exact contract — ONE ENTRY PER EXECUTED BTC ROW.
   *
   * BUG-021 second amendment (per-event correctness): a BTC is an executed, dated cash event.
   * Multiple closes MUST remain multiple events with their own dates and debits — never collapsed
   * into a single accumulated debit/date, which would move cash/lifecycle across reporting periods
   * or make a later close disappear. Each executed debit is known period option cash regardless of
   * whether a recognized opening (STO) is present; recognized-lifecycle association is judged
   * separately and chronologically (see generateChapters → buildCloseChapter).
   */
  closeEvents: CloseEvent[];

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
            closeEvents: [],
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

      case "buy_to_close": {
        // Buy-to-close: the executed closing debit for this exact contract. Accumulate the
        // AUTHORITATIVE close facts onto the episode (creating a skeleton when there is no
        // recognized opening — an unmatched close is still a real, known cash event whose
        // recognized-lifecycle association is simply unresolved; BUG-021 amendment). We do NOT
        // synthesize an STO to "complete" the accounting. The close is NOT recorded as an
        // expiry/assignment resolveKind — it is an option-close, judged against recognized opened
        // quantity in the chapter (complete / partial / excess / unmatched).
        const preexisting = map.get(episodeId);
        const existing = preexisting ?? createSkeletonEpisode(episodeId, underlying, strike, optionType, expiration);
        if (!preexisting) {
          // A BTC-created skeleton has NO recognized opening — recognized opened quantity is 0
          // (not the skeleton default of 1). This makes an unmatched close read as unresolved
          // rather than silently deterministic.
          existing.contracts = 0;
        }
        // Preserve EVERY BTC as its own dated event (BUG-021 second amendment): never collapse
        // multiple closes into one accumulated debit/date. Quantity is null when unusable so
        // cash-known and quantity-known remain independent facts.
        const rawQty = Math.abs(row.quantity ?? 0);
        existing.closeEvents.push({
          row,
          date: row.date,
          debit: row.amount ?? null,
          quantity: rawQty > 0 ? rawQty : null,
        });
        if (!preexisting) map.set(episodeId, existing);
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
      // Called-away disposition → CALL episode. This is the SAME semantic relationship the backend
      // Production DispositionResult now owns authoritatively (DispositionAssociator, solved
      // globally one-to-one). Under ADR-016 the frontend must NOT independently establish a
      // competing association for it from economic attributes (underlying/date/quantity/strike/
      // price). The prior quantity+strike inference here is therefore removed. The called-away
      // resolution chapter renders realized economics AND its disposition constituent event from
      // the authoritative backend result (via episode.key → DispositionResult.contractActivityKey lookup).
      // (PUT post-assignment discretionary sales — shares_sold_direct — are a DIFFERENT
      //  relationship, not owned by this association, and remain handled below.)
      continue;
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
      ep.closeEvents.some(ce => ce.date.startsWith(monthPrefix)) ||
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
        closeEvents: [],
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
        closeEvents: [],
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
  dispositionLookup: DispositionLookup,
  optionCloseLookup: OptionCloseLookup,
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
    chapters.push(buildResolveChapter(episode, episodeId, economicMap, dispositionLookup));
  }

  // Post-assignment disposition chapter (put assigned, then shares sold)
  if (episode.optionType === "PUT" &&
      episode.resolveKind === "assigned" &&
      episode.dispositionEvent &&
      episode.dispositionEvent.date.startsWith(monthPrefix)) {
    chapters.push(buildDispositionChapter(episode, episodeId));
  }

  // Option-close (buy-to-close) chapters — ONE PER EXECUTED BTC EVENT dated in this month.
  // The backend is the SINGLE authority for recognized-lifecycle association (BUG-021 / ADR-016):
  // each chapter RENDERS matched/residual/excess/status FROM the authoritative OptionCloseResult.
  // The frontend does NOT recompute association here.
  const closeChapters = buildCloseChapters(episode, episodeId, monthPrefix, optionCloseLookup);
  chapters.push(...closeChapters);

  // In-flight state: if this episode was opened this month and hasn't resolved,
  // augment the opening row with in-flight markers (link date, conditional).
  // Episodes opened in prior months that are still in-flight don't get a ledger row —
  // they're visible in the In-Flight Positions table until something happens.
  //
  // BUG-021 scope discipline (Principal, Package 1 / Option A): the opening chapter's
  // lifecycle state is NOT flipped to "retired" merely because a DETERMINISTIC_COMPLETE
  // backend close exists. Whether the opening obligation is CURRENTLY retired (lifecycle
  // retirement) is out of BUG-021 scope and is tracked as a separate defect. The narrow
  // accounting repair renders each BTC close chapter (debit vs premium, explicit status)
  // WITHOUT claiming the opening is now retired. Only a genuine resolution
  // (expiry/assignment) completes the opening here.
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

  // The opening chapter's complete/in-flight lifecycle state comes from a genuine RESOLUTION
  // (expiry/assignment) ONLY. BUG-021 scope discipline (Principal, Package 1 / Option A): the
  // opening is NOT marked complete/retired merely because a DETERMINISTIC_COMPLETE backend close
  // exists — whether the opening obligation is currently retired is lifecycle-retirement behavior
  // tracked as a separate defect, deliberately NOT carried by this narrow accounting repair. The
  // executed BTC close is still fully represented by its own close chapter (debit vs premium,
  // explicit status); it simply does not restate the opening's lifecycle state here.
  const opencomplete = episode.resolveKind != null;

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
    state: opencomplete ? "complete" : "in_flight",
    episodeId,
    confidence: "deterministic",
    constituentEvents: buildConstituentEvents(episode, "open"),
    rawSymbol: episode.key,
    contracts: episode.contracts,
    conditionalLabel: (!opencomplete) ? deriveConditionalLabel(episode) : null,
  };
}

function buildResolveChapter(
  episode: EpisodeRecord,
  episodeId: string,
  _economicMap: Map<string, EconomicComponent[]>,
  dispositionLookup: DispositionLookup
): EpisodeChapter {
  const capitalAmount = episode.strike * 100 * episode.contracts;

  // Authoritative backend disposition association for this episode (exact contractActivityKey lookup).
  // Used for called-away realized economics AND for the disposition constituent event, so the
  // frontend never independently re-derives the called-away sale→episode relationship (ADR-016).
  const disposition = lookupDisposition(dispositionLookup, episode);

  let whatHappened: string;
  let capitalLabel: string | null;
  let productionLabel: string | null = null;
  let productionAmount: number | null = null;
  // The numeric capital amount exposed on the chapter. Defaults to the strike
  // notional for branches where that is the correct quantity (put encumbrance/
  // released, share acquisition cost). The called-away branch overrides this with
  // authoritative net sale proceeds (Issue #11).
  let resolvedCapitalAmount: number | null = capitalAmount;
  // Chapter confidence. A resolution whose authoritative economic quantity cannot be
  // uniquely bound must NOT claim "deterministic" — that would be internally
  // contradictory with an "unavailable" capital label. Downgraded to "partial" below
  // when called-away net sale proceeds cannot be attributed.
  let confidence: EpisodeChapter["confidence"] = "deterministic";

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
      // Called away. Realized disposition economics are OWNED BY THE BACKEND
      // (DispositionResult): net sale proceeds, realized appreciation/erosion, and the
      // economic-resolution state. The frontend RENDERS the authoritative result — it does
      // not correlate raw events with economic components, reconstruct realized cash, or
      // infer basis resolution itself. Strike notional is never presented as realized cash.
      whatHappened = "Called away · shares sold";

      if (disposition && disposition.netSaleProceeds != null) {
        capitalLabel = `$${fmt(disposition.netSaleProceeds)} net sale proceeds`;
        resolvedCapitalAmount = disposition.netSaleProceeds;
      } else {
        // Backend has no attributable proceeds for this disposition — render unresolved.
        capitalLabel = "Net sale proceeds unavailable";
        resolvedCapitalAmount = null;
      }

      // Episode result label from the backend-owned realized economics.
      if (disposition && disposition.realizedAppreciation != null) {
        const total = (episode.openPremium ?? 0) + disposition.realizedAppreciation;
        productionLabel = `+$${fmt(total)} episode`;
        productionAmount = total;
      } else if (disposition && disposition.realizedErosion != null) {
        const net = (episode.openPremium ?? 0) - disposition.realizedErosion;
        productionLabel = net >= 0
          ? `+$${fmt(net)} episode`
          : `−$${fmt(Math.abs(net))} episode`;
        productionAmount = net;
      } else if (episode.openPremium != null) {
        // Share-leg economics unresolved — show only the already-recognized premium.
        productionLabel = `+$${fmt(episode.openPremium)} premium`;
        productionAmount = episode.openPremium;
      }

      // Confidence is RENDERED from the backend-owned disposition economic state.
      // RESOLVED → deterministic; PARTIAL/UNRESOLVED (or no result) → partial.
      confidence = disposition && disposition.state === "RESOLVED" ? "deterministic" : "partial";
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
    capitalAmount: resolvedCapitalAmount,
    linkDate: episode.openDate,
    linkDirection: "opened",
    state: "complete",
    episodeId,
    confidence,
    constituentEvents: buildConstituentEvents(episode, "resolve", disposition),
    rawSymbol: episode.key,
    contracts: episode.contracts,
    conditionalLabel: null,
  };
}

/**
 * Build one option-close (buy-to-close) chapter PER EXECUTED BTC EVENT dated in the target month.
 *
 * SINGLE-AUTHORITY MODEL (BUG-021 third amendment, ADR-016): the backend Production path is the
 * sole authority for recognized-lifecycle association. Each chapter RENDERS matched / residual /
 * excess / status FROM the authoritative OptionCloseResult; the frontend does NOT recompute
 * association from Activity evidence. This eliminates the prior competing frontend/backend
 * resolvers. Each executed close remains its OWN dated chapter (never collapsed); the executed
 * debit and quantity are shown from the close row itself. A close with no matching authoritative
 * result is presented as unresolved (the backend did not establish it).
 */
function buildCloseChapters(
  episode: EpisodeRecord,
  episodeId: string,
  monthPrefix: string,
  optionCloseLookup: OptionCloseLookup,
): EpisodeChapter[] {
  const chapters: EpisodeChapter[] = [];
  for (const ce of episode.closeEvents) {
    if (!ce.date.startsWith(monthPrefix)) continue;
    const result = takeOptionCloseResult(optionCloseLookup, ce);
    chapters.push(buildSingleCloseChapter(episode, episodeId, ce, result));
  }
  return chapters;
}

/**
 * Render a single close chapter FROM the authoritative backend result. No local association math.
 * The executed debit/quantity come from the close row (evidence); matched/residual/excess/status
 * come from the backend result only.
 */
function buildSingleCloseChapter(
  episode: EpisodeRecord,
  episodeId: string,
  ce: CloseEvent,
  result: OptionCloseResult | null,
): EpisodeChapter {
  const typeWord = episode.optionType === "PUT" ? "put" : "call";
  const status = result?.status ?? null;
  const deterministic = status === "DETERMINISTIC_COMPLETE" || status === "DETERMINISTIC_PARTIAL";

  let whatHappened: string;
  let confidence: EpisodeChapter["confidence"];
  if (status === "DETERMINISTIC_COMPLETE") {
    whatHappened = "Closed · obligation retired";
    confidence = "deterministic";
  } else if (status === "DETERMINISTIC_PARTIAL") {
    whatHappened = "Partially closed";
    confidence = "deterministic";
  } else if (status === "OVER_CLOSE") {
    whatHappened = "Closed · over-close (excess unresolved)";
    confidence = "partial";
  } else {
    // UNRESOLVED, or no authoritative result at all → present as unresolved (backend did not
    // establish association). Never locally re-derive it.
    whatHappened = `Closed ${typeWord} · association unresolved`;
    confidence = "unresolved";
  }

  // Production/result: the EXECUTED CLOSING DEBIT is a known per-event cash fact (from the row).
  // Never "opening premium − partial debit" as realized closed-lifecycle P&L.
  let productionLabel: string | null;
  let productionAmount: number | null;
  if (ce.debit != null) {
    const debitMagnitude = Math.abs(ce.debit);
    productionLabel = `−$${fmt(debitMagnitude)} closing debit`;
    productionAmount = -debitMagnitude;
  } else {
    productionLabel = "closing debit unavailable";
    productionAmount = null;
  }

  // Capital: closing removes obligation-specific NOMINAL encumbrance ONLY for a backend-authoritative
  // DETERMINISTIC matched quantity. Never a cash/buying-power release (HOLD-vs-CLOSE V1 discipline).
  // No encumbrance claim under any non-deterministic status.
  let capitalLabel: string | null;
  let capitalAmount: number | null;
  const matchedExact = deterministic && result != null && result.matchedMin === result.matchedMax
    ? result.matchedMin : null;
  if (matchedExact != null && matchedExact > 0 && episode.optionType === "PUT") {
    const encumbranceRemoved = episode.strike * 100 * matchedExact;
    capitalLabel = `$${fmt(encumbranceRemoved)} nominal encumbrance removed`;
    capitalAmount = encumbranceRemoved;
  } else if (matchedExact != null && matchedExact > 0 && episode.optionType === "CALL") {
    capitalLabel = "call obligation removed (shares retained)";
    capitalAmount = null;
  } else {
    capitalLabel = null;
    capitalAmount = null;
  }

  // Annotation: surface residual / excess / unresolved reason FROM the authoritative result.
  const conditionalLabel = buildCloseAnnotation(result);

  // NO singular opening association is asserted for a close (BUG-021 validated invariant).
  //
  // The backend Production authority (OptionCloseResult) establishes close ECONOMICS for the
  // contract SERIES — executed debit, observed/null quantity, recognized outstanding-before range,
  // matched/residual/excess ranges, status — keyed by contractKey. It does NOT establish a
  // particular opening ROW, an opening DATE, or an allocation of the close among multiple opening
  // fills. Economic close certainty is not opening-identity certainty.
  //
  // The prior candidate asserted `linkDate = episode.openDate` (an opening date chosen by STO
  // encounter order) whenever the close was deterministic/over-close. That manufactured an opening
  // identity the backend never established, and it was order-dependent and future-opening-unsafe:
  //   - future opening: a later STO could become the asserted "opening" of an earlier close;
  //   - order dependence: with multiple prior STO fills, reversing input row order changed which
  //     opening date was asserted, while the authoritative backend result was unchanged.
  // Product therefore asserts NO singular opening relationship on a close chapter. Every ESTABLISHED
  // close economic fact (debit, observed/null quantity, matched/residual/excess ranges, status,
  // annotation) is still rendered above from the close row and the backend result — missing opening
  // identity never erases established close economics.
  const linkDate: string | null = null;
  const linkDirection: EpisodeChapter["linkDirection"] = null;

  return {
    date: ce.date,                       // THIS close's own date — never collapsed
    primitive: episode.primitive,
    underlying: episode.underlying,
    strike: episode.strike,
    whatHappened,
    productionLabel,
    productionAmount,
    capitalLabel,
    capitalAmount,
    linkDate,
    linkDirection,
    state: "complete",                   // the close event itself is a completed action this month
    episodeId,
    confidence,
    constituentEvents: buildSingleCloseConstituents(episode, ce),
    rawSymbol: episode.key,
    // A close chapter's quantity is EXACTLY the OBSERVED BTC/close quantity (evidence) — never the
    // episode's recognized-opening quantity:
    //   - unmatched BTC with a known quantity (e.g. 3): the skeleton episode carries contracts=0,
    //     so substituting episode.contracts would erase the known close quantity;
    //   - BTC with an UNAVAILABLE quantity: ce.quantity is null and MUST remain null (unknown) —
    //     substituting the opening quantity (e.g. an STO-2 episode's 2) as the observed closing
    //     quantity is the BUG-021 negative-specimen violation.
    // There is NO fallback to episode.contracts: known BTC quantity stays visible, unknown BTC
    // quantity stays unknown.
    contracts: ce.quantity,
    conditionalLabel,
  };
}

/** Human annotation for a close chapter, derived only from the authoritative result. */
function buildCloseAnnotation(result: OptionCloseResult | null): string | null {
  if (result == null) return "association not established by backend";
  const q = result.closedQuantity;
  switch (result.status) {
    case "DETERMINISTIC_PARTIAL": {
      const residual = result.residualMin === result.residualMax
        ? `${result.residualMin}` : `${result.residualMin}..${result.residualMax}`;
      return q != null ? `closed ${q} · ${residual} still open` : `residual ${residual} still open`;
    }
    case "OVER_CLOSE":
      return q != null
        ? `closed ${q} vs max recognized outstanding ${result.outstandingBeforeMax} · excess ${result.excessUnmatched} unresolved`
        : `excess ${result.excessUnmatched} unresolved`;
    case "DETERMINISTIC_COMPLETE":
      return null;
    default: {
      // UNRESOLVED — surface the recognized-outstanding range when it carries information.
      if (result.outstandingBeforeMin !== result.outstandingBeforeMax) {
        return `recognized outstanding uncertain (${result.outstandingBeforeMin}..${result.outstandingBeforeMax}); association unresolved`;
      }
      return "recognized-lifecycle association unresolved";
    }
  }
}

/**
 * Constituent events for a single close chapter: THIS close's own row only.
 *
 * The close chapter deliberately does NOT include an opening (STO) constituent (BUG-021 validated
 * invariant). The episode's `openEvent` is the STO row selected by encounter order among possibly
 * multiple fills; attaching it here asserted a singular opening→close provenance the backend
 * OptionCloseResult never established (the future-opening / order-dependent failure class — Product
 * previously listed a later or arbitrarily-ordered STO as the close's constituent). The close row
 * itself is the authoritative provenance for the executed close; matched/residual/excess remain on
 * the chapter from the backend result. Provenance for the opening lives on the opening's own chapter.
 */
function buildSingleCloseConstituents(_episode: EpisodeRecord, ce: CloseEvent): ConstituentEvent[] {
  return [{ date: ce.row.date, action: ce.row.action, symbol: ce.row.symbol, amount: ce.row.amount }];
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
    closeEvents: [],
    isInFlight: false,
  };
}

// --- Backend disposition-result lookup (authoritative realized economics) ---
//
// The BACKEND owns the disposition→contract-activity association (DispositionResult.contractActivityKey
// = the OCC contract/activity grouping key). The frontend performs a DIRECT LOOKUP only —
// episode.key === contractActivityKey. It must NOT re-derive the association from economic
// attributes (symbol/date/quantity/strike/price). Establishing the association is backend
// authority, not presentation.

type DispositionLookup = Map<string, DispositionResult>;

function buildDispositionLookup(results: DispositionResult[] | null): DispositionLookup {
  const map = new Map<string, DispositionResult>();
  if (!results) return map;
  for (const r of results) {
    // Only associated results are addressable by the contract-activity key. Unresolved-association
    // results (contractActivityKey null) are intentionally not attachable to any episode.
    if (r.contractActivityKey != null) {
      map.set(r.contractActivityKey.trim(), r);
    }
  }
  return map;
}

/**
 * Direct lookup of the backend-authoritative DispositionResult for an episode.
 * Exact match of the episode's key against the backend contractActivityKey. No heuristic association.
 */
function lookupDisposition(lookup: DispositionLookup, episode: EpisodeRecord): DispositionResult | null {
  return lookup.get(episode.key.trim()) ?? null;
}

// --- Backend-authoritative option-close (BTC) result lookup (BUG-021) ---
//
// The BACKEND owns BTC lifecycle association. The frontend matches each executed close row to its
// authoritative OptionCloseResult by the close's own evidence identity (symbol|date|action|debit|
// quantity) and CONSUMES it (a queue per key) so multiple identical closes on the same date each
// take a distinct result deterministically (both sides preserve CSV/emission order). It must NOT
// recompute matched/residual/excess/status.

interface OptionCloseLookup {
  /** Consumable per-evidence-identity queues (one authoritative result taken per rendered close). */
  byKey: Map<string, OptionCloseResult[]>;
}

function optionCloseKey(symbol: string | null, date: string, action: string,
                        debit: number | null, quantity: number | null): string {
  const sym = (symbol ?? "").trim();
  const d = debit == null ? "NULL" : debit.toFixed(2);
  const q = quantity == null ? "NULL" : String(quantity);
  return `${sym}|${date}|${action}|${d}|${q}`;
}

function buildOptionCloseLookup(results: OptionCloseResult[] | null): OptionCloseLookup {
  const byKey = new Map<string, OptionCloseResult[]>();
  if (!results) return { byKey };
  for (const r of results) {
    const key = optionCloseKey(r.symbol, r.date, r.action, r.executedDebit, r.closedQuantity);
    (byKey.get(key) ?? byKey.set(key, []).get(key)!).push(r);
  }
  return { byKey };
}

/** Consume (take) the next authoritative result matching this close event's evidence identity. */
function takeOptionCloseResult(lookup: OptionCloseLookup, ce: CloseEvent): OptionCloseResult | null {
  const key = optionCloseKey(ce.row.symbol, ce.date, ce.row.action, ce.debit, ce.quantity);
  const bucket = lookup.byKey.get(key);
  if (!bucket || bucket.length === 0) return null;
  return bucket.shift() ?? null;
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

function buildConstituentEvents(
  episode: EpisodeRecord,
  phase: "open" | "resolve",
  authoritativeDisposition?: DispositionResult | null
): ConstituentEvent[] {
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
    // Called-away disposition constituent event comes from the AUTHORITATIVE backend association
    // (never from independent frontend correlation). Only rendered when the backend established a
    // unique association (contractActivityKey present → looked up into authoritativeDisposition) and it
    // carries the sale event's provenance.
    if (authoritativeDisposition && authoritativeDisposition.netSaleProceeds != null) {
      events.push({
        date: authoritativeDisposition.date,
        action: authoritativeDisposition.dispositionAction ?? authoritativeDisposition.kind,
        symbol: authoritativeDisposition.symbol,
        amount: authoritativeDisposition.netSaleProceeds,
      });
    }
    // PUT post-assignment discretionary sale (a DIFFERENT relationship, not the called-away
    // association owned by the backend) still renders from its own evidence event.
    if (episode.dispositionEvent) {
      events.push({ date: episode.dispositionEvent.date, action: episode.dispositionEvent.action, symbol: episode.dispositionEvent.symbol, amount: episode.dispositionEvent.amount });
    }
  }
  return events;
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
