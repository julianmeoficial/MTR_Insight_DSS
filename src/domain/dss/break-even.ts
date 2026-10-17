/**
 * Airport / route occupancy helpers for DSS screens.
 * Minimum whole passengers use ceil(ratio × seats).
 */

export type AircraftRef = {
  id: string;
  label: string;
  seats: number;
  assumption?: "supuesto" | "referencia";
};

export const REFERENCE_AIRCRAFT: readonly AircraftRef[] = [
  { id: "E145", label: "ERJ-145", seats: 50 },
  { id: "B738", label: "B737", seats: 160, assumption: "supuesto" },
  { id: "J32", label: "Jetstream 32", seats: 19, assumption: "referencia" },
] as const;

export const LOAD_THRESHOLDS = [0.65, 0.7, 0.8] as const;

/** ceil(ratio × seats); rejects non-positive seats. */
export function minPassengersForRatio(seats: number, ratio: number): number {
  if (!Number.isFinite(seats) || seats <= 0) {
    throw new Error("seats must be a positive finite number");
  }
  if (!Number.isFinite(ratio) || ratio < 0) {
    throw new Error("ratio must be a non-negative finite number");
  }
  return Math.ceil(ratio * seats);
}

export function breakEvenTable(aircraft: AircraftRef) {
  return LOAD_THRESHOLDS.map((ratio) => ({
    ratio,
    passengers: minPassengersForRatio(aircraft.seats, ratio),
  }));
}
