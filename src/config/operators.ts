/**
 * Operator series colors and scope helpers for charts / filters.
 * Series tokens follow DESIGN.md §10.
 */

export const OPERATOR_SERIES: Record<string, string> = {
  Avianca: "var(--series-1)",
  Copa: "var(--series-1)",
  Satena: "var(--series-2)",
  LATAM: "var(--series-3)",
  JetSMART: "var(--series-4)",
  Clic: "var(--series-5)",
};

/** Domestic operating airlines (official /aerolineas, excluding announced Copa). */
export const NATIONAL_OPERATORS = [
  "Avianca",
  "Satena",
  "LATAM",
  "JetSMART",
  "Clic",
] as const;

export const INTERNATIONAL_OPERATORS = ["Satena", "Copa"] as const;

export type OpsScope = "nacional" | "internacional";

export function operatorColor(operator: string): string {
  return OPERATOR_SERIES[operator] ?? "var(--series-6)";
}

export function operatorsForScope(scope: OpsScope): readonly string[] {
  return scope === "nacional" ? NATIONAL_OPERATORS : INTERNATIONAL_OPERATORS;
}
