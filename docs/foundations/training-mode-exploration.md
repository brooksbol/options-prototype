# Training Mode: Portfolio-Operations Simulator

**Status:** Exploratory — architectural and product exploration
**Date:** August 2026
**Related:** PL-RESEARCH-03 (Scenario Replay), Evidence Appliance, Policy over Prediction, Situation Architecture, Deployment Opportunity
**Disposition:** Parking-lot seed requiring architectural review before any implementation

---

## Core Concept

A Wheelwright portfolio-operations simulator whose primary purpose is to build operator behavior, intuition, experience, and resilience through repeated low-consequence decisions.

This is not:
- An options tutorial or educational content library
- Conventional paper trading
- A renamed Demo Mode
- A market prediction tool or backtest engine

The goal is to let someone experience portfolio operation repeatedly and safely until important behaviors become intuitive.

**Central proposition:** Wheelwright Training Mode should teach behavior and intuition, not merely mechanics.

**Most important lesson:** You can do everything right and still lose.

---

## Three Operating Environments

The concept suggests Wheelwright may ultimately have three related environments:

### 1. Training Mode

Game capital + simulated/historical market behavior.

- No real financial consequences
- Game time can advance faster than wall-clock time
- Curated, historical, and synthetic scenarios
- Sequential introduction of concepts
- Difficulty progression
- Deliberate adverse situations
- Repeated low-consequence failure
- Explicit teaching and debriefing

### 2. Live Simulation

Game capital + real current market.

- Current actual market conditions, boards, premiums, volatility
- Fictional portfolio operated against real evidence
- Time runs at real-market speed
- Teaches: can the operator deal with whatever the actual market gives them?
- Closest to portfolio-level paper operation (not single-trade paper trading)

### 3. Real Money Mode

Real market + real portfolio + real consequences.

The current Wheelwright operating mode.

### Potential Abstraction Matrix

|                         | Simulated/Historical Market | Real Market      |
|-------------------------|----------------------------|------------------|
| **Game capital**        | Training Mode              | Live Simulation  |
| **Real capital**        | (not applicable)           | Real Money Mode  |

### Shared Machinery Hypothesis

These environments could potentially share the same core portfolio/evaluation machinery while differing in:
- Evidence source
- Portfolio/custody source
- Market clock
- Consequence boundary
- Execution boundary

This hypothesis requires validation against the current architecture before adoption.

---

## Behavioral Training Philosophy

### The Learning Loop

```
Situation → Observe → Decide → Consequence → Debrief → Repeat
```

### Conceptual Progression

```
Pattern recognition → intuition → confidence → violated expectation → reflection → resilience
```

### The Four Decision-Outcome Combinations

The system should deliberately create all four:

1. **Good decision → good outcome** — reinforces correct behavior
2. **Bad decision → bad outcome** — teaches through consequence
3. **Bad decision → good outcome** — tests whether operator recognizes luck vs skill
4. **Good decision → bad outcome** — builds resilience and probabilistic thinking

Cases 3 and 4 are particularly important. The system must strongly separate:
- **Decision quality** (Was this the right action given available evidence and policy?)
- **Outcome quality** (Did it make or lose money?)

### Behaviors to Develop

- High premium triggers investigation, not excitement
- Idle cash creates opportunity to evaluate, not obligation to trade
- "Wait" is a legitimate portfolio action
- Capital deployment reduces future optionality
- DANGER means understand, not mechanically reject
- A covered call requires assignment-economics reasoning, not merely premium assessment
- Several individually attractive trades can collectively create a bad portfolio
- A losing outcome does not prove the preceding decision was bad
- Assignment is an event, not inherently a failure
- The next disciplined decision after a loss matters more than emotionally undoing the previous outcome

---

## Experience Compression

Training Mode provides a place to make mistakes cheaply. The important product value is **experience compression** — situations that might take months or years to encounter naturally can be experienced repeatedly over hours or days.

The player should be able to:
- Make a terrible trade
- Advance time
- Experience assignment
- Run out of deployable cash
- Over-concentrate
- Miss a better opportunity because capital was committed
- Chase premium
- Sell a call with poor assignment economics
- Experience a good trade going badly
- Experience a bad trade going well
- Recover and try again

---

## Sequential Learning: Complexity Is Earned

