const NBSP = "\u00A0";
const EMPTY = "n/d";

const pctFmt = new Intl.NumberFormat("es-CO", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const numFmt = new Intl.NumberFormat("es-CO");

const dateFmt = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

const timeFmt = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Bogota",
});

const relativeFmt = new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" });

/** Ratio 0-1 → "72,4 %" with NBSP before %. */
export function formatPct(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return EMPTY;
  const raw = pctFmt.format(ratio);
  return raw.replace(/\s?%/, `${NBSP}%`);
}

export function formatPp(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return EMPTY;
  const pp = delta * 100;
  const sign = pp > 0 ? "+" : "";
  const n = pp.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${n}${NBSP}pp`;
}

export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return EMPTY;
  return numFmt.format(Math.round(n));
}

export function formatNumber(
  n: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return EMPTY;
  return new Intl.NumberFormat("es-CO", options).format(n);
}

/** Short date "30 nov 2026" (no trailing period on month abbr). */
export function formatDateIso(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00-05:00`);
  return dateFmt.format(d).replace(/\./g, "");
}

export function formatTimeIso(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatRelative(fromIso: string, to = new Date()): string {
  const from = new Date(fromIso).getTime();
  const diffSec = Math.round((from - to.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return relativeFmt.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return relativeFmt.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 48) return relativeFmt.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return relativeFmt.format(diffDay, "day");
}

export function withUnit(value: string, unit: string): string {
  if (value === EMPTY) return EMPTY;
  return `${value}${NBSP}${unit}`;
}

export function statusLabel(
  status: "green" | "yellow" | "red" | "no_data" | "ok" | "warn" | "crit" | "nodata",
): string {
  switch (status) {
    case "green":
    case "ok":
      return "En meta";
    case "yellow":
    case "warn":
      return "Atención";
    case "red":
    case "crit":
      return "Crítico";
    default:
      return "Sin datos";
  }
}
