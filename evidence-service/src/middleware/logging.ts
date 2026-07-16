/**
 * Request logging middleware.
 */

import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const symbol = req.query.symbol ?? "";
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path}${symbol ? ` symbol=${symbol}` : ""} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}
