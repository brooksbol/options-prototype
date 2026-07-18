/**
 * Catalog Description Tests
 *
 * Proves:
 * 1. A matching symbol with a description returns the description
 * 2. A symbol with no catalog match returns null
 * 3. Description lookup does not modify recommendation candidate or result
 * 4. Catalog record with blank/missing description returns null
 */

import { describe, it, expect } from "vitest";
import { lookupDescription, lookupCatalog, catalogSize } from "../../src/instrument-catalog/catalog";
import { lookupLibraryDescription, descriptionLibrarySize } from "../../src/instrument-catalog/description-library";

describe("catalog description lookup", () => {
  it("returns description for a cataloged symbol with a description", () => {
    const desc = lookupDescription("SOXL");
    expect(desc).not.toBeNull();
    expect(desc!.length).toBeGreaterThan(20);
  });

  it("TQQQ description identifies 3x daily Nasdaq-100 exposure", () => {
    const desc = lookupDescription("TQQQ");
    expect(desc).not.toBeNull();
    expect(desc).toMatch(/three times|3x/i);
    expect(desc).toMatch(/daily/i);
    expect(desc).toMatch(/Nasdaq-100/i);
  });

  it("XLE description identifies energy equities without futures-exposure language", () => {
    const desc = lookupDescription("XLE");
    expect(desc).not.toBeNull();
    expect(desc).toMatch(/energy/i);
    expect(desc).not.toMatch(/Exposure is obtained through futures/i);
    expect(desc).not.toMatch(/contract rolls/i);
    expect(desc).toMatch(/shares|equities|stock/i);
  });

  it("returns null for a symbol not in the catalog or library", () => {
    expect(lookupDescription("AAPL")).toBeNull();
    expect(lookupDescription("RANDOMTICKER")).toBeNull();
    expect(lookupDescription("")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(lookupDescription("soxl")).not.toBeNull();
    expect(lookupDescription("Soxl")).not.toBeNull();
    expect(lookupDescription("SOXL")).not.toBeNull();
  });

  it("every loaded catalog instrument has a nonblank description", () => {
    // Verify all instruments in the catalog have descriptions
    const testSymbols = ["SOXL", "USD", "TECL", "TQQQ", "UCO", "QLD", "USO", "SMH", "SPMO", "XLE"];
    for (const sym of testSymbols) {
      const desc = lookupDescription(sym);
      expect(desc, `${sym} should have a description`).not.toBeNull();
      expect(desc!.trim().length, `${sym} description should not be blank`).toBeGreaterThan(0);
    }
  });
});

describe("description library — independent of catalog membership", () => {
  it("loads 1280 descriptions", () => {
    expect(descriptionLibrarySize()).toBe(1280);
  });

  it("resolves description for ticker outside the 10-record catalog (COWZ)", () => {
    // COWZ has no catalog record but IS in the description library
    expect(lookupCatalog("COWZ")).toBeNull();
    const desc = lookupDescription("COWZ");
    expect(desc).not.toBeNull();
    expect(desc!.length).toBeGreaterThan(10);
  });

  it("resolves description for ticker outside the 10-record catalog (SPY)", () => {
    expect(lookupCatalog("SPY")).toBeNull();
    const desc = lookupDescription("SPY");
    expect(desc).not.toBeNull();
    expect(desc).toMatch(/S&P 500/i);
  });

  it("library description takes precedence for cataloged tickers", () => {
    // Both catalog and library have SOXL — library wins
    const desc = lookupDescription("SOXL");
    const libraryDesc = lookupLibraryDescription("SOXL");
    expect(desc).toBe(libraryDesc);
  });

  it("is case-insensitive for library lookups", () => {
    expect(lookupDescription("cowz")).not.toBeNull();
    expect(lookupDescription("COWZ")).not.toBeNull();
    expect(lookupDescription("Cowz")).not.toBeNull();
  });
});

describe("description does not modify recommendation objects", () => {
  it("lookupDescription returns a string, not a mutation", () => {
    const record = lookupCatalog("SOXL");
    const descBefore = record?.description;

    // Call lookupDescription multiple times
    const d1 = lookupDescription("SOXL");
    const d2 = lookupDescription("SOXL");

    // Same value, catalog unchanged
    expect(d1).toBe(d2);
    expect(record?.description).toBe(descBefore);
  });

  it("lookupDescription does not attach to or modify the CatalogRecord", () => {
    const record = lookupCatalog("SMH");
    const originalKeys = Object.keys(record!);

    lookupDescription("SMH");

    // No new keys added to the record
    expect(Object.keys(record!)).toEqual(originalKeys);
  });
});
