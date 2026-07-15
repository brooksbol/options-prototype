# Options Prototype — System Diagrams

**Status:** Authoritative as of July 2026

---

## 1. Data Flow Diagram

```
                    ┌──────────────────────────────────────┐
                    │         External Sources              │
                    │                                      │
                    │  Tradier API    Fidelity CSV Export   │
                    │  (15m delayed)  (positions+activity)  │
                    └───────┬────────────────┬─────────────┘
                            │                │
                    ┌───────▼────────┐ ┌─────▼──────────┐
                    │   Evidence      │ │  Portfolio      │
                    │   Acquisition   │ │  Import         │
                    │                 │ │  (CSV Parsers)  │
                    │ · Session gate  │ │                 │
                    │ · Crawl planner │ │ · Positions     │
                    │ · Rate limiter  │ │ · Activity      │
                    └───────┬────────┘ └─────┬──────────┘
                            │                │
                    ┌───────▼────────┐ ┌─────▼──────────┐
                    │   Evidence      │ │  Portfolio      │
                    │   Store         │ │  Snapshot       │
                    │   (IndexedDB)   │ │  (runtime)      │
                    │                 │ │                 │
                    │ · Chains        │ │ · Cash          │
                    │ · Quotes        │ │ · Inventory     │
                    │ · Expirations   │ │ · Existing puts │
                    │ · Provenance    │ │ · Readiness     │
                    └───────┬────────┘ └─────┬──────────┘
                            │                │
                            └───────┬────────┘
                                    │
                            ┌───────▼────────────┐
                            │   Wheelwright       │
                            │   (Recommendation   │
                            │    Engine)          │
                            │                    │
                            │ · Contract select  │
                            │ · Execution assess │
                            │ · Policy ranking   │
                            │ · Brief building   │
                            └───────┬────────────┘
                                    │
                            ┌───────▼────────────┐
                            │   Write Desk        │
                            │   (Operator UI)     │
                            │                    │
                            │ · Candidate board  │
                            │ · Rec brief drawer │
                            │ · Policy controls  │
                            └───────┬────────────┘
                                    │
                            ┌───────▼────────────┐
                            │   Broker Handoff    │
                            │                    │
                            │ · WriteIntent      │
                            │ · Fidelity URL     │
                            │ · New tab handoff  │
                            └───────┬────────────┘
                                    │
                            ┌───────▼────────────┐
                            │   Fidelity          │
                            │   (External)        │
                            │                    │
                            │ · Preview          │
                            │ · Validate         │
                            │ · Confirm          │
                            │ · Submit           │
                            └────────────────────┘
```

---

## 2. Operator Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OPERATOR WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

  ┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐
  │  Load    │────▶│  Scan    │────▶│  Inspect    │────▶│  Decide  │
  │ Portfolio│     │  Market  │     │ Candidates  │     │          │
  └─────────┘     └──────────┘     └─────────────┘     └──────────┘
       │                │                  │                   │
       │                │                  │                   │
  Select source    Evidence           Browse table        Open Brief
  (Demo/Fidelity)  Acquisition        Sort columns        Review decision
  Verify ready     496 ETFs           Select row          Check impact
                   Cache fills        Keyboard nav        Verify evidence
                                                              │
                                                              ▼
                                                     ┌──────────────┐
                                                     │   Execute     │
                                                     │              │
                                                     │ Open Fidelity│
                                                     │ Verify fields│
                                                     │ Submit order │
                                                     └──────────────┘
