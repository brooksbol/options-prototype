# Independent cf84 interaction-review addendum — 2026-10-29

**Additional finding F2: confirmed. Frozen disposition remains REJECT.**

Target: `cf84e6346968e9df6751c1a5208b2d3bb84788be`.
Original immutable report: `/tmp/ww-independent-interactions-review-20261029.md`, SHA-256 `80cb32b5a9b2998cca05dd12c38ca3e63da0c7ad8b766fccd220f642757a1d1a`.

The implementation owner identified a possible source-clock display error after the original report was frozen. I independently reproduced it against the frozen renderer; this addendum preserves the original report unchanged.

`tools/talk/ui/tactical.js` emits `Observed <spot.asOf>` whenever asOf exists, without checking whether spot is an established PRICE. The backend's unknown PRICE initializer uses evaluation time as asOf; it is not an observed market-event clock. Thus an INCOMPLETE null-valued spot can show a dash and simultaneously claim a fresh observation at the evaluation time. This violates the existing distinction between evaluation and source observation clocks.

Independent exact probe:

```sh
node /tmp/ww-interactions-independent-evidence-20261029/spot_clock_probe.mjs
```

The probe calls the actual native renderer with a synthetic INCOMPLETE PRICE, null value and asOf equal to evaluatedAt. `spot-clock-check.json` records `unknownSpotClaimsObservation:true`. It uses no protected records, browser service, provider or model request. Backend PortfolioMath initializes unknown spot in precisely this way, so this is a supported unavailable-metric representation, not an invented source clock.

Smallest correction: require an established/qualified known PRICE and a genuine supported source clock before labeling it Observed. Unknown/evaluation-time fallback must remain unavailable as an observation; keep independently qualified package clocks separate. The proposed later source correction is unreviewed here and requires its own immutable identity.

CURRENT STATE: Frozen cf84e634 remains independently rejected; F1 valid-size image failure and F2 unknown-spot observation claim are preserved separately.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this immutable supplemental finding for implementation-owner reconciliation.