Each learning stage should require understanding of earlier mechanics. Do not expose the full Wheelwright conceptual universe on day one.

### Early Stages (examples)

- Cash, account balance
- Underlying price, strike, 100-share contract sizing
- Cash-secured puts, expiration, premium
- Affordability, waiting

### Later Stages (examples)

- Assignment, owned shares, cost basis
- Covered calls, call-away economics, NAV erosion
- Multiple simultaneous positions
- Sector concentration, capital allocation
- Portfolio production
- Correlations, recovery decisions
- Adverse sequences
- Increasingly sophisticated Greeks and volatility concepts

---

## Capital as Optionality

### Starting With Constraints

Beginners start with a small fictional account ($10k–$25k range, amount not decided). This teaches immediately: **capital determines the opportunity set.**

The player should see what they cannot afford — visible constraint, not hidden lock:

```
SPY — capital required: $64,000
Available deployable capital: $18,400
Not currently feasible
```

### Capital Preservation Lessons

A scenario might deliberately allow near-full deployment into individually reasonable positions, then present an unusually attractive opportunity the next day. The player cannot take it.

**Lesson:** Fully deployed is not necessarily fully productive. Capital preserves future choices.

**Architectural implication:** This may have consequences for real-money portfolio fitness evaluation — candidate fitness could potentially include the effect on future maneuvering room rather than treating idle cash as automatically undesirable.

---

## Progression Through Demonstrated Competence

Progression should be based on operator behavior, not P&L maximization.

**Principle:** P&L is an outcome. Skill is demonstrated behavior.

A player might finish a scenario with less NAV than they started and still advance because of consistently high-quality decisions under adversity. Conversely, reckless premium chasing producing large profits might not earn advancement.

Larger portfolios introduce qualitatively different problems:
- Small: affordability, patience, contract sizing
- Medium: competing deployments, multiple positions
- Large: concentration, allocation, NAV consequences, production, simultaneous assignments

---

## Operator Skills (RPG-like Model)

Capabilities corresponding to behaviors Wheelwright actually values:

**Possible positive skills:**
- Patience
- Risk Sense
- Capital Discipline / Capital Optionality
- NAV Awareness / Portfolio Awareness
- Execution Judgment
- Recovery Discipline
- Uncertainty Tolerance

**Possible negative tendencies (inferred from behavior):**
- Outcome Bias
- Premium Chasing
- Over-deployment
- Concentration Blindness
- Revenge/Recovery Trading

Skills could affect scenario selection, difficulty, coaching, progression, and concept introduction. Difficulty becomes adaptive rather than fixed levels.

### Gamification Principle

Gamification should reward disciplined portfolio operation, not trading activity. A player should be capable of receiving a perfect score for doing nothing when nothing is fit.

Do not create incentives that train wrong behavior:
- More trades = more XP (wrong)
- Larger profits = automatically better (wrong)
- Constant deployment = success (wrong)

---

## Scenario Design

### "Perfect Shit Storm" Scenarios

Compound-adversity scenarios testing resilience and disciplined triage under pressure. Possible ingredients: multiple assignments, falling NAV, shrinking cash, elevated IV, expiring calls, sector concentration, production shortfall, tempting recovery trades, simultaneous decisions.

Success may mean: controlling damage, preserving optionality, avoiding panic, accepting unavoidable loss, making the best next decision.

### Difficulty vs Pressure

- **Difficulty** = analytical complexity
- **Pressure** = how difficult it is to remain behaviorally disciplined

A scenario can be analytically simple but psychologically difficult after several losses.

### Historical Scenarios

Real market history frozen at a decision point. The player decides without knowing what happened next. Strict no-lookahead invariant applies.

### Synthetic Scenarios

Deliberately constructed for targeted skill exercises. Must remain plausible — not cartoon markets.

### Scenario Validation

Synthetic scenarios could be tested through simulation across many paths to verify plausibility and ensure outcome distributions rather than predetermined results.

---

## Game Time

Training Mode needs an explicit simulation clock. Real-time waiting is not useful.

A useful interaction model: **Advance → Next Decision Event** rather than fixed time increments.

The interface could animate compressed time passage — DTE counting down, premium evolving, theta visible, underlying moving — then pause at decision events.

**Sacred rule:** The player may control time passage but cannot see future information before advancing to it.

