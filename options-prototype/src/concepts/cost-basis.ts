import type { ConceptDefinition } from "./types";

export const costBasisConcept: ConceptDefinition = {
  id: "cost-basis",
  title: "Cost Basis",

  generic:
    "Cost basis is the total amount invested in a security, including the purchase price and any fees. " +
    "For option-related positions, cost basis becomes particularly important when assignment occurs: " +
    "for puts, the effective acquisition basis is the strike price minus the premium received per share. " +
    "For calls, the cost basis of the underlying shares determines whether assignment at the strike " +
    "represents appreciation, a near-break-even, or a capital loss.",

  specific: (ctx) => {
    const { position, detail, inventory } = ctx;
    if (!detail) return null;

    if (position.type === "put") {
      const scenario = detail.assignmentScenario;
      if (scenario.type !== "put") return null;

      if (scenario.effectiveBasis.value != null) {
        const provNote = scenario.effectiveBasis.provenance === "demo" ? " (demo)" : "";
        return (
          `If assigned, shares would be acquired at the $${position.strike.toFixed(2)} strike. ` +
          `Accounting for the premium received, the effective acquisition basis would be ` +
          `$${scenario.effectiveBasis.value.toFixed(2)} per share${provNote}. ` +
          `This is the true cost of acquiring the position after premium income is considered.`
        );
      }
      return (
        `If assigned, shares would be acquired at the $${position.strike.toFixed(2)} strike. ` +
        `The effective acquisition basis (strike minus premium received) cannot be calculated ` +
        `because premium information is not yet available.`
      );
    } else {
      // Call
      const scenario = detail.assignmentScenario;
      if (scenario.type !== "call") return null;

      if (scenario.costBasisPerShare.value != null) {
        const basis = scenario.costBasisPerShare.value;
        const provNote = scenario.costBasisPerShare.provenance === "demo" ? " (demo)" : "";
        const diff = position.strike - basis;
        const diffStr = diff >= 0 ? `$${diff.toFixed(2)} above` : `$${Math.abs(diff).toFixed(2)} below`;

        let classification = "";
        if (scenario.callAwayClassification.value === "appreciation") {
          classification = " Assignment at this strike would represent share appreciation.";
        } else if (scenario.callAwayClassification.value === "below-basis") {
          classification = " Assignment at this strike would represent a capital loss on the shares — the premium received may or may not offset this loss.";
        } else if (scenario.callAwayClassification.value === "near-basis") {
          classification = " Assignment at this strike is near the cost basis — the economic outcome is primarily the premium received.";
        }

        return (
          `The cost basis for the underlying shares is $${basis.toFixed(2)} per share${provNote}. ` +
          `The $${position.strike.toFixed(2)} call strike is ${diffStr} cost basis.` +
          classification
        );
      }
      return (
        `The cost basis of the underlying shares is not currently available. ` +
        `Without cost basis, the economic consequence of call assignment (appreciation vs capital loss) ` +
        `cannot be determined.`
      );
    }
  },

  systemNote:
    "Wheelwright distinguishes three call-away outcomes based on the relationship between " +
    "strike price and cost basis: appreciation (strike > basis + 2%), near-basis (within ±2%), " +
    "and below-basis (strike < basis − 2%). This classification matters because covered call " +
    "writing can inadvertently lock in capital losses if the strike is below the acquisition cost. " +
    "Premium received must then be weighed against the share-level loss to determine net economics.",

  related: ["premium", "assignment", "encumbered-capital"],
};
