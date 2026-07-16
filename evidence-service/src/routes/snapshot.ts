/**
 * Snapshot route — GET /api/evidence/snapshot
 *
 * Serves the current evidence state with conditional HTTP support (ETag / 304).
 * The frontend polls this endpoint to observe backend-maintained evidence.
 */

import { Router } from "express";
import { getEvidenceStore } from "../evidence-store.js";

export function snapshotRouter(): Router {
  const router = Router();

  // Disable Express's built-in ETag generation — we manage ETags explicitly
  router.use((_req, res, next) => {
    res.set("etag", undefined as any); // disable auto-etag
    next();
  });

  router.get("/snapshot", (req, res) => {
    const store = getEvidenceStore();
    const currentETag = store.getETag();

    // Conditional: If-None-Match (robust comparison — handle weak validators)
    const clientETag = req.headers["if-none-match"];
    if (clientETag) {
      // Strip W/ prefix if present, normalize for comparison
      const normalizedClient = clientETag.replace(/^W\//, "").trim();
      const normalizedCurrent = currentETag.replace(/^W\//, "").trim();
      if (normalizedClient === normalizedCurrent) {
        res.status(304).end();
        return;
      }
    }

    // Build snapshot
    const snapshot = store.buildSnapshot();
    const payload = JSON.stringify(snapshot);
    const payloadBytes = Buffer.byteLength(payload, "utf-8");

    // Set headers — ETag must come before send
    res.setHeader("ETag", currentETag);
    res.setHeader("Cache-Control", "private, no-cache");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Payload-Bytes", String(payloadBytes));
    res.setHeader("X-Generation", String(store.generation));

    res.send(payload);
  });

  return router;
}
