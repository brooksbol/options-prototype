# Independent verification of artifact names: Kotusev "Enterprise Architecture Artifacts on a Page" v3.0

Classification: internal, non-normative survey evidence. Not authority.

- **Source.** The local copy `docs/reference-data/kotusev/enterprise-architecture-artifacts-v3.0.pdf` (579,324 bytes; untracked; not placed by Kiro). It is the Principal-designated canonical reference: `docs/discovery/4am-csvlod-artifact-meta-standard-planning-snapshot-2026-10-18.md` §7.
- **Method.** On 2026-10-18 Kiro converted the PDF to PNG with macOS `sips` (5022×3548), downscaled it to 2400 px wide, and read it visually.
- **Limits of this check.**
  - Only the artifact titles and the central matrix labels were legible enough to transcribe with confidence. Body text and properties were not verified.
  - The legend on the left edge is partly cut off in the render.
  - The artifact-to-category assignments (which CSVLOD quadrant each tile belongs to) are shown in the diagram by position and dashed lines. They were **not** independently verified, so no routing is asserted here.

## Central matrix (exact labels)

- **Axes.** "What EA Artifacts Describe?": Generic → Specific, with columns **Rules**, **Structures** and **Solutions/Products**. "How EA Artifacts Describe?": **Business-Focused** (top row), **IT-Focused** (bottom row).
- **Top row:** **Considerations**, **Visions**, **Outlines**. Outlines is subdivided into "Solutions (Project Mode)" and "Products (Product Mode)".
- **Bottom row:** **Standards**, **Landscapes**, **Designs**. Designs is subdivided into "Solutions (Project Mode)" and "Products (Product Mode)".
- **Side labels on the right-hand tile column:** "Products", "Solutions", "Solutions", "Products".

## Artifact tiles (34), as titled on the diagram

| Position | Titles (left → right, or top → bottom) |
|---|---|
| Top row (12) | Principles · Policies · Architecture Strategies · Technology Strategies · Business Capability Models · Process Maps · Value Chains · Target States · Roadmaps · Product Roadmaps · Increment Overviews · Solution Briefs |
| Left column below Principles (5) | Conceptual Data Models · Technology Reference Models · Technology Inventories[*] · Technology Roadmaps[*] · Technology Radars |
| Right column below Solution Briefs (5) | Solution Options · Solution Overviews · Preliminary Solution Designs · Solution Designs · Increment Designs |
| Bottom row (12) | IT Principles · Guidelines · Patterns · Logical Data Models[*] · Landscape Diagrams[*] · Asset Inventories[*] · System Portfolio Models · Landscape Maps · IT Roadmaps · Asset Roadmaps[*] · Product Diagrams · Design Decisions |

The diagram's [*] note reads: "These EA artifacts are particularly often stored in specialized tool-based architectural repositories and extracted as views".

The Notes panel says, in substance:
- mature EA practices usually use pragmatic sets of 12–18 value-adding artifacts, or about half of those presented;
- templates show typical content and should be adapted, not copied mindlessly.

## Reconciliation with the earlier 24-item provisional list (snapshot §2)

- **The earlier list undercounts.** The diagram shows **34** artifact titles, not 24.
- **Every name the snapshot's §7 correction cites is present:** Technology Strategies, Architecture Strategies, Process Maps, Technology Inventories, System Portfolio Models, Asset Roadmaps, Product Roadmaps, Increment Overviews, Solution Briefs, Solution Options, Increment Designs, Policies and IT Principles.
- **Additional titles to check against the 24-item list:** Technology Reference Models, Technology Radars, Landscape Diagrams, Landscape Maps, IT Roadmaps, Asset Inventories, Logical Data Models, Product Diagrams, Design Decisions, Guidelines, Patterns, Value Chains, Target States, Roadmaps.
  - Kiro did not re-diff each against the provisional list in this pass. Codex A8 owns the full transcription and reconciliation.
- **There is no tile named "IT Policies".** "Policies" and "IT Principles" are separate tiles, which confirms the §7 caution.
- **"Outlines" and "Designs" each split into Solutions (Project Mode) and Products (Product Mode).** This bears directly on Wheelwright's product-mode (not project-mode) use. Increment Overviews and Increment Designs appear to be the product-mode tiles. That reading is from position only and is unverified.

## Open for Codex A8 / later review

- Category assignment of each of the 34 tiles: by position, not verified here.
- Exact wording of each tile's one-line description, which was not legible at the render resolution used.
- Any differences between the canonical URL version and this local copy: not compared.
