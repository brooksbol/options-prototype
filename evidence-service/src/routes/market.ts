/**
 * Market routes — /api/market/expirations, /api/market/chain
 *
 * Application-owned contract. Does not expose Tradier response shapes.
 * Provider rate limits are managed by the backend (cache + pacing).
 * The frontend never sees 429 during normal acquisition.
 */

import { Router } from "express";
import type { ServiceConfig } from "../config.js";
import { TradierAdapter, ProviderError } from "../providers/tradier.js";

export function marketRouter(config: ServiceConfig): Router {
  const router = Router();
  const adapter = new TradierAdapter(config);

  // GET /api/market/expirations?symbol=XLE
  router.get("/expirations", async (req, res) => {
    const symbol = req.query.symbol as string | undefined;

    if (!symbol || symbol.trim().length === 0) {
      res.status(400).json({
        error: "invalid_request",
        message: "Query parameter 'symbol' is required.",
      });
      return;
    }

    try {
      const result = await adapter.getExpirations(symbol.trim());

      res.json({
        symbol: symbol.trim().toUpperCase(),
        expirations: result.expirations,
        provider: "tradier",
        environment: "sandbox",
        retrievedAt: result.retrievedAt,
        cacheHit: result.cacheHit,
      });
    } catch (err) {
      if (err instanceof ProviderError) {
        res.status(err.statusCode >= 500 ? 502 : err.statusCode).json({
          error: "provider_error",
          message: err.message,
          retryAfterMs: err.retryAfterMs ?? null,
        });
      } else if (err instanceof Error && err.message.includes("queue full")) {
        res.status(503).json({
          error: "capacity_exhausted",
          message: "Provider capacity temporarily exhausted. Retry shortly.",
        });
      } else {
        res.status(500).json({
          error: "internal_error",
          message: "Unexpected error during expirations fetch.",
        });
      }
    }
  });

  // GET /api/market/chain?symbol=XLE&expiration=2026-08-21
  router.get("/chain", async (req, res) => {
    const symbol = req.query.symbol as string | undefined;
    const expiration = req.query.expiration as string | undefined;

    if (!symbol || symbol.trim().length === 0) {
      res.status(400).json({
        error: "invalid_request",
        message: "Query parameter 'symbol' is required.",
      });
      return;
    }

    if (!expiration || !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) {
      res.status(400).json({
        error: "invalid_request",
        message: "Query parameter 'expiration' is required (format: YYYY-MM-DD).",
      });
      return;
    }

    try {
      const result = await adapter.getOptionsChain(symbol.trim(), expiration);

      res.json({
        ...result.chain,
        provider: "tradier",
        environment: "sandbox",
        retrievedAt: result.retrievedAt,
        cacheHit: result.cacheHit,
      });
    } catch (err) {
      if (err instanceof ProviderError) {
        res.status(err.statusCode >= 500 ? 502 : err.statusCode).json({
          error: "provider_error",
          message: err.message,
          retryAfterMs: err.retryAfterMs ?? null,
        });
      } else if (err instanceof Error && err.message.includes("queue full")) {
        res.status(503).json({
          error: "capacity_exhausted",
          message: "Provider capacity temporarily exhausted. Retry shortly.",
        });
      } else {
        res.status(500).json({
          error: "internal_error",
          message: "Unexpected error during chain fetch.",
        });
      }
    }
  });

  return router;
}
