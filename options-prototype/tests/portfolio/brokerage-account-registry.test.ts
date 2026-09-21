/**
 * Increment 1 — BrokerageAccount identity and inert registry.
 *
 * Establishes: stable identity, registry persistence, lookup by Wheelwright identity,
 * safe external-reference resolution, duplicate/conflict behavior, and demo exclusion.
 *
 * The registry is INERT in Increment 1: these tests exercise it directly and assert it
 * does not perturb existing portfolio persistence keys.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createBrokerageAccount,
  generateBrokerageAccountId,
  normalizeExternalRef,
  resolveByExternalRef,
  findById,
  _resetIdCounterForTesting,
  type BrokerageAccount,
} from "../../src/portfolio/brokerage-account";
import {
  loadAccounts,
  saveAccounts,
  getAccountById,
  resolveAccountByExternalRef,
  registerAccount,
  updateAccount,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";

const REGISTRY_KEY = "wheelwright:brokerage-accounts";

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _resetIdCounterForTesting();
});

describe("BrokerageAccount identity", () => {
  it("mints stable, unique Wheelwright ids not derived from broker data", () => {
    const a = generateBrokerageAccountId(1000, "a");
    const b = generateBrokerageAccountId(1000, "b");
    expect(a).toMatch(/^ba-/);
    expect(a).not.toEqual(b);
    // No broker reference appears in the identity.
    expect(a).not.toContain("XXXX");
  });

  it("identity does not depend on the external reference (absent ref is null)", () => {
    const acct = createBrokerageAccount({ broker: "fidelity", now: 5, idOverride: "ba-fixed" });
    expect(acct.brokerageAccountId).toBe("ba-fixed");
    expect(acct.externalAccountRef).toBeNull();
    expect(acct.broker).toBe("fidelity");
    expect(acct.status).toBe("active");
  });

  it("normalizes external references case-insensitively and treats blank as absent", () => {
    expect(normalizeExternalRef("  z12-3456 ")).toBe("Z12-3456");
    expect(normalizeExternalRef("")).toBeNull();
    expect(normalizeExternalRef("   ")).toBeNull();
    expect(normalizeExternalRef(null)).toBeNull();
    expect(normalizeExternalRef(undefined)).toBeNull();
  });

  it("seeds displayName from ref then falls back to a generic label", () => {
    const named = createBrokerageAccount({ broker: "fidelity", displayName: "PTS margin", idOverride: "x" });
    expect(named.displayName).toBe("PTS margin");
    const fromRef = createBrokerageAccount({ broker: "fidelity", externalAccountRef: "z12-3456", idOverride: "y" });
    expect(fromRef.displayName).toBe("Z12-3456");
    const anon = createBrokerageAccount({ broker: "fidelity", idOverride: "z" });
    expect(anon.displayName).toBe("Unnamed account");
  });
});

describe("registry persistence and round-trip", () => {
  it("returns [] when nothing is stored", () => {
    expect(loadAccounts()).toEqual([]);
  });

  it("persists and round-trips accounts", () => {
    const acct = createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-3456", idOverride: "ba-1" });
    saveAccounts([acct]);
    const loaded = loadAccounts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(acct);
  });

  it("ignores corrupt or wrong-schema storage without throwing", () => {
    localStorage.setItem(REGISTRY_KEY, "not json");
    expect(loadAccounts()).toEqual([]);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify({ schemaVersion: 99, accounts: [] }));
    expect(loadAccounts()).toEqual([]);
  });
});

describe("lookup by Wheelwright identity", () => {
  it("finds by id and returns null when absent", () => {
    const acct = createBrokerageAccount({ broker: "fidelity", idOverride: "ba-target" });
    saveAccounts([acct]);
    expect(getAccountById("ba-target")?.brokerageAccountId).toBe("ba-target");
    expect(getAccountById("ba-missing")).toBeNull();
    // pure findById mirrors the persisted query
    expect(findById([acct], "ba-target")).toBe(acct);
  });
});

describe("safe external-reference resolution", () => {
  const accounts: BrokerageAccount[] = [
    createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-3456", idOverride: "ba-pts" }),
    createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z98-7654", idOverride: "ba-roth" }),
  ];

  it("resolves an unambiguous reference (case-insensitive)", () => {
    const r = resolveByExternalRef(accounts, "z12-3456");
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") expect(r.account.brokerageAccountId).toBe("ba-pts");
  });

  it("returns no-match for an unknown or absent reference (never guesses)", () => {
    expect(resolveByExternalRef(accounts, "Z00-0000").kind).toBe("no-match");
    expect(resolveByExternalRef(accounts, null).kind).toBe("no-match");
    expect(resolveByExternalRef(accounts, "  ").kind).toBe("no-match");
  });

  it("returns ambiguous when more than one active account shares a reference", () => {
    const dup = createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-3456", idOverride: "ba-dup" });
    const r = resolveByExternalRef([...accounts, dup], "Z12-3456");
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") expect(r.matches).toHaveLength(2);
  });

  it("does not resolve to an archived account", () => {
    const archived = { ...accounts[0], status: "archived" as const };
    const r = resolveByExternalRef([archived], "Z12-3456");
    expect(r.kind).toBe("no-match");
  });
});

describe("registration: duplicate / conflict behavior", () => {
  it("creates a new identity for a fresh reference", () => {
    const r = registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });
    expect(r.kind).toBe("created");
    expect(loadAccounts()).toHaveLength(1);
  });

  it("is idempotent: re-registering a known reference returns the existing account (no second identity)", () => {
    const first = registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });
    const second = registerAccount({ broker: "fidelity", externalAccountRef: "z12-3456" });
    expect(second.kind).toBe("existing");
    if (first.kind === "created" && second.kind === "existing") {
      expect(second.account.brokerageAccountId).toBe(first.account.brokerageAccountId);
    }
    expect(loadAccounts()).toHaveLength(1);
  });

  it("refuses to register against an ambiguous reference", () => {
    // Seed two accounts with the same ref directly (a corrupted/legacy condition).
    saveAccounts([
      createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-3456", idOverride: "ba-a" }),
      createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-3456", idOverride: "ba-b" }),
    ]);
    const r = registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });
    expect(r.kind).toBe("ambiguous");
    expect(loadAccounts()).toHaveLength(2); // unchanged
  });

  it("never coalesces anonymous (ref-less) accounts by absence", () => {
    registerAccount({ broker: "fidelity" });
    registerAccount({ broker: "fidelity" });
    expect(loadAccounts()).toHaveLength(2);
  });

  it("updates mutable display data without changing identity", () => {
    const created = registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });
    if (created.kind !== "created") throw new Error("setup");
    const updated = updateAccount(created.account.brokerageAccountId, { displayName: "PTS margin", status: "archived" });
    expect(updated?.displayName).toBe("PTS margin");
    expect(updated?.status).toBe("archived");
    expect(updated?.brokerageAccountId).toBe(created.account.brokerageAccountId);
  });
});

describe("demo exclusion and inertness", () => {
  it("never writes a demo account into the registry", () => {
    // The registry has no demo API; demo is not a BrokerageAccount. A fresh registry is empty.
    expect(loadAccounts()).toEqual([]);
    // Registering real accounts must not introduce any 'demo' identity.
    registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });
    expect(loadAccounts().some((a) => a.brokerageAccountId.includes("demo"))).toBe(false);
    expect(loadAccounts().some((a) => a.displayName.toLowerCase() === "demo")).toBe(false);
  });

  it("does not touch existing portfolio persistence keys (inert)", () => {
    // Simulate pre-existing singleton portfolio storage.
    localStorage.setItem("wheelwright:fidelity-csv:balances", JSON.stringify({ text: "x", filename: "b.csv" }));
    localStorage.setItem("options-prototype:workspace", JSON.stringify({ writeDeskSource: "fidelity" }));

    registerAccount({ broker: "fidelity", externalAccountRef: "Z12-3456" });

    // Existing keys are untouched by registry operations.
    expect(localStorage.getItem("wheelwright:fidelity-csv:balances")).toBe(
      JSON.stringify({ text: "x", filename: "b.csv" })
    );
    expect(localStorage.getItem("options-prototype:workspace")).toBe(
      JSON.stringify({ writeDeskSource: "fidelity" })
    );
  });
});
