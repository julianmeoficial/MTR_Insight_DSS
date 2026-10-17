"use client";

import Link from "next/link";
import type { TrafficLight } from "@/domain/types";
import { GlobalSemaphore } from "@/components/shell/GlobalSemaphore";
import { ThemeLocaleToggles } from "@/components/ui/ThemeLocaleToggles";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import styles from "./TopBar.module.css";

type Props = {
  globalStatus: TrafficLight;
  lastValidated: string;
  asOfDate: string;
  breadcrumb?: string;
};

export function TopBar({
  globalStatus,
  lastValidated,
  asOfDate,
  breadcrumb,
}: Props) {
  const { dict } = usePreferences();
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <Link href="/" className={styles.wordmark}>
          {dict.brand}
        </Link>
        {breadcrumb ? <span className={styles.crumb}>{breadcrumb}</span> : null}
      </div>
      <div className={styles.meta}>
        <ThemeLocaleToggles />
        <p className={`num ${styles.asOf}`}>
          {dict.shell.asOf} {asOfDate} · America/Bogota
        </p>
        <Tooltip label={dict.demo.tooltip}>
          <span>
            <WayfindingTag variant="location">{dict.demo.tag}</WayfindingTag>
          </span>
        </Tooltip>
        <GlobalSemaphore status={globalStatus} lastValidated={lastValidated} />
      </div>
    </header>
  );
}