```

**Time distribution (design intent):**
- Load Portfolio: seconds (one-time per session)
- Scan Market: 30–120 seconds (one-time, then cache-backed)
- Inspect Candidates: majority of operator time
- Decide: per-recommendation, 5–30 seconds with Brief
- Execute: external, per-decision

---

## 3. Recommendation Brief Information Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   RECOMMENDATION BRIEF                            │
│                   (right-side drawer)                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ IDENTITY                                                    │ │
│  │ Symbol · Name · Contract · DTE                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ DECISION SUMMARY (dominates)                                │ │
│  │ SELL TO OPEN · Bid · Yield · Cash Req · Policy Fit ·       │ │
│  │ Cash After · Assignment Basis · Rank · Posture              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ BROKER HANDOFF                                              │ │
│  │ [Open in Fidelity ↗]                                        │ │
│  │ Verify: Account · Quantity · TIF · Price · Contract         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ EXECUTION EVIDENCE                                          │ │
│  │ Delta · Target · Deviation · Spread · OI · Vol · Bid/Ask   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ STRIKE NEIGHBORHOOD                                         │ │
│  │ 5 contracts · Selected highlighted · Policy tags            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ POSITION IMPACT                                             │ │
│  │ Cash Req · Before · After · Assignment · Basis · Capacity   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ EVIDENCE PROVENANCE                                         │ │
│  │ Provider · Session · State · Status                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Write Desk Layout (Viewport Composition)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Band 1: Write Desk  [Demo ▾]  SIMULATED  $18,500  ●  ● Closed · Jul 14│
├─────────────────────────────────────────────────────────────────────────┤
│ Band 2: CALLS: XLE·1  SHORT PUTS: XLF $42 08-15 · XLU $70 08-22       │
│         ▸ Portfolio detail                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Band 3: [Rescan]  Policy v1  Δ 0.30  DTE 21  Range 7-45  Rank Yield   │
│                                                     4:03 PM · 496 ETFs  │
├─────────────────────────────────────┬───────────────────────────────────┤
│                                     │                                   │
│  CANDIDATE TABLE                    │  RECOMMENDATION BRIEF             │
│                                     │                                   │
│  # Symbol Exp DTE Strike Δ Bid ...  │  QLD                              │
│  ─────────────────────────────────  │  ProShares Ultra QQQ              │
│  1 COPX  08-07 24 $78   0.48 ...   │  $85 Put · Aug 21 · 38 DTE       │
│  2 PSI   08-21 38 $155  0.41 ...   │                                   │
│  3 QTUM  08-21 38 $150  0.41 ...   │  SELL TO OPEN                     │
│  4 XME   08-21 38 $185  0.41 ...   │  Bid         $2.60                │
│  5 XLE   08-21 38 $185  0.38 ...   │  Annualized  29.4%                │
│ ►6 QLD   08-21 38 $85   0.28 ...   │  Cash Req    $8,500               │
│  7 ITB   08-21 38 $98   0.41 ...   │  ...                              │
│  8 XBI   08-07 24 $152  0.34 ...   │                                   │
│  ...                                │  [Open in Fidelity ↗]             │
│                                     │                                   │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 5. Session State Machine

```
                    ┌──────────────────┐
                    │  NON_TRADING_DAY │ (weekend/holiday)
                    └────────┬─────────┘
                             │ next trading day
                    ┌────────▼─────────┐
                    │    PREMARKET      │ (before 9:30 ET)
                    └────────┬─────────┘
                             │ 9:30 ET
                    ┌────────▼─────────┐
                    │ REGULAR_OPEN_DELAY│ (9:30–9:45 ET, awaiting delayed data)
                    └────────┬─────────┘
                             │ 9:45 ET
                    ┌────────▼─────────┐
                    │REGULAR_OBSERVATION│ (accepting canonical evidence)
                    └────────┬─────────┘
                             │ 4:00 ET (or 1:15 for options early-close)
                    ┌────────▼─────────┐
                    │   DELAY_DRAIN    │ (4:00–4:15 ET, draining delayed quotes)
                    └────────┬─────────┘
                             │ 4:15 ET
                    ┌────────▼─────────┐
                    │ CLOSED_CANONICAL │ (evidence sealed until next session)
                    └──────────────────┘
```

---

## 6. Cache Key Structure

```
market:<provider>:<environment>:<dataType>:<SYMBOL>[:<expiration>]:v1

Examples:
  market:tradier:sandbox:chain:XLE:2026-07-17:v1
  market:tradier:sandbox:expirations:QQQ:v1
  market:tradier:sandbox:quote:IWM:v1
  market:tradier:sandbox:absence:AAVM:v1
```
