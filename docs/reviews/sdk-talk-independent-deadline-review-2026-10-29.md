# Independent bounded Position deadline review — 2026-10-29

**ACCEPT for the transport-only change** at immutable `0e3c0f814509fd32b57dfe3f852e65fed3f0765f`, with the per-call limitation below.

The runtime delta changes only the three Position/Construction `readBackend` invocations in positions.mjs to `{timeoutMs:40000,...config}`. Discovery remains unchanged. No route, selector, authorization, acquisition policy, source association, valuation, financial arithmetic or disclosure projection changes. Explicit caller timeout overrides retain precedence.

My independent controlled fetch/AbortSignal probes passed:

- Monitoring consumes default deadlines `[5000,40000]` milliseconds.
- Exact detail consumes `[5000,40000,40000]`: discovery, Position, Construction.
- An explicit250ms override remains `[250,250]` for discovery/monitoring.
- An actual5.5sec Position reply succeeds past the previous5sec boundary.
- Position and Construction replies each delayed5.5sec succeed in the scoped three-read detail path.
- An explicit20ms override aborts a100ms delayed resource reply.
- A5.5sec discovery reply still aborts at the unchanged5sec discovery deadline, before any Position request.

All recorded checks passed. The deadline-observation probe temporarily instruments AbortSignal.timeout only inside its isolated test process; it does not modify application source or services.

**Acceptance limit:** these are per-call deadlines, not a shared45sec MCP tool budget. Monitoring can approach45sec including discovery, and the detail helper's nominal sequential maximum is85sec. The enclosing45sec MCP budget can therefore still expire before a slow detail sequence completes. This correction permits a cold individual resource read to exceed5sec; it does not prove guaranteed end-to-end completion or reserve response-processing headroom. Outer cancellation/timeout must not be interpreted as proof that the backend performed no permitted retention. No such stronger claim is accepted here.

Reproduction:

```sh
node /tmp/ww-deadline-independent-evidence-20261029/probe.mjs
node /tmp/ww-deadline-independent-evidence-20261029/budgets.mjs
```

Receipts: `checks.json`, `budget-checks.json` in that evidence directory. Independent frozen source: `/tmp/ww-independent-deadline-review-20261029`, clean tree. All requests use synthetic in-process fetch responses; no provider, external model, protected evidence, grant or installed service was accessed or changed. No author test or full-suite rerun is claimed.

Earlier bounded source/financial/privacy dispositions and qualifications remain. The separately reported operational grant changes and real-source comparator were not independently inspected here. This transport review establishes no financial-parity, installed-runtime, deployment or Principal acceptance authority.

CURRENT STATE: Exact 0e3c0f81 independently accepted for the per-resource timeout correction, with explicit enclosing-budget limits.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable transport-acceptance evidence for commissioning-actor reconciliation.
