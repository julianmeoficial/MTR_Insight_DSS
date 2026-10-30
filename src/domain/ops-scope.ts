import type { FlightRecord } from "@/domain/types";
import type { OpsScope } from "@/config/operators";

export type RouteCatalogEntry = {
  id: string;
  international: boolean;
  operators: readonly string[];
  stage: string;
};

/**
 * Filter HECHO_VUELO rows by national vs international catalog scope.
 * Never mixes PTY into nacional or domestic routes into internacional.
 */
export function flightsForScope(
  flights: readonly FlightRecord[],
  routes: readonly RouteCatalogEntry[],
  scope: OpsScope,
): FlightRecord[] {
  const wantIntl = scope === "internacional";
  const allowed = new Set(
    routes.filter((r) => r.international === wantIntl).map((r) => r.id),
  );
  return flights.filter((f) => allowed.has(f.route));
}

export function parseOpsScope(value: string | undefined | null): OpsScope {
  return value === "internacional" ? "internacional" : "nacional";
}

export function routeIdsForScope(
  routes: readonly RouteCatalogEntry[],
  scope: OpsScope,
): string[] {
  const wantIntl = scope === "internacional";
  return routes.filter((r) => r.international === wantIntl).map((r) => r.id);
}
