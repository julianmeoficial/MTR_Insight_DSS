import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  CapacitySnapshot,
  DemandSnapshot,
  FlightRecord,
  QualityRecord,
  RequirementRecord,
} from "@/domain/types";

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
