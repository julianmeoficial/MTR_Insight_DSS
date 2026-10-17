"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { KpiTileModel } from "@/application/dashboard";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import {
  StatusPill,
  trafficLightToTone,
} from "@/components/ui/StatusPill";
import { CountUp } from "@/components/motion/CountUp";
import { formatPct, formatPp } from "@/lib/format";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import styles from "./KpiTile.module.css";

type Props = {
  tile: KpiTileModel;
  index?: number;
  featured?: boolean;
  /** Source and validation line (fixture provenance). */
  provenanceMeta?: string;
};

function statusCopy(
  status: KpiTileModel["status"],
  dict: ReturnType<typeof usePreferences>["dict"],
): string {
  const tone = trafficLightToTone(status);
  if (tone === "ok") return dict.status.ok;
  if (tone === "warn") return dict.status.warn;
  if (tone === "crit") return dict.status.crit;
  return dict.status.nodata;
}

export function KpiTile({
  tile,
  index = 0,
  featured = false,
  provenanceMeta,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const { dict } = usePreferences();
  const statusLabel = statusCopy(tile.status, dict);

  const deltaText =
    tile.deltaPp === null
      ? null
      : `${tile.deltaPp > 0 ? "↑" : tile.deltaPp < 0 ? "↓" : "→"} ${formatPp(tile.deltaPp)}`;

  const deltaTone =
    tile.deltaGood === null
      ? "flat"
      : tile.deltaGood
        ? "good"
        : "bad";

  const formatted = formatPct(tile.value);
  const hasValue = formatted !== "n/d";
  const valueCore = hasValue
    ? formatted.replace(/[\s\u00A0]+%$/, "")
    : formatted;
  const metaLine = provenanceMeta ?? tile.subtitle;

  const content = (
    <>
      <div className={styles.head}>
        <p className={styles.label}>{tile.title}</p>
        <StatusPill tone={trafficLightToTone(tile.status)} label={statusLabel} />
      </div>
      <p className={cn("num", styles.valueRow, featured && styles.valueFeatured)}>
        {hasValue ? (
          <CountUp
            value={tile.value}
            mode="pctCore"
            className={styles.value}
          />
        ) : (
          <span className={styles.value}>{valueCore}</span>
        )}
        {hasValue ? (
          <span className={styles.unit} aria-hidden>
            %
          </span>
        ) : null}
      </p>
      <div className={styles.targetRow}>
        <span className={styles.target}>{tile.targetLabel}</span>
        {deltaText ? (
          <span className={styles.delta} data-tone={deltaTone}>
            {deltaText}
          </span>
        ) : null}
      </div>
      {tile.sparkline.length > 0 ? (
        <Sparkline values={tile.sparkline} status={tile.status} />
      ) : null}
      {metaLine ? <p className={styles.provenance}>{metaLine}</p> : null}
    </>
  );

  const className = cn(styles.tile, featured && styles.featured);

  if (reduced) {
    return (
      <Link href={tile.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={tile.href} className={className}>
        {content}
      </Link>
    </motion.div>
  );
}

function Sparkline({
  values,
  status,
}: {
  values: number[];
  status: KpiTileModel["status"];
}) {
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 0.01);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stroke =
    status === "green"
      ? "var(--ok)"
      : status === "yellow"
        ? "var(--warn)"
        : status === "red"
          ? "var(--crit)"
          : "var(--nodata)";

  const d = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.spark} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        pathLength={1}
        className={styles.sparkDraw}
      />
    </svg>
  );
}
