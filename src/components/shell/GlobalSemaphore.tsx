import Link from "next/link";
import type { TrafficLight } from "@/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./GlobalSemaphore.module.css";

type Props = {
  status: TrafficLight;
  lastValidated: string;
};

export function GlobalSemaphore({ status, lastValidated }: Props) {
  return (
    <Link
      href="/p7"
      className={styles.link}
      title="Abrir calidad del dato (P7)"
    >
      <span>Semáforo</span>
      <StatusBadge status={status} />
      <span className={`num ${styles.date}`}>{lastValidated}</span>
    </Link>
  );
}
