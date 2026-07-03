/**
 * Domain type definitions for the Options Prototype.
 *
 * These types are the canonical representation of domain objects.
 * They are independent of any UI framework, data provider, or vendor schema.
 *
 * Reference: docs/02-domain.md (Domain Objects), docs/05-design.md (Domain Type Definitions)
 */

export interface Underlying {
  symbol: string;
  name: string;
  price: number;
}

export interface Expiration {
  date: string; // ISO 8601 date string: "2025-07-18"
  dte: number; // calendar days from today to expiration
}

export type OptionType = "CALL" | "PUT";

export interface OptionContract {
  type: OptionType;
  strike: number;
  bid: number;
  ask: number;
  delta: number; // 0 to 1 for calls, -1 to 0 for puts
  openInterest: number;
  volume: number;
}

export interface OptionsChain {
  underlying: Underlying;
  expiration: Expiration;
  calls: OptionContract[];
  puts: OptionContract[];
}

export type Moneyness = "ITM" | "ATM" | "OTM";
