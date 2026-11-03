# BUG-058 — TT1 Greek subscription exceeds DXLink message limit

- **Status:** Open
- **Severity:** Not established
- **Area:** CLI / TT1 Greek acquisition
- **Provenance:** Principal direction, November 3, 2026: “resolve Greek acquisition,” after observing the readable export had incomplete Greeks and no qualified positive-natural-credit candidates.

## Observed failure

The November 3 export requested 2,708 Greek subscriptions in one 119,011-byte message. Live DXLink returned `ERROR / INVALID_MESSAGE`; no Greek data frames followed. The reader ignored that protocol error and returned an empty snapshot after its timeout. The prior 1,056-contract October 30 run had fit inside the provider limit.

## Intended semantics violated

The existing bounded universe must be subscribed without exceeding the provider's per-message transport limit. Partial/missing Greeks remain explicit; a fresh REST quote timestamp must never substitute for an independent Greek event timestamp.

## Evidence / diagnosis

A three-contract control returned all three independently timed Greeks in approximately 620 ms, demonstrating working credentials, handshake, symbology and parser. The full 2,708-contract control received `INVALID_MESSAGE` immediately after its oversized subscription and zero data frames, including with a 20-second observation window. Increasing the timeout does not fix a rejected message.

[dxFeed's official FAQ](https://kb.dxfeed.com/en/faq.html) requires messages below 64 KB and recommends 200-topic subscription batches. [Tastytrade streaming guidance](https://developer.tastytrade.com/docs/concepts/streaming/) documents incremental subscription messages on a single feed connection. No new provider or pricing/Greek model is required.

## Consequence

Otherwise successful exports contain no independently qualified short deltas and therefore no admissible current-entry candidates. This is an evidence-acquisition defect, not proof that suitable candidates are absent.

## Scope / non-goals

Reuse the existing single socket, token, exact catalog streamer identities, acquisition deadline and 6,000-contract cap. Split subscriptions into 200-topic messages, reset only the first message, append all remaining topics, and guard serialized message bytes below 60 KiB. Surface protocol errors as bounded codes without copying raw server text. No retry, extra socket, credential/grant, market-policy, financial-model, service, brokerage-order or freshness-threshold change.

## Acceptance criteria

All requested subscriptions survive batching without reset loss or duplication. The 6,000-contract maximum passes a simulated provider message cap; protocol rejection fails promptly without exposing raw text. A real full-universe export carries complete independent Greek coverage and verifies the existing freshness gates, inventory and all six ZIP members/hashes. Record installed verification separately from tests or Principal acceptance.

## Remediation history

Correction is on the existing exporter repair branch `codex/tt1-export-hang-20261103`, continuing the Principal's bounded repair instruction and prior direction to push without independent review. No independent-review claim is made. Installation verification remains pending at this source freeze.

## Verification

33 focused tests passed, including 6,000 subscriptions across 30 messages with exactly one reset, preservation of every identity, old/stale/missing Greek rejection, unchanged absolute deadline, prompt protocol-error handling, helper exit and large ZIP publication. One private historical fixture was unavailable and skipped.

Real candidate export `tt1-cadence-2026-11-03-20261103165422787.zip` acquired all 2,708 requested Greeks in 32.387 seconds of market acquisition with zero acquisition/read failures. It contained 3,848 qualified indicative pairs; each qualified short retained an independently verified nonfuture Greek event no older than 120 seconds. Six-member CRCs, all five payload hashes/lengths and exact requested/observed Greek identity sets verified. This establishes acquisition/freshness behavior, not executable prices, a trading recommendation, complete held-margin evidence or Principal Product acceptance.

## Related

[BUG-057](BUG-057-tt1-export-hangs-and-exceeds-package-capacity.md); `docs/cli/tt1-market-freshness-2026-10-30.md`.
