# Principal REST API design-review intent — October 18, 2026

**Status:** Principal-stated review intent; not a new REST rule, API redesign authorization, or implementation permission.

> The principal can detect design flaws in a rest api just by looking at the uri patterns.

**Context:** During the 4AM v2 API review, the Principal corrected an assessment that concentrated on bugs, runtime behavior, and implementation defects. The requested architectural examination is first and foremost about **design flaws evident from the resource model and URI patterns**: whether the public API expresses a clean, coherent, domain-driven REST interface faithful to Wheelwright capabilities. Inspect URI topology, domain nouns, collection/instance structure, identity, nesting, and signs of workflow/provider/client leakage before shifting to implementation defect enumeration.

**Boundary:** URI inspection is an architectural diagnostic, not a claim that URI patterns alone prove every semantic property. The Principal is asking actors to foreground structural API design rather than bury it beneath bug reports. Apply existing Doc 77, Doc 82 and October 13 domain-facade/REST reconciliation authority; do not infer wholesale v2 replacement.

**Provenance:** Principal statement in the October 18, 2026 4AM roadmap session. Exact quoted sentence retained verbatim.
