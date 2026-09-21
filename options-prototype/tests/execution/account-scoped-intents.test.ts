/**
 * Increment 4 — Account-keyed intents + account-safe broker handoff.
 *
 * Establishes:
 *   - WriteIntent/PendingIntent carry brokerageAccountId provenance.
 *   - Dedup/working-intent identity is (brokerageAccountId, symbol): the SAME symbol in two
 *     accounts stays independent (PTS SPY vs Sawdust Roth SPY).
 *   - Broker handoff fails CLOSED on account mismatch.
 *   - Legacy flat-array intents migrate only under an unambiguous single account.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createPendingIntent,
  hasWorkingIntentForAccount,
  getWorkingIntentsForAccountSymbol,
  loadWorkingIntentsForAccount,
  hasWorkingIntent,
  migrateLegacyIntents,
  loadPendingIntents,
  savePendingIntents,
  type PendingIntent,
} from "../../src/execution/pending-intent";
import { buildWriteIntent } from "../../src/execution/write-intent";
import { buildAccountSafeTradeLink } from "../../src/execution/fidelity-trade-link";
import type { PutCandidate } from "../../src/write-desk/candidate-types";

beforeEach(() => {
  localStorage.clear();
});

// Minimal put candidate sufficient for buildWriteIntent.
function putCandidate(symbol: string, strike: number): PutCandidate {
  return {
    symbol,
    expiration: "2026-08-07",
    strike,
    bid: 1.75,
  } as unknown as PutCandidate;
}

function workingIntent(accountId: string | null, symbol: string, id: string): PendingIntent {
  return {
    id,
    brokerageAccountId: accountId,
    symbol,
    contractSymbol: `-${symbol}260807P40`,
    expiration: "2026-08-07",
    optionType: "put",
    strike: 40,
    quantity: 1,
    limitPrice: 1.75,
    status: "working",
    submittedAt: "2026-07-15T14:31:00Z",
    updatedAt: "2026-07-15T14:31:00Z",
  };
}

describe("WriteIntent / PendingIntent carry account provenance", () => {
  it("buildWriteIntent stamps the provided brokerageAccountId", () => {
    const intent = buildWriteIntent({ candidate: putCandidate("SPY", 500), brokerageAccountId: "ba-pts" });
    expect(intent?.brokerageAccountId).toBe("ba-pts");
  });

  it("createPendingIntent copies the account from the WriteIntent", () => {
    const intent = buildWriteIntent({ candidate: putCandidate("SPY", 500), brokerageAccountId: "ba-pts" });
    const pending = createPendingIntent(intent!);
    expect(pending.brokerageAccountId).toBe("ba-pts");
  });

  it("omitted account → null (legacy/demo), never guessed", () => {
    const intent = buildWriteIntent({ candidate: putCandidate("SPY", 500) });
    expect(intent?.brokerageAccountId).toBeNull();
    expect(createPendingIntent(intent!).brokerageAccountId).toBeNull();
  });
});

describe("STRESS TEST — same symbol in two accounts stays independent", () => {
  it("PTS SPY and Sawdust Roth SPY are distinct working intents keyed by (account, symbol)", () => {
    const intents = [
      workingIntent("ba-pts", "SPY", "pts-spy"),
      workingIntent("ba-roth", "SPY", "roth-spy"),
    ];

    // Each account sees only its own SPY intent.
    expect(hasWorkingIntentForAccount("ba-pts", "SPY", intents)).toBe(true);
    expect(hasWorkingIntentForAccount("ba-roth", "SPY", intents)).toBe(true);

    const ptsSpy = getWorkingIntentsForAccountSymbol("ba-pts", "SPY", intents);
    const rothSpy = getWorkingIntentsForAccountSymbol("ba-roth", "SPY", intents);
    expect(ptsSpy).toHaveLength(1);
    expect(rothSpy).toHaveLength(1);
    expect(ptsSpy[0].id).toBe("pts-spy");
    expect(rothSpy[0].id).toBe("roth-spy");

    // An account with no SPY intent does not see the other account's SPY.
    expect(hasWorkingIntentForAccount("ba-other", "SPY", intents)).toBe(false);

    // The account-blind legacy helper still sees SPY across all accounts (documented behavior).
    expect(hasWorkingIntent("SPY", intents)).toBe(true);
  });

  it("loadWorkingIntentsForAccount partitions by account", () => {
    const intents = [
      workingIntent("ba-pts", "SPY", "1"),
      workingIntent("ba-pts", "QQQ", "2"),
      workingIntent("ba-roth", "SPY", "3"),
    ];
    expect(loadWorkingIntentsForAccount("ba-pts", intents).map((i) => i.id).sort()).toEqual(["1", "2"]);
    expect(loadWorkingIntentsForAccount("ba-roth", intents).map((i) => i.id)).toEqual(["3"]);
  });
});

describe("account-safe broker handoff fails closed on mismatch", () => {
  const intent = buildWriteIntent({ candidate: putCandidate("SPY", 500), brokerageAccountId: "ba-pts" })!;

  it("permits handoff when the intent's account is the active account", () => {
    const result = buildAccountSafeTradeLink(intent, "ba-pts");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.link.url).toContain("SECURITY_ID");
      // Fidelity operator verification preserved.
      expect(result.link.requiresVerification).toContain("Account selection");
    }
  });

  it("REFUSES handoff when the active account differs (capital-path fail-closed)", () => {
    const result = buildAccountSafeTradeLink(intent, "ba-roth");
    expect(result.kind).toBe("account-mismatch");
    if (result.kind === "account-mismatch") {
      expect(result.intentAccountId).toBe("ba-pts");
      expect(result.activeAccountId).toBe("ba-roth");
    }
  });

  it("REFUSES an unattributed intent while a real account is active", () => {
    const legacyIntent = buildWriteIntent({ candidate: putCandidate("SPY", 500) })!; // null account
    const result = buildAccountSafeTradeLink(legacyIntent, "ba-pts");
    expect(result.kind).toBe("account-mismatch");
  });

  it("permits an unattributed intent only when there is no active real account", () => {
    const legacyIntent = buildWriteIntent({ candidate: putCandidate("SPY", 500) })!;
    const result = buildAccountSafeTradeLink(legacyIntent, null);
    expect(result.kind).toBe("ok");
  });
});

describe("legacy flat-array intent migration", () => {
  it("attaches account-blind intents to the sole account (idempotent, unambiguous only)", () => {
    savePendingIntents([workingIntent(null, "SPY", "a"), workingIntent(null, "QQQ", "b")]);
    const changed = migrateLegacyIntents("ba-sole");
    expect(changed).toBe(2);
    const all = loadPendingIntents();
    expect(all.every((i) => i.brokerageAccountId === "ba-sole")).toBe(true);
    // Idempotent: re-running attributes nothing new.
    expect(migrateLegacyIntents("ba-sole")).toBe(0);
  });

  it("never attributes when there is no sole account (null → no-op)", () => {
    savePendingIntents([workingIntent(null, "SPY", "a")]);
    expect(migrateLegacyIntents(null)).toBe(0);
    expect(loadPendingIntents()[0].brokerageAccountId).toBeNull();
  });

  it("leaves already-attributed intents untouched", () => {
    savePendingIntents([workingIntent("ba-pts", "SPY", "a"), workingIntent(null, "QQQ", "b")]);
    const changed = migrateLegacyIntents("ba-sole");
    expect(changed).toBe(1); // only the null one
    const all = loadPendingIntents();
    expect(all.find((i) => i.id === "a")?.brokerageAccountId).toBe("ba-pts");
    expect(all.find((i) => i.id === "b")?.brokerageAccountId).toBe("ba-sole");
  });
});
