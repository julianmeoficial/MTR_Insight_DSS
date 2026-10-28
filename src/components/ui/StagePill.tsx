import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  Handshake,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { EvidenceStage } from "@/domain/erpm";
import { cn } from "@/lib/cn";
import styles from "./StagePill.module.css";

const ICONS: Record<EvidenceStage, LucideIcon> = {
  operating: CircleCheck,
  confirmed: BadgeCheck,
  announced: Megaphone,
  negotiating: Handshake,
  proposed: CircleDashed,
  to_verify: CircleHelp,
};

type Props = {
  stage: EvidenceStage;
  label: string;
  className?: string;
};

/** Evidence stage (Paso 13 §3). Glyph + label, never color alone. */
export function StagePill({ stage, label, className }: Props) {
  const Icon = ICONS[stage];
  return (
    <span className={cn(styles.pill, className)} data-stage={stage}>
      <Icon className={styles.icon} strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
