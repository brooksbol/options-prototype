# SN2 survey summary — docs 41–82 (excluding 47, 49, 50, 58, 61, 80, 81)

Classification: internal, redacted, non-normative survey evidence. Not authority. Base: main bef03dd.

## Scope and what was read
- Assigned: 34 files (41–46, 48, 56, 57, 59, 60, both 62s, 62a/b/c, 63–79, 82); 7,965 lines; 419 heading-level segments.
- Run history: run-1 (interrupted) left E001–E089 covering every source except Doc 82. This resume run read Doc 82 in full, re-read Docs 63, 65, 68 and 69 in full, read Doc 77 lines 1–63 and 260–369, and read the run-1-unextracted segments of 41, 42, 45, 56, 57, 59, 62b, 62-paper, 64, 66, 67, 70–76, 78 and 79. It also cross-read Doc 58 (lines 1–10, 116–181, 765–814) and 07-architecture-current lines for the contradiction checks.
- Coverage: FULL 6,713 lines / PARTIAL 41 / INDEXED 1,211. Where coverage.tsv says "read by run-1", FULL depth is inferred from run-1 entry line spans and was not re-verified in this run.
- Outputs: 136 entries (E090–E136 new), 32 decision candidates, 419 coverage rows.

## Top findings
1. Doc 82 has two Principal-ratified layers, both dated Oct 7. The first covers regime scope, the audit rule, the audit questions and the falsifiers. The second is a v2 resource-design candidate: 13 resources, Position as the default decision subject, "Broker evidence is the Account Ledger.", nine non-resources and ten open questions. Neither layer is implementation authority (82:4, 82:57).
2. Operating regime belongs to a governed capital/inventory scope, not to the Account. It is explicitly not limited to shares (82:9–11). Doc 66:111–113 anticipated this, and Doc 64:56 applies the same rule to cash: generic account cash is not automatically a governed Wheel subject.
3. Doc 82 vs Doc 58: 82 keeps 58 §21.1's falsifier that Position has no universal identity (82:46–48). It then makes Position the REST carrier and default decision subject, and folds Holding/Obligation Record and Decision Subject into Position and Position-to-Contract relationships (82:104–118, 134–135). It does not repeal 58's ontology kinds (82:61, 132), but neither doc references the other, and 58 was never updated.
4. Governed Quantity is a phrase, not a ratified entity. The thread runs 58:130 (Inventory Block), 69:61/85 (subject/quantity still open), ADR-022's whole-quantity opening-anchored cohort (70:28–32), and 82:77/110 (Inventory Block only as an "escape hatch"). Share-block identity and partial/residual membership remain open.
5. Operating Program is well defined. Doc 69 ratifies Program (`assignment-centric-wheel`) separately from configuration version (`1`) and states that missing policy does not erase the Program (69:19–21). Doc 62b:384 asks what separates a configuration change from a new Program; no surveyed doc answers it.
6. Doc 65 contains the only ratified affirmative Recommendation rules: LET RESOLVE and SELL CALL, with SELL CALL ≠ WHICH CALL. It adds that the Console is a projection, not the authority (65:12), and that labels must not act as "unexplained magic switches" (65:181).
7. Doc 77 is ratified (base text undated) with dated amendments. The Oct 11 amendments cover source retention, opaque IDs with no foreign-key nesting, nicknames and masking, User vs Account, and Model A grants. The Oct 13 amendments cover the domain facade, read-through GET and HTTP grammar. Its v2 backend-authority mandate is not reflected in 07-architecture-current.
8. v2/CLI compatibility surfaces:
   - v1 is preserved while v2 is reconciled (76:150).
   - In v1, held price is not first-class evidence (76:178–199).
   - A ratified `POST /v2/quotes` contract with frozen OAS exists (79:7, 79:155).
   - The `ww refresh` spelling was retired with no alias (72:23).
   - The fetch exit contract is 0/1/2 (72:25).
   - The Node.js choice for `ww` was selected, then reopened (71:503–505).
9. Doc 64's frozen positive specimen defines Product proof as "truthfully state and preserve what the selected governed Program prescribed", not profitability (64:93). Its Recommendation vocabulary is illustrative, not frozen (64:72).
10. Doc 68 is explicitly not ratification (68:5). Doc 69:89 records that no Product Principles were ratified as of Sep 27. Doc 68 §7.4's "zero or one Program per governed position/instrument" holds against the 250 SPY split (82:108) only if the governed subject is a quantity rather than an instrument.

