/**
 * Versioned scenario presets for the route validator (Paso 14, DSS + ERPM).
 * Factors are academic assumptions to compare cases, not forecasts or
 * performance data. Base reuses the DSS defaults so both modules agree.
 */

import { dssDefaults } from "@/config/dss-defaults";

export const ERPM_SCENARIOS_VERSION = "erpm-1.0.0" as const;

export type ErpmScenarioId = "base" | "favorable" | "restrictive";

export type ErpmScenario = {
  id: ErpmScenarioId;
  /** Multiplier on the route's weekly demand estimate */
  demandFactor: number;
  /** Multiplier on the reference takeoff distance (hot day, heavy weight) */
  takeoffFactor: number;
  /** Mean airport + commercial revenue per passenger (COP) */
  revenuePerPax: number;
  /** Aggregated airport cost per flight (COP) */
  costPerFlight: number;
  /** Fuel and alternate reserve added to the route distance */
  rangeReserve: number;
};

export const ERPM_SCENARIOS: Record<ErpmScenarioId, ErpmScenario> = {
  base: {
    id: "base",
    demandFactor: 1,
    takeoffFactor: 1,
    revenuePerPax: dssDefaults.revenuePerPax,
    costPerFlight: dssDefaults.costPerFlight,
    rangeReserve: 0.1,
  },
  favorable: {
    id: "favorable",
    demandFactor: 1.2,
    takeoffFactor: 1,
    revenuePerPax: Math.round(dssDefaults.revenuePerPax * 1.05),
    costPerFlight: dssDefaults.costPerFlight,
    rangeReserve: 0.1,
  },
  restrictive: {
    id: "restrictive",
    demandFactor: 0.8,
    takeoffFactor: 1.15,
    revenuePerPax: dssDefaults.revenuePerPax,
    costPerFlight: Math.round(dssDefaults.costPerFlight * 1.1),
    rangeReserve: 0.15,
  },
};

export const ERPM_SCENARIO_ORDER: readonly ErpmScenarioId[] = [
  "base",
  "favorable",
  "restrictive",
];

/** Runway margin below this share of available length is flagged as tight. */
export const RUNWAY_TIGHT_MARGIN = 0.05;

/**
 * Minimum approach category the validator asks for per route segment.
 * Academic policy assumption: long-haul diversions are scarce, so
 * intercontinental operations ask for CAT II. Not an authority rule.
 */
export const REQUIRED_APPROACH = {
  domestic: "CAT_I",
  regional: "CAT_I",
  intercontinental: "CAT_II",
} as const;

export const APPROACH_ORDER = ["NPA", "CAT_I", "CAT_II", "CAT_III"] as const;
