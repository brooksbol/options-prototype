import type { ConceptDefinition } from "./types";

export const premiumConcept: ConceptDefinition = {
  id: "premium",
  title: "Option Premium",

  generic:
    "Premium is the price received by the option seller (writer) when the contract is opened. " +
    "It represents immediate income in exchange for accepting the obligation to buy (put) or sell (call) " +
    "shares at the strike price. Premium is influenced by the underlying price, strike distance, " +
    "time to expiration, and implied volatility. Once received, premium is the seller's to keep " +
    "regardless of the contract's eventual outcome.",

  specific: (ctx) => {
    const { detail, position } = ctx;
    if (!detail) return null;

    const econ = detail.economics;
    if (econ.premiumPerContract.value == null) {
      return (
        "Premium information is not currently available for this position. " +
        "This data would come from the opening transaction history, which has not yet been ingested."
      );
    }

    const perContract = econ.premiumPerContract.value;
    const gross = econ.grossPremium.value ?? 0;
    const net = econ.netPremium.value ?? 0;
    const returnPct = econ.premiumReturnOnCapital.value != null
      ? (econ.premiumReturnOnCapital.value * 100).toFixed(1)
      : null;

    const provNote = econ.premiumPerContract.provenance === "demo" ? " (demo value)" : "";

    let text = `This ${position.type} was opened at $${perContract.toFixed(2)} per contract${provNote}. `;
    text += `For ${position.quantity} contract${position.quantity > 1 ? "s" : ""}, `;
    text += `the gross premium received was $${gross.toFixed(0)}`;
    if (econ.fees.value != null && econ.fees.value > 0) {
      text += ` ($${net.toFixed(0)} after $${econ.fees.value.toFixed(2)} in fees)`;
    }
    text += ". ";

    if (returnPct != null && position.encumberedCapital != null) {
      text += `Relative to the $${position.encumberedCapital.toLocaleString()} in encumbered capital, `;
      text += `this represents a ${returnPct}% premium return.`;
    }

    return text;
  },

  systemNote:
    "Wheelwright sources premium from opening transaction records. For the demo experience, " +
    "synthetic premium values are provided to illustrate the full position economics. " +
    "In production, premium will come from Activity History ingestion once that integration is built. " +
    "Premium return on capital is calculated as: net premium / encumbered capital. " +
    "This is a raw (non-annualized) return for the contract's duration.",

  related: ["encumbered-capital", "cost-basis", "assignment"],
};
