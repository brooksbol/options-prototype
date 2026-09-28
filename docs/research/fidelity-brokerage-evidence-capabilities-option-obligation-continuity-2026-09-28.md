# Fidelity Brokerage Evidence Capabilities: Can Cross-Observation Continuity of an Option Obligation Be Established?

**Investigation date:** 2026-09-28
**Question:** Does Fidelity provide any evidence source realistically obtainable by a third-party portfolio-analysis application that contains enough authoritative information to establish unique continuity or exhaustion of a bounded option obligation across observations?
**Method:** Clean-room, read-only web investigation. Primary sources (Fidelity documentation, provider API docs) preferred; secondary/community sources labeled and never treated as authoritative. Every factual claim below is tagged **[fact]** (documented by a cited source) or **[inference]** (analyst conclusion). This is an evidence-capability investigation only; no product or implementation recommendations.

---

## 1. Executive finding

**No.** Across every Fidelity evidence source a third-party portfolio-analysis application can realistically obtain — retail CSV exports, order-status/confirmation identifiers, aggregator APIs (Plaid, Yodlee, SnapTrade, Akoya, Finicity), OFX/Quicken channels, and statements/confirmations/tax records — no mechanism provides a durable, documented identity for an individual open option obligation, and no mechanism provides a complete, ordered, reconcilable lifecycle event stream with documented guarantees.

The concrete consequence: the two histories

- **A:** sell-to-open 1× series S → remains open → later position 1× S, and
- **B:** sell-to-open 1× series S → buy-to-close → sell-to-open an identical series S → later position 1× S

are indistinguishable on Fidelity positions data by construction (net quantity 1 in both), and indistinguishable on every other obtainable mechanism once the listed gaps are accounted for: missing identifiers, date-only granularity on same-day close/reopen, undocumented ordering, undocumented correction linkage, undocumented history windows, and no completeness proof. The strongest available mechanisms (Yodlee's transaction IDs + deletion flags; SnapTrade's option terminal-event types) support only *best-effort reconstruction conditional on an unprovable completeness assumption* — an absence-of-visible-events claim, not a continuity proof.

**Verdict: CURRENTLY ACCESSIBLE EVIDENCE CANNOT ESTABLISH CROSS-OBSERVATION CONTINUITY** (full verdict statement in §12).

---

## 2. Evidence sources investigated

