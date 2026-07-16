/**
 * Configuration — reads from environment variables.
 * Credential never logged or exposed in responses.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ServiceConfig {
  tradierApiKey: string;
  tradierBaseUrl: string;
  port: number;
}

function loadDotEnv(): void {
  try {
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx);
          const value = trimmed.slice(eqIdx + 1);
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  } catch {
    // .env loading is optional
  }
}

export function loadConfig(): ServiceConfig {
  loadDotEnv();

  const tradierApiKey = process.env.TRADIER_API_KEY ?? "";
  const tradierBaseUrl = process.env.TRADIER_BASE_URL ?? "https://sandbox.tradier.com/v1";
  const port = parseInt(process.env.PORT ?? "3100", 10);

  if (!tradierApiKey || tradierApiKey === "your_tradier_sandbox_token_here") {
    console.warn("[evidence-service] WARNING: TRADIER_API_KEY not configured. Provider calls will fail.");
  }

  return { tradierApiKey, tradierBaseUrl, port };
}
