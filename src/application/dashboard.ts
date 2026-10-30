import {
  calculateK1,
  calculateK2,
  calculateK3,
  calculateK4,
  calculateK5,
  evaluateAlerts,
  evaluateTrafficLight,
  flightsForScope,
  parseOpsScope,
} from "@/domain";
import type {
  AlertEvent,
  FlightRecord,
  KpiId,
  KpiResult,
  TrafficLight,
} from "@/domain/types";
import {
  loadDashboardBundle,
  type DashboardMeta,
  type SemesterH1Fixture,
} from "@/data/fixtures/load-dashboard";
import type { OpsScope } from "@/config/operators";
import { formatDateIso } from "@/lib/format";

export type KpiTileModel = {
  kpiId: KpiId;
  title: string;
  subtitle: string;
  value: number | null;
  status: TrafficLight;
  targetLabel: string;
  deltaPp: number | null;
  deltaGood: boolean | null;
  sparkline: number[];
  href: string;
  actionTitle: string;
  actionBody: string;
  thresholds: { label: string; tone: TrafficLight }[];
};

export type LoadFactorSeriesPoint = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  operator: string;
  aircraftType: string;
  value: number | null;
  status: TrafficLight;
  passengers: number;
  seats: number;
};

export type RouteLfRow = {
  route: string;
  city: string;
  passengers: number;
  seats: number;
  value: number | null;
  status: TrafficLight;
};

export type DashboardReport = {
  meta: DashboardMeta;
  lastValidatedLabel: string;
  asOfLabel: string;
  globalStatus: TrafficLight;
  opsScope: OpsScope;
  weeks: { weekStart: string; weekEnd: string; label: string }[];
  tiles: KpiTileModel[];
  series: LoadFactorSeriesPoint[];
  routeRows: RouteLfRow[];
  scopeRoutes: { id: string; city: string }[];
  semesterH1: SemesterH1Fixture | null;
  alerts: AlertEvent[];
  criticalRequirements: {
    id: string;
    authority: string;
    dueDate: string;
    critical: boolean;
    satisfied: boolean;
  }[];
  copaPermitStatus: string | null;
};

const KPI_META: Record<
  KpiId,
  {
    title: string;
    href: string;
    targetLabel: string;
    actionTitle: string;
    actionBody: string;
    thresholds: { label: string; tone: TrafficLight }[];
    upIsGood: boolean;
  }
> = {
  K1: {
    title: "Load factor",
    href: "/p2",
    targetLabel: "Meta ≥ 70 %",
    actionTitle: "Seguimiento comercial",
    actionBody:
      "Notificar al comité comercial. Tres semanas en rojo activan PG-02.",
    thresholds: [
      { label: "≥70 % · En meta", tone: "green" },
      { label: "≥65 % y <70 % · Atención", tone: "yellow" },
      { label: "<65 % · Crítico", tone: "red" },
    ],
    upIsGood: true,
  },
  K2: {
    title: "Cumplimiento regulatorio",
    href: "/p3",
    targetLabel: "100 % de críticos",
    actionTitle: "Anticipar vencimientos",
    actionBody: "Alertas a 30, 15 y 7 días y escalamiento según PG-03.",
    thresholds: [
      { label: "100 % críticos; sin hitos vencidos", tone: "green" },
      { label: "Hito no crítico vencido", tone: "yellow" },
      { label: "Crítico vencido o <90 % trimestral", tone: "red" },
    ],
    upIsGood: true,
  },
  K3: {
    title: "Utilización de la capacidad",
    href: "/p4",
    targetLabel: "Mantener < 80 %",
    actionTitle: "Planear la ampliación",
    actionBody:
      "Aplicar PG-11. El aumento de utilización no se presenta como una mejora.",
    thresholds: [
      { label: "<80 % · Capacidad disponible", tone: "green" },
      { label: "≥80 % y <90 % · Planear ampliación", tone: "yellow" },
      { label: "≥90 % · Ejecutar ampliación", tone: "red" },
    ],
    upIsGood: false,
  },
  K4: {
    title: "Captura de demanda regional",
    href: "/p5",
    targetLabel: "Meta ≥ 20 %",
    actionTitle: "Revisar la estrategia comercial",
    actionBody: "Revisar campañas y oferta con las aerolíneas según PG-02.",
    thresholds: [
      { label: "≥20 % · En meta", tone: "green" },
      { label: "≥10 % y <20 % · Atención", tone: "yellow" },
      { label: "<10 % · Crítico", tone: "red" },
    ],
    upIsGood: true,
  },
  K5: {
    title: "Integridad de la información",
    href: "/p7",
    targetLabel: "Meta ≥ 98 %",
    actionTitle: "Controlar la publicación",
    actionBody:
      "Si entra en rojo: bloquear publicación y escalar al dueño de la fuente (PG-01).",
    thresholds: [
      { label: "≥98 % y sin conflictos", tone: "green" },
      { label: "≥95 % y <98 %, sin conflictos", tone: "yellow" },
      { label: "<95 % o dato con dos valores", tone: "red" },
    ],
    upIsGood: true,
  },
};

