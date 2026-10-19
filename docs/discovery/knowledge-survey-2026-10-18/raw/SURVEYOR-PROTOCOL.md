# Workstream B Surveyor Protocol (2026-10-18)

Classification: **internal, redacted, non-normative survey evidence. Not for publication. Not authority.**
Governing basis: ADR-023 D4/D5 (`docs/07c-adrs.md` §ADR-023). This protocol is a working method, not a ratified standard.

## Mission

Read the assigned source segments substantively and extract, with source grounding, the knowledge that a cold actor needs and that is currently buried:

- Principal statements (exact wording, with variants)
- decisions (and things that look like decisions but are not)
- domain / Product semantics (Account, Position, Contract, Construction, Operating Program, Operating Regime, Governed Quantity, Capital, Evidence, Provenance, Recommendation, Decision, Execution, Production, Outcome, and others found)
- accepted Product precedents / specimens, operator questions, capabilities
- implementation and operational witnesses (time-qualified)
- contradictions, reversals, uncertainties

You do NOT ratify, resolve conflicts, choose canonical subjects, or edit any file outside your assigned output directory. Never modify repository source documents. Never run git commands that mutate state.

## Information protection (mandatory, before writing anything)

Never write into outputs:
- account numbers (e.g. Fidelity-style `Z########`, `2627#####`), brokerage account/user IDs (`acct_…`, `usr_…`), or filenames containing them → write `[acct-redacted]`
- personal names of the Principal or family → write `Principal` (actor names Kiro, Codex, ChatGPT, Muse are fine)
- emails, device serials, UUIDs/UDIDs, API keys, tokens, credentials → `[redacted]`
- real-account balances, NAV, P&L dollar amounts of real holdings ≥ $1,000 → `[amount-redacted]` (small illustrative specimen economics such as "+$27 premium" may be kept if they are already the published point of a tracked specimen; when unsure, redact)
- contents of `.env*`, `docs/development-machine.md` hardware sections
If a quote cannot be reproduced without sensitive content, reproduce it with the redaction marker inline and set `sensitive_redacted: true`. If a source's authority/sensitivity is unclear, reference the path and line only and say "content withheld".

## Output files (write exactly these, in your assigned directory)

1. `entries.jsonl` — one JSON object per line (knowledge items, Principal statements, semantics, precedents, witnesses, contradictions):
   ```
   {"id":"<PREFIX>-E###","type":"principal_statement|domain_semantic|product_semantic|precedent|operator_question|capability|principle_candidate|rejected_design|falsified_assumption|implementation_witness|operational_witness|contradiction|uncertainty|learning|other",
    "subject":"<short subject hint, e.g. 'Governed Quantity'>",
    "statement":"<your neutral one-sentence summary>",
    "verbatim":"<exact source wording, ≤ 60 words, or empty>",
    "speaker":"Principal|Codex|Kiro|ChatGPT|Muse|unknown|document",
    "speaker_confidence":"explicit|attributed|inferred",
    "source":"<repo-relative path>","section":"<heading>","lines":"<start-end>",
    "date":"YYYY-MM-DD or empty","date_confidence":"explicit|header|inferred|unknown",
    "standing":"Principal-ratified|Principal-accepted|Principal-directed|Principal-stated|actor-proposal|actor-interpretation|hypothesis|falsified|superseded|implemented-observed|unknown",
    "applicability":"current|historical|scoped:<scope>|unknown",
    "related":["<other ids or concepts>"],"variants":["<path:line — wording>"],
    "concern":"Meaning|State|Time|Authority|mixed",
    "csvlod_hint":"Consideration|Standard|Vision|Landscape|Outline|Design|none",
    "edge_hint":"Vision|Goal|Bet|Initiative|none",
    "proposed_destination":"<provisional subject/home, e.g. 'domain-model: Account'>",
    "significance":"high|medium|low",
    "classification":"unresolved|<provisional>",
    "notes":"", "sensitive_redacted":false}
   ```
2. `decisions.jsonl` — decision candidates (including ones NOT in ADR-001–023):
   ```
   {"id":"<PREFIX>-D###","title":"","decision_date":"","date_confidence":"",
    "authority_class":"Principal-ratified|Principal-accepted|Principal-directed|actor-decided-under-delegation|inferred-from-implementation|proposal-only",
    "context":"","evidence_at_time":"","alternatives":["only alternatives actually recorded"],
    "principal_wording":"<exact, or empty>","rationale":"<as recorded; empty if not recorded>",
    "expected_consequences":"","implementation":"","subsequent":"<later learning you saw>",
    "amendments":"<reversal/supersession with path:line>","current_applicability":"current|superseded|unknown|scoped:<>",
    "subjects":[""],"sources":["path:lines"],"thread":"<provisional thread name>","notes":""}
   ```
   Do not invent rationale, alternatives, ratification or certainty. Mark empty when not recorded.
3. `coverage.tsv` — header `path	segment	line_start	line_end	depth	surveyor	item_ids	disposition	note`. One row per segment (heading-level section) you were assigned. `depth`: FULL (read every line), PARTIAL (read part; say which in note), INDEXED (headings only), SKIPPED (say why). `disposition`: `extracted` | `no-new-knowledge` | `duplicate-of:<id/path>` | `sensitive-withheld` | `deferred`.
4. `summary.md` — ≤ 80 lines: scope, what you read, top 10 findings, top Principal statements (exact), decision candidates not in ADR register, contradictions, coverage gaps, anything that challenges an assumption.

Use your assigned PREFIX for IDs. Prefer fewer, high-quality, source-grounded items over many thin ones; but do not omit consequential Principal language. Exact wording means exact: copy characters, including lowercase and typos. Line numbers must be real.

## Return message to the caller

Return ONLY: files written, counts (entries/decisions/coverage rows/FULL vs PARTIAL lines), and ≤ 12 bullet top findings. Do not return the full extraction.