| # | Source | Access class | Documentation basis |
|---|--------|--------------|---------------------|
| 1 | Fidelity Positions page CSV export | Retail customer download | Secondary (community parser, positions guide); Fidelity publishes no schema |
| 2 | Fidelity Activity & Orders CSV export | Retail customer download | Secondary (community parser of current files); export path confirmed via community docs |
| 3 | Fidelity Order Status / order confirmations (web + mobile) | Retail customer UI | Primary (Fidelity glossary, trading help) |
| 4 | Fidelity trade confirmations (Statements/Documents) | Retail customer download/document | Primary (Fidelity trading help, clearing/custody guides) |
| 5 | Fidelity monthly/quarterly statements | Retail customer document | Primary (clearing/custody guides: 10-year online retention) |
| 6 | Fidelity tax records (1099-B, instructions, corrected forms) | Retail customer document | Primary (Fidelity 1099-B instructions; 7-year online retention) |
| 7 | Active Trader Pro exports | Retail desktop app | Primary (official ATP user guide: Excel/CSV export) |
| 8 | Quicken OFX Direct Connect / EWC+ | Third-party desktop channel | Secondary (Quicken community, 2023–2025); present status unconfirmed |
| 9 | Fidelity Access (partner data-sharing program) | Partner/aggregator | Primary (Fidelity newsroom 2024-09-13; Mastercard/Finicity 2018 announcement) |
| 10 | Akoya (FDX open-banking API; Fidelity's consumer migration target) | Aggregator/network | Primary (Akoya FAQ, factsheet, Morningstar enterprise migration notice); developer reference inaccessible |
| 11 | Plaid Investments API | Aggregator | Primary (Plaid investments docs — holdings/securities only accessible) |
| 12 | Yodlee / Envestnet (transactions, holdings, data extracts) | Aggregator | Primary (Yodlee developer data-model + data-extracts docs) |
| 13 | SnapTrade (orders, activities, account data) | Aggregator | Primary (SnapTrade docs + SDK reference) |
| 14 | Finicity / Mastercard Open Banking | Aggregator | Gap — no accessible authoritative docs |

---

## 3. Fidelity evidence-access map

The investigation distinguished seven access tiers. What each tier actually yields for the continuity question:

**Tier 1 — Information Fidelity possesses internally.** Fidelity's back office necessarily knows which clearing records correspond to which customer executions (it issues confirmations, matches tax lots, processes assignments). **[fact]** This is evidenced by the existence of per-order confirmation numbers, 1099-B lot matching, and corrected documents. **[inference]** None of this internal identity machinery is documented as exposed.

**Tier 2 — Information shown to the retail customer in the UI.** Order Status shows per-order Order Numbers; Activity/History shows transactions with dates, quantities, prices, descriptions; Positions shows aggregate holdings by series. **[fact]** Fidelity's glossary documents Order Number / Order Confirmation Number as unique per *order* (fidelity.com help). **[inference]** UI-visible data is aggregate-by-series for positions and event-listed for activity; no obligation-level identity is displayed.

**Tier 3 — Information downloadable by the customer.** Activity CSV: 13 columns, **no order number, confirmation number, execution ID, or transaction ID** **[fact, via current-file parser: columns are Run Date, Action, Symbol, Description, Type, Price, Quantity, Commission, Fees, Accrued Interest, Amount, Cash Balance, Settlement Date]**. Positions CSV: per-series aggregates (Account, Symbol, Description, Quantity, Last Price, Current Value, Gain/Loss, Cost Basis Per Share) **[fact, secondary guide]**. ATP: manual Excel/CSV export of grids **[fact, official ATP user guide]**. **[inference]** Downloads are snapshots/lists with no identifiers and date-level (not timestamp) granularity in the observed schema.

**Tier 4 — Official Fidelity API / supported integration.** **[fact]** No public self-service retail brokerage API exists. Programmatic access runs through Fidelity Access, a partner/aggregator data-sharing program (Finicity first partner, 2018); Fidelity began eliminating screen scraping in late 2023, with "nearly 100% of consumer-directed data sharing" via Fidelity APIs by Sept 2024 (Fidelity newsroom). Consumer connections migrated to the Akoya FDX API on 2023-08-23 (Morningstar enterprise notice). Akoya production access requires onboarding, security screening, and a signed agreement (Akoya FAQ). **[inference]** There is no documented direct interface an arbitrary independent app can self-serve; the realistic path is *through* an aggregator partner.

**Tier 5 — Third-party aggregation providers.** Yodlee, Plaid, SnapTrade, Akoya, Finicity all operate in this space with Fidelity connectivity of varying documentation quality (see §7). None documents an obligation-level identifier or a completeness guarantee.

**Tier 6 — Realistically ingestible by an independent portfolio-analysis application.** Manual CSV downloads (user-mediated, no identifiers, date granularity); aggregator APIs via a commercial relationship (Yodlee/SnapTrade/Plaid/Akoya — best documented: Yodlee dedup semantics, SnapTrade option event types); OFX Direct Connect (desktop personal-finance channel, not an app API; current status unconfirmed). Screen scraping is being eliminated by Fidelity and is not a durable path **[fact, Fidelity newsroom]**.

**Tier 7 — Semantics documented strongly enough to support an identity/continuity claim.** Only one identifier class clears this bar, and it is the wrong scope: the per-order Order Number / Order Confirmation Number, documented as unique per order — not per obligation, not per fill, not persistent across a position's life.

---

## 4. Identifier/semantics analysis

**Order Number / Order Confirmation Number (Fidelity, primary source).** **[fact]** Fidelity's glossary: "Order Confirmation Number — the unique number used to identify a trade order," shown on the confirmation screen and printed on the executed-order confirmation; "Order Number — the unique number Fidelity assigned to identify an order." **[inference]** These are *order-scoped*. They distinguish the STO order from the BTC order from the second STO order in History B — but only while order history is available (retention window undocumented), and they establish nothing about whether a later-held short contract is the same economic obligation: listed options are fungible, positions aggregate by series, and Fidelity documents no linkage from an execution to a continuing obligation.

**Per-fill / execution IDs.** **[explicit silence]** No Fidelity source documents per-fill or per-execution identifiers exposed to the customer in any obtainable form.

**Transaction/reference IDs in Activity & Orders.** **[fact]** The observed 13-column Activity CSV contains no ID column of any kind; a community converter synthesizes IDs from date + row sequence precisely because Fidelity supplies none.

**Option series symbols.** **[fact, secondary]** Fidelity encodes options in compact symbols (e.g., `-AAPL250620C200`: underlying + YYMMDD + C/P + strike). This is *series geometry* — it identifies the contract specification, not an occurrence. Two openings of the identical series are symbol-identical by definition. **[inference]** OCC-style symbols must not be equated with occurrence identity.

**Tax lots (1099-B, YTD gain/loss).** **[fact]** Fidelity's 1099-B instructions document option/short-sale tax-lot matching (dates acquired/disposed, cost basis adjustments, option-premium incorporation on exercise). **[inference]** Tax-lot pairing is a *reporting convention* for closed positions, not a durable identity for an open obligation; it does not survive as an obligation identifier, and short-option legs' lot treatment is a tax artifact, not an economic-identity claim. Plaid exposes `tax_lots` with `institution_lot_id` on holdings **[fact, Plaid docs]**, but whether Fidelity supplies lots for short-option legs and what lifetime semantics those IDs carry is unestablished.

**Yodlee transaction IDs.** **[fact, Yodlee docs]** `transactionId` is unique per aggregated account (id + container unique); `sourceId` is "the provider site assigned a unique ID to the transaction"; `isDeleted` flags mark deleted records; pending transactions are deleted-and-recreated during updates with both rows supplied. **[inference]** This is the strongest documented *dedup* story, but the IDs identify provider-observed transaction rows, not economic obligations, and `type` is categorization-level — not an open/close flag.

**SnapTrade order/activity IDs.** **[explicit silence]** Exact ID semantics not verified from accessible docs. Activities carry documented *event types* including `OPTIONEXPIRATION`, `OPTIONASSIGNMENT`, `OPTIONEXERCISE` **[fact, SnapTrade SDK reference]** — the richest option-lifecycle vocabulary found — but no obligation identifier.

**Plaid `security_id` / `investment_transaction_id`.** **[fact]** `security_id` identifies the instrument (with `option_contract` metadata: call/put, expiry, strike, underlying). **[inference]** Instrument-level, not occurrence-level. Transaction-subtype schema for options was not accessible (gap).

**Bottom line on identity:** no source — Fidelity's or any provider's — documents anything equivalent to a durable broker-defined identity for an open option obligation or position occurrence, with defined scope, lifetime, and behavior under partial closes, additions, assignment/exercise, full close, reopen, corrections, or corporate-action adjustments.

---

## 5. Lifecycle-completeness analysis

For an event history to support a continuity claim, the application must be able to establish that *no relevant event is missing*. Findings per completeness dimension:

- **History windows.** Mobile Activity History defaults to 30 days with a 2,000-transaction cap **[fact, Fidelity clearing/custody guide]**; homepage "Recent Transactions" shows 5 most recent within 90 days **[fact]**; CSV exports offer selectable periods (e.g., "Past 90 days," custom ranges) per community documentation — but Fidelity publishes no authoritative retention window for online activity history or for exports. One forum anecdote claims 24 months — not authoritative. SnapTrade: orders "a few months at most"; activities "often years, sometimes inception" **[fact, SnapTrade docs]**. Statements: 120 months; tax forms: 7 years **[fact, Fidelity guides]**. **[inference]** No single obtainable source documents a guaranteed, continuous window covering an arbitrary T1→T2 span.
- **Pagination.** SnapTrade documents page size / max 1,000 for activities **[fact]**. Fidelity CSV row limits and pagination: undocumented. Yodlee warns against >60-minute gaps for user-data pulls and >7-day windows for data-extract events **[fact]** — operational constraints, not completeness proofs.
- **Export truncation.** Undocumented for Fidelity exports.
- **Delayed posting / pending vs settled.** Fidelity CSV observed schema has Run Date and Settlement Date but no posted/pending flag **[fact, via parser]**; pending-vs-settled treatment undocumented. Yodlee documents pending/posted status and pending-row deletion/recreation **[fact]** — at its layer only.
- **Corrections.** **[explicit silence]** No Fidelity or provider source documents how corrected trade confirmations reference originals in machine-readable form. Yodlee's `isDeleted` flags are the only documented correction-handling mechanism, at the aggregator layer.
- **Ordering guarantees.** None documented anywhere. The Fidelity Activity CSV has dates, not timestamps **[fact, via parser]** — same-day close-then-reopen ordering is unrecoverable from it. SnapTrade activities "may have date only (no timestamp)" and refresh daily **[fact]**; its orders are intraday-granular but shallow. Yodlee has `transactionDateTime` but availability "depends on the provider site" **[fact]**.
- **Transaction identifiers / deduplication across overlapping retrievals.** Absent in Fidelity's own exports (no IDs at all); Yodlee documents unique IDs + deletion flags (strongest); SnapTrade/Plaid/Akoya/Finicity ID semantics unverified or undocumented.
- **"Know nothing is missing."** No mechanism exposes a sequence token, watermark, or completeness proof. **[inference]** This is the binding failure: even a perfect event list is only as good as the unprovable assumption that the list is complete.

---

## 6. Adversarial history tests

For each mechanism, the test histories: **A** = STO 1× S, remains open; **B** = STO 1× S → BTC → STO identical S. Variants: 2→1 quantity change, partial close, same-day close/reopen, assignment, exercise, expiration, corrections.

| Mechanism | A vs B (1× continuous vs churn) | 2→1: which occurrence survived? | Same-day close+reopen | Assignment / exercise / expiration | Corrections | Verdict |
|---|---|---|---|---|---|---|
| Fidelity Positions CSV / holdings snapshots | **Indistinguishable** — net qty 1 both cases, aggregate by series, no IDs | **Indistinguishable** — net qty 1; no occurrence linkage | N/A (snapshot) | Position disappears; disappearance is consistent with close, assignment, exercise, expiration, or transfer | N/A | Fails by construction |
| Fidelity Activity CSV (13 cols, no IDs, date-level) | Distinguishable **only if** every event present and dates order correctly — no guarantee of either | Row counts differ (2 rows vs 3) **only under completeness**; "which survived" unanswerable — rows carry no lot linkage | **Fails** — no timestamps; BTC-then-STO vs STO-then-BTC on the same day are order-ambiguous | `Action`/`Description`/`Type` columns exist but Fidelity documents no option-event encoding; codes unverified | No documented correction/reversal semantics; a rebilled trade may appear as an independent row | Not reconcilable with guarantees |
| Fidelity Order Status + confirmations | Order Numbers distinguish the three *orders* while history retained — but nothing links fills to a continuing obligation | Order-level quantities visible while retained; no obligation linkage | Granular while retained | Execution confirmations delivered per event; terminal-event encoding undocumented | Corrected-confirmation linkage undocumented | Distinguishes orders, not obligations; retention undocumented |
| Yodlee | Unique IDs + `isDeleted` + pending/posted support reconstruction **conditional on completeness**; but `type` is categorization-level, no STO/BTC flag documented, no obligation ID | Rows inferable; occurrence identity not established | Possible only if Fidelity populates `transactionDateTime` — undocumented | Option-event encoding in descriptions undocumented; holdings carry expiry/optionType | **Strongest documented**: `isDeleted` + pending delete-recreate | Best dedup story; still no obligation ID or open/close semantics |
| SnapTrade | Activities + orders reconstruct sequence **conditionally**; `OPTIONEXPIRATION`/`OPTIONASSIGNMENT`/`OPTIONEXERCISE` types document terminal events; no obligation ID; `BUY`/`SELL` may not encode open/close | Inferable from units while history covers period | **Fails** — activities may be date-only, daily refresh; orders granular but only a few months | **Best coverage** of terminal events | Not documented | Best event-type coverage; ordering + completeness not guaranteed |
| Plaid | Unverifiable from accessible docs (transaction schema gap) | Unverifiable | Unverifiable | Unverifiable | Unverifiable | Cannot evaluate — gap |
| Akoya / FDX | Unverifiable — developer reference inaccessible | — | — | — | — | Cannot evaluate — gap |
| Finicity | Unverifiable — no accessible docs | — | — | — | — | Cannot evaluate — gap |
| OFX Direct Connect / Quicken | Potentially detailed per community reports; current availability and field/ID semantics unconfirmed from authoritative sources | — | — | — | — | Cannot evaluate — gap |
| Statements / 1099-B | Archival proof that trades executed (10-year retention), but monthly granularity and document orientation cannot reconstruct obligation continuity | Tax lots reflect reporting conventions, not obligation identity | Monthly statements — no intraday ordering | Short-sale/option-premium matching documented for tax purposes only | Corrected tax forms issued; linkage is document-based | Archival evidence, not a reconcilable event stream |

**Disappearance/reappearance:** in every snapshot-based mechanism, a position that vanishes and reappears is consistent with (i) close + reopen, (ii) temporary feed/aggregation artifact, (iii) transfer, or (iv) correction — no mechanism documents a way to discriminate these.

**Account transfer (ACATS):** positions transfer; transaction history does not cleanly follow the position to the receiving account's obtainable feeds — noted as an additional break in any cross-observation chain (documentation on Fidelity's specific handling not found; treated as uncertainty, not fact).

