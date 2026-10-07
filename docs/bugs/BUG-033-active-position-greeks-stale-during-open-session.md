# BUG-033 — Active-position Greeks go stale (≈1 day old) during an open session, misrepresenting live risk

- **Status:** Open
- **Severity:** Not established
- **Area:** Backend / evidence acquisition coverage + freshness for held (active) positions ↔ Operator Console Greeks presentation
- **Provenance:** Operator observation 2026-10-07 (IBIT buy-write), two Principal-provided position exports (normal vs. forced update)

## Observed failure

On 2026-10-07, during an open session, an active position (IBIT buy-write, short the 2026-10-09 47.5 call) was presented with a **Greek Age of `1d`** while every co-displayed quote/spot field was current (Today's G/L, spot). The day-old Greek bundle produced an internally incoherent and materially misleading risk reading:

Normal (stale) export — IBIT:

| Field | Value |
|-------|-------|
| Spot | 47.13 (OTM: strike 47.5 > spot) |
| Moneyness | −0.8% |
| Delta | **0.83** |
| Gamma | 0.1583 |
| Theta | −0.0640 |
| Bid/Ask | 1.39 / 1.42 |
| Greek Age | **1d** |
| Quote Freshness | 9m |

A slightly-OTM, near-ATM call with ~2 DTE cannot carry a 0.83 delta. The 0.83 is a capture-time value from ~1 day earlier when the option was higher/ITM. The displayed Gamma (near-ATM shape) and Delta (fairly-ITM shape) **disagree with each other**, confirming the bundle is not co-temporal with the live spot. The stale bid/ask (1.39/1.42) was likewise ~1 day old.

Forced-update export — same IBIT position, essentially unchanged spot:

| Field | Value |
|-------|-------|
| Spot | 47.18 |
| Delta | **0.37** |
| Gamma | 0.3101 |
| Theta | −0.1162 |
| Bid/Ask | 0.36 / 0.37 |
| Greek Age | **2m** |

With a fresh Greek bundle, Delta reads 0.37 — the expected magnitude for a slightly-OTM near-ATM 2-DTE call. The forced update producing correct values demonstrates the **Greek computation/normalization path is sound**; the defect is that the normal acquisition cadence allowed an active position's Greek+quote bundle to age ≈1 day during a live session.

## Intended semantics violated

- **Session awareness is correctness** (`foundations/evidence-appliance.md`): during an open session, evidence for active positions *can and does* change. Serving a day-old Greek bundle while the session is open contradicts the appliance's obligation to maintain a current authoritative model of the opportunity/position environment.
- **Persist facts; derive trust** (project identity principle 3): freshness/staleness is derived at query time. The system *did* derive and display `Greek Age: 1d`, but tolerating that age on an active position during an open session is an acquisition-coverage failure, not merely a labeling one.
- **Tiered acquisition freshness** (`foundations/acquisition-scheduler-policy.md`): Class A (ready symbols with qualifying puts) targets ≤15 min chain age. An active held position carrying a ~1-day-old Greek bundle during an open session indicates held/active-position symbols are not receiving acquisition freshness commensurate with their risk significance.

## Consequence

The operator's live risk picture is wrong. A buy-write whose true short-call delta is ~0.37 was presented as ~0.83, overstating directional exposure / assignment proximity on an active position two days from expiration. For a decision-support appliance, a stale-but-confidently-presented Greek on an *open* position is a correctness failure in the primary risk signal. Severity not established pending Principal classification; the Principal has characterized a 1d Greek age on an active position during an open session as "unacceptable."

## Diagnosis / root cause

**Not established.** The symptom and the forced-update contrast are demonstrated, but the code path has not been traced. Open questions for a (separately authorized) investigation:

- How do held/active-position symbols enter the acquisition scheduler, and are they tiered for freshness comparably to Class A candidates during an open session?
- Where is the Greek bundle (delta/gamma/theta/vega/rho) sourced and persisted, and where is `Greek Age` derived?
- Why did the normal cadence leave an active position's Greek+quote bundle at ~1 day during an open session while spot/G-L fields were current? (Separate acquisition paths for spot vs. option-chain Greeks is a candidate hypothesis, unverified.)
- Is the forced update exercising a different acquisition path than the normal cadence, and if so, why does only the forced path refresh the Greek bundle?

Do not patch a consumer/presentation layer to compensate: per the Authority-Before-Consumers rule, if the Greek bundle is stale at the acquisition/freshness authority, the repair belongs there, not in the Operator Console.

## Scope / non-goals

- Covers: staleness of the Greek+quote bundle for **active/held positions** during an **open session**, and the acquisition-coverage/freshness authority responsible for refreshing it.
- Does not cover: Greek math/normalization correctness (demonstrated sound by the forced update), nor the zero-vs-absent Delta presentation ambiguity (BUG-011), nor general multi-source temporal composition (BUG-004) except as cross-linked context.
- **Filing does not authorize remediation.** Root-cause investigation and any fix require separate explicit Principal authorization.

## Acceptance criteria

(To be confirmed with the Principal; provisional, derived from the observed failure.)

- During an open session, an active position's Greek bundle age stays within a defined freshness bound appropriate to active-position risk (bound TBD by Principal/scheduler policy), rather than aging to ~1 day.
- Displayed Greeks for an active position are co-temporal with the displayed spot such that Delta and Gamma are mutually consistent for the current moneyness.
- No consumer-side compensation masks a stale backend Greek bundle; freshness is corrected at the acquisition/freshness authority.

## Remediation history

Empty while Open.

## Verification

Empty while Open.

## Related

- **BUG-004** — Console composes temporally incompatible evidence into an apparently-coherent view (closest conceptual cousin: temporal coherence of composed evidence).
- **BUG-011** — Provider-reported exact-zero Delta rendered indistinguishably from absent Delta (adjacent Greeks-presentation defect, distinct cause).
- `foundations/evidence-appliance.md` — session awareness as correctness; sealed vs. live evidence.
- `foundations/acquisition-scheduler-policy.md` — tiered A/B/C/D freshness targets.
- Authority-Before-Consumers rule (`.kiro/steering/development-workflow.md`) — repair stale authoritative facts upstream, not in consumers.
