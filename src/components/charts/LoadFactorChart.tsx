"use client";

import { useMemo, useState } from "react";
import type { LoadFactorSeriesPoint } from "@/application/dashboard";
import { formatPct } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./charts.module.css";

type Props = {
  series: LoadFactorSeriesPoint[];
  breakEvenRatio?: number;
  title?: string;
};

export function LoadFactorChart({
  series,
  breakEvenRatio = 0.7,
  title = "Load factor semanal por operador",
}: Props) {
  const [showTable, setShowTable] = useState(false);

  const weeks = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of series) set.set(p.weekStart, p.weekLabel);
    return [...set.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, weekLabel]) => ({ weekStart, weekLabel }));
  }, [series]);

  const byOp = useMemo(() => {
    const ops = ["Satena", "Copa"] as const;
    return ops.map((op) => ({
      op,
      color: op === "Satena" ? "var(--series-2)" : "var(--series-1)",
      points: weeks.map((w) => {
        const row = series.find(
          (s) => s.weekStart === w.weekStart && s.operator === op,
        );
        return row?.value ?? null;
      }),
    }));
  }, [series, weeks]);

  const w = 640;
  const h = 240;
  const pad = { t: 16, r: 48, b: 36, l: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  function xAt(i: number) {
    return pad.l + (i / Math.max(weeks.length - 1, 1)) * innerW;
  }
  function yAt(v: number) {
    return pad.t + (1 - v) * innerH;
  }

  function pathFor(values: (number | null)[]) {
    let d = "";
    values.forEach((v, i) => {
      if (v === null) return;
      const cmd = d ? "L" : "M";
      d += `${cmd}${xAt(i)},${yAt(v)} `;
    });
    return d.trim();
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.head}>
        <figcaption className={styles.caption}>{title}</figcaption>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowTable((s) => !s)}
        >
          {showTable ? "Ocultar tabla" : "Ver tabla"}
        </button>
      </div>
      <p className={styles.hint}>
        Satena (ocre) y Copa (azul) frente a la meta 70 %. Ventana semanal de
        demostración.
      </p>

      {!showTable ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className={styles.svg}
          role="img"
          aria-label={title}
        >
          {[0.5, 0.65, 0.7, 0.9, 1].map((tick) => (
            <g key={tick}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text
                x={w - pad.r + 6}
                y={yAt(tick) + 3}
                className={`num ${styles.chartText}`}
                fontSize="10"
              >
                {Math.round(tick * 100)} %
              </text>
            </g>
          ))}
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={yAt(breakEvenRatio)}
            y2={yAt(breakEvenRatio)}
            stroke="var(--fg-muted)"
            strokeWidth="1.5"
          />
          <text
            x={pad.l}
            y={yAt(breakEvenRatio) - 6}
            className={`num ${styles.chartText}`}
            fontSize="10"
          >
            Meta 70 %
          </text>
          {byOp.map((seriesOp) => (
            <path
              key={seriesOp.op}
              d={pathFor(seriesOp.points)}
              fill="none"
              stroke={seriesOp.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              className={styles.draw}
            />
          ))}
          {weeks.map((week, i) => (
            <text
              key={week.weekStart}
              x={xAt(i)}
              y={h - 10}
              textAnchor="middle"
              className={`num ${styles.chartText}`}
              fontSize="10"
            >
              {week.weekLabel}
            </text>
          ))}
        </svg>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Operador</th>
                <th>Aeronave</th>
                <th>LF</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr
                  key={`${row.weekStart}-${row.operator}-${row.aircraftType}`}
                >
                  <td className="num">{row.weekLabel}</td>
                  <td>{row.operator}</td>
                  <td className="num">{row.aircraftType}</td>
                  <td className="num">{formatPct(row.value)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
