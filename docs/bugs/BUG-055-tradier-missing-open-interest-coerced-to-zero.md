# BUG-055 — Tradier adapter turns missing open interest into 0

- **Status:** Open. Filed October 29, 2026 as a documentation-only record. Remediation is not authorized.
- **Severity:** Not established (the Principal has not assigned one)
- **Area:** Evidence Appliance (v1 backend) / Tradier provider normalization (`TradierAdapter`, `MarketChain.OptionContract`)
- **Provenance:** Kiro zero-OI investigation in the October 27–29, 2026 Options Market Liquidity — observed session (`PL-EVID-OBS`). The Principal reviewed the finding and said: "The identified backend missing-to-zero conversion deserves its own defect record; it should not automatically expand the current v1 workstream." The Principal then directed this filing in the v1 commit task.

## Observed defect

When the provider omits `open_interest` for a contract, or sends it as null or unparseable, the published evidence carries `openInterest: 0`. A reported zero and a missing value cannot be told apart downstream.

The adapter replaces a missing value with 0 in two places:

1. `parseOptionObject` (`TradierAdapter.java`, about line 755): `obj.put("open_interest", (int) extractDouble(json, "open_interest"))`. `extractDouble` is the legacy extractor; its documented behavior is "missing/null/unparseable → 0". Its comment justifies this by saying `open_interest` is "always present".
2. `getInt(Map, key)` (about line 796) returns `0` for any value that is not a `Number`. It is used at about line 562: `int openInterest = getInt(opt, "open_interest")`.

`MarketChain.OptionContract` declares `int openInterest` (a primitive), so the evidence model cannot represent "unavailable" even if the parser kept it.

## Evidence

Established from source at the October 29, 2026 `main` base. TradierAdapter last changed at `4fd3ad1e`.

- One read-only Tradier call for SPY 2026-12-11 puts returned `open_interest: 0` for all 19 contracts, as a numeric 0. So the **observed** zero-OI specimen (a newly listed expiration showing 100% zero OI across 3,380 contracts in the snapshot) is a real provider zero, not this defect.
- This defect is the **latent** path. A missing or null provider value would be published as the same 0. No live specimen of a missing value has been captured.

## Intended semantics violated

- **Persist facts; derive trust.** An observation's absence is a different fact from an observed zero. The adapter makes up a value.
- The same adapter already applies the correct rule to greeks and IV (`extractNullableDouble`, "No greek is fabricated as zero"). Open interest does not get that treatment.
- Consumers cannot apply missing-versus-zero rules. Since October 29, 2026 the v1 Options Market Liquidity table counts unavailable OI separately (`oiUnavailableContracts`) and keeps it out of the OI sum and the liquid-share denominator. That rule never fires for Tradier data, because the backend never publishes a missing OI.

## Consequences

- A contract with missing OI is graded as if OI were 0: Liquidity grade L4, counted as not liquid. That affects the Cash Deployment Liq grade and the observed liquidity table.
- OI sums treat missing values as 0.

## Scope / non-goals

- In scope: open-interest normalization from the Tradier payload into published evidence.
- Noted but not filed here: `volume` follows the same zero-default pattern (`(int) extractDouble(json, "volume")`). It needs its own decision.
- Not in scope: frontend handling, which already separates unavailable from zero. Also out of scope: liquidity-grade thresholds, the 250-OI L2 rule, acquisition, cadence and the snapshot contract version.
- Fixing this probably changes the published value from `0` to `null` for missing OI. Any such change must be checked against the frozen v1 snapshot contract (`docs/contracts/evidence-snapshot-v1.md`) and every v1 consumer before implementation.

## Acceptance criteria (for a future authorized remediation)

1. A Tradier option payload with `open_interest` omitted, null or unparseable publishes as unavailable, not `0`.
2. A payload with `open_interest: 0` still publishes `0`.
3. The snapshot-contract impact is decided explicitly, either as a compatible change or as a version transition.
4. Existing v1 consumers treat unavailable OI deliberately (the v1 liquidity table already does).

## Remediation history

None. Filing does not authorize remediation (`docs/bugs/README.md`).

## Related

- `docs/parking-lot-9.md`: `PL-EVID-OBS` and the TT1 scope clarification.
- `options-prototype/src/write-desk/symbol-liquidity.ts`: `oiUnavailableContracts` and `zeroOiContracts`.