function uniqueWeeks(flights: FlightRecord[]) {
  const map = new Map<string, { weekStart: string; weekEnd: string }>();
  for (const f of flights) {
    map.set(f.weekStart, { weekStart: f.weekStart, weekEnd: f.weekEnd });
  }
  return [...map.values()]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((w, i) => ({
      ...w,
      label: `S${String(i + 1).padStart(2, "0")}`,
    }));
}

function aggregateK1ForWeek(
  flights: FlightRecord[],
  weekStart: string,
  operator?: string,
): KpiResult | null {
  let filtered = flights.filter((f) => f.weekStart === weekStart);
  if (operator && operator !== "Todos") {
    filtered = filtered.filter((f) => f.operator === operator);
  }
  if (filtered.length === 0) return null;
  const results = calculateK1(filtered);
  let pax = 0;
  let seats = 0;
  for (const r of results) {
    pax += r.meta?.numerator ?? 0;
    seats += r.meta?.denominator ?? 0;
  }
  if (seats <= 0) {
    return {
      kpiId: "K1",
      value: null,
      unit: "ratio",
      status: "no_data",
      period: { start: weekStart, end: weekStart },
    };
  }
  const value = pax / seats;
  return {
    kpiId: "K1",
    value,
    unit: "ratio",
    status: evaluateTrafficLight("K1", value),
    period: {
      start: weekStart,
      end: filtered[0]?.weekEnd ?? weekStart,
    },
    meta: { numerator: pax, denominator: seats },
  };
}

function sparklineFromWeeks(
  flights: FlightRecord[],
  weeks: { weekStart: string }[],
): number[] {
  return weeks.map((w) => {
    const r = aggregateK1ForWeek(flights, w.weekStart);
    return r?.value ?? 0;
  });
}

function worstStatus(statuses: TrafficLight[]): TrafficLight {
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  if (statuses.includes("no_data")) return "no_data";
  return "green";
}

export type BuildDashboardOptions = {
  weekStart?: string;
  operator?: string;
  aircraftType?: string;
  route?: string;
  opsScope?: string;
};

function scopedFlights(opsScope: OpsScope): {
  bundle: ReturnType<typeof loadDashboardBundle>;
  flights: FlightRecord[];
} {
  const bundle = loadDashboardBundle();
  const flights = flightsForScope(bundle.flights, bundle.routes.routes, opsScope);
  return { bundle, flights };
}

