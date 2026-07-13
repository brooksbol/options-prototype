/**
 * SEC Securities Catalog — types.
 */

export interface SecSecurityReference {
  cik: number;
  name: string;
  ticker: string;
  exchange: string | null;
  source: "sec_company_tickers_exchange";
}

export interface SecurityCatalogResult {
  success: boolean;
  items: SecSecurityReference[];
  totalCount: number;
  durationMs: number;
  error: string | null;
  fetchedAt: string;
}

export interface SecurityCatalogProvider {
  name: string;
  loadSecurities(): Promise<SecurityCatalogResult>;
}
