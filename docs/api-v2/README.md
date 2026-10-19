# Wheelwright API v2 — repository contract entry point

The authoritative machine-readable entry point is [the common OpenAPI 3.1.1 specification](../contracts/api-v2-direct-quote-acquisition-proposal.yaml). Its historical filename is retained. It references [Account/evidence schemas](../contracts/api-v2-account-evidence.json) and [market subject selection](../contracts/api-v2-market-evidence-subjects.json). Resolve the local references; do not infer coverage from a filename, CLI command or generated HTML.

Humans and agents consume the same contract. Static Redocly HTML is a derived human presentation. Agents read repository OAS and linked Product/domain contracts directly; no HTML scraping, extra agent format, registry or MCP server is required.

## Semantics and authority

- [Architectural guardrails](../77-api-v2-architectural-guardrails.md): backend ownership, authoritative OAS, security, errors, correlation, clocks, provenance, partial success, collection and read-through boundaries.
- [Quote acquisition](../contracts/api-v2-direct-quote-acquisition-proposal.md): explicit subjects, reuse/force, per-subject fulfillment, retained prior evidence and repeatability.
- [Held discovery](../contracts/api-v2-held-quotes-read.md) and [held instance](../contracts/api-v2-subject-show-held-quote.md): provider-free reads, complete committed representations, decoding, concurrency and missing evidence.
- [Accepted Account/evidence behavior](../cli/ww-account-evidence.md): stable IDs, artifact retention versus admission, source confidentiality and Position limitations.
- [Approved history checkpoint](../design/ww-history-approved-checkpoint-2026-10-15.md) and its linked Product design; [accepted integrated delivery](../design/ww-integrated-update-candidate-2026-10-15/README.md): nested history, bounded read-through, original evidence, source identity and incomplete/lifetime coverage limits.
- [Portfolio Capital](../foundations/portfolio-capital.md) and [accepted bounded history](../design/pl-cli-01-portfolio-capital-history.md): qualified composites and gaps.

Authentication, explicit grants and application configuration determine API availability to a caller. OAS advertises capabilities; it does not authorize an agent to invoke them. Current Principal/task authority separately governs operational acquisition, persistence, deployment and other consequential actions. Resource IDs confer no permission. Administrator User inspection grants no blanket financial access. Internal-only description blocks remain part of authoritative OAS and must be read with standard security requirements and `x-required-grants`.

Only accepted `/v2` operations are in this documentation product. Legacy `/api` and future web-client migration are outside its scope. Original specification-phase footers in linked contracts must be reconciled with their later accepted-delivery records; they are not independent current execution grants.

## Build and verification

See [the pinned static-reference tooling](../../tools/api-docs/README.md), the [read-only agent specimen](../../tools/api-docs/agent-specimen.md) and [PL-API-02 requirements/plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md). Step 2 supplied author evidence for both consumption methods, and independent Step 3 review preceded the October 15, 2026 publication ([publication evidence](../reviews/pl-api-02-pages-publication-2026-10-15.md)). Later changes follow the [adopted update procedure](../bootstrap/api-v2-documentation-update-procedure.md), including its accepted-identity and independent-review gates.
