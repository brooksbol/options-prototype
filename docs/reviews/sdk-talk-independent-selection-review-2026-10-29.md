# Independent named Position selection review — 2026-10-29

**Disposition: REJECT** for immutable `379746042e7fef387e6ac4639b76181be2ce5ee7`, baseline `2b2217fd`. The bounded selection implementation passes the independently executed financial/scope controls below, but its generic empty-table filter erases explicitly nonempty code content. This is a presentation preservation defect, not fabricated financial values or failure of the underlying selector. No production/Principal acceptance is implied.

Clean detached checkout: `/tmp/ww-independent-selection-20261029`. All records are invented SQLite fixtures or mocked responses. No protected payload, provider/model call, installed service, grant/policy change or frozen-source mutation.

## F1 — nonempty literal code is treated as empty table content

Actual renderMarkdown input:

    | A |
    |---|
    | `---` |

returns an empty string. The token filter decodes inline children but applies the same placeholder-punctuation removal to code_inline as to ordinary placeholder text. An explicitly quoted nonempty literal therefore disappears; adding a sole preceding heading also removes the heading as orphaned. A direct code token containing `*` has the same class of problem. This contradicts the stated preservation of nonempty code and is unnecessary to suppress whitespace/entity-only placeholder tables.

Smallest correction: distinguish code_inline from ordinary placeholder text. A code token with any decoded non-whitespace/non-format character is meaningful, including punctuation; a code token containing only whitespace can remain empty. Preserve generic financial/content semantics rather than adding question-specific parsing. My controls confirm decoded entity-only tables and their orphan heading disappear as intended, while paragraphs, zero-valued table cells, fenced punctuation code and inline zero code survive. Only the literal-code table negative is rejected here.

## Independent controls that passed

Actual exact-source PortfolioRepository.page against a synthetic SQLite store:

- ANY match accepts mixed QQQ/SPY current Construction and separately a LONG_SHARES QQQ instrument;
- historical QQQ composition does not match a current SPY Construction;
- missing underlying instrument, foreign-Account current Construction, and foreign Position do not enter the requested Account result;
- exact canonical symbol differs from lowercase;
- selector applies before limit/lookahead and continuation, yielding the correct selected IDs rather than limiting unrelated rows first.

Actual compiled controller with mocked collaborators:

- canonical Account/underlying selection metadata emitted;
- continuation retains underlying; changing QQQ to SPY with the opaque cursor returns422;
- unchanged continuation succeeds;
- reference.read is required for symbol selection, while an unfiltered authorized collection remains available without it.

Actual MCP helper with synthetic HTTP responses:

- sends underlying and preserves selected/empty scope plus the no-complete-brokerage-absence qualification;
- wrong returned selector, mismatching returned subject, foreign Account and changed continuation underlying fail closed with no broad retry;
- malformed lowercase input fails before backend requests.

Actual current-turn selection module:

- broad-to-narrow, narrow-to-compatible-complete-broad and exact-item narrowing work;
- different Account, Position/Construction identity, snapshot cut, lifecycle/exposure predicates and independent named subjects remain separate;
- complete empty named result supersedes broad; incomplete empty and failed read do not fabricate a successful replacement;
- an isolated prior-turn view remains unchanged. The app supplies only the current answer's tool views; prior message DOM is not mutated. Superseded tool results remain in source details, including raw warnings and continuation information. Visible native results retain their selected title and incomplete-page marker.

Source inspection confirms the SQL predicate is bound, Account-scoped and evaluated before expansion/acquisition membership. Existing controller reselects filtered membership after Order admission. Cursor signatures include request parameters and caller identity/grants. No financial calculation, current-opening association, source continuity, provider authorization or policy changes are present; historical metadata remains historical. Scope selection does not fill unknown entry/basis/tenure/progress.

## Reproduction and limits

Run `python3 /tmp/ww-independent-selection-evidence-20261029/run.py`. Evidence includes SelectionProbe.java, ControllerProbe.java, probe.mjs, markdown-probe.mjs, JSON results, synthetic SQLite, classpath and SHA256SUMS. The Markdown module is copied byte-for-byte except its dependency import is relocated to the existing local markdown-it package; no source code behavior is changed. The negative result is intentionally retained as punctuationOnlyCodeCellRemoved:true, not a passing conformance assertion.

Java checks incrementally compile both exact changed runtime sources against recorded unchanged supporting classes and cached dependencies. Controller collaborators are mocked; actual SQL tests use the real repository implementation. These do not claim an independently rerun full suite/OAS, private replay, actual model/browser session or installed acceptance. Author 426-Java/71-Node/OAS and real three-turn evidence were not the oracle. The failed Principal turn was not retained, so the prior broad-output mechanism remains a supported source hypothesis rather than a reproduced historical diagnosis. Earlier immutable reviews remain unchanged.

CURRENT STATE: Frozen37974604 independently rejected for nonempty inline-code table erasure; bounded underlying/scope controls pass.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable findings and synthetic probes to the commissioning actor; review any correction under a new frozen identity.