---

## Assignment as Experiential Teaching

When assignment occurs, dramatic presentation followed by reasoning:

```
ASSIGNED

Is this good or bad?
What happens now?
```

Do not immediately explain. Make the player reason first. Then reveal mechanics visually: contract disappears, cash changes, shares appear, basis visible, new possibilities emerge.

Eventual lesson: Assignment is an event, not a judgment. The first should feel scary. After sufficient training, the response should be: "Assigned. Okay. Show me the shares."

---

## Brokerage Literacy

Training should help the player recognize mechanics on a real retail platform (Fidelity is current reference).

Progressive literacy:
- Early: Wheelwright interprets heavily (Premium: $187, Assessment: GOOD)
- Advanced: conventional brokerage representation (XYZ 85 Put — 21 DTE, Bid 1.78 / Ask 1.94, STO 1 @ 1.86 LMT)

Exercises could eventually present raw brokerage-style interfaces and verify the player can navigate them.

---

## Simulated Brokerage Separation

Even within Training Mode, maintain conceptual separation:
- **Simulated brokerage** = account, cash, positions, orders, fills, assignments, permissions
- **Wheelwright** = decision-support console observing that brokerage

This reinforces the real architecture: Wheelwright helps decide; the brokerage determines what the account owns and what executes.

### Simulated Permissions / Tier Access

Progression mechanism: the player requests options-tier access from the simulated brokerage. Creates two distinct advancement systems (Wheelwright competence vs brokerage permission) that should not be conflated.

### Visible Constraints

Different reasons for unavailability should be distinguishable:
- Capital constraint
- Portfolio/inventory constraint
- Account-permission constraint

---

## Simulation Engine: Broader Architectural Significance

The simulation engine should perhaps not belong specifically to Training Mode. It could be a shared Wheelwright capability.

- **Training asks:** What happens next in this game?
- **Real Money could ask:** What could happen next to my actual portfolio?

### Potential Real-Money Applications

Taking actual portfolio state + candidate trade + current evidence, evaluate many plausible futures. This could enrich portfolio fitness:

Instead of static attributes (premium, DTE, delta, execution quality), Wheelwright could ask: **What marginal effect does this action have on the distribution of plausible portfolio outcomes?**

Alternatives evaluated against comparable futures:
- Current portfolio + WAIT
- Current portfolio + Put A
- Current portfolio + Buy-Write C

This may help identify where slightly lower premium preserves much more resilience. It may give WAIT a stronger analytical basis.

### Simulation Humility

Even millions of simulations do not eliminate uncertainty.

**Core principle:** Simulation describes uncertainty; it does not eliminate it.

Wheelwright should not become "Monte Carlo says buy XYZ." The operator remains responsible for the decision. Training should explicitly teach the limitations of the model.

### Guardrail: Simulation Is Not an Oracle

Maintain separation between:
- **Scenario state** — what the operator knows at the decision point
- **Decision evaluation** — how fit/defensible the decision is given only available information
- **Outcome engine** — what subsequently happens

This prevents teaching: "The correct trade is whatever has the highest expected value."

---

## Architectural Relationship Analysis

### Existing Primitives That Naturally Support This

| Primitive | Training Mode Relevance |
|---|---|
| `PortfolioSourceType` ("fidelity" \| "demo") | Could extend to "training" / "simulation" |
| Four-Engine architecture | Evidence/Policy/Decision/Explanation pipeline could operate on simulated evidence |
| Evidence Appliance | Training would provide a *different* evidence source — not modify the real one |
| Policy over Prediction | Training philosophy directly aligns — teaching judgment, not forecasting |
| Situation Architecture | Progressive responsibility maps to situation context |
| Deployment Opportunity | Same decision framework in training and real modes |
| Market Session model | May need virtualization (injectable clock) for game time |
| Production Accounting | Same structure could assess simulated lifecycle production |

### Tensions and New Requirements

| Area | Tension |
|---|---|
| Market clock | Currently assumes real time. Training requires virtual clock. |
| Evidence source | Current architecture acquires from live providers. Training needs historical/synthetic feeds. |
| Execution boundary | Current model hands off to Fidelity URL. Training needs simulated fills. |
| Portfolio persistence | Currently localStorage/CSV. Training needs scenario-scoped state. |
| Session model | 6-state model assumes real trading hours. Game time could be any time. |
| Evidence freshness | TTL/staleness assumes wall-clock time. Training evidence is always "fresh" within game time. |

