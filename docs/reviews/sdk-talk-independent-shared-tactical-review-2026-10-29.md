# Independent shared tactical result review — 2026-10-29

**Disposition: REJECT** for immutable `aa77b18c6afdc3ca06eab862aa5c30bc72bab8e7`, baseline `b67ff4493db8bb9f8a31f00e790aa0c44d8f608f`. The shared backend projection is appropriately reused, but its new CLI loses financial/source warnings and prints a false absence-of-warnings statement. A smaller half-line presentation gap also remains. These findings do not establish fabricated financial values or reverse prior bounded financial-engine acceptance.

Independent detached checkout: `/tmp/ww-independent-shared-tactical-20261029`, clean after review. Synthetic mocks only; no protected payload, provider/model request, production service, credential/grant/policy change or source mutation. No deployment or Principal acceptance is implied.

## F1 — new CLI drops supported acquisition warnings

Actual frozen controller execution with an injected market acquisition warning emits the tactical item with `warnings:[{code:MARKET_ACQUISITION_FAILED,...}]` while `warningCodes` remains empty. The new optional warnings contract permits this representation. The item branch appends source-acquisition warnings after service.tactical has derived the compact warningCodes.

The new formatter renders only item.warningCodes. Reading an otherwise valid synthetic exact tactical item through its actual HTTP adapter and formatting it prints **Warnings\tNone reported**, despite the acquisition-failure warning in item.warnings. Thus the API-to-CLI chain falsely reports warning absence precisely when a read may depend on retained evidence. The MCP wrapper correctly preserves detailed warnings, so this is not an unavoidable API limitation.

The formatter also omits metric-specific warningCodes, independently reproduced with a known spot carrying STALE_MARKET_OBSERVATION. Overall freshness STALE is still displayed in this fixture; do not interpret the finding as complete suppression of all staleness. Preserve the metric-specific source qualification as well as the common warning union. Smallest correction: propagate/commonize acquisition codes or consume detailed warnings, and render relevant per-metric warning codes. Never print None reported while any supplied relevant warning exists.

## F2 — known contractual half-line rendered as unavailable bound

A qualified range `{lower:"95",upper:null}` is a supported maximum contractual half-line. The CLI renders **95 .. Unavailable**. The unchanged native renderer correctly renders **≥ 95** on the same supplied values. The unbounded tail is known geometry, not missing evidence. Render lower-only and upper-only bounds as ≥/≤, retaining true unavailable qualification separately. This is a presentation/availability defect, not a financial arithmetic defect.

## Independent controls that passed

- Actual compiled controller with mocked collaborators invokes tactical projection, emits separate acquisition warnings, rejects collection-only selectors, preserves ordinary item evidence default, and hides a foreign Account item with404.
- Actual MCP helper returns exactly one unchanged tactical item after discovery plus one item GET, without Construction expansion or collection/history fallback. Foreign Account, changed id/self, arbitrary Construction link and wrong representation are refused. Default evidence still follows only the exact Position and its current Construction. A discovery delay exhausting the configured shared budget prevents the item hop.
- CLI reads only the exact `?projection=tactical` item, refuses foreign/malformed identities and Construction references without fallback, retains a long exact decimal and explicit unknown opening/original duration, and labels terminal geometry TERMINAL_VALUE rather than inventing profit.
- Native renderer preserves half-line, stale spot observation clock, UNKNOWN exposure with lifecycle distinction, and degraded entry/exit state without an empty progress gauge.

Source inspection confirms the only Java runtime delta is controller selection/representation handling: no PortfolioMath, OrderEvaluation, PackageEvidence, continuity, reconciliation, authorization or source-admission calculation changes. Item tactical uses the existing service.tactical path after existing synchronization and re-finds its selected resource; no new broad client fallback was introduced. Default MCP evidence is maintained and optional view is finite. OAS adds the item tactical query/response union and optional warnings; a new schema-validation run was not independently performed. Existing size guards (100000-byte exact backend/CLI, bounded common MCP transport), media type, no redirect, correlation-header and credential-reflection checks remain. No raw-original or filesystem capability is added.

The ten named author specimens are predicate/projection controls whose positive input supplies admitted authority. They do not prove tastytrade native-event completeness or solve current-held opening origin; this review does not promote them to that standing. Independent supported geometry/marks may coexist with unknown entry/tenure/progress. Historical bracket metadata remains historical, and no second financial engine was added.

## Reproduction and limits

Run `python3 /tmp/ww-independent-shared-tactical-evidence-20261029/run.py`.

Evidence in that directory: ControllerProbe.java, probe.mjs, native-probe.mjs, controller-checks.json, checks.json, native-checks.json, synthetic CLI text, recorded classpath and SHA256SUMS. The checks intentionally preserve true flags identifying observed defects; they must not be summarized as all conformance passing. Controller compilation uses exact changed source over previously recorded unchanged supporting classes and cached dependencies. Its injected collaborators test controller routing/warning behavior, not full source admission. Mockito required its experimental flag under the local newer JVM; this is a harness compatibility setting, not a production change.

Author 425-Java/64-Node/OAS, private retained same-cut DTO/SDK/browser results and real source-clock comparisons were not the independent oracle. No full build, protected replay, live acquisition or operational parity is claimed. Parent/source reports remain unchanged. Frozen candidate was not corrected by this reviewer.

CURRENT STATE: Frozen aa77b18c independently rejected for CLI warning loss; supported half-line presentation also requires correction.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable findings and synthetic falsifiers to the commissioning actor for reconciliation; any successor requires its own frozen review identity.
