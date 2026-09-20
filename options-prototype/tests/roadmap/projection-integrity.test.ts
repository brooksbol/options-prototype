/**
 * Integrity tests for the committed roadmap projection artifact.
 *
 * These pin the invariants that make the projection a TRUSTWORTHY view of
 * canonical authority: faithful LVT structure, resolvable relationships, and
 * the explicit-only relationship discipline (no manufactured links). If the
 * canonical roadmap changes and the projection is regenerated, these tests
 * confirm the regenerated artifact is still structurally sound.
 */

import { describe, it, expect } from "vitest";
import projection from "../../src/roadmap/roadmap-projection.json";
import type { RoadmapProjection, LvtNode } from "../../src/roadmap/roadmap-projection-types";

const p = projection as unknown as RoadmapProjection;

describe("roadmap projection — provenance", () => {
  it("declares the canonical authority sources", () => {
    expect(p.meta.sources).toContain("docs/roadmap.md");
    expect(p.meta.sources).toContain("docs/architecture-roadmap.md");
    expect(p.meta.sources.some((s) => s.startsWith("docs/parking-lot"))).toBe(true);
  });
});

describe("roadmap projection — LVT structure", () => {
  const byId = new Map(p.lvt.map((n) => [n.id, n]));

  it("has exactly one vision root", () => {
    const visions = p.lvt.filter((n) => n.type === "vision");
    expect(visions).toHaveLength(1);
    expect(visions[0].parentId).toBeNull();
  });

  it("matches the canonical count of 7 goals, 28 bets, 1 direction", () => {
    expect(p.meta.counts.lvtByType.goal).toBe(7);
    expect(p.meta.counts.lvtByType.bet).toBe(28);
    expect(p.meta.counts.lvtByType.direction).toBe(1);
  });

  it("has fully resolvable parentage (no orphans, no dangling children)", () => {
    for (const node of p.lvt) {
      if (node.type === "vision") continue;
      expect(node.parentId, `${node.id} parent`).not.toBeNull();
      expect(byId.has(node.parentId as string), `${node.id} -> ${node.parentId}`).toBe(true);
      for (const childId of node.childIds) {
        expect(byId.has(childId), `${node.id} child ${childId}`).toBe(true);
      }
    }
  });

  it("is acyclic (no node is its own ancestor)", () => {
    const ancestorOf = (n: LvtNode): string[] => {
      const chain: string[] = [];
      let cur: LvtNode | undefined = n;
      const guard = new Set<string>();
      while (cur && cur.parentId) {
        if (guard.has(cur.parentId)) break;
        guard.add(cur.parentId);
        chain.push(cur.parentId);
        cur = byId.get(cur.parentId);
      }
      return chain;
    };
    for (const node of p.lvt) {
      expect(ancestorOf(node)).not.toContain(node.id);
    }
  });
});

describe("roadmap projection — architecture pressures", () => {
  const validLvtIds = new Set(p.lvt.map((n) => n.id));

  it("parses the AR pressures", () => {
    expect(p.architecture.length).toBeGreaterThanOrEqual(10);
    expect(p.architecture.map((a) => a.id)).toContain("AR1");
  });

  it("only references LVT ids that exist (explicit + resolvable)", () => {
    for (const ar of p.architecture) {
      for (const lvtId of ar.pressureFromLvtIds) {
        expect(validLvtIds.has(lvtId), `${ar.id} -> ${lvtId}`).toBe(true);
      }
    }
  });
});

describe("roadmap projection — parking lot explicit-only relationships", () => {
  const validLvtIds = new Set(p.lvt.map((n) => n.id));
  const validArIds = new Set(p.architecture.map((a) => a.id));

  it("captures a meaningful number of PL items", () => {
    expect(p.parkingLot.length).toBeGreaterThan(50);
  });

  it("never references a non-existent LVT or AR id", () => {
    for (const item of p.parkingLot) {
      for (const lvtId of item.relatedLvtIds) {
        expect(validLvtIds.has(lvtId), `${item.id} -> ${lvtId}`).toBe(true);
      }
      for (const arId of item.relatedArIds) {
        expect(validArIds.has(arId), `${item.id} -> ${arId}`).toBe(true);
      }
    }
  });

  it("does not manufacture relationships: most items are unlinked", () => {
    // The authority establishes relationships sparsely. The projection must
    // reflect that most PL items have no explicit LVT/AR parent, rather than
    // inventing parentage. This guards against a future 'helpful' change that
    // starts inferring links.
    const linked = p.parkingLot.filter(
      (i) => i.relatedLvtIds.length > 0 || i.relatedArIds.length > 0
    );
    expect(linked.length).toBe(p.meta.counts.plWithExplicitRelationship);
    expect(linked.length).toBeLessThan(p.parkingLot.length / 2);
  });

  it("carries no priority, date, owner, estimate, or progress field", () => {
    for (const item of p.parkingLot) {
      const keys = Object.keys(item);
      expect(keys).not.toContain("priority");
      expect(keys).not.toContain("date");
      expect(keys).not.toContain("owner");
      expect(keys).not.toContain("estimate");
      expect(keys).not.toContain("progress");
    }
  });
});