### Overlap With Existing Parking-Lot Items

| Item | Relationship |
|---|---|
| PL-RESEARCH-03 (Scenario Replay) | Training Mode subsumes and dramatically expands this. Scenario Replay is an engineering instrument; Training Mode is a product surface. |
| PL-EVID-01 (Historical Evidence) | Training would consume historical evidence. Training scenarios are a consumer of the observation architecture. |
| PL-DEPLOY (Deployment Opportunity) | Training teaches the same decision framework. Shared machinery. |
| PL-PROD-MISSION (Production Mission) | Training scenarios could include production targets as difficulty/pressure mechanisms. |
| PL-PROD-FORECAST (Forecasting) | Simulation engine overlaps — shared capability possible. |

### Concepts That Should Remain Exploratory

- Adaptive difficulty / RPG skills (interesting but speculative)
- Monte Carlo outcome validation of scenarios
- Simulation as a real-money fitness evaluation tool
- Hybrid historical/synthetic scenario generation
- Live Simulation as a distinct operating environment

### Assumptions Requiring Validation

1. Can the Evidence → Policy → Decision → Explanation pipeline operate identically on simulated vs real evidence without mode-specific branches?
2. Does an injectable/virtual clock compose cleanly with existing session-awareness?
3. Can historical evidence be represented without lookahead leakage?
4. Is PortfolioSourceType the right extension point, or is "operating environment" a higher-level abstraction?
5. Would simulated fill/execution logic contaminate real execution paths?
6. Can the brokerage-separation concept be enforced without building a full simulated brokerage?

---

## Principles Proposed for Evaluation

These emerged from the exploration. Evaluate against existing Wheelwright principles rather than automatically adopting:

1. **Train judgment, not prediction** — Training reinforces decision quality under uncertainty
2. **Decision quality and outcome quality are different** — Good decisions can lose; bad decisions can win
3. **Gamify discipline, not activity** — Waiting can be a perfect decision
4. **Capital has option value** — Deploying capital removes future choices
5. **Assignment is an event, not a judgment** — Its economic meaning depends on context
6. **Complexity is earned** — Introduce concepts as prerequisite understanding develops
7. **Failure should be cheap in training** — Experience can be compressed through repetition
8. **Simulation describes uncertainty; it does not eliminate it** — No model converts uncertainty into certainty
9. **Real brokerage literacy matters** — Training should make conventional interfaces intelligible
10. **Wheelwright remains non-custodial** — Even simulated, maintain decision-support / custody separation
11. **Resilience is an operator capability** — The quality of the next decision after adversity is trainable

---

## Possible Shared Ecosystem (Long-Term Loop)

```
real market history → calibrates market behavior models
    → simulation generates plausible portfolio situations
        → those become Training Mode scenarios
            → Training develops human operator behavior
                → same simulation evaluates real portfolio alternatives
                    → actual outcomes provide calibration evidence
                        → observations improve scenario design and analysis
```

The operator remains central. This does not imply autonomous trading or AI deciding trades.

---

## What This Is Not

- Not an immediate implementation request
- Not a guaranteed product feature
- Not a claim that all ideas above belong in Wheelwright
- Not a replacement for the current real-money operating model
- Not "gamification of Wheelwright" — the game mechanics serve behavioral training; the architectural significance is deeper

---

## Agent War-Gaming

### Beyond Monte Carlo

Monte Carlo asks: *What futures might occur?*

Agent war-gaming asks: **What happens when an operator repeatedly makes decisions inside those futures?**

The simulator could run many complete portfolio-operating histories in which agents observe only information available at each simulated decision point and repeatedly choose among available actions.

### Operator Doctrines as Agents

Agents could embody different operating doctrines or behavioral tendencies:

- Strict Wheelwright-policy follower
- Capital-preservation policy
- Aggressive/full-deployment policy
- Premium maximizer
- Diversification-first operator
- Excessive cash hoarder
- Premium chaser
- Concentration-blind operator
- Random-but-legal operator

### Purpose

The purpose is **not** "let AI discover the optimal trading strategy."

