import type { ConceptDefinition } from "./types";

export const dteConcept: ConceptDefinition = {
  id: "dte",
  title: "Days to Expiration (DTE)",

  generic:
    "Days to expiration measures the calendar time remaining until an option contract expires. " +
    "At expiration, the contract's outcome is determined: if it is in the money, assignment occurs; " +
    "if it is out of the money, it expires worthless and the obligation is fulfilled. " +
    "Time remaining affects option pricing — options lose time value as expiration approaches, " +
    "a phenomenon called time decay or theta.",

  specific: (ctx) => {
    const { position } = ctx;
    const expDate = new Date(position.expiration + "T12:00:00");
    const dateStr = expDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    if (position.dte <= 0) {
      return `This contract expires today (${dateStr}). Its final outcome will be determined at market close.`;
    }
    if (position.dte <= 3) {
      return (
        `This contract expires in ${position.dte} day${position.dte > 1 ? "s" : ""} (${dateStr}). ` +
        `With very little time remaining, the underlying would need to move quickly to change the moneyness outcome. ` +
        `Time decay is at its most rapid in the final days before expiration.`
      );
    }
    if (position.dte <= 14) {
      return (
        `This contract expires in ${position.dte} days (${dateStr}). ` +
        `In the near term, both the underlying price and the passage of time will influence whether ` +
        `assignment occurs. Time decay accelerates as expiration approaches.`
      );
    }
    return (
      `This contract expires in ${position.dte} days (${dateStr}). ` +
      `With ${position.dte} days remaining, there is substantial time for the underlying to move. ` +
      `The option retains meaningful time value at this distance from expiration.`
    );
  },

  systemNote:
    "Wheelwright computes DTE from the current date to the contract's expiration date (market close at 4:00 PM ET). " +
    "The operating model uses weekly Friday expirations within a 45-DTE maximum horizon. " +
    "Contracts are typically written on Mondays and expire the following Friday, forming weekly deployment cohorts " +
    "visible as rungs on the expiration ladder.",

  related: ["assignment", "moneyness"],
};
