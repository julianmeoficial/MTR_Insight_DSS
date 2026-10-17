"use client";

import type { AlertEvent } from "@/domain";
import { StatusPill } from "@/components/ui/StatusPill";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { formatAlertMessage } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "./LandingAlertInbox.module.css";

type Props = {
  alerts: readonly AlertEvent[];
};

function messageFor(
  locale: "es" | "en",
  alert: AlertEvent,
): string {
  if (alert.trigger === "K1_RED_STREAK") {
    const weeksMatch = alert.message.match(/(\d+)\s+consecutive/);
    return formatAlertMessage(locale, "K1_RED_STREAK", {
      weeks: weeksMatch ? Number(weeksMatch[1]) : undefined,
    });
  }
  if (alert.trigger === "SOURCE_NOT_LOADED") {
    const sourceMatch = alert.message.match(/"([^"]+)"/);
    return formatAlertMessage(locale, "SOURCE_NOT_LOADED", {
      source: sourceMatch?.[1] ?? alert.entity,
    });
  }
  return alert.message;
}

function severityTone(severity: AlertEvent["severity"]) {
  if (severity === "red") return "crit" as const;
  if (severity === "yellow") return "warn" as const;
  return "ok" as const;
}

export function LandingAlertInbox({ alerts }: Props) {
  const { dict, locale } = usePreferences();
  const slice = alerts.slice(0, 4);

  return (
    <div className={styles.inbox}>
      <div className={styles.head}>
        <p className={styles.title}>{dict.alerts.inbox}</p>
        <span className={styles.demoTag}>{dict.demo.tag}</span>
      </div>
      <ul className={styles.list}>
        {slice.map((alert) => (
          <li key={alert.id} className={styles.row}>
            <StatusPill
              tone={severityTone(alert.severity)}
              label={
                alert.severity === "red"
                  ? dict.status.crit
                  : dict.status.warn
              }
            />
            <div className={styles.body}>
              <p className={styles.msg}>{messageFor(locale, alert)}</p>
              <p className={styles.meta}>
                {alert.entity} · {formatDateIso(alert.period.end)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
