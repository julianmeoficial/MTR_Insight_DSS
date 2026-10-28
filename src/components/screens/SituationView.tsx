"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getAircraft } from "@/config/aircraft";
import {
  greatCircleKm,
  type AirportRef,
  type ErpmDataItem,
  type EvidenceStage,
  type Modernization,
  type RouteOpportunity,
  type SourceRef,
} from "@/domain/erpm";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { StagePill } from "@/components/ui/StagePill";
import { Kbd } from "@/components/ui/Kbd";
import { CountUp } from "@/components/motion/CountUp";
import { SplitFlap } from "@/components/aero/SplitFlap";
import { useListKeys } from "@/hooks/useListKeys";
import { useQueryWriter } from "@/hooks/useQueryState";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatDateIso, formatInt } from "@/lib/format";
import styles from "./views.module.css";

type Props = {
  cutoffDate: string;
  origin: AirportRef;
  airports: AirportRef[];
  routes: RouteOpportunity[];
  modernizations: Modernization[];
  erpmData: ErpmDataItem[];
  initialRouteId?: string;
  canValidate: boolean;
};

const STAGE_ORDER: readonly EvidenceStage[] = [
  "operating",
  "confirmed",
  "announced",
  "negotiating",
  "proposed",
  "to_verify",
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** "2026-12" → "dic 2026"; full ISO dates use the short date format. */
function formatStart(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return formatDateIso(`${value}-01`).replace(/^1\s/, "");
  }
  return formatDateIso(value);
}

