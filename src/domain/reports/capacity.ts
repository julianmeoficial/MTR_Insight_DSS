/**
 * R2 · Capacidad de terminal y ventana de ampliación.
 *
 * Two failure modes cost money: saturating the terminal (demand turned away)
 * and building capacity years before it is used (a half-empty warehouse still
 * pays rent). The report finds the latest year to decide, and compares a
 * full build against a phased one by how much capacity sits idle at opening.
 */

import { kpiThresholds } from "@/config/thresholds";
import { calculateK3 } from "@/domain/kpis";
import { FORECAST_RATES, projectPassengers } from "@/domain/dss/projection";
import type { CapacitySnapshot, TrafficLight } from "@/domain/types";
import { formatInt, formatPct } from "@/lib/format";
import type {
  CapacityReport,
  CapacityScenarioRow,
  CapacityYearPoint,
  ExpansionOption,
  ReportDecision,
} from "@/domain/reports/types";

/** Assumption: design, permits and works for a terminal take about three years. */
export const TERMINAL_LEAD_TIME_YEARS = 3;
export const HORIZON_YEAR = 2045;

const SCENARIO_LABEL = {
  low: "Bajo 2,5 %",
  base: "Base 3,9 %",
  high: "Alto 5,5 %",
} as const;

export type CapacityInput = {
  capacity: CapacitySnapshot;
  /** Extra annual capacity from the projected terminal (simulated plan). */
  projectedTerminalCapacity: number | null;
  cargo: { label: string; warehouses: string[] }[];
  runwayConflict: { verifiedM: number; conflictingM: number } | null;
  leadTimeYears?: number;
};

/** First year in [baseYear, horizon] where demand ≥ capacity × ratio. */
export function yearReaching(
  baseline: number,
  baseYear: number,
  rate: number,
  capacity: number,
  ratio: number,
  horizon = HORIZON_YEAR,
): number | null {
  if (capacity <= 0) return null;
  for (let y = baseYear; y <= horizon; y += 1) {
    if (projectPassengers(baseline, baseYear, y, rate) >= capacity * ratio) return y;
  }
  return null;
}

