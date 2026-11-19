/**
 * R3 · Riesgo regulatorio y del dato.
 *
 * One prioritized list that mixes regulatory requirements and data feeds,
 * because both stop decisions: an overdue permit can stop an operation and a
 * feed that did not load makes the commercial report unreliable.
 */

import { calculateK2, calculateK5 } from "@/domain/kpis";
import type { QualityRecord, RequirementRecord, TrafficLight } from "@/domain/types";
import { formatDateIso, formatPct } from "@/lib/format";
import { unverifiedOperators } from "@/domain/reports/commercial";
import type { ComplianceReport, ReportDecision, RiskItem } from "@/domain/reports/types";

export const DUE_SOON_DAYS = 30;

const DAY_MS = 86_400_000;

const OWNER_BY_AUTHORITY: Record<string, string> = {
  AVSEC: "Seguridad aeroportuaria",
  Aerocivil: "Jurídica · Aerocivil",
  Migración: "Jurídica · Migración",
  DIAN: "Jurídica · Aduanas",
  ICA: "Jurídica · Sanidad",
};

export type ComplianceInput = {
  requirements: readonly RequirementRecord[];
  asOf: string;
  period: { start: string; end: string };
  quality: readonly QualityRecord[];
  etlLoads: readonly { sourceId: string; rejected: number; reason: string | null }[];
};

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00Z`).getTime();
  const to = new Date(`${toIso}T12:00:00Z`).getTime();
  return Math.round((to - from) / DAY_MS);
}

function hasEvidence(r: RequirementRecord, asOf: string): boolean {
  return Boolean(r.evidenceId && r.approvalDate && r.approvalDate <= asOf);
}

export function classifyRequirement(r: RequirementRecord, asOf: string): RiskItem {
  const days = daysBetween(asOf, r.dueDate);
  const evidence = hasEvidence(r, asOf);
  const owner = OWNER_BY_AUTHORITY[r.authority] ?? "Jurídica y cumplimiento";
  const base = {
    id: r.requirementId,
    kind: "requisito" as const,
    label: r.requirementId,
    authority: r.authority,
    owner,
    critical: r.critical,
    dueDate: r.dueDate,
    daysToDue: days,
  };

  if (r.completedFlag && !evidence) {
    return {
      ...base,
      state: "sin_evidencia",
      status: r.critical ? "red" : "yellow",
      score: r.critical ? 75 : 45,
      impact: "Marcado como cumplido sin evidencia ni aprobación: no cuenta para K2.",
      action: "Adjuntar la evidencia y la fecha de aprobación, o reabrir el requisito.",
    };
  }
  if (!evidence && days < 0) {
    return {
      ...base,
      state: "vencido",
      status: r.critical ? "red" : "yellow",
      score: r.critical ? 100 : 60 + Math.min(20, -days),
      impact: r.critical
        ? "Requisito crítico vencido: riesgo de sanción o de suspender la operación asociada. K2 pasa a rojo."
        : `Hito no crítico vencido hace ${-days} días: K2 en amarillo.`,
      action: r.critical
        ? "Escalar hoy a Gerencia y a la autoridad; definir plan de choque con fecha."
        : "Asignar fecha de cierre en el próximo comité y escalar si pasa de 30 días (PG-03).",
    };
  }
  if (!evidence && days <= DUE_SOON_DAYS) {
    return {
      ...base,
      state: "por_vencer",
      status: "yellow",
      score: (r.critical ? 80 : 50) - Math.max(0, days),
      impact: `Vence en ${days} días sin evidencia cargada.`,
      action: "Confirmar responsable y reunir la evidencia antes del aviso de 7 días (PG-03).",
    };
  }
  return {
    ...base,
    state: "al_dia",
    status: "green",
    score: 0,
    impact: evidence ? "Con evidencia y aprobación vigentes." : `Vence en ${days} días.`,
    action: "Sin acción.",
  };
}

export function buildComplianceReport(input: ComplianceInput): ComplianceReport {
  const { asOf } = input;
  const items: RiskItem[] = input.requirements
    .filter((r) => r.applicable)
    .map((r) => classifyRequirement(r, asOf));

  const blockedOperators = unverifiedOperators(input.quality);
  for (const q of input.quality) {
    const rejected = input.etlLoads
      .filter((l) => l.sourceId === q.sourceId)
      .reduce((s, l) => s + l.rejected, 0);
    const base = {
      id: q.sourceId,
      kind: "fuente" as const,
      label: q.sourceName,
      authority: "Dato",
      owner: q.owner,
      critical: true,
      dueDate: q.periodEnd,
      daysToDue: null,
    };
    if (!q.loaded) {
      const op = q.sourceName.startsWith("Manifiestos ")
        ? q.sourceName.replace("Manifiestos ", "")
        : null;
      items.push({
        ...base,
        state: "no_cargada",
        status: "red",
        score: 90,
        impact: op
          ? `Sin manifiestos de ${op}: su ocupación en el ranking comercial no es confiable y K5 baja.`
          : "Fuente crítica sin cargar: K5 baja y se bloquea la publicación.",
        action: "Escalar al dueño de la fuente y bloquear la publicación de las cifras afectadas (PG-01).",
      });
    } else if (rejected > 0) {
      items.push({
        ...base,
        state: "rechazos",
        status: "yellow",
        score: 20 + Math.min(20, rejected),
        impact: `${rejected} registro(s) rechazados por reglas de calidad.`,
        action: "Revisar la fila rechazada y recargar antes del cierre del periodo.",
      });
    } else {
      items.push({
        ...base,
        state: "al_dia",
        status: "green",
        score: 0,
        impact: "Cargada a tiempo y validada.",
        action: "Sin acción.",
      });
    }
  }

  items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  const open = items.filter((i) => i.score > 0);

  const k2 = calculateK2(input.requirements, asOf, input.period);
  const k5 = calculateK5(input.quality);

  const decisions: ReportDecision[] = open.slice(0, 4).map((item, i) => ({
    id: `R3-D${i + 1}`,
    priority: item.score >= 75 ? "alta" : item.score >= 40 ? "media" : "baja",
    title:
      item.state === "no_cargada"
        ? `Recuperar la fuente ${item.label}`
        : item.state === "vencido"
          ? `Cerrar ${item.label} (${item.authority}), vencido`
          : item.state === "por_vencer"
            ? `Asegurar ${item.label} (${item.authority}) antes del vencimiento`
            : item.state === "sin_evidencia"
              ? `Soportar ${item.label} con evidencia`
              : `Depurar rechazos en ${item.label}`,
    evidence:
      item.kind === "requisito" && item.dueDate
        ? `${item.impact} Fecha límite: ${formatDateIso(item.dueDate)}.`
        : item.impact,
    action: item.action,
    owner: item.owner,
    policyRef: item.kind === "fuente" ? "PG-01" : "PG-03",
  }));

  const worst = (a: TrafficLight, b: TrafficLight): TrafficLight => {
    const rank: Record<TrafficLight, number> = { red: 3, yellow: 2, no_data: 1, green: 0 };
    return rank[a] >= rank[b] ? a : b;
  };
  const status = worst(k2.status, k5.status);
  const overdue = items.filter((i) => i.state === "vencido");

  return {
    id: "cumplimiento",
    area: "Cumplimiento y dato",
    title: "Riesgo regulatorio y del dato",
    question: "¿Qué requisito o fuente puede frenar la operación o una decisión, y quién lo cierra?",
    headline: `${open.length} ${open.length === 1 ? "asunto abierto" : "asuntos abiertos"}: ${overdue.length} ${overdue.length === 1 ? "requisito vencido" : "requisitos vencidos"} y ${blockedOperators.length} ${blockedOperators.length === 1 ? "fuente sin cargar" : "fuentes sin cargar"}. K2 ${formatPct(k2.value)} · K5 ${formatPct(k5.value)}.`,
    status,
    periodLabel: `Corte ${formatDateIso(asOf)}`,
    kpis: [
      { label: "Cumplimiento (K2)", value: formatPct(k2.value), status: k2.status },
      { label: "Integridad del dato (K5)", value: formatPct(k5.value), status: k5.status },
      { label: "Asuntos abiertos", value: String(open.length) },
      {
        label: "Publicación bloqueada",
        value: blockedOperators.length > 0 ? blockedOperators.join(", ") : "Ninguna",
        status: blockedOperators.length > 0 ? "red" : "green",
      },
    ],
    decisions,
    limits: [
      "El puntaje de prioridad es una regla de gestión (crítico y vencido primero), no una medida de probabilidad.",
      "Los dueños por autoridad son roles de referencia: confirmar responsables nominales en comité.",
      "No incluye requisitos fuera del periodo del trimestre cargado.",
    ],
    generatedFrom: ["requirements.json", "quality.json", "etl-log.json"],
    asOf,
    items,
    k2: { value: k2.value, status: k2.status },
    k5: { value: k5.value, status: k5.status },
    blockedOperators,
    csv: {
      title: "Riesgos regulatorios y del dato",
      columns: [
        { key: "prioridad", label: "Prioridad", numeric: true },
        { key: "tipo", label: "Tipo" },
        { key: "id", label: "Elemento" },
        { key: "autoridad", label: "Autoridad / área" },
        { key: "critico", label: "Crítico" },
        { key: "vence", label: "Fecha límite" },
        { key: "dias", label: "Días al vencimiento", numeric: true },
        { key: "estado", label: "Estado" },
        { key: "dueno", label: "Responsable" },
        { key: "impacto", label: "Impacto" },
        { key: "accion", label: "Acción" },
      ],
      rows: items.map((i) => ({
        prioridad: i.score,
        tipo: i.kind,
        id: i.label,
        autoridad: i.authority,
        critico: i.critical ? "Sí" : "No",
        vence: i.dueDate,
        dias: i.daysToDue,
        estado: i.state,
        dueno: i.owner,
        impacto: i.impact,
        accion: i.action,
      })),
    },
  };
}
