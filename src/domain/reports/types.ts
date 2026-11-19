import type { TrafficLight } from "@/domain/types";

export type ReportId = "comercial" | "capacidad" | "cumplimiento";

/** One management decision the report supports, with its evidence. */
export type ReportDecision = {
  id: string;
  priority: "alta" | "media" | "baja";
  title: string;
  evidence: string;
  action: string;
  owner: string;
  policyRef?: string;
};

export type ReportKpi = {
  label: string;
  value: string;
  hint?: string;
  status?: TrafficLight;
};

/** Generic table shape shared by the screen, the print view and CSV export. */
export type ReportTable = {
  title: string;
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: Record<string, string | number | null>[];
};

export type ReportSummary = {
  id: ReportId;
  area: string;
  title: string;
  question: string;
  headline: string;
  status: TrafficLight;
  kpis: ReportKpi[];
  decisions: ReportDecision[];
  /** What the data cannot support yet. Shown so nobody over-reads the report. */
  limits: string[];
  generatedFrom: string[];
  periodLabel: string;
  csv: ReportTable;
};

/* ---------- R1 · Comercial ---------- */

export type RouteClass =
  | "ampliar"
  | "mantener"
  | "accion_comercial"
  | "ajustar_oferta"
  | "maduracion";

export type RoutePerformanceRow = {
  key: string;
  route: string;
  city: string;
  operator: string;
  aircraftType: string;
  segment: "nacional" | "internacional";
  passengers: number;
  seats: number;
  emptySeats: number;
  flights: number;
  paxPerFlight: number;
  loadFactor: number;
  status: TrafficLight;
  trendPp: number | null;
  weekly: number[];
  launchWeek: string | null;
  ageWeeks: number | null;
  dataVerified: boolean;
  routeClass: RouteClass;
  recommendation: string;
};

export type CommercialReport = ReportSummary & {
  id: "comercial";
  rows: RoutePerformanceRow[];
  top: RoutePerformanceRow[];
  bottom: RoutePerformanceRow[];
  maturing: RoutePerformanceRow[];
  networkLf: number;
  maturationWeeks: number;
  cutoff: string;
};

/* ---------- R2 · Capacidad ---------- */

export type CapacityScenarioRow = {
  id: "low" | "base" | "high";
  label: string;
  rate: number;
  year80: number | null;
  year90: number | null;
  year100: number | null;
  decideBy: number | null;
};

export type ExpansionOption = {
  id: string;
  label: string;
  addedCapacity: number;
  openYear: number;
  utilizationAtOpen: number;
  idleAtOpen: number;
  yearsUntil80: number | null;
  note: string;
};

export type CapacityYearPoint = {
  year: number;
  low: number;
  base: number;
  high: number;
};

export type CapacityReport = ReportSummary & {
  id: "capacidad";
  passengers12m: number;
  capacity: number;
  utilization: number;
  headroom90: number;
  scenarios: CapacityScenarioRow[];
  series: CapacityYearPoint[];
  options: ExpansionOption[];
  leadTimeYears: number;
  baseYear: number;
  warehouses: { operator: string; warehouses: string[] }[];
};

/* ---------- R3 · Cumplimiento y dato ---------- */

export type RiskItem = {
  id: string;
  kind: "requisito" | "fuente";
  label: string;
  authority: string;
  owner: string;
  critical: boolean;
  dueDate: string | null;
  daysToDue: number | null;
  state: "vencido" | "por_vencer" | "sin_evidencia" | "no_cargada" | "rechazos" | "al_dia";
  status: TrafficLight;
  score: number;
  impact: string;
  action: string;
};

export type ComplianceReport = ReportSummary & {
  id: "cumplimiento";
  asOf: string;
  items: RiskItem[];
  k2: { value: number | null; status: TrafficLight };
  k5: { value: number | null; status: TrafficLight };
  blockedOperators: string[];
};

export type AnyReport = CommercialReport | CapacityReport | ComplianceReport;