**Corporate-action-adjusted contracts:** adjusted OCC symbols create a *new series identifier* for what is economically the continuing obligation — the one case where even series geometry breaks. No Fidelity documentation found on how adjusted contracts are represented in exports/feeds; uncertainty noted.

---

## 7. Third-party-access analysis

Realistic read-only paths for an independent portfolio-analysis app, focused strictly on whether the continuity proposition can be established:

- **Fidelity Access / Akoya.** **[fact]** This is Fidelity's sanctioned data-sharing path (tokenized, credential-free, customer-consented; screen scraping being eliminated). Akoya exposes balances, transactions, investment details, and statements over FDX. **[inference]** It is the *durable* access path, but field/identifier coverage for Fidelity options data over Akoya is publicly unverifiable (developer reference inaccessible), and production requires onboarding/screening/agreement — it is a partner channel, not self-service. No evidence it carries obligation-level identifiers or completeness guarantees.
- **Yodlee.** Strongest documented transaction dedup semantics (unique IDs, deletion flags, pending/posted). **[inference]** Best available foundation for *event-row* reconciliation, but option open/close semantics, Fidelity connectivity method, and retention window are undocumented; no obligation ID.
- **SnapTrade.** Richest option-lifecycle event vocabulary (explicit expiration/assignment/exercise types) plus intraday-granular orders. **[inference]** Best available foundation for *lifecycle-event* reconstruction, but date-only activities, shallow order history, and source-dependent completeness with no documented guarantee defeat the continuity proof; official Fidelity support status unverified.
- **Plaid.** Holdings with instrument-level option metadata and tax lots are documented; the investment-transaction layer (subtypes, IDs, history, Fidelity linkage) could not be verified from accessible docs. Cannot be evaluated for this question — gap, not a negative.
- **Finicity.** First Fidelity Access partner (2018) but no accessible authoritative technical documentation. Cannot be evaluated — gap.
- **OFX Direct Connect (Quicken).** Community evidence of detailed investment transactions, but it is a desktop personal-finance channel, not an interface an independent app can consume; present-day availability unconfirmed from official sources.
- **Screen scraping.** Fidelity is eliminating it (newsroom, 2024); not a durable or sanctioned path. UI-visible data additionally lacks identifiers.