describe("roadmap projection — graduated/closed (resolved landscape)", () => {
  it("captures graduated/closed items with an authority-worded disposition", () => {
    expect(p.graduated.length).toBeGreaterThan(10);
    expect(p.graduated.length).toBe(p.meta.counts.graduatedTotal);
    for (const g of p.graduated) {
      expect(g.id.length).toBeGreaterThan(0);
      expect(g.disposition.length).toBeGreaterThan(0);
    }
  });

  it("uses only authority dispositions (no invented status vocabulary)", () => {
    // Every disposition must begin with one of the authority's own words.
    const allowedRoots = [
      "Implemented",
      "Promoted",
      "Superseded",
      "Merged",
      "Reframed",
      "Dissolved",
      "Split",
      "Followed",
    ];
    for (const g of p.graduated) {
      const ok = allowedRoots.some((root) => g.disposition.startsWith(root));
      expect(ok, `unexpected disposition "${g.disposition}" for ${g.id}`).toBe(true);
    }
  });

  it("does not double-book: no graduated id appears as an active PL item", () => {
    const activeIds = new Set(p.parkingLot.map((i) => i.id));
    for (const g of p.graduated) {
      // Numeric historical ids (#7) will never collide; PL-* ids must not be both.
      if (g.id.startsWith("PL-")) {
        expect(activeIds.has(g.id), `${g.id} is both active and graduated`).toBe(false);
      }
    }
  });
});

describe("roadmap projection — ADRs (ratified decisions)", () => {
  it("captures ADRs with id and title", () => {
    expect(p.adrs.length).toBeGreaterThanOrEqual(18);
    expect(p.adrs.length).toBe(p.meta.counts.adrTotal);
    for (const a of p.adrs) {
      expect(a.id).toMatch(/^ADR-\d+$/);
      expect(a.title.length).toBeGreaterThan(0);
    }
  });

  it("captures the runtime-boundary decision ADR-018", () => {
    const adr018 = p.adrs.find((a) => a.id === "ADR-018");
    expect(adr018).toBeTruthy();
    expect(adr018?.status).toBe("Accepted");
  });

  it("declares docs/07c-adrs.md as a source", () => {
    expect(p.meta.sources).toContain("docs/07c-adrs.md");
  });
});

describe("roadmap projection — priority (provisional, authority-only)", () => {
  it("has a priority stack shape with an honesty flag", () => {
    expect(p.priority).toBeTruthy();
    expect(typeof p.priority.established).toBe("boolean");
    expect(Array.isArray(p.priority.entries)).toBe(true);
    expect(p.priority.entries.length).toBe(p.meta.counts.priorityTotal);
  });

  it("does not fabricate a ranking: established matches presence of entries", () => {
    expect(p.priority.established).toBe(p.priority.entries.length > 0);
  });

  it("only references ids that resolve (no stale priority references shipped)", () => {
    const known = new Set<string>([
      ...p.lvt.map((n) => n.id),
      ...p.architecture.map((a) => a.id),
      ...p.parkingLot.map((i) => i.id),
      ...p.graduated.map((g) => g.id),
      ...p.adrs.map((a) => a.id),
    ]);
    for (const e of p.priority.entries) {
      if (e.refId) expect(known.has(e.refId), `priority ref ${e.refId}`).toBe(true);
    }
  });
});

