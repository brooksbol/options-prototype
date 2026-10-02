# Iron Condors ETF + index offline qualification ledger — 2026-10-01

**Status:** Candidate-scope research artifact on a separate branch; not production admission, live optionability, an Exit Reliability revision, or an instruction to acquire market data. **Principal scope decision:** ETFs and index-option products now; single-name equities out of scope.

`class-ledger.csv` is the complete in-scope and provisional-scope class ledger derived by `derive.py` from the frozen Pass −1 archive. `summary.json` supplies denominators, state counts, hashes, and all 40 index underlyings; the ledger enumerates their 54 distinct OCC classes. Reproduce offline with `python3 data/research/iron-condor-etf-index-ledger-2026-10-01/derive.py` from this checkout. The script verifies the archive, population, class-analysis, and each consumed provider body against their frozen SHA-256 hashes. It makes no network requests.

## Counts through the cheap gates

| Stage / cohort | Underlyings | Classes | Exact provider root | Same-expiration listed four-leg shape | Identity unresolved | Shape absent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen OCC discovery population | 6,072 | 6,381 | — | — | — | — |
| Cboe-labeled ETF | 1,643 | 1,766 | 1,741 | 1,741 | 25 | 0 |
| OCC-name ETF candidate, no Cboe exact record | 445 | 453 | 451 | 450 | 2 | 1 |
| Cboe-labeled ordinary index | 24 | 36 | 29 | 29 | 7 | 0 |
| OCC `IU` index candidate, no Cboe exact record | 16 | 18 | 12 | 12 | 6 | 0 |
| **ETF + index qualification ledger** | **2,128** | **2,273** | **2,233** | **2,232** | **40** | **1** |

The product-type gate excludes **3,659 single-name equities / 3,819 classes** immediately. It also excludes ten Cboe `OTC` products/classes, seven OCC `IU` foreign-currency-option products/classes (`XDA`, `XDB`, `XDC`, `XDE`, `XDN`, `XDS`, `XDZ`), and the binary-payoff `XSPBX` / `XSPBW` product/class. The latter is an index-linked binary contract, not an ordinary four-leg condor option class. **267 underlyings / 271 classes** with neither exact Cboe type nor explicit ETF name nor index `IU` evidence remain **product-type unresolved**, not proved out of scope. These disjoint counts reconcile to 6,072 / 6,381.

The geometry gate decodes the archived Tradier option-symbol strings **within each exact root and expiration**. A minimal shape requires at least two distinct put strikes and two distinct call strikes, with a put strike below a call strike. It establishes a dated listing possibility only. The sole root-resolved class without this shape is OCC-name ETF candidate `SMCF`, which had only one put strike at each of its two observed expirations. Its state is **dated structural failure**, not permanent exclusion. The 40 identity-unresolved classes remain visible rather than being turned into negative market findings. Among all ledger classes, 2,184 had at least one such expiration at 21–100 DTE and 1,108 had at least two **on this snapshot date**. These are planning attributes, never a fixed DTE admission rule; Pass 0 demonstrated strong calendar-phase sensitivity.

## Index augmentation

The 40 index underlyings are `BKX`, `CBTX`, `DJX`, `HGX`, `MBTX`, `MGTN`, `MRUT`, `MXACW`, `MXEA`, `MXEF`, `MXUSA`, `MXWLD`, `NANOS`, `NDX`, `OEX`, `OSX`, `RLG`, `RLV`, `RUI`, `RUT`, `SIXB`, `SIXC`, `SIXE`, `SIXI`, `SIXM`, `SIXR`, `SIXRE`, `SIXT`, `SIXU`, `SIXV`, `SIXY`, `SPEQX`, `SPESG`, `SPX`, `UTY`, `VIX`, `XAU`, `XEO`, `XND`, and `XSP`. Their **54 exact classes** and individual states are in the ledger and summary. This is the complete index-shaped OCC Pass −1 population under the declared ordinary-contract/product-type rule, not proof that all 40 are currently broker-supported or economically appropriate.

Of the 54 index classes, **41** had an exact provider root and a listed four-leg shape; **13** were identity unresolved. Unresolved classes are `CBTX`, `CBTXW`, `DJX9`, `MBTX`, `MBTXW`, `RUT9`, `SPX9`, `RLG`, `SIXC`, `SIXE`, `SIXR`, `SIXT`, and `SIXY`. `SPX` and `SPXW` are separate observed classes; `XSP` is another observed class. The earlier 2026-10-01 bounded Pass 1 pilot independently captured Tradier chains for all three. `SPX9` was not observed in the SPX provider lookup and remains unresolved. No index score is invented here.

The index set is heterogeneous. Before representative qualification, confirm contract payoff, multiplier, settlement/exercise, reference-price meaning, and intended tastytrade workflow by exact class; give particular attention to `VIX`/`VIXW`, `NANOS`, older sector indexes, and the OCC-only index candidates. A listed strike lattice does not settle those questions. Index classes with no 21–100 DTE four-leg date in this snapshot (currently `NANOS`) remain dated unavailable for that probe, not permanently excluded.

## Next evidence boundary

The next cheap gate needs a **bounded, dated** check of exact-class expirations, relevant strike range, usable underlying or index reference, four simultaneous two-sided leg quotes, and coarse size/activity. Existing production evidence may answer some fields; unavailable fields must stay unknown. A representative four-leg specimen and broker/workstation support check follow. Only classes that survive those gates warrant Exit Reliability capture/calculation. Quote/OI/volume thresholds and a risk-comparable specimen rule are not adopted by this ledger. Synthetic leg midpoints cannot establish complex-order fills.

The 1,641 PR #33 ETF scores join by ETF underlying to this ledger as separate dated Exit Reliability evidence. All 1,641 score symbols match the 1,643 Cboe ETF cohort exactly; only `BLCN` and `TXS` lack scores because they had no usable underlying price. This reconciliation gives no reason to discard or recalculate those scores. It does not transfer an ETF score to another class, nor does it imply an index score. Candidate-scope membership, qualification state, score evidence, and eventual production admission must remain separate records.

## Ownership for later implementation

- A versioned **product-scope decision** defines ETF and ordinary index-option inclusion, single-name exclusion, and class-term exceptions. It refers to discovery-source identities without rewriting them.
- The Java evidence appliance stores dated, class-keyed provider observations and derived qualification states with rule version, evidence timestamp, source hash, and explicit `unresolved`/`unavailable`/`failed` reasons.
- Derived Exit Reliability evidence has its own method version, observation date, exact class/root and source hashes. The PR #33 ETF artifact is one dated input, not the candidate-universe table.
- Deployment eventually reads a joined candidate view from the appliance. A score can be absent while the candidate remains discoverable and its qualification state remains inspectable. Production admission is a separate policy decision.

This ledger is deliberately an **offline cheap-gate result**, not a full Pass 0 census and not authorization to use the `21–100 DTE` diagnostic as a structural veto.
