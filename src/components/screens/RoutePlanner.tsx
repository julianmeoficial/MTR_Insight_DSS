"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAircraft } from "@/config/aircraft";
import {
  evaluateRoute,
  type AirportConstraints,
  type AirportRef,
  type InfraConfig,
  type RouteEvaluation,
  type RouteOpportunity,
  type Verdict,
} from "@/domain/erpm";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { CountUp } from "@/components/motion/CountUp";
import { SplitFlap } from "@/components/aero/SplitFlap";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StagePill } from "@/components/ui/StagePill";
import { StatusPill, type StatusPillTone } from "@/components/ui/StatusPill";
import { fillTemplate } from "@/i18n/dictionaries";
import { formatInt, formatPct } from "@/lib/format";
import views from "./views.module.css";
import styles from "./RoutePlanner.module.css";

type Scope = "national" | "international";

type Props = {
  origin: AirportRef;
  airports: AirportRef[];
  routes: RouteOpportunity[];
  constraints: AirportConstraints;
  canValidate: boolean;
};

const VERDICT_TONE: Record<Verdict, StatusPillTone> = {
  viable: "ok",
  conditional: "warn",
  not_viable: "crit",
  no_data: "nodata",
};

/**
 * Future route planner (P5): proposed and announced routes, national or
 * international, evaluated with the same domain as the validator.
 */
export function RoutePlanner({ origin, airports, routes, constraints, canValidate }: Props) {
  const { dict } = usePreferences();
  const t = dict.routePlanner;
  const tv = dict.validator;
  const [scope, setScope] = useState<Scope>("national");
  const [infra, setInfra] = useState<InfraConfig>("current");
  const [extraFreq, setExtraFreq] = useState(0);

  const airportBy = useMemo(() => new Map(airports.map((a) => [a.iata, a])), [airports]);

  const rows = useMemo(() => {
    const future = routes.filter(
      (r) =>
        r.stage !== "operating" &&
        r.aircraftId !== null &&
        (scope === "national" ? !r.international : r.international),
    );
    return future
      .map((route) => {
        const dest = airportBy.get(route.destination);
        if (!dest || !route.aircraftId) return null;
        const freq = (route.weeklyFrequencies ?? 3) + extraFreq;
        const evaluation: RouteEvaluation = evaluateRoute({
          route,
          aircraftId: route.aircraftId,
          origin: origin.position,
          destination: dest.position,
          airport: constraints,
          infraConfig: infra,
          scenarioId: "base",
          overrides: { weeklyFrequencies: Math.max(1, freq) },
        });
        return { route, dest, evaluation };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.evaluation.distanceKm - b.evaluation.distanceKm);
  }, [airportBy, constraints, extraFreq, infra, origin.position, routes, scope]);

  const counts = (["viable", "conditional", "not_viable", "no_data"] as Verdict[]).map((v) => ({
    v,
    n: rows.filter((r) => r.evaluation.verdict === v).length,
  }));
  const addedPax = rows.reduce(
    (sum, r) =>
      sum +
      Math.min(r.evaluation.weeklyDemandPax ?? 0, r.evaluation.weeklySeats) * 2 * 52,
    0,
  );

  return (
    <section className={styles.root} aria-labelledby="route-planner-title">
      <div className={views.sectionHead}>
        <div>
          <h2 id="route-planner-title" className={views.sectionTitle}>
            {t.title}
          </h2>
          <p className={views.hint}>{t.hint}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <SegmentedControl
          ariaLabel={t.scopeAria}
          value={scope}
          onChange={setScope}
          options={[
            { value: "national", label: t.national },
            { value: "international", label: t.international },
          ]}
        />
        <SegmentedControl
          ariaLabel={tv.infra}
          value={infra}
          onChange={setInfra}
          options={[
            { value: "current", label: tv.infraCurrent },
            { value: "expansion", label: tv.infraExpansion },
          ]}
        />
        <label className={styles.freq}>
          <span>{t.extraFreq}</span>
          <input
            type="range"
            min={-1}
            max={4}
            step={1}
            value={extraFreq}
            onChange={(e) => setExtraFreq(Number(e.target.value))}
          />
          <span className={styles.freqValue}>
            {extraFreq > 0 ? `+${extraFreq}` : extraFreq}
          </span>
        </label>
      </div>

      <div className={styles.summary}>
        {counts.map(({ v, n }) => (
          <div key={v} className={styles.summaryCell}>
            <StatusPill tone={VERDICT_TONE[v]} label={tv.verdicts[v]} />
            <span className={styles.summaryValue}>
              <CountUp value={n} mode="int" />
            </span>
          </div>
        ))}
        <div className={styles.summaryCell}>
          <span className={views.statLabel}>{t.addedPax}</span>
          <span className={styles.summaryValue}>
            <CountUp value={addedPax} mode="int" />
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={views.hint}>{t.empty}</p>
      ) : (
        <ul className={styles.list}>
          {rows.map(({ route, dest, evaluation: e }, i) => {
            const aircraft = getAircraft(e.aircraftId);
            const rwy = constraints.runways.find((r) => r.id === e.runwayId);
            return (
              <li key={route.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <p className={styles.route}>
                    <span className={views.code}>{origin.iata}</span>
                    <span className={views.arrow} aria-hidden>
                      →
                    </span>
                    <SplitFlap className={views.code} text={route.destination} delay={i * 0.04} />
                    <span className={styles.city}>{dest.city}</span>
                  </p>
                  <StatusPill tone={VERDICT_TONE[e.verdict]} label={tv.verdicts[e.verdict]} />
                </div>
                <p className={styles.note}>{route.note}</p>
                <dl className={styles.facts}>
                  <div>
                    <dt>{tv.distance}</dt>
                    <dd>{formatInt(e.distanceKm)} km</dd>
                  </div>
                  <div>
                    <dt>{t.aircraft}</dt>
                    <dd>{aircraft.label}</dd>
                  </div>
                  <div>
                    <dt>{t.frequencies}</dt>
                    <dd>{fillTemplate(t.perWeek, { n: e.weeklyFrequencies })}</dd>
                  </div>
                  <div>
                    <dt>{tv.projectedLf}</dt>
                    <dd>
                      <CountUp value={e.projectedLoadFactor} mode="pct" />
                    </dd>
                  </div>
                  <div>
                    <dt>{tv.breakEven}</dt>
                    <dd>
                      {e.breakEvenStatus === "infeasible" ? tv.infeasible : formatPct(e.breakEvenLoadFactor)}
                    </dd>
                  </div>
                  <div>
                    <dt>{tv.assigned}</dt>
                    <dd>
                      RWY {rwy?.designator} · {e.terminalId}
                    </dd>
                  </div>
                </dl>
                <div className={styles.cardFoot}>
                  <StagePill stage={route.stage} label={dict.stage[route.stage]} />
                  {canValidate ? (
                    <Link
                      href={`/validador?ruta=${route.id}&aeronave=${e.aircraftId}${infra === "expansion" ? "&infra=expansion" : ""}`}
                      className={styles.evaluate}
                    >
                      {t.evaluate}
                      <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className={views.disclaimer}>{t.disclaimer}</p>
    </section>
  );
}
