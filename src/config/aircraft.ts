/**
 * Aircraft catalog for the airport DSS (scenario assumptions).
 * Seat counts, takeoff distances, MTOW and range are illustrative manufacturer
 * references — not certification, dispatch or route performance values.
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
  /** Maximum takeoff weight (kg), manufacturer reference — not a dispatch value */
  mtowKg: number;
  /** Nominal range (km), manufacturer reference — not a route performance study */
  rangeKm: number;
  /** ICAO aerodrome reference code letter (wingspan band) */
  codeLetter: CodeLetter;
  /** Minimum runway width the scenario accepts (m), illustrative */
  minRunwayWidthM: number;
  /** Aircraft classification number at MTOW, flexible pavement (simulated) */
  acn: number;
  /** ICAO rescue and firefighting category the aircraft needs */
  arffCategory: number;
  note: string;
};

export type CodeLetter = "A" | "B" | "C" | "D" | "E" | "F";

export const CODE_LETTER_ORDER: readonly CodeLetter[] = ["A", "B", "C", "D", "E", "F"];

export const RUNWAY_LENGTH_M = 2_297;

export const AIRCRAFT_CATALOG: readonly AircraftDefinition[] = [
  {
    id: "E145",
    label: "Embraer ERJ-145",
    group: "mtr_ops",
    mode: "passenger",
    seats: 50,
    approxTakeoffDistanceM: 1_800,
    mtowKg: 22_000,
    rangeKm: 2_870,
    codeLetter: "B",
    minRunwayWidthM: 30,
    acn: 14,
    arffCategory: 5,
    note: "Operación internacional actual (Satena).",
  },
  {
    id: "B738",
    label: "Boeing 737 (supuesto)",
    group: "mtr_ops",
    mode: "passenger",
    seats: 160,
    approxTakeoffDistanceM: 2_100,
    mtowKg: 79_010,
    rangeKm: 5_400,
    codeLetter: "C",
    minRunwayWidthM: 30,
    acn: 48,
    arffCategory: 7,
    note: "Escenario Copa — configuración 160 sillas no es un hecho confirmado de aerolínea.",
  },
  {
    id: "A359",
    label: "Airbus A350-900",
    group: "expansion",
    mode: "passenger",
    seats: 325,
    approxTakeoffDistanceM: 2_500,
    mtowKg: 283_000,
    rangeKm: 15_000,
    codeLetter: "E",
    minRunwayWidthM: 45,
    acn: 72,
    arffCategory: 9,
    note: "Expansión / otras rutas. Comparación con pista ilustrativa.",
  },
  {
    id: "A35K",
    label: "Airbus A350-1000",
    group: "expansion",
    mode: "passenger",
    seats: 369,
    approxTakeoffDistanceM: 2_600,
    mtowKg: 322_000,
    rangeKm: 16_100,
    codeLetter: "E",
    minRunwayWidthM: 45,
    acn: 84,
    arffCategory: 9,
    note: "Expansión / otras rutas. Comparación con pista ilustrativa.",
  },
  {
    id: "A350K-ULR",
    label: "Airbus A350-1000ULR",
    group: "expansion",
    mode: "passenger",
    seats: 350,
    approxTakeoffDistanceM: 2_700,
    mtowKg: 322_000,
    rangeKm: 18_000,
    codeLetter: "E",
    minRunwayWidthM: 45,
    acn: 84,
    arffCategory: 9,
    note: "Expansión de ultra largo radio. Comparación con pista ilustrativa.",
  },
  {
    id: "A350F",
    label: "Airbus A350F",
    group: "expansion",
    mode: "cargo",
    seats: 0,
    approxTakeoffDistanceM: 2_500,
    mtowKg: 319_000,
    rangeKm: 8_700,
    codeLetter: "E",
    minRunwayWidthM: 45,
    acn: 84,
    arffCategory: 9,
    note: "Carguero — el equilibrio por pasajero no aplica.",
  },
  {
    id: "ACJ350",
    label: "Airbus ACJ350",
    group: "expansion",
    mode: "passenger",
    seats: 30,
    approxTakeoffDistanceM: 2_400,
    mtowKg: 283_000,
    rangeKm: 20_000,
    codeLetter: "E",
    minRunwayWidthM: 45,
    acn: 72,
    arffCategory: 9,
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
