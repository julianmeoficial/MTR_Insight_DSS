/**
 * Aircraft catalog for the airport DSS (scenario assumptions).
 * Seat counts and takeoff distances are illustrative — not certification.
 */

export type AircraftGroup = "mtr_ops" | "expansion";

export type AircraftMode = "passenger" | "cargo";

export type AircraftId =
  | "E145"
  | "B738"
  | "A359"
  | "A35K"
  | "A350K-ULR"
  | "A350F"
  | "ACJ350";

export type AircraftDefinition = {
  id: AircraftId;
  label: string;
  group: AircraftGroup;
  mode: AircraftMode;
  /** Configured seats offered per flight; 0 for freighter */
  seats: number;
  /** Approximate takeoff distance (m) — illustrative only */
  approxTakeoffDistanceM: number | null;
  note: string;
};

export const RUNWAY_LENGTH_M = 2_297;

export const AIRCRAFT_CATALOG: readonly AircraftDefinition[] = [
  {
    id: "E145",
    label: "Embraer ERJ-145",
    group: "mtr_ops",
    mode: "passenger",
    seats: 50,
    approxTakeoffDistanceM: 1_800,
    note: "Operación internacional actual (Satena).",
  },
  {
    id: "B738",
    label: "Boeing 737 (supuesto)",
    group: "mtr_ops",
    mode: "passenger",
    seats: 160,
    approxTakeoffDistanceM: 2_100,
    note: "Escenario Copa — configuración 160 sillas no es un hecho confirmado de aerolínea.",
  },
  {
    id: "A359",
    label: "Airbus A350-900",
    group: "expansion",
    mode: "passenger",
    seats: 325,
    approxTakeoffDistanceM: 2_500,
    note: "Expansión / otras rutas. Comparación con pista ilustrativa.",
  },
  {
    id: "A35K",
    label: "Airbus A350-1000",
    group: "expansion",
    mode: "passenger",
    seats: 369,
    approxTakeoffDistanceM: 2_600,
    note: "Expansión / otras rutas. Comparación con pista ilustrativa.",
  },
  {
    id: "A350K-ULR",
    label: "Airbus A350-1000ULR",
    group: "expansion",
    mode: "passenger",
    seats: 350,
    approxTakeoffDistanceM: 2_700,
    note: "Expansión de ultra largo radio. Comparación con pista ilustrativa.",
  },
  {
    id: "A350F",
    label: "Airbus A350F",
    group: "expansion",
    mode: "cargo",
    seats: 0,
    approxTakeoffDistanceM: 2_500,
    note: "Carguero — el equilibrio por pasajero no aplica.",
  },
  {
    id: "ACJ350",
    label: "Airbus ACJ350",
    group: "expansion",
    mode: "passenger",
    seats: 30,
    approxTakeoffDistanceM: 2_400,
    note: "Corporativo / VIP — escenario de expansión.",
  },
] as const;

export function getAircraft(id: AircraftId): AircraftDefinition {
  const found = AIRCRAFT_CATALOG.find((a) => a.id === id);
  if (!found) {
    throw new Error(`Unknown aircraft id: ${id}`);
  }
  return found;
}

export function aircraftByGroup(group: AircraftGroup): AircraftDefinition[] {
  return AIRCRAFT_CATALOG.filter((a) => a.group === group);
}