**Net assessment:** the realistic paths are aggregator APIs (Yodlee, SnapTrade, Plaid, Akoya) under commercial/partnership terms, or user-mediated CSV downloads. None exposes a documented obligation identifier or a completeness-guaranteed event stream.

---

## 8. Maximum proposition that can actually be proven

From currently accessible evidence, the strongest defensible claims are:

1. **Point-in-time net exposure:** "At observation time T, account A held net quantity N (long/short) in option series S." Provable from positions snapshots / holdings endpoints. This is robust — it is what the data natively represents.
2. **Best-effort intervening-event visibility (conditional):** "Within provider P's available history window, and *assuming no missing, delayed, or mis-ordered events*, the following series-S events are visible between T1 and T2: …" — supported by Yodlee transaction rows or SnapTrade activities/orders. The italicized assumption is unprovable from any documented source; the claim is therefore an *absence-of-visible-events* statement, not a continuity proof.
3. **Order distinctness (narrow window):** "The opening execution and a later closing/reopening execution were distinct orders" — provable from Fidelity Order Numbers while order history is retained. Establishes order distinctness, not obligation continuity or exhaustion.
4. **Archival occurrence:** "These trades in series S executed on these dates" — provable from statements/confirmations/1099-B within their retention windows (10/7 years). Delayed, document-oriented; cannot establish what the open obligation at T2 *is*.

