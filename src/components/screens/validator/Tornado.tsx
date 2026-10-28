"use client";

import { useRef } from "react";
import type { SensitivityResult } from "@/domain/erpm";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatPp } from "@/lib/format";
import styles from "./Tornado.module.css";

type Props = {
  result: SensitivityResult;
  /** Re-run the reveal when the selection or inputs change */
  revealKey: string;
};

/** ±10 % tornado (DESIGN.md §9). Bars grow from the baseline axis. */
export function Tornado({ result, revealKey }: Props) {
  const { dict } = usePreferences();
  const t = dict.validator.tornado;
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-bar]", {
          scaleX: 0,
          duration: 0.4,
          ease: "expo.out",
          stagger: 0.03,
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [revealKey] },
  );

  if (result.baseline === null || result.bars.length === 0) {
    return <p className={styles.empty}>{t.empty}</p>;
  }

  const baseline = result.baseline;
  const span = Math.max(
    1e-6,
    ...result.bars.flatMap((b) => [Math.abs(b.low - baseline), Math.abs(b.high - baseline)]),
  );
  const pct = (v: number) => `${(Math.abs(v - baseline) / span) * 50}%`;

  return (
    <div ref={root} className={styles.root}>
      <div className={styles.axisHead} aria-hidden>
        <span>{t.low}</span>
        <span className={styles.baseline}>
          {t.baseline} <span className="num">{formatPp(baseline)}</span>
        </span>
        <span>{t.high}</span>
      </div>
      <ul className={styles.rows}>
        {result.bars.map((bar) => {
          const lowSide = bar.low < baseline ? "left" : "right";
          const highSide = bar.high < baseline ? "left" : "right";
          return (
            <li key={bar.key} className={styles.row}>
              <span className={styles.label}>{t.keys[bar.key]}</span>
              <span className={styles.track}>
                <span className={styles.axis} aria-hidden />
                <span
                  data-bar
                  className={styles.bar}
                  data-series="low"
                  data-side={lowSide}
                  style={{ inlineSize: pct(bar.low) }}
                  aria-hidden
                />
                <span
                  data-bar
                  className={styles.bar}
                  data-series="high"
                  data-side={highSide}
                  style={{ inlineSize: pct(bar.high) }}
                  aria-hidden
                />
              </span>
              <span className={`num ${styles.values}`}>
                {formatPp(bar.low - baseline)} / {formatPp(bar.high - baseline)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.legend}>
        <span className={styles.swatch} data-series="low" aria-hidden /> {t.low}
        <span className={styles.swatch} data-series="high" aria-hidden /> {t.high}
      </p>
    </div>
  );
}
