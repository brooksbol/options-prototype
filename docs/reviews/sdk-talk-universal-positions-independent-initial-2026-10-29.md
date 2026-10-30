# Independent universal tactical Positions review — 2026-10-29

**Disposition: REJECT** for immutable `74efe666aa652782706163ba07097e8aa2371d33`. One independently executed source-to-financial-to-native defect falsely promotes an issue date to Treasury maturity. The bounded conservation, permission, identity and transport controls below pass. No Principal/Product/current-custody/financial-parity or deployment acceptance is implied.

Clean detached checkout: `/tmp/ww-independent-universal-positions-20261029`. All source rows are invented and admitted only to reviewer-owned SQLite. No protected originals/payloads, provider/external-model requests, installed services, grants/policies/v1 or frozen-source mutation. Author receipt was read for scope and limits, not authority or an oracle. Existing design review remains preserved.

## F1 — arbitrary description date becomes legal maturity

PortfolioInventoryIdentity.identify takes every MM/dd/yyyy date in a fixed-income description and, when exactly one date exists, assigns it to maturity. It does not establish what that date means.

Independent direct identity input and actual synthetic Fidelity CSV admission both use native identifier912797AAA with description **US TREASURY BILL ISSUED 10/01/2026**. The frozen code emits maturity2026-10-01. Actual native rendering then says **Matures2026-10-01**, despite the source explicitly labeling the date as issue date. This is a financial identity/contract-date fabrication, not merely a formatting difference. It can turn an unknown future maturity into an apparently already matured asset.

Smallest correction: use only a supported source maturity field or explicit bounded maturity grammar (such as a documented DUE/MATURES marker). Preserve issue/settlement/arbitrary dates as source text without assigning maturity. Multiple dates with one explicitly labeled maturity should not be arbitrarily selected or confused. Unsupported or ambiguous wording remains unknown. The Treasury family identifier alone does not encode this date.

Independent evidence: IdentityProbe.java, identity-checks.json, actual synthetic-output.json from InventoryProbe, and probe.mjs which asserts that the native tree contains the false maturity. No protected data is involved.

## Independent source and financial controls

Actual synthetic Fidelity CSV admission, PortfolioSources refresh, actual reconciliation and PortfolioTacticalInventory execution:

-100 and150 same-symbol source share rows remain distinct alongside one short option and one Treasury; all four source row references occur once with original quantities;
- fallback groups have no canonical id/self and do not inherit opening economics; stale October5 source day remains visible October29;
- an explicitly constructed unique whole two-leaf declaration reuses the exact reader.tactical core structure/constituents/evaluation/currentConstruction at the same cut;
- adding an actual competing declaration makes reconciliation overallocate and the aggregate falls back without duplicate source references;
- a50-share partial declaration falls back to the whole original source inventory rather than fabricating a residual Position or duplicating the source row;
- underlying filtering retains total source count separately from represented selected count;
- removing the Position grant returns FORBIDDEN without leaking items.

The synthetic positive supplies an explicit current declaration; it does not prove native brokerage event completeness/current opening origin. Independent actual schema/native tt1 data were not used. Old-cut/all-leaf guards were inspected but not separately executed in this review. Current source selection and exact whole-allocation checks fail closed rather than resolving universal identity.

Direct option identity controls pass: source-code unknown multiplier remains null; source terms remain PARTIAL_SOURCE_TERMS; invalid calendar date and adjusted root do not acquire terms; explicit code/description contradiction is marked CONFLICTING_SOURCE_IDENTITY. No standard100 multiplier/deliverable is introduced by the parser. Existing evaluator, field-level authorization and copied metric provenance remain owners; unsupported monetary payoff falls back to a strike configuration visual. Source share-support assertions are copied with reservation/lifecycle exclusions, not newly inferred governed availability. No independent real monetary parity, full history or current opening/basis/tenure conclusion is claimed.

## API/MCP/native controls

Actual adapters with controlled HTTP responses preserve the typed aggregate with explicit denied Account after discovery plus one Positions read. Foreign Account, changed snapshot, group claiming canonical identity, duplicate source references and wrong represented count fail closed. Inventory rejects lifecycle cursor instead of retrying broad history. Exact holding detail follows only the supplied canonical source refs after discovery and rejects foreign returned Account.

Actual native tree preserves stale custody day/current-custody-unverified wording, compatibility-not-association label, meaningful strike SVG and deferred technical JSON. No market clock renews custody. Source inspection confirms normalized detail paths, bounded request budget,100000-byte final response guards, existing correlation/media/credential checks and separate metadata/holdings/Position grants. The aggregate currently requires both holdings and Position read for an Account; holdings-only callers receive an explicit denial rather than an authorized custody fallback. This is a visible restriction, not grant widening or proof that the Account has no holdings.

## R1 — nonblocking Markdown residual

Reproduced the suggested case: an empty analysis table removed between **Analysis** and a separate meaningful **Useful** section leaves the intermediate Analysis heading. Only trailing orphan headings are pruned. Meaningful following content, code and zero survive; empty lists/final orphan suppression works. This is a presentation residual, not the financial rejection basis. It should not be represented as universally eliminated empty analysis artifacts.

## Reproduction, authority and limits

Run `python3 /tmp/ww-independent-universal-positions-evidence-20261029/run.py`. Directory retains independent IdentityProbe.java, InventoryProbe.java, probe.mjs, markdown-probe.mjs, invented SQLite/JSON, classpaths, results and SHA256SUMS. Defect flags issueDatePromotedToMaturity/issueDateRenderedAsMaturity/intermediateOrphanHeadingRemains intentionally remain true; they are observed failures, not conformance passes. Markdown test copies exact module with dependency import relocation only.

Exact changed identity/parser/read/tactical/inventory/clock/plot Java sources are incrementally compiled against recorded unchanged supporting classes and cached dependencies/resources. No author test was rerun as independent proof. This is not an independently repeated full build/OAS or comprehensive API/security audit. Author207-Java/76-Talk/22-MCP/OAS, protected-copy SDK/browser sequences, real same-cut tt1 parity and operational preservation hashes are author evidence, not independently certified here. No actual provider/model/browser or installed operation occurred.

Maintained meaning and ASSIM-0002 remain unchanged: display inventory context is not universal Position identity, authoritative trade membership, governed capital or continuity. The aggregate can be a useful tactical surface while retained age/partial coverage, unknown basis and Product acceptance remain explicit. Frozen source was not corrected by this reviewer; earlier immutable reviews remain unchanged.

CURRENT STATE: Frozen74efe666 independently rejected for false Treasury maturity attribution; bounded conservation/scope controls pass and intermediate orphan heading is a nonblocking residual.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable findings and independent synthetic falsifiers for commissioning-actor reconciliation; review a correction only under a new frozen identity.