describe("roadmap projection — principles register (ratified only)", () => {
  it("captures ratified principles with id, name, and family", () => {
    expect(p.principles.length).toBeGreaterThan(0);
    expect(p.principles.length).toBe(p.meta.counts.principleTotal);
    for (const pr of p.principles) {
      expect(pr.id).toMatch(/^PRIN-[A-Z0-9-]+$/);
      expect(pr.name.length).toBeGreaterThan(0);
      expect(pr.family.length).toBeGreaterThan(0);
    }
  });

  it("only contains the ratified families (no candidate operating principles)", () => {
    const families = new Set(p.principles.map((pr) => pr.family));
    // Architectural + Epistemic are ratified; operating/product-domain is candidate and excluded.
    for (const f of families) {
      expect(/architectural|epistemic/i.test(f), `unexpected ratified family "${f}"`).toBe(true);
    }
  });

  it("does not include candidate operating principles as ratified", () => {
    const names = p.principles.map((pr) => pr.name.toLowerCase());
    // These seven are framed as candidate hypotheses in authority; must not appear here.
    for (const candidate of [
      "preserve optionality",
      "respect uncertainty",
      "execute with discipline",
      "earn proportional compensation",
      "avoid concentration",
      "observe before acting",
      "sustain institutional behavior",
    ]) {
      expect(names).not.toContain(candidate);
    }
  });

  it("consolidates identity: no duplicate principle names or ids", () => {
    const ids = p.principles.map((pr) => pr.id);
    const names = p.principles.map((pr) => pr.name.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("represents a multi-source principle once with combined provenance", () => {
    const pop = p.principles.filter((pr) => /policy over prediction/i.test(pr.name));
    expect(pop).toHaveLength(1);
    expect(pop[0].provenance).toMatch(/retooling-charter/);
    expect(pop[0].provenance).toMatch(/policy-over-prediction/);
  });

  it("declares docs/principles.md as a source", () => {
    expect(p.meta.sources).toContain("docs/principles.md");
  });
});

describe("roadmap projection — domain reference (faithful projection)", () => {
  it("projects the options domain reference into Parts with entries", () => {
    expect(p.domain).toBeTruthy();
    expect(p.domain.parts.length).toBeGreaterThan(0);
    const total = p.domain.parts.reduce((s, part) => s + part.entries.length, 0);
    expect(total).toBe(p.meta.counts.domainEntryTotal);
  });

  it("declares the options domain reference as a source", () => {
    expect(p.meta.sources).toContain("docs/foundations/options-domain-reference.md");
  });

  it("carries only faithful fields (heading/content/tags/level) — no summary field", () => {
    for (const part of p.domain.parts) {
      for (const entry of part.entries) {
        expect(Object.keys(entry).sort()).toEqual([
          "content",
          "heading",
          "level",
          "tables",
          "tags",
          "truncated",
        ]);
        // Tags are drawn only from the reference's own grounding vocabulary.
        for (const t of entry.tags) {
          expect(["MECH", "THEORY", "EMPIRICAL", "BROKER", "WW-POLICY", "UNRESOLVED", "HEURISTIC"]).toContain(t);
        }
      }
    }
  });

  it("renders the lifecycle matrices as structured tables (not lost to truncation)", () => {
    const all = p.domain.parts.flatMap((part) => part.entries);
    const csp = all.find((e) => e.heading.startsWith("2.1"));
    expect(csp, "CSP matrix entry should exist").toBeTruthy();
    expect(csp!.tables.length).toBeGreaterThan(0);
    // The matrix header is the canonical lifecycle schema.
    expect(csp!.tables[0].header).toContain("Before");
    expect(csp!.tables[0].rows.length).toBeGreaterThan(0);
  });

  it("preserves the three-question separation by not asserting policy in tags", () => {
    // A domain entry may be TAGGED [WW-POLICY] where the source flags a policy
    // boundary, but the projection must not itself invent policy content — the
    // faithful-fields test above already guarantees no synthesized field exists.
    // Here we simply confirm the source's own contrast section survived.
    const all = p.domain.parts.flatMap((part) => part.entries);
    const mep = all.find((e) => /Mechanics \/ Evidence \/ Policy/i.test(e.heading));
    expect(mep, "the Mechanics/Evidence/Policy separation section should be projected").toBeTruthy();
  });
});

describe("roadmap projection — coming soon (Now/Next/Later horizons)", () => {
  it("has three unordered horizons", () => {
    expect(p.comingSoon).toBeTruthy();
    expect(Array.isArray(p.comingSoon.now)).toBe(true);
    expect(Array.isArray(p.comingSoon.next)).toBe(true);
    expect(Array.isArray(p.comingSoon.later)).toBe(true);
    const total =
      p.comingSoon.now.length + p.comingSoon.next.length + p.comingSoon.later.length;
    expect(total).toBe(p.meta.counts.comingSoonTotal);
  });

  it("holds capabilities only: no rank, date, status, or percentage fields", () => {
    const all = [...p.comingSoon.now, ...p.comingSoon.next, ...p.comingSoon.later];
    for (const item of all) {
      // Item shape is exactly {name, description} — no ordering/commitment metadata.
      expect(Object.keys(item).sort()).toEqual(["description", "name"]);
      const blob = `${item.name} ${item.description ?? ""}`;
      expect(blob).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(blob).not.toMatch(/\bQ[1-4]\b/);
    }
  });

  it("does not mechanically mirror Priority (non-isomorphic authorities)", () => {
    // A correctness item can top Priority yet appear in no horizon; guard that the
    // horizon capability set is not simply the priority ref set.
    const horizonNames = new Set(
      [...p.comingSoon.now, ...p.comingSoon.next, ...p.comingSoon.later].map((i) => i.name),
    );
    const priorityRefs = new Set(p.priority.entries.map((e) => e.refId));
    // They must not be identical sets (different authorities, different semantics).
    expect(horizonNames).not.toEqual(priorityRefs);
  });
});
