"use client";

import type { TrafficLight } from "@/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CountUp } from "@/components/motion/CountUp";
import { SettleReveal } from "@/components/motion/SettleReveal";
import styles from "./KpiHero.module.css";

type Props = {
  value: number | null;
  status: TrafficLight;
  label: string;
  vsBreakEvenPp: number | null;
};

export function KpiHero({ value, status, label, vsBreakEvenPp }: Props) {
  return (
    <section className={styles.hero}>
      <p className={styles.label}>{label}</p>
      <div className={styles.row}>
        <p className={`num ${styles.value}`}>
          <CountUp value={value} mode="pct" />
        </p>
        <SettleReveal>
          <StatusBadge status={status} />
        </SettleReveal>
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
