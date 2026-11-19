import type {
  CapacityYearPoint,
  ReportDecision,
  ReportKpi,
  RoutePerformanceRow,
} from "@/domain/reports";
import { CLASS_LABEL } from "@/domain/reports";
import { trafficLightToTone } from "@/components/ui/StatusPill";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";
import styles from "./reports.module.css";

export function KpiStrip({ kpis, wide = false }: { kpis: ReportKpi[]; wide?: boolean }) {
  return (
    <dl className={cn(styles.kpis, wide && styles.kpisWide)}>
      {kpis.map((k) => (
        <div key={k.label} className={styles.kpi}>
          <dt className={styles.kpiLabel}>{k.label}</dt>
          <dd
            className={cn(styles.kpiValue, "num")}
            data-tone={k.status ? trafficLightToTone(k.status) : undefined}
          >
            {k.value}
          </dd>
          {k.hint ? <dd className={styles.kpiHint}>{k.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export function DecisionList({
  decisions,
  compact = false,
}: {
  decisions: ReportDecision[];
  compact?: boolean;
}) {
  if (decisions.length === 0) {
    return <p className={styles.question}>Sin decisiones pendientes con el dato actual.</p>;
  }
  return (
    <ol className={styles.decisions}>
      {decisions.map((d) => (
        <li key={d.id} className={styles.decision}>
          <p className={styles.decisionTitle}>
            <span className={styles.priority} data-priority={d.priority}>
              {d.priority}
            </span>
            {d.title}
          </p>
          <p className={styles.decisionEvidence}>{d.evidence}</p>
          {compact ? null : (
            <>
              <p className={styles.decisionAction}>
                <strong>Acción: </strong>
                {d.action}
              </p>
              <p className={styles.decisionMeta}>
                Responsable: {d.owner}
                {d.policyRef ? ` · ${d.policyRef}` : ""}
              </p>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

export function LimitsList({ limits }: { limits: string[] }) {
  return (
    <ul className={styles.limits}>
      {limits.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/* ---------- Ranking bars (R1) ---------- */

const BAR_MIN = 0.5;
const BAR_MAX = 0.9;

function barPos(v: number): number {
  return Math.max(0, Math.min(1, (v - BAR_MIN) / (BAR_MAX - BAR_MIN))) * 100;
}

export function RankingBars({
  rows,
  compact = false,
}: {
  rows: RoutePerformanceRow[];
  compact?: boolean;
}) {
  return (
    <figure>
      <ol className={styles.bars} aria-label="Ocupación por ruta y operador">
        {rows.map((r) => (
          <li key={r.key} className={cn(styles.bar, compact && styles.barCompact)}>
            <span className={styles.barLabel} title={`${r.route} · ${r.city} · ${r.operator}`}>
              <strong>{r.route.replace("MTR-", "")}</strong> {r.operator}
            </span>
            <span className={styles.barTrack} aria-hidden>
              <span
                className={styles.barFill}
                data-tone={trafficLightToTone(r.status)}
                data-maturing={r.routeClass === "maduracion"}
                style={{ inlineSize: `${barPos(r.loadFactor)}%` }}
              />
              {[0.65, 0.7, 0.8].map((t) => (
                <span key={t} className={styles.tick} style={{ insetInlineStart: `${barPos(t)}%` }} />
              ))}
            </span>
            <span className={cn(styles.barValue, "num")}>
              {formatPct(r.loadFactor)}
              <span className="sr-only"> · {CLASS_LABEL[r.routeClass]}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        <ul className={styles.legend} style={{ marginTop: 10 }}>
          <li>
            <span className={styles.swatch} data-tone="ok" aria-hidden /> ≥ 70 %
          </li>
          <li>
            <span className={styles.swatch} data-tone="warn" aria-hidden /> 65 a 70 %
          </li>
          <li>
            <span className={styles.swatch} data-tone="crit" aria-hidden /> &lt; 65 %
          </li>
          <li>
            <span className={styles.swatch} data-maturing="true" aria-hidden /> Ruta en maduración
          </li>
          <li>Marcas: 65 · 70 · 80 %. Escala 50 a 90 %.</li>
        </ul>
      </figcaption>
    </figure>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const w = 88;
  const h = 24;
  const min = 0.5;
  const max = 1;
  if (values.length < 2) return null;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const y70 = h - 2 - ((0.7 - min) / (max - min)) * (h - 4);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.spark} role="img" aria-label="Ocupación semanal">
      <line x1="0" x2={w} y1={y70} y2={y70} stroke="var(--line-3)" strokeDasharray="2 2" />
      <polyline points={pts.join(" ")} fill="none" stroke="var(--fg-2)" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- Utilization projection (R2) ---------- */

const SCENARIO_STYLE = [
  { key: "low", label: "Bajo 2,5 %", color: "var(--series-3)" },
  { key: "base", label: "Base 3,9 %", color: "var(--series-2)" },
  { key: "high", label: "Alto 5,5 %", color: "var(--series-5)" },
] as const;

export function UtilizationChart({
  series,
  years = 10,
  todayLabel = "Hoy",
}: {
  series: CapacityYearPoint[];
  years?: number;
  todayLabel?: string;
}) {
  const points = series.slice(0, years + 1);
  const w = 520;
  const h = 260;
  const pad = { t: 16, r: 96, b: 30, l: 44 };
  const yMin = 0.7;
  const yMax = 1.4;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / Math.max(1, points.length - 1)) * innerW;
  const y = (v: number) => pad.t + (1 - (Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin)) * innerH;

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.chart} role="img" aria-label="Utilización proyectada de la terminal por escenario">
        <rect
          x={pad.l}
          y={y(yMax)}
          width={innerW}
          height={y(1) - y(yMax)}
          fill="color-mix(in oklab, var(--crit) 8%, transparent)"
        />
        {[0.8, 0.9, 1].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={pad.l + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 1 ? "var(--crit)" : "var(--line-3)"}
              strokeDasharray={t === 1 ? undefined : "4 4"}
            />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className={styles.chartText}>
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        <text x={pad.l + 6} y={y(0.8) - 4} className={styles.chartText}>Planear (PG-11)</text>
        <text x={pad.l + 6} y={y(0.9) - 4} className={styles.chartText}>Ejecutar</text>
        <text x={pad.l + 6} y={y(1) - 4} className={styles.chartText}>Saturación</text>
        {points.map((p, i) =>
          i % 2 === 0 ? (
            <text key={p.year} x={x(i)} y={h - 8} textAnchor="middle" className={styles.chartText}>
              {i === 0 ? todayLabel : p.year}
            </text>
          ) : null,
        )}
        {SCENARIO_STYLE.map((s) => {
          const d = points
            .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[s.key]).toFixed(1)}`)
            .join(" ");
          const last = points[points.length - 1]!;
          const cross = points.findIndex((p) => p[s.key] >= 1);
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" />
              {cross >= 0 ? (
                <circle cx={x(cross)} cy={y(points[cross]![s.key])} r="4" fill={s.color} />
              ) : null}
              <text
                x={pad.l + innerW + 8}
                y={y(last[s.key]) + 4}
                className={styles.chartLabel}
                style={{ fill: s.color }}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.sectionHint}>
        Utilización = pasajeros proyectados / capacidad declarada (1,7 M). El punto marca el año de saturación. Valores sobre 140 % se recortan.
      </figcaption>
    </figure>
  );
}
