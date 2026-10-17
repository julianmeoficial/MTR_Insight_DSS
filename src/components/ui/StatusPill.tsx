import {
  CircleCheck,
  CircleDashed,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { TrafficLight } from "@/domain/types";
import { cn } from "@/lib/cn";
import styles from "./StatusPill.module.css";

export type StatusPillTone = "ok" | "warn" | "crit" | "nodata";

const ICONS: Record<StatusPillTone, LucideIcon> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  crit: OctagonAlert,
  nodata: CircleDashed,
};

type Props = {
  tone: StatusPillTone;
  label: string;
  className?: string;
};

export function trafficLightToTone(status: TrafficLight): StatusPillTone {
  if (status === "green") return "ok";
  if (status === "yellow") return "warn";
  if (status === "red") return "crit";
  return "nodata";
}

export function StatusPill({ tone, label, className }: Props) {
  const Icon = ICONS[tone];
  return (
    <span
      className={cn(styles.pill, className)}
      data-tone={tone}
      role="status"
    >
      <Icon className={styles.icon} strokeWidth={1.5} aria-hidden />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
