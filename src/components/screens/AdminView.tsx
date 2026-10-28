"use client";

import { Check, Minus } from "lucide-react";
import {
  ACCESS_MATRIX,
  MATRIX_SCREENS,
  ROLE_IDS,
} from "@/config/access-matrix";
import { kpiThresholds, THRESHOLDS_VERSION } from "@/config/thresholds";
import { alertPolicies, ALERT_POLICIES_VERSION } from "@/config/alert-policies";
import { DSS_DEFAULTS_VERSION } from "@/config/dss-defaults";
import { ERPM_SCENARIOS_VERSION } from "@/config/erpm-scenarios";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatPct } from "@/lib/format";
import views from "./views.module.css";
import styles from "./AdminView.module.css";

const pct = (v: number) => formatPct(v).replace(",0", "");

export function AdminView() {
  const { dict } = usePreferences();
  const t = dict.admin;
  const th = kpiThresholds;

  const thresholdRows = [
    {
      id: "K1",
      name: dict.kpi.k1,
      green: `≥ ${pct(th.K1.greenMin)}`,
      yellow: `≥ ${pct(th.K1.yellowMin)} · < ${pct(th.K1.greenMin)}`,
      red: `< ${pct(th.K1.yellowMin)}`,
    },
    {
      id: "K2",
      name: dict.kpi.k2,
      green: formatPct(1).replace(",0", ""),
      yellow: t.k2Yellow,
      red: `< ${pct(th.K2.quarterlyRedBelow)}`,
    },
    {
      id: "K3",
      name: dict.kpi.k3,
      green: `< ${pct(th.K3.greenBelow)}`,
      yellow: `≥ ${pct(th.K3.greenBelow)} · < ${pct(th.K3.redMin)}`,
      red: `≥ ${pct(th.K3.redMin)}`,
    },
    {
      id: "K4",
      name: dict.kpi.k4,
      green: `≥ ${pct(th.K4.greenMin)}`,
      yellow: `≥ ${pct(th.K4.yellowMin)} · < ${pct(th.K4.greenMin)}`,
      red: `< ${pct(th.K4.yellowMin)}`,
    },
    {
      id: "K5",
      name: dict.kpi.k5,
      green: `≥ ${pct(th.K5.greenMin)}`,
      yellow: `≥ ${pct(th.K5.yellowMin)} · < ${pct(th.K5.greenMin)}`,
      red: `< ${pct(th.K5.yellowMin)}`,
    },
  ];

  const versions = [
    { id: "thresholds", label: t.thresholdsTitle, version: THRESHOLDS_VERSION },
    { id: "alerts", label: t.policiesTitle, version: ALERT_POLICIES_VERSION },
    { id: "dss", label: dict.nav.scenarios, version: DSS_DEFAULTS_VERSION },
    { id: "erpm", label: dict.nav.validator, version: ERPM_SCENARIOS_VERSION },
  ];

  return (
    <>
      <section className={views.statStrip} aria-label={t.modelsTitle}>
        {versions.map((v) => (
          <div key={v.id} className={views.stat}>
            <span className={views.statLabel}>{v.label}</span>
            <span className={`${views.code} ${styles.version}`}>{v.version}</span>
          </div>
        ))}
      </section>

      <section className={views.section}>
        <div>
          <h2 className={views.sectionTitle}>{t.accessTitle}</h2>
          <p className={views.hint}>{t.accessHint}</p>
        </div>
        <div className={views.tableWrap}>
          <table className={views.table}>
            <thead>
              <tr>
                <th scope="col">{t.role}</th>
                {MATRIX_SCREENS.map((s) => (
                  <th key={s} scope="col" className={styles.center}>
                    <span className={views.codeMuted}>{s}</span>
                  </th>
                ))}
                <th scope="col" className={styles.center}>
                  {t.export}
                </th>
                <th scope="col">{t.scope}</th>
                <th scope="col" className={styles.center}>
                  {dict.nav.admin}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROLE_IDS.map((role) => {
                const access = ACCESS_MATRIX[role];
                return (
                  <tr key={role}>
                    <td>{dict.access.roles[role]}</td>
                    {MATRIX_SCREENS.map((s) => (
                      <td key={s} className={styles.center}>
                        <Mark on={access.screens.includes(s)} yes={t.yes} no={t.no} />
                      </td>
                    ))}
                    <td className={styles.center}>
                      <Mark on={access.canExport} yes={t.yes} no={t.no} />
                    </td>
                    <td className={views.cellMuted}>
                      {access.operatorScope ?? t.allOperators}
                    </td>
                    <td className={styles.center}>
                      <Mark on={access.admin} yes={t.yes} no={t.no} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={views.section}>
        <div className={views.sectionHead}>
          <h2 className={views.sectionTitle}>{t.thresholdsTitle}</h2>
          <span className={views.chip}>
            {t.version} <span className="num">{THRESHOLDS_VERSION}</span>
          </span>
        </div>
        <div className={views.tableWrap}>
          <table className={views.table}>
            <thead>
              <tr>
                <th scope="col">KPI</th>
                <th scope="col">
                  <StatusPill tone="ok" label={t.green} />
                </th>
                <th scope="col">
                  <StatusPill tone="warn" label={t.yellow} />
                </th>
                <th scope="col">
                  <StatusPill tone="crit" label={t.red} />
                </th>
              </tr>
            </thead>
            <tbody>
              {thresholdRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={views.codeMuted}>{row.id}</span> {row.name}
                  </td>
                  <td className="num">{row.green}</td>
                  <td className="num">{row.yellow}</td>
                  <td className="num">{row.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.twoUp}>
        <section className={views.section}>
          <div className={views.sectionHead}>
            <h2 className={views.sectionTitle}>{t.policiesTitle}</h2>
            <span className={views.chip}>
              {t.version} <span className="num">{ALERT_POLICIES_VERSION}</span>
            </span>
          </div>
          <dl className={styles.policies}>
            <div className={styles.policy}>
              <dt>
                <span className={views.code}>K1_RED_STREAK</span>
                <span className={views.codeMuted}>{alertPolicies.k1RedStreak.policyRef}</span>
              </dt>
              <dd>
                {t.weeks.replace("{n}", String(alertPolicies.k1RedStreak.redStreakWeeks))}
                {" · "}
                {alertPolicies.k1RedStreak.owner}
              </dd>
            </div>
            <div className={styles.policy}>
              <dt>
                <span className={views.code}>SOURCE_NOT_LOADED</span>
                <span className={views.codeMuted}>{alertPolicies.sourceNotLoaded.policyRef}</span>
              </dt>
              <dd>{alertPolicies.sourceNotLoaded.owner}</dd>
            </div>
          </dl>
          <div className={styles.conflict}>
            <StatusPill tone="warn" label={t.conflictTitle} />
            <p className={views.note}>{t.conflictBody}</p>
          </div>
        </section>

        <section className={views.section}>
          <h2 className={views.sectionTitle}>{t.rulesTitle}</h2>
          <ol className={styles.rules}>
            {dict.landing.rcRules.map((rule) => {
              const [code, ...rest] = rule.split(" ");
              return (
                <li key={rule} className={styles.rule}>
                  <span className={views.codeMuted}>{code}</span>
                  <span>{rest.join(" ")}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </>
  );
}

function Mark({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return on ? (
    <Check size={16} strokeWidth={1.5} className={styles.on} aria-label={yes} />
  ) : (
    <Minus size={16} strokeWidth={1.5} className={styles.off} aria-label={no} />
  );
}
