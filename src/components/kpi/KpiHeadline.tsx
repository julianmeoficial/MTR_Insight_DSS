import type { TrafficLight } from "@/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPct } from "@/lib/format";
import { CountUp } from "@/components/motion/CountUp";
import { SettleReveal } from "@/components/motion/SettleReveal";
import styles from "./KpiHeadline.module.css";

type Props = {
  code: string;
  label: string;
  value: number | null;
  status: TrafficLight;
  children?: React.ReactNode;
};

/** Screen-level KPI: code chip, value with smaller unit, status, one meta line. */
export function KpiHeadline({ code, label, value, status, children }: Props) {
  const formatted = formatPct(value);
  const core = formatted.replace(/[\s ]+%$/, "");
  const hasUnit = core !== formatted;

  return (
    <section className={styles.root} aria-label={`${code} ${label}`}>
      <p className={styles.label}>
        <span className={styles.code}>{code}</span>
        {label}
      </p>
      <div className={styles.row}>
        <p className={styles.value}>
          {hasUnit ? <CountUp value={value} mode="pctCore" /> : core}
          {hasUnit ? <span className={styles.unit}>%</span> : null}
        </p>
        <SettleReveal>
          <StatusBadge status={status} />
        </SettleReveal>
      </div>
      {children ? <div className={styles.meta}>{children}</div> : null}
    </section>
  );
}
