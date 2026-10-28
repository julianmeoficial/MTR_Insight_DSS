"use client";

import { formatInt, formatPct } from "@/lib/format";
import styles from "./OperatorShareBars.module.css";

export type ShareBar = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  bars: readonly ShareBar[];
  title: string;
};

/** Horizontal share bars; use when more than four operators (no pie). */
export function OperatorShareBars({ bars, title }: Props) {
  const total = bars.reduce((a, b) => a + b.value, 0) || 1;
  const sorted = [...bars].sort((a, b) => b.value - a.value);

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <ul className={styles.list}>
        {sorted.map((bar) => {
          const ratio = bar.value / total;
          return (
            <li key={bar.id} className={styles.row}>
              <div className={styles.meta}>
                <span className={styles.label}>{bar.label}</span>
                <span className={`num ${styles.value}`}>
                  {formatPct(ratio)} · {formatInt(bar.value)}
                </span>
              </div>
              <div className={styles.track} aria-hidden>
                <span
                  className={styles.fill}
                  style={{
                    width: `${Math.max(ratio * 100, 1)}%`,
                    background: bar.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
