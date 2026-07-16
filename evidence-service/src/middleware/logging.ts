/**
 * Request logging middleware.
 *
 * Levels:
 *   INFO: lifecycle events, snapshot 200/304, worker summaries
 *   DEBUG: individual symbol requests (only when explicitly enabled)
 */

import type { Request, Response, NextFunction } from "express";

const DEBUG = process.env.LOG_LEVEL === "debug";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const path = req.path;

    // Snapshot endpoint: always log (important for 200 vs 304 visibility)
    if (path.includes("/evidence/snapshot")) {
      const etag = req.headers["if-none-match"] ?? "(none)";
      const gen = res.getHeader("X-Generation") ?? "?";
      const bytes = res.getHeader("X-Payload-Bytes") ?? "0";
      if (res.statusCode === 304) {
        console.log(`[snapshot] 304 Not Modified · gen ${gen} · client-etag: ${etag}`);
      } else {
        console.log(`[snapshot] 200 OK · gen ${gen} · ${bytes} bytes · ${duration}ms`);
      }
      return;
    }

    // Market proxy endpoints: log at info level only on error, debug otherwise
    if (path.includes("/market/")) {
      const symbol = req.query.symbol ?? "";
      if (res.statusCode >= 400) {
        console.warn(`[market] ${req.method} ${path} symbol=${symbol} → ${res.statusCode} (${duration}ms)`);
      } else if (DEBUG) {
        console.log(`[market] ${req.method} ${path} symbol=${symbol} → ${res.statusCode} (${duration}ms)`);
      }
      return;
    }

    // Status and other endpoints: debug only
    if (DEBUG) {
      console.log(`[${req.method}] ${path} → ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}
