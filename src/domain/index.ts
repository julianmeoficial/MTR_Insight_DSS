export type {
  AlertEvent,
  AlertSeverity,
  AlertTrigger,
  CapacitySnapshot,
  DatePeriod,
  DemandSnapshot,
  FlightRecord,
  KpiId,
  KpiResult,
  QualityRecord,
  RequirementRecord,
  TrafficLight,
} from "@/domain/types";

export {
  calculateK1,
  calculateK2,
  calculateK3,
  calculateK4,
  calculateK5,
  evaluateTrafficLight,
} from "@/domain/kpis";

export {
  evaluateAlerts,
  evaluateK1RedStreak,
  evaluateSourceNotLoaded,
} from "@/domain/alerts";

export {
  calculateBreakEven,
  projectDemand2045,
  sampleProjectionYears,
} from "@/domain/dss";

export type {
  BreakEvenInput,
  BreakEvenResult,
  Projection2045Result,
  ScenarioProjection,
} from "@/domain/dss";

