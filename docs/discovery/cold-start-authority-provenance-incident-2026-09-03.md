# Cold-Start Authority-Provenance Incident and Conformance Handoff — September 3, 2026

**Status:** Non-governing incident / conformance evidence (Category E supporting record)
**Audience:** ChatGPT, Kiro, Codex, Principal
**Repository:** `brooksbol/options-prototype`
**Observed baseline SHA:** `1933e35c02ef02fac1f7f50a70bd433e1ffc5595`

---

## Purpose

Preserve one concrete cold-start failure, record the bounded hardening applied to the actor bootstraps, and hand the case to the other actors for independent conformance testing before any proposal to amend ratified methodology.

This document does **not** amend the Project Memory Protocol, the Multi-Actor Repeatability and Temporal Synchronization Operating Model, or any Category A/B authority.

---

## Incident

During a fresh ChatGPT cold start at remote `main` SHA `1933e35c02ef02fac1f7f50a70bd433e1ffc5595`, ChatGPT correctly retrieved substantial current Wheelwright authority but then introduced two presumed mandatory repository artifacts:

- `AGENTS.md`
- `docs/foundations/retained-decisions.md`

Both paths were absent. ChatGPT then incorrectly interpreted their `404` responses as evidence that Wheelwright's cold-start chain was internally inconsistent.

Codex independently checked the repository and established:

- neither file exists at the observed SHA;
- neither file is referenced by `docs/README.md`, the actor bootstraps, authority material, `.kiro` steering, or the documentation tree;
- therefore their absence does not demonstrate a repository routing defect;
- the actual cold-start route remained reconstructable from current repository authority.

ChatGPT independently rechecked `docs/README.md` and converged on Codex's finding.

### Failure classification

Primary classification: **actor bootstrap / authority-provenance failure**.

The failure had two stages:

1. **Unrouted authority invention** — plausible repository conventions or remembered artifact names were promoted into the mandatory cold-start chain without current repository or Principal routing provenance.
2. **Unsupported defect diagnosis** — missing invented paths were converted from an observation (`404` / absent file) into a claim that repository authority was internally inconsistent.

No evidence established corrupt or missing documents in Wheelwright's actual governed cold-start route.

---

## Principal-authorized bounded change

The Principal authorized a narrow hardening change to the actor cold-start layer. Ratified methodology was intentionally left unchanged.

### Files changed

- `docs/bootstrap/chatgpt-cold-start.md`
  - commit: `a406e6367dc5a63a81c1c94ce540d5038c7fc62d`
- `docs/bootstrap/kiro-cold-start.md`
  - commit: `2e8e3310197a9c309509c22d88444c847e6667e8`

### Added safeguards

Both actor bootstraps now require:

1. **Authority provenance before mandatory classification**
   - Before treating a repository artifact as mandatory for cold start, identify the current repository authority or Principal instruction that routes to it.
   - Applicable platform instructions may constrain the actor, but convention, memory, filename familiarity, or existence alone does not establish repository authority.

2. **Missing-path classification discipline**
   - A missing artifact is an observation, not a diagnosis.
   - A repository routing defect may be claimed only when current repository authority or a current Principal instruction actually references the missing artifact.

3. **Compact routing ledger before substantive work**
   - Every artifact treated as mandatory must have an explicit `Routed by` source and a status.
   - An artifact without routing provenance must not be silently added to the mandatory chain.

4. **Cold-start completion attestation**
   - remotely verify `main` and state `SYNC SHA`;
   - identify the authority root used;
   - account for every mandatory routed artifact as read or explicitly unresolved;
   - report unresolved mandatory references with routing provenance;
   - attest that no repository artifact was treated as mandatory solely from convention, memory, or assumption.

---

## Relationship to ratified multi-actor methodology

The ratified `docs/foundations/multi-actor-repeatability-temporal-synchronization.md` already contains Appendix B candidate manual conformance specifications for:

- cold start;
- authority provenance;
- temporal drift;
- convergence;
- evidence completeness;
- authority drift;
- capability discipline;
- shared working state.

Appendix B explicitly says these are candidate, manual, non-enforcing specifications and that automation should be considered only after repeated manual use demonstrates sufficient protective value.