The purpose is: **Use autonomous operators as experimental test subjects for Wheelwright's policies, assumptions, scenarios, and fitness model.**

Multiple agents receive the same starting portfolio, market path, available evidence, and candidate opportunities — with only operator behavior varying. This enables controlled comparisons of operating doctrine.

### Expected Output

Results would not necessarily identify one universally winning policy. They might instead expose tradeoffs:
- One policy produces more premium in benign markets
- Another preserves substantially more optionality
- Another performs poorly during assignment cascades
- Another has unacceptable tail behavior

That evidence informs human review of Wheelwright policy — it does not replace human judgment.

### Agent Red Teams

A later extension: adversarial agents whose objective is to **find plausible worlds or operating sequences in which Wheelwright's current policies behave badly.** This effectively red-teams portfolio doctrine.

Agent war games could also test the evaluator itself. If a reckless premium-chasing agent consistently receives a higher operator-quality score than a disciplined agent because its simulated P&L happened to be higher, that is evidence the evaluator encodes the wrong behavior.

Agent runs could identify particularly interesting states that become candidate human Training Mode scenarios:
- States where aggressive agents overwhelmingly deploy but disciplined agents preserve capital, with materially different downstream optionality
- States where all currently encoded Wheelwright policies perform poorly (exposing policy/architectural blind spots)

---

## WAIT as First-Class Action

### The Tic-Tac-Toe Insight

By analogy to WarGames' WOPR: repeated play sometimes demonstrates that no winning move exists. There is an analogous Wheelwright condition: **there are executable trades available, but none are sufficiently fit.**

A naive recommendation system ranks candidates and chooses the best:
```
A > B > C, therefore recommend A.
```

But: **the best available trade can still be a bad trade.**

### WAIT Competes for Fitness

WAIT should be investigated as a first-class action in the decision set rather than merely an empty state or absence of recommendation:

```
Put A
Put B
Buy-Write C
Covered Call D
WAIT
```

All compete for portfolio fitness.

### Relationship to Capital Optionality

The lesson is not: "Wait because something better will definitely appear."

It is: **Do not accept inadequately compensated risk merely because deployable capital exists.**

This directly extends the capital-as-optionality concept. Agent war games may provide a way to test whether policies genuinely understand the value of restraint.

Training Mode must avoid hindsight bias: if the player correctly chooses WAIT and nothing better appears later, WAIT may still have been the correct decision given available evidence.

---

## Simulation Control Room vs Simulated World

### The Boundary Concept

The system should maintain a strong visual and conceptual separation between two environments:

**Simulation Control Room** — outside the simulated market:
- Selecting games
- Configuring scenarios
- Controlling simulated time
- Starting/stopping simulations
- Launching agent war games
- Reporting simulation-level results

**Simulated Market/Brokerage/Wheelwright World** — inside the simulation:
- Modern brokerage UI
- Options chains, account balances, positions, order tickets
- Contemporary Wheelwright Console
- Evidence, recommendations, explanations

The player crosses a visible boundary when a scenario begins. The visual language tells them which system currently governs what they're seeing.

### Architectural Significance

This is not merely a UI theme. It maps to a real system boundary:

```
SIMULATOR — creates the world and controls simulated time
    ↓
MARKET — produces conditions and evidence
    ↓
BROKERAGE — holds cash/positions, applies permissions, processes orders/fills/assignments
    ↓
WHEELWRIGHT — interprets evidence and helps evaluate decisions
    ↓
OPERATOR — makes the decision
```

This aligns with existing Wheelwright architecture:
- Evidence Appliance = MARKET + evidence maintenance
- Non-custodial principle = WHEELWRIGHT is not BROKERAGE
- Execution boundary = operator acts through BROKERAGE, not through Wheelwright

The simulation control room is a *new* layer that sits above all of these: it creates and controls the world they operate within.

### Event Ownership

Events should originate from the system that conceptually owns them:
- **ASSIGNED** is fundamentally a brokerage event (brokerage reports it, changes account state)
- Wheelwright then helps interpret: what changed, consequences, available actions
- The simulator controls time passage but should not masquerade as the brokerage

### Agent Mode Belongs in the Control Room

Agent war-gaming is conceptually part of the simulation laboratory, not the real-money interface. The control room configures and launches agent experiments; the simulated world is where agents operate.

---

