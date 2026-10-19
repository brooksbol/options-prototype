=== Context Gathering Summary ===
FOUND: Status lines for all S1 Markdown files. Full reads of the TT Live economic story, ww positions presentation and command, ww accounts, the ww live plan, session stop point and P2 disposition, CF01–CF12, ww-man, the REST facade reconciliation, managed-position specimen, payoff contract, pull UX, update clarifications, the held-quotes read contract, 4AM round 6, tt-live-panel, the history checkpoint and the GitHub Pages checkpoint. Targeted reads of tt-live history, held-quote design/codec, the URI table, show-quote color amendments, Account colors, step3 "simple beauty", Portfolio Capital acceptance, the history disposition, PL-API-02 and bootstrap uniques.
NOT FOUND: No hits for "worst kind of correct" or "personal objectives". These were not read in depth: the ww-live evidence manifests and OAS, design decompositions (lvt, lifecycle, recipe, hold-vs-close), most discovery docs, ww-fetch acceptance details, the body of ww-show-man.txt, and the project-memory/end-of-session protocol bodies. Payoff and tastytrade screenshot binaries are not in the repo (SHA only).
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
S1 KNOWLEDGE SURVEY (read-only, HEAD bcbc291). Line numbers come from read_file output or grep -n. Where I worked a line out from its section position, it is marked "~". "Verified" means I read the text. "Inferred" is labelled.

## 1. COVERAGE LEDGER
Ratings: FULL = read completely. PARTIAL = targeted sections or grep. HEADER = status line only. NR = not read; these are machine evidence such as json, log, patch or ansi files, and only their existence is noted.

