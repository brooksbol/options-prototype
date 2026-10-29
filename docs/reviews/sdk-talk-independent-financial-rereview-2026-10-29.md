# Independent focused financial re-review — 2026-10-29

**Focused disposition: ACCEPT — original finding F1 is resolved.** The complete report remains bounded to qualified reported matched closed-round-trip net P/L; broader source-coverage, Account-completeness and Principal-acceptance limits from the original review still apply.

Immutable new candidate: `77810b0b22633d47635b12c98c84ea34f4f1aac0`.
Original frozen review target: `4ffd79653f6e4efd29034ca6ccf33f1bfdec9486`.
Original immutable report: `/tmp/ww-independent-financial-review-20261029.md`, SHA-256 `7b3dd79c940459fb3ba78e7bdea668bb625923df4fd9bdc85d434f0efca36ab4`. Its bytes remain unchanged; the copy committed at `docs/reviews/sdk-talk-independent-financial-review-2026-10-29.md` has the same SHA-256. This separate report preserves the original disposition and failed-submission history.

## Scope and source inspection

The only production-code delta is one line in `ClosedTradeReport.quantities`: after aggregation by native symbol/side, each BigDecimal quantity is canonicalized with `stripTrailingZeros`. The remaining changed files are the copied original independent report and an author regression test. No author test was run or treated as independent proof.

Canonicalization occurs on the derived quantity-comparison map after summation. It does not rewrite source rows, adjust monetary values, change price precision, round quantity to a tolerance, alter association criteria, broaden Account scope or modify period/coverage semantics. Both opening and closing quantity maps traverse the same function. Negative scales produced for powers of ten are canonicalized consistently on both sides.

## Independent controlled results

An independent detached worktree at the exact new commit supplied the frozen production classes to a separate local harness. All ten newly written scale probes passed:

- The original `1` versus `1.0` counterexample now matches.
- `1` versus `1.000` and reversed scale also match.
- Summed partial fills `0.10 + 0.20` versus `0.30000`, and separately split fills on both sides, match.
- `1000.00` versus `1000` matches despite negative canonical BigDecimal scale.
- Genuinely unequal quantities, including a difference of `0.0000000000000001`, remain unavailable. No approximate equality is introduced.
- Partial quantity, zero quantity and negative quantity remain refused.

Every positive synthetic case retained the exact six-place net result from its deliberately unrounded source-net inputs. Winner and matched-trade counts also remained correct. These specimen amounts are artificial, not protected financial records.

I also re-executed my original independent review harness against the new candidate, not the author's tests or reconciliation script. F1's check changed from false to true. The current read-only retained-original audit again verified one tastytrade Account, 32 current observations, two accepted SHA-verified source originals, three matched trades and 20 matched legs. Source normalization, native contract inventory balance, package association, period membership, all three row nets, aggregate net, outcome counts and explicit charge reconciliation passed independently. All matched fee flags remain estimated. No raw amounts, private identifiers, originals or credentials were emitted or saved into review artifacts.

The two exploratory limitations documented in the original report remain observable: an unrelated unknown-time record does not suppress a known matched subtotal; artificial conflicting instrument metadata is not part of matching. This re-review does not reclassify either as an all-pass guarantee. Period completeness remains `PERIOD_COMPLETENESS_NOT_ESTABLISHED`; Fidelity/month/portfolio completeness is not established.

## Reproduction and evidence

Detached source: `/tmp/ww-independent-rereview-20261029`, exact candidate, clean source tree.
Independent evidence: `/tmp/ww-financial-rereview-evidence-20261029/`.

```sh
python3 /tmp/ww-financial-rereview-evidence-20261029/build.py
python3 /tmp/ww-financial-rereview-evidence-20261029/scale_probe.py
python3 /tmp/ww-financial-rereview-evidence-20261029/review.py
```

Receipts: `scale-checks.json`, `synthetic-checks.json`, `original-checks.json`. The separate build uses unchanged frozen financial classes plus minimal hash/cursor-exception harness substitutes, as explained in the original review. Read-only original verification depends on the available operational evidence, not an immutable private database copy. Original evidence files were preserved separately.

No candidate correction, installed service verification, deployment, grant change, external-model/provider request or unrelated working-tree mutation occurred. This is independent engineering/numerical review, not Principal Product or financial acceptance. Later source revisions require their own appropriately scoped identity/evidence reconciliation.

CURRENT STATE: Candidate 77810b0b independently accepted for the focused F1 correction; original accounting and coverage qualifications remain.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the focused review for commissioning-actor reconciliation.
