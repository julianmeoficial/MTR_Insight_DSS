"use client";

import type { KpiTileModel } from "@/application/dashboard";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { formatPct } from "@/lib/format";
import styles from "./WhyPanel.module.css";

type Props = {
  tile: KpiTileModel;
  formula: string;
  numerator?: string;
  denominator?: string;
  thresholdBand: string;
  ruleVersion: string;
  source: string;
  validated: string;
};

export function WhyPanel({
  tile,
  formula,
  numerator,
  denominator,
  thresholdBand,
  ruleVersion,
  source,
  validated,
}: Props) {
  const { dict } = usePreferences();
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>
        {dict.kpi.why} · {tile.title}
      </h3>
      <dl className={styles.grid}>
        <div>
          <dt>{dict.kpi.formula}</dt>
          <dd className="num">{formula}</dd>
        </div>
        {numerator ? (
          <div>
            <dt>{dict.kpi.numerator}</dt>
            <dd className="num">{numerator}</dd>
          </div>
        ) : null}
        {denominator ? (
          <div>
            <dt>{dict.kpi.denominator}</dt>
            <dd className="num">{denominator}</dd>
          </div>
        ) : null}
        <div>
          <dt>{dict.kpi.threshold}</dt>
          <dd>{thresholdBand}</dd>
        </div>
        <div>
          <dt>{dict.kpi.ruleVersion}</dt>
          <dd className="num">{ruleVersion}</dd>
        </div>
        <div>
          <dt>{dict.kpi.source}</dt>
          <dd>
            {source} · {dict.kpi.validated} {validated}
          </dd>
        </div>
        <div>
          <dt>{dict.kpi.unit}</dt>
          <dd className="num">{formatPct(tile.value)}</dd>
        </div>
      </dl>
    </div>
  );
}