What even the best-effort stack (SnapTrade events + Yodlee dedup + statements as audit anchor) yields is: **a reconstruction that is consistent with continuity, not a proof of it.** Consistency is not identity.

---

## 9. What cannot be proven

From currently accessible Fidelity evidence, a third-party application cannot authoritatively establish:

- Whether the short obligation in series S at T2 is the *same economic obligation* observed at T1 (the A-vs-B test).
- After a 2→1 quantity change, *which* occurrence survived; FIFO/LIFO/tax-lot conventions are reporting artifacts, not obligation identity.
- Whether a same-day buy-to-close followed by sell-to-open (or the reverse) occurred, in which order.
- Whether a position's temporary disappearance from a feed was a close, an assignment/exercise/expiration, a transfer, a correction, or a feed artifact.
- Whether a correction or rebill modified, replaced, or duplicated an earlier event (no documented linkage in machine-readable Fidelity sources).
- That *no* relevant event is missing between observations (no completeness proof exists in any mechanism).
- Obligation identity across corporate-action-adjusted contract symbols.
- Obligation continuity across account transfers.
- Any of the above for observations outside the (variously undocumented) history windows of the chosen mechanism.

---

## 10. Smallest missing evidence capability

If currently accessible evidence cannot prove continuity, the minimal addition that would change the answer is **one** of the following (hypotheses, not assumed answers):

