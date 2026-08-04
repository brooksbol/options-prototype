import type { ConceptDefinition } from "./types";

export const assignmentConcept: ConceptDefinition = {
  id: "assignment",
  title: "Assignment",

  generic:
    "Assignment is the event where an option buyer exercises their right, and the option seller " +
    "(the short position holder) must fulfill the contract obligation. For a short put, assignment " +
    "means purchasing shares at the strike price. For a short call, assignment means delivering " +
    "(selling) shares at the strike price. Assignment most commonly occurs at expiration when an " +
    "option is in the money, but can happen at any time for American-style options.",

  specific: (ctx) => {
    const { position } = ctx;

    if (position.type === "put") {
      const shares = position.quantity * 100;
      const cost = position.strike * shares;
      return (
        `If this put is assigned, you are obligated to purchase ${shares} shares of ${position.underlying} ` +
        `at $${position.strike.toFixed(2)} per share ($${cost.toLocaleString()} total). ` +
        `The cash currently securing this obligation ($${(position.encumberedCapital ?? cost).toLocaleString()}) ` +
        `would become equity inventory. ` +
        `The resulting ${shares} shares would create ${position.quantity} new 100-share lot${position.quantity > 1 ? "s" : ""} ` +
        `potentially available for covered call writing.`
      );
    } else {
      const shares = position.quantity * 100;
      const proceeds = position.strike * shares;
      return (
        `If this call is assigned, you are obligated to deliver ${shares} shares of ${position.underlying} ` +
        `at $${position.strike.toFixed(2)} per share ($${proceeds.toLocaleString()} total gross proceeds). ` +
        `Those shares would be removed from your inventory. Whether this represents a gain or loss ` +
        `depends on the cost basis of the shares being delivered relative to the $${position.strike.toFixed(2)} strike.`
      );
    }
  },

  systemNote:
    "Wheelwright models assignment as a portfolio state transition. A put assignment converts " +
    "cash-secured capital into equity inventory. A call assignment converts inventory into cash. " +
    "Mid-cycle assignment removes the contract from its expiration cohort and produces either " +
    "unencumbered shares (put) or cash (call). The weekly temporal structure of the ladder " +
    "remains intact because the contract simply disappears from its rung.",

  related: ["moneyness", "encumbered-capital", "cost-basis"],
};
