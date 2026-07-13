/**
 * Bootstrap Wheel Scenario — manifest and CSV content.
 *
 * A single-symbol (XLU) scenario demonstrating one complete
 * wheel cycle: cash → put written → put assigned → call written → call expired.
 *
 * Each step is a cumulative Fidelity-shaped activity CSV
 * containing all prior history plus one new event.
 */

import step01 from "./step-01-bootstrap.csv?raw";
import step02 from "./step-02-put-written.csv?raw";
import step03 from "./step-03-put-assigned.csv?raw";
import step04 from "./step-04-call-written.csv?raw";
import step05 from "./step-05-call-expired.csv?raw";

export interface ScenarioStep {
  id: string;
  label: string;
  description: string;
  csv: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  symbol: string;
  ingestionMode: "cumulative";
  steps: ScenarioStep[];
}

export const BOOTSTRAP_WHEEL_SCENARIO: Scenario = {
  id: "bootstrap-wheel",
  name: "Bootstrap Wheel",
  description: "Single-symbol XLU wheel cycle: cash → CSP → assigned → covered call → expired. Exercises the full overlay lifecycle.",
  symbol: "XLU",
  ingestionMode: "cumulative",
  steps: [
    {
      id: "01-bootstrap",
      label: "Bootstrap",
      description: "Initial cash deposit. $50,000 enters the account.",
      csv: step01,
    },
    {
      id: "02-put-written",
      label: "Put Written",
      description: "Sell-to-open one XLU $44.50 put expiring Jul 10. Premium received: $84.33 after commissions.",
      csv: step02,
    },
    {
      id: "03-put-assigned",
      label: "Put Assigned",
      description: "XLU put assigned. 100 shares acquired at $44.50. Cash consumed: $4,450.",
      csv: step03,
    },
    {
      id: "04-call-written",
      label: "Call Written",
      description: "Sell-to-open one XLU $46 covered call expiring Aug 14. Premium received: $71.33.",
      csv: step04,
    },
    {
      id: "05-call-expired",
      label: "Call Expired",
      description: "XLU call expires worthless. Shares released. Premium retained. Covered call capacity restored.",
      csv: step05,
    },
  ],
};
