import {
  CircleCheck,
  CircleDashed,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import type { TrafficLight } from "@/domain/types";
import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  StatusPill,
  trafficLightToTone,
  type StatusPillTone,
} from "@/components/ui/StatusPill";
import styles from "./StatusBadge.module.css";

type Props = {
  status: TrafficLight;
  className?: string;
  /** Override visible label (defaults to Spanish status copy). */
  label?: string;
};

/** @deprecated Prefer StatusPill with dictionary labels in new UI. */
export function StatusBadge({ status, className, label }: Props) {
  return (
    <StatusPill
      tone={trafficLightToTone(status)}
      label={label ?? statusLabel(status)}
      className={cn(className)}
    />
  );
}

const GLYPH_ICON: Record<
  StatusPillTone,
  typeof CircleCheck
> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  crit: OctagonAlert,
  nodata: CircleDashed,
};

export function StatusGlyph({ status }: { status: TrafficLight }) {
  const tone = trafficLightToTone(status);
  const Icon = GLYPH_ICON[tone];
  return (
    <Icon
      className={styles.glyph}
      data-tone={tone}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

/** Legacy list accent; avoid on new surfaces (DESIGN bans colored left borders). */
export function statusBarClass(status: TrafficLight): string {
  if (status === "green") return styles.barOk!;
  if (status === "yellow") return styles.barWarn!;
  if (status === "red") return styles.barCrit!;
  return styles.barNodata!;
}