## Top Principal statements (exact)
- 82:9 "An operating regime applies to the explicitly governed capital/inventory scope for which it is authoritative. Account identity or account accounting/execution context does not establish that operating regime."
- 82:15 "Every Product-relevant meaning required by a supported capability must have a faithful v2 representation. Independent resource identity is earned, not automatic."
- 82:104 "A Position is the default subject of a Wheelwright decision unless a concrete specimen demonstrates that the decision cannot truthfully use Position as its subject."
- 82:87 "Broker evidence is the Account Ledger." (labelled a working thesis; the no-truncation requirement at 82:93 is fixed)
- 77:28 "API v2 MUST preserve a strict authority boundary: **backend owns state and business logic; clients own presentation.**"
- 77:67 "Account relationships belong in representations; foreign keys do not justify Account-nested URIs."
- 77:76 "Operators must never be expected to know, memorize, copy, resolve manually, or type the GUID."
- 69:17 "Assignment is an intended lifecycle mechanism rather than an exception to be avoided."
- 69:27 "...establishes only that the subject/quantity participates in that Operating Program/configuration from the association's governed effective boundary."
- 65:139 "Mechanical similarity must not erase governed differences."
- 74:15 "Disposition: experimentally accepted. Stop touching this slice. No further fetch correction is authorized."
- 63:5 "Principal selected Option A: adopt the converged corrected method..."

## Decision candidates likely not in ADR-001–023 (see decisions.jsonl)
D002 review convergence rule (57:254); D003 BrokerageAccount-keyed account-local state (57:258); D006 decomposition method; D007 frozen Console contract; D008 Doc 65 rules; D013 Doc 69 Program; D016–D020 CLI/fetch/quote selections; D021–D027 Doc 77 mandate and Oct 11/13 amendments; D029–D031 Doc 82 layers; D017 Node selected then reopened. ADR-021 and ADR-022 correspond to D011 and D014.

## Contradictions and tensions (both sides cited)
- 82:71–77 Account-nested URIs vs 77:67/69, which rejects foreign-key nesting and uses independent Positions collections. 77 is later, but 82 carries no supersession note (E101).
- 58:125 "Account Regime ... a property/context of an account" vs 82:9 (E102). This may be two distinct concepts, per 82:11.
- 58:766–781 vs 82:104/134–135 on Position, Decision Subject and Holding Record (E103).
- 68:147 Program cardinality per "position/instrument" vs 82:108 split governance. Separately, 82:78 uses Growth Wheel as a Program while 82:9 talks about operating regimes (E104).
- 65:20/75 and 63:155 treat Decision Subject as its own semantic identity, vs 82:104–106 (E105).
- 07-architecture-current:202/446 (v1 browser/localStorage placement) vs 77:28–39 (v2 mandate). These are scoped to different versions, but 07 does not record the difference (E107).
- 77:80 says User isolation is "held for later ratification", while 77:90–100 ratifies Model A the same day (D025).
- 82:52 says the doc "does not ratify ... candidate URI", while the later 82:55–81 layer ratifies URI candidates without noting the change.

## Coverage gaps
- INDEXED only (heading index; run-1 recorded no item): unextracted segments of 41, 43, 44, 45 (§§1, 5–13), 46, 48, 60, 62-private, 62a, 62c, and 42 (latency/admission sections). These are mostly strategy-surface and research material. The PARTIAL rows are 59:8–36 and 62-private:160–171.
- 70:13 contains an account-identifying source filename. It is not reproduced anywhere in these outputs.
- Doc 81, Doc 61 §29, principles.md and parking-lot entries (PL-CLI-01, PL-CONV-01) are referenced but were not read; they are outside this assignment.

## Assumption challenges
- No surveyed doc ratifies an entity that relates "Operating Regime" to "Operating Program". A cold actor could easily conflate the two.
- Doc 82's Position-first choice moves the identity burden onto Position. 77:80 still lists Account-first vs Position-first as "UNDECIDED".
- Doc 82 says Recommendation is not resource-worthy (82:141), but this is not reconciled with the Decision identity and replay obligations in 63:155, 64:89–91 and 67:182.
