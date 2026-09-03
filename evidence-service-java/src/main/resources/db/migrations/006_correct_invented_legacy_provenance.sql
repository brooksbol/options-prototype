-- Migration 006: Correct migration 005's INVENTED legacy production provenance.
-- (PL-PROV-FAILOVER observer/provenance correction.)
--
-- WHY: Migration 005 backfilled EVERY pre-existing evidence row to
-- environment='production'. For rows acquired BEFORE lease-based provenance existed,
-- that label is an INVENTION — those rows carry no provenance_id, so their true source
-- authority is not actually known. Asserting 'production' fabricates provenance and
-- would let genuinely-unknown historical evidence masquerade as authoritatively
-- production-sourced (violating "persist facts; derive trust" and ADR-015: never infer
-- or promote an environment).
--
-- CORRECTION (forward, non-destructive, idempotent): distinguish GENUINELY-ESTABLISHED
-- provenance from ASSUMED provenance by the presence of a provenance_id:
--   * Rows WITH a provenance_id were written by the lease path — their environment is
--     genuinely established (production OR sandbox). LEAVE THEM UNTOUCHED.
--   * Rows WITHOUT a provenance_id AND currently labelled 'production' are exactly the
--     005 invented-backfill signature (no lease ever stamped them). Their true source is
--     NOT known, so relabel them 'unknown' rather than asserting 'production'.
--
-- Consumers already treat a chain subject with a null/unknown environment as
-- {"kind":"unavailable"} provenance (SnapshotBuilder.environmentProvenanceJson) rather
-- than promoting it — so 'unknown' is surfaced honestly, never as production authority.
--
-- This does NOT introduce dual-row/multi-authority retention (that remains a separate
-- architecture question). It only corrects a mislabel on existing single rows.

UPDATE evidence
SET environment = 'unknown'
WHERE provenance_id IS NULL
  AND environment = 'production';
