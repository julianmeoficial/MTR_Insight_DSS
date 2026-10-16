import { readFileSync } from "node:fs";
import path from "node:path";
import {
  calculateK1,
  evaluateAlerts,
  type AlertEvent,
  type FlightRecord,
  type QualityRecord,
} from "@/domain";

type FlightsFile = {
  vuelos: FlightRecord[];
};

type QualityFile = {
  registros: QualityRecord[];
};

const FIXTURES_DIR = path.join(process.cwd(), "data", "fixtures", "demo");

function readJson<T>(fileName: string): T {
  const fullPath = path.join(FIXTURES_DIR, fileName);
  return JSON.parse(readFileSync(fullPath, "utf8")) as T;
}

/** Loads local demo JSON and runs the domain alert engine (no database). */
export function loadActiveDemoAlerts(): AlertEvent[] {
  const flights = readJson<FlightsFile>("flights.json").vuelos;
  const quality = readJson<QualityFile>("quality.json").registros;
  const k1Results = calculateK1(flights);
  return evaluateAlerts({ k1Results, qualityRecords: quality });
}
