"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useListKeys } from "@/hooks/useListKeys";
import { Kbd } from "@/components/ui/Kbd";
import type { AlertEvent } from "@/domain";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Row } from "@/components/ui/Row";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { formatAlertMessage } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import styles from "./AlertList.module.css";

type Props = {
  alerts: readonly AlertEvent[];
  /** Enable J / K row navigation (only one list per screen). */
  keyboard?: boolean;
};

/** Screen that explains each trigger; codes stay out of navigation. */
const TRIGGER_HREF: Record<AlertEvent["trigger"], string> = {
  K1_RED_STREAK: "/p2",
  SOURCE_NOT_LOADED: "/p7",
};

function localizeMessage(
  locale: "es" | "en",
  alert: AlertEvent,
): string {
  if (alert.trigger === "K1_RED_STREAK") {
    const weeksMatch = alert.message.match(/(\d+)\s+consecutive/);
    const weeks = weeksMatch ? Number(weeksMatch[1]) : undefined;
    return formatAlertMessage(locale, "K1_RED_STREAK", { weeks });
  }
  if (alert.trigger === "SOURCE_NOT_LOADED") {
    const sourceMatch = alert.message.match(/"([^"]+)"/);
    return formatAlertMessage(locale, "SOURCE_NOT_LOADED", {
      source: sourceMatch?.[1] ?? alert.entity,
    });
  }
  return alert.message;
}

export function AlertList({ alerts, keyboard = false }: Props) {
  const { dict, locale } = usePreferences();
  const [selectedId, setSelectedId] = useState<string | null>(
    alerts[0]?.id ?? null,
  );

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) ?? null,
    [alerts, selectedId],
  );

  const grouped = useMemo(() => {
    const red = alerts.filter((a) => a.severity === "red");
    const yellow = alerts.filter((a) => a.severity === "yellow");
    return { red, yellow };
  }, [alerts]);

  const orderedIds = useMemo(
    () => [...grouped.red, ...grouped.yellow].map((a) => a.id),
    [grouped],
  );
  useListKeys(orderedIds, selectedId, setSelectedId, keyboard);

  if (alerts.length === 0) {
    return (
      <EmptyState title={dict.alerts.empty} body={dict.alerts.empty} />
    );
  }

  return (
    <div className={styles.split}>
      <div className={styles.listPane}>
        {grouped.red.length > 0 ? (
          <section className={styles.group}>
            <h3 className={styles.groupTitle}>{dict.status.crit}</h3>
            <ul className={styles.list}>
              {grouped.red.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  message={localizeMessage(locale, alert)}
                  active={alert.id === selectedId}
                  onSelect={() => setSelectedId(alert.id)}
                  dict={dict}
                />
              ))}
            </ul>
          </section>
        ) : null}
        {grouped.yellow.length > 0 ? (
          <section className={styles.group}>
            <h3 className={styles.groupTitle}>{dict.status.warn}</h3>
            <ul className={styles.list}>
              {grouped.yellow.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  message={localizeMessage(locale, alert)}
                  active={alert.id === selectedId}
                  onSelect={() => setSelectedId(alert.id)}
                  dict={dict}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <aside className={styles.detail} aria-label={dict.alerts.detail}>
        {selected ? (
          <>
            <StatusPill
              tone={selected.severity === "red" ? "crit" : "warn"}
              label={
                selected.severity === "red" ? dict.status.crit : dict.status.warn
              }
            />
            <p className={styles.detailMessage}>
              {localizeMessage(locale, selected)}
            </p>
            <dl className={styles.meta}>
              <div>
                <dt>{dict.alerts.trigger}</dt>
                <dd className="num">{selected.trigger}</dd>
              </div>
              <div>
                <dt>{dict.alerts.entity}</dt>
                <dd className="num">{selected.entity}</dd>
              </div>
              <div>
                <dt>{dict.alerts.owner}</dt>
                <dd>{selected.owner}</dd>
              </div>
              <div>
                <dt>{dict.alerts.period}</dt>
                <dd className="num">
                  {selected.period.start} a {selected.period.end}
                </dd>
              </div>
            </dl>
            <Link href={TRIGGER_HREF[selected.trigger]} className={styles.open}>
              {dict.alerts.openView}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Link>
            <p className={styles.locked}>
              {dict.alerts.workflowLocked}
              {keyboard ? (
                <span className={styles.keys}>
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd>
                </span>
              ) : null}
            </p>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function AlertRow({
  alert,
  message,
  active,
  onSelect,
  dict,
}: {
  alert: AlertEvent;
  message: string;
  active: boolean;
  onSelect: () => void;
  dict: ReturnType<typeof usePreferences>["dict"];
}) {
  return (
    <li>
      <Row
        selected={active}
        onClick={onSelect}
        className={cn(styles.row)}
        title={message}
        meta={alert.owner}
        code={alert.kpiId ?? alert.trigger}
        status={
          <StatusPill
            tone={alert.severity === "red" ? "crit" : "warn"}
            label={
              alert.severity === "red" ? dict.status.crit : dict.status.warn
            }
          />
        }
      />
    </li>
  );
}