**(a) A durable, broker-defined obligation/position-occurrence identifier with documented lifecycle semantics**, exposed through a realistically obtainable interface (aggregator API or documented export). "Documented lifecycle semantics" means Fidelity (or the provider, with Fidelity's authority) specifies: scope of uniqueness (per account? per series? globally?), lifetime (created at open, retired at full close/assignment/exercise/expiration), behavior under partial closes and additions (does the ID persist, split, or version?), behavior on identical-series reopen after full close (new ID — this is the property that decides A vs B), behavior under corrections/rebills, and behavior under corporate-action adjustments. A bare unexplained ID column would not suffice — undocumented identifiers cannot support an identity claim (per the investigation's own standard).

**(b) A complete, ordered, reconcilable lifecycle event stream with documented guarantees**: total ordering of events (intraday timestamps sufficient to order same-day close/reopen), stable per-event transaction IDs, documented correction/reversal linkage to original events, a documented retention/history window, and a completeness proof — e.g., a sequence watermark or reconciliation token that lets the application detect a missing event rather than assume none exists. With (b), continuity becomes *derivable* (unbroken chain of custody from open to T2 with no intervening terminal event) even without (a).

Either one is sufficient; neither exists in documented, obtainable form today. Note that (b) without (a) still requires the application to define "same obligation" as "the unbroken event chain" — a definitional step the evidence would then support, rather than one it currently begs.

