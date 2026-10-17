export {
  REFERENCE_AIRCRAFT,
  LOAD_THRESHOLDS,
  minPassengersForRatio,
  breakEvenTable,
  calculateBreakEven,
  type AircraftRef,
} from "@/domain/dss/break-even";

export {
  FORECAST_RATES,
  projectPassengers,
  capacityTriggerYear,
  buildFanSeries,
  type FanPoint,
  type ForecastBand,
} from "@/domain/dss/projection";

export {
  projectDemand2045,
  sampleProjectionYears,
} from "@/domain/dss/projection-2045";

export type {
  BreakEvenComparison,
  BreakEvenInput,
  BreakEvenResult,
  BreakEvenStatus,
  CapacityTrigger,
  Projection2045Result,
  ProjectionPoint,
  ProjectionScenarioId,
  ScenarioProjection,
} from "@/domain/dss/types";
