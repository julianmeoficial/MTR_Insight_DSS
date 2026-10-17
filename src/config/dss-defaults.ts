/**
 * Versioned DSS defaults for the airport break-even and 2045 projection.
 */

export const DSS_DEFAULTS_VERSION = "1.0.0" as const;

export const dssDefaults = {
  version: DSS_DEFAULTS_VERSION,
  currency: "COP" as const,
  /** Mean airport + commercial revenue per international passenger */
  revenuePerPax: 85_000,
  /** Fixed + variable airport cost per flight (aggregated) */
  costPerFlight: 2_500_000,
  weeklyFrequencies: 3,
  /** Demo current load factor (e.g. Satena soft week) */
  currentLoadFactor: 0.62,
  projection: {
    baseYear: 2024,
    horizonYear: 2045,
    baselinePassengers: 1_478_610,
    declaredAnnualCapacity: 1_700_000,
    rates: {
      low: 0.025,
      base: 0.039,
      high: 0.055,
    },
    triggerPlan: 0.8,
    triggerExecute: 0.9,
  },
} as const;

export type DssDefaults = typeof dssDefaults;
