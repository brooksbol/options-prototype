# Wheelwright Untouched Technology Quality Baseline — SCA Charter v1

**Authorized:** September 3, 2026
**Status:** Principal-authorized baseline-execution charter
**Authority:** Category C — Canonical Project / Operational State (scoped to the Software Composition Analysis baseline execution)
**Governing authority:** `technology-quality-program-v1.md` (Workstreams 3–4), `foundations/technology-quality-constitution-v1.md` (§ Version-one baseline authorization), `foundations/multi-actor-repeatability-temporal-synchronization.md`
**Deliverable identity:** Technology Quality Program v1 deliverable #5 — Untouched Baseline Charter (SCA scope)

---

## 1. Purpose

This charter converts the Program's baseline authorization into an executable, reproducible Software Composition Analysis (SCA) measurement plan **before** interpretation. It records the exact Principal decisions, subject, harness, scope, disclosure/custody boundary, and reproducibility rules under which the untouched dependency/security evidence stream (Program Workstream 4, stream 5) is captured.

This is the corrected execution. It supersedes, as the governing plan, an earlier provisional SCA package that was independently reviewed by Codex and rejected for a Java dependency-inventory defect (evicted-version contamination), corrupted runtime/test classification, a synthesized-not-native lockfile, absent database/binary identity, and out-of-sequence execution. That earlier package is preserved **unchanged** as rejected evidence; this charter does not rewrite it.

The charter authorizes **measurement only. No remediation is authorized.** Scanner severity is evidence, not a remediation priority or ordering.

---

## 2. Principal decisions recorded

The following decisions were issued by the Principal and are the authority for this run:

1. **Frozen immutable subject SHA:** `f4546a81475733697e48492840f9e02f981b49fd` (remotely verified accepted `main`).
2. **Execution mode:** fully **offline** vulnerability matching.
3. **Scope:** frontend **and** Java, with Java **runtime, build, test, Gradle wrapper/plugins, and packaged artifacts covered separately**.
4. **No suppression and no severity threshold** — record all findings.
5. **Raw evidence kept local** until reviewed; not committed.
6. **Roles:** Kiro owns execution; Codex owns adversarial review; the Principal owns final acceptance.
7. **No remediation authorized.**
8. **Preserve the previous package unchanged as rejected evidence.**
9. **Create this charter artifact before execution.**
10. **Commit/push authorization is limited to this charter document only.** Committing scan results or remediation is **not** authorized and requires separate Principal authorization.

---

## 3. Immutable subject

| Field | Value |
|---|---|
| Subject SHA | `f4546a81475733697e48492840f9e02f981b49fd` |
| Remote-verified | `git ls-remote origin refs/heads/main` == subject SHA |
| Repository | `brooksbol/options-prototype` |

The baseline belongs to this exact SHA. Ongoing development does not mutate it. Re-baselining is a deliberate new identity.

---

## 4. Harness identity

| Field | Value |
|---|---|
| Scanner | OSV-Scanner 2.5.1 (osv-scalibr 0.5.2) |
| Scanner binary path | `/opt/homebrew/Cellar/osv-scanner/2.5.1/bin/osv-scanner` |
| Scanner binary SHA-256 | `a4565d43b4a0a9e2d47f5474d712fabac9647fe4d33feb4521ffabd8ef0b6e8a` |
| Matching mode | `--offline-vulnerabilities` against a local OSV database cache |
| OSV DB — Maven | SHA-256 `7274e6daefd2fdbc0b932a1fca6ee93fae1cf49bce1914174eae4b153c7876c8` (10,285,190 bytes), snapshot 2026-09-03T22:59:26Z |
| OSV DB — npm | SHA-256 `bc8268128c90634bce53349df3c83cba77f8c0169cee725d00971bd59a2818c1` (222,153,056 bytes), snapshot 2026-09-03T22:59:26Z |
| Java toolchain | Temurin 21.0.11+10 LTS; Gradle 9.6.1 (wrapper) |
| Node toolchain | Node v24.18.0 / npm 11.16.0 |
| Host | Darwin 25.6.0 arm64 |

The OSV database snapshot hashes are the reproducibility anchor: vulnerability matches are a function of (subject inventory × DB snapshot). A different DB snapshot may change match counts without any dependency change and must be recorded as such, not as estate deterioration/improvement.

---

## 5. Scope and method (per required scope, separately)

Resolution evidence is produced by **native machine-readable mechanisms**, never by parsing human-readable dependency-tree output.

| Scope | Method | Inventory result |
|---|---|---|
| Frontend (npm) | `package-lock.json` (lockfileVersion 3), bit-identical to committed subject SHA | 194 package nodes |
| Java resolved graph | Native Gradle dependency locking (`gradlew dependencies --write-locks`) → `gradle.lockfile` with per-configuration **selected** versions | 67 packages |
| Java runtime vs test | Configuration tags in the native lockfile (`productionRuntimeClasspath`/`runtimeClasspath` vs `test*Classpath`) | authoritative per-package scope |
| Java build/plugin classpath | `gradlew buildEnvironment` | 23 GAVs (incl. `spring-boot-gradle-plugin:3.4.3`, `dependency-management-plugin:1.1.7`) |
| Gradle wrapper/distribution | `gradle-wrapper.properties` + wrapper jar hash | `gradle-9.6.1-bin.zip`; wrapper jar SHA-256 `497c8c2a...`; **no `distributionSha256Sum` pinned** (recorded supply-chain observation) |
| Packaged artifact | `gradlew bootJar` → inventory of `BOOT-INF/lib/*.jar` | 31 shipped jars; jar SHA-256 `f9f56b4e...` |

