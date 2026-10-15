# WW pull — UX feedback and Git pull benchmark

**Date:** October 15, 2026
**Status:** Principal UX feedback / design intake only. No implementation, Product acceptance of a change, or authorization to alter acquisition semantics.

## Observed operator experience

The Principal exercised the ordinary installed `ww pull` across `pts`, `sawdust`, and `tt1`. Its human output reported reused Fidelity evidence (933 and 327 retained history records with coverage RETAINED/UNVERIFIED), updated tastytrade holdings (21 ACQUIRED/REUSABLE history records), and 16 newly acquired quotes with zero failures. It ended with a generic lifetime-coverage qualification. These are observed reported results, **not** evidence of complete brokerage history or universal freshness.

## Principal UX direction

Use **`git pull` as the benchmark for `ww pull`**. The Principal demonstrated the ordinary Git no-op response:

    $ git pull
    Already up to date.
    $

Git prints concise no-op output, but when there is actual work it can provide progress and detailed change reporting similar to the existing `ww pull`. The goal is **not** to replace useful change reporting with a dashboard or always suppress diagnostics. Routine no-ops should be quiet; real changes and exceptions should be visible.

## Bounded proposed behavior (not yet accepted implementation)

- **True no-op:** A concise Git-like completion message, *only if* the backend can establish an appropriately scoped no-change result. Do not claim `Already up to date.` merely because a broker could not be reached, an observation was reused, no local CSV was found, or history coverage is unknown.
- **Changes acquired/admitted:** Preserve compact account/quote progress and an accurate summary of meaningful work. Do not narrate redundant internal implementation details.
- **Partial/total failure:** Surface actionable exceptions, preserve honest nonzero/partial-failure exit semantics as appropriate, and do not convert unknown coverage into a green success assertion.
- **Detail on demand:** Retain full provenance, evidence clocks, source coverage, retained/import counts and diagnostic distinctions through existing verbose or structured capabilities where supported; do not invent flags/contracts without investigation.
- **No backend behavior change implied:** UX feedback does not authorize modifying brokerage acquisition, read-through policy, grants, persistence, APIs, or `ww history`.

## Falsifier / next investigation

Inspect the existing `ww pull` result model to determine whether it can **truthfully distinguish** no-op, newly observed but unchanged evidence, reused held evidence, and actual changes. The Git analogy is a human-output benchmark, **not** an assertion that Wheelwright has Git's completeness/synchronization guarantees. Verify real no-op and changed-work specimens before recommending any code changes.

**Next step:** Principal will run `git pull` after this documentation-only commit to provide a real changed-work comparison. Capture that observation separately before settling exact output wording.

## Observed Git changed-work comparison

On October 15 the Principal ran `git pull` after the earlier documentation commit. The terminal showed a fast-forward of `main` from `36e7d6f` to `c1a60d6`, remote enumeration and transfer progress, then a concise summary: one new Markdown file, 32 insertions. The shell prompt returned immediately. This is observed behavior, not a mockup.

Combined with the observed no-op `Already up to date.`, the UX principle is: **default verbosity should be proportional to meaningful work and exceptions**. Report progress and changed resources when work occurs; keep routine no-ops quiet; report failures specifically. Git's progressive output is a useful precedent but does not mandate streaming infrastructure in Wheelwright.

The comparison is about human presentation only. Git's completeness guarantees do not transfer to brokerage history, observation clocks, or retained evidence. A truthful Wheelwright no-op requires a defined evidence-state test; reused evidence and unknown lifetime coverage must not be misrepresented as fully synchronized. This is feedback, not implementation authorization.
