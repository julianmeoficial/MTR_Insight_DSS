import type { FlightRecord, KpiResult } from "@/domain/types";
import { evaluateTrafficLight, noDataResult } from "@/domain/kpis/traffic-light";

export type K1GroupKey = {
  route: string;
  operator: string;
  aircraftType: string;
  weekStart: string;
  weekEnd: string;
};

function groupKey(record: FlightRecord): string {
  return [
    record.route,
    record.operator,
    record.aircraftType,
    record.weekStart,
    record.weekEnd,
  ].join("|");
}

/**
 * K1 = sum(boarded passengers) / sum(offered seats) by route, operator, aircraft, week.
 * Never averages per-flight percentages.
 */
export function calculateK1(flights: readonly FlightRecord[]): KpiResult[] {
  const groups = new Map<
    string,
    { key: K1GroupKey; passengers: number; seats: number }
  >();

  for (const flight of flights) {
    const key = groupKey(flight);
    const existing = groups.get(key);
    if (existing) {
      existing.passengers += flight.passengersBoarded;
      existing.seats += flight.seatsOffered;
    } else {
      groups.set(key, {
        key: {
          route: flight.route,
          operator: flight.operator,
          aircraftType: flight.aircraftType,
          weekStart: flight.weekStart,
          weekEnd: flight.weekEnd,
        },
        passengers: flight.passengersBoarded,
        seats: flight.seatsOffered,
      });
    }
  }

  const results: KpiResult[] = [];

  for (const { key, passengers, seats } of groups.values()) {
    const dimensions = {
      route: key.route,
      operator: key.operator,
      aircraftType: key.aircraftType,
    };
    const period = { start: key.weekStart, end: key.weekEnd };

    if (seats <= 0) {
      results.push(
        noDataResult("K1", period, { numerator: passengers, denominator: seats }, dimensions),
      );
      continue;
    }

    const value = passengers / seats;
    results.push({
      kpiId: "K1",
      value,
      unit: "ratio",
      status: evaluateTrafficLight("K1", value),
      period,
      dimensions,
      meta: { numerator: passengers, denominator: seats },
    });
  }

  return results.sort((a, b) => {
    const aStart = a.period.start;
    const bStart = b.period.start;
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    return (a.dimensions?.operator ?? "").localeCompare(b.dimensions?.operator ?? "");
  });
}