### Included / excluded / generated policy

- **Included:** production runtime, test, build/plugin classpath, wrapper, packaged runtime jars, and frontend dependency graph.
- **Excluded (git-ignored, non-source):** `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.env`, `data/*.sqlite3*`.
- Tests, build scripts, and operational tooling are **not** automatically excluded; they are included and scope-tagged.

### Known coverage boundaries (this charter's SCA scope)

- SCA covers dependency-vulnerability evidence only. Static/mechanical quality, architecture-to-code coherence, dead-code topology, test/behavioral-evidence quality, and coupling/changeability are separate Program Workstream 4/5 streams and are out of this charter's scope.
- CVSS is scanner-reported and does not establish Wheelwright exploitability/reachability. Reachability and consequence analysis are Workstream 5, not performed under this measurement charter.
- The frontend prod-bundle-to-source correlation is not performed; npm findings are reported at lockfile scope with dev/prod dependency classification.
- JDK/deployment-runtime vulnerability scope (the Temurin JRE itself, container base images) is out of scope for this dependency-manifest SCA.

---

## 6. Disclosure and data-custody boundary

- Matching is fully **offline** against the recorded local OSV databases. **deps.dev / OSV.dev is not contacted for matching.** The only network access was the one-time database download, whose exact snapshot is hashed above.
- **No source code and no analysis results are uploaded** to any third party.
- `TRADIER_API_KEY` / `.env` and any credential material are never read, referenced, or transmitted.
- Raw results are retained **local only** in the isolated harness and are **not** committed under this authorization.

---

## 7. Isolation

- Execution occurs in a detached `git worktree` checked out at the exact subject SHA under the isolated harness directory. The governed repository working tree is never mutated by scan setup (lockfile generation, bootJar build, etc.).
- Lockfile generation activated Gradle locking via an isolated init script applied only inside the worktree copy; it is never committed to the governed build.

---

## 8. Raw-result custody and integrity

- Harness root: `~/wheelwright-sca-baseline/f4546a81475733697e48492840f9e02f981b49fd/` (off-repository).
- Raw outputs: `raw/osv-npm.json`, `raw/osv-npm.table.txt`, `raw/osv-java.json`, `raw/osv-java.table.txt`, plus per-scope `stderr`.
- Integrity: `meta/manifest.sha256` (SHA-256 of every evidence artifact), `meta/input-hashes.sha256`, `meta/reproducibility.yaml` (valid structured metadata), `meta/osv-db-snapshot.yaml`, `meta/invocation-exit-codes.txt` (exact per-invocation exit codes; all `=1`, OSV-Scanner's documented "vulnerabilities found" status, not an error).
- Interpretation is kept separate from raw evidence.

---

## 9. Reproducible command sequence

```bash
# Anchor
SUBJECT=f4546a81475733697e48492840f9e02f981b49fd
git ls-remote origin refs/heads/main   # must equal $SUBJECT
git worktree add --detach "$H/subject-worktree" "$SUBJECT"

# Native Java resolution (selected versions, per-config) — isolated worktree only
./gradlew --init-script lock.init.gradle.kts dependencies --write-locks   # LockMode.LENIENT, lockAllConfigurations
./gradlew buildEnvironment            # build/plugin classpath
./gradlew bootJar -x test             # packaged artifact; inventory BOOT-INF/lib

# Offline OSV databases (one-time fetch; snapshot hashed)
export OSV_SCANNER_LOCAL_DB_CACHE_DIRECTORY="$H/osv-db-cache"
osv-scanner scan source --offline-vulnerabilities --download-offline-databases \
  -L package-lock.json -L gradle.lockfile

# Offline scans (no suppression, no threshold), per scope, capturing exit codes
osv-scanner scan source --offline-vulnerabilities -L package-lock.json --format=json
osv-scanner scan source --offline-vulnerabilities -L gradle.lockfile   --format=json
```

---

## 10. Materiality threshold

Per Principal decision, **all findings are recorded with no severity threshold and no suppression.** Consequence weighting (runtime-shipped vs test/build-only, reachability) is performed downstream in Workstream 5 reconciliation, not by dropping findings here.

---

## 11. Baseline exit criteria (SCA stream)

The SCA dependency/security stream is complete for this subject when:

1. the subject SHA has complete reproducibility metadata (subject SHA, scanner binary hash, OSV DB snapshot hashes, toolchain, timestamps) — **met**;
2. frontend and all required Java scopes have native, machine-readable inventories with per-scope classification — **met**;
3. raw results are captured offline with per-invocation exit codes and a full integrity manifest — **met**;
4. the prior rejected package is preserved unchanged — **met**;
5. findings are recomputed from scratch (not derived by subtracting known defects) — **met**;
6. limitations and coverage boundaries are stated rather than hidden — **met**;
7. no remediation contaminated the baseline — **met**;
8. the package is handed to Codex for adversarial review and to the Principal for final acceptance — **pending**.

Findings themselves are held as local raw evidence and are **not** part of this charter document. They are presented separately for Codex review and Principal acceptance and are not committed under the current authorization.

---

## 12. Authority and change

This charter records a scoped, Principal-authorized measurement plan. Material change to subject SHA, scope, disclosure boundary, or custody rules requires Principal re-authorization. Promotion of any finding to remediation work requires separate authorization through the Program's Workstream 5 reconciliation and the normal delivery/authority process.