---

## 11. Source-quality and uncertainty notes

- **Primary sources used:** Fidelity newsroom (data-sharing policy), Fidelity glossary and trading help (order identifiers), Fidelity clearing/custody guides (statement/confirmation retention, mobile history limits), official ATP user guide (export capability), Fidelity 1099-B instructions (tax-lot matching), Akoya FAQ/factsheet, Plaid investments docs, Yodlee developer data-model and data-extracts docs, SnapTrade docs and SDK reference, Mastercard/Finicity announcement, Morningstar enterprise migration notice.
- **Secondary/community sources used as leads only:** ofxstatement-fidelity CSV parser (13-column schema, absence of IDs — treated as observed fact about current files, not Fidelity documentation), positions-export guide, compact option-symbol examples, Quicken community threads, Bogleheads anecdotes. None treated as authoritative; consequential claims (history windows, correction semantics) that rest only on these are flagged as gaps.
- **Explicit gaps (10):** Plaid investment-transaction schema/subtypes/history/Fidelity linkage; Finicity technical documentation; Akoya developer reference and Fidelity field coverage; Fidelity CSV headers/row limits/retention/correction semantics/option action codes; corrected-confirmation machine-readable linkage; order-status retention window; Quicken Direct Connect present-day status; SnapTrade's official Fidelity support status and ID semantics; Yodlee's Fidelity connectivity method, retention window, and option type values; the behind-login YTD tax-activity view (unofficial).
- **Read method:** signed-out index/page-fetch reads conducted 2026-09-28; no authenticated Fidelity access, so behind-login behavior (exact current CSV headers, order-status retention, activity codes) could not be directly verified. Findings that depend on behind-login behavior are marked accordingly.
- **Inference boundary:** the verdict is an inference from documented absences (no documented obligation ID, no documented completeness guarantee, no documented ordering/correction semantics). It is falsifiable: production of a single documented, obtainable mechanism meeting (a) or (b) in §10 overturns it.

---

## 12. Sources with direct links

**Fidelity (primary)**
- Data-sharing / scraping-elimination policy (newsroom, 2024-09-13): http://newsroom.fidelity.com/pressreleases/update-on-fidelity-s-secure-data-sharing-efforts/s/7a30c2e4-f070-4396-b04c-b773678d59f9
- Glossary — Order Number / Order Confirmation Number: https://www.fidelity.com/webcontent/ap002390-mlo-content/20.04/help/help_definition_o.shtml
- Trading help — confirmation page and execution confirmation: https://www.fidelity.com/webcontent/ap002390-mlo-content/20.01/help/learn_trading_stocks.shtml
- Help — confirmation contents (specific shares): https://www.fidelity.com/webxpress/help/topics/help_task_place_a_sell_specific_shares_order.shtml
- Active Trader Pro user guide (Excel/CSV export): https://www.fidelity.com/products/atbt/pdf/ActiveTraderProUserGuide.pdf
- 2025 IRS 1099-B instructions — options/short-sale treatment: https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/taxes/2025-irs-1099-instructions-brokerage.pdf
- Clearing/custody guide — 10-year statements/confirmations: https://clearingcustody.fidelity.com/app/proxy/content?literatureURL=/827035.PDF
- Clearing/custody guide — 120-month statements, 7-year tax forms, mobile Activity limits (30-day/2,000-txn History): https://clearingcustody.fidelity.com/app/proxy/content?literatureURL=/9904232.PDF
- Clearing/custody guide — 90-day recent transactions, corrected tax forms: https://clearingcustody.fidelity.com/app/proxy/content?literatureURL=/9901626.PDF

