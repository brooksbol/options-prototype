# Wheelwright Clean Code — Sonar Profile Delta v1 (profile-as-code)

**Status:** Category C reference — reproducible strict-Sonar configuration
**Owner doc:** `docs/technology-quality-fitness-controls-v1.md`
**Base:** SonarQube built-in **Sonar way** (Java). This file records ONLY the delta Wheelwright adds.
**Why delta, not full dump:** Sonar way evolves across SonarQube versions. Pinning a 559-rule dump would silently diverge from the base and obscure what Wheelwright actually decided. The delta is the reviewable, defensible policy.

## Reproduce the profile

On any SonarQube instance (tested: Community Build 25.9):

1. Copy `Sonar way` (Java) → new profile `Wheelwright Clean Code Experimental`.
2. Activate each rule below with the given parameters.
3. Assign the profile to the target project.

API sequence (token with quality-profile-admin permission):

```
POST /api/qualityprofiles/copy            fromKey=<Sonar way java key>  toName=Wheelwright Clean Code Experimental
POST /api/qualityprofiles/activate_rule   key=<new profile key>  rule=<rule>  params=<k=v;...>   (per row below)
POST /api/qualityprofiles/add_project     language=java  qualityProfile=Wheelwright Clean Code Experimental  project=<key>
```

## Delta rules (activate beyond Sonar way)

Thresholds are **Principal-ratified provisional parameters** — defensible for design signal, revisable with evidence.

| Rule | Name | Params (Wheelwright) | Sonar way default | Band concept |
|------|------|----------------------|-------------------|--------------|
| java:S1200 | Classes coupled to too many others | max=15 | 20 (inactive) | coupling |
| java:S1448 | Too many methods | maximumMethodThreshold=20; countNonpublicMethods=true | 35 (inactive) | SRP proxy |
| java:S1820 | Too many fields | maximumFieldThreshold=12; countNonpublicFields=true | 20 (inactive) | mutable-state / SRP proxy |
| java:S138  | Method too many lines | max=60 | 75 (inactive) | method size |
| java:S1541 | Cyclomatic complexity | Threshold=10 | inactive | complexity |
| java:S104  | File too many lines | Max=500 | 750 (inactive) | class/file size |
| java:S134  | Nesting depth | max=3 | inactive | brain-method proxy |
| java:S1142 | Too many returns | max=3 | inactive | complexity |
| java:S2972 | Inner class too many lines | (default) | inactive | size |
| java:S2384 | Private mutable members exposed | — | inactive | encapsulation |
| java:S2325 | Method not using instance data should be static | — | inactive | cohesion signal |
| java:S2693 | Threads started in constructors | — | inactive | construction-in-orchestration |
| java:S3366 | `this` exposed from constructors | — | inactive | construction safety |
| java:S2156 | final class should not have protected members | — | inactive | encapsulation |
| java:S1610 | Abstract class w/o fields → interface | — | inactive | OO design |
| java:S1694 | Abstract class needs abstract + concrete | — | inactive | OO design |
| java:S1258 | Class/enum with private members needs constructor | — | inactive | OO hygiene |
| java:S1160 | Public method throws ≤ 1 checked exception | — | inactive | contracts |
| java:S2221 | "Exception" not caught when not required | — | inactive | contracts |
| java:S3242 | Method params declared with base types | — | inactive | DIP-ish contract |
| java:S3553 | Optional not used for params | — | inactive | contract hygiene |
| java:S2301 | Public methods not contain selector arguments | — | inactive | API design |

## Baseline evidence (informational — not a gate)

Subject `a6a446556c0ef6b42d222cfc8176e3adda76bd9e`, Java scope `evidence-service-java/src/main` + `src/test`, JaCoCo coverage 70.8%:

- Sonar way: 299 violations (5 bugs, 294 smells)
- Strict profile: 462 violations (5 bugs, 457 smells) — delta +163, all code smells, concentrated in the design-signal rules above.

Top new-rule contributors: S2325 (32), S134 (25), S1142 (24), S1541 (21), S2221 (15), S138 (14), S3242 (11), S1200 (6), S1448 (5), S1820 (3).