docs/design
- tt-live-economic-story/README.md (90): FULL. TT Live economic-state visual contract. Self-status: "qualified Principal Product acceptance, Oct 14".
- tt-live-economic-story/design-history.md (239): PARTIAL (grep of Principal, reject, font). Iteration history with rejected glyphs. Self-status: historical, superseded.
- tt-live-economic-story/verification.md (92): PARTIAL. Engineering evidence, including the acceptance-path failure and the skull acceptance.
- tt-live-economic-story/specimens/* (24 files): NR. Terminal specimens A/B with and without P/L: observed, no-exits and scenarios, in Unicode/ASCII and ANSI/plain.
- ww-positions human presentation: see docs/cli.
- ww-accounts-2026-10-17/README.md (302): FULL. PARKED discovery with mocks A–D and a gap analysis. Self-status: "PARKED DISCOVERY; command NOT implemented".
- ww-accounts-2026-10-17/verified-facts.json (144): NR. Masked identity, grants and source hashes.
- ww-live-product-plan-2026-10-16.md (85): FULL. ww live Product decisions, with supersessions. Self-status: Principal-directed planning; ends STOPPED.
- ww-live-session-2026-10-16/README.md (67): FULL. Stopping point. Self-status: "STOPPED… Principal visual acceptance has NOT passed".
- ww-live-session-2026-10-16/evidence/** (about 50 files: manifests, independent reviews, proposed OAS, logs): HEADER/NR. The p1-design/p2-design independent-review.md files were seen only through grep hits.
- ww-live-p2-principal-disposition-2026-10-16.md (20): FULL. Principal APPROVE of P2, with two findings DEFERRED.
- ww-live-integrated-specimen-2026-10-16.md (35), ww-live-visual-parity-specimen-2026-10-16.md (39), ww-live-p2-backend-specimen-2026-10-16.md (42): PARTIAL. Isolated synthetic specimens. Status: engineering ACCEPT, not Product acceptance.
- api-v2-domain-facade-rest-reconciliation-2026-10-13.md (46): FULL. Principal REST/facade intent. Self-status: "PRINCIPAL CLARIFICATION INCORPORATED INTO RATIFIED V2 GUARDRAILS".
- ww-show-positions-v2-architectural-proposal-2026-10-13.md (403): PARTIAL (§1–2). URI table and domain concepts. Self-status: REVISED PROPOSAL, Principal review pending.
- pl-conv-01-managed-position-visual-acceptance-specimen.md (27): FULL. Principal-confirmed visual acceptance target (Oct 13).
- position-payoff-visual-contract/README.md (36): FULL. CC/CSP rising-then-flat shape accepted; other shapes proposed.
- position-payoff-visual-contract/golden/README.md (15): HEADER. "proposed Product golden candidates, not Principal-accepted".
- position-payoff-visual-contract: structures.json, tests, golden txt, png: NR.
- ww-pull-ux-feedback-2026-10-15.md (40): FULL. git pull as the UX benchmark. Self-status: Principal UX feedback / intake only.
- ww-history-approved-checkpoint-2026-10-15.md (12): FULL. Principal approved the design and authorized implementation.
- ww-history-product-and-technical-proposal-2026-10-15.md (197): PARTIAL (grep plus the review disposition table). Self-status: "PROPOSED" Rev 2. It is superseded by the approved checkpoint.
- ww-history-candidate-2026-10-15/README.md (63): PARTIAL. Acceptance-path rejection of the isolated preview.
- ww-history-specimens-2026-10-15/*, ww-history-candidate-2026-10-15 data files: NR. 21-record specimens.
- ww-integrated-update-candidate-2026-10-15/README.md (37): HEADER/grep. Accepted pull/history delivery e6e3b55.
- ww-show-held-quote-solution-design.md (275): PARTIAL (§1–3, §12–14, line 251). ACCEPTED Solution Design.
- ww-show-held-quote-transport-reconciliation.md (187): PARTIAL (§1–2, §9). Path codec, accepted.
- pl-api-02-v2-documentation-requirements-plan-2026-10-15.md (267): PARTIAL. Principal Product acceptance PASSED.
- api-documentation-github-pages-product-checkpoint-2026-10-15.md (48): FULL. Option B approved: static Redocly on GitHub Pages.
- pl-conv-01-step3-candidate.md (225): PARTIAL (75–82, 195, 220–225). Accounts/multi-broker acceptance, "simple beauty".
- pl-conv-01-step5-candidate.md (109): HEADER/grep. R2 accepted, Oct 11.
- pl-cli-01-portfolio-capital-history.md (74): PARTIAL. Principal accepted the graph, Oct 13.
- pl-cli-01-historical-position-candidate.md (59): HEADER/grep. Accepted Oct 12.
- pl-cli-01-historical-position-independent-verification.txt (60): NR.
- ww-position-scan-v2-capability-gaps-2026-10-13.md (63): PARTIAL. Principal direction: tt live is UX-only.
- ww-position-scan-draft-recovery-2026-10-14/*: HEADER/NR. Inactive recovery material.
- pl-conv-01-step3 / step5: as above.
- lvt-init-consequence-release-cost-v1-design.md (252), lifecycle-forward-transition-comparison-v1-design.md (322), pl-recipe-01-first-experiment-v1-design.md (215): HEADER. Design decompositions, NOT implemented or authorized.
- existing-short-obligation-hold-vs-close-v1-design.md (346): HEADER plus grep. Design gate "ACCEPT WITH REQUIRED AMENDMENTS" (2026-09-16). greeksUpdatedAt is kept verbatim.

docs/discovery
- 4am-round6-api-reconciliation-2026-10-18.md (167): FULL. Codex+Kiro REST assessment reconciled. Undated status; ends "NEXT AUTHORIZED ACTION: Prepare… Doc 82 resource-model design".
- decision-surface-expanded-row-vs-drawer-2026-09-09.md (122): HEADER plus grep. Discovery, not ratified.
- lvt-owned-capital-consequence-reconciliation-2026-09-09.md (132): HEADER. "Ratified strategic reconciliation" (Principal, 3AM, Sep 9).
- ww-income-wheel-capability-gap-survey-2026-10-12.md (312): HEADER. Non-ratified discovery.
- conv-web-kiro-rewrite-plan-2026-10-11.md (121): PARTIAL (grep). Planning evidence: strangler pattern, never a forced cutover.
- pass-minus-one-v0-occ-tradier-identity-snapshot (65), pass-zero-v1-class-geometry-method (45): HEADER. Principal-adopted research.
- pass-one-coordinate-history-comparison (55), pass-one-specimen-selection-bounded-pilot (61): HEADER. Exploratory research (Category E).
- 00-design-notes.md (214): HEADER. Working, Experiment 003.
- 01-temporal-capability-vocabulary.md (176): HEADER. Active hypothesis.
- 02-prior-art-findings.md (229): grep only. Reference; contains the "technically correct" hits.
- tastytrade-iron-condor-operator-learning-2026-09-30.md (121): HEADER. Current Specialized Reference.
- cold-start-authority-provenance-incident-2026-09-03.md (208): HEADER. Non-governing incident evidence.
- cloud-readiness-brainstorm-2026-08-27.md (412): HEADER. Exploratory.

docs/contracts
- api-v2-held-quotes-read.md (184): FULL. Principal-ratified GET /v2/quotes plus `ww ls quotes`.
- api-v2-subject-show-held-quote.md (397): PARTIAL (header, §14 color and acceptance amendments 355–397). Principal-ratified `ww show`.
- api-v2-direct-quote-acquisition-proposal.md (96): HEADER. "PRINCIPAL-RATIFIED HTTP/OAS CONTRACT" (Oct 5).
- evidence-snapshot-v1.md (396): HEADER/grep. Frozen. greeksUpdatedAt and 0.0 are kept verbatim.
- OAS: api-v2-direct-quote-acquisition-proposal.yaml (1515; the common OAS 3.1.1 entry, historical filename kept), api-v2-account-evidence.json (4142), api-v2-market-evidence-subjects.json (493). Existence noted, NR.

docs/api-v2/README.md (22): FULL. Contract entry point. Humans and agents consume the same OAS.

docs/cli
- ww-man.txt (235): FULL. Top-level manual.
- ww-positions-human-presentation-2026-10-17.md (185): FULL. Principal-accepted presentation reference, NOT implemented.
- ww-positions-command-2026-10-15.md (257): FULL. Principal acceptance PASSED, Oct 15.
- ww-composition-friction-acceptance.md (330): FULL. CF01–CF12.
- ww-update-product-clarifications-2026-10-15.md (73): FULL. Principal-decided pull/sync/fetch/history contracts.
- tt-live-panel.md (58): FULL. Current tt live contract.
- tt-live-panel-history.md (221): PARTIAL (grep plus 111–120). Historical accepted precedents.
- ww-show-query-acceptance-2026-10-05.md (177): PARTIAL. Principal accepted twice (1cd3444, 506fd0a).
- ww-ls-acceptance-2026-10-05.md (236): PARTIAL. "manual acceptance PASS for ww ls quotes".
- ww-account-evidence.md (156): PARTIAL. Accepted Account colors (Oct 11) and operational delivery.
- ww-show-acceptance-2026-10-05.md (103), ww-fetch-acceptance-2026-10-04.md (492), ww-bare-fetch-experiment-2026-10-04.md (90): HEADER. Candidate evidence, "not a Product acceptance decision".
- tradier-market-data-capabilities-2026-10-05.md (22): HEADER. Category E provider reference.
- Man pages ww-{history,sort,sync,pull,show,prices,fetch,ls}-man.txt: HEADER (NAME lines). Notably `ww pull — Update WW with everything so I can start doing stuff.`

docs/bootstrap
- chatgpt-cold-start.md (146): PARTIAL (60–75).
- kiro-cold-start.md (157), codex-cold-start.md (130): PARTIAL (grep).
- end-of-session-protocol.md (145): HEADER/grep. Ratified.
- project-memory-protocol.md (539): HEADER plus section index. Ratified.
- api-v2-documentation-update-procedure.md (222): PARTIAL (1–12). Adopted Oct 15.

docs/prompts
- kiro-constraint-identification.md (203), codex-factory-floor-measurement.md (295): HEADER. Canonical prompts for Doc 39/40 work; no Product acceptance content.

## 2. KNOWLEDGE ITEMS
Fields: ID | title | path:line | verbatim | speaker | type | status | scope | related | subject | Principal judgment needed?

S1-001 | TT Live narrative purpose | design/tt-live-economic-story/README.md:9-13 | [P] "An operator-facing visualization should communicate the correct qualitative conclusion before requiring the operator to interpret its quantitative details." / "It doesn't show a bunch of 'correct' data; it tells a quick story." | Principal | PRINCIPAL-STATEMENT | accepted | all operator visuals | dup: design-history.md:15-19 | Product presentation philosophy | N

S1-002 | Accepted TT Live economic grammar | tt-live-economic-story/README.md:5 | [D] "accepted: center-anchored scale, cyan current-position diamond, red/green economic regions, beyond-boundary overflow, profit-target annotation, and removal of default human P/L" | Principal via doc | ACCEPTED-PRODUCT-SPECIMEN | accepted (qualified) | tt live; WW may inherit | cli/tt-live-panel.md:3 | Terminal position-scan grammar | N

S1-003 | Exclusions from TT acceptance | tt-live-economic-story/README.md:3,37 | [D] "recent-movement indicators remain experimental; tastytrade stop-order interpretation and ↩︎ remain provisional and are excluded from acceptance" | Principal | DECISION | accepted exclusion | tt live / WW reuse | panel-history:219 | Provisional semantics | Y (to resolve later)

S1-004 | Economic scale definition | tt-live-economic-story/README.md:~25-33 | [D] "Gross P/L = (opening credit − current closing debit) × quantity × multiplier"; center = zero gross P/L, "not underlying-price expiration breakeven". "Never substitute maximum theoretical loss for missing management evidence." | D (accepted grammar) | DOMAIN-DEFINITION | accepted | EXIT PROGRESS | design-history:115 | Position economics presentation | N

S1-005 | Skull = confirmed absence of protective stop | tt-live-economic-story/README.md:84-90 | [P] "looks good"; [D] skull "replaces the leftmost dotted cell only when current reconciled broker closing-order evidence confirms no active protective stop order" | Principal | ACCEPTED-PRODUCT-SPECIMEN | accepted Oct 14 | tt live, ww live | ww-live-product-plan:§step 6 | Evidence-of-absence glyphs | N

S1-006 | −∞ rejected | tt-live-economic-story/README.md:~88 | [D] "−∞ was explicitly rejected as an incorrect mathematical claim for a defined-risk spread." | Principal | REJECTED-PRODUCT-SPECIMEN (mathematically false) | rejected | glyphs | — | Financial truthfulness in glyphs | N

S1-007 | Beyond-stop diamond accepted | design-history.md:229; panel-history:211 | [P] "yes! that's the visualization" | Principal | ACCEPTED-PRODUCT-SPECIMEN | accepted | EXIT PROGRESS overflow | — | Terminal grammar | N

S1-008 | Font compatibility is decided only by the Principal's terminal | design-history.md:175 | [D] the Principal's screenshot "rejects that glyph's font compatibility despite passing width/color tests" (U+2BC4 ⯄ showed as a missing-glyph box) | Principal | LESSON-FROM-FAILURE | historical | all glyph choices | README "Principal's actual Terminal screenshot establishes glyph appearance" | Visual verification method | N

S1-009 | Remove tilde rounding indicators | design-history.md:151 | [P-direction] "remove tilde rounding indicators because terminal space is precious" | Principal | PRESENTATION-CONTRACT | accepted | compact labels | — | Terminal density | N

S1-010 | Pxx + GTD = manual xDTE exit | cli/tt-live-panel-history.md:111-117 | [D] "automatic, general TT Live management convention… GTD expiration does not execute a trade." M is the Principal's manual-close checkpoint. | Principal | DECISION | accepted Oct 14 | credit strategies | tt-live-panel.md DTE | Management objectives semantics | N

S1-011 | No assumed 45-day tenure | tt-live-economic-story/README.md:~21 | [D] "Opening duration is verified actual tenure, never an assumed45 days." | D | DOMAIN-DEFINITION | accepted | DTE | ww-live-session README finding 3 | Temporal truth | N

S1-012 | Gain-side stops exist (UNG falsifier) | tt-live-economic-story/README.md:~15; design-history:127 | [D] "UNG falsified the assumption that every stop belongs below economic breakeven." | Principal steering | FINDING-THAT-CHANGED-ASSUMPTION | accepted | stop semantics | — | Options-domain lesson | N

S1-013 | Ordinary command is the acceptance path (tt live) | design-history.md:119 | [D] "Principal acceptance FAILED: the Principal ran ordinary tt live and… saw the old… renderer. The isolated replay command was not an adequate ordinary-command acceptance path." | Principal | LESSON-FROM-FAILURE | historical | all acceptance | S1-014, S1-041 | Acceptance method | N

S1-014 | Zero-configuration operator acceptance | bootstrap/codex-cold-start.md:40-46; pl-conv-01-step3:80 | [D] "A candidate is not ready for Principal operator acceptance if its acceptance instructions require the Principal to set or unset environment…" / "Principal-facing acceptance may not require them" | Principal (Oct 11) | PRODUCT-REQUIREMENT | ratified | all candidates | S1-041 | Acceptance method | N

S1-015 | TT Live is a UX prototype, not authority | ww-position-scan-v2-capability-gaps:~10; tt-live-economic-story/README.md "Durable handoff" | [D] "TT's transitional financial calculations are not a production authority precedent." | Principal | ARCH-INVARIANT | ratified (PRIN-ARCH-BACKEND-AUTHORITY) | WW clients | ww-live-product-plan:7 | Backend authority | N

S1-016 | ww positions should look like tt live | pl-conv-01-managed-position-visual-acceptance-specimen.md:11 | [P] "I want ww positions to look like this." "Make this screenshot the Principal-confirmed visual acceptance specimen for the eventual managed-Position presentation." | Principal Oct 13 | ACCEPTED-PRODUCT-SPECIMEN (target) | accepted target; binary not in repo (SHA recorded) | managed Positions | ww-show-positions proposal:7 ("…with one additional column: ACCOUNT") | Managed Position presentation | N

S1-017 | No default disclaimer paragraphs | managed-position specimen:~17 | [D] "compact alignment, semantically restrained color… minimal header and no default disclaimer paragraphs" | Principal | PRESENTATION-CONTRACT | accepted | human tables | ww-positions-human:"No extra explanatory diagnostic footer"; visual-parity removed stderr footer | Terminal grammar | N

S1-018 | ww positions accepted column grammar | cli/ww-positions-human-presentation-2026-10-17.md:~18 | `BROKER | ACCOUNT | POSITION | CONTRACT | QTY | PURPOSE | STATE | COLLATERAL | DTE(today) | OPEN P/L | MKT VALUE` | Principal (mock review) | ACCEPTED-PRODUCT-SPECIMEN | accepted, NOT implemented | ww positions | supersedes Oct 15 CUSTODY default | Positions presentation | N

S1-019 | Acceptance words for ww positions | ww-positions-human-presentation:5-6 | [P] "this is what a good human output looks like for ww positions" … "persist this in github" | Principal Oct 17 | PRINCIPAL-STATEMENT | accepted | — | — | — | N

S1-020 | Remove CUSTODY from default | ww-positions-human-presentation:~11-14 | [D] "Fidelity Cash/Margin carrying classification does not answer whether assets are committed, borrowed against or available; remove CUSTODY from the default human table." | Principal | DECISION | accepted | ww positions | conflicts with ww-man.txt HUMAN POSITION OUTPUT ("Custody distinguishes…") until implemented | Positions presentation | N

S1-021 | Blank cells for absent values (ww positions) | ww-positions-human-presentation:~33-36 | [D] "Use blank cells… rather than —, ?, or repeated Cash backing unknown… a blank is not a zero or proof of absence." | Principal | PRESENTATION-CONTRACT | accepted, scoped | ww positions only | CONFLICT: ww-live-product-plan uses em dash —; ww-man uses ?; doc says it "does not silently amend the separate ww live Product contract" | Unknown-value rendering | Y (cross-command convention)

S1-022 | Global width alignment | ww-positions-human-presentation:~37-41 | [D] "Calculate column widths across the complete displayed collection… The Principal rejected multiple hand-spaced mocks for misalignment." | Principal | REJECTED-PRODUCT-SPECIMEN (misalignment) | accepted rule | all tables | — | Terminal grammar | N

S1-023 | Allocation rows and --options semantics | ww-positions-human-presentation:~27-33,~42-46 | [D] committed shares are shown as separate "Collateral Shares" rows linked to their contract. `--options` "selects option Positions AND their associated collateral… not simply a filter on instrument type." | Principal | PRESENTATION-CONTRACT | accepted (flag hypothetical) | ww positions | ww live COLLATERAL | Collateral presentation | N

S1-024 | Matching does not establish collateral | ww-positions-human-presentation:~55-60 | [D] "matching symbols, strikes and quantities alone do not establish membership or collateral. A short put's strike obligation or broker margin requirement is not proof that that much cash is actually pledged." | D | DOMAIN-DEFINITION | accepted | all | ww-live-plan COLLATERAL | Collateral semantics | N

S1-025 | Rejected collateral layouts | ww-positions-human-presentation:~170-173 | [D] "The single-column list-of-links and compact allocation-reference alternatives were rejected." Arrows are also rejected. | Principal | REJECTED-PRODUCT-SPECIMEN | rejected | ww positions | — | Positions presentation | N

S1-026 | Installed ww positions accepted (Oct 15) | cli/ww-positions-command-2026-10-15.md:4,238 | [P] "acceptance PASSED; execute end of session protocol" | Principal | ACCEPTED-PRODUCT-SPECIMEN | accepted, operational 3de8dce | bare ww positions, single table | ww-account-evidence.md | Positions CLI | N

S1-027 | Common contract typography | ww-positions-command:~205-215 | [D] "common human typography ROOT YYMMDD{C|P}STRIKE, for example XLF 261127P52"; raw values are kept in verbose/JSONL | Principal-directed | PRESENTATION-CONTRACT | accepted | cross-broker | ww-man HUMAN POSITION OUTPUT | Contract display identity | N

S1-028 | Bare output holdings-only | ww-positions-command:~203 | [D] "bare output must not show close orders" | Principal | PRESENTATION-CONTRACT | accepted | ww positions | — | — | N

S1-029 | ww accounts one table | design/ww-accounts-2026-10-17/README.md:105 | [P] "not 3 tables. 1 table. we'll prune it if we need to" | Principal | REJECTED-PRODUCT-SPECIMEN (Mock A, three tables) | parked | ww accounts | — | Accounts presentation | N

S1-030 | WW ID removed from human output | ww-accounts README:120 | [P] "it's meaningless to the operator" | Principal | DECISION | parked/accepted choice | human output | identity still matters to the backend | Account identity display | N

S1-031 | Real values only in mocks | ww-accounts README:~42-44 | [D] "The Principal requires real values from ww commands preferably, otherwise v2 API, rather than invented numbers." | Principal | PRODUCT-REQUIREMENT | accepted practice | mock/specimen method | S1-013 | Specimen method | N

S1-032 | Account identity and masking convention | ww-accounts README:~38-40; Mock D | [D] "Keep nickname, display name, brokerage and masked brokerage Account number" (****1514) | Principal | PRESENTATION-CONTRACT | accepted convention | all Account views | step3:225 "simple beauty" | Account identity | N

S1-033 | Distinct balance facts are not collapsed | ww-accounts README:~66-71, gap table | [D] "Available cash"… means "cash WITHDRAWABLE without margin borrowing, not cash available to trade". "Do not collapse distinct facts because today's numbers coincide." | D | DOMAIN-DEFINITION | parked | Accounts | Doc 56, BUG-022 | Balance semantics | Y (header wording)

S1-034 | Existing regime classifier precedent | ww-accounts README:~170-176 | [D] "The actor wrongly suggested this rested only on Principal clarification. Existing Fidelity parsing… ALREADY classifies MARGIN, LEGACY_CASH and INDETERMINATE" | D | LESSON-FROM-FAILURE | parked | Accounts | balancesParser.ts:135 | Reuse-before-invent | N

S1-035 | Unsupported grammar ≠ broken access | ww-accounts README:~31-33 | [D] "`ww show account pts` interpreted ACCOUNT and PTS as quote subjects… unsupported command grammar, not evidence that Account access… broken" | D | FINDING-THAT-CHANGED-ASSUMPTION | parked | CLI grammar | ww-account-evidence: `ww show -- accounts` | CLI grammar | Y (whether to add account inspection)

S1-036 | ww live scope: open option Positions only | design/ww-live-product-plan-2026-10-16.md:59 | [D] "ww live shows open option Positions only, NOT all underlying shares… This supersedes the earlier 'show all holdings'" | Principal | DECISION | accepted Product decision; impl STOPPED | ww live | — | Live monitoring Product | N

S1-037 | ww live columns | ww-live-product-plan:~62 | `BROKER | ACCOUNT | CONTRACT | COLLATERAL | TRADE SHAPE | RANGE | SPOT | DTE | EXIT PROGRESS | QUOTE`; CONTRACT shows e.g. `EWZ ×3`; no QTY column | Principal | PRESENTATION-CONTRACT | accepted decision | ww live | tt-live-panel | Live presentation | N

S1-038 | Membership precedence A-with-B | ww-live-product-plan:~26 | [D] "Prefer explicit, provenance-bearing operator-established Position associations… brokerage-derived membership only when… unambiguous… Do not manufacture grouping from matching contract geometry." | Principal Oct 16 | DECISION | accepted | Position membership | 4AM 250-share falsifier | Position identity | N

S1-039 | Roll/adjustment create new Positions | ww-live-product-plan:~70-73 | [D] "An expiration roll likewise closes the old displayed Position and creates a new one with a new opening date… explicitly supersedes the earlier exploratory 'roll retains original date' decision." | Principal | DECISION | accepted | Position lifecycle | 4AM Doc 82 close/reopen | Position continuity | N

S1-040 | ww live is a retained read | ww-live-product-plan:~31,~66 | [D] "ww live itself must not trigger implicit brokerage acquisition… Operator can explicitly run `ww pull && ww live`"; ↻ appears "only for concrete backend-established reasons… not an arbitrary age threshold" | Principal | PRODUCT-REQUIREMENT | accepted | ww live | REST facade read-through (S1-047), possible tension | Acquisition vs read | Y (reconcile with read-through)

S1-041 | Terminal theme independence | ww-live-product-plan:~5,~57 | [D] "terminal default foreground is GREEN, not a WW semantic color. Respect user terminal foreground/background defaults; do not hardcode bright-white neutral text." | Principal | PRESENTATION-CONTRACT | accepted | all new ww | CONFLICT: ww-man COLOR CONVENTIONS "bright white ordinary text"; ww show uses explicit SGR 37 | Color standard | Y

S1-042 | ww live visual acceptance NOT passed; STOPPED | ww-live-session-2026-10-16/README.md:3,~34-46 | [D] "Principal inspected the actual terminal and found that ww live still lacks accepted tt live's visual quality." Widths of 31/18/29 are accepted. | Principal | REJECTED-PRODUCT-SPECIMEN (visual hierarchy, monotonous geometry) | stopped | ww live | product-plan:85 | Live presentation | Y (resume)

S1-043 | Cyan = qualified spot only | ww-live-session README finding 8 | [D] "Cyan represents qualified observed underlying SPOT, NOT strike boundaries. No spot inference or synthetic default." | Principal | PRESENTATION-CONTRACT | accepted | ww live / tt live | — | Color semantics | N

S1-044 | Engineering ACCEPT ≠ Product acceptance | ww-live-session README:~31 | [D] "Do not promote synthetic tests/reviewer ACCEPT to Product or actual-Account acceptance." | D | LESSON-FROM-FAILURE | accepted | all | codex-cold-start:52 | Acceptance method | N

S1-045 | P2 approve with deferred gaps | ww-live-p2-principal-disposition:3,~9-10 | [D] "APPROVE P2… with two reviewed semantic gaps DEFERRED, not falsely resolved." Physical-equity classification and allocation canonicalization: "no silent arbitrary GCD result" | Principal | DECISION | accepted (risk decision) | v2 option-structure | — | Position construction | N

S1-046 | v2 as domain facade | design/api-v2-domain-facade-rest-reconciliation-2026-10-13.md:~7 | [D] "Wheelwright v2 is a facade / de-multiplexing layer… The domain model and tools operating on it are Wheelwright's core intellectual property. Brokers are upstream sources" | Principal | PRINCIPAL-STATEMENT/ARCH-INVARIANT | ratified into Doc 77 | v2 API | 4AM round 6 | REST/API architecture | N

S1-047 | URI and method conventions | REST facade:~9-15 | [D] "Public URIs express coherent domain resource collections and identifiable instances, not the identity of a provider, client, internal workflow or acquisition mechanism." "GET safety is about the client-requested semantics" | Principal | API-CONVENTION | ratified | v2 | Doc 77 §§19–20 | REST conventions | N

S1-048 | Rejected monitoring-acquisition POST | REST facade:~25 | [D] "Reject… POST /v2/position-acquisitions?accountId=ID&evidence=monitoring… encodes a consumer-specific workflow and leaks the facade's upstream acquisition mechanism." | Principal-derived | REJECTED-PRODUCT-SPECIMEN | rejected | v2 | 4AM §2A (acquisition resources contested) | REST topology | N

S1-049 | Existing vs proposed URI patterns | design/ww-show-positions-v2-architectural-proposal-2026-10-13.md:9-19 | URI table. "Do not invent a globally stable economic-occurrence identity" for /v2/positions/{positionId}. Projection is `view=monitoring`. | Codex proposal | API-CONVENTION | candidate (review pending) | v2 positions | 4AM Outcome A (Position identity) | REST topology | Y

S1-050 | V2 sound; financial model needs correction | discovery/4am-round6:~9-11,22 | [D] "V2's foundation is largely sound. Its financial-domain resource model needs correction before we extend it substantially." "The 250-share SPY specimen is the clearest architectural falsifier." | ChatGPT reconciliation of Codex+Kiro | FINDING-THAT-CHANGED-ASSUMPTION | candidate | v2 domain | Doc 82 | Financial resource model | Y

S1-051 | Accounts can proceed independently | 4am-round6 §2B, §4 | [D] "We don't need to hold up Account balances and regime reporting while resolving Position identity." | reconciliation | DECISION (recommendation) | candidate; Accounts parked | sequencing | ww-accounts README | Delivery sequencing | Y

S1-052 | Operational findings to track | 4am-round6 §5 | dual Tradier acquisition authority; v1 unauthenticated on all interfaces; 2027 calendar missing; TT UTC session dating | Kiro via reconciliation | UNRESOLVED-QUESTION | open | ops/security | ww-man HISTORICAL ("tastytrade date is UTC receipt day") | Ops correctness | Y

S1-053 | Composition friction smell | cli/ww-composition-friction-acceptance.md:~12-16,~31 | [D] "`ww | jq | Unix` when the jq step exists only to unpack Wheelwright's default representation"; "Choose a default projection that preserves its promised domain facts while minimizing friction" | PL-CLI-01 guideline | PRODUCT-REQUIREMENT | ratified acceptance specimens | all composable commands | held-quotes-read §7 | Unix composition | N

S1-054 | Design-authority order for projections | CF:~229-235 | `row semantics -> absence semantics -> projection fields -> representation/delimiter -> shell friction acceptance` | D | DECISION | accepted | CLI projections | — | Unix composition | N

S1-055 | CF10 absence ≠ zero; CF12 no generic tools | CF:~220-227,~255-270 | [D] "A representation that reduces friction by turning absence into 0 FAILS"; FAIL if the fix is "ww grep / ww filter / ww head…" | D | PRODUCT-REQUIREMENT | accepted | CLI | CF11: rich JSONL must remain | Unix composition | N

S1-056 | CF table mandatory for projection changes | CF:~305-325 | [D] "Any future change to the default projection… MUST include a CF table… Do not collapse 'Correct?' and 'Adapter required?'" | D | PRODUCT-REQUIREMENT | accepted | CLI | — | Acceptance method | N

S1-057 | stdout/stderr and exit conventions | cli/ww-man.txt OUTPUT/EXIT (~120-145) | [D] "Results go to stdout; status and diagnostics go to stderr." Exit 0/1/2: "Detailed backend outcomes are not encoded as a catalog of exit codes." | D (man) | API-CONVENTION (CLI) | accepted | ww | held-quotes-read §6 | CLI conventions | N

S1-058 | Output-mode convention | ww-man ls/positions; held-quotes-read §6 | Terminal gets a human table; redirected default is headerless TSV (positions: JSONL). `--jsonl` is one record per line. `--table` preserves the human table through pipes. Escaping is \\ \t \r \n \u00XX | D | API-CONVENTION | accepted | ww | INCONSISTENCY: positions redirect = JSONL vs ls = TSV | CLI conventions | Y (unify?)

S1-059 | Standing color standard | ww-man COLOR CONVENTIONS (~105-118); cli/ww-account-evidence.md:~13-24 | [D] "Account aliases are cyan; BROKER labels use Fidelity green and tastytrade red as brand identity, not status… dark gray technical Account IDs"; ANSI 96/97/240, 32/91 | Principal Oct 11 | ACCEPTED-PRODUCT-SPECIMEN | accepted | ww | conflict S1-041 | Color standard | Y

S1-060 | ww show styled table accepted | cli/ww-show-query-acceptance:121,175; contracts/api-v2-subject-show-held-quote.md:373-397 | [P] "accepted" (twice). Final-12-character human IDs, coral red 203, alternating 40/48;5;232 rows ("Principal twice rejected lighter gray"), exact 2-decimal dollars, 40-char descriptions | Principal Oct 5 | ACCEPTED-PRODUCT-SPECIMEN | accepted at 506fd0a | ww show | — | Command-specific palette | N

S1-061 | Select by magnitude, display signed | show-held-quote contract §14; ww-show-query-acceptance:~145 | [D] select "biggest movers… by magnitude but displayed with gains above losses, most negative last"; "Rather than adding a display-order flag… reassess existing flags" | Principal | DECISION | ratified | ww show | CF12 spirit | Query semantics | N

S1-062 | Held-evidence reads never acquire | contracts/api-v2-held-quotes-read.md:15-17 | [D] "Held-evidence reads never acquire or revalidate evidence. ww ls quotes and its backing v2 capability cause no upstream provider contact." | Principal-ratified | API-CONVENTION | ratified | quotes | tension with S1-047 read-through (scoped as capability-specific) | Held vs read-through semantics | N

S1-063 | Holding definition | held-quotes-read:~21-23 | [D] "A holding is the authoritative accepted row for a canonical uppercase underlying symbol, not membership, freshness, or fitness"; failure preserves prior | Principal-ratified | DOMAIN-DEFINITION | ratified | quotes | Invariant "failed refresh preserves evidence" | Held-quote semantics | N

S1-064 | Collection completeness, no truncation | held-quotes-read §2 | [D] "no silent cap/truncation… fail the entire request, never return a limited success"; Cache-Control private, no-store; RFC 9457 problems; X-Request-Id | ratified | API-CONVENTION | ratified | v2 | history proposal "capacity failure is truthful" | API conventions | N

S1-065 | Clocks are not freshness | held-quotes-read §3 | [D] receivedAt/committedAt are "Neither… source market-event time, request time, publication time, age, or freshness." | ratified | DOMAIN-DEFINITION | ratified | v2 | ww-man EVIDENCE LIMITS | Temporal vocabulary | N

S1-066 | Path codec instead of query | design/ww-show-held-quote-solution-design.md:40,207; transport:~13 | [D] "The Principal rejected the query alternative" (GET /v2/quotes/observation?symbol=). Escapes are `_2F` (slash), `_5F` (underscore), `_5E` (caret), with non-recursive decoding | Principal | REJECTED-PRODUCT-SPECIMEN (resource identity belongs in path) + DECISION | accepted | v2 instance URIs | BUG-030 | URI design | N

S1-067 | Human ID truncation | held-quote solution design:251 | [D] "observationId/acquisitionId use their final 12 characters… Keep full strings in canonical machine output, verbose, filter/sort keys" | Principal direction | PRESENTATION-CONTRACT | accepted | human tables | — | ID presentation | N

S1-068 | ww pull = git pull benchmark | design/ww-pull-ux-feedback-2026-10-15.md:~13-19,~33 | [D] "Use git pull as the benchmark… default verbosity should be proportional to meaningful work and exceptions"; never claim "Already up to date." for unreachable or reused sources | Principal | PRINCIPAL-STATEMENT/PRESENTATION-CONTRACT | intake (feedback) | ww pull | update-clarifications "concise Git-style change report" | Command verbosity | N

S1-069 | ww pull purpose | cli/ww-update-product-clarifications-2026-10-15.md:6; ww-pull-man NAME | [P] "ww pull — Update WW with everything so I can start doing stuff." "Wheelwright is the destination." | Principal | PRINCIPAL-STATEMENT | accepted | ww pull | — | CLI workflow | N

S1-070 | Command contracts and defaults | update-clarifications:~14-27 | Sync/fetch/history/pull table. Default subjects are "authorized holdings' underlyings UNION explicitly configured monitoring subjects". "Operators select Account nicknames, never GUIDs." `SYNC → DISCOVER → FETCH → REPORT` | Principal | DECISION | accepted & delivered (e6e3b55) | CLI | ww-man pull | CLI workflow | N

S1-071 | Acceptance gate `ww pull && ww history` | update-clarifications:62; ww-history-candidate README:~3 | [D] "required acceptance command is exactly `ww pull && ww history`… No synthetic acceptance data, preview launcher…" A partial failure returns nonzero and blocks via && | Principal | ACCEPTED-PRODUCT-SPECIMEN (+ REJECTED isolated preview) | accepted Oct 15 | pull/history | S1-013/014 | Acceptance method | N

S1-072 | History domain hierarchy | ww-history-proposal:71,78,170+ | [D] "Authenticated User → Authorized Accounts → Account Transaction History"; "no global transaction collection"; one Account history grant; no strategy, P&L or tax accounting | Principal-clarified | API-CONVENTION/DOMAIN-DEFINITION | approved checkpoint | history | Doc 77 Oct 11 nesting guidance | Resource nesting | N

S1-073 | Payoff rendering invariant | design/position-payoff-visual-contract/README.md:~11-13 | [D] "underlying price on the horizontal axis and position payoff / P&L on the vertical axis at a declared evaluation horizon… Never draw a verified payoff where relevant terms or a common valuation horizon are unavailable." | D | PRESENTATION-CONTRACT | reference | payoff glyphs | — | Payoff visualization | N

S1-074 | CC/CSP shape accepted | payoff README:3,~31 | [D] Principal approved "rising-then-flat expiration-payoff silhouette for both covered calls and cash-secured puts… never rely on color alone to distinguish the two" | Principal Oct 13 | ACCEPTED-PRODUCT-SPECIMEN (shape only) | accepted; goldens proposed | CC/CSP | golden/README:15 | Payoff visualization | Y (exact goldens)

S1-075 | Portfolio Capital graph accepted | design/pl-cli-01-portfolio-capital-history.md:3 | [P] "that's good enough for now. accepted. execute end of session protocol" | Principal Oct 13 | ACCEPTED-PRODUCT-SPECIMEN | accepted, not deployed | PTS graph | ww-man PORTFOLIO CAPITAL | Portfolio Capital | N

S1-076 | ww ls accounts "simple beauty" | design/pl-conv-01-step3-candidate.md:225 | [D] the Principal admired "its 'simple beauty'": three familiar nicknames, brokerage attribution, masked refs | Principal | ACCEPTED-PRODUCT-SPECIMEN | accepted | Accounts | S1-032 | Account presentation | N

S1-077 | Static docs: Redocly on GitHub Pages | design/api-documentation-github-pages-product-checkpoint:~7-15; pl-api-02 plan:15-16,253 | [D] "Do not embed a documentation UI… in the Wheelwright Java backend"; no "try it"; the public site excludes auth/grant guidance; 15 public / 19 internal operations; "coequal human/agent usability" | Principal | DECISION/ACCEPTED-PRODUCT-SPECIMEN | accepted Oct 15 | API docs | api-v2/README; bootstrap/api-v2-documentation-update-procedure | API documentation | N

S1-078 | Agents consume the same OAS | docs/api-v2/README.md:~3 | [D] "Humans and agents consume the same contract… no HTML scraping, extra agent format, registry or MCP server is required." "OAS advertises capabilities; it does not authorize an agent to invoke them." | D | API-CONVENTION | accepted | API | — | Agent consumption | N

S1-079 | "What should" vs "may it now" | bootstrap/chatgpt-cold-start.md:69 | [D] "A technically correct answer to the first question does not answer the second." | D (ratified methodology) | ARCH-INVARIANT (governance) | current | all actors | kiro-cold-start:46 | Authority discipline | N

S1-080 | Client caches never become authority | bootstrap/kiro-cold-start.md:37 (dup in codex/chatgpt) | [D] "Client caches must never become independent Wheelwright state, reconciliation, persistence, or business-logic authority." | Principal mandate | ARCH-INVARIANT | ratified | v2 clients | S1-047 cacheability | Backend authority | N

S1-081 | Broker accounting is technically correct but cognitively unhelpful | discovery/02-prior-art-findings.md:29,111 | [D] "technically correct but often cognitively unhelpful for operational decision-making" | D (research) | FINDING | reference | presentation philosophy | S1-001 | Product philosophy | N

S1-082 | Never a forced cutover of v1 Web | discovery/conv-web-kiro-rewrite-plan-2026-10-11.md:16,92 | [D] "Strangler pattern mandatory… Never a forced cutover." | D, citing PL-CONV-01 | DECISION | planning evidence | v1 → v2 web | — | Migration | Y

## 3. ACCEPTED PRODUCT PRECEDENT CATALOG
1. TT Live economic-state grammar (qualified). Recorded in tt-live-economic-story/README.md:3-5 and verification.md:79. It establishes the flagship visual grammar WW inherits: center-zero economic track, cyan observation, red/green halves, overflow, no default P/L. Movement arrows and ↩ are excluded.
2. TT Live skull ☠ (no protective stop). Recorded in README:90 and tt-live-panel.md:58. It establishes the rule that a glyph may claim absence only from reconciled evidence.
3. TT Live BUG-041 workstream (credit verticals, entry-reference viewport, GTD manual checkpoint). Recorded in tt-live-panel-history.md:155, with an earlier acceptance Oct 11 at :7. It establishes the Pxx+GTD convention and viewport policy.
4. ww show styled held-quote table. Recorded in ww-show-query-acceptance:121,175 and show-held-quote contract:373. It establishes command-specific palettes, final-12 IDs, 2-decimal dollars and watch -c composition.
5. ww ls quotes. Recorded in ww-ls-acceptance:122 ("manual acceptance PASS for ww ls quotes"). It establishes the held-discovery TSV/JSONL grammar.
6. Account colors and ww ls accounts. Recorded in ww-account-evidence.md:~13-24 and step3:225. It establishes the cyan alias, brand-color broker, gray ID and masked-reference standard.
7. Multi-broker Account delivery (pts/sawdust/tt1). Recorded in ww-account-evidence.md:~143.
8. Installed bare ww positions, single table (Oct 15). Recorded in ww-positions-command:4,238. It establishes BROKER/ACCOUNT as columns 1–2, one header and shared widths.
9. ww positions human presentation target (Oct 17, not implemented). Recorded in ww-positions-human-presentation:3-6. It establishes the PURPOSE/STATE/COLLATERAL grammar, blank cells and allocation rows.
10. `ww pull && ww history` installed. Recorded in update-clarifications final section ("acceptance PASSED"). It establishes the composition workflow and the real-evidence acceptance gate.
11. Portfolio Capital Unicode graph (Oct 13). Recorded in pl-cli-01-portfolio-capital-history.md:3.
12. Historical holdings primitive and compact presentation (Oct 12). Recorded in pl-cli-01-historical-position-candidate.md:3 (from grep only).
13. CC/CSP rising-then-flat shape. Recorded in payoff README:3. Shape only.
14. Managed-Position visual target (tt live screenshot). Recorded in managed-position-specimen:3,11. This is a target, not an implementation.
15. API v2 documentation (15/19, Redocly, Pages). Recorded in pl-api-02 plan:253.
16. PL-CONV-01 Step 5 R2 (Oct 11). Recorded in pl-conv-01-step5-candidate.md header (status line only).

Not accepted:
- ww live visual. STOPPED.
- ww accounts. Parked.
- ww fetch / bare-fetch evidence: candidate. A later acceptance may be recorded outside S1.
- Payoff goldens: proposed.

## 4. BURIED KNOWLEDGE (top 10)
1. The terminal default foreground is green (ww-live-product-plan:57; show-held-quote contract:368). This drives the white-reassert and theme-independence rules, and it conflicts with the man page's "bright white".
2. An ordinary command plus real evidence is the only acceptance path. This was learned three times: tt live replay (design-history:119), Step 3 env exports (step3:80) and the history preview (update-clarifications:62).
3. The UNG gain-side stop falsifier: stops are independent economic landmarks (design-history:127).
4. "Available cash" means withdrawable without borrowing. The Fidelity regime classifier already exists (ww-accounts README).
5. GTD expiration does not execute a trade. tastytrade's `gtc-date` field is actually the GTD date (panel-history:113-115).
6. The CLI maps wire OTHER_UNDERLYING to public OTHER (held-quotes-read §6).
7. The partial-allocation mock rows were Principal-requested mock data, not an accounting method (ww-positions-human-presentation, Sawdust section).
8. The 250-share SPY split is the falsifier for Position identity (4am:22).
9. The XLF fill credit (.09) differs from the order limit (.08): "use fills" (tt-live README observed table).
10. ww live's "all 48 rows" was an inventory-only engineering specimen, not accepted scope (ww-live-product-plan:77).

## 5. VERBATIM PRINCIPAL STATEMENTS
- "An operator-facing visualization should communicate the correct qualitative conclusion before requiring the operator to interpret its quantitative details." — tt-live-economic-story/README.md:9 (Oct 14)
- "TT Live answers questions on the operator's mind simply and concisely." — :11
- "It doesn't show a bunch of 'correct' data; it tells a quick story." — :13
- "looks good" (skull) — :90 (Oct 14)
- "yes! that's the visualization" — design-history.md:229 (Oct 14)
- "I want ww positions to look like this." / "Make this screenshot the Principal-confirmed visual acceptance specimen for the eventual managed-Position presentation." — pl-conv-01-managed-position-visual-acceptance-specimen.md:11 (Oct 13)
- "I want ww show positions to look like tt live, with one additional column: ACCOUNT." — ww-show-positions-v2-architectural-proposal:7 (Oct 13)
- "this is what a good human output looks like for ww positions" / "persist this in github" — ww-positions-human-presentation:5-6 (Oct 17)
- "persist all of this, the mockups, the gap analysis, everything. we'll come back to it later. this is ww accounts" — ww-accounts README:4 (Oct 17)
- "how much margin debt do i have in pts account? can the existing ww tools show that?" — ww-accounts README:28
- "not 3 tables. 1 table. we'll prune it if we need to" — :105
- "it's meaningless to the operator" (WW ID) — :120
- "acceptance PASSED; execute end of session protocol" — ww-positions-command:238 (Oct 15); ww-ls-acceptance:210
- "manual acceptance PASS for ww ls quotes" — ww-ls-acceptance:122 (Oct 5)
- "accepted" — ww-show-query-acceptance:121, 175 (Oct 5)
- "make all dollar amounts exactly 2 decimal places." — show-held-quote contract:383 (Oct 5)
- "that's good enough for now. accepted. execute end of session protocol" — pl-cli-01-portfolio-capital-history.md:3 (Oct 13)
- "ww pull — Update WW with everything so I can start doing stuff." — update-clarifications:6 (Oct 15)
- "simple beauty" (as a reported reaction) — step3:225 (Oct 11)
- Git demo `$ git pull / Already up to date.` — ww-pull-ux-feedback:~15 (Oct 15)

## 6. REJECTED DESIGNS (with reason)
- −∞ loss glyph: mathematically false for defined-risk spreads (tt-live README:88).
- U+2BC4 ⯄ octagon: missing glyph in the Principal's font (design-history:175). Later replaced by 🛑, then by the ↩ grammar.
- Tilde rounding marks: they waste space (design-history:151).
- S/X/P prefixes and the Pxx endpoint grammar: superseded step by step through Principal steering (design-history:141-183).
- Isolated tt live replay as the acceptance path (design-history:119). Isolated history preview (update-clarifications:62). Env-export acceptance (step3:80).
- Hand-spaced misaligned mocks; single-column list-of-links; compact allocation refs; arrows (ww-positions-human-presentation).
- Three-table ww accounts; WW ID column (ww-accounts README).
- Query-param held-quote route `GET /v2/quotes/observation?symbol=`; shared encoded-solidus passthrough (BUG-030) (held-quote design:40,207; transport:13).
- `POST /v2/position-acquisitions?…&evidence=monitoring`: it leaks workflow (REST facade:~25).
- Lighter gray alternating rows, rejected twice. Complete-table full-date exception. Dark red, replaced by coral 203 (show-held-quote contract:368-397).
- A new display-order flag, rejected in favor of reinterpreting existing flags (S1-061).
- "Roll retains original date": superseded (ww-live-plan:72). "Show all holdings in ww live": superseded (:59).
- JSONL-on-terminal framing candidate 16cf477, rejected by independent review (ww-positions-command:~170).
- Generic ww grep/filter/head/count commands: CF12.
- ww live visual R1: Product visual not accepted (ww-live-session README).

## 7. NATURAL CLUSTERS and cross-cutting concepts
Clusters:
- A. Terminal presentation grammar: TT Live → ww positions/live/show/accounts.
- B. Unknown/absence semantics: blank vs — vs ?; absence ≠ zero; evidence-of-absence glyphs.
- C. Acceptance method: ordinary installed command, real evidence, zero configuration, Principal terminal is final, engineering ACCEPT ≠ Product.
- D. REST/v2 conventions: facade, nouns, path codec, completeness, problem+json, private no-store, held vs read-through, Account nesting.
- E. CLI conventions: stdout/stderr, exit 0/1/2, TTY table vs redirected TSV/JSONL, CF01–CF12, nicknames never GUIDs, help/man.
- F. Position identity/membership/collateral: A-with-B precedence, allocation rows, roll/adjust, 250-share falsifier, P2 deferrals.
- G. Account identity and balances: masking, nickname, regime, balance-fact distinctness.
- H. Acquisition/freshness: `ww pull && X`, retained reads, ↻ only for concrete reasons, git-pull verbosity.
- I. Options management semantics: Pxx/GTD/M, gross P/L, stops as landmarks, fills over limits.
- J. Documentation and authority: Redocly/Pages, agents read OAS, "may it now".

Cross-cutting concepts: backend authority/clients render; never invent state; qualification over omission; color as categorical vs semantic; theme independence; one consolidated table across Accounts.

## 8. DUPLICATION / CONTRADICTION
- Unknown-cell glyph: ww positions uses blank (Oct 17 target); ww live uses em dash; installed ww positions and ww-man use `?`; tt live uses — or `--`. Explicitly scoped, so not yet a contradiction, but it needs a canonical rule. (Y)
- Neutral text color: ww-man "bright white ordinary text" and the Account colors (97) vs ww live "do not hardcode bright-white" plus the green terminal default; ww show uses explicit SGR 37 white. (Y)
- CUSTODY column: present in ww-man HUMAN POSITION OUTPUT and the installed release; removed by the accepted Oct 17 target. This is expected drift until implementation.
- Redirected default: ww positions emits JSONL; ls/history/show emit headerless TSV. This is an inconsistency against the CF guideline.
- Read-through GET (REST facade, history) vs "held-evidence reads never acquire" (quotes) vs "ww live is a retained read". The documents reconcile these per capability; a canonical statement is needed.
- Acquisition resources: the REST facade rejects the monitoring POST, and 4AM §2A treats acquisition resources as possibly legitimate. Unresolved.
- Duplicated text: the skull section in tt-live-economic-story/README and cli/tt-live-panel.md is verbatim identical. The three Principal quotes appear in both the README and design-history. Panel-history and design-history duplicate the Oct 14 refinement paragraphs. The ww-live specimen records exist both at docs/design/ and under evidence/specimen-records/ (likely copies; inferred from names and line counts, not diffed).
- Visual-parity specimen vs session README: the specimen calls it "visual parity", but the Principal found parity NOT achieved.

Term hits:
- "technically correct": chatgpt-cold-start.md:69 and discovery/02-prior-art-findings.md:29,111. Related: tt-live README:13 ("'correct' data").
- "worst kind of correct": no hit in S1.
- "URI patterns": ww-show-positions-v2-architectural-proposal-2026-10-13.md:9 ("## 1. Existing versus proposed URI patterns").
- "personal objectives": no hit in S1.

Verified vs inferred: every quote and status above was read directly. Line numbers marked "~" were worked out from section position. Content of the NR evidence files (manifests, OAS JSON/YAML, specimens, logs) and of the HEADER-only design decompositions was not inspected.

RELEVANT FILES (ranked by importance):
  1. docs/design/tt-live-economic-story/README.md — Flagship accepted Product precedent with verbatim Principal philosophy, accepted/excluded grammar and rejected −∞
  2. docs/cli/ww-positions-human-presentation-2026-10-17.md — Latest accepted ww positions presentation contract, rejected alternatives, collateral/blank-cell semantics
  3. docs/design/ww-live-product-plan-2026-10-16.md — Principal Product decisions for ww live (scope, membership precedence, roll/adjust, theme independence) and stop point
  4. docs/design/api-v2-domain-facade-rest-reconciliation-2026-10-13.md — Principal REST/URI/facade intent, rejected monitoring-acquisition POST
  5. docs/cli/ww-composition-friction-acceptance.md — CF01–CF12 CLI composition-friction acceptance specimens and design-authority order

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.