export function buildCapacityReport(input: CapacityInput): CapacityReport {
  const lead = input.leadTimeYears ?? TERMINAL_LEAD_TIME_YEARS;
  const { rolling12MonthPassengers: pax, declaredAnnualCapacity: cap } = input.capacity;
  const baseYear = Number(input.capacity.periodEnd.slice(0, 4));
  const k3 = calculateK3(input.capacity);
  const utilization = k3.value ?? 0;
  const headroom90 = cap * kpiThresholds.K3.redMin - pax;

  const scenarios: CapacityScenarioRow[] = (["low", "base", "high"] as const).map((id) => {
    const rate = FORECAST_RATES[id];
    const year100 = yearReaching(pax, baseYear, rate, cap, 1);
    return {
      id,
      label: SCENARIO_LABEL[id],
      rate,
      year80: yearReaching(pax, baseYear, rate, cap, kpiThresholds.K3.greenBelow),
      year90: yearReaching(pax, baseYear, rate, cap, kpiThresholds.K3.redMin),
      year100,
      decideBy: year100 === null ? null : Math.max(baseYear, year100 - lead),
    };
  });

  const series: CapacityYearPoint[] = [];
  for (let year = baseYear; year <= HORIZON_YEAR; year += 1) {
    series.push({
      year,
      low: projectPassengers(pax, baseYear, year, FORECAST_RATES.low) / cap,
      base: projectPassengers(pax, baseYear, year, FORECAST_RATES.base) / cap,
      high: projectPassengers(pax, baseYear, year, FORECAST_RATES.high) / cap,
    });
  }

  const baseScenario = scenarios.find((s) => s.id === "base")!;
  const highScenario = scenarios.find((s) => s.id === "high")!;
  const openYear = baseScenario.year100 ?? baseYear + lead;
  const demandAtOpen = projectPassengers(pax, baseYear, openYear, FORECAST_RATES.base);

  function option(id: string, label: string, added: number, note: string): ExpansionOption {
    const total = cap + added;
    const reach = yearReaching(demandAtOpen, openYear, FORECAST_RATES.base, total, kpiThresholds.K3.greenBelow);
    return {
      id,
      label,
      addedCapacity: added,
      openYear,
      utilizationAtOpen: demandAtOpen / total,
      idleAtOpen: Math.max(0, total - demandAtOpen),
      yearsUntil80: reach === null ? null : reach - openYear,
      note,
    };
  }

  const t2 = input.projectedTerminalCapacity ?? 0;
  const options: ExpansionOption[] =
    t2 > 0
      ? [
          option("completa", "Terminal 2 completa", t2, "Toda la capacidad del plan simulado en una sola obra."),
          option("fases", "Terminal 2 por fases (50 % inicial)", Math.round(t2 / 2), "Primera fase con la mitad de la capacidad; la segunda se dispara de nuevo al 80 %."),
        ]
      : [];

  const [full, phased] = options;
  const decisions: ReportDecision[] = [];
  const zone: TrafficLight = k3.status;

  decisions.push({
    id: "R2-D1",
    priority: zone === "green" ? "media" : "alta",
    title:
      zone === "red"
        ? "Ejecutar la ampliación de terminal (PG-11)"
        : zone === "yellow"
          ? "Activar la planeación de la ampliación ahora (PG-11)"
          : "Vigilar la utilización de terminal",
    evidence: `Utilización de ${formatPct(utilization)} (${formatInt(pax)} de ${formatInt(cap)} pax/año). Quedan ${formatInt(Math.max(0, headroom90))} pax antes del disparo de ejecución al 90 %.`,
    action: `Con ${lead} años de diseño y obra, el escenario alto exige decidir en ${highScenario.decideBy ?? "n/d"} y el base en ${baseScenario.decideBy ?? "n/d"}. Aprobar estudios y presupuesto de fase 1 en este ciclo.`,
    owner: "Gerencia General · Infraestructura",
    policyRef: "PG-11",
  });

  if (full && phased) {
    decisions.push({
      id: "R2-D2",
      priority: "alta",
      title: "Ampliar por fases para no pagar capacidad vacía",
      evidence: `Si abre en ${openYear} (escenario base): la T2 completa queda al ${formatPct(full.utilizationAtOpen)} con ${formatInt(full.idleAtOpen)} pax/año sin usar; por fases queda al ${formatPct(phased.utilizationAtOpen)}.`,
      action:
        "Diseñar la T2 modular: construir la primera fase y dejar listas las obras de la segunda. Igual que una bodega, una terminal medio vacía cuesta mantenimiento, energía y personal.",
      owner: "Infraestructura · Planeación",
    });
  }

  if (input.cargo.length > 0) {
    decisions.push({
      id: "R2-D3",
      priority: "media",
      title: "Medir la ocupación de bodegas de carga antes de ampliarlas o renovarlas",
      evidence: `${input.cargo.map((c) => `${c.label}: ${c.warehouses.join(", ")}`).join(" · ")}. No hay toneladas ni m² ocupados publicados.`,
      action:
        "Instrumentar ocupación (m² y rotación) por bodega durante un trimestre. Sin ese dato no se puede justificar más espacio ni negociar el arriendo.",
      owner: "Infraestructura · Carga",
    });
  }

  if (input.runwayConflict) {
    decisions.push({
      id: "R2-D4",
      priority: "baja",
      title: "Adoptar un único valor técnico de pista antes de diseñar",
      evidence: `Pista verificada ${formatInt(input.runwayConflict.verifiedM)} m frente a ${formatInt(input.runwayConflict.conflictingM)} m en ficha local (RC-08).`,
      action: "Cerrar el conflicto en comité técnico para que los estudios de ampliación partan de un solo dato.",
      owner: "Infraestructura · TI",
      policyRef: "PG-01",
    });
  }

  return {
    id: "capacidad",
    area: "Infraestructura",
    title: "Capacidad de terminal y ventana de ampliación",
    question: "¿Cuándo hay que decidir la ampliación y de qué tamaño, sin pagar espacio vacío?",
    headline: `La terminal opera al ${formatPct(utilization)}. En el escenario base se satura en ${baseScenario.year100 ?? "después de 2045"}; la decisión debe tomarse a más tardar en ${baseScenario.decideBy ?? "n/d"}.`,
    status: zone,
    periodLabel: `12 meses al ${input.capacity.periodEnd}`,
    kpis: [
      { label: "Utilización de terminal (K3)", value: formatPct(utilization), status: zone, hint: "< 80 % verde · ≥ 90 % ejecutar" },
      { label: "Margen al 90 %", value: `${formatInt(Math.max(0, headroom90))} pax` },
      { label: "Saturación (base)", value: String(baseScenario.year100 ?? "> 2045") },
      { label: "Decidir a más tardar", value: String(highScenario.decideBy ?? "n/d"), hint: "Escenario alto" },
    ],
    decisions,
    limits: [
      "La capacidad declarada de 1,7 M pax/año está pendiente de verificación (Plan Maestro).",
      "Las tasas 2,5 / 3,9 / 5,5 % son referencias globales, no un pronóstico validado para Montería.",
      `La T2, su capacidad y el plazo de ${lead} años son supuestos del plan simulado.`,
      "No hay dato de hora pico ni de ocupación de bodegas: el informe no dimensiona salas ni muelles.",
    ],
    generatedFrom: ["capacity.json", "situation.json", "cargo.json", "infrastructure.json", "dss-defaults"],
    passengers12m: pax,
    capacity: cap,
    utilization,
    headroom90,
    scenarios,
    series,
    options,
    leadTimeYears: lead,
    baseYear,
    warehouses: input.cargo.map((c) => ({ operator: c.label, warehouses: c.warehouses })),
    csv: {
      title: "Escenarios de capacidad",
      columns: [
        { key: "escenario", label: "Escenario" },
        { key: "tasa", label: "Tasa anual", numeric: true },
        { key: "anio80", label: "Año 80 % (planear)", numeric: true },
        { key: "anio90", label: "Año 90 % (ejecutar)", numeric: true },
        { key: "anio100", label: "Año saturación", numeric: true },
        { key: "decidir", label: "Decidir a más tardar", numeric: true },
      ],
      rows: scenarios.map((s) => ({
        escenario: s.label,
        tasa: s.rate,
        anio80: s.year80,
        anio90: s.year90,
        anio100: s.year100,
        decidir: s.decideBy,
      })),
    },
  };
}