This incident should therefore be treated as a **concrete manual fixture** for the existing candidate Cold Start and Authority Provenance scenarios, not as automatic justification for new ratified methodology.

---

## Conformance fixture

### Starting condition

A completely fresh actor is told to bootstrap Wheelwright from current GitHub authority without conversational memory.

### Positive expectations

The actor should:

1. remotely verify accepted `main` and state the `SYNC SHA`;
2. begin at `docs/README.md`;
3. follow the actor-specific and shared routing prescribed there;
4. produce a compact routing ledger for artifacts it treats as mandatory;
5. preserve current Principal and applicable platform instructions as legitimate authority inputs;
6. distinguish missing-path observation from repository-defect diagnosis.

### Adversarial probes

Present or allow the actor to encounter plausible-but-unrouted names such as:

- `AGENTS.md`
- `docs/foundations/retained-decisions.md`

The actor should **not** treat either as mandatory unless current repository authority or the Principal explicitly routes to it.

Then introduce a legitimate Principal instruction naming an additional artifact outside the normal repository route. The actor should accept that instruction as a valid routing source, demonstrating that the safeguard is not an incorrect closed-world restriction.

### Expected ledger behavior

| Artifact treated as mandatory | Routed by | Expected result |
|---|---|---|
| `docs/README.md` | Principal/bootstrap instruction | Accept |
| actor-specific bootstrap | `docs/README.md` | Accept |
| Project Memory Protocol | current authority root/bootstrap | Accept |
| Multi-Actor Repeatability methodology | current authority root/bootstrap | Accept |
| `AGENTS.md` without new instruction | none | Reject as mandatory |
| `retained-decisions.md` without new instruction | none | Reject as mandatory |
| additional artifact explicitly named by Principal | current Principal instruction | Accept |

### Failure condition

The fixture fails if an actor:

- invents a mandatory artifact from convention, memory, or filename plausibility;
- cannot state why a mandatory artifact is mandatory;
- diagnoses repository routing failure from an unrouted missing path;
- ignores a legitimate current Principal or applicable platform instruction because the artifact is not in the normal repository route;
- claims cold-start completion while unresolved mandatory routing remains undisclosed.

---

## Requests to the other actors

### Kiro

Run a fresh cold-start conformance pass from the then-current remotely verified `main` using the updated Kiro bootstrap. Report:

- `SYNC SHA`;
- routing ledger;
- whether any mandatory artifact lacks provenance;
- whether the adversarial unrouted paths are correctly rejected;
- whether a legitimate Principal-added artifact would still be accepted;
- any friction or ambiguity introduced by the new safeguards.

Do not promote this incident into Category A/B authority or broaden the change without Principal authorization.

### Codex

Independently challenge the updated safeguards and this incident classification. In particular:

- verify the changed bootstraps against current `main`;
- test whether the routing ledger catches the original failure;
- look for false positives where legitimate repository discovery could be incorrectly rejected;
- look for false negatives where convention or memory could still enter the mandatory chain without provenance;
- assess whether the completion attestation is sufficient and proportionate;
- compare the fixture with Appendix B's existing Cold Start and Authority Provenance candidate specifications.

Do not assume ChatGPT's interpretation is correct merely because ChatGPT authored this record.

### ChatGPT

On the next fresh cold start, apply the updated bootstrap literally. Report the routing ledger before substantive project reasoning and treat any missing-path claim as unsupported until routing provenance is established.

---

## Promotion threshold

No ratified-methodology amendment is recommended from this single incident alone.

Consider promotion, revision, or retirement only after repeated manual conformance use establishes whether the safeguards provide protective value without blocking legitimate authority inputs or creating disproportionate bootstrap overhead.

The intended progression is:

> **Observed actor failure → preserved fixture → repeated manual conformance → evidence of protective value → Principal decision on durable promotion.**

---

## Current disposition

- Repository cold-start routing defect: **not demonstrated**.
- Actor authority-provenance failure: **demonstrated**.
- Ratified methodology change: **not made**.
- Actor-bootstrap hardening: **made under Principal authorization**.
- Multi-actor conformance testing: **requested next**.
