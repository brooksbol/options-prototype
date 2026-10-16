# PL-API-02 Step 5 — proposed protocol integration

**Status:** Candidate, not adopted. Principal accepted the revised 15-public/19-internal documentation on October 15 and authorized Step 5. Existing deferred domain concerns/native presentation limitations do not block that acceptance. Independent review and cold-start execution must pass before applying the following exact insertion.

Insert at the end of item 5 (Verify the workstream), before item 6, in `docs/bootstrap/end-of-session-protocol.md`:

> - **Check API v2 documentation currency.** Execute [API v2 documentation update procedure](api-v2-documentation-update-procedure.md): inspect closing-workstream changes and the last verified deployment, determine accepted-update / no-op / acceptance-pending, validate and regenerate where required, and observe the exact-source Actions deployment and live artifact identities. Preserve the authoritative internal/public boundary and existing publication gates; a source push or green preview is not proof of publication.
> - Perform the pre-persistence checks here, publication observation after the authorized persistence in item 6, and the final trigger/SYNC recheck in item 7. Documentation validation/deployment/hosting failure is nonblocking for ordinary session closeout: persist and report the exact unresolved status and next authorized action, without claiming synchronized docs or crossing missing Product/security authority.

The procedure's candidate status changes to adopted only after separate reviewer acceptance and cold-start pass. Evidence-only final commits do not require redeploying unchanged site bytes. Reconcile issue #39 after verified adoption. Do not silently resolve the broader PL-API-02 weak-typing/domain-model intake.
