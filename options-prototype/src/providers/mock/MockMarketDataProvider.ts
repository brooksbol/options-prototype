/**
 * MockMarketDataProvider — implements MarketDataProvider using static JSON.
 *
 * Responsibilities:
 *   - Load static JSON fixtures for SPY, QQQ, IWM.
 *   - Map raw JSON into canonical domain types.
 *   - Set OptionContract.type to "CALL" | "PUT" during mapping.
 *   - Compute DTE dynamically from current date + daysFromNow offset.
 *   - Compute expiration date strings from daysFromNow.
 *   - Return all data via Promise.resolve() (async interface, sync resolution).
 *
 * Reference: docs/05-design.md (MockMarketDataProvider)
 * Reference: docs/05a-component-map.md (MockMarketDataProvider)
 */

import type { MarketDataProvider } from "../../domain/provider";
import type {
  Underlying,
  Expiration,
  OptionContract,
  OptionsChain,
} from "../../domain/types";

import spyData from "./data/spy.json";
import qqqData from "./data/qqq.json";
import iwmData from "./data/iwm.json";
import xleData from "./data/xle.json";

interface RawContract {
  strike: number;
  bid: number;
  ask: number;
  delta: number;
  openInterest: number;
  volume: number;
}

interface RawExpiration {
  daysFromNow: number;
  calls: RawContract[];
  puts: RawContract[];
}

interface RawETFData {
  underlying: {
    symbol: string;
    name: string;
    price: number;
  };
  expirations: RawExpiration[];
}

const ALL_DATA: RawETFData[] = [spyData, qqqData, iwmData, xleData];

function computeExpirationDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

function mapContracts(
  rawContracts: RawContract[],
  type: "CALL" | "PUT"
): OptionContract[] {
  return rawContracts.map((raw) => ({
    type,
    strike: raw.strike,
    bid: raw.bid,
    ask: raw.ask,
    delta: raw.delta,
    openInterest: raw.openInterest,
    volume: raw.volume,
  }));
}

export class MockMarketDataProvider implements MarketDataProvider {
  getUnderlyings(): Promise<Underlying[]> {
    const underlyings = ALL_DATA.map((d) => ({
      symbol: d.underlying.symbol,
      name: d.underlying.name,
      price: d.underlying.price,
    }));
    return Promise.resolve(underlyings);
  }

  getExpirations(symbol: string): Promise<Expiration[]> {
    const data = ALL_DATA.find(
      (d) => d.underlying.symbol === symbol.toUpperCase()
    );
    if (!data) return Promise.resolve([]);

    const expirations = data.expirations.map((exp) => ({
      date: computeExpirationDate(exp.daysFromNow),
      dte: exp.daysFromNow,
    }));
    return Promise.resolve(expirations);
  }

  getOptionsChain(symbol: string, expirationDate: string): Promise<OptionsChain> {
    const data = ALL_DATA.find(
      (d) => d.underlying.symbol === symbol.toUpperCase()
    );
    if (!data) {
      return Promise.resolve({
        underlying: { symbol, name: "", price: 0 },
        expiration: { date: expirationDate, dte: 0 },
        calls: [],
        puts: [],
        dataQuality: { greeksAvailable: true },
      });
    }

    // Find matching expiration by computed date
    const matchedExp = data.expirations.find(
      (exp) => computeExpirationDate(exp.daysFromNow) === expirationDate
    );

    if (!matchedExp) {
      // Fallback: use first expiration if date doesn't match
      // (handles minor date computation differences)
      const fallback = data.expirations[0];
      return Promise.resolve({
        underlying: {
          symbol: data.underlying.symbol,
          name: data.underlying.name,
          price: data.underlying.price,
        },
        expiration: {
          date: expirationDate,
          dte: fallback.daysFromNow,
        },
        calls: mapContracts(fallback.calls, "CALL"),
        puts: mapContracts(fallback.puts, "PUT"),
        dataQuality: { greeksAvailable: true },
      });
    }

    return Promise.resolve({
      underlying: {
        symbol: data.underlying.symbol,
        name: data.underlying.name,
        price: data.underlying.price,
      },
      expiration: {
        date: expirationDate,
        dte: matchedExp.daysFromNow,
      },
      calls: mapContracts(matchedExp.calls, "CALL"),
      puts: mapContracts(matchedExp.puts, "PUT"),
      dataQuality: { greeksAvailable: true },
    });
  }
}
