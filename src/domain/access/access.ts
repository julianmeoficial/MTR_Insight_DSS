import {
  ACCESS_MATRIX,
  MATRIX_SCREENS,
  ROLE_IDS,
  type MatrixScreen,
  type OperatorScope,
  type RoleId,
} from "@/config/access-matrix";

export const SCREEN_PATH: Record<MatrixScreen, string> = {
  P1: "/p1",
  P2: "/p2",
  P3: "/p3",
  P4: "/p4",
  P5: "/p5",
  P6: "/p6",
  P7: "/p7",
};

const HOME_ORDER: readonly MatrixScreen[] = MATRIX_SCREENS;

const OPERATOR_FILTERS = ["Todos", "Satena", "Copa"] as const;
export type OperatorFilter = (typeof OPERATOR_FILTERS)[number];

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

/** Accept a staging cookie value. Unknown or empty values are no session. */
export function parseRoleId(raw: string | null | undefined): RoleId | null {
  if (!raw) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  return isRoleId(value) ? value : null;
}

export function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const withoutHash = withoutQuery.split("#")[0] ?? withoutQuery;
  if (withoutHash.length > 1 && withoutHash.endsWith("/")) {
    return withoutHash.slice(0, -1);
  }
  return withoutHash;
}

export function grantedScreens(role: RoleId): readonly MatrixScreen[] {
  return ACCESS_MATRIX[role]?.screens ?? [];
}

/**
 * Nav targets for a demo role.
 * `/alertas` follows P1. `/escenarios` follows P6.
 * `/situacion` (Paso 13) follows P1 or P5. `/validador` (Paso 14) follows
 * P5 or P6. `/admin` needs the admin grant. `/decisiones` stays out of the
 * prototype grant.
 */
export function allowedNavHrefs(role: RoleId): readonly string[] {
  const screens = grantedScreens(role);
  const hrefs = screens.map((screen) => SCREEN_PATH[screen]);
  if (screens.includes("P1")) hrefs.push("/alertas");
  if (screens.includes("P6")) hrefs.push("/escenarios");
  if (screens.includes("P1") || screens.includes("P5")) hrefs.push("/situacion");
  if (screens.includes("P5") || screens.includes("P6")) hrefs.push("/validador");
  if (ACCESS_MATRIX[role]?.admin) hrefs.push("/admin");
  return hrefs;
}

export function canAccessRoute(role: RoleId, pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === "/decisiones") return false;
  return allowedNavHrefs(role).includes(path);
}

export function homeForRole(role: RoleId): string {
  const screens = grantedScreens(role);
  const first = HOME_ORDER.find((screen) => screens.includes(screen));
  return first ? SCREEN_PATH[first] : "/login";
}

export function operatorScope(role: RoleId): OperatorScope {
  return ACCESS_MATRIX[role].operatorScope;
}

export function canExport(role: RoleId): boolean {
  return ACCESS_MATRIX[role].canExport;
}

export function visibleOperators(role: RoleId): readonly OperatorFilter[] {
  const scope = operatorScope(role);
  if (scope) return [scope];
  return OPERATOR_FILTERS;
}

/** Query value used on P2. Airline accounts cannot widen the operator filter. */
export function resolveOperatorFilter(
  role: RoleId,
  requested: string | undefined,
): OperatorFilter {
  const scope = operatorScope(role);
  if (scope) return scope;
  if (requested === "Satena" || requested === "Copa") return requested;
  return "Todos";
}
