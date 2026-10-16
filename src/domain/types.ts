/** Shared domain contracts for KPIs and alerts. */

export type KpiId = "K1" | "K2" | "K3" | "K4" | "K5";

export type TrafficLight = "green" | "yellow" | "red" | "no_data";

export type DatePeriod = {
  start: string;
  end: string;
};

export type KpiResult = {
  kpiId: KpiId;
  value: number | null;
  unit: "ratio";
  status: TrafficLight;
  period: DatePeriod;
  dimensions?: Record<string, string>;
  meta?: {
    numerator: number;
    denominator: number;
    overrideReason?: string;
  };
};

export type AlertSeverity = "yellow" | "red";

export type AlertTrigger = "K1_RED_STREAK" | "SOURCE_NOT_LOADED";

export type AlertEvent = {
  id: string;
  trigger: AlertTrigger;
  kpiId?: KpiId;
  severity: AlertSeverity;
  period: DatePeriod;
  entity: string;
  owner: string;
  message: string;
};

export type FlightRecord = {
  route: string;
  operator: string;
  aircraftType: string;
  weekStart: string;
  weekEnd: string;
  passengersBoarded: number;
  seatsOffered: number;
};

export type RequirementRecord = {
  requirementId: string;
  authority: string;
  critical: boolean;
  applicable: boolean;
  dueDate: string;
  completedFlag: boolean;
  evidenceId: string | null;
  approvalDate: string | null;
};

export type CapacitySnapshot = {
  periodStart: string;
  periodEnd: string;
  rolling12MonthPassengers: number;
  declaredAnnualCapacity: number;
};

export type DemandSnapshot = {
  periodStart: string;
  periodEnd: string;
  directInternationalDeparturesFromMtr: number;
  catchmentInternationalTravelers: number;
};

export type QualityRecord = {
  sourceId: string;
  sourceName: string;
  owner: string;
  expectedCriticalRecords: number;
  loadedOnTimeAndValidated: number;
  unresolvedTechnicalConflict: boolean;
  loaded: boolean;
  periodStart: string;
  periodEnd: string;
};
