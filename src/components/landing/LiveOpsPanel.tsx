"use client";

import { useEffect, useState } from "react";
import type { KpiTileModel } from "@/application/dashboard";
import { StatusGlyph } from "@/components/ui/StatusBadge";
import { formatPct } from "@/lib/format";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import styles from "./LiveOpsPanel.module.css";

type Props = {
  tiles: KpiTileModel[];
};

export function LiveOpsPanel({ tiles }: Props) {
  const { dict } = usePreferences();
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced || tiles.length === 0) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTick((t) => (t + 1) % tiles.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [reduced, tiles.length]);

  return (
    <div className={styles.panel}>
      <span className={cn(styles.tick, styles.tl)} aria-hidden />
      <span className={cn(styles.tick, styles.tr)} aria-hidden />
      <span className={cn(styles.tick, styles.bl)} aria-hidden />
      <span className={cn(styles.tick, styles.br)} aria-hidden />
      <div className={styles.head}>
        <p className={styles.label}>{dict.livePanel}</p>
        <span className={styles.demo}>{dict.demo.tag}</span>
      </div>
      <ul className={styles.list}>
        {tiles.map((tile, i) => {
          const highlight = !reduced && i === tick;
          return (
            <li
              key={tile.kpiId}
              className={cn(styles.row, highlight && styles.highlight)}
            >
              <div className={styles.left}>
                <StatusGlyph status={tile.status} />
                <span className={`num ${styles.id}`}>{tile.kpiId}</span>
                <span className={styles.name}>{tile.title}</span>
              </div>
              <span
                className={cn(
                  "num",
                  styles.value,
                  !highlight && styles.dim,
                )}
              >
                {formatPct(tile.value)}
              </span>
            </li>
          );
        })}
      </ul>
      <span className={styles.live} aria-hidden>
        <span className={styles.dot} />
        Live · FIDS
      </span>
    </div>
  );
}
