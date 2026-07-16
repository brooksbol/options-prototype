/**
 * Status route — /api/status
 * Exposes scheduler, store, cache, and pacer diagnostics.
 */

import { Router } from "express";
import type { ServiceConfig } from "../config.js";
import { getResponseCache } from "../response-cache.js";
import { getRequestPacer } from "../request-pacer.js";
import { getEvidenceStore } from "../evidence-store.js";
import { getAcquisitionWorker } from "../acquisition-worker.js";

export function statusRouter(config: ServiceConfig): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    const cache = getResponseCache();
    const pacer = getRequestPacer();
    const store = getEvidenceStore();
    const worker = getAcquisitionWorker(config);

    res.json({
      status: "ok",
      provider: "tradier",
      environment: "sandbox",
      credentialConfigured: !!config.tradierApiKey && config.tradierApiKey !== "your_tradier_sandbox_token_here",
      scheduler: worker.getStatus(),
      evidence: {
        generation: store.generation,
        generatedAt: store.generatedAt,
        coverage: store.getCoverage(),
        universe: store.buildSnapshot().universe,
      },
      cache: cache.stats(),
      pacer: pacer.getState(),
    });
  });

  return router;
}
