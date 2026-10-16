/**
 * Thin application façade. Screens (P1, P2, alert center) should import from
 * here or from @/domain so formulas are never redefined in components.
 */

export {
  calculateK1,
  calculateK2,
  calculateK3,
  calculateK4,
  calculateK5,
  evaluateAlerts,
  evaluateK1RedStreak,
  evaluateSourceNotLoaded,
  evaluateTrafficLight,
} from "@/domain";

export type {
  AlertEvent,
  CapacitySnapshot,
  DemandSnapshot,
  FlightRecord,
  KpiResult,
  QualityRecord,
  RequirementRecord,
  TrafficLight,
} from "@/domain";
