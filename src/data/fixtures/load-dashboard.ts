import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  CapacitySnapshot,
  DemandSnapshot,
  FlightRecord,
  QualityRecord,
  RequirementRecord,
} from "@/domain/types";
import type {
  AirportConstraints,
  AirportRef,
  ErpmDataItem,
  EvidenceStage,
  Modernization,
  RouteOpportunity,
  RunwayRef,
  SourceRef,
  TerminalRef,
} from "@/domain/erpm";
import { AIRCRAFT_CATALOG } from "@/config/aircraft";

const DIR = path.join(process.cwd(), "data", "fixtures", "dashboard");

function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(path.join(DIR, fileName), "utf8")) as T;
}

export type DashboardMeta = {
  dataset: string;
  version: string;
  fuente: string;
  asOfDate: string;
  lastValidated: string;
  verificationStatus: string;
};

export type InfrastructureFixture = {
  asOfDate: string;
  runway: {
    designator: string;
    lengthM: number;
    source: string;
    verificationStatus: string;
    verifiedOn: string;
  };
  runwayConflict: {
    lengthM: number;
    source: string;
    verificationStatus: string;
    note: string;
  };
  terminal: {
    declaredAnnualCapacity: number;
    source: string;
    verificationStatus: string;
    verifiedOn: string | null;
  };
};

export type CompetitorsFixture = {
  catchment: string;
  period: { start: string; end: string };
  competitors: { airport: string; label: string; sharePct: number }[];
  evidenceChecklist: { id: string; label: string; done: boolean }[];
};

export type EtlLogFixture = {
  loads: {
    id: string;
    sourceId: string;
    startedAt: string;
    finishedAt: string;
    accepted: number;
    rejected: number;
    reason: string | null;
    ruleVersion: string;
  }[];
};

export type DashboardBundle = {
  meta: DashboardMeta;
  flights: FlightRecord[];
  requirements: RequirementRecord[];
  requirementsAsOf: string;
  requirementsPeriod: { start: string; end: string };
  capacity: CapacitySnapshot;
  demand: DemandSnapshot;
  quality: QualityRecord[];
  infrastructure: InfrastructureFixture;
  competitors: CompetitorsFixture;
  etlLog: EtlLogFixture;
};

export function loadDashboardBundle(): DashboardBundle {
  const meta = readJson<DashboardMeta>("meta.json");
  const flightsFile = readJson<{ vuelos: FlightRecord[] }>("flights.json");
  const reqFile = readJson<{
    asOfDate: string;
    period: { start: string; end: string };
    requisitos: RequirementRecord[];
  }>("requirements.json");
  const capacity = readJson<CapacitySnapshot>("capacity.json");
  const demand = readJson<DemandSnapshot>("demand.json");
  const qualityFile = readJson<{ registros: QualityRecord[] }>("quality.json");
  const infrastructure = readJson<InfrastructureFixture>("infrastructure.json");
  const competitors = readJson<CompetitorsFixture>("competitors.json");
  const etlLog = readJson<EtlLogFixture>("etl-log.json");

  return {
    meta,
    flights: flightsFile.vuelos,
    requirements: reqFile.requisitos,
    requirementsAsOf: reqFile.asOfDate,
    requirementsPeriod: reqFile.period,
    capacity,
    demand,
    quality: qualityFile.registros,
    infrastructure,
    competitors,
    etlLog,
  };
}

export type SituationBundle = {
  dataset: string;
  version: string;
  cutoffDate: string;
  origin: AirportRef;
  airports: AirportRef[];
  routes: RouteOpportunity[];
  modernizations: Modernization[];
  erpmData: ErpmDataItem[];
  infrastructure: {
    elevationM: number | null;
    arffCategory: AirportConstraints["arffCategory"];
    arffEvidence: SourceRef;
    runways: RunwayRef[];
    terminals: TerminalRef[];
  };
  constraints: AirportConstraints;
};

const STAGES: readonly EvidenceStage[] = [
  "operating",
  "confirmed",
  "announced",
  "negotiating",
  "proposed",
  "to_verify",
];

/** Paso 13 baseline + airport constraints for the Paso 14 validator. */
export function loadSituation(): SituationBundle {
  const file = readJson<Omit<SituationBundle, "constraints">>("situation.json");
  const known = new Set(AIRCRAFT_CATALOG.map((a) => a.id));
  const iatas = new Set(file.airports.map((a) => a.iata));
  for (const route of file.routes) {
    if (!STAGES.includes(route.stage)) {
      throw new Error(`situation.json: unknown stage on ${route.id}`);
    }
    if (route.aircraftId !== null && !known.has(route.aircraftId)) {
      throw new Error(`situation.json: unknown aircraft on ${route.id}`);
    }
    if (!iatas.has(route.destination)) {
      throw new Error(`situation.json: unknown airport on ${route.id}`);
    }
  }
  const bundle = loadDashboardBundle();
  const rwy1 = file.infrastructure.runways.find((r) => r.id === "RWY1");
  if (!rwy1 || rwy1.lengthM !== bundle.infrastructure.runway.lengthM) {
    throw new Error("situation.json: RWY1 must match the verified runway length");
  }
  return {
    ...file,
    constraints: {
      runways: file.infrastructure.runways,
      terminals: file.infrastructure.terminals,
      arffCategory: file.infrastructure.arffCategory,
      elevationM: file.infrastructure.elevationM,
      rolling12MonthPassengers: bundle.capacity.rolling12MonthPassengers,
    },
  };
}