/** Aggregated K1 for the current P2 filter (sum/sum, not mean of %). */
export function getFilteredK1Hero(options: BuildDashboardOptions = {}): {
  value: number | null;
  status: TrafficLight;
  passengers: number;
  seats: number;
} {
  const opsScope = parseOpsScope(options.opsScope);
  const { flights: scoped } = scopedFlights(opsScope);
  let flights = scoped;
  if (options.route && options.route !== "Todas") {
    flights = flights.filter((f) => f.route === options.route);
  }
  if (options.operator && options.operator !== "Todos") {
    flights = flights.filter((f) => f.operator === options.operator);
  }
  if (options.aircraftType && options.aircraftType !== "Todos") {
    flights = flights.filter((f) => f.aircraftType === options.aircraftType);
  }
  if (options.weekStart) {
    flights = flights.filter((f) => f.weekStart === options.weekStart);
  }
  if (flights.length === 0) {
    return { value: null, status: "no_data", passengers: 0, seats: 0 };
  }
  const results = calculateK1(flights);
  let pax = 0;
  let seats = 0;
  for (const r of results) {
    pax += r.meta?.numerator ?? 0;
    seats += r.meta?.denominator ?? 0;
  }
  if (seats <= 0) {
    return { value: null, status: "no_data", passengers: pax, seats };
  }
  const value = pax / seats;
  return {
    value,
    status: evaluateTrafficLight("K1", value),
    passengers: pax,
    seats,
  };
}

function aggregateRoutesForWeek(
  flights: FlightRecord[],
  weekStart: string,
  cityByRoute: Map<string, string>,
): RouteLfRow[] {
  const weekFlights = flights.filter((f) => f.weekStart === weekStart);
  const byRoute = new Map<string, { pax: number; seats: number }>();
  for (const f of weekFlights) {
    const cur = byRoute.get(f.route) ?? { pax: 0, seats: 0 };
    cur.pax += f.passengersBoarded;
    cur.seats += f.seatsOffered;
    byRoute.set(f.route, cur);
  }
  return [...byRoute.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([route, { pax, seats }]) => {
      if (seats <= 0) {
        return {
          route,
          city: cityByRoute.get(route) ?? route,
          passengers: pax,
          seats,
          value: null,
          status: "no_data" as const,
        };
      }
      const value = pax / seats;
      return {
        route,
        city: cityByRoute.get(route) ?? route,
        passengers: pax,
        seats,
        value,
        status: evaluateTrafficLight("K1", value),
      };
    });
}

