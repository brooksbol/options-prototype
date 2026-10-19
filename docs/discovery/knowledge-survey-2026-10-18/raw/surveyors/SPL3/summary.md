# SPL3 Summary: `docs/parking-lot-10.md` (FULL)

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and reading
- I read all 1,724 lines (Sep 24 to Oct 17, 2026) at main bef03dd. All 158 heading segments in `coverage.tsv` are FULL: 145 extracted, 11 no-new-knowledge, 2 duplicate.
- Context: `prior-ledgers/P-parking-lots.md`. Duplicates cite `P-###` IDs in `related`.
- Outputs: 73 entries, 40 decision candidates.
- Redacted: evaluator names (29–30), real-account P/L and values (598–599), backtest capital and values (890, 904), operator objective (1470), artifact UUID (1370).

## Top 10 findings
1. **Backend authority organizes everything.** `PRIN-ARCH-BACKEND-AUTHORITY` was ratified Oct 11 (1325–1366), with three design tests and the rule "do not reopen the settled allocation question". It was applied Oct 13: ww is v2-only and tt live is a UX prototype (1497).
2. **Fetch success semantics silently reversed.** Oct 3–4: a retained prior price satisfied exit 0 despite a failed acquisition (465). Oct 5 v2: "Failed acquisition remains failure even with retained prior evidence" (522).
3. **GET purity tension.** "Held-evidence reads never acquire or revalidate evidence" is capability-scoped (545, 796). The Oct 13 facade revision removes the blanket monitoring-GET no-contact ban for retained-first read-through (1521). History also uses read-through (1585). Easy for a cold actor to over-generalize.
4. **Acceptance must use the ordinary installed workflow.**
   - "no environment variables allowed in acceptance testing" (1413)
   - exactly `ww pull && ww history` from any directory (1608, 1620)
   - Engineering ACCEPT ≠ visual or Product acceptance (ww live STOPPED, 1665).
   - Reported acceptance does not erase a later falsifier (BUG-036, 1301).
5. **Recurring non-inference principle** (180, 954, 1080, 610): "recognition is not authority"; geometry ≠ managed Position or Program membership; Unix composition cannot establish grouping, continuity, valuation, order state or governance. A consolidation candidate.
6. **ww thesis.** "The primitive is the unit of Product capability; the workflow belongs to the composer" (309, 577). Backed by agent/human Product tests (325) and the twelve-question probe (587–638), which scores answerability vs friction.
7. **ww language gate never visibly closed.** Provisional Node → durable Node (c96dc2c) → "superseded, not erased", reopened (420–449). Later slices still ship in Node.
8. **Account/User model.** Opaque Account IDs; tokens identify Users; many-to-many grants; admin ≠ financial access (925). Nicknames only; account numbers kept out of URIs and masked (1012–1019). Target-only import for mixed-account originals (939).
9. **Governed scope topology.** `Account → governed scope(s) → Operating Program/configuration → Recommendation`; Program is not account-global (172–174). The ATTACH series-key identity claim was falsified (209). ADR-022 covers only the whole-quantity opening-anchored cohort.
10. **Capability vs expression (ww accounts, 1708–1709).** The v1 Fidelity parser already classifies margin, cash and indeterminate. v2 lacks a balance/regime representation; tastytrade lacks balance acquisition. A model "unresolved delta ≠ absence" specimen.

## Top Principal statements (exact)
- "Unix commands, not War and Peace." (276)
- "Optimize Wheelwright development for the declining marginal cost of adding trustworthy capabilities." (289; not ratified)
- "Figure out how ratio spreads work and encode them as a type in ww." (295)
- "ww pull — Update WW with everything so I can start doing stuff." (1596)
- "that's good enough for now. accepted" (259)
- "acceptance tests passed." (531); "manual acceptance PASS for ww ls quotes" (558); "acceptance PASSED" (568, 1630); "acceptance PASSED; execute end of session protocol" (1654)
- "no environment variables allowed in acceptance testing" (1413)
- Color direction (1092, document paraphrase): "Record the accepted color standards in GitHub and make sure future `ww` changes adhere to them."

## Decision candidates likely not in the ADR register (register not checked)
- CLI/API: D006 language gate; D010/D013/D035 fetch default sequence (experiment → usage error → backend union); D011 fetch evidence units; D012 60-second session-aware reuse policy; D014 held-read invariant; D015 path codec (after query endpoint rejected); D033 Redocly/Pages; D034 Account-nested transactions.
- Accounts and convergence: D018/D019 User/Account authorization and target-only import; D021 color standard; D022/D023 convergence sequence and v1/tt protection.
- Method and delivery: D026/D036 installed-workflow acceptance; D030 outcome-level delegation; D037–D040 ww positions, ww live and ww accounts.

D004 (ADR-021) and D024 (principle) are already canonical.

## Contradictions and reversals
- Fetch semantics, Oct 3 vs Oct 5 (E023).
- GET purity vs read-through (E058).
- Language gate (E020).
- Entry point UNDECIDED → Account-first; the Principal chose A over ChatGPT's recommended C (E051).
- BROKER column: R3 target → "ACCOUNT as the only added column" → BROKER/ACCOUNT columns 1 and 2 (E060).
- BUG-036: accepted → rejected → resolved (E053).
- CONV-WEB artifact both "archived" and "PENDING" (1370 vs 1374; E056).
- Stale header state lines: PL-API-03 (768) and PL-CLI-01 (304).
- Prepended sections make the file non-chronological.

## Knowledge architecture and PL-CLEANUP
- Doc 68 constraints are not promoted (1263).
- The "seven distinctions" are a synthesis, not principles (1290).
- PL-API-02's broader HTTP/domain questions are deferred (663).
- PL-CLEANUP and PL-SHELL do not appear in this file; state recorded unchanged (E068).

## Coverage gaps
- Linked artifacts not read: Docs 62/66–78, contracts, design/cli/BUG records, `principles.md`.
- Most "Principal decision" text is document paraphrase.
- The "no-WW-ID decision" (1702) is not detailed here.

## Challenges to assumptions
- Prior ledger P-029 says the Node gate was later resolved. I did not observe that in this file.
- Codex implemented and Kiro reviewed independently (Step 5, 1446–1456), inverting the usual 3AM roles; the source records this as an explicit exception.
