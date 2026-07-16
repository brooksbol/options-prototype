/**
 * Status route — /api/status
 */

import { Router } from "express";
import type { ServiceConfig } from "../config.js";
import { getResponseCache } from "../response-cache.js";
import { getRequestPacer } from "../request-pacer.js";

export function statusRouter(config: ServiceConfig): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    const cache = getResponseCache();
    const pacer = getRequestPacer();

    res.json({
      status: "ok",
      provider: "tradier",
      environment: "sandbox",
      credentialConfigured: !!config.tradierApiKey && config.tradierApiKey !== "your_tradier_sandbox_token_here",
      cache: cache.stats(),
      pacer: pacer.getState(),
    });
  });

  return router;
}
