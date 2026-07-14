/**
 * Provider factory — shared singleton instances.
 *
 * Ensures only one provider instance per key across the application.
 */

import type { MarketDataProvider } from "../domain/provider";
import { TradierProvider } from "./tradier/TradierProvider";
import { MockMarketDataProvider } from "./mock/MockMarketDataProvider";
import { isTradierConfigured, requireTradierConfig } from "../config/tradier";

const providerInstances: Record<string, MarketDataProvider> = {};

export function getProvider(key: string): MarketDataProvider {
  if (!providerInstances[key]) {
    if (key === "tradier" && isTradierConfigured()) {
      providerInstances[key] = new TradierProvider(requireTradierConfig());
    } else {
      providerInstances[key] = new MockMarketDataProvider();
    }
  }
  return providerInstances[key];
}

export { isTradierConfigured } from "../config/tradier";
