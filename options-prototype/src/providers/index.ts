/**
 * Provider index — exports the active MarketDataProvider instance.
 *
 * Single point of provider selection. Swap implementations here
 * when introducing new data sources.
 *
 * Reference: docs/05a-component-map.md (providers/index.ts)
 */

import { MockMarketDataProvider } from "./mock/MockMarketDataProvider";

export const provider = new MockMarketDataProvider();
