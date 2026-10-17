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
  calculateBreakEven,
  evaluateAlerts,
  evaluateK1RedStreak,
  evaluateSourceNotLoaded,
  evaluateTrafficLight,
  projectDemand2045,
  sampleProjectionYears,
} from "@/domain";

export {
  buildDashboardReport,
  getFilteredK1Hero,
} from "@/application/dashboard";
export type {
  BuildDashboardOptions,
  DashboardReport,
  KpiTileModel,
  LoadFactorSeriesPoint,
} from "@/application/dashboard";

export type {
  AlertEvent,
  BreakEvenInput,
  BreakEvenResult,
  CapacitySnapshot,
  DemandSnapshot,
  FlightRecord,
  KpiResult,
  Projection2045Result,
  QualityRecord,
  RequirementRecord,
  TrafficLight,
} from "@/domain";

export {
  AIRCRAFT_CATALOG,
  aircraftByGroup,
  getAircraft,
  RUNWAY_LENGTH_M,
} from "@/config/aircraft";
export type { AircraftId } from "@/config/aircraft";
export { dssDefaults } from "@/config/dss-defaults";
