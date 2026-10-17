import { describe, expect, it } from "vitest";
import {
  minPassengersForRatio,
  projectPassengers,
  capacityTriggerYear,
  FORECAST_RATES,
  REFERENCE_AIRCRAFT,
} from "@/domain/dss";

describe("minPassengersForRatio", () => {
  it("uses ceil for whole passengers", () => {
    expect(minPassengersForRatio(50, 0.7)).toBe(35);
    expect(minPassengersForRatio(50, 0.65)).toBe(33);
    expect(minPassengersForRatio(160, 0.7)).toBe(112);
  });

  it("rejects invalid seats", () => {
    expect(() => minPassengersForRatio(0, 0.7)).toThrow();
  });
});

describe("projectPassengers", () => {
  it("applies compound growth from base year", () => {
    const p = projectPassengers(1_000_000, 2024, 2025, FORECAST_RATES.base);
    expect(p).toBeCloseTo(1_000_000 * 1.039, 5);
  });

  it("reports capacity trigger year when already met", () => {
    const y = capacityTriggerYear(1_400_000, 2024, 0.039, 1_700_000, 0.8);
    expect(y).toBe(2024);
  });
});

describe("REFERENCE_AIRCRAFT", () => {
  it("marks B737 as scenario assumption", () => {
    const b737 = REFERENCE_AIRCRAFT.find((a) => a.id === "B738");
    expect(b737?.seats).toBe(160);
    expect(b737?.assumption).toBe("supuesto");
  });
});
