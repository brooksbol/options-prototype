/**
 * short-obligation-decision — governed DECIDE layer tests.
 *
 * Proves the governed lifecycle action is deterministic, rests on supported
 * subject/underlying evidence, and that chain-quote support affects ONLY the
 * execution caveat (or an explicit policy-required deferral) — never erases an
 * action the policy can otherwise reach (invariant BTS-CLOSURE-INDEPENDENCE).
 * No symbol/strike/date specifics anywhere in the module.
 */
import { describe, it, expect } from "vitest";
import {
  decideShortObligationLifecycle,
  actionRequiresOperator,
  DEFAULT_LIFECYCLE_POLICY,
  type LifecycleDecisionInputs,
} from "../../src/write-desk/short-obligation-decision";

/** DBO acceptance posture: 2 DTE, deeply OTM put, close price supported. */
function dboInputs(overrides: Partial<LifecycleDecisionInputs> = {}): LifecycleDecisionInputs {
  return {
    side: "put",
    dte: 2,
    moneyness: -0.1755, // (21 - 25.47) / 25.47
    candidate: "candidate",
    closePriceSupported: true,
    ...overrides,
  };
}

describe("decideShortObligationLifecycle — governed BTC disposition", () => {
  it("DBO posture (near-DTE, deeply OTM candidate) → BTC THIS PUT", () => {
    const d = decideShortObligationLifecycle(dboInputs());
    expect(d.action).toBe("BTC");
    expect(d.headline).toBe("BTC THIS PUT");
    expect(d.attention).toBe(true);
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it("no symbol hardcoding: any near-DTE deeply-OTM short reaches the same BTC action", () => {
    // A completely different subject with the same POSTURE decides identically.
    const call = decideShortObligationLifecycle(dboInputs({ side: "call", moneyness: -0.22 }));
    expect(call.action).toBe("BTC");
    expect(call.headline).toBe("BTC THIS CALL");
  });

  it("closure-independence: BTC stands when close price is unsupported; only the caveat degrades", () => {
    const supported = decideShortObligationLifecycle(dboInputs({ closePriceSupported: true }));
    const unsupported = decideShortObligationLifecycle(dboInputs({ closePriceSupported: false }));
    expect(supported.action).toBe("BTC");
    expect(unsupported.action).toBe("BTC");
    expect(supported.executionCaveat).toBeNull();
    expect(unsupported.executionCaveat).toMatch(/unavailable/i);
  });

  it("policy that REQUIRES close price DEFERS (never fabricates) when it is unsupported", () => {
    const policy = { ...DEFAULT_LIFECYCLE_POLICY, btcRequiresClosePrice: true };
    const deferred = decideShortObligationLifecycle(dboInputs({ closePriceSupported: false }), policy);
    expect(deferred.action).toBe("DECISION-DEFERRED");
    const decided = decideShortObligationLifecycle(dboInputs({ closePriceSupported: true }), policy);
    expect(decided.action).toBe("BTC");
  });
});

describe("decideShortObligationLifecycle — non-BTC governed outcomes", () => {
  it("near-DTE candidate not meeting the negligible-risk condition (ITM) → governed HOLD, not a comparison", () => {
    const d = decideShortObligationLifecycle(dboInputs({ moneyness: 0.03 }));
    expect(d.action).toBe("HOLD");
    expect(d.headline).toBe("HOLD");
  });

  it("a routine HOLD carries NO attention (HOLD is a decision, not an operator action)", () => {
    // ITM near-strike, OTM near-strike, and deep-ITM near-DTE all → HOLD, none red.
    for (const moneyness of [0.03, -0.02, 0.25]) {
      const d = decideShortObligationLifecycle(dboInputs({ moneyness }));
      expect(d.action).toBe("HOLD");
      expect(d.attention).toBe(false);
    }
  });

  it("ECONOMIC PROTECTION: near-DTE ITM short CALL (PDBC-style buy-write) → HOLD + no red, never a put-style BTC", () => {
    // A deeply-ITM short call's assignment/call-away is an INTENDED lifecycle
    // outcome. The BTC negligible-risk disposition (OTM, m < 0) must NOT fire
    // here — applying it would be economically backwards. Governed result: HOLD.
    for (const moneyness of [0.06, 0.22]) { // ITM short call (spot above strike)
      const d = decideShortObligationLifecycle(dboInputs({ side: "call", moneyness }));
      expect(d.action).toBe("HOLD");
      expect(d.attention).toBe(false);
    }
  });

  it("§14a lifecycle-ambiguous → RECONCILE-LIFECYCLE, never an invented BTC/HOLD", () => {
    const d = decideShortObligationLifecycle(dboInputs({ candidate: "lifecycle-ambiguous" }));
    expect(d.action).toBe("RECONCILE-LIFECYCLE");
    expect(d.attention).toBe(true);
  });

  it("not-candidate (routine far-DTE) → NO-ACTION, no attention", () => {
    const d = decideShortObligationLifecycle(dboInputs({ candidate: "not-candidate", dte: 21, moneyness: -0.03 }));
    expect(d.action).toBe("NO-ACTION");
    expect(d.attention).toBe(false);
  });

  it("candidate with unestablished moneyness → DECISION-DEFERRED (does not fabricate a disposition)", () => {
    const d = decideShortObligationLifecycle(dboInputs({ moneyness: null }));
    expect(d.action).toBe("DECISION-DEFERRED");
  });
});

describe("attention — red means ACT, not 'evaluated' (Principal correction)", () => {
  it("actions requiring the operator to DO something carry attention", () => {
    const btc = decideShortObligationLifecycle(dboInputs());
    expect(btc.action).toBe("BTC");
    expect(btc.attention).toBe(true);

    const reconcile = decideShortObligationLifecycle(dboInputs({ candidate: "lifecycle-ambiguous" }));
    expect(reconcile.attention).toBe(true);

    const deferred = decideShortObligationLifecycle(dboInputs({ moneyness: null }));
    expect(deferred.action).toBe("DECISION-DEFERRED");
    expect(deferred.attention).toBe(true);
  });

  it("HOLD and NO-ACTION do NOT carry attention (no red merely because evaluated)", () => {
    const hold = decideShortObligationLifecycle(dboInputs({ moneyness: 0.03 }));
    expect(hold.action).toBe("HOLD");
    expect(hold.attention).toBe(false);

    const noAction = decideShortObligationLifecycle(dboInputs({ candidate: "not-candidate" }));
    expect(noAction.action).toBe("NO-ACTION");
    expect(noAction.attention).toBe(false);
  });

  it("attention is a pure function of the action, independent of strategy/DTE", () => {
    expect(actionRequiresOperator("BTC")).toBe(true);
    expect(actionRequiresOperator("RECONCILE-LIFECYCLE")).toBe(true);
    expect(actionRequiresOperator("DECISION-DEFERRED")).toBe(true);
    expect(actionRequiresOperator("HOLD")).toBe(false);
    expect(actionRequiresOperator("NO-ACTION")).toBe(false);
  });
});

describe("decideShortObligationLifecycle — determinism", () => {
  it("same inputs + same policy → identical decision (policy over prediction)", () => {
    const a = decideShortObligationLifecycle(dboInputs());
    const b = decideShortObligationLifecycle(dboInputs());
    expect(a).toEqual(b);
  });
});
