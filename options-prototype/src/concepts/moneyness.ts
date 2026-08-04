import type { ConceptDefinition } from "./types";

export const moneynessConcept: ConceptDefinition = {
  id: "moneyness",
  title: "Moneyness (OTM / ATM / ITM)",

  generic:
    "Moneyness describes the relationship between an option's strike price and the current " +
    "price of the underlying security. Out of the money (OTM) means the underlying has not " +
    "reached the strike — the option would have no intrinsic value if it expired now. " +
    "In the money (ITM) means the underlying has crossed the strike — the option has intrinsic " +
    "value and assignment becomes mechanically rational. At the money (ATM) means the underlying " +
    "is near the strike price.",

  specific: (ctx) => {
    const { position } = ctx;
    if (position.moneyness == null || position.underlyingPrice == null) {
      return "No current market observation is available for this position's underlying, so moneyness cannot be determined.";
    }

    const pct = Math.abs(position.moneyness * 100).toFixed(1);
    const dollarDist = Math.abs(position.underlyingPrice - position.strike).toFixed(2);

    if (position.moneyness > 0.01) {
      // ITM
      if (position.type === "put") {
        return (
          `The underlying ($${position.underlyingPrice.toFixed(2)}) is trading below the $${position.strike} strike. ` +
          `This put is in the money by ${pct}% ($${dollarDist}). ` +
          `If the position remained in this state at expiration, assignment would be expected — ` +
          `the put buyer would exercise their right to sell shares at the strike price, ` +
          `and you would be obligated to purchase them.`
        );
      } else {
        return (
          `The underlying ($${position.underlyingPrice.toFixed(2)}) is trading above the $${position.strike} strike. ` +
          `This call is in the money by ${pct}% ($${dollarDist}). ` +
          `If the position remained in this state at expiration, assignment would be expected — ` +
          `the call buyer would exercise their right to purchase shares at the strike price, ` +
          `and you would be obligated to deliver them.`
        );
      }
    } else if (position.moneyness < -0.01) {
      // OTM
      if (position.type === "put") {
        return (
          `The underlying ($${position.underlyingPrice.toFixed(2)}) is trading above the $${position.strike} strike. ` +
          `This put is out of the money by ${pct}% ($${dollarDist}). ` +
          `The underlying would need to fall $${dollarDist} before this put reaches the strike. ` +
          `At expiration, an OTM option expires worthless — the obligation is fulfilled without assignment.`
        );
      } else {
        return (
          `The underlying ($${position.underlyingPrice.toFixed(2)}) is trading below the $${position.strike} strike. ` +
          `This call is out of the money by ${pct}% ($${dollarDist}). ` +
          `The underlying would need to rise $${dollarDist} before this call reaches the strike. ` +
          `At expiration, an OTM option expires worthless — the obligation is fulfilled without assignment.`
        );
      }
    } else {
      // ATM
      return (
        `The underlying ($${position.underlyingPrice.toFixed(2)}) is trading very near the $${position.strike} strike ` +
        `(within 1%). At this proximity, whether the option finishes in or out of the money depends on ` +
        `small movements in the underlying over the remaining ${position.dte} days.`
      );
    }
  },

  systemNote:
    "Wheelwright computes moneyness as a signed fraction of the strike price. " +
    "For calls: (underlying price − strike) / strike. For puts: (strike − underlying price) / strike. " +
    "Positive values always indicate ITM regardless of contract type; negative values always indicate OTM. " +
    "The ±1% band around zero is presented as ATM. This normalization allows consistent visual scanning " +
    "across mixed put/call portfolios.",

  related: ["strike-price", "assignment", "dte"],
};
