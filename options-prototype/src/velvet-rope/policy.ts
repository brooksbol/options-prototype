/**
 * Velvet Rope — Default Admission Policy
 */

import type { AdmissionPolicy } from "./types";

export const DEFAULT_ADMISSION_POLICY: AdmissionPolicy = {
  version: "v1",
  createdAt: "2026-07-13",

  expirationDteRange: { min: 7, max: 45 },

  contractSelection: {
    targetDelta: 0.30,
    deltaRange: { min: 0.15, max: 0.50 },
    putDeltaAbsolute: true,
    excludeZeroBid: true,
    requireGreeks: true,
    tieBreaker: "PreferOTM",
  },

  sideRequirement: "both",

  // Market quality
  minOpenInterest: { value: 50, severity: "hard" },
  minOptionVolume: { value: 10, severity: "observational" },
  maxBidAskSpreadPercent: { value: 15, severity: "hard" },
  requireGreeks: { value: true, severity: "hard" },

  // Institutional suitability
  maxCapitalPerContract: { value: 60000, severity: "hard" },
  minCapitalPerContract: { value: 2000, severity: "soft" },

  // Income
  minYieldAtTargetDelta: { value: 5, severity: "soft" },

  // Structural complexity
  structuralCaution: { value: true, severity: "soft" },

  // Near-miss tolerance
  nearMissPercent: 15,
};
