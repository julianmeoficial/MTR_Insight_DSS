"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AIRCRAFT_CATALOG,
  CODE_LETTER_ORDER,
  getAircraft,
  type AircraftId,
} from "@/config/aircraft";
import {
  ERPM_SCENARIOS,
  ERPM_SCENARIOS_VERSION,
  ERPM_SCENARIO_ORDER,
  type ErpmScenarioId,
} from "@/config/erpm-scenarios";
import {
  evaluateRoute,
  requiredRunwayM,
  resolveScenario,
  routeSensitivity,
  scenarioDeltas,
  type ScenarioOverrides,
  type ApproachCategory,
  type InfraConfig,
  type TerminalChoice,
  type AirportConstraints,
  type AirportRef,
  type CheckOutcome,
  type FeasibilityCheck,
  type RouteEvaluation,
  type RouteOpportunity,
  type ScenarioDelta,
  type Verdict,
} from "@/domain/erpm";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StagePill } from "@/components/ui/StagePill";
import { StatusPill, type StatusPillTone } from "@/components/ui/StatusPill";
import { useQueryWriter } from "@/hooks/useQueryState";
import { CountUp } from "@/components/motion/CountUp";
import { fillTemplate } from "@/i18n/dictionaries";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  AssumptionsPanel,
  type AssumptionField,
} from "@/components/screens/validator/AssumptionsPanel";
import { Tornado } from "@/components/screens/validator/Tornado";
import { AerodromeDiagram } from "@/components/aero/AerodromeDiagram";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatInt, formatNumber, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";
import views from "./views.module.css";
import styles from "./ValidatorView.module.css";

type Perspective = "airport" | "airline";

type Props = {
  origin: AirportRef;
  airports: AirportRef[];
  routes: RouteOpportunity[];
  constraints: AirportConstraints;
  sources: { runway: string; capacity: string };
  initial: {
    routeId?: string;
    aircraftId?: string;
    scenarioId?: string;
    perspective?: string;
    infra?: string;
  };
};

const EASE = [0.16, 1, 0.3, 1] as const;

const PASSENGER_AIRCRAFT = AIRCRAFT_CATALOG.filter((a) => a.mode === "passenger");

const VERDICT_TONE: Record<Verdict, StatusPillTone> = {
  viable: "ok",
  conditional: "warn",
  not_viable: "crit",
  no_data: "nodata",
};

const OUTCOME_TONE: Record<CheckOutcome, StatusPillTone> = {
  pass: "ok",
  tight: "warn",
  fail: "crit",
  no_data: "nodata",
};

const CHECK_ORDER: Record<Perspective, FeasibilityCheck["id"][]> = {
  airport: [
    "runway",
    "runway_width",
    "pavement",
    "approach",
    "arff",
    "terminal_fit",
    "terminal",
    "break_even",
    "demand",
    "range",
  ],
  airline: [
    "demand",
    "range",
    "break_even",
    "runway",
    "runway_width",
    "pavement",
    "approach",
    "arff",
    "terminal_fit",
    "terminal",
  ],
};

const APPROACHES: readonly ApproachCategory[] = ["NPA", "CAT_I", "CAT_II", "CAT_III"];

const TERMINAL_OPTIONS: readonly TerminalChoice[] = ["auto", "T1", "T2"];

function isScenario(v: string | undefined): v is ErpmScenarioId {
  return v === "base" || v === "favorable" || v === "restrictive";
}

function isAircraft(v: string | undefined): v is AircraftId {
  return PASSENGER_AIRCRAFT.some((a) => a.id === v);
}

function formatDelta(delta: ScenarioDelta): string {
  if (delta.key === "revenuePerPax" || delta.key === "costPerFlight") {
    const change = delta.value / delta.base - 1;
    return `${change > 0 ? "+" : ""}${formatPct(change)}`;
  }
  if (delta.key === "rangeReserve") return formatPct(delta.value);
  return `×${formatNumber(delta.value, { maximumFractionDigits: 2 })}`;
}

type AirportEditKey =
  | "rwy2Length"
  | "rwy2Width"
  | "rwy2Pcn"
  | "rwy2Approach"
  | "t1Capacity"
  | "t2Capacity"
  | "arffExpansion";

