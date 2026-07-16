/**
 * Provider factory — shared singleton instances.
 *
 * The browser communicates only with the application backend.
 * When the evidence service is available, all market data flows through the proxy.
 * The browser never calls Tradier directly.
 */

import type { MarketDataProvider } from "../domain/provider";
import { ProxyMarketDataProvider } from "./proxy/ProxyMarketDataProvider";
import { MockMarketDataProvider } from "./mock/MockMarketDataProvider";

const providerInstances: Record<string, MarketDataProvider> = {};

/**
 * Check if the evidence service backend is configured.
 * In this architecture, the proxy is always the preferred provider for "tradier" key.
 */
export function isTradierConfigured(): boolean {
  // The proxy is always available when the evidence service is running.
  // The frontend no longer checks for VITE_TRADIER_API_KEY.
  return true;
}

export function getProvider(key: string): MarketDataProvider {
  if (!providerInstances[key]) {
    if (key === "tradier") {
      // Use the proxy provider — calls the evidence service backend
      providerInstances[key] = new ProxyMarketDataProvider("/api/market");
    } else {
      providerInstances[key] = new MockMarketDataProvider();
    }
  }
  return providerInstances[key];
}
