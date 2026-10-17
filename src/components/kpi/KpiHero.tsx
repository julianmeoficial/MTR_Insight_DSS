"use client";

import type { TrafficLight } from "@/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/cn";
import styles from "./KpiHero.module.css";

type Props = {
  value: number | null;
  status: TrafficLight;
  label: string;
  vsBreakEvenPp: number | null;
};

function barClass(status: TrafficLight): string {
  if (status === "green") return styles.barOk!;
  if (status === "yellow") return styles.barWarn!;
  if (status === "red") return styles.barCrit!;
  return styles.barNodata!;
}

export function KpiHero({ value, status, label, vsBreakEvenPp }: Props) {
  return (
    <section className={styles.hero}>
      <span className={cn(styles.bar, barClass(status))} aria-hidden />
      <p className={styles.label}>{label}</p>
      <div className={styles.row}>
        <p className={`num ${styles.value}`}>
          <CountUp value={value} mode="pct" />
        </p>
        <StatusBadge status={status} />
      </div>
      <p className={styles.meta}>
        Frente a equilibrio 70 %:{" "}
        <span className="num">
          {vsBreakEvenPp === null ? (
            "n/d"
          ) : (
            <CountUp value={vsBreakEvenPp} mode="pp" />
          )}
        </span>
      </p>
    </section>
  );
}
