import { getAircraft } from "@/config/aircraft";
import type {
  BreakEvenComparison,
  BreakEvenInput,
  BreakEvenResult,
} from "@/domain/dss/types";

function ceilPassengers(ratio: number, seats: number): number {
  return Math.ceil(ratio * seats);
}

function compareLoadFactors(
  current: number | null | undefined,
  breakEven: number,
): BreakEvenComparison {
  if (current === null || current === undefined || Number.isNaN(current)) {
    return "unavailable";
  }
  const epsilon = 1e-9;
  if (Math.abs(current - breakEven) < epsilon) return "at_break_even";
  if (current > breakEven) return "above_break_even";
  return "below_break_even";
}

/**
 * Airport break-even load factor (Paso 8):
 * LF_eq = costPerFlight / (revenuePerPax × seats)
 * Does NOT use airline ticket fares.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const aircraft = getAircraft(input.aircraftId);
  const frequencies = Math.max(0, Math.floor(input.weeklyFrequencies));
  const weeklySeatsOffered = aircraft.seats * frequencies;

  if (aircraft.mode === "cargo" || aircraft.seats <= 0) {
    return {
      aircraftId: input.aircraftId,
      seats: aircraft.seats,
      lfEquilibrium: null,
      minPassengers: null,
      status: "cargo_n_a",
      comparison: "unavailable",
      currentLoadFactor: input.currentLoadFactor ?? null,
      weeklySeatsOffered,
      weeklyBreakEvenPax: null,
      thresholdPax: { alert65: null, target70: null, target80: null },
      message:
        "A350F (carguero): el punto de equilibrio por pasajero no aplica. Use un escenario de capacidad de carga en revisión especializada.",
    };
  }

  if (input.revenuePerPax <= 0 || input.costPerFlight < 0) {
    return {
      aircraftId: input.aircraftId,
      seats: aircraft.seats,
      lfEquilibrium: null,
      minPassengers: null,
      status: "no_data",
      comparison: "unavailable",
      currentLoadFactor: input.currentLoadFactor ?? null,
      weeklySeatsOffered,
      weeklyBreakEvenPax: null,
      thresholdPax: {
        alert65: ceilPassengers(0.65, aircraft.seats),
        target70: ceilPassengers(0.7, aircraft.seats),
        target80: ceilPassengers(0.8, aircraft.seats),
      },
      message:
        "Denominador inválido: el ingreso medio por pasajero debe ser mayor que cero.",
    };
  }

  const lfEquilibrium =
    input.costPerFlight / (input.revenuePerPax * aircraft.seats);
  const minPassengers = ceilPassengers(lfEquilibrium, aircraft.seats);
  const status = lfEquilibrium > 1 ? "infeasible" : "feasible";
  const comparison = compareLoadFactors(
    input.currentLoadFactor,
    lfEquilibrium,
  );

  return {
    aircraftId: input.aircraftId,
    seats: aircraft.seats,
    lfEquilibrium,
    minPassengers,
    status,
    comparison,
    currentLoadFactor: input.currentLoadFactor ?? null,
    weeklySeatsOffered,
    weeklyBreakEvenPax:
      frequencies > 0 ? minPassengers * frequencies : null,
    thresholdPax: {
      alert65: ceilPassengers(0.65, aircraft.seats),
      target70: ceilPassengers(0.7, aircraft.seats),
      target80: ceilPassengers(0.8, aircraft.seats),
    },
    message:
      status === "infeasible"
        ? "Punto de equilibrio > 100 %: escenario inviable con estos costos e ingresos (no se capea)."
        : "Punto de equilibrio calculado con el modelo aeroportuario del Paso 8.",
  };
}
