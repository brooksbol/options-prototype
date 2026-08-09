import type { ConceptDefinition } from "./types";

export const costBasisConcept: ConceptDefinition = {
  id: "cost-basis",
  title: "Cost Basis",

  generic:
    "Cost basis is the total amount invested in a security, including the purchase price and any fees. " +
    "For option-related positions, cost basis becomes particularly important when assignment occurs: " +
    "for puts, the analytical effective basis is the strike price minus the premium credit per share. " +
    "For calls, the cost basis of the underlying shares determines whether assignment at the strike " +
    "represents appreciation or capital erosion.",

  specific: (ctx) => {
    const { position, detail } = ctx;
    if (!detail) return null;
    const { consequence } = detail;

    if (position.type === "put" && consequence.type === "put") {
      if (consequence.analyticalEffectiveBasis.value != null) {
        return (
          `If assigned, shares would be acquired at the $${position.strike.toFixed(2)} strike. ` +
          `Accounting for the premium credit received, the analytical effective basis would be ` +
          `$${consequence.analyticalEffectiveBasis.value.toFixed(2)} per share. ` +
          `This is Wheelwright's analytical measure — the broker will report acquisition at the strike price.`
        );
      }
      return (
        `If assigned, shares would be acquired at the $${position.strike.toFixed(2)} strike. ` +
        `The analytical effective basis (strike minus premium credit) cannot be calculated ` +
        `because broker option basis is not available for this position.`
      );
    } else if (position.type === "call" && consequence.type === "call") {
      if (consequence.brokerShareBasis.value != null) {
        const basis = consequence.brokerShareBasis.value;
        const diff = position.strike - basis;
        const diffStr = diff >= 0 ? `$${diff.toFixed(2)} above` : `$${Math.abs(diff).toFixed(2)} below`;

        const classification = diff > basis * 0.02
          ? " Assignment at this strike would represent share appreciation."
          : diff < -(basis * 0.02)
            ? " Assignment at this strike would represent capital erosion on the shares."
            : " Assignment at this strike is near the cost basis.";

        return (
          `The broker-reported cost basis for the underlying shares is $${basis.toFixed(2)} per share. ` +
          `The $${position.strike.toFixed(2)} call strike is ${diffStr} cost basis.` +
          classification
        );
      }
      return (
        `The cost basis of the underlying shares is not currently available. ` +
        `Without cost basis, the capital appreciation or erosion at assignment ` +
        `cannot be determined.`
      );
    }
    return null;
  },

  systemNote:
    "Wheelwright presents capital appreciation/erosion and option premium as separate components " +
    "rather than collapsing them into a single P/L number. This preserves the distinction between " +
    "share-level gain/loss (driven by price movement) and premium production (driven by option writing). " +
    "The analytical effective exit/basis is a secondary derived measure shown for decision support.",

  related: ["premium", "assignment", "encumbered-capital"],
};
