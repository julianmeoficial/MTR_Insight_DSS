"use client";

import { THRESHOLDS_VERSION } from "@/config/thresholds";
import { ALERT_POLICIES_VERSION } from "@/config/alert-policies";
import { ERPM_SCENARIOS_VERSION } from "@/config/erpm-scenarios";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Kbd } from "@/components/ui/Kbd";
import type { RoleId } from "@/config/access-matrix";
import styles from "./StatusBar.module.css";

type Props = {
  role: RoleId;
  dataset: string;
  source: string;
  verificationStatus: string;
  asOfDate: string;
  onShortcuts: () => void;
};

/**
 * System status line: what data and rule versions the screen is reading.
 * Static facts only; it never claims a live connection.
 */
export function StatusBar({
  role,
  dataset,
  source,
  verificationStatus,
  asOfDate,
  onShortcuts,
}: Props) {
  const { dict } = usePreferences();
  const t = dict.statusBar;

  return (
    <footer className={styles.bar} aria-label={t.label}>
      <span className={styles.item}>
        <span className={styles.dot} data-status={verificationStatus} aria-hidden />
        {t.source} <span className={styles.value}>{source}</span>
        <span className={styles.value}>{dataset}</span>
      </span>
      <span className={styles.item} data-optional="true">
        {t.rules}
        <span className={styles.value}>KPI {THRESHOLDS_VERSION}</span>
        <span className={styles.value}>PG {ALERT_POLICIES_VERSION}</span>
        <span className={styles.value}>{ERPM_SCENARIOS_VERSION}</span>
      </span>
      <span className={styles.spacer} />
      <span className={styles.item} data-optional="true">
        {t.asOf} <span className={styles.value}>{asOfDate}</span>
        <span className={styles.value}>America/Bogota</span>
      </span>
      <span className={styles.item}>{dict.access.roles[role]}</span>
      <button type="button" className={styles.shortcuts} onClick={onShortcuts}>
        {dict.shell.shortcuts} <Kbd>?</Kbd>
      </button>
    </footer>
  );
}
