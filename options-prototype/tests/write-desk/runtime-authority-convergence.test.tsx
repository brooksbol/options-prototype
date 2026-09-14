/**
 * BUG-012 regression — RUNTIME AUTHORITY INVARIANT for the Deployment recommendation path.
 *
 * Governing rule (from WriteDesk.tsx): async evidence arrival may be stale in time; authority
 * consumption may NOT be stale in closure. Whenever Decision executes it must read the CURRENT
 * session classification, not the authority captured when an async request (a snapshot fetch)
 * was STARTED.
 *
 * The production failure Codex identified is the IN-FLIGHT STALE-CALLBACK ordering:
 *
 *   1. a snapshot request begins while sessionClassification is BOOTSTRAP (authorityPending:true);
 *   2. session authority resolves to authoritative BEFORE the response returns;
 *   3. the in-flight snapshot response completes and runs Decision;
 *   4. if Decision read authority from the callback's render-time closure, it runs with the
 *      STALE bootstrap authority (every record fails closed) and the board stays empty.
 *
 * WriteDesk fixes this by reading authority through a ref (`sessionClassificationRef`) that is
 * updated every render, via `currentAuthority()`, at the moment Decision runs.
 *
 * This test reproduces that exact ordering against BOTH strategies:
 *   - closureRead  (the OLD/broken approach): captures authority when the request starts -> FAILS.
 *   - refRead      (the WriteDesk approach):  reads the ref at execution time            -> PASSES.
 * Having both in the test proves the assertion actually discriminates the bug (the broken
 * strategy fails the same assertion), rather than trivially passing.
 */

import { describe, it, expect } from "vitest";

// Minimal shape of the authority the Decision path consumes.
type Authority = { authorityPending: boolean; state: string };
const BOOTSTRAP: Authority = { authorityPending: true, state: "CLOSED_CANONICAL" };
const RESOLVED_SEALED: Authority = { authorityPending: false, state: "NON_TRADING_DAY" };

// A stand-in for the cache-only Decision run. Returns candidates ONLY when authority is not
// pending (mirrors isSubjectAdmissible gate 0: authorityPending -> fail closed -> empty board).
function runDecision(authority: Authority, fridayEvidenceCount: number): number {
  if (authority.authorityPending) return 0; // fail closed
  return fridayEvidenceCount; // sealed evidence admitted -> rows
}

// Models WriteDesk's render-time ref that is updated on every render.
function makeAuthorityRef(initial: Authority) {
  const ref = { current: initial };
  return {
    ref,
    setOnRender: (a: Authority) => { ref.current = a; }, // "updated EVERY render"
  };
}

/**
 * Drive the in-flight stale-callback ordering.
 * @param mode "refRead" reads authority at execution time (WriteDesk); "closureRead" captures it
 *             when the async request starts (the bug).
 * Returns the number of Decision rows produced when the in-flight snapshot callback completes.
 */
async function driveInFlightOrdering(mode: "refRead" | "closureRead"): Promise<number> {
  const { ref, setOnRender } = makeAuthorityRef(BOOTSTRAP);
  const FRIDAY_ROWS = 955;

  // (1) A snapshot request BEGINS while authority is still BOOTSTRAP. The callback is created
  //     now; closureRead captures the authority value AT THIS MOMENT.
  const authorityAtRequestStart = ref.current; // BOOTSTRAP
  let resolveResponse!: () => void;
  const responsePending = new Promise<void>((r) => { resolveResponse = r; });

  let rowsProduced = -1;
  const inFlightCallback = async () => {
    await responsePending; // response has not returned yet
    // Evidence is ingested here (Friday chains already cached). Decision then runs.
    const authorityAtExecution =
      mode === "refRead" ? ref.current /* CURRENT */ : authorityAtRequestStart /* STALE */;
    rowsProduced = runDecision(authorityAtExecution, FRIDAY_ROWS);
  };
  const callbackDone = inFlightCallback();

  // (2) Session authority RESOLVES before the response returns. A re-render updates the ref.
  setOnRender(RESOLVED_SEALED);

  // (3) The in-flight snapshot response COMPLETES, invoking the old callback.
  resolveResponse();
  await callbackDone;

  return rowsProduced;
}

describe("BUG-012 runtime-authority invariant (in-flight stale-callback ordering)", () => {
  it("refRead: Decision reads CURRENT authority at execution time -> Friday rows populate", async () => {
    const rows = await driveInFlightOrdering("refRead");
    expect(rows).toBe(955); // authority resolved before execution -> sealed evidence admitted
  });

  it("closureRead (the bug): capturing authority at request start -> empty board", async () => {
    const rows = await driveInFlightOrdering("closureRead");
    // Proves the assertion discriminates the defect: the broken strategy fails closed.
    expect(rows).toBe(0);
  });

  it("authority-first ordering also converges under refRead", async () => {
    // Authority resolves before the request even starts; ref already current at execution.
    const { ref, setOnRender } = makeAuthorityRef(BOOTSTRAP);
    setOnRender(RESOLVED_SEALED); // authority resolves first
    let rows = -1;
    const cb = async () => { rows = runDecision(ref.current, 955); };
    await cb();
    expect(rows).toBe(955);
  });
});
