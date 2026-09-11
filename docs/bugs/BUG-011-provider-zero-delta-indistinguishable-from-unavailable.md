# BUG-011 — Provider-reported exact-zero Delta is rendered indistinguishably from absent Delta evidence

**Status:** Open  
**Severity:** Not established  
**Area:** Operator Console / Greeks evidence presentation  
**Recorded:** 2026-09-11

## Defect statement

Provider-reported exact-zero Delta is rendered indistinguishably from absent Delta evidence.

Raw provider `delta=0.0` is semantically distinct from null or an absent Delta field. Wheelwright preserves that distinction through backend evidence, but frontend sanitization collapses exact zero to null and presentation renders the resulting null as unavailable.

This record does **not** assert that Tradier's exact zero is necessarily a precise sensitivity. It may reflect provider/model rounding, degeneracy, or another provider semantic. The verified defect is the loss of distinction between an explicit numeric provider observation and absence of evidence.

## Provider study — after-hours baseline

On 2026-09-11, a raw-provider empirical study used the same Tradier Production API request shape as accepted Wheelwright main:

- production base URL `https://api.tradier.com/v1`;
- Wheelwright-equivalent expiration discovery;
- Wheelwright-equivalent quote acquisition;
- option-chain requests with `greeks=true`;
- raw provider values inspected before Wheelwright sanitization or zero-as-unavailable presentation rules.

The study sampled 740 primary contracts across:

SPY, QQQ, IWM, GDXJ, SMH, URA, COPX, UNG, BNO, PDBC, WEAT, DBO.

Observed in this collection window:

- 683 / 740 (92.3%) had nonzero Delta.
- 57 / 740 (7.7%) had exact numeric `delta=0.0`.
- 0 / 740 had null, absent, or unparsable Delta.
- 37 of the 57 zero Deltas were all-zero five-Greek vectors.
- 20 had `delta=0.0` while at least one other Greek was nonzero.
- Every sampled ATM and ITM contract retained nonzero Delta, including at 0 DTE.
- Every observed exact-zero Delta occurred in the sampled 5% or 10% OTM bands.
- Exact-zero Delta appeared as far out as 14 DTE in the sample.
- Repeated nearest-to-0-DTE requests for SPY, URA, COPX, and UNG were stable across three calls: no zero/nonzero/null/absent transitions.
- The observed URA 0-DTE ~5% OTM call reproduced the product symptom directly: raw `delta=0.0` with nonzero Gamma.

The evidence therefore does **not** support a universal statement such as "Tradier Delta stops appearing below X DTE." The observed pattern is primarily moneyness × DTE dependent, with symbol/contract characteristics and side as possible secondary modifiers.

### Scope qualification

The collection occurred after the regular market close. It is a cross-sectional provider observation, not evidence that the same Greek behavior occurs during the regular trading session. The absence of null/absent/unparsable Delta applies only to this 740-contract sample and does not establish that Tradier never emits those states.

## Deferred regular-session control

The Principal does not trust after-hours Greek behavior as sufficient evidence for regular-session behavior.

**Do not remediate BUG-011 on the basis of the after-hours study alone.**

Rerun the same empirical study during regular U.S. trading hours. Preserve the after-hours dataset before rerunning so that the two studies can be compared rather than overwritten.

The regular-session run should intentionally keep the study design unchanged:

- same Wheelwright Production Tradier API calls;
- same endpoint shapes, query parameters, headers, and `greeks=true`;
- same required symbol universe;
- same expiration/DTE selection;
- same call/put and moneyness sampling;
- same raw-value classification;
- same repeated-call stability test;
- no Wheelwright sanitization or UI interpretation.

Prefer a normal regular-session observation rather than the opening minutes; approximately 12:00 ET / 10:00 MT is a suitable target.

### Required comparison

Compare the after-hours and regular-session observations, contract-for-contract where expiration and strike remain comparable, with particular attention to:

1. exact-zero Delta frequency;
2. all-zero Greek-vector frequency;
3. `delta=0.0` with other Greeks nonzero;
4. null/absent/unparsable Delta;
5. actual numeric Delta changes for matching symbol / expiration / strike;
6. whether the moneyness × DTE zero pattern persists during regular trading.

Interpretation boundary:

- If exact zeros/all-zero vectors largely disappear during regular hours, treat session/freshness semantics as a material part of the provider-evidence problem.
- If comparable exact zeros persist during regular hours, confidence increases that the after-hours study identified stable provider behavior rather than an off-hours artifact.

## Acceptance boundary if/when remediation is considered

This is recorded for defect semantics, not as authorization to implement a fix:

| Raw provider state | Required distinction |
|---|---|
| Exact numeric `0.0` | Visible explicit zero |
| Null or absent | Unavailable |
| Tiny nonzero | Visible without rounding to a false zero |
| All-zero vector | Preserve raw zeros; any evidence-quality warning is a separate semantic layer |

Suspicion about evidence quality may justify a cue. It does not justify rewriting explicit numeric observations into absence.

## Current decision

Persist the defect and empirical evidence. **No fix now.** Complete the regular-session control before using the provider study to make stronger claims about Tradier Greek behavior or before revisiting remediation.
