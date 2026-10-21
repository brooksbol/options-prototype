# Wheelwright API v2 — candidate foundational Portfolio resource contract

**Status:** Reviewable candidate, NOT operative OAS, implemented routes, Product acceptance, or execution authorization. Drafted after Codex adversarial disposition, October 20, 2026. Authoritative operative contract: `docs/api-v2/README.md` -> `docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml` + referenced JSON schemas. Existing domain authority: `docs/77-api-v2-architectural-guardrails.md`, ADR-016/022, `docs/knowledge/`, `docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md`. Decision handoff: `docs/discovery/api-v2-adversarial-review-dispositions-and-specification-handoff-2026-10-20.md`. Read those sources; do not promote this document above them.

## Independent API Product acceptance criteria

API v2 is coherent, navigable and reusable independent of CLI/web/agent projection. Backend owns recognition, sourced financial interpretation and evidence qualification; clients own presentation. `ww live` must consume the accepted `tt live` economic story via v2 only, not reimplement its domain. `ww positions` retains full Account inventory and partial/unclassified subjects. CLI glyphs may be lossy; economics (affine payoff segments, boundary values, units/horizon) and exact sourced/derived numbers may not be lost upstream. No Strategy, Regime execution, margin, trading/order submission, universal securities master or broker-accounting rebuild. Alpha v2 has no external backward-compatibility veto, but preserve genuine source evidence.

## Candidate resource map

| Candidate URI / existing capability | Resource meaning | Status |
|---|---|---|
| `/v2/users`, `/v2/me` | User identity, token root and explicit Account grant semantics | Existing v2 family; retain conceptual role |
| `/v2/accounts`, `/v2/accounts/{accountId}` | Custody/evidence scope, broker association, freshness | Existing v2 family |
| `/v2/positions`, `/v2/positions/{positionId}` | Independent economic Position occurrence, unique Wheelwright GUID, current qualified summary | Proposed enduring semantics; operative Position snapshots differ |
| `/v2/constructions`, `/v2/constructions/{constructionId}` | Immutable instance of held constituent composition, Account + Position associations, predecessor link | Principal-selected candidate |
| `/v2/constructions/models`, `/v2/constructions/models/{modelId}` | Reusable named model family and its exact immutable definition revisions | Principal-selected candidate; exact version-addressing syntax open |
| `/v2/orders`, `/v2/orders/{orderId}` | Observed brokerage instruction, state/conditions, legs, evidence-backed Position links | Candidate; no order submission |
| `/v2/instruments`, optional `/v2/contracts` | Financial underlying/derivative terms, broker-qualified aliases, adjustments/deliverables | Resource separation under review |
| Existing nested Account transactions | Sourced financial activity, normalized minimum, incomplete coverage | Reuse if appropriate; root `/v2/transactions` not proven needed |
| Existing source Artifacts / processing attempts | Immutable originals, attempts, results, import provenance | Prefer reuse; alternative `/v2/imports` not automatically justified |
| Existing Quotes / market observations | Source-, subject-, time-qualified observations | Current direct-quote capability exists; option legs and historical valuation need coverage |
| `/v2/positions/{id}/audit` (and item) | Optional immutable audit record of changes to mutable Position | Candidate pattern, not compulsory for all resources |
| Portfolio, Executions, independent evaluations, Brokerages collection | Possible independent subjects requiring particular use cases | Deliberately open / may defer |

**Important:** Paths above are conceptual proposals, not claims of existing API reachability. For proposed model-version addressing, `/v2/constructions/models/{modelId}/versions/{versionId}` is an *illustrative* variant only; any chosen URI must resolve exactly one immutable definition. Principal does not require an extra version field when the URI already selects the exact version.

## Identity, lifecycle and ownership

- The Position resource has a unique Wheelwright GUID; broker series identifiers are **not** Position identity and may repeat across different Position occurrences. `CLOSED` is terminal; reopening creates a new Position GUID. The Position has mutable state/current Construction link; whether source evidence establishes a closure is a separate ingestion/reconciliation question. Do not infer a fill or resurrection from repeated inventory observations. Full split/recombine edge semantics and ASSIM-0002 reconciliation remain open.
- Each Construction instance is write-once, associated with one applicable Position and Account; its `predecessor` links to the prior instance where actually supported. Creation of a successor denotes a material composition change, not quote movement or a working Order. Never mutate a predecessor or conflate corrected evidence with changed exposure.
- Model definitions are **versioned and write-once**. A Construction instance points at one immutable exact Model version, permitting historical interpretation. Model-family membership is not proof that an unclassified holding matches.
- Unrecognized / incompatible constituents remain inspectable as an `UNCLASSIFIED` Construction; recognition status is separate from evaluation status. Generic leg economics may still be valid without a known label. Preserve Adjusted-contract terms, quantities, currency, multipliers and deliverables. Mixed horizons without acceptable valuation assumptions cannot claim a unique expiration payoff.
- Broker source IDs are namespaced by source/broker and Account as applicable. Do not invent global broker contract-occurrence uniqueness.

## Proposed JSON representations (illustrative field names and mock IDs, not normative schema)

