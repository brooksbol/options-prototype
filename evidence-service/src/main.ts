/**
 * Evidence Service — Market Evidence Proxy
 *
 * Owns the Tradier credential and all upstream market-data HTTP calls.
 * The browser communicates only with this service, never directly with Tradier.
 *
 * Responsibilities (this slice):
 *   - Tradier credential custody
 *   - Market data request proxying
 *   - Response normalization into application-owned contract
 *   - Rate limiting
 *   - Request logging
 *
 * Deferred:
 *   - Persistence (SQLite)
 *   - Background acquisition
 *   - Snapshot publication
 *   - Authentication
 */

import express from "express";
import { marketRouter } from "./routes/market.js";
import { statusRouter } from "./routes/status.js";
import { loadConfig } from "./config.js";
import { requestLogger } from "./middleware/logging.js";

const config = loadConfig();

const app = express();

app.use(requestLogger);
app.use("/api/market", marketRouter(config));
app.use("/api", statusRouter(config));

app.listen(config.port, () => {
  console.log(`[evidence-service] listening on :${config.port}`);
  console.log(`[evidence-service] provider: tradier (${config.tradierBaseUrl})`);
  console.log(`[evidence-service] credential: ${config.tradierApiKey ? "configured" : "MISSING"}`);
});
