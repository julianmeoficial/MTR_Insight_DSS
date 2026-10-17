"use client";

import type {
  KpiTileModel,
  LoadFactorSeriesPoint,
} from "@/application/dashboard";
import { KpiTile } from "@/components/kpi/KpiTile";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { CompareBars } from "@/components/landing/CompareBars";
import { OperatorShareChart } from "@/components/landing/OperatorShareChart";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import styles from "./LandingBoardPreview.module.css";

type Props = {
  tiles: KpiTileModel[];
  series: LoadFactorSeriesPoint[];
  meta: {
    source: string;
    version: string;
    status: string;
    lastValidated: string;
  };
  compact?: boolean;
};

export function LandingBoardPreview({
  tiles,
  series,
  meta,
  compact = false,
}: Props) {
  const { dict } = usePreferences();

  const paxByOp = new Map<string, number>();
  for (const row of series) {
    paxByOp.set(row.operator, (paxByOp.get(row.operator) ?? 0) + row.passengers);
  }
  const slices = [...paxByOp.entries()].map(([label, value], i) => ({
    id: label,
    label,
    value,
    color: i === 0 ? "var(--series-1)" : "var(--series-2)",
  }));

  const compareRows = tiles.slice(0, 4).map((tile, i) => ({
    id: tile.kpiId,
    label: tile.title,
    value: tile.value,
    target: tile.kpiId === "K1" ? 0.7 : tile.kpiId === "K3" ? 0.8 : 0.9,
    color: `var(--series-${(i % 5) + 1})`,
  }));

  return (
    <div
      className={styles.board}
      data-compact={compact ? "true" : "false"}
      aria-label={dict.landing.productFrameSummary}
    >
      <ul
        className={styles.kpiGrid}
        data-compact={compact ? "true" : "false"}
      >
        {tiles.map((tile, index) => (
          <li key={tile.kpiId} className={styles.kpiCell} data-board-card>
            <KpiTile
              tile={tile}
              index={index}
              provenanceMeta={`${tile.subtitle} · ${dict.kpi.validated} ${meta.lastValidated}`}
            />
          </li>
        ))}
      </ul>

      <div className={styles.analytics}>
        <div className={styles.chartCard} data-board-card>
          <LoadFactorChart
            series={series}
            title={dict.landing.lfChartTitle}
          />
        </div>
        <div className={styles.sideCol}>
          {slices.length > 0 ? (
            <OperatorShareChart
              slices={slices}
              title={dict.landing.shareTitle}
            />
          ) : null}
          <CompareBars title={dict.landing.compareTitle} rows={compareRows} />
        </div>
      </div>

      <div className={styles.meta}>
        <ProvenanceLine
          source={meta.source}
          datasetVersion={meta.version}
          verificationStatus={meta.status}
          lastValidated={meta.lastValidated}
        />
      </div>
    </div>
  );
}