export function buildDashboardReport(
  options: BuildDashboardOptions = {},
): DashboardReport {
  const opsScope = parseOpsScope(options.opsScope);
  const { bundle, flights: scoped } = scopedFlights(opsScope);
  const weeks = uniqueWeeks(scoped);
  const selectedWeek =
    options.weekStart && weeks.some((w) => w.weekStart === options.weekStart)
      ? options.weekStart
      : weeks[weeks.length - 1]?.weekStart;

  const prevWeek =
    weeks[Math.max(0, weeks.findIndex((w) => w.weekStart === selectedWeek) - 1)]
      ?.weekStart;

  const k1Now = selectedWeek
    ? aggregateK1ForWeek(scoped, selectedWeek)
    : null;
  const k1Prev =
    prevWeek && prevWeek !== selectedWeek
      ? aggregateK1ForWeek(scoped, prevWeek)
      : null;

  const k2 = calculateK2(
    bundle.requirements,
    bundle.requirementsAsOf,
    bundle.requirementsPeriod,
  );
  const k3 = calculateK3(bundle.capacity);
  const k4 = calculateK4(bundle.demand);
  const k5 = calculateK5(bundle.quality);

  const k1ResultsScoped = calculateK1(scoped);
  const alerts = evaluateAlerts({
    k1Results: k1ResultsScoped,
    qualityRecords: bundle.quality,
  }).filter((a) => {
    if (a.trigger !== "K1_RED_STREAK") return true;
    // Entity is "route|operator|aircraft"
    const route = a.entity.split("|")[0] ?? "";
    return scoped.some((f) => f.route === route);
  });

  function tileFrom(
    kpiId: KpiId,
    result: KpiResult,
    subtitle: string,
    deltaPp: number | null,
    spark: number[],
  ): KpiTileModel {
    const meta = KPI_META[kpiId];
    let deltaGood: boolean | null = null;
    if (deltaPp !== null) {
      deltaGood = meta.upIsGood ? deltaPp >= 0 : deltaPp <= 0;
    }
    return {
      kpiId,
      title: meta.title,
      subtitle,
      value: result.value,
      status: result.status,
      targetLabel: meta.targetLabel,
      deltaPp,
      deltaGood,
      sparkline: spark,
      href: meta.href,
      actionTitle: meta.actionTitle,
      actionBody: meta.actionBody,
      thresholds: meta.thresholds,
    };
  }

  const k1Delta =
    k1Now?.value !== null &&
    k1Now?.value !== undefined &&
    k1Prev?.value !== null &&
    k1Prev?.value !== undefined
      ? k1Now.value - k1Prev.value
      : null;

  const scopeLabel =
    opsScope === "nacional" ? "Red nacional" : "MTR-PTY";
  const weekLabelText =
    weeks.find((w) => w.weekStart === selectedWeek)?.label ?? "-";

  const tiles: KpiTileModel[] = [
    tileFrom(
      "K1",
      k1Now ?? {
        kpiId: "K1",
        value: null,
        unit: "ratio",
        status: "no_data",
        period: { start: "", end: "" },
      },
      `${scopeLabel} · semana ${weekLabelText}`,
      k1Delta,
      sparklineFromWeeks(scoped, weeks),
    ),
    tileFrom(
      "K2",
      k2,
      "Requisitos críticos · corte demo",
      null,
      [],
    ),
    tileFrom("K3", k3, "Terminal · rolling 12 meses", null, []),
    tileFrom(
      "K4",
      k4,
      opsScope === "nacional"
        ? "Captura internacional del aeropuerto"
        : "Zona de influencia · corte demo",
      null,
      [],
    ),
    tileFrom("K5", k5, "Fuentes críticas · carga diaria", null, []),
  ];

  let seriesFlights = scoped;
  if (options.operator && options.operator !== "Todos") {
    seriesFlights = seriesFlights.filter((f) => f.operator === options.operator);
  }
  if (options.aircraftType && options.aircraftType !== "Todos") {
    seriesFlights = seriesFlights.filter(
      (f) => f.aircraftType === options.aircraftType,
    );
  }
  if (options.route && options.route !== "Todas") {
    seriesFlights = seriesFlights.filter((f) => f.route === options.route);
  }

  const seriesResults = calculateK1(seriesFlights);
  const weekLabel = new Map(weeks.map((w) => [w.weekStart, w.label]));
  const series: LoadFactorSeriesPoint[] = seriesResults.map((r) => ({
    weekStart: r.period.start,
    weekEnd: r.period.end,
    weekLabel: weekLabel.get(r.period.start) ?? r.period.start,
    operator: r.dimensions?.operator ?? "-",
    aircraftType: r.dimensions?.aircraftType ?? "-",
    value: r.value,
    status: r.status,
    passengers: r.meta?.numerator ?? 0,
    seats: r.meta?.denominator ?? 0,
  }));

  const cityByRoute = new Map(
    bundle.routes.routes.map((r) => [r.id, r.city] as const),
  );
  const routeRows = selectedWeek
    ? aggregateRoutesForWeek(scoped, selectedWeek, cityByRoute)
    : [];
  const wantIntl = opsScope === "internacional";
  const scopeRoutes = bundle.routes.routes
    .filter((r) => r.international === wantIntl)
    .map((r) => ({ id: r.id, city: r.city }));

  const criticalRequirements = bundle.requirements.map((req) => {
    const satisfied = Boolean(
      req.applicable && req.evidenceId && req.approvalDate,
    );
    return {
      id: req.requirementId,
      authority: req.authority,
      dueDate: req.dueDate,
      critical: req.critical,
      satisfied,
    };
  });

  return {
    meta: bundle.meta,
    lastValidatedLabel: formatDateIso(bundle.meta.lastValidated),
    asOfLabel: formatDateIso(bundle.meta.asOfDate),
    globalStatus: worstStatus(tiles.map((t) => t.status)),
    opsScope,
    weeks,
    tiles,
    series,
    routeRows,
    scopeRoutes,
    semesterH1: opsScope === "nacional" ? bundle.semesterH1 : null,
    alerts,
    criticalRequirements,
    copaPermitStatus:
      opsScope === "internacional"
        ? "Permiso Copa reportado por prensa · evidencia EV-COPA-PRESS"
        : null,
  };
}