## Game Repertoire and Visible Progression

### Executable Game Catalog

The system could have a repertoire of executable games representing increasingly sophisticated portfolio-operation problems. Illustrative:

```
01  CASH AND CAPITAL
02  CASH-SECURED PUT
03  ASSIGNMENT
04  COVERED CALL
05  BUY-WRITE
06  CAPITAL OPTIONALITY
07  PORTFOLIO OPERATIONS
08  VOLATILITY SHOCK
09  ASSIGNMENT CASCADE
10  LIQUIDITY CRISIS
11  MARKET CRASH
12  PERFECT SHIT STORM
```

### Multi-Purpose Scenarios (Hypothesis)

The same scenario definition could potentially serve:
- Education (human learner)
- Behavioral training (human under pressure)
- Regression testing (agent validates expected behavior)
- Policy experimentation (agents compare doctrines)
- Architecture validation (scenarios expose model weaknesses)
- Fitness-model evaluation (agent scores reveal evaluator bias)
- Adversarial testing (red-team agents find failure modes)

**Caution:** Do not assume one scenario representation can satisfy all purposes. Capture this as a hypothesis requiring architectural investigation.

### Visible Progression UI

New players should see the entire game repertoire immediately, with only the first available:

```
WHEELWRIGHT TRAINING SYSTEM
SELECT GAME
01  CASH AND CAPITAL
02  CASH-SECURED PUT                  [LOCKED]
03  ASSIGNMENT                        [LOCKED]
...
12  PERFECT SHIT STORM                [LOCKED]
```

Locked games could expose their prerequisites rather than opaque level requirements:

```
ASSIGNMENT — LOCKED
Demonstrate:
  ✓ Capital requirements
  ✓ Contract sizing
  □ Cash-secured put mechanics
  □ Expiration
  □ Strike obligation
```

The player sees the mountain from the beginning. Game names create anticipation (a beginner has no idea what "Assignment Cascade" means but can see difficult situations lie ahead).

---

## Simulation Concept Taxonomy

A future architectural investigation should explicitly distinguish these concepts rather than collapsing them into one "simulation engine":

| Concept | Responsibility |
|---|---|
| **Market simulation** | Generating plausible price paths, option surfaces, evidence |
| **Portfolio/account simulation** | Maintaining fictional account state (cash, positions, permissions, orders, fills, assignments) |
| **Operator/agent simulation** | Autonomous decision-making within a scenario according to a doctrine |
| **Scenario definition** | The starting conditions, market regime, available instruments, difficulty, objectives |
| **Decision evaluation** | Assessing decision quality independently of outcome |
| **Experiment harness (war-gaming)** | Running many agents through many scenarios, collecting comparative evidence |

These may eventually be distinct architectural components. They should not be conflated during exploration.

---

## Design Sensibility: Simulation Control Room

### Restrained 1980s Terminal Aesthetic

The simulation control room could use a deliberately sparse, text-oriented, early-computer sensibility. This should not become nostalgia cosplay.

**Borrow:**
- Sparse interfaces, terse system language
- Text menus, numbered selections, terminal prompts
- Anticipation
- Occasional character-stream rendering at dramatic moments (scenario initialization, permission grants, game unlocks, major conclusions)

**Avoid:**
- Fake CRT effects everywhere
- Illegible pixel typography
- Excessive sound effects
- Retro styling throughout Wheelwright

**Principle:** The modern brokerage and Wheelwright interfaces remain modern. The simulation control room has its own distinct identity.

Gen X players may recognize aesthetic references. Younger players should simply experience it as the simulation system's identity. The theatrical character-stream rendering (reminiscent of 9600-baud modem output) is aesthetic, not a usability tax.

---

## Competitive Landscape and Differentiation

### Observed Market (August 2026)

The individual ingredients of this concept exist in the market, but appear fragmented across products with different organizing ideas:

**Options/Trading Simulation:**
- *Options Simulator* — rejects backtesting/paper trading in favor of synthetic markets the player hasn't seen. Controllable time, multiple market models, options chains, Greeks, portfolio tracking, AI mentor. Uses "Perfect Storm" for an adverse model. Compresses a year into minutes. Closest to the synthetic-market and time-compression dimensions. Center of gravity: options strategy practice against generated markets.