type AirportEdits = Partial<Record<AirportEditKey, number | null>>;

const AIRPORT_KEYS: readonly string[] = [
  "rwy2Length",
  "rwy2Width",
  "rwy2Pcn",
  "rwy2Approach",
  "t1Capacity",
  "t2Capacity",
  "arffExpansion",
];

function positive(v: number | null | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
}

const EMPTY_EDITS: Record<ErpmScenarioId, ScenarioOverrides> = {
  base: {},
  favorable: {},
  restrictive: {},
};

export function ValidatorView({
  origin,
  airports,
  routes,
  constraints,
  sources,
  initial,
}: Props) {
  const { dict } = usePreferences();
  const t = dict.validator;
  const reduced = usePrefersReducedMotion();
  const writeQuery = useQueryWriter();

  const airportBy = useMemo(
    () => new Map(airports.map((a) => [a.iata, a])),
    [airports],
  );
  const firstRoute = routes.find((r) => r.weeklyDemandPax !== null) ?? routes[0];

  const [perspective, setPerspective] = useState<Perspective>(
    initial.perspective === "airline" ? "airline" : "airport",
  );
  const [scenarioId, setScenarioId] = useState<ErpmScenarioId>(
    isScenario(initial.scenarioId) ? initial.scenarioId : "base",
  );
  const initialRoute =
    routes.find((r) => r.id === initial.routeId) ?? firstRoute;
  const [routeId, setRouteId] = useState<string>(initialRoute?.id ?? "");
  const [aircraftId, setAircraftId] = useState<AircraftId>(
    isAircraft(initial.aircraftId)
      ? initial.aircraftId
      : (initialRoute?.aircraftId ?? "E145"),
  );

  const [airportEdits, setAirportEdits] = useState<AirportEdits>({});
  const [scenarioEdits, setScenarioEdits] =
    useState<Record<ErpmScenarioId, ScenarioOverrides>>(EMPTY_EDITS);

  const [infraConfig, setInfraConfig] = useState<InfraConfig>(
    initial.infra === "expansion" ? "expansion" : "current",
  );
  const [terminalChoice, setTerminalChoice] = useState<TerminalChoice>("auto");

  const baseRwy2 = constraints.runways.find((r) => r.id === "RWY2")!;
  const baseT1 = constraints.terminals.find((t) => t.id === "T1")!;
  const baseT2 = constraints.terminals.find((t) => t.id === "T2")!;

  /** Infrastructure edits apply to every scenario (expansion project). */
  const airport = useMemo<AirportConstraints>(() => {
    const e = airportEdits;
    const approachIdx = e.rwy2Approach;
    return {
      ...constraints,
      runways: constraints.runways.map((r) =>
        r.id !== "RWY2"
          ? r
          : {
              ...r,
              lengthM: positive(e.rwy2Length, r.lengthM),
              widthM: positive(e.rwy2Width, r.widthM),
              pcn: positive(e.rwy2Pcn, r.pcn ?? 0) || r.pcn,
              approach:
                typeof approachIdx === "number" && APPROACHES[approachIdx]
                  ? APPROACHES[approachIdx]!
                  : r.approach,
            },
      ),
      terminals: constraints.terminals.map((t) =>
        t.id === "T1"
          ? { ...t, annualCapacity: positive(e.t1Capacity, t.annualCapacity) }
          : { ...t, annualCapacity: positive(e.t2Capacity, t.annualCapacity) },
      ),
      arffCategory: {
        ...constraints.arffCategory,
        expansion: positive(e.arffExpansion, constraints.arffCategory.expansion),
      },
    };
  }, [airportEdits, constraints]);

  const longestRunway = Math.max(
    ...airport.runways
      .filter((r) => infraConfig === "expansion" || r.status === "existing")
      .map((r) => r.lengthM),
  );

  /** All three scenarios for every cell, so the matrix can mark changes. */
  const grid = useMemo(() => {
    const map = new Map<string, Record<ErpmScenarioId, RouteEvaluation>>();
    for (const route of routes) {
      const dest = airportBy.get(route.destination);
      if (!dest) continue;
      for (const aircraft of PASSENGER_AIRCRAFT) {
        const byScenario = {} as Record<ErpmScenarioId, RouteEvaluation>;
        for (const id of ERPM_SCENARIO_ORDER) {
          byScenario[id] = evaluateRoute({
            route,
            aircraftId: aircraft.id,
            origin: origin.position,
            destination: dest.position,
            airport,
            infraConfig,
            terminal: terminalChoice,
            scenarioId: id,
            overrides: scenarioEdits[id],
          });
        }
        map.set(`${route.id}:${aircraft.id}`, byScenario);
      }
    }
    return map;
  }, [airport, airportBy, infraConfig, origin.position, routes, scenarioEdits, terminalChoice]);

  const selectCell = useCallback(
    (nextRoute: string, nextAircraft: AircraftId) => {
      setRouteId(nextRoute);
      setAircraftId(nextAircraft);
      writeQuery({ ruta: nextRoute, aeronave: nextAircraft });
    },
    [writeQuery],
  );

  const selectedRoute = routes.find((r) => r.id === routeId) ?? null;
  const selected = grid.get(`${routeId}:${aircraftId}`) ?? null;
  const current = selected?.[scenarioId] ?? null;
  const deltas = scenarioDeltas(scenarioId);
  const active = resolveScenario(scenarioId, scenarioEdits[scenarioId]);
  const preset = ERPM_SCENARIOS[scenarioId];
  const edits = scenarioEdits[scenarioId];

  const sensitivity = useMemo(() => {
    const dest = selectedRoute ? airportBy.get(selectedRoute.destination) : undefined;
    if (!selectedRoute || !dest) return { baseline: null, bars: [] };
    return routeSensitivity({
      route: selectedRoute,
      aircraftId,
      origin: origin.position,
      destination: dest.position,
      airport,
      infraConfig,
      terminal: terminalChoice,
      scenarioId,
      overrides: edits,
    });
  }, [
    aircraftId,
    airport,
    airportBy,
    edits,
    infraConfig,
    origin.position,
    scenarioId,
    selectedRoute,
    terminalChoice,
  ]);

  const runwayByAircraft = new Map(
    PASSENGER_AIRCRAFT.map((a) => [a.id, requiredRunwayM(a.id, active)]),
  );
  const enablingRunway = Math.max(
    ...[...runwayByAircraft.values()].map((r) => r?.comfortable ?? 0),
  );
  const verdictCounts = (["viable", "conditional", "not_viable", "no_data"] as Verdict[]).map(
    (v) => ({
      verdict: v,
      n: [...grid.values()].filter((c) => c[scenarioId].verdict === v).length,
    }),
  );

  const ta = t.assumptions;
  const presetLabel = fillTemplate(ta.fromPreset, { name: t.scenarios[scenarioId] });
  const assumptionGroups = [
    {
      id: "rwy1",
      label: `${ta.currentGroup} · RWY ${constraints.runways[0]!.designator} · T1`,
      fields: [
        {
          id: "t1Capacity",
          label: ta.t1Capacity,
          unit: "pax",
          value: airportEdits.t1Capacity ?? baseT1.annualCapacity,
          defaultValue: baseT1.annualCapacity,
          provenance: `${ta.fromSource}: ${sources.capacity}`,
          step: 50_000,
          min: 100_000,
        },
      ] as AssumptionField[],
    },
    {
      id: "expansion",
      label: `${ta.expansionGroup} · RWY ${baseRwy2.designator} · T2`,
      note: infraConfig === "current" ? ta.expansionOff : undefined,
      fields: [
        {
          id: "rwy2Length",
          label: ta.rwy2Length,
          unit: "m",
          value: airportEdits.rwy2Length ?? baseRwy2.lengthM,
          defaultValue: baseRwy2.lengthM,
          provenance: ta.simulatedPlan,
          step: 50,
          min: 2000,
          max: 4500,
        },
        {
          id: "rwy2Width",
          label: ta.rwy2Width,
          unit: "m",
          value: airportEdits.rwy2Width ?? baseRwy2.widthM,
          defaultValue: baseRwy2.widthM,
          provenance: ta.simulatedPlan,
          step: 5,
          min: 23,
          max: 75,
        },
        {
          id: "rwy2Pcn",
          label: ta.rwy2Pcn,
          unit: "PCN",
          value: airportEdits.rwy2Pcn ?? baseRwy2.pcn,
          defaultValue: baseRwy2.pcn,
          provenance: ta.simulatedPlan,
          step: 5,
          min: 10,
          max: 150,
        },
        {
          id: "rwy2Approach",
          label: ta.rwy2Approach,
          unit: "",
          value: airportEdits.rwy2Approach ?? APPROACHES.indexOf(baseRwy2.approach),
          defaultValue: APPROACHES.indexOf(baseRwy2.approach),
          provenance: ta.simulatedPlan,
          step: 1,
          min: 0,
          options: APPROACHES.map((a, i) => ({ value: i, label: t.approach[a] })),
        },
        {
          id: "arffExpansion",
          label: ta.arff,
          unit: "SEI",
          value: airportEdits.arffExpansion ?? constraints.arffCategory.expansion,
          defaultValue: constraints.arffCategory.expansion,
          provenance: ta.simulatedPlan,
          step: 1,
          min: 1,
          max: 10,
        },
        {
          id: "t2Capacity",
          label: ta.t2Capacity,
          unit: "pax",
          value: airportEdits.t2Capacity ?? baseT2.annualCapacity,
          defaultValue: baseT2.annualCapacity,
          provenance: ta.simulatedPlan,
          step: 100_000,
          min: 100_000,
        },
      ].map((f) => ({ ...f, disabled: infraConfig === "current" })) as AssumptionField[],
    },
    {
      id: "scenario",
      label: `${ta.scenarioGroup} · ${t.scenarios[scenarioId]}`,
      fields: [
        { id: "demandFactor", label: ta.demandFactor, unit: "×", step: 0.05, min: 0 },
        { id: "takeoffFactor", label: ta.takeoffFactor, unit: "×", step: 0.01, min: 0.5 },
        { id: "revenuePerPax", label: ta.revenuePerPax, unit: "COP", step: 1000, min: 0 },
        { id: "costPerFlight", label: ta.costPerFlight, unit: "COP", step: 50_000, min: 0 },
      ].map((f): AssumptionField => {
        const key = f.id as keyof typeof preset;
        const def = preset[key] as number;
        const edited = edits[key as keyof ScenarioOverrides];
        return {
          ...f,
          value: typeof edited === "number" ? edited : def,
          defaultValue: def,
          provenance: presetLabel,
        };
      }).concat([
        {
          id: "weeklyFrequencies",
          label: ta.frequencies,
          unit: dict.situation.perWeek,
          step: 1,
          min: 1,
          value: edits.weeklyFrequencies ?? null,
          defaultValue: null,
          provenance: ta.frequenciesPlaceholder,
          placeholder: ta.frequenciesPlaceholder,
        } as AssumptionField,
      ]) as AssumptionField[],
    },
  ];

  function onAssumption(id: string, value: number | null) {
    if (AIRPORT_KEYS.includes(id)) {
      setAirportEdits((prev) => ({ ...prev, [id]: value }));
      return;
    }
    setScenarioEdits((prev) => {
      const next = { ...prev[scenarioId] } as Record<string, number | undefined>;
      if (value === null || value === (preset as Record<string, unknown>)[id]) delete next[id];
      else next[id] = value;
      return { ...prev, [scenarioId]: next as ScenarioOverrides };
    });
  }

  const matrixRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-cell]", {
          autoAlpha: 0,
          y: 4,
          duration: 0.24,
          ease: "expo.out",
          stagger: { each: 0.008, grid: "auto", from: "start" },
        });
      });
      return () => mm.revert();
    },
    { scope: matrixRef },
  );

  return (
    <>
      <div className={views.toolbar}>
        <div className={views.toolbarGroup}>
          <span className={views.toolbarLabel}>{t.infra}</span>
          <SegmentedControl
            ariaLabel={t.infra}
            value={infraConfig}
            onChange={(v) => {
              setInfraConfig(v);
              if (v === "current" && terminalChoice === "T2") setTerminalChoice("auto");
              writeQuery({ infra: v === "current" ? null : v });
            }}
            options={[
              { value: "current", label: t.infraCurrent },
              { value: "expansion", label: t.infraExpansion },
            ]}
          />
        </div>
        <div className={views.toolbarGroup}>
          <span className={views.toolbarLabel}>{t.terminalLabel}</span>
          <SegmentedControl<TerminalChoice>
            ariaLabel={t.terminalLabel}
            value={terminalChoice}
            onChange={setTerminalChoice}
            options={TERMINAL_OPTIONS.filter(
              (o) => o !== "T2" || infraConfig === "expansion",
            ).map((o) => ({ value: o, label: o === "auto" ? t.terminalAuto : o }))}
          />
        </div>
        <div className={views.toolbarGroup}>
          <span className={views.toolbarLabel}>{t.perspective}</span>
          <SegmentedControl
            ariaLabel={t.perspective}
            value={perspective}
            onChange={(v) => {
              setPerspective(v);
              writeQuery({ vista: v === "airport" ? null : v });
            }}
            options={[
              { value: "airport", label: t.airport },
              { value: "airline", label: t.airline },
            ]}
          />
        </div>
        <div className={views.toolbarGroup}>
          <span className={views.toolbarLabel}>{t.scenario}</span>
          <SegmentedControl
            ariaLabel={t.scenario}
            value={scenarioId}
            onChange={(v) => {
              setScenarioId(v);
              writeQuery({ escenario: v === "base" ? null : v });
            }}
            options={ERPM_SCENARIO_ORDER.map((id) => ({
              value: id,
              label: t.scenarios[id],
            }))}
          />
        </div>
        <div className={views.toolbarEnd} aria-live="polite">
          {deltas.length === 0 ? (
            <span className={views.meta}>{t.noChanges}</span>
          ) : (
            deltas.map((d) => (
              <span key={d.key} className={views.chip}>
                {t.deltas[d.key]} {formatDelta(d)}
              </span>
            ))
          )}
        </div>
      </div>

      <div className={styles.workbench}>
        <AssumptionsPanel
          groups={assumptionGroups}
          onChange={onAssumption}
          onResetAll={() => {
            setAirportEdits({});
            setScenarioEdits(EMPTY_EDITS);
          }}
        />
        <div className={styles.main}>
      <section className={styles.summary} aria-label={t.summary.title}>
        {verdictCounts.map(({ verdict, n }) => (
          <div key={verdict} className={styles.summaryCell}>
            <StatusPill tone={VERDICT_TONE[verdict]} label={t.verdicts[verdict]} />
            <span className={styles.summaryValue}>
              <CountUp value={n} mode="int" />
            </span>
          </div>
        ))}
        <div className={styles.summaryCell} data-wide="true">
          <span className={views.statLabel}>{t.summary.enablingRunway}</span>
          <span className={styles.summaryValue}>
            <CountUp value={enablingRunway} mode="int" />
            <span className={views.unit}>m</span>
          </span>
          <span className={views.meta}>
            {enablingRunway > longestRunway
              ? `${t.extensionNeeded} ${fillTemplate(t.summary.extension, {
                  m: formatInt(enablingRunway - longestRunway),
                })}`
              : t.summary.fits}
          </span>
        </div>
      </section>

      <section className={views.section} ref={matrixRef}>
        <div>
          <h2 className={views.sectionTitle}>{t.matrixTitle}</h2>
          <p className={views.hint}>{t.matrixHint}</p>
        </div>
        <div className={views.tableWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th scope="col" className={styles.routeHead}>
                  {t.route}
                </th>
                {PASSENGER_AIRCRAFT.map((a) => (
                  <th key={a.id} scope="col" className={styles.aircraftHead}>
                    <span className={views.code}>{a.id}</span>
                    <span className={styles.seats}>
                      {formatInt(a.seats)} {t.seatsUnit}
                    </span>
                    <RunwayHint
                      required={runwayByAircraft.get(a.id)?.comfortable ?? null}
                      available={longestRunway}
                      fitsLabel={t.summary.fits}
                      extensionTemplate={t.summary.extension}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <th scope="row" className={styles.routeCell}>
                    <span className={styles.routeName}>
                      <span className={views.code}>
                        {origin.iata} → {route.destination}
                      </span>
                      <span className={styles.routeAirline}>
                        {route.airline ?? dict.situation.undefinedValue}
                      </span>
                    </span>
                    <StagePill stage={route.stage} label={dict.stage[route.stage]} />
                  </th>
                  {PASSENGER_AIRCRAFT.map((a) => {
                    const cell = grid.get(`${route.id}:${a.id}`);
                    if (!cell) return <td key={a.id} />;
                    const evaluation = cell[scenarioId];
                    const changed =
                      scenarioId !== "base" &&
                      evaluation.verdict !== cell.base.verdict;
                    const active = route.id === routeId && a.id === aircraftId;
                    const candidate = route.aircraftId === a.id;
                    return (
                      <td key={a.id} className={styles.cellTd}>
                        <button
                          type="button"
                          data-cell
                          className={styles.cell}
                          data-active={active ? "true" : undefined}
                          aria-pressed={active}
                          aria-label={`${origin.iata} ${route.destination} · ${a.label} · ${t.verdicts[evaluation.verdict]}${candidate ? ` · ${t.candidate}` : ""}`}
                          onClick={() => selectCell(route.id, a.id)}
                        >
                          {active ? (
                            <motion.span
                              layoutId={reduced ? undefined : "validator-cell"}
                              className={styles.cellRing}
                              transition={{ duration: 0.22, ease: EASE }}
                              aria-hidden
                            />
                          ) : null}
                          <motion.span
                            key={evaluation.verdict}
                            className={styles.cellBody}
                            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.18, ease: EASE }}
                          >
                            <StatusPill
                              tone={VERDICT_TONE[evaluation.verdict]}
                              label={t.verdicts[evaluation.verdict]}
                            />
                          </motion.span>
                          {candidate ? (
                            <span className={styles.candidate} title={t.candidate} aria-hidden />
                          ) : null}
                          {changed ? (
                            <span className={styles.changed} title={t.changed} aria-hidden />
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.candidate} data-static="true" aria-hidden />
            {t.candidate}
          </span>
          <span className={styles.legendItem}>
            <span className={styles.changed} data-static="true" aria-hidden />
            {t.changed}
          </span>
        </p>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {selectedRoute && current && selected ? (
          <motion.div
            key={`${routeId}:${aircraftId}`}
            className={styles.detail}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <EvaluationPanel
              route={selectedRoute}
              originIata={origin.iata}
              destination={airportBy.get(selectedRoute.destination)}
              evaluation={current}
              perspective={perspective}
              runwayDesignator={
                airport.runways.find((r) => r.id === current.runwayId)?.designator ?? ""
              }
              diagram={
                <AerodromeDiagram
                  runways={airport.runways}
                  terminals={airport.terminals}
                  showProjected={infraConfig === "expansion"}
                  highlightRunway={current.runwayId}
                  highlightTerminal={current.terminalId}
                />
              }
            />
            <div className={styles.side}>
              <section className={styles.panel} aria-label={t.tornado.title}>
                <div>
                  <h3 className={views.sectionTitle}>{t.tornado.title}</h3>
                  <p className={views.hint}>{t.tornado.hint}</p>
                </div>
                <Tornado
                  result={sensitivity}
                  revealKey={`${routeId}:${aircraftId}:${scenarioId}`}
                />
              </section>
              <ComparePanel byScenario={selected} active={scenarioId} />
            </div>
          </motion.div>
        ) : (
          <p className={views.section}>{t.selectCell}</p>
        )}
      </AnimatePresence>

      <p className={styles.versionLine}>
        <span className="num">{ERPM_SCENARIOS_VERSION}</span> · {t.assumptionsNote}
      </p>
        </div>
      </div>
    </>
  );
}

function checkDetail(
  check: FeasibilityCheck,
  template: string,
  approachLabels: Record<ApproachCategory, string>,
): string {
  const fmt = (v: number | null): string => {
    if (v === null) return "n/d";
    switch (check.id) {
      case "approach":
        return approachLabels[APPROACHES[v] ?? "NPA"];
      case "terminal_fit":
        return CODE_LETTER_ORDER[v] ?? "n/d";
      case "runway":
      case "runway_width":
      case "range":
      case "pavement":
      case "arff":
      case "demand":
        return formatInt(v);
      default:
        return formatPct(v);
    }
  };
  return template
    .replace("{required}", fmt(check.required))
    .replace("{available}", fmt(check.available));
}

function EvaluationPanel({
  route,
  originIata,
  destination,
  evaluation,
  perspective,
  runwayDesignator,
  diagram,
}: {
  route: RouteOpportunity;
  originIata: string;
  destination: AirportRef | undefined;
  evaluation: RouteEvaluation;
  perspective: Perspective;
  runwayDesignator: string;
  diagram: React.ReactNode;
}) {
  const { dict } = usePreferences();
  const t = dict.validator;
  const aircraft = getAircraft(evaluation.aircraftId);
  const ordered = CHECK_ORDER[perspective].map(
    (id) => evaluation.checks.find((c) => c.id === id)!,
  );
  const breakEvenLabel =
    evaluation.breakEvenStatus === "infeasible"
      ? t.infeasible
      : formatPct(evaluation.breakEvenLoadFactor);

  type Headline = {
    label: string;
    value: number | null;
    mode: "pct" | "int";
    unit?: string;
    text?: string;
  };
  const headline: Headline[] =
    perspective === "airport"
      ? [
          {
            label: t.breakEven,
            value: evaluation.breakEvenLoadFactor,
            mode: "pct",
            text: evaluation.breakEvenStatus === "infeasible" ? breakEvenLabel : undefined,
          },
          { label: t.utilization, value: evaluation.utilizationAfter, mode: "pct" },
          { label: t.requiredRunway, value: evaluation.runwayRequiredM, mode: "int", unit: "m" },
        ]
      : [
          { label: t.projectedLf, value: evaluation.projectedLoadFactor, mode: "pct" },
          { label: t.paxTarget, value: evaluation.paxPerFlightTarget70, mode: "int" },
          { label: t.weeklySeats, value: evaluation.weeklySeats, mode: "int" },
        ];

  return (
    <article className={styles.panel}>
      <header className={views.detailHead}>
        <div>
          <h2 className={views.detailTitle}>
            <span className={views.code}>{originIata}</span>
            <span className={views.arrow} aria-hidden>
              →
            </span>
            <span className={views.code}>{route.destination}</span>
            <span className={styles.titleAircraft}>{aircraft.label}</span>
          </h2>
          <p className={views.detailSub}>
            {destination?.city ?? route.destination}
            {" · "}
            {t.scenarios[evaluation.scenarioId]}
            {" · "}
            {perspective === "airport" ? t.airport : t.airline}
          </p>
          <p className={styles.assignment}>
            <span className={styles.assignmentLabel}>{t.assigned}</span>
            <span className={styles.signTag} data-kind="runway">
              RWY {runwayDesignator}
            </span>
            <span className={styles.signTag} data-kind="terminal">
              {evaluation.terminalId}
            </span>
          </p>
        </div>
        <StatusPill
          tone={VERDICT_TONE[evaluation.verdict]}
          label={t.verdicts[evaluation.verdict]}
        />
      </header>

      {diagram}

      <dl className={styles.headline}>
        {headline.map((h) => (
          <div key={h.label} className={styles.headlineCell}>
            <dt>{h.label}</dt>
            <dd className="num">
              {h.text ?? <CountUp value={h.value} mode={h.mode} />}
              {h.unit && !h.text && h.value !== null ? (
                <span className={views.unit}>{h.unit}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <ul className={styles.checks}>
        {ordered.map((check) => (
          <li key={check.id} className={styles.check}>
            <div className={styles.checkBody}>
              <p className={styles.checkLabel}>{t.checks[check.id]}</p>
              <p className={`num ${styles.checkDetail}`}>
                {checkDetail(check, t.checkDetail[check.id], t.approach)}
              </p>
            </div>
            <StatusPill
              tone={OUTCOME_TONE[check.outcome]}
              label={t.outcomes[check.outcome]}
            />
          </li>
        ))}
      </ul>

      <div className={styles.gaps}>
        <p className={styles.gapsTitle}>{t.gaps}</p>
        <p className={views.hint}>
          {evaluation.gaps.length === 0
            ? t.noGaps
            : evaluation.gaps.map((g) => t.checks[g]).join(" · ")}
        </p>
      </div>

      {perspective === "airline" ? (
        <p className={views.hint}>{t.airlineNote}</p>
      ) : null}
    </article>
  );
}

function ComparePanel({
  byScenario,
  active,
}: {
  byScenario: Record<ErpmScenarioId, RouteEvaluation>;
  active: ErpmScenarioId;
}) {
  const { dict } = usePreferences();
  const t = dict.validator;
  const base = byScenario.base;

  const rows: {
    label: string;
    value: (e: RouteEvaluation) => number | null;
    format: (v: number | null, e: RouteEvaluation) => string;
  }[] = [
    {
      label: t.projectedLf,
      value: (e) => e.projectedLoadFactor,
      format: (v) => formatPct(v),
    },
    {
      label: t.breakEven,
      value: (e) => e.breakEvenLoadFactor,
      format: (v, e) =>
        e.breakEvenStatus === "infeasible" ? t.infeasible : formatPct(v),
    },
    {
      label: t.checks.runway,
      value: (e) => e.checks.find((c) => c.id === "runway")?.required ?? null,
      format: (v) => (v === null ? "n/d" : `${formatInt(v)} m`),
    },
    {
      label: t.checks.range,
      value: (e) => e.checks.find((c) => c.id === "range")?.required ?? null,
      format: (v) => (v === null ? "n/d" : `${formatInt(v)} km`),
    },
    {
      label: t.utilization,
      value: (e) => e.utilizationAfter,
      format: (v) => formatPct(v),
    },
  ];

  return (
    <section className={styles.panel} aria-label={t.compareTitle}>
      <div>
        <h3 className={views.sectionTitle}>{t.compareTitle}</h3>
        <p className={views.hint}>{t.compareHint}</p>
      </div>
      <div className={views.tableWrap}>
        <table className={styles.compare}>
          <thead>
            <tr>
              <th scope="col" />
              {ERPM_SCENARIO_ORDER.map((id) => (
                <th
                  key={id}
                  scope="col"
                  data-active={id === active ? "true" : undefined}
                >
                  {t.scenarios[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t.verdictLabel}</th>
              {ERPM_SCENARIO_ORDER.map((id) => (
                <td key={id} data-active={id === active ? "true" : undefined}>
                  <StatusPill
                    tone={VERDICT_TONE[byScenario[id].verdict]}
                    label={t.verdicts[byScenario[id].verdict]}
                  />
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {ERPM_SCENARIO_ORDER.map((id) => {
                  const e = byScenario[id];
                  const v = row.value(e);
                  const b = row.value(base);
                  const differs =
                    id !== "base" && v !== null && b !== null && Math.abs(v - b) > 1e-9;
                  return (
                    <td
                      key={id}
                      className={cn("num", differs && styles.differs)}
                      data-active={id === active ? "true" : undefined}
                    >
                      {row.format(v, e)}
                      {differs ? (
                        <span className={styles.deltaMark} aria-hidden>
                          {v! > b! ? "↑" : "↓"}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RunwayHint({
  required,
  available,
  fitsLabel,
  extensionTemplate,
}: {
  required: number | null;
  available: number;
  fitsLabel: string;
  extensionTemplate: string;
}) {
  if (required === null) return null;
  const extra = required - available;
  return (
    <span className={styles.runwayHint} data-short={extra > 0 ? "true" : undefined}>
      <span className="num">{formatInt(required)} m</span>
      <span>
        {extra > 0 ? fillTemplate(extensionTemplate, { m: formatInt(extra) }) : fitsLabel}
      </span>
    </span>
  );
}
