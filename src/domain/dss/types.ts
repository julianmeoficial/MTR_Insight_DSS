import type { AircraftId } from "@/config/aircraft";

export type BreakEvenStatus = "feasible" | "infeasible" | "no_data" | "cargo_n_a";

export type BreakEvenComparison =
  | "above_break_even"
  | "below_break_even"
  | "at_break_even"
  | "unavailable";

export type BreakEvenInput = {
  aircraftId: AircraftId;
  /** T_aeroportuaria + I_comercial (COP / passenger) */
  revenuePerPax: number;
  /** C_fijo + C_variable per flight (COP / flight) */
  costPerFlight: number;
  weeklyFrequencies: number;
  currentLoadFactor?: number | null;
};

export type BreakEvenResult = {
  aircraftId: AircraftId;
  seats: number;
  lfEquilibrium: number | null;
  minPassengers: number | null;
  status: BreakEvenStatus;
  comparison: BreakEvenComparison;
  currentLoadFactor: number | null;
  weeklySeatsOffered: number;
  weeklyBreakEvenPax: number | null;
  thresholdPax: {
    alert65: number | null;
    target70: number | null;
    target80: number | null;
  };
  message: string;
};

export type ProjectionScenarioId = "low" | "base" | "high";

export type ProjectionPoint = {
  year: number;
  passengers: number;
  utilization: number;
};

export type CapacityTrigger = {
  level: 0.8 | 0.9;
  label: string;
  year: number | null;
  alreadyMet: boolean;
  policyRef: string;
};

export type ScenarioProjection = {
  id: ProjectionScenarioId;
  rate: number;
  label: string;
  series: ProjectionPoint[];
  triggers: CapacityTrigger[];
};

export type Projection2045Result = {
  baseYear: number;
  horizonYear: number;
  baselinePassengers: number;
  declaredAnnualCapacity: number;
  baselineUtilization: number;
  scenarios: ScenarioProjection[];
  assumptionNote: string;
};
