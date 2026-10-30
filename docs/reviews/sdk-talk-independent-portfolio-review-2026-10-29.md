# Independent retained portfolio orientation review — 2026-10-29

**Disposition: REJECT** for immutable `b2b3869b3fac5f6e90444fcbc782ee7cd4909f1b`, parent `43a06895031716c60a1103aecd9e462823b90d81`. The core latest-retained-custody reuse and exact description projection pass bounded independent controls. Two correction points remain: final-envelope size enforcement and visible source-conflict qualification. This is not full Product/current/financial acceptance or deployment authority.

Independent clean detached checkout: `/tmp/ww-independent-portfolio-orientation-20261029`. Read the author receipt for declared scope/limitations, not as an oracle. Only invented SQLite/mock HTTP/DOM fixtures used; no protected payload, external model/provider request, installed service, grant/policy/v1 or frozen-source modification.

## F1 — guard does not bound the actual serialized result

The new100000-byte inventory guard measures `JSON.stringify([...accounts,result])`, excluding the typed envelope, requestId, outcome and qualification. A valid controlled single-Account row with a99000-character description passes and returns **100076 UTF-8 bytes** in the actual MCP result text. The raw payload remains below the common backend transport bound. This is a demonstrated boundary violation, not a claim about the reported95193-byte real result or a new original-data leak.

Smallest correction: construct the final emitted result and enforce its exact serialized UTF-8 byte bound, including qualifications/classification and every Account outcome; retain a fail-closed error rather than truncating financial/source content. The measured overrun here is small, but the advertised exact bound is currently not enforced.

## F2 — refresh/source conflicts hidden behind technical disclosure

The adapter retains collection warnings and holding warnings, but the native renderer only derives its visible status from read completion and row snapshotCoverage. Actual renderer with complete=true, COMPLETE_REPORTED rows and `SOURCE_CONFLICT` indicating a failed latest acquisition displays **Complete selected retained read** with no visible conflict code/message. Row-level TERMS_UNAVAILABLE also stays invisible. Both appear only if the operator drills into technical source JSON. The backend actually emits SOURCE_CONFLICT for a failed/rejected latest acquisition/import while preserving an older admitted cut.

The global “live completeness not established” statement and source dates are valuable and remain visible; this is not a false claim that the old cut is live. Nevertheless, withholding the specific failed-refresh/conflicted-source status removes actionable qualification from the ordinary inventory. Show a compact code/status summary for common and per-row warnings without requiring technical JSON. Preserve exact dates and separate successful pagination from source reliability; do not simply rename complete reads as failed when retained rows were correctly read.

## Independent controls that passed

Actual changed ReadService against synthetic SQLite snapshots:

- description resolves by exact Account, snapshot, holding-row key and matching native identifier;
- different cuts with the same row key retain their own description under shared request context;
- mismatched identifier withholds description;
- foreign Account read is denied by unchanged projection authorization;
- retained holding input remains unmodified.

Actual MCP helper with invented HTTP responses:

- omitted Account selects both discovered Accounts, exhausts all retained pages, and preserves explicit403 as a partial read rather than an empty Account;
- duplicate rows, changed cut and foreign-Account rows fail closed;
-20-page bound remains PARTIAL/incomplete;
- shared deadline includes discovery and prevents a later hop after expiration;
- qualification explicitly denies proof of live/current custody.

Actual native module:

- preserves distinct source rows and long exact observed quantity, partial source dates, denied scopes and deferred technical source;
- receipt-only data is labeled Received with broker observation time unavailable;
- null quantity renders unavailable, not zero.

Source inspection confirms optional sourceDescription is authorized private display evidence, not a canonical ticker or strategy mapping. Existing source identifiers/provenance remain in the typed result. No lifecycle sorting, lot merging, financial arithmetic, package recognition or current-opening association is added. Schema describes the exact description scope. Existing tt1 tactical runtime/math is unchanged by the Java delta; this review did not independently rerun a real tt1 session.

## Scope and minimum disclosure

This inventory is a broker-row view of each latest retained admitted custody cut, including historical/partial cuts. It does not establish today’s portfolio, continuous ownership or verified grouped structures across Accounts. Using it for ordinary orientation is bounded reuse; recognized tactical packages remain a distinct capability. The original Principal failure trace was not retained, so exact historical invocation diagnosis is unproven.

The typed adapter omits financial evaluations but retains detailed custody provenance and row warnings. Raw originals are not added. No independent protected-data/minimum-size measurement was made; the author explicitly acknowledges expensive repeated tool/context history rather than claiming efficiency success.95193-byte results and unverified cross-Account recognition remain Product/efficiency limitations, not independent financial parity proof. No new grant or provider behavior follows from revised tool guidance.

## Reproduction and evidence limits

Run `python3 /tmp/ww-independent-portfolio-orientation-evidence-20261029/run.py`. That directory retains DescriptionProbe.java, probe.mjs, status-probe.mjs, synthetic SQLite, checks.json, description-checks.json, status-checks.json, classpath and SHA256SUMS. Defect flags intentionally remain true and must not be summarized as all conformance passing.

Java probe compiles the exact changed ReadService over recorded unchanged support/dependencies; no new full build or OAS validation is claimed. Author193-Java/71-Talk/18-MCP/OAS, real retained SDK/browser results and51-row counts were not independent oracles. No actual model/provider/browser session or operational installation was performed. Prior immutable reviews remain unchanged.

CURRENT STATE: Frozenb2b3869b independently rejected for final-envelope bound and visible source-warning gaps; bounded custody/scope/provenance controls pass.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable findings and synthetic falsifiers for commissioning-actor reconciliation; any successor requires a new frozen identity.
