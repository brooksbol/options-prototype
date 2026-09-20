/**
 * Roadmap projection freshness — completion-criterion enforcement (ADR-018).
 *
 * The committed src/roadmap/roadmap-projection.json must reflect the reconciled
 * canonical authority (docs/roadmap.md, docs/architecture-roadmap.md,
 * docs/parking-lot*.md). This test runs the generator's --check mode, which
 * regenerates in-memory and compares substantive content (excluding the volatile
 * timestamp) against the committed artifact. A stale projection fails here.
 *
 * This validation is build/reconciliation-side (test suite / CI), never runtime.
 * The Wheelwright runtime does not touch GitHub or regenerate the projection.
 */

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

describe("roadmap projection freshness (ADR-018 completion criterion)", () => {
  it("committed projection is in sync with canonical authority", () => {
    const script = resolve(__dirname, "../../scripts/generate-roadmap-projection.mjs");
    let ok = true;
    let output = "";
    try {
      output = execFileSync("node", [script, "--check"], { encoding: "utf-8" });
    } catch (err: unknown) {
      ok = false;
      const e = err as { stderr?: string; stdout?: string; message?: string };
      output = e.stderr || e.stdout || e.message || "unknown error";
    }
    expect(ok, `Roadmap projection is stale. Run: npm run generate:roadmap-projection\n${output}`).toBe(true);
  });
});
