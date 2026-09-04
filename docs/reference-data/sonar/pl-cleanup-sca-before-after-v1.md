# PL-CLEANUP — Static Code Analysis (SCA) Before/After v1

**Status:** Category C reference — post-cleanup quality measurement (measurement only; no remediation).
**Prepared:** September 4, 2026
**SCA meaning here:** **Sonar static code analysis.** In Wheelwright, "SCA" is the SonarQube work (with the strict-Sonar / ArchUnit experiments around it). This document does **not** use the earlier, discarded "Architecture-to-Code Coherence" sense of the term.
**Deliverable identity:** retrospective paired **frontend** Sonar comparison of the PL-CLEANUP change.
**Owner program:** `docs/technology-quality-program-v1.md`; complements `docs/reference-data/sonar/wheelwright-clean-code-profile-delta-v1.md` (the separate, Java-only historical baseline).

---

## 0. What this is (and is not)

This is a **retrospective paired frontend Sonar comparison** measuring the actual PL-CLEANUP change:

- **BEFORE** = `f289fa5d80f00c129f5bf50cbb04f348bb4f11b5` (pre-P2, i.e. immediately before any PL-CLEANUP frontend change).
- **AFTER** = accepted post-cleanup `main` `53918071dad0e8229df19c4d872a3d5e83669980`.

It exists because the only **recorded prior Sonar baseline was Java-only** while PL-CLEANUP was **frontend-heavy** — a genuine coverage gap. This report closes that gap for the cleanup measurement by scanning the **frontend** consistently at both SHAs. It is **measurement only**: it does not authorize or imply any remediation, and residual Sonar findings are **not** a task backlog.

Two comparisons are kept explicitly distinct:

1. **Historical Java Sonar experiment** — separate, unchanged (§4).
2. **This retrospective paired frontend Sonar comparison** — the actual before/after (§2–§3).

---

## 1. Methodology (identical on both sides)

| Field | Value |
|---|---|
| SonarQube server | Community Build **25.9.0.112764** (local `~/sonarqube-run/sonarqube-25.9.0.112764`, embedded H2) |
| Scanner | **SonarScanner CLI 8.1.0.6389** (`/opt/homebrew/bin/sonar-scanner`) |
| JS/TS analyzer | bundled `sonar-javascript-plugin` 11.3.0.34350, embedded Node.js runtime |
| Quality profile | **Sonar Way** (JS/TS + CSS defaults) — neutral baseline; no invented "strict TypeScript" profile |
| `sonar.sources` | `src` (frontend `options-prototype/src`) |
| `sonar.exclusions` | `**/*.test.ts,**/*.test.tsx,**/*.d.ts` |
| SCM handling | `sonar.scm.disabled=true`, `sonar.scm.exclusions.disabled=true` (required because each SHA was scanned in a linked/detached git worktree; without this the scanner SCM-ignored all files) |
| Isolation | each SHA checked out in a detached `git worktree` (`/tmp/sca-before`, `/tmp/sca-after`); the governed working tree was never mutated |
| Differences between runs | only `sonar.projectKey`/`projectName` and the source SHA; all analysis settings identical |

Project keys: `wheelwright-fe-before`, `wheelwright-fe-after`.

Files actually analyzed: BEFORE 197 TS/TSX + 13 CSS; AFTER 162 TS/TSX + 13 CSS (test files excluded by the shared exclusion; `.d.ts` excluded).

### Reproduce

```bash
git worktree add --detach /tmp/sca-before f289fa5d80f00c129f5bf50cbb04f348bb4f11b5
git worktree add --detach /tmp/sca-after  53918071dad0e8229df19c4d872a3d5e83669980
# In each worktree's options-prototype/, an identical sonar-project.properties:
#   sonar.sources=src
#   sonar.exclusions=**/*.test.ts,**/*.test.tsx,**/*.d.ts
#   sonar.scm.disabled=true
#   sonar.scm.exclusions.disabled=true
#   sonar.host.url=http://localhost:9000
#   (projectKey differs: wheelwright-fe-before / wheelwright-fe-after)
sonar-scanner -Dsonar.token=$SONAR_TOKEN   # run once per worktree
# Measures pulled via /api/measures/component; issue facets via /api/issues/search?facets=rules,types,severities
git worktree remove /tmp/sca-before --force; git worktree remove /tmp/sca-after --force
```

### Raw evidence custody

Raw scan logs and API extracts preserved off-repository at **`/tmp/sca-raw/`**:
`measures-before.json`, `measures-after.json`, `issues-facets-before.json`, `issues-facets-after.json`, `rules-before.json`, `rules-after.json`, `scan-before.log`, `scan-after.log`. (Local, not committed — consistent with the SCA-charter custody pattern.)

---

## 2. Executive before/after (Sonar measures)

| Sonar measure | BEFORE (`f289fa5`) | AFTER (`5391807`) | Δ |
|---|---:|---:|---:|
| Files | 210 | 175 | −35 |
| ncloc | 39,705 | 34,199 | −5,506 |
| Bugs | 26 | 20 | −6 |
| Vulnerabilities | 0 | 0 | 0 |
| Code smells | 553 | 436 | −117 |
| Security hotspots | 10 | 8 | −2 |
| Total issues | 579 | 456 | −123 |
| — CRITICAL | 70 | 64 | −6 |
| — MAJOR | 281 | 197 | −84 |
| — MINOR | 228 | 195 | −33 |
| Cognitive complexity | 5,078 | 4,129 | −949 |
| Cyclomatic complexity | 6,718 | 5,390 | −1,328 |
| Duplicated blocks | 60 | 58 | −2 |
| Duplicated lines density | 1.9% | 2.1% | +0.2 pp |
| Technical debt (sqale_index, min) | 3,681 | 2,928 | −753 |
| Maintainability rating (sqale_rating) | A (1.0) | A (1.0) | unchanged |
| Reliability rating | **D (4.0)** | **D (4.0)** | **unchanged** |
| Security rating | A (1.0) | A (1.0) | unchanged |