**RPG/Progressive Financial Education:**
- *StockKids Academy / Market Quest* — simulated careers, 401(k)s, stock portfolios, covered calls, puts, spreads. RPG-style quests, zones, badges, leveling. Closest to the finance-as-progressive-game dimension.
- *SensaEducation* — explicit RPG mechanics: XP, levels, unlockable tracks, missions, quizzes, options strategies, simulator with live quotes and Greeks.

**Paper Trading / Live Simulation:**
- *Trading Game* — small virtual accounts ($500–$10K) against real-market prices. Explicitly discusses risk management and emotional discipline development.
- *Vigo* — options curriculum with virtual portfolios against real market data.
- *CME Simulator* — professional trading-platform experience against real market data (CME markets, not retail portfolio).

**Experiential Financial Education (Academic):**
- FT-described investment exercise: fictional personas and goals, virtual capital allocation, ten years of simulated portfolio evolution with adverse "news flashes" disrupting expectations. Conceptually closer to experiential learning than stock-picking games.

**Synthetic Market Research:**
- Active research on generating realistic synthetic equity/options markets and realistic order-level environments. Statistical validation of synthetic behavior (rather than scripting "stock crashes now") has legitimate technical precedent.

### The Identified Gap

Most trading games ultimately ask: **Can you make money trading?**

Even educational simulators tend to score trades, teach strategies, or let users experiment. Simulated investing competitions notoriously reward whoever takes the biggest short-term gamble.

What this concept asks is substantially different: **Can you become a disciplined operator of capital?**

This creates objectives most trading games don't naturally reward:
- Preserve optionality
- Wait
- Size appropriately
- Understand assignment as economics, not failure
- Don't chase losses
- Accept unavoidable losses
- Recognize a winning trade that was actually a bad decision
- Recognize a losing trade that was actually a good decision
- Manage the portfolio rather than merely the position

### Potentially Differentiated Elements

1. **The character being leveled up is the investor/operator, not the portfolio.** The $25K → $50K → $100K progression means demonstrated judgment earning harder problems, not wealth accumulation proving success.

2. **Progressive abstraction stripping.** The curriculum progressively removes Wheelwright interpretation until the player can recognize and operate something like a real retail brokerage options interface.

3. **Simulated brokerage permissions** as a separate progression axis from operator competence.

4. **Previously unaffordable securities visibly entering the opportunity set** as capital grows — teaching capital-as-constraint naturally.

5. **The game engine becomes analytical infrastructure.** The simulation machinery is not disposable educational software — it can potentially serve Real Money Wheelwright's portfolio-fitness evaluation. This dual-use architecture has not been observed in consumer trading games.

### Competitive Scan Gaps (Further Research Needed)

Before assuming novelty, investigate:
- Options Simulator in depth (closest synthetic-market overlap)
- StockKids/Market Quest progression mechanics
- Sensa RPG/simulation integration
- Established broker paper-trading systems (Fidelity, Schwab, IBKR)
- Serious portfolio-management simulations (institutional/professional)
- Business-school and institutional investment training simulators
- Professional education products (CFA prep, wealth management training)

The consumer trading-game market may not contain the closest competitor — professional/institutional education could be nearer.

---
---

## Next Steps (Not Implementation)

1. Determine whether the injectable-clock and simulated-evidence hypotheses actually compose with existing architecture
2. Identify the minimal architectural seam that would enable Training Mode without contaminating Real Money behavior
3. Determine whether PL-RESEARCH-03 should be promoted/reframed or whether Training Mode is a genuinely new parking-lot item
4. Evaluate whether "operating environment" should become a first-class Wheelwright primitive
5. Assess whether the simulation-for-fitness concept is independent enough to develop separately from the behavioral training concept
6. Investigate whether the simulation-control-room / simulated-world boundary maps to a real architectural separation or is purely a UI metaphor
7. Evaluate WAIT-as-first-class-action against PL-DEPLOY's existing Deployment Opportunity fitness model
8. Determine whether agent war-gaming requires fundamentally new infrastructure or could compose from existing Evidence/Policy/Decision pipeline primitives
9. Conduct competitive scan of professional/institutional portfolio-management training simulators
10. Assess whether the scenario concept taxonomy (market sim, account sim, agent sim, evaluation, harness) requires distinct architectural components or can compose from shared primitives
