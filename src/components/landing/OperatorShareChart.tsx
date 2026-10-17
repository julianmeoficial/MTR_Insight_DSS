"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";
import { CountUp } from "@/components/motion/CountUp";
import { formatInt } from "@/lib/format";
import styles from "./OperatorShareChart.module.css";

export type ShareSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: readonly ShareSlice[];
  title: string;
};

/** Deterministic donut (no Math.random) for SSR-safe paths. */
export function OperatorShareChart({ slices, title }: Props) {
  const { dict } = usePreferences();
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const size = 160;
  const cx = 80;
  const cy = 80;
  const rOuter = 64;
  const rInner = 38;

  function polar(cx0: number, cy0: number, radius: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: Math.round((cx0 + radius * Math.cos(rad)) * 100) / 100,
      y: Math.round((cy0 + radius * Math.sin(rad)) * 100) / 100,
    };
  }

  function arc(startAngle: number, endAngle: number) {
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const o1 = polar(cx, cy, rOuter, startAngle);
    const o2 = polar(cx, cy, rOuter, endAngle);
    const i2 = polar(cx, cy, rInner, endAngle);
    const i1 = polar(cx, cy, rInner, startAngle);
    return [
      `M${o1.x},${o1.y}`,
      `A${rOuter},${rOuter} 0 ${large} 1 ${o2.x},${o2.y}`,
      `L${i2.x},${i2.y}`,
      `A${rInner},${rInner} 0 ${large} 0 ${i1.x},${i1.y}`,
      "Z",
    ].join("");
  }

  const arcs = slices.reduce<
    Array<ShareSlice & { d: string; ratio: number; start: number; end: number }>
  >((acc, s) => {
    const start = acc.length === 0 ? 0 : acc[acc.length - 1]!.end;
    const portion = (s.value / total) * 360;
    const end = start + portion;
    acc.push({
      ...s,
      start,
      end,
      d: arc(start, end >= 360 ? 359.99 : end),
      ratio: s.value / total,
    });
    return acc;
  }, []);

  return (
    <figure className={styles.figure} data-board-card>
      <figcaption className={styles.caption}>{title}</figcaption>
      <div className={styles.body}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
          role="img"
          aria-label={title}
        >
          {arcs.map((a) => (
            <path key={a.id} d={a.d} fill={a.color} />
          ))}
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            className={`num ${styles.centerValue}`}
            fill="var(--fg)"
          >
            {formatInt(total)}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className={styles.centerLabel}
            fill="var(--fg-3)"
          >
            {dict.landing.shareCenter}
          </text>
        </svg>
        <ul className={styles.legend}>
          {arcs.map((a) => (
            <li key={a.id} className={styles.legendRow}>
              <span
                className={styles.swatch}
                style={{ background: a.color }}
                aria-hidden
              />
              <span className={styles.legendLabel}>{a.label}</span>
              <span className={`num ${styles.legendValue}`}>
                <CountUp value={a.ratio} mode="pct" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