**Partner / network (primary or enterprise)**
- Fidelity Access via Finicity announcement (2018-09-27): https://www.mastercard.com/us/en/news-and-trends/Insights/2018/Finicity-and-Fidelity-Investments-Join-Forces-on-Customer-Data-Security.html
- Morningstar enterprise notice — Akoya migration 2023-08-23: https://advisor.morningstar.com/Enterprise/VTC/ClientCommunication-Q3%20Fidelity%20Update-8.23Migration.pdf
- Akoya fintech FAQ (data categories, onboarding requirements): https://akoya.com/fintechs
- Akoya API factsheet (2021): https://third-party-media.cbinsights.com/559458_5810_536513_Akoya_APIs_Factsheet.pdf

**Provider documentation (primary)**
- Plaid — Investments API (holdings, securities, option metadata, tax lots): https://plaid.com/docs/api/products/investments/
- Yodlee — transaction data model (`id`, dates, status, trade fields): https://developer.yodlee.com/resources/yodlee/data-model/docs/transactions
- Yodlee — holdings data model (holding `id`, option fields): https://developer.yodlee.com/resources/yodlee/data-model/docs/holdings
- Yodlee — data extracts (unique `transactionId`, `isDeleted`, holdings refresh): https://developer.yodlee.com/resources/yodlee/data-extracts/docs
- SnapTrade — docs (access model, read-only OAuth): https://docs.snaptrade.com/
- SnapTrade SDK — account data (orders vs activities semantics): https://github.com/passiv/snaptrade-sdks/blob/HEAD/docs/account-data.md
- SnapTrade SDK — activity types incl. OPTIONEXPIRATION/OPTIONASSIGNMENT/OPTIONEXERCISE: https://github.com/passiv/snaptrade-sdks/blob/HEAD/sdks/csharp/docs/AccountInformationApi.md

**Secondary / community (leads only, not authoritative)**
- ofxstatement-fidelity parser — 13-column Activity CSV, no IDs: https://github.com/paulrudy/ofxstatement-fidelity/blob/master/src/ofxstatement_fidelity/plugin.py
- ofxstatement-fidelity — export path/periods: https://github.com/paulrudy/ofxstatement-fidelity
- Positions CSV export guide: https://usefidelity.com/how-to-export-fidelity-transaction-data-and-portfolio-to-a-spreadsheet/
- Compact option symbol examples: https://github.com/sg210037/options_tracker and https://github.com/ronitg1/alpha-terminal/blob/HEAD/docs/FIDELITY_INTEGRATION.md
- Quicken community — Direct Connect vs EWC+ (2023): https://community.quicken.com/discussion/7943918/new-fidelity-connection-requirements
- Quicken community — 2025 Direct Connect user reports: https://community.quicken.com/discussion/7962588/fidelity-investments-not-able-to-sync
- Bogleheads — YTD tax activity view (anecdote): https://www.bogleheads.org/forum/viewtopic.php?t=438512
- Bogleheads — 24-month history claim (anecdote): https://www.bogleheads.org/forum/viewtopic.php?t=297837

---

## Verdict

**CURRENTLY ACCESSIBLE EVIDENCE CANNOT ESTABLISH CROSS-OBSERVATION CONTINUITY**