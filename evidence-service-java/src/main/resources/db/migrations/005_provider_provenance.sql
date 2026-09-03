-- Migration 005: Provider/environment provenance on durable evidence
-- (PL-PROV-FAILOVER constraint 1 — degraded evidence provenance is release-critical).
--
-- WHY: setChain/setChainForExpiration/setExpirations upsert on the PK
-- (symbol, evidence_type, expiration). Without provenance, a degraded (sandbox)
-- acquisition would OVERWRITE a production row indistinguishably — commingling
-- sandbox and production evidence and silently promoting degraded evidence to
-- production authority. This migration makes every durable evidence row carry
-- truthful, backend-established provider/environment provenance so a row's source
-- authority is always knowable (ADR-015: provenance survives boundaries; no silent
-- promotion), and the published snapshot/API can preserve it.
--
-- MINIMUM SAFE FORM (this slice): single active acquisition authority at a time
-- (invariant I4) + atomic fenced transitions (I9/I10) mean a subject's current row
-- always reflects ONE authority's evidence; we tag it truthfully rather than
-- physically retaining both regimes' rows simultaneously. Simultaneous
-- multi-regime retention is a richer, deferred form; it is NOT required to prevent
-- commingling/mislabeling, which provenance + single-authority selection already do.
--
-- Backfill: all pre-existing evidence was acquired against production, so existing
-- rows are stamped environment='production'. provenance_id is left NULL for
-- pre-migration rows (their acquisition predates lease-based provenance ids);
-- consumers treat a NULL provenance_id as "pre-provenance production evidence".

ALTER TABLE evidence ADD COLUMN environment TEXT;
ALTER TABLE evidence ADD COLUMN provenance_id TEXT;

-- Backfill existing rows as production provenance (they were all production-acquired).
UPDATE evidence SET environment = 'production' WHERE environment IS NULL;

CREATE INDEX idx_evidence_environment ON evidence(environment);