export function SituationView({
  cutoffDate,
  origin,
  airports,
  routes,
  modernizations,
  erpmData,
  initialRouteId,
  canValidate,
}: Props) {
  const { dict } = usePreferences();
  const t = dict.situation;
  const reduced = usePrefersReducedMotion();
  const writeQuery = useQueryWriter();

  const airportBy = useMemo(
    () => new Map(airports.map((a) => [a.iata, a])),
    [airports],
  );
  const ordered = useMemo(
    () =>
      [...routes].sort(
        (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
      ),
    [routes],
  );
  const ids = useMemo(() => ordered.map((r) => r.id), [ordered]);

  const [selectedId, setSelectedId] = useState<string>(
    initialRouteId && ids.includes(initialRouteId) ? initialRouteId : (ids[0] ?? ""),
  );
  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      writeQuery({ ruta: id });
    },
    [writeQuery],
  );
  useListKeys(ids, selectedId, select);

  const selected = ordered.find((r) => r.id === selectedId) ?? null;
  const counts = STAGE_ORDER.map((stage) => ({
    stage,
    n: routes.filter((r) => r.stage === stage).length,
  })).filter((c) => c.n > 0);
  const gaps = erpmData.filter((d) => d.value === null).length;

  function sourceLine(ref: SourceRef) {
    return (
      <>
        <span>{ref.source}</span>
        <span className={styles.dot} aria-hidden>
          ·
        </span>
        <span className="num">{ref.date ? formatDateIso(ref.date) : t.noValue}</span>
        <span className={styles.dot} aria-hidden>
          ·
        </span>
        <span>
          {dict.confidence.label} {dict.confidence[ref.confidence].toLowerCase()}
        </span>
      </>
    );
  }

  return (
    <>
      <section className={styles.statStrip} aria-label={t.routesTitle}>
        {counts.map(({ stage, n }) => (
          <div key={stage} className={styles.stat}>
            <span className={styles.statLabel}>{dict.stage[stage]}</span>
            <span className={styles.statValue}>
              <CountUp value={n} mode="int" />
            </span>
          </div>
        ))}
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t.gapsLabel}</span>
          <span className={styles.statValue} data-muted="true">
            {gaps}
            <span className={styles.unit}>/ {erpmData.length}</span>
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>{t.routesTitle}</h2>
            <p className={styles.hint}>{t.routesHint}</p>
          </div>
          <p className={styles.meta}>
            <Kbd>J</Kbd> <Kbd>K</Kbd> · {t.cutoff}{" "}
            <span className="num">{formatDateIso(cutoffDate)}</span>
          </p>
        </div>
      </section>

      <div className={styles.split}>
        <div className={styles.listPane} role="listbox" aria-label={t.routesTitle}>
          {ordered.map((route, rowIndex) => {
            const dest = airportBy.get(route.destination);
            const active = route.id === selectedId;
            return (
              <button
                key={route.id}
                type="button"
                role="option"
                aria-selected={active}
                className={styles.listRow}
                onClick={() => select(route.id)}
              >
                {active ? (
                  <motion.span
                    layoutId={reduced ? undefined : "situation-row"}
                    className={styles.listRowSelected}
                    transition={{ duration: 0.24, ease: EASE }}
                    aria-hidden
                  />
                ) : null}
                <span className={styles.listRowBody}>
                  <span className={styles.listRowTitle}>
                    <span className={styles.code}>
                      {origin.iata} →{" "}
                      <SplitFlap text={route.destination} delay={rowIndex * 0.05} />
                    </span>
                    <span>{dest?.city ?? route.destination}</span>
                  </span>
                  <span className={styles.listRowMeta}>
                    {route.airline ?? t.undefinedValue}
                    {route.aircraftId ? ` · ${getAircraft(route.aircraftId).label}` : ""}
                    {" · "}
                    {route.international ? t.international : t.domestic}
                  </span>
                </span>
                <span className={styles.listRowEnd}>
                  <StagePill stage={route.stage} label={dict.stage[route.stage]} />
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.detailPane} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.article
                key={selected.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={styles.detailInner}
              >
                <RouteDetail
                  route={selected}
                  origin={origin}
                  destination={airportBy.get(selected.destination)}
                  canValidate={canValidate}
                  sourceLine={sourceLine}
                />
              </motion.article>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <section className={styles.section}>
        <div>
          <h2 className={styles.sectionTitle}>{t.modernizationsTitle}</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t.project}</th>
                <th scope="col">{t.area}</th>
                <th scope="col">{t.effect}</th>
                <th scope="col">{t.source}</th>
                <th scope="col">{t.date}</th>
                <th scope="col">{t.stageLabel}</th>
              </tr>
            </thead>
            <tbody>
              {modernizations.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={styles.codeMuted}>{m.id}</span>
                    <br />
                    {m.title}
                  </td>
                  <td className={styles.cellMuted}>{t.areas[m.area]}</td>
                  <td className={styles.cellMuted}>{m.expectedEffect}</td>
                  <td className={styles.cellMuted}>{m.evidence.source}</td>
                  <td className={`num ${styles.cellMuted}`}>
                    {m.evidence.date ? formatDateIso(m.evidence.date) : t.noValue}
                  </td>
                  <td>
                    <StagePill stage={m.stage} label={dict.stage[m.stage]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div>
          <h2 className={styles.sectionTitle}>{t.erpmTitle}</h2>
          <p className={styles.hint}>{t.erpmHint}</p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t.variable}</th>
                <th scope="col">{t.value}</th>
                <th scope="col">{t.unit}</th>
                <th scope="col">{t.source}</th>
                <th scope="col">{dict.confidence.label}</th>
                <th scope="col">{t.owner}</th>
                <th scope="col">{t.usedFor}</th>
              </tr>
            </thead>
            <tbody>
              {erpmData.map((d) => (
                <tr key={d.id}>
                  <td>{d.variable}</td>
                  <td className="num">
                    {d.value ?? <em className={styles.gap}>{t.noValue}</em>}
                  </td>
                  <td className={styles.cellMuted}>{d.unit}</td>
                  <td className={styles.cellMuted}>{d.evidence.source}</td>
                  <td className={styles.cellMuted}>
                    {dict.confidence[d.evidence.confidence]}
                  </td>
                  <td className={styles.cellMuted}>{d.owner}</td>
                  <td className={styles.cellMuted}>{d.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function RouteDetail({
  route,
  origin,
  destination,
  canValidate,
  sourceLine,
}: {
  route: RouteOpportunity;
  origin: AirportRef;
  destination: AirportRef | undefined;
  canValidate: boolean;
  sourceLine: (ref: SourceRef) => React.ReactNode;
}) {
  const { dict } = usePreferences();
  const t = dict.situation;
  const distance = destination
    ? greatCircleKm(origin.position, destination.position)
    : null;

  return (
    <>
      <header className={styles.detailHead}>
        <div>
          <h2 className={styles.detailTitle}>
            <span className={styles.code}>{origin.iata}</span>
            <span className={styles.arrow} aria-hidden>
              →
            </span>
            <SplitFlap className={styles.code} text={route.destination} />
          </h2>
          <p className={styles.detailSub}>
            {destination ? `${destination.city}, ${destination.country}` : route.destination}
            {" · "}
            {route.international ? t.international : t.domestic}
          </p>
        </div>
        <StagePill stage={route.stage} label={dict.stage[route.stage]} />
      </header>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>{t.airline}</dt>
          <dd>{route.airline ?? t.undefinedValue}</dd>
        </div>
        <div className={styles.fact}>
          <dt>{t.aircraft}</dt>
          <dd>
            {route.aircraftId ? getAircraft(route.aircraftId).label : t.undefinedValue}
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>{t.frequencies}</dt>
          <dd>
            {route.weeklyFrequencies === null
              ? t.noValue
              : `${route.weeklyFrequencies} ${t.perWeek}`}
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>{t.start}</dt>
          <dd>{route.start ? formatStart(route.start) : t.noValue}</dd>
        </div>
        <div className={styles.fact}>
          <dt>{dict.validator.distance}</dt>
          <dd>{distance === null ? t.noValue : `${formatInt(distance)} km`}</dd>
        </div>
        <div className={styles.fact}>
          <dt>{t.demand}</dt>
          <dd>
            {route.weeklyDemandPax === null ? (
              t.noValue
            ) : (
              <>
                {formatInt(route.weeklyDemandPax)}
                {route.demandIsAssumption ? (
                  <span className={styles.assumption}>{t.assumption}</span>
                ) : null}
              </>
            )}
          </dd>
        </div>
      </dl>

      <p className={styles.note}>{route.note}</p>

      {canValidate && route.weeklyDemandPax !== null ? (
        <Link href={`/validador?ruta=${route.id}`} className={styles.inlineLink}>
          {t.openInValidator}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
        </Link>
      ) : null}

      <p className={styles.provenance}>{sourceLine(route.evidence)}</p>
    </>
  );
}
