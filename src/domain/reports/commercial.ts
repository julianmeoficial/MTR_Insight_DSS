/**
 * R1 · Ranking comercial de rutas y operadores.
 *
 * The airport's version of a "best and worst sellers" report: which
 * route/operator pairs fill their seats and which do not, and what to do
 * about each. New routes are kept out of the cut list on purpose: a route
 * that opened a few weeks ago has no history yet, the same way a warehouse
 * should not clear stock that just arrived.
 */

import { getAircraft, type AircraftId } from "@/config/aircraft";
import { evaluateTrafficLight } from "@/domain/kpis";
import type { FlightRecord, QualityRecord, TrafficLight } from "@/domain/types";
import { formatDateIso, formatInt, formatPct, formatPp } from "@/lib/format";
import type {
  CommercialReport,
  ReportDecision,
  RouteClass,
  RoutePerformanceRow,
} from "@/domain/reports/types";

/** Assumption: a new route needs about six months before it is judged. */
export const MATURATION_WEEKS = 26;
/** LF at or above this suggests demand is being turned away (spill). */
export const SPILL_LF = 0.8;
/** A drop this large between the first and last weeks is a warning. */
export const TREND_WARNING_PP = -0.05;

const DAY_MS = 86_400_000;

export type CommercialInput = {
  flights: readonly FlightRecord[];
  routes: readonly { id: string; city: string; international: boolean }[];
  /** Routes the situation file marks with an opening date (new services). */
  launches: readonly { destination: string; airline: string | null }[];
  quality: readonly QualityRecord[];
  maturationWeeks?: number;
};

export const CLASS_LABEL: Record<RouteClass, string> = {
  ampliar: "Ampliar oferta",
  mantener: "Mantener",
  accion_comercial: "Acción comercial",
  ajustar_oferta: "Ajustar oferta",
  maduracion: "En maduración",
};

function weeksBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00Z`).getTime();
  const to = new Date(`${toIso}T12:00:00Z`).getTime();
  return Math.max(1, Math.ceil((to - from + DAY_MS) / (7 * DAY_MS)));
}

function seatsPerFlight(aircraftType: string): number | null {
  try {
    const seats = getAircraft(aircraftType as AircraftId).seats;
    return seats > 0 ? seats : null;
  } catch {
    return null;
  }
}

/** Operators whose manifest feed did not load, from "Manifiestos <name>". */
export function unverifiedOperators(
  quality: readonly QualityRecord[],
): string[] {
  return quality
    .filter((q) => !q.loaded && q.sourceName.startsWith("Manifiestos "))
    .map((q) => q.sourceName.replace("Manifiestos ", "").trim());
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function classifyRoute(input: {
  loadFactor: number;
  trendPp: number | null;
  ageWeeks: number | null;
  maturationWeeks: number;
}): RouteClass {
  const { loadFactor, trendPp, ageWeeks, maturationWeeks } = input;
  if (ageWeeks !== null && ageWeeks < maturationWeeks) return "maduracion";
  const status = evaluateTrafficLight("K1", loadFactor);
  if (status === "red") return "ajustar_oferta";
  if (status === "yellow") return "accion_comercial";
  if (trendPp !== null && trendPp <= TREND_WARNING_PP) return "accion_comercial";
  if (loadFactor >= SPILL_LF) return "ampliar";
  return "mantener";
}

function recommendationFor(row: Omit<RoutePerformanceRow, "recommendation">, maturationWeeks: number): string {
  const pax = formatInt(row.paxPerFlight);
  let text: string;
  switch (row.routeClass) {
    case "ampliar":
      text = `Ocupación de ${formatPct(row.loadFactor)} (${pax} pax por vuelo): hay demanda que no se está atendiendo. Negociar con ${row.operator} una frecuencia más o un equipo de mayor capacidad.`;
      break;
    case "mantener":
      text = "Ocupación en meta. Mantener la oferta y vigilar la tendencia semanal.";
      break;
    case "accion_comercial":
      text =
        row.trendPp !== null && row.trendPp <= TREND_WARNING_PP
          ? `La ocupación cae ${formatPp(row.trendPp)} en la ventana. Revisar con ${row.operator} precio y promoción antes de tocar la oferta.`
          : `Ocupación en zona de atención (65 a 70 %). Campaña conjunta con ${row.operator} antes de reducir sillas.`;
      break;
    case "ajustar_oferta":
      text = `Ruta madura con ocupación crítica. Evaluar con ${row.operator} un equipo de menor capacidad o menos frecuencias: cada silla vacía tiene costo.`;
      break;
    case "maduracion":
      text = `Ruta nueva: ${row.ageWeeks} semanas desde ${row.launchWeek ? formatDateIso(row.launchWeek) : "su apertura"}. No tiene historia suficiente para recortarla. Acompañar con promoción y revaluar en la semana ${maturationWeeks}.`;
      if (row.trendPp !== null && row.trendPp <= TREND_WARNING_PP) {
        text += ` Ojo: la ocupación cae ${formatPp(row.trendPp)} desde el lanzamiento; reforzar la promoción en lugar de recortar.`;
      }
      break;
  }
  if (!row.dataVerified) {
    text += " Los manifiestos de esta aerolínea no cargaron: no decidir con esta cifra hasta conciliarla (PG-01).";
  }
  return text;
}

export function buildCommercialReport(input: CommercialInput): CommercialReport {
  const maturationWeeks = input.maturationWeeks ?? MATURATION_WEEKS;
  const routeById = new Map(input.routes.map((r) => [r.id, r]));
  const unverified = new Set(unverifiedOperators(input.quality));
  const cutoff = input.flights.reduce(
    (max, f) => (f.weekEnd > max ? f.weekEnd : max),
    input.flights[0]?.weekEnd ?? "",
  );
  const periodStart = input.flights.reduce(
    (min, f) => (f.weekStart < min ? f.weekStart : min),
    input.flights[0]?.weekStart ?? "",
  );

  type Acc = {
    route: string;
    operator: string;
    aircraftType: string;
    byWeek: Map<string, { pax: number; seats: number }>;
  };
  const groups = new Map<string, Acc>();
  for (const f of input.flights) {
    const key = `${f.route}|${f.operator}|${f.aircraftType}`;
    const acc =
      groups.get(key) ??
      { route: f.route, operator: f.operator, aircraftType: f.aircraftType, byWeek: new Map() };
    const w = acc.byWeek.get(f.weekStart) ?? { pax: 0, seats: 0 };
    w.pax += f.passengersBoarded;
    w.seats += f.seatsOffered;
    acc.byWeek.set(f.weekStart, w);
    groups.set(key, acc);
  }

  const rows: RoutePerformanceRow[] = [];
  for (const [key, acc] of groups) {
    const weeks = [...acc.byWeek.entries()].sort(([a], [b]) => a.localeCompare(b));
    const passengers = weeks.reduce((s, [, w]) => s + w.pax, 0);
    const seats = weeks.reduce((s, [, w]) => s + w.seats, 0);
    if (seats <= 0) continue;
    const loadFactor = passengers / seats;
    const weekly = weeks.map(([, w]) => (w.seats > 0 ? w.pax / w.seats : 0));

    let trendPp: number | null = null;
    if (weeks.length >= 4) {
      const k = Math.min(3, Math.floor(weeks.length / 2));
      const lf = (slice: typeof weeks) => {
        const p = slice.reduce((s, [, w]) => s + w.pax, 0);
        const c = slice.reduce((s, [, w]) => s + w.seats, 0);
        return c > 0 ? p / c : 0;
      };
      trendPp = lf(weeks.slice(-k)) - lf(weeks.slice(0, k));
    }

    const meta = routeById.get(acc.route);
    const destination = acc.route.split("-")[1] ?? acc.route;
    const isNew = input.launches.some(
      (l) => l.destination === destination && l.airline === acc.operator,
    );
    const launchWeek = isNew ? (weeks[0]?.[0] ?? null) : null;
    const ageWeeks = launchWeek ? weeksBetween(launchWeek, cutoff) : null;

    const unit = seatsPerFlight(acc.aircraftType);
    const flights = unit ? Math.round(seats / unit) : weeks.length;
    const routeClass = classifyRoute({ loadFactor, trendPp, ageWeeks, maturationWeeks });
    const status: TrafficLight = evaluateTrafficLight("K1", loadFactor);

    const base = {
      key,
      route: acc.route,
      city: meta?.city ?? destination,
      operator: acc.operator,
      aircraftType: acc.aircraftType,
      segment: meta?.international ? ("internacional" as const) : ("nacional" as const),
      passengers,
      seats,
      emptySeats: seats - passengers,
      flights,
      paxPerFlight: flights > 0 ? passengers / flights : 0,
      loadFactor,
      status,
      trendPp,
      weekly,
      launchWeek,
      ageWeeks,
      dataVerified: !unverified.has(acc.operator),
      routeClass,
    };
    rows.push({ ...base, recommendation: recommendationFor(base, maturationWeeks) });
  }

  rows.sort((a, b) => b.loadFactor - a.loadFactor);
  const mature = rows.filter((r) => r.routeClass !== "maduracion");
  const maturing = rows.filter((r) => r.routeClass === "maduracion");
  const top = mature.slice(0, 3);
  const bottom = [...mature].reverse().slice(0, 3);

  const totalPax = rows.reduce((s, r) => s + r.passengers, 0);
  const totalSeats = rows.reduce((s, r) => s + r.seats, 0);
  const networkLf = totalSeats > 0 ? totalPax / totalSeats : 0;
  const emptySeats = totalSeats - totalPax;

  const grow = rows.filter((r) => r.routeClass === "ampliar");
  const watch = rows.filter((r) => r.routeClass === "accion_comercial");
  const cut = rows.filter((r) => r.routeClass === "ajustar_oferta");
  const blocked = rows.filter((r) => !r.dataVerified);

  const label = (r: RoutePerformanceRow) =>
    `${r.route} ${r.operator} (${formatPct(r.loadFactor)})`;

  const decisions: ReportDecision[] = [];
  if (grow.length > 0) {
    decisions.push({
      id: "R1-D1",
      priority: "alta",
      title: "Negociar más oferta donde la demanda supera las sillas",
      evidence: `${grow.map(label).join(", ")} superan el ${formatPct(SPILL_LF)} de ocupación en la ventana.`,
      action:
        "Llevar al comité con cada aerolínea una frecuencia adicional o un cambio a equipo mayor. Priorizar la ruta con más pasajeros por vuelo.",
      owner: "Dirección Comercial",
      policyRef: "PG-02",
    });
  }
  if (maturing.length > 0) {
    decisions.push({
      id: "R1-D2",
      priority: "alta",
      title: "No recortar las rutas recién abiertas",
      evidence: `${maturing
        .map((r) => `${r.route} ${r.operator}: ${r.ageWeeks} semanas, ${formatPct(r.loadFactor)}`)
        .join("; ")}. Una ruta necesita cerca de ${maturationWeeks} semanas para mostrar su demanda real.`,
      action:
        "Mantener la oferta, sostener la promoción con la aerolínea y revisar de nuevo al cumplir la ventana de maduración. Una ocupación baja al inicio no justifica cerrar.",
      owner: "Dirección Comercial",
    });
  }
  if (watch.length > 0 || cut.length > 0) {
    decisions.push({
      id: "R1-D3",
      priority: cut.length > 0 ? "alta" : "media",
      title:
        cut.length > 0
          ? "Ajustar la oferta en rutas maduras con ocupación crítica"
          : "Acción comercial en rutas en zona de atención",
      evidence: [...cut, ...watch].map(label).join(", "),
      action:
        cut.length > 0
          ? "Proponer equipo de menor capacidad o menos frecuencias. Las sillas vacías tienen costo para la aerolínea y para el aeropuerto."
          : "Campaña conjunta y revisión de horarios antes de reducir sillas. Volver a medir en cuatro semanas.",
      owner: "Dirección Comercial",
      policyRef: "PG-02",
    });
  }
  if (blocked.length > 0) {
    decisions.push({
      id: "R1-D4",
      priority: "media",
      title: "Conciliar el dato antes de decidir sobre estas rutas",
      evidence: `Sin manifiestos cargados para ${[...new Set(blocked.map((r) => r.operator))].join(", ")}.`,
      action: "Pedir a TI y a la aerolínea la carga del periodo. Hasta entonces, la cifra es indicativa.",
      owner: "TI",
      policyRef: "PG-01",
    });
  }

  const status: TrafficLight = cut.length > 0 ? "red" : watch.length > 0 ? "yellow" : "green";

  return {
    id: "comercial",
    area: "Comercial",
    title: "Ranking de rutas y operadores",
    question: "¿Qué rutas llenan sus sillas, cuáles no, y qué hacemos con cada una?",
    headline: `${plural(grow.length, "servicio pide", "servicios piden")} más oferta, ${plural(watch.length + cut.length, "necesita", "necesitan")} acción y ${plural(maturing.length, "está", "están")} en maduración. Ocupación de la red: ${formatPct(networkLf)}.`,
    status,
    periodLabel: `${formatDateIso(periodStart)} a ${formatDateIso(cutoff)}`,
    kpis: [
      { label: "Ocupación de la red", value: formatPct(networkLf), status: evaluateTrafficLight("K1", networkLf), hint: "Σ pax / Σ sillas" },
      { label: "Pasajeros embarcados", value: formatInt(totalPax) },
      { label: "Sillas vacías", value: formatInt(emptySeats), hint: "Oferta no vendida en la ventana" },
      { label: "Rutas para ampliar", value: String(grow.length), status: grow.length > 0 ? "green" : undefined },
    ],
    decisions,
    limits: [
      "La ventana es semanal y simulada (synthetic-demo). Diciembre es temporada alta: no extrapolar la tendencia al año.",
      "La ocupación mide sillas llenas, no la rentabilidad de la aerolínea: no hay tarifas ni costos de operador en el dato.",
      `La ventana de maduración de ${maturationWeeks} semanas es un supuesto de gestión, no una norma.`,
    ],
    generatedFrom: ["flights.json", "routes.json", "situation.json", "quality.json"],
    rows,
    top,
    bottom,
    maturing,
    networkLf,
    maturationWeeks,
    cutoff,
    csv: {
      title: "Ranking de rutas y operadores",
      columns: [
        { key: "ranking", label: "Ranking", numeric: true },
        { key: "ruta", label: "Ruta" },
        { key: "destino", label: "Destino" },
        { key: "operador", label: "Operador" },
        { key: "aeronave", label: "Aeronave" },
        { key: "pax", label: "Pasajeros", numeric: true },
        { key: "sillas", label: "Sillas", numeric: true },
        { key: "vacias", label: "Sillas vacías", numeric: true },
        { key: "lf", label: "Ocupación", numeric: true },
        { key: "tendencia", label: "Tendencia (pp)", numeric: true },
        { key: "semanas", label: "Semanas desde apertura", numeric: true },
        { key: "clase", label: "Decisión" },
        { key: "recomendacion", label: "Recomendación" },
      ],
      rows: rows.map((r, i) => ({
        ranking: i + 1,
        ruta: r.route,
        destino: r.city,
        operador: r.operator,
        aeronave: r.aircraftType,
        pax: r.passengers,
        sillas: r.seats,
        vacias: r.emptySeats,
        lf: Number(r.loadFactor.toFixed(4)),
        tendencia: r.trendPp === null ? null : Number((r.trendPp * 100).toFixed(1)),
        semanas: r.ageWeeks,
        clase: CLASS_LABEL[r.routeClass],
        recomendacion: r.recommendation,
      })),
    },
  };
}
