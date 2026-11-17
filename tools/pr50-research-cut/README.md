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
- `cutId`, `producerIdentity`, `acquisitionMode: ASSISTED`, `targetAsOf`, `producedAt`: zoned ISO times.
- `universe`: `version`, `sourceStanding`, `effectiveAt`, `artifactPath`, `artifactHash`, `expectedMemberCount`. The referenced JSON roster contains `securities`, each with a unique `securityId`; share classes remain separate.
- `method`: `ruleVersion` (nullable), `adoptionStatus: PROPOSED|ACCEPTED|UNKNOWN`, `authorityReference` (nullable). ACCEPTED is an input assertion, never verified authority by this tool.
- `sourceManifest`: `id`, `path`, `sha256`, `receivedAt`, optional `sourceTime` (nullable).
- `members`: one per exact roster `securityId`; `identity` contains `securityId`, `issuerCik`, `shareClass`, `symbol`, `listing`, `currency`, `mappingStatus`, `mappingVersion`, `gicsSector`, `classificationSourceVersion` (unknown values may be null); `acquisition` contains `outcome` and `attempts`.
- Each member has `technical`, `market`, `volatility`, `fundamentals`, `catalysts`, containing `qualification: QUALIFIED|UNRESOLVED|UNAVAILABLE` and `evidenceReferences`. Domain-specific values/definitions/clocks remain alongside these fields; this first slice does not validate their financial meaning. Each evidence reference has `sourceId`, `classification: DV|HR|U` and `recordedAt`; DV additionally requires `decisionAt` and receipt/recording no later than that decision. HR/U never become DV through a later timestamp.
- `research`: `outcome: BUY_RESEARCH|WAIT|EXCLUDED|UNASSESSED`, nonempty `reasonCodes`, `rationale`; BUY_RESEARCH additionally requires matching `ruleVersion`, an ACCEPTED method/authority reference, and all five evidence groups QUALIFIED with references. These structural requirements are necessary, not sufficient for a recommendation. Ranking and domain thresholds are outside this first slice.
- `unknowns`, `qualifications`: arrays on every member. Missing values are not zero.

The output always states `executionReady: false`, `marketEvidenceVerified: false` and `authorityVerified: false`, even for a structurally valid input. It verifies local bytes, coverage and temporal consistency, not source authenticity, complete events, current membership, fundamental comparability, feed entitlement, recommendation suitability or Webull feasibility. Exit 0 means these bounded checks passed; exit 1 means refusal. No supplied input can authorize execution.