**Position, GET /v2/positions/{positionId}:**

    {
      "id": "pos-guid-101",
      "account": {"href": "/v2/accounts/acct-1"},
      "state": "OPEN",
      "currentConstruction": {"href": "/v2/constructions/con-103"},
      "sourceInstrument": {"broker": "tastytrade", "seriesId": "EXAMPLE_SERIES"},
      "summary": {
        "quantity": {"value": 1, "unit": "package", "status": "ESTABLISHED"},
        "marketValue": {"value": null, "currency": "USD", "status": "INCOMPLETE"},
        "unrealizedPL": {"value": null, "currency": "USD", "status": "INCOMPLETE"},
        "payoff": {"status": "ESTABLISHED", "horizon": "2026-11-20", "geometry": {"href": "/v2/constructions/con-103"}}
      },
      "warnings": [{
        "code": "OPTION_QUOTE_MISSING",
        "affected": ["summary.marketValue", "summary.unrealizedPL"],
        "known": "Held option constituents are established",
        "remedy": {"type": "SUPPLY_OR_REFRESH_EVIDENCE"}
      }],
      "links": {"orders": {"href": "/v2/orders?positionId=pos-guid-101"},
                "audit": {"href": "/v2/positions/pos-guid-101/audit"}}
    }

**Write-once Construction instance:**

    {
      "id": "con-103",
      "position": {"href": "/v2/positions/pos-guid-101"},
      "account": {"href": "/v2/accounts/acct-1"},
      "modelDefinition": {"href": "/v2/constructions/models/COVERED_CALL/versions/2"},
      "predecessor": {"href": "/v2/constructions/con-102"},
      "recognition": {"status": "VALIDATED"},
      "constituents": [
        {"kind": "LONG_SHARES", "quantity": 100, "sourceInventory": {"href": "SOURCE_RECORD_REF"}},
        {"kind": "SHORT_CALL", "quantity": -1, "contract": {"href": "SOURCE_CONTRACT_REF"}}
      ],
      "evaluation": {
        "horizon": "OPTION_EXPIRATION",
        "currency": "USD",
        "payoffSegments": [
          {"kind": "AFFINE_SEGMENT", "priceRange": "SOURCE_DERIVED",
           "slope": "SOURCE_DERIVED", "intercept": "SOURCE_DERIVED"}
        ],
        "status": "QUALIFIED"
      }
    }

The geometry values above are *placeholders*, not supplied by a broker or a claimed evaluated payoff. An implementable OAS must replace them with typed numeric coordinates, units, range inclusivity, valuation-horizon semantics and provenance, not literal placeholder strings. Cash and share partitions retain source allocation references, basis attribution, conservation checks and unallocated residuals; owned units and securing/collateral references must not be double-counted.

**Versioned model definition:** stable model-family identity; immutable revision URI, typed roles, units, strike/expiry/horizon compatibility, multiplier/deliverable/currency constraints, financial payoff composition and supported-recognition rules. No stored Unicode glyph template. `UNCLASSIFIED` is an explicit fallback and must not mean zero economic value.

**Observed Order:** independently identified source-qualified brokerage instruction; Account, broker Order ID, leg actions/contract refs, quantity requested/filled if reported, working/canceled/expired/filled state, trigger/limit/GTD terms and sourced target associations. Opening/closing designation is qualified. An unfilled order neither establishes nor modifies a held Construction. A GTD expiry never proves notification or automatic closure; the reported 21-DTE reminder tactic is unverified. Order-to-Position links are evidence-backed and may be absent.

## Collection/query, authority and evidence

Client chooses resource URI-only vs summary vs expanded representations by projection/search, with consistent authorization and evidence quality across each. Pagination, sorting, query syntax, error shape delegated to engineering via standard conventions. Successful resource retrieval (HTTP) differs from incomplete valuation; operation success differs from import/refresh completeness. User identity rooted in token; Account grants gate every associated Position, Construction, Order, source, Audit and expanded/historical link. Shared Model reference data may be broadly readable as authorized.

Account-wide sum of owned allocations by source cannot exceed evidenced inventory; residual not automatically confirmed free. Failure is either inconsistent source evidence or software defect, not an invitation to invent transactions. Structured warnings carry affected field, remaining reliable fact, reason and operator remedy. Broker marks must preserve source/time/quality, and mixed-source arithmetic must be explicitly supported; today's quote is not historical valuation.

## Questions reserved for specification review

1. Full Position split/recombine and lack-of-intervening-close evidence; do not silently close `ASSIM-0002`.
2. Whether Models' immutable-version path should be nested or independently version-identified.
3. Whether Order links to Positions should use filter collection or explicit relation links (semantics must remain).
4. Broker-provided entry, mark, P/L, coverage and collateral fields versus backend-calculated equivalents.
5. Whether Contracts deserve their own addressable family; whether Transactions and import endpoints reuse operative resources rather than duplicate.
6. Portfolio remains exploratory; independent Executions not required; sync job identity evidence-dependent.
7. Formal typed geometry and financial projection schemas require a concrete source/field matrix and falsification, not invented numeric data.

## Review gates

A candidate OAS must demonstrate exact shapes and qualified economics for a held multi-leg instrument, unclassified input, cash/share allocation, working closing Order, terminally closed Position/new GUID, stale/missing evidence, and unauthorized projection. Verify field-to-source coverage using `docs/discovery/api-v2-tt-live-source-coverage-matrix-2026-10-20.md`. No live brokerage action or executable modification is authorized by this document.