---

## 3. Finding transitions (Sonar rule facets)

Every top rule **decreased or stayed equal**; **no rule increased**, and no new rule entered the AFTER top set.

| Rule | Description (Sonar) | BEFORE | AFTER | Δ |
|---|---|---:|---:|---:|
| typescript:S6759 | props should be read-only | 99 | 78 | −21 |
| typescript:S3358 | no nested ternary | 95 | 63 | −32 |
| typescript:S3776 | cognitive complexity of function | 64 | 58 | −6 |
| typescript:S4325 | redundant type assertions | 59 | 51 | −8 |
| typescript:S6772 | — | 43 | 17 | −26 |
| typescript:S6479 | no array index as key | 42 | 38 | −4 |
| css:S4666 | duplicate CSS selectors | 28 | 15 | −13 |
| typescript:S6594 | — | 28 | 28 | 0 |
| typescript:S6582 | prefer optional chaining | 15 | 14 | −1 |
| typescript:S3863 | — | 12 | 12 | 0 |
| typescript:S6767 | — | 10 | 10 | 0 |
| typescript:S2933 | readonly members | 9 | 8 | −1 |

Type/severity totals: BUG 26→20, CODE_SMELL 553→436, VULNERABILITY 0→0; CRITICAL 70→64, MAJOR 281→197, MINOR 228→195.

---

## 4. Historical Java Sonar experiment — separate and unchanged

The prior recorded Sonar baseline (`wheelwright-clean-code-profile-delta-v1.md`, subject `a6a44655`, scope `evidence-service-java/src/main` + `src/test`) reported **Sonar way 299 violations (5 bugs, 294 smells)** and **strict profile 462 (5 bugs, 457 smells)**.

That baseline is **Java-only**. **PL-CLEANUP changed zero Java source** — verified: `git diff --name-only a6a44655 5391807 -- 'evidence-service-java/src/**/*.java'` returns empty, and no file anywhere under `evidence-service-java/` changed across the cleanup arc (the only non-frontend/non-docs change in range was adding `.scannerwork/` to `.gitignore`). Therefore the Java Sonar posture is **unchanged by construction** — a comparability/coverage statement, **not** evidence that cleanup improved (or failed to improve) the Java backend, and it did not measure the frontend cleanup. It is retained here as historical evidence only.

---

## 5. Interpretation (conservative)

- **Reductions are primarily attributable to deleted code.** Bugs, code smells, and complexity fell roughly in proportion to the −5,506 ncloc / −35 files removed by PL-CLEANUP (deletion of the eight historical surfaces, obsolete providers, `scan-orchestrator.ts`, etc.). Per-issue key-level differencing was **not** performed, so this report does **not** claim any specific finding was remediated in surviving code. The evidence supports "findings disappeared with the deleted surfaces," not "surviving code was fixed." No remediation was performed.
- **Reliability rating remains D (4.0)** on both sides. The ratings floor did not move; residual bugs (20) and CRITICAL issues (64) live in surviving code. They are **not** converted into a remediation backlog by this measurement.
- **Duplicated-lines density increased 1.9% → 2.1%** even though duplicated blocks fell (60→58): a smaller codebase makes similar duplication a marginally larger fraction. This is the one headline metric that did **not** move in the "less is better" direction and is not spun as improvement.
- **Vulnerabilities remain 0** on both sides.
- **Maintainability A and Security A unchanged.**

### Answers to the before/after questions

- **Did cleanup materially reduce accidental change surface?** Yes — fewer files/ncloc and fewer total Sonar issues, with no rule increasing.
- **What disappeared vs improved in surviving code?** Disappeared-with-deleted-code is the supported explanation; surviving-code remediation is **not** claimed (no issue-level evidence gathered).
- **What remained unchanged?** Reliability D, Maintainability A, Security A, zero vulnerabilities.
- **What became more visible?** The residual bugs/CRITICAL issues in surviving code are now less diluted by dead Lab code, but their counts are unchanged and remain out of scope for remediation here.

---

## 6. Supplemental change-surface evidence (NOT the SCA result)

Clearly separated from the Sonar measurement above; provided only as corroboration of surface reduction:

- **oxlint** (same binary v1.72.0, each tree's `.oxlintrc.json`): BEFORE 3 errors / 48 warnings → AFTER 3 errors / 37 warnings. The 3 errors are the same pre-existing `OperatorConsole.tsx` rules-of-hooks errors on both sides; the 11 fewer warnings disappeared with deleted files.
- **Whole-arc frontend surface** (`git diff --stat f289fa5 51ee08f -- options-prototype/src options-prototype/tests`): 100 files changed, +450 / −9,654 (~9,200 net lines removed).
- **Counts:** `src` TS/TSX files 197→162; components 30→18; provider subtrees 6→0.

These are lint/size metrics, **not** Sonar static code analysis, and are not the SCA result.

---

## 7. Environment note

The local SonarQube instance was reinitialized during this exercise (prior embedded H2 backed up to `~/sonarqube-run/sonarqube-25.9.0.112764/data/sonar.mv.db.bak-20260904-125142`, reversible; admin access restored; a scoped analysis token minted). This affected only the local evaluation instance, never the Wheelwright repository. The prior Java experiment's recorded numbers survive in `wheelwright-clean-code-profile-delta-v1.md` and are unaffected.
