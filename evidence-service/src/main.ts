/**
 * Evidence Service — Background Evidence Acquisition + Market Proxy
 *
 * Owns:
 *   - Tradier credential custody
 *   - Background evidence acquisition (self-scheduling, non-overlapping)
 *   - Process-lifetime evidence store (transitional, non-durable)
 *   - Snapshot publication with ETag/conditional HTTP
 *   - Market data proxy endpoints (legacy, for browser-owned scan fallback)
 *   - Request pacing and response caching
 *
 * The browser only talks to this service. Provider details are hidden.
 */

import express from "express";
import { marketRouter } from "./routes/market.js";
import { statusRouter } from "./routes/status.js";
import { snapshotRouter } from "./routes/snapshot.js";
import { loadConfig } from "./config.js";
import { requestLogger } from "./middleware/logging.js";
import { getAcquisitionWorker } from "./acquisition-worker.js";

const config = loadConfig();

const app = express();

// Disable Express's automatic ETag generation — we manage ETags explicitly for snapshots
app.set("etag", false);

app.use(requestLogger);
app.use("/api/market", marketRouter(config));
app.use("/api/evidence", snapshotRouter());
app.use("/api", statusRouter(config));

// Nudge endpoint: POST /api/evidence/refresh
app.post("/api/evidence/refresh", (_req, res) => {
  const worker = getAcquisitionWorker(config);
  worker.nudge();
  res.json({ status: "nudged" });
});

app.listen(config.port, () => {
  console.log(`[evidence-service] listening on :${config.port}`);
  console.log(`[evidence-service] provider: tradier (${config.tradierBaseUrl})`);
  console.log(`[evidence-service] credential: ${config.tradierApiKey ? "configured" : "MISSING"}`);

  // Start background acquisition worker
  const worker = getAcquisitionWorker(config);
  worker.start();
});
