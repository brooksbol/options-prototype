/**
 * Fidelity parser registration.
 * Import this module to register all Fidelity parsers with the registry.
 */

import { registerParser } from "../registry";
import { fidelityOptionSummaryParser } from "./optionSummaryParser";
import {
  fidelityPositionsParser,
  fidelityActivityParser,
  fidelityBalancesParser,
  fidelityOrdersParser,
} from "./stubParsers";

// Register all Fidelity parsers
registerParser(fidelityOptionSummaryParser);
registerParser(fidelityPositionsParser);
registerParser(fidelityActivityParser);
registerParser(fidelityBalancesParser);
registerParser(fidelityOrdersParser);

export { fidelityOptionSummaryParser } from "./optionSummaryParser";
export { parseOptionContract } from "./parseOptionContract";
export { parseDollar, parsePercent, parseQuantity } from "./numericUtils";
