import type { AircraftId, CodeLetter } from "@/config/aircraft";
import type { ErpmScenarioId } from "@/config/erpm-scenarios";
import type { BreakEvenStatus } from "@/domain/dss/types";
import type { TrafficLight } from "@/domain/types";

/** Paso 13 §3: every item carries one of these evidence stages. */
export type EvidenceStage =
  | "operating"
  | "confirmed"
  | "announced"
  | "negotiating"
  | "proposed"
  | "to_verify";

export type Confidence = "high" | "medium" | "low";

export type GeoPoint = { lat: number; lon: number };

export type AirportRef = {
  iata: string;
  icao: string | null;
  city: string;
  country: string;
  position: GeoPoint;
};

export type SourceRef = {
  source: string;
  /** ISO date of the source or of the last verification */
  date: string | null;
  confidence: Confidence;
};

/** Regional: Caribbean, Central and North America. Intercontinental: Europe, Asia. */
export type RouteSegment = "domestic" | "regional" | "intercontinental";

export type RouteOpportunity = {
  id: string;
  destination: string;
  international: boolean;
  segment: RouteSegment;
  stage: EvidenceStage;
  /** Operator name, or null when no airline is attached yet */
  airline: string | null;
  aircraftId: AircraftId | null;
  weeklyFrequencies: number | null;
  /** ISO date or month (YYYY-MM) of the effective or announced start */
  start: string | null;
  /** Estimated passengers per week and direction; null when unknown */
  weeklyDemandPax: number | null;
  demandIsAssumption: boolean;
  evidence: SourceRef;
  note: string;
};

export type Modernization = {
  id: string;
  title: string;
  stage: EvidenceStage;
  area: "terminal" | "airside" | "security" | "border" | "systems";
  expectedEffect: string;
  evidence: SourceRef;
};

export type ErpmDataItem = {
  id: string;
  variable: string;
  unit: string;
  value: string | null;
  evidence: SourceRef;
  owner: string;
  usedFor: string;
};

export type ApproachCategory = "NPA" | "CAT_I" | "CAT_II" | "CAT_III";

export type InfraStatus = "existing" | "projected";

export type RunwayId = "RWY1" | "RWY2";
export type TerminalId = "T1" | "T2";

export type RunwayRef = {
  id: RunwayId;
  designator: string;
  status: InfraStatus;
  lengthM: number;
  widthM: number;
  /** Pavement classification number; null means not available */
  pcn: number | null;
  /** Approach and lighting category the runway supports */
  approach: ApproachCategory;
  evidence: SourceRef;
};

export type TerminalRef = {
  id: TerminalId;
  name: string;
  status: InfraStatus;
  annualCapacity: number;
  international: boolean;
  /** Largest ICAO code letter its stands accept */
  maxCodeLetter: CodeLetter;
  /** Stands for code E aircraft */
  widebodyStands: number;
  evidence: SourceRef;
};

/** "current" uses existing assets; "expansion" adds the projected ones. */
export type InfraConfig = "current" | "expansion";

export type TerminalChoice = "auto" | TerminalId;

export type AirportConstraints = {
  runways: RunwayRef[];
  terminals: TerminalRef[];
  /** ICAO rescue and firefighting category by configuration */
  arffCategory: Record<InfraConfig, number>;
  elevationM: number | null;
  /** Rolling 12-month passengers, all handled today by T1 (K3 input) */
  rolling12MonthPassengers: number;
};

export type CheckOutcome = "pass" | "tight" | "fail" | "no_data";

export type FeasibilityCheck = {
  id:
    | "runway"
    | "runway_width"
    | "pavement"
    | "approach"
    | "arff"
    | "terminal_fit"
    | "range"
    | "demand"
    | "break_even"
    | "terminal";
  outcome: CheckOutcome;
  /** Raw numbers for the explanation panel; UI formats them. */
  required: number | null;
  available: number | null;
};

export type Verdict = "viable" | "conditional" | "not_viable" | "no_data";

export type RouteEvaluation = {
  routeId: string;
  aircraftId: AircraftId;
  scenarioId: ErpmScenarioId;
  infraConfig: InfraConfig;
  /** Runway and terminal the validator assigned (best fit, or forced) */
  runwayId: RunwayId;
  terminalId: TerminalId;
  distanceKm: number;
  weeklyFrequencies: number;
  /** Runway length that clears the tight-margin band (illustrative) */
  runwayRequiredM: number | null;
  /** Extra runway needed over the airport input; 0 when it already fits */
  runwayExtensionM: number | null;
  weeklySeats: number;
  weeklyDemandPax: number | null;
  projectedLoadFactor: number | null;
  loadFactorStatus: TrafficLight;
  breakEvenLoadFactor: number | null;
  breakEvenStatus: BreakEvenStatus;
  /** Passengers per flight needed to reach the 70 % target */
  paxPerFlightTarget70: number;
  /** Utilization of the assigned terminal after adding the route */
  utilizationAfter: number;
  utilizationStatus: TrafficLight;
  checks: FeasibilityCheck[];
  verdict: Verdict;
  /** Data gaps the user must close before any real decision */
  gaps: FeasibilityCheck["id"][];
};

export type ScenarioDelta = {
  key: "demandFactor" | "takeoffFactor" | "revenuePerPax" | "costPerFlight" | "rangeReserve";
  base: number;
  value: number;
};
