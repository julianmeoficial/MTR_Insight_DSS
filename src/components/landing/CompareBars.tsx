"use client";

import { CountUp } from "@/components/motion/CountUp";
import styles from "./CompareBars.module.css";

export type CompareRow = {
  id: string;
  label: string;
  value: number | null;
  target: number;
  color: string;
};

type Props = {
  title: string;
  rows: readonly CompareRow[];
};

export function CompareBars({ title, rows }: Props) {
  return (
    <figure className={styles.figure} data-board-card>
      <figcaption className={styles.caption}>{title}</figcaption>
      <ul className={styles.list}>
        {rows.map((row) => {
          const v = row.value ?? 0;
          const width = Math.min(100, Math.round(v * 1000) / 10);
          const targetPct = Math.round(row.target * 1000) / 10;
          return (
            <li key={row.id} className={styles.row}>
              <div className={styles.head}>
                <span className={styles.label}>{row.label}</span>
                <span className={`num ${styles.value}`}>
                  {row.value === null ? (
                    "n/d"
                  ) : (
                    <CountUp value={row.value} mode="pct" />
                  )}
                </span>
              </div>
              <div className={styles.track} aria-hidden>
                <div
                  className={styles.fill}
                  style={{
                    width: `${width}%`,
                    background: row.color,
                  }}
                />
                <span
                  className={styles.target}
                  style={{ left: `${targetPct}%` }}
                  title={`Meta ${Math.round(row.target * 1000) / 10}\u00A0%`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
