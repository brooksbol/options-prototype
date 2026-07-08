/**
 * Tradier configuration module.
 *
 * Reads credentials from environment variables (via Vite's import.meta.env).
 * Provides a single point of access for all Tradier-specific configuration.
 *
 * Required environment variables:
 *   VITE_TRADIER_API_KEY           - Sandbox access token (Bearer token)
 *   VITE_TRADIER_API_ACCOUNT_NUMBER - Sandbox account number (not currently
 *                                     used for market data, but required for
 *                                     future trading/account endpoints)
 *
 * These must be defined in .env.local (never committed to the repository).
 *
 * Security:
 *   - Never log or display the API key.
 *   - Never include credentials in error messages.
 *   - This module is the ONLY place credentials are read from the environment.
 */

export interface TradierConfig {
  apiKey: string;
  accountNumber: string;
  baseUrl: string;
}

const SANDBOX_BASE_URL = "https://sandbox.tradier.com/v1";

/**
 * Retrieve Tradier configuration from environment variables.
 * Returns null if required variables are not configured.
 */
export function getTradierConfig(): TradierConfig | null {
  const apiKey = import.meta.env.VITE_TRADIER_API_KEY;
  const accountNumber = import.meta.env.VITE_TRADIER_API_ACCOUNT_NUMBER;

  if (!apiKey || apiKey === "your_tradier_sandbox_token_here") {
    return null;
  }

  if (!accountNumber || accountNumber === "your_account_number_here") {
    return null;
  }

  return {
    apiKey,
    accountNumber,
    baseUrl: SANDBOX_BASE_URL,
  };
}

/**
 * Check whether Tradier credentials are configured.
 * Use this to conditionally enable/disable the Tradier provider in the UI.
 */
export function isTradierConfigured(): boolean {
  return getTradierConfig() !== null;
}

/**
 * Retrieve Tradier configuration or throw a developer-friendly error.
 * Use this when the provider is being actively instantiated and credentials
 * are expected to be present.
 */
export function requireTradierConfig(): TradierConfig {
  const config = getTradierConfig();
  if (!config) {
    throw new Error(
      "[Tradier] Missing required environment variables. " +
        "Ensure VITE_TRADIER_API_KEY and VITE_TRADIER_API_ACCOUNT_NUMBER " +
        "are set in .env.local. See .env.example for reference."
    );
  }
  return config;
}
