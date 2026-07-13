/**
 * FMP ETF Reference Data — types.
 */

export interface FmpEtfCatalogEntry {
  symbol: string;
  name: string | null;
  exchange: string | null;
  exchangeFullName: string | null;
  country: string | null;
  currency: string | null;
  isEtf: boolean | null;
  isFund: boolean | null;
  isActivelyTrading: boolean | null;
  isAdr: boolean | null;
  industry: string | null;
  sector: string | null;
  marketCap: number | null;
  price: number | null;
  beta: number | null;
  isin: string | null;
  cusip: string | null;
  cik: string | null;
  ipoDate: string | null;
  description: string | null;
  source: "fmp";
  raw: unknown;
}

export interface FmpSearchResult {
  success: boolean;
  items: FmpEtfCatalogEntry[];
  count: number;
  durationMs: number;
  error: string | null;
  httpStatus: number | null;
  endpoint: string;
}

export interface EtfReferenceDataProvider {
  name: string;
  isConfigured(): boolean;
  searchByName(query: string): Promise<FmpSearchResult>;
  searchBySymbol(query: string): Promise<FmpSearchResult>;
  getProfile(symbol: string): Promise<FmpSearchResult>;
}
