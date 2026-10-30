# Independent Account/underlying selection review — 2026-10-29

**Disposition: ACCEPT within the bounded source scope** for immutable `4f67412ceee12a6cf512860bcaf55a70c9f3b974`, baseline f0858eb5. Required explicit scope and unavailable-narrowing presentation pass independent controlled tests. No financial, source, Product-wide or deployment acceptance is added.

Clean detached checkout: `/tmp/ww-independent-account-scope-20261029`. Actual MCP process exercised over stdio against a reviewer-owned loopback HTTP fixture. All Account metadata is invented; no protected payload, real provider/model call, installed services, grant/policy/v1 or frozen-source changes. Temporary dependency symlink and child HTTP/MCP processes were cleaned up.

## Independent tests

- Actual tools/list schema requires accountScope and rejects extra properties. Missing/invalid discriminator, missing/empty/whitespace/oversized Account, ALL plus Account (including null/empty), unknown extra field and malformed underlying fail before any backend request.
- Unknown or whitespace-padded nickname performs discovery only, never a Position read or all-Account retry. Two case-insensitive matches are unavailable rather than guessed. Uppercase PTS resolves uniquely to its discovered canonical Account.
- ACCOUNT+PTS+BDRY sends exactly that canonical accountId and underlying on the existing inventory endpoint and returns one Account. Explicit ALL_AUTHORIZED+BDRY omits accountId and returns the synthetic three-Account scope; prior named selection is not inherited.
- A known named Account returning FORBIDDEN remains that one unavailable Account. A foreign returned Account fails closed. Neither performs an all-Account fallback.
- Actual current-turn selector suppresses the earlier broad view after successful same-cut narrowing. Named FORBIDDEN, NO_RETAINED_CUSTODY, SOURCE_CHANGED and CAPACITY_UNAVAILABLE results now supersede the broad primary view even without source/items. Earlier source results remain available through the existing app disclosure loop; this does not rewrite source identity or quantities.
- Different underlying and changed-cut controls remain separate under the pre-existing policy; an isolated prior-turn result remains unchanged.

The new runtime preflight prevents underlying-only omission from silently selecting all Accounts. The MCP contract deliberately requires a scope decision rather than treating absence as intent. Account and underlying remain independent intersecting selectors; no question parser, inferred financial filter or new backend selection semantics was introduced. A model can still explicitly choose the wrong valid scope, so this is a structural ambiguity correction, not proof that every natural-language request will be understood.

## Preserved financial and authority boundaries

Git byte comparison confirms Java runtime/backend, contracts and payoff/native tactical renderer are unchanged from f0858eb5. Thus accepted geometry, terminal-value/P&L separation, exact-series reference receipts, source clocks, permissions and acquisition policies carry unchanged source. No numerical financial tests or full Java suite are claimed for this selection-only change. Existing final payload/deadline/scope validation remains in the adapter; the new preflight does not bypass it.

The underlying-only all-Account behavior is reproducible from the old schema/adapter. The original failing Principal tool trace is unavailable, so the precise prior model invocation remains unproven. The author’s passing baseline natural sequence does not disprove the reported incident, and the corrected actual SDK/browser sequence is separate author evidence. This review used neither as its independent oracle.

## Reproduction and limits

Run `node /tmp/ww-independent-account-scope-evidence-20261029/probe.mjs`. The script starts its own synthetic HTTP backend and exact frozen MCP server, checks real schema/tool-call behavior, then exercises the actual selection module. That directory contains the independent probe, checks.json and SHA256SUMS. All expected assertions pass. The review checkout remains clean.

Author26-MCP/79-Talk and real five-turn/browser scope/geometry-preservation evidence were not independently repeated. No actual external model/browser/private Account or installed operation occurred. This is not a comprehensive security audit, a new financial review, Principal acceptance or installation authority. Prior immutable reports remain unchanged.

CURRENT STATE: Frozen4f67412c independently accepted within the bounded explicit Account/underlying selection scope.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this immutable scoped review for commissioning-actor reconciliation; Principal and deployment acceptance remain separate.
