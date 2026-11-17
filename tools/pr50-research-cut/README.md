# PR50 offline research-cut preflight

First runnable preparation slice for Portfolio's `research/pr50-webull-put-spread-cadence/` workstream. This tool reads a supplied immutable daily research cut, its exact security roster and locally retained evidence. It does not acquire data, recommend trades, load brokerage credentials, import senders, submit orders or enable execution.

Reuse boundary: PR49's proposed `pr49-pr50-underlying-research/0.1-PROPOSED` interface supplies the field vocabulary; existing PR46/PR48 raw evidence remains the source. The missing capability is an offline check that every security has an outcome and every referenced capture has the stated bytes and time classification. No new service or evidence database is introduced. This does not extend the accepted Wheelwright recommendation engine or its strategy repertoire.

```sh
python3 tools/pr50-research-cut/preflight.py cut.json --evidence-root /absolute/private/evidence
python3 -m unittest discover -s tools/pr50-research-cut -p 'test_*.py' -v
```

The roster and source manifest use paths relative to the supplied evidence root. Paths must resolve inside that root; source files remain read-only. Real captures and native broker IDs stay outside Git. Tests use invented securities and inert text only.

`cut.json` shape:

- `contractVersion`: `pr49-pr50-underlying-research/0.1-PROPOSED`
- `cutId`, `producerIdentity`, `acquisitionMode: ASSISTED`, `targetAsOf`, `producedAt`: the last two are zoned ISO times. `targetAsOf` is this profile's knowledge cutoff, not merely a market valuation date; publication may occur later.
- `universe`: `version`, `sourceStanding`, `effectiveAt`, `artifactPath`, `artifactHash`, `expectedMemberCount`. The referenced JSON roster contains `securities`, each with unique `securityId` plus `issuerCik`, `shareClass`, `symbol`, `listing`, `currency`. All six fields are compared to the member identity. Share classes remain separate; this comparison does not independently authenticate membership.
- `method`: `ruleVersion` (nullable), `adoptionStatus: PROPOSED|ACCEPTED|UNKNOWN`, `authorityReference` (nullable), `derivationVersions` object. ACCEPTED is an input assertion, never verified authority by this tool.
- `sourceManifest`: `id`, `path`, `sha256`, `receivedAt`, optional `sourceTime` (nullable). Receipt cannot exceed `targetAsOf`; source time cannot exceed receipt. HR evidence may reconstruct a prior decision, but must already exist by this cut's cutoff. A later reconstruction needs a new cut and remains HR.
- `members`: one per exact roster `securityId`; `identity` contains `securityId`, `issuerCik`, `shareClass`, `symbol`, `listing`, `currency`, `brokerContractId`, `mappingStatus`, `mappingVersion`, `gicsSector`, `classificationSourceVersion` (unknown values may be null); `acquisition` contains `outcome: OBSERVED|PARTIAL|FAILED|NOT_ATTEMPTED` and `attempts`. Only NOT_ATTEMPTED has zero attempts.
- Each member has `technical`, `market`, `volatility`, `fundamentals`, `catalysts`, containing `qualification: QUALIFIED|UNRESOLVED|UNAVAILABLE` and `evidenceReferences`. Domain-specific values/definitions/clocks remain alongside these fields; this first slice does not validate their financial meaning. Each evidence reference has `sourceId`, `classification: DV|HR|U` and `recordedAt`; DV additionally requires `decisionAt`, with receipt ≤ recording ≤ decision ≤ target cutoff. A QUALIFIED group requires nonempty, exclusively DV references. HR/U remain in unresolved groups; they cannot support a current qualified BUY.
- `research`: `outcome: BUY_RESEARCH|WAIT|EXCLUDED|UNASSESSED`, nonempty `reasonCodes`, `rationale`; BUY_RESEARCH additionally requires matching `ruleVersion`, an ACCEPTED method/authority reference, and all five evidence groups QUALIFIED with references. These structural requirements are necessary, not sufficient for a recommendation. Ranking and domain thresholds are outside this first slice.
- `unknowns`, `qualifications`: arrays on every member. Missing values are not zero.
- `coverage`: exact recomputed `attempted` (>0 attempts), `observed` (OBSERVED acquisition), `qualified` (BUY_RESEARCH outcomes), `excluded` (EXCLUDED), `unresolved` (WAIT + UNASSESSED), `notAttempted` (zero attempts). These measures overlap by design; attempted/notAttempted and qualified/excluded/unresolved are separate partitions.
- `sectorCoverage`: one exact `{sector, observedCount, qualifiedCount, totalCount}` per member sector; null sectors use `UNKNOWN`. Counts use the same definitions. Contradictory supplied summaries are refused.

This is a bounded **validation profile** of the PR49 proposal, not validation of its entire financial schema. Local artifact paths, digest fields, reference classification/decision clocks, method authority reference, acquisition enum and precise summary definitions are explicit profile additions. Metrics, bar completion, corporate actions, IVR definitions, catalysts, rank populations and qualified financial rules still require the responsible evidence owners and review. Arbitrary values marked QUALIFIED are not authenticated by the structural tool.

The output always states `executionReady: false`, `marketEvidenceVerified: false` and `authorityVerified: false`, even for a structurally valid input. It verifies local bytes, coverage and temporal consistency, not source authenticity, complete events, current membership, fundamental comparability, feed entitlement, recommendation suitability or Webull feasibility. Exit 0 means these bounded checks passed; exit 1 means refusal. No supplied input can authorize execution.
