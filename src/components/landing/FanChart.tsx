"use client";

import { buildFanSeries } from "@/domain/dss";
import { formatInt } from "@/lib/format";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import styles from "./FanChart.module.css";

const BASELINE = 1_478_610;
const BASE_YEAR = 2024;
const CAPACITY = 1_700_000;

/** Stable SVG coords across SSR/CSR (avoids float hydration mismatch). */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

export function FanChart() {
  const { dict } = usePreferences();
  const series = buildFanSeries(BASELINE, BASE_YEAR, 2045);
  const w = 720;
  const h = 280;
  const pad = { t: 20, r: 48, b: 36, l: 48 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxY = Math.max(...series.map((p) => p.high), CAPACITY * 1.05);
  const minY = Math.min(...series.map((p) => p.low), BASELINE) * 0.95;
  const span = maxY - minY || 1;

  function xAt(year: number) {
    return r(pad.l + ((year - BASE_YEAR) / (2045 - BASE_YEAR)) * innerW);
  }
  function yAt(v: number) {
    return r(pad.t + (1 - (v - minY) / span) * innerH);
  }

  const basePath = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.year)},${yAt(p.base)}`)
    .join("");
  const band = [
    ...series.map(
      (p, i) => `${i === 0 ? "M" : "L"}${xAt(p.year)},${yAt(p.high)}`,
    ),
    ...[...series]
      .reverse()
      .map((p) => `L${xAt(p.year)},${yAt(p.low)}`),
    "Z",
  ].join("");

  const y80 = yAt(CAPACITY * 0.8);
  const y90 = yAt(CAPACITY * 0.9);

  const caption = dict.landing.fanCaption.replace(
    "{capacity}",
    formatInt(CAPACITY),
  );

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>{caption}</figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={styles.svg}
        role="img"
        aria-label={dict.landing.fanAria}
      >
        <path d={band} fill="var(--series-2)" opacity="0.12" />
        <line
          x1={pad.l}
          x2={w - pad.r}
          y1={y80}
          y2={y80}
          stroke="var(--warn)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <line
          x1={pad.l}
          x2={w - pad.r}
          y1={y90}
          y2={y90}
          stroke="var(--crit)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <path
          data-fan-path
          d={basePath}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
        />
        <text
          x={w - pad.r}
          y={r(y80 - 4)}
          fill="var(--fg-3)"
          fontSize="10"
          textAnchor="end"
          className="num"
        >
          {dict.landing.threshold80}
        </text>
        <text
          x={w - pad.r}
          y={r(y90 - 4)}
          fill="var(--fg-3)"
          fontSize="10"
          textAnchor="end"
          className="num"
        >
          {dict.landing.threshold90}
        </text>
      </svg>
    </figure>
  );
}
