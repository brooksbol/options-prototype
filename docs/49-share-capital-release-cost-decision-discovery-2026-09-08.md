# Share-Capital Release Cost and Recovery-Time Decision — Discovery Snapshot

**Date:** September 8, 2026 (live regular-session operator reasoning)
**Status:** Discovery / reconciled exploration under existing `PL-DEPLOY`; NOT implementation authorization or ratified Share/Capital Deployment design
**Trigger:** Live comparison of the Principal's real GDX share position against immediate sale, short covered-call recovery attempts, and collars, after observing different post-call outcomes in BNO, COPX, and GDX
**Related:** `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`, `docs/48-covered-call-basis-positive-optionality-discovery-2026-09-08.md`, `docs/foundations/regime-objective-function.md`, `PL-DEPLOY`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`

---

## Why this snapshot exists

Docs 47 and 48 established pressure toward capital-state reasoning: owned shares can be sold, covered, collared, held, or converted into cash that changes the feasible deployment set; basis can be a discovery axis rather than a veto; and DTE is part of the bargain because it encumbers capital for time.

Live operation on September 8 sharpened that into a much more concrete operator decision.

The important question is not primarily:

> Which covered call has the best yield?

For an underwater share position such as GDX, the operator is choosing between two different release costs:

> **realize economic erosion now to recover capital velocity, or accept temporal encumbrance and market risk while attempting to recover basis before converting the shares to cash.**

That decision — money now versus time and uncertainty — is exactly the kind of consequence Wheelwright needs to put in front of the operator.

This remains exploratory evidence under `PL-DEPLOY`. It does not authorize a Share Deployment implementation, scoring formula, probability model, or generalized capital-state engine.

---

## 1. Entry mechanism was incidental

Three live positions — BNO, COPX, and GDX — happened to originate as buy-writes. That provenance is useful history but is not the important abstraction.

All three could equally have been pre-existing shares followed by simple covered calls. Once 100 shares exist, the relevant structure is:

```text
Shares -> short call -> resolution -> next capital state
```

The three observed outcomes were materially different:

| Position | Short-call resolution / subsequent event | Resulting state | Cash-redeployment consequence |
|---|---|---|---|
| BNO | Shares were called away | Cash | Automatic recycling; cash was immediately redeployed |
| COPX | Call expired OTM; shares remained; underlying appreciated over the weekend through basis | Shares -> voluntary sale -> Cash | Low-cost voluntary recycling; shares were sold at a small profit and cash immediately redeployed |
| GDX | Call expired OTM; shares remained below basis | Shares | Cash conversion now requires accepting a realized loss, or accepting additional time/risk in an attempt to recover basis first |

The durable observation is therefore not "three buy-write outcomes." It is three **share-capital resolution outcomes**:

1. **automatic cash conversion** — BNO;
2. **low-cost voluntary cash conversion** — COPX;
3. **costly-or-delayed cash conversion** — GDX.

The original BW was an incidental entry mechanism.

---

## 2. GDX made the release-cost decision explicit

During the live discussion the GDX position was approximately:

- 100 shares;
- broker stock/accounting basis: **$103.77/share**;
- spot around **$99.2–$99.3/share** during the examined Fidelity tickets;
- roughly **$9.9k** of current capital in shares;
- roughly **$450** underwater versus stock basis, varying with spot.

The operator therefore faced a real choice:

### Release now

Sell the shares now, realize roughly the current ~$450 loss, and make roughly $9.9k fungible and immediately redeployable.

This pays a **monetary release cost** to restore capital velocity immediately.

### Attempt recovery before release

Keep the shares for a bounded period and use a covered call or collar to create a recovery/disposition window.

This pays a **time release cost**: roughly $9.9k remains unavailable for other deployments during the chosen DTE. Recovery is uncertain; the next decision boundary may arrive with GDX still below basis.

The choice is not "loss versus no loss." Waiting does not erase the loss. It exchanges certainty and immediate liquidity for time, compensation/protection, and an opportunity — not a guarantee — to improve the exit.

---

## 3. Concrete GDX alternatives observed in Fidelity

The Principal constructed real Fidelity tickets during the regular session. Prices were live and moved slightly between screenshots; the values below preserve the economic shapes observed, not immutable market quotes.

### Immediate sale

At roughly $99.2–$99.3 spot:

- release roughly **$9.9k cash now**;
- realize roughly **$450** stock-basis loss;
- no further GDX downside;
- no waiting period before redeployment.

### 3-DTE $104 covered call — short claw-back window

Observed ticket around $99.23 spot:

- Sep 11 $104 call;
- bid/mid/ask approximately $0.45 / $0.465 / $0.48;
- entered limit around $0.46;
- estimated proceeds roughly **$45** after fee;
- capital remains in GDX for up to three days;
- no downside floor;
- call-away at $104 would recover stock basis and leave a small positive whole-position result after the new call premium;
- if not called, the operator reaches Friday with shares again and may still be underwater.

This is a **paid short recovery/disposition attempt**.

### 3-DTE $95 put / $104 call collar — protected claw-back window

Observed ticket around $99.31 spot:

- buy Sep 11 $95 put around $0.48 / $0.495 / $0.51;
- sell Sep 11 $104 call around $0.44 / $0.465 / $0.49;
- entered package around **$0.05 debit** (~$5 plus fee);
- effective downside floor roughly **$94.95**;
- effective call-away value roughly **$103.95**;
- capital remains in GDX for up to three days;
- basis recovery remains possible while additional downside is bounded below the put strike.

This makes the incremental collar decision concrete: compared with the same 3-DTE $104 covered call, the operator gives up roughly the ~$45 call production and pays a few additional dollars to buy the $95 floor for the same three-day recovery window.

### 10-DTE $104 covered call — more premium, longer encumbrance

Observed Sep 18 ticket:

- $104 call;
- bid/mid/ask approximately $1.36 / $1.425 / $1.49;
- entered limit around $1.45;
- estimated proceeds roughly **$144** after fee;
- same $104 disposition ceiling but roughly seven additional days of capital encumbrance versus the 3-DTE call;
- no downside floor.

The extra premium is compensation not only for option risk but also for selling more **time** before the capital reaches its next natural decision boundary.

### 10-DTE $95 put / $104 call collar — protected recovery, longer encumbrance

Observed Sep 18 ticket around $99.31 spot:

- buy $95 put midpoint roughly $1.42;
- sell $104 call midpoint roughly $1.425;
- package near **zero cost** (entered around $0.01 debit, about $1 plus fee);
- effective floor roughly $95;
- effective call-away value roughly $104;
- essentially the same recovery/protection envelope as the 3-DTE collar, but capital remains encumbered for ten days rather than three.

The apparent ~$1 package price is not the economically important cost. Relative to keeping the 10-DTE $104 call premium, the collar spends roughly the available call production to buy downside protection. The other major cost is the ten-day encumbrance itself.

---

## 4. The operator decision is cost of release

The live GDX discussion converged on a more useful decision vocabulary:

| Dimension | Question |
|---|---|
| **Monetary release cost** | How much erosion must be realized to make the capital cash now? |
| **Time release cost** | How many more days must this capital remain unavailable while attempting a better exit? |
| **Risk during delay** | How much worse can the capital state become while waiting? Is downside bounded? |
| **Compensation during delay** | What premium is received, or what premium is surrendered to buy protection? |
| **Recovery opportunity** | What exit/basis recovery remains possible within the chosen consequence envelope? |
| **Next capital state** | At the next boundary, does the position become cash automatically, remain shares, or require another operator decision? |
| **Next decision date** | When does the operator naturally regain the ability to reconsider the capital? |

For GDX, the central question became:

> **Is realizing roughly the current ~$450 loss cheaper than keeping roughly $9.9k unavailable for another 3, 10, or more days while attempting to recover it?**

The delayed branch has two possible broad endings:

```text
wait -> basis appreciation / call-away -> cash -> redeploy
```

or:

```text
wait -> still underwater -> face another share-capital decision
```

A short recovery attempt therefore purchases a **new decision boundary**, not a guaranteed solution.

---

## 5. Capital velocity is about terminal state, not entry mechanism

This corrects an intermediate interpretation from the live discussion.

A buy-write that is called away does not create the problematic time penalty being examined here; BNO demonstrates the opposite. At resolution it returned capital directly to cash and that cash was immediately redeployed.

The more important velocity risk appears when a short call resolves while shares remain and those shares are not cheaply convertible to cash at the operator's desired economic boundary.

- BNO: short call -> automatic cash conversion.
- COPX: short call expiry -> shares -> favorable appreciation -> cheap voluntary cash conversion.
- GDX: short call expiry -> underwater shares -> **monetary cost now or temporal cost/risk before another attempted cash conversion**.

This is independent of whether the shares originally entered through BW, CSP assignment, outright purchase, transfer, or some other provenance. Provenance can affect basis and lifecycle accounting; it does not define the available next-state decision.

---

## 6. Why this matters for Wheelwright operator decision support

The current Calls surface can expose contracts, DTE, premium, execution quality, spot, and basis. Those facts are useful but do not yet directly frame the decision the operator was actually making.

For an underwater owned-share block, a useful future operator comparison may need to put competing consequences side by side, for example:

| Alternative | Cash / production now | Capital unavailable for | Downside while waiting | Recovery opportunity | Resulting state / next boundary |
|---|---:|---:|---|---|---|
| Sell now | cash released immediately | 0 days | none | none | cash now; realized erosion |
| Short recovery CC | call premium | chosen DTE | unprotected share downside | strike + premium / basis recovery possible | called -> cash; OTM -> shares and another decision |
| Recovery collar | net credit/debit | chosen DTE | bounded by protective put | capped recovery through short call | called -> cash; otherwise protected/unprotected shares after expiry depending on lifecycle |
| Hold | none | indefinite | full share downside | full participation | shares; next decision operator-selected |

The point is not this exact table or these exact labels. The durable finding is that the operator needs the system to expose **money sacrificed now, time sacrificed, compensation received, downside accepted/bounded, recovery allowed, resulting capital state, and next decision date**.

That is decision support. It allows the operator to choose consequences without requiring Wheelwright to predict whether GDX will reach $104.

---

## 7. Relationship to Policy over Prediction

This finding strengthens the existing Policy-over-Prediction direction.

Wheelwright does not need to answer:

> Will GDX recover to $104 in three days?

It can instead make the consequence choices explicit:

- realize a known loss and recover liquidity now;
- accept three days of unprotected downside for ~$45 compensation and a possible $104 disposition;
- spend that premium on a $95 floor while preserving the same three-day recovery ceiling;
- accept ten days of encumbrance for materially more premium;
- hold with unrestricted participation and no defined release date.

The operator can then choose which consequence envelope is acceptable under the active cash-flow mission.

---

## 8. Disposition

- **Canonical identity:** `PL-DEPLOY` (no new `PL-*` ID).
- **Secondary pressure:** `PL-POL-01` (cash-flow-safe recovery / erosion), `PL-PORT-01` (basis and portfolio state), `PL-DEC-BEH` (basis/reference-point discipline), and the Cash-Flow Operating Regime's explicit capital-velocity objective.
- **Strategic disposition:** Strengthens existing capital-state-management direction; no roadmap change required.
- **Architectural disposition:** Sharpens the future Deployment question from "which mechanism/contract?" to **"what does releasing or retaining this capital cost in money, time, and risk, and what state will I own next?"** This is evidence/pressure, not accepted architecture.
- **Why-state:** BNO/COPX/GDX provide three real post-short-call resolution paths; GDX supplies the concrete monetary-vs-temporal release-cost decision and real CC/collar tickets.
- **Next authorized mode:** Further exploration / design only.

**Not authorized:** Share Deployment implementation, Capital Deployment implementation, a release-cost score, probability-of-recovery model, generalized state machine/path optimizer, Prod v0 replacement, automatic sell/redeploy behavior, broker execution, policy promotion, or roadmap reprioritization.

The smallest useful next design question is not how to automate the decision. It is how to put these competing, observable consequences in front of the operator without collapsing them prematurely into a single scalar recommendation.
