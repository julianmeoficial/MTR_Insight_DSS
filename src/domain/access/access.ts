import {
  ACCESS_MATRIX,
  MATRIX_SCREENS,
  ROLE_IDS,
  type MatrixScreen,
  type OperatorScope,
  type RoleId,
} from "@/config/access-matrix";
import {
  INTERNATIONAL_OPERATORS,
  NATIONAL_OPERATORS,
  type OpsScope,
} from "@/config/operators";

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

/** "Todos" plus any airline id present in fixtures. */
export type OperatorFilter = string;

const DEFAULT_FILTERS: readonly string[] = [
  "Todos",
  ...NATIONAL_OPERATORS,
  "Copa",
];

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
 * prototype grant. `/reportes` opens when the role has at least one report.
 */
export function allowedNavHrefs(role: RoleId): readonly string[] {
  const screens = grantedScreens(role);
  const hrefs = screens.map((screen) => SCREEN_PATH[screen]);
  if (screens.includes("P1")) hrefs.push("/alertas");
  if (screens.includes("P6")) hrefs.push("/escenarios");
  if (screens.includes("P1") || screens.includes("P5")) hrefs.push("/situacion");
  if (screens.includes("P5") || screens.includes("P6")) hrefs.push("/validador");
  if (allowedReports(role).length > 0) hrefs.push("/reportes");
  if (ACCESS_MATRIX[role]?.admin) hrefs.push("/admin");
  return hrefs;
}

/** Management reports and the screens that grant each one. */
export const REPORT_GRANTS = {
  comercial: ["P2"],
  capacidad: ["P4", "P6"],
  cumplimiento: ["P3", "P7"],
} as const satisfies Record<string, readonly MatrixScreen[]>;

export type ReportGrantId = keyof typeof REPORT_GRANTS;

const EXECUTIVE_ROLES: readonly RoleId[] = [
  "junta",
  "gerencia_general",
  "gerencia_mtr",
];

/**
 * Reports a role may open. Executives see all three; area roles see the
 * report of the screens they already have. Airline accounts get none: the
 * reports compare operators against each other.
 */
export function allowedReports(role: RoleId): readonly ReportGrantId[] {
  const access = ACCESS_MATRIX[role];
  if (!access || access.operatorScope) return [];
  const ids = Object.keys(REPORT_GRANTS) as ReportGrantId[];
  if (EXECUTIVE_ROLES.includes(role)) return ids;
  return ids.filter((id) =>
    REPORT_GRANTS[id].some((screen) => access.screens.includes(screen)),
  );
}

export function canAccessRoute(role: RoleId, pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === "/decisiones") return false;
  if (path.startsWith("/reportes/")) {
    const id = path.slice("/reportes/".length);
    return (allowedReports(role) as readonly string[]).includes(id);
  }
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

export function visibleOperators(
  role: RoleId,
  opsScope: OpsScope = "nacional",
): readonly OperatorFilter[] {
  const scope = operatorScope(role);
  if (scope) return [scope];
  const ops =
    opsScope === "nacional" ? NATIONAL_OPERATORS : INTERNATIONAL_OPERATORS;
  return ["Todos", ...ops];
}

/** Query value used on P2. Airline accounts cannot widen the operator filter. */
export function resolveOperatorFilter(
  role: RoleId,
  requested: string | undefined,
  opsScope: OpsScope = "nacional",
): OperatorFilter {
  const scope = operatorScope(role);
  if (scope) return scope;
  const allowed = visibleOperators(role, opsScope);
  if (requested && allowed.includes(requested)) return requested;
  return "Todos";
}

export function defaultOperatorFilters(): readonly string[] {
  return DEFAULT_FILTERS;
}
